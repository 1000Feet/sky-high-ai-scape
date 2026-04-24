-- Helper: updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TABLE IF NOT EXISTS public.potential_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text, website text, email text, address text, city text,
  state text, category text,
  rating numeric, reviews_count integer,
  notes text,
  contacted boolean NOT NULL DEFAULT false,
  google_id text, source_query text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'running',
  total integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  skipped_count integer NOT NULL DEFAULT 0,
  consecutive_failures integer NOT NULL DEFAULT 0,
  prospect_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  cursor integer NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  last_error text,
  paused_reason text,
  paused_until timestamptz,
  last_heartbeat_at timestamptz DEFAULT now(),
  stop_requested boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.campaign_email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid,
  recipient_email text NOT NULL,
  subject text, language text,
  status text NOT NULL,
  attempt_count integer NOT NULL DEFAULT 1,
  error_message text,
  batch_id uuid REFERENCES public.email_batches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.client_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text, business_type text, website text, social_media text,
  desired_services text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS trg_client_signups_updated ON public.client_signups;
CREATE TRIGGER trg_client_signups_updated BEFORE UPDATE ON public.client_signups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.website_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, email text NOT NULL, phone text,
  business_name text NOT NULL, business_type text,
  color_palette text NOT NULL, logo_url text, mockup_url text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  generated_code text,
  generation_status text NOT NULL DEFAULT 'idle',
  generation_session_id text,
  generation_started_at timestamptz,
  generation_completed_at timestamptz,
  generation_error text,
  demo_status text NOT NULL DEFAULT 'none',
  demo_url text, demo_site_id text, demo_deployed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.website_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.potential_clients(id) ON DELETE SET NULL,
  business_name text NOT NULL, website_url text NOT NULL,
  agent_session_id text,
  status text NOT NULL DEFAULT 'pending',
  quick_verdict text,
  overall_score numeric, design_score numeric, seo_score numeric, mobile_score numeric,
  full_report text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- RLS — open policies matching the source project
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'potential_clients','email_batches','campaign_email_log',
    'client_signups','website_requests','website_audits'
  ]) LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "public_all_%s" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "public_all_%s" ON public.%I FOR ALL USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('logos','logos',true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('mockups','mockups',true) ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "public read logos" ON storage.objects;
DROP POLICY IF EXISTS "public write logos" ON storage.objects;
DROP POLICY IF EXISTS "public read mockups" ON storage.objects;
DROP POLICY IF EXISTS "public write mockups" ON storage.objects;
CREATE POLICY "public read logos" ON storage.objects FOR SELECT USING (bucket_id='logos');
CREATE POLICY "public write logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id='logos');
CREATE POLICY "public read mockups" ON storage.objects FOR SELECT USING (bucket_id='mockups');
CREATE POLICY "public write mockups" ON storage.objects FOR INSERT WITH CHECK (bucket_id='mockups');