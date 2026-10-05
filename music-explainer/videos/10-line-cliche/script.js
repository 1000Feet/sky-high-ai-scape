// The line cliché: one voice slides down by half steps while the chord holds still.
module.exports = {
  slug: 'line-cliche',
  title: 'The Line Cliché',
  segments: [
    { id: 'hook',      text: "One note, sliding down half a step at a time. That's all it takes to make a chord melt." },
    { id: 'what',      text: 'Hold a C chord. Now let just the top note slide down: C, B, B flat, A.' },
    { id: 'name',      text: 'Jazz musicians call it a line cliché.' },
    { id: 'something', text: "It's the opening of Something, by the Beatles..." },
    { id: 'stairway',  text: 'the intro of Stairway to Heaven, with the line in the bass...' },
    { id: 'valentine', text: 'and My Funny Valentine, where it turns a minor chord into pure longing.' },
    { id: 'why1',      text: 'So why does it move us? A half step is the smallest distance in Western music.' },
    { id: 'why2',      text: 'Your ear locks onto that one moving line, like following a single thread.' },
    { id: 'why3a',     text: 'Meanwhile, the rest of the chord stays put.' },
    { id: 'why3',      text: 'Same chord... but its color keeps shifting: bright, dreamy, bluesy, bittersweet.' },
    { id: 'lament',    text: "Back in 1689, Purcell built Dido's Lament on a falling line just like it." },
    { id: 'lament2',   text: 'It sounds like a sigh... like time slipping away.' },
    { id: 'essence',   text: 'The smallest possible move, one half step at a time... and a single chord tells a whole story.' },
    { id: 'cta',       text: 'What should I break down next?' },
  ],
  scenes: [
    { id: 'hook', segs: ['hook'], label: 'ONE MOVING NOTE', title: 'THE LINE CLICHÉ', accent: true, tonic: 0, min: 5.6 },
    { id: 'what', segs: ['what', 'name'], label: 'C, B, B FLAT, A', title: 'ONE VOICE SLIDES', tonic: 0, gap: 0.5, tail: 0.6 },
    { id: 'something', segs: ['something'], label: 'YOU HEAR IT IN', title: 'Something', sub: 'The Beatles · 1969 · in C', tonic: 0, tail: 2.8 },
    { id: 'stairway', segs: ['stairway'], label: 'YOU HEAR IT IN', title: 'Stairway to Heaven', sub: 'Led Zeppelin · 1971 · in A minor', tonic: 9, tail: 2.6 },
    { id: 'valentine', segs: ['valentine'], label: 'YOU HEAR IT IN', title: 'My Funny Valentine', sub: 'Rodgers & Hart · 1937 · in C minor', tonic: 0, tail: 2.6 },
    { id: 'why1', segs: ['why1'], label: 'WHY IT WORKS', title: 'THE SMALLEST STEP', tonic: 0, tail: 0.5 },
    { id: 'why2', segs: ['why2'], label: 'WHY IT WORKS', title: 'A SINGLE THREAD', tonic: 0, tail: 0.6 },
    { id: 'why3', segs: ['why3a', 'why3'], gap: 0.25, label: 'WHY IT WORKS', title: 'SHIFTING COLOR', tonic: 0, tail: 0.9 },
    { id: 'lament', segs: ['lament', 'lament2'], label: 'HENRY PURCELL · 1689', title: "DIDO'S LAMENT", tonic: 7, gap: 0.4, tail: 1.2 },
    { id: 'essence', segs: ['essence', 'cta'], label: 'THE ESSENCE', title: 'A WHOLE STORY', accent: true, tonic: 0, gap: 0.5, tail: 1.8 },
  ],
  build(a) {
    const S = id => a.scene(id);
    const CL = [['C', ['C4', 'E4', 'G4', 'C5']], ['Cmaj7', ['C4', 'E4', 'G4', 'B4']], ['C7', ['C4', 'E4', 'G4', 'Bb4']], ['C6', ['C4', 'E4', 'G4', 'A4']]];
    const LINE = ['C', 'B', 'Bb', 'A'];
    const cliche = (t, i, o = {}) => a.ch(CL[i][0], t[i], t[i + 1], { notes: CL[i][1], bass: 'C3', vel: o.vel ?? 0.9 });

    // hook: the cliché, slowly
    a.scale(0.2, 'C', a.T.MAJOR, { popIn: { t0: 0.3, step: 0.12 } });
    const hl = (S('hook').t1 - 0.4) / 4, ht = [0.4, 0.4 + hl, 0.4 + 2 * hl, 0.4 + 3 * hl, S('hook').t1];
    [0, 1, 2, 3].forEach(i => cliche(ht, i, { vel: 0.7 }));
    a.walker(LINE.map((p, i) => [ht[i], p]), { t1: S('hook').t1, dr: -40, color: '#ffcf5a' });

    // what: each step on its spoken name
    const tw = [a.w('what', 'C', 1), a.w('what', 'B'), a.w('what', 'B', 1), a.w('what', 'A'), S('what').t1].map(t => t - 0.04);
    a.ch('C', S('what').t0 + 0.1, tw[0], { notes: ['C4', 'E4', 'G4', 'C5'], bass: 'C3', vel: 0.8 });
    [0, 1, 2, 3].forEach(i => cliche(tw, i));
    a.walker(LINE.map((p, i) => [tw[i], p]), { t1: S('what').t1, dr: -40, color: '#ffcf5a', label: 'TOP NOTE', labelDr: -46 });
    [1, 2, 3].forEach(i => a.arc(LINE[i - 1], LINE[i], tw[i], tw[i] + 1.2, { steps: -1, color: '#ffcf5a', dr: 30 }));

    // something: C Cmaj7 C7 F
    const s0 = a.end('something') + 0.05, sl = (S('something').t1 - s0) / 4;
    const st = [s0, s0 + sl, s0 + 2 * sl, s0 + 3 * sl, S('something').t1];
    a.ch('C', S('something').t0 + 0.05, s0, { notes: ['C4', 'E4', 'G4', 'C5'], bass: 'C3', vel: 0.6 });
    [0, 1, 2].forEach(i => cliche(st, i));
    a.ch('F', st[3], st[4], { notes: ['C4', 'F4', 'A4'], bass: 'F2' });
    a.walker(LINE.map((p, i) => [st[i], p]), { t1: S('something').t1, dr: -40, color: '#ffcf5a' });

    // stairway: the line is in the bass, A G# G F# F
    a.scale(S('stairway').t0, 'A', a.T.MINOR);
    const SW = [['Am', ['A3', 'C4', 'E4'], 'A2'], ['Am/G#', ['A3', 'C4', 'E4'], 'G#2'], ['C/G', ['G3', 'C4', 'E4'], 'G2'], ['D/F#', ['F#3', 'A3', 'D4'], 'F#2'], ['Fmaj7', ['E3', 'A3', 'C4'], 'F2']];
    const w0 = a.at('stairway') + 0.3, wl = (S('stairway').t1 - w0) / 5;
    SW.forEach(([c, n, b], i) => a.ch(c, w0 + i * wl, w0 + (i + 1) * wl, { notes: n, bass: b, strikes: [0, 0.18, 0.36, 0.54].map((k, j) => ({ o: wl * k, v: j ? 0.5 : 1 })) }));
    a.walker(SW.map(([, , b], i) => [w0 + i * wl, b.replace(/\d/, '')]), { t1: S('stairway').t1, dr: 34, label: 'BASS', labelDr: 82 });

    // valentine: Cm, Cm(maj7), Cm7, Cm6
    a.scale(S('valentine').t0, 'C', a.T.MINOR);
    const VL = [['Cm', ['C4', 'Eb4', 'G4', 'C5'], 'Cm'], ['CmMaj7', ['C4', 'Eb4', 'G4', 'B4'], 'Cm(maj7)'], ['Cm7', ['C4', 'Eb4', 'G4', 'Bb4'], 'Cm7'], ['Cm6', ['C4', 'Eb4', 'G4', 'A4'], 'Cm6']];
    const v0 = a.w('valentine', 'turns') - 0.04, vl = (S('valentine').t1 - v0) / 4;
    a.ch('Cm', S('valentine').t0 + 0.05, v0, { notes: ['C4', 'Eb4', 'G4', 'C5'], bass: 'C3', vel: 0.6 });
    VL.forEach(([c, n, l], i) => a.ch(c, v0 + i * vl, v0 + (i + 1) * vl, { notes: n, bass: 'C3', label: l }));
    a.walker(LINE.map((p, i) => [v0 + i * vl, p]), { t1: S('valentine').t1, dr: -40, color: '#ffcf5a' });

    // why1: the half step
    a.scale(S('why1').t0, 'C');
    const tH = a.w('why1', 'half');
    a.ch('Cmaj7', S('why1').t0 + 0.1, S('why1').t1, { notes: CL[1][1], bass: 'C3', vel: 0.55 });
    a.arc('B', 'Bb', tH, S('why1').t1, { steps: -1, color: '#ffcf5a', label: 'SMALLEST STEP', labelR: 165 });
    a.note('B4', tH, 0.6, { vel: 0.35 }); a.note('Bb4', tH + 0.6, 1.0, { vel: 0.35 });
    // why2: the thread keeps moving, round and round
    const t0 = S('why2').t0 + 0.05, tl = (S('why2').t1 - t0) / 4, tt = [0, 1, 2, 3, 4].map(i => t0 + i * tl);
    [0, 1, 2, 3].forEach(i => cliche(tt, i, { vel: 0.75 }));
    a.walker(LINE.map((p, i) => [tt[i], p]), { t1: S('why2').t1, dr: -40, color: '#ffcf5a', label: 'THREAD', labelDr: -46 });
    // why3: four colours of one chord
    const cw = ['bright', 'dreamy', 'bluesy', 'bittersweet'].map(w => a.w('why3', w) - 0.04);
    a.ch('C', S('why3').t0 + 0.1, cw[0], { notes: CL[0][1], bass: 'C3', vel: 0.6 });
    [0, 1, 2, 3].forEach(i => a.ch(CL[i][0], cw[i], i < 3 ? cw[i + 1] : S('why3').t1, { notes: CL[i][1], bass: 'C3' }));
    ['BRIGHT', 'DREAMY', 'BLUESY', 'BITTERSWEET'].forEach((w, i) => a.tag(LINE[i], cw[i], i < 3 ? cw[i + 1] : S('why3').t1, w, { color: '#ffcf5a' }));

    // lament: Purcell's chromatic ground bass (public domain), G F# F E Eb D
    a.scale(S('lament').t0, 'G', a.T.MINOR);
    const DIDO = ['G3', 'F#3', 'F3', 'E3', 'Eb3', 'D3'];
    const d0 = S('lament').t0 + 0.2, dl = (S('lament').t1 - d0 - 0.6) / 6;
    DIDO.forEach((n, i) => a.note(n, d0 + i * dl, dl * 0.98, { vel: 0.42 }));
    a.ch('Gm', d0, d0 + 2 * dl, { notes: ['Bb3', 'D4', 'G4'], bass: false, vel: 0.4, shape: false });
    a.ch('Gm', d0 + 2 * dl, d0 + 4 * dl, { notes: ['Bb3', 'D4', 'G4'], bass: false, vel: 0.35, shape: false });
    a.ch('D', d0 + 4 * dl, S('lament').t1, { notes: ['A3', 'D4', 'F#4'], bass: false, vel: 0.35, shape: false });
    a.walker(DIDO.map((n, i) => [d0 + i * dl, n.replace(/\d/, '')]), { t1: S('lament').t1, dr: 34, label: 'BASS', labelDr: 82 });

    // essence: the cliché resolves into F, then home
    a.scale(S('essence').t0, 'C');
    const e0 = S('essence').t0 + 0.1, el = 0.9, et = [0, 1, 2, 3, 4].map(i => e0 + i * el);
    [0, 1, 2].forEach(i => cliche(et, i));
    a.ch('F', et[3], et[4], { notes: ['C4', 'F4', 'A4'], bass: 'F2' });
    a.ch('C', et[4], S('essence').t1 - 0.3, { notes: ['C4', 'E4', 'G4', 'C5'], bass: 'C2' });
    a.walker(LINE.map((p, i) => [et[i], p]), { t1: S('essence').t1, dr: -40, color: '#ffcf5a' });
    a.cta(a.at('cta') + 0.6, 'Leave a song in the comments');
  },
};
