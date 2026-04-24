ALTER TABLE public.website_requests
ADD COLUMN IF NOT EXISTS generation_session_id text,
ADD COLUMN IF NOT EXISTS generation_status text NOT NULL DEFAULT 'idle',
ADD COLUMN IF NOT EXISTS generation_error text,
ADD COLUMN IF NOT EXISTS generation_started_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS generation_completed_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_website_requests_generation_status
ON public.website_requests (generation_status);

CREATE INDEX IF NOT EXISTS idx_website_requests_generation_session_id
ON public.website_requests (generation_session_id);

UPDATE public.website_requests
SET generation_status = CASE
  WHEN generated_code IS NOT NULL AND generated_code LIKE '__ERROR__:%' THEN 'failed'
  WHEN generated_code IS NOT NULL THEN 'completed'
  ELSE generation_status
END,
generation_error = CASE
  WHEN generated_code IS NOT NULL AND generated_code LIKE '__ERROR__:%' THEN regexp_replace(generated_code, '^__ERROR__:\\s*', '')
  ELSE generation_error
END
WHERE generated_code IS NOT NULL;