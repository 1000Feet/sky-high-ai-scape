// Generates the voiceover with ElevenLabs (eleven_v4) segment by segment,
// saving vo/<id>.mp3 plus voice.json (durations + word timings) for timeline.js.
// The API key is expected to be injected by the environment proxy, or set ELEVENLABS_API_KEY.
const { execFileSync } = require('child_process');
const fs = require('fs');

const VOICE_ID = process.env.VOICE_ID || 'EwzF7Z2UMSib9JaKx0Kg'; // Jeremy - Warm, Trustworthy, Sincere
const MODEL_ID = 'eleven_v4';

const SEGMENTS = [
  { id: 'hook',    text: 'Why do so many hit songs sound... exactly the same?' },
  { id: 'scale',   text: 'Take the seven notes of the C major scale.' },
  { id: 'prog',    text: 'Now build a chord on the first, the fifth, the sixth, and the fourth note.' },
  { id: 'song0',   text: "You've heard it in Let It Be, by the Beatles..." },
  { id: 'song1',   text: 'With or Without You, by U2...' },
  { id: 'song2',   text: 'Someone Like You, by Adele...' },
  { id: 'song3',   text: "And Don't Stop Believin', by Journey." },
  { id: 'outro1',  text: 'Change the key, and the whole shape just rotates...' },
  { id: 'outro2',  text: "But it's the exact same shape." },
  // part 2: what happens harmonically
  { id: 'home',    text: 'So why does it work? Every key has a home... and C is home.' },
  { id: 'tension', text: 'G pulls away. Its B sits a half step below home, aching to resolve.' },
  { id: 'twist',   text: 'So your ear expects home. Instead... A minor.' },
  { id: 'mirror',  text: 'Flip C in a mirror, and you get A minor. Same family... but sad.' },
  { id: 'lift',    text: 'Then F lifts you up, and slides you back home.' },
  { id: 'rot0',    text: 'Now start on the sad chord, and the whole mood flips.' },
  { id: 'rot1',    text: 'Zombie, by the Cranberries...' },
  { id: 'rot2',    text: 'Despacito...' },
  { id: 'essence', text: "That's the essence of music: leave home, build tension... and find your way back." },
  { id: 'cta',     text: 'Which song should I break down next?' },
];

fs.mkdirSync(__dirname + '/vo', { recursive: true });
// segments already generated with the same text are kept (no credits spent); FORCE=1 regenerates all
let prev = null;
try { prev = JSON.parse(fs.readFileSync(__dirname + '/voice.json')); } catch (e) {}
const out = { voice_id: VOICE_ID, model_id: MODEL_ID, segments: {} };

for (const seg of SEGMENTS) {
  const old = prev && prev.voice_id === VOICE_ID && prev.segments[seg.id];
  if (!process.env.FORCE && old && old.text === seg.text && fs.existsSync(`${__dirname}/vo/${seg.id}.mp3`)) {
    out.segments[seg.id] = old; console.log(seg.id.padEnd(7), 'kept'); continue;
  }
  const args = ['-sS', '-X', 'POST',
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps?output_format=mp3_44100_128`,
    '-H', 'Content-Type: application/json',
    '-d', JSON.stringify({ text: seg.text, model_id: MODEL_ID })];
  if (process.env.ELEVENLABS_API_KEY) args.push('-H', 'xi-api-key: ' + process.env.ELEVENLABS_API_KEY);
  const res = JSON.parse(execFileSync('curl', args, { maxBuffer: 64 << 20 }).toString());
  if (!res.audio_base64) throw new Error(seg.id + ': ' + JSON.stringify(res).slice(0, 300));
  fs.writeFileSync(`${__dirname}/vo/${seg.id}.mp3`, Buffer.from(res.audio_base64, 'base64'));

  // characters -> words with start times
  const a = res.alignment, words = [];
  let cur = null;
  a.characters.forEach((ch, i) => {
    if (/\s/.test(ch)) { if (cur) words.push(cur); cur = null; return; }
    if (!cur) cur = { w: '', t: a.character_start_times_seconds[i] };
    cur.w += ch; cur.end = a.character_end_times_seconds[i];
  });
  if (cur) words.push(cur);
  const dur = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', `${__dirname}/vo/${seg.id}.mp3`]).toString());
  const speechEnd = words.length ? words[words.length - 1].end : dur;
  out.segments[seg.id] = { text: seg.text, dur, speechEnd, words };
  console.log(seg.id.padEnd(7), dur.toFixed(2) + 's', 'speech ends', speechEnd.toFixed(2) + 's');
}

fs.writeFileSync(__dirname + '/voice.json', JSON.stringify(out, null, 1));
fs.writeFileSync(__dirname + '/voice.js', 'window.VOICE = ' + JSON.stringify(out) + ';\n');
