
ALTER TABLE public.revideo_orders
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS abandoned_reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS abandoned_reminder_count INTEGER NOT NULL DEFAULT 0;

-- Relax status CHECK to include awaiting_payment (drop if exists then re-add)
DO $$
DECLARE
  con_name text;
BEGIN
  SELECT conname INTO con_name
  FROM pg_constraint
  WHERE conrelid = 'public.revideo_orders'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%status%';
  IF con_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.revideo_orders DROP CONSTRAINT %I', con_name);
  END IF;
END $$;

ALTER TABLE public.revideo_orders
  ADD CONSTRAINT revideo_orders_status_check
  CHECK (status IN ('pending','awaiting_payment','awaiting_photos','paid','generating','editing','delivered','failed'));

-- Neutralize cleanup: keep orders and emails for follow-up. No-op body.
CREATE OR REPLACE FUNCTION public.cleanup_revideo_orphans()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Intentionally a no-op: we never delete orders or their emails.
  -- Abandoned-cart follow-up is handled by revideo-abandoned-reminder.
  RETURN;
END;
$function$;
