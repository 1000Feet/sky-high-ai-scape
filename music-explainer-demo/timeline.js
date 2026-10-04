// Shared timeline: used by the canvas animation (browser) and the audio synth (node).
(function (root) {
  const PROG = [
    { deg: 'I',  upper: [60, 64, 67], bass: 48, root: 0, q: '' },
    { deg: 'V',  upper: [59, 62, 67], bass: 43, root: 7, q: '' },
    { deg: 'vi', upper: [60, 64, 69], bass: 45, root: 9, q: 'm' },
    { deg: 'IV', upper: [60, 65, 69], bass: 41, root: 5, q: '' },
  ];

  const SONGS = [
    { title: 'Let It Be', artist: 'The Beatles', year: 1970, key: 0, keyName: 'C' },
    { title: 'With or Without You', artist: 'U2', year: 1987, key: 2, keyName: 'D' },
    { title: 'Someone Like You', artist: 'Adele', year: 2011, key: -3, keyName: 'A' },
    { title: "Don't Stop Believin'", artist: 'Journey', year: 1981, key: 4, keyName: 'E' },
  ];

  const HOOK_END = 3.2, SCALE_END = 7.2, PROG_T0 = 7.2, SONG_T0 = 13.6, SONG_LEN = 4.8;
  const OUTRO_T0 = SONG_T0 + SONGS.length * SONG_LEN; // 32.8
  const DURATION = OUTRO_T0 + 6.2;

  // chords that drive the visuals (the hook teaser is audio-only)
  const CHORDS = [];
  for (let i = 0; i < 4; i++) CHORDS.push({ t0: PROG_T0 + i * 1.6, t1: PROG_T0 + (i + 1) * 1.6, idx: i, key: 0, pulse: 0.8 });
  SONGS.forEach((s, si) => {
    s.t0 = SONG_T0 + si * SONG_LEN; s.t1 = s.t0 + SONG_LEN;
    for (let i = 0; i < 4; i++) CHORDS.push({ t0: s.t0 + i * 1.2, t1: s.t0 + (i + 1) * 1.2, idx: i, key: s.key, song: si, pulse: 0.6 });
  });
  CHORDS.push({ t0: OUTRO_T0, t1: DURATION - 0.6, idx: 0, key: 0, outro: true });

  const TEASER = [0, 1, 2, 3].map(i => ({ t0: 0.25 + i * 0.72, t1: 0.25 + (i + 1) * 0.72, idx: i, key: 0 }));

  const SCALE_NOTES = [60, 62, 64, 65, 67, 69, 71].map((m, i) => ({ t0: 3.55 + i * 0.45, m, dur: 1.0 }));

  // visual key (continuous, shortest rotation path)
  const KEYFRAMES = [{ t: 0, k: 0 }];
  let prevKey = 0, vis = 0;
  const pushKey = (t, key) => {
    if (key === prevKey) return;
    const d = ((key - prevKey + 18) % 12 + 12) % 12 - 6;
    KEYFRAMES.push({ t: t - 0.3, k: vis });
    vis += d; prevKey = key;
    KEYFRAMES.push({ t: t + 0.35, k: vis });
  };
  SONGS.forEach(s => pushKey(s.t0, s.key));
  pushKey(OUTRO_T0, 0);

  const CAPTIONS = [
    { t0: 0.2,  t1: 3.2,  text: 'Why do so many hits sound the same?' },
    { t0: 3.3,  t1: 7.1,  text: 'Take the seven notes of the C major scale.' },
    { t0: 7.2,  t1: 13.5, text: 'Build four chords on the first, fifth, sixth and fourth notes.' },
    { t0: 13.6, t1: 18.4, text: 'You hear them in Let It Be by the Beatles…' },
    { t0: 18.4, t1: 23.2, text: '…in With or Without You by U2…' },
    { t0: 23.2, t1: 28.0, text: '…in Someone Like You by Adele…' },
    { t0: 28.0, t1: 32.8, text: "…and in Don't Stop Believin' by Journey." },
    { t0: 32.8, t1: 35.4, text: 'Change the key…' },
    { t0: 35.4, t1: 39.0, text: '…and the shape stays the same.' },
  ];

  const TL = { PROG, SONGS, CHORDS, TEASER, SCALE_NOTES, KEYFRAMES, CAPTIONS,
    HOOK_END, SCALE_END, PROG_T0, SONG_T0, SONG_LEN, OUTRO_T0, DURATION };
  if (typeof module !== 'undefined') module.exports = TL; else root.TL = TL;
})(this);
