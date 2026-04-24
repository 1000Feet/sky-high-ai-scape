
CREATE POLICY "Anyone can delete client signups"
ON public.client_signups
FOR DELETE
TO public
USING (true);

CREATE POLICY "Anyone can delete website requests"
ON public.website_requests
FOR DELETE
TO public
USING (true);
