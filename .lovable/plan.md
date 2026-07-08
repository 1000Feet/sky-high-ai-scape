## Obiettivo
Aggiungere nel menu di navigazione della homepage una voce "SEO/GEO" che porti alla landing page `/seo` creata in precedenza.

## Modifiche previste
File coinvolto: `src/components/Navigation.tsx`

1. **Menu desktop** (`hidden md:flex`):
   - Aggiungere un `<Link to="/seo">SEO/GEO</Link>` accanto alla voce "Ventures".
   - Stile coerente con le altre voci: `text-gray-300 hover:text-blue-400 px-3 py-2 text-sm font-medium transition-all duration-200 hover:scale-105`.

2. **Menu mobile** (`md:hidden`):
   - Aggiungere la stessa voce "SEO/GEO" nel menu a tendina, sotto "Ventures".
   - Stile coerente con le altre voci mobile e `onClick={() => setIsOpen(false)}` per chiudere il menu al tap.

## Note
- Non si toccano altre pagine, configurazioni o dipendenze.
- Dopo la modifica verrà eseguito `pnpm lint && pnpm build` (o equivalente) per validare.
- Branch: `feat/ai-findability-landing` come da istruzioni precedenti.