DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['potential_clients','potential_clients_reserva_mesa','email_batches','email_batches_reserva_mesa','website_audits','email_send_queue','campaign_email_log','campaign_email_log_reserva_mesa','website_requests','client_signups'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'public_all_'||t, t);
    EXECUTE format('CREATE POLICY "Admins manage %s" ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''admin'')) WITH CHECK (public.has_role(auth.uid(), ''admin''))', t, t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
  END LOOP;
END $$;

CREATE POLICY "Public can submit client signup" ON public.client_signups FOR INSERT TO anon, authenticated
WITH CHECK (length(name) BETWEEN 1 AND 200 AND length(email) BETWEEN 3 AND 320 AND email LIKE '%@%' AND length(desired_services) BETWEEN 1 AND 5000);
GRANT INSERT ON public.client_signups TO anon;

DROP POLICY IF EXISTS "Anyone can submit investor interest" ON public.investor_interests;
CREATE POLICY "Anyone can submit investor interest" ON public.investor_interests FOR INSERT TO anon, authenticated
WITH CHECK (length(name) BETWEEN 1 AND 200 AND length(email) BETWEEN 3 AND 320 AND email LIKE '%@%' AND coalesce(length(message),0) <= 5000);

CREATE OR REPLACE FUNCTION public.create_website_request(p_name text, p_email text, p_phone text, p_business_name text, p_business_type text, p_logo_url text, p_color_palette text, p_mockup_url text, p_notes text, p_status text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_id uuid;
BEGIN
  IF length(coalesce(p_name,'')) NOT BETWEEN 1 AND 200 OR length(coalesce(p_email,'')) NOT BETWEEN 3 AND 320 OR length(coalesce(p_business_name,'')) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION 'invalid input';
  END IF;
  IF coalesce(p_status,'pending') NOT IN ('pending','approved','feedback') THEN RAISE EXCEPTION 'invalid status'; END IF;
  INSERT INTO public.website_requests(name,email,phone,business_name,business_type,logo_url,color_palette,mockup_url,notes,status)
  VALUES (p_name,p_email,left(p_phone,50),p_business_name,left(p_business_type,200),left(p_logo_url,2000),left(coalesce(p_color_palette,'pending'),200),left(p_mockup_url,2000),left(p_notes,10000),coalesce(p_status,'pending'))
  RETURNING id INTO new_id;
  RETURN new_id;
END $$;

CREATE OR REPLACE FUNCTION public.update_website_request(p_id uuid, p_logo_url text DEFAULT NULL, p_color_palette text DEFAULT NULL, p_mockup_url text DEFAULT NULL, p_notes text DEFAULT NULL, p_status text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_status IS NOT NULL AND p_status NOT IN ('pending','approved','feedback') THEN RAISE EXCEPTION 'invalid status'; END IF;
  UPDATE public.website_requests SET
    logo_url = coalesce(left(p_logo_url,2000), logo_url),
    color_palette = coalesce(left(p_color_palette,200), color_palette),
    mockup_url = coalesce(left(p_mockup_url,2000), mockup_url),
    notes = coalesce(left(p_notes,10000), notes),
    status = coalesce(p_status, status)
  WHERE id = p_id AND status IN ('pending','approved','feedback') AND created_at > now() - interval '1 day';
END $$;

REVOKE ALL ON FUNCTION public.create_website_request(text,text,text,text,text,text,text,text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_website_request(uuid,text,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_website_request(text,text,text,text,text,text,text,text,text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_website_request(uuid,text,text,text,text,text) TO anon, authenticated;

DROP POLICY IF EXISTS "public write logos" ON storage.objects;
DROP POLICY IF EXISTS "public write mockups" ON storage.objects;