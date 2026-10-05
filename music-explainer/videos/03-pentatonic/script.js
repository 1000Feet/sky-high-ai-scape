// The pentatonic scale: five notes found all over the world, and why nothing in it clashes.
module.exports = {
  slug: 'pentatonic',
  title: 'The Pentatonic Scale',
  segments: [
    { id: 'hook',     text: "Five notes. They're in Chinese folk songs, Scottish ballads, blues solos... and you already know them." },
    { id: 'what',     text: "Play only the black keys of a piano. That's it: the pentatonic scale." },
    { id: 'inc',      text: 'In C, it’s C, D, E, G and A.' },
    { id: 'grace',    text: "It's the melody of Amazing Grace..." },
    { id: 'auld',     text: 'Auld Lang Syne...' },
    { id: 'solo',     text: 'and almost every rock guitar solo.' },
    { id: 'why1',     text: "Why does it sound good everywhere? Look at what's missing: F and B." },
    { id: 'why2',     text: 'Those two notes make the only half steps in the scale... and the tritone.' },
    { id: 'why3',     text: 'Take them out, and nothing clashes. Any note sounds fine with any other.' },
    { id: 'fifths',   text: "And there's a deeper secret. Stack perfect fifths: C, G, D, A, E." },
    { id: 'fifths2',  text: 'Rearrange the circle by fifths, and the pentatonic is just five neighbors in a row.' },
    { id: 'mcferrin', text: 'That’s why Bobby McFerrin could hop around a stage...' },
    { id: 'mcferrin2', text: 'and a whole audience sang the right notes, without being told.' },
    { id: 'essence',  text: "The pentatonic isn't a rule someone invented. It's built from the simplest ratio in nature." },
    { id: 'cta',      text: 'What should I break down next?' },
  ],
  scenes: [
    { id: 'hook', segs: ['hook'], label: 'THE UNIVERSAL SCALE', title: 'FIVE NOTES', accent: true, tonic: 6 },
    { id: 'what', segs: ['what'], label: 'THE PENTATONIC SCALE', title: 'BLACK KEYS ONLY', tonic: 6, tail: 1.4 },
    { id: 'inc', segs: ['inc'], label: 'THE PENTATONIC SCALE', title: 'IN C', tail: 1.6 },
    { id: 'grace', segs: ['grace'], label: 'YOU HEAR IT IN', title: 'Amazing Grace', sub: 'Traditional · in C', tail: 4.6 },
    { id: 'auld', segs: ['auld'], label: 'YOU HEAR IT IN', title: 'Auld Lang Syne', sub: 'Traditional · in C', tail: 4.4 },
    { id: 'solo', segs: ['solo'], label: 'YOU HEAR IT IN', title: 'Rock guitar solos', sub: 'A minor pentatonic', tail: 3.0, tonic: 0 },
    { id: 'why1', segs: ['why1'], label: 'WHY IT WORKS', title: 'TWO MISSING NOTES' },
    { id: 'why2', segs: ['why2'], label: 'WHY IT WORKS', title: 'TWO MISSING NOTES', tail: 0.5 },
    { id: 'why3', segs: ['why3'], label: 'WHY IT WORKS', title: 'NOTHING CLASHES', tail: 1.4 },
    { id: 'fifths', segs: ['fifths'], label: 'THE DEEPER SECRET', title: 'STACKED FIFTHS', tail: 0.8 },
    { id: 'fifths2', segs: ['fifths2'], label: 'THE CIRCLE OF FIFTHS', title: 'FIVE NEIGHBORS', tail: 1.0 },
    { id: 'mcferrin', segs: ['mcferrin', 'mcferrin2'], gap: 0.2, label: 'WORLD SCIENCE FESTIVAL · 2009', title: 'BOBBY McFERRIN', tail: 0.8 },
    { id: 'essence', segs: ['essence', 'cta'], label: 'THE ESSENCE', title: 'BUILT FROM NATURE', accent: true, gap: 0.5, tail: 1.6 },
  ],
  build(a) {
    const S = id => a.scene(id);
    const PENTA = [0, 2, 4, 7, 9];

    // hook: black-key shimmer, five dots appear
    a.scale(0.3, 'F#', PENTA, { popIn: { t0: 0.4, step: 0.35 } });
    ['F#4', 'G#4', 'A#4', 'C#5', 'D#5'].forEach((n, i) => a.note(n, 0.4 + i * 0.35, 1.6, { vel: 0.28 }));
    ['D#5', 'C#5', 'A#4', 'G#4', 'F#4', 'D#4', 'C#4'].forEach((n, i) => a.note(n, 2.6 + i * 0.22, 0.9, { vel: 0.22, show: false }));

    // what: only black keys
    const tb = a.w('what', 'black');
    ['F#3', 'G#3', 'A#3', 'C#4', 'D#4', 'F#4', 'G#4', 'A#4', 'C#5', 'D#5'].forEach((n, i) => a.note(n, tb + i * 0.16, 0.5, { vel: 0.24 }));
    a.ch('F#', a.w('what', 'pentatonic'), S('what').t1, { notes: ['F#3', 'A#3', 'C#4', 'D#4'], bass: 'F#2', vel: 0.7, hideName: true, shape: false });

    // in C: the same pattern rotates to C
    a.scale(a.w('inc', 'In'), 'C', PENTA);
    const tc = a.w('inc', 'C', 1);
    ['C', 'D', 'E', 'G', 'A'].forEach((n, i) => { const t = a.w('inc', n, n === 'C' ? 1 : 0); a.note(n + '4', t, 0.9, { vel: 0.32 }); });
    a.note('C5', a.w('inc', 'A') + 0.45, 1.2, { vel: 0.3 });
    void tc;

    // amazing grace (public domain), in C
    const g0 = a.end('grace') + 0.1;
    a.ch('C', S('grace').t0, S('grace').t1, { notes: ['E3', 'G3'], bass: 'C2', vel: 0.45, shape: false, hideName: true });
    a.melody([['G3', 1], ['C4', 2], ['E4', 0.5], ['C4', 0.5], ['E4', 2], ['D4', 1], ['C4', 2], ['A3', 1], ['G3', 2]], g0, 0.36, { vel: 0.42 });

    // auld lang syne (public domain), in C
    const l0 = a.end('auld') + 0.1;
    a.ch('C', S('auld').t0, S('auld').t1, { notes: ['E3', 'G3'], bass: 'C2', vel: 0.45, shape: false, hideName: true });
    a.melody([['G3', 1], ['C4', 1.5], ['C4', 0.5], ['C4', 1], ['E4', 1], ['D4', 1.5], ['C4', 0.5], ['D4', 1], ['E4', 1], ['C4', 1.5], ['C4', 0.5], ['E4', 1], ['G4', 1], ['A4', 2]], l0, 0.27, { vel: 0.42 });

    // solo: the same five notes, starting on A
    const s0 = a.at('solo'), s1 = S('solo').t1;
    a.tag('A', a.w('solo', 'rock'), s1, 'START ON A', { color: '#62a8ff' });
    a.seq(['Am', 'Am', 'Am', 'Am'], s0, s1, { strikes: 'pulse', vel: 0.6, hideName: true, shape: false });
    const run = ['A3', 'C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'A4', 'G4', 'E4', 'D4', 'E4', 'C4', 'A3'];
    const r0 = a.end('solo') + 0.05, rs = (s1 - r0 - 0.4) / run.length;
    run.forEach((n, i) => a.note(n, r0 + i * rs, rs * 1.6, { vel: 0.38 }));
    const beat = (s1 - s0) / 8;
    for (let i = 0; i < 8; i++) { a.perc('kick', s0 + i * beat, 0.7); a.perc(i % 2 ? 'snare' : 'hat', s0 + i * beat + beat / 2, 0.6); }

    // why: F and B are missing -> no half steps, no tritone
    const RED = '#ff5d6c';
    const tMiss = a.w('why1', 'F');
    a.ring(['F', 'B'], tMiss, S('why2').t1, { color: RED });
    a.tag('F', tMiss, S('why2').t1, 'MISSING', { color: RED });
    a.tag('B', a.w('why1', 'B'), S('why2').t1, 'MISSING', { color: RED });
    a.note('F4', tMiss, 0.6, { vel: 0.25, show: false }); a.note('B4', a.w('why1', 'B'), 0.6, { vel: 0.25, show: false });
    const tHalf = a.w('why2', 'half');
    a.arc('E', 'F', tHalf, S('why2').t1, { steps: 1, color: RED, dr: 30 });
    a.arc('B', 'C', tHalf, S('why2').t1, { steps: 1, color: RED, dr: 30 });
    a.note('E4', tHalf, 1.0, { vel: 0.22, show: false }); a.note('F4', tHalf, 1.0, { vel: 0.22, show: false });
    a.line('F', 'B', a.w('why2', 'tritone'), S('why2').t1, { color: RED, label: 'TRITONE' });
    a.note('F3', a.w('why2', 'tritone'), 1.2, { vel: 0.25, show: false }); a.note('B3', a.w('why2', 'tritone'), 1.2, { vel: 0.25, show: false });
    // why3: random pentatonic notes, all consonant
    const w3 = a.w('why3', 'nothing'), chimes = ['E5', 'G4', 'C5', 'A4', 'D5', 'G5', 'E4', 'A5', 'C4', 'D4', 'G4', 'E5', 'A4', 'C5'];
    chimes.forEach((n, i) => a.note(n, w3 + i * 0.28 + (i % 3) * 0.05, 1.4, { vel: 0.2 }));
    a.ch('C6', w3, S('why3').t1, { notes: ['C3', 'G3', 'D4'], bass: false, vel: 0.5, shape: false, hideName: true });

    // fifths: stack C G D A E, then rearrange the circle by fifths
    const F = ['C', 'G', 'D', 'A', 'E'], FM = ['C3', 'G3', 'D4', 'A4', 'E5'];
    const fpts = F.map((n, i) => [a.w('fifths', n, n === 'C' ? 0 : 0), n]);
    a.walker(fpts, { t1: S('fifths').t1 + 0.3, color: '#ffffff' });
    F.forEach((n, i) => a.note(FM[i], fpts[i][0], S('fifths').t1 - fpts[i][0] + 0.4, { vel: 0.22 }));
    a.layout(a.w('fifths2', 'Rearrange'), 1, 1.6);
    a.poly(F, a.w('fifths2', 'pentatonic'), S('fifths2').t1, { closed: false, dash: false, color: '#ffcf5a', glow: true, alpha: 0.9, width: 5 });
    a.tag('D', a.w('fifths2', 'neighbors'), S('fifths2').t1, 'FIVE IN A ROW', { color: '#ffcf5a' });
    a.layout(S('mcferrin').t0, 0, 1.2);

    // mcferrin: the audience "knows" where the next note is
    const hop = ['C', 'D', 'E', 'G', 'A', 'G', 'E', 'A', 'C', 'D', 'E', 'G'];
    const h0 = a.w('mcferrin', 'hop'), hs = (S('mcferrin').t1 - h0 - 0.5) / hop.length;
    a.walker(hop.map((n, i) => [h0 + i * hs, n]), { t1: S('mcferrin').t1, color: '#ffcf5a', label: 'SING' });
    hop.forEach((n, i) => a.note(n + (n === 'C' && i > 6 ? '5' : '4'), h0 + i * hs, hs * 0.9, { vel: 0.3 }));

    // essence: the whole pentatonic as one chord
    a.ch('C6', S('essence').t0 + 0.1, S('essence').t1 - 0.3, { notes: ['C4', 'D4', 'E4', 'G4', 'A4'], bass: 'C2', label: 'C D E G A', vel: 0.9 });
    a.cta(a.at('cta') + 0.6, 'Leave an idea in the comments');
  },
};
