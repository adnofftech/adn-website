// Scène 17 — « Parce que l'argent ne représente pas seulement ce qu'on possède : il dépend aussi des entreprises, des emplois, des biens et des services
//              qui permettent à une société de fonctionner. »
// Un patrimoine isolé (tas de billets, lingots) au centre d'un plateau sombre ; sur « il dépend aussi » les liens se tissent vers cinq éléments qui s'allument un à un
// (entreprises, emplois, logements, biens, services) ; l'argent et les biens circulent ; travelling arrière jusqu'à l'économie complète, sereine, vue de loin.
import { T, PAL, H, clamp, lerp, sstep, lin, eio, eout, ein, eoutBack, mk, FONT, textPlane, glow, M, MB, mesh, bx, cy, sp, put, hide, mixHex, pop, setS, bez, _o, _c, _v,
  iconPlane, texIcon, planeMat, makeCrowd, setCrowd, flushCrowd, houseMini, floorTex, glowTex, once } from "./durable_kit.js";
import { onset } from "../plan.js";

const o17 = (re, k = 0) => onset(17, re, k);
export const T17 = { argent: o17(/^largent$/), seulement: o17(/^seulement$/), ce: o17(/^ce$/), possede: o17(/^possede$/), il: o17(/^il$/), depend: o17(/^depend$/), aussi: o17(/^aussi$/), entreprises: o17(/^entreprises$/), emplois: o17(/^emplois$/), biens: o17(/^biens$/), services: o17(/^services$/), qui: o17(/^qui$/), permettent: o17(/^permettent$/), societe: o17(/^societe$/), fonctionner: o17(/^fonctionner$/) };
const R = 6.3;
const NODE_DEF = [
  { id: "entreprises", label: "ENTREPRISES", a: -90, t: T17.entreprises, top: 3.9 },
  { id: "emplois", label: "EMPLOIS", a: -18, t: T17.emplois, top: 4.4 },
  { id: "biens", label: "BIENS", a: 54, t: T17.biens, top: 2.7 },
  { id: "logements", label: "LOGEMENTS", a: 126, t: T17.emplois + 0.46, top: 2.7 },
  { id: "services", label: "SERVICES", a: 198, t: T17.services, top: 3.2 },
];
NODE_DEF.forEach((n) => { n.x = Math.cos(n.a * Math.PI / 180) * R; n.z = Math.sin(n.a * Math.PI / 180) * R; });
const P0 = [0, 2.3, 0];

const texHeap = () => once("heap17", () => mk(512, 512, (g, w, h) => { g.fillStyle = "#1d6a3c"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 1500; i++) { const x = H(i, 1) * w, y = H(i, 2) * h, a = H(i, 3) * 3.14, l = 38 + H(i, 4) * 26, s = H(i, 5); g.save(); g.translate(x, y); g.rotate(a);
    g.fillStyle = s < 0.15 ? "#e9d9a0" : `hsl(${135 + H(i, 6) * 18},${42 + H(i, 7) * 22}%,${22 + H(i, 8) * 24}%)`; g.fillRect(-l / 2, -l * 0.22, l, l * 0.44); g.strokeStyle = "rgba(240,215,140,.55)"; g.lineWidth = 1.2; g.strokeRect(-l / 2 + 2, -l * 0.22 + 2, l - 4, l * 0.44 - 4); g.restore(); } }, { repeat: [3, 2] }));
