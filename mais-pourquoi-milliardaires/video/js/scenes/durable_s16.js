// Scène 16 — « Redistribuer une fortune peut aider énormément de personnes. Mais ça ne suffit pas forcément à supprimer durablement la pauvreté. »
// Image scindée : à gauche l'argent qui arrive IMMÉDIATEMENT (pluie de billets : pic puis retombée, un tas qui ne grandit plus, des personnes aidées),
// à droite les éléments d'une stabilité DURABLE qui s'allument un à un (revenus, emplois, logements, soins, éducation, services).
// La caméra traverse la ligne de partage puis recule pour rassembler les deux côtés. Conclusion nuancée, aucun chiffre.
import { T, PAL, SKIN, CLOTH, H, clamp, lerp, sstep, lin, eio, eout, ein, eoutBack, mk, FONT, textPlane, glow, M, MB, mesh, bx, cy, sp, put, hide, mixHex, pop, setS, _o, _c, _v,
  texIcon, iconPlane, billBoxGeo, billBoxMats, makeCrowd, setCrowd, flushCrowd, makePerson, houseMini, drawIcon, once, floorTex, glowTex } from "./durable_kit.js";
import { onset } from "../plan.js";

const o16 = (re, k = 0) => onset(16, re, k);
export const T16 = { redistribuer: o16(/^redistribuer$/), fortune: o16(/^fortune$/), aider: o16(/^aider$/), enormement: o16(/^enormement$/), personnes: o16(/^personnes$/), mais: o16(/^mais$/), suffit: o16(/^suffit$/), forcement: o16(/^forcement$/), supprimer: o16(/^supprimer$/), durablement: o16(/^durablement$/), pauvrete: o16(/^pauvrete$/) };
const TILE_T = [T16.mais, T16.suffit, T16.forcement, T16.supprimer, T16.durablement, T16.pauvrete];
const TILES = [
  { id: "revenus", label: "REVENUS", icon: "coin", hex: 0xe8b84a, x: 1.85, z: 2.2 },
  { id: "emplois", label: "EMPLOIS", icon: "case", hex: 0x2d6cc0, x: 4.35, z: 2.2 },
  { id: "logements", label: "LOGEMENTS", icon: "house", hex: 0xd98f3a, x: 1.85, z: -1.5 },
  { id: "soins", label: "SOINS", icon: "cross", hex: 0xe0453a, x: 4.35, z: -1.5 },
  { id: "education", label: "ÉDUCATION", icon: "cap", hex: 0x8a4fb5, x: 1.85, z: -5.2 },
  { id: "services", label: "SERVICES", icon: "bus", hex: 0x2a9d8f, x: 4.35, z: -5.2 },
];
const LX = -3.1, MZ = 0.9;                              // centre du tas (côté gauche)
// ---- pluie de billets : débit = pic puis retombée (fonction déterministe de t), inversée en dates d'apparition
const NR = 640, R0 = 63.3, R1 = 66.95;
export const rain = (t) => (0.3 + Math.exp(-Math.pow((t - 65.95) / (t < 65.95 ? 0.85 : 0.45), 2))) * (1 - sstep(66.35, 66.9, t)) * sstep(R0, R0 + 0.3, t);
const SPAWN = (() => { const n = 800, cdf = [0]; for (let k = 0; k < n; k++) cdf.push(cdf[k] + rain(R0 + (k + 0.5) / n * (R1 - R0))); const tot = cdf[n]; const out = []; let k = 0;
  for (let j = 0; j < NR; j++) { const q = (j + 0.5) / NR * tot; while (k < n - 1 && cdf[k + 1] < q) k++; const f = (q - cdf[k]) / Math.max(1e-9, cdf[k + 1] - cdf[k]); out.push(R0 + (k + f) / n * (R1 - R0)); } return out; })();
const FALL = Array.from({ length: NR }, (_, j) => 0.95 + 0.4 * H(j, 21));
const heapH = (c) => 0.9 + 2.2 * Math.pow(c / NR, 0.85), heapR = (c) => 1.5 + 1.15 * Math.pow(c / NR, 0.6);

