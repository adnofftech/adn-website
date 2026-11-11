// Génère l'image de partage (public/og.png, 1200×630) et l'icône tactile (public/apple-touch-icon.png) avec les vraies polices.
// Usage : node scripts/og.mjs
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const font = (f) => `data:font/woff2;base64,${readFileSync(`src/styles/fonts/${f}`).toString('base64')}`;
const css = `
@font-face{font-family:'Cormorant Garamond';src:url(${font('cormorant-garamond-latin-wght-normal.woff2')}) format('woff2-variations');font-weight:300 700}
@font-face{font-family:'Instrument Sans';src:url(${font('instrument-sans-latin-wght-normal.woff2')}) format('woff2-variations');font-weight:400 700}
html,body{margin:0;background:#0b0a0a;color:#f5efe7}
.og{width:1200px;height:630px;padding:72px 80px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;font-family:'Instrument Sans',sans-serif;background:#0b0a0a;position:relative;overflow:hidden}
.sig{font-family:'Cormorant Garamond',serif;font-weight:600;font-size:64px;line-height:1}
.pt{color:#e36d78}
h1{font-family:'Cormorant Garamond',serif;font-weight:500;font-size:132px;line-height:.95;letter-spacing:-.015em;margin:0;max-width:11ch}
p{font-size:28px;color:#bfb5b0;margin:24px 0 0}
.filet{position:absolute;left:80px;right:80px;top:150px;height:1px;background:rgba(245,239,231,.18)}
.icone{width:180px;height:180px;background:#0b0a0a;display:grid;place-items:center;border-radius:36px}
.icone .sig{font-size:118px;letter-spacing:-.02em}
`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(`<style>${css}</style><div class="og"><div class="sig">LArtiste<span class="pt">.</span>Ink</div><div class="filet"></div><div><h1>Tatouages à Saint‑Paul<span class="pt">.</span></h1><p>La Réunion. Encres noire et rouge, sur rendez-vous.</p></div></div>`);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'public/og.png', clip: { x: 0, y: 0, width: 1200, height: 630 } });
await page.setViewportSize({ width: 180, height: 180 });
await page.setContent(`<style>${css}</style><div class="icone"><div class="sig">L<span class="pt">.</span></div></div>`);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'public/apple-touch-icon.png', clip: { x: 0, y: 0, width: 180, height: 180 } });
await browser.close();
console.log('public/og.png et public/apple-touch-icon.png générés');