const texWin = () => once("win17", () => mk(128, 256, (g, w, h) => { g.fillStyle = "#6f879c"; g.fillRect(0, 0, w, h); for (let r = 0; r < 10; r++) for (let c = 0; c < 4; c++) { g.fillStyle = H(r * 4 + c, 5) < 0.78 ? "#ffe29a" : "#8fa5b8"; g.fillRect(10 + c * 29, 10 + r * 24, 20, 15); } }));
const texAwning = () => once("awn17", () => mk(128, 32, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#f4f1e6" : "#d8382b"; g.fillRect(i * 16, 0, 16, h); } }));

function registerLit(grp) { const mats = []; grp.traverse((o) => { if (o.isMesh && o.material && !Array.isArray(o.material)) { const m = o.material.clone(); m.userData = { c: m.color.clone(), e: m.emissive ? m.emissive.clone() : null }; o.material = m; mats.push(m); } }); grp.userData.mats = mats; }
const setLit = (grp, u) => { const k = 0.07 + 0.93 * u; for (const m of grp.userData.mats) { m.color.copy(m.userData.c).multiplyScalar(k); if (m.userData.e) m.emissive.copy(m.userData.e).multiplyScalar(k); } };

/* ---------- les cinq éléments ---------- */
function nodeEntreprises() { const g = new T.Group(); const body = M(0x8aa6c0, 0x0c1218), roof = M(0x3f5f7a, 0x0a1218);
  bx(3.6, 1.5, 2.3, body, 0, 0.75, 0, g);
  for (let i = 0; i < 3; i++) { const s = bx(1.1, 0.7, 2.3, roof, -1.2 + i * 1.2, 1.78, 0, g); s.rotation.z = 0.0; const w = bx(0.06, 0.62, 2.3, MB(0xcfe6ff), -1.2 + i * 1.2 + 0.55, 1.78, 0, g); }
  for (const x of [1.05, 1.5]) cy(0.2, 0.24, 1.7, M(0x6a5a52, 0x120c08), x, 2.3, -0.55, g, 10);
  for (let i = 0; i < 5; i++) bx(0.38, 0.34, 0.04, MB(0xffe29a), -1.35 + i * 0.68, 0.95, 1.16, g);
  bx(0.9, 0.8, 0.05, M(0x1b2433), 0, 0.4, 1.16, g); const lg = iconPlane("factory", 0.8, { bg: "#2d6cc0" }); lg.position.set(0, 1.55, 1.2); g.add(lg);
  bx(2.6, 0.1, 0.55, M(0x3a3f44), 0, 0.05, 1.75, g); for (let i = 0; i < 3; i++) bx(0.34, 0.3, 0.34, M(0xb98a52, 0x1a1008), -0.8 + i * 0.8, 0.25, 1.75, g);
  g.scale.setScalar(1.15); return g; }
function nodeEmplois() { const g = new T.Group(); const t = texWin(); const tw = new T.Mesh(new T.BoxGeometry(1.7, 3.3, 1.7), new T.MeshLambertMaterial({ map: t, emissive: 0x302820, emissiveMap: t })); tw.position.y = 1.65; g.add(tw);
  bx(1.8, 0.14, 1.8, M(0xcfd8e0), 0, 3.35, 0, g); bx(0.9, 0.5, 0.9, M(0xb9c7d6, 0x0c1218), 0.1, 3.7, 0, g); const lg = iconPlane("case", 0.62, { bg: "#2d6cc0" }); lg.position.set(0, 0.7, 0.9); g.add(lg);
  bx(3.2, 0.06, 2.2, M(0x2c3a36, 0x0a1210), 0.5, 0.03, 1.9, g); g.scale.setScalar(1.0); return g; }
function nodeBiens() { const g = new T.Group(); bx(2.8, 1.2, 1.9, M(0xe8d8b8, 0x1a1608), 0, 0.6, 0, g); bx(2.9, 0.1, 2.0, M(0xc2543a, 0x1a0a06), 0, 1.25, 0, g);
  const aw = new T.Mesh(new T.BoxGeometry(2.9, 0.07, 0.85), new T.MeshLambertMaterial({ map: texAwning(), emissive: 0x201814 })); aw.position.set(0, 1.0, 1.25); aw.rotation.x = 0.38; g.add(aw);
  bx(1.4, 0.8, 0.05, M(0x1b2433), 0, 0.4, 0.96, g); for (const x of [-1.2, 1.2]) bx(0.5, 0.5, 0.05, MB(0xffe29a), x, 0.7, 0.96, g);
  const lg = iconPlane("crate", 0.6, { bg: "#d98f3a" }); lg.position.set(0, 1.6, 0.95); g.add(lg);
  for (let i = 0; i < 6; i++) bx(0.46, 0.4, 0.46, M(0xb98a52, 0x1a1008), -1.0 + (i % 3) * 0.55, 0.2 + Math.floor(i / 3) * 0.4, 1.5 + (i % 2) * 0.2, g);
  g.scale.setScalar(1.05); return g; }
function nodeLogements() { const g = new T.Group(); const hs = [[0xf6ead2, 0xc2543a, -1.0, 0.0, 1.5], [0xe9d4b5, 0x8a4a3a, 0.95, -0.35, 1.45], [0xd7e6d2, 0x3f7a6a, 0.0, 1.1, 1.35]];
  hs.forEach(([w, r, x, z, s]) => { const h = houseMini(w, r, s); h.position.set(x, 0, z); g.add(h); }); return g; }
function nodeServices() { const g = new T.Group(); bx(2.1, 1.5, 1.3, M(0xf4f7f6, 0x1a1e1e), -0.7, 0.75, 0, g); bx(2.2, 0.1, 1.4, M(0xcfd8d6), -0.7, 1.55, 0, g); bx(0.6, 0.18, 0.05, M(0xe0453a, 0x5a1008), -0.7, 1.05, 0.67, g); bx(0.18, 0.6, 0.05, M(0xe0453a, 0x5a1008), -0.7, 1.05, 0.67, g);
  bx(0.4, 0.6, 0.05, M(0x3aa6a0, 0x0a2a28), -0.7, 0.3, 0.67, g); const cr = new T.Group(); bx(0.9, 0.28, 0.28, M(0xe0453a, 0x5a1008), 0, 0, 0, cr); bx(0.28, 0.9, 0.28, M(0xe0453a, 0x5a1008), 0, 0, 0, cr); cr.position.set(-0.7, 2.2, 0); g.add(cr); g.userData.cross = cr;
  bx(1.8, 1.0, 1.2, M(0xf0e0b8, 0x1a1608), 1.35, 0.5, 0.2, g); const rf = mesh(new T.ConeGeometry(1.35, 0.6, 4), M(0x2a6a9a, 0x0a1a28), 1.35, 1.3, 0.2, g); rf.rotation.y = Math.PI / 4; rf.scale.z = 0.7; cy(0.025, 0.025, 1.0, M(0x6a6a70), 1.35, 1.9, 0.2, g, 6); bx(0.45, 0.28, 0.02, MB(0xe8b84a), 1.58, 2.25, 0.2, g);
  for (let i = 0; i < 3; i++) bx(0.3, 0.3, 0.04, MB(0xbfe3ff), 0.95 + i * 0.4, 0.62, 0.82, g); g.scale.setScalar(1.05); return g; }
const BUILD = { entreprises: nodeEntreprises, emplois: nodeEmplois, biens: nodeBiens, logements: nodeLogements, services: nodeServices };

/* ---------- liens ---------- */
const ND = (i) => NODE_DEF[i];
const topOf = (i) => [ND(i).x, ND(i).top * 1.15, ND(i).z];
const mkCtrl = (A, B, lift) => [(A[0] + B[0]) / 2, Math.max(A[1], B[1]) + lift, (A[2] + B[2]) / 2];
function linkDefs() {
  const L = [];
  NODE_DEF.forEach((n, i) => { const A = P0, B = topOf(i); L.push({ A, B, C: mkCtrl(A, B, 2.6), kind: "spoke", col: 0xe8b84a, r: 0.05, g0: n.t - 0.62, g1: n.t, pre: true, dir: 1, np: 2, i }); });
  const e = (a, b, g0) => { const A = topOf(a), B = topOf(b); L.push({ A, B, C: mkCtrl(A, B, 1.6), kind: "ring", col: 0x47f0a0, r: 0.07, g0, g1: g0 + 0.5, dir: 1, np: 3, i: a }); };
  e(0, 1, T17.emplois + 0.06); e(1, 2, T17.biens + 0.08); e(2, 3, T17.biens + 0.18); e(3, 4, T17.services + 0.06); e(4, 0, T17.services + 0.2);
  const c = (a, b, g0, dir) => { const A = topOf(a), B = topOf(b); L.push({ A, B, C: mkCtrl(A, B, 3.2), kind: "chord", col: 0xffe6a0, r: 0.055, g0, g1: g0 + 0.55, dir, np: 3, i: a }); };
  c(0, 2, 77.25, 1); c(1, 3, 77.42, 1);
  return L;
}
const LINKS = linkDefs();
const grown = (L, t) => (L.pre ? 0.2 * sstep(T17.il, T17.il + 0.45, t) : 0) + (L.pre ? 0.8 : 1) * eio(lin(L.g0, L.g1, t));

export function buildS17(root) {
  const g = new T.Group(); root.add(g); const S = { g };
  // plateau
  { const ft = floorTex(); ft.repeat.set(6, 6); const gr = new T.Mesh(new T.CircleGeometry(10.8, 72), new T.MeshLambertMaterial({ map: ft, emissive: 0x06160d })); gr.rotation.x = -Math.PI / 2; gr.position.y = 0; g.add(gr); S.ground = gr;
    const out = new T.Mesh(new T.CircleGeometry(120, 48), new T.MeshLambertMaterial({ color: 0x050d09, emissive: 0x020805 })); out.rotation.x = -Math.PI / 2; out.position.y = -0.06; g.add(out);
    const rim = new T.Mesh(new T.TorusGeometry(10.8, 0.09, 6, 96), MB(0xe8b84a)); rim.rotation.x = Math.PI / 2; rim.position.y = 0.04; g.add(rim); S.rim = rim; }
  // patrimoine isolé : tas de billets + lingots + piles de pièces
  { const prof = []; const SEG = 36; for (let i = 0; i <= SEG; i++) { const r = i / SEG; prof.push(new T.Vector2(Math.max(0.0001, r), 1 - r * r)); }
    const hg = new T.LatheGeometry(prof.reverse(), 64); const pos = hg.attributes.position;
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i); const a = Math.atan2(z, x), rr = Math.hypot(x, z); const n = 1 + 0.03 * Math.sin(a * 7 + y * 5) + 0.02 * Math.sin(a * 13 - rr * 9); pos.setXYZ(i, x * n, y * (0.96 + 0.08 * Math.sin(a * 5 + rr * 8)), z * n); } hg.computeVertexNormals();
    const pile = new T.Group(); g.add(pile); S.pile = pile; const hp = new T.Mesh(hg, new T.MeshLambertMaterial({ map: texHeap(), emissive: 0x0a3a1c })); hp.scale.set(2.3, 1.9, 2.3); pile.add(hp);
    const gold = M(0xe8b84a, 0x6a4a08); const bars = [[2.7, 0, 0.9, 0], [2.7, 0.3, 0.9, 0.1], [3.2, 0, 0.5, 0.3], [2.3, 0, 1.6, -0.2], [2.9, 0.3, 1.4, 0.15], [3.3, 0.3, 0.9, -0.1]];
    bars.forEach(([x, y, z, r], i) => { const b = bx(0.9, 0.28, 0.42, gold, x - 0.2, 0.16 + y, z, pile); b.rotation.y = r; });
    for (const [x, z, n] of [[-2.9, 0.9, 5], [-3.4, 0.3, 7], [-2.6, 1.6, 4]]) for (let i = 0; i < n; i++) cy(0.34, 0.34, 0.07, M(0xf2c94a, 0x5a4208), x, 0.04 + i * 0.075, z, pile, 16);
    S.pileGlow = glow(0xffd27a, 12, 0.5); S.pileGlow.position.set(0, 2.2, 1.0); g.add(S.pileGlow);
    S.lab0 = textPlane("CE QU'ON POSSÈDE", { w: 2.7, h: 0.48, px: 640, size: 0.52, color: "#fff4cf", bg: "rgba(10,24,16,.78)", border: "#e8b84a" }); S.lab0.position.set(0, 4.3, 1.2); g.add(S.lab0); }
  // éléments + anneaux d'emplacement
  S.nodes = NODE_DEF.map((d, i) => { const grp = new T.Group(); grp.position.set(d.x, 0, d.z); grp.rotation.y = Math.atan2(-d.x, -d.z); const body = BUILD[d.id](); body.scale.multiplyScalar(1.3); grp.add(body); g.add(grp); registerLit(body);
    const ring = new T.Mesh(new T.RingGeometry(2.6, 2.8, 48), new T.MeshBasicMaterial({ color: 0xe8b84a, transparent: true, opacity: 0.22, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.set(d.x, 0.06, d.z); g.add(ring);
    const flash = new T.Mesh(new T.RingGeometry(1, 1.14, 48), new T.MeshBasicMaterial({ color: 0xffe6a0, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); flash.rotation.x = -Math.PI / 2; flash.position.set(d.x, 0.08, d.z); g.add(flash);
    const gl = glow(0xffe6a0, 7, 0); gl.position.set(d.x, 2.0, d.z + 0.6); g.add(gl);
    const lab = textPlane(d.label, { w: 2.7, h: 0.5, px: 512, size: 0.62, color: "#ffffff", bg: "rgba(10,20,26,.8)", border: "#e8b84a" }); lab.position.set(d.x, d.top * 1.15 + 1.2, d.z + 0.6); g.add(lab);
    return { grp, body, ring, flash, gl, lab, d, i }; });
  // salariés et habitants (instanciés)
  { const NP = 16; S.crowd = makeCrowd(NP, { bodyH: 0.6 }); g.add(S.crowd.bodies, S.crowd.heads); S.ppl = [];
    for (let i = 0; i < NP; i++) { const nd = i < 9 ? 1 : 3; const d = NODE_DEF[nd]; const a = H(i, 41) * 6.28, r = 1.7 + 1.0 * H(i, 42); S.ppl.push({ cx: d.x + Math.cos(a) * r, cz: d.z + Math.sin(a) * r, amp: 0.3 + 0.35 * H(i, 43), ph: H(i, 44) * 6.28, w: 0.8 + 0.8 * H(i, 45), nd, ang: H(i, 46) * 3 }); } }
  // liens (tubes dont on révèle la longueur) + impulsions
  S.links = LINKS.map((L) => { const curve = new T.QuadraticBezierCurve3(new T.Vector3(...L.A), new T.Vector3(...L.C), new T.Vector3(...L.B)); const geo = new T.TubeGeometry(curve, 40, L.r, 6, false); const m = new T.Mesh(geo, new T.MeshBasicMaterial({ color: L.col })); m.userData.total = geo.index.count; m.frustumCulled = false; m.visible = false; g.add(m); return m; });
  S.coins = new T.InstancedMesh(new T.SphereGeometry(0.15, 8, 6), new T.MeshBasicMaterial({ color: 0xffffff }), 64); S.coins.frustumCulled = false; g.add(S.coins);
  { const c = new T.Color(); for (let i = 0; i < 64; i++) S.coins.setColorAt(i, c.setHex(i % 3 === 0 ? 0x47f0a0 : 0xf2c94a)); }
  S.crates = new T.InstancedMesh(new T.BoxGeometry(0.34, 0.3, 0.34), new T.MeshLambertMaterial({ color: 0xc9975c, emissive: 0x3a2410 }), 12); S.crates.frustumCulled = false; g.add(S.crates);
  S.smoke = []; for (let i = 0; i < 8; i++) { const m = sp(0.3, new T.MeshBasicMaterial({ color: 0xcfd6d6, transparent: true, opacity: 0.4, depthWrite: false }), 0, 0, 0, g, 8, 6); S.smoke.push(m); }
  S.wave = new T.Mesh(new T.RingGeometry(1, 1.06, 96), new T.MeshBasicMaterial({ color: 0xffe6a0, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); S.wave.rotation.x = -Math.PI / 2; S.wave.position.y = 0.1; g.add(S.wave);
  // poussière d'or lointaine (donne de la vie au fond, surtout sur le plan large)
  { const n = 180, pos = new Float32Array(n * 3), col = new Float32Array(n * 3); const geo = new T.BufferGeometry(); geo.setAttribute("position", new T.BufferAttribute(pos, 3)); geo.setAttribute("color", new T.BufferAttribute(col, 3));
    const pts = new T.Points(geo, new T.PointsMaterial({ size: 0.6, map: glowTex(), vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); pts.frustumCulled = false; g.add(pts); S.dust = { pos, col, n, geo }; }
  // lueurs de poussière d'or autour du patrimoine (avant la connexion)
  { const n = 70, pos = new Float32Array(n * 3), col = new Float32Array(n * 3); const geo = new T.BufferGeometry(); geo.setAttribute("position", new T.BufferAttribute(pos, 3)); geo.setAttribute("color", new T.BufferAttribute(col, 3));
    const pts = new T.Points(geo, new T.PointsMaterial({ size: 0.28, map: glowTex(), vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); pts.frustumCulled = false; g.add(pts); S.motes = { pos, col, n, geo }; }
  return S;
}

export function updateS17(S, t) {
  // ---- patrimoine : respire ; la lueur retombe quand le système se connecte
  const sys = sstep(T17.il, T17.fonctionner, t);
  S.pile.rotation.y = 0.1 * Math.sin(t * 0.35); S.pileGlow.material.opacity = (0.5 + 0.08 * Math.sin(t * 2)) * (1 - 0.55 * sys); S.pileGlow.scale.setScalar(12 - 3 * sys);
  { const v = pop(t, T17.ce, 0.32) * (1 - sstep(T17.il + 0.1, T17.il + 0.5, t)); S.lab0.visible = v > 0.01; S.lab0.scale.set(Math.max(1e-4, v), Math.max(1e-4, v), 1); }
  { const m = S.motes; const f = 0.9 * (1 - sstep(T17.il, T17.il + 1.0, t)); for (let i = 0; i < m.n; i++) { const a = H(i, 51) * 6.283 + t * (0.25 + 0.2 * H(i, 52)), r = 2.2 + 3.2 * H(i, 53); m.pos[i * 3] = Math.cos(a) * r; m.pos[i * 3 + 1] = 0.5 + ((H(i, 54) * 4 + t * (0.3 + 0.3 * H(i, 55))) % 4.2); m.pos[i * 3 + 2] = Math.sin(a) * r; const b = (0.5 + 0.5 * Math.sin(t * 3 + i)) * f; m.col[i * 3] = b; m.col[i * 3 + 1] = 0.8 * b; m.col[i * 3 + 2] = 0.4 * b; } m.geo.attributes.position.needsUpdate = true; m.geo.attributes.color.needsUpdate = true; }
  { const m = S.dust; const k = sstep(T17.il, T17.entreprises, t); for (let i = 0; i < m.n; i++) { const a = H(i, 61) * 6.283 + t * 0.03, r = 12 + 34 * H(i, 62); m.pos[i * 3] = Math.cos(a) * r; m.pos[i * 3 + 1] = 2 + ((H(i, 63) * 26 + t * (0.25 + 0.3 * H(i, 64))) % 26); m.pos[i * 3 + 2] = Math.sin(a) * r * 0.8 - 8; const b = (0.35 + 0.35 * Math.sin(t * 1.3 + i)) * k; m.col[i * 3] = b; m.col[i * 3 + 1] = 0.82 * b; m.col[i * 3 + 2] = 0.45 * b; } m.geo.attributes.position.needsUpdate = true; m.geo.attributes.color.needsUpdate = true; }
  // ---- éléments : s'allument sur leur mot
  const labScale = 1 + 0.7 * sstep(73.8, 78.6, t);
  S.nodes.forEach((N) => { const t0 = N.d.t; const lit = sstep(t0 - 0.04, t0 + 0.28, t); setLit(N.body, lit);
    const hint = sstep(T17.il, T17.il + 0.5, t); N.ring.material.opacity = (0.2 + 0.12 * hint) * (1 - 0.7 * lit) + 0.25 * lit; N.ring.material.color.setHex(lit > 0.5 ? 0xffe6a0 : 0xe8b84a);
    const dt = t - t0; const fu = clamp(dt / 0.8); N.flash.visible = dt > 0 && dt < 0.85; N.flash.scale.setScalar(1.5 + 2.4 * eout(fu)); N.flash.material.opacity = 0.85 * (1 - fu);
    N.gl.material.opacity = clamp(0.55 * Math.exp(-Math.max(0, dt) * 2.2) * (dt > -0.05 ? 1 : 0) + 0.12 * lit, 0, 0.7); const bp = pop(t, t0 - 0.02, 0.4); N.grp.visible = t > t0 - 0.06; N.grp.scale.set(0.5 + 0.5 * bp, 0.2 + 0.8 * bp, 0.5 + 0.5 * bp);
    const lp = pop(t, t0 + 0.08, 0.3) * labScale; N.lab.visible = lp > 0.01; N.lab.scale.set(Math.max(1e-4, lp), Math.max(1e-4, lp), 1); N.lab.position.y = N.d.top * 1.15 + 0.9 + 0.4 * (labScale - 1);
    if (N.body.userData.cross) { N.body.userData.cross.rotation.y = t * 1.5; N.body.userData.cross.position.y = 2.2 + 0.08 * Math.sin(t * 2.3); } });
  // ---- fumée des cheminées (usine allumée)
  { const N0 = S.nodes[0]; const on = sstep(N0.d.t, N0.d.t + 0.4, t); S.smoke.forEach((m, k) => { const ch = k % 2, f = ((t * 0.28 + k / 8 + ch * 0.2) % 1); const sc = (0.4 + 1.1 * f) * on; m.visible = sc > 0.02; m.position.set(NODE_DEF[0].x + (ch ? 1.5 : 1.05) * 1.15 + 0.6 * f, 2.3 * 1.15 + 2.2 * f, NODE_DEF[0].z - 0.55 * 1.15); m.scale.setScalar(Math.max(1e-3, sc)); m.material.opacity = 0.42 * (1 - f) * on; }); }
  // ---- salariés / habitants
  { S.ppl.forEach((p, i) => { const d = NODE_DEF[p.nd]; const lit = sstep(d.t, d.t + 0.3, t); const k = pop(t, d.t + 0.1 + 0.03 * (i % 8), 0.3); const x = p.cx + Math.sin(t * p.w + p.ph) * p.amp, z = p.cz + Math.cos(t * p.w * 0.8 + p.ph) * p.amp; setCrowd(S.crowd, i, x, 0.03 * Math.abs(Math.sin(t * 5 + p.ph)), z, 0.75 * k, Math.atan2(Math.cos(t * p.w + p.ph), -Math.sin(t * p.w * 0.8 + p.ph)) + p.ang, 0); }); flushCrowd(S.crowd);
    for (let i = 0; i < S.ppl.length; i++) { /* teinte atténuée tant que le nœud n'est pas allumé : les personnes n'existent qu'une fois l'élément allumé */ } }
  // ---- liens
  const live = []; LINKS.forEach((L, i) => { const m = S.links[i]; const u = grown(L, t); m.visible = u > 0.004; const tot = m.userData.total; const cnt = Math.max(0, Math.floor(u * (tot / 36)) * 36); m.geometry.setDrawRange(0, cnt); m.material.color.setHex(L.col); const br = 0.78 + 0.22 * Math.sin(t * 3 + i); m.material.color.multiplyScalar(br); live.push(u); });
  // impulsions d'argent (or / menthe) qui circulent sur les liens déjà tissés
  { let k = 0; LINKS.forEach((L, i) => { const u = live[i]; if (u < 0.05) return; for (let j = 0; j < L.np; j++) { if (k >= 40) break; const spd = L.kind === "spoke" ? 0.42 : 0.3; let f = (t * spd + j / L.np + i * 0.17) % 1; if (L.dir < 0) f = 1 - f; if (f > u) { continue; } const ff = L.kind === "spoke" && t < T17.il + 0.5 ? f : f; bez(L.A, L.C, L.B, ff, _v); const sc = 0.8 + 0.35 * Math.sin(f * Math.PI); put(S.coins, k, _v.x, _v.y, _v.z, sc, sc, sc); k++; } }); for (; k < 40; k++) hide(S.coins, k);
    { const on = (1 - sstep(T17.il - 0.2, T17.il + 0.5, t)) * sstep(T17.argent - 0.3, T17.argent + 0.3, t); for (let j = 0; j < 16; j++) { const a = t * 0.9 + j * 0.39 + 0.5 * Math.sin(j), r = 3.1 + 0.5 * Math.sin(t * 1.3 + j), y = 0.9 + 2.0 * H(j, 81) + 0.25 * Math.sin(t * 2.2 + j); const sc = on * (0.7 + 0.4 * H(j, 82)); put(S.coins, 40 + j, Math.cos(a) * r, y, Math.sin(a) * r * 0.85, Math.max(1e-4, sc), Math.max(1e-4, sc), Math.max(1e-4, sc)); } for (let j = 16; j < 24; j++) hide(S.coins, 40 + j); }
    S.coins.instanceMatrix.needsUpdate = true; }
  // biens qui circulent (caisses) : entreprise -> biens -> logements, et services <-> logements
  { let k = 0; const pathsC = [[10, 1], [7, 1]]; for (const [li, dir] of pathsC) { const L = LINKS[li]; const u = live[li]; if (!L || u < 0.05) continue; for (let j = 0; j < 3; j++) { if (k >= 12) break; let f = (t * 0.22 + j / 3 + li * 0.11) % 1; if (dir < 0) f = 1 - f; if (f > u) continue; bez(L.A, L.C, L.B, f, _v); put(S.crates, k, _v.x, _v.y + 0.25, _v.z, 1, 1, 1, 0, t * 1.5 + j, 0); k++; } } for (; k < 12; k++) hide(S.crates, k); S.crates.instanceMatrix.needsUpdate = true; }
  // ---- onde finale sur « fonctionner »
  { const dt = t - T17.fonctionner; const u = clamp(dt / 1.6); S.wave.visible = dt > 0 && dt < 1.7; S.wave.scale.setScalar(0.5 + 12 * eout(u)); S.wave.material.opacity = 0.7 * (1 - u); S.rim.material.color.setHex(mixHex(0xe8b84a, 0xfff0b8, Math.exp(-Math.pow((t - T17.fonctionner - 0.3) / 0.5, 2))).getHex()); }
}

export const S17_LIGHTS = (t) => {
  const sys = sstep(T17.il, T17.fonctionner - 0.2, t), fin = Math.exp(-Math.pow((t - T17.fonctionner - 0.35) / 0.6, 2));
  return {
    hemiC: mixHex(0xbfe0d0, 0xe6f3ea, sys).getHex(), hemiG: 0x0a2a20, hemi: lerp(0.6, 0.95, sys) + 0.18 * fin,
    dirC: mixHex(0xffe6b8, 0xfff0d0, sys).getHex(), dir: lerp(0.8, 1.15, sys), dirP: [-8, 16, 14],
    ptC: 0xffc860, ptP: [0, 5, 3.5], pt: lerp(55, 20, sys), ptD: 22,
  };
};
export const S17_ENV = (t) => ({ bg: mixHex(0x020504, 0x04100c, sstep(T17.il, T17.fonctionner, t)).getHex(), fog: lerp(0.016, 0.0035, sstep(T17.il, T17.entreprises + 1.5, t)) });
export const S17_SHAKE = () => 0;
