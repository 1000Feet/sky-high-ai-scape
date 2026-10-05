// The perfect fifth: where you hear it, and why a 3:2 ratio sounds so strong.
module.exports = {
  slug: 'perfect-fifth',
  title: 'The Perfect Fifth',
  segments: [
    { id: 'hook',     text: 'One tiny interval is hiding in lullabies, movie heroes, and rock music.' },
    { id: 'what',     text: "Start on C, and count up seven half steps... to G. That's a perfect fifth." },
    { id: 'twinkle',  text: "It's the leap in Twinkle, Twinkle, Little Star..." },
    { id: 'starwars', text: 'the heroic jump in the Star Wars theme...' },
    { id: 'zara',     text: 'the sunrise in Also Sprach Zarathustra...' },
    { id: 'rock',     text: 'and every power chord in rock, like Smells Like Teen Spirit.' },
    { id: 'why1',     text: 'So why does it sound so strong? Every note is a vibration.' },
    { id: 'why2',     text: 'While G swings three times, C swings exactly twice. A ratio of three to two.' },
    { id: 'why3',     text: 'The ratio is so simple that the two waves keep lining up, and your brain hears them as one.' },
    { id: 'chaos',    text: 'Make the ratio messy, like a tritone, and the pattern turns to chaos.' },
    { id: 'back',     text: 'The fifth feels stable, open, powerful.' },
    { id: 'organum',  text: 'A thousand years ago, monks sang whole melodies in parallel fifths.' },
    { id: 'organum2', text: 'Today, guitarists do the same thing with power chords.' },
    { id: 'harm',     text: "And here's the secret: G is already hiding inside C. Play a low C, and its third harmonic... is a G." },
    { id: 'essence',  text: 'So every fifth is an echo of nature itself. No wonder heroes love it.' },
    { id: 'cta',      text: 'Which interval should I break down next?' },
  ],
  scenes: [
    { id: 'hook', segs: ['hook'], label: 'ONE INTERVAL', title: 'THE PERFECT FIFTH', accent: true, circle: false, min: 4.6 },
    { id: 'what', segs: ['what'], label: 'COUNT 7 HALF STEPS', title: 'C TO G', tail: 0.8 },
    { id: 'twinkle', segs: ['twinkle'], label: 'YOU HEAR IT IN', title: 'Twinkle, Twinkle', sub: 'Traditional · in C', tail: 2.55 },
    { id: 'starwars', segs: ['starwars'], label: 'YOU HEAR IT IN', title: 'Star Wars', sub: 'John Williams · 1977 · in Bb', tail: 2.0 },
    { id: 'zara', segs: ['zara'], label: 'YOU HEAR IT IN', title: 'Also sprach Zarathustra', sub: 'Richard Strauss · 1896 · in C', tail: 2.7 },
    { id: 'rock', segs: ['rock'], label: 'YOU HEAR IT IN', title: 'Smells Like Teen Spirit', sub: 'Nirvana · 1991 · power chords', tail: 2.8, row: ['F5', 'Bb5', 'Ab5', 'Db5'] },
    { id: 'why1', segs: ['why1'], label: 'WHY IT WORKS', title: 'VIBRATION', circle: false },
    { id: 'why2', segs: ['why2', 'why3'], label: 'WHY IT WORKS', title: 'THREE TO TWO', circle: false },
    { id: 'chaos', segs: ['chaos'], label: 'A MESSY RATIO', title: 'THE TRITONE', circle: false, tail: 0.4 },
    { id: 'back', segs: ['back'], label: 'A SIMPLE RATIO', title: 'THE FIFTH', circle: false },
    { id: 'organum', segs: ['organum', 'organum2'], label: '1,000 YEARS AGO', title: 'PARALLEL FIFTHS', gap: 0.4, tail: 0.35 },
    { id: 'harm', segs: ['harm'], label: 'THE HARMONIC SERIES', title: 'G HIDES IN C', circle: false, tail: 0.5 },
    { id: 'essence', segs: ['essence', 'cta'], label: 'THE ESSENCE', title: "NATURE'S INTERVAL", accent: true, circle: false, gap: 0.5, tail: 1.3 },
  ],
  build(a) {
    const S = id => a.scene(id);

    // hook: the 3:2 figure drawing itself over an open fifth
    a.lissajous(3, 2, 0, S('hook').t1, { drawIn: 3.5, labelA: 'G', labelB: 'C' });
    a.note('C3', 0.3, 3.8, { vel: 0.25, show: false });
    a.note('G3', 0.3, 3.8, { vel: 0.25, show: false });
    a.note('C4', 1.2, 0.8, { vel: 0.3, show: false });
    a.note('G4', 2.0, 2.0, { vel: 0.3, show: false });

    // what: count up seven half steps from C to G
    const tStart = a.w('what', 'C'), tCount = a.w('what', 'count');
    const steps = [[tStart, 0]];
    for (let i = 1; i <= 7; i++) steps.push([tCount + 0.15 + i * 0.2, i]);
    a.walker(steps, { t1: S('what').t1, color: '#ffffff', dr: 0 });
    steps.forEach(([t, p]) => a.note(60 + p, t, 0.25, { vel: 0.18, show: false }));
    const tFifth = a.w('what', 'perfect');
    a.ch('C5', tFifth - 0.05, S('what').t1, { hideName: true, notes: ['C4', 'G4', 'C5'], bass: 'C3' });
    a.tag(4, tFifth, S('what').t1, '7 HALF STEPS', { color: '#ffffff' });
    a.tag(7, a.w('what', 'G'), S('what').t1, 'FIFTH');

    // twinkle (public domain melody)
    const tw = a.end('twinkle') + 0.1;
    a.ch('C5', S('twinkle').t0, S('twinkle').t1, { notes: ['C3', 'G3'], bass: 'C2', vel: 0.55, hideName: true });
    a.melody([['C4', 1], ['C4', 1], ['G4', 1], ['G4', 1], ['A4', 1], ['A4', 1], ['G4', 2]], tw, 0.3, { vel: 0.4 });

    // star wars: only the leap itself, Bb up to F
    const sw = a.end('starwars') + 0.05;
    a.ch('Bb5', S('starwars').t0, S('starwars').t1, { notes: ['Bb3', 'F4'], bass: 'Bb2', vel: 0.5, hideName: true });
    a.note('Bb4', sw, 0.55, { vel: 0.42 });
    a.note('F5', sw + 0.6, 1.2, { vel: 0.42 });

    // zarathustra (public domain): C, G, C over a low pedal
    const z = a.end('zara') + 0.05;
    a.ch('C5', S('zara').t0, S('zara').t1, { notes: ['C3', 'G3'], bass: 'C2', vel: 0.5, hideName: true });
    a.note('C4', z, 0.8, { vel: 0.4 }); a.note('G4', z + 0.85, 0.8, { vel: 0.4 }); a.note('C5', z + 1.7, 1.2, { vel: 0.45 });

    // rock: power chords, same shape (a straight line) moving around
    const r0 = S('rock').t0, r1 = S('rock').t1;
    a.seq(['F5', 'Bb5', 'Ab5', 'Db5'], r0, r1, { rows: [0, 1, 2, 3], strikes: 'pulse', vel: 1.1 });
    const beat = (r1 - r0) / 8;
    for (let i = 0; i < 8; i++) { a.perc('kick', r0 + i * beat, 0.9); a.perc(i % 2 ? 'snare' : 'hat', r0 + i * beat + beat / 2, 0.8); }

    // why: vibration -> 3:2
    a.big('262 swings per second', S('why1').t0 + 1.2, S('why1').t1, { y: 830, size: 56, family: 'DM Mono', weight: 500, color: '#ff7a93' });
    a.note('C4', a.w('why1', 'vibration'), 1.5, { vel: 0.3, show: false });
    a.lissajous(3, 2, a.w('why2', 'three'), S('why2').t1, { drawIn: 3, labelA: 'G × 3', labelB: 'C × 2', drift: 0.12 });
    a.big('3 : 2', a.w('why2', 'ratio'), S('why2').t1, { y: 470, size: 72, family: 'DM Mono', weight: 500, color: '#ffcf5a' });
    a.note('C4', a.w('why2', 'C'), 3.5, { vel: 0.25, show: false });
    a.note('G4', a.w('why2', 'G'), 4.5, { vel: 0.25, show: false });
    a.note('C3', a.w('why3', 'one'), 3, { vel: 0.22, show: false });
    a.note('G3', a.w('why3', 'one'), 3, { vel: 0.22, show: false });

    // chaos: tritone 45:32
    a.lissajous(45, 32, S('chaos').t0 + 0.2, S('chaos').t1, { drawIn: 2.2, res: 14000, color: '#ff5d6c', drift: 0.6, labelA: 'F# × 45', labelB: 'C × 32', colorA: '#ff5d6c', colorB: '#ff7a93' });
    a.big('45 : 32', S('chaos').t0 + 0.3, S('chaos').t1, { y: 470, size: 72, family: 'DM Mono', weight: 500, color: '#ff5d6c' });
    a.note('C4', a.w('chaos', 'tritone'), 2.2, { vel: 0.28, show: false });
    a.note('F#4', a.w('chaos', 'tritone'), 2.2, { vel: 0.28, show: false });
    a.lissajous(3, 2, S('back').t0, S('back').t1, { drawIn: 1.2, labelA: 'G × 3', labelB: 'C × 2', drift: 0.1 });
    a.big('3 : 2', S('back').t0, S('back').t1, { y: 470, size: 72, family: 'DM Mono', weight: 500, color: '#ffcf5a' });
    a.ch('C5', S('back').t0 + 0.1, S('back').t1, { notes: ['C4', 'G4', 'C5'], bass: 'C3', shape: false });

    // organum: a chant with a voice a fifth below, then power chords
    const o0 = S('organum').t0 + 0.2, oMid = a.at('organum2');
    const chant = [['D4', 'G3'], ['E4', 'A3'], ['F4', 'Bb3'], ['G4', 'C4'], ['A4', 'D4'], ['G4', 'C4'], ['F4', 'Bb3'], ['E4', 'A3']];
    const cl = (oMid - o0) / chant.length;
    chant.forEach(([hi, lo], i) => a.ch(lo.replace(/\d/, '') + '5', o0 + i * cl, o0 + (i + 1) * cl, { notes: [lo, hi], bass: false, vel: 0.8, hideName: true }));
    a.tag(2, a.w('organum', 'parallel'), oMid, 'SAME SHAPE, MOVING', { color: '#ffffff', dr: -150 });
    a.seq(['E5', 'G5', 'A5', 'C5', 'D5', 'E5'], oMid, S('organum').t1, { strikes: 'pulse', vel: 1.05 });

    // harmonics of a low C: C C G C E G
    const H = [['C', '×1', 36], ['C', '×2', 48], ['G', '×3', 55], ['C', '×4', 60], ['E', '×5', 64], ['G', '×6', 67]];
    const g = a.grid(H.map(([l, s]) => ({ label: l, sub: s, color: l === 'G' ? '#45d6c8' : l === 'E' ? '#ffd84a' : '#ff7a93' })),
      a.w('harm', 'Play'), S('harm').t1, { rows: 2, cols: 3, cw: 260, chh: 190, y: 520, caption: 'HARMONICS OF A LOW C' });
    const hs = a.w('harm', 'low');
    H.forEach(([, , m], i) => {
      const t = hs + i * 0.32;
      a.note(m, t, i ? 1.6 : 3.0, { vel: i ? 0.16 : 0.35, show: false });
      g.active.push({ t0: t, t1: t + 0.3, i });
    });
    const tG = a.w('harm', 'G', 1);
    g.active.push({ t0: tG, t1: S('harm').t1, i: 2 });
    a.note('G3', tG, 1.5, { vel: 0.3, show: false });

    // essence
    a.lissajous(3, 2, S('essence').t0, S('essence').t1, { drawIn: 2.5, labelA: 'G', labelB: 'C', drift: 0.1 });
    a.ch('C5', S('essence').t0 + 0.1, a.w('essence', 'heroes') - 0.05, { notes: ['C4', 'G4'], bass: 'C3', shape: false, vel: 0.8 });
    a.ch('C5', a.w('essence', 'heroes') - 0.05, S('essence').t1 - 0.3, { notes: ['C4', 'G4', 'C5'], bass: 'C2', shape: false });
    a.cta(a.at('cta') + 0.6, 'Leave an interval in the comments');
  },
};
