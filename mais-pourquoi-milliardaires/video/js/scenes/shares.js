// MODULE « shares » — scènes 5, 6, 7 : billet suspendu → action → graphique → marché ; le coffre qui s'ouvre sur un univers d'actions ; l'entreprise éclatée en parts.
// Contrat : ../../CONTRACT.md. Fonction pure du temps global t ; aucun état entre deux appels.
import { T, PAL, H, clamp, lerp, sstep, lin, eio, eout, ein, eoutBack, mk, billTex, glowTex, FONT, MONO, textPlane, glow } from "../shared.js";
import { MODULES, windowsOf, onset } from "../plan.js";
import { shotList, evalShots } from "../shots.js";
import { certTex } from "../shared.js";
import { _o, mixHex, pop, popAt, put, hide, inst, lam, bas, addMat, rep, uvScale, chartTex, gridTex } from "./shares_lib.js";
import { buildZone, updateZone, HZ } from "./shares_vault.js";
import { buildS7, updateS7 } from "./shares_s7.js";

export const ID = "shares";
export const OFFSET = MODULES[ID].offset;
export const WINDOWS = windowsOf(ID);
const [ox, oy, oz] = OFFSET;
const [W0, W1] = WINDOWS[0];

// ---- instants-clés (mots de timing.json)
const o5 = (re, k = 0) => onset(5, re, k), o6 = (re, k = 0) => onset(6, re, k), o7 = (re, k = 0) => onset(7, re, k);
const TM = {
  mais: W0, enorme: o5(/enorme/), probleme: o5(/probleme/), auquel: o5(/auquel/), pense: o5(/^pense$/),
  S6: 21.18, fortune: o6(/fortune/), milliardaires: o6(/milliardaires/), ce: o6(/^ce$/), juste: o6(/juste/), argent: o6(/argent/), dans6: o6(/^dans$/), coffre: o6(/coffre/),
  S7: 24.34, grande: o7(/grande/), partie: o7(/partie/), est: o7(/^est$/), investie: o7(/investie/), dans7: o7(/^dans$/), des: o7(/^des$/), entreprises: o7(/entreprises/), sous: o7(/^sous$/), forme: o7(/forme/), actions: o7(/actions/),
};
const VX = 500;                                            // décalage local de la zone coffre / univers / réseau
const Mw = (x, y, z) => [x + ox, y + oy, z + oz];           // repère marché -> monde
const Vw = (x, y, z) => [x + ox + VX, y + oy, z + oz];       // repère coffre -> monde

