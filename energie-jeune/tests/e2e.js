// Scénario de bout en bout (Playwright). Usage : node tests/e2e.js [url]
const { chromium } = require('playwright'); const assert = require('assert');
const URL = process.argv[2] || 'http://localhost:8765/index.html';
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1360, height: 900 }, acceptDownloads: true }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto(URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForSelector('.app');
  const role = async v => { await p.selectOption('select[data-change=role]', v); await p.waitForTimeout(50); };
  const step = m => console.log('•', m);
  // 1. Claire planifie
  await p.goto(URL + '#/planning/new');
  await p.fill('[name=school]', 'École des Palmiers'); await p.selectOption('[name=commune]', 'Saint-Pierre');
  await p.fill('[name=start]', '16:30'); await p.fill('[name=end]', '18:00'); await p.fill('[name=cname]', 'Mme Test'); await p.fill('[name=cemail]', 'direction@ecole-palmiers.exemple.invalid');
  await p.selectOption('[name=transport]', 'KM');
  await p.click('[data-act=suggest]'); await p.waitForSelector('.sugg');
  const sg = await p.innerText('.sugg'); assert(/Équipe proposée/.test(sg) && /Rendez-vous/.test(sg), 'suggestion expliquée'); step('suggestion : ' + sg.split('\n').slice(0, 6).join(' / '));
  await p.click('[data-act=sugg-apply]');
  const driver = await p.$eval('[name=driver] option:checked', e => e.textContent.trim()); assert(driver && !/désigner/.test(driver)); step('conducteur KM : ' + driver);
  await p.click('button[value=publish]'); await p.waitForSelector('text=Équipe 2/2'); step('publiée, KM réservée');
  const ivId = (await p.url()).split('/iv/')[1];
  // identifier les volontaires par nom
  const ids = { Cheryl: 'cheryl', Adrien: 'adrien', Ethan: 'ethan', Hugo: 'hugo', Emma: 'emma', Wendy: 'wendy' }; const drvId = ids[driver]; assert(drvId, 'conducteur connu ' + driver);
  // 2. Adrien remet à Cheryl
  await role('adrien'); await p.goto(URL + '#/vehicules'); await p.click('article:has(h3:has-text("KM")) [data-act=veh-hand]');
  await p.fill('.modal [name=place]', 'Parking du collège Les Letchis'); await p.fill('.modal [name=odo]', '45290'); await p.selectOption('.modal [name=to]', 'cheryl'); await p.click('.modal button.primary'); step('Adrien remet les clés à Cheryl (À confirmer)');
  await p.waitForSelector('text=Remise enregistrée').catch(() => {});
  // 3. Cheryl confirme, trajet, dossier
  await role('cheryl'); await p.goto(URL + '#/aujourdhui'); await p.click('.bigacts [data-act=veh-take]'); await p.fill('.modal [name=odo]', '45290'); await p.click('.modal button.primary'); step('Cheryl confirme la réception');
  await p.click('.bigacts [data-act=trip-new]'); await p.fill('.modal [name=purpose]', 'Tournée Nord'); await p.fill('.modal [name=odoStart]', '45290'); await p.fill('.modal [name=odoEnd]', '45342'); await p.waitForFunction(() => /52 km/.test(document.querySelector('#calc').textContent)); await p.click('.modal button.primary'); step('trajet enregistré : 52 km');
  await p.goto(URL + '#/dossiers');
  const card = p.locator('section.card:has-text("École Les Colibris")'); await card.locator('li:has-text("Livret") [data-act=it-adv]').click(); await card.locator('li:has-text("Livret") [data-act=it-adv]').click(); await p.waitForSelector('li:has-text("Livret") .badge:has-text("Remis")'); step('Cheryl remet le livret à l\'établissement');
  await p.goto(URL + '#/vehicules'); await p.click('article:has(h3:has-text("KM")) [data-act=veh-hand]');
  await p.fill('.modal [name=place]', 'Parking de l\'école des Palmiers'); await p.fill('.modal [name=odo]', '45342'); const dopt = await p.$$eval('.modal [name=to] option', o => o.map(x => x.value)); assert(dopt.includes(drvId), 'conducteur suivant proposé');
  await p.selectOption('.modal [name=to]', drvId); await p.click('.modal button.primary'); step('Cheryl transmet KM à ' + driver);
  // 4. conducteur suivant
  await role(drvId); await p.goto(URL + '#/vehicules'); await p.click('article:has(h3:has-text("KM")) [data-act=veh-take]'); await p.fill('.modal [name=odo]', '45342'); await p.click('.modal button.primary'); step(driver + ' confirme la prise');
  const hold = await p.innerText('article:has(h3:has-text("KM")) .kv'); assert(/Toi/.test(hold), 'détenteur = le conducteur');
  // 5. Claire vérifie et exporte
  await role('claire'); await p.goto(URL + '#/aujourdhui'); const card2 = await p.innerText('article[aria-label="Voiture KM"]'); assert(card2.includes(driver) && /Clés confirmées/.test(card2), 'carte KM: ' + card2.replace(/\n+/g, ' ')); step('carte KM : ' + card2.replace(/\n+/g, ' ').slice(0, 160));
  await p.goto(URL + '#/vehicules?t=k'); const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-act=export-csv]')]);
  const path = await dl.path(); const csv = require('fs').readFileSync(path, 'utf8'); assert(/52/.test(csv) && /Cheryl/.test(csv) && csv.startsWith('﻿Date;'), 'CSV'); step('CSV : ' + dl.suggestedFilename() + ' (' + csv.split('\r\n').length + ' lignes)');
  // volontaire : indisponibilité en un tap
  await role('hugo'); await p.goto(URL + '#/aujourdhui'); await p.click('[data-act=iv-decline]'); await p.click('[data-act=decline-go] >> text=Malade'); await role('claire'); await p.goto(URL + '#/aujourdhui');
  assert(/Hugo ne peut pas venir/.test(await p.innerText('.feed')), 'signalement visible par Claire'); step('Hugo signale une indisponibilité : Claire alertée');
  // mobile
  await role('adrien'); await p.setViewportSize({ width: 390, height: 844 }); await p.goto(URL + '#/aujourdhui'); await p.screenshot({ path: process.env.SHOT || '/tmp/mobile.png' });
  const ov = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1); assert(!ov, 'pas de défilement horizontal mobile');
  console.log(errs.length ? 'ERREURS JS ' + errs : 'OK — aucun erreur JS'); await b.close();
})().catch(e => { console.error('ÉCHEC', e.message); process.exit(1); });
