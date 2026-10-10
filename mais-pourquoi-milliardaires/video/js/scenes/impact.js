// MODULE « impact » — scène 11 (les entreprises peuvent être touchées) et scène 12 (la panique peut se propager). Fenêtre [38.46, 51.30].
import { T, H, kf, eio, eout, ein, eoutBack, lin, sstep, clamp, lerp, lam, basic, PAL, makePerson, SKIN, textPlane, glow, mk, FONT, MONO } from "../shared.js";
import { MODULES, windowsOf, onset } from "../plan.js";
export const ID = "impact";
export const OFFSET = MODULES[ID].offset;
export const WINDOWS = windowsOf(ID);
const [ox, oy, oz] = OFFSET;
const NX = 90;                                  // zone du réseau (scène 12) décalée en x
const GX = 5.5, GY = 14, GH = 6;               // jauge « valeur en bourse » (centre x, centre y, hauteur du tube)
const PZ = 3;                                    // profondeur (z) des projets de développement
const INV = [[12.6, 7.0], [14.0, 9.4], [15.4, 7.0], [16.8, 9.4], [18.2, 7.0], [19.6, 9.4], [21.0, 7.0]];   // position d'arrivée des 7 investisseurs (x, z) : deux rangées espacées
const t11 = { cert: onset(11, /certaines/), perd: onset(11, /perdraient/), valeur: onset(11, /valeur/), bourse: onset(11, /bourse/), elles: onset(11, /elles/), attirer: onset(11, /attirer/), invest: onset(11, /investisseurs/), financer: onset(11, /financer/), dev: onset(11, /developpement/) };
const t12 = { et: onset(12, /^et$/), panique: onset(12, /panique/), propag: onset(12, /propageait/), marches: onset(12, /marches/), conseq: onset(12, /consequences/), toucher: onset(12, /toucher/), plus: onset(12, /^plus$/), seuls: onset(12, /seuls/), milliardaires: onset(12, /milliardaires/) };
export const ENV = (t) => ({ bg: t < 45.6 ? 0x070d1a : 0x050a14, fog: 0.007 });
export const SHAKE = () => 0;

const canvasTex = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace; return { c, g: c.getContext("2d"), tx }; };
const winTex = () => mk(256, 512, (g, w, h) => { g.fillStyle = "#16233a"; g.fillRect(0, 0, w, h); for (let r = 0; r < 16; r++) for (let c = 0; c < 6; c++) { g.fillStyle = H(r * 7 + c, 3) > 0.25 ? "#ffd98a" : "#26385a"; g.fillRect(14 + c * 40, 10 + r * 31, 26, 20); } });
const noise = (u, s) => Math.sin(u * 37 + s) * 0.35 + Math.sin(u * 91 + s * 2) * 0.2 + Math.sin(u * 13 + s * 3) * 0.45;

// ------------------------------------------------------------- réseau (scène 12) : positions déterministes
const NODE_DEF = [];   // {x,y,z,kind}
{ const kinds = ["screen", "screen", "bank", "firm", "investor", "screen", "firm", "activity", "bank", "screen", "investor", "firm", "screen", "activity", "screen", "bank", "firm", "investor", "activity", "screen", "firm", "bank"];
  kinds.forEach((k, i) => { const a = i * 2.399 + 0.5, r = 3 + 11 * Math.sqrt(H(i, 1)); NODE_DEF.push({ x: Math.cos(a) * r * 0.95, y: 3 + H(i, 2) * 25, z: Math.sin(a) * r * 0.6 - 4, kind: k, inten: [1, 0.75, 0.2, 0.9, 0.3, 0.3, 0.8, 0.45, 0.8, 0.95, 0.6, 0.35, 0.12, 0.15, 0.7, 0.5, 0.2, 0.2, 0.55, 0.1, 0.3, 0.3][i] }); });
  NODE_DEF[0].x = -2; NODE_DEF[0].y = 14; NODE_DEF[0].z = -2; NODE_DEF[0].kind = "screen"; NODE_DEF[0].inten = 1; }
