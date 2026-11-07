// Devis974 — interface (JS natif, sans dépendance). Les interpolations sont échappées par défaut (anti-XSS).
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
class Raw { constructor(s) { this.s = s; } }
const raw = s => new Raw(s);
const html = (strs, ...vals) => new Raw(strs.reduce((o, s, i) => o + s + (i < vals.length ? [].concat(vals[i] ?? '').map(v => v instanceof Raw ? v.s : esc(v)).join('') : ''), ''));
const eur = c => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format((c || 0) / 100);
const frDate = d => d ? d.slice(0, 10).split('-').reverse().join('/') : '';
const todayISO = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Indian/Reunion' }).format(new Date());
const addDaysISO = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const toCents = v => Math.round(parseFloat(String(v).replace(',', '.') || 0) * 100);
const fromCents = c => (c / 100).toFixed(2).replace('.', ',');

const CLIENT_STATUS = { nouveau: ['Nouveau prospect', ''], a_contacter: ['À contacter', 'orange'], devis_a_preparer: ['Devis à préparer', 'orange'], devis_envoye: ['Devis envoyé', ''], en_attente: ['En attente de réponse', 'grey'], accepte: ['Accepté', 'green'], refuse: ['Refusé', 'red'], termine: ['Terminé', 'green'] };
const QUOTE_STATUS = { brouillon: ['Brouillon', 'grey'], envoye: ['Envoyé', ''], accepte: ['Accepté', 'green'], refuse: ['Refusé', 'red'], expire: ['Expiré', 'orange'] };
const SOURCES = { whatsapp: 'WhatsApp', telephone: 'Téléphone', facebook: 'Facebook', site_web: 'Site web', autre: 'Autre' };
const SECTORS = ['Nettoyage de climatisation', 'Plomberie', 'Électricité', 'Peinture / bâtiment', 'Jardinage / paysagisme', 'Nettoyage', 'Réparation à domicile', 'Autre service'];
const badge = (map, k) => html`<span class="badge ${map[k]?.[1] || ''}">${map[k]?.[0] || k}</span>`;
const fullName = c => [c.first_name, c.last_name].filter(Boolean).join(' ');
const opts = (obj, sel) => Object.entries(obj).map(([k, v]) => html`<option value="${k}" ${k === sel ? raw('selected') : ''}>${Array.isArray(v) ? v[0] : v}</option>`);

// ---------- Réseau ----------
let me = null;
async function api(method, path, body) {
  const r = await fetch('/api' + path, { method, headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'devis974' }, body: body ? JSON.stringify(body) : undefined });
  const ct = r.headers.get('content-type') || '';
  const data = ct.includes('json') ? await r.json() : null;
  if (!r.ok) {
    if (r.status === 401 && me) { me = null; location.hash = '#/connexion'; }
    throw Object.assign(new Error(data?.error || 'Erreur réseau'), { status: r.status });
  }
  return data;
}
function toast(msg, err) {
  const t = $('#toast'); t.innerHTML = '';
  const d = document.createElement('div'); d.className = 'toast' + (err ? ' err' : ''); d.textContent = msg; d.setAttribute('role', 'status'); t.append(d);
  setTimeout(() => d.remove(), 3800);
}
const guard = fn => async (...a) => { try { await fn(...a); } catch (e) { toast(e.message, true); } };

// ---------- Thème ----------
const theme = { get() { try { return localStorage.getItem('d974_theme') || 'light'; } catch { return 'light'; } }, set(v) { try { localStorage.setItem('d974_theme', v); } catch {} document.documentElement.dataset.theme = v; } };
theme.set(theme.get());

// ---------- Coque ----------
const NAV = [['#/', '🏠', 'Accueil'], ['#/clients', '👥', 'Clients'], ['#/devis', '📄', 'Devis'], ['#/relances', '⏰', 'Relances'], ['#/parametres', '⚙️', 'Réglages']];
function shell(route, content, title, actions = '') {
  const on = h => (h === '#/' ? route === '/' : route.startsWith(h.slice(1))) ? 'on' : '';
  $('#root').innerHTML = html`<div class="shell">
    <aside class="side"><div class="brand">Devis<span>974</span></div>
      ${NAV.map(([h, i, l]) => html`<a class="nav ${on(h)}" href="${h}">${i} ${l}</a>`)}
      <div class="foot">${me.company.name}<br><a href="#" id="logout" style="color:#9FB2CC">Se déconnecter</a></div></aside>
    <main class="main" id="main"><div class="top"><h1>${title}</h1><div class="row">${actions}</div></div>${content}</main>
    <nav class="bottom" aria-label="Navigation">${NAV.map(([h, i, l]) => html`<a class="${on(h)}" href="${h}"><span class="ic">${i}</span>${l}</a>`)}</nav></div>`.s;
  $('#logout').onclick = guard(async e => { e.preventDefault(); await api('POST', '/auth/logout'); me = null; location.hash = '#/connexion'; });
}
const trialBanner = () => {
  const e = me.entitlements; if (e.plan !== 'trial') return '';
  const left = Math.ceil((new Date(e.trial_ends_at) - new Date(todayISO())) / 86400000);
  return html`<div class="alert info">🧪 Essai gratuit : ${left > 0 ? `${left} jour(s) restant(s)` : 'terminé'} · ${e.quotes_used_month} devis ce mois (limite d’essai : ${e.quotes_limit}). <span class="muted">Le paiement en ligne n’est pas encore ouvert.</span></div>`;
};

// ---------- Auth ----------
function authPage(inner) {
  $('#root').innerHTML = html`<div class="authwrap"><div class="authbox"><a class="brand" href="/" style="color:var(--navy);display:block;text-align:center;font-size:28px">Devis<span style="color:var(--blue)">974</span></a><div class="card">${inner}</div></div></div>`.s;
}
const alertBox = () => '<div id="err"></div>';
const showErr = m => { const e = $('#err'); if (e) e.innerHTML = html`<div class="alert err" role="alert">${m}</div>`.s; };
function formObj(f) { return Object.fromEntries(new FormData(f).entries()); }

