# ReVideos — Fix Fase 1 + Implementazione Fase 2

## 1. Fix Success page (`src/pages/ReVideosSuccess.tsx`)

- Rimuovere il messaggio "30 minuti".
- Nuovo box informativo: **"We're on it — your video lands in your inbox within 24 hours"**, con l'email del cliente evidenziata.
- Testo copy resta in inglese.

## 2. Order form (`src/pages/ReVideos.tsx`) — validazione upload

Già presente ma da rafforzare:
- Uploader accetta esattamente 7 o 15 foto (in base al pacchetto).
- Accept: `image/jpeg,image/png,image/webp`.
- Max 10MB/file (validazione client con toast di errore).
- Tips box sopra (già c'è).
- Checkbox diritti obbligatoria (già c'è).
- Preview grid con remove (già c'è).

## 3. Pricing 2×2 (`src/pages/ReVideos.tsx`)

Conferma la griglia già in codice:
- p7_hd $49 · ~30s · 1080p
- p15_hd $99 · ~60-70s · 1080p
- p7_4k $129 · ~30s · 4K
- p15_4k $249 · ~60-70s · 4K

Aggiornare `duration` di `p15_*` a "~60-70s video". Ogni card mostra: cinematic camera movements, day/night scene ordering, smooth transitions, license Airbnb/Booking/social, 24h delivery. Hero copy: "in 24 hours". Sezione "From photos to film" + FAQ restano.

## 4. Stato ordine `awaiting_photos`

**Migrazione DB**:
- Estendere il CHECK di `revideo_orders.status` per includere `awaiting_photos` e (per Fase 2) `generating`, `editing`, `failed`.
- Aggiungere colonne: `photos_uploaded_at timestamptz`, `reminder_sent_at timestamptz`, `admin_notified_at timestamptz`.

**Logica**:
- `verify-revideo-payment`: quando conferma pagamento → status = `awaiting_photos` (invece di `paid`).
- `create-revideo-upload-url` o nuova funzione `finalize-revideo-upload`: quando `count(assets) == photo_count` → status = `paid`, `photos_uploaded_at = now()`, invia email a `info@1000feetabove.com` ("Order X ready to process").
- Admin dashboard (`ReVideosAdmin`): mostrare filtri stato incluso `awaiting_photos`, badge chiaro.

## 5. Reminder automatico 24h (upload mancanti)

- Nuova edge function `revideo-photo-reminder` (cron ogni ora via pg_cron):
  - Trova ordini `status = 'awaiting_photos'` con `created_at < now() - 24h` e `reminder_sent_at IS NULL`.
  - Invia email al cliente (Resend, template inline) con link diretto a `/revideos/success?order_id=…`.
  - Set `reminder_sent_at = now()`.

## 6. Fase 2 — Automazione Higgsfield + Creatomate

Segue esattamente il piano già approvato.

### Secrets richiesti
- `HIGGSFIELD_API_KEY`
- `CREATOMATE_API_KEY`
- `CREATOMATE_TEMPLATE_ID` (o JSON template inline)
- `REVIDEO_AUTOMATION_ENABLED` (feature flag, default `false`)

### Tabella `revideo_clips`
```
id uuid pk
order_id uuid fk revideo_orders
asset_id uuid fk revideo_assets
seq int              -- ordine nel montaggio finale
higgsfield_job_id text
status text          -- queued | running | done | failed | retry
model text           -- 'seedance_2_0'
mode text            -- 'std'
resolution text      -- '1080p' | '4k'
duration_seconds int -- 5, ultima clip 8
prompt text
video_url text       -- clip generata
error text
attempts int default 0
created_at, updated_at
```
+ GRANT + RLS (admin all, service_role all) + trigger updated_at.

Aggiungere a `revideo_orders`: `creatomate_render_id text`, `final_video_url text`, `automation_started_at`, `automation_completed_at`.

### Edge functions Fase 2
1. **`revideo-launch-automation`**: trigger quando status → `paid` e feature flag on.
   - Ordina asset per `sort_order` (giorno/notte come da piano).
   - Crea record `revideo_clips` (7 o 15), imposta ultima clip `duration=8`.
   - Enqueue con concorrenza max 8: per ognuno chiama Higgsfield `seedance_2_0` mode std, resolution da pacchetto, con prompt cinematografico contestuale.
   - Status ordine → `generating`.

2. **`revideo-poll-higgsfield`** (cron ogni 60s):
   - Poll job in stato `running`.
   - Retry policy: se errore = `preset_recommendation` o `nsfw` → riprompt con preset alternativo (max 2 retry); `failed` generico → retry base (max 3); dopo max retry → status `failed` + email alert a `info@1000feetabove.com`.
   - Quando tutte le clip di un ordine sono `done` → invoca `revideo-launch-editing`.

3. **`revideo-launch-editing`**:
   - Costruisce Creatomate render: sequence delle clip, crossfade 0.6s, 24fps, H.264, output mp4.
   - Registra `creatomate_render_id`, status ordine → `editing`.
   - Webhook URL punta a `revideo-creatomate-webhook`.

4. **`revideo-creatomate-webhook`** (verify_jwt = false, HMAC check se disponibile):
   - Alla ricezione `succeeded` → salva `final_video_url`, status → `delivered`, invia email al cliente col link (Resend), copia a `info@1000feetabove.com`.
   - `failed` → status `failed`, email alert admin, fallback coda manuale (l'ordine rimane visibile in admin con banner "Automation failed, process manually").

### Feature flag & fallback
- `REVIDEO_AUTOMATION_ENABLED=false` di default: `verify-revideo-payment` non chiama `revideo-launch-automation`; ordini rimangono in coda manuale come oggi. Admin può forzare lancio da dashboard.
- Ogni errore irrecuperabile → email di alert.

### Admin UI (`src/pages/ReVideosAdmin.tsx`)
Nuove colonne/azioni: stato dettagliato (`awaiting_photos`, `generating`, `editing`, `delivered`, `failed`), progress clip (`x/n done`), pulsante "Launch automation" (se paid + flag off), "Retry failed clip", link `final_video_url`.

## Ordine di esecuzione
1. Migrazione DB (status enum esteso + colonne + tabella `revideo_clips`).
2. Fix success page copy + validazione uploader (max 10MB, mime whitelist).
3. Logica `awaiting_photos` + notifica upload completo + reminder 24h.
4. Fase 2: secrets → edge functions Higgsfield → Creatomate → webhook → admin UI.
5. Deploy edge functions e pianificazione cron (`revideo-photo-reminder`, `revideo-poll-higgsfield`).

## Note tecniche
- Nessuna modifica ai 4 package Stripe già configurati.
- Prompt cinematografico per Higgsfield: base template per interior/exterior + variazione day/night, parametrizzato per foto (verrà rifinito in fase di test con `REVIDEO_AUTOMATION_ENABLED=false`).
- Tutte le email di sistema usano Resend (`RESEND_API_KEY` già presente).
