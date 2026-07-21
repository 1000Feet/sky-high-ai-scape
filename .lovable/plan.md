# /revideos — Real Estate AI Videos (Phase 1) — v2

Modifiche rispetto alla v1 approvata: **sequenza di attivazione auth** rivista per non lasciarti fuori, e **hardening di `create-revideo-checkout`** contro abuso del bucket.

## Sequenza auth corretta (step 1–3 rivisti)

Il problema: se disabilito i signup prima che tu abbia creato l'account, resti fuori. Sequenza:

1. **Migration**: enum `app_role` (`admin`), tabella `user_roles`, funzione security-definer `has_role(uuid, app_role)`, RLS (`SELECT` self, scritture solo `service_role`). GRANT `SELECT` a `authenticated`, `ALL` a `service_role`. Signup **ancora aperto** in questa fase.
2. **Pagina `/auth`** (login + signup email/password, `emailRedirectTo: window.location.origin`) e componente `RequireAdmin` (usa `onAuthStateChange` + `getSession` + query `has_role`; se non admin → redirect `/auth`). Applicato a `/admin` e (più avanti) `/revideos/admin`.
3. **Tu fai signup** su `/auth` con `info@1000feetabove.com`. Mi confermi appena fatto.
4. Io recupero il tuo `user_id` con `supabase--read_query` su `auth.users` e ti inserisco in `user_roles` con `supabase--insert` (`role='admin'`).
5. **Solo ora** chiamo `configure_auth` con `disable_signup=true`, `auto_confirm_email=false`, `password_hibp_enabled=true`, `external_anonymous_users_enabled=false`. Da questo momento nessuno può più auto-registrarsi; futuri admin li aggiungo io lato DB.

Verifico login `/admin` prima di procedere con il resto.

## Hardening di `create-revideo-checkout`

Endpoint pubblico (necessariamente `verify_jwt=false` perché il cliente non è loggato). Layer di difesa:

**Validazione server-side rigorosa (zod):**
- `package_id ∈ {p6_hd, p12_hd, p6_4k, p12_4k}`.
- `photo_count` derivato dal package (6 o 12), **non accettato dal client**.
- `email` valida, max 255 char.
- `note` max 1000 char, `rights_confirmed === true` altrimenti 400.
- Numero di signed upload URL emessi = esattamente `photo_count` del package (hard cap 12). Nessun modo di chiederne di più.

**Signed URL restrittive:**
- `createSignedUploadUrl` per path deterministici `revideo-uploads/{order_id}/{index}.{ext}` con `expiresIn: 900` (15 min).
- Bucket policy: mime `image/*`, size max 10MB, enforced dal bucket stesso (limite Supabase Storage) — non solo client-side.

**Rate limit ad-hoc per IP** (il backend non ha un primitive standard di rate limiting; implemento manualmente su tua richiesta esplicita):
- Nuova tabella `revideo_checkout_attempts` (`ip` text, `created_at` timestamptz, index su `(ip, created_at desc)`). RLS on, GRANT solo `service_role`.
- Nella edge function leggo `x-forwarded-for` (primo IP), conto righe `WHERE ip=$1 AND created_at > now() - interval '1 hour'`. Se `>= 3` pending → `429 Too many requests, try again later.` Altrimenti inserisco la riga e proseguo.
- Retention: cron `cleanup-revideo-orphans` fa anche `DELETE FROM revideo_checkout_attempts WHERE created_at < now() - interval '24 hours'`.
- Nota trasparenza: `x-forwarded-for` è spoofable ma alza abbastanza il costo d'attacco; non è una difesa crittografica. Il cleanup 48h resta come rete di sicurezza finale.

**Ordine solo con Stripe session valido:**
- La row `revideo_orders` viene creata con `payment_status='pending'` e mai promossa senza `checkout.session.completed` firmato con `STRIPE_WEBHOOK_SECRET`.

**Delivery bucket separato:**
- `revideo-uploads` (privato, 10MB, image/*) — solo signed upload URL emesse dalla funzione.
- `revideo-deliveries` (privato, 500MB, video/mp4) — signed download URL emesse solo dal webhook / delivery.

## Il resto del piano (invariato rispetto alla v1)

- Tabella `revideo_orders` con RLS `service_role`-only, campi `rights_confirmed`, `photo_paths`, `stripe_session_id`, `payment_status`, `automation_status`, `final_video_path`.
- Pagina `/revideos` (EN) con hero, "From photos to film" (6 placeholder + freccia + YouTube embed), 3-step how-it-works, pricing 2×2 ($49/$99/$129/$249), form con box tips + checkbox rights obbligatoria, FAQ, `/revideos/success`.
- Voce menu "Video AI" in `Navigation.tsx`.
- Edge functions: `create-revideo-checkout`, `revideo-stripe-webhook`, `cleanup-revideo-orphans` (+ cron 04:00 UTC daily).
- Email templates React Email: new-order (a te), order-confirmation, delivery, failure-alert.
- Stripe: `recommend_payment_provider` → `enable_stripe_payments` → 4 product/price USD one-time con `automatic_tax`.
- Admin `/revideos/admin` protetto da `RequireAdmin`: lista ordini, download foto, upload video finale, marca delivered → invia email delivery.
- Phase 2 (Higgsfield + Creatomate): solo scaffold dietro flag `REVIDEO_AUTOMATION_ENABLED=false`. Endpoint Higgsfield verificato via docs quando arriva la key.

## Ordine di implementazione aggiornato

1. Migration `user_roles` + `has_role`.
2. `/auth` + `RequireAdmin` + guard su `/admin` esistente. **Signup ancora aperto.**
3. ⏸ **Ti chiedo: fai signup su `/auth` con `info@1000feetabove.com`.**
4. Insert `user_roles` con `supabase--insert` sul tuo `user_id`.
5. `configure_auth(disable_signup=true, auto_confirm_email=false, password_hibp_enabled=true)`. Verifica login admin funzionante.
6. Migration `revideo_orders` + `revideo_checkout_attempts` + trigger updated_at.
7. Bucket `revideo-uploads` e `revideo-deliveries` (privati).
8. Email templates + `enable_stripe_payments` + 4 product/price.
9. Edge functions `create-revideo-checkout` (con rate limit + validation hard), `revideo-stripe-webhook`, `cleanup-revideo-orphans` + cron.
10. Pagine `/revideos`, `/revideos/success`, `/revideos/admin`.
11. Voce menu "Video AI".

## Cosa serve da te

1. Foto placeholder `casa-idea-1..6.jpg` (quando siamo allo step 10).
2. URL YouTube del video demo.
3. **Al passaggio 3**: signup su `/auth` con `info@1000feetabove.com`.
4. Compilazione form Stripe quando parte `enable_stripe_payments`.
5. Fase 2 (più avanti): `HIGGSFIELD_API_KEY`, `CREATOMATE_API_KEY`.

Approvi? Parto con lo step 1.
