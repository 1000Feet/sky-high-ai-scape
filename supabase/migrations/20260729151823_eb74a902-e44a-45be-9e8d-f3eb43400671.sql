BEGIN;

-- Unschedule revideo-related cron jobs
SELECT cron.unschedule('cleanup-revideo-orphans');
SELECT cron.unschedule('revideo-photo-reminder-hourly');
SELECT cron.unschedule('revideo-abandoned-reminder-hourly');

-- Drop revideo tables and their dependent objects (policies, triggers, indexes)
DROP TABLE IF EXISTS public.revideo_clips CASCADE;
DROP TABLE IF EXISTS public.revideo_assets CASCADE;
DROP TABLE IF EXISTS public.revideo_checkout_attempts CASCADE;
DROP TABLE IF EXISTS public.revideo_orders CASCADE;

-- Drop revideo-specific functions
DROP FUNCTION IF EXISTS public.cleanup_revideo_orphans() CASCADE;
DROP FUNCTION IF EXISTS public.update_revideo_updated_at_column() CASCADE;

COMMIT;
