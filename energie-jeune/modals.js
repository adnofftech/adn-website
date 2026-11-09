/* Fenêtres et actions partagées : clés de voiture, trajets, indisponibilité. */
(function () {
  'use strict';
  const EJ = window.EJ, L = EJ.L, H = EJ.H, ctx = EJ.ctx, M = EJ.modals, ACT = EJ.ACT, FORM = EJ.FORM, CHG = EJ.CHG;
  const esc = H.esc;
  const me = () => ctx.S.ui.role;
  const places = (S, veh) => {
    const set = new Set([S.vehicles[veh].custody.place, "Local de l'association"]);
    S.vehicles[veh].history.slice(0, 8).forEach(e => e.place && set.add(e.place));
    S.interventions.filter(i => i.transport === veh && i.meeting && i.meeting.place).forEach(i => set.add(i.meeting.place));
    return Array.from(set).filter(Boolean);
  };
  const dl = (id, arr) => `<datalist id="${id}">${arr.map(p => `<option value="${esc(p)}">`).join('')}</datalist>`;

  /* ----- Je récupère le véhicule ----- */
  ACT['veh-take'] = el => ctx.openModal('take', { veh: el.dataset.veh, title: 'Je récupère le véhicule' });
  M.take = d => {
    const S = ctx.S, c = S.vehicles[d.veh].custody, n = ctx.now(), confirming = !!(c.pending && c.pending.to === me());
    return `<h2>${confirming ? `Je confirme avoir reçu les clés de ${d.veh}` : `Je récupère ${d.veh}`}</h2>
<p class="sub">Heure enregistrée : <b>${n.time}</b> (La Réunion)${confirming ? ` · remise par ${esc(L.vname(S, c.pending.from))} à ${esc(c.pending.place)}` : ''}</p>
${d.error ? `<p class="note bad">${esc(d.error)}</p>` : ''}
<form data-form="take"><input type="hidden" name="veh" value="${d.veh}">
<label class="f">Lieu où je récupère la voiture<input name="place" value="${esc(d.place || c.place)}" list="pl-take" required></label>${dl('pl-take', places(S, d.veh))}
<label class="f big">Compteur (km)<input name="odo" type="number" inputmode="numeric" min="0" value="${esc(d.odo || '')}" required autofocus placeholder="${c.odo}"><small>Dernier relevé connu : ${H.nf(c.odo)} km</small></label>
${d.force ? '<label class="chk"><input type="checkbox" name="force" required> Je confirme cette valeur malgré l\'écart (elle sera signalée à Claire)</label>' : ''}
<div class="btnrow"><button class="btn primary lg">${confirming ? 'Je confirme la réception' : 'Je récupère le véhicule'}</button><button type="button" class="btn lg ghost" data-act="close-modal">Annuler</button></div></form>`;
  };
  FORM.take = (f, fd) => {
    const S = ctx.S, veh = fd.get('veh'), n = ctx.now();
    const r = L.actions.take(S, veh, me(), { at: L.iso(n.date, n.time), place: fd.get('place'), odo: fd.get('odo'), force: !!fd.get('force') });
    if (!r.ok) { ctx.modal = { type: 'take', data: { veh, title: 'Je récupère le véhicule', error: r.error, force: !!r.needsForce, place: fd.get('place'), odo: fd.get('odo') } }; ctx.render(); return; }
    const who = L.vname(S, me());
    ctx.feed(r.event.type === 'confirmation' ? `${who} a confirmé la réception des clés de ${veh} (compteur ${H.nf(r.event.odo)}).` : `${who} a récupéré ${veh} (compteur ${H.nf(r.event.odo)}).`, '#/vehicules/' + veh);
    ctx.save(); ctx.modal = null; ctx.render(); ctx.toast(`${veh} : prise enregistrée à ${n.time}.`);
  };

  /* ----- Je remets les clés ----- */
  ACT['veh-hand'] = el => ctx.openModal('hand', { veh: el.dataset.veh, title: 'Je remets les clés' });
  M.hand = d => {
    const S = ctx.S, n = ctx.now(), c = S.vehicles[d.veh].custody, ci = L.custodyInfo(S, d.veh, n);
    const nextId = d.to !== undefined ? d.to : (ci.next && S.vehicles[d.veh].authorized.includes(ci.next.driver) && ci.next.driver !== me() ? ci.next.driver : '');
    const cands = S.vehicles[d.veh].authorized.filter(id => id !== me());
    const defPlace = d.place !== undefined ? d.place : (ci.next && ci.next.iv.meeting && ci.next.iv.meeting.place) || '';
    return `<h2>Je remets les clés de ${d.veh}</h2><p class="sub">Heure enregistrée : <b>${n.time}</b> (La Réunion)${ci.next ? ` · prochain preneur prévu : <b>${esc(L.vname(S, ci.next.driver))}</b> à ${L.hm(ci.next.from)}` : ''}</p>
${d.error ? `<p class="note bad">${esc(d.error)}</p>` : ''}
<form data-form="hand"><input type="hidden" name="veh" value="${d.veh}">
<label class="f">Lieu convenu (où je laisse la voiture / les clés)<input name="place" value="${esc(defPlace)}" list="pl-hand" required placeholder="Ex. Parking du collège"></label>${dl('pl-hand', places(S, d.veh))}
<label class="f big">Compteur (km)<input name="odo" type="number" inputmode="numeric" min="0" required autofocus value="${esc(d.odo || '')}" placeholder="${c.odo}"><small>Dernier relevé connu : ${H.nf(c.odo)} km</small></label>
<label class="f">Je remets les clés à<select name="to"><option value="">Personne : la voiture reste à cet endroit</option>${cands.map(id => `<option value="${id}"${id === nextId ? ' selected' : ''}>${esc(L.vname(S, id))}</option>`).join('')}</select></label>
<p class="sub">Si tu choisis quelqu'un, la remise reste <b>À confirmer</b> jusqu'à ce que cette personne confirme sur son téléphone.</p>
${d.force ? '<label class="chk"><input type="checkbox" name="force" required> Je confirme cette valeur malgré l\'écart (elle sera signalée à Claire)</label>' : ''}
<div class="btnrow"><button class="btn primary lg">Je remets les clés</button><button type="button" class="btn lg ghost" data-act="close-modal">Annuler</button></div></form>`;
  };
  FORM.hand = (f, fd) => {
    const S = ctx.S, veh = fd.get('veh'), n = ctx.now(), to = fd.get('to') || null;
    const r = L.actions.handOver(S, veh, me(), { at: L.iso(n.date, n.time), place: fd.get('place'), odo: fd.get('odo'), to, force: !!fd.get('force') });
    if (!r.ok) { ctx.modal = { type: 'hand', data: { veh, title: 'Je remets les clés', error: r.error, force: !!r.needsForce, place: fd.get('place'), odo: fd.get('odo'), to: to || '' } }; ctx.render(); return; }
    const who = L.vname(S, me());
    ctx.feed(to ? `${who} a remis les clés de ${veh} à ${L.vname(S, to)} (${fd.get('place')}). Confirmation attendue.` : `${who} a laissé ${veh} à « ${fd.get('place')} » (compteur ${H.nf(r.event.odo)}).`, '#/vehicules/' + veh);
    ctx.save(); ctx.modal = null; ctx.render(); ctx.toast(to ? `Remise enregistrée. ${L.vname(S, to)} doit confirmer.` : `${veh} laissée à « ${fd.get('place')} ».`);
  };
  ACT['veh-cancel-pending'] = el => { const S = ctx.S, n = ctx.now(); const r = L.actions.cancelPending(S, el.dataset.veh, me(), L.iso(n.date, n.time)); if (r.ok) { ctx.save(); ctx.render(); ctx.toast('Remise annulée.'); } };

  /* ----- Correction par Claire ----- */
  ACT['veh-correct'] = el => ctx.openModal('correct', { veh: el.dataset.veh, title: 'Corriger la situation' });
  M.correct = d => {
    const S = ctx.S, c = S.vehicles[d.veh].custody;
    return `<h2>Corriger ${d.veh}</h2><p class="sub">La correction est ajoutée à l'historique avec l'état avant/après et ton motif.</p>${d.error ? `<p class="note bad">${esc(d.error)}</p>` : ''}
<form data-form="correct"><input type="hidden" name="veh" value="${d.veh}">
<label class="f">Détenteur réel<select name="holder"><option value="">Personne (voiture laissée)</option>${H.volOpts(c.holder, S.vehicles[d.veh].authorized)}</select></label>
<label class="f">Lieu<input name="place" value="${esc(c.place)}" required></label>
<label class="f">Compteur (km) <small>vide = inchangé (${H.nf(c.odo)})</small><input name="odo" type="number" inputmode="numeric" min="0"></label>
<label class="f">Motif de la correction (obligatoire)<input name="reason" required placeholder="Ex. Clés remises en main propre, oubli de déclaration"></label>
<div class="btnrow"><button class="btn primary">Enregistrer la correction</button><button type="button" class="btn ghost" data-act="close-modal">Annuler</button></div></form>`;
  };
  FORM.correct = (f, fd) => {
    const S = ctx.S, veh = fd.get('veh'), n = ctx.now();
    const r = L.actions.correct(S, veh, { holder: fd.get('holder'), place: fd.get('place'), odo: fd.get('odo'), reason: fd.get('reason'), at: L.iso(n.date, n.time) });
    if (!r.ok) { ctx.modal = { type: 'correct', data: { veh, title: 'Corriger la situation', error: r.error } }; ctx.render(); return; }
    ctx.feed(`Claire a corrigé la situation de ${veh} : ${fd.get('reason')}`, '#/vehicules/' + veh);
    ctx.save(); ctx.modal = null; ctx.render(); ctx.toast('Correction enregistrée dans l\'historique.');
  };

  /* ----- Trajets ----- */
  ACT['trip-new'] = el => ctx.openModal('trip', { ivId: el.dataset.iv || null, title: 'Enregistrer un trajet' });
  ACT['trip-edit'] = el => ctx.openModal('trip', { tripId: el.dataset.id, title: 'Modifier le trajet' });
  const lastPickOdo = (S, veh, vol) => { const e = S.vehicles[veh].history.find(x => (x.type === 'prise' || x.type === 'confirmation') && x.by === vol); return e ? e.odo : ''; };
  M.trip = d => {
    const S = ctx.S, n = ctx.now(), isC = me() === 'claire';
    const t = d.tripId ? S.trips.find(x => x.id === d.tripId) : null;
    const iv = L.ivById(S, d.ivId || (t && t.ivId));
    const veh = d.vehicle || (t ? t.vehicle : (iv && ['KM', 'PM', 'perso'].includes(iv.transport) ? iv.transport : 'KM'));
    const driver = t ? t.driver : (isC ? (iv && iv.driverId) || '' : me());
    const date = t ? t.date : (iv ? iv.date : n.date);
    const purpose = t ? t.purpose : (iv ? 'Intervention : ' + iv.school : '');
    let rows;
    if (t) rows = (t.steps || []).map(s => ({ label: s.label, odo: s.odo == null ? '' : s.odo, ivId: s.ivId || '', on: true }));
    else rows = S.interventions.filter(i => i.date === date && i.status === 'publiée' && (driver ? i.team.includes(driver) : true) && (i.id === (iv && iv.id) || (!iv && i.transport === veh)))
      .sort((a, b) => a.start < b.start ? -1 : 1).map(i => ({ label: `${i.school} (${i.commune})`, odo: '', ivId: i.id, on: true }));
    if (iv && !rows.some(r => r.ivId === iv.id)) rows.unshift({ label: `${iv.school} (${iv.commune})`, odo: '', ivId: iv.id, on: true });
    rows.push({ label: '', odo: '', ivId: '', on: false }, { label: '', odo: '', ivId: '', on: false });
    const odoStart = t ? t.odoStart : (L.isFleet(veh) && driver ? lastPickOdo(S, veh, driver) : '');
    return `<h2>${t ? 'Modifier le trajet' : 'Enregistrer mon trajet'}</h2>${d.error ? `<p class="note bad">${esc(d.error)}</p>` : ''}
<form data-form="trip" data-veh="${veh}"><input type="hidden" name="tripId" value="${t ? t.id : ''}"><input type="hidden" name="ivId" value="${iv ? iv.id : ''}"><input type="hidden" name="nrows" value="${rows.length}">
<fieldset class="f"><legend>Véhicule ou mode de transport</legend><div class="radios">${[['KM', 'Voiture KM'], ['PM', 'Voiture PM'], ['perso', 'Véhicule personnel']].map(([k, tx]) => `<label class="rad"><input type="radio" name="vehicle" value="${k}" data-change="tripveh" ${k === veh ? 'checked' : ''}><span>${tx}</span></label>`).join('')}</div></fieldset>
<div class="grid2">${isC ? `<label class="f">Conducteur<select name="driver" required>${H.volOpts(driver, null, '— choisir —')}</select></label>` : `<input type="hidden" name="driver" value="${esc(driver)}">`}
<label class="f">Date<input type="date" name="date" value="${date}" required></label></div>
<label class="f">Motif du déplacement<input name="purpose" value="${esc(purpose)}" required placeholder="Ex. Intervention au collège"></label>
<fieldset class="f"><legend>Étapes <small>(chaque établissement visité ; le total n'est jamais compté deux fois)</small></legend>
${rows.map((r, i) => `<div class="steprow"><label class="chk"><input type="checkbox" name="son${i}" ${r.on ? 'checked' : ''} aria-label="Étape ${i + 1}"></label><input name="slabel${i}" value="${esc(r.label)}" placeholder="Établissement ou lieu" aria-label="Libellé de l'étape ${i + 1}"><input name="sodo${i}" type="number" inputmode="numeric" value="${esc(r.odo)}" class="odo cnt" placeholder="Compteur" aria-label="Compteur à l'étape ${i + 1}"><input type="hidden" name="siv${i}" value="${esc(r.ivId)}"></div>`).join('')}</fieldset>
<div class="cnt grid2"><label class="f">Compteur de départ (km)<input name="odoStart" type="number" inputmode="numeric" min="0" value="${odoStart == null ? '' : odoStart}" data-calc></label>
<label class="f">Compteur d'arrivée (km)<input name="odoEnd" type="number" inputmode="numeric" min="0" value="${t && t.odoEnd != null ? t.odoEnd : ''}" data-calc></label></div>
<p id="calc" class="calc" aria-live="polite"></p>
<div class="man"><div class="grid2"><label class="f">Distance (km) <small class="cnt">si les compteurs manquent</small><input name="manualKm" type="number" inputmode="decimal" min="0" step="0.1" value="${t && t.manualKm != null ? t.manualKm : ''}" data-calc></label>
<label class="f">Motif de cette saisie<input name="manualReason" value="${esc(t ? t.manualReason : '')}" placeholder="Ex. compteur illisible, estimation du trajet"></label></div></div>
<label class="chk reimbbox"><input type="checkbox" name="reimb" ${t && t.reimb && t.reimb.status !== 'aucun' ? 'checked' : ''}> Je demande le remboursement de ce trajet en véhicule personnel (à valider par Claire)</label>
<div class="btnrow"><button class="btn primary lg">Enregistrer le trajet</button><button type="button" class="btn lg ghost" data-act="close-modal">Annuler</button></div></form>`;
  };
  function calc(f) {
    const out = f.querySelector('#calc'); if (!out) return;
    const a = f.elements.odoStart.value, b = f.elements.odoEnd.value, m = f.elements.manualKm.value, perso = f.dataset.veh === 'perso';
    if (!perso && a !== '' && b !== '') { const k = +b - +a; out.className = 'calc' + (k < 0 ? ' bad' : ''); out.textContent = k < 0 ? `⚠ Arrivée (${b}) inférieure au départ (${a}) : valeur incohérente.` : `Distance calculée : ${k} km`; }
    else if (m !== '') { out.className = 'calc'; out.textContent = `Distance saisie : ${m} km${perso ? '' : ' (sans compteurs)'}`; }
    else { out.className = 'calc'; out.textContent = ''; }
  }
  CHG.tripveh = el => { const f = el.closest('form'); f.dataset.veh = el.value; calc(f); };
  document.addEventListener('input', e => { const f = e.target.closest('form[data-form="trip"]'); if (f) calc(f); });
  document.addEventListener('focusin', e => { const f = e.target.closest && e.target.closest('form[data-form="trip"]'); if (f && !f.dataset.init) { f.dataset.init = 1; calc(f); } });
  FORM.trip = (f, fd) => {
    const S = ctx.S, n = ctx.now(), g = k => (fd.get(k) || '').toString().trim();
    const vehicle = g('vehicle') || 'KM', fleet = L.isFleet(vehicle);
    const steps = [];
    for (let i = 0; i < +g('nrows'); i++) if (fd.get('son' + i) && g('slabel' + i)) steps.push({ label: g('slabel' + i), odo: g('sodo' + i) === '' ? null : +g('sodo' + i), ivId: g('siv' + i) || null });
    const t = { vehicle, driver: g('driver'), date: g('date'), purpose: g('purpose'), steps, odoStart: fleet && g('odoStart') !== '' ? +g('odoStart') : null, odoEnd: fleet && g('odoEnd') !== '' ? +g('odoEnd') : null,
      manualKm: g('manualKm') === '' ? null : +g('manualKm'), manualReason: g('manualReason'), ivId: g('ivId') || (steps.find(s => s.ivId) || {}).ivId || null };
    const cnt = t.odoStart !== null && t.odoEnd !== null;
    const fail = m => { let e = document.querySelector('.modal .tripErr'); if (!e) { e = document.createElement('p'); e.className = 'note bad tripErr'; f.parentNode.insertBefore(e, f); } e.textContent = m; e.scrollIntoView({ block: 'nearest' }); };
    if (!t.driver) return fail('Indique le conducteur.');
    if (!t.purpose) return fail('Indique le motif du déplacement.');
    if (!cnt && t.manualKm === null) return fail(fleet ? 'Renseigne les deux compteurs, ou une distance avec son motif.' : 'Indique la distance parcourue.');
    if (!cnt && !t.manualReason) return fail('Ajoute le motif de la saisie manuelle (ex. compteur illisible, estimation).');
    if (cnt) { t.manualKm = null; t.manualReason = ''; }
    const reimb = vehicle === 'perso' && !!fd.get('reimb');
    let trip = g('tripId') ? S.trips.find(x => x.id === g('tripId')) : null;
    if (trip) { Object.assign(trip, t); if (!reimb) trip.reimb = { status: 'aucun' }; else if (trip.reimb.status === 'aucun') trip.reimb = { status: 'demandée' }; }
    else { trip = Object.assign({ id: L.uid('tr'), reimb: { status: reimb ? 'demandée' : 'aucun' }, createdBy: me() }, t); S.trips.push(trip); }
    if (fleet && trip.odoEnd !== null && S.vehicles[vehicle].custody.holder === trip.driver && trip.odoEnd > S.vehicles[vehicle].custody.odo) S.vehicles[vehicle].custody.odo = trip.odoEnd;
    const k = L.tripKm(trip), iss = L.tripIssues(S, trip).filter(x => x.sev === 'error');
    ctx.feed(`${L.vname(S, trip.driver)} a enregistré un trajet ${L.TRANSPORTS[vehicle]} (${k.km === null ? '?' : H.nf(k.km)} km).`, '#/trajet/' + trip.id);
    ctx.save(); ctx.modal = null; ctx.render();
    ctx.toast(iss.length ? 'Trajet enregistré, mais une valeur est incohérente : Claire sera alertée.' : `Trajet enregistré : ${k.km === null ? '' : H.nf(k.km) + ' km'}.`);
  };

  /* ----- Je ne peux pas venir ----- */
  ACT['iv-decline'] = el => ctx.openModal('decline', { ivId: el.dataset.id, title: 'Je ne peux pas venir' });
  M.decline = d => {
    const S = ctx.S, iv = L.ivById(S, d.ivId);
    return `<h2>Je ne peux pas venir</h2><p class="sub">${esc(iv.school)} · ${H.d(iv.date)} · ${iv.start}–${iv.end}</p><p>Choisis la raison : Claire est prévenue immédiatement.</p>
<div class="bigchoices">${['Malade', 'Imprévu familial', 'Panne ou transport', 'Autre raison'].map(r => `<button class="btn lg block" data-act="decline-go" data-id="${iv.id}" data-reason="${esc(r)}">${esc(r)}</button>`).join('')}</div>
<div class="btnrow"><button class="btn ghost lg" data-act="close-modal">Finalement, je viens</button></div>`;
  };
  ACT['decline-go'] = el => {
    const S = ctx.S, iv = L.ivById(S, el.dataset.id), v = me(), n = ctx.now();
    iv.team = iv.team.filter(x => x !== v); const wasDriver = iv.driverId === v; if (wasDriver) iv.driverId = null;
    S.unavail.push({ id: L.uid('un'), vol: v, date: iv.date, from: iv.start, to: iv.end, reason: el.dataset.reason, ivId: iv.id, at: L.iso(n.date, n.time) });
    iv.log.push({ at: L.iso(n.date, n.time), by: v, text: `${L.vname(S, v)} indisponible (${el.dataset.reason}).` + (wasDriver ? ' Conducteur à remplacer.' : '') });
    ctx.feed(`${L.vname(S, v)} ne peut pas venir : ${iv.school}, ${H.d(iv.date)} (${el.dataset.reason}).`, '#/iv/' + iv.id);
    ctx.save(); ctx.modal = null; ctx.render(); ctx.toast('Claire a été prévenue. Merci !');
  };
})();
