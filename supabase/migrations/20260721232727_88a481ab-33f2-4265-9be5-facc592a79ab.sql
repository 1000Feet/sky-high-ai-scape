DROP POLICY IF EXISTS "Users can view clips of their own orders" ON public.revideo_clips;

CREATE POLICY "Users can view clips of their own orders"
  ON public.revideo_clips
  FOR SELECT
  TO authenticated
  USING ((EXISTS (
    SELECT 1 FROM public.revideo_orders
    WHERE revideo_orders.id = revideo_clips.order_id AND revideo_orders.user_id = auth.uid()
  )));