function loginView() {
  authPage(html`<h2>Connexion</h2>${raw(alertBox())}<form id="f"><div class="field"><label>E-mail</label><input name="email" type="email" autocomplete="username" required></div>
    <div class="field"><label>Mot de passe</label><input name="password" type="password" autocomplete="current-password" required></div>
    <button class="btn primary" style="width:100%">Se connecter</button></form>
    <p class="sm" style="text-align:center"><a href="#/oubli">Mot de passe oublié ?</a> · <a href="#/inscription">Créer un compte</a></p>`);
  $('#f').onsubmit = async e => { e.preventDefault(); try { await api('POST', '/auth/login', formObj(e.target)); location.hash = '#/'; route(); } catch (x) { showErr(x.message); } };
}
function registerView() {
  authPage(html`<h2>Essayer gratuitement</h2><p class="muted sm">14 jours · sans carte bancaire</p>${raw(alertBox())}
    <form id="f"><div class="field"><label>Nom de l’entreprise *</label><input name="name" required maxlength="120"></div>
    <div class="field"><label>Nom du responsable *</label><input name="owner_name" required></div>
    <div class="field"><label>E-mail professionnel *</label><input name="email" type="email" autocomplete="username" required></div>
    <div class="field"><label>Téléphone *</label><input name="phone" type="tel" required></div>
    <div class="field"><label>Secteur d’activité *</label><select name="sector">${SECTORS.map(s => html`<option>${s}</option>`)}</select></div>
    <div class="field"><label>Adresse</label><input name="address"></div>
    <div class="grid" style="grid-template-columns:1fr 2fr"><div class="field"><label>Code postal</label><input name="postal_code"></div><div class="field"><label>Ville</label><input name="city"></div></div>
    <div class="field"><label>SIRET <span class="muted">(facultatif pour l’instant)</span></label><input name="siret" inputmode="numeric" placeholder="14 chiffres"></div>
    <div class="field"><label>Régime de TVA *</label><select name="vat_regime" id="vr"><option value="franchise">Franchise en base (pas de TVA — art. 293 B du CGI)</option><option value="applicable">TVA applicable</option></select></div>
    <div class="field" id="vrate" hidden><label>Taux de TVA habituel de vos prestations (%)</label><input name="default_vat_rate" inputmode="decimal" placeholder="ex. 8,5">
      <div class="hint">À La Réunion, le taux normal n’est pas celui de la métropole. Indiquez le taux qui correspond à votre activité — vérifiez avec votre comptable. Modifiable à tout moment.</div></div>
    <div class="field"><label>Mot de passe * <span class="muted">(10 caractères minimum, lettres et chiffres)</span></label><input name="password" type="password" autocomplete="new-password" minlength="10" required></div>
    <button class="btn primary" style="width:100%">Créer mon espace</button></form>
    <p class="sm" style="text-align:center">Déjà un compte ? <a href="#/connexion">Se connecter</a></p>`);
  $('#vr').onchange = e => { $('#vrate').hidden = e.target.value !== 'applicable'; };
  $('#f').onsubmit = async e => {
    e.preventDefault(); const d = formObj(e.target);
    if (d.vat_regime === 'applicable') d.default_vat_rate = d.default_vat_rate.replace(',', '.'); else delete d.default_vat_rate;
    try { await api('POST', '/auth/register', d); location.hash = '#/'; route(); } catch (x) { showErr(x.message); }
  };
}
function forgotView() {
  authPage(html`<h2>Mot de passe oublié</h2>${raw(alertBox())}<form id="f"><div class="field"><label>E-mail</label><input name="email" type="email" required></div><button class="btn primary" style="width:100%">Envoyer le lien</button></form><div id="res"></div><p class="sm" style="text-align:center"><a href="#/connexion">Retour</a></p>`);
  $('#f').onsubmit = async e => { e.preventDefault(); try {
    const r = await api('POST', '/auth/forgot', formObj(e.target));
    $('#res').innerHTML = html`<div class="alert ok">${r.message}</div><div class="alert">L’envoi d’e-mails n’est pas encore configuré sur ce service : l’administrateur doit récupérer le lien dans les journaux du serveur.</div>${r.dev_token ? html`<div class="alert info">Mode développement : <a href="#/reinit/${r.dev_token}">ouvrir le lien</a></div>` : ''}`.s;
  } catch (x) { showErr(x.message); } };
}
function resetView(token) {
  authPage(html`<h2>Nouveau mot de passe</h2>${raw(alertBox())}<form id="f"><div class="field"><label>Nouveau mot de passe</label><input name="password" type="password" minlength="10" autocomplete="new-password" required></div><button class="btn primary" style="width:100%">Enregistrer</button></form>`);
  $('#f').onsubmit = async e => { e.preventDefault(); try { await api('POST', '/auth/reset', { token, password: formObj(e.target).password }); toast('Mot de passe modifié.'); location.hash = '#/connexion'; } catch (x) { showErr(x.message); } };
}

