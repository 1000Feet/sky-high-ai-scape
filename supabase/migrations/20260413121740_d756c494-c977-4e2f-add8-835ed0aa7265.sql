
CREATE TABLE public.website_audits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.potential_clients(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  agent_session_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  quick_verdict TEXT,
  overall_score NUMERIC,
  design_score NUMERIC,
  seo_score NUMERIC,
  mobile_score NUMERIC,
  full_report TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.website_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view website audits"
ON public.website_audits FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert website audits"
ON public.website_audits FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update website audits"
ON public.website_audits FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete website audits"
ON public.website_audits FOR DELETE
USING (true);

CREATE INDEX idx_website_audits_lead_id ON public.website_audits(lead_id);
CREATE INDEX idx_website_audits_status ON public.website_audits(status);
