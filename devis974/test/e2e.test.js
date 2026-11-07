import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rmSync } from 'node:fs';

const DB = join(tmpdir(), `d974-test-${process.pid}.db`);
process.env.DB_PATH = DB; process.env.DEV_EXPOSE_RESET = '1';
const { server } = await import('../server.js');
let base;
before(() => new Promise(r => server.listen(0, () => { base = `http://127.0.0.1:${server.address().port}`; r(); })));
after(() => { server.close(); for (const s of ['', '-wal', '-shm']) rmSync(DB + s, { force: true }); });

/** Petit client HTTP avec « pot de cookies » : un par utilisateur simulé. */
function agent() {
  let cookie = '';
  const call = async (method, path, body) => {
    const r = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'devis974', ...(cookie && { Cookie: cookie }) }, body: body && JSON.stringify(body) });
    const sc = r.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0].endsWith('=') ? '' : sc.split(';')[0];
    const ct = r.headers.get('content-type') || '';
    return { status: r.status, body: ct.includes('json') ? await r.json() : Buffer.from(await r.arrayBuffer()), headers: r.headers };
  };
  return { get: p => call('GET', p), post: (p, b) => call('POST', p, b ?? {}), put: (p, b) => call('PUT', p, b), del: p => call('DELETE', p) };
}
const reg = (n, extra = {}) => ({ name: `Clim ${n}`, owner_name: 'Jean Test', email: `${n}@test.re`, phone: '0692 12 34 56', sector: 'Nettoyage de climatisation',
  city: 'Saint-Denis', vat_regime: 'applicable', default_vat_rate: 8.5, password: 'MotDePasse123', ...extra });
const line = (o = {}) => ({ description: 'Nettoyage climatisation split', quantity: 2, unit_price_cents: 6000, discount_pct: 0, vat_rate: 8.5, ...o });

const A = agent(), B = agent();
let clientA, quoteA;

test('1-2. inscription + profil entreprise', async () => {
  assert.equal((await A.post('/api/auth/register', reg('a'))).status, 200);
  const me = (await A.get('/api/auth/me')).body;
  assert.equal(me.company.name, 'Clim a');
  assert.equal(me.company.vat_regime, 'applicable');
  assert.equal((await A.post('/api/auth/register', reg('a'))).status, 409, 'e-mail déjà pris');
  assert.equal((await agent().post('/api/auth/register', reg('weak', { password: 'court' }))).status, 400);
  assert.equal((await B.post('/api/auth/register', reg('b'))).status, 200);
});

test('3. ajout d’un prospect', async () => {
  const r = await A.post('/api/clients', { first_name: 'Marie', last_name: 'Payet', phone: '0693 00 11 22', city: 'Saint-Paul', source: 'whatsapp', service_wanted: 'Nettoyage clim' });
  assert.equal(r.status, 200); clientA = r.body;
  assert.equal((await A.post('/api/clients', { first_name: 'x' })).status, 400, 'nom obligatoire');
  const list = (await A.get('/api/clients?q=payet')).body;
  assert.equal(list.length, 1);
});

test('4-5. devis depuis le prospect, totaux exacts, PDF valide', async () => {
  const r = await A.post('/api/quotes', { client_id: clientA.id, title: 'Entretien 2 split', lines: [line(), line({ description: 'Déplacement', quantity: 1, unit_price_cents: 2500, vat_rate: 8.5 })] });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  quoteA = r.body;
  assert.match(quoteA.number, /^DEV-\d{4}-0001$/);
  assert.equal(quoteA.subtotal_ht_cents, 14500);
  assert.equal(quoteA.total_vat_cents, 1233); // 14500 × 8,5 % = 1232,5 → 1233
  assert.equal(quoteA.total_ttc_cents, 15733);
  assert.equal((await A.get(`/api/clients/${clientA.id}`)).body.status, 'devis_a_preparer');
  const pdf = await A.get(`/api/quotes/${quoteA.id}/pdf`);
  assert.equal(pdf.status, 200);
  assert.equal(pdf.body.subarray(0, 5).toString(), '%PDF-');
  assert.ok(pdf.body.length > 1500);
  const q2 = (await A.post('/api/quotes', { client_id: clientA.id, lines: [line()] })).body;
  assert.match(q2.number, /-0002$/, 'numérotation séquentielle');
});