// ---------- Tableau de bord ----------
async function dashboardView() {
  const d = await api('GET', '/dashboard');
  const max = Math.max(1, ...d.monthly.flatMap(m => [m.issued_cents, m.accepted_cents]));
  const mois = m => new Date(m + '-15').toLocaleDateString('fr-FR', { month: 'short' });
  const empty = !d.monthly.some(m => m.issued_cents || m.accepted_cents);
  const P = d.priorities;
  shell('/', html`${trialBanner()}
   <div class="grid g4">
    <div class="card stat"><div class="l">Nouveaux prospects</div><div class="v">${d.new_prospects}</div></div>
    <div class="card stat"><div class="l">Devis en attente</div><div class="v">${d.pending_quotes.n}</div><div class="s">${eur(d.pending_quotes.total)}</div></div>
    <div class="card stat good"><div class="l">Devis acceptés</div><div class="v">${eur(d.accepted.total)}</div><div class="s">${d.accepted.n} devis</div></div>
    <div class="card stat ${d.followups_due ? 'warn' : ''}"><div class="l">Relances à effectuer</div><div class="v">${d.followups_due}</div></div>
    <div class="card stat"><div class="l">Taux d’acceptation</div><div class="v">${d.acceptance_rate === null ? '—' : d.acceptance_rate + ' %'}</div><div class="s">${d.decided_count ? `sur ${d.decided_count} devis clôturés` : 'pas encore de devis clôturé'}</div></div>
    <div class="card stat"><div class="l">Factures impayées</div><div class="v">—</div><div class="s">Facturation : à venir (étape 2)</div></div>
   </div>
   <div class="grid g2" style="margin-top:16px">
    <div class="card"><h3>Actions prioritaires</h3>
      ${!P.to_call.length && !P.to_follow_up.length && !P.to_prepare.length ? html`<p class="muted">Rien d’urgent. Ajoutez un prospect pour commencer.</p>` : ''}
      <div class="list">
      ${P.to_follow_up.map(q => html`<div class="row between"><div><span class="badge orange">Relancer</span> <a href="#/devis/${q.id}"><b>${q.number}</b></a><div class="sm muted">${fullName(q)} · ${eur(q.total_ttc_cents)} · prévue le ${frDate(q.followup_date)}</div></div></div>`)}
      ${P.to_call.map(c => html`<div class="row between"><div><span class="badge">Rappeler</span> <a href="#/clients/${c.id}"><b>${fullName(c)}</b></a><div class="sm muted">${c.service_wanted || 'Besoin à préciser'}</div></div>${c.phone ? html`<a class="btn sm" href="tel:${c.phone}">📞 Appeler</a>` : ''}</div>`)}
      ${P.to_prepare.map(c => html`<div class="row between"><div><span class="badge grey">Devis à préparer</span> <a href="#/clients/${c.id}"><b>${fullName(c)}</b></a></div><a class="btn sm primary" href="#/devis/new?client=${c.id}">Créer</a></div>`)}
      </div></div>
    <div class="card"><h3>Devis par mois</h3>
      ${empty ? html`<p class="muted">Le graphique se remplira avec vos premiers devis.</p>` : ''}
      <div class="chart" role="img" aria-label="Montants des devis émis et acceptés sur 6 mois">${d.monthly.map(m => html`<div class="col"><div class="bars"><div class="bar" title="Émis : ${eur(m.issued_cents)}" style="height:${m.issued_cents / max * 100}%"></div><div class="bar b2" title="Acceptés : ${eur(m.accepted_cents)}" style="height:${m.accepted_cents / max * 100}%"></div></div><span class="sm muted">${mois(m.month)}</span></div>`)}</div>
      <div class="legend"><span><i style="background:var(--blue)"></i>Émis (TTC)</span><span><i style="background:var(--green)"></i>Acceptés</span></div></div>
   </div>
   <div class="card" style="margin-top:16px"><h3>Activité récente</h3>
    ${d.recent.length ? html`<div class="timeline">${d.recent.map(r => html`<div><b>${fullName(r)}</b> — ${r.content}<div class="sm muted">${frDate(r.created_at)}</div></div>`)}</div>` : html`<p class="muted">Aucune activité pour le moment.</p>`}</div>`,
   'Tableau de bord', html`<a class="btn primary" href="#/clients/new">+ Prospect</a>`);
}

// ---------- Clients ----------
async function clientsView(q) {
  const params = new URLSearchParams(q || '');
  const list = await api('GET', '/clients?' + params);
  shell('/clients', html`<div class="card"><form class="row" id="flt"><input name="q" placeholder="🔍 Nom, téléphone, ville…" value="${params.get('q') || ''}" style="flex:2;min-width:180px">
    <select name="status" style="flex:1;min-width:140px"><option value="">Tous les statuts</option>${opts(CLIENT_STATUS, params.get('status'))}</select>
    <select name="source" style="flex:1;min-width:120px"><option value="">Toutes sources</option>${opts(SOURCES, params.get('source'))}</select>
    <select name="sort" style="flex:1;min-width:120px">${opts({ recent: 'Plus récents', nom: 'Nom A-Z', maj: 'Dernière activité' }, params.get('sort') || 'recent')}</select>
    <button class="btn">Filtrer</button></form></div>
    <div class="card tablewrap" style="margin-top:14px;padding:6px">${list.length ? html`<table><thead><tr><th>Nom</th><th class="hide-m">Téléphone</th><th class="hide-m">Prestation</th><th>Statut</th><th class="hide-m">Source</th></tr></thead><tbody>
      ${list.map(c => html`<tr class="click" data-href="#/clients/${c.id}"><td><b>${fullName(c)}</b><div class="sm muted">${c.company_name || c.city}</div></td><td class="hide-m">${c.phone}</td><td class="hide-m">${c.service_wanted}</td><td>${badge(CLIENT_STATUS, c.status)}</td><td class="hide-m">${SOURCES[c.source]}</td></tr>`)}</tbody></table>`
      : html`<p class="muted" style="padding:20px">Aucun client ne correspond. <a href="#/clients/new">Ajouter un prospect</a></p>`}</div>`,
    'Clients et prospects', html`<a class="btn primary" href="#/clients/new">+ Nouveau prospect</a>`);
  $('#flt').onsubmit = e => { e.preventDefault(); const p = new URLSearchParams([...new FormData(e.target)].filter(([, v]) => v)); location.hash = '#/clients?' + p; };
  $$('tr.click').forEach(tr => tr.onclick = () => location.hash = tr.dataset.href);
}
const clientForm = c => html`<form id="f" class="card"><div class="grid g2">
  <div class="field"><label>Prénom</label><input name="first_name" value="${c.first_name}"></div><div class="field"><label>Nom *</label><input name="last_name" value="${c.last_name}" required></div>
  <div class="field"><label>Société</label><input name="company_name" value="${c.company_name}"></div><div class="field"><label>Téléphone</label><input name="phone" type="tel" value="${c.phone}"></div>
  <div class="field"><label>E-mail</label><input name="email" type="email" value="${c.email}"></div><div class="field"><label>Adresse</label><input name="address" value="${c.address}"></div>
  <div class="field"><label>Code postal</label><input name="postal_code" value="${c.postal_code}"></div><div class="field"><label>Ville</label><input name="city" value="${c.city}"></div>
  <div class="field"><label>Prestation recherchée</label><input name="service_wanted" value="${c.service_wanted}"></div>
  <div class="field"><label>Source du contact</label><select name="source">${opts(SOURCES, c.source)}</select></div>
  <div class="field"><label>Statut commercial</label><select name="status">${opts(CLIENT_STATUS, c.status)}</select></div></div>
  <div class="field"><label>Description du besoin</label><textarea name="need">${c.need}</textarea></div>
  <div class="field"><label>Notes internes</label><textarea name="notes">${c.notes}</textarea></div>
  <button class="btn primary">Enregistrer</button></form>`;
