# Music explainer demo — giro I–V–vi–IV

Animazione verticale 9:16 (1080×1920, 39 s) sul giro di accordi I–V–vi–IV con esempi da brani famosi.

- `timeline.js` — tempi di scene, accordi, didascalie e brani (condiviso da audio e video)
- `audio.js` — sintetizza la colonna sonora in `audio.wav` (nessuna registrazione originale)
- `index.html` — animazione su canvas, funzione `draw(t)`
- `render.js` — renderizza con Playwright + ffmpeg in `demo.mp4` (`node render.js 5 10` per anteprime)

```
node audio.js && node render.js
```

Font: DM Sans / DM Mono (SIL Open Font License).
