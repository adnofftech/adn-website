/* Données de démonstration FICTIVES – générées autour de la date du jour (Indian/Reunion). */
(function (root) {
  'use strict';
  const L = (root.EJ && root.EJ.L) || root.__L;

  function seed() {
    const real = L.nowParts(0);
    const D0 = L.anchorWorkday(real.date);
    const wd = n => L.workday(D0, n);
    const full = { 1: { am: 1, pm: 1 }, 2: { am: 1, pm: 1 }, 3: { am: 1, pm: 1 }, 4: { am: 1, pm: 1 }, 5: { am: 1, pm: 1 } };
    const days = (o) => { const a = {}; for (let d = 1; d <= 5; d++) a[d] = Object.assign({ am: 1, pm: 1 }, o[d] === 0 ? { am: 0, pm: 0 } : o[d] || {}); return a; };
    const V = (id, name, sector, avail, ownCar) => ({ id, name, sector, avail: avail || days({}), ownCar: !!ownCar, demo: true });
    const volunteers = [
      V('cheryl', 'Cheryl', 'Saint-Denis'),
      V('adrien', 'Adrien', 'Sainte-Marie'),
      V('ethan', 'Ethan', 'Saint-Paul'),
      V('hugo', 'Hugo', 'Le Port', days({ 3: 0 })),
      V('emma', 'Emma', 'Saint-Pierre'),
      V('manon', 'Manon', 'Le Tampon', days({ 5: 0 })),
      V('rachelh', 'Rachel (H)', 'Saint-Benoît', days({ 1: 0, 3: 0, 5: 0, 2: { pm: 0 }, 4: { pm: 0 } })),
      V('wendy', 'Wendy', 'Saint-André'),
      V('racheld', 'Rachel (D)', 'Saint-Denis', null, true),
      V('nathan', 'Nathan', 'La Possession', days({ 4: 0 })),
      V('anais', 'Anaïs', 'Saint-Louis', null, true),
      V('tom', 'Tom', 'Saint-Leu', days({ 1: { pm: 0 }, 2: { pm: 0 }, 3: { pm: 0 }, 4: { pm: 0 }, 5: { pm: 0 } }), true)
    ];
    const C = (name, role, tel, mail) => ({ name, role, tel, email: mail });
    const item = (label, kind, state, prepBy, carryBy, note) => ({ id: L.uid('it'), label, kind, state, prepBy, carryBy, note: note || '', history: [] });
    const IV = o => Object.assign({ demo: true, status: 'publiée', required: 2, team: [], driverId: null, transport: '', meeting: { place: '', time: '' }, dossier: [], notes: '', log: [] }, o);
    const interventions = [
      IV({ id: 'iv_p1', school: 'Collège Les Manguiers', type: 'collège', commune: 'Saint-Pierre', address: '12 rue des Manguiers', contact: C('Mme Fontaine', 'CPE', '0262 00 00 11', 'cpe@college-manguiers.exemple.invalid'), date: wd(-1), start: '09:00', end: '11:00', required: 2, team: ['emma', 'manon'], transport: 'PM', driverId: 'manon', meeting: { place: 'Parking de la gare routière, Saint-Pierre', time: '08:20' },
        dossier: [item('Fiche d\'animation', 'fiche', 'emporte', 'emma', 'manon'), item('Attestation de passage', 'document', 'emporte', 'manon', 'manon', 'À faire signer par le secrétariat')] }),
      IV({ id: 'iv_p2', school: 'Collège des Alizés', type: 'collège', commune: 'Le Port', address: '4 avenue des Alizés', contact: C('M. Payet', 'Professeur référent', '0262 00 00 12', 'referent@college-alizes.exemple.invalid'), date: wd(-1), start: '13:30', end: '15:30', required: 2, team: ['hugo', 'wendy'], transport: 'KM', driverId: 'hugo', meeting: { place: 'Local de l\'association', time: '12:45' },
        dossier: [item('Fiche d\'animation', 'fiche', 'remis', 'hugo', 'hugo'), item('Attestation de passage', 'document', 'remis', 'wendy', 'hugo')] }),
      IV({ id: 'iv_t1', school: 'Collège Les Letchis', type: 'collège', commune: 'Saint-Denis', address: '25 rue des Letchis', contact: C('Mme Robert', 'Principale adjointe', '0262 00 00 13', 'direction@college-letchis.exemple.invalid'), date: wd(0), start: '08:30', end: '10:30', required: 3, team: ['cheryl', 'adrien', 'racheld'], transport: 'KM', driverId: 'adrien', meeting: { place: 'Local de l\'association', time: '08:00' },
        dossier: [item('Fiche d\'animation', 'fiche', 'emporte', 'cheryl', 'adrien'), item('Supports à imprimer (30 ex.)', 'impression', 'emporte', 'racheld', 'racheld'), item('Convention de partenariat à remettre', 'document', 'emporte', 'cheryl', 'cheryl', 'À remettre à la principale adjointe')] }),
      IV({ id: 'iv_t2', school: 'Lycée professionnel Les Tamarins', type: 'lycée', commune: 'Saint-Paul', address: '8 chemin des Tamarins', contact: C('M. Hoarau', 'Directeur délégué', '0262 00 00 14', 'ddfpt@lycee-tamarins.exemple.invalid'), date: wd(0), start: '13:30', end: '15:30', required: 3, team: ['ethan', 'hugo'], transport: 'PM', driverId: 'ethan', meeting: { place: 'Parking de la gare de Saint-Paul', time: '12:45' },
        dossier: [item('Fiche d\'animation', 'fiche', 'a_preparer', 'hugo', 'ethan'), item('Supports à imprimer (45 ex.)', 'impression', 'pret', 'ethan', 'ethan'), item('Document à remettre : charte d\'engagement', 'document', 'a_preparer', 'ethan', null)] }),
      IV({ id: 'iv_t3', school: 'École Les Colibris', type: 'école', commune: 'Sainte-Marie', address: '3 rue des Colibris', contact: C('Mme Técher', 'Directrice', '0262 00 00 15', 'direction@ecole-colibris.exemple.invalid'), date: wd(0), start: '13:30', end: '15:30', required: 2, team: ['cheryl', 'racheld'], transport: 'KM', driverId: 'cheryl', meeting: { place: 'Parking du collège Les Letchis, Saint-Denis', time: '13:00' },
        dossier: [item('Fiche d\'animation', 'fiche', 'pret', 'cheryl', 'cheryl'), item('Supports à imprimer (25 ex.)', 'impression', 'pret', 'racheld', 'cheryl'), item('Livret à remettre à l\'enseignante', 'document', 'pret', 'racheld', 'cheryl')] }),
      IV({ id: 'iv_d1', school: 'Lycée Les Hortensias', type: 'lycée', commune: 'Saint-Benoît', address: '18 route des Hortensias', contact: C('Mme Grondin', 'Proviseure adjointe', '0262 00 00 16', 'vie-scolaire@lycee-hortensias.exemple.invalid'), date: wd(1), start: '09:00', end: '11:00', required: 3, team: ['wendy', 'rachelh', 'anais'], transport: 'KM', driverId: 'wendy', meeting: { place: 'Parking de Saint-André', time: '08:15' },
        dossier: [item('Fiche d\'animation', 'fiche', 'pret', 'wendy', 'wendy'), item('Supports à imprimer (40 ex.)', 'impression', 'pret', 'anais', 'anais'), item('Convention à remettre', 'document', 'pret', 'rachelh', 'rachelh')] }),
      IV({ id: 'iv_d2', school: 'École Les Jacarandas', type: 'école', commune: 'Saint-André', address: '7 allée des Jacarandas', contact: C('M. Nirlo', 'Directeur', '0262 00 00 17', 'direction@ecole-jacarandas.exemple.invalid'), date: wd(1), start: '10:00', end: '12:00', required: 2, team: ['emma', 'nathan'], transport: 'KM', driverId: 'emma', meeting: { place: 'Parking de Saint-André', time: '09:30' },
        dossier: [item('Fiche d\'animation', 'fiche', 'pret', 'emma', 'emma'), item('Livret à remettre', 'document', 'a_preparer', 'nathan', 'nathan')] }),
      IV({ id: 'iv_e1', school: 'Collège Les Bois-Rouges', type: 'collège', commune: 'Le Tampon', address: '40 rue des Bois-Rouges', contact: C('Mme Lauret', 'CPE', '0262 00 00 18', 'cpe@college-boisrouges.exemple.invalid'), status: 'brouillon', date: wd(2), start: '13:30', end: '15:30', required: 2, team: ['manon', 'emma'], transport: 'PM', driverId: 'manon', meeting: { place: 'Parking de Saint-Pierre', time: '12:45' } }),
      IV({ id: 'iv_f1', school: 'Lycée Les Cocotiers', type: 'lycée', commune: 'Le Port', address: '2 boulevard des Cocotiers', contact: C('M. Maillot', 'Conseiller principal', '0262 00 00 19', 'cpe@lycee-cocotiers.exemple.invalid'), date: wd(4), start: '08:30', end: '10:30', required: 3, team: ['ethan', 'nathan', 'tom'], transport: 'PM', driverId: 'nathan', meeting: { place: 'La Possession (lieu à convenir)', time: '07:45' },
        dossier: [item('Fiche d\'animation', 'fiche', 'a_preparer', 'ethan', 'nathan'), item('Convention à remettre', 'document', 'a_preparer', 'tom', 'tom')] }),
      IV({ id: 'iv_f2', school: 'École Les Frangipaniers', type: 'école', commune: 'Saint-Louis', address: '15 rue des Frangipaniers', contact: C('Mme Ramin', 'Directrice', '0262 00 00 20', 'direction@ecole-frangipaniers.exemple.invalid'), date: wd(5), start: '10:00', end: '12:00', required: 2, team: ['anais'], transport: '', meeting: { place: '', time: '' } })
    ];
    const meta = (id, d, ta, tb, who, o) => Object.assign({ id, demo: true, vehicle: 'KM', driver: who, date: d, purpose: '', steps: [], odoStart: null, odoEnd: null, manualKm: null, manualReason: '', reimb: { status: 'aucun' }, ivId: null }, o);
    const trips = [
      meta('tr_a', wd(-3), 0, 0, 'adrien', { purpose: 'Livraison de supports à l\'imprimerie', steps: [{ label: 'Local → Imprimerie → Local' }], odoStart: 44980, odoEnd: 45040 }),
      meta('tr_b', wd(-2), 0, 0, 'cheryl', { purpose: 'Tournée : deux établissements du Nord', steps: [{ label: 'Collège Les Letchis (Saint-Denis)', odo: 45075 }, { label: 'École Les Colibris (Sainte-Marie)', odo: 45110 }], odoStart: 45040, odoEnd: 45128 }),
      meta('tr_c', wd(-2), 0, 0, 'ethan', { vehicle: 'PM', purpose: 'Intervention Lycée Les Cocotiers', steps: [{ label: 'Lycée Les Cocotiers (Le Port)' }], odoStart: 31600, odoEnd: 31702 }),
      meta('tr_d', wd(-2), 0, 0, 'anais', { vehicle: 'perso', purpose: 'Aller-retour vers une école (véhicule personnel)', steps: [{ label: 'Saint-Louis → École' }], manualKm: 34, manualReason: 'Estimation du trajet aller-retour (distance routière)', reimb: { status: 'demandée' } }),
      meta('tr_e', wd(-4), 0, 0, 'tom', { vehicle: 'perso', purpose: 'Intervention collège (véhicule personnel)', steps: [{ label: 'Saint-Leu → Collège' }], manualKm: 18, manualReason: 'Estimation du trajet aller-retour', reimb: { status: 'validée' } }),
      meta('tr_f', wd(-1), 0, 0, 'hugo', { purpose: 'Intervention Collège des Alizés', ivId: 'iv_p2', steps: [{ label: 'Local → Collège des Alizés (Le Port)', ivId: 'iv_p2' }], odoStart: 45128, odoEnd: 45082 })
    ];
    const ts = (n, t) => L.iso(wd(n), t);
    const vehicles = {
      KM: { id: 'KM', name: 'KM', model: 'Voiture de fonction KM', plate: 'AA-001-KM (fictive)', authorized: ['cheryl', 'adrien', 'ethan', 'hugo', 'emma', 'wendy'], history: [], custody: { holder: 'adrien', place: 'Local de l\'association', since: ts(0, '08:05'), odo: 45210, pending: null, leftBy: 'hugo', leftAt: ts(-1, '16:10') } },
      PM: { id: 'PM', name: 'PM', model: 'Voiture de fonction PM', plate: 'AA-002-PM (fictive)', authorized: ['ethan', 'emma', 'manon', 'rachelh', 'nathan', 'tom'], history: [], custody: { holder: 'manon', place: 'Parking du collège Les Manguiers, Saint-Pierre', since: ts(-1, '16:40'), odo: 31791, pending: { from: 'manon', to: 'ethan', at: ts(-1, '16:40'), place: 'Parking du collège Les Manguiers, Saint-Pierre', odo: 31791 }, leftBy: 'manon', leftAt: ts(-1, '16:40') } }
    };
    const ev = (veh, at, type, by, place, odo, extra) => vehicles[veh].history.push(Object.assign({ id: L.uid('ev'), at, type, by, place, odo }, extra || {}));
    ev('KM', ts(-1, '12:40'), 'prise', 'hugo', 'Local de l\'association', 45128);
    ev('KM', ts(-1, '16:10'), 'remise', 'hugo', 'Local de l\'association', 45210, { to: null });
    ev('KM', ts(0, '08:05'), 'prise', 'adrien', 'Local de l\'association', 45210);
    ev('PM', ts(-1, '08:20'), 'prise', 'manon', 'Parking de la gare routière, Saint-Pierre', 31702);
    ev('PM', ts(-1, '16:40'), 'remise', 'manon', 'Parking du collège Les Manguiers, Saint-Pierre', 31791, { to: 'ethan' });
    Object.values(vehicles).forEach(v => v.history.reverse());

    const mails = [
      { id: 'ml_1', demo: true, box: 'inbox', from: 'M. Hoarau – Lycée Les Tamarins <ddfpt@lycee-tamarins.exemple.invalid>', to: 'claire@energie-jeune.exemple.invalid', subject: 'Heure d\'arrivée de l\'équipe cet après-midi', at: ts(0, '07:42'), ivId: 'iv_t2', body: 'Bonjour Claire,\n\nPouvez-vous me confirmer l\'heure d\'arrivée de l\'équipe cet après-midi ? La salle polyvalente est disponible dès 13h15. Le parking est accessible par le portail n°2.\n\nCordialement,\nM. Hoarau' },
      { id: 'ml_2', demo: true, box: 'inbox', from: 'Mme Robert – Collège Les Letchis <direction@college-letchis.exemple.invalid>', to: 'claire@energie-jeune.exemple.invalid', subject: 'Changement de salle ce matin', at: ts(-1, '17:20'), ivId: 'iv_t1', body: 'Bonjour,\n\nLa salle initialement prévue est occupée : nous vous accueillerons en salle B12, au premier étage. Merci de prévenir l\'équipe.\n\nBien cordialement,\nMme Robert' },
      { id: 'ml_3', demo: true, box: 'inbox', from: 'Mme Técher – École Les Colibris <direction@ecole-colibris.exemple.invalid>', to: 'claire@energie-jeune.exemple.invalid', subject: 'Possibilité de décaler à jeudi ?', at: ts(-1, '11:05'), ivId: null, body: 'Bonjour Claire,\n\nSi cela est possible, pourrions-nous décaler notre intervention à jeudi après-midi ? Merci de me dire ce qui vous arrange.\n\nMme Técher' },
      { id: 'ml_4', demo: true, box: 'inbox', from: 'Service jeunesse – Mairie <jeunesse@mairie.exemple.invalid>', to: 'claire@energie-jeune.exemple.invalid', subject: 'Présentation de vos actions', at: ts(-2, '15:30'), ivId: null, body: 'Bonjour,\n\nNous souhaiterions une courte présentation de vos actions pour notre prochaine réunion. Pouvez-vous nous indiquer vos disponibilités ?\n\nLe service jeunesse' },
      { id: 'ml_5', demo: true, box: 'sent', from: 'claire@energie-jeune.exemple.invalid', to: 'direction@college-letchis.exemple.invalid', subject: 'Confirmation de l\'intervention – Collège Les Letchis', at: ts(-3, '09:12'), ivId: 'iv_t1', body: 'Bonjour,\n\nNous confirmons notre intervention du jour, de 08h30 à 10h30. L\'équipe sera de 3 volontaires.\n\nCordialement,\nClaire\nÉnergie Jeune', status: 'envoyé (démo)' }
    ];
    const templates = [
      { id: 'tpl_std', name: 'Intervention standard', items: [
        { label: 'Fiche d\'animation', kind: 'fiche', note: 'Déroulé de la séance et consignes' },
        { label: 'Supports à imprimer', kind: 'impression', note: 'Un exemplaire par participant, plus 5 de réserve' },
        { label: 'Document à remettre à l\'établissement', kind: 'document', note: 'Attestation de passage à faire signer' },
        { label: 'Matériel de projection', kind: 'autre', note: 'Câble HDMI, rallonge, enceinte' }] },
      { id: 'tpl_forum', name: 'Forum ou stand', items: [
        { label: 'Fiche stand', kind: 'fiche', note: 'Plan d\'implantation et horaires' },
        { label: 'Flyers à imprimer', kind: 'impression', note: '' },
        { label: 'Convention à remettre', kind: 'document', note: '' }] }
    ];
    // Documents joints fictifs (noms seulement : aucune pièce réelle dans la démo)
    interventions.forEach(i => { i.docs = [{ name: 'Fiche-animation.pdf', private: true }, { name: 'Consignes-accueil.pdf', private: true }]; });

    return {
      v: 1, demo: true,
      settings: { baseCommune: 'Saint-Denis', ratePerKm: null, maxKmDay: 400, returnBuffer: 30, mailboxMode: 'demo', demoOffsetMs: 0 },
      volunteers, interventions, vehicles, trips, mails, templates,
      unavail: [], feed: [
        { id: 'fd_1', at: ts(-1, '16:40'), text: 'Manon a remis les clés de PM à Ethan (Saint-Pierre). Confirmation d\'Ethan attendue.', href: '#/vehicules/PM' },
        { id: 'fd_2', at: ts(0, '08:05'), text: 'Adrien a récupéré KM (compteur 45 210).', href: '#/vehicules/KM' }
      ],
      ui: { role: 'claire' }
    };
  }
  root.EJ = root.EJ || {};
  root.EJ.seed = seed;
  if (typeof module !== 'undefined' && module.exports) module.exports = seed;
})(typeof window !== 'undefined' ? window : globalThis);
