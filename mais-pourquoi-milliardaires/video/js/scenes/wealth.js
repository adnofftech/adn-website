// MODULE « wealth » — scènes 1, 2, 3, 13, 18 : la salle des coffres et sa montagne de billets, le point d'interrogation, la carte du monde et les flux de redistribution.
// Contrat : ../../CONTRACT.md. Fonction pure du temps global t ; aucun état entre deux appels.
import { T, PAL, H, clamp, lerp, sstep, lin, eio, eout, ein, eoutBack, floorTex, glow, glowTex } from "../shared.js";
import { MODULES, windowsOf, onset } from "../plan.js";
import { shotList, evalShots } from "../shots.js";
import { buildHall, buildMountain, updateBills, updateCrowd, MT } from "./wealth_hall.js";
import { buildMap, updateMap, updateS3Fx, updateS13Fx, buildNumbers, updateNumbers, HUB, HERO_XZ, DIVE_XZ, CELLS, TARGETS } from "./wealth_map.js";
import { makeQuestion, pop, mixHex, _c } from "./wealth_lib.js";

export const ID = "wealth";
export const OFFSET = MODULES[ID].offset;
export const WINDOWS = windowsOf(ID);
const [ox, oy, oz] = OFFSET;

// ---- instants-clés (mots de timing.json)
const TM = {
  milliardaires: onset(1, /milliardaires/), donnaient: onset(1, /donnaient/), pauvres: onset(1, /pauvres/),
  non: onset(2, /non/),
  milliers: onset(3, /milliers/), milliards: onset(3, /milliards/), euros: onset(3, /euros/), redis: onset(3, /redistribu/), millions: onset(3, /millions/),
  ventes: onset(13, /ventes/), argent13: onset(13, /argent/), soit: onset(13, /^soit$/),
  tu: onset(18, /^tu$/, 1), ferais: onset(18, /ferais/),
};
const S2 = WINDOWS[0][0] + 5.38, S3 = 7.7, END1 = WINDOWS[0][1];
const QPOS = [0, 12.5];       // (x, z) du point d'interrogation devant la montagne

// ---- ENV : fond + brouillard
export const ENV = (t) => {
  if (t < 51) {
    const cold = sstep(TM.non, TM.non + 0.45, t) * (1 - sstep(7.9, 8.6, t));
    const bg = mixHex(0x020504, 0x040810, cold).getHex();
    const open = sstep(8.0, 9.6, t);
    return { bg: open > 0 ? mixHex(bg, 0x03080a, open).getHex() : bg, fog: lerp(0.0125, 0.0026, open) };
  }
  if (t < 60) { const w = sstep(51.5, 54.2, t); return { bg: mixHex(0x030a0c, 0x0b0703, w).getHex(), fog: 0.0028 }; }
  return { bg: 0x020403, fog: 0.0122 };
};
export const SHAKE = (t) => {
  const imp = (t0, a, d) => (t >= t0 && t < t0 + d ? a * Math.pow(1 - (t - t0) / d, 2) : 0);
  return imp(5.5, 0.2, 0.3) + imp(TM.milliards, 1.2, 0.25) + imp(TM.tu + 0.02, 0.18, 0.3);
};

