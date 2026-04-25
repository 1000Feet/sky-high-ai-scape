-- Tabella clienti potenziali Costa Rica
CREATE TABLE public.potential_clients_reserva_mesa (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  google_id text,
  name text NOT NULL,
  phone text,
  website text,
  email text,
  address text,
  city text,
  state text,
  category text,
  rating numeric,
  reviews_count integer,
  source_query text,
  notes text,
  contacted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.potential_clients_reserva_mesa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all_potential_clients_reserva_mesa"
ON public.potential_clients_reserva_mesa
FOR ALL USING (true) WITH CHECK (true);

-- Tabella batch di invio Costa Rica
CREATE TABLE public.email_batches_reserva_mesa (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status text NOT NULL DEFAULT 'running',
  total integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  skipped_count integer NOT NULL DEFAULT 0,
  consecutive_failures integer NOT NULL DEFAULT 0,
  prospect_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  cursor integer NOT NULL DEFAULT 0,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  last_error text,
  paused_reason text,
  paused_until timestamp with time zone,
  last_heartbeat_at timestamp with time zone DEFAULT now(),
  stop_requested boolean NOT NULL DEFAULT false
);

ALTER TABLE public.email_batches_reserva_mesa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all_email_batches_reserva_mesa"
ON public.email_batches_reserva_mesa
FOR ALL USING (true) WITH CHECK (true);

-- Log email Costa Rica
CREATE TABLE public.campaign_email_log_reserva_mesa (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id uuid,
  prospect_id uuid,
  recipient_email text NOT NULL,
  subject text,
  language text,
  status text NOT NULL,
  attempt_count integer NOT NULL DEFAULT 1,
  error_message text,
  sent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.campaign_email_log_reserva_mesa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all_campaign_email_log_reserva_mesa"
ON public.campaign_email_log_reserva_mesa
FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_pcrm_contacted ON public.potential_clients_reserva_mesa(contacted);
CREATE INDEX idx_pcrm_email ON public.potential_clients_reserva_mesa(email);
CREATE INDEX idx_celrm_recipient ON public.campaign_email_log_reserva_mesa(recipient_email);
CREATE INDEX idx_celrm_status_sent ON public.campaign_email_log_reserva_mesa(status, sent_at);