Piano: rimuovere ReVideos da 1000feetabove e rendere il dispatcher email sensibile alle campagne attive

## Contesto
La sezione ReVideos è stata replicata nel progetto AIWege. Qui serve rimuoverla integralmente per liberare codice, storage e ridurre il consumo di crediti Lovable Cloud (soprattutto i cron che tengono sveglio Postgres).

## 1. Pulizia frontend
- Cancellare `src/pages/ReVideos.tsx`, `src/pages/ReVideosSuccess.tsx`, `src/pages/ReVideosAdmin.tsx`.
- Cancellare `src/components/ReVideosAdminTab.tsx`.
- Rimuovere da `src/App.tsx` gli import e le route `/revideos`, `/revideos/success`, `/revideos/admin`.
- Rimuovere da `src/components/Navigation.tsx` il link "Video AI" (desktop e mobile).
- Rimuovere da `src/components/AdminDashboard.tsx` l'import `ReVideosAdminTab`, il tab trigger 🎬 ReVideos e il relativo `TabsContent`.

## 2. Pulizia backend (Edge Functions)
Cancellare interamente le cartelle sotto `supabase/functions/`:
- `_shared/revideo.ts`
- `create-revideo-order`
- `create-revideo-checkout`
- `create-revideo-upload-url`
- `verify-revideo-payment`
- `finalize-revideo-upload`
- `revideo-orchestrate`
- `revideo-higgsfield-webhook`
- `revideo-creatomate-webhook`
- `revideo-photo-reminder`
- `revideo-abandoned-reminder`
- `cleanup-revideo-orphans`

## 3. Pulizia database e storage
Creare ed eseguire una migration che esegua:
- `cron.unschedule` per `cleanup-revideo-orphans`, `revideo-photo-reminder-hourly`, `revideo-abandoned-reminder-hourly`.
- `DROP TABLE ... CASCADE` per `revideo_orders`, `revideo_assets`, `revideo_clips`, `revideo_checkout_attempts`.
- `DROP FUNCTION` per `cleanup_revideo_orphans` e `update_revideo_updated_at_column`.
- Rimozione del bucket `revideo-assets` da `storage.objects` e `storage.buckets`.

## 4. Ottimizzazione `dispatch-email-queue`
Modificare `supabase/functions/dispatch-email-queue/index.ts`:
- Subito dopo la creazione del client Supabase, verificare se esiste almeno un batch in stato `running` in `email_batches` o `email_batches_reserva_mesa`.
- Se nessuna campagna è attiva, uscire subito con `dispatched: 0, reason: 'no active campaigns'`.
- Lasciare il cron a 10 minuti (via SQL con URL/token specifici, usando `supabase--insert` e non migration) per ridurre i wake-up del DB.

## 5. Verifica
- Build del frontend per confermare che non ci siano import residui o errori TS.
- Verifica che le pagine `/revideos`, `/revideos/success`, `/revideos/admin` restituiscano 404.
- Conferma che il tab ReVideos scompare da `/admin`.
- Conferma che `pg_cron.job` non contenga più i job revideo e che `dispatch-email-queue` sia a 10 minuti.
- Conferma che le tabelle `revideo_*` non esistano più.

## Nota sui costi
Dopo queste modifiche, i crediti giornalieri di Database server dovrebbero scendere sensibilmente perché spariscono i cron revideo (2 all'ora) e `dispatch-email-queue` passa da 1440 a 144 invocazioni/giorno.