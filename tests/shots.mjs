// Captures d'écran des pages aux largeurs de vérification. Usage : node tests/shots.mjs [base-url]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright'); // Playwright préinstallé dans l'environnement
import { mkdirSync } from 'node:fs';
const base = process.argv[2] || 'http://127.0.0.1:4321';
const pages = ['/', '/realisations', '/infos', '/projet', '/mentions-legales', '/confidentialite'];
const largeurs = [360, 390, 768, 1024, 1440, 1920];
mkdirSync('tests/shots', { recursive: true });
const browser = await chromium.launch();
const erreurs = [];
for (const w of largeurs) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 768 ? 800 : 900 }, deviceScaleFactor: 1, locale: 'fr-FR' });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') erreurs.push(`${w} ${page.url()} ${m.text()}`); });
  page.on('pageerror', (e) => erreurs.push(`${w} ${page.url()} ${e.message}`));
  for (const p of pages) {
    await page.goto(base + p, { waitUntil: 'networkidle' });
    await page.waitForTimeout(700);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow > 0) erreurs.push(`${w} ${p} débordement horizontal ${overflow}px`);
    await page.screenshot({ path: `tests/shots/${w}${p === '/' ? '-accueil' : p.replaceAll('/', '-')}.png`, fullPage: true });
  }
  await ctx.close();
}
await browser.close();
console.log(erreurs.length ? erreurs.join('\n') : 'Aucune erreur console ni débordement.');
