# Piano: Re-invio campagna ReservaMesa (V2)

## Obiettivo
Inviare un nuovo messaggio, più corto e personale, a tutti i 912 ristoranti con email valida (272 mai contattati + 640 già contattati una volta), a un ritmo di ~50 email al giorno per evitare lo spam.

## Numeri
- Destinatari V2: **912** (tutti quelli con email non vuota)
- Ritmo: **50/giorno** → ~6 giorni per i nuovi 272, ~18 giorni totali per tutti i 912
- Spacing tra una email e l'altra: ~28 minuti (1.728.000 ms), con jitter casuale ±15% per sembrare più umano

## Cosa cambia

### 1. Nuovo template ES2 (corto e personale)
Aggiunto in `supabase/functions/send-one-email/index.ts`: funzione `buildHtmlES2(name)` che usa il nome del ristorante, va dritto al punto in 3-4 righe, niente lista di feature. Esempio:

> Hola {name},  
> Soy Angelo. He visto que tienen restaurante en Costa Rica y queria preguntarles algo rapido.  
> Estamos regalando un sistema gratuito de reservas + comandas por WhatsApp a 10 restaurantes este mes. Sin costo, sin contrato.  
> Si les interesa, contesten "info" y les explico en 2 minutos. Pura vida.  
> — Angelo, ReservaMesa · wa.me/50687524442

### 2. Nuovo `campaign_type = 'reserva_mesa_v2'`
- In `send-one-email`: aggiunta entry in `CONFIGS` (riusa `potential_clients_reserva_mesa`, `campaign_email_log_reserva_mesa`, `email_batches_reserva_mesa`, stessa SMTP `info@reservamesa.cr`).
- Subject diverso da V1 per non sembrare un duplicato (es. *"Sistema gratis de reservas para 10 restaurantes este mes"*).
- **Dedup cross-batch limitato per `campaign_type`**: invece di bloccare se l'indirizzo è già stato contattato in *qualsiasi* batch, blocca solo se è già stato contattato dentro `reserva_mesa_v2`. Così i 640 di V1 ricevono regolarmente il V2, ma se la cron rigira non li ri-invia una terza volta.

### 3. Nuova edge function `start-reserva-mesa-v2-batch`
- Endpoint POST manuale (lo lanci tu dall'admin o con un curl).
- Carica tutti i prospect con `email IS NOT NULL AND email <> ''` (912).
- Crea un batch in `email_batches_reserva_mesa` con quei prospect.
- Enqueue in `email_send_queue` con `campaign_type = 'reserva_mesa_v2'` e `next_attempt_at` a intervalli di **1.728.000 ms ± jitter 15%**.

### 4. Disattivazione cron giornaliera vecchia
La cron `auto-start-daily-reserva-mesa` riprenderebbe a 96s spacing per i 272 rimasti — va in conflitto col V2. Verrà sospesa (rimossa dal `pg_cron`) finché il V2 non è completato. Il V1 originale resta intatto come codice, solo non viene più auto-startato.

### 5. Header anti-spam
Nel `send-one-email`, per `reserva_mesa_v2` aggiungere:
- `List-Unsubscribe: <mailto:info@reservamesa.cr?subject=remover>` (richiesto da Gmail/Yahoo per sender massivi)
- `List-Unsubscribe-Post: List-Unsubscribe=One-Click`
- Reply-To pulito.

## File toccati
- `supabase/functions/send-one-email/index.ts` — nuovo template ES2, nuovo entry in `CONFIGS`, dedup per campaign_type, headers List-Unsubscribe.
- `supabase/functions/start-reserva-mesa-v2-batch/index.ts` — **NEW**, entry point manuale.
- `supabase/config.toml` — registra la nuova edge function.
- Migration / SQL puntuale: `cron.unschedule` del job che chiama `auto-start-daily-reserva-mesa` (eseguito con `supabase--insert` perché contiene URL e service key del progetto).

## Come lo lanci
Dopo deploy, basta una chiamata `curl` (o un bottone nell'admin se vuoi che te lo aggiunga):
```
POST /functions/v1/start-reserva-mesa-v2-batch
```
Il batch parte e si auto-distribuisce nei giorni successivi via `next_attempt_at` + il dispatcher esistente `dispatch-email-queue`. Potrai monitorare in `email_batches_reserva_mesa` (riga V2) e in `campaign_email_log_reserva_mesa`.

## Cosa NON tocco
- Il template V1 e il flusso V1 restano (solo l'auto-cron viene sospesa).
- Niente modifiche al frontend admin in questo round (se vuoi un bottone "Avvia V2" me lo dici e lo aggiungo).
- Nessuna modifica a tabelle, RLS o schema database.

Vuoi che proceda così, o preferisci che aggiunga anche il bottone "Avvia V2" nell'admin dashboard?
