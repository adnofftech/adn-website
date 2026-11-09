const assert=require('assert');
const L=require('../logic.js'); globalThis.__L=L; const seed=require('../data.js');
const S=seed(); const now=L.nowParts(0);
const real=L.nowParts(0);
// horloge de démo 09:30
const n={date:real.date,time:'09:30'};
let t=0; const ok=(c,m)=>{assert(c,m);t++};
// dates
ok(L.holiday('2026-11-11')==='Armistice 1918','férié 11/11');
ok(L.holiday('2026-04-06')==='Lundi de Pâques','Pâques 2026');
ok(L.addDays('2026-11-09',7)==='2026-11-16','addDays');
ok(L.dow('2026-11-09')===1,'dow lundi');
ok(L.weekStart('2026-11-12')==='2026-11-09','weekStart');
ok(L.workday('2026-11-10',1)==='2026-11-12','jour ouvré saute le férié');
ok(/^\d{4}-\d{2}-\d{2}$/.test(L.nowParts(0).date),'fuseau');
// seed
ok(S.volunteers.length===12,'12 volontaires');
ok(S.volunteers.some(v=>v.name==='Rachel (H)')&&S.volunteers.some(v=>v.name==='Rachel (D)'),'Rachel H/D');
// km
ok(L.tripKm({odoStart:100,odoEnd:160}).km===60,'km compteurs');
ok(L.tripKm({manualKm:'12'}).source==='saisie','km manuel');
ok(L.tripKm({}).source==='manquant','km manquant');
const bad=S.trips.find(x=>x.id==='tr_f'); ok(L.tripIssues(S,bad).some(i=>/inférieur/.test(i.text)),'incohérence détectée');
// chevauchement de compteurs
const S2=seed(); S2.trips.push({id:'x',vehicle:'KM',driver:'cheryl',date:S2.trips[0].date,purpose:'t',steps:[],odoStart:45000,odoEnd:45050,reimb:{status:'aucun'}});
ok(L.tripIssues(S2,S2.trips.find(x=>x.id==='x')).some(i=>/deux fois/.test(i.text)),'double comptage détecté');
// étapes ne s'additionnent pas
const tb=S.trips.find(x=>x.id==='tr_b'); ok(L.tripKm(tb).km===88,'tournée = 88 km'); ok(L.tripLegs(tb).join()==='35,35,18','étapes visibles');
ok(L.tripIssues(S,tb).length===0,'tournée sans anomalie');
// remboursement
const tp=S.trips.find(x=>x.id==='tr_e'); ok(L.reimb(S,tp).amount===null,'sans tarif : pas de montant');
S.settings.ratePerKm=0.5; ok(L.reimb(S,tp).amount===9,'tarif défini + validé'); ok(L.reimb(S,S.trips.find(x=>x.id==='tr_d')).amount===null,'non validé : pas de montant'); S.settings.ratePerKm=null;
// CSV
const csv=L.csv(S,{from:'',to:'',vehicle:'KM',vol:'all'}); ok(csv.split('\r\n').length===1+S.trips.filter(x=>x.vehicle==='KM').length,'csv filtre véhicule'); ok(csv.includes('Sans objet'),'csv colonne remboursement séparée');
ok(L.csv(S,{vehicle:'all',vol:'anais'}).split('\r\n').length===2,'csv filtre volontaire');
// alertes
const al=L.alerts(S,n); const kinds=al.map(a=>a.id.slice(0,2)); 
['eq','dr','cl','do','km','tp'].forEach(k=>ok(kinds.includes(k),'alerte '+k));
ok(al.every(a=>a.href.startsWith('#/')),'chaque alerte a un lien');
// garde des clés : une réservation future ne change pas le détenteur
const ci=L.custodyInfo(S,'PM',n); ok(ci.status==='a_confirmer'&&ci.pending.to==='ethan','PM à confirmer');
const before=S.vehicles.KM.custody.holder; S.interventions.push({id:'iv_new',school:'X',commune:'Saint-Denis',date:n.date,start:'16:00',end:'17:00',required:1,team:['hugo'],driverId:'hugo',transport:'KM',status:'publiée',meeting:{},dossier:[],log:[]});
ok(S.vehicles.KM.custody.holder===before,'réservation n\'écrase pas le détenteur');
ok(L.custodyInfo(S,'KM',n).next.driver==='cheryl','prochain preneur = Cheryl');
// actions clés
let r=L.actions.take(S,'KM','hugo',{at:'x',odo:45300,place:'a'}); ok(!r.ok,'Hugo ne peut pas prendre KM détenue par Adrien');
r=L.actions.take(S,'KM','anais',{at:'x',odo:1}); ok(!r.ok&&/habilité/.test(r.error),'non habilité');
r=L.actions.handOver(S,'KM','adrien',{at:n.date+'T10:40',place:'Parking Letchis',odo:45290,to:'cheryl'}); ok(r.ok,'remise Adrien→Cheryl');
ok(S.vehicles.KM.custody.pending.to==='cheryl','en attente de confirmation');
r=L.actions.take(S,'KM','cheryl',{at:n.date+'T10:50',odo:45290,place:'Parking Letchis'}); ok(r.ok&&S.vehicles.KM.custody.holder==='cheryl','Cheryl confirme');
r=L.actions.handOver(S,'KM','cheryl',{at:n.date+'T16:00',place:'x',odo:45200,to:'hugo'}); ok(!r.ok&&r.needsForce,'compteur inférieur refusé');
r=L.actions.correct(S,'KM',{holder:'hugo',place:'Local',odo:'',reason:'',at:'x'}); ok(!r.ok,'motif obligatoire');
r=L.actions.correct(S,'KM',{holder:'hugo',place:'Local',odo:'',reason:'Erreur de saisie',at:n.date+'T12:00'}); ok(r.ok&&S.vehicles.KM.history[0].type==='correction','correction historisée');
// suggestion
const sg=L.suggest(S,{id:null,school:'Y',commune:'Saint-Denis',date:L.workday(n.date,2),start:'09:00',end:'11:00',required:3,team:[],transport:'KM',driverId:null});
ok(sg.team.length===3&&S.vehicles.KM.authorized.includes(sg.driver),'suggestion : 3 volontaires dont conducteur habilité');
ok(sg.meeting&&sg.meetingReason.length>10,'RDV expliqué'); ok(Object.keys(sg.reasons).length===3,'explications par volontaire');
// chevauchements
const iv=S.interventions.find(i=>i.id==='iv_t3'); ok(L.volConflicts(S,'cheryl',Object.assign({},iv,{id:'z',start:'14:00',end:'16:00'})).length>=1,'chevauchement personne');
ok(L.vehConflicts(S).some(c=>c.veh==='KM'),'double réservation KM');
// dossiers
ok(L.dossierState(S.interventions.find(i=>i.id==='iv_t2'))==='a_preparer','état dossier');
const it=S.interventions.find(i=>i.id==='iv_t3').dossier[2]; ok(L.canAdvance(S,iv,it,'cheryl')==='emporte'&&!L.canAdvance(S,iv,it,'tom'),'seul le transporteur marque emporté');
console.log('OK',t,'vérifications');
