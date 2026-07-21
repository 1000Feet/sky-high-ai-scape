ALTER TABLE public.revideo_orders ADD COLUMN IF NOT EXISTS reminder_count integer DEFAULT 0;
ALTER TABLE public.revideo_orders ADD COLUMN IF NOT EXISTS last_reminder_sent_at timestamp with time zone;
GRANT SELECT, UPDATE ON public.revideo_orders TO authenticated;
GRANT ALL ON public.revideo_orders TO service_role;