CREATE TABLE public.potential_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  category TEXT,
  rating NUMERIC,
  reviews_count INTEGER,
  google_id TEXT UNIQUE,
  source_query TEXT,
  contacted BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.potential_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view potential clients" ON public.potential_clients FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert potential clients" ON public.potential_clients FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update potential clients" ON public.potential_clients FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete potential clients" ON public.potential_clients FOR DELETE TO public USING (true);