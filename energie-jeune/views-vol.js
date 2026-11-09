/* Espace volontaire (mobile d'abord). */
(function () {
  'use strict';
  const EJ = window.EJ, L = EJ.L, H = EJ.H, ctx = EJ.ctx, V = EJ.V.vol, ACT = EJ.ACT, FORM = EJ.FORM, CHG = EJ.CHG;
  const esc = H.esc;
  const me = () => ctx.S.ui.role;
  const TYPE_LAB = { école: 'École', collège: 'Collège', lycée: 'Lycée', autre: 'Établissement' };

  function vehState(S, n, veh) {
    const ci = L.custodyInfo(S, veh, n), auth = S.vehicles[veh].authorized.includes(me()), m = me();
    const confirming = !!(ci.pending && ci.pending.to === m);
    const st = { ci, auth, confirming, take: false, hand: false, why: '' };
    if (!auth) st.why = `Tu n'es pas habilité(e) à conduire ${veh}. Demande à Claire.`;
    else if (confirming) st.take = true;
    else if (ci.holder === m && ci.pending) st.why = `Remise à ${L.vname(S, ci.pending.to)} en attente de sa confirmation.`;
    else if (ci.holder === m) st.hand = true;
    else if (!ci.holder) st.take = true;
    else st.why = `${veh} est détenue par ${L.vname(S, ci.holder)}. Elle doit te remettre les clés.`;
    return st;
  }
  function vehCardVol(S, n, veh) {
    const s = vehState(S, n, veh), ci = s.ci, nm = id => esc(L.vname(S, id));
    let who;
    if (ci.pending) who = `<b class="neg">À confirmer</b> · ${nm(ci.pending.from)} → ${nm(ci.pending.to)}`;
    else if (ci.holder) who = `<b>${ci.holder === me() ? 'Toi' : nm(ci.holder)}</b> depuis ${L.fmtIso(ci.since, n.date)}`;
    else who = `<b>Personne</b> · clés laissées${ci.leftBy ? ' par ' + nm(ci.leftBy) : ''}`;
    return `<article class="card vcard ${ci.status === 'a_confirmer' ? 'veh-warn' : ''}"><div class="card-h"><h3>${H.icon('car')} ${veh}</h3>${ci.status === 'a_confirmer' ? H.badge('À confirmer', 'bad') : s.auth ? H.badge('Tu peux conduire', 'ok') : H.badge('Non habilité·e', 'mute')}</div>
<dl class="kv one"><div><dt>Détenteur actuel</dt><dd>${who}</dd></div><div><dt>Où est la voiture</dt><dd>${ci.holder && !ci.pending ? 'Avec ' + (ci.holder === me() ? 'toi' : nm(ci.holder)) : esc(ci.place)}</dd></div>
<div><dt>La récupère ensuite</dt><dd>${ci.next ? `<b>${ci.next.driver === me() ? 'Toi' : nm(ci.next.driver)}</b> · ${ci.next.date === n.date ? '' : H.d(ci.next.date) + ' '}${L.hm(ci.next.from)}` : '<span class="sub">personne de prévu</span>'}</dd></div></dl>
<div class="btnrow col"><button class="btn primary lg" data-act="veh-take" data-veh="${veh}" ${s.take ? '' : 'disabled'}>${s.confirming ? 'Je confirme la réception des clés' : 'Je récupère le véhicule'}</button>
<button class="btn lg" data-act="veh-hand" data-veh="${veh}" ${s.hand ? '' : 'disabled'}>Je remets les clés</button>
${ci.pending && ci.pending.from === me() ? `<button class="btn ghost" data-act="veh-cancel-pending" data-veh="${veh}">Annuler ma remise</button>` : ''}</div>
${s.why ? `<p class="sub why">${esc(s.why)}</p>` : ''}</article>`;
  }

  function ivCard(iv, n, o) {
    const S = ctx.S, st = L.ivState(iv, n); o = o || {};
    const mine = iv.driverId === me();
    return `<a class="card ivcard ${iv.status === 'annulée' ? 'cancelled' : ''}" href="#/iv/${iv.id}"><div class="ivc-t"><b>${iv.start}–${iv.end}</b>${iv.status === 'annulée' ? H.badge('Annulée', 'bad') : H.badge(st === 'en cours' ? 'En cours' : st === 'terminée' ? 'Terminée' : 'À venir', st === 'en cours' ? 'info2' : st === 'terminée' ? 'mute' : 'info')}</div>
<h3>${esc(iv.school)}</h3><p class="sub">${TYPE_LAB[iv.type]} · ${esc(iv.commune)}${o.date ? ' · ' + H.d(iv.date) : ''}</p>
<p class="sub">${iv.meeting && iv.meeting.place ? 'RDV ' + (iv.meeting.time || '') + ' · ' + esc(iv.meeting.place) : 'RDV à confirmer'}</p>
<p>${mine ? H.badge('Tu conduis ' + iv.transport, 'info') : iv.transport ? H.badge(L.isFleet(iv.transport) ? iv.transport : L.TRANSPORTS[iv.transport], 'mute') : ''}</p></a>`;
  }
  const myIvs = (S, filter) => S.interventions.filter(i => i.team.includes(me()) && i.status !== 'brouillon' && filter(i)).sort((a, b) => (a.date + a.start) < (b.date + b.start) ? -1 : 1);

  /* ---------- Aujourd'hui ---------- */
  V.aujourdhui = function () {
    const S = ctx.S, n = ctx.now(), m = me(), v = L.vol(S, m), nowIso = L.iso(n.date, n.time);
    const next = L.nextIvFor(S, m, n), upcoming = myIvs(S, i => i.status === 'publiée' && L.iso(i.date, i.end) >= nowIso).filter(i => !next || i.id !== next.id).slice(0, 3);
    let hero;
    if (!next) hero = `<section class="card hero"><h2>Ma prochaine intervention</h2><p class="big">Aucune intervention à venir.</p><p class="sub">Tu peux indiquer tes disponibilités dans « Moi ».</p></section>`;
    else {
      const st = L.ivState(next, n), diff = L.minutesBetween(nowIso, L.iso(next.date, next.start));
      const when = st === 'en cours' ? 'En cours' : next.date === n.date ? `Aujourd'hui · dans ${diff >= 60 ? Math.floor(diff / 60) + ' h ' + (diff % 60 ? diff % 60 + ' min' : '') : diff + ' min'}` : H.dl(next.date);
      hero = `<section class="card hero"><h2>Ma prochaine intervention</h2><p class="when">${when}</p><h3><a href="#/iv/${next.id}">${esc(next.school)}</a></h3><p class="big">${next.start}–${next.end} · ${esc(next.commune)}</p>
<dl class="kv one"><div><dt>Rendez-vous</dt><dd>${next.meeting && next.meeting.place ? `<b>${next.meeting.time || ''}</b> · ${esc(next.meeting.place)}` : 'À confirmer par Claire'}</dd></div><div><dt>Équipe</dt><dd>${next.team.map(id => esc(L.vname(S, id)) + (id === next.driverId ? ' (conducteur)' : '')).join(', ')}</dd></div><div><dt>Transport</dt><dd>${next.transport ? esc(L.TRANSPORTS[next.transport]) : 'À confirmer'}${next.driverId === m ? ' · <b>tu conduis</b>' : ''}</dd></div>
${next.contact && next.contact.tel ? `<div><dt>Contact sur place</dt><dd>${esc(next.contact.name)} · <a href="tel:${esc(next.contact.tel.replace(/\s/g, ''))}">${esc(next.contact.tel)}</a></dd></div>` : ''}</dl>
<a class="btn lg block" href="#/iv/${next.id}">Voir la fiche et les consignes</a></section>`;
    }
    /* actions utiles */
    const acts = [];
    L.VEHICLES.forEach(veh => {
      const s = vehState(S, n, veh); if (!s.auth) return;
      if (s.hand) acts.push(`<button class="btn primary lg block" data-act="veh-hand" data-veh="${veh}">${H.icon('key')} Je remets les clés ${veh}</button>`);
      else if (s.confirming) acts.push(`<button class="btn primary lg block" data-act="veh-take" data-veh="${veh}">${H.icon('key')} Je confirme avoir reçu ${veh}</button>`);
      else if (s.take && s.ci.next && s.ci.next.driver === m) acts.push(`<button class="btn primary lg block" data-act="veh-take" data-veh="${veh}">${H.icon('key')} Je récupère ${veh}</button>`);
    });
    const needTrip = myIvs(S, i => i.status === 'publiée' && ['KM', 'PM', 'perso'].includes(i.transport) && (i.transport === 'perso' || i.driverId === m) && L.iso(i.date, i.start) <= nowIso && L.daysBetween(i.date, n.date) <= 3 && !L.tripsForIv(S, i.id).some(t => t.driver === m));
    if (needTrip.length) acts.push(`<button class="btn lg block ${acts.length ? '' : 'primary'}" data-act="trip-new" data-iv="${needTrip[0].id}">Enregistrer mon trajet <small>${esc(needTrip[0].school)}</small></button>`);
    if (!needTrip.length && L.VEHICLES.some(k => S.vehicles[k].authorized.includes(m))) acts.push(`<button class="btn lg block" data-act="trip-new">Enregistrer un trajet</button>`);
    const items = [];
    myIvs(S, i => i.status === 'publiée' && L.daysBetween(n.date, i.date) >= -1 && L.daysBetween(n.date, i.date) <= 1).forEach(iv => (iv.dossier || []).forEach(it => { const nx = L.canAdvance(S, iv, it, m); if (nx) items.push({ iv, it, nx }); }));
    items.slice(0, 4).forEach(({ iv, it, nx }) => acts.push(`<button class="btn lg block" data-act="it-adv" data-iv="${iv.id}" data-it="${it.id}">${nx === 'remis' ? 'Remettre le dossier' : nx === 'emporte' ? 'J\'ai emporté' : 'C\'est prêt'} : ${esc(it.label)} <small>${esc(iv.school)}</small></button>`));
    if (next && L.iso(next.date, next.end) > nowIso) acts.push(`<button class="btn lg block danger-o" data-act="iv-decline" data-id="${next.id}">Je ne peux pas venir <small>${esc(next.school)}</small></button>`);
    const pend = S.unavail.filter(u => u.vol === m && u.date >= n.date).length;
    return `<div class="page-h v"><div><h1>Bonjour ${esc(v.name)}</h1><p class="sub">${H.dl(n.date)} · ${n.time}</p></div></div>${hero}
<section class="card"><h2>Actions utiles du jour</h2>${acts.length ? `<div class="bigacts">${acts.join('')}</div>` : '<p class="sub">Rien à faire pour le moment.</p>'}${pend ? `<p class="sub">${pend} indisponibilité(s) déclarée(s) à venir.</p>` : ''}</section>
<section><h2 class="sec">Voitures</h2><div class="stack">${L.VEHICLES.filter(k => S.vehicles[k].authorized.includes(m) || true).map(k => vehCardVol(S, n, k)).join('')}</div></section>
${upcoming.length ? `<section><h2 class="sec">Ensuite</h2><div class="stack">${upcoming.map(i => ivCard(i, n, { date: true })).join('')}</div></section>` : ''}`;
  };

  /* ---------- Planning ---------- */
  V.planning = function () {
    const S = ctx.S, n = ctx.now(), nowIso = L.iso(n.date, n.time);
    const up = myIvs(S, i => L.iso(i.date, i.end) >= nowIso), past = myIvs(S, i => L.iso(i.date, i.end) < nowIso && L.daysBetween(i.date, n.date) <= 7).reverse();
    let last = '';
    return `<div class="page-h v"><div><h1>Mon planning</h1><p class="sub">${up.length} intervention${up.length > 1 ? 's' : ''} à venir</p></div></div>
${up.length ? `<div class="stack">${up.map(i => { const h = i.date !== last ? `<h2 class="sec day">${H.dl(i.date)}${L.holiday(i.date) ? ' · ' + esc(L.holiday(i.date)) : ''}</h2>` : ''; last = i.date; return h + ivCard(i, n); }).join('')}</div>` : '<div class="card"><p class="sub">Aucune intervention à venir. Pense à indiquer tes disponibilités dans « Moi ».</p></div>'}
${past.length ? `<h2 class="sec">Passées (7 jours)</h2><div class="stack">${past.map(i => ivCard(i, n, { date: true })).join('')}</div>` : ''}`;
  };

  /* ---------- Fiche d'intervention (volontaire) ---------- */
  V.iv = function (r) {
    const S = ctx.S, n = ctx.now(), iv = L.ivById(S, r.parts[1]), m = me();
    if (!iv || iv.status === 'brouillon' || !iv.team.includes(m)) return `<div class="card"><h2>Intervention non disponible</h2><p class="sub">Cette intervention n'existe pas, n'est pas publiée, ou tu n'y es plus affecté(e).</p><a class="btn lg" href="#/planning">Mon planning</a></div>`;
    const ended = L.iso(iv.date, iv.end) <= L.iso(n.date, n.time), started = L.iso(iv.date, iv.start) <= L.iso(n.date, n.time);
    const veh = L.isFleet(iv.transport) ? iv.transport : null;
    const items = (iv.dossier || []).map(it => {
      const nx = L.canAdvance(S, iv, it, m), mineP = it.prepBy === m, mineC = it.carryBy === m;
      return `<li class="doc ${mineP || mineC ? 'mine' : ''}"><div>${H.stageBadge(it.state)} <b>${esc(it.label)}</b> <small>${esc(L.KINDS[it.kind])}</small>${it.note ? `<div class="sub">${esc(it.note)}</div>` : ''}<div class="sub">Prépare : ${esc(L.vname(S, it.prepBy))}${mineP ? ' (toi)' : ''} · Transporte : ${esc(L.vname(S, it.carryBy))}${mineC ? ' (toi)' : ''}</div></div>
${nx ? `<button class="btn lg" data-act="it-adv" data-iv="${iv.id}" data-it="${it.id}">${nx === 'remis' ? 'Remis à l\'établissement' : nx === 'emporte' ? 'Emporté' : 'Prêt'}</button>` : ''}</li>`;
    }).join('');
    return `<div class="page-h v"><div><p class="crumb"><a href="#/planning">Planning</a> ›</p><h1>${esc(iv.school)}</h1><p class="sub">${TYPE_LAB[iv.type]} · ${esc(iv.commune)}</p></div>${iv.status === 'annulée' ? H.badge('Annulée', 'bad') : H.ivStateBadge(iv, n)}</div>
${iv.status === 'annulée' ? '<div class="note bad banner">Cette intervention est annulée. Rien à faire.</div>' : ''}
<section class="card hero"><p class="when">${H.dl(iv.date)}</p><p class="big">${iv.start}–${iv.end}</p><dl class="kv one"><div><dt>Rendez-vous</dt><dd>${iv.meeting && iv.meeting.place ? `<b>${iv.meeting.time || ''}</b> · ${esc(iv.meeting.place)}` : 'À confirmer par Claire'}</dd></div><div><dt>Adresse</dt><dd>${esc(iv.address || '—')}, ${esc(iv.commune)}</dd></div>
<div><dt>Équipe</dt><dd>${iv.team.map(id => esc(L.vname(S, id)) + (id === iv.driverId ? ' (conducteur)' : '')).join(', ')}</dd></div><div><dt>Transport</dt><dd>${iv.transport ? esc(L.TRANSPORTS[iv.transport]) : 'À confirmer'}</dd></div>
${iv.contact && iv.contact.name ? `<div><dt>Contact sur place</dt><dd>${esc(iv.contact.name)}${iv.contact.role ? ' (' + esc(iv.contact.role) + ')' : ''}${iv.contact.tel ? ' · <a href="tel:' + esc(iv.contact.tel.replace(/\s/g, '')) + '">' + esc(iv.contact.tel) + '</a>' : ''}</dd></div>` : ''}</dl></section>
${iv.status !== 'annulée' ? `<section class="card"><h2>Actions</h2><div class="bigacts">
${veh && S.vehicles[veh].authorized.includes(m) ? (() => { const s = vehState(S, n, veh); return (s.take ? `<button class="btn primary lg block" data-act="veh-take" data-veh="${veh}">${s.confirming ? 'Je confirme la réception de ' + veh : 'Je récupère ' + veh}</button>` : '') + (s.hand ? `<button class="btn lg block" data-act="veh-hand" data-veh="${veh}">Je remets les clés ${veh}</button>` : ''); })() : ''}
${started && ['KM', 'PM', 'perso'].includes(iv.transport) ? `<button class="btn lg block" data-act="trip-new" data-iv="${iv.id}">Enregistrer mon trajet</button>` : ''}
${!ended ? `<button class="btn lg block danger-o" data-act="iv-decline" data-id="${iv.id}">Je ne peux pas venir</button>` : ''}</div></section>` : ''}
<section class="card"><h2>Consignes et documents</h2>${items ? `<ul class="docs">${items}</ul>` : '<p class="sub">Pas de dossier pour cette intervention.</p>'}
${(iv.docs || []).length ? `<h3>Pièces à consulter</h3><ul class="plain">${iv.docs.map(d => `<li>📄 ${esc(d.name)} ${H.badge('privé', 'info')}</li>`).join('')}</ul><p class="sub">Démo : noms de fichiers seulement. En version déployée, ouverture par lien privé temporaire.</p>` : ''}</section>`;
  };
  ACT['it-adv'] = el => {
    const S = ctx.S, iv = L.ivById(S, el.dataset.iv), it = iv.dossier.find(x => x.id === el.dataset.it), nx = L.canAdvance(S, iv, it, me());
    if (!nx) { ctx.toast('Action non autorisée pour toi.'); return; }
    it.state = nx; it.history.push({ state: nx, by: me(), at: ctx.nowIso() });
    ctx.feed(`${L.vname(S, me())} : « ${it.label} » → ${L.STAGE_LABELS[nx]} (${iv.school}).`, '#/dossiers/' + iv.id);
    ctx.save(); ctx.render(); ctx.toast(`« ${it.label} » : ${L.STAGE_LABELS[nx]}.`);
  };

  /* ---------- Véhicules ---------- */
  V.vehicules = function () {
    const S = ctx.S, n = ctx.now();
    return `<div class="page-h v"><div><h1>Véhicules</h1><p class="sub">KM et PM · deux actions seulement</p></div></div><div class="stack">${L.VEHICLES.map(k => vehCardVol(S, n, k)).join('')}</div>
<p class="sub pad">Seule Claire peut corriger un écart ; chaque correction est conservée dans l'historique.</p>`;
  };

  /* ---------- Dossiers ---------- */
  V.dossiers = function () {
    const S = ctx.S, n = ctx.now(), m = me();
    const ivs = myIvs(S, i => i.status === 'publiée' && L.daysBetween(n.date, i.date) >= -3 && (i.dossier || []).length);
    return `<div class="page-h v"><div><h1>Mes dossiers</h1><p class="sub">Consignes, supports et documents à remettre</p></div></div>
${ivs.length ? ivs.map(iv => `<section class="card"><div class="card-h"><h3><a href="#/iv/${iv.id}">${esc(iv.school)}</a></h3><span class="sub">${H.d(iv.date)} · ${iv.start}</span></div><ul class="docs">${iv.dossier.map(it => { const nx = L.canAdvance(S, iv, it, m); return `<li class="doc ${it.prepBy === m || it.carryBy === m ? 'mine' : ''}"><div>${H.stageBadge(it.state)} <b>${esc(it.label)}</b>${it.note ? `<div class="sub">${esc(it.note)}</div>` : ''}<div class="sub">${it.prepBy === m ? 'Tu prépares · ' : ''}${it.carryBy === m ? 'Tu transportes' : 'Transport : ' + esc(L.vname(S, it.carryBy))}</div></div>${nx ? `<button class="btn lg" data-act="it-adv" data-iv="${iv.id}" data-it="${it.id}">${nx === 'remis' ? 'Remis' : nx === 'emporte' ? 'Emporté' : 'Prêt'}</button>` : ''}</li>`; }).join('')}</ul></section>`).join('') : '<div class="card"><p class="sub">Aucun dossier pour tes prochaines interventions.</p></div>'}`;
  };

  /* ---------- Moi : secteur, disponibilités, indisponibilités ---------- */
  V.moi = function () {
    const S = ctx.S, n = ctx.now(), m = me(), v = L.vol(S, m), dn = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'];
    const un = S.unavail.filter(u => u.vol === m && u.date >= n.date).sort((a, b) => a.date < b.date ? -1 : 1);
    return `<div class="page-h v"><div><h1>${esc(v.name)}</h1><p class="sub">Mon secteur, mes disponibilités, mes absences</p></div></div>
<section class="card"><h2>Ma commune ou mon secteur de départ</h2><label class="f"><select data-change="mysector" aria-label="Commune de départ">${H.opts(L.COMMUNES, v.sector)}</select></label><p class="sub">Seule la commune est utilisée pour proposer un rendez-vous : pas d'adresse personnelle.</p></section>
<section class="card"><h2>Mes disponibilités habituelles</h2><div class="avweek">${[1, 2, 3, 4, 5].map(d => `<div class="avday"><b>${dn[d - 1]}</b>${['am', 'pm'].map(s => `<label class="slot big"><input type="checkbox" data-change="myavail" data-d="${d}" data-s="${s}" ${v.avail[d] && v.avail[d][s] ? 'checked' : ''}><span>${s === 'am' ? 'Matin' : 'Après-midi'}</span></label>`).join('')}</div>`).join('')}</div></section>
<section class="card"><h2>Signaler une indisponibilité</h2><form data-form="unavail"><label class="f">Jour<input type="date" name="date" min="${n.date}" value="${L.workday(n.date, 1)}" required></label>
<label class="f">Quand<select name="slot"><option value="day">Toute la journée</option><option value="am">Le matin</option><option value="pm">L'après-midi</option></select></label>
<label class="f">Raison<select name="reason">${H.opts(['Malade', 'Imprévu familial', 'Examen ou formation', 'Congé', 'Autre raison'])}</select></label><button class="btn primary lg block">Signaler</button></form>
${un.length ? `<h3>Mes indisponibilités à venir</h3><ul class="plain">${un.map(u => `<li>${H.d(u.date)} ${u.from}–${u.to} · ${esc(u.reason)} <button class="btn sm ghost" data-act="unavail-del" data-id="${u.id}">Retirer</button></li>`).join('')}</ul>` : ''}</section>
<section class="card"><h2>Mes droits de conduite</h2><p>${L.VEHICLES.map(k => S.vehicles[k].authorized.includes(m) ? H.badge('Habilité·e ' + k, 'ok') : H.badge('Non habilité·e ' + k, 'mute')).join(' ')}</p><p class="sub">Ces droits sont gérés par Claire.</p></section>`;
  };
  CHG.mysector = el => { L.vol(ctx.S, me()).sector = el.value; ctx.save(); ctx.toast('Secteur enregistré.'); };
  CHG.myavail = el => { const v = L.vol(ctx.S, me()), d = +el.dataset.d; v.avail[d] = v.avail[d] || { am: 0, pm: 0 }; v.avail[d][el.dataset.s] = el.checked ? 1 : 0; ctx.save(); ctx.toast('Disponibilités enregistrées.'); };
  FORM.unavail = (f, fd) => {
    const S = ctx.S, m = me(), n = ctx.now(), slot = fd.get('slot'), from = slot === 'pm' ? '12:30' : '07:00', to = slot === 'am' ? '12:30' : '18:00', date = fd.get('date');
    const hit = S.interventions.filter(i => i.status !== 'annulée' && i.date === date && i.team.includes(m) && L.overlap({ from: L.min(from), to: L.min(to) }, { from: L.min(i.start), to: L.min(i.end) }));
    if (hit.length && !confirm(`Tu es affecté(e) à : ${hit.map(i => i.school + ' (' + i.start + ')').join(', ')}. Te retirer de ${hit.length > 1 ? 'ces interventions' : 'cette intervention'} ?`)) return;
    S.unavail.push({ id: L.uid('un'), vol: m, date, from, to, reason: fd.get('reason'), ivId: hit[0] ? hit[0].id : null, at: L.iso(n.date, n.time) });
    hit.forEach(i => { i.team = i.team.filter(x => x !== m); if (i.driverId === m) i.driverId = null; i.log.push({ at: L.iso(n.date, n.time), by: m, text: `${L.vname(S, m)} indisponible (${fd.get('reason')}).` }); ctx.feed(`${L.vname(S, m)} est indisponible : ${i.school}, ${H.d(i.date)} (${fd.get('reason')}).`, '#/iv/' + i.id); });
    if (!hit.length) ctx.feed(`${L.vname(S, m)} a signalé une indisponibilité le ${H.d(date)} (${fd.get('reason')}).`, '#/planning/equipe');
    ctx.save(); ctx.render(); ctx.toast(hit.length ? 'Claire est prévenue : ton remplacement sera organisé.' : 'Indisponibilité enregistrée.');
  };
  ACT['unavail-del'] = el => { const S = ctx.S; S.unavail = S.unavail.filter(u => u.id !== el.dataset.id); ctx.save(); ctx.render(); };

  V.guide = EJ.V.claire.guide;
})();