const LINKS = []; { NODE_DEF.forEach((a, i) => { const d = NODE_DEF.map((b, j) => [j, Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)]).filter(([j]) => j !== i).sort((p, q) => p[1] - q[1]).slice(0, 2 + (i % 2)); d.forEach(([j]) => { if (!LINKS.some(([p, q]) => (p === i && q === j) || (p === j && q === i))) LINKS.push([i, j]); }); }); }
const nodeDist = NODE_DEF.map((n) => Math.hypot(n.x - NODE_DEF[0].x, n.y - NODE_DEF[0].y, n.z - NODE_DEF[0].z));
const WAVE_V = 7.5;                                   // vitesse de l'onde (unités/s)
const arrival = (i) => t12.panique + 0.1 + nodeDist[i] / WAVE_V;
const act = (i, t) => { const a = arrival(i); const u = t - a; if (u < 0) return 0; return NODE_DEF[i].inten * (Math.exp(-u * 0.9) * 0.6 + 0.4 * sstep(0, 1.2, u) * (1 - 0.0)); };

export function build() {
  const g = new T.Group(); g.position.set(...OFFSET); const U = g.userData;
  g.add(new T.HemisphereLight(0xb8c8ff, 0x161a2e, 1.15));
  const key = new T.DirectionalLight(0xfff0dc, 0.9); key.position.set(10, 22, 18); g.add(key);
  const fl = new T.Mesh(new T.PlaneGeometry(300, 160), new T.MeshLambertMaterial({ map: mk(512, 512, (c, w, h) => { c.fillStyle = "#0a1020"; c.fillRect(0, 0, w, h); c.strokeStyle = "rgba(100,140,255,.2)"; c.lineWidth = 2; for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(i * 64, 0); c.lineTo(i * 64, h); c.stroke(); c.beginPath(); c.moveTo(0, i * 64); c.lineTo(w, i * 64); c.stroke(); } }, { repeat: [20, 12] }) })); fl.rotation.x = -Math.PI / 2; fl.position.set(40, 0, 0); g.add(fl);

  // ================= SCÈNE 11 =================
  // (1) mur de graphique rouge (raccord avec la fin de « market »)
  const cw = canvasTex(512, 896); U.cw = cw;
  const wall = new T.Mesh(new T.PlaneGeometry(9, 15.75), new T.MeshBasicMaterial({ map: cw.tx })); wall.position.set(-16, 7.9, 6); g.add(wall); U.wall = wall;
  // (2) entreprise : bureaux + usine ouverte + cheminée
  const co = new T.Group(); co.position.set(2, 0, 0); g.add(co); U.co = co;
  const tower = new T.Mesh(new T.BoxGeometry(5, 12, 5), new T.MeshLambertMaterial({ map: winTex(), emissive: 0x4a3a1a })); tower.position.set(-7, 6, -2); co.add(tower);
  const roof = new T.Mesh(new T.BoxGeometry(5.4, 0.5, 5.4), lam(0x4a5a7a)); roof.position.set(-7, 12.2, -2); co.add(roof);
  const hall = new T.Group(); hall.position.set(3.5, 0, 0); co.add(hall);
  const wallM = lam(0x60708f); const back = new T.Mesh(new T.BoxGeometry(14, 6.4, 0.6), wallM); back.position.set(0, 3.2, -4); hall.add(back);
  for (const sx of [-7, 7]) { const sw = new T.Mesh(new T.BoxGeometry(0.6, 6.4, 8), wallM); sw.position.set(sx, 3.2, 0); hall.add(sw); }
  const hroof = new T.Mesh(new T.BoxGeometry(14.4, 0.5, 8.6), lam(0x47557a)); hroof.position.set(0, 6.6, 0); hall.add(hroof);
  for (let i = 0; i < 4; i++) { const saw = new T.Mesh(new T.CylinderGeometry(2.0, 2.0, 8.4, 3, 1), lam(0x6c7ea8)); saw.rotation.set(Math.PI / 2, 0, Math.PI / 2); saw.position.set(-5.2 + i * 3.5, 7.4, 0); saw.scale.set(1, 1, 0.55); hall.add(saw); }
  const chim = new T.Mesh(new T.CylinderGeometry(0.7, 0.9, 10, 14), lam(0x6a3a30)); chim.position.set(6, 11, -2.6); hall.add(chim);
  U.smoke = new T.InstancedMesh(new T.SphereGeometry(0.9, 8, 6), new T.MeshLambertMaterial({ color: 0xdfe6ee, transparent: true, opacity: 0.55 }), 18); U.smoke.frustumCulled = false; hall.add(U.smoke);
  const conv = new T.Mesh(new T.BoxGeometry(11, 0.5, 1.6), lam(0x20262f)); conv.position.set(0, 0.6, 0.5); hall.add(conv);
  U.crates = new T.InstancedMesh(new T.BoxGeometry(0.9, 0.9, 0.9), lam(0xd9a05b), 8); U.crates.frustumCulled = false; hall.add(U.crates);
  U.arms = []; for (const x of [-3.5, 2.5]) { const base = new T.Mesh(new T.CylinderGeometry(0.6, 0.8, 1.2, 12), lam(0xe0b030)); base.position.set(x, 0.6, -1.6); hall.add(base); const a1 = new T.Group(); a1.position.set(x, 1.3, -1.6); hall.add(a1); const seg = new T.Mesh(new T.BoxGeometry(0.4, 2.6, 0.4), lam(0xe0b030)); seg.position.y = 1.3; a1.add(seg); const a2 = new T.Group(); a2.position.y = 2.6; a1.add(a2); const seg2 = new T.Mesh(new T.BoxGeometry(0.35, 2.2, 0.35), lam(0xe0b030)); seg2.position.y = 1.1; a2.add(seg2); U.arms.push([a1, a2]); }
  U.workers = []; for (let i = 0; i < 5; i++) { const p = makePerson({ skin: SKIN[(i * 2) % SKIN.length], shirt: i % 2 ? 0xf0b429 : 0xe0653a, pants: 0x2b3a4a, scale: 0.85 }); p.position.set(-5 + i * 2.6, 0, 2.6 + (i % 2) * 0.6); p.rotation.y = Math.PI; hall.add(p); U.workers.push(p); }
  U.desks = []; for (let i = 0; i < 3; i++) { const w = makePerson({ skin: SKIN[(i + 1) % SKIN.length], shirt: 0xdfe6ff, pants: 0x2b3a4a, scale: 0.8 }); w.position.set(-9.2 + i * 1.7, 0, 2.6); w.rotation.y = 0.2; co.add(w); U.desks.push(w); }
  U.warm = new T.PointLight(0xffc27a, 160, 38, 1.4); U.warm.position.set(6, 5.5, 3); g.add(U.warm);
  const pad = new T.Mesh(new T.PlaneGeometry(40, 22), new T.MeshLambertMaterial({ color: 0x182848 })); pad.rotation.x = -Math.PI / 2; pad.position.set(2, 0.02, 2); g.add(pad);
  // (3) jauge « valeur en bourse » (couche 1) au-dessus de l'entreprise (compacte : l'ensemble tient dans la zone utile du cadre vertical)
  const gx = GX, gy = GY;
  const tube = new T.Mesh(new T.CylinderGeometry(1.5, 1.5, GH, 24, 1, true), new T.MeshBasicMaterial({ color: 0x8ab4ff, transparent: true, opacity: 0.25, side: T.DoubleSide })); tube.position.set(gx, gy, 0); g.add(tube); U.tube = tube;
  U.fill = new T.Mesh(new T.CylinderGeometry(1.35, 1.35, 1, 24), new T.MeshBasicMaterial({ color: 0x4aa0ff })); g.add(U.fill); U.fill.position.x = gx;
  U.lblV = textPlane("VALEUR EN BOURSE", { w: 8, h: 1.2, px: 768, color: "#8ab4ff", size: 0.58 }); U.lblV.position.set(gx, gy + GH / 2 + 1.35, 0); g.add(U.lblV);
  U.arrowV = new T.Mesh(new T.ConeGeometry(1.2, 2.0, 3), new T.MeshBasicMaterial({ color: 0xff4a3d })); U.arrowV.rotation.z = Math.PI; U.arrowV.position.set(gx - 3.0, gy + 1, 0); g.add(U.arrowV);
  U.lblA = textPlane("ACTIVITÉ RÉELLE", { w: 8, h: 1.2, px: 768, color: "#47f0a0", size: 0.58 }); U.lblA.position.set(5.8, 9.2, 3.5); g.add(U.lblA);
  U.tick = textPlane("● en fonctionnement", { w: 8, h: 1.0, px: 768, color: "#9ff2c7", size: 0.5 }); U.tick.position.set(5.8, 8.3, 3.5); g.add(U.tick);
  // (4) investisseurs (silhouettes bien visibles, espacées en deux rangées) qui hésitent
  U.inv = []; for (let i = 0; i < 7; i++) { const p = makePerson({ skin: SKIN[i % SKIN.length], shirt: 0x6a9cff, pants: 0x2a3a6a, scale: 1.2 }); p.traverse((m) => { if (m.material) { m.material = m.material.clone(); m.material.transparent = true; m.material.opacity = 0.9; } }); g.add(p); U.inv.push(p);
    const case_ = new T.Mesh(new T.BoxGeometry(0.5, 0.38, 0.14), new T.MeshBasicMaterial({ color: PAL.gold })); case_.position.set(0.55, 0.9, 0); p.add(case_); }
  U.lblI = textPlane("INVESTISSEURS", { w: 7, h: 1.1, px: 768, color: "#9ec0ff", size: 0.56 }); U.lblI.position.set(16.8, 4.0, 8.2); g.add(U.lblI);
  // (5) projets de développement (hologrammes)
  U.proj = []; for (let i = 0; i < 3; i++) { const geo = new T.EdgesGeometry(new T.BoxGeometry(4.2, [5.5, 3.8, 7][i], 3.2)); const m = new T.LineSegments(geo, new T.LineBasicMaterial({ color: 0x47f0c8, transparent: true, opacity: 0.9 })); m.position.set(16 + i * 5.2, [2.75, 1.9, 3.5][i], PZ); g.add(m);
    const bar = new T.Mesh(new T.BoxGeometry(3.6, 0.35, 0.3), new T.MeshBasicMaterial({ color: 0x47f0a0 })); bar.position.set(16 + i * 5.2, 0.35, PZ + 1.8); g.add(bar);
    const pause = textPlane("⏸ EN PAUSE", { w: 4.2, h: 1.0, px: 512, color: "#ffb36a", size: 0.55 }); pause.position.set(16 + i * 5.2, [6.4, 5.0, 8.0][i], PZ); pause.visible = false; g.add(pause);
    U.proj.push({ m, bar, pause }); }
  U.lblP = new T.Group(); U.lblP.position.set(21.1, 10.2, PZ); g.add(U.lblP);
  { const l1 = textPlane("PROJETS DE", { w: 7, h: 1.3, px: 768, color: "#47f0c8", size: 0.6 }); l1.position.y = 0.7; const l2 = textPlane("DÉVELOPPEMENT", { w: 9, h: 1.3, px: 1024, color: "#47f0c8", size: 0.6 }); l2.position.y = -0.7; U.lblP.add(l1, l2); }

  // ================= SCÈNE 12 : réseau =================
  const net = new T.Group(); net.position.set(NX, 0, 0); g.add(net); U.net = net;
  const FIRM_TEX = winTex(); const CIV = [0xf0b429, 0xe0653a, 0x47c9a0, 0xdfe6ff, 0xd77aa3, 0xff9a5a];
  const civ = (grp, k, x, y, z) => { const p = makePerson({ skin: SKIN[(k + 2) % SKIN.length], shirt: CIV[k % CIV.length], pants: 0x2b3a4a, scale: 0.9 }); p.position.set(x, y, z); p.rotation.y = Math.PI; grp.add(p); };   // personnes ordinaires près des maisons et des usines
  U.nodes = NODE_DEF.map((n, i) => {
    const grp = new T.Group(); grp.position.set(n.x, n.y, n.z); net.add(grp); const o = {};
    if (n.kind === "screen") { const c = canvasTex(256, 192); const mesh = new T.Mesh(new T.PlaneGeometry(i === 0 ? 8 : 4.4, i === 0 ? 6 : 3.3), new T.MeshBasicMaterial({ map: c.tx })); grp.add(mesh); o.c = c; const fr = new T.Mesh(new T.BoxGeometry(i === 0 ? 8.3 : 4.7, i === 0 ? 6.3 : 3.6, 0.2), lam(0x0b1226)); fr.position.z = -0.15; grp.add(fr); }
    else if (n.kind === "bank") { grp.add(Object.assign(new T.Mesh(new T.BoxGeometry(3, 1.8, 2), lam(0xe9dfc3)), {})); for (let k = 0; k < 4; k++) { const col = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 1.8, 8), lam(PAL.gold)); col.position.set(-1.1 + k * 0.73, 0, 1.05); grp.add(col); } const pe = new T.Mesh(new T.ConeGeometry(1.8, 0.9, 3), lam(PAL.gold)); pe.position.y = 1.35; pe.rotation.y = Math.PI / 2; pe.scale.set(1, 1, 0.5); grp.add(pe); }
    else if (n.kind === "firm") { const bd = new T.Mesh(new T.BoxGeometry(2.4, 3.4, 2.2), new T.MeshLambertMaterial({ map: FIRM_TEX, emissive: 0x3a2e16 })); bd.position.y = 0.4; grp.add(bd); const rf = new T.Mesh(new T.BoxGeometry(2.6, 0.3, 2.4), lam(0x4a5a7a)); rf.position.y = 2.25; grp.add(rf); const ch = new T.Mesh(new T.CylinderGeometry(0.25, 0.3, 1.8, 8), lam(0x8a4a3a)); ch.position.set(0.7, 3.1, 0); grp.add(ch); if (i === 3 || i === 6) civ(grp, i, 2.0, -1.3, 1.3); }
    else if (n.kind === "investor") { const p = makePerson({ skin: SKIN[i % SKIN.length], shirt: 0x6a9cff, pants: 0x2a3a6a, scale: 1.5 }); p.position.y = -1.4; grp.add(p); }
    else { grp.add(new T.Mesh(new T.BoxGeometry(2.4, 1.6, 2.2), lam(0x8a7a4a))); const rf = new T.Mesh(new T.ConeGeometry(1.8, 1, 4), lam(0xb5432e)); rf.position.y = 1.3; rf.rotation.y = Math.PI / 4; grp.add(rf); civ(grp, i, 1.9, -0.8, 1.3); civ(grp, i + 7, -1.8, -0.8, 1.1); }
    if (n.kind !== "screen") { o.tint = []; grp.traverse((m) => { if (m.isMesh && m.material && m.material.emissive) o.tint.push([m.material, m.material.color.clone(), m.material.emissive.clone()]); }); }
    o.halo = glow(0xffffff, n.kind === "screen" ? 9 : 6, 0); o.halo.position.z = -0.3; grp.add(o.halo); o.grp = grp; return o;
  });
  // petit groupe de milliardaires (une petite partie du réseau)
  U.bill = new T.Group(); U.bill.position.set(-5, 0.8, 3); U.bill.scale.setScalar(1.7); net.add(U.bill);
  for (let k = 0; k < 4; k++) { const p = makePerson({ skin: SKIN[k], shirt: 0x15151c, pants: 0x101018, scale: 1.2 }); p.position.set(k * 1.0, 0, (k % 2) * 0.5); U.bill.add(p); }
  const bh = glow(PAL.gold, 9, 0.5); bh.position.set(1.5, 1.5, 0); U.bill.add(bh); U.billH = bh;
  U.lblB = textPlane("MILLIARDAIRES", { w: 8, h: 1.1, px: 768, color: "#e8b84a", size: 0.55 }); U.lblB.position.set(5.2, 4.3, 0); U.bill.add(U.lblB);
  // liens (fines barres lumineuses, plus lisibles que des lignes d'un pixel) + impulsions + anneaux d'onde
  U.linkBars = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false }), LINKS.length); U.linkBars.frustumCulled = false; net.add(U.linkBars);
  U.rings = [0, 1].map(() => { const m = new T.Mesh(new T.RingGeometry(0.975, 1, 80), new T.MeshBasicMaterial({ color: 0xff7a62, transparent: true, opacity: 0, side: T.DoubleSide, blending: T.AdditiveBlending, depthWrite: false })); m.position.set(NODE_DEF[0].x, NODE_DEF[0].y, NODE_DEF[0].z - 0.6); net.add(m); return m; });
  U.pulses = new T.InstancedMesh(new T.SphereGeometry(0.3, 8, 6), new T.MeshBasicMaterial({ color: 0xffffff }), LINKS.length * 3); U.pulses.frustumCulled = false; net.add(U.pulses);
  return g;
}

