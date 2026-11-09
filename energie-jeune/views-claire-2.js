/* Espace Claire (2/2) : véhicules, kilomètres, dossiers, courriels, guide, réglages. */
(function () {
  'use strict';
  const EJ = window.EJ, L = EJ.L, H = EJ.H, ctx = EJ.ctx, V = EJ.V.claire, ACT = EJ.ACT, FORM = EJ.FORM, CHG = EJ.CHG, UI = EJ.UI;
  const esc = H.esc;
  const EVT = { prise: 'Prise', remise: 'Remise', confirmation: 'Confirmation de réception', correction: 'Correction' };

  /* ---------- Véhicules ---------- */
  V.vehicules = function (r) {
    const S = ctx.S, n = ctx.now();
    if (r.parts[1] === 'KM' || r.parts[1] === 'PM') return vehDetail(S, n, r.parts[1]);
    const t = r.q.t === 'k' ? 'k' : r.q.t === 'aut' ? 'aut' : 'v';
    const tabs = `<div class="seg"><a class="${t === 'v' ? 'on' : ''}" href="#/vehicules">Voitures KM et PM</a><a class="${t === 'k' ? 'on' : ''}" href="#/vehicules?t=k">Trajets et kilomètres</a><a class="${t === 'aut' ? 'on' : ''}" href="#/vehicules?t=aut">Autorisations</a></div>`;
    let body;
    if (t === 'v') body = `<div class="cols two">${EJ.vehCard(S, n, 'KM')}${EJ.vehCard(S, n, 'PM')}</div>${conflictsCard(S)}`;
    else if (t === 'k') body = tripsHtml(S, n, r.q);
    else body = authHtml(S);
    return `<div class="page-h"><div><h1>Véhicules</h1><p class="sub">Qui a le droit de conduire, qui détient réellement la voiture, et combien de kilomètres ont été parcourus</p></div>${tabs}</div>${body}`;
  };
  function conflictsCard(S) {
    const cf = L.vehConflicts(S); if (!cf.length) return '';
    return `<section class="card"><h2>${H.icon('alert')} Voitures réservées deux fois</h2><ul class="alerts">${cf.map(c => `<li class="alert sev-high"><a class="al-main" href="#/iv/${c.a.id}"><span class="al-kind">${c.veh}</span><b>« ${esc(c.a.school)} » ${c.a.start}–${c.a.end}</b><span class="al-d">et « ${esc(c.b.school)} » ${c.b.start}–${c.b.end} · ${H.d(c.a.date)}</span></a><a class="al-2" href="#/iv/${c.b.id}">Autre fiche</a></li>`).join('')}</ul></section>`;
  }
  function vehDetail(S, n, veh) {
    const ci = L.custodyInfo(S, veh, n), res = L.reservations(S, veh).filter(x => x.toIso >= L.iso(n.date, n.time));
    const hist = S.vehicles[veh].history;
    const cf = L.vehConflicts(S).filter(c => c.veh === veh);
    return `<div class="page-h"><div><p class="crumb"><a href="#/vehicules">Véhicules</a> ›</p><h1>${veh} <small>${esc(S.vehicles[veh].model)}</small></h1><p class="sub">${esc(S.vehicles[veh].plate)}</p></div><div class="btnrow"><a class="btn ${veh === 'KM' ? 'on' : ''}" href="#/vehicules/KM">KM</a><a class="btn ${veh === 'PM' ? 'on' : ''}" href="#/vehicules/PM">PM</a><button class="btn primary" data-act="veh-correct" data-veh="${veh}">Corriger la situation</button></div></div>
<div class="cols"><div class="col-main">${EJ.vehCard(S, n, veh)}
<section class="card"><h2>Historique des clés et du compteur <span class="count">${hist.length}</span></h2><div class="tablewrap"><table class="tbl resp"><thead><tr><th>Quand</th><th>Évènement</th><th>Par</th><th>Lieu</th><th>Compteur</th><th>Détail</th></tr></thead><tbody>
${hist.map(e => `<tr class="${e.anomaly ? 'anom' : ''}"><td data-l="Quand">${L.fmtIso(e.at, n.date)}</td><td data-l="Évènement"><b>${EVT[e.type]}</b></td><td data-l="Par">${esc(L.vname(S, e.by))}</td><td data-l="Lieu">${esc(e.place || '—')}</td><td data-l="Compteur">${e.odo != null ? H.nf(e.odo) + ' km' : '—'}</td>
<td data-l="Détail">${e.type === 'remise' ? (e.to ? 'à ' + esc(L.vname(S, e.to)) : 'laissée sur place') : e.type === 'confirmation' ? 'de ' + esc(L.vname(S, e.from)) : ''}${e.type === 'correction' && e.before ? `avant : ${esc(e.before.holder ? L.vname(S, e.before.holder) : 'personne')}, ${esc(e.before.place)}, ${H.nf(e.before.odo)} km<br>après : ${esc(e.after.holder ? L.vname(S, e.after.holder) : 'personne')}, ${esc(e.after.place)}, ${H.nf(e.after.odo)} km<br><i>Motif : ${esc(e.reason)}</i>` : e.type === 'correction' ? esc(e.note || '') + ' <i>' + esc(e.reason || '') + '</i>' : ''}${e.anomaly ? '<br>' + H.badge('Écart : ' + (e.note || ''), 'bad') : ''}</td></tr>`).join('')}
</tbody></table></div></section></div>
<aside class="col-side"><section class="card"><h2>Réservations à venir</h2>${res.length ? `<ul class="plain">${res.map(x => `<li><a href="#/iv/${x.iv.id}"><b>${H.d(x.date)} ${L.hm(x.from)}–${L.hm(x.to)}</b></a><div class="sub">${esc(x.iv.school)} · ${x.driver ? esc(L.vname(S, x.driver)) : '<span class="neg">conducteur à désigner</span>'}${x.iv.status === 'brouillon' ? ' · brouillon' : ''}${cf.some(c => c.a.id === x.iv.id || c.b.id === x.iv.id) ? ' ' + H.badge('Double réservation', 'bad') : ''}</div></li>`).join('')}</ul><p class="sub">Une réservation future ne change jamais le détenteur actuel : seules les prises et remises de clés le modifient.</p>` : '<p class="sub">Aucune réservation à venir.</p>'}</section>
<section class="card"><h2>Habilités à conduire ${veh}</h2><p>${S.vehicles[veh].authorized.map(id => H.badge(L.vname(S, id), 'info')).join(' ')}</p><a class="btn sm" href="#/vehicules?t=aut">Gérer les autorisations</a></section></aside></div>`;
  }
  function authHtml(S) {
    return `<section class="card"><h2>Qui est autorisé à conduire ?</h2><p class="sub">L'autorisation (ce tableau) est distincte de la détention réelle (qui a les clés maintenant). Seuls les volontaires habilités voient les boutons « Je récupère le véhicule » et « Je remets les clés ».</p>
<div class="tablewrap"><table class="tbl resp"><thead><tr><th>Volontaire</th><th>KM</th><th>PM</th></tr></thead><tbody>${S.volunteers.map(v => `<tr><td data-l="Volontaire"><b>${esc(v.name)}</b> <small>${esc(v.sector)}</small></td>${L.VEHICLES.map(k => `<td data-l="${k}"><label class="slot big"><input type="checkbox" data-change="auth" data-vol="${v.id}" data-veh="${k}" ${S.vehicles[k].authorized.includes(v.id) ? 'checked' : ''} aria-label="${esc(v.name)} autorisé(e) ${k}"><span>${k}</span></label></td>`).join('')}</tr>`).join('')}</tbody></table></div></section>`;
  }
  CHG.auth = el => {
    const S = ctx.S, A = S.vehicles[el.dataset.veh].authorized, id = el.dataset.vol;
    if (el.checked) { if (!A.includes(id)) A.push(id); }
    else {
      S.vehicles[el.dataset.veh].authorized = A.filter(x => x !== id);
      const fut = S.interventions.filter(i => i.status !== 'annulée' && i.date >= ctx.now().date && i.transport === el.dataset.veh && i.driverId === id);
      if (fut.length) ctx.toast(`Attention : ${L.vname(S, id)} reste conducteur de ${fut.length} réservation(s) ${el.dataset.veh} à venir.`);
    }
    ctx.save(); if (!el.checked) ctx.render(); else ctx.toast('Autorisation enregistrée.');
  };

  /* ---------- Trajets et kilomètres ---------- */
  function tripFilter(S, n, q) { return { from: q.from !== undefined ? q.from : L.addDays(n.date, -30), to: q.to !== undefined ? q.to : n.date, vehicle: q.veh || 'all', vol: q.vol || 'all' }; }
  function tripsHtml(S, n, q) {
    const f = tripFilter(S, n, q), trips = L.tripsFiltered(S, f), tot = L.tripTotals(S, trips);
    const perso = trips.filter(t => t.vehicle === 'perso'), rate = S.settings.ratePerKm;
    const asked = perso.filter(t => t.reimb.status === 'demandée').length, valid = perso.filter(t => t.reimb.status === 'validée');
    const amount = rate > 0 ? valid.reduce((s, t) => s + (L.reimb(S, t).amount || 0), 0) : null;
    const probs = trips.filter(t => L.tripIssues(S, t).some(i => i.sev === 'error')).length;
    return `<section class="card"><form class="filters" data-form="tripfilter">
<label class="f">Du<input type="date" name="from" value="${f.from}"></label><label class="f">Au<input type="date" name="to" value="${f.to}"></label>
<label class="f">Véhicule<select name="veh">${H.opts([['all', 'Tous'], ['KM', 'KM'], ['PM', 'PM'], ['perso', 'Véhicules personnels']], f.vehicle)}</select></label>
<label class="f">Volontaire<select name="vol"><option value="all">Tous</option>${H.volOpts(f.vol)}</select></label>
<div class="btnrow"><button class="btn">Filtrer</button><button type="button" class="btn primary" data-act="export-csv" data-from="${f.from}" data-to="${f.to}" data-veh="${f.vehicle}" data-vol="${f.vol}">Exporter en CSV</button><button type="button" class="btn" data-act="trip-new">+ Saisir un trajet</button></div></form></section>
<div class="cols two">
<section class="card"><h2>Véhicules de fonction</h2><p class="sub">Suivi des kilomètres de KM et PM (compteurs)</p><div class="stats"><div><b>${H.nf(tot.KM)}</b><span>km · KM</span></div><div><b>${H.nf(tot.PM)}</b><span>km · PM</span></div><div class="${probs ? 'bad' : ''}"><b>${probs}</b><span>trajet${probs > 1 ? 's' : ''} à contrôler</span></div></div></section>
<section class="card"><h2>Véhicules personnels</h2><p class="sub">Distance déclarée · le remboursement est suivi à part</p><div class="stats"><div><b>${H.nf(tot.perso)}</b><span>km déclarés</span></div><div><b>${asked}</b><span>demande${asked > 1 ? 's' : ''} à valider</span></div><div><b>${amount === null ? '—' : amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</b><span>${amount === null ? 'aucun tarif défini' : 'validé sur la période'}</span></div></div>
<form data-form="rate" class="inl-form"><label class="f inl">Tarif au kilomètre (€) <input name="rate" type="number" step="0.001" min="0" value="${rate == null ? '' : rate}" placeholder="aucun"></label><button class="btn sm">Enregistrer</button></form><p class="sub">Sans tarif ni validation, seule la distance est affichée.</p></section></div>
<section class="card"><h2>Trajets <span class="count">${trips.length}</span></h2>${trips.length ? `<div class="tablewrap"><table class="tbl resp"><thead><tr><th>Date</th><th>Véhicule</th><th>Conducteur</th><th>Motif et étapes</th><th>Compteurs</th><th>Distance</th><th>Contrôle</th><th>Remboursement</th></tr></thead><tbody>${trips.map(t => tripRow(S, n, t)).join('')}</tbody></table></div>` : '<p class="sub pad">Aucun trajet sur cette période.</p>'}</section>`;
  }
  function tripRow(S, n, t) {
    const k = L.tripKm(t), iss = L.tripIssues(S, t), err = iss.filter(i => i.sev === 'error'), w = iss.filter(i => i.sev === 'warn'), r = L.reimb(S, t);
    return `<tr class="${err.length ? 'anom' : ''}"><td data-l="Date"><a href="#/trajet/${t.id}">${H.d(t.date)}</a></td><td data-l="Véhicule"><b>${esc(L.isFleet(t.vehicle) ? t.vehicle : L.TRANSPORTS[t.vehicle])}</b></td><td data-l="Conducteur">${esc(L.vname(S, t.driver))}</td>
<td data-l="Motif et étapes">${esc(t.purpose)}${(t.steps || []).length > 1 ? `<div class="sub">${t.steps.length} étapes : ${t.steps.map(s => esc(s.label)).join(' › ')}</div>` : ''}</td>
<td data-l="Compteurs">${t.odoStart != null || t.odoEnd != null ? `${H.nf(t.odoStart)} → ${H.nf(t.odoEnd)}` : '—'}</td>
<td data-l="Distance"><b>${k.km === null ? 'manquante' : H.nf(k.km) + ' km'}</b>${k.source === 'saisie' ? '<div class="sub">saisie manuelle</div>' : ''}</td>
<td data-l="Contrôle">${err.length ? err.map(e => H.badge(e.text, 'bad')).join('<br>') : H.badge('OK', 'ok')}${w.map(e => '<br>' + H.badge(e.text, 'warn')).join('')}</td>
<td data-l="Remboursement">${t.vehicle === 'perso' ? `${H.badge(L.REIMB_LABELS[r.status], { aucun: 'mute', 'demandée': 'warn', 'validée': 'ok', 'refusée': 'bad' }[r.status])}${r.amount !== null ? `<div><b>${r.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</b></div>` : ''}${r.status === 'demandée' ? `<div class="btnrow"><button class="btn sm" data-act="reimb" data-id="${t.id}" data-s="validée">Valider</button><button class="btn sm ghost" data-act="reimb" data-id="${t.id}" data-s="refusée">Refuser</button></div>` : ''}` : '<span class="sub">Sans objet</span>'}</td></tr>`;
  }
  FORM.tripfilter = (f, fd) => ctx.go('#/vehicules' + ctx.qs({ t: 'k', from: fd.get('from'), to: fd.get('to'), veh: fd.get('veh') === 'all' ? '' : fd.get('veh'), vol: fd.get('vol') === 'all' ? '' : fd.get('vol') }));
  FORM.rate = (f, fd) => { const v = fd.get('rate'); ctx.S.settings.ratePerKm = v === '' ? null : Math.max(0, +v); ctx.save(); ctx.render(); ctx.toast(v === '' ? 'Aucun tarif : seule la distance est affichée.' : 'Tarif enregistré.'); };
  ACT.reimb = el => { const t = ctx.S.trips.find(x => x.id === el.dataset.id); t.reimb.status = el.dataset.s; ctx.save(); ctx.render(); ctx.toast('Remboursement ' + el.dataset.s + '.'); };
  ACT['export-csv'] = el => {
    const S = ctx.S, f = { from: el.dataset.from, to: el.dataset.to, vehicle: el.dataset.veh, vol: el.dataset.vol };
    const csv = '﻿' + L.csv(S, f), blob = new Blob([csv], { type: 'text/csv;charset=utf-8' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `kilometres_${f.from || 'debut'}_${f.to || 'fin'}${f.vehicle !== 'all' ? '_' + f.vehicle : ''}${f.vol !== 'all' ? '_' + f.vol : ''}.csv`;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    ctx.toast(`Export CSV : ${L.tripsFiltered(S, f).length} trajet(s).`);
  };
  V.trajet = function (r) {
    const S = ctx.S, t = S.trips.find(x => x.id === r.parts[1]);
    if (!t) return '<div class="card"><h2>Trajet introuvable</h2><a class="btn" href="#/vehicules?t=k">Retour</a></div>';
    const k = L.tripKm(t), iss = L.tripIssues(S, t), legs = L.tripLegs(t), iv = L.ivById(S, t.ivId);
    return `<div class="page-h"><div><p class="crumb"><a href="#/vehicules?t=k">Trajets et kilomètres</a> ›</p><h1>Trajet du ${H.dl(t.date)}</h1><p class="sub">${esc(L.TRANSPORTS[t.vehicle])} · ${esc(L.vname(S, t.driver))}${t.demo ? ' · ' + H.badge('donnée fictive', 'mute') : ''}</p></div><div class="btnrow"><button class="btn primary" data-act="trip-edit" data-id="${t.id}">Corriger</button><button class="btn danger" data-act="trip-del" data-id="${t.id}">Supprimer</button></div></div>
${iss.length ? `<section class="card"><h2>${H.icon('alert')} Contrôles</h2><ul class="warns">${iss.map(i => `<li class="${i.sev === 'error' ? 'bad' : 'warn'}">${esc(i.text)}</li>`).join('')}</ul></section>` : '<p class="note ok banner">Aucune incohérence détectée.</p>'}
<section class="card"><dl class="kv"><div><dt>Motif</dt><dd>${esc(t.purpose)}</dd></div><div><dt>Distance</dt><dd><b>${k.km === null ? 'manquante' : H.nf(k.km) + ' km'}</b> <span class="sub">(${k.source === 'compteurs' ? 'calculée à partir des compteurs' : k.source === 'saisie' ? 'saisie manuelle : ' + esc(t.manualReason) : '—'})</span></dd></div>
<div><dt>Compteurs</dt><dd>${t.odoStart != null ? H.nf(t.odoStart) : '—'} → ${t.odoEnd != null ? H.nf(t.odoEnd) : '—'}</dd></div>${iv ? `<div><dt>Intervention</dt><dd><a href="#/iv/${iv.id}">${esc(iv.school)}</a></dd></div>` : ''}</dl></section>
<section class="card"><h2>Étapes</h2>${(t.steps || []).length ? `<ol class="steps">${t.steps.map((s, i) => `<li>${esc(s.label)}${s.odo != null ? ` <span class="sub">compteur ${H.nf(s.odo)}</span>` : ''}${legs[i] != null ? ` <span class="badge mute">+${legs[i]} km</span>` : ''}</li>`).join('')}</ol><p class="sub">Les tronçons sont indicatifs : le total n'est calculé qu'une fois, entre le compteur de départ et celui d'arrivée.</p>` : '<p class="sub">Aucune étape.</p>'}</section>`;
  };
  ACT['trip-del'] = el => { if (!confirm('Supprimer ce trajet ?')) return; const S = ctx.S; S.trips = S.trips.filter(t => t.id !== el.dataset.id); ctx.save(); ctx.go('#/vehicules?t=k'); ctx.toast('Trajet supprimé.'); };

  /* ---------- Dossiers ---------- */
  V.dossiers = function (r) {
    const S = ctx.S, n = ctx.now();
    if (r.parts[1]) return dossierEditor(S, n, L.ivById(S, r.parts[1]));
    const list = S.interventions.filter(i => i.status !== 'annulée' && L.daysBetween(n.date, i.date) >= -7).sort((a, b) => (a.date + a.start) < (b.date + b.start) ? -1 : 1);
    return `<div class="page-h"><div><h1>Dossiers</h1><p class="sub">Fiches, supports à imprimer et documents à remettre pour chaque intervention</p></div></div>
<section class="card"><h2>Dossiers par intervention</h2><div class="tablewrap"><table class="tbl resp"><thead><tr><th>Intervention</th><th>État</th><th>Éléments</th><th>À régler</th></tr></thead><tbody>${list.map(i => { const is = L.dossierIssues(i); return `<tr><td data-l="Intervention"><a href="#/dossiers/${i.id}"><b>${esc(i.school)}</b></a><div class="sub">${H.d(i.date)} · ${i.start}–${i.end}${i.status === 'brouillon' ? ' · brouillon' : ''}</div></td><td data-l="État">${H.dossierBadge(i)}</td><td data-l="Éléments">${(i.dossier || []).length}</td><td data-l="À régler">${is.length ? `<span class="neg">${esc(is[0])}${is.length > 1 ? ` (+${is.length - 1})` : ''}</span>` : '<span class="ok-t">Rien</span>'}</td></tr>`; }).join('')}</tbody></table></div></section>
<section class="card"><h2>Modèles de dossier réutilisables</h2><ul class="plain">${S.templates.map(t => `<li><b>${esc(t.name)}</b> <small>${t.items.map(i => esc(i.label)).join(' · ')}</small> <button class="btn sm ghost" data-act="tpl-del" data-id="${t.id}">Supprimer</button></li>`).join('')}</ul><p class="sub">Pour créer un modèle, ouvre un dossier puis « Enregistrer comme modèle ».</p></section>`;
  };
  function dossierEditor(S, n, iv) {
    if (!iv) return '<div class="card"><h2>Dossier introuvable</h2><a class="btn" href="#/dossiers">Retour</a></div>';
    const is = L.dossierIssues(iv), rowsHtml = (iv.dossier || []).map(it => `<tr><td data-l="Élément"><input value="${esc(it.label)}" data-change="itf" data-iv="${iv.id}" data-it="${it.id}" data-f="label" aria-label="Libellé"></td>
<td data-l="Type"><select data-change="itf" data-iv="${iv.id}" data-it="${it.id}" data-f="kind" aria-label="Type">${H.opts(Object.entries(L.KINDS), it.kind)}</select></td>
<td data-l="Prépare"><select data-change="itf" data-iv="${iv.id}" data-it="${it.id}" data-f="prepBy" aria-label="Préparation">${H.volOpts(it.prepBy, null, '— à attribuer —')}</select></td>
<td data-l="Transporte"><select data-change="itf" data-iv="${iv.id}" data-it="${it.id}" data-f="carryBy" aria-label="Transport">${H.volOpts(it.carryBy, null, '— à attribuer —')}</select></td>
<td data-l="État"><select data-change="itf" data-iv="${iv.id}" data-it="${it.id}" data-f="state" aria-label="État">${H.opts(L.STAGES.map(s => [s, L.STAGE_LABELS[s]]), it.state)}</select></td>
<td data-l="Consigne"><input value="${esc(it.note)}" data-change="itf" data-iv="${iv.id}" data-it="${it.id}" data-f="note" aria-label="Consigne"></td><td><button class="btn sm ghost" data-act="it-del" data-iv="${iv.id}" data-it="${it.id}" aria-label="Supprimer">✕</button></td></tr>`).join('');
    return `<div class="page-h"><div><p class="crumb"><a href="#/dossiers">Dossiers</a> ›</p><h1>Dossier : ${esc(iv.school)}</h1><p class="sub">${H.dl(iv.date)} · ${iv.start}–${iv.end} · ${H.dossierBadge(iv)}</p></div><a class="btn" href="#/iv/${iv.id}">Fiche de l'intervention</a></div>
${is.length ? `<section class="card"><h2>${H.icon('alert')} À régler</h2><ul class="warns">${is.map(x => `<li class="warn">${esc(x)}</li>`).join('')}</ul></section>` : ''}
<section class="card"><h2>Checklist</h2>${(iv.dossier || []).length ? `<div class="tablewrap"><table class="tbl resp edit"><thead><tr><th>Élément</th><th>Type</th><th>Prépare</th><th>Transporte</th><th>État</th><th>Consigne</th><th></th></tr></thead><tbody>${rowsHtml}</tbody></table></div>` : '<p class="sub pad">Dossier vide : ajoute un élément ou applique un modèle.</p>'}</section>
<div class="cols two"><section class="card"><h2>Ajouter un élément</h2><form data-form="additem" data-iv="${iv.id}"><label class="f">Libellé<input name="label" required placeholder="Ex. Fiche d'animation, flyers, attestation…"></label>
<div class="grid2"><label class="f">Type<select name="kind">${H.opts(Object.entries(L.KINDS), 'fiche')}</select></label><label class="f">Consigne<input name="note" placeholder="Ex. à faire signer"></label>
<label class="f">Préparation<select name="prepBy">${H.volOpts('', null, '— à attribuer —')}</select></label><label class="f">Transport<select name="carryBy">${H.volOpts('', null, '— à attribuer —')}</select></label></div><button class="btn primary">Ajouter</button></form></section>
<section class="card"><h2>Modèles</h2><form data-form="applytpl" data-iv="${iv.id}" class="inl-form"><label class="f inl">Appliquer un modèle<select name="tpl">${S.templates.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select></label><button class="btn">Ajouter les éléments</button></form>
<form data-form="savetpl" data-iv="${iv.id}" class="inl-form"><label class="f inl">Enregistrer ce dossier comme modèle<input name="name" required placeholder="Nom du modèle"></label><button class="btn">Enregistrer</button></form></section></div>
<section class="card"><h2>Documents joints <span class="badge mute">démo : noms seulement</span></h2><ul class="plain">${(iv.docs || []).map(d => `<li>📄 ${esc(d.name)} ${d.private ? H.badge('privé', 'info') : ''}</li>`).join('') || '<li class="sub">Aucun document.</li>'}</ul><p class="sub">Version déployée : pièces jointes stockées en espace privé, accessibles uniquement aux volontaires affectés via des liens temporaires.</p></section>`;
  }
  CHG.itf = el => {
    const iv = L.ivById(ctx.S, el.dataset.iv), it = iv.dossier.find(x => x.id === el.dataset.it), f = el.dataset.f; let v = el.value;
    if (f === 'prepBy' || f === 'carryBy') v = v || null;
    if (f === 'state' && v !== it.state) it.history.push({ state: v, by: 'claire', at: ctx.nowIso() });
    it[f] = v; ctx.save(); ctx.render(); ctx.toast('Dossier mis à jour.');
  };
  ACT['it-del'] = el => { const iv = L.ivById(ctx.S, el.dataset.iv); iv.dossier = iv.dossier.filter(x => x.id !== el.dataset.it); ctx.save(); ctx.render(); };
  FORM.additem = (f, fd) => { const iv = L.ivById(ctx.S, f.dataset.iv); iv.dossier = iv.dossier || []; iv.dossier.push({ id: L.uid('it'), label: fd.get('label').trim(), kind: fd.get('kind'), note: fd.get('note'), state: 'a_preparer', prepBy: fd.get('prepBy') || null, carryBy: fd.get('carryBy') || null, history: [] }); ctx.save(); ctx.render(); ctx.toast('Élément ajouté.'); };
  FORM.applytpl = (f, fd) => { const S = ctx.S, iv = L.ivById(S, f.dataset.iv), t = S.templates.find(x => x.id === fd.get('tpl')); t.items.forEach(i => iv.dossier.push({ id: L.uid('it'), label: i.label, kind: i.kind, note: i.note || '', state: 'a_preparer', prepBy: null, carryBy: null, history: [] })); ctx.save(); ctx.render(); ctx.toast('Modèle appliqué.'); };
  FORM.savetpl = (f, fd) => { const S = ctx.S, iv = L.ivById(S, f.dataset.iv); S.templates.push({ id: L.uid('tpl'), name: fd.get('name').trim(), items: iv.dossier.map(i => ({ label: i.label, kind: i.kind, note: i.note })) }); ctx.save(); ctx.render(); ctx.toast('Modèle enregistré : réutilisable pour les prochaines interventions.'); };
  ACT['tpl-del'] = el => { const S = ctx.S; S.templates = S.templates.filter(t => t.id !== el.dataset.id); ctx.save(); ctx.render(); };

  /* ---------- Courriels ---------- */
  const MBOX = 'claire@energie-jeune.exemple.invalid';
  function guessIv(S, m) {
    const dom = ((m.from.match(/@([^>\s]+)/) || [])[1] || '').toLowerCase();
    return S.interventions.find(i => i.contact && i.contact.email && dom && i.contact.email.toLowerCase().endsWith('@' + dom)) || null;
  }
  V.courriels = function (r) {
    const S = ctx.S, n = ctx.now(), f = r.q.f || 'tous', sq = (r.q.s || '').toLowerCase(), ivf = r.q.iv || '';
    let list = S.mails.slice().sort((a, b) => a.at < b.at ? 1 : -1);
    if (f === 'orphelins') list = list.filter(m => m.box === 'inbox' && !m.ivId);
    if (f === 'brouillons') list = list.filter(m => m.box === 'draft');
    if (f === 'envoyes') list = list.filter(m => m.box === 'sent');
    if (ivf) list = list.filter(m => m.ivId === ivf);
    if (sq) list = list.filter(m => (m.subject + m.from + m.to + m.body).toLowerCase().includes(sq));
    const sel = r.parts[1] ? S.mails.find(m => m.id === r.parts[1]) : null;
    const chips = [['tous', 'Tous'], ['orphelins', 'Non rattachés'], ['brouillons', 'Brouillons'], ['envoyes', 'Envoyés']].map(([k, t]) => `<a class="pill ${f === k ? 'on' : ''}" href="#/courriels${ctx.qs({ f: k === 'tous' ? '' : k, iv: ivf, s: r.q.s })}">${t}</a>`).join('');
    const ivs = S.interventions.filter(i => S.mails.some(m => m.ivId === i.id));
    const rowsH = list.map(m => { const iv = L.ivById(S, m.ivId); return `<li><a class="mrow ${sel && sel.id === m.id ? 'on' : ''} ${m.box}" href="#/courriels/${m.id}${ctx.qs({ f: f === 'tous' ? '' : f, iv: ivf, s: r.q.s })}"><b>${esc(m.subject)}</b><span>${esc(m.box === 'inbox' ? m.from.replace(/<.*>/, '') : (m.box === 'draft' ? 'Brouillon · ' : 'Envoyé · ') + 'à ' + m.to.split('@')[0])}</span><small>${L.fmtIso(m.at, n.date)}${iv ? ' · ' + esc(iv.school) : m.box === 'inbox' ? ' · <b class="neg">non rattaché</b>' : ''}</small></a></li>`; }).join('');
    return `<div class="page-h"><div><h1>Courriels</h1><p class="sub">Échanges logistiques liés aux interventions · boîte <b>fictive</b> de démonstration</p></div><button class="btn primary" data-act="mail-new">+ Nouveau message</button></div>
<div class="note info banner">${H.icon('key')} <span><b>Version connectée :</b> Claire autorise l'application à accéder à la boîte professionnelle (autorisation OAuth, révocable) et <b>chaque envoi est validé par Claire</b> avant de partir. Ici, rien n'est réellement envoyé. Ne saisis aucun nom ni donnée d'élève dans les messages.</span></div>
<div class="mailgrid ${sel ? 'has-sel' : ''}"><section class="card mlist"><form data-form="mailsearch" class="search"><input type="search" name="s" value="${esc(r.q.s || '')}" placeholder="Rechercher un message" aria-label="Rechercher"><select name="iv" aria-label="Filtrer par intervention"><option value="">Toutes les interventions</option>${ivs.map(i => `<option value="${i.id}"${ivf === i.id ? ' selected' : ''}>${esc(i.school)} (${H.d(i.date)})</option>`).join('')}</select><button class="btn sm">OK</button></form><div class="pills">${chips}</div><ul class="plain mails">${rowsH || '<li class="sub pad">Aucun message.</li>'}</ul></section>
<section class="card mread">${sel ? mailPane(S, n, sel) : '<p class="sub pad">Choisis un message pour le lire, le rattacher à une intervention ou préparer une réponse.</p>'}</section></div>`;
  };
  function mailPane(S, n, m) {
    const iv = L.ivById(S, m.ivId), g = !iv && m.box === 'inbox' ? guessIv(S, m) : null;
    const ivOpts = S.interventions.filter(i => i.status !== 'annulée' || i.id === m.ivId).sort((a, b) => a.date < b.date ? 1 : -1).map(i => `<option value="${i.id}"${i.id === m.ivId ? ' selected' : ''}>${esc(i.school)} · ${H.d(i.date)}</option>`).join('');
    if (m.box === 'draft') return `<div class="card-h"><h2>Brouillon à valider</h2>${H.badge('À valider avant envoi', 'warn')}</div>
<form data-form="mailsend" data-id="${m.id}"><label class="f">À<input name="to" value="${esc(m.to)}" type="email" required></label><label class="f">Objet<input name="subject" value="${esc(m.subject)}" required></label><label class="f">Message<textarea name="body" rows="12">${esc(m.body)}</textarea></label>
<label class="f">Intervention concernée<select name="ivId"><option value="">— aucune —</option>${ivOpts}</select></label>
<p class="sub">Contrôle le contenu : aucune donnée d'élève ne doit figurer dans ce message. Dans la démo, « Valider et envoyer » classe le message dans les envoyés sans rien transmettre.</p>
<div class="btnrow"><button class="btn primary lg" name="do" value="send">Valider et envoyer (démo)</button><button class="btn" name="do" value="save">Enregistrer le brouillon</button><button type="button" class="btn danger" data-act="mail-del" data-id="${m.id}">Supprimer</button></div></form>`;
    return `<div class="card-h"><h2>${esc(m.subject)}</h2>${m.box === 'sent' ? H.badge('Envoyé (démo)', 'ok') : ''}</div><dl class="kv one"><div><dt>De</dt><dd>${esc(m.from)}</dd></div><div><dt>À</dt><dd>${esc(m.to)}</dd></div><div><dt>Date</dt><dd>${L.fmtIso(m.at, n.date)}</dd></div></dl>
<pre class="mbody">${esc(m.body)}</pre>
<div class="subcard"><h3>Intervention rattachée</h3>${iv ? `<p><a href="#/iv/${iv.id}"><b>${esc(iv.school)}</b></a> · ${H.d(iv.date)} ${iv.start}–${iv.end}</p>` : '<p class="neg">Ce message n\'est rattaché à aucune intervention.</p>'}
${g ? `<p class="note info">Suggestion d'après l'adresse de l'expéditeur : <b>${esc(g.school)}</b> (${H.d(g.date)}) <button class="btn sm" data-act="mail-attach-quick" data-id="${m.id}" data-iv="${g.id}">Rattacher</button></p>` : ''}
<form data-form="mailattach" data-id="${m.id}" class="inl-form"><label class="f inl">Rattacher à<select name="ivId"><option value="">— aucune —</option>${ivOpts}</select></label><button class="btn sm">Enregistrer</button></form></div>
${m.box === 'inbox' ? `<div class="subcard"><h3>Préparer une réponse</h3>${iv ? `<div class="btnrow"><button class="btn" data-act="mail-prepare" data-id="${iv.id}" data-kind="confirmation">Confirmation</button><button class="btn" data-act="mail-prepare" data-id="${iv.id}" data-kind="modification">Modification</button><button class="btn" data-act="mail-prepare" data-id="${iv.id}" data-kind="annulation">Annulation</button></div><p class="sub">Un brouillon est créé : rien ne part sans ta validation.</p>` : '<p class="sub">Rattache d\'abord le message à une intervention.</p>'}</div>` : ''}`;
  }
  FORM.mailsearch = (f, fd) => { const r = ctx.route(); ctx.go('#/courriels' + ctx.qs({ f: r.q.f, s: fd.get('s'), iv: fd.get('iv') })); };
  FORM.mailattach = (f, fd) => { const m = ctx.S.mails.find(x => x.id === f.dataset.id); m.ivId = fd.get('ivId') || null; ctx.save(); ctx.render(); ctx.toast(m.ivId ? 'Message rattaché à la fiche.' : 'Message détaché.'); };
  ACT['mail-attach-quick'] = el => { const m = ctx.S.mails.find(x => x.id === el.dataset.id); m.ivId = el.dataset.iv; ctx.save(); ctx.render(); ctx.toast('Message rattaché à la fiche.'); };
  ACT['mail-prepare'] = el => {
    const S = ctx.S, iv = L.ivById(S, el.dataset.id), kind = el.dataset.kind, b = L.buildMail(S, kind, iv);
    const m = { id: L.uid('ml'), box: 'draft', from: MBOX, to: (iv.contact && iv.contact.email) || '', subject: b.subject, body: b.body, at: ctx.nowIso(), ivId: iv.id, status: 'brouillon' };
    S.mails.push(m); if (iv.notify === kind) iv.notify = null; ctx.save(); UI.flash = `Brouillon de ${kind} prêt : relis-le puis valide l'envoi.`; ctx.go('#/courriels/' + m.id);
  };
  ACT['mail-new'] = () => { const S = ctx.S, m = { id: L.uid('ml'), box: 'draft', from: MBOX, to: '', subject: '', body: 'Bonjour,\n\n\n\nCordialement,\nClaire\nÉnergie Jeune', at: ctx.nowIso(), ivId: null, status: 'brouillon' }; S.mails.push(m); ctx.save(); ctx.go('#/courriels/' + m.id); };
  ACT['mail-del'] = el => { const S = ctx.S; if (!confirm('Supprimer ce brouillon ?')) return; S.mails = S.mails.filter(m => m.id !== el.dataset.id); ctx.save(); ctx.go('#/courriels'); };
  FORM.mailsend = (f, fd, sub) => {
    const S = ctx.S, m = S.mails.find(x => x.id === f.dataset.id);
    m.to = fd.get('to'); m.subject = fd.get('subject'); m.body = fd.get('body'); m.ivId = fd.get('ivId') || null;
    if (sub && sub.value === 'send') {
      if (!m.to || !m.subject) { ctx.toast('Renseigne le destinataire et l\'objet.'); return; }
      m.box = 'sent'; m.status = 'envoyé (démo)'; m.at = ctx.nowIso(); const iv = L.ivById(S, m.ivId);
      if (iv) iv.log.push({ at: m.at, by: 'claire', text: `Courriel validé et envoyé (démo) : ${m.subject}` });
      ctx.feed(`Courriel validé (démo) : ${m.subject}`, '#/courriels/' + m.id); ctx.save(); UI.flash = 'Message validé et classé dans les envoyés (démo : rien n\'a été transmis).'; ctx.go('#/courriels/' + m.id);
    } else { ctx.save(); ctx.toast('Brouillon enregistré.'); }
  };

  /* ---------- Réglages ---------- */
  V.reglages = function () {
    const S = ctx.S;
    return `<div class="page-h"><div><h1>Réglages et état de la démo</h1></div></div>
<div class="cols two"><section class="card"><h2>Paramètres</h2><form data-form="settings"><label class="f">Commune du local de l'association<select name="base">${H.opts(L.COMMUNES, S.settings.baseCommune)}</select></label>
<label class="f">Tampon de retour après intervention (minutes)<input name="buf" type="number" min="0" max="180" value="${S.settings.returnBuffer}"></label><label class="f">Distance journalière jugée inhabituelle (km)<input name="max" type="number" min="50" value="${S.settings.maxKmDay}"></label><label class="f">Tarif au kilomètre pour véhicule personnel (€, vide = aucun)<input name="rate" type="number" step="0.001" min="0" value="${S.settings.ratePerKm == null ? '' : S.settings.ratePerKm}"></label><button class="btn primary">Enregistrer</button></form></section>
<section class="card"><h2>Démo</h2><p>Horloge actuelle : <b>${ctx.now().time}</b> le ${H.d(ctx.now().date)} (Indian/Reunion).</p><div class="btnrow"><button class="btn" data-act="open-clock">Régler l'horloge</button><button class="btn danger" data-act="reset-demo">Réinitialiser les données de démo</button></div><p class="sub">Les données sont enregistrées dans ce navigateur seulement : elles ne sont pas partagées entre appareils.</p></section></div>
<section class="card"><h2>Ce qui est opérationnel et ce qui reste à connecter</h2>${statusTable()}</section>`;
  };
  FORM.settings = (f, fd) => { const s = ctx.S.settings; s.baseCommune = fd.get('base'); s.returnBuffer = +fd.get('buf') || 0; s.maxKmDay = +fd.get('max') || 400; s.ratePerKm = fd.get('rate') === '' ? null : +fd.get('rate'); ctx.save(); ctx.render(); ctx.toast('Réglages enregistrés.'); };
  function statusTable() {
    const ok = ['Vues Aujourd\'hui (jour et semaine), alertes cliquables, jours sans intervention', 'Planning : création, brouillon, publication, modification, annulation', 'Suggestion d\'équipe et de rendez-vous expliquée, modifiable', 'Détection des chevauchements, doubles réservations, indisponibilités', 'Clés KM/PM : prise, remise, confirmation, correction avec historique', 'Trajets : compteurs, distance, incohérences, étapes, saisie avec motif', 'Remboursement véhicule personnel séparé, tarif optionnel', 'Export CSV par période, véhicule, volontaire', 'Dossiers : checklist, modèles, états À préparer → Remis', 'Courriels : boîte fictive, rattachement, brouillons à valider', 'Espaces Claire et volontaire (mobile), fuseau Indian/Reunion'];
    const todo = ['Comptes individuels (connexion e-mail/mot de passe ou lien magique)', 'Droits vérifiés côté serveur (aujourd\'hui : simple sélecteur d\'espace)', 'Base de données commune (aujourd\'hui : un navigateur = ses propres données)', 'Pièces jointes privées (stockage chiffré, liens temporaires)', 'Boîte professionnelle réelle : autorisation OAuth de Claire, lecture ciblée, envoi après validation', 'Notifications (push/SMS/e-mail) aux volontaires', 'Déploiement HTTPS, sauvegardes, journal d\'audit, conformité RGPD'];
    return `<div class="cols two"><div><h3 class="ok-t">Opérationnel dans la démo</h3><ul class="plain tick">${ok.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div><div><h3 class="neg">Demande connexion ou déploiement</h3><ul class="plain cross">${todo.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div></div>`;
  }

  /* ---------- Parcours de démo ---------- */
  V.guide = function () {
    const S = ctx.S;
    const step = (n, who, title, text, link) => `<li class="gstep"><span class="gn">${n}</span><div><b>${who}</b> · ${title}<p class="sub">${text}</p>${link || ''}</div></li>`;
    const sw = (id, label, hash) => `<button class="btn sm" data-act="guide-go" data-role="${id}" data-hash="${hash}">${label}</button>`;
    return `<div class="page-h"><div><h1>Parcours de démonstration</h1><p class="sub">Scénario de bout en bout, jouable en une dizaine de minutes. L'horloge est fixée à 09:30 : tu peux la régler en haut à droite.</p></div></div>
<section class="card"><ol class="gsteps">
${step(1, 'Claire', 'planifie une intervention', "Planning › Nouvelle intervention. Renseigne l'établissement, la commune, la date (aujourd'hui) et un créneau l'après-midi, par exemple 16:30–18:00, 2 volontaires. Clique « Suggérer équipe et rendez-vous », lis les explications, applique, modifie si besoin.", sw('claire', 'Ouvrir le formulaire', '#/planning/new'))}
${step(2, 'Claire', 'affecte l\'équipe et réserve KM', "Choisis le transport « Voiture KM » : le conducteur habilité est proposé et la réservation s'affiche. Si KM est déjà prise, un avertissement apparaît. Clique « Publier l'intervention ».", '')}
${step(3, 'Adrien', 'remet les clés au volontaire suivant', "Adrien détient KM depuis ce matin. Sur son téléphone : « Je remets les clés », lieu convenu, compteur, destinataire (le prochain conducteur). La remise passe à « À confirmer ».", sw('adrien', 'Jouer Adrien', '#/vehicules'))}
${step(4, 'Le volontaire suivant', 'confirme qu\'il a récupéré les clés', "Dans l'espace du destinataire : « Je confirme la réception » avec le compteur. Le détenteur actuel change, la réservation future non.", sw('cheryl', 'Jouer Cheryl', '#/vehicules'))}
${step(5, 'Le conducteur', 'enregistre son trajet', "« Enregistrer mon trajet » : étapes pré-remplies, compteur de départ, compteur d'arrivée → distance calculée, incohérences signalées.", sw('cheryl', 'Trajet de Cheryl', '#/aujourdhui'))}
${step(6, 'Le conducteur', 'remet le dossier à l\'établissement', "Onglet Dossiers : marquer « Emporté » puis « Remis » le document à remettre.", sw('cheryl', 'Dossiers de Cheryl', '#/dossiers'))}
${step(7, 'Le conducteur', 'transmet la voiture', "« Je remets les clés » au volontaire de l'intervention suivante, avec le lieu convenu ; ce dernier confirme.", '')}
${step(8, 'Claire', 'vérifie le statut et exporte les kilomètres', "Aujourd'hui : cartes KM et PM (détenteur, lieu, suivant, À confirmer), alertes. Véhicules › Trajets et kilomètres › Exporter en CSV.", sw('claire', "Retour côté Claire", '#/vehicules?t=k'))}
</ol></section>
<section class="card"><h2>Problèmes déjà présents dans les données fictives</h2><ul class="plain"><li>Lycée Les Tamarins : équipe incomplète et dossier incomplet</li><li>KM réservée deux fois demain (Hortensias / Jacarandas)</li><li>PM : Manon a remis les clés à Ethan, non confirmé</li><li>Collège Les Manguiers : relevé kilométrique manquant · trajet KM incohérent (arrivée &lt; départ)</li><li>Jour sans intervention dans la semaine · jour férié</li></ul>
<div class="btnrow"><a class="btn primary" href="#/aujourdhui">Voir l'écran Aujourd'hui</a><a class="btn" href="#/reglages">État de la démo</a><button class="btn danger" data-act="reset-demo">Réinitialiser</button></div></section>`;
  };
  ACT['guide-go'] = el => { ctx.S.ui.role = el.dataset.role; ctx.save(); ctx.go(el.dataset.hash); ctx.render(); };
  EJ.statusTable = statusTable;
})();
