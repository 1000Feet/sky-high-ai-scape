CREATE TABLE public.investor_interests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  capital_range TEXT,
  message TEXT,
  language TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT INSERT ON public.investor_interests TO anon;
GRANT SELECT, INSERT ON public.investor_interests TO authenticated;
GRANT ALL ON public.investor_interests TO service_role;
ALTER TABLE public.investor_interests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit investor interest" ON public.investor_interests FOR INSERT TO anon, authenticated WITH CHECK (true);