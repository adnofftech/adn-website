// MODULE « market » — scènes 8 (tout le monde veut vendre), 9 (pas assez d'acheteurs), 10 (la chute des cours). Fenêtre [27.64, 38.46].
import { T, H, kf, eio, eout, ein, eoutBack, lin, sstep, clamp, lerp, lam, basic, PAL, makePerson, SKIN, textPlane, glow, certTex, mk, FONT, MONO } from "../shared.js";
import { MODULES, windowsOf, onset } from "../plan.js";
export const ID = "market";
export const OFFSET = MODULES[ID].offset;
export const WINDOWS = windowsOf(ID);
const [ox, oy, oz] = OFFSET;
const BX = 50;                                   // zone B (balance + graphique) décalée en x
const PS = 1.95;                                 // échelle des milliardaires (S8)
const BEAMY = 6.0;                               // hauteur du fléau de la balance
const NV = 10, VX0 = 1.3, VDX = 0.68, VBASE = 1.7;   // blocs de valeur (S10) : nombre, x de départ, pas, ligne de base
const T8 = onset(8, /milliardaires/), TV = onset(8, /vendre/), TA = onset(8, /actions/), TM = onset(8, /moment/);
const T9V = onset(9, /vendre/), T9M = onset(9, /^mais$/), T9F = onset(9, /forcement/), T9A = onset(9, /acheteurs/);
const T10P = onset(10, /prix/), T10E = onset(10, /effondrer/), T10S = onset(10, /resultat/);

export const ENV = (t) => ({ bg: t < 32.56 ? 0x050912 : 0x070a14, fog: 0.008 });
// léger tremblement uniquement sur l'impact de la chute (S10)
export const SHAKE = (t) => (t > T10E && t < T10E + 0.55 ? 0.22 * (1 - (t - T10E) / 0.55) : 0);

