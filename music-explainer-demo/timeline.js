// Shared timeline: used by the canvas animation (browser) and the audio synth (node).
// Scene lengths stretch to fit the voiceover in voice.json / voice.js (from tts.js) when present.
(function (root) {
  const VOICE = typeof module !== 'undefined'
    ? (() => { try { return require('./voice.json'); } catch (e) { return null; } })()
    : root.VOICE || null;
  const seg = id => (VOICE && VOICE.segments[id]) || null;
  const speech = id => (seg(id) ? seg(id).speechEnd : 0);
  const VO_LEAD = 0.15; // voice starts this long after its scene

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

  const HOOK_LEN = Math.max(3.2, VO_LEAD + speech('hook') + 0.35);
  const SCALE_LEN = Math.max(4.0, VO_LEAD + speech('scale') + 0.6);
  const PROG_LEN = Math.max(6.4, VO_LEAD + speech('prog') + 0.6);
  const HOOK_END = HOOK_LEN, SCALE_END = HOOK_END + SCALE_LEN, PROG_T0 = SCALE_END, SONG_T0 = PROG_T0 + PROG_LEN;

  let t = SONG_T0;
  SONGS.forEach((s, si) => { s.t0 = t; s.t1 = t + Math.max(4.8, VO_LEAD + speech('song' + si) + 0.6); t = s.t1; });
  const OUTRO_T0 = t;
  const OUTRO2_AT = OUTRO_T0 + Math.max(2.6, VO_LEAD + speech('outro1') + 0.25);
  const DURATION = Math.max(OUTRO_T0 + 6.2, OUTRO2_AT + speech('outro2') + 1.8);

  // chords that drive the visuals (the hook teaser is audio-only)
  const CHORDS = [];
  const progChord = PROG_LEN / 4;
  // land each chord on its spoken degree ("first", "fifth", ...) when word timings exist
  const spoken = seg('prog') ? ['first', 'fifth', 'sixth', 'fourth'].map(k => {
    const w = seg('prog').words.find(w => w.w.toLowerCase().startsWith(k));
    return w ? PROG_T0 + VO_LEAD + w.t - 0.05 : null;
  }) : [];
  const progT = spoken.length && spoken.every(x => x !== null) ? spoken : [0, 1, 2, 3].map(i => PROG_T0 + i * progChord);
  for (let i = 0; i < 4; i++) {
    const t1 = i < 3 ? progT[i + 1] : SONG_T0;
    CHORDS.push({ t0: progT[i], t1, idx: i, key: 0, pulse: (t1 - progT[i]) / 2 });
  }
  SONGS.forEach((s, si) => {
    const len = (s.t1 - s.t0) / 4;
    for (let i = 0; i < 4; i++) CHORDS.push({ t0: s.t0 + i * len, t1: s.t0 + (i + 1) * len, idx: i, key: s.key, song: si, pulse: len / 2 });
  });
  CHORDS.push({ t0: OUTRO_T0, t1: DURATION - 0.6, idx: 0, key: 0, outro: true });

  const teaserLen = (HOOK_LEN - 0.35) / 4;
  const TEASER = [0, 1, 2, 3].map(i => ({ t0: 0.25 + i * teaserLen, t1: 0.25 + (i + 1) * teaserLen, idx: i, key: 0 }));

  const SCALE_NOTES = [60, 62, 64, 65, 67, 69, 71].map((m, i) => ({ t0: HOOK_END + 0.35 + i * 0.45, m, dur: 1.0 }));

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

  // voiceover placement + captions (word timings come from the TTS alignment)
  const VO = [
    ['hook', VO_LEAD], ['scale', HOOK_END + VO_LEAD], ['prog', PROG_T0 + VO_LEAD],
    ...SONGS.map((s, si) => ['song' + si, s.t0 + VO_LEAD]),
    ['outro1', OUTRO_T0 + VO_LEAD], ['outro2', OUTRO2_AT],
  ].map(([id, at]) => ({ id, at }));
  const ENDS = [HOOK_END, SCALE_END, SONG_T0, ...SONGS.map(s => s.t1), OUTRO2_AT, DURATION];
  const FALLBACK = [
    'Why do so many hit songs sound... exactly the same?',
    'Take the seven notes of the C major scale.',
    'Now build a chord on the first, the fifth, the sixth, and the fourth note.',
    "You've heard it in Let It Be, by the Beatles...",
    'With or Without You, by U2...',
    'Someone Like You, by Adele...',
    "And Don't Stop Believin', by Journey.",
    'Change the key, and the whole shape just rotates...',
    "But it's the exact same shape.",
  ];
  const CAPTIONS = VO.map((v, i) => {
    const s = seg(v.id);
    return {
      t0: v.at - 0.1, t1: ENDS[i],
      text: s ? s.text : FALLBACK[i],
      words: s ? s.words.map(w => ({ w: w.w, t: v.at + w.t })) : null,
    };
  });

  const TL = { PROG, SONGS, CHORDS, TEASER, SCALE_NOTES, KEYFRAMES, CAPTIONS, VO, VOICE,
    HOOK_END, SCALE_END, PROG_T0, SONG_T0, OUTRO_T0, OUTRO2_AT, DURATION };
  if (typeof module !== 'undefined') module.exports = TL; else root.TL = TL;
})(this);
