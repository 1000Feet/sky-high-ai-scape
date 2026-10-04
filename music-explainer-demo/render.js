// node render.js            -> renders demo.mp4
// node render.js 5 10 20    -> renders preview stills at those seconds
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const TL = require('./timeline.js');
const FPS = 30;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + __dirname + '/index.html');
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => Promise.all(["800 10px 'DM Sans'", "700 10px 'DM Sans'", "400 10px 'DM Sans'", "500 10px 'DM Mono'", "400 10px 'DM Mono'"].map(f => document.fonts.load(f))));
  const grab = async t => {
    const url = await page.evaluate(t => { draw(t); return document.getElementById('c').toDataURL('image/jpeg', 0.94); }, t);
    return Buffer.from(url.split(',')[1], 'base64');
  };

  const stills = process.argv.slice(2).map(Number);
  if (stills.length) {
    for (const t of stills) fs.writeFileSync(`${__dirname}/still_${t}.jpg`, await grab(t));
    await browser.close(); return;
  }

  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-i', __dirname + '/audio.wav', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '19', '-preset', 'medium',
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', __dirname + '/demo.mp4'], { stdio: ['pipe', 'inherit', 'inherit'] });
  const frames = Math.ceil(TL.DURATION * FPS);
  for (let f = 0; f < frames; f++) {
    const buf = await grab(f / FPS);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 150 === 0) console.log(`frame ${f}/${frames}`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log('done');
})();
