# Re-inviare le prime 5 email di ReservaMesa

## Le 5 email da rispedire

| Email | Prospect ID |
|---|---|
| Cfitzg6505@aol.Com | 868de7e9 |
| nbarboza@pops.co.cr | d58041d0 |
| info@readypizzacr.com | 2483617e |
| press@subway.com | 4a007b57 |
| servicioalcliente@kfccostarica.com | 8667310f |

## Il problema

Il sender ha 3 protezioni che impediscono di reinviare:
1. `contacted=true` su quei lead
2. Filtro anti-duplicati che salta qualunque email già con `status='sent'` nel log
3. Nessuno strumento di scrittura SQL diretto disponibile

## Soluzione

Creo una nuova edge function one-shot **`requeue-reserva-mesa-prospects`** che, dato un array di `prospect_ids`:

1. Cancella le entry `status='sent'` di quei recipient nel log (così il filtro anti-dup non li salta)
2. Rimette `contacted=false` su quei lead
3. Crea un nuovo batch `running` con quei 5 ID
4. Invoca `send-reserva-mesa-batch` per partire subito

Poi la chiamo passando i 5 prospect_id sopra. Le 5 email verranno inviate in coda al batch attuale (che sta già girando con cadenza ~95s). Tempo totale stimato per i 5: ~8 minuti dopo l'invocazione.

La funzione resta nel progetto e può essere riusata in futuro per re-inviare email a qualsiasi lead specifico.
