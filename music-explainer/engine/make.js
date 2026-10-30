// node engine/make.js videos/<slug> [--no-tts] [--stills 5 12.5 30]
//   1. narration (ElevenLabs, only for new/changed lines)  2. timeline  3. audio  4. video
// With --stills only preview frames are rendered (videos/<slug>/build/still_<t>.jpg).
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const { tts } = require('./tts.js');
const { writeTimeline } = require('./layout.js');
const { renderAudio } = require('./audio.js');
const FPS = 30;

(async () => {
  const dir = path.resolve(process.argv[2]);
  const args = process.argv.slice(3);
  const si = args.indexOf('--stills');
  const stills = si >= 0 ? args.slice(si + 1).map(Number) : null;
  if (!args.includes('--no-tts')) { const n = tts(dir); if (n) console.log('  narration: ' + n + ' characters'); }
  const TL = writeTimeline(dir);
  console.log(`${TL.meta.slug}: ${TL.duration.toFixed(2)}s${TL.meta.estimated ? ' (estimated voice timings)' : ''}`);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + path.join(__dirname, 'player.html'));
  await page.addScriptTag({ path: path.join(dir, 'build/timeline.js') });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => Promise.all(["800 10px 'DM Sans'", "700 10px 'DM Sans'", "400 10px 'DM Sans'", "500 10px 'DM Mono'", "400 10px 'DM Mono'"].map(f => document.fonts.load(f))));
  const grab = async t => {
    const url = await page.evaluate(t => { draw(t); return document.getElementById('c').toDataURL('image/jpeg', 0.94); }, t);
    return Buffer.from(url.split(',')[1], 'base64');
  };

  if (stills) {
    for (const t of stills) fs.writeFileSync(path.join(dir, `build/still_${t}.jpg`), await grab(t));
    await browser.close(); return;
  }

  const audio = renderAudio(dir, TL);
  const out = path.join(dir, `${TL.meta.slug}.mp4`);
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', '-i', audio,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '19', '-preset', 'medium', '-c:a', 'aac', '-b:a', '192k',
    '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const frames = Math.ceil(TL.duration * FPS);
  for (let f = 0; f < frames; f++) {
    const buf = await grab(f / FPS);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log('  wrote ' + path.relative(process.cwd(), out));
})().catch(e => { console.error(e.message); process.exit(1); });
