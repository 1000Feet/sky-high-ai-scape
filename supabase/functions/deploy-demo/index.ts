import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { request_id, business_name, react_code, existing_site_id } = await req.json()

    if (!request_id || !business_name || !react_code) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const netlifyToken = Deno.env.get('NETLIFY_TOKEN')
    if (!netlifyToken) {
      return new Response(JSON.stringify({ error: 'NETLIFY_TOKEN not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Sanitize code: remove import/export, fix component name
    let cleanCode = react_code
      .replace(/^\s*import\s+.*?['";\n]/gm, '')
      .replace(/^\s*export\s+default\s+\w+;?\s*$/gm, '')
      .replace(/^\s*export\s+default\s+function\s+/gm, 'function ')
      .replace(/^\s*export\s+function\s+/gm, 'function ')
    
    // If component is named WebsitePage, alias it to App
    if (/function\s+WebsitePage/.test(cleanCode) && !/function\s+App/.test(cleanCode)) {
      cleanCode += '\nconst App = WebsitePage;'
    }

    // Build standalone HTML
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${business_name} - Website Preview</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"><\/script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>body { font-family: 'Inter', sans-serif; margin: 0; }</style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${cleanCode}

    const Component = typeof App !== 'undefined' ? App : (typeof Default !== 'undefined' ? Default : () => React.createElement('div', null, 'Component not found'));
    ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(Component));
  <\/script>
</body>
</html>`

    const encoder = new TextEncoder()
    const data = encoder.encode(htmlContent)

    // SHA-1 hash
    const hashBuffer = await crypto.subtle.digest('SHA-1', data)
    const sha1 = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    const slug = slugify(business_name) + '-demo'
    let siteId = existing_site_id

    // Create or reuse site
    if (!siteId) {
      const createSiteRes = await fetch('https://api.netlify.com/api/v1/sites', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${netlifyToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: slug }),
      })
      const site = await createSiteRes.json()
      if (!createSiteRes.ok) {
        // If name taken, try with random suffix
        if (site.errors) {
          const fallbackRes = await fetch('https://api.netlify.com/api/v1/sites', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${netlifyToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: slug + '-' + Date.now().toString(36) }),
          })
          const fallbackSite = await fallbackRes.json()
          if (!fallbackRes.ok) {
            throw new Error(`Failed to create Netlify site: ${JSON.stringify(fallbackSite)}`)
          }
          siteId = fallbackSite.id
        } else {
          throw new Error(`Failed to create Netlify site: ${JSON.stringify(site)}`)
        }
      } else {
        siteId = site.id
      }
    }

    // Create deploy with file manifest
    const createDeployRes = await fetch(
      `https://api.netlify.com/api/v1/sites/${siteId}/deploys`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${netlifyToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files: { '/index.html': sha1 } }),
      }
    )
    const deploy = await createDeployRes.json()
    if (!createDeployRes.ok) {
      throw new Error(`Failed to create deploy: ${JSON.stringify(deploy)}`)
    }

    // Upload file
    const uploadRes = await fetch(
      `https://api.netlify.com/api/v1/deploys/${deploy.id}/files/index.html`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${netlifyToken}`,
          'Content-Type': 'application/octet-stream',
        },
        body: data,
      }
    )
    if (!uploadRes.ok) {
      const err = await uploadRes.text()
      throw new Error(`Failed to upload file: ${err}`)
    }

    const demoUrl = deploy.ssl_url || deploy.url || `https://${deploy.subdomain}.netlify.app`

    // Update DB
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    await supabase
      .from('website_requests')
      .update({
        demo_url: demoUrl,
        demo_site_id: siteId,
        demo_deployed_at: new Date().toISOString(),
        demo_status: 'live',
      })
      .eq('id', request_id)

    return new Response(
      JSON.stringify({ success: true, demo_url: demoUrl, site_id: siteId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Deploy demo error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