const BLANK_CLIENT = { first_name: '', last_name: '', company_name: '', phone: '', email: '', address: '', postal_code: '', city: '', service_wanted: '', need: '', notes: '', source: 'telephone', status: 'nouveau' };
function clientNewView() {
  shell('/clients', clientForm(BLANK_CLIENT), 'Nouveau prospect');
  $('#f').onsubmit = guard(async e => { e.preventDefault(); const c = await api('POST', '/clients', formObj(e.target)); toast('Prospect enregistré.'); location.hash = '#/clients/' + c.id; });
}
async function clientView(id) {
  const c = await api('GET', '/clients/' + id);
  shell('/clients', html`<div class="grid g2" style="grid-template-columns:2fr 1fr;align-items:start">
    <div>${clientForm(c)}</div>
    <div><div class="card"><h3>Devis</h3>${c.quotes.length ? html`<div class="list">${c.quotes.map(q => html`<div class="row between"><a href="#/devis/${q.id}"><b>${q.number}</b></a>${badge(QUOTE_STATUS, q.status)}<span>${eur(q.total_ttc_cents)}</span></div>`)}</div>` : html`<p class="muted">Aucun devis.</p>`}
      <a class="btn primary" style="width:100%;margin-top:10px" href="#/devis/new?client=${c.id}">+ Créer un devis</a></div>
      <div class="card" style="margin-top:14px"><h3>Historique</h3>
        <form id="note" class="row" style="flex-wrap:nowrap"><select name="kind" style="width:auto"><option value="note">Note</option><option value="appel">Appel</option><option value="message">Message</option><option value="visite">Visite</option></select><input name="content" placeholder="Ajouter…" required><button class="btn sm">OK</button></form>
        <div class="timeline" style="margin-top:12px">${c.interactions.map(i => html`<div>${i.content}<div class="sm muted">${i.kind} · ${frDate(i.created_at)}</div></div>`)}</div></div>
      <button class="btn danger sm" id="del" style="margin-top:14px">Supprimer ce client</button></div></div>`, fullName(c), c.phone ? html`<a class="btn" href="tel:${c.phone}">📞 Appeler</a>` : '');
  $('#f').onsubmit = guard(async e => { e.preventDefault(); await api('PUT', '/clients/' + id, formObj(e.target)); toast('Fiche enregistrée.'); clientView(id); });
  $('#note').onsubmit = guard(async e => { e.preventDefault(); await api('POST', `/clients/${id}/interactions`, formObj(e.target)); clientView(id); });
  $('#del').onclick = guard(async () => { if (confirm('Supprimer définitivement ce client et ses brouillons ?')) { await api('DELETE', '/clients/' + id); location.hash = '#/clients'; } });
}

// ---------- Devis : liste ----------
async function quotesView(q) {
  const st = new URLSearchParams(q || '').get('status') || '';
  const list = await api('GET', '/quotes' + (st ? '?status=' + st : ''));
  shell('/devis', html`<div class="tabs">${[['', 'Tous'], ...Object.entries(QUOTE_STATUS).map(([k, v]) => [k, v[0]])].map(([k, l]) => html`<a class="chip ${k === st ? 'on' : ''}" href="#/devis${k ? '?status=' + k : ''}">${l}</a>`)}</div>
   <div class="card tablewrap" style="padding:6px">${list.length ? html`<table><thead><tr><th>N°</th><th>Client</th><th class="hide-m">Date</th><th>Statut</th><th class="right">Total TTC</th></tr></thead><tbody>
    ${list.map(x => html`<tr class="click" data-href="#/devis/${x.id}"><td><b>${x.number}</b></td><td>${fullName(x)}<div class="sm muted">${x.title}</div></td><td class="hide-m">${frDate(x.issue_date)}</td><td>${badge(QUOTE_STATUS, x.status)}</td><td class="right">${eur(x.total_ttc_cents)}</td></tr>`)}</tbody></table>`
    : html`<p class="muted" style="padding:20px">Aucun devis. Créez-en un depuis une fiche client.</p>`}</div>`, 'Devis', html`<a class="btn primary" href="#/devis/new">+ Nouveau devis</a>`);
  $$('tr.click').forEach(tr => tr.onclick = () => location.hash = tr.dataset.href);
}

