/* Énergie Jeune – logique métier (sans interface). Testable sous Node. */
(function (root) {
  'use strict';
  const L = {};
  const TZ = 'Indian/Reunion';
  L.TZ = TZ;
  const pad = n => String(n).padStart(2, '0');
  L.pad = pad;
  L.uid = p => p + '_' + Math.random().toString(36).slice(2, 7) + Date.now().toString(36).slice(-3);
  L.DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

  /* ---------- Dates et heures (fuseau Indian/Reunion, UTC+4 sans changement d'heure) ---------- */
  L.nowParts = function (offsetMs) {
    const d = new Date(Date.now() + (offsetMs || 0));
    const p = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(d).reduce((a, x) => (a[x.type] = x.value, a), {});
    return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
  };
  const noon = s => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d, 12); };
  const midnight = s => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  L.addDays = (s, n) => { const d = new Date(noon(s) + n * 864e5); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; };
  L.dow = s => new Date(noon(s)).getUTCDay();
  L.weekStart = s => L.addDays(s, -((L.dow(s) + 6) % 7));
  L.daysBetween = (a, b) => Math.round((noon(b) - noon(a)) / 864e5);
  L.fmtDate = (s, o) => new Intl.DateTimeFormat('fr-FR', Object.assign({ timeZone: 'UTC' }, o || { weekday: 'long', day: 'numeric', month: 'long' })).format(new Date(noon(s)));
  L.min = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  L.hm = m => pad(Math.floor(m / 60)) + ':' + pad(m % 60);
  L.iso = (d, t) => d + 'T' + t;
  L.isoMs = iso => { const [d, t] = iso.split('T'); return midnight(d) + L.min(t) * 60000; };
  L.minutesBetween = (a, b) => Math.round((L.isoMs(b) - L.isoMs(a)) / 60000);
  L.fmtIso = (iso, today) => { const [d, t] = iso.split('T'); const rel = today ? L.daysBetween(today, d) : null; const lab = rel === 0 ? "aujourd'hui" : rel === -1 ? 'hier' : rel === 1 ? 'demain' : L.fmtDate(d, { weekday: 'short', day: 'numeric', month: 'short' }); return `${lab} ${t}`; };

  function easter(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3),
      h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
      mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1;
    return `${y}-${pad(mo)}-${pad(da)}`;
  }
  L.holiday = function (s) {
    const fixed = { '01-01': "Jour de l'An", '05-01': 'Fête du Travail', '05-08': 'Victoire 1945', '07-14': 'Fête nationale', '08-15': 'Assomption', '11-01': 'Toussaint', '11-11': 'Armistice 1918', '12-20': "Abolition de l'esclavage", '12-25': 'Noël' };
    if (fixed[s.slice(5)]) return fixed[s.slice(5)];
    const e = easter(+s.slice(0, 4));
    const m = {}; m[L.addDays(e, 1)] = 'Lundi de Pâques'; m[L.addDays(e, 39)] = 'Ascension'; m[L.addDays(e, 50)] = 'Lundi de Pentecôte';
    return m[s] || null;
  };
  L.isWorkday = s => { const w = L.dow(s); return w >= 1 && w <= 5 && !L.holiday(s); };
  L.workday = (s, n) => { let d = s, step = n < 0 ? -1 : 1, left = Math.abs(n); while (left > 0) { d = L.addDays(d, step); if (L.isWorkday(d)) left--; } return d; };
  L.anchorWorkday = s => { let d = s; while (!L.isWorkday(d)) d = L.addDays(d, 1); return d; };

  /* ---------- Géographie : communes → zones ---------- */
  const ZONES = {
    Nord: ['Saint-Denis', 'Sainte-Marie', 'Sainte-Suzanne'],
    Est: ['Saint-André', 'Bras-Panon', 'Saint-Benoît', 'Sainte-Rose', 'Salazie'],
    Ouest: ['La Possession', 'Le Port', 'Saint-Paul', 'Trois-Bassins', 'Saint-Leu'],
    Sud: ['Les Avirons', "L'Étang-Salé", 'Saint-Louis', 'Saint-Pierre', 'Le Tampon', 'Saint-Joseph', 'Petite-Île', 'Entre-Deux']
  };
  L.ZONES = ZONES;
  L.COMMUNES = [].concat(ZONES.Nord, ZONES.Est, ZONES.Ouest, ZONES.Sud);
  L.zoneOf = c => { for (const z in ZONES) if (ZONES[z].includes(c)) return z; return null; };
  const ADJ = { 'Nord-Est': 1, 'Nord-Ouest': 1, 'Ouest-Sud': 1 };
  L.communeDist = function (a, b) {
    if (!a || !b) return 3;
    if (a === b) return 0;
    const za = L.zoneOf(a), zb = L.zoneOf(b);
    if (!za || !zb) return 3;
    if (za === zb) return 1;
    return (ADJ[za + '-' + zb] || ADJ[zb + '-' + za]) ? 2 : 3;
  };
  L.proxLabel = d => ['même commune', 'même zone', 'zone voisine', 'secteur éloigné'][d];
  L.communeFromText = t => { if (!t) return null; const x = t.toLowerCase(); return L.COMMUNES.find(c => x.includes(c.toLowerCase())) || null; };

  /* ---------- Accès ---------- */
  L.vol = (S, id) => S.volunteers.find(v => v.id === id) || null;
  L.vname = (S, id) => { if (id === 'claire') return 'Claire'; const v = L.vol(S, id); return v ? v.name : '—'; };
  L.ivById = (S, id) => S.interventions.find(i => i.id === id) || null;
  L.active = S => S.interventions.filter(i => i.status !== 'annulée');
  L.VEHICLES = ['KM', 'PM'];
  L.isFleet = t => t === 'KM' || t === 'PM';
  L.TRANSPORTS = { KM: 'Voiture KM', PM: 'Voiture PM', perso: 'Véhicule personnel', covoit: 'Covoiturage', commun: 'Transport en commun', place: 'Sur place (sans trajet)', '': 'À choisir' };

  /* ---------- Créneaux, réservations ---------- */
  L.span = iv => { const s = L.min(iv.start), e = L.min(iv.end); const m = iv.meeting && iv.meeting.time ? L.min(iv.meeting.time) : s; return { from: Math.min(m, s), to: e }; };
  L.overlap = (a, b) => a.from < b.to && b.from < a.to;
  L.vehWindow = (iv, S) => { const sp = L.span(iv); const buf = (S && S.settings && S.settings.returnBuffer) || 30; return { from: sp.from, to: sp.to + buf }; };
  L.resOf = (S, iv) => { const w = L.vehWindow(iv, S); return { iv, veh: iv.transport, date: iv.date, from: w.from, to: w.to, driver: iv.driverId || null, fromIso: L.iso(iv.date, L.hm(w.from)), toIso: L.iso(iv.date, L.hm(w.to)) }; };
  L.reservations = (S, veh) => L.active(S).filter(i => i.transport === veh && i.date && i.start && i.end).map(i => L.resOf(S, i)).sort((a, b) => a.fromIso < b.fromIso ? -1 : 1);
  L.vehConflictsFor = function (S, iv) {
    if (!L.isFleet(iv.transport) || !iv.date || !iv.start || !iv.end) return [];
    const me = L.vehWindow(iv, S);
    return L.active(S).filter(o => o.id !== iv.id && o.transport === iv.transport && o.date === iv.date && o.start && o.end && L.overlap(me, L.vehWindow(o, S)));
  };
  L.vehConflicts = function (S) {
    const out = [];
    for (const veh of L.VEHICLES) {
      const r = L.reservations(S, veh);
      for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) if (r[i].date === r[j].date && L.overlap(r[i], r[j])) out.push({ veh, a: r[i].iv, b: r[j].iv });
    }
    return out;
  };

  /* ---------- Disponibilités et chevauchements ---------- */
  const SLOT_SPLIT = 750; // 12h30
  L.slotsNeeded = (start, end) => { const s = L.min(start), e = L.min(end), n = []; if (s < SLOT_SPLIT) n.push('am'); if (e > SLOT_SPLIT) n.push('pm'); return n; };
  L.volConflicts = function (S, volId, iv) {
    if (!iv.date || !iv.start || !iv.end) return [];
    const me = L.span(iv);
    return L.active(S).filter(o => o.id !== iv.id && o.date === iv.date && o.team.includes(volId) && o.start && o.end && L.overlap(me, L.span(o)));
  };
  L.tightGaps = function (S, volId, iv) { // enchaînement < 45 min entre communes différentes
    if (!iv.date || !iv.start || !iv.end) return [];
    const me = L.span(iv);
    return L.active(S).filter(o => o.id !== iv.id && o.date === iv.date && o.team.includes(volId) && o.start && o.end && o.commune !== iv.commune && !L.overlap(me, L.span(o)) &&
      (Math.abs(L.span(o).from - me.to) < 45 || Math.abs(me.from - L.span(o).to) < 45));
  };
  L.volStatus = function (S, volId, iv) {
    const v = L.vol(S, volId); const reasons = [];
    if (!iv.date || !iv.start || !iv.end || !v) return { ok: true, reasons, conflicts: [] };
    const wk = (v.avail || {})[L.dow(iv.date)] || {};
    L.slotsNeeded(iv.start, iv.end).forEach(s => { if (!wk[s]) reasons.push(`pas disponible le ${L.DAYS[L.dow(iv.date)]} ${s === 'am' ? 'matin' : 'après-midi'}`); });
    (S.unavail || []).filter(u => u.vol === volId && u.date === iv.date && L.overlap({ from: L.min(u.from), to: L.min(u.to) }, { from: L.min(iv.start), to: L.min(iv.end) }))
      .forEach(u => reasons.push(`indisponibilité déclarée (${u.reason || 'sans motif'})`));
    const conflicts = L.volConflicts(S, volId, iv);
    conflicts.forEach(o => reasons.push(`déjà sur « ${o.school} » (${o.start}–${o.end})`));
    return { ok: reasons.length === 0, reasons, conflicts };
  };
  L.weekLoad = (S, volId, date) => { const w = L.weekStart(date); return L.active(S).filter(i => i.team.includes(volId) && L.weekStart(i.date) === w).length; };

  /* ---------- Véhicules : localisation, garde des clés ---------- */
  L.vehicleLocation = function (S, veh, date, fromMin, exceptId) {
    const prev = L.reservations(S, veh).filter(r => r.iv.id !== exceptId && (r.date < date || (r.date === date && r.to <= fromMin)));
    const last = prev[prev.length - 1];
    if (last) return { commune: last.iv.commune, place: `à l'issue de « ${last.iv.school} »`, source: `à l'issue de « ${last.iv.school} » (${last.iv.commune}, ${last.iv.end})` };
    const c = S.vehicles[veh].custody;
    const com = L.communeFromText(c.place) || S.settings.baseCommune;
    return { commune: com, place: c.place, source: `actuellement : ${c.place}` };
  };
  L.custodyInfo = function (S, veh, now) {
    const c = S.vehicles[veh].custody; const nowIso = L.iso(now.date, now.time);
    const res = L.reservations(S, veh).filter(r => r.toIso >= nowIso);
    const used = r => S.vehicles[veh].history.some(e => (e.type === 'prise' || e.type === 'confirmation') && e.by === r.driver && L.isoMs(e.at) >= L.isoMs(r.fromIso) - 120 * 60000 && L.isoMs(e.at) <= L.isoMs(r.toIso)); // déjà prise en charge par ce conducteur
    const next = res.find(r => r.driver && r.driver !== c.holder && !used(r)) || null;
    const info = { veh, holder: c.holder, place: c.place, since: c.since, odo: c.odo, pending: c.pending, leftBy: c.leftBy, leftAt: c.leftAt, next, status: 'ok', reasons: [], sev: null, ongoing: null };
    if (c.pending) {
      info.status = 'a_confirmer';
      info.reasons.push(`${L.vname(S, c.pending.from)} a remis les clés à ${L.vname(S, c.pending.to)} : ${L.vname(S, c.pending.to)} n'a pas encore confirmé`);
      if (L.minutesBetween(c.pending.at, nowIso) > 30) info.sev = 'high';
    } else {
      const ongoing = res.find(r => r.fromIso <= nowIso && r.driver && r.driver !== c.holder && !used(r));
      if (ongoing) {
        info.status = 'a_confirmer'; info.ongoing = ongoing;
        info.reasons.push(`Aucune prise confirmée pour ${L.vname(S, ongoing.driver)} (prévue à ${L.hm(ongoing.from)})`);
        if (L.minutesBetween(ongoing.fromIso, nowIso) >= 15) info.sev = 'high';
      } else if (next && L.minutesBetween(nowIso, next.fromIso) <= 60 && next.fromIso >= nowIso) {
        info.status = 'a_confirmer';
        info.reasons.push(`Prise de ${L.vname(S, next.driver)} à ${L.hm(next.from)} : pas encore confirmée`);
      }
    }
    return info;
  };

  function addEvent(S, veh, ev) { const e = Object.assign({ id: L.uid('ev') }, ev); S.vehicles[veh].history.unshift(e); return e; }
  const num = x => (x === '' || x === null || x === undefined || isNaN(Number(x))) ? null : Number(x);
  L.actions = {
    take(S, veh, volId, o) {
      const V = S.vehicles[veh], c = V.custody;
      if (!V.authorized.includes(volId)) return { ok: false, error: `Tu n'es pas habilité(e) à conduire ${veh}. Demande à Claire.` };
      const odo = num(o.odo); if (odo === null) return { ok: false, error: 'Indique le compteur (km).' };
      const confirming = !!(c.pending && c.pending.to === volId);
      if (c.holder === volId && !c.pending) return { ok: false, error: `Tu as déjà ${veh}.` };
      if (c.holder && !confirming) return { ok: false, error: `${veh} est détenue par ${L.vname(S, c.holder)}. Demande-lui de te remettre les clés, ou signale à Claire.` };
      if (odo < c.odo && !o.force) return { ok: false, needsForce: true, error: `Compteur (${odo}) inférieur au dernier relevé (${c.odo}).` };
      const ev = { at: o.at, type: confirming ? 'confirmation' : 'prise', by: volId, place: o.place || c.place, odo };
      if (odo < c.odo) { ev.anomaly = true; ev.note = `Compteur inférieur au relevé précédent (${c.odo}).`; }
      if (confirming && Math.abs(odo - c.pending.odo) > 5) { ev.anomaly = true; ev.note = `Écart de ${Math.abs(odo - c.pending.odo)} km entre la remise (${c.pending.odo}) et la réception (${odo}).`; }
      if (confirming) ev.from = c.pending.from;
      addEvent(S, veh, ev);
      c.holder = volId; c.since = o.at; c.odo = odo; c.place = o.place || c.place; c.pending = null;
      return { ok: true, event: ev };
    },
    handOver(S, veh, volId, o) {
      const V = S.vehicles[veh], c = V.custody;
      if (c.holder !== volId) return { ok: false, error: `Tu ne détiens pas ${veh} actuellement.` };
      if (c.pending) return { ok: false, error: `Remise déjà en attente de confirmation par ${L.vname(S, c.pending.to)}.` };
      if (!o.place || !o.place.trim()) return { ok: false, error: 'Indique le lieu convenu.' };
      const odo = num(o.odo); if (odo === null) return { ok: false, error: 'Indique le compteur (km).' };
      if (o.to && !V.authorized.includes(o.to)) return { ok: false, error: `${L.vname(S, o.to)} n'est pas habilité(e) pour ${veh}.` };
      if (o.to === volId) return { ok: false, error: 'Tu ne peux pas te remettre les clés à toi-même.' };
      if (odo < c.odo && !o.force) return { ok: false, needsForce: true, error: `Compteur (${odo}) inférieur au dernier relevé (${c.odo}).` };
      const ev = { at: o.at, type: 'remise', by: volId, place: o.place.trim(), odo, to: o.to || null };
      if (odo < c.odo) { ev.anomaly = true; ev.note = `Compteur inférieur au relevé précédent (${c.odo}).`; }
      addEvent(S, veh, ev);
      c.place = o.place.trim(); c.odo = odo; c.since = o.at; c.leftBy = volId; c.leftAt = o.at;
      if (o.to) c.pending = { from: volId, to: o.to, at: o.at, place: c.place, odo };
      else { c.holder = null; c.pending = null; }
      return { ok: true, event: ev };
    },
    cancelPending(S, veh, volId, at) {
      const c = S.vehicles[veh].custody;
      if (!c.pending || (c.pending.from !== volId && volId !== 'claire')) return { ok: false, error: 'Aucune remise à annuler.' };
      addEvent(S, veh, { at, type: 'correction', by: volId, note: `Remise à ${L.vname(S, c.pending.to)} annulée.`, reason: 'Remise annulée' });
      c.pending = null; return { ok: true };
    },
    correct(S, veh, o) {
      const c = S.vehicles[veh].custody;
      if (!o.reason || !o.reason.trim()) return { ok: false, error: 'Le motif de la correction est obligatoire.' };
      const odo = o.odo === '' || o.odo === undefined ? c.odo : num(o.odo);
      if (odo === null) return { ok: false, error: 'Compteur invalide.' };
      const before = { holder: c.holder, place: c.place, odo: c.odo, pending: c.pending ? L.vname(S, c.pending.to) : null };
      c.holder = o.holder || null; c.place = (o.place || c.place); c.odo = odo; c.pending = null; c.since = o.at;
      if (!c.holder) { c.leftBy = c.leftBy || null; c.leftAt = o.at; }
      addEvent(S, veh, { at: o.at, type: 'correction', by: 'claire', before, after: { holder: c.holder, place: c.place, odo: c.odo }, reason: o.reason.trim() });
      return { ok: true };
    }
  };

  /* ---------- Trajets et kilomètres ---------- */
  L.tripKm = function (t) {
    const a = num(t.odoStart), b = num(t.odoEnd);
    if (a !== null && b !== null) return { km: b - a, source: 'compteurs' };
    const m = num(t.manualKm);
    if (m !== null) return { km: m, source: 'saisie' };
    return { km: null, source: 'manquant' };
  };
  L.tripIssues = function (S, t) {
    const out = [], k = L.tripKm(t), max = S.settings.maxKmDay || 400;
    const a = num(t.odoStart), b = num(t.odoEnd);
    if (a !== null && b !== null && b < a) out.push({ sev: 'error', text: `Compteur d'arrivée (${b}) inférieur au départ (${a}).` });
    if (k.km !== null && k.km > max) out.push({ sev: 'error', text: `Distance inhabituelle : ${k.km} km (seuil ${max} km).` });
    if (k.km !== null && k.km < 0 && !(a !== null && b !== null && b < a)) out.push({ sev: 'error', text: 'Distance négative.' });
    if (k.source === 'saisie' && !(t.manualReason || '').trim()) out.push({ sev: 'error', text: 'Distance saisie sans motif.' });
    if (L.isFleet(t.vehicle) && k.source === 'manquant') out.push({ sev: 'error', text: 'Relevé kilométrique manquant.' });
    if (L.isFleet(t.vehicle) && k.source === 'saisie') out.push({ sev: 'warn', text: 'Distance saisie à la main (compteurs non relevés).' });
    if (a !== null && b !== null && b >= a) {
      const steps = (t.steps || []).map(s => num(s.odo)).filter(x => x !== null);
      if (steps.some((x, i) => x < a || x > b || (i > 0 && x < steps[i - 1]))) out.push({ sev: 'error', text: 'Relevés intermédiaires incohérents avec les compteurs de départ et d\'arrivée.' });
      if (L.isFleet(t.vehicle)) {
        S.trips.filter(o => o.id !== t.id && o.vehicle === t.vehicle).forEach(o => {
          const oa = num(o.odoStart), ob = num(o.odoEnd);
          if (oa !== null && ob !== null && ob > oa && b > a && a < ob && oa < b) out.push({ sev: 'error', text: `Kilomètres comptés deux fois : chevauche le trajet du ${L.fmtDate(o.date, { day: 'numeric', month: 'short' })} (${oa}→${ob}).` });
        });
        const prev = S.trips.filter(o => o.id !== t.id && o.vehicle === t.vehicle && num(o.odoEnd) !== null && num(o.odoEnd) <= a).sort((x, y) => num(y.odoEnd) - num(x.odoEnd))[0];
        if (prev && a - num(prev.odoEnd) > 5) out.push({ sev: 'warn', text: `${a - num(prev.odoEnd)} km sans trajet enregistré depuis le relevé précédent (${num(prev.odoEnd)}).` });
      }
    }
    return out;
  };
  L.tripLegs = function (t) { // distances par étape, à titre indicatif (jamais additionnées au total)
    const pts = [num(t.odoStart)].concat((t.steps || []).map(s => num(s.odo)), [num(t.odoEnd)]);
    const out = [];
    for (let i = 1; i < pts.length; i++) out.push(pts[i] !== null && pts[i - 1] !== null && pts[i] >= pts[i - 1] ? pts[i] - pts[i - 1] : null);
    return out;
  };
  L.reimb = function (S, t) {
    const k = L.tripKm(t); const r = t.reimb || { status: 'aucun' }; const rate = S.settings.ratePerKm;
    const amount = (t.vehicle === 'perso' && r.status === 'validée' && rate > 0 && k.km > 0) ? Math.round(k.km * rate * 100) / 100 : null;
    return { status: r.status, amount };
  };
  L.REIMB_LABELS = { aucun: 'Non demandé', 'demandée': 'Demandé – à valider', 'validée': 'Validé', 'refusée': 'Refusé' };
  L.tripsFiltered = function (S, f) {
    return S.trips.filter(t => (!f.from || t.date >= f.from) && (!f.to || t.date <= f.to) && (!f.vehicle || f.vehicle === 'all' || t.vehicle === f.vehicle) && (!f.vol || f.vol === 'all' || t.driver === f.vol))
      .sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
  };
  L.tripTotals = function (S, trips) {
    const tot = { KM: 0, PM: 0, perso: 0, other: 0, missing: 0, invalid: 0 };
    trips.forEach(t => {
      const k = L.tripKm(t);
      if (k.km === null) { tot.missing++; return; }
      if (k.km < 0) { tot.invalid++; return; }
      if (t.vehicle === 'KM' || t.vehicle === 'PM' || t.vehicle === 'perso') tot[t.vehicle] += k.km; else tot.other += k.km;
    });
    return tot;
  };
  L.csv = function (S, f) {
    const q = v => { const s = v === null || v === undefined ? '' : String(v); return /[;"\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const head = ['Date', 'Véhicule', 'Conducteur', 'Motif', 'Étapes', 'Compteur départ', 'Compteur arrivée', 'Distance (km)', 'Source de la distance', 'Motif de saisie manuelle', 'Contrôle', 'Remboursement', 'Montant (€)'];
    const rows = L.tripsFiltered(S, f).sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0).map(t => {
      const k = L.tripKm(t), iss = L.tripIssues(S, t).map(i => i.text).join(' | '), r = L.reimb(S, t);
      const veh = L.TRANSPORTS[t.vehicle] || t.vehicle;
      return [t.date, veh, L.vname(S, t.driver), t.purpose, (t.steps || []).map(s => s.label).join(' > '), t.odoStart ?? '', t.odoEnd ?? '',
        k.km === null ? '' : String(k.km).replace('.', ','), k.source === 'compteurs' ? 'Compteurs' : k.source === 'saisie' ? 'Saisie manuelle' : 'Manquant', k.source === 'saisie' ? t.manualReason : '', iss || 'OK',
        t.vehicle === 'perso' ? L.REIMB_LABELS[r.status] : 'Sans objet (véhicule de fonction)', r.amount === null ? '' : String(r.amount).replace('.', ',')].map(q).join(';');
    });
    return [head.map(q).join(';')].concat(rows).join('\r\n');
  };

  /* ---------- Dossiers ---------- */
  L.STAGES = ['a_preparer', 'pret', 'emporte', 'remis'];
  L.STAGE_LABELS = { a_preparer: 'À préparer', pret: 'Prêt', emporte: 'Emporté', remis: 'Remis' };
  L.KINDS = { fiche: 'Fiche', impression: 'Support à imprimer', document: 'Document à remettre', autre: 'Autre' };
  L.dossierState = function (iv) {
    const it = (iv.dossier || []);
    if (!it.length) return null;
    return L.STAGES[Math.min.apply(null, it.map(i => L.STAGES.indexOf(i.state)))];
  };
  L.dossierIssues = function (iv) {
    const it = iv.dossier || [], out = [];
    if (!it.length) { out.push('Aucun élément dans le dossier'); return out; }
    it.filter(i => !i.prepBy).forEach(i => out.push(`« ${i.label} » : préparation non attribuée`));
    it.filter(i => !i.carryBy).forEach(i => out.push(`« ${i.label} » : transport non attribué`));
    it.filter(i => i.state === 'a_preparer').forEach(i => out.push(`« ${i.label} » : encore à préparer`));
    return out;
  };
  L.canAdvance = function (S, iv, item, volId) {
    const next = L.STAGES[L.STAGES.indexOf(item.state) + 1]; if (!next) return null;
    if (volId === 'claire') return next;
    if (next === 'pret' && item.prepBy === volId) return next;
    if (next === 'emporte' && (item.carryBy === volId || (!item.carryBy && iv.team.includes(volId)))) return next;
    if (next === 'remis' && iv.team.includes(volId)) return next;
    return null;
  };

  /* ---------- Intervention : état ---------- */
  L.ivState = function (iv, now) {
    if (iv.status === 'annulée') return 'annulée';
    if (iv.status === 'brouillon') return 'brouillon';
    const a = L.iso(iv.date, iv.start), b = L.iso(iv.date, iv.end), n = L.iso(now.date, now.time);
    return n < a ? 'à venir' : n <= b ? 'en cours' : 'terminée';
  };
  L.nextIvFor = (S, volId, now) => S.interventions.filter(i => i.status === 'publiée' && i.team.includes(volId) && L.iso(i.date, i.end) >= L.iso(now.date, now.time))
    .sort((a, b) => L.iso(a.date, a.start) < L.iso(b.date, b.start) ? -1 : 1)[0] || null;
  L.tripsForIv = (S, ivId) => S.trips.filter(t => (t.steps || []).some(s => s.ivId === ivId) || t.ivId === ivId);

  /* ---------- Alertes pour Claire ---------- */
  L.alerts = function (S, now) {
    const out = [], today = now.date, nowIso = L.iso(now.date, now.time);
    const push = a => out.push(a);
    const lab = iv => `« ${iv.school} »`;
    const when = iv => `${L.fmtDate(iv.date, { weekday: 'short', day: 'numeric', month: 'short' })} · ${iv.start}–${iv.end}`;
    L.active(S).forEach(iv => {
      const d = L.daysBetween(today, iv.date);
      if (d >= 0 && d <= 14) {
        const sev = d <= 1 ? 'high' : 'med';
        if (iv.team.length < iv.required) push({ id: 'eq_' + iv.id, sev, kind: 'Équipe', title: `Équipe incomplète : ${iv.team.length}/${iv.required}`, detail: `${lab(iv)} · ${when(iv)}`, href: '#/iv/' + iv.id, at: L.iso(iv.date, iv.start) });
        if (L.isFleet(iv.transport)) {
          if (!iv.driverId) push({ id: 'cd_' + iv.id, sev, kind: 'Véhicule', title: `Conducteur ${iv.transport} à désigner`, detail: `${lab(iv)} · ${when(iv)}`, href: '#/iv/' + iv.id, at: L.iso(iv.date, iv.start) });
          else if (!S.vehicles[iv.transport].authorized.includes(iv.driverId)) push({ id: 'ch_' + iv.id, sev, kind: 'Véhicule', title: `${L.vname(S, iv.driverId)} n'est pas habilité(e) pour ${iv.transport}`, detail: `${lab(iv)} · ${when(iv)}`, href: '#/iv/' + iv.id, at: L.iso(iv.date, iv.start) });
          else if (!iv.team.includes(iv.driverId)) push({ id: 'ct_' + iv.id, sev, kind: 'Véhicule', title: `Conducteur hors de l'équipe`, detail: `${lab(iv)} · ${L.vname(S, iv.driverId)}`, href: '#/iv/' + iv.id, at: L.iso(iv.date, iv.start) });
        }
        if (!iv.transport) push({ id: 'tr_' + iv.id, sev: 'low', kind: 'Transport', title: 'Mode de transport à choisir', detail: `${lab(iv)} · ${when(iv)}`, href: '#/iv/' + iv.id, at: L.iso(iv.date, iv.start) });
        if (iv.status === 'brouillon' && d <= 3) push({ id: 'br_' + iv.id, sev: 'med', kind: 'Planning', title: 'Intervention non publiée', detail: `${lab(iv)} · ${when(iv)} · invisible des volontaires`, href: '#/iv/' + iv.id, at: L.iso(iv.date, iv.start) });
        if (iv.status === 'publiée' && d <= 3) {
          const di = L.dossierIssues(iv);
          if (di.length) push({ id: 'do_' + iv.id, sev: d <= 1 ? 'high' : 'med', kind: 'Dossier', title: 'Dossier incomplet', detail: `${lab(iv)} · ${di[0]}${di.length > 1 ? ` (+${di.length - 1})` : ''}`, href: '#/dossiers/' + iv.id, at: L.iso(iv.date, iv.start) });
        }
      }
      if (d < 0 && d >= -10 && iv.status === 'publiée') {
        if (['KM', 'PM', 'perso'].includes(iv.transport) && !L.tripsForIv(S, iv.id).length) push({ id: 'km_' + iv.id, sev: 'high', kind: 'Kilomètres', title: 'Relevé kilométrique manquant', detail: `${lab(iv)} · ${when(iv)} · ${iv.transport === 'perso' ? 'véhicule personnel' : iv.transport}`, href: '#/iv/' + iv.id, at: L.iso(iv.date, iv.start) });
        const nr = (iv.dossier || []).filter(i => i.kind === 'document' && i.state !== 'remis');
        if (nr.length) push({ id: 'rm_' + iv.id, sev: 'med', kind: 'Dossier', title: 'Remise du document non confirmée', detail: `${lab(iv)} · « ${nr[0].label} »`, href: '#/dossiers/' + iv.id, at: L.iso(iv.date, iv.start) });
      }
      if (d === 0 && iv.status === 'publiée' && nowIso > L.iso(iv.date, iv.end)) {
        /* terminée aujourd'hui : traitée par les règles ci-dessus à partir de demain */
      }
    });
    L.vehConflicts(S).filter(c => c.a.date >= today).forEach(c => push({ id: 'dr_' + c.a.id + c.b.id, sev: 'high', kind: 'Véhicule', title: `${c.veh} réservée deux fois`, detail: `« ${c.a.school} » ${c.a.start}–${c.a.end} et « ${c.b.school} » ${c.b.start}–${c.b.end} · ${L.fmtDate(c.a.date, { weekday: 'short', day: 'numeric', month: 'short' })}`, href: '#/iv/' + c.a.id, href2: '#/iv/' + c.b.id, at: L.iso(c.a.date, c.a.start) }));
    L.VEHICLES.forEach(v => {
      const ci = L.custodyInfo(S, v, now);
      if (ci.sev) push({ id: 'cl_' + v, sev: 'high', kind: 'Clés', title: ci.pending ? `Clés ${v} : remise non confirmée` : `Clés ${v} non récupérées`, detail: ci.reasons[0], href: '#/vehicules/' + v, at: nowIso });
    });
    S.trips.forEach(t => {
      if (L.daysBetween(t.date, today) > 30) return;
      const e = L.tripIssues(S, t).filter(i => i.sev === 'error' && i.text !== 'Relevé kilométrique manquant.');
      if (e.length) push({ id: 'tp_' + t.id, sev: 'med', kind: 'Kilomètres', title: 'Trajet incohérent', detail: `${L.TRANSPORTS[t.vehicle]} · ${L.vname(S, t.driver)} · ${e[0].text}`, href: '#/trajet/' + t.id, at: t.date + 'T00:00' });
    });
    const orphans = S.mails.filter(m => m.box === 'inbox' && !m.ivId && !m.ignored).length;
    if (orphans) push({ id: 'ml', sev: 'low', kind: 'Courriel', title: `${orphans} message${orphans > 1 ? 's' : ''} non rattaché${orphans > 1 ? 's' : ''} à une intervention`, detail: 'Rattache-les pour retrouver les échanges logistiques.', href: '#/courriels', at: nowIso });
    const rank = { high: 0, med: 1, low: 2 };
    return out.sort((a, b) => rank[a.sev] - rank[b.sev] || (a.at < b.at ? -1 : 1));
  };

  /* ---------- Suggestion d'équipe, de transport et de rendez-vous ---------- */
  L.suggest = function (S, iv) {
    const out = { team: [], driver: null, transport: iv.transport || '', meeting: null, reasons: {}, excluded: [], warnings: [], meetingReason: '', transportReason: '' };
    if (!iv.date || !iv.start || !iv.end || !iv.commune) { out.warnings.push('Renseigne la date, les horaires et la commune pour obtenir une suggestion.'); return out; }
    const need = Math.max(1, +iv.required || 1);
    const keep = (iv.team || []).slice();
    const hyp = Object.assign({}, iv, { team: keep });
    const dayLab = `${L.DAYS[L.dow(iv.date)]} ${L.slotsNeeded(iv.start, iv.end).length > 1 ? 'toute la journée' : L.slotsNeeded(iv.start, iv.end)[0] === 'am' ? 'matin' : 'après-midi'}`;

    // 1) transport
    let transport = iv.transport;
    if (!transport || transport === 'auto') {
      const opts = L.VEHICLES.map(v => ({ v, free: !L.vehConflictsFor(S, Object.assign({}, iv, { transport: v })).length, dist: L.communeDist(L.vehicleLocation(S, v, iv.date, L.span(iv).from, iv.id).commune, iv.commune), loc: L.vehicleLocation(S, v, iv.date, L.span(iv).from, iv.id) }))
        .filter(o => o.free && S.vehicles[o.v].authorized.length);
      opts.sort((a, b) => a.dist - b.dist);
      if (opts[0]) { transport = opts[0].v; out.transportReason = `${transport} est libre ce créneau et se trouve ${opts[0].loc.source}.`; }
      else { transport = 'covoit'; out.transportReason = 'KM et PM sont déjà réservées sur ce créneau : covoiturage proposé.'; }
    }
    const fleet = L.isFleet(transport);
    const evalCands = () => S.volunteers.filter(v => !keep.includes(v.id)).map(v => {
      const st = L.volStatus(S, v.id, hyp);
      const dist = L.communeDist(v.sector, iv.commune), load = L.weekLoad(S, v.id, iv.date);
      return { v, st, dist, load, score: (3 - dist) * 2 - load * 0.7 };
    });
    let cands = evalCands();
    // véhicule en conflit alors qu'il était demandé
    if (fleet && L.vehConflictsFor(S, Object.assign({}, iv, { transport })).length) {
      const other = transport === 'KM' ? 'PM' : 'KM';
      out.warnings.push(`${transport} est déjà réservée sur ce créneau.`);
      if (!L.vehConflictsFor(S, Object.assign({}, iv, { transport: other })).length) { out.warnings.push(`${other} est libre : change le véhicule pour la réserver.`); }
    }
    cands.filter(c => !c.st.ok).forEach(c => out.excluded.push({ id: c.v.id, why: c.st.reasons.join(' ; ') }));
    const ok = cands.filter(c => c.st.ok).sort((a, b) => b.score - a.score || a.v.name.localeCompare(b.v.name, 'fr'));

    // 2) conducteur
    let driver = null;
    if (fleet) {
      const authorized = S.vehicles[transport].authorized;
      const keepDriver = keep.find(id => authorized.includes(id) && L.volStatus(S, id, hyp).conflicts.length === 0);
      if (keepDriver) driver = keepDriver;
      else {
        const dc = ok.find(c => authorized.includes(c.v.id));
        if (dc) { driver = dc.v.id; dc.driver = true; dc.score += 100; ok.sort((a, b) => b.score - a.score || a.v.name.localeCompare(b.v.name, 'fr')); }
        else out.warnings.push(`Aucun volontaire disponible n'est habilité(e) pour ${transport}.`);
      }
    }
    // 3) équipe
    const slots = Math.max(0, need - keep.length);
    const picked = ok.slice(0, slots);
    if (driver && !keep.includes(driver) && !picked.some(c => c.v.id === driver) && slots > 0) { picked.pop(); picked.push(ok.find(c => c.v.id === driver)); }
    if (picked.length < slots) out.warnings.push(`Seulement ${keep.length + picked.length} volontaire(s) sur ${need} disponibles : équipe incomplète possible.`);
    out.team = keep.concat(picked.map(c => c.v.id));
    out.driver = driver;
    out.transport = transport;
    keep.forEach(id => { out.reasons[id] = ['déjà dans l\'équipe']; });
    picked.forEach(c => {
      const r = [`disponible ${dayLab}`, `secteur ${c.v.sector} (${L.proxLabel(c.dist)})`, c.load ? `${c.load} autre${c.load > 1 ? 's' : ''} intervention${c.load > 1 ? 's' : ''} cette semaine` : 'aucune autre intervention cette semaine'];
      if (c.v.id === driver) r.push(`habilité(e) ${transport} : conducteur`);
      out.reasons[c.v.id] = r;
    });
    if (driver && keep.includes(driver)) out.reasons[driver].push(`habilité(e) ${transport} : conducteur`);

    // 4) rendez-vous
    const members = out.team.map(id => L.vol(S, id)).filter(Boolean);
    if (fleet) {
      const loc = L.vehicleLocation(S, transport, iv.date, L.span(iv).from, iv.id);
      const places = Array.from(new Set(members.map(m => m.sector).concat([loc.commune]).filter(Boolean)));
      let best = null;
      places.forEach(p => {
        const cost = members.reduce((s, m) => s + L.communeDist(m.sector, p), 0) + L.communeDist(p, iv.commune) * 0.5 - (p === loc.commune ? 0.75 : 0);
        if (!best || cost < best.cost) best = { p, cost };
      });
      const near = members.filter(m => L.communeDist(m.sector, best.p) <= 1).length;
      const lead = 30 + 15 * L.communeDist(best.p, iv.commune);
      const t = Math.max(0, Math.floor((L.min(iv.start) - lead) / 5) * 5);
      out.meeting = { place: `${best.p} (lieu précis à convenir)`, time: L.hm(t) };
      out.meetingReason = `${best.p} : ${near} volontaire${near > 1 ? 's' : ''} sur ${members.length} y partent ou sont dans la même zone` +
        (best.p === loc.commune ? `, et ${transport} s'y trouve (${loc.source})` : `. ${transport} se trouve ${loc.source}`) + `. Départ ${lead} min avant le début (${L.proxLabel(L.communeDist(best.p, iv.commune))} avec ${iv.commune}).`;
    } else {
      out.meeting = { place: `Devant l'établissement (${iv.commune})`, time: L.hm(Math.max(0, L.min(iv.start) - 15)) };
      out.meetingReason = `Sans voiture de fonction, chacun rejoint l'établissement directement, 15 min avant le début.`;
    }
    return out;
  };

  /* ---------- Courriels ---------- */
  L.buildMail = function (S, kind, iv) {
    const date = L.fmtDate(iv.date, { weekday: 'long', day: 'numeric', month: 'long' });
    const c = iv.contact || {};
    const hello = `Bonjour${c.name ? ' ' + c.name : ''},\n\n`;
    const sign = '\n\nCordialement,\nClaire\nÉnergie Jeune';
    const ids = (S.volunteers.filter(v => iv.team.includes(v.id)).map(v => v.name).join(', ')) || 'équipe à confirmer';
    let subject, body;
    if (kind === 'confirmation') {
      subject = `Confirmation de l'intervention du ${date} – ${iv.school}`;
      body = hello + `Nous vous confirmons l'intervention d'Énergie Jeune le ${date}, de ${iv.start} à ${iv.end}, à ${iv.school} (${iv.address || iv.commune}).\n\nL'équipe sera composée de : ${ids}. Arrivée prévue sur place à ${iv.start}.\n\nMerci de nous indiquer la salle, l'accès et la personne à contacter à l'arrivée.` + sign;
    } else if (kind === 'modification') {
      subject = `Modification de l'intervention du ${date} – ${iv.school}`;
      body = hello + `Nous devons modifier l'organisation de notre intervention à ${iv.school} : elle aura lieu le ${date}, de ${iv.start} à ${iv.end}.\n\nÉquipe : ${ids}.\n\nNous restons disponibles pour ajuster si besoin et vous remercions de votre compréhension.` + sign;
    } else {
      subject = `Annulation de l'intervention du ${date} – ${iv.school}`;
      body = hello + `Nous sommes au regret de vous informer que l'intervention prévue le ${date} (${iv.start}–${iv.end}) à ${iv.school} est annulée.\n\nNous vous proposons de convenir ensemble d'une nouvelle date dès que possible.` + sign;
    }
    return { subject, body };
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = L; else root.EJ = Object.assign(root.EJ || {}, { L });
})(typeof window !== 'undefined' ? window : globalThis);
