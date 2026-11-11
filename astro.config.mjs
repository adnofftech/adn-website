// @ts-check
import { defineConfig } from 'astro/config';

// SITE_URL : domaine public une fois connu (ex. https://lartiste.ink). Sert aux URL canoniques et au sitemap.
// BASE_PATH : sous-dossier de déploiement (ex. /adn-website pour GitHub Pages en projet). "/" par défaut.
// PREVIEW : "true" (défaut) ajoute noindex + le bandeau « version de présentation ». Mettre "false" à la mise en ligne.
const site = process.env.SITE_URL || 'https://lartiste-ink.example';
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  image: { responsiveStyles: true },
  devToolbar: { enabled: false },
  server: { host: true, port: 4321 },
});
