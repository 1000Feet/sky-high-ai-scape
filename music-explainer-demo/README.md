# Music explainer demo — the I–V–vi–IV progression

Vertical 9:16 animation (1080×1920, 39 s) explaining pop's most famous chord progression, with examples from Let It Be, With or Without You, Someone Like You and Don't Stop Believin'.

- `timeline.js` — scene, chord, caption and song timings (shared by audio and video)
- `audio.js` — synthesizes the soundtrack into `audio.wav` (no original recordings)
- `index.html` — canvas animation, `draw(t)` function
- `render.js` — renders with Playwright + ffmpeg into `demo.mp4` (`node render.js 5 10` for preview stills)

```
node audio.js && node render.js
```

Fonts: DM Sans / DM Mono (SIL Open Font License).
