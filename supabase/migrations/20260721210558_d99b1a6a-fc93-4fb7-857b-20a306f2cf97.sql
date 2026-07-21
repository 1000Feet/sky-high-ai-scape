CREATE TABLE public.revideo_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_name text NOT NULL CHECK (package_name IN ('starter','pro','premium')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','processing','delivered','cancelled','refunded')),
  property_address text,
  property_type text,
  special_requests text,
  price_cents integer NOT NULL,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  delivered_urls text[],
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.revideo_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.revideo_orders(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  original_filename text NOT NULL,
  file_size_bytes integer NOT NULL,
  mime_type text NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.revideo_orders TO authenticated;
GRANT ALL ON public.revideo_orders TO service_role;
GRANT SELECT, INSERT, DELETE ON public.revideo_assets TO authenticated;
GRANT ALL ON public.revideo_assets TO service_role;

ALTER TABLE public.revideo_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revideo_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own orders"
ON public.revideo_orders
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all orders"
ON public.revideo_orders
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can manage assets of their own orders"
ON public.revideo_assets
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.revideo_orders WHERE id = revideo_assets.order_id AND user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.revideo_orders WHERE id = revideo_assets.order_id AND user_id = auth.uid()));

CREATE POLICY "Admins can manage all assets"
ON public.revideo_assets
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_revideo_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_revideo_orders_updated_at
BEFORE UPDATE ON public.revideo_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_revideo_updated_at_column();
