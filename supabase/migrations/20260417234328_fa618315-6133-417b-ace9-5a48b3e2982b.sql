ALTER TABLE public.email_batches 
  ADD COLUMN IF NOT EXISTS last_heartbeat_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_email_batches_status_heartbeat 
  ON public.email_batches(status, last_heartbeat_at);