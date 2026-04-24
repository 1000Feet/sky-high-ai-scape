CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'resume-stale-batches-watchdog') THEN
    PERFORM cron.unschedule('resume-stale-batches-watchdog');
  END IF;
END $$;

SELECT cron.schedule(
  'resume-stale-batches-watchdog',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url:='https://hzgkqjprhctrhwnuqtmy.supabase.co/functions/v1/resume-stale-batches',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6Z2txanByaGN0cmh3bnVxdG15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NzI1NTcsImV4cCI6MjA3MTQ0ODU1N30.zY2Q6QFBJFARVgOHdM_uQfwlG_RCzEhwwq-ep1DkWH0"}'::jsonb,
    body:='{"trigger": "cron"}'::jsonb
  );
  $$
);