/* Énergie Jeune – noyau de l'interface : état, routage, coque, évènements. */
(function () {
  'use strict';
  const EJ = window.EJ, L = EJ.L;
  const KEY = 'ej-demo-v1';
  let S = null, MODAL = null, UI = { draft: null, sugg: null, flash: null };
  const H = {}, ACT = {}, FORM = {}, CHG = {}, V = { claire: {}, vol: {} };

  /* ---------- helpers HTML ---------- */
  H.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const esc = H.esc;
  H.badge = (t, c) => `<span class="badge ${c || 'mute'}">${esc(t)}</span>`;
  H.nf = x => x == null ? '—' : Number(x).toLocaleString('fr-FR');
  H.d = (d, o) => L.fmtDate(d, o || { weekday: 'short', day: 'numeric', month: 'short' });
  H.dl = d => L.fmtDate(d, { weekday: 'long', day: 'numeric', month: 'long' });
  H.ICON = {
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    car: '<path d="M4 16V12l2-5h12l2 5v4M3 16h18M4 16v3h3v-3M17 16v3h3v-3"/><circle cx="7.5" cy="13" r=".8"/><circle cx="16.5" cy="13" r=".8"/>',
    folder: '<path d="M3 6h6l2 2h10v11H3z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v5M12 18v.5"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M16 7l3 3"/>',
    check: '<path d="m5 12 5 5 9-10"/>'
  };
  H.icon = n => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${H.ICON[n] || ''}</svg>`;
  H.opts = (list, sel) => list.map(o => { const v = Array.isArray(o) ? o[0] : o, t = Array.isArray(o) ? o[1] : o; return `<option value="${esc(v)}"${String(v) === String(sel) ? ' selected' : ''}>${esc(t)}</option>`; }).join('');
  H.volOpts = (sel, ids, blank) => (blank != null ? `<option value="">${esc(blank)}</option>` : '') + (ids ? S.volunteers.filter(v => ids.includes(v.id)) : S.volunteers).map(v => `<option value="${v.id}"${v.id === sel ? ' selected' : ''}>${esc(v.name)}</option>`).join('');
  H.stageBadge = st => H.badge(L.STAGE_LABELS[st], { a_preparer: 'warn', pret: 'info', emporte: 'info2', remis: 'ok' }[st]);
  H.dossierBadge = iv => {
    const st = L.dossierState(iv); if (!st) return H.badge('Dossier vide', 'mute');
    const iss = iv.status === 'publiée' ? L.dossierIssues(iv) : [];
    return H.stageBadge(st) + (iss.length ? ' ' + H.badge('Incomplet', 'bad') : '');
  };
  H.ivStateBadge = (iv, now) => { const s = L.ivState(iv, now); return H.badge(s === 'brouillon' ? 'Brouillon' : s === 'annulée' ? 'Annulée' : s === 'en cours' ? 'En cours' : s === 'terminée' ? 'Terminée' : 'À venir', { brouillon: 'warn', annulée: 'bad', 'en cours': 'info2', terminée: 'mute', 'à venir': 'info' }[s]); };
  H.teamChips = iv => {
    const chips = iv.team.map(id => `<span class="chip${id === iv.driverId ? ' drv' : ''}" title="${id === iv.driverId ? 'Conducteur' : ''}">${esc(L.vname(S, id))}${id === iv.driverId ? ' ' + H.icon('key') : ''}</span>`);
    for (let i = iv.team.length; i < iv.required; i++) chips.push('<span class="chip miss">À pourvoir</span>');
    return `<div class="chips">${chips.join('')}</div><div class="sub ${iv.team.length < iv.required ? 'neg' : ''}">${iv.team.length}/${iv.required} volontaires</div>`;
  };
  H.transport = iv => {
    if (!iv.transport) return '<span class="neg">À choisir</span>';
    const t = L.TRANSPORTS[iv.transport] || iv.transport;
    return `<b>${esc(L.isFleet(iv.transport) ? iv.transport : t)}</b>` + (L.isFleet(iv.transport) ? `<div class="sub ${iv.driverId ? '' : 'neg'}">${iv.driverId ? esc(L.vname(S, iv.driverId)) : 'Conducteur à désigner'}</div>` : '');
  };
  H.ivStateOf = iv => L.ivState(iv, EJ.ctx.now());

  /* ---------- état ---------- */
  function load() {
    try { const raw = localStorage.getItem(KEY); if (raw) { const o = JSON.parse(raw); if (o && o.v === 1) { S = o; return; } } } catch (e) { /* stockage indisponible */ }
    reset(true);
  }
  function reset(silent) {
    S = EJ.seed();
    const r = L.nowParts(0);
    S.settings.demoOffsetMs = (L.min('09:30') - L.min(r.time)) * 60000;
    save(); if (!silent) { UI.draft = null; UI.sugg = null; MODAL = null; go('#/aujourdhui'); render(); }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } }
  const now = () => L.nowParts(S.settings.demoOffsetMs);
  const nowIso = () => { const n = now(); return L.iso(n.date, n.time); };
  const feed = (text, href) => { S.feed.unshift({ id: L.uid('fd'), at: nowIso(), text, href }); S.feed = S.feed.slice(0, 40); };

  /* ---------- routage ---------- */
  function route() {
    const h = (location.hash || '#/aujourdhui').replace(/^#\/?/, '');
    const [p, qs] = h.split('?'); const q = {};
    (qs || '').split('&').filter(Boolean).forEach(kv => { const [k, v] = kv.split('='); q[decodeURIComponent(k)] = decodeURIComponent(v || ''); });
    return { parts: p.split('/').filter(Boolean).map(decodeURIComponent), q, raw: h };
  }
  function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }
  function qs(o) { const s = Object.keys(o).filter(k => o[k] !== '' && o[k] != null).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(o[k])).join('&'); return s ? '?' + s : ''; }

  const NAV = {
    claire: [['aujourdhui', "Aujourd'hui", 'sun'], ['planning', 'Planning', 'cal'], ['vehicules', 'Véhicules', 'car'], ['dossiers', 'Dossiers', 'folder'], ['courriels', 'Courriels', 'mail']],
    vol: [['aujourdhui', "Aujourd'hui", 'sun'], ['planning', 'Planning', 'cal'], ['vehicules', 'Véhicules', 'car'], ['dossiers', 'Dossiers', 'folder'], ['moi', 'Moi', 'user']]
  };
  const SECTION = { iv: 'planning', trajet: 'vehicules', guide: 'aujourdhui', reglages: 'aujourdhui' };

  /* ---------- rendu ---------- */
  function render() {
    const app = document.getElementById('app'); if (!app) return;
    const r = route(); const role = S.ui.role === 'claire' || !L.vol(S, S.ui.role) ? 'claire' : 'vol'; if (role === 'claire') S.ui.role = 'claire';
    const sec = SECTION[r.parts[0]] || r.parts[0] || 'aujourdhui';
    const n = now(); const me = role === 'vol' ? L.vol(S, S.ui.role) : null;
    let body;
    try { const fn = (V[role][r.parts[0] || 'aujourdhui']) || V[role].aujourdhui; body = fn(r); } catch (err) { console.error(err); body = `<div class="card bad-card"><h2>Erreur d'affichage</h2><p>${esc(err.message)}</p><a class="btn" href="#/aujourdhui">Retour</a></div>`; }
    const nav = NAV[role].map(([k, t, ic]) => `<a href="#/${k}" class="${sec === k ? 'on' : ''}" ${sec === k ? 'aria-current="page"' : ''}>${H.icon(ic)}<span>${t}</span></a>`).join('');
    const sy = window.scrollY, sameRoute = app.dataset.route === r.raw;
    app.dataset.route = r.raw;
    app.innerHTML = `
<div class="demo-bar" role="note"><b>DÉMO</b> · données <b>fictives</b> · enregistrées uniquement dans ce navigateur <a href="#/guide">Parcours de démo</a></div>
<div class="app role-${role}">
  <header class="top">
    <a class="brand" href="#/aujourdhui"><img class="logo" src="logo.png" alt="Énergie Jeunes" width="48" height="48"><span class="bt"><small>La Réunion · Organisation interne</small></span></a>
    <div class="top-right">
      <button class="clock" data-act="open-clock" title="Heure de La Réunion (horloge de démo réglable)"><span>${n.time}</span><small>${S.settings.demoOffsetMs ? 'horloge de démo' : 'heure Réunion'}</small></button>
      <label class="role"><span class="sr">Espace affiché</span>
        <select data-change="role" aria-label="Espace affiché">
          <option value="claire"${role === 'claire' ? ' selected' : ''}>Espace Claire (responsable)</option>
          <optgroup label="Espace volontaire (simulation)">${S.volunteers.map(v => `<option value="${v.id}"${S.ui.role === v.id ? ' selected' : ''}>${esc(v.name)}</option>`).join('')}</optgroup>
        </select></label>
    </div>
  </header>
  <nav class="nav" aria-label="Navigation principale"><img class="side-logo" src="logo.png" alt="Énergie Jeunes : on va tous aimer apprendre !">${nav}</nav>
  <main id="main" tabindex="-1">${body}</main>
</div>
${MODAL ? modalHtml() : ''}
<div id="toast" role="status" aria-live="polite"></div>`;
    if (sameRoute) window.scrollTo(0, sy); else window.scrollTo(0, 0);
    if (UI.flash) { toast(UI.flash); UI.flash = null; }
    if (MODAL) { const f = document.querySelector('.modal [autofocus], .modal input:not([type=hidden]), .modal select, .modal button'); f && f.focus(); }
    document.title = 'Énergie Jeune – démo (données fictives)';
  }
  function toast(msg) {
    const t = document.getElementById('toast'); if (!t) { UI.flash = msg; return; }
    t.textContent = msg; t.className = 'show'; clearTimeout(toast.t); toast.t = setTimeout(() => { t.className = ''; }, 3800);
  }
  function openModal(type, data) { MODAL = { type, data: data || {} }; render(); }
  function closeModal() { MODAL = null; render(); }
  function modalHtml() {
    const fn = EJ.modals[MODAL.type]; const inner = fn ? fn(MODAL.data) : '';
    return `<div class="scrim" data-act="close-modal-bg"><div class="modal" role="dialog" aria-modal="true" aria-label="${esc(MODAL.data.title || 'Fenêtre')}" data-stop>${inner}</div></div>`;
  }
  EJ.modals = {};

  /* ---------- évènements ---------- */
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const a = el.dataset.act;
    if (a === 'close-modal-bg') { if (e.target === el) closeModal(); return; }
    const fn = ACT[a]; if (!fn) { console.warn('action inconnue', a); return; }
    if (el.tagName === 'A' && el.getAttribute('href') === '#') e.preventDefault();
    fn(el, e);
  });
  document.addEventListener('submit', e => {
    const f = e.target.closest('form[data-form]'); if (!f) return;
    e.preventDefault(); const fn = FORM[f.dataset.form]; if (fn) fn(f, new FormData(f), e.submitter);
  });
  document.addEventListener('change', e => {
    const el = e.target.closest('[data-change]'); if (el && CHG[el.dataset.change]) CHG[el.dataset.change](el, e);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && MODAL) closeModal(); });
  window.addEventListener('hashchange', () => { MODAL = null; render(); });

  ACT['close-modal'] = () => closeModal();
  CHG.role = el => { S.ui.role = el.value; save(); UI.draft = null; UI.sugg = null; go('#/aujourdhui'); render(); };
  ACT['reset-demo'] = () => { if (confirm('Réinitialiser toutes les données de démonstration ?')) { reset(false); toast('Données de démonstration réinitialisées.'); } };
  ACT['open-clock'] = () => openModal('clock', { title: "Horloge de démo" });
  EJ.modals.clock = () => {
    const n = now();
    return `<h2>Horloge de démo</h2><p class="sub">Heure officielle de La Réunion (Indian/Reunion, UTC+4). Pour jouer le scénario à n'importe quelle heure, fixe l'heure ici.</p>
<form data-form="clock"><label class="f">Date<input type="date" name="date" value="${n.date}"></label><label class="f">Heure<input type="time" name="time" value="${n.time}"></label>
<div class="btnrow"><button class="btn primary">Appliquer</button><button type="button" class="btn" data-act="clock-real">Utiliser l'heure réelle</button><button type="button" class="btn ghost" data-act="close-modal">Fermer</button></div></form>`;
  };
  FORM.clock = (f, fd) => {
    const d = fd.get('date'), t = fd.get('time'); if (!d || !t) return;
    const target = Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10), +t.slice(0, 2) - 4, +t.slice(3, 5)); // UTC+4
    S.settings.demoOffsetMs = target - Date.now(); save(); MODAL = null; render(); toast(`Horloge réglée sur ${t}.`);
  };
  ACT['clock-real'] = () => { S.settings.demoOffsetMs = 0; save(); MODAL = null; render(); toast('Heure réelle de La Réunion.'); };

  EJ.H = H; EJ.ACT = ACT; EJ.FORM = FORM; EJ.CHG = CHG; EJ.V = V; EJ.UI = UI;
  EJ.ctx = {
    get S() { return S; }, now, nowIso, save, render, toast, openModal, closeModal, go, qs, route, feed, reset, load,
    get modal() { return MODAL; }, set modal(v) { MODAL = v; }
  };
})();