// ---- caméra : Hermite (tangentes de Catmull-Rom), clés [{t, v:[px,py,pz,lx,ly,lz,fov,roll], z?:arrêt}]
function spl(t, keys) {
  const n = keys.length; if (t <= keys[0].t) return keys[0].v.slice(); if (t >= keys[n - 1].t) return keys[n - 1].v.slice();
  let i = 0; while (t > keys[i + 1].t) i++;
  const a = keys[i], b = keys[i + 1], dt = b.t - a.t, u = (t - a.t) / dt;
  const tan = (idx) => { const k = keys[idx]; if (k.z) return k.v.map(() => 0); const p = keys[Math.max(0, idx - 1)], q = keys[Math.min(n - 1, idx + 1)], d = q.t - p.t; return d ? k.v.map((_, j) => (q.v[j] - p.v[j]) / d) : k.v.map(() => 0); };
  const ma = tan(i), mb = tan(i + 1), u2 = u * u, u3 = u2 * u, h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
  return a.v.map((_, j) => h00 * a.v[j] + h10 * dt * ma[j] + h01 * b.v[j] + h11 * dt * mb[j]);
}
const HERO_C = [0, 3, 0];                                  // billet / action / graphique (repère marché)
const OR_T = [-6, 5, -30];                               // cible de regard en fin de rotation
const cam5 = (t) => {
  const zoom = eio(lin(18.74, 19.02, t)), back = eio(lin(19.04, 19.55, t)), push = eio(lin(19.55, 19.96, t));
  const e = eio(lin(19.9, 21.17, t)), az = 2.15 * e;
  const r0 = lerp(3.3, 2.0, zoom) + 0.7 * back - 0.25 * push, r = r0 + 23.6 * Math.pow(e, 1.35), h = 15 * Math.pow(e, 1.25);
  const look = e;                                          // le regard glisse du billet vers le marché
  const sway = 0.1 * Math.sin((t - 19.0) * 3.1) * sstep(19.02, 19.3, t) * (1 - e);
  const px = HERO_C[0] + r * Math.sin(az) + sway, py = HERO_C[1] + h + 0.05 * (1 - zoom), pz = HERO_C[2] + r * Math.cos(az);
  const lx = lerp(HERO_C[0], OR_T[0], look), ly = lerp(HERO_C[1], OR_T[1], look), lz = lerp(HERO_C[2], OR_T[2], look);
  const roll = -0.05 * Math.sin(Math.PI * zoom) * (1 - e) + 0.05 * Math.sin(Math.PI * e);
  const fov = lerp(40, 36, zoom) + 22 * Math.pow(e, 1.3);
  return [...Mw(px, py, pz), ...Mw(lx, ly, lz), fov, roll];
};
// S6 + S7 : plans clés (repère coffre -> monde)
const K = (t, p, l, f, r = 0, z = false) => ({ t, v: [...Vw(...p), ...Vw(...l), f, r], z });
const CAM67 = [
  K(21.18, [9.5, 3.2, 40], [0, 13, 0], 56, 0.03),
  K(21.8, [7.4, 4.6, 39], [0, 13, 0], 54, 0.015),
  K(22.4, [5.0, 6.4, 38], [1.5, 12.4, 0], 52, 0),
  K(23.0, [3.0, 8.2, 31], [0.6, 11.6, -4], 52, 0),
  K(23.44, [0.8, 10.0, 21], [0, 10.8, -14], 56, 0),
  K(23.62, [0, 10.5, 9], [0, 10.5, -30], 60, 0),
  K(23.9, [0, 10.5, -22], [0, 10.5, -60], 64, 0),
  K(24.1, [0, 24, -44], [0, 6, -90], 62, 0),
  K(24.34, [0, 34, -58], [0, 6, -106], 60, 0),
  K(24.76, [20, 20, -70], [0, 10, -110], 54, 0),
  K(25.1, [23, 15, -70], [1, 11, -111], 52, 0),
  K(25.45, [24, 15, -77], [9.25, 14.5, -103], 46, 0),
  K(25.95, [21, 15.5, -80], [8, 15, -103], 46, 0),
  K(26.5, [3, 14, -68], [0, 9, -110], 52, 0),
  K(26.84, [-10, 15, -69], [0, 8, -110], 56, 0),
  K(27.2, [-3, 12, -78], [0, 8, -106], 52, 0),
  K(27.64, [0, 8.4, -88], [0, 8.2, -102.4], 50, 0),
];
// ---- ENV / SHAKE
export const ENV = (t) => {
  if (t < TM.S6 - 0.005) {
    const cold = sstep(19.2, 20.2, t);
    return { bg: mixHex(0x030509, 0x061326, cold).getHex(), fog: lerp(0.018, 0.0085, cold) };
  }
  if (t < TM.S7 - 0.2) { const k = sstep(23.3, 24.0, t); return { bg: mixHex(0x05080b, 0x030812, k).getHex(), fog: lerp(0.0035, 0.0065, k) }; }
  return { bg: 0x040a15, fog: 0.0075 };
};
export const SHAKE = (t) => {
  const imp = (t0, a, d) => (t >= t0 && t < t0 + d ? a * Math.pow(1 - (t - t0) / d, 2) : 0);
  return imp(W0 + 0.02, 0.03, 0.22) + imp(23.3, 0.2, 0.3);
};

// ---- caméra complète : échantillonnée (1/60 s) en clés linéaires
function camAt(t) {
  if (t < TM.S6 - 0.004) return cam5(t);
  return spl(t, CAM67);
}
function sampleShots() {
  const out = [], dt = 1 / 60;
  const push = (t) => { const v = camAt(t); out.push({ t, p: [v[0], v[1], v[2]], l: [v[3], v[4], v[5]], f: v[6], r: v[7] }); };
  for (let t = W0; t < 21.17 - 1e-6; t += dt) push(t);
  push(21.17);
  for (let t = 21.18; t < W1 - 1e-6; t += dt) push(t);
  push(W1 - 0.01);
  return out;
}
export const SHOTS = sampleShots();
const TR = shotList(SHOTS);

