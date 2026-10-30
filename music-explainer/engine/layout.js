// Builds the timeline (build/timeline.json + build/timeline.js) for a video from its
// script.js and the voiceover timings in voice.json. Scenes stretch to fit their narration;
// the script's build(api) places every visual and musical event, usually on spoken words.
const fs = require('fs');
const path = require('path');
const T = require('./theory.js');

function buildTimeline(dir) {
  const script = require(path.resolve(dir, 'script.js'));
  let voice = null;
  try { voice = JSON.parse(fs.readFileSync(path.join(dir, 'voice.json'))); } catch (e) {}
  const segText = Object.fromEntries(script.segments.map(s => [s.id, s.text]));
  const segInfo = id => {
    const v = voice && voice.segments[id];
    if (v && v.text === segText[id]) return v;
    // no voice yet: estimate ~2.6 words per second so layouts can be previewed
    const words = segText[id].split(/\s+/);
    return { dur: words.length / 2.6, speechEnd: words.length / 2.6, words: words.map((w, i) => ({ w, t: i / 2.6, end: (i + 1) / 2.6 })), estimated: true };
  };

  // ---- scenes & narration placement ----
  const scenes = [], vo = [], captions = [];
  let cursor = 0;
  for (const sc of script.scenes) {
    const lead = sc.lead ?? 0.15, gap = sc.gap ?? 0.3, tail = sc.tail ?? 0.35;
    const s = { ...sc, t0: cursor };
    let at = cursor + lead, end = at;
    s.segAt = {};
    for (const id of sc.segs || []) {
      const info = segInfo(id);
      s.segAt[id] = at;
      vo.push({ id, at, file: `vo/${id}.mp3` });
      captions.push({ id, t0: at - 0.1, text: segText[id], words: info.words.map(w => ({ w: w.w, t: at + w.t })) });
      end = at + info.speechEnd;
      at = end + gap;
    }
    s.t1 = Math.max(cursor + (sc.min ?? 0), end + tail);
    scenes.push(s);
    cursor = s.t1;
  }
  const duration = cursor;
  captions.forEach((c, i) => {
    const next = captions[i + 1];
    const sc = scenes.find(s => c.t0 + 0.1 >= s.t0 && c.t0 + 0.1 < s.t1);
    c.t1 = next && next.t0 < sc.t1 ? next.t0 : Math.min(sc.t1, next ? next.t0 : duration);
  });

  // ---- api for script.build ----
  const TL = { duration, scenes, vo, captions, chords: [], notes: [], perc: [], scales: [], layoutKeys: [{ t: 0, m: 0 }],
    tags: [], rings: [], arcs: [], lines: [], ghosts: [], polys: [], walkers: [], bigs: [], lissajous: [], grids: [], cta: null };
  const findScene = id => { const s = scenes.find(s => s.id === id); if (!s) throw new Error('no scene ' + id); return s; };
  const sceneAt = t => scenes.find(s => t >= s.t0 && t < s.t1) || scenes[scenes.length - 1];
  const segScene = id => scenes.find(s => s.segAt && id in s.segAt);
  const strip = w => w.replace(/[^A-Za-z0-9#'’]/g, '').replace('’', "'");
  let prevVoicing = null, prevBass = null;

  const api = {
    T, duration, scene: findScene,
    at: id => { const s = segScene(id); if (!s) throw new Error('no seg ' + id); return s.segAt[id]; },
    end: id => api.at(id) + segInfo(id).speechEnd,
    // absolute time of the nth occurrence of `word` in a segment (case-sensitive, then case-insensitive)
    w(id, word, n = 0) {
      const ws = segInfo(id).words;
      let hits = ws.filter(x => strip(x.w) === word);
      if (!hits.length) hits = ws.filter(x => strip(x.w).toLowerCase() === word.toLowerCase());
      if (!hits[n]) throw new Error(`word "${word}"[${n}] not in segment ${id}: ${ws.map(x => x.w).join(' ')}`);
      return api.at(id) + hits[n].t;
    },
    tonicAt: t => sceneAt(t).tonic ?? 0,
    // chord: voiced automatically with smooth voice leading unless notes/bass are given
    ch(name, t0, t1, o = {}) {
      const c = T.parseChord(name);
      const notes = o.notes ? o.notes.map(T.midi) : T.voice(c, prevVoicing);
      const bass = o.bass === false ? null : o.bass !== undefined ? T.midi(o.bass) : T.voiceBass(c.bass, prevBass);
      prevVoicing = notes; if (bass !== null) prevBass = bass;
      const ev = { t0, t1, name: o.label ?? name, root: c.root, pcs: c.pcs, notes, bass, tonic: o.tonic ?? api.tonicAt(t0),
        row: o.row ?? null, vel: o.vel ?? 1, mute: !!o.mute, shape: o.shape !== false, strikes: o.strikes || null, snap: !!o.snap,
        hideName: !!o.hideName };
      TL.chords.push(ev);
      return ev;
    },
    // evenly spaced chords between t0 and t1; rows/strikes can be given per chord
    seq(names, t0, t1, o = {}) {
      const len = (t1 - t0) / names.length;
      return names.map((n, i) => api.ch(n, t0 + i * len, t0 + (i + 1) * len, {
        ...o, row: o.rows ? o.rows[i] : o.row, strikes: o.strikes === 'pulse' ? [{ o: 0, v: 1 }, { o: len / 2, v: 0.55 }] : o.strikes,
      }));
    },
    note(m, t0, dur, o = {}) { const ev = { t0, m: T.midi(m), dur, vel: o.vel ?? 0.32, show: o.show !== false, tonic: o.tonic ?? api.tonicAt(t0) }; TL.notes.push(ev); return ev; },
    // melody: [[note, beats], ...] starting at t0, `beat` seconds per beat; null note = rest
    melody(list, t0, beat, o = {}) {
      let t = t0;
      for (const [n, b] of list) { if (n !== null) api.note(n, t, b * beat * (o.legato ?? 0.95), o); t += b * beat; }
      return t;
    },
    perc(type, t, vel = 1) { TL.perc.push({ type, t, vel }); },
    // lit scale dots (degrees above tonic); a new set with the same pattern rotates into place
    scale(t0, tonic, degs = T.MAJOR, o = {}) { TL.scales.push({ t0, tonic: typeof tonic === 'string' ? T.pc(tonic) : tonic, degs, popIn: o.popIn || null }); },
    layout(t, m, dur = 1.2) { TL.layoutKeys.push({ t, m: TL.layoutKeys[TL.layoutKeys.length - 1].m }, { t: t + dur, m }); },
    tag(p, t0, t1, text, o = {}) { TL.tags.push({ pc: typeof p === 'string' ? T.pc(p) : p, t0, t1, text, ...o }); },
    ring(pcs, t0, t1, o = {}) { TL.rings.push({ pcs: pcs.map(p => (typeof p === 'string' ? T.pc(p) : p)), t0, t1, ...o }); },
    arc(from, to, t0, t1, o = {}) { TL.arcs.push({ from: typeof from === 'string' ? T.pc(from) : from, to: typeof to === 'string' ? T.pc(to) : to, t0, t1, ...o }); },
    line(a, b, t0, t1, o = {}) { TL.lines.push({ a: typeof a === 'string' ? T.pc(a) : a, b: typeof b === 'string' ? T.pc(b) : b, t0, t1, ...o }); },
    ghost(name, t0, t1, o = {}) { TL.ghosts.push({ pcs: T.parseChord(name).pcs, t0, t1, ...o }); },
    poly(pcs, t0, t1, o = {}) { TL.polys.push({ pcs: pcs.map(p => (typeof p === 'string' ? T.pc(p) : p)), t0, t1, ...o }); },
    walker(points, o = {}) { TL.walkers.push({ points: points.map(([t, p]) => ({ t, pc: typeof p === 'string' ? T.pc(p) : p })), ...o }); },
    big(text, t0, t1, o = {}) { TL.bigs.push({ text, t0, t1, ...o }); },
    lissajous(a, b, t0, t1, o = {}) { TL.lissajous.push({ a, b, t0, t1, ...o }); },
    grid(cells, t0, t1, o = {}) { const g = { cells, t0, t1, rows: o.rows ?? 3, cols: o.cols ?? 4, active: [], ...o }; TL.grids.push(g); return g; },
    cta(t, text) { TL.cta = { t, text }; },
  };

  script.build(api);
  TL.chords.sort((a, b) => a.t0 - b.t0);
  TL.scales.sort((a, b) => a.t0 - b.t0);
  TL.layoutKeys.sort((a, b) => a.t - b.t);
  TL.meta = { slug: script.slug, title: script.title, estimated: script.segments.some(s => segInfo(s.id).estimated) };
  return TL;
}

function writeTimeline(dir) {
  const TL = buildTimeline(dir);
  fs.mkdirSync(path.join(dir, 'build'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'build/timeline.json'), JSON.stringify(TL));
  fs.writeFileSync(path.join(dir, 'build/timeline.js'), 'window.TL = ' + JSON.stringify(TL) + ';\n');
  return TL;
}

module.exports = { buildTimeline, writeTimeline };
if (require.main === module) {
  const TL = writeTimeline(process.argv[2]);
  console.log(TL.meta.slug, TL.duration.toFixed(2) + 's', TL.meta.estimated ? '(estimated voice timings)' : '');
  TL.scenes.forEach(s => console.log(' ', s.id.padEnd(10), s.t0.toFixed(2), '→', s.t1.toFixed(2)));
}
