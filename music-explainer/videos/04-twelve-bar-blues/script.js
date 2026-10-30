// The 12-bar blues: three chords, twelve bars, and the loop that built rock and roll.
const BAR = 1.6, BEAT = BAR / 4;

module.exports = {
  slug: 'twelve-bar-blues',
  title: 'The 12-Bar Blues',
  segments: [
    { id: 'hook',    text: 'Three chords. Twelve bars. This little loop gave us the blues... and rock and roll.' },
    { id: 'b1',      text: 'Four bars on the home chord...' },
    { id: 'b5',      text: 'two on the four chord...' },
    { id: 'b7',      text: 'two back home...' },
    { id: 'b9',      text: 'then the five, the four, and home again.' },
    { id: 's1',      text: "That's Johnny B. Goode..." },
    { id: 's2',      text: 'Hound Dog...' },
    { id: 's3',      text: 'Rock Around the Clock.' },
    { id: 'why1',    text: "Why is it so addictive? It's built like a conversation." },
    { id: 'why2',    text: 'A line. The same line again. Then... the answer.' },
    { id: 'why3',    text: 'That call and response came straight from work songs and spirituals.' },
    { id: 'dom',     text: 'And every chord is a seventh chord, with a tritone inside. So the blues never fully comes to rest.' },
    { id: 'blue',    text: "On top, singers bend between the minor and the major third. That's the blue note." },
    { id: 'turn',    text: 'And the last bars swing you back to the top... so the loop never ends.' },
    { id: 'essence', text: "Three chords, twelve bars, a question and an answer. That's the loop that built rock and roll." },
    { id: 'cta',     text: 'What should I break down next?' },
  ],
  scenes: [
    { id: 'hook', segs: ['hook'], label: 'THREE CHORDS', title: 'THE 12-BAR BLUES', accent: true, circle: false, min: 5 * BAR, tail: 0 },
    { id: 'b1', segs: ['b1'], label: 'BARS 1 – 4', title: 'HOME', circle: false, min: 4 * BAR, tail: 0 },
    { id: 'b5', segs: ['b5'], label: 'BARS 5 – 6', title: 'THE FOUR CHORD', circle: false, min: 2 * BAR, tail: 0 },
    { id: 'b7', segs: ['b7'], label: 'BARS 7 – 8', title: 'HOME', circle: false, min: 2 * BAR, tail: 0 },
    { id: 'b9', segs: ['b9'], label: 'BARS 9 – 12', title: 'FIVE, FOUR, HOME', circle: false, min: 4 * BAR, tail: 0 },
    { id: 's1', segs: ['s1'], label: 'YOU HEAR IT IN', title: 'Johnny B. Goode', sub: 'Chuck Berry · 1958', circle: false, min: 4 * BAR, tail: 0 },
    { id: 's2', segs: ['s2'], label: 'YOU HEAR IT IN', title: 'Hound Dog', sub: 'Elvis Presley · 1956', circle: false, min: 4 * BAR, tail: 0 },
    { id: 's3', segs: ['s3'], label: 'YOU HEAR IT IN', title: 'Rock Around the Clock', sub: 'Bill Haley & His Comets · 1954', circle: false, min: 4 * BAR, tail: 0 },
    { id: 'why1', segs: ['why1'], label: 'WHY IT WORKS', title: 'A CONVERSATION', circle: false },
    { id: 'why2', segs: ['why2', 'why3'], label: 'WHY IT WORKS', title: 'CALL AND RESPONSE', circle: false, tail: 0.5 },
    { id: 'dom', segs: ['dom'], label: 'EVERY CHORD IS A SEVENTH', title: 'NEVER AT REST', tonic: 0, tail: 0.6 },
    { id: 'blue', segs: ['blue'], label: 'MINOR AND MAJOR AT ONCE', title: 'THE BLUE NOTE', tonic: 0, tail: 1.0 },
    { id: 'turn', segs: ['turn'], label: 'THE TURNAROUND', title: 'BACK TO THE TOP', circle: false, min: 6 * BAR + 0.2 },
    { id: 'essence', segs: ['essence', 'cta'], label: 'THE ESSENCE', title: 'THE LOOP THAT BUILT ROCK', accent: true, gap: 0.5, tail: 1.6 },
  ],
  build(a) {
    const S = id => a.scene(id);
    const FORM = ['C7', 'C7', 'C7', 'C7', 'F7', 'F7', 'C7', 'C7', 'G7', 'F7', 'C7', 'C7'];
    const ROMAN = { C7: 'I', F7: 'IV', G7: 'V' }, COL = { C7: '#ff7a93', F7: '#7be07b', G7: '#45d6c8' };
    const ROOT = { C7: 36, F7: 41, G7: 43 };
    const cells = FORM.map(c => ({ label: ROMAN[c], sub: c, color: COL[c] }));

    // one bar of shuffle: piano on 2 and 4, boogie bass, drums
    function bar(name, t, vel = 1, grid = null, cell = null) {
      a.ch(name, t, t + BAR, { bass: false, strikes: [{ o: BEAT, v: 1 }, { o: 3 * BEAT, v: 0.8 }], vel: vel * 0.9 });
      [0, 4, 7, 9, 10, 9, 7, 4].forEach((iv, j) => {
        const tt = t + Math.floor(j / 2) * BEAT + (j % 2 ? BEAT * 2 / 3 : 0);
        a.note(ROOT[name] + iv, tt, BEAT * (j % 2 ? 0.3 : 0.6), { vel: 0.3 * vel, show: false });
      });
      for (let b = 0; b < 4; b++) {
        a.perc(b % 2 ? 'snare' : 'kick', t + b * BEAT, 0.8 * vel);
        a.perc('hat', t + b * BEAT, 0.5 * vel); a.perc('hat', t + b * BEAT + BEAT * 2 / 3, 0.35 * vel);
      }
      if (grid) grid.active.push({ t0: t, t1: t + BAR, i: cell });
    }

    // part 1: intro vamp, then two full choruses with the grid lighting up bar by bar
    const g1 = a.grid(cells, 0.3, S('s3').t1, { revealStep: 0.22, y: 520, cw: 235, chh: 170 });
    const c1 = S('b1').t0, c2 = S('s1').t0;
    for (let t = c1 - Math.floor(c1 / BAR) * BAR; t + 0.01 < c1; t += BAR) bar('C7', t, 0.8);
    FORM.forEach((c, i) => bar(c, c1 + i * BAR, 1, g1, i));
    FORM.forEach((c, i) => bar(c, c2 + i * BAR, 1, g1, i));

    // part 2: soft vamp on the home chord, rows light up as line / line / answer
    const p2 = S('why1').t0, tTurn = p2 + Math.ceil((S('turn').t0 + 0.15 - p2) / BAR) * BAR;
    for (let t = p2; t + 0.01 < tTurn; t += BAR) bar('C7', t, 0.55);
    const g2 = a.grid(cells, p2, S('why2').t1, { y: 520, cw: 235, chh: 170 });
    const row = (r, t0, t1) => { for (let c = 0; c < 4; c++) g2.active.push({ t0, t1, i: r * 4 + c }); };
    const tL1 = a.w('why2', 'line'), tL2 = a.w('why2', 'same'), tAns = a.w('why2', 'answer');
    row(0, tL1, tL2); row(1, tL2, tAns); row(2, tAns, a.at('why3') + 0.6);
    a.big('LINE', tL1, tL2, { y: 1100, size: 40, family: 'DM Mono', weight: 500, color: '#ff7a93' });
    a.big('THE SAME LINE', tL2, tAns, { y: 1100, size: 40, family: 'DM Mono', weight: 500, color: '#ff7a93' });
    a.big('THE ANSWER', tAns, S('why2').t1, { y: 1100, size: 40, family: 'DM Mono', weight: 500, color: '#45d6c8' });

    // dominant sevenths: the tritone E - Bb inside C7
    a.scale(S('dom').t0, 'C');
    a.line('E', 'Bb', a.w('dom', 'tritone'), S('dom').t1, { color: '#ff5d6c', label: 'TRITONE', ly: 78 });
    a.tag('Bb', a.w('dom', 'seventh'), S('blue').t1, 'FLAT SEVEN', { color: '#8d98ff' });

    // blue note: bending from Eb to E over C7
    const tb = a.w('blue', 'bend');
    a.arc('Eb', 'E', tb, S('blue').t1, { steps: 1, color: '#62a8ff', dr: 30 });
    a.tag('Eb', a.w('blue', 'blue'), S('blue').t1, 'BLUE NOTE', { color: '#62a8ff' });
    for (let k = 0; k < 3; k++) { a.note('Eb4', tb + k * 0.9, 0.3, { vel: 0.4 }); a.note('E4', tb + k * 0.9 + 0.3, 0.5, { vel: 0.4 }); }
    a.note('Eb5', a.w('blue', 'blue'), 0.35, { vel: 0.4 }); a.note('E5', a.w('blue', 'blue') + 0.35, 0.4, { vel: 0.38 }); a.note('C5', a.w('blue', 'blue') + 0.8, 0.8, { vel: 0.38 });

    // turnaround: bars 9-12, then back to bar 1
    const g3 = a.grid(cells, S('turn').t0, S('turn').t1, { y: 520, cw: 235, chh: 170 });
    ['G7', 'F7', 'C7', 'C7', 'C7'].forEach((c, i) => bar(c, tTurn + i * BAR, 0.85, g3, i < 4 ? 8 + i : 0));
    a.big('AND AGAIN...', tTurn + 4 * BAR, S('turn').t1, { y: 1100, size: 40, family: 'DM Mono', weight: 500, color: '#ffcf5a' });

    // essence: classic ending, V7 then a long I7
    const e0 = S('essence').t0;
    a.scale(e0, 'C');
    a.ch('G7', e0 + 0.1, e0 + 0.1 + BAR, { vel: 0.9 });
    a.ch('C7', e0 + 0.1 + BAR, S('essence').t1 - 0.3, { notes: ['E3', 'Bb3', 'C4', 'E4', 'G4'], bass: 'C2' });
    a.cta(a.at('cta') + 0.6, 'Leave a song in the comments');
  },
};