// =====================================================================================================================
// MARCHÉ (S5)
// =====================================================================================================================
function buildMarket() {
  const g = new T.Group(), M = {};
  // sol quadrillé froid (translucide : reflets des chandeliers)
  const gt = gridTex(); rep(gt, 70, 70);
  M.floor = new T.Mesh(new T.PlaneGeometry(700, 700), new T.MeshBasicMaterial({ map: gt, transparent: true, opacity: 0.88, depthWrite: true })); M.floor.rotation.x = -Math.PI / 2; M.floor.position.y = 0; g.add(M.floor);
  // forêt de chandeliers (anneaux) : corps + mèches
  const R = 8, rows = []; let N = 0;
  for (let r = 0; r < R; r++) { const rho = 30 + r * 8, n = Math.round((2 * Math.PI * rho) / 4.3); rows.push([rho, n, N]); N += n; }
  M.N = N; M.rows = rows;
  const bodyG = new T.BoxGeometry(1, 1, 1), wickG = new T.BoxGeometry(1, 1, 1);
  M.bodies = inst(bodyG, new T.MeshLambertMaterial({ color: 0xffffff, emissive: 0x0a2a24 }), N);
  M.wicks = inst(wickG, new T.MeshBasicMaterial({ color: 0x8fe9ff }), N);
  M.mirror = new T.InstancedMesh(bodyG, new T.MeshBasicMaterial({ color: 0x1b3550 }), N); M.mirror.frustumCulled = false; M.mirror.instanceMatrix = M.bodies.instanceMatrix; M.mirror.scale.y = -1; g.add(M.mirror);
  M.can = [];
  const col = new T.Color();
  rows.forEach(([rho, n, base], r) => {
    for (let i = 0; i < n; i++) {
      const k = base + i, phi = (i / n) * 6.283 + H(r, 9) * 0.3, nz = clamp(0.5 + 0.28 * Math.sin(phi * 4 + r * 2.1) + 0.2 * Math.sin(phi * 9 + r * 0.7) + 0.25 * (H(k, 5) - 0.5), 0.06, 1);
      const hh = (2.2 + 8 * nz) * (0.7 + 0.03 * (rho - 30)), w = 1.5 + 0.05 * (rho - 30), up = H(k, 6) > 0.3;
      M.can.push({ x: Math.sin(phi) * (rho + (H(k, 3) - 0.5) * 2), z: Math.cos(phi) * (rho + (H(k, 3) - 0.5) * 2), h: hh, w, d0: 19.55 + ((rho - 30) / 56) * 0.75 + H(k, 1) * 0.18 });
      M.bodies.setColorAt(k, col.setHex(up ? 0x1fcf93 : 0xff4057).multiplyScalar(0.55 + 0.6 * nz));
    }
  });
  g.add(M.bodies, M.wicks);
  // écrans de cotation
  M.screens = []; const stexs = [1, 2, 3, 4, 5, 6].map((s) => chartTex(s, ["BOURSE", "INDICE", "ACTIONS", "MARCHÉ", "COURS", "BOURSE"][s - 1]));
  for (let i = 0; i < 6; i++) {
    const a = i * 1.047 + 0.35, s = new T.Group(); s.position.set(Math.sin(a) * 37, 12 + (i % 2) * 2.5, Math.cos(a) * 37); s.rotation.y = a + Math.PI;
    const fr = new T.Mesh(new T.BoxGeometry(14.8, 9.4, 0.5), lam(0x0e1a2a, 0x04101c)); s.add(fr);
    const sc = new T.Mesh(new T.PlaneGeometry(14, 8.75), new T.MeshBasicMaterial({ map: stexs[i] })); sc.position.z = 0.27; s.add(sc);
    const scan = new T.Mesh(new T.PlaneGeometry(0.22, 8.75), addMat(0x9fe8ff, 0.5)); scan.position.z = 0.3; s.add(scan);
    g.add(s); M.screens.push({ g: s, scan, ph: H(i, 4) });
  }
  // étincelles du marché
  const NP = 260, pp = new Float32Array(NP * 3); M.pBase = []; for (let i = 0; i < NP; i++) { const a = H(i, 1) * 6.283, rr = 6 + H(i, 2) * 70; M.pBase.push([Math.sin(a) * rr, 1 + H(i, 3) * 28, Math.cos(a) * rr, H(i, 4) * 6.283]); }
  const pg = new T.BufferGeometry(); pg.setAttribute("position", new T.BufferAttribute(pp, 3)); M.pts = new T.Points(pg, new T.PointsMaterial({ map: glowTex(), size: 0.9, color: 0x7fe9ff, transparent: true, opacity: 0.8, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true })); M.pts.frustumCulled = false; g.add(M.pts);
  // bokeh chaud « gelé » (la scène précédente) + poussière en suspension
  M.bokeh = []; for (let i = 0; i < 16; i++) { const s = glow(i % 3 ? 0xffb866 : 0xe8832a, 3.5 + H(i, 1) * 5, 0.26); s.position.set((H(i, 2) - 0.5) * 16, H(i, 3) * 8, -9 - H(i, 4) * 14); g.add(s); M.bokeh.push(s); }
  const ND = 90, dp = new Float32Array(ND * 3); const dg = new T.BufferGeometry(); dg.setAttribute("position", new T.BufferAttribute(dp, 3)); M.dust = new T.Points(dg, new T.PointsMaterial({ map: glowTex(), size: 0.05, color: 0xffe2b0, transparent: true, opacity: 0.85, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true })); M.dust.frustumCulled = false; g.add(M.dust);
  // le billet / l'action / le graphique
  const hero = new T.Group(); hero.position.set(...HERO_C); g.add(hero); M.hero = hero;
  const billT = billTex(), certT = certTex("ACTION"), chartT = chartTex(7, "BOURSE");
  M.tex = { bill: billT, chart: chartT };
  M.faceA = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: billT })); M.faceA.scale.set(1.3, 0.58, 1); hero.add(M.faceA);
  M.faceB = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: certT })); M.faceB.scale.set(1.3, 0.81, 1); M.faceB.rotation.y = Math.PI; hero.add(M.faceB);
  M.hGlow = glow(0xffd27a, 6, 0.4); M.hGlow.position.set(...HERO_C); M.hGlow.position.z -= 0.15; g.add(M.hGlow);
  M.rings = [0xffe2a0, 0xbfffe6, 0x9fe8ff].map((c) => { const m = new T.Mesh(new T.RingGeometry(0.92, 1.0, 72), addMat(c, 0)); m.position.set(HERO_C[0], HERO_C[1], HERO_C[2] - 0.03); g.add(m); return m; });
  M.shards = inst(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ color: 0xffffff, side: T.DoubleSide }), 48); const sc2 = new T.Color();
  for (let i = 0; i < 48; i++) M.shards.setColorAt(i, sc2.setHex(i < 24 ? (i % 3 ? 0x2f9d5e : 0xf1d58a) : (i % 3 ? 0xf3ecd4 : 0x6fd7ff))); g.add(M.shards);
  g.userData = M; return g;
}
function updateMarket(U, t, cam) {
  const M = U.M, hero = M.hero, A0 = TM.mais, EN = TM.enorme, PB = TM.probleme;
  // ----- billet -> action -> graphique
  const f1 = eio(lin(EN, EN + 0.4, t)), f2 = eio(lin(PB, PB + 0.4, t)), rot = Math.PI * (f1 + f2);
  const breath = sstep(A0 + 0.25, A0 + 0.9, t) * (1 - sstep(18.74, 19.0, t));
  const pulse = 1 + 0.16 * Math.sin(Math.PI * clamp((t - EN) / 0.4)) + 0.16 * Math.sin(Math.PI * clamp((t - PB) / 0.4));
  const grow = eio(lin(19.96, 21.1, t));
  const sc = 0.62 * pulse * (1 + 7.5 * grow);
  hero.scale.setScalar(sc);
  hero.rotation.set(0.012 * Math.sin((t - A0) * 2.1) * breath, rot, 0.01 * Math.sin((t - A0) * 1.7) * breath);
  hero.position.set(HERO_C[0], HERO_C[1] + 0.012 * Math.sin((t - A0) * 2.4) * breath + 0.0, HERO_C[2]);
  const chartPhase = t >= EN + 0.4 + 0.05;
  M.faceA.material.map = chartPhase ? M.tex.chart : M.tex.bill; M.faceA.scale.set(1.3, chartPhase ? 0.81 : 0.58, 1);
  M.hGlow.position.set(HERO_C[0], HERO_C[1], HERO_C[2] - 1.3 * sc);
  M.hGlow.scale.setScalar(6.2 * sc * (0.9 + 0.1 * Math.sin(t * 4)) * (1 + 0.4 * grow)); M.hGlow.material.opacity = (0.34 + 0.4 * Math.sin(Math.PI * clamp((t - EN) / 0.5)) + 0.3 * Math.sin(Math.PI * clamp((t - PB) / 0.5))) * (1 - 0.7 * grow);
  M.hGlow.material.color.setHex(t < PB + 0.1 ? 0xffd27a : 0x7fe9ff);
  // anneaux d'impact : l'arrêt (le billet se fige), puis chaque transformation
  [[A0 + 0.02, 0.5, 1.7, 0.5], [EN + 0.17, 0.7, 2.3, 0.55], [PB + 0.17, 0.7, 2.5, 0.55]].forEach(([t0, s0, s1, o], i) => {
    const u = clamp((t - t0) / 0.55), m = M.rings[i]; m.visible = u > 0 && u < 1; m.position.set(HERO_C[0], HERO_C[1], HERO_C[2] - 0.03); m.scale.setScalar((s0 + (s1 - s0) * eout(u)) * 0.62 * (1 + 7.5 * grow)); m.material.opacity = o * (1 - u) * (1 - u);
  });
  // éclats
  const nS = 24;
  for (let b = 0; b < 2; b++) {
    const t0 = b ? PB + 0.17 : EN + 0.17, tau = t - t0;
    for (let j = 0; j < nS; j++) {
      const i = b * nS + j;
      if (tau < 0 || tau > 0.7) { hide(M.shards, i); continue; }
      const a = H(i, 1) * 6.283, sp = (0.9 + H(i, 2) * 1.9) * 0.62 * (1 + 7.5 * grow), life = 1 - tau / 0.7, d = sp * (1 - Math.pow(1 - tau / 0.7, 2)) * 0.7;
      put(M.shards, i, hero.position.x + Math.cos(a) * d, hero.position.y + Math.sin(a) * d * 0.8, hero.position.z + (H(i, 3) - 0.5) * 0.6, (0.07 + H(i, 4) * 0.1) * life * 0.62 * (1 + 7.5 * grow), (0.04 + H(i, 5) * 0.05) * life * 0.62 * (1 + 7.5 * grow), 1, 0, 0, a + tau * (3 + 5 * H(i, 6)));
    }
  }
  M.shards.instanceMatrix.needsUpdate = true;
  // ----- bokeh chaud et poussière (le décor chaud est « gelé » puis disparaît)
  const bk = (1 - sstep(18.95, 19.7, t)) * 0.9;
  M.bokeh.forEach((s, i) => { s.material.opacity = 0.3 * bk * (0.7 + 0.3 * Math.sin(i * 2 + (t - A0) * 0.0)); s.visible = bk > 0.01; });
  { const a = M.dust.geometry.attributes.position, v = sstep(18.7, 19.3, t) * (t - 18.7); for (let i = 0; i < 90; i++) a.setXYZ(i, HERO_C[0] + (H(i, 1) - 0.5) * 5 + 0.15 * Math.sin(v * 0.9 + i), HERO_C[1] + (H(i, 2) - 0.5) * 3 + 0.12 * Math.cos(v * 0.8 + i * 1.3), HERO_C[2] + (H(i, 3) - 0.6) * 4 - v * 0.0); a.needsUpdate = true; M.dust.material.opacity = 0.85 * (1 - sstep(19.4, 20.0, t)); M.dust.visible = M.dust.material.opacity > 0.01; }
  // ----- marché : sol, chandeliers, écrans, étincelles
  const rise = sstep(19.45, 20.1, t);
  M.floor.visible = rise > 0.001; M.floor.material.opacity = 0.88 * rise; M.floor.material.color.setScalar(0.35 + 0.65 * rise);
  const vis = t >= 19.5; M.bodies.visible = M.wicks.visible = M.mirror.visible = vis;
  if (vis) {
    for (let k = 0; k < M.N; k++) {
      const c = M.can[k], s = pop((t - c.d0) / 0.55);
      if (s <= 0.001) { hide(M.bodies, k); hide(M.wicks, k); continue; }
      put(M.bodies, k, c.x, (c.h * s) / 2, c.z, c.w, c.h * s, c.w); put(M.wicks, k, c.x, c.h * s * 0.7, c.z, 0.12, c.h * s * 1.35, 0.12);
    }
    M.bodies.instanceMatrix.needsUpdate = true; M.wicks.instanceMatrix.needsUpdate = true;
  }
  M.screens.forEach((s, i) => { const k = pop((t - (19.75 + i * 0.07)) / 0.45); s.g.visible = k > 0.01; s.g.scale.setScalar(Math.max(0.001, k)); s.scan.position.x = (((t * 0.18 + s.ph) % 1) - 0.5) * 13.6; });
  { const a = M.pts.geometry.attributes.position; for (let i = 0; i < 260; i++) { const b = M.pBase[i]; a.setXYZ(i, b[0], b[1] + 0.7 * Math.sin(t * 0.8 + b[3]), b[2]); } a.needsUpdate = true; M.pts.visible = rise > 0.1; M.pts.material.opacity = 0.8 * rise; }
}

