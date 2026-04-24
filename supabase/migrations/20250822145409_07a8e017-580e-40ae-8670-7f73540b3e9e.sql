-- Create client_signups table to store new client information
CREATE TABLE public.client_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  business_type TEXT,
  website TEXT,
  social_media TEXT,
  desired_services TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (public access for now, can be restricted later)
ALTER TABLE public.client_signups ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert (for signup form)
CREATE POLICY "Anyone can insert client signups" 
ON public.client_signups 
FOR INSERT 
WITH CHECK (true);

-- Create policy to allow reading all signups (for admin dashboard)
CREATE POLICY "Anyone can view client signups" 
ON public.client_signups 
FOR SELECT 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_client_signups_updated_at
  BEFORE UPDATE ON public.client_signups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();