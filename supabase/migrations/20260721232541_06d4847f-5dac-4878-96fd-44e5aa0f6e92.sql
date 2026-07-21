BEGIN;

ALTER TABLE public.revideo_orders
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS manual_override boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS customer_notified_at timestamp with time zone;

COMMIT;