// ---------- Devis : éditeur ----------
function totals(lines, franchise) {
  const by = new Map(); let ht = 0;
  for (const l of lines) { const net = Math.round(l.quantity * l.unit_price_cents * (1 - (l.discount_pct || 0) / 100)); ht += net; const r = franchise ? 0 : l.vat_rate; by.set(r, (by.get(r) || 0) + net); }
  let vat = 0; for (const [r, b] of by) vat += Math.round(b * r / 100);
  return { ht, vat, ttc: ht + vat };
}
async function quoteEditView(id, qs) {
  const [clients, templates] = await Promise.all([api('GET', '/clients?sort=nom'), api('GET', '/templates')]);
  const co = me.company, franchise = co.vat_regime === 'franchise';
  let q;
  if (id) q = await api('GET', '/quotes/' + id);
  else {
    const issue = todayISO();
    q = { client_id: Number(new URLSearchParams(qs).get('client')) || '', title: '', issue_date: issue, valid_until: addDaysISO(issue, co.quote_validity_days), payment_terms: co.payment_terms, notes: '', lines: [{ description: '', quantity: 1, unit_price_cents: 0, discount_pct: 0, vat_rate: co.default_vat_rate }] };
  }
  if (id && q.status !== 'brouillon') { location.hash = '#/devis/' + id; return; }
  const lines = q.lines.map(l => ({ ...l }));
  const draw = () => {
    $('#lines').innerHTML = html`<div class="ln hd"><span>Description</span><span>Qté</span><span>Prix unit. HT (€)</span><span>Remise %</span><span>${franchise ? '' : 'TVA %'}</span><span></span></div>
     ${lines.map((l, i) => html`<div class="ln" data-i="${i}"><input class="desc" data-k="description" value="${l.description}" placeholder="Prestation" maxlength="300" aria-label="Description"><input data-k="quantity" inputmode="decimal" value="${String(l.quantity).replace('.', ',')}" aria-label="Quantité">
       <input data-k="unit_price_cents" inputmode="decimal" value="${fromCents(l.unit_price_cents)}" aria-label="Prix unitaire"><input data-k="discount_pct" inputmode="decimal" value="${String(l.discount_pct).replace('.', ',')}" aria-label="Remise">
       ${franchise ? html`<span></span>` : html`<input data-k="vat_rate" inputmode="decimal" value="${String(l.vat_rate).replace('.', ',')}" aria-label="TVA">`}<button type="button" class="btn sm danger" data-del="${i}" aria-label="Supprimer la ligne">✕</button></div>`)}`.s;
    sums();
  };
  const sums = () => { const t = totals(lines, franchise); $('#sums').innerHTML = html`<div><span>Total HT</span><b>${eur(t.ht)}</b></div><div><span>TVA</span><b>${franchise ? 'non applicable' : eur(t.vat)}</b></div><div class="ttc"><span>Total TTC</span><span>${eur(t.ttc)}</span></div>`.s; };
  shell('/devis', html`<form id="f"><div class="card"><div class="grid g2">
    <div class="field"><label>Client *</label><select name="client_id" required><option value="">— Choisir —</option>${clients.map(c => html`<option value="${c.id}" ${c.id === q.client_id ? raw('selected') : ''}>${fullName(c)}${c.company_name ? ' — ' + c.company_name : ''}</option>`)}</select><div class="hint"><a href="#/clients/new">Nouveau prospect</a></div></div>
    <div class="field"><label>Objet du devis</label><input name="title" value="${q.title}" placeholder="ex. Nettoyage de 3 climatisations" maxlength="160"></div>
    <div class="field"><label>Date</label><input type="date" name="issue_date" value="${q.issue_date}" required></div>
    <div class="field"><label>Valable jusqu’au</label><input type="date" name="valid_until" value="${q.valid_until}" required></div></div></div>
    <div class="card" style="margin-top:14px"><h3>Prestations</h3>
     ${franchise ? html`<div class="alert info sm">TVA non applicable (franchise en base) — mention art. 293 B du CGI ajoutée sur le PDF.</div>` : ''}
     <div class="row" style="margin-bottom:10px"><select id="tpl" style="max-width:320px"><option value="">+ Ajouter une prestation modèle…</option>${templates.map(t => html`<option value="${t.id}">${t.label}${t.unit_price_cents ? ' — ' + eur(t.unit_price_cents) : ''}</option>`)}</select><button type="button" class="btn sm" id="addl">+ Ligne libre</button></div>
     <div class="lines" id="lines"></div><div class="totals" id="sums"></div></div>
    <div class="card" style="margin-top:14px"><div class="field"><label>Conditions de paiement</label><textarea name="payment_terms">${q.payment_terms}</textarea></div>
     <div class="field"><label>Notes personnalisées</label><textarea name="notes">${q.notes}</textarea></div></div>
    <div class="row" style="margin-top:16px"><button class="btn primary">Enregistrer le brouillon</button><a class="btn" href="#/devis">Annuler</a></div></form>`, id ? 'Modifier ' + q.number : 'Nouveau devis');
  draw();
  const linesEl = $('#lines');
  linesEl.addEventListener('input', e => {
    const row = e.target.closest('.ln'); if (!row || !e.target.dataset.k) return; const l = lines[row.dataset.i], k = e.target.dataset.k, v = e.target.value;
    l[k] = k === 'description' ? v : k === 'unit_price_cents' ? toCents(v) : (parseFloat(v.replace(',', '.')) || 0); sums();
  });
  linesEl.addEventListener('click', e => { const b = e.target.closest('[data-del]'); if (b) { lines.splice(Number(b.dataset.del), 1); if (!lines.length) lines.push({ description: '', quantity: 1, unit_price_cents: 0, discount_pct: 0, vat_rate: co.default_vat_rate }); draw(); } });
  $('#addl').onclick = () => { lines.push({ description: '', quantity: 1, unit_price_cents: 0, discount_pct: 0, vat_rate: co.default_vat_rate }); draw(); };
  $('#tpl').onchange = e => { const t = templates.find(x => x.id == e.target.value); if (!t) return; if (lines.length === 1 && !lines[0].description && !lines[0].unit_price_cents) lines.pop(); lines.push({ description: t.label, quantity: 1, unit_price_cents: t.unit_price_cents, discount_pct: 0, vat_rate: franchise ? 0 : (t.vat_rate || co.default_vat_rate) }); draw(); };
  $('#f').onsubmit = guard(async e => {
    e.preventDefault(); const d = formObj(e.target);
    const body = { ...d, client_id: Number(d.client_id), lines: lines.filter(l => l.description.trim()) };
    const saved = id ? await api('PUT', '/quotes/' + id, body) : await api('POST', '/quotes', body);
    toast('Brouillon enregistré.'); location.hash = '#/devis/' + saved.id;
  });
}

