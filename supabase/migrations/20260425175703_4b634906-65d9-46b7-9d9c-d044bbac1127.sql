-- Remove any duplicate google_ids first (keep oldest)
DELETE FROM public.potential_clients_reserva_mesa a
USING public.potential_clients_reserva_mesa b
WHERE a.google_id IS NOT NULL
  AND a.google_id = b.google_id
  AND a.created_at > b.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS potential_clients_reserva_mesa_google_id_key
  ON public.potential_clients_reserva_mesa (google_id)
  WHERE google_id IS NOT NULL;