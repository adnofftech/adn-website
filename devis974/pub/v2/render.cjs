// Rendu image par image : node render.cjs probe <v|h> t1 t2 … | chunk <v|h> k n | encode <v|h> <audio.wav> <sortie.mp4>
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const HERE = __dirname, FPS = 30, T = JSON.parse(fs.readFileSync(path.join(HERE, 'timeline.json'))).duration, SIZE = { v: [1080, 1920], h: [1920, 1080] };
const PORT = process.env.PORT || 8791;
const ff = a => execFileSync('ffmpeg', ['-v', 'error', '-y', ...a], { stdio: 'inherit' });
async function open(fmt) {
  const b = await chromium.launch({ args: ['--force-color-profile=srgb', '--font-render-hinting=none'] });
  const [w, h] = SIZE[fmt]; const pg = await b.newPage({ viewport: { width: w, height: h } });
  const errs = []; pg.on('pageerror', e => errs.push(String(e))); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await pg.goto(`http://localhost:${PORT}/film.html?f=${fmt}`); await pg.waitForFunction('window.ready === true', null, { timeout: 60000 });
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
    const d = path.join(HERE, 'qa', 'probe_' + fmt); fs.mkdirSync(d, { recursive: true }); for (const f of fs.readdirSync(d)) fs.unlinkSync(path.join(d, f));
    const o = await open(fmt); const ts = rest.map(Number);
    for (let i = 0; i < ts.length; i++) await shot(o, ts[i], path.join(d, `p_${String(i).padStart(2, '0')}.png`));
    await o.b.close(); if (o.errs.length) console.log('ERREURS PAGE', o.errs.slice(0, 6));
    const cols = fmt === 'v' ? 8 : 5;
    ff(['-i', path.join(d, 'p_%02d.png'), '-vf', `scale=${fmt === 'v' ? 270 : 400}:-1,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='%{n}':x=4:y=4:fontsize=16:fontcolor=yellow:box=1:boxcolor=black,tile=${cols}x${Math.ceil(ts.length / cols)}:padding=4:color=white`, '-frames:v', '1', path.join(d, 'sheet.png')]);
    console.log('planche', path.join(d, 'sheet.png'));
  } else if (cmd === 'chunk') {
    const [k, n] = rest.map(Number), N = Math.round(T * FPS); let a = Math.floor(k * N / n), z = Math.floor((k + 1) * N / n);
    if (process.env.RANGE) [a, z] = process.env.RANGE.split('-').map(Number);
    const d = path.join(HERE, 'frames_' + fmt); fs.mkdirSync(d, { recursive: true });
    const o = await open(fmt);
    for (let i = a; i < z; i++) { await shot(o, i / FPS, path.join(d, `f_${String(i).padStart(5, '0')}.jpg`), 93); if ((i - a) % 150 === 0) console.log(fmt, k, i); }
    await o.b.close(); if (o.errs.length) console.log('ERREURS PAGE', o.errs.slice(0, 6));
  } else if (cmd === 'encode') {
    const [audio, out] = rest; const d = path.join(HERE, 'frames_' + fmt), n = fs.readdirSync(d).filter(f => f.endsWith('.jpg')).length;
    if (n !== Math.round(T * FPS)) throw new Error('images manquantes : ' + n);
    ff(['-framerate', String(FPS), '-i', path.join(d, 'f_%05d.jpg'), '-i', audio, '-map', '0:v', '-map', '1:a',
      '-vf', 'scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p', '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
      '-c:v', 'libx264', '-profile:v', 'high', '-crf', '17', '-preset', 'slow', '-r', '30', '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', '-t', String(T), out]);
    console.log('vidéo', out);
  }
})().catch(e => { console.error('ECHEC', e.message); process.exit(1); });