// ---------- Devis : fiche ----------
function followupBox(q, fm) {
  const maxed = q.followups.length >= 3;
  return html`<div class="card" style="margin-top:14px"><h3>Relance</h3>
   <div class="row" style="margin-bottom:12px"><label style="margin:0">Relance prévue le</label><input type="date" id="fdate" value="${q.followup_date || ''}" min="${todayISO()}" style="width:auto"><button class="btn sm" id="fdate-ok">Programmer</button>
    ${q.followup_date && q.followup_date <= todayISO() ? html`<span class="badge orange">À relancer maintenant</span>` : ''}</div>
   <div class="field"><label>Message (modifiable)</label><textarea id="fmsg" rows="5">${fm.message}</textarea></div>
   <div class="row"><button class="btn" id="fcopy">📋 Copier</button>
    ${fm.whatsapp_url ? html`<a class="btn green" id="fwa" href="${fm.whatsapp_url}" target="_blank" rel="noopener">WhatsApp</a>` : html`<span class="muted sm">Pas de téléphone : WhatsApp indisponible</span>`}
    ${fm.mailto_url ? html`<a class="btn" id="fmail" href="${fm.mailto_url}">✉️ E-mail</a>` : ''}</div>
   <p class="hint">Aucun envoi automatique : ces boutons ouvrent WhatsApp ou votre messagerie avec le texte prérempli. Après l’envoi, enregistrez la relance :</p>
   <div class="row"><select id="fch" style="width:auto"><option value="whatsapp">WhatsApp</option><option value="email">E-mail</option><option value="telephone">Téléphone</option><option value="copie">Autre</option></select><button class="btn primary" id="fdone" ${maxed ? raw('disabled') : ''}>✔ J’ai relancé</button>${maxed ? html`<span class="sm muted">Limite de 3 relances atteinte.</span>` : ''}</div>
   ${q.followups.length ? html`<h4 style="margin-top:16px">Historique des relances</h4><div class="timeline">${q.followups.map(f => html`<div><b>${f.channel}</b> · ${frDate(f.created_at)}<div class="sm muted">${f.message.slice(0, 120)}…</div></div>`)}</div>` : ''}</div>`;
}
async function quoteView(id) {
  const q = await api('GET', '/quotes/' + id);
  const t = totals(q.lines, q.vat_regime === 'franchise');
  const fm = q.status === 'envoye' ? await api('GET', `/quotes/${id}/followup-message`) : null;
  const co = me.company;
  const mail = q.client.email ? `mailto:${q.client.email}?subject=${encodeURIComponent('Devis ' + q.number + ' — ' + co.name)}&body=${encodeURIComponent(`Bonjour${q.client.first_name ? ' ' + q.client.first_name : ''},\n\nVeuillez trouver ci-joint notre devis ${q.number}${q.title ? ' (' + q.title + ')' : ''}, valable jusqu’au ${frDate(q.valid_until)}.\n\nCordialement,\n${co.owner_name} — ${co.name}`)}` : '';
  shell('/devis', html`<div class="grid g2" style="grid-template-columns:2fr 1fr;align-items:start"><div>
    <div class="card"><div class="row between"><div><b>${fullName(q.client)}</b>${q.client.company_name ? ' — ' + q.client.company_name : ''}<div class="sm muted">${[q.client.phone, q.client.email, q.client.city].filter(Boolean).join(' · ')}</div><a class="sm" href="#/clients/${q.client.id}">Voir la fiche</a></div><div class="right">${badge(QUOTE_STATUS, q.status)}<div class="sm muted">Émis le ${frDate(q.issue_date)}<br>Valable jusqu’au ${frDate(q.valid_until)}</div></div></div>
     ${q.title ? html`<h3 style="margin-top:14px">${q.title}</h3>` : ''}
     <div class="tablewrap"><table><thead><tr><th>Description</th><th class="right">Qté</th><th class="right">P.U. HT</th><th class="right">Total HT</th></tr></thead><tbody>
      ${q.lines.map(l => html`<tr><td>${l.description}${l.discount_pct ? html`<div class="sm muted">Remise ${l.discount_pct} %</div>` : ''}</td><td class="right">${l.quantity}</td><td class="right">${eur(l.unit_price_cents)}</td><td class="right">${eur(Math.round(l.quantity * l.unit_price_cents * (1 - l.discount_pct / 100)))}</td></tr>`)}</tbody></table></div>
     <div class="totals"><div><span>Total HT</span><b>${eur(t.ht)}</b></div><div><span>TVA</span><b>${q.vat_regime === 'franchise' ? 'non applicable' : eur(t.vat)}</b></div><div class="ttc"><span>Total TTC</span><span>${eur(t.ttc)}</span></div></div>
     ${q.notes ? html`<p class="sm muted">${q.notes}</p>` : ''}</div>
    ${fm ? followupBox(q, fm) : ''}</div>
    <div class="card"><h3>Actions</h3><div class="grid">
     <a class="btn primary" href="/api/quotes/${q.id}/pdf" id="pdf">⬇ Télécharger le PDF</a>
     ${mail ? html`<a class="btn" href="${mail}">✉️ Préparer l’e-mail</a><p class="hint" style="margin:-8px 0 0">Ouvre votre messagerie : joignez le PDF téléchargé. L’envoi direct depuis Devis974 n’est pas encore configuré.</p>` : ''}
     ${q.status === 'brouillon' ? html`<button class="btn green" data-st="envoye">✔ Marquer comme envoyé</button><a class="btn" href="#/devis/${q.id}/edit">✏️ Modifier</a><button class="btn danger" id="del">Supprimer le brouillon</button>` : ''}
     ${q.status === 'envoye' ? html`<button class="btn green" data-st="accepte">Client a accepté</button><button class="btn danger" data-st="refuse">Client a refusé</button>` : ''}
     <button class="btn" id="dup">Dupliquer</button></div>
     ${q.status !== 'brouillon' ? html`<p class="hint">Un devis envoyé n’est plus modifiable. Dupliquez-le pour une nouvelle version.</p>` : ''}</div></div>`, q.number);
  $$('[data-st]').forEach(b => b.onclick = guard(async () => { await api('POST', `/quotes/${id}/status`, { status: b.dataset.st }); toast('Statut mis à jour.'); quoteView(id); }));
  $('#dup').onclick = guard(async () => { const n = await api('POST', `/quotes/${id}/duplicate`); location.hash = '#/devis/' + n.id; });
  if ($('#del')) $('#del').onclick = guard(async () => { if (confirm('Supprimer ce brouillon ?')) { await api('DELETE', '/quotes/' + id); location.hash = '#/devis'; } });
  if (fm) bindFollowup(id, () => quoteView(id));
}
function bindFollowup(id, refresh) {
  $('#fdate-ok').onclick = guard(async () => { await api('POST', `/quotes/${id}/followup-date`, { date: $('#fdate').value }); toast('Relance programmée.'); refresh(); });
  $('#fcopy').onclick = guard(async () => { await navigator.clipboard.writeText($('#fmsg').value); toast('Message copié.'); });
  const upd = () => { const m = encodeURIComponent($('#fmsg').value); const a = $('#fwa'); if (a) a.href = a.href.split('?text=')[0] + '?text=' + m; };
  $('#fmsg').oninput = upd;
  $('#fdone').onclick = guard(async () => { await api('POST', `/quotes/${id}/followups`, { channel: $('#fch').value, message: $('#fmsg').value }); toast('Relance enregistrée.'); refresh(); });
}

