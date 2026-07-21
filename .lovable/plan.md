# Fix: ReVideos checkout returns 400

## Diagnosi
`create-revideo-checkout` risponde 400 perché richiede un utente autenticato (`supabase.auth.getUser(token)` → se fallisce, throw "Authentication required" → catch → status 400). La pagina `/revideos` non forza login prima del checkout, quindi stai chiamando la function senza token.

Cause secondarie possibili (da escludere durante il fix):
- `STRIPE_SECRET_KEY` mancante nei secrets.
- Rate limit: >3 righe `pending` in `revideo_checkout_attempts` per il tuo IP nell'ultima ora (probabile dopo i tentativi falliti — anche se qui l'insert avviene solo dopo il successo, quindi meno grave).

## Decisione da prendere
Il flusso ReVideos è pensato come **self-service pubblico** (paghi, poi carichi foto), oppure vogliamo **richiedere signup** prima del pagamento?

Assumo self-service pubblico (coerente con la landing e con l'assenza di gate nella UI). Il fix va nella direzione "guest checkout".

## Piano

### 1. Rimuovere il requisito auth dalla edge function
File: `supabase/functions/create-revideo-checkout/index.ts`
- Rendere il token opzionale: se presente e valido, associare `user_id`; se assente, `user_id = null` (guest order).
- Rimuovere il throw "Authentication required".
- Mantenere validazioni: rights_accepted, email, price, package.
- Migliorare error handling: loggare `err` con `console.error` e ritornare messaggio chiaro (attualmente `err.message` è generico).

### 2. Database
Verificare che `revideo_orders.user_id` sia nullable. Se non lo è, migration per renderlo nullable.

### 3. RLS
Assicurarsi che gli ordini guest siano accessibili via `session_id` sulla success page (la lookup avviene via edge function con service role, quindi RLS non blocca — da confermare leggendo `verify-revideo-payment`).

### 4. Verifiche di runtime
- Confermare che `STRIPE_SECRET_KEY` sia settato (via test dopo il deploy — se manca, il messaggio ora sarà esplicito).
- Pulire eventuali righe `pending` vecchie in `revideo_checkout_attempts` per il tuo IP se il rate limit scatta.

### 5. Retest end-to-end
Ripetere l'ordine Starter $49 con carta 4242… e verificare arrivo alla success page.

## Tecnico
- La function usa service role client, quindi può inserire ordini con `user_id = null` senza problemi RLS.
- La success page identifica l'ordine tramite `order_id` in URL + `session_id` Stripe, non serve auth.
- Se in futuro vuoi collegare gli ordini a un account, si può aggiungere un claim post-pagamento via email match.

## Domanda aperta
Vuoi confermare che il flusso è **guest checkout** (nessun login richiesto) prima che io applichi il fix? Se invece preferisci richiedere signup, il piano cambia: aggiungerei un redirect a `/auth` prima del click su "Pay".
