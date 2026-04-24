ALTER TABLE public.website_requests
  ADD COLUMN demo_url text,
  ADD COLUMN demo_site_id text,
  ADD COLUMN demo_deployed_at timestamptz,
  ADD COLUMN demo_status text NOT NULL DEFAULT 'none';