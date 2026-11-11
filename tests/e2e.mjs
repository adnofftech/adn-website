// Parcours de vérification du site (voir README, section Vérifications).
// Usage : npm test  (construit le site, lance l'aperçu sur le port 4321, exécute les scénarios, écrit des captures dans tests/shots/e2e)
import { createRequire } from 'node:module';
import { spawn, execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const { chromium, devices } = createRequire(import.meta.url)('playwright'); // Playwright préinstallé dans l'environnement

const PORT = 4321;
const base = `http://127.0.0.1:${PORT}${(process.env.BASE_PATH || '').replace(/\/$/, '')}`; // BASE_PATH=/adn-website pour tester le déploiement GitHub Pages
const sansBuild = process.argv.includes('--sans-build');
if (!sansBuild) execSync('npx astro build', { stdio: 'inherit' });
const repond = async () => { try { return (await fetch(base + '/')).ok; } catch { return false; } };
// Astro 7 ne lance qu'un seul serveur d'aperçu : on réutilise celui qui tourne, sinon on le démarre et on l'arrête à la fin.
const dejaLance = await repond();
if (!dejaLance) spawn('npx', ['astro', 'preview', '--host', '127.0.0.1', '--port', String(PORT)], { stdio: 'ignore', detached: true }).unref();
for (let i = 0; i < 60 && !(await repond()); i++) await new Promise((r) => setTimeout(r, 500));
const serveur = { kill() { if (!dejaLance) try { execSync('npx astro preview stop', { stdio: 'ignore' }); } catch {} } };
mkdirSync('tests/shots/e2e', { recursive: true });

const resultats = [];
const ok = (nom, cond, detail = '') => { resultats.push({ nom, cond: !!cond, detail }); console.log(`${cond ? 'OK  ' : 'ÉCHEC'} ${nom}${cond ? '' : '  ← ' + detail}`); };
const shot = async (page, nom) => { await page.waitForTimeout(450); /* fin des transitions */ await page.screenshot({ path: `tests/shots/e2e/${nom}.png`, fullPage: false }); };

const browser = await chromium.launch();
try {
  // ---------- Mobile (tactile) ----------
  const mobile = await browser.newContext({ ...devices['Pixel 7'], locale: 'fr-FR', permissions: ['clipboard-read', 'clipboard-write'] });
  await mobile.route('https://ig.me/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: 'Instagram (simulé)' })); // pas d’appel réseau sortant pendant le test
  const m = await mobile.newPage();
  const erreurs = [];
  m.on('pageerror', (e) => erreurs.push(e.message));
  m.on('console', (c) => { if (c.type() === 'error') erreurs.push(c.text()); });

  // 0. Aucune requête en échec et polices chargées (important sous un préfixe de déploiement)
  const echecsReseau = [];
  m.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('/favicon.ico')) echecsReseau.push(`${r.status()} ${r.url()}`); });
  await m.goto(base + '/');
  await m.evaluate(() => document.fonts.ready);
  ok('0a. Les polices Cormorant Garamond et Instrument Sans sont chargées', await m.evaluate(() => document.fonts.check("500 20px 'Cormorant Garamond'") && document.fonts.check("400 16px 'Instrument Sans'") && [...document.fonts].some((f) => f.status === 'loaded')));
  // 1. Accueil → galerie
  await m.getByRole('link', { name: 'Voir les réalisations' }).tap();
  await m.waitForURL(/\/realisations/);
  ok('1. Depuis l’accueil, accéder à la galerie', m.url().includes('/realisations'));

  // Filtres masqués sous le seuil
  ok('15a. Galerie courte : filtres masqués (4 pièces < seuil)', (await m.locator('[data-filtre]').count()) === 0);

  // 2. Ouvrir une réalisation au toucher
  const carte = m.locator('[data-ouvrir="piece-ombree"]');
  await carte.scrollIntoViewIfNeeded();
  await carte.tap();
  const loupe = m.locator('[data-loupe]');
  await loupe.waitFor({ state: 'visible' });
  ok('2a. Ouvrir une réalisation au toucher', await loupe.evaluate((d) => d.open && d.matches(':modal')));
  ok('2b. Le titre de la pièce est affiché', (await m.locator('#loupe-titre').textContent()).includes('Pièce détaillée'));
  ok('2c. L’URL porte l’identifiant (lien profond)', m.url().endsWith('#piece-ombree'));
  await shot(m, 'mobile-loupe-ensemble');

  // 3. Vue d'ensemble → Détail (pièce avec gros plan)
  const vues = m.locator('[data-vues]');
  ok('3a. Mode « double » quand un gros plan existe', (await vues.getAttribute('data-mode')) === 'double');
  await m.getByRole('button', { name: 'Détail' }).tap();
  await m.waitForTimeout(250);
  ok('3b. Commande « Détail » pressée', (await m.getByRole('button', { name: 'Détail' }).getAttribute('aria-pressed')) === 'true');
  ok('3c. La vue détail est visible et l’ensemble masqué', (await m.locator('[data-fig="detail"]').evaluate((f) => getComputedStyle(f).opacity)) === '1' && (await m.locator('[data-fig="ensemble"]').evaluate((f) => getComputedStyle(f).opacity)) === '0');
  await shot(m, 'mobile-loupe-detail');
  await m.getByRole('button', { name: 'Vue d’ensemble' }).tap();

  // Navigation suivante/précédente et compteur
  await m.getByRole('button', { name: 'Réalisation suivante' }).tap();
  ok('2d. Réalisation suivante boucle vers la première', (await m.locator('#loupe-titre').textContent()).includes('Composition florale'));
  ok('15b. Pièce sans gros plan : mode « simple »', (await vues.getAttribute('data-mode')) === 'simple');
  await m.getByRole('button', { name: 'Détail' }).tap();
  await m.waitForTimeout(300);
  const scale = await m.locator('[data-img="ensemble"]').evaluate((i) => getComputedStyle(i).transform);
  ok('3d. Sans gros plan, « Détail » agrandit l’original (recadrage)', scale !== 'none' && scale.startsWith('matrix(2.2'));
  await shot(m, 'mobile-loupe-recadrage');

  // 4. Fermer et retrouver sa place
  await m.getByRole('button', { name: 'Fermer' }).tap();
  await m.waitForTimeout(250);
  ok('4a. La visionneuse est fermée', !(await loupe.evaluate((d) => d.open)));
  ok('4b. Le focus revient sur la vignette d’origine', await m.evaluate(() => document.activeElement?.getAttribute('data-ouvrir') === 'piece-ombree'));
  ok('4c. L’URL est nettoyée', !m.url().includes('#'));

  // 5. Projet similaire avec la bonne référence
  await m.locator('[data-ouvrir="oiseau"]').tap();
  await loupe.waitFor({ state: 'visible' });
  await m.getByRole('link', { name: 'Parler d’un projet similaire' }).tap();
  await m.waitForURL(/\/projet\?ref=oiseau/);
  const refBox = m.locator('[data-reference]');
  ok('5. La référence est pré-renseignée dans l’assistant', await refBox.isVisible() && (await m.locator('[data-reference-titre]').textContent()).includes('Composition à l’oiseau'));
  await shot(m, 'mobile-projet-etape1-reference');

  // 6. Retirer ou changer la référence
  await m.getByRole('button', { name: 'Retirer la référence' }).tap();
  ok('6a. La référence peut être retirée', !(await refBox.isVisible()) && (await m.locator('[data-reference-choix]').inputValue()) === '');
  await m.locator('[data-reference-choix]').selectOption('lettrage');
  ok('6b. Une autre référence peut être choisie', await refBox.isVisible() && (await m.locator('[data-reference-titre]').textContent()).includes('Lettrage'));

  // 7. Remplir les étapes
  await m.getByRole('button', { name: 'Continuer' }).tap();
  ok('7a. Validation : l’idée est requise (ou l’hésitation cochée)', (await m.locator('#idee-erreur').textContent()).length > 0 && (await m.locator('#idee').getAttribute('aria-invalid')) === 'true');
  await m.fill('#idee', 'Un hibiscus avec un prénom en lettrage fin');
  await m.getByRole('button', { name: 'Continuer' }).tap();
  ok('7b. Passage à l’étape 2', (await m.locator('[data-progres]').textContent()) === 'Étape 2 sur 3' && m.url().endsWith('#etape-2'));
  await m.fill('#zone', 'Avant-bras gauche');
  await m.check('[data-dimensions-adefinir]'); // 9. taille à définir
  ok('9a. « À définir » désactive le champ dimensions', await m.locator('#dimensions').isDisabled());
  await m.check('input[name="encre"][value="noire-rouge"]');
  await m.fill('#disponibilites', 'Les samedis de novembre');
  await m.check('input[name="flexible"]');
  await shot(m, 'mobile-projet-etape2');

  // 8. Revenir en arrière en conservant les réponses
  await m.getByRole('button', { name: 'Retour' }).tap();
  ok('8a. Retour à l’étape 1', (await m.locator('[data-progres]').textContent()) === 'Étape 1 sur 3');
  ok('8b. Les réponses de l’étape 1 sont conservées', (await m.inputValue('#idee')) === 'Un hibiscus avec un prénom en lettrage fin');
  await m.getByRole('button', { name: 'Continuer' }).tap();
  ok('8c. Les réponses de l’étape 2 sont conservées', (await m.inputValue('#zone')) === 'Avant-bras gauche' && await m.isChecked('[data-dimensions-adefinir]') && await m.isChecked('input[name="flexible"]'));
  await m.goBack();
  await m.waitForTimeout(200);
  ok('8d. Le bouton Précédent du navigateur revient à l’étape précédente', (await m.locator('[data-progres]').textContent()) === 'Étape 1 sur 3' && (await m.inputValue('#idee')).length > 0);
  await m.goForward();
  await m.waitForTimeout(200);

  // 9. Message
  await m.getByRole('button', { name: 'Voir mon message' }).tap();
  const message = await m.inputValue('#message');
  ok('9b. Le message contient l’idée, la zone, la taille à définir, l’encre, les disponibilités et la référence',
    ['Mon idée', 'hibiscus', 'Avant-bras gauche, dimensions à définir ensemble', 'Encre noire et rouge', 'Les samedis de novembre', 'flexible', 'N° 02, Lettrage', 'Merci !'].every((t) => message.includes(t)), message);
  await shot(m, 'mobile-projet-etape3');

  // 10. Copier
  await m.getByRole('button', { name: 'Copier le message' }).tap();
  await m.waitForTimeout(200);
  const presse = await m.evaluate(() => navigator.clipboard.readText());
  ok('10a. Le presse-papiers contient le message', presse === message);
  ok('10b. Le retour « Message copié » est annoncé (role=status)', (await m.locator('[data-statut]').textContent()).startsWith('Message copié') && (await m.locator('[data-statut]').getAttribute('role')) === 'status');

  // 12. Lien Instagram
  const ig = m.locator('[data-instagram]');
  ok('12a. « Ouvrir Instagram » pointe vers la messagerie, dans un nouvel onglet', (await ig.getAttribute('href')) === 'https://ig.me/m/lartiste.ink' && (await ig.getAttribute('target')) === '_blank');
  ok('12b. Le profil est proposé en repli', (await m.locator('.recap__repli a').getAttribute('href')) === 'https://www.instagram.com/lartiste.ink/');
  const [popup] = await Promise.all([mobile.waitForEvent('page', { timeout: 3000 }).catch(() => null), ig.tap()]);
  ok('12c. Le clic ouvre bien une nouvelle page (action de l’utilisateur)', !!popup);
  if (popup) await popup.close();

  // « Modifier mes réponses »
  await m.getByRole('button', { name: 'Modifier mes réponses' }).tap();
  ok('8e. « Modifier mes réponses » ramène à l’étape 1 avec les réponses', (await m.locator('[data-progres]').textContent()) === 'Étape 1 sur 3' && (await m.inputValue('#idee')).includes('hibiscus'));

  // Menu mobile : ouverture, fermeture, focus
  await m.goto(base + '/infos');
  const menuBtn = m.getByRole('button', { name: 'Menu' });
  await menuBtn.tap();
  const menu = m.locator('#menu');
  ok('Menu mobile : ouvert, aria-expanded=true, focus dans le menu', await menu.evaluate((d) => d.open) && (await menuBtn.getAttribute('aria-expanded')) === 'true' && await m.evaluate(() => document.activeElement?.closest('#menu') !== null));
  await shot(m, 'mobile-menu');
  await m.keyboard.press('Escape');
  await m.waitForTimeout(100);
  ok('Menu mobile : Échap ferme et rend le focus au bouton', !(await menu.evaluate((d) => d.open)) && await m.evaluate(() => document.activeElement?.hasAttribute('data-menu-open')));

  // 13. Infos pratiques
  const infos = await m.locator('#acompte, #annulation, #confirmation').allTextContents();
  ok('13. Acompte 20 %, annulation 48 h et confirmation sont consultables', infos[0].includes('20 %') && infos[1].includes('48 heures') && infos[2].includes('la veille') && infos[2].includes('le matin même'));
  ok('13b. Le sommaire mène aux rubriques', (await m.locator('.sommaire a[href="#annulation"]').count()) === 1);

  // Barre d'action mobile : masquée sur le premier écran de l'accueil, visible ensuite, absente de /projet
  await m.goto(base + '/');
  await m.waitForTimeout(400);
  const barre = m.locator('[data-barre]');
  ok('Barre d’action : masquée tant que l’action du premier écran est visible', await barre.evaluate((b) => b.hasAttribute('data-cachee')));
  await m.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await m.waitForTimeout(400);
  ok('Barre d’action : visible après défilement, espace réservé en bas de page', !(await barre.evaluate((b) => b.hasAttribute('data-cachee'))) && (await m.evaluate(() => parseInt(getComputedStyle(document.body).paddingBottom))) > 40);
  await shot(m, 'mobile-barre');
  await m.goto(base + '/projet');
  ok('Barre d’action : absente de la page Mon projet', (await m.locator('[data-barre]').count()) === 0);

  ok('Aucune erreur JavaScript sur mobile', erreurs.length === 0, erreurs.join(' | '));
  ok('0b. Aucune requête en échec (404) pendant le parcours', echecsReseau.length === 0, echecsReseau.join(' | '));
  await mobile.close();

  // ---------- 11. Repli si la copie échoue ----------
  const sansPresse = await browser.newContext({ ...devices['Pixel 7'], locale: 'fr-FR' });
  await sansPresse.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('refusé')) } }); });
  const s = await sansPresse.newPage();
  await s.goto(base + '/projet');
  await s.fill('#idee', 'Test de repli');
  await s.getByRole('button', { name: 'Continuer' }).tap();
  await s.getByRole('button', { name: 'Voir mon message' }).tap();
  await s.getByRole('button', { name: 'Copier le message' }).tap();
  await s.waitForTimeout(200);
  const sel = await s.evaluate(() => { const t = document.querySelector('#message'); return document.activeElement === t && t.selectionEnd - t.selectionStart === t.value.length; });
  ok('11. Si la copie échoue : texte sélectionné et méthode manuelle annoncée', sel && (await s.locator('[data-statut]').textContent()).includes('copie automatique') && (await s.locator('[data-statut]').getAttribute('data-etat')) === 'erreur');
  await shot(s, 'mobile-copie-repli');
  await sansPresse.close();

  // ---------- Ordinateur, clavier ----------
  const desk = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'fr-FR' });
  const d = await desk.newPage();
  await d.goto(base + '/realisations');
  await d.keyboard.press('Tab');
  ok('Clavier : le lien d’évitement reçoit le focus en premier', await d.evaluate(() => document.activeElement?.classList.contains('skip')));
  await d.locator('[data-ouvrir="piece-ombree"]').focus();
  await d.keyboard.press('Enter');
  const dl = d.locator('[data-loupe]');
  await dl.waitFor({ state: 'visible' });
  ok('2e. Ouvrir une réalisation au clavier (Entrée)', await dl.evaluate((x) => x.open));
  ok('2f. Le focus est dans la visionneuse (bouton Fermer)', await d.evaluate(() => document.activeElement?.hasAttribute('data-fermer')));
  const deuxVues = await d.evaluate(() => { const a = document.querySelector('[data-fig="ensemble"]').getBoundingClientRect(); const b = document.querySelector('[data-fig="detail"]').getBoundingClientRect(); return b.left > a.right && getComputedStyle(document.querySelector('[data-fig="detail"]')).opacity === '1'; });
  ok('3e. Sur ordinateur, vue d’ensemble et détail côte à côte', deuxVues);
  await shot(d, 'desktop-loupe-double');
  await d.keyboard.press('ArrowRight');
  ok('2g. Flèche droite : réalisation suivante', (await d.locator('#loupe-titre').textContent()).includes('Composition florale'));
  await shot(d, 'desktop-loupe-simple');
  await d.keyboard.press('Escape');
  await d.waitForTimeout(250);
  ok('4d. Échap ferme et rend le focus à la vignette', !(await dl.evaluate((x) => x.open)) && await d.evaluate(() => document.activeElement?.getAttribute('data-ouvrir') === 'piece-ombree'));
  // Interactions rapides : double Échap pendant la transition de fermeture, puis réouverture
  await d.keyboard.press('Enter');
  await d.keyboard.press('Escape');
  await d.keyboard.press('Escape');
  await d.waitForTimeout(400);
  ok('Interactions rapides : double Échap ferme proprement et rend le focus', !(await dl.evaluate((x) => x.open)) && !(await dl.evaluate((x) => x.hasAttribute('data-fermeture'))) && await d.evaluate(() => document.activeElement?.getAttribute('data-ouvrir') === 'piece-ombree'));
  await d.keyboard.press('Enter');
  await d.waitForTimeout(100);
  ok('Interactions rapides : la visionneuse se rouvre ensuite', await dl.evaluate((x) => x.open));
  await d.keyboard.press('Escape');
  await d.waitForTimeout(300);
  await d.goto(base + '/');
  await shot(d, 'desktop-accueil');
  await desk.close();

  // ---------- 14. Mouvement réduit ----------
  const calme = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', locale: 'fr-FR' });
  const c = await calme.newPage();
  await c.goto(base + '/', { waitUntil: 'domcontentloaded' });
  const opac = await c.evaluate(() => ({ h1: getComputedStyle(document.querySelector('h1')).opacity, anim: getComputedStyle(document.querySelector('h1')).animationName }));
  ok('14a. Mouvement réduit : titre visible immédiatement, sans animation', opac.h1 === '1' && opac.anim === 'none');
  await c.goto(base + '/realisations');
  await c.locator('[data-ouvrir="lettrage"]').click();
  await c.locator('[data-loupe]').waitFor({ state: 'visible' });
  await c.getByRole('button', { name: 'Fermer' }).click();
  ok('14b. Mouvement réduit : la visionneuse s’ouvre et se ferme sans délai', !(await c.locator('[data-loupe]').evaluate((x) => x.open)));
  await calme.close();

  // ---------- Débordement à 320 px et écran bas ----------
  const petit = await browser.newContext({ viewport: { width: 320, height: 560 }, locale: 'fr-FR' });
  const p = await petit.newPage();
  for (const route of ['/', '/realisations', '/infos', '/projet']) {
    await p.goto(base + route);
    const over = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(`320 px : pas de débordement horizontal sur ${route}`, over <= 0, `${over}px`);
  }
  await p.goto(base + '/projet');
  await p.focus('#idee');
  await shot(p, 'petit-ecran-formulaire');
  await petit.close();
} finally {
  await browser.close();
  serveur.kill();
}
const echecs = resultats.filter((r) => !r.cond);
console.log(`\n${resultats.length - echecs.length}/${resultats.length} vérifications réussies.`);
process.exit(echecs.length ? 1 : 0);
