INSERT INTO storage.buckets (id, name, public) VALUES ('mockups', 'mockups', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read access on mockups" ON storage.objects FOR SELECT TO public USING (bucket_id = 'mockups');
CREATE POLICY "Allow anon insert access on mockups" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'mockups');