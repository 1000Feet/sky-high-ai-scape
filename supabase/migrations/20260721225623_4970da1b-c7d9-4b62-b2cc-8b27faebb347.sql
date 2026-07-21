
-- Extend status check
ALTER TABLE public.revideo_orders DROP CONSTRAINT IF EXISTS revideo_orders_status_check;
ALTER TABLE public.revideo_orders ADD CONSTRAINT revideo_orders_status_check
  CHECK (status = ANY (ARRAY['pending','awaiting_photos','paid','processing','generating','editing','delivered','failed','cancelled','refunded']));

-- New columns
ALTER TABLE public.revideo_orders
  ADD COLUMN IF NOT EXISTS photos_uploaded_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_notified_at timestamptz,
  ADD COLUMN IF NOT EXISTS creatomate_render_id text,
  ADD COLUMN IF NOT EXISTS final_video_url text,
  ADD COLUMN IF NOT EXISTS automation_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS automation_completed_at timestamptz;

-- revideo_clips table
CREATE TABLE IF NOT EXISTS public.revideo_clips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.revideo_orders(id) ON DELETE CASCADE,
  asset_id uuid REFERENCES public.revideo_assets(id) ON DELETE SET NULL,
  seq int NOT NULL,
  higgsfield_job_id text,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status = ANY (ARRAY['queued','running','done','failed','retry'])),
  model text NOT NULL DEFAULT 'seedance_2_0',
  mode text NOT NULL DEFAULT 'std',
  resolution text NOT NULL DEFAULT '1080p',
  duration_seconds int NOT NULL DEFAULT 5,
  prompt text,
  video_url text,
  error text,
  attempts int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.revideo_clips TO authenticated;
GRANT ALL ON public.revideo_clips TO service_role;

ALTER TABLE public.revideo_clips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all clips" ON public.revideo_clips
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS revideo_clips_order_idx ON public.revideo_clips(order_id);
CREATE INDEX IF NOT EXISTS revideo_clips_status_idx ON public.revideo_clips(status);

CREATE TRIGGER update_revideo_clips_updated_at
  BEFORE UPDATE ON public.revideo_clips
  FOR EACH ROW EXECUTE FUNCTION public.update_revideo_updated_at_column();
