// The tritone: the "devil's interval", and why it is the engine of tension and release.
module.exports = {
  slug: 'tritone',
  title: 'The Tritone',
  segments: [
    { id: 'hook',    text: 'One interval sounds so unsettling that people called it the devil in music.' },
    { id: 'what',    text: "Start on C and go up six half steps, to F sharp. That's a tritone: exactly half an octave." },
    { id: 'maria',   text: "It's the yearning leap in Maria, from West Side Story..." },
    { id: 'purple',  text: 'the opening clash of Purple Haze...' },
    { id: 'sabbath', text: "and the doom of Black Sabbath's very first song." },
    { id: 'why1',    text: 'Why does it sound so tense? Look at the circle. The tritone cuts it exactly in half.' },
    { id: 'why2',    text: 'Turn it upside down, and you get... another tritone. No direction. No home.' },
    { id: 'why3',    text: 'But put it inside a chord, and it becomes the engine behind most of the music you know.' },
    { id: 'dom',     text: 'Take G seven: G, B, D, F. Hidden inside, B and F form a tritone.' },
    { id: 'resolve', text: 'That tension wants out. B slides up to C, F slides down to E... and the tritone melts into C major.' },
    { id: 'twist',   text: 'Now the wild part: D flat seven hides the exact same tritone.' },
    { id: 'twist2',  text: 'Jazz players swap them, and call it a tritone substitution.' },
    { id: 'essence', text: "So the devil's interval isn't evil. It's the tension that makes coming home feel so good." },
    { id: 'cta',     text: 'What should I explain next?' },
  ],
  scenes: [
    { id: 'hook', segs: ['hook'], label: 'DIABOLUS IN MUSICA', title: 'THE TRITONE', accent: true, min: 4.6 },
    { id: 'what', segs: ['what'], label: 'COUNT 6 HALF STEPS', title: 'C TO F#', tail: 0.9 },
    { id: 'maria', segs: ['maria'], label: 'YOU HEAR IT IN', title: 'Maria', sub: 'Leonard Bernstein · 1957', tail: 2.2 },
    { id: 'purple', segs: ['purple'], label: 'YOU HEAR IT IN', title: 'Purple Haze', sub: 'Jimi Hendrix · 1967', tail: 2.4 },
    { id: 'sabbath', segs: ['sabbath'], label: 'YOU HEAR IT IN', title: 'Black Sabbath', sub: 'Black Sabbath · 1970', tail: 3.0 },
    { id: 'why1', segs: ['why1'], label: 'WHY IT SOUNDS TENSE', title: 'HALF THE CIRCLE' },
    { id: 'why2', segs: ['why2'], label: 'WHY IT SOUNDS TENSE', title: 'PERFECT SYMMETRY', tail: 0.4 },
    { id: 'why3', segs: ['why3'], label: 'INSIDE A CHORD', title: 'THE ENGINE' },
    { id: 'dom', segs: ['dom'], label: 'THE DOMINANT SEVENTH', title: 'G7', tail: 0.5 },
    { id: 'resolve', segs: ['resolve'], label: 'THE RESOLUTION', title: 'G7 TO C', tail: 0.8 },
    { id: 'twist', segs: ['twist', 'twist2'], label: 'JAZZ TRICK', title: 'TRITONE SUBSTITUTION', tail: 0.9 },
    { id: 'essence', segs: ['essence', 'cta'], label: 'THE ESSENCE', title: 'TENSION MAKES HOME', accent: true, gap: 0.5, tail: 1.5 },
  ],
  build(a) {
    const S = id => a.scene(id);
    const RED = '#ff5d6c';

    // hook: a pulsing C - F# clash
    a.line('C', 'F#', 0.6, S('hook').t1, { color: RED, r: 255 });
    a.note('C3', 0.4, 3.6, { vel: 0.28, show: false }); a.note('F#3', 0.4, 3.6, { vel: 0.28, show: false });
    a.note('C4', 1.4, 0.7, { vel: 0.3 }); a.note('F#4', 2.2, 1.8, { vel: 0.3 });

    // what: six half steps, then the diameter
    const steps = [[a.w('what', 'C'), 0]];
    const tg = a.w('what', 'go');
    for (let i = 1; i <= 6; i++) steps.push([tg + 0.1 + i * 0.2, i]);
    a.walker(steps, { t1: S('what').t1 });
    steps.forEach(([t, p]) => a.note(60 + p, t, 0.25, { vel: 0.18, show: false }));
    const tTri = a.w('what', 'tritone');
    a.line('C', 'F#', tTri, S('what').t1, { color: RED, label: 'HALF AN OCTAVE' });
    a.note('C4', tTri, 1.8, { vel: 0.26, show: false }); a.note('F#4', tTri, 1.8, { vel: 0.26, show: false });

    // maria: only the three-note cell, C - F# - G
    const m = a.end('maria') + 0.05;
    a.note('C2', S('maria').t0 + 0.1, S('maria').t1 - S('maria').t0, { vel: 0.25, show: false });
    a.note('C4', m, 0.45, { vel: 0.42 }); a.note('F#4', m + 0.5, 0.45, { vel: 0.42 }); a.note('G4', m + 1.0, 1.0, { vel: 0.42 });
    a.line('C', 'F#', m + 0.5, S('maria').t1, { color: RED });
    a.arc('F#', 'G', m + 1.0, S('maria').t1, { steps: 1, color: '#45d6c8' });

    // purple haze: B flat octaves against E octaves
    const p0 = a.end('purple') + 0.05;
    a.line('Bb', 'E', S('purple').t0 + 0.2, S('purple').t1, { color: RED });
    for (let i = 0; i < 8; i++) {
      const t = p0 + i * 0.27;
      ['Bb2', 'Bb3'].forEach(n => a.note(n, t, 0.22, { vel: 0.32, show: false }));
      ['E4', 'E5'].forEach(n => a.note(n, t, 0.22, { vel: 0.26, show: false }));
    }

    // black sabbath: G, high G, C#
    const b0 = a.end('sabbath') + 0.05;
    a.line('G', 'C#', b0 + 1.55, S('sabbath').t1, { color: RED });
    a.note('G2', b0, 3.0, { vel: 0.3, show: false });
    a.note('G3', b0, 0.9, { vel: 0.4 }); a.note('G4', b0 + 0.95, 0.55, { vel: 0.38 }); a.note('C#4', b0 + 1.55, 1.4, { vel: 0.42 });

    // why: the diameter splits the circle into two equal halves
    a.line('C', 'F#', S('why1').t0 + 0.2, S('why2').t1, { color: RED });
    const tHalf = a.w('why1', 'half');
    a.arc('C', 'F#', tHalf - 0.6, S('why2').t1, { steps: 6, color: '#ff7a93', dr: 30 });
    a.arc('C', 'F#', tHalf - 0.6, S('why2').t1, { steps: -6, color: '#45d6c8', dr: 30 });
    a.tag(3, tHalf, S('why2').t1, '6 STEPS', { color: '#ff7a93', dr: -75 });
    a.tag(9, tHalf, S('why2').t1, '6 STEPS', { color: '#45d6c8', dr: -75 });
    a.tag(0, a.w('why2', 'direction'), S('why2').t1, 'NO DIRECTION', { x: 540, y: 905, color: '#ffffff' });
    a.note('F#3', a.w('why2', 'upside'), 1.0, { vel: 0.3, show: false }); a.note('C4', a.w('why2', 'upside') + 0.5, 1.6, { vel: 0.3, show: false });

    // dominant seventh G7 hides B - F
    a.scale(S('why3').t0, 'C');
    a.ch('G7', a.w('dom', 'seven'), a.w('resolve', 'melts'), { notes: ['B3', 'D4', 'F4', 'G4'], bass: 'G2' });
    a.line('B', 'F', a.w('dom', 'Hidden'), a.w('resolve', 'melts') + 0.3, { color: RED, label: 'TRITONE', ly: 78 });
    a.arc('B', 'C', a.w('resolve', 'B'), S('resolve').t1, { steps: 1, color: '#45d6c8', label: 'UP', labelR: 345 });
    a.arc('F', 'E', a.w('resolve', 'F'), S('resolve').t1, { steps: -1, color: '#45d6c8', label: 'DOWN', labelR: 345 });
    a.ch('C', a.w('resolve', 'melts'), S('resolve').t1, { notes: ['C4', 'E4', 'G4'], bass: 'C3' });
    a.tag('C', a.w('resolve', 'C', 1), S('resolve').t1, 'HOME');

    // tritone substitution: Db7 shares B - F with G7
    const tDb = a.w('twist', 'D');
    a.ch('G7', S('twist').t0, tDb, { notes: ['B3', 'D4', 'F4', 'G4'], bass: 'G2', vel: 0.7 });
    a.ch('Db7', tDb, a.w('twist2', 'substitution'), { notes: ['B3', 'Db4', 'F4', 'Ab4'], bass: 'Db3' });
    a.ghost('G7', tDb, a.w('twist2', 'substitution'), { label: 'G7', ly: -95 });
    a.line('B', 'F', tDb, S('twist').t1, { color: RED, label: 'SAME TRITONE', ly: 78 });
    a.ch('C', a.w('twist2', 'substitution'), S('twist').t1, { notes: ['C4', 'E4', 'G4'], bass: 'C3' });

    // essence: one last tension -> release
    const e0 = S('essence').t0, eHome = a.w('essence', 'home');
    a.ch('G7', e0 + 0.1, eHome - 0.05, { notes: ['B3', 'D4', 'F4', 'G4'], bass: 'G2', vel: 0.8 });
    a.line('B', 'F', e0 + 0.1, eHome, { color: RED });
    a.ch('C', eHome - 0.05, S('essence').t1 - 0.3, { notes: ['C4', 'E4', 'G4', 'C5'], bass: 'C2' });
    a.tag('C', eHome, S('essence').t1, 'HOME');
    a.cta(a.at('cta') + 0.6, 'Leave an idea in the comments');
  },
};
