ALTER TABLE public.email_batches
ADD COLUMN IF NOT EXISTS paused_reason text,
ADD COLUMN IF NOT EXISTS paused_until timestamptz;