// ------------------------------------------------------------- dessins canvas
function drawWall(U, t) {
  const { g: c } = U.cw; const W = 512, Hh = 896;
  c.fillStyle = "#0a0e1c"; c.fillRect(0, 0, W, Hh); c.strokeStyle = "rgba(90,140,255,.22)"; c.lineWidth = 2; for (let i = 0; i <= 10; i++) { c.beginPath(); c.moveTo(0, i * Hh / 10); c.lineTo(W, i * Hh / 10); c.stroke(); }
  // même courbe rouge qu'à la fin de la scène 10 : la ligne est tout en bas (raccord)
  c.strokeStyle = "rgba(255,74,61,1)"; c.lineWidth = 9; c.beginPath(); for (let i = 0; i <= 50; i++) { const u = i / 50; const y = 780 + 28 * noise(u * 3, 5) * (1 - 0.5 * u) + (u > 0.9 ? 12 : 0); i ? c.lineTo(20 + u * 470, y) : c.moveTo(20, y); } c.stroke();
  c.fillStyle = "rgba(255,74,61,.18)"; c.beginPath(); c.moveTo(20, 880); for (let i = 0; i <= 50; i++) { const u = i / 50; c.lineTo(20 + u * 470, 780 + 28 * noise(u * 3, 5) * (1 - 0.5 * u)); } c.lineTo(490, 880); c.closePath(); c.fill();
  U.cw.tx.needsUpdate = true;
}
function drawScreen(n, i, t) {
  const { g: c } = n.c; const W = 256, Hh = 192; const a = act(i, t);
  c.fillStyle = a > 0.05 ? `rgb(${12 + 70 * a | 0},12,${28 - 10 * a | 0})` : "#0a1226"; c.fillRect(0, 0, W, Hh);
  c.strokeStyle = "rgba(120,160,255,.2)"; c.lineWidth = 1; for (let k = 1; k < 5; k++) { c.beginPath(); c.moveTo(0, k * Hh / 5); c.lineTo(W, k * Hh / 5); c.stroke(); }
  const arr = arrival(i); const u0 = (t - arr);
  c.strokeStyle = a > 0.2 ? "#ff5a4a" : a > 0.075 ? "#ffb347" : "#47f0a0"; c.lineWidth = 5; c.beginPath();
  for (let k = 0; k <= 48; k++) { const u = k / 48; const drop = u > 0.45 ? NODE_DEF[i].inten * 80 * (sstep(0, 1.1, u0 - (1 - u) * 0.7) ) : 0; const y = 70 + 14 * noise(u * 3, i) + drop * (u - 0.45) * 1.4; k ? c.lineTo(8 + u * 240, y) : c.moveTo(8, y); }
  c.stroke(); n.c.tx.needsUpdate = true;
}

