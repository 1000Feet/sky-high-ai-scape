// Music theory helpers shared by the timeline builder (node) and the player (browser).
(function (root) {
  const mod = (a, n) => ((a % n) + n) % n;
  const LETTER = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

  // colour of each scale degree (semitones above the tonic)
  const DEG12 = ['#ff7a93', '#ff8f6e', '#ffa45c', '#ffc04f', '#ffd84a', '#7be07b',
    '#4fdcaa', '#45d6c8', '#53bce6', '#62a8ff', '#8d98ff', '#b48cff'];
  const degColor = (pc, tonic = 0) => DEG12[mod(pc - tonic, 12)];

  // "C", "F#", "Bb" -> pitch class
  function pc(name) {
    const m = /^([A-G])([#b]?)/.exec(name);
    if (!m) throw new Error('bad note name ' + name);
    return mod(LETTER[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0), 12);
  }
  // "C4", "F#3", "Bb2" -> midi
  function midi(name) {
    if (typeof name === 'number') return name;
    const m = /^([A-G][#b]?)(-?\d)$/.exec(name);
    if (!m) throw new Error('bad note ' + name);
    return (parseInt(m[2], 10) + 1) * 12 + LETTER[m[1][0]] + (m[1][1] === '#' ? 1 : m[1][1] === 'b' ? -1 : 0);
  }

  const QUAL = {
    '': [0, 4, 7], m: [0, 3, 7], '5': [0, 7], '7': [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10],
    m7b5: [0, 3, 6, 10], dim: [0, 3, 6], dim7: [0, 3, 6, 9], aug: [0, 4, 8], sus4: [0, 5, 7], sus2: [0, 2, 7],
    '6': [0, 4, 7, 9], m6: [0, 3, 7, 9], mMaj7: [0, 3, 7, 11], add9: [0, 4, 7, 2],
  };
  // "F#m7b5/C" -> { root, pcs, bass, name }
  function parseChord(name) {
    const m = /^([A-G][#b]?)([^/]*)(?:\/([A-G][#b]?))?$/.exec(name);
    if (!m || !(m[2] in QUAL)) throw new Error('unknown chord ' + name);
    const root = pc(m[1]);
    return { name, root, quality: m[2], pcs: QUAL[m[2]].map(i => mod(root + i, 12)), bass: m[3] ? pc(m[3]) : root };
  }

  // close-position voicings of the chord tones, picked to move least from `prev`
  function voice(ch, prev) {
    const pcs = ch.quality === '5' ? [ch.root, mod(ch.root + 7, 12), ch.root] : ch.pcs.slice();
    const n = pcs.length, cands = [];
    for (let inv = 0; inv < (ch.quality === '5' ? 1 : n); inv++) {
      const order = pcs.slice(inv).concat(pcs.slice(0, inv));
      for (let base = 48; base <= 66; base++) {
        if (mod(base, 12) !== order[0]) continue;
        const v = [base];
        for (let i = 1; i < n; i++) { let x = v[i - 1] + 1; while (mod(x, 12) !== order[i]) x++; v.push(x); }
        if (v[0] >= 52 && v[n - 1] <= 77) cands.push(v);
      }
    }
    const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
    let best = null, bestCost = Infinity;
    for (const v of cands) {
      let cost;
      if (prev && prev.length === v.length) cost = v.reduce((s, x, i) => s + Math.abs(x - prev[i]), 0);
      else cost = Math.abs(mean(v) - (prev ? mean(prev) : 64)) * 2;
      cost += Math.abs(mean(v) - 64) * 0.15; // gently stay near the middle
      if (cost < bestCost) { bestCost = cost; best = v; }
    }
    return best;
  }
  function voiceBass(bassPc, prevBass) {
    let best = null;
    for (let m = 31; m <= 52; m++) {
      if (mod(m, 12) !== bassPc) continue;
      const cost = Math.abs(m - (prevBass ?? 43));
      if (best === null || cost < best.cost) best = { m, cost };
    }
    return best.m;
  }

  const T = { mod, NAMES, DEG12, degColor, pc, midi, parseChord, voice, voiceBass,
    MAJOR: [0, 2, 4, 5, 7, 9, 11], MINOR: [0, 2, 3, 5, 7, 8, 10] };
  if (typeof module !== 'undefined') module.exports = T; else root.THEORY = T;
})(this);