// ---- caméra (coordonnées MONDE)
const V = (x, y, z) => [x + ox, y + oy, z + oz];
const dvH = (CELLS.find((c) => c.dive) || { h: 1 }).h;
export const SHOTS = [
  // S1 : travelling avant rapide dans la salle, puis convergence vers le point d'interrogation
  { t: 0.0, p: V(0, 2.4, 70), l: V(0, 9.5, 0), f: 62, r: 0 },
  { t: 1.9, p: V(-1.2, 2.9, 59), l: V(0, 9.8, 0), f: 62, r: 0.025 },
  { t: 3.6, p: V(1.0, 3.5, 49), l: V(0, 9.4, 2), f: 60, r: -0.02 },
  { t: 5.1, p: V(0, 4.0, 41.5), l: V(0, 6.8, 9), f: 58, r: 0 },
  // S2 : arrêt brutal, dérive, puis zoom rapide sur le « ? »
  { t: 5.38, p: V(0, 4.1, 40.1), l: V(0, 6.2, 12.5), f: 56, e: eout },
  { t: 5.8, p: V(0, 4.15, 39.4), l: V(0, 6.0, 12.5), f: 56 },
  { t: 6.94, p: V(0, 4.2, 39.0), l: V(0, 6.0, 12.5), f: 56, e: eio },
  { t: 7.56, p: V(0, 5.0, 26.0), l: V(0, 6.0, 12.5), f: 50, e: ein },
  // S3 : recul spectaculaire, carte, chiffres, plongée dans un point chaud
  { t: 7.7, p: V(0, 5.2, 26.4), l: V(0, 6.0, 12.5), f: 50, e: ein },
  { t: 7.98, p: V(0, 12, 50), l: V(0, 8, 6), f: 54, e: eio },
  { t: 8.6, p: V(0, 40, 84), l: V(0, 6, -16), f: 58, e: eio },
  { t: 9.5, p: V(0, 84, 84), l: V(0, 2, -34), f: 58, e: eio },
  { t: 10.6, p: V(0, 100, 56), l: V(0, 2, -47), f: 56 },
  { t: 11.8, p: V(-3, 99, 54), l: V(-1, 2, -47), f: 56, e: eio },
  { t: 12.5, p: V(2, 96, 50), l: V(1, 2, -47), f: 56, e: ein },
  { t: END1 - 0.01, p: V(DIVE_XZ[0] + 0.15, dvH + 1.9, DIVE_XZ[1] + 2.4), l: V(DIVE_XZ[0], dvH + 0.2, DIVE_XZ[1] - 0.6), f: 50 },
  // S13 : réseau froid vu d'en haut, descente vers le hub, un flux jusqu'au bénéficiaire
  { t: 51.3, p: V(-26, 92, 10), l: V(HUB.x, 2, HUB.z), f: 54 },
  { t: 52.4, p: V(-21, 78, -2), l: V(HUB.x, 2, HUB.z), f: 54, e: eio },
  { t: 53.6, p: V(-16, 50, -12), l: V(HUB.x, 3, HUB.z), f: 52, e: eio },
  { t: 53.84, p: V(-14, 42, -14), l: V(HUB.x, 3, HUB.z + 1), f: 52, e: eio },
  { t: 54.12, p: V(-10, 36, -17), l: V(-6, 3, -50), f: 50, e: eio },
  { t: 54.4, p: V(-1, 22, -30), l: V(4.5, 3, -51), f: 44, e: eio },
  { t: 54.6, p: V(6, 9.5, -38), l: V(7, 2.9, -51), f: 42, e: eio },
  { t: 54.77, p: V(HERO_XZ[0], 3.3, HERO_XZ[1] + 11.8), l: V(HERO_XZ[0], 2.0, HERO_XZ[1]), f: 40 },
  // S18 : montagne vue de face, flux, puis rapprochement du « ? »
  { t: 79.16, p: V(0, 3.0, 62), l: V(0, 9.5, 0), f: 62 },
  { t: 81.0, p: V(-1.0, 4.0, 58), l: V(0, 8.6, 4), f: 60, e: eio },
  { t: 82.5, p: V(0.8, 4.6, 54), l: V(0, 7.0, 12.5), f: 56, e: eio },
  { t: 83.5, p: V(0, 4.5, 47), l: V(0, 5.9, 12.5), f: 50, e: eio },
  { t: 83.95, p: V(0, 4.5, 46), l: V(0, 5.7, 12.5), f: 49 },
];
const TR = shotList(SHOTS);
const camPos = (t) => evalShots(t, TR).p;

// ---- construction
export function build() {
  const g = new T.Group(); g.position.set(...OFFSET); const U = g.userData;
  const hemi = new T.HemisphereLight(0xcfeee0, 0x0a2a20, 1.3), sun = new T.DirectionalLight(0xfff0cf, 1.5), pt = new T.PointLight(0xffc34d, 0, 90, 1.5);
  sun.position.set(14, 34, 32); g.add(hemi, sun, pt); U.hemi = hemi; U.sun = sun; U.pt = pt;
  // sol partagé (salle puis fond de carte)
  const ft = floorTex(); ft.repeat.set(60, 60); const floor = new T.Mesh(new T.PlaneGeometry(660, 660), new T.MeshLambertMaterial({ map: ft, color: 0xffffff, emissive: 0x020604 })); floor.rotation.x = -Math.PI / 2; floor.position.set(0, -0.02, -30); g.add(floor); U.floor = floor;
  const { hall, U: hU } = buildHall(); g.add(hall); U.hall = hall; U.hU = hU;
  U.mtn = buildMountain(); g.add(U.mtn);
  const { map, M } = buildMap(); g.add(map); U.map = map; U.M = M;
  const nb = buildNumbers(); g.add(nb.A, nb.B); U.nb = nb;
  // point d'interrogation 3D + ombre portée + onde de choc
  const qm = makeQuestion(); g.add(qm); U.qm = qm;
  const qs = new T.Sprite(new T.SpriteMaterial({ map: glowTex(), color: 0x000000, transparent: true, opacity: 0.5, depthWrite: false })); g.add(qs); U.qs = qs;
  const shock = new T.Mesh(new T.RingGeometry(1, 1.14, 48), new T.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); shock.rotation.x = -Math.PI / 2; g.add(shock); U.shock = shock;
  const qg = glow(0xffc34d, 14, 0); g.add(qg); U.qg = qg;
  const wave = new T.Mesh(new T.RingGeometry(0.965, 1, 90), new T.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); wave.rotation.x = -Math.PI / 2; wave.position.set(0, 0.2, -4); g.add(wave); U.wave = wave;
  return g;
}