// ------------------------------------------------------------- mise à jour
const o = new T.Object3D(); const col = new T.Color(); const RED = new T.Color(0xff5a4a);
export function update(g, t) {
  const U = g.userData; const s11 = t < 45.64; const s12 = !s11 || t >= 45.0;
  // ===== S11
  U.wall.visible = t < 41; drawWall(U, t);
  // valeur boursière : jauge qui baisse (sans valeur chiffrée)
  const lvl = 1 - 0.68 * eio(lin(t11.perd, t11.bourse + 0.2, t));
  const gh = GH * Math.max(0.05, lvl); U.fill.scale.set(1, gh, 1); U.fill.position.y = GY - GH / 2 + gh / 2; U.fill.material.color.setHex(lvl < 0.6 ? 0xff5a4a : 0x4aa0ff);
  U.arrowV.visible = t > t11.perd && t < 44.5; U.arrowV.position.y = GY + 1.2 - 2.2 * lin(t11.perd, t11.bourse, t) + 0.3 * Math.sin(t * 9);
  const gs = eoutBack(lin(t11.cert + 0.2, t11.cert + 0.9, t)); [U.tube, U.fill, U.lblV].forEach((m) => { m.scale.setScalar(Math.max(0.001, gs)); }); U.fill.scale.set(Math.max(0.001, gs), gh * Math.max(0.001, gs), Math.max(0.001, gs)); U.fill.position.y = GY + (-GH / 2 + gh / 2) * Math.max(0.001, gs); U.lblV.userData.set("VALEUR EN BOURSE", lvl < 0.6 ? "#ff8a7d" : "#8ab4ff");
  const gv = s11; [U.tube, U.fill, U.lblV, U.arrowV, U.lblA, U.tick, U.lblP].forEach((m) => { m.visible = m.visible && gv; }); U.tube.visible = gv; U.fill.visible = gv; U.lblV.visible = gv; U.lblA.visible = gv && t > t11.perd; U.tick.visible = U.lblA.visible; U.lblP.visible = gv && t > t11.financer; U.lblP.scale.setScalar(Math.max(0.001, eoutBack(lin(t11.financer, t11.financer + 0.35, t))));
  // activité réelle : usine qui tourne, bras, convoyeur, fumée, employés
  U.arms.forEach(([a1, a2], i) => { a1.rotation.z = Math.sin(t * 1.8 + i * 1.7) * 0.5; a2.rotation.z = -0.6 + Math.sin(t * 2.4 + i) * 0.6; a1.rotation.y = Math.sin(t * 0.9 + i) * 0.5; });
  for (let i = 0; i < 8; i++) { o.position.set(-5 + ((i * 1.4 + t * 1.5) % 11), 1.35, 0.5); o.scale.setScalar(1); o.rotation.set(0, 0, 0); o.updateMatrix(); U.crates.setMatrixAt(i, o.matrix); } U.crates.instanceMatrix.needsUpdate = true;
  for (let i = 0; i < 18; i++) { const u = (t * 0.28 + i * 0.0556) % 1; o.position.set(6 + u * 3.2, 16 + u * 9, -2.6); o.scale.setScalar(0.5 + u * 1.8); o.rotation.set(0, 0, 0); o.updateMatrix(); U.smoke.setMatrixAt(i, o.matrix); } U.smoke.instanceMatrix.needsUpdate = true;
  U.workers.forEach((w, i) => { w.userData.armL.rotation.x = Math.sin(t * 3 + i) * 0.7; w.userData.armR.rotation.x = Math.sin(t * 3 + i + 2) * 0.7; w.position.y = Math.abs(Math.sin(t * 3 + i)) * 0.04; });
  U.desks.forEach((w, i) => { w.userData.armL.rotation.x = -0.9 + Math.sin(t * 6 + i) * 0.15; w.userData.armR.rotation.x = -0.9 + Math.sin(t * 6 + i + 1) * 0.15; });
  U.co.visible = s11; U.wall.visible = U.wall.visible && s11;
  // investisseurs : arrivent puis hésitent, certains repartent
  U.inv.forEach((p, i) => { const [xt, zt] = INV[i]; const s = t11.elles + 0.1 + i * 0.12; const u = lin(s, s + 1.4, t); const back = lin(t11.invest + 0.2 + i * 0.1, t11.invest + 1.4 + i * 0.1, t) * (i % 3 === 0 ? 0 : 1); const x = lerp(xt + 18, xt, eio(u)) + back * (18 + i);
    p.position.set(x, 0, zt); p.rotation.y = back > 0.05 ? -Math.PI / 2 : Math.PI / 2; p.visible = s11 && t > t11.elles && back < 0.999; p.userData.legL.rotation.x = Math.sin(t * 7 + i) * 0.5 * (u < 1 || back > 0 ? 1 : 0); p.userData.legR.rotation.x = -p.userData.legL.rotation.x; });
  { const ls = eoutBack(lin(t11.invest - 0.05, t11.invest + 0.3, t)) * (1 - sstep(t11.invest + 0.45, t11.invest + 0.75, t)); U.lblI.visible = s11 && ls > 0.01; U.lblI.scale.setScalar(Math.max(0.001, ls)); }
  // projets : apparaissent, 2 sur 3 se figent
  U.proj.forEach((pr, i) => { const s = t11.financer + 0.05 + i * 0.25; const u = eoutBack(lin(s, s + 0.45, t)); pr.m.scale.setScalar(Math.max(0.001, u)); pr.bar.scale.set(Math.max(0.001, u * (i === 2 ? lin(s, s + 1.4, t) * 0.8 + 0.2 : lin(s, s + 0.5, t) * 0.45 + 0.02)), 1, 1); pr.bar.position.x = 16 + i * 5.2 - 1.8 * (1 - pr.bar.scale.x);
    const frozen = i < 2 && t > t11.dev + 0.05; pr.m.material.color.setHex(frozen ? 0x7a8088 : 0x47f0c8); pr.bar.material.color.setHex(frozen ? 0x7a8088 : 0x47f0a0); pr.m.rotation.y = frozen ? 0.0 : t * 0.5 * (i + 1) * 0.3; pr.pause.visible = frozen && s11; pr.m.visible = pr.bar.visible = s11 && t > s; });
  // ===== S12
  U.net.visible = s12; U.warm.visible = s11; const nt = t >= 45.0;
  U.nodes.forEach((nd, i) => { const a = act(i, t); nd.halo.material.color.setRGB(1.0, 0.55 - 0.4 * a, 0.35 - 0.3 * a); nd.halo.material.opacity = 0.55 * Math.min(1, a * 1.4) * (nt ? 1 : 0); if (nd.c) drawScreen(nd, i, t); const sc = 1 + 0.12 * Math.min(1, a) * Math.sin(t * 8); nd.grp.scale.setScalar(sc * eoutBack(lin(45.4 + i * 0.03, 46.0 + i * 0.03, t)));
    if (nd.tint) { const k = Math.min(1, a * 1.8); for (const [m, c0, e0] of nd.tint) { m.color.copy(c0).lerp(RED, 0.5 * k); m.emissive.setRGB(e0.r + 0.3 * k, e0.g + 0.02 * k, e0.b + 0.01 * k); } } });
  // anneaux d'onde qui partent du premier écran
  { const r0 = (t - (t12.panique + 0.1)) * WAVE_V; U.rings.forEach((m, k) => { const R = r0 - k * 3.2; const vis = s12 && R > 0.6 && R < 24; m.visible = vis; if (vis) { m.scale.setScalar(R); m.material.opacity = 0.75 * Math.pow(1 - R / 24, 1.3) * (k ? 0.55 : 1); } }); }
  // liens : teinte selon l'intensité de l'onde (froids et bleus si les deux bouts sont peu touchés, rouges si l'un est très touché)
  { const bright = 0.4 + 0.6 * lin(45.8, 47.0, t);
    LINKS.forEach(([i, j], k) => { const a = NODE_DEF[i], b = NODE_DEF[j]; const m = Math.max(act(i, t), act(j, t)); const hot = Math.min(1, m * 2.2); const len = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
      o.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1); o.lookAt(b.x, b.y, b.z); o.scale.set(0.13, 0.13, len); o.updateMatrix(); U.linkBars.setMatrixAt(k, o.matrix);
      U.linkBars.setColorAt(k, col.setRGB(lerp(0.3, 1.0, hot) * bright, lerp(0.58, 0.3, hot) * bright, lerp(1.0, 0.22, hot) * bright)); });
    U.linkBars.instanceMatrix.needsUpdate = true; if (U.linkBars.instanceColor) U.linkBars.instanceColor.needsUpdate = true; }
  let np = 0; LINKS.forEach(([i, j], k) => { const a = NODE_DEF[i], b = NODE_DEF[j]; const m = Math.max(act(i, t), act(j, t)); for (let q = 0; q < 3; q++) { const u = (t * (0.25 + 0.2 * m) + q / 3 + H(k, 9)) % 1; o.position.set(lerp(a.x, b.x, u), lerp(a.y, b.y, u), lerp(a.z, b.z, u)); o.scale.setScalar(0.45 + 0.55 * m); o.rotation.set(0, 0, 0); o.updateMatrix(); U.pulses.setMatrixAt(np, o.matrix); U.pulses.setColorAt(np, col.setRGB(1, 0.8 - 0.55 * Math.min(1, m), 0.5 - 0.4 * Math.min(1, m))); np++; } });
  U.pulses.count = np; U.pulses.instanceMatrix.needsUpdate = true; if (U.pulses.instanceColor) U.pulses.instanceColor.needsUpdate = true;
  U.bill.visible = t > t12.toucher; U.billH.material.opacity = 0.5 * lin(t12.seuls - 0.2, t12.seuls + 0.5, t); U.lblB.visible = t > t12.seuls - 0.2;
}