// ---------- Relances ----------
async function followupsView() {
  const list = await api('GET', '/followups/due');
  const due = list.filter(x => x.overdue), later = list.filter(x => !x.overdue);
  const card = x => html`<div class="card" style="margin-bottom:12px"><div class="row between"><div><a href="#/devis/${x.id}"><b>${x.number}</b></a> · ${x.client_name} ${x.overdue ? html`<span class="badge orange">À relancer</span>` : html`<span class="badge grey">Prévue le ${frDate(x.followup_date)}</span>`}
    <div class="sm muted">${eur(x.total_ttc_cents)} · envoyé le ${frDate(x.sent_at)} · ${x.followup_count} relance(s) faite(s)</div></div><a class="btn sm primary" href="#/devis/${x.id}">Ouvrir et relancer</a></div></div>`;
  shell('/relances', html`${trialBanner()}<h3>À relancer maintenant (${due.length})</h3>${due.length ? due.map(card) : html`<p class="muted">Aucune relance en retard. 👍</p>`}
    <h3 style="margin-top:24px">Programmées (${later.length})</h3>${later.length ? later.map(card) : html`<p class="muted">Rien de programmé.</p>`}
    <p class="hint">Quand vous marquez un devis « envoyé », une relance est programmée automatiquement (délai réglable dans Réglages). Vous restez maître de l’envoi.</p>`, 'Relances');
}

