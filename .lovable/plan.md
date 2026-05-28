
## Scope

Solo `index.html` di QUESTO progetto (1000feetabove.com). Il sito reservamesa.cr è un progetto Lovable separato e va modificato lì (fuori scope di questa sessione).

## Stato attuale verificato

`index.html` già contiene title "1000 Feet, Inc. …", meta author/publisher/copyright = "1000 Feet, Inc.", JSON-LD Organization con brand ReservaMesa + subOrganization, e un blocco `<noscript>` nel body con menzione ReservaMesa e contatto. Se il tuo View Source mostra ancora "AI Ascend" come title, è cache CDN/browser o una pubblicazione non aggiornata — non lo stato del repo.

## Modifiche da applicare a `index.html`

### 1. Nel `<head>` — rafforzare i meta brand

- Aggiungere `<meta name="owner" content="1000 Feet, Inc." />`
- Riscrivere `<meta name="copyright">` con frase esplicita: `"ReservaMesa is a brand owned and operated by 1000 Feet, Inc."`
- Aggiungere `<meta name="bundle-version" content="v2026-05-27b" />`

### 2. Nel `<head>` — aggiungere un secondo blocco JSON-LD `SoftwareApplication` per ReservaMesa

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "ReservaMesa",
  "alternateName": "ReservaMesa CR",
  "publisher": { "@type": "Organization", "name": "1000 Feet, Inc.", "url": "https://1000feetabove.com" },
  "url": "https://reservamesa.cr",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web"
}
```

Il JSON-LD Organization esistente resta invariato.

### 3. Nel `<body>` — espandere il `<noscript>` esistente

Aggiungere all'attuale blocco:
- Riga esplicita: **"ReservaMesa is a brand owned and operated by 1000 Feet, Inc."**
- Versione spagnola: **"ReservaMesa es una marca propiedad y operada por 1000 Feet, Inc."**
- **"1000 Feet, Inc. is a Delaware corporation, Tax ID 83-4304389"**
- Link parent company + contatto (già presenti, da consolidare)

Manteniamo il `<noscript>` valido (no script tags dentro, solo HTML statico).

## Cosa NON fa questo piano

- Nessuna modifica a componenti React (i crawler non eseguono JS — inutile).
- Nessuna modifica al progetto reservamesa.cr (progetto separato).
- Nessuna modifica a routing, edge functions, DB.

## Deploy

Dopo il merge in build mode, ti ricordo di cliccare **Publish** (non solo preview) così il dominio custom `1000feetabove.com` serve il nuovo `index.html`. Poi fai un hard refresh / View Source con `?v=test` per bypassare la cache CDN e verificare `bundle-version="v2026-05-27b"`.

## Domanda

Confermi di voler procedere **solo su 1000feetabove.com**? Per reservamesa.cr devi aprire l'altro progetto Lovable e darmi accesso o eseguire lì le modifiche speculari.
