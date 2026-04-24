-- Add unique constraint on google_id to prevent duplicate imports
CREATE UNIQUE INDEX IF NOT EXISTS idx_potential_clients_google_id_unique 
ON public.potential_clients (google_id) 
WHERE google_id IS NOT NULL;

-- Also add unique constraint on name + phone for entries without google_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_potential_clients_name_phone_unique 
ON public.potential_clients (name, phone) 
WHERE google_id IS NULL AND phone IS NOT NULL;