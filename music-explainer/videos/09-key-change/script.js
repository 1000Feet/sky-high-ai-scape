// The key change: lifting the whole song one step for the final chorus.
module.exports = {
  slug: 'key-change',
  title: 'The Key Change',
  segments: [
    { id: 'hook',    text: "There's one trick that makes the last chorus hit harder... and it's just one step up." },
    { id: 'what',    text: "Play a chorus in G. Then, without warning, shift everything up a half step, to A flat. That's a key change." },
    { id: 'mirror',  text: "It's the moment in Man in the Mirror, right on the word change..." },
    { id: 'whitney', text: 'the drum hit before the last chorus of I Will Always Love You...' },
    { id: 'beyonce', text: 'and Love on Top, which does it four times in a row.' },
    { id: 'why1',    text: 'So why does it work? By the last chorus, your brain already knows the melody by heart.' },
    { id: 'why2',    text: 'When it suddenly comes back higher, it feels brighter, more urgent... like a second wind.' },
    { id: 'why3',    text: 'Every note moves together, so on the circle, the whole shape simply rotates.' },
    { id: 'prep',    text: "The smoothest key changes sneak in the new key's five chord first, so your ear gets pulled up into it." },
    { id: 'truck',   text: "The sudden kind even has a nickname: the truck driver's gear change." },
    { id: 'cliche',  text: 'Ballads and Eurovision used it so much it became a cliché... and it still works.' },
    { id: 'essence', text: "Same song, one step higher. That's how music turns hope into triumph." },
    { id: 'cta',     text: 'What should I break down next?' },
  ],
  scenes: [
    { id: 'hook', segs: ['hook'], label: 'ONE STEP UP', title: 'THE KEY CHANGE', accent: true, tonic: 7, min: 5.4 },
    { id: 'what', segs: ['what'], label: 'G TO A FLAT', title: 'EVERYTHING MOVES UP', tonic: 7, row: ['I', 'V', 'vi', 'IV'], tail: 1.4 },
    { id: 'mirror', segs: ['mirror'], label: 'YOU HEAR IT IN', title: 'Man in the Mirror', sub: 'Michael Jackson · 1988 · G to Ab', tonic: 7, row: ['I', 'V', 'vi', 'IV'], tail: 2.0 },
    { id: 'whitney', segs: ['whitney'], label: 'YOU HEAR IT IN', title: 'I Will Always Love You', sub: 'Whitney Houston · 1992 · A to B', tonic: 9, row: ['I', 'V', 'vi', 'IV'], tail: 2.2 },
    { id: 'beyonce', segs: ['beyonce'], label: 'YOU HEAR IT IN', title: 'Love on Top', sub: 'Beyoncé · 2011 · up four times', tonic: 0, tail: 3.6 },
    { id: 'why1', segs: ['why1'], label: 'WHY IT WORKS', title: 'YOU KNOW IT BY HEART', tonic: 7, tail: 1.6 },
    { id: 'why2', segs: ['why2'], label: 'WHY IT WORKS', title: 'A SECOND WIND', tonic: 7, tail: 1.6 },
    { id: 'why3', segs: ['why3'], label: 'ON THE CIRCLE', title: 'THE SHAPE ROTATES', tonic: 7, tail: 1.6 },
    { id: 'prep', segs: ['prep'], label: 'THE SMOOTH WAY', title: 'A NEW FIVE CHORD', tonic: 7, tail: 1.4 },
    { id: 'truck', segs: ['truck'], label: "THE TRUCK DRIVER'S", title: 'GEAR CHANGE', tonic: 7, tail: 2.0 },
    { id: 'cliche', segs: ['cliche'], label: 'OVERUSED?', title: 'IT STILL WORKS', tonic: 8, tail: 0.8 },
    { id: 'essence', segs: ['essence', 'cta'], label: 'THE ESSENCE', title: 'HOPE INTO TRIUMPH', accent: true, tonic: 9, gap: 0.5, tail: 1.8 },
  ],
  build(a) {
    const S = id => a.scene(id);
    // I - V - vi - IV in any key
    const NM = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
    const NS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const prog = k => { const N = [2, 4, 6, 7, 9, 11].includes(k % 12) ? NS : NM; return [N[k % 12], N[(k + 7) % 12], N[(k + 9) % 12] + 'm', N[(k + 5) % 12]]; };
    const play = (t0, t1, names, o = {}) => {
      const len = (t1 - t0) / names.length;
      names.forEach((c, i) => a.ch(c, t0 + i * len, t0 + (i + 1) * len, { row: o.rows === false ? null : i % 4, strikes: [{ o: 0, v: 1 }, { o: len / 2, v: 0.55 }], vel: o.vel ?? 0.9, tonic: o.tonic }));
      if (o.drums) for (let i = 0; i < names.length * 2; i++) { a.perc(i % 2 ? 'snare' : 'kick', t0 + i * len / 2, 0.65); a.perc('hat', t0 + i * len / 2 + len / 4, 0.35); }
    };
    // an original little melody (degrees of the major scale), used to show "same tune, higher"
    const TUNE = [[0, 1], [4, 1], [7, 1], [4, 0.5], [5, 0.5], [9, 1], [7, 2]];
    const tune = (t0, tonicMidi, beat = 0.32) => a.melody(TUNE.map(([d, b]) => [tonicMidi + d, b]), t0, beat, { vel: 0.38 });

    // hook: chorus in G, then up to Ab
    a.scale(0.2, 'G', a.T.MAJOR, { popIn: { t0: 0.3, step: 0.15 } });
    play(0.3, 2.9, prog(7), { vel: 0.6 });
    a.scale(2.9, 'Ab');
    play(2.9, S('hook').t1, prog(8), { vel: 0.75, tonic: 8 });

    // what
    a.scale(S('what').t0, 'G');
    const tUp = a.w('what', 'up');
    play(a.w('what', 'G'), tUp, [...prog(7), ...prog(7)].slice(0, 6));
    a.scale(tUp, 'Ab');
    play(tUp, S('what').t1, prog(8), { tonic: 8 });
    a.arc('G', 'Ab', tUp, S('what').t1, { steps: 1, color: '#ffcf5a', label: 'HALF STEP UP', labelR: 70 });

    // man in the mirror: G -> Ab on "change"
    const tCh = a.w('mirror', 'change');
    a.scale(S('mirror').t0, 'G');
    play(S('mirror').t0 + 0.05, tCh, prog(7));
    a.scale(tCh, 'Ab');
    play(tCh, S('mirror').t1, prog(8), { tonic: 8, drums: true });
    a.perc('kick', tCh, 1.2); a.perc('snare', tCh, 1);

    // whitney: A -> B after the drum hit
    const tHit = a.w('whitney', 'hit');
    a.scale(S('whitney').t0, 'A');
    play(S('whitney').t0 + 0.05, tHit + 0.5, prog(9).slice(0, 3), { tonic: 9 });
    a.perc('kick', tHit, 1.3); a.perc('snare', tHit + 0.25, 1.1); a.perc('kick', tHit + 0.5, 1.2);
    a.scale(tHit + 0.5, 'B');
    play(tHit + 0.5, S('whitney').t1, prog(11), { tonic: 11, drums: true });

    // love on top: C, Db, D, Eb, E (I and V in each key)
    const b0 = a.w('beyonce', 'four') - 0.2, bl = (S('beyonce').t1 - b0) / 5;
    a.scale(S('beyonce').t0, 'C');
    play(S('beyonce').t0 + 0.05, b0, prog(0).slice(0, 2), { rows: false, tonic: 0 });
    [0, 1, 2, 3, 4].forEach(k => {
      a.scale(b0 + k * bl, NM[k]);
      play(b0 + k * bl, b0 + (k + 1) * bl, [NM[k], NM[(k + 7) % 12]], { rows: false, tonic: k, drums: true });
      if (k) a.big(`+${k}`, b0 + k * bl, b0 + (k + 1) * bl, { y: 455, size: 64, family: 'DM Mono', weight: 500, color: '#ffcf5a' });
    });

    // why1/2: the same tune in G, then higher in Ab
    a.scale(S('why1').t0, 'G');
    a.ch('G', S('why1').t0 + 0.1, S('why1').t1, { bass: 'G2', vel: 0.55 });
    tune(a.end('why1') - 1.4, 67);
    a.scale(a.w('why2', 'higher'), 'Ab');
    a.ch('Ab', a.w('why2', 'higher') - 0.04, S('why2').t1, { bass: 'Ab2', vel: 0.65, tonic: 8 });
    tune(a.w('why2', 'higher'), 68);
    a.big('+1', a.w('why2', 'higher'), S('why2').t1, { y: 455, size: 64, family: 'DM Mono', weight: 500, color: '#ffcf5a' });

    // why3: the chord shape rotates one step
    a.scale(S('why3').t0, 'G');
    const tRot = a.w('why3', 'rotates');
    a.ch('G', S('why3').t0 + 0.1, tRot - 0.04, { notes: ['G3', 'B3', 'D4'], bass: 'G2' });
    a.scale(tRot, 'Ab');
    a.ch('Ab', tRot - 0.04, S('why3').t1, { notes: ['Ab3', 'C4', 'Eb4'], bass: 'Ab2', tonic: 8 });
    a.poly(['G', 'B', 'D'], tRot, S('why3').t1, { color: '#ffffff', alpha: 0.4 });

    // prep: G -> Eb7 (five of Ab) -> Ab
    a.scale(S('prep').t0, 'G');
    const tFive = a.w('prep', 'five'), tPull = a.w('prep', 'pulled');
    a.ch('G', S('prep').t0 + 0.1, tFive - 0.04, { notes: ['G3', 'B3', 'D4'], bass: 'G2' });
    a.ch('Eb7', tFive - 0.04, tPull - 0.04, { notes: ['G3', 'Bb3', 'Db4', 'Eb4'], bass: 'Eb2', tonic: 8 });
    a.tag('Eb', tFive, tPull + 0.6, 'NEW FIVE', { color: '#45d6c8' });
    a.scale(tPull, 'Ab');
    a.ch('Ab', tPull - 0.04, S('prep').t1, { notes: ['Ab3', 'C4', 'Eb4'], bass: 'Ab2', tonic: 8 });
    a.tag('Ab', tPull, S('prep').t1, 'NEW HOME', { color: '#ff7a93' });

    // truck driver: abrupt jump with a drum fill
    const tG = a.w('truck', 'gear');
    a.scale(S('truck').t0, 'G');
    play(S('truck').t0 + 0.05, tG, prog(7), { drums: true });
    for (let i = 0; i < 4; i++) a.perc('snare', tG - 0.4 + i * 0.1, 0.9);
    a.scale(tG, 'Ab');
    play(tG, S('truck').t1, prog(8), { tonic: 8, drums: true });

    // cliche: one more lift, Ab -> A
    a.scale(S('cliche').t0, 'Ab');
    const tStill = a.w('cliche', 'still');
    play(S('cliche').t0 + 0.05, tStill, [...prog(8), ...prog(8)], { tonic: 8 });
    a.scale(tStill, 'A');
    play(tStill, S('cliche').t1, prog(9), { tonic: 9, drums: true });

    // essence: the triumphant final chord
    a.scale(S('essence').t0, 'A');
    const e0 = S('essence').t0 + 0.1;
    play(e0, e0 + 3.2, prog(9), { tonic: 9, drums: true });
    a.ch('A', e0 + 3.2, S('essence').t1 - 0.3, { notes: ['A3', 'C#4', 'E4', 'A4'], bass: 'A2', tonic: 9 });
    a.perc('kick', e0 + 3.2, 1.1);
    a.cta(a.at('cta') + 0.6, 'Leave a song in the comments');
  },
};
