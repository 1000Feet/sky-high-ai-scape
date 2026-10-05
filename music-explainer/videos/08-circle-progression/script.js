// The circle-of-fifths progression: every chord falls a fifth into the next.
module.exports = {
  slug: 'circle-of-fifths-progression',
  title: 'The Circle of Fifths Progression',
  segments: [
    { id: 'hook',    text: 'One chord progression is the backbone of jazz, disco... and a thousand love songs.' },
    { id: 'what',    text: 'Start on A minor, then keep falling by fifths: D minor, G, C, F, B, E... and home.' },
    { id: 'fly',     text: "It's Fly Me to the Moon..." },
    { id: 'survive', text: 'I Will Survive...' },
    { id: 'autumn',  text: 'and Autumn Leaves.' },
    { id: 'why1',    text: 'So why does it feel unstoppable? Each root falls a fifth: the strongest move in harmony.' },
    { id: 'why2',    text: "It's the same move as five to one, the cadence that ends almost every song." },
    { id: 'why3',    text: 'So every chord sounds like the five of the next one. A line of dominoes.' },
    { id: 'circle',  text: 'Rearrange the circle by fifths, and the chain simply walks around it, one neighbor at a time.' },
    { id: 'cheat',   text: 'Only one step cheats. F to B is a tritone, so the chain stays inside the key.' },
    { id: 'jazz0',   text: 'Make every chord a dominant seventh, and you get the sound of ragtime.' },
    { id: 'jazz',    text: 'E seven, A seven, D seven, G seven... C.' },
    { id: 'essence', text: "Every chord points to the next one. That's not just harmony... it's momentum." },
    { id: 'cta',     text: 'What should I break down next?' },
  ],
  scenes: [
    { id: 'hook', segs: ['hook'], label: 'JAZZ · DISCO · BALLADS', title: 'THE CIRCLE PROGRESSION', accent: true, tonic: 9, min: 5.4 },
    { id: 'what', segs: ['what'], label: 'FALLING BY FIFTHS', title: 'SEVEN STEPS HOME', tonic: 9, row: ['Am', 'Dm', 'G', 'C', 'F', 'B°', 'E', 'Am'], tail: 0.8 },
    { id: 'fly', segs: ['fly'], label: 'YOU HEAR IT IN', title: 'Fly Me to the Moon', sub: 'Bart Howard · 1954 · in A minor', tonic: 9, row: ['Am7', 'Dm7', 'G7', 'Cmaj7', 'Fmaj7', 'Bø', 'E7', 'Am'], min: 6.6 },
    { id: 'survive', segs: ['survive'], label: 'YOU HEAR IT IN', title: 'I Will Survive', sub: 'Gloria Gaynor · 1978 · in A minor', tonic: 9, row: ['Am', 'Dm', 'G', 'C', 'F', 'Bø', 'E'], min: 6.0 },
    { id: 'autumn', segs: ['autumn'], label: 'YOU HEAR IT IN', title: 'Autumn Leaves', sub: 'Joseph Kosma · 1945 · in E minor', tonic: 4, row: ['Am7', 'D7', 'Gmaj7', 'Cmaj7', 'F#ø', 'B7', 'Em'], min: 6.6 },
    { id: 'why1', segs: ['why1'], label: 'WHY IT WORKS', title: 'DOWN A FIFTH', tonic: 9, tail: 0.4 },
    { id: 'why2', segs: ['why2'], label: 'WHY IT WORKS', title: 'FIVE TO ONE', tonic: 9, tail: 0.5 },
    { id: 'why3', segs: ['why3'], label: 'WHY IT WORKS', title: 'DOMINOES', tonic: 9, tail: 0.8 },
    { id: 'circle', segs: ['circle'], label: 'THE CIRCLE OF FIFTHS', title: 'ONE NEIGHBOR AT A TIME', tonic: 9, tail: 1.2 },
    { id: 'cheat', segs: ['cheat'], label: 'THE ONE EXCEPTION', title: 'F TO B', tonic: 9, tail: 0.8 },
    { id: 'jazz', segs: ['jazz0', 'jazz'], gap: 0.2, label: 'EVERY CHORD A SEVENTH', title: 'RAGTIME', tonic: 0, tail: 1.4 },
    { id: 'essence', segs: ['essence', 'cta'], label: 'THE ESSENCE', title: 'MOMENTUM', accent: true, tonic: 9, gap: 0.5, tail: 1.8 },
  ],
  build(a) {
    const S = id => a.scene(id);
    const TRI = ['Am', 'Dm', 'G', 'C', 'F', 'Bdim', 'E', 'Am'];
    const SEV = ['Am7', 'Dm7', 'G7', 'Cmaj7', 'Fmaj7', 'Bm7b5', 'E7', 'Am7'];
    const LBL = ['Am', 'Dm', 'G', 'C', 'F', 'B°', 'E', 'Am'];
    const ROOTS = ['A', 'D', 'G', 'C', 'F', 'B', 'E', 'A'];
    const BASS = ['A2', 'D3', 'G2', 'C3', 'F2', 'B2', 'E2', 'A2'];
    const run = (t0, t1, names, o = {}) => {
      const len = (t1 - t0) / names.length;
      return names.map((c, i) => a.ch(c, t0 + i * len, t0 + (i + 1) * len, { row: i, bass: (o.bass || BASS)[i], label: o.labels ? o.labels[i] : undefined, strikes: o.strikes ? o.strikes(len) : undefined, vel: o.vel ?? 0.9 }));
    };

    // hook
    a.scale(0.2, 'A', a.T.MINOR, { popIn: { t0: 0.3, step: 0.2 } });
    run(0.3, S('hook').t1, SEV, { vel: 0.6, labels: LBL });

    // what: chords on their names
    const tw = [['A', 0], ['D', 0], ['G', 0], ['C', 0], ['F', 0], ['B', 0], ['E', 0], ['home', 0]].map(([w, n]) => a.w('what', w, n) - 0.04);
    TRI.forEach((c, i) => a.ch(c, tw[i], i < 7 ? tw[i + 1] : S('what').t1, { row: i, bass: BASS[i], label: LBL[i] }));

    // fly me to the moon: sevenths, gentle swing
    run(S('fly').t0 + 0.05, S('fly').t1, SEV, { labels: ['Am7', 'Dm7', 'G7', 'Cmaj7', 'Fmaj7', 'Bø7', 'E7', 'Am7'], strikes: len => [{ o: 0, v: 1 }, { o: len * 0.67, v: 0.5 }] });
    // i will survive: disco four-on-the-floor
    const s0 = S('survive').t0 + 0.05, s1 = S('survive').t1;
    run(s0, s1, ['Am', 'Dm', 'G', 'C', 'F', 'Bm7b5', 'E'], { labels: ['Am', 'Dm', 'G', 'C', 'F', 'Bø', 'E'], bass: ['A2', 'D3', 'G2', 'C3', 'F2', 'B2', 'E2'], strikes: len => [0, 0.25, 0.5, 0.75].map(k => ({ o: len * k + len / 8, v: 0.6 })) });
    for (let t = s0; t < s1 - 0.05; t += (s1 - s0) / 14) { a.perc('kick', t, 0.9); a.perc('hat', t + (s1 - s0) / 28, 0.5); }
    // autumn leaves in E minor
    a.scale(S('autumn').t0, 'E', a.T.MINOR);
    run(S('autumn').t0 + 0.05, S('autumn').t1, ['Am7', 'D7', 'Gmaj7', 'Cmaj7', 'F#m7b5', 'B7', 'Em'], { labels: ['Am7', 'D7', 'Gmaj7', 'Cmaj7', 'F#ø7', 'B7', 'Em'], bass: ['A2', 'D3', 'G2', 'C3', 'F#2', 'B2', 'E2'], strikes: len => [{ o: 0, v: 1 }, { o: len * 0.67, v: 0.5 }] });

    // why1: roots fall by fifths (a star on the chromatic circle)
    a.scale(S('why1').t0, 'A', a.T.MINOR);
    const w0 = S('why1').t0 + 0.1, w1 = S('why3').t1, wl = (w1 - w0) / 16;
    const chain = [...SEV, ...SEV].map((c, i) => a.ch(c, w0 + i * wl, w0 + (i + 1) * wl, { bass: BASS[i % 8], label: LBL[i % 8], vel: 0.75 }));
    a.walker([...ROOTS, ...ROOTS].map((r, i) => [chain[i].t0, r]), { t1: w1, dr: 34, label: 'ROOT', labelDr: 82 });
    a.tag(0, a.w('why1', 'falls'), S('why1').t1, 'DOWN A FIFTH', { x: 540, y: 1100, color: '#ffffff' });
    a.big('V  →  I', a.w('why2', 'five'), S('why2').t1, { y: 455, size: 56, family: 'DM Mono', weight: 500, color: '#ffcf5a' });
    a.big('THE FIVE OF THE NEXT', a.w('why3', 'five'), S('why3').t1, { y: 455, size: 40, family: 'DM Mono', weight: 500, color: '#ffcf5a' });

    // circle: rearrange by fifths, the chain walks neighbor to neighbor
    a.layout(a.w('circle', 'Rearrange'), 1, 1.6);
    const c0 = a.w('circle', 'walks') - 0.1, cl = (S('cheat').t1 - c0) / 12;
    const ch2 = [...SEV, ...SEV.slice(0, 4)].map((c, i) => a.ch(c, c0 + i * cl, c0 + (i + 1) * cl, { bass: BASS[i % 8], label: LBL[i % 8], vel: 0.75 }));
    a.walker([...ROOTS, ...ROOTS.slice(0, 4)].map((r, i) => [ch2[i].t0, r]), { t1: S('cheat').t1, dr: 34, label: 'ROOT', labelDr: 82 });
    a.ch('Am7', S('circle').t0, c0, { bass: 'A2', label: 'Am7', vel: 0.6 });
    // cheat: F -> B is a tritone (opposite sides of the circle of fifths)
    a.line('F', 'B', a.w('cheat', 'F'), S('cheat').t1, { color: '#ff5d6c', label: 'TRITONE', r: 255, ly: 78 });

    // ragtime: E7 A7 D7 G7 C, neighbours on the circle of fifths
    a.scale(S('jazz').t0, 'C');
    const rw = ['E', 'A', 'D', 'G', 'C'].map(n => a.w('jazz', n) - 0.04);
    const RAG = ['E7', 'A7', 'D7', 'G7', 'C'];
    a.ch('C', S('jazz').t0, rw[0], { bass: 'C3', vel: 0.6 });
    RAG.forEach((c, i) => a.ch(c, rw[i], i < 4 ? rw[i + 1] : S('jazz').t1, { bass: ['E2', 'A2', 'D3', 'G2', 'C3'][i] }));
    a.walker(['E', 'A', 'D', 'G', 'C'].map((r, i) => [rw[i], r]), { t1: S('jazz').t1, dr: 34, label: 'ROOT', labelDr: 82 });

    // essence: the chain once more, landing home
    a.scale(S('essence').t0, 'A', a.T.MINOR);
    const e0 = S('essence').t0 + 0.1, el = 0.6;
    SEV.slice(0, 7).forEach((c, i) => a.ch(c, e0 + i * el, e0 + (i + 1) * el, { bass: BASS[i], label: LBL[i] }));
    a.ch('Am', e0 + 7 * el, S('essence').t1 - 0.3, { notes: ['A3', 'C4', 'E4', 'A4'], bass: 'A2' });
    a.walker(ROOTS.map((r, i) => [e0 + i * el, r]), { t1: S('essence').t1, dr: 34 });
    a.cta(a.at('cta') + 0.6, 'Leave a song in the comments');
  },
};