// =====================================================================================================================
export function build() {
  const g = new T.Group(); g.position.set(...OFFSET); const U = g.userData;
  const hemi = new T.HemisphereLight(0x8fb0ff, 0x08121c, 0.9), sun = new T.DirectionalLight(0xbfd4ff, 1.0), pt = new T.PointLight(0x6fe7ff, 0, 80, 1.5);
  sun.position.set(-20, 40, 30); g.add(hemi, sun, sun.target, pt); U.hemi = hemi; U.sun = sun; U.pt = pt;
  U.gM = buildMarket(); U.M = U.gM.userData; g.add(U.gM);
  U.gV = buildZone(); U.gV.position.set(VX, 0, 0); U.Z = U.gV.userData; g.add(U.gV);
  U.g7 = buildS7(); U.g7.position.set(HZ[0], 0, HZ[2]); U.S7 = U.g7.userData; U.gV.add(U.g7);
  return g;
}
export function update(g, t) {
  const U = g.userData, cam = evalShots(t, TR);
  const inM = t < TM.S6 - 0.004, inV = !inM;
  U.gM.visible = inM; U.gV.visible = inV;
  if (inM) {
    const cold = sstep(19.2, 20.2, t), lit = 0.25 + 0.75 * cold;
    U.hemi.color.setHex(0x8fb0ff); U.hemi.groundColor.setHex(0x0a1a2a); U.hemi.intensity = 1.0 * lit; U.sun.color.setHex(0xaecbff); U.sun.intensity = 1.1 * lit; U.sun.position.set(-20, 40, 30); U.sun.target.position.set(0, 0, 0); U.pt.intensity = 0;
    updateMarket(U, t, cam);
  } else {
    const open = sstep(TM.ce + 0.1, TM.ce + 0.9, t), after = sstep(TM.juste, TM.juste + 0.5, t);
    mixHex(0xa8bccd, 0x9fc4e8, after, U.hemi.color); U.hemi.groundColor.setHex(0x1a1a14); U.hemi.intensity = lerp(0.85, 1.05, after);
    mixHex(0xfff0d0, 0xcfe0ff, after, U.sun.color); U.sun.intensity = 1.2; U.sun.position.set(VX - 20, 40, 40); U.sun.target.position.set(VX, 0, -20);
    mixHex(0x7dffb2, 0xffd27a, after, U.pt.color); U.pt.position.set(VX, 10, 9); U.pt.distance = 60; U.pt.intensity = 30 * open * (1 - 0.6 * after) + 6;
    updateZone(U.Z, t, TM, cam);
    U.g7.visible = t >= TM.S7 - 0.05; if (U.g7.visible) updateS7(U.S7, t, TM, cam, [ox + VX + HZ[0], oy, oz + HZ[2]]);
  }
}