// ---- mise à jour (pure)
const warp = (t) => (t <= TM.non ? t : TM.non + (t - TM.non) * 0.1);
export function update(g, t) {
  const { hemi, sun, pt, floor, hall, hU, mtn, map, M, nb, qm, qs, shock, qg, wave } = g.userData;
  const isA = t >= 60, isB = t >= 51 && t < 60, isC = t < 51;     // C : S1-S3 ; B : S13 ; A : S18
  const warm13 = sstep(51.4, 54.0, t);

  // ---------------- lumières
  if (isC) {
    const lamp = 0.55 + 0.45 * sstep(0, 0.3, t); const doubt = sstep(TM.non, TM.non + 0.4, t) * (1 - sstep(7.9, 8.6, t)); const open = sstep(8.0, 9.4, t);
    const goldK = sstep(S2, S2 + 0.3, t) * (1 - sstep(TM.non - 0.02, TM.non + 0.2, t));
    mixHex(0xcfeee0, 0xbfe9d8, open, hemi.color); mixHex(hemi.color.getHex(), 0xffe6b8, goldK * 0.5, hemi.color); mixHex(hemi.color.getHex(), 0x9db8e0, doubt, hemi.color);
    hemi.groundColor.setHex(0x0a2a20); hemi.intensity = (1.25 + 0.2 * goldK - 0.25 * doubt) * lamp;
    mixHex(0xfff0cf, 0xffe0a0, goldK, sun.color); mixHex(sun.color.getHex(), 0xa8c4ff, doubt, sun.color); sun.intensity = (1.55 - 0.4 * doubt) * lamp + 0.0; sun.position.set(14, 34, 32);
    if (open > 0.5) { sun.position.set(-30, 80, 50); sun.color.setHex(0xe6fff4); sun.intensity = 1.5; hemi.intensity = 1.15; }
    pt.color.setHex(doubt > 0.5 ? 0x8fb4ff : 0xffc34d); pt.intensity = (t > S2 && t < 8.4 ? 34 * (1 - 0.5 * doubt) : 0) * (1 - open); pt.position.set(0, 7, 20);
  } else if (isB) {
    mixHex(0x9fd8cc, 0xffdcae, warm13, hemi.color); mixHex(0x0a2420, 0x2a1a08, warm13, hemi.groundColor); hemi.intensity = 0.8 + 0.1 * warm13;
    mixHex(0xb8e6d8, 0xffd9a0, warm13, sun.color); sun.intensity = 0.8 + 0.3 * warm13; sun.position.set(-30, 70, 40);
    pt.color.setHex(0xffc470); pt.position.set(HERO_XZ[0] + 2.5, 4.5, HERO_XZ[1] + 5); pt.intensity = 9 * sstep(54.2, 54.6, t); pt.distance = 40;
  } else {
    const lit = 0.28 + 0.72 * sstep(79.16, 79.45, t);
    hemi.color.setHex(0xcfeee0); hemi.groundColor.setHex(0x0a2a20); hemi.intensity = 1.3 * lit; sun.color.setHex(0xfff0cf); sun.intensity = 1.6 * lit; sun.position.set(14, 34, 40);
    pt.color.setHex(0xffc34d); pt.intensity = 30 * sstep(TM.tu - 0.1, TM.tu + 0.2, t); pt.position.set(0, 8, 24); pt.distance = 90;
  }

  // ---------------- visibilités
  const hallVis = isA || (isC && t < 9.4);
  hall.visible = hallVis; wave.visible = isC && t >= 7.95 && t < 10.2; mtn.visible = isA || (isC && t < END1 + 0.1); map.visible = (isC && t >= 8.0) || isB;
  floor.material.color.setHex(isB ? 0xb8d0c8 : 0xffffff);
  let hk = 1, shellY = 0, ceilY = 0;
  if (isC) { hk = 1 - sstep(8.0, 8.7, t); shellY = -32 * ein(lin(8.8, 9.45, t)); ceilY = 50 * eio(lin(7.95, 8.6, t)); }
  const fL = isC ? ein(lin(7.98, 8.68, t)) : 0, fB = isC ? ein(lin(8.12, 8.82, t)) : 0;
  hU.sideL.rotation.z = (Math.PI / 2) * fL; hU.sideR.rotation.z = -(Math.PI / 2) * fL; hU.back.rotation.x = -(Math.PI / 2) * fB;
  hU.shell.position.y = shellY; hU.ceil.position.y = ceilY; hU.riches.scale.setScalar(Math.max(0.001, hk)); hU.crowd.scale.setScalar(Math.max(0.001, hk));
  hU.shell.visible = shellY > -31; hU.ceil.visible = ceilY < 45;

  // ---------------- montagne
  if (isC) { const s = 1 + 0.55 * eio(lin(7.9, 9.4, t)); mtn.scale.setScalar(s); }
  else if (isA) { const m = eio(lin(79.2, 82.6, t)); mtn.scale.set(1 - 0.08 * m, 1 - 0.24 * m, 1 - 0.08 * m); }

  // ---------------- salle
  if (hallVis) {
    // plafond : les rangées s'allument en 0,3 s à l'ouverture
    const strips = hU.strips; const lampT = isA ? 1 : sstep(0, 0.3, t);
    for (let i = 0; i < hU.stripRows.length; i++) { const r = hU.stripRows[i]; const on = isA ? 1 : 0.14 + 0.86 * sstep(0.02 + r * 0.018, 0.1 + r * 0.018, t); const fl = (0.8 + 0.12 * Math.sin(t * 3 + i)) * 0.9; strips.setColorAt(i, _c.setRGB(on * fl, on * fl * 0.98, on * fl * 0.9)); }
    strips.instanceColor.needsUpdate = true;
    hU.beams.forEach((b, i) => { b.material.opacity = 0.055 * (isA ? 1 : sstep(0.05 + i * 0.04, 0.3 + i * 0.04, t)) * (1 - 0.5 * sstep(TM.non, TM.non + 0.4, t)); });
    // feux de piste : chenillard vers la montagne
    for (let k = 0; k < 17; k++) for (let sd = 0; sd < 2; sd++) { const i = k * 2 + sd; const on = isA ? 1 : 0.1 + 0.9 * sstep(0.1 + k * 0.012, 0.3 + k * 0.012, t); const ch = 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(t * 7 - k * 0.7), 2); const gold = (k % 4 === 0); hU.runway.setColorAt(i, gold ? _c.setRGB(1 * ch * on, 0.78 * ch * on, 0.3 * ch * on) : _c.setRGB(0.25 * ch * on, 0.95 * ch * on, 0.6 * ch * on)); }
    hU.runway.instanceColor.needsUpdate = true;
    // écrans à chiffres : défilement type compteur
    hU.screens.forEach((s) => { s.tx.offset.y = ((t * (0.55 + 0.25 * s.ph) + s.ph) % 1); });
    hU.riches.userData.setAll(hU.riches.userData.cashI, hU.riches.userData.cash, isA ? 99 : t);
    hU.riches.userData.setAll(hU.riches.userData.goldI, hU.riches.userData.gold, isA ? 99 : t);
    hU.riches.userData.setAll(hU.riches.userData.coinI, hU.riches.userData.coin, isA ? -99 : t);   // S18 : pas de piliers de pièces devant la foule
    // joie de la foule : après « donnaient », figée au ralenti après « non ? »
    const joy = isA ? 1 : sstep(3.0, 3.6, t) * (1 - sstep(TM.non, TM.non + 0.25, t)) * (1 - 0.0);
    const tone = isA ? 0 : sstep(TM.non, TM.non + 0.4, t);
    updateCrowd(hU.crowd, isA ? t : t, joy, tone);
    hU.billMat.color.copy(mixHex(0xffffff, 0x9fb4d8, tone, _c));
    updateBills(hU, t, warp(t));
  }

  // ---------------- point d'interrogation
  const q1 = isC && t >= S2 - 0.06 && t < 8.5, q2 = isA && t >= TM.tu - 0.14;
  qm.visible = qs.visible = shock.visible = qg.visible = q1 || q2;
  if (q1 || q2) {
    const t0 = q1 ? S2 : TM.tu - 0.1; const sBase = q1 ? 4.4 : 3.2; const dt = t - t0; const fall = clamp(dt / 0.14); const imp = Math.max(0, dt - 0.14);
    let sc = sBase * lerp(0.3, 1, ein(fall)) * (fall >= 1 ? 1 : 1); let yo = 9 * (1 - fall * fall);
    const squash = 1 - 0.14 * Math.exp(-imp * 10) * Math.cos(imp * 30);
    let ry; const doubt = q1 ? sstep(TM.non, TM.non + 0.4, t) : 0;
    if (q1) { const spin = -0.75 + 0.45 * lin(S2, TM.non, t) + 0.05 * Math.sin(t * 2.3); ry = lerp(spin, 0, eoutBack(lin(TM.non, TM.non + 0.45, t))); }
    else { ry = 0.5 * Math.exp(-imp * 3.5) * Math.cos(imp * 5) + 0.04 * Math.sin(t * 1.6); }
    const shrink = q1 ? 1 - eio(lin(7.95, 8.4, t)) : 1; sc *= Math.max(0.001, shrink);
    const bob = q1 && t < TM.non ? 0.12 * Math.sin(t * 2.3) : 0;
    qm.scale.set(sc, sc * squash, sc); qm.position.set(QPOS[0], 0.55 + 0.875 * sc * squash + yo + bob, QPOS[1]); qm.rotation.set(0, ry, 0);
    const { front, side } = qm.userData; const cold = doubt > 0.35; const nm = cold ? qm.userData.steelMap : qm.userData.goldMap; if (front.map !== nm) { front.map = nm; front.needsUpdate = true; } const fl = q1 ? Math.exp(-Math.pow((t - TM.non - 0.06) / 0.07, 2)) : 0;
    mixHex(0xffffff, 0xdfe9ff, doubt, front.color); mixHex(0x5a3d06, 0x16253f, doubt, front.emissive); front.emissive.lerp(_c.setRGB(0.6, 0.6, 0.7), 0.45 * fl); mixHex(0xb98524, 0x55688a, doubt, side.color); mixHex(0x2c1c02, 0x08101e, doubt, side.emissive);
    qs.position.set(QPOS[0], 0.55 + 0.875 * sc + 1.5 * sc, QPOS[1] - 1.6); qs.scale.setScalar(sBase * 6.4 * Math.max(0.001, shrink)); qs.material.opacity = (0.48 + 0.3 * doubt) * Math.min(1, dt / 0.3);
    qg.position.set(QPOS[0], 0.55 + 0.875 * sc + 1.3 * sc, QPOS[1] + 1.2); qg.scale.setScalar(sBase * 5.2 * Math.max(0.001, shrink)); qg.material.opacity = 0.32 * (1 - doubt) * Math.min(1, dt / 0.3) + 0.12 * doubt; qg.material.color.setHex(doubt > 0.5 ? 0x9bbcff : 0xffc34d);
    const su = clamp(imp / 0.55); shock.position.set(QPOS[0], 0.12, QPOS[1]); shock.scale.setScalar(1 + 13 * eout(su)); shock.material.opacity = fall >= 1 ? 0.9 * (1 - su) : 0;
  }

  // ---------------- onde de choc au recul (révèle la carte)
  if (wave.visible) { const R = 78 * (t - 7.98); wave.scale.setScalar(Math.max(0.01, R)); wave.material.opacity = 0.9 * (1 - lin(7.98, 10.1, t)); }
  // ---------------- carte S3 / S13
  if (map.visible) {
    const cam = evalShots(t, TR);
    if (isC) {
      updateMap(M, t, 3, 0); updateS3Fx(M, t); M.fB.group.visible = false; M.hero.visible = false; M.hub.visible = false; M.pBody.visible = M.pHead.visible = M.bars.visible = M.stock.visible = false;
      nb.A.visible = nb.B.visible = t >= TM.milliers - 0.02; if (nb.A.visible) updateNumbers(nb, t, cam);
    } else {
      updateMap(M, t, 13, warm13); M.fA.group.visible = false; M.dive.visible = false; M.diveFill.visible = false; M.hub.visible = true; M.pBody.visible = M.pHead.visible = M.bars.visible = M.stock.visible = true; nb.A.visible = nb.B.visible = false;
      updateS13Fx(M, t, warm13, [cam.p[0] - ox, cam.p[1] - oy, cam.p[2] - oz]);
    }
  } else { nb.A.visible = nb.B.visible = false; }
}
