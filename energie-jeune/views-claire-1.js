/* Espace Claire (1/2) : Aujourd'hui, semaine, planning, équipe, formulaire et fiche d'intervention. */
(function () {
  'use strict';
  const EJ = window.EJ, L = EJ.L, H = EJ.H, ctx = EJ.ctx, V = EJ.V.claire, ACT = EJ.ACT, FORM = EJ.FORM, CHG = EJ.CHG, UI = EJ.UI;
  const esc = H.esc;
  const TYPES = ['école', 'collège', 'lycée', 'autre'];
  const TYPE_LAB = { école: 'École', collège: 'Collège', lycée: 'Lycée', autre: 'Établissement' };
  const SEV = { high: 'Urgent', med: 'À traiter', low: 'À savoir' };

  /* ---------- briques ---------- */
  function alertsFor(al, iv) { return al.filter(a => a.href === '#/iv/' + iv.id || a.href === '#/dossiers/' + iv.id || a.href2 === '#/iv/' + iv.id); }
  function alertList(list) {
    return `<ul class="alerts">${list.map(a => `<li class="alert sev-${a.sev}"><a class="al-main" href="${a.href}"><span class="al-kind">${esc(a.kind)}</span><b>${esc(a.title)}</b><span class="al-d">${esc(a.detail)}</span></a>${a.href2 ? `<a class="al-2" href="${a.href2}">Autre fiche</a>` : ''}<a class="al-go" href="${a.href}" aria-label="Ouvrir : ${esc(a.title)}">Ouvrir ›</a></li>`).join('')}</ul>`;
  }
  function alertsHtml(al, title) {
    if (!al.length) return `<section class="card ok-card"><h2>${H.icon('check')} Rien à traiter</h2><p class="sub">Aucune alerte : équipes, véhicules, clés et dossiers sont à jour.</p></section>`;
    const urgent = al.filter(a => a.sev === 'high').length;
    return `<section class="card" aria-labelledby="al-h"><div class="card-h"><h2 id="al-h">${H.icon('alert')} ${title || 'À traiter'} <span class="count">${al.length}</span></h2>${urgent ? H.badge(urgent + ' urgent' + (urgent > 1 ? 's' : ''), 'bad') : ''}</div>
${alertList(al.slice(0, 5))}${al.length > 5 ? `<details class="more"><summary>Voir les ${al.length - 5} autres alertes</summary>${alertList(al.slice(5))}</details>` : ''}</section>`;
  }
  function ivRow(iv, n, al) {
    const probs = alertsFor(al, iv);
    return `<li><a class="ivrow ${iv.status === 'annulée' ? 'cancelled' : ''} ${probs.some(p => p.sev === 'high') ? 'has-high' : ''}" href="#/iv/${iv.id}">
<div class="c-time"><b>${iv.start}</b><span>${iv.end}</span></div>
<div class="c-school"><b>${esc(iv.school)}</b><span>${TYPE_LAB[iv.type] || ''} · ${esc(iv.commune)}</span><div class="mini">${H.ivStateBadge(iv, n)}${iv.demo ? '' : ' ' + H.badge('Créée par vous', 'info')}${probs.slice(0, 3).map(p => ' ' + H.badge(p.title.replace(/ : .*$/, ''), p.sev === 'high' ? 'bad' : 'warn')).join('')}</div></div>
<div class="c-team">${H.teamChips(iv)}</div>
<div class="c-tr"><span class="lab">Transport</span>${H.transport(iv)}</div>
<div class="c-dos"><span class="lab">Dossier</span>${H.dossierBadge(iv)}</div></a></li>`;
  }
  function ivsOn(S, d) { return S.interventions.filter(i => i.date === d).sort((a, b) => a.start < b.start ? -1 : 1); }

  function vehCard(S, n, veh, full) {
    const ci = L.custodyInfo(S, veh, n), VV = S.vehicles[veh], nm = id => esc(L.vname(S, id));
    const st = ci.status === 'a_confirmer' ? H.badge('À confirmer', 'bad') : H.badge('Clés confirmées', 'ok');
    let holder;
    if (ci.pending) holder = `<b class="neg">À confirmer</b><div class="sub">${nm(ci.pending.from)} a remis les clés à ${nm(ci.pending.to)} (${L.fmtIso(ci.pending.at, n.date)}). ${nm(ci.pending.to)} doit confirmer.</div>`;
    else if (ci.holder) holder = `<b>${nm(ci.holder)}</b><div class="sub">depuis ${L.fmtIso(ci.since, n.date)}</div>`;
    else holder = `<b>Personne</b><div class="sub">Voiture laissée${ci.leftBy ? ' par ' + nm(ci.leftBy) : ''}${ci.leftAt ? ', ' + L.fmtIso(ci.leftAt, n.date) : ''}</div>`;
    const where = ci.holder && !ci.pending ? `En déplacement avec ${nm(ci.holder)}<div class="sub">Dernier lieu connu : ${esc(ci.place)}</div>` : `${esc(ci.place)}`;
    let next;
    if (ci.next) next = `<a href="#/iv/${ci.next.iv.id}"><b>${nm(ci.next.driver)}</b> · ${ci.next.date === n.date ? '' : H.d(ci.next.date) + ' '}${L.hm(ci.next.from)}</a><div class="sub">${esc((ci.next.iv.meeting && ci.next.iv.meeting.place) || ci.next.iv.school)}</div>`;
    else next = '<span class="sub">Aucune réservation à venir</span>';
    return `<article class="card veh ${ci.status === 'a_confirmer' ? 'veh-warn' : ''}" aria-label="Voiture ${veh}">
<div class="card-h"><h3><a href="#/vehicules/${veh}">${H.icon('car')} ${veh}</a> <small>${esc(VV.model)}</small></h3>${st}</div>
<dl class="kv"><div><dt>Détenteur actuel</dt><dd>${holder}</dd></div><div><dt>Où est la voiture</dt><dd>${where}</dd></div><div><dt>La récupère ensuite</dt><dd>${next}</dd></div><div><dt>Compteur</dt><dd>${H.nf(ci.odo)} km</dd></div></dl>
${ci.reasons.length ? `<ul class="reasons">${ci.reasons.map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
<div class="btnrow"><a class="btn sm" href="#/vehicules/${veh}">Historique et corrections</a></div></article>`;
  }
  EJ.vehCard = vehCard;

  function weekHtml(S, n, start, al, o) {
    o = o || {};
    const days = [0, 1, 2, 3, 4, 5, 6].map(i => L.addDays(start, i));
    const empties = [];
    const cols = days.map(d => {
      const ivs = ivsOn(S, d), hol = L.holiday(d), we = L.dow(d) === 0 || L.dow(d) === 6, work = L.isWorkday(d);
      let body;
      if (ivs.length) body = ivs.map(iv => { const p = alertsFor(al, iv); return `<a class="wk-iv ${iv.status} ${p.some(x => x.sev === 'high') ? 'has-high' : ''}" href="#/iv/${iv.id}"><b>${iv.start}–${iv.end}</b><span>${esc(iv.school)}</span><small>${esc(iv.commune)} · ${iv.team.length}/${iv.required}${iv.transport ? ' · ' + (L.isFleet(iv.transport) ? iv.transport : L.TRANSPORTS[iv.transport]) : ''}</small>${iv.status === 'brouillon' ? H.badge('Brouillon', 'warn') : iv.status === 'annulée' ? H.badge('Annulée', 'bad') : ''}${p.length ? H.badge(p.length + ' alerte' + (p.length > 1 ? 's' : ''), p.some(x => x.sev === 'high') ? 'bad' : 'warn') : ''}</a>`; }).join('');
      else if (hol) body = `<div class="wk-empty hol"><b>Jour férié</b><span>${esc(hol)}</span></div>`;
      else if (we) body = '<div class="wk-empty we"><b>Week-end</b></div>';
      else { empties.push(d); body = `<div class="wk-empty none"><b>Aucune intervention</b><a class="btn sm" href="#/planning/new?date=${d}">Planifier</a></div>`; }
      return `<div class="wk-col ${d === n.date ? 'today' : ''} ${!ivs.length && work ? 'is-empty' : ''}"><div class="wk-h"><b>${H.d(d, { weekday: 'short' })}</b> ${H.d(d, { day: 'numeric', month: 'short' })}${d === n.date ? ' ' + H.badge("Aujourd'hui", 'info') : ''}</div>${body}</div>`;
    }).join('');
    const sum = empties.length ? `<p class="wk-sum neg">${H.icon('alert')} ${empties.length} jour${empties.length > 1 ? 's' : ''} ouvré${empties.length > 1 ? 's' : ''} sans intervention : ${empties.map(d => H.d(d, { weekday: 'long', day: 'numeric' })).join(', ')}.</p>` : '<p class="wk-sum">Tous les jours ouvrés ont au moins une intervention.</p>';
    const base = o.base || '#/aujourdhui?v=semaine';
    const sep = base.includes('?') ? '&' : '?';
    return `<section class="card"><div class="card-h"><h2>Semaine du ${H.d(start, { day: 'numeric', month: 'long' })}</h2><div class="btnrow"><a class="btn sm" href="${base}${sep}w=${L.addDays(start, -7)}">‹ Précédente</a><a class="btn sm" href="${base}${sep}w=${L.weekStart(n.date)}">Cette semaine</a><a class="btn sm" href="${base}${sep}w=${L.addDays(start, 7)}">Suivante ›</a></div></div>${sum}<div class="week">${cols}</div></section>`;
  }

  /* ---------- Aujourd'hui ---------- */
  V.aujourdhui = function (r) {
    const S = ctx.S, n = ctx.now(), al = L.alerts(S, n), mode = r.q.v === 'semaine' ? 'semaine' : 'jour';
    const list = ivsOn(S, n.date);
    const toggle = `<div class="seg" role="tablist" aria-label="Affichage"><a role="tab" class="${mode === 'jour' ? 'on' : ''}" href="#/aujourdhui" aria-selected="${mode === 'jour'}">Jour</a><a role="tab" class="${mode === 'semaine' ? 'on' : ''}" href="#/aujourdhui?v=semaine" aria-selected="${mode === 'semaine'}">Semaine</a></div>`;
    let main;
    if (mode === 'semaine') main = weekHtml(S, n, r.q.w || L.weekStart(n.date), al);
    else {
      const next = list.length ? null : S.interventions.filter(i => i.date > n.date && i.status !== 'annulée').sort((a, b) => a.date < b.date ? -1 : 1)[0];
      main = `<section class="card"><div class="card-h"><h2>Interventions du jour <span class="count">${list.length}</span></h2><a class="btn primary" href="#/planning/new?date=${n.date}">+ Nouvelle intervention</a></div>
${list.length ? `<ol class="ivlist head">${list.map(i => ivRow(i, n, al)).join('')}</ol>` : `<div class="wk-empty none big"><b>Aucune intervention ${L.holiday(n.date) ? '(jour férié : ' + esc(L.holiday(n.date)) + ')' : L.isWorkday(n.date) ? "aujourd'hui" : '(jour non ouvré)'}</b>${next ? `<span>Prochaine : <a href="#/iv/${next.id}">${esc(next.school)}, ${H.d(next.date)}</a></span>` : ''}</div>`}</section>`;
    }
    const f = S.feed.slice(0, 6);
    return `<div class="page-h"><div><h1>Aujourd'hui</h1><p class="sub">${H.dl(n.date)} · ${n.time} (heure de La Réunion)</p></div>${toggle}</div>
<div class="cols"><div class="col-main">${alertsHtml(al)}${main}
<section class="card"><h2>Activité récente</h2><ul class="feed">${f.map(x => `<li><time>${L.fmtIso(x.at, n.date)}</time> ${x.href ? `<a href="${x.href}">${esc(x.text)}</a>` : esc(x.text)}</li>`).join('')}</ul></section></div>
<aside class="col-side" aria-label="Voitures de fonction"><h2 class="sr">Voitures de fonction</h2>${vehCard(S, n, 'KM')}${vehCard(S, n, 'PM')}</aside></div>`;
  };

  /* ---------- Planning ---------- */
  V.planning = function (r) {
    if (r.parts[1] === 'new') return ivForm(r, null);
    const S = ctx.S, n = ctx.now(), tab = r.parts[1] === 'equipe' ? 'equipe' : 'cal';
    const tabs = `<div class="seg"><a class="${tab === 'cal' ? 'on' : ''}" href="#/planning">Calendrier</a><a class="${tab === 'equipe' ? 'on' : ''}" href="#/planning/equipe">Équipe et disponibilités</a></div>`;
    if (tab === 'equipe') return `<div class="page-h"><div><h1>Équipe de volontaires</h1><p class="sub">12 volontaires en service civique · les noms (dont les deux Rachel) sont modifiables</p></div>${tabs}</div>${teamHtml(S, n)}`;
    const al = L.alerts(S, n), mode = r.q.m === 'liste' ? 'liste' : 'semaine';
    const modes = `<div class="seg"><a class="${mode === 'semaine' ? 'on' : ''}" href="#/planning">Semaine</a><a class="${mode === 'liste' ? 'on' : ''}" href="#/planning?m=liste">Liste</a></div>`;
    let body;
    if (mode === 'semaine') body = weekHtml(S, n, r.q.w || L.weekStart(n.date), al, { base: '#/planning' });
    else {
      const f = r.q.f || 'avenir';
      let list = S.interventions.filter(i => f === 'passees' ? i.date < n.date : f === 'brouillons' ? i.status === 'brouillon' : f === 'annulees' ? i.status === 'annulée' : i.date >= n.date && i.status !== 'annulée').sort((a, b) => (a.date + a.start) < (b.date + b.start) ? -1 : 1);
      if (f === 'passees') list.reverse();
      const chips = [['avenir', 'À venir'], ['brouillons', 'Brouillons'], ['passees', 'Passées'], ['annulees', 'Annulées']].map(([k, t]) => `<a class="pill ${f === k ? 'on' : ''}" href="#/planning?m=liste&f=${k}">${t}</a>`).join('');
      let last = '';
      body = `<section class="card"><div class="card-h"><h2>Interventions</h2><div class="pills">${chips}</div></div>${list.length ? `<ol class="ivlist head">${list.map(i => { const h = i.date !== last ? `<li class="day-sep">${H.dl(i.date)}${L.holiday(i.date) ? ' · ' + esc(L.holiday(i.date)) : ''}</li>` : ''; last = i.date; return h + ivRow(i, n, al); }).join('')}</ol>` : '<p class="sub pad">Aucune intervention dans cette liste.</p>'}</section>`;
    }
    return `<div class="page-h"><div><h1>Planning</h1><p class="sub">Interventions dans les écoles, collèges et lycées</p></div><div class="btnrow">${tabs}${modes}<a class="btn primary" href="#/planning/new">+ Nouvelle intervention</a></div></div>${body}`;
  };

  function teamHtml(S, n) {
    const days = [1, 2, 3, 4, 5], dn = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'];
    const rows = S.volunteers.map(v => {
      const grid = days.map(d => ['am', 'pm'].map(s => `<label class="slot" title="${dn[d - 1]} ${s === 'am' ? 'matin' : 'après-midi'}"><input type="checkbox" data-change="avail" data-vol="${v.id}" data-d="${d}" data-s="${s}" ${v.avail[d] && v.avail[d][s] ? 'checked' : ''}><span>${s === 'am' ? 'M' : 'A'}</span></label>`).join('')).map((x, i) => `<div class="day"><small>${dn[i]}</small>${x}</div>`).join('');
      const un = S.unavail.filter(u => u.vol === v.id && u.date >= n.date);
      return `<tr><td data-l="Volontaire"><input class="nm" aria-label="Nom de ${esc(v.name)}" value="${esc(v.name)}" data-change="volname" data-vol="${v.id}"></td>
<td data-l="Secteur de départ"><select aria-label="Secteur de ${esc(v.name)}" data-change="volsector" data-vol="${v.id}">${H.opts(L.COMMUNES, v.sector)}</select></td>
<td data-l="Conduite">${L.VEHICLES.map(k => S.vehicles[k].authorized.includes(v.id) ? H.badge(k, 'ok') : '<span class="badge mute">' + k + ' non</span>').join(' ')}</td>
<td data-l="Disponibilités (M = matin, A = après-midi)"><div class="avgrid">${grid}</div></td>
<td data-l="Cette semaine">${L.weekLoad(S, v.id, n.date)} interv.${un.length ? `<div class="sub neg">${un.length} indispo.</div>` : ''}</td></tr>`;
    }).join('');
    const unl = S.unavail.filter(u => u.date >= n.date).sort((a, b) => a.date < b.date ? -1 : 1);
    return `<section class="card"><div class="card-h"><h2>Volontaires</h2><a class="btn sm" href="#/vehicules?t=aut">Gérer les droits de conduite</a></div><div class="tablewrap"><table class="tbl resp"><thead><tr><th>Volontaire</th><th>Secteur</th><th>Conduite</th><th>Disponibilités habituelles</th><th>Charge</th></tr></thead><tbody>${rows}</tbody></table></div><p class="sub pad">Seule la commune ou le secteur de départ est utilisé : aucune adresse personnelle n'est demandée.</p></section>
<section class="card"><h2>Indisponibilités à venir</h2>${unl.length ? `<ul class="plain">${unl.map(u => `<li><b>${esc(L.vname(S, u.vol))}</b> · ${H.d(u.date)} ${u.from}–${u.to} · ${esc(u.reason || 'sans motif')}${u.ivId ? ` · <a href="#/iv/${u.ivId}">fiche</a>` : ''} <small>(signalé ${L.fmtIso(u.at, n.date)})</small></li>`).join('')}</ul>` : '<p class="sub">Aucune indisponibilité déclarée.</p>'}</section>`;
  }
  CHG.volname = el => { const v = L.vol(ctx.S, el.dataset.vol); if (v && el.value.trim()) { v.name = el.value.trim(); ctx.save(); ctx.render(); ctx.toast('Nom enregistré.'); } };
  CHG.volsector = el => { const v = L.vol(ctx.S, el.dataset.vol); v.sector = el.value; ctx.save(); ctx.toast('Secteur enregistré.'); };
  CHG.avail = el => { const v = L.vol(ctx.S, el.dataset.vol), d = +el.dataset.d; v.avail[d] = v.avail[d] || { am: 0, pm: 0 }; v.avail[d][el.dataset.s] = el.checked ? 1 : 0; ctx.save(); ctx.toast('Disponibilités enregistrées.'); };

  /* ---------- Formulaire d'intervention ---------- */
  const blank = date => ({ id: null, school: '', type: 'collège', commune: '', address: '', contact: { name: '', role: '', tel: '', email: '' }, date: date || '', start: '08:30', end: '10:30', required: 2, team: [], driverId: null, transport: '', meeting: { place: '', time: '' }, notes: '', status: 'brouillon', tpl: 'tpl_std' });
  function collect() {
    const f = document.querySelector('form[data-form="iv"]'); if (!f || !UI.draft) return;
    const g = n => f.elements[n] ? f.elements[n].value : '';
    const d = UI.draft;
    d.school = g('school'); d.type = g('type'); d.commune = g('commune'); d.address = g('address');
    d.contact = { name: g('cname'), role: g('crole'), tel: g('ctel'), email: g('cemail') };
    d.date = g('date'); d.start = g('start'); d.end = g('end'); d.required = Math.max(1, Math.min(8, +g('required') || 1));
    d.team = Array.from(f.querySelectorAll('input[name="team"]:checked')).map(x => x.value);
    d.transport = g('transport'); d.driverId = g('driver') || null;
    d.meeting = { place: g('mplace'), time: g('mtime') }; d.notes = g('notes'); if (f.elements.tpl) d.tpl = g('tpl');
  }
  function ivWarnings(S, d) {
    const w = [], push = (sev, t) => w.push({ sev, t });
    if (d.date && d.start && d.end && d.end <= d.start) push('bad', "L'heure de fin doit être après le début.");
    if (d.date && L.holiday(d.date)) push('warn', `Jour férié : ${L.holiday(d.date)}.`);
    else if (d.date && (L.dow(d.date) === 0 || L.dow(d.date) === 6)) push('warn', 'Cette date tombe un week-end.');
    if (d.team.length < d.required) push('warn', `Équipe incomplète : ${d.team.length}/${d.required} volontaires.`);
    if (d.team.length > d.required) push('info', `${d.team.length} volontaires pour ${d.required} requis.`);
    d.team.forEach(id => {
      const st = L.volStatus(S, id, d), nm = L.vname(S, id);
      st.reasons.forEach(r => push(/déjà sur/.test(r) ? 'bad' : 'warn', `${nm} : ${r}.`));
      L.tightGaps(S, id, d).forEach(o => push('warn', `${nm} : enchaînement serré avec « ${o.school} » (${o.commune}, ${o.start}–${o.end}).`));
    });
    if (L.isFleet(d.transport)) {
      L.vehConflictsFor(S, d).forEach(o => push('bad', `${d.transport} déjà réservée par « ${o.school} » (${o.start}–${o.end}) – ${L.vname(S, o.driverId)}.`));
      if (!d.driverId) push('warn', `Conducteur ${d.transport} à désigner.`);
      else if (!S.vehicles[d.transport].authorized.includes(d.driverId)) push('bad', `${L.vname(S, d.driverId)} n'est pas habilité(e) à conduire ${d.transport}.`);
      else if (!d.team.includes(d.driverId)) push('bad', 'Le conducteur doit faire partie de l\'équipe.');
    }
    if (!d.transport) push('info', 'Mode de transport à choisir.');
    return w;
  }
  function autoDriver(S, d) {
    if (!L.isFleet(d.transport)) { if (d.driverId && !L.isFleet(d.transport)) d.driverId = null; return; }
    if (d.driverId && !d.team.includes(d.driverId)) d.driverId = null;
    if (!d.driverId) { const c = d.team.filter(id => S.vehicles[d.transport].authorized.includes(id)); if (c.length) d.driverId = c[0]; }
  }
  function ivForm(r, existing) {
    const S = ctx.S, n = ctx.now(), key = r.raw;
    if (UI.draftKey !== key || !UI.draft) {
      UI.draftKey = key; UI.sugg = null;
      UI.draft = existing ? JSON.parse(JSON.stringify(Object.assign({}, existing, { tpl: '' }))) : blank(r.q.date || n.date);
    }
    const d = UI.draft; autoDriver(S, d);
    const isNew = !existing, warns = ivWarnings(S, d);
    const win = L.isFleet(d.transport) && d.start && d.end ? L.vehWindow(d, S) : null;
    const volRows = S.volunteers.map(v => {
      const st = L.volStatus(S, v.id, d), on = d.team.includes(v.id);
      const kb = L.VEHICLES.filter(k => S.vehicles[k].authorized.includes(v.id));
      return `<label class="vcheck ${st.ok ? '' : 'nok'} ${on ? 'on' : ''}"><input type="checkbox" name="team" value="${v.id}" data-change="ivlive" ${on ? 'checked' : ''}><span class="vc-n"><b>${esc(v.name)}</b><small>${esc(v.sector)}${kb.length ? ' · conduit ' + kb.join('/') : ''}</small></span><span class="vc-s">${d.date && d.start ? (st.ok ? H.badge('Disponible', 'ok') : H.badge(st.reasons[0], /déjà sur/.test(st.reasons[0]) ? 'bad' : 'warn')) : ''}</span></label>`;
    }).join('');
    const sg = UI.sugg;
    const sgHtml = sg ? `<section class="card sugg"><div class="card-h"><h2>Suggestion</h2><button class="btn" data-act="sugg-close" type="button">Fermer</button></div>
${sg.warnings.map(x => `<p class="note warn">${esc(x)}</p>`).join('')}
${sg.team.length ? `<p><b>Équipe proposée :</b></p><ul class="plain">${sg.team.map(id => `<li><b>${esc(L.vname(S, id))}</b>${id === sg.driver ? ' ' + H.badge('Conducteur ' + sg.transport, 'info') : ''}<div class="sub">${esc((sg.reasons[id] || []).join(' · '))}</div></li>`).join('')}</ul>` : ''}
${sg.transportReason ? `<p><b>Transport :</b> ${esc(L.TRANSPORTS[sg.transport] || sg.transport)}<div class="sub">${esc(sg.transportReason)}</div></p>` : ''}
${sg.meeting ? `<p><b>Rendez-vous :</b> ${esc(sg.meeting.place)} à ${sg.meeting.time}<div class="sub">${esc(sg.meetingReason)}</div></p>` : ''}
${sg.excluded.length ? `<details><summary>Non proposés (${sg.excluded.length})</summary><ul class="plain">${sg.excluded.map(x => `<li><b>${esc(L.vname(S, x.id))}</b> : ${esc(x.why)}</li>`).join('')}</ul></details>` : ''}
<div class="btnrow"><button class="btn primary" type="button" data-act="sugg-apply">Appliquer la suggestion au formulaire</button><span class="sub">Tu pourras tout modifier avant d'enregistrer.</span></div></section>` : '';
    const drvOpts = `<option value="">— à désigner —</option>` + d.team.map(id => `<option value="${id}"${id === d.driverId ? ' selected' : ''}>${esc(L.vname(S, id))}${L.isFleet(d.transport) && !S.vehicles[d.transport].authorized.includes(id) ? ' (non habilité·e)' : ''}</option>`).join('');
    return `<div class="page-h"><div><h1>${isNew ? 'Nouvelle intervention' : 'Modifier l\'intervention'}</h1><p class="sub">${isNew ? 'Brouillon invisible des volontaires tant qu\'il n\'est pas publié.' : esc(d.school)}</p></div><a class="btn" href="${isNew ? '#/planning' : '#/iv/' + d.id}">Retour</a></div>
<form data-form="iv" class="ivform" autocomplete="off" novalidate>
<div class="cols"><div class="col-main">
<section class="card"><h2>Établissement</h2><div class="grid2">
<label class="f span2">Nom de l'établissement<input name="school" value="${esc(d.school)}" required placeholder="Ex. Collège Les Letchis"></label>
<label class="f">Type<select name="type">${H.opts(TYPES.map(t => [t, TYPE_LAB[t]]), d.type)}</select></label>
<label class="f">Commune<select name="commune" data-change="ivlive"><option value="">— choisir —</option>${H.opts(L.COMMUNES, d.commune)}</select></label>
<label class="f span2">Adresse<input name="address" value="${esc(d.address)}" placeholder="Numéro, rue"></label>
<label class="f">Contact professionnel<input name="cname" value="${esc(d.contact.name)}" placeholder="Nom"></label><label class="f">Fonction<input name="crole" value="${esc(d.contact.role)}" placeholder="CPE, direction…"></label>
<label class="f">Téléphone<input name="ctel" value="${esc(d.contact.tel)}" inputmode="tel"></label><label class="f">Courriel professionnel<input name="cemail" type="email" value="${esc(d.contact.email)}"></label></div>
<p class="sub">Contacts professionnels uniquement. N'enregistre aucune donnée d'élève.</p></section>
<section class="card"><h2>Quand</h2><div class="grid3"><label class="f">Date<input type="date" name="date" value="${esc(d.date)}" data-change="ivlive" required></label><label class="f">Début<input type="time" name="start" value="${esc(d.start)}" data-change="ivlive" required></label><label class="f">Fin<input type="time" name="end" value="${esc(d.end)}" data-change="ivlive" required></label></div></section>
<section class="card"><div class="card-h"><h2>Équipe</h2><button type="button" class="btn" data-act="suggest">Suggérer équipe et rendez-vous</button></div>
<label class="f inl">Volontaires requis<input type="number" name="required" min="1" max="8" value="${d.required}" data-change="ivlive"></label>
<div class="vchecks" role="group" aria-label="Volontaires">${volRows}</div>
<p class="sub">${d.team.length}/${d.required} sélectionné${d.team.length > 1 ? 's' : ''}. Les disponibilités, secteurs et chevauchements sont vérifiés en direct.</p></section>
<section class="card"><h2>Transport et rendez-vous</h2><div class="grid2">
<label class="f">Mode de transport<select name="transport" data-change="ivlive">${H.opts(Object.entries(L.TRANSPORTS).map(([k, t]) => [k, k === '' ? '— à choisir —' : t]), d.transport)}</select></label>
<label class="f">Conducteur ${L.isFleet(d.transport) ? '' : '<small>(voitures KM/PM)</small>'}<select name="driver" data-change="ivlive" ${L.isFleet(d.transport) ? '' : 'disabled'}>${drvOpts}</select></label>
${win ? `<p class="note info span2">${H.icon('key')} Réservation ${d.transport} : ${L.hm(win.from)} → ${L.hm(win.to)} (retour compris). La réservation n'a aucun effet sur le détenteur actuel des clés.</p>` : ''}
<label class="f span2">Point de rendez-vous<input name="mplace" value="${esc(d.meeting.place)}" placeholder="Lieu précis"></label>
<label class="f">Heure de rendez-vous<input type="time" name="mtime" value="${esc(d.meeting.time)}" data-change="ivlive"></label>
${isNew ? `<label class="f">Dossier (modèle réutilisable)<select name="tpl"><option value="">Aucun élément</option>${ctx.S.templates.map(t => `<option value="${t.id}"${d.tpl === t.id ? ' selected' : ''}>${esc(t.name)}</option>`).join('')}</select></label>` : ''}
<label class="f span2">Notes internes<textarea name="notes" rows="2">${esc(d.notes)}</textarea></label></div></section>
</div>
<aside class="col-side sticky"><section class="card" aria-live="polite"><h2>Contrôles</h2>${warns.length ? `<ul class="warns">${warns.map(x => `<li class="${x.sev}">${esc(x.t)}</li>`).join('')}</ul>` : '<p class="note ok">Aucun problème détecté.</p>'}</section>${sgHtml}
<section class="card"><div class="btnrow col">
${isNew || d.status === 'brouillon' ? `<button class="btn primary lg" name="do" value="publish">Publier l'intervention</button><button class="btn lg" name="do" value="draft">Enregistrer en brouillon</button>` : `<button class="btn primary lg" name="do" value="save">Enregistrer les modifications</button>`}
${!isNew && d.status !== 'annulée' ? `<button class="btn danger" type="button" data-act="iv-cancel" data-id="${d.id}">Annuler l'intervention</button>` : ''}</div></section></aside></div></form>`;
  }
  CHG.ivlive = () => { collect(); ctx.render(); };
  ACT.suggest = () => { collect(); const d = UI.draft; UI.sugg = L.suggest(ctx.S, d); ctx.render(); };
  ACT['sugg-close'] = () => { collect(); UI.sugg = null; ctx.render(); };
  ACT['sugg-apply'] = () => {
    collect(); const s = UI.sugg, d = UI.draft; if (!s) return;
    d.team = s.team.slice(); d.driverId = s.driver; if (s.transport) d.transport = s.transport;
    if (s.meeting) d.meeting = { place: s.meeting.place, time: s.meeting.time };
    UI.sugg = null; ctx.render(); ctx.toast('Suggestion appliquée : vérifie, modifie si besoin, puis enregistre.');
  };
  FORM.iv = (f, fd, sub) => {
    collect(); const S = ctx.S, d = UI.draft, how = (sub && sub.value) || 'draft';
    const err = []; if (!d.school.trim()) err.push("le nom de l'établissement"); if (!d.commune) err.push('la commune'); if (!d.date) err.push('la date'); if (!d.start || !d.end || d.end <= d.start) err.push('des horaires valides');
    if (err.length) { ctx.toast('Renseigne ' + err.join(', ') + '.'); return; }
    autoDriver(S, d);
    const stamp = ctx.nowIso();
    let iv = d.id ? L.ivById(S, d.id) : null;
    const fields = { school: d.school.trim(), type: d.type, commune: d.commune, address: d.address.trim(), contact: d.contact, date: d.date, start: d.start, end: d.end, required: d.required, team: d.team.slice(), driverId: L.isFleet(d.transport) ? d.driverId : null, transport: d.transport, meeting: d.meeting, notes: d.notes };
    if (!iv) {
      iv = Object.assign({ id: L.uid('iv'), status: 'brouillon', dossier: [], docs: [], log: [] }, fields);
      const tpl = S.templates.find(t => t.id === d.tpl);
      if (tpl) iv.dossier = tpl.items.map(i => ({ id: L.uid('it'), label: i.label, kind: i.kind, note: i.note || '', state: 'a_preparer', prepBy: null, carryBy: null, history: [] }));
      S.interventions.push(iv); iv.log.push({ at: stamp, by: 'claire', text: 'Intervention créée (brouillon).' });
    } else {
      const ch = [];
      if (iv.date !== fields.date || iv.start !== fields.start || iv.end !== fields.end) ch.push('date ou horaires');
      if (iv.team.join() !== fields.team.join()) ch.push('équipe');
      if (iv.transport !== fields.transport || iv.driverId !== fields.driverId) ch.push('transport');
      if ((iv.meeting.place || '') !== (fields.meeting.place || '') || (iv.meeting.time || '') !== (fields.meeting.time || '')) ch.push('rendez-vous');
      Object.assign(iv, fields);
      if (ch.length) { iv.log.push({ at: stamp, by: 'claire', text: 'Modifiée : ' + ch.join(', ') + '.' }); if (iv.status === 'publiée') iv.notify = 'modification'; }
    }
    if (how === 'publish') { iv.status = 'publiée'; iv.notify = 'confirmation'; iv.log.push({ at: stamp, by: 'claire', text: 'Publiée : visible des volontaires.' }); ctx.feed(`Intervention publiée : ${iv.school} (${H.d(iv.date)})`, '#/iv/' + iv.id); }
    ctx.save(); UI.draft = null; UI.sugg = null; UI.draftKey = null;
    UI.flash = how === 'publish' ? (L.isFleet(iv.transport) ? `Intervention publiée. ${iv.transport} réservée${iv.driverId ? ' pour ' + L.vname(S, iv.driverId) : ''}.` : 'Intervention publiée.') : how === 'draft' ? 'Brouillon enregistré.' : 'Modifications enregistrées.';
    ctx.go('#/iv/' + iv.id);
  };

  /* ---------- Fiche d'intervention ---------- */
  V.iv = function (r) {
    const S = ctx.S, n = ctx.now(), iv = L.ivById(S, r.parts[1]);
    if (!iv) return '<div class="card"><h2>Intervention introuvable</h2><a class="btn" href="#/planning">Retour au planning</a></div>';
    if (r.parts[2] === 'edit') return ivForm(r, iv);
    const al = L.alerts(S, n).filter(a => a.href === '#/iv/' + iv.id || a.href2 === '#/iv/' + iv.id || a.href === '#/dossiers/' + iv.id);
    const conflicts = L.isFleet(iv.transport) ? L.vehConflictsFor(S, iv) : [];
    const trips = L.tripsForIv(S, iv.id);
    const mails = S.mails.filter(m => m.ivId === iv.id).sort((a, b) => a.at < b.at ? 1 : -1);
    const ci = L.isFleet(iv.transport) ? L.custodyInfo(S, iv.transport, n) : null;
    const win = L.isFleet(iv.transport) ? L.vehWindow(iv, S) : null;
    const notify = iv.notify && iv.status !== 'brouillon' ? iv.notify : null;
    const un = S.unavail.filter(u => u.ivId === iv.id);
    const needsTrip = ['KM', 'PM', 'perso'].includes(iv.transport) && L.iso(iv.date, iv.start) <= ctx.nowIso();
    const members = iv.team.map(id => { const v = L.vol(S, id); const st = L.volStatus(S, id, iv); return `<li><b>${esc(v.name)}</b> <small>${esc(v.sector)}</small>${id === iv.driverId ? ' ' + H.badge('Conducteur ' + iv.transport, 'info') : ''}${st.ok ? '' : ' ' + st.reasons.map(x => H.badge(x, 'warn')).join(' ')}</li>`; }).join('');
    return `<div class="page-h"><div><p class="crumb"><a href="#/planning">Planning</a> ›</p><h1>${esc(iv.school)}</h1><p class="sub">${TYPE_LAB[iv.type]} · ${esc(iv.commune)} · ${H.dl(iv.date)} · ${iv.start}–${iv.end} ${iv.demo ? ' · ' + H.badge('donnée fictive', 'mute') : ''}</p></div>
<div class="btnrow">${H.ivStateBadge(iv, n)}${iv.status === 'brouillon' ? `<button class="btn primary" data-act="iv-publish" data-id="${iv.id}">Publier</button>` : ''}${iv.status !== 'annulée' ? `<a class="btn" href="#/iv/${iv.id}/edit">Modifier</a>` : ''}${iv.status === 'brouillon' ? `<button class="btn danger" data-act="iv-delete" data-id="${iv.id}">Supprimer</button>` : iv.status !== 'annulée' ? `<button class="btn danger" data-act="iv-cancel" data-id="${iv.id}">Annuler</button>` : ''}</div></div>
${notify ? `<div class="note warn banner">L'établissement n'a pas encore reçu de courriel (${notify}). <button class="btn sm" data-act="mail-prepare" data-id="${iv.id}" data-kind="${notify}">Préparer le courriel de ${notify}</button> <button class="btn sm ghost" data-act="notify-dismiss" data-id="${iv.id}">Ignorer</button></div>` : ''}
${conflicts.length ? `<div class="note bad banner">${iv.transport} est réservée en même temps par ${conflicts.map(c => `<a href="#/iv/${c.id}">« ${esc(c.school)} » (${c.start}–${c.end})</a>`).join(', ')}. Change le véhicule ou les horaires.</div>` : ''}
${al.filter(a => !['Véhicule'].includes(a.kind) || !conflicts.length).length ? `<section class="card"><h2>${H.icon('alert')} Points à traiter sur cette fiche</h2><ul class="alerts">${al.map(a => `<li class="alert sev-${a.sev}"><a class="al-main" href="${a.href === '#/iv/' + iv.id ? '#/iv/' + iv.id + (/Équipe|Conducteur|habilité|Transport|publiée/.test(a.title) ? '/edit' : '') : a.href}"><span class="al-kind">${esc(a.kind)}</span><b>${esc(a.title)}</b><span class="al-d">${esc(a.detail)}</span></a></li>`).join('')}</ul></section>` : ''}
<div class="cols"><div class="col-main">
<section class="card"><div class="card-h"><h2>Équipe ${iv.team.length}/${iv.required}</h2><a class="btn sm" href="#/iv/${iv.id}/edit">Modifier l'équipe</a></div>${members ? `<ul class="plain">${members}</ul>` : '<p class="sub">Aucun volontaire affecté.</p>'}${iv.team.length < iv.required ? `<p class="note warn">Il manque ${iv.required - iv.team.length} volontaire${iv.required - iv.team.length > 1 ? 's' : ''}.</p>` : ''}
${un.length ? `<h3>Signalements des volontaires</h3><ul class="plain">${un.map(u => `<li>${esc(L.vname(S, u.vol))} : indisponible (${esc(u.reason)}) · ${L.fmtIso(u.at, n.date)}</li>`).join('')}</ul>` : ''}</section>
<section class="card"><h2>Transport et rendez-vous</h2><dl class="kv"><div><dt>Transport</dt><dd>${H.transport(iv)}</dd></div><div><dt>Rendez-vous</dt><dd>${iv.meeting && iv.meeting.place ? esc(iv.meeting.place) + (iv.meeting.time ? ' à <b>' + iv.meeting.time + '</b>' : '') : '<span class="neg">À définir</span>'}</dd></div>
${win ? `<div><dt>Réservation ${iv.transport}</dt><dd>${L.hm(win.from)} → ${L.hm(win.to)}</dd></div>` : ''}</dl>
${ci ? `<div class="subcard"><b>${iv.transport} en ce moment</b> : ${ci.pending ? 'À confirmer (' + esc(L.vname(S, ci.pending.from)) + ' → ' + esc(L.vname(S, ci.pending.to)) + ')' : ci.holder ? 'détenue par ' + esc(L.vname(S, ci.holder)) : 'laissée à ' + esc(ci.place)} · <a href="#/vehicules/${iv.transport}">voir la voiture</a></div>` : ''}</section>
<section class="card"><div class="card-h"><h2>Dossier ${H.dossierBadge(iv)}</h2><a class="btn sm" href="#/dossiers/${iv.id}">Ouvrir le dossier</a></div>${(iv.dossier || []).length ? `<ul class="plain">${iv.dossier.map(i => `<li>${H.stageBadge(i.state)} <b>${esc(i.label)}</b> <small>${esc(L.KINDS[i.kind])} · prépare : ${esc(L.vname(S, i.prepBy))} · transporte : ${esc(L.vname(S, i.carryBy))}</small></li>`).join('')}</ul>` : '<p class="sub">Aucun élément.</p>'}</section>
<section class="card"><div class="card-h"><h2>Trajets et kilomètres</h2>${iv.transport && iv.transport !== 'place' && iv.transport !== 'commun' ? `<button class="btn sm" data-act="trip-new" data-iv="${iv.id}">Saisir un trajet</button>` : ''}</div>
${trips.length ? `<ul class="plain">${trips.map(t => { const k = L.tripKm(t), is = L.tripIssues(S, t); return `<li><a href="#/trajet/${t.id}">${esc(L.TRANSPORTS[t.vehicle])} · ${esc(L.vname(S, t.driver))} · ${k.km === null ? 'distance manquante' : H.nf(k.km) + ' km'}</a> ${is.filter(x => x.sev === 'error').length ? H.badge('Incohérent', 'bad') : H.badge('OK', 'ok')}</li>`; }).join('')}</ul>` : `<p class="${needsTrip ? 'note bad' : 'sub'}">${needsTrip ? 'Relevé kilométrique manquant pour cette intervention.' : 'Aucun trajet enregistré.'}</p>`}</section></div>
<aside class="col-side">
<section class="card"><h2>Établissement</h2><dl class="kv one"><div><dt>Adresse</dt><dd>${esc(iv.address || '—')}, ${esc(iv.commune)}</dd></div><div><dt>Contact</dt><dd>${esc(iv.contact.name || '—')}${iv.contact.role ? ' (' + esc(iv.contact.role) + ')' : ''}${iv.contact.tel ? '<br>' + esc(iv.contact.tel) : ''}${iv.contact.email ? '<br>' + esc(iv.contact.email) : ''}</dd></div>${iv.notes ? `<div><dt>Notes internes</dt><dd>${esc(iv.notes)}</dd></div>` : ''}</dl></section>
<section class="card"><div class="card-h"><h2>Courriels</h2></div>
${mails.length ? `<ul class="plain">${mails.map(m => `<li><a href="#/courriels/${m.id}">${esc(m.subject)}</a><div class="sub">${m.box === 'inbox' ? 'Reçu' : m.box === 'draft' ? 'Brouillon' : 'Envoyé'} · ${L.fmtIso(m.at, n.date)}</div></li>`).join('')}</ul>` : '<p class="sub">Aucun échange rattaché.</p>'}
<div class="btnrow col"><button class="btn sm" data-act="mail-prepare" data-id="${iv.id}" data-kind="confirmation">Préparer une confirmation</button><button class="btn sm" data-act="mail-prepare" data-id="${iv.id}" data-kind="modification">Préparer une modification</button><button class="btn sm" data-act="mail-prepare" data-id="${iv.id}" data-kind="annulation">Préparer une annulation</button></div></section>
<section class="card"><h2>Historique</h2>${(iv.log || []).length ? `<ul class="plain log">${iv.log.slice().reverse().map(x => `<li><time>${L.fmtIso(x.at, n.date)}</time> ${esc(x.text)}</li>`).join('')}</ul>` : '<p class="sub">Aucun évènement.</p>'}</section></aside></div>`;
  };
  ACT['iv-publish'] = el => { const S = ctx.S, iv = L.ivById(S, el.dataset.id); iv.status = 'publiée'; iv.notify = 'confirmation'; iv.log.push({ at: ctx.nowIso(), by: 'claire', text: 'Publiée : visible des volontaires.' }); ctx.feed(`Intervention publiée : ${iv.school}`, '#/iv/' + iv.id); ctx.save(); ctx.render(); ctx.toast('Intervention publiée.'); };
  ACT['iv-cancel'] = el => {
    const S = ctx.S, iv = L.ivById(S, el.dataset.id || (UI.draft && UI.draft.id)); if (!iv) return;
    if (!confirm(`Annuler l'intervention « ${iv.school} » ? Les volontaires la verront comme annulée et la réservation du véhicule sera libérée.`)) return;
    iv.status = 'annulée'; iv.notify = 'annulation'; iv.log.push({ at: ctx.nowIso(), by: 'claire', text: 'Intervention annulée.' }); ctx.feed(`Intervention annulée : ${iv.school}`, '#/iv/' + iv.id);
    ctx.save(); UI.draft = null; UI.flash = 'Intervention annulée. Pense à prévenir l\'établissement.'; ctx.go('#/iv/' + iv.id); ctx.render();
  };
  ACT['iv-delete'] = el => { const S = ctx.S; if (!confirm('Supprimer ce brouillon ?')) return; S.interventions = S.interventions.filter(i => i.id !== el.dataset.id); ctx.save(); UI.flash = 'Brouillon supprimé.'; ctx.go('#/planning'); };
  ACT['notify-dismiss'] = el => { L.ivById(ctx.S, el.dataset.id).notify = null; ctx.save(); ctx.render(); };
})();
