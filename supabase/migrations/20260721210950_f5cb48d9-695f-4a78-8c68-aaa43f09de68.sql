CREATE TABLE public.revideo_checkout_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  order_id UUID REFERENCES public.revideo_orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.revideo_checkout_attempts TO authenticated;
GRANT ALL ON public.revideo_checkout_attempts TO service_role;

ALTER TABLE public.revideo_checkout_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage checkout attempts" ON public.revideo_checkout_attempts
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.revideo_assets
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users view own assets') THEN
    CREATE POLICY "Users view own assets" ON public.revideo_assets
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins manage all assets') THEN
    CREATE POLICY "Admins manage all assets" ON public.revideo_assets
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_revideo_orphans()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cutoff TIMESTAMP WITH TIME ZONE := now() - interval '48 hours';
  rec RECORD;
BEGIN
  FOR rec IN SELECT id FROM public.revideo_orders WHERE payment_status = 'pending' AND created_at < cutoff LOOP
    DELETE FROM public.revideo_assets WHERE order_id = rec.id;
    DELETE FROM public.revideo_orders WHERE id = rec.id;
  END LOOP;
END;
$$;

SELECT cron.schedule('cleanup-revideo-orphans', '0 4 * * *', 'SELECT public.cleanup_revideo_orphans()');
