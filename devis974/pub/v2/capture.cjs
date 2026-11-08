// Captures réelles de l'application Devis974 (serveur local + données de démo), étape par étape.
// node capture.cjs <desktop|mobile>
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const MODE = process.argv[2], BASE = 'http://localhost:3975';
const OUT = path.join(__dirname, MODE); fs.mkdirSync(OUT, { recursive: true });
const VP = MODE === 'mobile' ? { width: 390, height: 844, dsf: 3 } : { width: 1440, height: 900, dsf: 1.5 };
const manifest = []; let n = 0;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: VP.width, height: VP.height }, deviceScaleFactor: VP.dsf, locale: 'fr-FR', timezoneId: 'Indian/Reunion', permissions: ['clipboard-read', 'clipboard-write'], hasTouch: MODE === 'mobile', isMobile: MODE === 'mobile' });
  const p = await ctx.newPage();
  const shot = async (step, opts = {}) => { await p.waitForTimeout(opts.wait ?? 120); const f = `${String(n++).padStart(3, '0')}_${step}.jpg`;
    await p.screenshot({ path: path.join(OUT, f), type: 'jpeg', quality: 92, fullPage: !!opts.full }); manifest.push({ step, file: f, scrollY: await p.evaluate(() => scrollY) }); };
  const typeShots = async (sel, text, step, every = 1) => { const el = p.locator(sel); await el.scrollIntoViewIfNeeded(); await el.click();
    for (let i = 0; i < text.length; i++) { await el.press(text[i] === ' ' ? 'Space' : text[i]); if ((i + 1) % every === 0 || i === text.length - 1) await shot(step, { wait: 30 }); } };
  // Site vitrine
  await p.goto(BASE + '/'); await shot('landing_top', { wait: 400 }); await shot('landing_full', { full: true });
  // Connexion (compte de démo)
  await p.goto(BASE + '/app#/connexion'); await p.fill('input[name=email]', 'demo-clim@devis974.example'); await p.fill('input[name=password]', 'Demo-974-Exemple');
  await p.click('button.primary'); await p.waitForSelector('.stat'); await shot('dashboard', { wait: 900 });
  await p.goto(BASE + '/app#/clients'); await p.waitForSelector('tr.click'); await shot('clients', { wait: 400 });
  // Nouveau prospect, saisi au clavier
  await p.goto(BASE + '/app#/clients/new'); await p.waitForSelector('#f'); await shot('form_empty', { wait: 300 });
  await typeShots('input[name=first_name]', 'Marie', 'type_prenom');
  await typeShots('input[name=last_name]', 'Payet', 'type_nom');
  await typeShots('input[name=phone]', '0692 12 34 56', 'type_tel', 2);
  await typeShots('input[name=city]', 'Saint-Paul', 'type_ville', 2);
  await typeShots('input[name=service_wanted]', 'Nettoyage clim 2 splits', 'type_presta', 2);
  await p.selectOption('select[name=source]', 'whatsapp'); await p.locator('select[name=source]').scrollIntoViewIfNeeded(); await shot('source_whatsapp');
  await p.locator('#f button.primary').scrollIntoViewIfNeeded(); await shot('before_save');
  await p.click('#f button.primary'); await p.waitForSelector('a[href^="#/devis/new"]'); await p.evaluate(() => scrollTo(0, 0)); await shot('client_saved', { wait: 500 });
  // Devis depuis la fiche
  await p.click('a.btn.primary[href^="#/devis/new"]'); await p.waitForSelector('#lines .ln:not(.hd)'); await shot('quote_new', { wait: 300 });
  await typeShots('input[name=title]', 'Nettoyage clim 2 splits', 'quote_title', 3);
  await p.locator('#tpl').scrollIntoViewIfNeeded(); await p.selectOption('#tpl', { label: 'Nettoyage climatisation split — 65,00 €' }); await shot('quote_line1', { wait: 250 });
  const q = p.locator('.ln:not(.hd) [data-k=quantity]').first(); await q.fill(''); await q.type('2'); await shot('quote_qty2', { wait: 200 });
  await p.selectOption('#tpl', { label: 'Déplacement — 25,00 €' }); await shot('quote_line2', { wait: 250 });
  await p.locator('#sums').scrollIntoViewIfNeeded(); await shot('quote_totals', { wait: 250 });
  await p.click('#f button.primary'); await p.waitForSelector('#pdf'); await p.evaluate(() => scrollTo(0, 0)); await shot('quote_draft', { wait: 500 });
  const qid = (await p.evaluate(() => location.hash)).split('/')[2];
  // PDF réel
  const pdf = await p.request.get(`${BASE}/api/quotes/${qid}/pdf`); fs.writeFileSync(path.join(OUT, 'devis.pdf'), await pdf.body());
  // Envoi + relance
  await p.click('[data-st=envoye]'); await p.waitForSelector('#fmsg'); await p.evaluate(() => scrollTo(0, 0)); await shot('quote_sent', { wait: 600 });
  await p.locator('#fmsg').scrollIntoViewIfNeeded(); await shot('followup_panel', { wait: 300 });
  await p.click('#fcopy'); await shot('followup_copied', { wait: 250 });
  await p.selectOption('#fch', 'whatsapp'); await p.click('#fdone'); await p.waitForSelector('text=Historique des relances'); await p.locator('#fmsg').scrollIntoViewIfNeeded(); await shot('followup_done', { wait: 600 });
  await p.goto(BASE + '/app#/relances'); await p.waitForSelector('h3'); await shot('relances', { wait: 500 });
  await p.goto(BASE + '/app#/'); await p.waitForSelector('.stat'); await shot('dashboard_after', { wait: 900 });
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify({ mode: MODE, viewport: VP, quote_id: qid, shots: manifest }, null, 1));
  await b.close(); console.log(MODE, manifest.length, 'captures, devis', qid);
})().catch(e => { console.error('ECHEC', e.message); process.exit(1); });
