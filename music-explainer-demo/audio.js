// Synthesizes the soundtrack (piano-ish chords + bass + scale run) into audio.wav
const fs = require('fs');
const TL = require('./timeline.js');
const SR = 44100;
const N = Math.ceil(TL.DURATION * SR);
const L = new Float32Array(N), R = new Float32Array(N);

const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

function piano(m, t0, dur, vel, pan = 0) {
  const f = mtof(m), s0 = Math.floor(t0 * SR), len = Math.floor((dur + 1.2) * SR);
  const gl = vel * (1 - pan) * 0.5, gr = vel * (1 + pan) * 0.5;
  for (let i = 0; i < len && s0 + i < N; i++) {
    const t = i / SR;
    const att = Math.min(1, t / 0.004);
    const rel = t < dur ? 1 : Math.exp(-(t - dur) * 7);
    let v = 0;
    for (let h = 1; h <= 7; h++) {
      const amp = Math.pow(h, -1.4) * Math.exp(-t * (0.9 + h * 0.55));
      v += amp * Math.sin(2 * Math.PI * f * h * (1 + 0.0004 * h * h) * t);
    }
    v *= att * rel;
    L[s0 + i] += v * gl; R[s0 + i] += v * gr;
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

function playChord(c, vel) {
  const p = TL.PROG[c.idx];
  const dur = c.t1 - c.t0;
  const strikes = c.pulse ? [0, c.pulse] : [0];
  strikes.forEach((off, si) => {
    const v = si === 0 ? vel : vel * 0.55;
    p.upper.forEach((m, j) => piano(m + c.key, c.t0 + off + j * 0.012, dur - off, v, (j - 1) * 0.35));
  });
  bass(p.bass + c.key, c.t0, dur, vel * 1.3);
}

TL.TEASER.forEach(c => playChord(c, 0.16));
TL.SCALE_NOTES.forEach(n => piano(n.m, n.t0, n.dur, 0.32, (n.m - 65) / 12));
TL.CHORDS.forEach(c => playChord(c, c.outro ? 0.2 : 0.22));

// simple Schroeder reverb
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
let peak = 0;
for (let n = 0; n < N; n++) { L[n] += rl[n] * 0.3; R[n] += rr[n] * 0.3; peak = Math.max(peak, Math.abs(L[n]), Math.abs(R[n])); }
const g = 0.89 / peak, fade = 1.2 * SR;

const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let n = 0; n < N; n++) {
  const f = n > N - fade ? (N - n) / fade : 1;
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[n] * g * f)) * 32767), 44 + n * 4);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[n] * g * f)) * 32767), 46 + n * 4);
}
fs.writeFileSync(__dirname + '/audio.wav', buf);
console.log('audio.wav', TL.DURATION.toFixed(1) + 's');
