CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

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
    url := 'https://ybxhwzpnowhmveazhwzl.supabase.co/functions/v1/resume-stale-batches',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieGh3enBub3dobXZlYXpod3psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNDc3NzEsImV4cCI6MjA5MjYyMzc3MX0.Zl_m0RXk3ULL2Gwr7hDpzbxLDiTzj5AtxHUa02mmLNQ'
    ),
    body := jsonb_build_object('scheduled_at', now()::text)
  );
  $$
);