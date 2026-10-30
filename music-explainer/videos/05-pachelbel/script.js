// Pachelbel's Canon progression: eight chords from ~1700 that pop still runs on.
module.exports = {
  slug: 'pachelbel-canon',
  title: "Pachelbel's Canon",
  segments: [
    { id: 'hook',     text: 'Eight chords, written over three hundred years ago... and still all over the charts.' },
    { id: 'what',     text: "This is Pachelbel's Canon: D, A, B minor, F sharp minor, G, D, G, A." },
    { id: 'canon',    text: 'On top, the violins sing one of the most famous melodies ever written.' },
    { id: 'basket',   text: 'Green Day sped it up for Basket Case...' },
    { id: 'memories', text: 'and Maroon 5 built Memories right on top of it.' },
    { id: 'why1',     text: "So what's the secret? Watch the bass." },
    { id: 'why2a',    text: 'With the right inversions, it simply walks down the scale.' },
    { id: 'why2',     text: 'D, C sharp, B, A, G, F sharp... then climbs back home.' },
    { id: 'why3',     text: 'A line falling step by step feels like gravity. Calm, and inevitable.' },
    { id: 'violin',   text: 'And the violin melody? It walks down too, right alongside the bass.' },
    { id: 'ground',   text: 'Pachelbel repeats that bass line twenty-eight times.' },
    { id: 'ground2',  text: 'It never gets old, because it always leads you home.' },
    { id: 'essence',  text: "Two lines falling together, then rising home. Three centuries later, we still can't resist it." },
    { id: 'cta',      text: 'What should I break down next?' },
  ],
  scenes: [
    { id: 'hook', segs: ['hook'], label: 'THREE CENTURIES OLD', title: "PACHELBEL'S CANON", accent: true, tonic: 2, min: 5.2 },
    { id: 'what', segs: ['what'], label: 'THE PROGRESSION', title: '8 CHORDS', tonic: 2, row: ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'], tail: 0.9 },
    { id: 'canon', segs: ['canon'], label: 'YOU HEAR IT IN', title: 'Canon in D', sub: 'Johann Pachelbel · c. 1700', tonic: 2, row: ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'], min: 8.0 },
    { id: 'basket', segs: ['basket'], label: 'YOU HEAR IT IN', title: 'Basket Case', sub: 'Green Day · 1994 · in Eb', tonic: 3, row: ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'], min: 7.4 },
    { id: 'memories', segs: ['memories'], label: 'YOU HEAR IT IN', title: 'Memories', sub: 'Maroon 5 · 2019 · in B', tonic: 11, row: ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'], min: 7.0 },
    { id: 'why1', segs: ['why1'], label: 'WHY IT WORKS', title: 'WATCH THE BASS', tonic: 2, tail: 0.3 },
    { id: 'why2', segs: ['why2a', 'why2'], gap: 0.2, label: 'WHY IT WORKS', title: 'A STAIRCASE', tonic: 2, tail: 1.0 },
    { id: 'why3', segs: ['why3'], label: 'WHY IT WORKS', title: 'GRAVITY', tonic: 2, tail: 0.8 },
    { id: 'violin', segs: ['violin'], label: 'TWO LINES', title: 'FALLING TOGETHER', tonic: 2, tail: 2.6 },
    { id: 'ground', segs: ['ground', 'ground2'], label: 'THE GROUND BASS', title: '28 TIMES', tonic: 2, tail: 0.6 },
    { id: 'essence', segs: ['essence', 'cta'], label: 'THE ESSENCE', title: 'FALL, THEN RISE', accent: true, tonic: 2, gap: 0.5, tail: 1.8 },
  ],
  build(a) {
    const S = id => a.scene(id);
    const CANON = ['D', 'A', 'Bm', 'F#m', 'G', 'D', 'G', 'A'];
    const INV = ['D', 'A/C#', 'Bm', 'F#m/A', 'G', 'D/F#', 'G', 'A'];
    const INV_BASS = ['D3', 'C#3', 'B2', 'A2', 'G2', 'F#2', 'G2', 'A2'];
    const MEL = ['F#5', 'E5', 'D5', 'C#5', 'B4', 'A4', 'B4', 'C#5'];
    const rows = [0, 1, 2, 3, 4, 5, 6, 7];
    const BASKET = ['Eb', 'Bb', 'Cm', 'Gm', 'Ab', 'Eb', 'Ab', 'Bb'];
    const MEMORIES = ['B', 'F#', 'G#m', 'D#m', 'E', 'B', 'E', 'F#'];

    // hook: a soft teaser of the progression
    a.scale(0.2, 'D', a.T.MAJOR, { popIn: { t0: 0.3, step: 0.3 } });
    a.seq(CANON, 0.3, S('hook').t1, { vel: 0.55, rows });

    // what: each chord lands on its spoken name
    const words = [['D', 0], ['A', 0], ['B', 0], ['F', 0], ['G', 0], ['D', 1], ['G', 1], ['A', 1]];
    const tw = words.map(([w, n]) => a.w('what', w, n) - 0.04);
    CANON.forEach((c, i) => a.ch(c, tw[i], i < 7 ? tw[i + 1] : S('what').t1, { row: i }));

    // canon in D (public domain): progression + violin line
    const c0 = S('canon').t0 + 0.1, cl = (S('canon').t1 - c0 - 0.2) / 8;
    a.seq(CANON, c0, c0 + 8 * cl, { rows, vel: 0.8 });
    MEL.forEach((n, i) => a.note(n, c0 + i * cl, cl * 0.95, { vel: 0.36 }));

    // basket case: same eight chords in Eb, fast, twice, with drums
    a.scale(S('basket').t0, 'Eb');
    const b0 = S('basket').t0 + 0.1, b1 = S('basket').t1 - 0.1, BC = BASKET;
    a.seq([...BC, ...BC], b0, b1, { rows: [...rows, ...rows], strikes: 'pulse', vel: 0.95 });
    const bb = (b1 - b0) / 16;
    for (let i = 0; i < 32; i++) { a.perc(i % 2 ? 'snare' : 'kick', b0 + i * bb / 2, 0.7); a.perc('hat', b0 + i * bb / 2 + bb / 4, 0.4); }

    // memories: in B, slower
    a.scale(S('memories').t0, 'B');
    const m0 = S('memories').t0 + 0.1;
    a.seq(MEMORIES, m0, S('memories').t1 - 0.1, { rows, vel: 0.8 });

    // why: the bass steps down the scale (with inversions)
    a.scale(S('why1').t0, 'D');
    a.ch('D', S('why1').t0 + 0.1, a.w('why2', 'D') - 0.04, { notes: ['D4', 'F#4', 'A4'], bass: 'D3', vel: 0.7 });
    const bw = [['D', 0], ['C', 0], ['B', 0], ['A', 0], ['G', 0], ['F', 0]].map(([w, n]) => a.w('why2', w, n) - 0.04);
    const tClimb = a.w('why2', 'climbs') - 0.04, tHome = a.w('why2', 'home') - 0.04;
    const bt = [...bw, tClimb, tHome, S('why2').t1];
    INV.forEach((c, i) => a.ch(c, bt[i], bt[i + 1], { bass: INV_BASS[i] }));
    a.walker(INV_BASS.map((n, i) => [bt[i], n.replace(/\d/, '')]).concat([[tHome + 0.6, 'D']]), { t1: S('why3').t1, dr: 34, color: '#ffffff', label: 'BASS', labelDr: 82 });
    // why3: the staircase keeps looping
    const w0 = S('why3').t0, wl = (S('why3').t1 - w0) / 8;
    INV.forEach((c, i) => a.ch(c, w0 + i * wl, w0 + (i + 1) * wl, { bass: INV_BASS[i], vel: 0.75 }));
    a.walker(INV_BASS.map((n, i) => [w0 + i * wl, n.replace(/\d/, '')]), { t1: S('why3').t1, dr: 34, color: '#ffffff', label: 'BASS', labelDr: 82 });

    // violin: two voices only, falling in parallel (a tenth apart)
    const v0 = a.w('violin', 'walks'), vl = (S('violin').t1 - v0 - 0.3) / 8;
    const MEL4 = ['F#4', 'E4', 'D4', 'C#4', 'B3', 'A3', 'B3', 'C#4'];
    INV_BASS.forEach((n, i) => { a.note(n, v0 + i * vl, vl * 0.95, { vel: 0.4, show: false }); a.note(MEL4[i], v0 + i * vl, vl * 0.95, { vel: 0.4, show: false }); });
    a.walker(INV_BASS.map((n, i) => [v0 + i * vl, n.replace(/\d/, '')]), { t1: S('violin').t1, dr: 34, color: '#ffffff', label: 'BASS', labelDr: 82 });
    a.walker(MEL4.map((n, i) => [v0 + i * vl, n.replace(/\d/, '')]), { t1: S('violin').t1, dr: -40, color: '#ffcf5a', label: 'VIOLIN', labelDr: -46 });

    // ground bass: the loop, with a counter
    const g0 = S('ground').t0 + 0.1, gl = (S('ground').t1 - g0) / 8;
    INV.forEach((c, i) => a.ch(c, g0 + i * gl, g0 + (i + 1) * gl, { bass: INV_BASS[i], vel: 0.8 }));
    a.big('× 28', a.w('ground', 'bass'), S('ground').t1, { y: 470, size: 72, family: 'DM Mono', weight: 500, color: '#ffcf5a' });
    a.tag('D', a.w('ground2', 'home'), S('ground').t1, 'HOME');

    // essence: once more, ending home
    const e0 = S('essence').t0 + 0.1, el = 0.75;
    INV.forEach((c, i) => a.ch(c, e0 + i * el, e0 + (i + 1) * el, { bass: INV_BASS[i], vel: 0.8 }));
    a.ch('D', e0 + 8 * el, S('essence').t1 - 0.3, { notes: ['D4', 'F#4', 'A4', 'D5'], bass: 'D2' });
    MEL.forEach((n, i) => a.note(n, e0 + i * el, el * 0.95, { vel: 0.3, show: false }));
    a.note('D5', e0 + 8 * el, 2.5, { vel: 0.32, show: false });
    a.cta(a.at('cta') + 0.6, 'Leave a song in the comments');
  },
};
