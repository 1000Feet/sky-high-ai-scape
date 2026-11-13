# Music explainer series

Vertical 9:16 music-theory explainers (1080×1920, ~1:30 each, English narration with ElevenLabs `eleven_v4`, voice "Jeremy – Warm, Trustworthy, Sincere"). Each video has two halves: where you hear the idea in famous songs, then why it works harmonically.

| # | Video | Songs | The "why" |
|---|-------|-------|-----------|
| 01 | `perfect-fifth.mp4` | Twinkle Twinkle, Star Wars, Also sprach Zarathustra, Smells Like Teen Spirit | 3:2 ratio, Lissajous figures, tritone chaos, organum, harmonic series |
| 02 | `tritone.mp4` | Maria, Purple Haze, Black Sabbath | half the circle, symmetry, G7 → C resolution, tritone substitution |
| 03 | `pentatonic.mp4` | Amazing Grace, Auld Lang Syne, rock solos | no half steps or tritone, stacked fifths, Bobby McFerrin |
| 04 | `twelve-bar-blues.mp4` | Johnny B. Goode, Hound Dog, Rock Around the Clock | call and response, dominant sevenths, blue note, turnaround |
| 05 | `pachelbel-canon.mp4` | Canon in D, Basket Case, Memories | stepwise bass, parallel violin line, ground bass ×28 |
| 06 | `andalusian-cadence.mp4` | Hit the Road Jack, Runaway, Sultans of Swing | lament bass, E major surprise (G#), Phrygian ending |
| 07 | `flat-seven.mp4` | Sweet Child O' Mine, Hey Jude (coda), Sympathy for the Devil | leading tone vs flat seven, Mixolydian, two plagal "amens" |
| 08 | `circle-of-fifths-progression.mp4` | Fly Me to the Moon, I Will Survive, Autumn Leaves | falling fifths, V → I dominoes, circle of fifths, ragtime |
| 09 | `key-change.mp4` | Man in the Mirror, I Will Always Love You, Love on Top | same tune higher, rotating shape, new five chord, gear change |
| 10 | `line-cliche.mp4` | Something, Stairway to Heaven, My Funny Valentine | the half step, one moving thread, shifting colour, Dido's Lament |

All music is synthesized from scratch: chord progressions, and only public-domain melodies (or a two/three-note interval) are played — no original recordings.

## How it works

```
engine/
  theory.js   chord names → pitch classes, automatic voicings with smooth voice leading
  layout.js   script.js + voice.json → timeline (scenes stretch to fit the narration)
  player.html canvas renderer: chromatic circle (can morph into the circle of fifths),
              chord shapes, scale dots, walkers, arcs, tags, Lissajous figures, bar grids,
              keyboard, karaoke captions
  audio.js    piano/bass/drum synth + narration mix with ducking
  tts.js      ElevenLabs narration with word timestamps (only new/changed lines are generated)
  make.js     runs everything and renders the mp4 with Playwright + ffmpeg
videos/NN-slug/
  script.js   narration lines, scenes, and build(api): every visual/musical event,
              usually placed on a spoken word with api.w(segment, word)
  vo/, voice.json   generated narration
```

```
node engine/make.js videos/01-perfect-fifth              # narration (if needed) + full render
node engine/make.js videos/01-perfect-fifth --no-tts --stills 5 30   # preview frames only
```
