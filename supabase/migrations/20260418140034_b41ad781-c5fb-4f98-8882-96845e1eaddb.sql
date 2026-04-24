UPDATE public.email_batches
SET status = 'paused',
    paused_reason = 'launch_delay',
    paused_until = (now() + interval '2 hours'),
    last_heartbeat_at = now()
WHERE status = 'running';