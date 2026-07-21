
ALTER TABLE public.revideo_orders
  ADD COLUMN IF NOT EXISTS photo_count integer,
  ADD COLUMN IF NOT EXISTS resolution text,
  ADD COLUMN IF NOT EXISTS customer_email text,
  ADD COLUMN IF NOT EXISTS rights_accepted boolean NOT NULL DEFAULT false;
