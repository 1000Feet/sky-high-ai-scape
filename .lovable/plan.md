## Opzione B — Upload foto prima del pagamento + salvataggio contatti

Nuovo flusso su `/revideos`:
1. Utente compila **nome, email, package, foto, diritti**
2. Click "Continue" → crea `revideo_orders` con status `awaiting_payment` (nome/email/foto salvati subito)
3. Upload delle foto direttamente su storage (associate all'order_id)
4. Solo dopo l'upload completo → redirect a Stripe checkout
5. Sulla success page, siccome le foto sono già presenti, la pipeline parte immediatamente

Se l'utente abbandona Stripe, **l'ordine e l'email restano** (mai cancellati). Un cron orario invia reminder dopo qualche ora chiedendo se vuole completare il pagamento.

---

### 1. Database migration

- `revideo_orders`:
  - Aggiungi `customer_name TEXT`
  - Aggiungi `abandoned_reminder_sent_at TIMESTAMPTZ`, `abandoned_reminder_count INT DEFAULT 0`
  - Rimuovi vincolo status per aggiungere `'awaiting_payment'` come stato iniziale valido
- Modifica `cleanup_revideo_orphans`: **non elimina più nulla**. Diventa no-op o marca solo (manteniamo il DB per il follow-up).

### 2. Nuovo edge function `create-revideo-order`

Pubblico (no auth richiesta). Input: `package_name, price_cents, photo_count, resolution, customer_name, customer_email, rights_accepted, special_requests`. Rate-limit per IP (stesso `MAX_PENDING_PER_HOUR`). Crea la riga con status `awaiting_payment` e ritorna `{ order_id }`.

### 3. Modifiche edge functions esistenti

- **`create-revideo-upload-url`**: rendi auth opzionale. Se manca il JWT, accetta upload solo se `order.status = 'awaiting_payment'` o `awaiting_photos`. Non forziamo `user_id` match sul guest path (l'`order_id` opaco funge da capability).
- **`create-revideo-checkout`**: accetta `order_id` opzionale. Se presente, salta la INSERT e recupera l'ordine esistente per creare la sessione Stripe (mantiene il rate-limit).
- **`verify-revideo-payment`**: dopo la transizione a paid, controlla se le foto sono già ≥ `photo_count` → se sì, chiama internamente la logica di `finalize` (avvio Higgsfield) e imposta status `generating`.

### 4. Nuovo edge function `revideo-abandoned-reminder` (cron orario)

Trova ordini con `status = 'awaiting_payment'` creati > 3h fa (foto caricate, pagamento mai completato). Invia email al cliente con link "Complete your purchase" che riporta al checkout Stripe (riutilizza `create-revideo-checkout` con l'`order_id` esistente). Escalation: dopo 3h, 24h, 72h. Max 3 reminder. Aggiorna `abandoned_reminder_sent_at` e `abandoned_reminder_count`. Notifica anche l'admin.

Schedule via `pg_cron` chiamando la funzione ogni ora.

### 5. Frontend `src/pages/ReVideos.tsx`

Riordina il form:
1. Campi **Name + Email** (obbligatori, sopra il selettore foto)
2. File picker foto
3. Checkbox rights
4. Bottone "Continue to payment"

Al click:
- POST `create-revideo-order` → ottieni `order_id`
- Ciclo di upload: per ogni foto, chiama `create-revideo-upload-url` (senza auth, con `order_id`) → PUT su signed URL. Mostra progress bar "Uploading X/Y".
- Quando tutte le foto sono su storage, POST `create-revideo-checkout` con `{ order_id }`
- Redirect a `session.url`

Rimuovi il messaggio "Photos will be uploaded securely after payment" (ora non serve più).

### 6. Success page `ReVideosSuccess.tsx`

Nessun uploader più. Mostra "Order confirmed — your video is being generated" con tracker esistente. La chiamata `verify-revideo-payment` triggera l'automation se le foto ci sono già.

---

### Note tecniche

- **Sicurezza**: siccome l'upload guest è capability-based (chi conosce l'`order_id` UUID può caricare fino a `photo_count`), va bene per il nostro use case. Il rate-limit IP + il limite `photo_count` server-side impediscono abusi.
- **Email**: l'email del cliente resta nel DB anche se abbandona — GDPR-compliant perché è un ordine in corso, e user consenso implicito per follow-up sulla propria transazione.
- **Nessuna cancellazione**: la funzione `cleanup_revideo_orphans` viene neutralizzata, non chiamata dal cron. Se in futuro serve pulizia, sarà decisione manuale admin.