test('franchise de TVA : aucune TVA calculée, quel que soit le taux envoyé', async () => {
  const F = agent();
  await F.post('/api/auth/register', reg('f', { vat_regime: 'franchise', default_vat_rate: undefined }));
  const c = (await F.post('/api/clients', { last_name: 'Hoarau' })).body;
  const q = (await F.post('/api/quotes', { client_id: c.id, lines: [line({ vat_rate: 20 })] })).body;
  assert.equal(q.total_vat_cents, 0); assert.equal(q.total_ttc_cents, q.subtotal_ht_cents);
});

test('6-7. marquer envoyé → relance programmée, message, limite de fréquence', async () => {
  const s = (await A.post(`/api/quotes/${quoteA.id}/status`, { status: 'envoye' })).body;
  assert.equal(s.status, 'envoye'); assert.ok(s.followup_date);
  assert.equal((await A.put(`/api/quotes/${quoteA.id}`, { ...s, lines: s.lines })).status, 409, 'devis envoyé non modifiable');
  assert.equal((await A.post(`/api/quotes/${quoteA.id}/status`, { status: 'brouillon' })).status, 400);
  const past = await A.post(`/api/quotes/${quoteA.id}/followup-date`, { date: '2020-01-01' });
  assert.equal(past.status, 400);
  const d = new Date(Date.now() + 5 * 86400e3).toISOString().slice(0, 10);
  assert.equal((await A.post(`/api/quotes/${quoteA.id}/followup-date`, { date: d })).body.followup_date, d);
  const m = (await A.get(`/api/quotes/${quoteA.id}/followup-message`)).body;
  assert.match(m.message, /^Bonjour Marie, je me permets de revenir vers vous concernant le devis pour Entretien 2 split/);
  assert.match(m.whatsapp_url, /^https:\/\/wa\.me\/262693001122\?text=/);
  const f1 = await A.post(`/api/quotes/${quoteA.id}/followups`, { channel: 'whatsapp', message: m.message });
  assert.equal(f1.status, 200); assert.equal(f1.body.followups.length, 1);
  const f2 = await A.post(`/api/quotes/${quoteA.id}/followups`, { channel: 'email', message: m.message });
  assert.equal(f2.status, 429, 'deux relances rapprochées refusées');
  const dash = (await A.get('/api/dashboard')).body;
  assert.equal(dash.pending_quotes.n, 1);
  assert.equal(dash.pending_quotes.total, 15733);
});

test('tableau de bord : valeurs réelles, taux d’acceptation', async () => {
  let dash = (await A.get('/api/dashboard')).body;
  assert.equal(dash.acceptance_rate, null); assert.equal(dash.accepted.n, 0);
  await A.post(`/api/quotes/${quoteA.id}/status`, { status: 'accepte' });
  dash = (await A.get('/api/dashboard')).body;
  assert.equal(dash.accepted.total, 15733); assert.equal(dash.acceptance_rate, 100);
  assert.equal(dash.unpaid_invoices, null, 'pas de chiffre inventé pour les factures');
  assert.equal(dash.monthly.length, 6);
});

test('8. déconnexion puis reconnexion : données conservées', async () => {
  await A.post('/api/auth/logout');
  assert.equal((await A.get('/api/clients')).status, 401);
  const A2 = agent();
  assert.equal((await A2.post('/api/auth/login', { email: 'a@test.re', password: 'faux-mot-de-passe1' })).status, 401);
  assert.equal((await A2.post('/api/auth/login', { email: 'a@test.re', password: 'MotDePasse123' })).status, 200);
  assert.equal((await A2.get('/api/clients')).body.length, 1);
  assert.equal((await A2.get('/api/quotes')).body.length, 2);
  Object.assign(A, A2);
});

