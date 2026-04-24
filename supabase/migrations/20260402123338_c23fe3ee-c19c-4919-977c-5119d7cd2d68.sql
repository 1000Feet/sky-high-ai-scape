INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);

CREATE POLICY "Anyone can upload logos" ON storage.objects
  FOR INSERT TO public WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Anyone can view logos" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'logos');

CREATE TABLE public.website_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  business_name text NOT NULL,
  business_type text,
  logo_url text,
  color_palette text NOT NULL,
  mockup_url text,
  status text NOT NULL DEFAULT 'pending',
  notes text
);

ALTER TABLE public.website_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert website requests" ON public.website_requests
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Anyone can view website requests" ON public.website_requests
  FOR SELECT TO public USING (true);