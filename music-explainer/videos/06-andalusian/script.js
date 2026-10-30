// The Andalusian cadence: Am - G - F - E, a falling bass and one bright surprise.
module.exports = {
  slug: 'andalusian-cadence',
  title: 'The Andalusian Cadence',
  segments: [
    { id: 'hook',     text: 'Four chords, falling like a staircase... from flamenco guitar all the way to Ray Charles.' },
    { id: 'what',     text: "A minor, G, F, E. It's called the Andalusian cadence, after the flamenco of southern Spain." },
    { id: 'jack',     text: "It's Hit the Road Jack..." },
    { id: 'runaway',  text: 'Runaway...' },
    { id: 'sultans',  text: 'and Sultans of Swing, moved down to D minor.' },
    { id: 'why1',     text: 'So why does it pull you in? Listen to the bass: A, G, F, E. Four steps straight down.' },
    { id: 'why2',     text: 'Composers have used this falling line for four hundred years. They called it the lament bass.' },
    { id: 'why3',     text: 'But the real magic is the last chord. In A minor, you would expect E minor...' },
    { id: 'why4',     text: "Instead, it's E major. The G becomes G sharp, a half step below home." },
    { id: 'why5',     text: 'That one note pulls you straight back to A minor... and the loop starts again.' },
    { id: 'flamenco', text: 'In flamenco, players stop on the E instead... and suddenly, it sounds like Spain.' },
    { id: 'essence',  text: "A fall, a bright surprise, and a pull back home. That's why it never gets old." },
    { id: 'cta',      text: 'What should I break down next?' },
  ],
  scenes: [
    { id: 'hook', segs: ['hook'], label: 'FOUR CHORDS', title: 'THE ANDALUSIAN CADENCE', accent: true, tonic: 9, row: ['i', 'bVII', 'bVI', 'V'], min: 5.4 },
    { id: 'what', segs: ['what'], label: 'A MINOR, G, F, E', title: 'FALLING CHORDS', tonic: 9, row: ['i', 'bVII', 'bVI', 'V'], tail: 0.6 },
    { id: 'jack', segs: ['jack'], label: 'YOU HEAR IT IN', title: 'Hit the Road Jack', sub: 'Ray Charles · 1961', tonic: 9, row: ['i', 'bVII', 'bVI', 'V'], min: 5.0 },
    { id: 'runaway', segs: ['runaway'], label: 'YOU HEAR IT IN', title: 'Runaway', sub: 'Del Shannon · 1961', tonic: 9, row: ['i', 'bVII', 'bVI', 'V'], min: 5.0 },
    { id: 'sultans', segs: ['sultans'], label: 'YOU HEAR IT IN', title: 'Sultans of Swing', sub: 'Dire Straits · 1978 · in D minor', tonic: 2, row: ['i', 'bVII', 'bVI', 'V'], min: 5.6 },
    { id: 'why1', segs: ['why1'], label: 'WHY IT WORKS', title: 'FOUR STEPS DOWN', tonic: 9, tail: 0.6 },
    { id: 'why2', segs: ['why2'], label: 'SINCE THE 1600s', title: 'THE LAMENT BASS', tonic: 9, tail: 0.6 },
    { id: 'why3', segs: ['why3'], label: 'THE LAST CHORD', title: 'THE SURPRISE', tonic: 9, tail: 0.2 },
    { id: 'why4', segs: ['why4'], label: 'THE LAST CHORD', title: 'THE SURPRISE', tonic: 9, tail: 0.5 },
    { id: 'why5', segs: ['why5'], label: 'THE LEADING TONE', title: 'PULLED BACK HOME', tonic: 9, tail: 1.6 },
    { id: 'flamenco', segs: ['flamenco'], label: 'THE PHRYGIAN SOUND', title: 'STOP ON E', tonic: 9, tail: 2.2 },
    { id: 'essence', segs: ['essence', 'cta'], label: 'THE ESSENCE', title: 'FALL AND RETURN', accent: true, tonic: 9, gap: 0.5, tail: 1.8 },
  ],
  build(a) {
    const S = id => a.scene(id);
    const PROG = ['Am', 'G', 'F', 'E'], BASS = ['A2', 'G2', 'F2', 'E2'];
    const rows = [0, 1, 2, 3];
    const loop = (t0, t1, names, bass, o = {}) => {
      const n = names.length, len = (t1 - t0) / n;
      names.forEach((c, i) => a.ch(c, t0 + i * len, t0 + (i + 1) * len, { row: i % 4, bass: bass[i % bass.length], strikes: o.strikes === 'pulse' ? [{ o: 0, v: 1 }, { o: len / 2, v: 0.55 }] : o.strikes, vel: o.vel ?? 0.9, notes: o.notes ? o.notes[i % 4] : undefined }));
      if (o.drums) for (let i = 0; i < n * 2; i++) { a.perc(i % 2 ? 'snare' : 'kick', t0 + i * len / 2, 0.6); a.perc('hat', t0 + i * len / 2 + len / 4, 0.35); }
    };

    a.scale(0.2, 'A', a.T.MINOR, { popIn: { t0: 0.3, step: 0.25 } });
    loop(0.3, S('hook').t1, PROG, BASS, { vel: 0.6 });

    // what: chords on their spoken names
    const tw = [a.w('what', 'A'), a.w('what', 'G'), a.w('what', 'F'), a.w('what', 'E')].map(t => t - 0.04);
    PROG.forEach((c, i) => a.ch(c, tw[i], i < 3 ? tw[i + 1] : S('what').t1, { row: i, bass: BASS[i] }));

    // songs: the loop with a beat
    loop(S('jack').t0 + 0.05, S('jack').t1, [...PROG, ...PROG], BASS, { strikes: 'pulse', drums: true });
    loop(S('runaway').t0 + 0.05, S('runaway').t1, [...PROG, ...PROG], BASS, { strikes: 'pulse', drums: true });
    a.scale(S('sultans').t0, 'D', a.T.MINOR);
    loop(S('sultans').t0 + 0.05, S('sultans').t1, ['Dm', 'C', 'Bb', 'A', 'Dm', 'C', 'Bb', 'A'], ['D3', 'C3', 'Bb2', 'A2'], { strikes: 'pulse', drums: true });

    // why1: the bass falls A G F E
    a.scale(S('why1').t0, 'A', a.T.MINOR);
    const bw = ['A', 'G', 'F', 'E'].map(n => a.w('why1', n) - 0.04);
    PROG.forEach((c, i) => a.ch(c, bw[i], i < 3 ? bw[i + 1] : S('why1').t1, { bass: BASS[i] }));
    a.walker(BASS.map((n, i) => [bw[i], n[0]]), { t1: S('why2').t1, dr: 34, label: 'BASS', labelDr: 82 });
    // why2: the line keeps falling, slowly
    const l0 = S('why2').t0, ll = (S('why2').t1 - l0) / 4;
    PROG.forEach((c, i) => a.ch(c, l0 + i * ll, l0 + (i + 1) * ll, { bass: BASS[i], vel: 0.7 }));
    a.walker(BASS.map((n, i) => [l0 + i * ll, n[0]]), { t1: S('why2').t1, dr: 34, label: 'BASS', labelDr: 82 });

    // why3/4: expected E minor, got E major (G -> G#)
    a.ch('F', S('why3').t0, a.w('why4', 'E') - 0.04, { bass: 'F2', vel: 0.7 });
    a.ghost('Em', a.w('why3', 'expect'), a.w('why4', 'E') + 0.4, { label: 'EXPECTED?', ly: 95 });
    const tE = a.w('why4', 'E') - 0.04;
    a.ch('E', tE, a.w('why5', 'pulls') - 0.04, { bass: 'E2' });
    const tSharp = a.w('why4', 'sharp');
    a.ring(['G#'], a.w('why4', 'G', 1), S('why4').t1 + 1.2, { color: '#ff5d6c' });
    a.tag('G#', tSharp, S('why5').t1, 'G SHARP', { color: '#ff5d6c' });
    a.arc('G#', 'A', a.w('why4', 'home'), S('why5').t1, { steps: 1, color: '#45d6c8', dr: 30, label: 'HALF STEP' });
    a.note('G#4', tSharp, 0.8, { vel: 0.35 });
    // why5: back to A minor, loop again
    const tLoop = a.w('why5', 'loop');
    a.ch('Am', a.w('why5', 'pulls') - 0.04, tLoop, { bass: 'A2' });
    a.note('A4', a.w('why5', 'pulls'), 1.0, { vel: 0.35 });
    loop(tLoop, S('why5').t1, PROG, BASS, { vel: 0.8 });

    // flamenco: rasgueado strums, stopping on E
    const f0 = S('flamenco').t0 + 0.05, fE = a.w('flamenco', 'E') - 0.04;
    const ras = [0, 0.07, 0.14, 0.21].map((o, i) => ({ o, v: 1 - i * 0.15 }));
    const fl = (fE - f0) / 3;
    ['Am', 'G', 'F'].forEach((c, i) => a.ch(c, f0 + i * fl, f0 + (i + 1) * fl, { bass: BASS[i], strikes: ras, row: i }));
    a.ch('E', fE, S('flamenco').t1, { bass: 'E2', strikes: [...ras, ...ras.map(r => ({ o: r.o + 0.8, v: r.v * 0.8 })), ...ras.map(r => ({ o: r.o + 1.6, v: r.v * 0.7 }))] });
    a.tag('E', a.w('flamenco', 'Spain'), S('flamenco').t1, 'HOME?', { color: '#45d6c8' });

    // essence: once more, resolving to A minor
    const e0 = S('essence').t0 + 0.1, el = 0.8;
    PROG.forEach((c, i) => a.ch(c, e0 + i * el, e0 + (i + 1) * el, { bass: BASS[i] }));
    a.ch('Am', e0 + 4 * el, S('essence').t1 - 0.3, { notes: ['A3', 'C4', 'E4', 'A4'], bass: 'A2' });
    a.tag('A', e0 + 4 * el, S('essence').t1, 'HOME');
    a.cta(a.at('cta') + 0.6, 'Leave a song in the comments');
  },
};
