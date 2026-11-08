// Tableau de bord réel, défilé sous la bannière d'essai (geste utilisateur normal), avant la création du prospect.
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch();
  for (const [mode, vp, dsf, y] of [['desktop', { width: 1440, height: 900 }, 1.5, 150]]) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: dsf, locale: 'fr-FR', isMobile: mode === 'mobile', hasTouch: mode === 'mobile' });
    const p = await ctx.newPage();
    await p.goto('http://localhost:3975/app#/connexion'); await p.fill('input[name=email]', 'demo-clim@devis974.example'); await p.fill('input[name=password]', 'Demo-974-Exemple');
    await p.click('button.primary'); await p.waitForSelector('.stat'); await p.waitForTimeout(900);
    await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(200);
    await p.screenshot({ path: path.join(__dirname, mode, 'X_dashboard_scrolled.jpg'), type: 'jpeg', quality: 92 });
    await ctx.close();
  }
  await b.close(); console.log('ok');
})();
