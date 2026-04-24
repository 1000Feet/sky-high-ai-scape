CREATE POLICY "Anyone can update website requests"
ON public.website_requests
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);