const gridTex = () => mk(512, 512, (g, w, h) => { g.fillStyle = "#050a14"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(90,140,255,.22)"; g.lineWidth = 2; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); } }, { repeat: [16, 16] });
const canvasTex = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace; return { c, g: c.getContext("2d"), tx }; };

// ---------------- historique de prix illustratif (aucune valeur réelle) ----------------
const noise = (u, s) => Math.sin(u * 37 + s) * 0.35 + Math.sin(u * 91 + s * 2) * 0.2 + Math.sin(u * 13 + s * 3) * 0.45;
const CH0 = 33.6;                                   // origine (virtuelle) de la courbe : le graphique apparaît vers 34,1 avec déjà un historique
/** niveau normalisé (0 bas … 1 haut) à l'instant historique tau, vu depuis l'instant présent t */
const F = (tau) => 0.74 + 0.045 * noise(tau * 1.7, 1) - 0.09 * eio(lin(35.0, 35.66, tau)) - 0.10 * eio(lin(T10P, T10E, tau)) - 0.55 * eio(lin(T10E - 0.04, T10E + 0.62, tau)) + 0.012 * noise(tau * 9, 4) * (1 - lin(T10E, T10E + 0.6, tau));
const xfrac = (tau) => 0.04 + 0.9 * lin(CH0, 38.5, tau);                // position horizontale (0..1) du point d'instant tau
const CHY0 = 15.75, CHW = 18, CHH = 31.5;                               // panneau : bas posé sur le sol
const pxOf = (fr) => 60 + fr * (1024 - 160), pyOf = (v) => 1500 - v * 1140;
const worldX = (px) => (px - 512) / 1024 * CHW, worldY = (py) => CHY0 + (896 - py) / 1792 * CHH;
export const tipAt = (t) => { const tau = Math.max(CH0, t); return [worldX(pxOf(xfrac(tau))), worldY(pyOf(F(tau)))]; };

export function build() {
  const g = new T.Group(); g.position.set(...OFFSET); const U = g.userData;
  g.add(new T.HemisphereLight(0xa8c0ff, 0x14142a, 1.25));
  const key = new T.DirectionalLight(0xdbe6ff, 0.75); key.position.set(8, 16, 14); g.add(key);
  U.redLight = new T.PointLight(0xff3b30, 0, 60, 1.5); U.redLight.position.set(0, 8, 8); g.add(U.redLight);
  // sol de marché (grille bleue)
  const fl = new T.Mesh(new T.PlaneGeometry(260, 160), new T.MeshLambertMaterial({ map: gridTex() })); fl.rotation.x = -Math.PI / 2; fl.position.set(BX / 2 + 10, 0, 0); g.add(fl);

  // ============ ZONE A : grand écran de marché (S8) ============
  const scr = canvasTex(768, 1024); U.scr = scr;
  const screen = new T.Mesh(new T.PlaneGeometry(10.5, 14), new T.MeshBasicMaterial({ map: scr.tx })); screen.position.set(0, 8.6, 0); g.add(screen); U.screen = screen;
  const frame = new T.Mesh(new T.BoxGeometry(11.1, 14.6, 0.5), lam(0x0b1020, 0x050810)); frame.position.set(0, 8.6, -0.3); g.add(frame);
  const trim = new T.Mesh(new T.BoxGeometry(11.4, 0.18, 0.7), new T.MeshBasicMaterial({ color: 0x6b5522 })); trim.position.set(0, 1.2, -0.1); g.add(trim);
  for (const x of [-4.4, 4.4]) { const leg = new T.Mesh(new T.BoxGeometry(0.5, 1.3, 0.5), lam(0x1a2030)); leg.position.set(x, 0.65, -0.3); g.add(leg); }
  U.glowRed = glow(0xff3b30, 30, 0); U.glowRed.position.set(0, 8.6, 1.2); g.add(U.glowRed);
  // certificat qui se glisse dans l'écran (raccord avec « shares »)
  U.cert = new T.Mesh(new T.PlaneGeometry(4.8, 3), new T.MeshBasicMaterial({ map: certTex("ACTION"), side: T.DoubleSide })); g.add(U.cert);
  // milliardaires (silhouettes dorées) — se lèvent sur « tous les milliardaires »
  U.bill = []; const NB = 9;
  for (let i = 0; i < NB; i++) {
    const p = makePerson({ skin: SKIN[i % SKIN.length], shirt: i % 2 ? 0x4a4a60 : 0x3a3f55, pants: 0x23263a, scale: PS, kind: "adult" }); p.position.set(-9 + i * 2.25, 0, 13 + (i % 3) * 0.9); p.rotation.y = Math.PI; g.add(p);
    const halo = glow(PAL.gold, 4.2, 0.5); halo.position.set(0, 2.0, -0.4); p.add(halo);
    // liseré doré sur les épaules (visible de dos, la caméra voit leur dos)
    const sh = new T.Mesh(new T.BoxGeometry(0.74, 0.08, 0.5), new T.MeshBasicMaterial({ color: 0xc9983a })); sh.position.set(0, 1.5, 0); p.add(sh);
    U.bill.push(p);
  }
  // blocs rouges lancés vers l'écran (instanciés)
  const NR = 420; U.NR = NR;
  U.sell = new T.InstancedMesh(new T.BoxGeometry(0.7, 0.5, 0.5), new T.MeshLambertMaterial({ color: 0xff4a3d, emissive: 0x5a0e08 }), NR); U.sell.frustumCulled = false; g.add(U.sell);
  // flèches descendantes rouges (instanciées)
  const NA = 90; U.NA = NA;
  U.arrows = new T.InstancedMesh(new T.ConeGeometry(0.55, 1.1, 3), new T.MeshBasicMaterial({ color: 0xff4a3d }), NA); U.arrows.frustumCulled = false; g.add(U.arrows);

  // ============ ZONE B : balance + deux zones (S9) ============
  const bx = BX;
  const zoneL = new T.Mesh(new T.PlaneGeometry(12, 36), new T.MeshBasicMaterial({ color: 0xff4a3d, transparent: true, opacity: 0.18 })); zoneL.rotation.x = -Math.PI / 2; zoneL.position.set(bx - 6.1, 0.03, 14); g.add(zoneL); U.zoneL = zoneL;
  const zoneR = new T.Mesh(new T.PlaneGeometry(12, 36), new T.MeshBasicMaterial({ color: 0x4a8cff, transparent: true, opacity: 0.18 })); zoneR.rotation.x = -Math.PI / 2; zoneR.position.set(bx + 6.1, 0.03, 14); g.add(zoneR);
  const div = new T.Mesh(new T.BoxGeometry(0.2, 0.2, 36), new T.MeshBasicMaterial({ color: PAL.mint })); div.position.set(bx, 0.1, 14); g.add(div);
  U.haloL = glow(0xff3b30, 16, 0.4); U.haloL.position.set(bx - 5.5, 3, 4); g.add(U.haloL); U.haloR = glow(0x4a8cff, 12, 0.35); U.haloR.position.set(bx + 5.5, 2.5, 4); g.add(U.haloR);
  // balance (fléau haut, plateaux suspendus par des chaînes qui convergent vers un point d'attache unique)
  const bal = new T.Group(); bal.position.set(bx, 0, 4); g.add(bal); U.bal = bal;
  const post = new T.Mesh(new T.CylinderGeometry(0.3, 0.45, BEAMY, 18), new T.MeshPhongMaterial({ color: 0xc9d4da, shininess: 90 })); post.position.y = BEAMY / 2; bal.add(post);
  const base = new T.Mesh(new T.CylinderGeometry(1.6, 1.9, 0.5, 24), new T.MeshPhongMaterial({ color: 0x8a97a0, shininess: 70 })); base.position.y = 0.25; bal.add(base);
  const pivot = new T.Mesh(new T.SphereGeometry(0.5, 18, 12), new T.MeshPhongMaterial({ color: PAL.gold, shininess: 100, emissive: 0x2a1c00 })); pivot.position.y = BEAMY; bal.add(pivot);
  const beam = new T.Group(); beam.position.y = BEAMY; bal.add(beam); U.beam = beam;
  beam.add(new T.Mesh(new T.BoxGeometry(9.0, 0.3, 0.4), new T.MeshPhongMaterial({ color: PAL.gold, shininess: 100, emissive: 0x2a1c00 })));
  const mkPan = (x, col) => { const pg = new T.Group(); pg.position.set(x, 0, 0); beam.add(pg);
    // 4 chaînes : du point d'attache (0,0,0) au bord du plateau (rayon 1.5, 3 plus bas)
    const CL = Math.hypot(1.5, 3), ang = Math.atan2(1.5, 3);
    for (const s of [-1, 1]) {
      const cx = new T.Mesh(new T.CylinderGeometry(0.045, 0.045, CL, 6), basic(0xdfe6ea)); cx.position.set(s * 0.75, -1.5, 0); cx.rotation.z = s * ang; pg.add(cx);
      const cz = new T.Mesh(new T.CylinderGeometry(0.045, 0.045, CL, 6), basic(0xdfe6ea)); cz.position.set(0, -1.5, s * 0.75); cz.rotation.x = -s * ang; pg.add(cz);
    }
    const hook = new T.Mesh(new T.SphereGeometry(0.17, 10, 8), basic(PAL.gold)); pg.add(hook);
    const pan = new T.Mesh(new T.CylinderGeometry(1.9, 1.7, 0.25, 28), new T.MeshPhongMaterial({ color: col, shininess: 60 })); pan.position.y = -3.0; pg.add(pan); return { pg, pan }; };
  U.panL = mkPan(-3.8, 0xc23a30); U.panR = mkPan(3.8, 0x3a6ad0);
  U.panLoadL = new T.InstancedMesh(new T.BoxGeometry(0.8, 0.6, 0.6), new T.MeshLambertMaterial({ color: 0xff4a3d, emissive: 0x8a2016 }), 36); U.panLoadL.frustumCulled = false; U.panL.pg.add(U.panLoadL);
  U.panLoadR = new T.InstancedMesh(new T.BoxGeometry(0.8, 0.6, 0.6), new T.MeshLambertMaterial({ color: 0x6a9cff, emissive: 0x2a56c0 }), 6); U.panLoadR.frustumCulled = false; U.panR.pg.add(U.panLoadR);
  // pluie de blocs rouges (vendeurs, côté gauche) et bleus (acheteurs, côté droit)
  const NS = 560, NU = 14; U.NS = NS; U.NU = NU;
  U.sellers = new T.InstancedMesh(new T.BoxGeometry(0.9, 0.7, 0.7), new T.MeshLambertMaterial({ color: 0xff4a3d, emissive: 0x8a2016 }), NS); U.sellers.frustumCulled = false; g.add(U.sellers);
  U.buyers = new T.InstancedMesh(new T.BoxGeometry(0.9, 0.7, 0.7), new T.MeshLambertMaterial({ color: 0x6a9cff, emissive: 0x2a56c0 }), NU); U.buyers.frustumCulled = false; g.add(U.buyers);
  U.lblL = textPlane("À VENDRE", { w: 3.4, h: 0.9, px: 640, color: "#ff6a5d", size: 0.62 }); U.lblL.position.set(bx - 3.0, 9.0, 4); g.add(U.lblL);
  U.lblR = textPlane("ACHETEURS", { w: 3.4, h: 0.9, px: 640, color: "#8ab4ff", size: 0.5 }); U.lblR.position.set(bx + 3.0, 9.0, 4); g.add(U.lblR);
  // nuance (directive : ce n'est pas une certitude, c'est un scénario où l'offre dépasse la demande aux prix précédents)
  U.note1 = textPlane("offre > demande aux prix précédents", { w: 9.6, h: 0.56, px: 1536, color: "#cfe0ff", size: 0.72, weight: 700, bg: "rgba(5,9,20,0.62)" }); U.note1.position.set(bx, 10.5, 4); g.add(U.note1);
  U.note2 = textPlane("scénario hypothétique", { w: 6.0, h: 0.56, px: 960, color: "#9db4e0", size: 0.72, weight: 700, bg: "rgba(5,9,20,0.62)" }); U.note2.position.set(bx, 9.93, 4); g.add(U.note2);

  // ============ graphique géant en fond (S9 fin → S10) ============
  const ch = canvasTex(1024, 1792); U.ch = ch;
  const chart = new T.Mesh(new T.PlaneGeometry(18, 31.5), new T.MeshBasicMaterial({ map: ch.tx, transparent: true, opacity: 0 })); chart.position.set(bx, CHY0, -12); g.add(chart); U.chart = chart;
  U.chartGlow = glow(0xff3b30, 22, 0); U.chartGlow.position.set(bx + 6, 8, -11.5); g.add(U.chartGlow);
  // blocs de valeur posés sur la ligne de base du graphique (se contractent après la chute)
  U.vals = []; for (let i = 0; i < NV; i++) { const m = new T.Mesh(new T.BoxGeometry(1, 1, 1), lam(0x3a7bff, 0x0a1a4a)); m.position.set(bx + VX0 + i * VDX, VBASE, -11.4); g.add(m); U.vals.push(m); }
  return g;
}

// ---------------------------------------------------------------- dessin des écrans
function drawScreen(U, t) {
  const { g: c } = U.scr; const W = 768, Hh = 1024;
  const p = kf(t, [[28.0, 0], [30.12, 0.25], [31.44, 0.8], [32.5, 1]]);
  c.fillStyle = `rgb(${8 + 40 * p | 0},${12 - 4 * p | 0},${24 - 8 * p | 0})`; c.fillRect(0, 0, W, Hh);
  // grande flèche ▼ qui pulse avec la pression (en fond, bas de l'écran)
  c.textAlign = "right"; c.fillStyle = `rgba(255,74,61,${0.12 + 0.5 * p})`; c.font = `900 ${200 + 90 * p}px ${FONT}`; c.fillText("▼", W - 20, 1010 - 25 * (0.5 + 0.5 * Math.sin(t * 8)));
  // en-tête (s'efface quand le titre du monteur arrive : sinon deux textes se chevauchent)
  c.globalAlpha = 1 - 0.85 * sstep(30.0, 30.4, t); c.fillStyle = "#101a30"; c.fillRect(0, 0, W, 64); c.fillStyle = "#8ab4ff"; c.font = `700 25px ${MONO}`; c.textAlign = "left"; c.fillText("MARCHÉ · ORDRES DE VENTE (simulation)", 20, 42); c.globalAlpha = 1;
  // courbe de fond (prix précédent) : plate, puis qui fléchit sous la pression de vente
  c.strokeStyle = "rgba(71,240,160,.6)"; c.lineWidth = 6; c.beginPath(); for (let i = 0; i <= 60; i++) { const u = i / 60; const y = 168 + 18 * noise(u * 2, 3) + 50 * p * sstep(0.25, 1, u); i ? c.lineTo(30 + u * 708, y) : c.moveTo(30, y); } c.stroke();
  c.fillStyle = "rgba(255,255,255,.35)"; c.font = `700 20px ${MONO}`; c.fillText("prix précédents", 30, 100);
  // bande haute assombrie pendant le titre du monteur (30,1 -> 32,5) : le texte clair reste lisible sur l'écran
  if (t > 30.0) { c.fillStyle = `rgba(4,8,16,${0.6 * sstep(30.0, 30.5, t)})`; c.fillRect(0, 64, W, 246); }
  // lignes d'ordres de vente : leur nombre explose (2 colonnes, dès « tous les milliardaires »)
  const rate = kf(t, [[28.1, 0], [28.6, 3], [29.4, 9], [30.12, 15], [31.44, 40]]); const nRows = Math.min(20, Math.floor(rate * 1.15));
  const sc = Math.floor(t * (6 + 40 * p)); c.font = `700 20px ${MONO}`; c.textAlign = "left";
  for (let r = 0; r < nRows; r++) { const idx = sc - r; const w = 150 + 180 * H(idx, 7); const x0 = r % 2 ? 392 : 30; const y = 236 + Math.floor(r / 2) * 32; c.fillStyle = `rgba(255,${74 + 40 * H(idx, 3) | 0},61,${0.92 - Math.floor(r / 2) * 0.03})`; c.fillRect(x0, y, w, 26); c.fillStyle = "#fff"; c.fillText("VENTE", x0 + 8, y + 20); c.fillStyle = "#ffb3aa"; c.fillText("▼", x0 + w + 6, y + 21); }
  // jauge d'ordres (illustrative, sans valeur : accélère) — placée dans le haut de l'écran pour rester hors de la bande des sous-titres
  const fr = kf(t, [[28.2, 0], [30.12, 0.22], [31.44, 0.62], [32.5, 1]]);
  c.fillStyle = "#ff6a5d"; c.font = `900 30px ${FONT}`; c.textAlign = "left"; c.fillText("ORDRES DE VENTE", 30, 592);
  c.textAlign = "right"; c.font = `900 34px ${FONT}`; c.fillText("▲".repeat(1 + Math.floor(fr * 4.99)), W - 30, 594);
  const NC = 24, cw = 708 / NC; for (let i = 0; i < NC; i++) { const on = Math.max(0, Math.min(1, fr * NC - i)); c.fillStyle = on > 0 ? `rgba(255,${Math.round(200 - 130 * i / NC)},${Math.round(70 - 30 * i / NC)},${0.3 + 0.7 * on})` : "rgba(255,255,255,.10)"; c.fillRect(30 + i * cw, 606, cw - 5, 46); }
  c.fillStyle = "rgba(255,255,255,.72)"; c.font = `700 25px ${MONO}`; c.textAlign = "left"; c.fillText("jauge illustrative · scénario hypothétique", 30, 690);
  U.scr.tx.needsUpdate = true;
}
function drawChart(U, t) {
  const { g: c } = U.ch; const W = 1024, Hh = 1792;
  c.fillStyle = "#060b18"; c.fillRect(0, 0, W, Hh);
  c.strokeStyle = "rgba(90,140,255,.2)"; c.lineWidth = 2; for (let i = 0; i <= 12; i++) { c.beginPath(); c.moveTo(0, i * Hh / 12); c.lineTo(W, i * Hh / 12); c.stroke(); } for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(i * W / 8, 0); c.lineTo(i * W / 8, Hh); c.stroke(); }
  // flux de chiffres qui défilent vers le bas et DIMINUENT (sans unité : ce n'est pas un cours réel)
  const fA = T10E - 0.2, fB = T10E + 1.2; const fall = lin(fA, fB, t);
  const scroll = 50 * (t - 35) + 1100 * (t < fA ? 0 : t < fB ? ((t - fA) ** 2) / (2 * (fB - fA)) : (fB - fA) / 2 + (t - fB));   // position intégrée (pas de saccade)
  c.font = `700 30px ${MONO}`; c.textAlign = "right";
  for (let k = 0; k < 44; k++) { const y = (((k * 43 + scroll) % Hh) + Hh) % Hh; const v = Math.floor((100 + Math.floor(H(k, 5) * 900)) * (1 - 0.65 * fall)); c.fillStyle = `rgba(${138 + 117 * fall | 0},${180 - 106 * fall | 0},${255 - 194 * fall | 0},${0.12 + 0.55 * fall * H(k, 4)})`; c.fillText("▼ " + v, k % 2 ? W - 190 : W - 330, y); }
  const red = lin(T10P - 0.2, T10E + 0.1, t); const tau1 = Math.max(CH0 + 0.01, t); const pts = [];
  for (let tau = CH0; tau < tau1 - 0.01; tau += 0.02) pts.push([pxOf(xfrac(tau)), pyOf(F(tau))]); pts.push([pxOf(xfrac(tau1)), pyOf(F(tau1))]);
  c.beginPath(); c.moveTo(pts[0][0], 1700); pts.forEach(([x, y]) => c.lineTo(x, y)); c.lineTo(pts[pts.length - 1][0], 1700); c.closePath(); c.fillStyle = `rgba(${60 + 195 * red | 0},${160 - 110 * red | 0},${110 - 60 * red | 0},0.16)`; c.fill();
  for (const [lw, a] of [[34, 0.10], [20, 0.22], [10, 1]]) { c.strokeStyle = red > 0.5 ? `rgba(255,74,61,${a})` : `rgba(71,240,160,${a})`; c.lineWidth = lw; c.lineJoin = "round"; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); }
  const tip = pts[pts.length - 1]; c.fillStyle = "#fff"; c.beginPath(); c.arc(tip[0], tip[1], 18, 0, 7); c.fill();
  U.ch.tx.needsUpdate = true;
}

