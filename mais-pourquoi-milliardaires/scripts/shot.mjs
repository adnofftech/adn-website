// Banc d'essai : captures d'un module de scène à des instants donnés.
// usage : node scripts/shot.mjs <module> <t1,t2,...> [outDir] [port]
import { createRequire } from 'module'; const require = createRequire('/opt/node22/lib/node_modules/'); const { chromium } = require('playwright');
import http from 'http'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)); const root = path.join(here, '..', 'video');
const [mod, ts, outArg, portArg] = process.argv.slice(2); const out = outArg || `/tmp/claude-0/shots-${mod}`; const port = Number(portArg || (9000 + Math.floor(Math.random() * 900)));
fs.mkdirSync(out, { recursive: true });
const mime = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json' };
const srv = http.createServer((q, s) => { const u = decodeURIComponent(q.url.split('?')[0]); const f = path.join(root, u === '/' ? 'preview.html' : u); fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); return } s.writeHead(200, { 'content-type': mime[path.extname(f)] || 'application/octet-stream' }); s.end(d) }) }).listen(port);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
p.on('console', m => { const t = m.text(); if (!/404|GPU stall/.test(t)) console.log('console:', t); }); p.on('pageerror', e => console.log('PAGEERR', e.message));
await p.goto(`http://localhost:${port}/?m=${mod}`, { waitUntil: 'commit' });
await p.waitForFunction('window.__ready', null, { timeout: 180000 });
for (const t of ts.split(',').map(Number)) { const t0 = Date.now(); await p.evaluate((t) => window.__renderAt(t), t); const f = `${out}/${mod}_t${String(t).replace('.', '_')}.png`; await p.screenshot({ path: f }); console.log('t', t, (Date.now() - t0) + 'ms', f); }
await b.close(); srv.close();
