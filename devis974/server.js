import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './lib/db.js';
import { HttpError, rateLimit, today } from './lib/util.js';
import { sessionFromToken } from './lib/auth.js';
import authRoutes from './lib/routes/auth.js';
import companyRoutes from './lib/routes/company.js';
import clientRoutes from './lib/routes/clients.js';
import quoteRoutes from './lib/routes/quotes.js';
import dashboardRoutes from './lib/routes/dashboard.js';

const PUBLIC = fileURLToPath(new URL('./public/', import.meta.url));
const routes = [];
const add = (method, path, opts, handler) => {
  const keys = []; const re = new RegExp('^' + path.replace(/:(\w+)/g, (_, k) => (keys.push(k), '([^/]+)')) + '$');
  routes.push({ method, re, keys, opts, handler });
};
[authRoutes, companyRoutes, clientRoutes, quoteRoutes, dashboardRoutes].forEach(r => r(add));

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8' };
const SECURITY = {
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'X-Frame-Options': 'DENY',
};

/** Droits d'accès selon la formule — vérifiés côté serveur. */
function entitlements(cid) {
  const co = db.prepare('SELECT plan, trial_ends_at FROM companies WHERE id=?').get(cid);
  const month = today().slice(0, 7);
  const used = db.prepare("SELECT COUNT(*) n FROM quotes WHERE company_id=? AND substr(issue_date,1,7)=?").get(cid, month).n;
  const total = db.prepare('SELECT COUNT(*) n FROM quotes WHERE company_id=?').get(cid).n;
  const e = { plan: co.plan, trial_ends_at: co.trial_ends_at, quotes_used_month: used, can_create_quotes: true, reason: '' };
  if (co.plan === 'trial') {
    e.quotes_limit = 15;
    if (today() > co.trial_ends_at) { e.can_create_quotes = false; e.reason = 'Votre essai gratuit de 14 jours est terminé. Vos données restent accessibles et exportables.'; }
    else if (total >= 15) { e.can_create_quotes = false; e.reason = 'Limite de l’essai atteinte (15 devis).'; }
  } else if (co.plan === 'starter') {
    e.quotes_limit = 30;
    if (used >= 30) { e.can_create_quotes = false; e.reason = 'Limite mensuelle de 30 devis atteinte (formule Starter).'; }
  }
  return e;
}

function readBody(req, max) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > max) { reject(new HttpError(413, 'Requête trop volumineuse.')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { const v = JSON.parse(Buffer.concat(chunks).toString('utf8')); resolve(v && typeof v === 'object' ? v : {}); }
      catch { reject(new HttpError(400, 'JSON invalide.')); }
    });
    req.on('error', reject);
  });
}
const parseCookies = h => Object.fromEntries((h || '').split(';').map(s => s.trim().split('=')).filter(p => p[0]).map(([k, ...v]) => [k, v.join('=')]));

async function handleApi(req, res, url) {
  const route = routes.find(r => r.method === req.method && r.re.test(url.pathname));
  const send = (status, type, body, headers = {}) => { res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', ...SECURITY, ...headers, ...(res.extra || {}) }); res.end(body); };
  try {
    if (!route) {
      if (routes.some(r => r.re.test(url.pathname))) throw new HttpError(405, 'Méthode non autorisée.');
      throw new HttpError(404, 'Ressource introuvable.');
    }
    const ip = req.socket.remoteAddress || '?';
    if (!rateLimit('g:' + ip, 300, 60e3)) throw new HttpError(429, 'Trop de requêtes. Réessayez dans un instant.');
    if (route.opts.limit && !rateLimit(`${route.method}${url.pathname}:${ip}`, route.opts.limit[0], route.opts.limit[1]))
      throw new HttpError(429, 'Trop de tentatives. Réessayez plus tard.');
    // Protection CSRF : toute écriture exige l'en-tête personnalisé (impossible depuis un autre site sans CORS).
    if (req.method !== 'GET' && req.headers['x-requested-with'] !== 'devis974') throw new HttpError(403, 'Requête refusée.');

    const token = parseCookies(req.headers.cookie).d974_sid;
    const session = sessionFromToken(token);
    if (route.opts.auth && !session) throw new HttpError(401, 'Session expirée. Veuillez vous reconnecter.');

    const m = route.re.exec(url.pathname);
    const params = Object.fromEntries(route.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
    const body = req.method === 'GET' || req.method === 'DELETE' ? {} : await readBody(req, route.opts.maxBody || 100_000);
    const ctx = {
      req, params, body, token, session, cid: session?.company_id, query: Object.fromEntries(url.searchParams),
      entitlements: () => entitlements(session.company_id),
      setCookie: c => { res.extra = { 'Set-Cookie': c }; },
      raw: (status, type, buf, headers) => ({ __raw: [status, type, buf, headers] }),
    };
    const out = await route.handler(ctx);
    if (out?.__raw) return send(...out.__raw);
    send(200, 'application/json; charset=utf-8', JSON.stringify(out ?? { ok: true }));
  } catch (e) {
    if (e instanceof HttpError) return send(e.status, 'application/json; charset=utf-8', JSON.stringify({ error: e.message }));
    console.error(e);
    try { db.prepare('INSERT INTO error_log (path,message) VALUES (?,?)').run(url.pathname, String(e.message).slice(0, 500)); } catch { /* ignore */ }
    send(500, 'application/json; charset=utf-8', JSON.stringify({ error: 'Erreur interne. Réessayez ou contactez le support.' }));
  }
}

function serveStatic(req, res, url) {
  let p = url.pathname;
  if (p === '/') p = '/index.html';
  else if (p === '/app' || p === '/app/') p = '/app.html';
  const file = normalize(join(PUBLIC, decodeURIComponent(p)));
  const ok = file.startsWith(PUBLIC) && existsSync(file) && statSync(file).isFile();
  if (!ok) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', ...SECURITY }); return res.end('Page introuvable'); }
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', ...SECURITY });
  res.end(readFileSync(file));
}

export const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) handleApi(req, res, url);
  else if (req.method === 'GET' || req.method === 'HEAD') serveStatic(req, res, url);
  else { res.writeHead(405); res.end(); }
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3974);
  server.listen(port, () => console.log(`Devis974 → http://localhost:${port}`));
}