// ---------------------------------------------------------------- mise à jour (fonction pure de t)
const o = new T.Object3D();
export function update(g, t) {
  const U = g.userData;
  const inA = t < 32.56;
  // ---- ZONE A
  drawScreen(U, t);
  const p = kf(t, [[28.0, 0], [30.12, 0.25], [31.44, 0.8], [32.5, 1]]);
  U.redLight.intensity = 110 * p; U.glowRed.material.opacity = 0.55 * p;
  // certificat qui se glisse dans l'écran (27.64 -> 28.2) puis devient un ordre
  const cu = lin(27.64, 28.25, t); U.cert.visible = t < 28.3; U.cert.position.set(0, 8.6, lerp(8, 0.4, ein(cu))); U.cert.scale.setScalar(lerp(1, 0.55, ein(cu)));
  // milliardaires qui se lèvent
  U.bill.forEach((b, i) => { const u = eoutBack(lin(T8 + i * 0.07 - 0.5, T8 + i * 0.07 + 0.15, t)); b.scale.setScalar(Math.max(0.001, PS * u)); b.userData.armL.rotation.z = 0.12 - 1.2 * lin(TV - 0.05 + i * 0.03, TV + 0.4 + i * 0.03, t) * (t < TM + 0.7 ? 1 : 0.7); b.userData.armR.rotation.z = -0.12 + 1.2 * lin(TV - 0.05 + i * 0.03, TV + 0.4 + i * 0.03, t); b.visible = inA; });
  // blocs rouges lancés depuis chaque milliardaire vers l'écran, puis qui retombent en tas devant
  let n = 0; const ts = t - TV;
  if (ts > 0 && inA) for (let i = 0; i < U.NR; i++) {
    const gap = 0.06 * Math.pow(0.992, i); const s = TV + i * gap * 0.9 + (i > 200 ? 0 : 0) - (i > 140 ? 0.0 : 0) ; const s2 = i < 160 ? s : TV + 0.8 + 0.0035 * (i - 160) ;   // flot dense, puis « au même moment » : tous ensemble
    const tau = t - s2; if (tau < 0) continue;
    const from = U.bill[i % 9].position; const tx = (H(i, 1) - 0.5) * 10, ty = 1.8 + H(i, 2) * 8.4; const T1 = 0.55;
    let x, y, z;
    if (tau < T1) { const u = tau / T1; x = lerp(from.x, tx, u); y = lerp(2.6, ty, u) + Math.sin(Math.PI * u) * 2.2; z = lerp(from.z - 0.5, 0.6, u); }
    else { const f = tau - T1; const lx = tx + (H(i, 3) - 0.5) * 2, lz = 1.5 + H(i, 4) * 5.5; const ly = 0.35 + Math.floor(H(i, 5) * 4) * 0.52; const k = Math.min(1, f / 0.5); x = lerp(tx, lx, k); z = lerp(0.6, lz, k); y = lerp(ty, ly, k * k); }
    o.position.set(x, y, z); o.rotation.set(tau * 5, tau * 3, 0); o.scale.setScalar(1); o.updateMatrix(); U.sell.setMatrixAt(n++, o.matrix);
  }
  U.sell.count = n; U.sell.instanceMatrix.needsUpdate = true; U.sell.visible = inA;
  let na = 0; if (t > T8 - 0.2 && inA) for (let i = 0; i < U.NA; i++) { const s = T8 - 0.18 + i * 0.05; const tau = t - s; if (tau < 0) continue; const x = (H(i, 6) - 0.5) * 15, z = 1.0 + H(i, 7) * 2.5; const y = 15 - ((tau * (6 + 8 * H(i, 8))) % 15); o.position.set(x, y, z); o.rotation.set(Math.PI, 0, 0); o.scale.setScalar(0.6 + 0.6 * H(i, 9)); o.updateMatrix(); U.arrows.setMatrixAt(na++, o.matrix); }
  U.arrows.count = na; U.arrows.instanceMatrix.needsUpdate = true; U.arrows.visible = inA;
  U.screen.visible = inA; U.cert.visible = U.cert.visible && inA;

  // ---- ZONE B : balance
  const tilt = 0.05 + 0.42 * sstep(32.5, 34.6, t) - 0.03 * sstep(34.8, 35.3, t) + 0.02 * Math.sin((t - 33.2) * 9) * lin(33.0, 34.0, t) * (1 - lin(34.4, 35.2, t));
  U.beam.rotation.z = tilt; // côté gauche (-x) descend quand rotation.z > 0
  U.panL.pg.rotation.z = -tilt; U.panR.pg.rotation.z = -tilt;
  // charges des plateaux (le plateau des vendeurs se remplit vite, celui des acheteurs reste léger)
  const nl = Math.floor(36 * lin(32.4, 34.2, t)); for (let i = 0; i < 36; i++) { const L = Math.floor(i / 9), j = i % 9; o.position.set((j % 3 - 1) * 0.62, -2.55 + 0.5 * L, (Math.floor(j / 3) - 1) * 0.55); o.scale.setScalar(i < nl ? 1 : 0.001); o.rotation.set(0, 0, 0); o.updateMatrix(); U.panLoadL.setMatrixAt(i, o.matrix); } U.panLoadL.instanceMatrix.needsUpdate = true;
  const nr = Math.floor(6 * lin(33.5, 34.9, t)); for (let i = 0; i < 6; i++) { o.position.set((i % 3 - 1) * 0.62, -2.55 + 0.5 * Math.floor(i / 3), 0); o.scale.setScalar(i < nr ? 1 : 0.001); o.rotation.set(0, 0, 0); o.updateMatrix(); U.panLoadR.setMatrixAt(i, o.matrix); } U.panLoadR.instanceMatrix.needsUpdate = true;
  // pluie de vendeurs (gauche, déjà en l'air à la coupe) qui s'amoncelle vite ; acheteurs (droite) rares et lents mais bien visibles
  let ns = 0; if (t >= 32.5) for (let i = 0; i < U.NS; i++) { const s = 32.0 + i * 0.0034; const tau = t - s; if (tau < 0) continue; const hx = BX - 0.8 - H(i, 1) * 5.6, hz = -3 + H(i, 2) * 5; const tf = 0.8; const dxh = Math.abs(hx - (BX - 3.6)) / 3.0; const hy = 0.4 + Math.min(4.6, Math.max(0, 1 - dxh) * 4.2 * H(i, 3) + 0.6 * Math.floor(H(i, 4) * 3)); const u = Math.min(1, tau / tf); o.position.set(hx, lerp(16.5, Math.max(0.4, hy), u * u), hz); o.rotation.set(tau * (1 - u) * 6, tau * 2, 0); o.scale.setScalar(1); o.updateMatrix(); U.sellers.setMatrixAt(ns++, o.matrix); }
  U.sellers.count = ns; U.sellers.instanceMatrix.needsUpdate = true;
  let nb2 = 0; if (t >= 32.5) for (let i = 0; i < U.NU; i++) { const s = 32.95 + i * 0.2; const tau = t - s; if (tau < 0) continue; const hx = BX + 1.8 + H(i, 11) * 4.0, hz = 0.5 + H(i, 12) * 5.5; const hy = 0.45 + 0.8 * Math.floor(H(i, 13) * 2); const u = Math.min(1, tau / 0.7); o.position.set(hx, lerp(14, hy, u * u), hz); o.rotation.set(0, tau, 0); o.scale.setScalar(1.15); o.updateMatrix(); U.buyers.setMatrixAt(nb2++, o.matrix); }
  U.buyers.count = nb2; U.buyers.instanceMatrix.needsUpdate = true;
  const zoneIn = t >= 32.5; [U.bal, U.sellers, U.buyers, U.zoneL, U.haloL, U.haloR].forEach((m) => { m.visible = zoneIn && t < 35.4; });
  // étiquettes + nuance « scénario » : en fondu, retirées avant la plongée vers le graphique
  const lblA = 1 - sstep(34.3, 34.65, t), noteA = sstep(33.6, 33.9, t) * lblA;
  [U.lblL, U.lblR].forEach((m) => { m.visible = zoneIn && lblA > 0.01; m.material.opacity = lblA; }); [U.note1, U.note2].forEach((m) => { m.visible = zoneIn && noteA > 0.01; m.material.opacity = noteA; });
  // ---- graphique (S9 fin -> S10) : apparaît en fondu derrière la balance, avec déjà un historique de prix
  drawChart(U, t);
  const chA = sstep(34.1, 34.6, t); U.chart.visible = chA > 0.01; U.chart.material.opacity = chA; U.chartGlow.visible = t >= 34.7;
  U.chartGlow.material.opacity = 0.6 * lin(T10P, T10E + 0.4, t);
  // blocs de valeur posés sur la ligne de base : se contractent juste après la chute (sans valeur chiffrée)
  const sh = eio(lin(T10E + 0.15, T10E + 0.9, t)); U.vals.forEach((m, i) => { const h = Math.max(0.05, 3.4 * (0.55 + 0.45 * H(i, 21)) * (1 - 0.68 * sh * (0.7 + 0.3 * H(i, 22)))); const wv = sstep(35.4, 35.9, t); m.scale.set(0.54 * Math.max(wv, 0.001), h, 0.5 * Math.max(wv, 0.001)); m.position.y = VBASE + h / 2; m.visible = wv > 0.01; m.material.color.setHex(sh > 0.3 ? 0xff5a4a : 0x3a7bff); m.material.emissive.setHex(sh > 0.3 ? 0x5a1008 : 0x0a1a4a); });
}

