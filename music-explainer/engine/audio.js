// Synthesizes the music of a timeline (piano chords, bass, melody notes, light percussion)
// and mixes the narration on top with the music ducked underneath -> build/audio.wav
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const SR = 44100;

function renderAudio(dir, TL) {
  const N = Math.ceil(TL.duration * SR);
  const L = new Float32Array(N), R = new Float32Array(N);
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  function piano(m, t0, dur, vel, pan = 0) {
    const f = mtof(m), s0 = Math.floor(t0 * SR), len = Math.floor((dur + 1.2) * SR);
    const gl = vel * (1 - pan) * 0.5, gr = vel * (1 + pan) * 0.5;
    for (let i = 0; i < len && s0 + i < N; i++) {
      if (s0 + i < 0) continue;
      const t = i / SR, att = Math.min(1, t / 0.004), rel = t < dur ? 1 : Math.exp(-(t - dur) * 7);
      let v = 0;
      for (let h = 1; h <= 7; h++) v += Math.pow(h, -1.4) * Math.exp(-t * (0.9 + h * 0.55)) * Math.sin(2 * Math.PI * f * h * (1 + 0.0004 * h * h) * t);
      v *= att * rel; L[s0 + i] += v * gl; R[s0 + i] += v * gr;
    }
  }
  function bass(m, t0, dur, vel) {
    const f = mtof(m), s0 = Math.floor(t0 * SR), len = Math.floor((dur + 0.6) * SR);
    for (let i = 0; i < len && s0 + i < N; i++) {
      const t = i / SR;
      const env = Math.min(1, t / 0.01) * Math.exp(-t * 0.8) * (t < dur ? 1 : Math.exp(-(t - dur) * 9));
      const v = (Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(4 * Math.PI * f * t)) * env * vel;
      L[s0 + i] += v; R[s0 + i] += v;
    }
  }
  let seed = 1;
  const noise = () => { seed = (seed * 16807) % 2147483647; return seed / 1073741823.5 - 1; };
  function perc(type, t0, vel) {
    const s0 = Math.floor(t0 * SR), len = Math.floor(0.4 * SR);
    let lp = 0;
    for (let i = 0; i < len && s0 + i < N; i++) {
      const t = i / SR; let v = 0;
      if (type === 'kick') v = Math.sin(2 * Math.PI * (50 + 90 * Math.exp(-t * 30)) * t) * Math.exp(-t * 9) * 0.9;
      else if (type === 'snare') { lp += (noise() - lp) * 0.5; v = (lp * 0.7 * Math.exp(-t * 18) + Math.sin(2 * Math.PI * 190 * t) * 0.3 * Math.exp(-t * 25)); }
      else { const n = noise(); lp += (n - lp) * 0.9; v = (n - lp) * 0.5 * Math.exp(-t * 60); } // hat
      L[s0 + i] += v * vel * 0.35; R[s0 + i] += v * vel * 0.35;
    }
  }

  for (const c of TL.chords) {
    if (c.mute) continue;
    const dur = c.t1 - c.t0, strikes = c.strikes || [{ o: 0, v: 1 }];
    strikes.forEach(s => {
      const v = 0.22 * c.vel * s.v;
      c.notes.forEach((m, j) => piano(m, c.t0 + s.o + j * 0.012, Math.max(0.2, dur - s.o), v, (j / Math.max(1, c.notes.length - 1) - 0.5) * 0.7));
    });
    if (c.bass !== null) bass(c.bass, c.t0, dur, 0.29 * c.vel);
  }
  for (const n of TL.notes) piano(n.m, n.t0, n.dur, n.vel, 0);
  for (const p of TL.perc) perc(p.type, p.t, p.vel);

  // Schroeder reverb
  function reverb(x) {
    const out = new Float32Array(x.length);
    const combs = [1557, 1617, 1491, 1422].map(d => ({ d, buf: new Float32Array(d), i: 0 }));
    for (let n = 0; n < x.length; n++) {
      let s = 0;
      for (const c of combs) { const y = c.buf[c.i]; c.buf[c.i] = x[n] + y * 0.8; c.i = (c.i + 1) % c.d; s += y; }
      out[n] = s / 4;
    }
    for (const d of [225, 556]) {
      const buf = new Float32Array(d); let i = 0;
      for (let n = 0; n < out.length; n++) { const b = buf[i]; const y = -out[n] + b; buf[i] = out[n] + b * 0.5; out[n] = y; i = (i + 1) % d; }
    }
    return out;
  }
  const rl = reverb(L), rr = reverb(R);
  let peak = 1e-9;
  for (let n = 0; n < N; n++) { L[n] += rl[n] * 0.3; R[n] += rr[n] * 0.3; peak = Math.max(peak, Math.abs(L[n]), Math.abs(R[n])); }
  const g = 0.89 / peak;
  const buf = Buffer.alloc(44 + N * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
  for (let n = 0; n < N; n++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[n] * g)) * 32767), 44 + n * 4);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[n] * g)) * 32767), 46 + n * 4);
  }
  const build = path.join(dir, 'build');
  fs.mkdirSync(build, { recursive: true });
  fs.writeFileSync(path.join(build, 'music.wav'), buf);

  const vo = TL.vo.filter(v => fs.existsSync(path.join(dir, v.file)));
  const out = path.join(build, 'audio.wav');
  if (!vo.length) { fs.renameSync(path.join(build, 'music.wav'), out); return out; }
  const inputs = ['-i', path.join(build, 'music.wav')];
  vo.forEach(v => inputs.push('-i', path.join(dir, v.file)));
  const delays = vo.map((v, i) => `[${i + 1}]adelay=${Math.round(v.at * 1000)}:all=1,aformat=channel_layouts=stereo[v${i}]`).join(';');
  const filter = `${delays};${vo.map((_, i) => `[v${i}]`).join('')}amix=inputs=${vo.length}:normalize=0,volume=1.15,apad=whole_dur=${TL.duration},asplit=2[voice][sc];` +
    `[0]volume=0.5[m];[m][sc]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=350[duck];` +
    `[duck][voice]amix=inputs=2:normalize=0,alimiter=limit=0.95,atrim=0:${TL.duration},afade=t=out:st=${Math.max(0, TL.duration - 1.2)}:d=1.2[out]`;
  execFileSync('ffmpeg', ['-y', '-v', 'error', ...inputs, '-filter_complex', filter, '-map', '[out]', '-ar', '44100', out]);
  fs.unlinkSync(path.join(build, 'music.wav'));
  return out;
}

module.exports = { renderAudio };