test('ISOLATION : l’entreprise B ne voit rien de A', async () => {
  assert.deepEqual((await B.get('/api/clients')).body, []);
  assert.deepEqual((await B.get('/api/quotes')).body, []);
  for (const [m, p, b] of [
    ['get', `/api/clients/${clientA.id}`], ['put', `/api/clients/${clientA.id}`, { last_name: 'Piraté' }], ['del', `/api/clients/${clientA.id}`],
    ['post', `/api/clients/${clientA.id}/interactions`, { content: 'x' }],
    ['get', `/api/quotes/${quoteA.id}`], ['get', `/api/quotes/${quoteA.id}/pdf`], ['del', `/api/quotes/${quoteA.id}`],
    ['post', `/api/quotes/${quoteA.id}/status`, { status: 'refuse' }], ['get', `/api/quotes/${quoteA.id}/followup-message`],
    ['post', `/api/quotes/${quoteA.id}/followups`, { channel: 'email', message: 'x' }],
  ]) {
    const r = await B[m](p, b);
    assert.equal(r.status, 404, `${m} ${p} doit renvoyer 404 pour B (reçu ${r.status})`);
  }
  // B ne peut pas créer un devis pour un client de A
  const own = (await B.post('/api/clients', { last_name: 'Bnom' })).body;
  assert.equal((await B.post('/api/quotes', { client_id: clientA.id, lines: [line()] })).status, 404);
  assert.equal((await B.post('/api/quotes', { client_id: own.id, lines: [line()] })).body.number.endsWith('-0001'), true, 'compteur propre à chaque entreprise');
  const dashB = (await B.get('/api/dashboard')).body;
  assert.equal(dashB.accepted.n, 0);
  // données de A intactes
  assert.equal((await A.get(`/api/clients/${clientA.id}`)).body.last_name, 'Payet');
  assert.equal((await B.get('/api/export')).body.clients.length, 1);
});

test('sécurité : CSRF, XSS stocké, injection SQL, uploads, accès anonyme', async () => {
  const r = await fetch(base + '/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(r.status, 403, 'écriture sans en-tête CSRF');
  assert.equal((await agent().get('/api/dashboard')).status, 401);
  const inj = await A.get("/api/clients?q=' OR 1=1 --&status=x");
  assert.equal(inj.status, 400);
  assert.equal((await A.get("/api/clients?q=%27%20OR%201%3D1%20--")).body.length, 0);
  assert.equal((await A.get('/api/clients?q=%25')).body.length, 0, 'le joker % est échappé');
  const bad = await A.put('/api/company/logo', { data: 'data:image/png;base64,' + Buffer.from('<script>alert(1)</script>').toString('base64') });
  assert.equal(bad.status, 400, 'faux PNG refusé');
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
  assert.equal((await A.put('/api/company/logo', { data: 'data:image/png;base64,' + png.toString('base64') })).status, 200);
  assert.equal((await A.get('/api/quotes/1/pdf')).status, 200, 'PDF avec logo');
  const t = await fetch(base + '/../../etc/passwd'); assert.notEqual(t.status, 200);
  const h = (await fetch(base + '/')).headers; assert.ok(h.get('content-security-policy'));
});

test('réinitialisation du mot de passe', async () => {
  const x = agent();
  const f = await x.post('/api/auth/forgot', { email: 'b@test.re' });
  assert.ok(f.body.dev_token);
  assert.equal((await agent().post('/api/auth/forgot', { email: 'inconnu@test.re' })).body.dev_token, undefined, 'pas de fuite d’existence de compte');
  assert.equal((await x.post('/api/auth/reset', { token: f.body.dev_token, password: 'NouveauMdp456' })).status, 200);
  assert.equal((await x.post('/api/auth/reset', { token: f.body.dev_token, password: 'NouveauMdp789' })).status, 400, 'jeton à usage unique');
  assert.equal((await agent().post('/api/auth/login', { email: 'b@test.re', password: 'NouveauMdp456' })).status, 200);
});

test('suppression du compte (RGPD) : cascade complète', async () => {
  const x = agent(); await x.post('/api/auth/login', { email: 'b@test.re', password: 'NouveauMdp456' });
  assert.equal((await x.post('/api/company/delete', { password: 'faux' })).status, 403);
  assert.equal((await x.post('/api/company/delete', { password: 'NouveauMdp456' })).status, 200);
  assert.equal((await x.get('/api/clients')).status, 401);
});

test('limitation des tentatives de connexion', async () => {
  const x = agent(); let last;
  for (let i = 0; i < 12; i++) last = await x.post('/api/auth/login', { email: 'a@test.re', password: 'mauvais-mdp-123' });
  assert.equal(last.status, 429);
});
