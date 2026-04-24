

## Piano: eliminare lo sleep retry e gestire fallimenti soft

### Fix 1: rimuovere `await sleep(60_000)` tra retry
Nel file `supabase/functions/send-campaign-batch/index.ts`, nella sezione "Send with 1 retry":
- Eliminare `if (attempt === 1) await sleep(RETRY_DELAY_MS)` 
- Mantenere il retry immediato (max 2 tentativi back-to-back, senza pausa)
- Rationale: 60s di sleep blocca la edge function fino al timeout CPU. Se il primo invio fallisce per un motivo transitorio SMTP, ritentare subito o mai — non bloccare l'intero batch.

### Fix 2: classificare errori "permanenti" e saltare il prospect
Errori SMTP tipo `451 Temporary lookup failure`, `550 user unknown`, `553 invalid recipient` indicano che **quell'indirizzo specifico** non riceverà mai (o non ora). Attualmente il codice li tratta come fallimento generico, incrementa `consecutive_failures`, e dopo 5 fa scattare il circuit breaker — ma in pratica fa molto peggio: blocca tutto perché il retry-sleep timeouta.

Cambio la logica:
- Se il messaggio di errore matcha pattern noti (`/^4\d\d/`, `/^5\d\d/`, `lookup failure`, `user unknown`, `does not exist`, `invalid recipient`), trattalo come **skip permanente**: marca log come `failed`, incrementa `failed_count`, **avanza il cursor**, ma **NON** incrementare `consecutive_failures` (così il circuit breaker non scatta per problemi del singolo destinatario).
- Solo errori di connessione SMTP (es. timeout, ECONNRESET) contano come "consecutive failure" reale.

### Fix 3: sblocco immediato del batch attuale
Una volta deployata la nuova versione, chiamo manualmente `send-campaign-batch` con `batch_id=83e13f1e-...` per farlo riprendere dal cursor 318. Senza lo sleep killer, processerà l'indirizzo problematico → lo skipperà → andrà avanti col 319 e oltre.

### File toccati
- `supabase/functions/send-campaign-batch/index.ts` — solo il blocco retry (~15 righe)

### Cosa NON cambio
- Watchdog (funziona, fa il suo lavoro)
- Schema DB
- Logica rate-limit / quote
- UI

### Risultato atteso
Entro pochi minuti il batch ricomincia a inviare. Il prospect rotto viene saltato in <2s invece di bloccare 60s+ e crashare. Ogni futuro indirizzo invalido viene gestito allo stesso modo.

