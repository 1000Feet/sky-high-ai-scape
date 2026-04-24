-- email_batches: stato di ogni campagna SMTP
CREATE TABLE public.email_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'running', -- running | stopped | completed | failed
  total INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  stop_requested BOOLEAN NOT NULL DEFAULT false,
  prospect_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  cursor INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  last_error TEXT
);

ALTER TABLE public.email_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view email batches"
  ON public.email_batches FOR SELECT USING (true);
CREATE POLICY "Anyone can insert email batches"
  ON public.email_batches FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update email batches"
  ON public.email_batches FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete email batches"
  ON public.email_batches FOR DELETE USING (true);

-- campaign_email_log: log append-only di ogni invio
CREATE TABLE public.campaign_email_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID REFERENCES public.email_batches(id) ON DELETE SET NULL,
  prospect_id UUID,
  recipient_email TEXT NOT NULL,
  subject TEXT,
  language TEXT,
  status TEXT NOT NULL, -- sent | failed | skipped
  error_message TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.campaign_email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view campaign email log"
  ON public.campaign_email_log FOR SELECT USING (true);
CREATE POLICY "Anyone can insert campaign email log"
  ON public.campaign_email_log FOR INSERT WITH CHECK (true);

-- indice anti-duplicati
CREATE INDEX idx_campaign_email_log_recipient_status
  ON public.campaign_email_log (recipient_email, status);

-- indici utili
CREATE INDEX idx_campaign_email_log_batch ON public.campaign_email_log (batch_id);
CREATE INDEX idx_campaign_email_log_created ON public.campaign_email_log (created_at DESC);
CREATE INDEX idx_email_batches_status ON public.email_batches (status);