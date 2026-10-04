# Music explainer demo — the I–V–vi–IV progression

Vertical 9:16 animation (1080×1920, 39 s) explaining pop's most famous chord progression, with examples from Let It Be, With or Without You, Someone Like You and Don't Stop Believin'.

- `tts.js` — generates the English voiceover with ElevenLabs `eleven_v4` (voice: Jeremy – Warm, Trustworthy, Sincere) into `vo/`, plus word timings in `voice.json` / `voice.js`
- `timeline.js` — scene, chord, caption and song timings (shared by audio and video); scenes stretch to fit the voice, captions and progression chords follow the spoken words
- `audio.js` — synthesizes the music (no original recordings) and mixes in the voiceover with ducking into `audio.wav`
- `index.html` — canvas animation, `draw(t)` function
- `render.js` — renders with Playwright + ffmpeg into `demo.mp4` (`node render.js 5 10` for preview stills)

```
node tts.js     # only when the narration text changes (uses ElevenLabs credits)
node audio.js && node render.js
```

Fonts: DM Sans / DM Mono (SIL Open Font License).