// ---------- Réglages ----------
async function settingsView() {
  const [templates] = await Promise.all([api('GET', '/templates')]);
  const c = me.company, e = me.entitlements;
  shell('/parametres', html`<div class="alert info">Plan : <b>${e.plan === 'trial' ? 'Essai gratuit' : e.plan}</b> — ${e.plan === 'trial' ? 'fin le ' + frDate(e.trial_ends_at) : ''}. Le paiement en ligne n’est pas configuré : aucune formule payante ne peut être souscrite pour le moment.</div>
   <form id="f" class="card"><h3>Mon entreprise</h3><div class="grid g2">
    <div class="field"><label>Nom *</label><input name="name" value="${c.name}" required></div><div class="field"><label>Responsable *</label><input name="owner_name" value="${c.owner_name}" required></div>
    <div class="field"><label>Téléphone *</label><input name="phone" value="${c.phone}" required></div>
    <div class="field"><label>Secteur</label><select name="sector">${SECTORS.map(s => html`<option ${s === c.sector ? raw('selected') : ''}>${s}</option>`)}</select></div>
    <div class="field"><label>Adresse</label><input name="address" value="${c.address}"></div><div class="field"><label>Code postal</label><input name="postal_code" value="${c.postal_code}"></div>
    <div class="field"><label>Ville</label><input name="city" value="${c.city}"></div><div class="field"><label>SIRET</label><input name="siret" value="${c.siret}" placeholder="14 chiffres"></div></div>
   <h3>Mentions légales et TVA</h3><div class="alert sm">Ces informations apparaissent sur vos PDF. Devis974 ne garantit pas la conformité : faites vérifier vos mentions par votre comptable.</div>
   <div class="grid g2"><div class="field"><label>Forme juridique</label><input name="legal_form" value="${c.legal_form}" placeholder="ex. EI, SASU, auto-entrepreneur"></div><div class="field"><label>N° de TVA intracommunautaire</label><input name="vat_number" value="${c.vat_number}"></div>
    <div class="field"><label>Régime de TVA</label><select name="vat_regime"><option value="franchise" ${c.vat_regime === 'franchise' ? raw('selected') : ''}>Franchise en base (art. 293 B du CGI)</option><option value="applicable" ${c.vat_regime === 'applicable' ? raw('selected') : ''}>TVA applicable</option></select></div>
    <div class="field"><label>Taux de TVA par défaut (%)</label><input name="default_vat_rate" value="${String(c.default_vat_rate).replace('.', ',')}" inputmode="decimal"><div class="hint">Taux propre à votre activité et à La Réunion — à confirmer avec votre comptable.</div></div></div>
   <div class="field"><label>Autres mentions (RCS/RM, assurance décennale, médiateur de la consommation…)</label><textarea name="legal_notes">${c.legal_notes}</textarea></div>
   <div class="field"><label>Conditions de paiement par défaut</label><textarea name="payment_terms">${c.payment_terms}</textarea></div>
   <div class="grid g2"><div class="field"><label>Validité des devis (jours)</label><input name="quote_validity_days" type="number" min="1" max="365" value="${c.quote_validity_days}"></div><div class="field"><label>Délai avant relance (jours)</label><input name="followup_delay_days" type="number" min="1" max="60" value="${c.followup_delay_days}"></div></div>
   <button class="btn primary">Enregistrer</button></form>
   <div class="card" style="margin-top:14px"><h3>Logo</h3><div class="row">${c.has_logo ? html`<img src="/api/company/logo?t=${Date.now()}" alt="Logo" style="max-height:60px;max-width:160px">` : html`<span class="muted">Aucun logo</span>`}<input type="file" id="logo" accept="image/png,image/jpeg" style="max-width:260px">${c.has_logo ? html`<button class="btn sm danger" id="logo-del">Retirer</button>` : ''}</div><div class="hint">PNG ou JPEG, 400 Ko maximum.</div></div>
   <div class="card" style="margin-top:14px"><h3>Modèles de prestations</h3><div class="list">${templates.map(t => html`<div class="row between"><span>${t.label} — ${eur(t.unit_price_cents)}</span><button class="btn sm danger" data-tdel="${t.id}">Supprimer</button></div>`)}</div>
    <form id="tf" class="row" style="margin-top:10px"><input name="label" placeholder="ex. Nettoyage climatisation split" required style="flex:3;min-width:180px"><input name="price" placeholder="Prix HT €" inputmode="decimal" style="flex:1;min-width:90px"><button class="btn">Ajouter</button></form></div>
   <div class="card" style="margin-top:14px"><h3>Affichage et données</h3><div class="row"><button class="btn" id="theme">${theme.get() === 'dark' ? '☀️ Mode clair' : '🌙 Mode sombre'}</button><a class="btn" href="/api/export" download>⬇ Exporter mes données (JSON)</a><button class="btn danger" id="delacc">Supprimer mon compte</button></div></div>`, 'Réglages');
  $('#f').onsubmit = guard(async ev => { ev.preventDefault(); const d = formObj(ev.target); d.default_vat_rate = d.default_vat_rate.replace(',', '.'); await api('PUT', '/company', d); await loadMe(); toast('Réglages enregistrés.'); settingsView(); });
  $('#tf').onsubmit = guard(async ev => { ev.preventDefault(); const d = formObj(ev.target); await api('POST', '/templates', { label: d.label, unit_price_cents: toCents(d.price), vat_rate: me.company.default_vat_rate }); settingsView(); });
  $$('[data-tdel]').forEach(b => b.onclick = guard(async () => { await api('DELETE', '/templates/' + b.dataset.tdel); settingsView(); }));
  $('#logo').onchange = guard(async ev => {
    const f = ev.target.files[0]; if (!f) return; if (f.size > 400000) throw new Error('Logo trop volumineux (400 Ko maximum).');
    const data = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
    await api('PUT', '/company/logo', { data }); await loadMe(); toast('Logo enregistré.'); settingsView();
  });
  if ($('#logo-del')) $('#logo-del').onclick = guard(async () => { await api('DELETE', '/company/logo'); await loadMe(); settingsView(); });
  $('#theme').onclick = () => { theme.set(theme.get() === 'dark' ? 'light' : 'dark'); settingsView(); };
  $('#delacc').onclick = guard(async () => { const pw = prompt('Action irréversible : toutes vos données seront supprimées. Saisissez votre mot de passe pour confirmer.'); if (!pw) return; await api('POST', '/company/delete', { password: pw }); me = null; location.hash = '#/connexion'; });
}

// ---------- Routeur ----------
async function loadMe() { me = await api('GET', '/auth/me'); }
const PUBLIC = ['connexion', 'inscription', 'oubli', 'reinit'];
async function route() {
  const [path, qs] = (location.hash.slice(1) || '/').split('?');
  const seg = path.split('/').filter(Boolean);
  try {
    if (!me) { try { await loadMe(); } catch {} }
    if (!me && !PUBLIC.includes(seg[0])) return location.replace('#/connexion');
    if (me && PUBLIC.includes(seg[0]) && seg[0] !== 'reinit') return location.replace('#/');
    $('#root').setAttribute('aria-busy', 'true');
    const [a, b, c] = seg;
    if (a === 'connexion') loginView();
    else if (a === 'inscription') registerView();
    else if (a === 'oubli') forgotView();
    else if (a === 'reinit') resetView(b);
    else if (!a) await dashboardView();
    else if (a === 'clients') await (b === 'new' ? clientNewView() : b ? clientView(b) : clientsView(qs));
    else if (a === 'devis') await (b === 'new' ? quoteEditView(null, qs) : c === 'edit' ? quoteEditView(b) : b ? quoteView(b) : quotesView(qs));
    else if (a === 'relances') await followupsView();
    else if (a === 'parametres') await settingsView();
    else location.replace('#/');
    window.scrollTo(0, 0);
  } catch (e) { toast(e.message, true); }
}
window.addEventListener('hashchange', route);
route();