// ---------------------------------------------------------------- caméra
const ST = 27.64, EN = 38.46;
// position verticale de la pointe du graphique en monde (pour suivre la chute) : panneau h=31.5 centré en y=6 -> y_monde = 6 + (896 - tipY)/1792*31.5
const tipWorld = (t) => { const present = kf(t, [[32.6, 0.02], [35.3, 0.18], [T10S + 0.4, 0.5], [T10P, 0.62], [T10E, 0.78], [T10E + 0.6, 0.95]]); const pr = 0.74 + 0.05 * noise(present * 3, 1) - 0.10 * lin(T10P, T10E, t) * present - 0.55 * eio(lin(T10E - 0.05, T10E + 0.55, t)) * sstep(0.55, 1, present) - 0.12 * lin(T10P, T10E, t) * sstep(0.7, 1, present); const tipY = 1500 - pr * (1500 - 360) * 1.0; return 6 + (896 - tipY) / 1792 * 31.5; };
export const SHOTS = [
  // S8 : travelling arrière depuis l'écran portrait, panoramique vers les milliardaires, orbite latérale autour de l'écran
  { t: ST, p: [ox + 0, oy + 8.6, oz + 15], l: [ox + 0, oy + 8.6, oz], f: 48, e: eio },
  { t: 28.7, p: [ox - 2, oy + 9, oz + 28], l: [ox, oy + 8, oz], f: 52, e: eio },
  { t: T8 - 0.1, p: [ox - 3, oy + 4.5, oz + 27], l: [ox - 1, oy + 4.5, oz + 8], f: 56, e: eio },
  { t: TV, p: [ox + 3, oy + 6, oz + 29], l: [ox, oy + 7, oz + 2], f: 56, e: eio },
  { t: TA, p: [ox + 14, oy + 9, oz + 24], l: [ox - 1, oy + 8, oz], f: 56, e: eio },
  { t: 32.55, p: [ox - 13, oy + 10, oz + 24], l: [ox, oy + 8, oz], f: 58, e: ein },
  // S9 : cut sur la balance entière (les deux plateaux dans le cadre, centrée à gauche de la marge droite), push-in lent, puis envol vers le graphique
  { t: 32.56, p: [ox + BX + 0.9, oy + 8.4, oz + 26.5], l: [ox + BX + 0.9, oy + 3.0, oz + 4], f: 60 },
  { t: 33.72, p: [ox + BX + 0.9, oy + 8.0, oz + 25.5], l: [ox + BX + 0.9, oy + 3.1, oz + 4], f: 58, e: eio },
  { t: T9F, p: [ox + BX + 0.9, oy + 7.8, oz + 25], l: [ox + BX + 0.9, oy + 3.4, oz + 4], f: 56, e: eio },
  { t: 34.75, p: [ox + BX + 0.3, oy + 10.5, oz + 21], l: [ox + BX - 1.0, oy + 11.0, oz - 12], f: 56, e: eio },
  // S10 : on arrive face au graphique, la caméra suit la pointe pendant la chute
  { t: 35.66, p: [ox + BX, oy + 13, oz + 8], l: [ox + BX - 2, oy + 13, oz - 12], f: 52, e: eio },
];
// suivi de la pointe de la courbe : clés linéaires (pas d'easing : sinon la caméra accélère/freine par saccades), pas de 0,05 s autour de la chute.
// La visée est SOUS la pointe (lead) pour que le point reste dans le tiers haut du cadre, sans anticipation excessive.
const trk = []; for (let tt = 36.3; tt < T10E - 0.25; tt += 0.1) trk.push(tt); for (let tt = T10E - 0.25; tt < T10E + 0.95; tt += 0.05) trk.push(tt); for (let tt = T10E + 0.95; tt <= EN - 0.02; tt += 0.1) trk.push(tt);
for (const tt of trk) {
  const [tx, ty] = tipAt(tt + 0.03); const k = sstep(T10E - 0.7, T10E + 0.15, tt);
  const dist = lerp(17, 10.5, k); const lead = -lerp(1.0, 1.5, sstep(T10E - 0.5, T10E - 0.05, tt));
  SHOTS.push({ t: +tt.toFixed(3), p: [ox + BX + tx * 0.92, oy + ty + lead + 2.2, oz - 12 + dist], l: [ox + BX + tx, oy + ty + lead, oz - 12], f: lerp(46, 50, sstep(T10E - 0.3, T10E + 0.1, tt)) });
}

