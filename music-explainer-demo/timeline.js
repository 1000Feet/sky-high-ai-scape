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
  // end of part 1 (unchanged); part 2 explains the harmony
  const P2_T0 = Math.max(OUTRO_T0 + 6.2, OUTRO2_AT + speech('outro2') + 1.8);

  // ---- part 2 scenes: each lasts as long as its narration ----
  const P2 = [];
  const voAt = {};
  let pt = P2_T0;
  const scene = (id, len, info) => { const sc = { id, t0: pt, t1: pt + len, ...info }; P2.push(sc); pt = sc.t1; return sc; };
  const spoken2 = (id, tail, min = 0) => Math.max(min, VO_LEAD + (speech(id) || 3) + tail);
  const S = {};
  S.home    = scene('home',    spoken2('home', 0.3),    { label: 'WHY IT WORKS', title: 'HOME' });
  S.tension = scene('tension', spoken2('tension', 0.3), { label: 'THE FIFTH CHORD', title: 'TENSION' });
  S.twist   = scene('twist',   spoken2('twist', 0.3),   { label: 'THE DECEPTIVE CADENCE', title: 'THE TWIST' });
  S.mirror  = scene('mirror',  spoken2('mirror', 0.3),  { label: 'MAJOR VS MINOR', title: 'THE MIRROR' });
  S.lift    = scene('lift',    spoken2('lift', 0.35),   { label: 'THE FOURTH CHORD', title: 'THE LIFT' });
  S.rot0    = scene('rot0',    spoken2('rot0', 0.2, 4), { label: 'START ON THE SAD CHORD', title: 'THE MOOD FLIPS', key: 0, order: [2, 3, 0, 1] });
  S.rot1    = scene('rot1',    3.8, { label: 'YOU HEAR IT IN', title: 'Zombie', sub: 'The Cranberries · 1994 · in E minor', key: -5, order: [2, 3, 0, 1] });
  S.rot2    = scene('rot2',    3.8, { label: 'YOU HEAR IT IN', title: 'Despacito', sub: 'Luis Fonsi · 2017 · in B minor', key: 2, order: [2, 3, 0, 1] });
  S.essence = scene('essence', spoken2('essence', 0.3), { label: 'THE ESSENCE OF MUSIC', title: 'TENSION & RELEASE', accent: true });
  Object.keys(S).forEach(id => { voAt[id] = S[id].t0 + VO_LEAD; });
  voAt.cta = S.essence.t1;
  const DURATION = voAt.cta + (speech('cta') || 2) + 1.4;
  S.essence.t1 = DURATION; // the call to action keeps the essence title on screen

  // absolute time of the nth word of a segment matching exactly (case-sensitive, punctuation stripped)
  const word = (id, w, n = 0, fb = 0) => {
    const sg = seg(id);
    const hits = sg ? sg.words.filter(x => x.w.replace(/[^A-Za-z']/g, '') === w) : [];
    return voAt[id] + (hits[n] ? hits[n].t : fb);
  };

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
  CHORDS.push({ t0: OUTRO_T0, t1: P2_T0, idx: 0, key: 0, outro: true });

  // part 2 chords, landed on the spoken words
  const tC = word('home', 'C', 0, 4.2), tG = voAt.tension - 0.03, tAm = word('twist', 'A', 0, 3.7);
  const mC = word('mirror', 'C', 0, 0.4), mAnd = word('mirror', 'and', 0, 1.5), mA = word('mirror', 'A', 0, 2.0);
  const lF = word('lift', 'F', 0, 0.56), lHome = word('lift', 'home', 0, 3.1);
  const eHome = word('essence', 'home', 0, 2.8), eTension = word('essence', 'tension', 0, 3.7), eBack = word('essence', 'back', 0, 5.7);
  CHORDS.push(
    { t0: P2_T0, t1: tC - 0.03, idx: 0, key: 0, mute: true },
    { t0: tC - 0.03, t1: tG, idx: 0, key: 0 },
    { t0: tG, t1: S.twist.t0 + 0.2, idx: 1, key: 0 },
    { t0: S.twist.t0 + 0.2, t1: tAm - 0.03, idx: 1, key: 0, soft: true },
    { t0: tAm - 0.03, t1: mC - 0.03, idx: 2, key: 0 },
    { t0: mC - 0.03, t1: mA - 0.03, idx: 0, key: 0 },
    { t0: mA - 0.03, t1: lF - 0.03, idx: 2, key: 0, snap: true },
    { t0: lF - 0.03, t1: lHome - 0.03, idx: 3, key: 0 },
    { t0: lHome - 0.03, t1: S.rot0.t0, idx: 0, key: 0 },
  );
  [S.rot0, S.rot1, S.rot2].forEach(sc => {
    const len = (sc.t1 - sc.t0) / 4;
    sc.order.forEach((idx, i) => CHORDS.push({ t0: sc.t0 + i * len, t1: sc.t0 + (i + 1) * len, idx, key: sc.key, pulse: len / 2 }));
  });
  CHORDS.push(
    { t0: S.essence.t0, t1: eHome - 0.03, idx: 3, key: 0, soft: true },
    { t0: eHome - 0.03, t1: eTension - 0.03, idx: 0, key: 0 },
    { t0: eTension - 0.03, t1: eBack - 0.03, idx: 1, key: 0 },
    { t0: eBack - 0.03, t1: DURATION - 0.4, idx: 0, key: 0, outro: true },
  );

  // part 2 overlays
  const RED = '#ff5d6c';
  const TAGS = [
    { t0: word('home', 'home', 0, 3.0), t1: S.rot0.t0, pc: 0, text: 'HOME' },
    { t0: tG, t1: S.rot0.t0, pc: 7, text: 'TENSION' },
    { t0: tAm, t1: S.rot0.t0, pc: 9, text: 'SURPRISE' },
    { t0: word('lift', 'lifts', 0, 0.8), t1: S.rot0.t0, pc: 5, text: 'LIFT' },
    { t0: word('mirror', 'Same', 0, 3.1), t1: S.mirror.t1, pc: 2, text: '2 SHARED NOTES', color: '#ffffff' },
    { t0: eHome, t1: DURATION, pc: 0, text: 'HOME' },
    { t0: eTension, t1: DURATION, pc: 7, text: 'TENSION' },
  ];
  const RINGS = [
    { t0: word('tension', 'B', 0, 2.0), t1: tAm, pcs: [11], color: RED },
    { t0: word('mirror', 'Same', 0, 3.1), t1: S.mirror.t1, pcs: [0, 4], color: '#ffffff' },
  ];
  const ARROWS = [{ t0: word('tension', 'half', 0, 2.8), t1: tAm, from: 11, to: 12, label: 'HALF STEP', color: RED }];
  const GHOSTS = [{ t0: word('twist', 'home', 0, 1.6), t1: tAm + 0.6, idx: 0, key: 0, label: 'EXPECTED' }];
  const MIRROR = { t0: word('mirror', 'mirror', 0, 0.9), t1: S.mirror.t1, flipT0: mAnd, flipT1: mA - 0.03, axis: [2, 8], from: 0, to: 2 };
  const EXTRA_NOTES = [71, 72].map(m => ({ t0: word('tension', 'aching', 0, 4.8), m, dur: 1.3, vel: 0.13 }));

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
  [S.rot1, S.rot2].forEach(sc => pushKey(sc.t0, sc.key));
  pushKey(S.essence.t0, 0);

  // voiceover placement + captions (word timings come from the TTS alignment)
  const VO = [
    ['hook', VO_LEAD], ['scale', HOOK_END + VO_LEAD], ['prog', PROG_T0 + VO_LEAD],
    ...SONGS.map((s, si) => ['song' + si, s.t0 + VO_LEAD]),
    ['outro1', OUTRO_T0 + VO_LEAD], ['outro2', OUTRO2_AT],
    ...Object.keys(S).map(id => [id, voAt[id]]), ['cta', voAt.cta],
  ].map(([id, at]) => ({ id, at }));
  const ENDS = [HOOK_END, SCALE_END, SONG_T0, ...SONGS.map(s => s.t1), OUTRO2_AT, P2_T0,
    ...Object.keys(S).map(id => (id === 'essence' ? voAt.cta : S[id].t1)), DURATION];
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
      text: s ? s.text : (FALLBACK[i] || ''),
      words: s ? s.words.map(w => ({ w: w.w, t: v.at + w.t })) : null,
    };
  });

  const TL = { PROG, SONGS, CHORDS, TEASER, SCALE_NOTES, KEYFRAMES, CAPTIONS, VO, VOICE,
    HOOK_END, SCALE_END, PROG_T0, SONG_T0, OUTRO_T0, OUTRO2_AT, P2_T0, P2, CTA_T0: voAt.cta,
    TAGS, RINGS, ARROWS, GHOSTS, MIRROR, EXTRA_NOTES, DURATION };
  if (typeof module !== 'undefined') module.exports = TL; else root.TL = TL;
})(this);
