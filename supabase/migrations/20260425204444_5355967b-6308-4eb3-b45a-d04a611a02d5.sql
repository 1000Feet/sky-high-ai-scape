
-- ============================================================
-- Step 1: queue table + safety nets
-- ============================================================

CREATE TABLE IF NOT EXISTS public.email_send_queue (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id        uuid NOT NULL,
  prospect_id     uuid NOT NULL,
  campaign_type   text NOT NULL CHECK (campaign_type IN ('default', 'reserva_mesa')),
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'skipped')),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  attempts        int NOT NULL DEFAULT 0,
  max_attempts    int NOT NULL DEFAULT 3,
  claimed_by      text,
  claimed_until   timestamptz,
  last_error      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (batch_id, prospect_id, campaign_type)
);

-- Permissive RLS (consistent with the rest of the schema in this project)
ALTER TABLE public.email_send_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_all_email_send_queue" ON public.email_send_queue
  FOR ALL USING (true) WITH CHECK (true);

-- Index used by the dispatcher to find ready-to-send rows
CREATE INDEX IF NOT EXISTS idx_queue_dispatch
  ON public.email_send_queue (next_attempt_at)
  WHERE status = 'pending';

-- Index used to recover stale leases (workers that died)
CREATE INDEX IF NOT EXISTS idx_queue_lease_recovery
  ON public.email_send_queue (claimed_until)
  WHERE status = 'sending';

-- Anti-duplicate hard safety net on the historical log tables.
-- Partial unique: at most ONE 'sent' row per (batch, prospect).
-- Skipped/failed/pending rows can coexist (they often do already).
CREATE UNIQUE INDEX IF NOT EXISTS campaign_email_log_unique_sent
  ON public.campaign_email_log (batch_id, prospect_id)
  WHERE status = 'sent' AND batch_id IS NOT NULL AND prospect_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS campaign_email_log_rm_unique_sent
  ON public.campaign_email_log_reserva_mesa (batch_id, prospect_id)
  WHERE status = 'sent' AND batch_id IS NOT NULL AND prospect_id IS NOT NULL;

-- updated_at trigger for the new queue table
CREATE TRIGGER trg_email_send_queue_updated_at
  BEFORE UPDATE ON public.email_send_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Atomic claim: returns the row if we successfully claimed it,
-- or NULL if someone else got there first / it's not pending yet.
-- ============================================================
CREATE OR REPLACE FUNCTION public.claim_email_for_send(
  p_queue_id uuid,
  p_worker_id text,
  p_lease_seconds int
) RETURNS public.email_send_queue
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.email_send_queue;
BEGIN
  UPDATE public.email_send_queue
  SET status = 'sending',
      claimed_by = p_worker_id,
      claimed_until = now() + make_interval(secs => p_lease_seconds),
      attempts = attempts + 1,
      updated_at = now()
  WHERE id = p_queue_id
    AND status = 'pending'
    AND next_attempt_at <= now()
  RETURNING * INTO result;

  RETURN result;  -- NULL row if not claimable
END;
$$;

-- ============================================================
-- Increment batch counters atomically and auto-complete when full.
-- p_kind: 'sent' | 'failed' | 'skipped'
-- p_table: 'email_batches' | 'email_batches_reserva_mesa'
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_batch_counter(
  p_batch_id uuid,
  p_kind text,
  p_table text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_table NOT IN ('email_batches', 'email_batches_reserva_mesa') THEN
    RAISE EXCEPTION 'invalid table %', p_table;
  END IF;
  IF p_kind NOT IN ('sent', 'failed', 'skipped') THEN
    RAISE EXCEPTION 'invalid kind %', p_kind;
  END IF;

  IF p_table = 'email_batches' THEN
    IF p_kind = 'sent' THEN
      UPDATE public.email_batches
      SET sent_count = sent_count + 1,
          cursor = cursor + 1,
          last_heartbeat_at = now(),
          consecutive_failures = 0,
          status = CASE
            WHEN sent_count + 1 + failed_count + skipped_count >= total THEN 'completed'
            ELSE status
          END,
          completed_at = CASE
            WHEN sent_count + 1 + failed_count + skipped_count >= total THEN now()
            ELSE completed_at
          END
      WHERE id = p_batch_id;
    ELSIF p_kind = 'failed' THEN
      UPDATE public.email_batches
      SET failed_count = failed_count + 1,
          cursor = cursor + 1,
          last_heartbeat_at = now(),
          status = CASE
            WHEN sent_count + failed_count + 1 + skipped_count >= total THEN 'completed'
            ELSE status
          END,
          completed_at = CASE
            WHEN sent_count + failed_count + 1 + skipped_count >= total THEN now()
            ELSE completed_at
          END
      WHERE id = p_batch_id;
    ELSE -- skipped
      UPDATE public.email_batches
      SET skipped_count = skipped_count + 1,
          cursor = cursor + 1,
          last_heartbeat_at = now(),
          status = CASE
            WHEN sent_count + failed_count + skipped_count + 1 >= total THEN 'completed'
            ELSE status
          END,
          completed_at = CASE
            WHEN sent_count + failed_count + skipped_count + 1 >= total THEN now()
            ELSE completed_at
          END
      WHERE id = p_batch_id;
    END IF;
  ELSE -- email_batches_reserva_mesa
    IF p_kind = 'sent' THEN
      UPDATE public.email_batches_reserva_mesa
      SET sent_count = sent_count + 1,
          cursor = cursor + 1,
          last_heartbeat_at = now(),
          consecutive_failures = 0,
          status = CASE
            WHEN sent_count + 1 + failed_count + skipped_count >= total THEN 'completed'
            ELSE status
          END,
          completed_at = CASE
            WHEN sent_count + 1 + failed_count + skipped_count >= total THEN now()
            ELSE completed_at
          END
      WHERE id = p_batch_id;
    ELSIF p_kind = 'failed' THEN
      UPDATE public.email_batches_reserva_mesa
      SET failed_count = failed_count + 1,
          cursor = cursor + 1,
          last_heartbeat_at = now(),
          status = CASE
            WHEN sent_count + failed_count + 1 + skipped_count >= total THEN 'completed'
            ELSE status
          END,
          completed_at = CASE
            WHEN sent_count + failed_count + 1 + skipped_count >= total THEN now()
            ELSE completed_at
          END
      WHERE id = p_batch_id;
    ELSE -- skipped
      UPDATE public.email_batches_reserva_mesa
      SET skipped_count = skipped_count + 1,
          cursor = cursor + 1,
          last_heartbeat_at = now(),
          status = CASE
            WHEN sent_count + failed_count + skipped_count + 1 >= total THEN 'completed'
            ELSE status
          END,
          completed_at = CASE
            WHEN sent_count + failed_count + skipped_count + 1 >= total THEN now()
            ELSE completed_at
          END
      WHERE id = p_batch_id;
    END IF;
  END IF;
END;
$$;
