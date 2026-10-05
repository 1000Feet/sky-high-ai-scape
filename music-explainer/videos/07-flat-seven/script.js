// The flat-seven chord (bVII): rock's favourite borrowed chord, and why it sounds so open.
module.exports = {
  slug: 'flat-seven',
  title: 'The Flat-Seven Chord',
  segments: [
    { id: 'hook',     text: "There's one chord that makes rock sound like rock... and it isn't even in the key." },
    { id: 'what',     text: 'In C major, every chord is built from these seven notes. But rock loves this one: B flat major.' },
    { id: 'prog',     text: 'C, B flat, F, C. Home, a step down, and back again.' },
    { id: 'sweet',    text: "It's Sweet Child O' Mine..." },
    { id: 'jude',     text: 'the endless coda of Hey Jude...' },
    { id: 'sympathy', text: 'and Sympathy for the Devil.' },
    { id: 'why1',     text: 'So why does it sound so open? In a normal major key, the seventh note, B, sits a half step below home.' },
    { id: 'why2',     text: 'It pulls hard, like a question waiting for an answer.' },
    { id: 'why3',     text: 'Lower it to B flat, and the pull disappears. Home is now a whole step away, and the music relaxes.' },
    { id: 'why4',     text: 'That scale even has a name: Mixolydian. A major scale with a flat seven.' },
    { id: 'amen',     text: 'Now listen to the roots: B flat, F, C.' },
    { id: 'amen2',    text: 'Each move is the same as the Amen at the end of a hymn. Two amens in a row.' },
    { id: 'essence',  text: "No urgent pull, no question. Just a big, open landing. That's why stadiums sing along." },
    { id: 'cta',      text: 'What should I break down next?' },
  ],
  scenes: [
    { id: 'hook', segs: ['hook'], label: 'ROCK’S SECRET CHORD', title: 'THE FLAT SEVEN', accent: true, tonic: 0, min: 5.0 },
    { id: 'what', segs: ['what'], label: 'NOT IN THE KEY', title: 'B FLAT MAJOR', tonic: 0, tail: 0.6 },
    { id: 'prog', segs: ['prog'], label: 'THE PROGRESSION', title: 'I – bVII – IV – I', tonic: 0, row: ['I', 'bVII', 'IV', 'I'], tail: 1.0 },
    { id: 'sweet', segs: ['sweet'], label: 'YOU HEAR IT IN', title: "Sweet Child O' Mine", sub: "Guns N' Roses · 1987 · in D", tonic: 2, row: ['I', 'bVII', 'IV', 'I'], min: 5.2 },
    { id: 'jude', segs: ['jude'], label: 'YOU HEAR IT IN', title: 'Hey Jude (coda)', sub: 'The Beatles · 1968 · in F', tonic: 5, row: ['I', 'bVII', 'IV', 'I'], min: 5.2 },
    { id: 'sympathy', segs: ['sympathy'], label: 'YOU HEAR IT IN', title: 'Sympathy for the Devil', sub: 'The Rolling Stones · 1968 · in E', tonic: 4, row: ['I', 'bVII', 'IV', 'I'], min: 5.2 },
    { id: 'why1', segs: ['why1'], label: 'WHY IT WORKS', title: 'THE LEADING TONE', tonic: 0, tail: 0.3 },
    { id: 'why2', segs: ['why2'], label: 'WHY IT WORKS', title: 'A QUESTION', tonic: 0, tail: 0.5 },
    { id: 'why3', segs: ['why3'], label: 'WHY IT WORKS', title: 'NO MORE PULL', tonic: 0, tail: 0.8 },
    { id: 'why4', segs: ['why4'], label: 'A MAJOR SCALE WITH b7', title: 'MIXOLYDIAN', tonic: 0, tail: 0.8 },
    { id: 'amen', segs: ['amen', 'amen2'], label: 'THE PLAGAL CADENCE', title: 'TWO AMENS', tonic: 0, gap: 0.4, tail: 1.0 },
    { id: 'essence', segs: ['essence', 'cta'], label: 'THE ESSENCE', title: 'AN OPEN LANDING', accent: true, tonic: 0, gap: 0.5, tail: 1.8 },
  ],
  build(a) {
    const S = id => a.scene(id);
    const MIXO = [0, 2, 4, 5, 7, 9, 10];
    const loop = (t0, t1, names, o = {}) => {
      const len = (t1 - t0) / names.length;
      names.forEach((c, i) => a.ch(c, t0 + i * len, t0 + (i + 1) * len, { row: i % 4, strikes: [{ o: 0, v: 1 }, { o: len * 0.375, v: 0.6 }, { o: len * 0.75, v: 0.7 }], vel: o.vel ?? 1 }));
      if (o.drums) for (let i = 0; i < names.length * 4; i++) { const t = t0 + i * len / 4; a.perc(i % 4 === 2 ? 'snare' : i % 4 === 0 ? 'kick' : 'hat', t, i % 4 === 1 || i % 4 === 3 ? 0.35 : 0.7); }
    };

    // hook: the vamp
    a.scale(0.2, 'C', a.T.MAJOR, { popIn: { t0: 0.3, step: 0.2 } });
    loop(0.3, S('hook').t1, ['C', 'Bb', 'F', 'C'], { vel: 0.7 });

    // what: the scale, then Bb sits outside it
    const tBb = a.w('what', 'B');
    a.ch('Bb', tBb - 0.04, S('what').t1, { notes: ['Bb3', 'D4', 'F4'], bass: 'Bb2' });
    a.ring(['Bb'], tBb, S('what').t1, { color: '#ff5d6c' });
    a.tag('Bb', tBb + 0.3, S('what').t1, 'OUTSIDE THE KEY', { color: '#ff5d6c' });

    // prog: chords on their spoken names
    const tw = [a.w('prog', 'C'), a.w('prog', 'B'), a.w('prog', 'F'), a.w('prog', 'C', 1)].map(t => t - 0.04);
    ['C', 'Bb', 'F', 'C'].forEach((c, i) => a.ch(c, tw[i], i < 3 ? tw[i + 1] : S('prog').t1, { row: i }));

    // songs
    a.scale(S('sweet').t0, 'D'); loop(S('sweet').t0 + 0.05, S('sweet').t1, ['D', 'C', 'G', 'D'], { drums: true });
    a.scale(S('jude').t0, 'F'); loop(S('jude').t0 + 0.05, S('jude').t1, ['F', 'Eb', 'Bb', 'F'], { drums: true });
    a.scale(S('sympathy').t0, 'E'); loop(S('sympathy').t0 + 0.05, S('sympathy').t1, ['E', 'D', 'A', 'E'], { drums: true });

    // why1/2: B is a half step below home and pulls
    const RED = '#ff5d6c', TEAL = '#45d6c8';
    a.scale(S('why1').t0, 'C');
    const tB = a.w('why1', 'B');
    a.ch('G', S('why1').t0 + 0.1, a.w('why3', 'Lower') - 0.04, { notes: ['B3', 'D4', 'G4'], bass: 'G2', vel: 0.75 });
    a.ring(['B'], tB, S('why2').t1, { color: RED });
    a.arc('B', 'C', a.w('why1', 'half'), S('why2').t1, { steps: 1, color: RED, label: 'HALF STEP', labelR: 70 });
    a.tag('B', a.w('why1', 'seventh'), S('why2').t1, 'LEADING TONE', { color: RED });
    a.note('B4', a.w('why2', 'pulls'), 2.4, { vel: 0.38 });

    // why3: lower it to Bb - whole step, relaxed
    const tLow = a.w('why3', 'B');
    a.ch('Bb', tLow - 0.04, a.w('why3', 'relaxes') - 0.04, { notes: ['Bb3', 'D4', 'F4'], bass: 'Bb2' });
    a.arc('B', 'Bb', tLow - 0.3, tLow + 0.8, { steps: -1, color: '#ffcf5a', dr: 30 });
    a.ring(['Bb'], tLow, S('why3').t1, { color: TEAL });
    a.arc('Bb', 'C', a.w('why3', 'whole'), S('why3').t1, { steps: 2, color: TEAL, label: 'WHOLE STEP', labelR: 70 });
    a.ch('C', a.w('why3', 'relaxes') - 0.04, S('why3').t1, { notes: ['C4', 'E4', 'G4'], bass: 'C3' });

    // why4: the Mixolydian scale
    a.scale(a.w('why4', 'Mixolydian'), 'C', MIXO);
    a.tag('Bb', a.w('why4', 'flat'), S('why4').t1, 'FLAT SEVEN', { color: '#8d98ff' });
    MIXO.concat([12]).forEach((d, i) => a.note(60 + d, a.w('why4', 'Mixolydian') + 0.2 + i * 0.22, 0.4, { vel: 0.26 }));

    // amen: Bb -> F -> C, each a plagal (IV - I) move
    const ta = [a.w('amen', 'B'), a.w('amen', 'F'), a.w('amen', 'C')].map(t => t - 0.04);
    a.ch('Bb', ta[0], ta[1], { notes: ['Bb3', 'D4', 'F4'], bass: 'Bb2', row: null });
    a.ch('F', ta[1], ta[2], { notes: ['A3', 'C4', 'F4'], bass: 'F2' });
    a.ch('C', ta[2], a.w('amen2', 'Amen') - 0.04, { notes: ['G3', 'C4', 'E4'], bass: 'C3' });
    a.walker([[ta[0], 'Bb'], [ta[1], 'F'], [ta[2], 'C']], { t1: S('amen').t1, dr: 34, label: 'ROOT', labelDr: 82 });
    const tAm = a.w('amen2', 'Amen') - 0.04, tTwo = a.w('amen2', 'amens') - 0.6;
    a.ch('F', tAm, tAm + 0.9, { notes: ['A3', 'C4', 'F4'], bass: 'F2' });
    a.ch('C', tAm + 0.9, tTwo, { notes: ['G3', 'C4', 'E4'], bass: 'C3' });
    a.ch('Bb', tTwo, tTwo + 0.8, { notes: ['Bb3', 'D4', 'F4'], bass: 'Bb2' });
    a.ch('F', tTwo + 0.8, tTwo + 1.6, { notes: ['A3', 'C4', 'F4'], bass: 'F2' });
    a.ch('C', tTwo + 1.6, S('amen').t1, { notes: ['G3', 'C4', 'E4'], bass: 'C3' });
    a.line('Bb', 'F', tTwo, S('amen').t1, { arrow: true, color: '#ffcf5a', r: 220 });
    a.line('F', 'C', tTwo + 0.8, S('amen').t1, { arrow: true, color: '#ffcf5a', r: 220 });
    a.big('AMEN', tAm, tTwo, { y: 455, size: 56, family: 'DM Mono', weight: 500, color: '#ffcf5a' });
    a.big('AMEN  +  AMEN', tTwo, S('amen').t1, { y: 455, size: 56, family: 'DM Mono', weight: 500, color: '#ffcf5a' });

    // essence: the big vamp, landing on C
    const e0 = S('essence').t0 + 0.1;
    loop(e0, e0 + 3.6, ['C', 'Bb', 'F', 'C'], { drums: true, vel: 0.9 });
    a.ch('C', e0 + 3.6, S('essence').t1 - 0.3, { notes: ['C4', 'E4', 'G4', 'C5'], bass: 'C2' });
    a.perc('kick', e0 + 3.6, 1); a.perc('snare', e0 + 3.6, 0.6);
    a.cta(a.at('cta') + 0.6, 'Leave a song in the comments');
  },
};
