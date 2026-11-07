// Rendu Devis974 : node render.cjs probe <v|h> t1 t2 … | chunk <v|h> k n | encode <v|h>
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const HERE = __dirname, FPS = 30, T = 55, SIZE = { v: [1080, 1920], h: [1920, 1080] };
const ff = args => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' });
async function open(fmt) {
  const b = await chromium.launch({ args: ['--force-color-profile=srgb', '--font-render-hinting=none'] });
  const [w, h] = SIZE[fmt]; const pg = await b.newPage({ viewport: { width: w, height: h } });
  const errs = []; pg.on('pageerror', e => errs.push(String(e)));
  await pg.goto(`http://localhost:8790/film.html?f=${fmt}`); await pg.waitForFunction('window.ready === true', null, { timeout: 60000 });
  return { b, pg, errs, stage: await pg.$('#stage') };
}
async function shot(o, t, file, q) {
  await o.pg.evaluate(t => window.seek(t), t);
  await o.pg.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  await o.stage.screenshot({ path: file, type: q ? 'jpeg' : 'png', ...(q ? { quality: q } : {}) });
}
(async () => {
  const [cmd, fmt, ...rest] = process.argv.slice(2);
  if (cmd === 'probe') {
    const d = path.join(HERE, 'probe_' + fmt); fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d);
    const o = await open(fmt); const ts = rest.map(Number);
    for (let i = 0; i < ts.length; i++) await shot(o, ts[i], path.join(d, `p_${String(i).padStart(2, '0')}.png`));
    await o.b.close(); if (o.errs.length) console.log('ERREURS PAGE', o.errs.slice(0, 5));
    const cols = fmt === 'v' ? 6 : 4;
    ff(['-i', path.join(d, 'p_%02d.png'), '-vf', `scale=${fmt === 'v' ? 300 : 480}:-1,tile=${cols}x${Math.ceil(ts.length / cols)}:padding=6:color=white`, '-frames:v', '1', path.join(d, 'sheet.png')]);
    console.log('planche ->', path.join(d, 'sheet.png'));
  } else if (cmd === 'chunk') {
    const [k, n] = rest.map(Number), N = T * FPS, a = Math.floor(k * N / n), z = Math.floor((k + 1) * N / n);
    const d = path.join(HERE, 'frames_' + fmt); fs.mkdirSync(d, { recursive: true });
    const o = await open(fmt);
    for (let i = a; i < z; i++) { await shot(o, i / FPS, path.join(d, `f_${String(i).padStart(5, '0')}.jpg`), 94); if ((i - a) % 150 === 0) console.log(fmt, k, i); }
    await o.b.close(); if (o.errs.length) console.log('ERREURS PAGE', o.errs.slice(0, 5));
  } else if (cmd === 'encode') {
    const d = path.join(HERE, 'frames_' + fmt), n = fs.readdirSync(d).filter(f => f.endsWith('.jpg')).length;
    if (n !== T * FPS) throw new Error('images manquantes : ' + n);
    ff(['-framerate', String(FPS), '-i', path.join(d, 'f_%05d.jpg'), '-i', path.join(HERE, 'out/audio.wav'),
      '-vf', 'scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p', '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
      '-c:v', 'libx264', '-profile:v', 'high', '-crf', '17', '-preset', 'slow', '-r', '30', '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', '-t', String(T),
      path.join(HERE, `out/devis974_pub_${fmt === 'v' ? '9x16' : '16x9'}.mp4`)]);
    console.log('vidéo ok', fmt);
  }
})().catch(e => { console.error('ECHEC', e.message); process.exit(1); });