// ------------------------------------------------------------- caméra
const E = 51.3;
export const SHOTS = [
  // S11 : entrée face au mur de graphique (raccord), dolly latéral vers l'entreprise, suivi des deux couches
  { t: 38.46, p: [ox - 16, oy + 3.4, oz + 15], l: [ox - 16, oy + 3.2, oz + 6], f: 50, e: eio },
  { t: 38.92, p: [ox + 3, oy + 5, oz + 37], l: [ox + 4, oy + 5.6, oz], f: 54, e: eio },
  { t: t11.bourse + 0.3, p: [ox + 4, oy + 5, oz + 36], l: [ox + 4, oy + 5.6, oz], f: 54, e: eio },
  { t: t11.attirer, p: [ox + 10.5, oy + 4.2, oz + 38], l: [ox + 11, oy + 5.4, oz], f: 54, e: eio },
  { t: 43.9, p: [ox + 11.3, oy + 4.2, oz + 38], l: [ox + 11.8, oy + 5.4, oz], f: 54, e: eio },
  { t: 44.55, p: [ox + 22.1, oy + 6, oz + 36], l: [ox + 22.1, oy + 3.8, oz + 3], f: 54 },
  { t: 45.3, p: [ox + 22.4, oy + 6, oz + 36.5], l: [ox + 22.1, oy + 3.8, oz + 3], f: 54 },
  { t: 45.638, p: [ox + 22.7, oy + 6, oz + 37], l: [ox + 22.1, oy + 3.8, oz + 3], f: 54 },
  // S12 : on arrive devant le premier écran (zone réseau), puis la caméra recule pour révéler le réseau
  { t: 45.64, p: [ox + NX - 2, oy + 14, oz + 10], l: [ox + NX - 2, oy + 14, oz - 2], f: 50 },
  { t: t12.conseq - 0.15, p: [ox + NX - 2, oy + 14.5, oz + 14], l: [ox + NX - 1, oy + 14, oz - 2], f: 52, e: eio },
  { t: t12.seuls, p: [ox + NX + 1, oy + 10, oz + 44], l: [ox + NX, oy + 9, oz - 4], f: 58, e: eio },
  { t: E - 0.01, p: [ox + NX + 2, oy + 10.5, oz + 50], l: [ox + NX, oy + 9, oz - 4], f: 60 },
];
