// node engine/tts.js videos/<slug>
// Generates the narration with ElevenLabs (eleven_v4) for each segment of script.js, saving
// vo/<id>.mp3 and word timings in voice.json. Segments whose text is unchanged are kept,
// so no credits are spent on re-runs. FORCE=1 regenerates everything.
// The API key is injected by the environment proxy, or set ELEVENLABS_API_KEY.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const VOICE_ID = process.env.VOICE_ID || 'EwzF7Z2UMSib9JaKx0Kg'; // Jeremy - Warm, Trustworthy, Sincere
const MODEL_ID = 'eleven_v4';

function tts(dir) {
  const script = require(path.resolve(dir, 'script.js'));
  fs.mkdirSync(path.join(dir, 'vo'), { recursive: true });
  let prev = null;
  try { prev = JSON.parse(fs.readFileSync(path.join(dir, 'voice.json'))); } catch (e) {}
  const out = { voice_id: VOICE_ID, model_id: MODEL_ID, segments: {} };
  let chars = 0;
  for (const seg of script.segments) {
    const file = path.join(dir, 'vo', seg.id + '.mp3');
    const old = prev && prev.voice_id === VOICE_ID && prev.segments[seg.id];
    if (!process.env.FORCE && old && old.text === seg.text && fs.existsSync(file)) { out.segments[seg.id] = old; continue; }
    const args = ['-sS', '-X', 'POST',
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps?output_format=mp3_44100_128`,
      '-H', 'Content-Type: application/json', '-d', JSON.stringify({ text: seg.text, model_id: MODEL_ID })];
    if (process.env.ELEVENLABS_API_KEY) args.push('-H', 'xi-api-key: ' + process.env.ELEVENLABS_API_KEY);
    const res = JSON.parse(execFileSync('curl', args, { maxBuffer: 64 << 20 }).toString());
    if (!res.audio_base64) throw new Error(seg.id + ': ' + JSON.stringify(res).slice(0, 300));
    fs.writeFileSync(file, Buffer.from(res.audio_base64, 'base64'));
    const a = res.alignment, words = [];
    let cur = null;
    a.characters.forEach((ch, i) => {
      if (/\s/.test(ch)) { if (cur) words.push(cur); cur = null; return; }
      if (!cur) cur = { w: '', t: a.character_start_times_seconds[i] };
      cur.w += ch; cur.end = a.character_end_times_seconds[i];
    });
    if (cur) words.push(cur);
    const dur = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString());
    out.segments[seg.id] = { text: seg.text, dur, speechEnd: words.length ? words[words.length - 1].end : dur, words };
    chars += seg.text.length;
    console.log('  tts', seg.id.padEnd(10), dur.toFixed(2) + 's');
  }
  fs.writeFileSync(path.join(dir, 'voice.json'), JSON.stringify(out, null, 1));
  return chars;
}

module.exports = { tts };
if (require.main === module) console.log('characters generated:', tts(process.argv[2]));