const texBeam = () => once("beam16", () => mk(8, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(1, "rgba(255,255,255,1)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }));
const texSocket = (kind) => once("sock" + kind, () => mk(256, 256, (g) => { g.strokeStyle = "rgba(190,205,200,.8)"; g.lineWidth = 8; g.setLineDash([22, 16]); g.beginPath(); g.arc(128, 128, 112, 0, 7); g.stroke(); g.setLineDash([]); drawIcon(g, kind, 128, 128, 56, "rgba(200,215,210,.6)", "#101816"); }));
const texHeap = () => once("heap16", () => mk(512, 512, (g, w, h) => { g.fillStyle = "#1d6a3c"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 1500; i++) { const x = H(i, 1) * w, y = H(i, 2) * h, a = H(i, 3) * 3.14, l = 38 + H(i, 4) * 26, s = H(i, 5); g.save(); g.translate(x, y); g.rotate(a);
    g.fillStyle = s < 0.15 ? "#e9d9a0" : `hsl(${135 + H(i, 6) * 18},${42 + H(i, 7) * 22}%,${22 + H(i, 8) * 24}%)`; g.fillRect(-l / 2, -l * 0.22, l, l * 0.44); g.strokeStyle = "rgba(240,215,140,.55)"; g.lineWidth = 1.2; g.strokeRect(-l / 2 + 2, -l * 0.22 + 2, l - 4, l * 0.44 - 4); g.restore(); } }, { repeat: [3, 2] }));

/* ---------- accessoires 3D des six éléments durables (origine = dessus du socle) ---------- */
function propRevenus() { const g = new T.Group(); const steel = M(0x95a8a0, 0x1a2a26);
  cy(0.09, 0.09, 1.5, steel, 0, 1.75, -0.3, g, 12); bx(1.3, 0.18, 0.18, steel, -0.6, 2.5, -0.3, g); cy(0.12, 0.07, 0.2, steel, 0, 0.98, -0.3, g, 12);
  { const w = new T.Group(); w.position.set(-0.7, 2.78, -0.3); g.add(w); const tr = mesh(new T.TorusGeometry(0.22, 0.04, 8, 18), M(0x2ecc71, 0x0a4a22), 0, 0, 0, w); tr.rotation.x = Math.PI / 2; for (let i = 0; i < 3; i++) { const sk = bx(0.44, 0.035, 0.035, M(0x2ecc71, 0x0a4a22), 0, 0, 0, w); sk.rotation.y = i * Math.PI / 3; } cy(0.05, 0.05, 0.3, steel, 0, -0.22, 0, w, 8); g.userData.wheel = w; }
  for (let i = 0; i < 5; i++) cy(0.46, 0.46, 0.08, M(0xe8b84a, 0x4a3808), 0, 0.04 + i * 0.085, -0.3, g, 18);
  const coins = new T.InstancedMesh(new T.CylinderGeometry(0.18, 0.18, 0.05, 14), new T.MeshLambertMaterial({ color: 0xf2c94a, emissive: 0x6a4a08 }), 6); coins.frustumCulled = false; g.add(coins); g.userData.coins = coins; return g; }
function propEmplois() { const g = new T.Group(); g.userData.persons = [];
  for (const [x, c, sk, ph] of [[-0.5, 0x2d6cc0, SKIN[1], 0], [0.5, 0xe0453a, SKIN[3], 1.7]]) { const p = makePerson({ skin: sk, shirt: c, pants: 0x2b3a4a, scale: 0.78 }); p.position.set(x, 0.0, 0.1); g.add(p); const hat = sp(0.215, M(0xf2c230, 0x3a2c04), 0, 1.88, 0, p, 12, 7); hat.scale.y = 0.7; hat.position.y = 1.86; p.userData.ph = ph; g.userData.persons.push(p); }
  bx(0.9, 0.55, 0.5, M(0xb9824f), 0, 0.28, 0.55, g); bx(0.94, 0.05, 0.54, M(0x8b5a33), 0, 0.57, 0.55, g); bx(0.5, 0.3, 0.38, M(0x3a3f44), 0.9, 0.15, 0.0, g); return g; }
function propLogements() { return houseMini(0xf6ead2, 0xc2543a, 1.75); }
function propSoins() { const g = new T.Group(); bx(1.5, 1.05, 1.0, M(0xf4f7f6, 0x1a1e1e), 0, 0.525, 0, g); bx(1.6, 0.1, 1.1, M(0xcfd8d6), 0, 1.1, 0, g); bx(0.34, 0.6, 0.04, M(0x3aa6a0, 0x0a2a28), 0, 0.3, 0.52, g);
  bx(0.56, 0.16, 0.04, M(0xe0453a, 0x4a0c08), 0, 0.82, 0.52, g); bx(0.16, 0.56, 0.04, M(0xe0453a, 0x4a0c08), 0, 0.82, 0.52, g);
  const cr = new T.Group(); bx(0.9, 0.28, 0.28, M(0xe0453a, 0x5a1008), 0, 0, 0, cr); bx(0.28, 0.9, 0.28, M(0xe0453a, 0x5a1008), 0, 0, 0, cr); cr.position.set(0, 1.85, 0); g.add(cr); g.userData.cross = cr; return g; }
function propEducation() { const g = new T.Group(); bx(1.2, 0.2, 0.86, M(0xd8382b, 0x3a0a06), 0, 0.1, 0, g); const b2 = bx(1.08, 0.18, 0.8, M(0x2d6cc0, 0x0a1a3a), 0.03, 0.29, 0, g); b2.rotation.y = 0.12; const b3 = bx(0.96, 0.16, 0.72, M(0xe8b84a, 0x4a3808), -0.02, 0.46, 0, g); b3.rotation.y = -0.1;
  const cap = new T.Group(); cap.position.set(0, 0.72, 0); g.add(cap); cy(0.3, 0.34, 0.24, M(0x1b2128, 0x06080a), 0, 0.12, 0, cap, 16); const bd = bx(1.15, 0.06, 1.15, M(0x1b2128, 0x06080a), 0, 0.3, 0, cap); bd.rotation.y = Math.PI / 4; sp(0.06, M(0xe8b84a, 0x4a3808), 0, 0.36, 0, cap, 8, 6);
  cy(0.015, 0.015, 0.5, M(0xe8b84a, 0x4a3808), 0.57, 0.1, 0.0, cap, 6); sp(0.07, M(0xe8b84a, 0x4a3808), 0.57, -0.17, 0, cap, 8, 6); g.userData.cap = cap; return g; }
function propServices() { const g = new T.Group(); bx(1.9, 0.72, 0.72, M(0x2d6cc0, 0x0a1a3a), 0, 0.5, 0, g); bx(1.92, 0.12, 0.74, M(0xf3ecd4, 0x2a2820), 0, 0.42, 0, g); bx(1.8, 0.05, 0.7, M(0x1d4a8a), 0, 0.88, 0, g);
  for (let i = 0; i < 5; i++) for (const s of [-1, 1]) bx(0.26, 0.24, 0.02, MB(0xbfe3ff), -0.72 + i * 0.36, 0.62, s * 0.365, g);
  const wh = []; for (const x of [-0.6, 0.6]) for (const s of [-1, 1]) { const w = cy(0.19, 0.19, 0.1, M(0x15181a), x, 0.19, s * 0.34, g, 14); w.rotation.x = Math.PI / 2; wh.push(w); } g.userData.wheels = wh;
  for (const s of [-1, 1]) sp(0.06, MB(0xfff3c0), 0.96, 0.32, s * 0.24, g, 6, 5);
  cy(0.035, 0.04, 2.0, M(0x3a3f44), 1.35, 1.0, -0.2, g, 8); sp(0.14, MB(0xfff0b8), 1.35, 2.05, -0.2, g, 8, 6); return g; }
const PROPS = { revenus: propRevenus, emplois: propEmplois, logements: propLogements, soins: propSoins, education: propEducation, services: propServices };

export function buildS16(root) {
  const g = new T.Group(); root.add(g); const S = { g };
  // sol sombre + plateformes
  { const ft = floorTex(); ft.repeat.set(48, 30); const fl = new T.Mesh(new T.PlaneGeometry(190, 120), new T.MeshLambertMaterial({ map: ft, emissive: 0x030a06 })); fl.rotation.x = -Math.PI / 2; fl.position.set(0, -0.32, -10); g.add(fl); }
  S.platL = bx(5.5, 0.3, 12.4, M(0x0f3a24, 0x0c3220), LX, -0.15, -0.9, g); S.platR = bx(5.5, 0.3, 12.4, M(0x1a2a36, 0x0e1822), 3.1, -0.15, -0.9, g);
  for (const [x, c] of [[LX, 0x47f0a0], [3.1, 0x9fb4c8]]) { bx(5.5, 0.05, 0.08, MB(c), x, 0.0, 5.3, g); bx(5.5, 0.05, 0.08, MB(c), x, 0.0, -7.1, g); }
  S.divider = bx(0.1, 0.06, 12.2, MB(0xe8b84a), 0, 0.02, -0.9, g); S.divGlow = glow(0xffd27a, 7, 0.0); S.divGlow.position.set(0, 0.6, 1.2); g.add(S.divGlow);
  // —— côté gauche : tas de billets, pluie, personnes, étiquette
  { const prof = []; const SEG = 36; for (let i = 0; i <= SEG; i++) { const r = i / SEG; prof.push(new T.Vector2(Math.max(0.0001, r), 1 - r * r)); }
    const hg = new T.LatheGeometry(prof.reverse(), 64); const pos = hg.attributes.position;
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i); const a = Math.atan2(z, x), rr = Math.hypot(x, z); const n = 1 + 0.03 * Math.sin(a * 7 + y * 5) + 0.02 * Math.sin(a * 13 - rr * 9); pos.setXYZ(i, x * n, y * (0.96 + 0.08 * Math.sin(a * 5 + rr * 8)), z * n); } hg.computeVertexNormals();
    S.heap = new T.Mesh(hg, new T.MeshLambertMaterial({ map: texHeap(), emissive: 0x062a14 })); S.heap.position.set(LX, 0, MZ); g.add(S.heap);
    S.heapGlow = glow(0xffd27a, 9, 0.3); S.heapGlow.position.set(LX, 3.4, MZ + 1.0); g.add(S.heapGlow); }
  S.rain = new T.InstancedMesh(billBoxGeo(), billBoxMats(), NR); S.rain.frustumCulled = false; g.add(S.rain);
  { const NP = 36; S.crowd = makeCrowd(NP, { bodyH: 0.7 }); g.add(S.crowd.bodies, S.crowd.heads); S.people = [];
    for (let i = 0; i < NP; i++) { const a = -0.15 * Math.PI + H(i, 31) * 1.3 * Math.PI, r = 2.7 + 0.9 * H(i, 32); let x = LX + Math.cos(a) * r, z = MZ + Math.sin(a) * r * 0.95; x = clamp(x, LX - 2.5, LX + 2.45); z = clamp(z, -4.6, 4.3); S.people.push({ x, z, ph: H(i, 33) * 6.28, t0: T16.personnes + 0.02 * i, ry: Math.atan2(LX - x, MZ - z) }); } }
  S.peakRing = new T.Mesh(new T.RingGeometry(1, 1.12, 64), new T.MeshBasicMaterial({ color: 0xffe6a0, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); S.peakRing.rotation.x = -Math.PI / 2; S.peakRing.position.set(LX, 0.08, MZ); g.add(S.peakRing);
  { const n = 150, pos = new Float32Array(n * 3), col = new Float32Array(n * 3); const geo = new T.BufferGeometry(); geo.setAttribute("position", new T.BufferAttribute(pos, 3)); geo.setAttribute("color", new T.BufferAttribute(col, 3));
    const pts = new T.Points(geo, new T.PointsMaterial({ size: 0.5, map: glowTex(), vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); pts.frustumCulled = false; g.add(pts); S.dust = { pos, col, n, geo }; }
  S.labL = textPlane("ARGENT IMMÉDIAT", { w: 4.2, h: 0.7, px: 640, size: 0.5, color: "#fff4cf", bg: "rgba(8,28,18,.7)", border: "#47f0a0" }); S.labL.position.set(LX, 4.6, MZ + 1.6); g.add(S.labL);
  // —— côté droit : six emplacements fantômes + éléments durables
  S.tiles = TILES.map((d, i) => { const grp = new T.Group(); grp.position.set(d.x, 0, d.z); g.add(grp);
    const ghost = new T.Mesh(new T.PlaneGeometry(2.5, 2.5), new T.MeshBasicMaterial({ map: texSocket(d.icon), transparent: true, depthWrite: false })); ghost.rotation.x = -Math.PI / 2; ghost.position.y = 0.03; grp.add(ghost);
    const plinth = new T.Group(); grp.add(plinth); cy(1.0, 1.05, 0.3, M(0x1d2a33, 0x0a1218), 0, 0.15, 0, plinth, 28); const rim = cy(1.03, 1.03, 0.05, MB(d.hex), 0, 0.32, 0, plinth, 28); const prop = PROPS[d.id](); prop.position.y = 0.3; prop.userData.s0 = 1.2; grp.add(prop);
    const lab = textPlane(d.label, { w: 2.3, h: 0.58, px: 512, size: 0.52, color: "#ffffff", bg: "rgba(10,18,24,.88)", border: "#" + d.hex.toString(16).padStart(6, "0") }); lab.position.set(0, 0.62, 1.6); lab.material.depthTest = false; lab.renderOrder = 6; grp.add(lab);
    const beam = new T.Mesh(new T.CylinderGeometry(0.7, 0.95, 4.4, 20, 1, true), new T.MeshBasicMaterial({ color: d.hex, map: texBeam(), transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); beam.position.y = 2.2; grp.add(beam);
    const shock = new T.Mesh(new T.RingGeometry(1, 1.12, 40), new T.MeshBasicMaterial({ color: d.hex, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); shock.rotation.x = -Math.PI / 2; shock.position.y = 0.06; grp.add(shock);
    const gl = glow(d.hex, 4.5, 0); gl.position.set(0, 1.4, 0.6); grp.add(gl);
    return { grp, ghost, plinth, prop, lab, beam, shock, gl, rim, d, t0: TILE_T[i] }; });
  S.labR = textPlane("STABILITÉ DURABLE", { w: 4.4, h: 0.7, px: 640, size: 0.5, color: "#e8f4ff", bg: "rgba(12,22,32,.72)", border: "#9fb4c8" }); S.labR.position.set(3.1, 2.7, -7.2); g.add(S.labR);
  // chaîne dorée entre les éléments (se tisse au fur et à mesure) + impulsions régulières
  S.links = []; for (let i = 0; i < 5; i++) { const a = TILES[i], b = TILES[i + 1]; const len = Math.hypot(b.x - a.x, b.z - a.z); const m = bx(0.16, 0.07, 1, MB(0xe8b84a), 0, 0.1, 0, g); m.position.set((a.x + b.x) / 2, 0.1, (a.z + b.z) / 2); m.rotation.y = Math.atan2(b.x - a.x, b.z - a.z); m.userData = { len, a, b }; S.links.push(m); }
  S.pulse = new T.InstancedMesh(new T.SphereGeometry(0.16, 8, 6), new T.MeshBasicMaterial({ color: 0xffe6a0 }), 20); S.pulse.frustumCulled = false; g.add(S.pulse);
  return S;
}

export function updateS16(S, t) {
  const rt = rain(t);
  // ---- pluie : chaque billet descend en spirale douce vers le tas ; au contact il disparaît dans le tas qui grossit
  let landed = 0;
  for (let j = 0; j < NR; j++) {
    const s0 = SPAWN[j], D = FALL[j], u = (t - s0) / D; if (u >= 1) { landed++; hide(S.rain, j); continue; } if (u < 0) { hide(S.rain, j); continue; }
    const cNow = Math.min(NR, j * 1 + 1); const hh = heapH(Math.max(j, 8)) , rr = heapR(Math.max(j, 8));
    const a = H(j, 22) * 6.283, rad = Math.sqrt(H(j, 23)) * rr * 0.8; const tx = LX + Math.cos(a) * rad, tz = MZ + Math.sin(a) * rad * 0.9, ty = hh * (1 - (rad / rr) * (rad / rr)) + 0.1;
    const x0 = LX + (H(j, 24) - 0.5) * 8, y0 = 12 + 3 * H(j, 25), z0 = MZ + (H(j, 26) - 0.5) * 7;
    const e = 1 - Math.pow(1 - u, 1.0), fy = Math.pow(u, 1.75); const sway = 0.5 * Math.sin(u * 8 + H(j, 27) * 6) * (1 - u);
    const x = lerp(x0, tx, eio(e)) + sway, z = lerp(z0, tz, eio(e)) + 0.3 * Math.cos(u * 7 + j), y = lerp(y0, ty, fy);
    put(S.rain, j, x, y, z, 0.5, 0.5, 0.5, u * (5 + 4 * H(j, 28)) + H(j, 29) * 6, u * (3 + 3 * H(j, 30)), Math.sin(u * 7 + j) * 0.6);
    S.rain.setColorAt(j, _c.setScalar(1 - 0.6 * sstep(7, 14, y)));
  }
  S.rain.instanceMatrix.needsUpdate = true; if (S.rain.instanceColor) S.rain.instanceColor.needsUpdate = true;
  { const m = S.dust; const k = 0.5 + 0.5 * sstep(T16.mais, T16.mais + 1, t); for (let i = 0; i < m.n; i++) { const x = -12 + 24 * H(i, 71) + Math.sin(t * 0.4 + i) * 0.4, y = 1 + ((H(i, 72) * 20 + t * (0.3 + 0.4 * H(i, 73))) % 20), z = -14 + 18 * H(i, 74); m.pos[i * 3] = x; m.pos[i * 3 + 1] = y; m.pos[i * 3 + 2] = z; const b = (0.3 + 0.3 * Math.sin(t * 1.6 + i * 1.7)) * k * (1 - 0.7 * sstep(10, 20, y)); m.col[i * 3] = b; m.col[i * 3 + 1] = 0.82 * b; m.col[i * 3 + 2] = 0.42 * b; } m.geo.attributes.position.needsUpdate = true; m.geo.attributes.color.needsUpdate = true; }
  { const u = clamp((t - T16.enormement) / 0.9); S.peakRing.visible = u > 0 && u < 1; S.peakRing.scale.setScalar(1.2 + 3.4 * eout(u)); S.peakRing.material.opacity = 0.5 * (1 - u) * (1 - u); }
  // ---- tas
  { const c = landed; const hh = heapH(c), rr = heapR(c); S.heap.scale.set(rr, hh, rr); S.heapGlow.position.y = hh + 1.4; S.heapGlow.material.opacity = 0.12 + 0.3 * rt + 0.1 * Math.sin(t * 3); S.heapGlow.scale.setScalar(7 + 3 * rt); }
  // ---- personnes aidées (apparaissent sur « personnes », sautillent de joie)
  { const cr = S.crowd; S.people.forEach((p, i) => { const k = pop(t, p.t0, 0.3); const jump = Math.abs(Math.sin(t * 5.2 + p.ph)) * 0.22 * sstep(p.t0, p.t0 + 0.6, t) * (1 - 0.6 * sstep(T16.mais, T16.mais + 0.5, t)); setCrowd(cr, i, p.x, jump, p.z, 0.7 * k, p.ry, 0.06 * Math.sin(t * 3 + p.ph)); }); flushCrowd(cr); }
  { const end = t >= 69.9;   // avant : au-dessus du tas, s'efface avant que le traveling ne le fasse sortir du cadre ; fin de plan : derrière le tas (vue plongeante), il revient sans couvrir les personnes
    const v = pop(t, 64.85, 0.3) * (end ? pop(t, 70.4, 0.3) : 1 - sstep(67.25, 67.6, t));
    if (end) { S.labL.position.set(LX, 1.3, MZ - 3.5); S.labL.rotation.x = -(0.45 + 0.4 * sstep(69.8, 70.8, t)); } else { S.labL.position.set(LX, 4.6, MZ + 1.6); S.labL.rotation.x = 0; }
    S.labL.visible = v > 0.01; S.labL.scale.set(Math.max(1e-4, v), Math.max(1e-4, v), 1); }
  // ---- ligne de partage : éclair sur « Mais »
  { const f = Math.exp(-Math.pow((t - T16.mais - 0.05) / 0.16, 2)); S.divider.scale.set(1 + 5 * f, 1 + 2 * f, 1); S.divGlow.material.opacity = 0.18 + 0.7 * f; S.divGlow.scale.set(7 + 9 * f, 3 + 3 * f, 1); }
  // ---- six éléments durables
  S.tiles.forEach((P, i) => { const t0 = P.t0; const dt = t - t0; const on = pop(t, t0, 0.32), onP = pop(t, t0 + 0.06, 0.4);
    P.ghost.material.opacity = (0.55 + 0.1 * Math.sin(t * 2 + i)) * (1 - sstep(t0 - 0.02, t0 + 0.25, t));
    P.plinth.scale.set(Math.max(1e-4, on), Math.max(1e-4, on), Math.max(1e-4, on)); P.plinth.visible = on > 0.01; P.prop.scale.setScalar(Math.max(1e-4, onP * 1.2)); P.prop.visible = onP > 0.01;
    P.lab.rotation.x = -(0.45 + 0.4 * sstep(69.8, 70.8, t)); const lp = pop(t, t0 + 0.03, 0.22); P.lab.visible = lp > 0.01; P.lab.scale.set(Math.max(1e-4, lp), Math.max(1e-4, lp), 1);
    P.beam.material.opacity = dt > 0 ? 0.5 * Math.exp(-dt * 3.4) : 0; P.beam.visible = dt > 0 && dt < 1.2; P.beam.scale.set(1 + 0.4 * dt, 1, 1 + 0.4 * dt);
    const su = clamp(dt / 0.7); P.shock.visible = dt > 0 && dt < 0.75; P.shock.scale.setScalar(1 + 2.4 * eout(su)); P.shock.material.opacity = 0.8 * (1 - su);
    P.gl.material.opacity = dt > 0 ? clamp(0.5 * Math.exp(-dt * 3) + 0.1, 0, 0.6) : 0;
    // animations d'usage
    const pr = P.prop, ud = pr.userData;
    if (ud.coins) { const n = 6; for (let j = 0; j < n; j++) { const f = (((t - 67.68) / 0.5) + j / n) % 1; const fy = 0.98 - 0.62 * f * f; put(ud.coins, j, 0, fy, -0.3, 1, 1, 1, 0, f * 4, 0); if (t < t0 + 0.2) hide(ud.coins, j); } ud.coins.instanceMatrix.needsUpdate = true; ud.wheel.rotation.y = t * 2.2; }
    if (ud.persons) ud.persons.forEach((p) => { const ph = p.userData.ph; p.userData.armR.rotation.x = -1.5 + 0.8 * Math.sin(t * 7 + ph); p.userData.armL.rotation.x = -1.1 + 0.5 * Math.sin(t * 7 + ph + 1); p.userData.body.rotation.x = 0.06 * Math.sin(t * 7 + ph); });
    if (ud.cross) { ud.cross.rotation.y = t * 1.6; ud.cross.position.y = 1.85 + 0.08 * Math.sin(t * 2.4); }
    if (ud.cap) { ud.cap.position.y = 0.72 + 0.06 * Math.sin(t * 2.2); ud.cap.rotation.y = 0.3 * Math.sin(t * 1.1); }
    if (ud.wheels) { ud.wheels.forEach((w) => { w.rotation.y = 0; }); pr.position.x = 0.0 + 0.05 * Math.sin(t * 2.5); pr.position.y = 0.3 + 0.015 * Math.abs(Math.sin(t * 9)); }
  });
  { const v = pop(t, T16.mais + 0.2, 0.32) * (1 - sstep(T16.durablement - 0.05, T16.durablement + 0.2, t)); S.labR.visible = v > 0.01; S.labR.scale.set(Math.max(1e-4, v), Math.max(1e-4, v), 1); }
  // ---- chaîne et impulsions régulières (flux durable)
  S.links.forEach((m, i) => { const a = S.tiles[i].t0, b = S.tiles[i + 1].t0; const u = eio(lin(Math.max(a, b) + 0.12, Math.max(a, b) + 0.5, t)); const len = m.userData.len; m.visible = u > 0.005; m.scale.set(1, 1, Math.max(1e-3, (len - 2.2) * u)); const A = m.userData.a, B = m.userData.b; const dx = B.x - A.x, dz = B.z - A.z, l2 = Math.hypot(dx, dz); const s = (1.1 + ((len - 2.2) * u) / 2) / l2; m.position.set(A.x + dx * s, 0.1, A.z + dz * s); m.scale.z = Math.max(1e-3, len - 2.2) * u; });
  { let k = 0; const live = lin(T16.pauvrete, T16.pauvrete + 0.4, t); for (let i = 0; i < 5; i++) { const m = S.links[i]; const A = m.userData.a, B = m.userData.b; const lenN = m.userData.len; for (let j = 0; j < 4; j++) { if (k >= 20) break; const f = ((t * 0.55 + j / 4 + i * 0.13) % 1); const x = lerp(A.x, B.x, f), z = lerp(A.z, B.z, f); const vis = i < 5 && live > 0 && f > 0.1 && f < 0.9; if (vis) put(S.pulse, k, x, 0.2, z, 1, 1, 1); else hide(S.pulse, k); k++; } } for (; k < 20; k++) hide(S.pulse, k); S.pulse.instanceMatrix.needsUpdate = true; }
  // ---- la scène se rassemble en fin de plan : plateformes se rapprochent, ligne de partage s'estompe
  { const m = eio(lin(T16.pauvrete + 0.1, T16.pauvrete + 0.7, t)); S.divider.material.color.setHex(mixHex(0xe8b84a, 0x6a7a6a, m).getHex()); }
}

export const S16_LIGHTS = (t) => {
  const mid = sstep(T16.mais - 0.1, T16.mais + 0.6, t), fin = sstep(T16.pauvrete, T16.pauvrete + 0.8, t);
  return {
    hemiC: mixHex(0xcfeee0, 0xdde8f0, mid).getHex(), hemiG: 0x0a2a20, hemi: lerp(1.15, 1.1, mid),
    dirC: mixHex(0xfff0cf, 0xdfe8ff, mid).getHex(), dir: lerp(1.35, 1.2, mid), dirP: [10, 22, 24],
    ptC: mixHex(0xffc34d, 0xffe0a8, fin).getHex(), ptP: [lerp(-3.1, 0.0, fin), 7, 4], pt: lerp(26 + 40 * rain(t), 18, mid), ptD: 45,
  };
};
export const S16_ENV = (t) => ({ bg: 0x020705, fog: 0.011 });
export const S16_SHAKE = () => 0;
