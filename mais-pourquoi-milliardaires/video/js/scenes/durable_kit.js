// Boîte à outils du module « durable » : matériaux, pictogrammes canvas, accessoires 3D, aides d'instanciation. Aucun état, aucune horloge.
import { T, PAL, SKIN, CLOTH, H, clamp, lerp, sstep, lin, eio, eout, ein, eoutBack, kf, mk, FONT, MONO, billTex, glowTex, floorTex, textPlane, makePerson, glow } from "../shared.js";
export { T, PAL, SKIN, CLOTH, H, clamp, lerp, sstep, lin, eio, eout, ein, eoutBack, kf, mk, FONT, MONO, billTex, glowTex, floorTex, textPlane, makePerson, glow };

/* ---------- matériaux (cache) et primitives ---------- */
const _m = new Map();
export const M = (c, e = 0) => { const k = c + ":" + e; let m = _m.get(k); if (!m) { m = new T.MeshLambertMaterial({ color: c, emissive: e }); _m.set(k, m); } return m; };
export const MB = (c) => { const k = "b" + c; let m = _m.get(k); if (!m) { m = new T.MeshBasicMaterial({ color: c }); _m.set(k, m); } return m; };
export const mesh = (geo, mat, x = 0, y = 0, z = 0, parent) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); if (parent) parent.add(m); return m; };
export const bx = (w, h, d, mat, x, y, z, p) => mesh(new T.BoxGeometry(w, h, d), mat, x, y, z, p);
export const cy = (rt, rb, h, mat, x, y, z, p, seg = 16) => mesh(new T.CylinderGeometry(rt, rb, h, seg), mat, x, y, z, p);
export const sp = (r, mat, x, y, z, p, ws = 14, hs = 10) => mesh(new T.SphereGeometry(r, ws, hs), mat, x, y, z, p);
export const _o = new T.Object3D();
export const _c = new T.Color();
export const _v = new T.Vector3();
export const put = (im, i, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) => { _o.position.set(x, y, z); _o.rotation.set(rx, ry, rz); _o.scale.set(sx, sy, sz); _o.updateMatrix(); im.setMatrixAt(i, _o.matrix); };
export const hide = (im, i) => { _o.position.set(0, -999, 0); _o.rotation.set(0, 0, 0); _o.scale.set(1e-4, 1e-4, 1e-4); _o.updateMatrix(); im.setMatrixAt(i, _o.matrix); };
export const mixHex = (a, b, u, out = _c) => { out.setHex(a); const r = out.r, g = out.g, bl = out.b; out.setHex(b); out.r = r + (out.r - r) * u; out.g = g + (out.g - g) * u; out.b = bl + (out.b - bl) * u; return out; };
export const hexMix = (a, b, u) => mixHex(a, b, u).getHex();
export const pop = (t, t0, d = 0.3) => { const u = (t - t0) / d; return u <= 0 ? 0 : u >= 1 ? 1 : eoutBack(u); };
export const setS = (o, s) => { o.visible = s > 0.003; o.scale.setScalar(Math.max(1e-4, s)); };
export const bez = (p0, c, p1, s, out) => { const a = (1 - s) * (1 - s), b = 2 * (1 - s) * s, d = s * s; out.set(a * p0[0] + b * c[0] + d * p1[0], a * p0[1] + b * c[1] + d * p1[1], a * p0[2] + b * c[2] + d * p1[2]); return out; };
const _t = {}; export const once = (k, f) => (_t[k] ??= f());

/* ---------- pictogrammes (dessinés en canvas, sans texte sauf mention) ---------- */
export function drawIcon(g, kind, cx, cy2, s, fg = "#fff", bg = "#000") {
  g.save(); g.translate(cx, cy2); g.scale(s, s); g.fillStyle = fg; g.strokeStyle = fg; g.lineJoin = "round"; g.lineCap = "round";
  const poly = (pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); };
  const rr = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); g.fill(); };
  const circ = (x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
  const on = (c) => { g.fillStyle = c; };
  switch (kind) {
    case "house": poly([[-1, -0.05], [0, -0.95], [1, -0.05], [0.8, -0.05], [0.8, 0.85], [-0.8, 0.85], [-0.8, -0.05]]); on(bg); rr(-0.2, 0.2, 0.4, 0.65, 0.05); rr(0.38, 0.05, 0.26, 0.26, 0.03); break;
    case "bread": g.rotate(-0.4); g.beginPath(); g.ellipse(0, 0, 0.98, 0.46, 0, 0, 7); g.fill(); g.strokeStyle = bg; g.lineWidth = 0.1; for (const k of [-0.5, 0, 0.5]) { g.beginPath(); g.moveTo(k - 0.12, -0.3); g.lineTo(k + 0.14, 0.3); g.stroke(); } break;
    case "bolt": poly([[0.18, -1], [-0.6, 0.12], [-0.06, 0.12], [-0.26, 1], [0.62, -0.18], [0.06, -0.18]]); break;
    case "bus": rr(-0.95, -0.62, 1.9, 1.35, 0.22); on(bg); rr(-0.8, -0.46, 0.5, 0.5, 0.06); rr(-0.2, -0.46, 0.5, 0.5, 0.06); rr(0.4, -0.46, 0.4, 0.5, 0.06); rr(-0.9, 0.2, 1.8, 0.07, 0.02); on(fg); circ(-0.5, 0.78, 0.24); circ(0.5, 0.78, 0.24); on(bg); circ(-0.5, 0.78, 0.1); circ(0.5, 0.78, 0.1); break;
    case "cross": rr(-0.3, -0.95, 0.6, 1.9, 0.12); rr(-0.95, -0.3, 1.9, 0.6, 0.12); break;
    case "cap": poly([[0, -0.62], [1, -0.12], [0, 0.38], [-1, -0.12]]); g.beginPath(); g.moveTo(-0.55, 0.12); g.lineTo(-0.55, 0.55); g.quadraticCurveTo(0, 0.98, 0.55, 0.55); g.lineTo(0.55, 0.12); g.lineTo(0, 0.4); g.closePath(); g.fill(); g.lineWidth = 0.08; g.beginPath(); g.moveTo(0.82, -0.06); g.lineTo(0.82, 0.5); g.stroke(); circ(0.82, 0.6, 0.11); break;
    case "case": g.lineWidth = 0.14; g.beginPath(); g.roundRect(-0.38, -0.8, 0.76, 0.5, 0.1); g.stroke(); rr(-0.95, -0.45, 1.9, 1.3, 0.15); on(bg); rr(-0.95, 0.1, 1.9, 0.07, 0); rr(-0.13, 0.0, 0.26, 0.28, 0.04); break;
    case "factory": rr(-0.95, 0.0, 1.9, 0.88, 0.04); poly([[-0.95, 0], [-0.95, -0.55], [-0.35, 0]]); poly([[-0.35, 0], [-0.35, -0.55], [0.25, 0]]); rr(0.5, -0.95, 0.32, 0.98, 0.02); on(bg); rr(-0.75, 0.2, 0.32, 0.26, 0.03); rr(-0.2, 0.2, 0.32, 0.26, 0.03); rr(0.35, 0.2, 0.32, 0.26, 0.03); rr(-0.2, 0.58, 0.4, 0.3, 0.02); break;
    case "people": for (const [x, y, r, bc, br] of [[-0.72, -0.18, 0.25, 0.86, 0.5], [0.72, -0.18, 0.25, 0.86, 0.5], [0, -0.5, 0.32, 0.78, 0.76]]) { circ(x, y, r); g.beginPath(); g.arc(x, bc, br, Math.PI, 0); g.fill(); } break;
    case "coin": { g.beginPath(); g.arc(0, 0, 0.56, 0, 7); g.fill(); g.lineWidth = 0.15; g.beginPath(); g.arc(0, 0, 0.9, 0.5, 5.4); g.stroke(); poly([[0.77, -0.5], [0.69, -0.84], [0.43, -0.53]]); g.save(); g.scale(1 / s, 1 / s); g.fillStyle = bg; g.font = `900 ${0.72 * s}px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("€", 0, 0.03 * s); g.restore(); break; }
    case "crate": rr(-0.85, -0.85, 1.7, 1.7, 0.1); g.strokeStyle = bg; g.lineWidth = 0.12; g.beginPath(); g.roundRect(-0.6, -0.6, 1.2, 1.2, 0.04); g.stroke(); g.beginPath(); g.moveTo(-0.6, -0.6); g.lineTo(0.6, 0.6); g.moveTo(0.6, -0.6); g.lineTo(-0.6, 0.6); g.stroke(); break;
    case "columns": poly([[-1, -0.4], [0, -0.98], [1, -0.4]]); rr(-1, -0.3, 2, 0.14, 0.02); for (const x of [-0.8, -0.28, 0.28, 0.58 + 0.0]) rr(x - (x === 0.58 ? 0.04 : 0), -0.1, 0.22, 0.74, 0.02); rr(-1, 0.7, 2, 0.18, 0.03); break;
    case "gear": { circ(0, 0, 0.62); for (let i = 0; i < 8; i++) { g.save(); g.rotate(i * Math.PI / 4); rr(-0.14, -0.92, 0.28, 0.4, 0.04); g.restore(); } on(bg); circ(0, 0, 0.26); break; }
    case "x": g.lineWidth = 0.28; g.beginPath(); g.moveTo(-0.7, -0.7); g.lineTo(0.7, 0.7); g.moveTo(0.7, -0.7); g.lineTo(-0.7, 0.7); g.stroke(); break;
    case "check": g.lineWidth = 0.3; g.beginPath(); g.moveTo(-0.7, 0.05); g.lineTo(-0.2, 0.55); g.lineTo(0.72, -0.5); g.stroke(); break;
    default: circ(0, 0, 0.7);
  }
  g.restore();
}
/** pastille ronde (ou carrée arrondie) avec pictogramme */
export function texIcon(kind, { fg = "#ffffff", bg = "#2d6cc0", ring = "rgba(255,255,255,.85)", round = true, size = 192 } = {}) {
  return once(["ic", kind, fg, bg, ring, round, size].join("|"), () => mk(size, size, (g, w, h) => {
    if (bg) { g.fillStyle = bg; g.beginPath(); if (round) g.arc(w / 2, h / 2, w / 2 - 3, 0, 7); else g.roundRect(3, 3, w - 6, h - 6, w * 0.2); g.fill(); }
    if (ring) { g.strokeStyle = ring; g.lineWidth = w * 0.04; g.beginPath(); if (round) g.arc(w / 2, h / 2, w / 2 - 3 - w * 0.035, 0, 7); else g.roundRect(3 + w * 0.035, 3 + w * 0.035, w - 6 - w * 0.07, h - 6 - w * 0.07, w * 0.17); g.stroke(); }
    drawIcon(g, kind, w / 2, h / 2, w * (bg ? 0.285 : 0.4), fg, bg || "#000");
  }));
}
export const planeMat = (map, o = {}) => new T.MeshBasicMaterial({ map, transparent: true, alphaTest: 0.35, side: T.DoubleSide, ...o });
export const iconPlane = (kind, size, opts) => new T.Mesh(new T.PlaneGeometry(size, size), planeMat(texIcon(kind, opts)));

/* ---------- les quatre dépenses essentielles (mêmes couleurs partout) ---------- */
export const EXP = {
  logement: { kind: "house", bg: "#2d6cc0", label: "LOGEMENT", hex: 0x2d6cc0 },
  nourriture: { kind: "bread", bg: "#d98f3a", label: "NOURRITURE", hex: 0xd98f3a },
  energie: { kind: "bolt", bg: "#e1a92c", label: "ÉNERGIE", hex: 0xe1a92c },
  transport: { kind: "bus", bg: "#2a9d8f", label: "TRANSPORT", hex: 0x2a9d8f },
};
export const EXP_KEYS = ["logement", "nourriture", "energie", "transport"];

/* ---------- textures de décor ---------- */
export const texGingham = () => once("gingham", () => mk(128, 128, (g, w, h) => { g.fillStyle = "#f8ecd8"; g.fillRect(0, 0, w, h); g.fillStyle = "rgba(205,70,55,.55)"; for (let i = 0; i < 4; i++) { g.fillRect(i * 32, 0, 16, h); g.fillRect(0, i * 32, w, 16); } }, { repeat: [5, 3] }));
export const texWood = (rep = [8, 8]) => mk(256, 256, (g, w, h) => {
  g.fillStyle = "#a9754a"; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) { const x = c * 128 + (r % 2 ? 64 : 0) - 64; const sh = 150 + ((r * 7 + c * 13) % 5) * 7; g.fillStyle = `rgb(${sh + 25},${sh - 20},${sh - 70})`; g.fillRect(x + 2, r * 64 + 2, 124, 60); g.strokeStyle = "rgba(60,30,10,.35)"; g.lineWidth = 2; g.strokeRect(x + 2, r * 64 + 2, 124, 60); }
}, { repeat: rep });
export const texWall = (base, stripe, rep = [10, 1]) => mk(64, 64, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); g.fillStyle = stripe; g.fillRect(0, 0, 5, h); g.fillStyle = "rgba(255,255,255,.03)"; g.fillRect(32, 0, 2, h); }, { repeat: rep });
export const texTag = () => once("tag", () => mk(320, 96, (g, w, h) => { g.fillStyle = "#d8382b"; g.beginPath(); g.roundRect(3, 3, w - 6, h - 6, 24); g.fill(); g.strokeStyle = "#ffd6cf"; g.lineWidth = 4; g.stroke(); g.fillStyle = "#fff7ee"; g.font = `900 54px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("À PAYER", w / 2, h / 2 + 3); }));
export const texStamp = () => once("stamp", () => mk(512, 200, (g, w, h) => {
  g.strokeStyle = "#17a65a"; g.fillStyle = "#17a65a"; g.lineWidth = 12; g.beginPath(); g.roundRect(8, 8, w - 16, h - 16, 24); g.stroke(); g.lineWidth = 4; g.beginPath(); g.roundRect(26, 26, w - 52, h - 52, 14); g.stroke();
  g.font = `900 104px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("RÉGLÉE", w / 2, h / 2 + 6);
}));
/** facture générique : aucune somme (barres grises seulement). kind: clé de EXP, ou "reglee" (neutre) */
export const texInvoice = (kind) => once("inv" + kind, () => mk(256, 352, (g, w, h) => {
  const ex = EXP[kind]; const head = ex ? ex.bg : "#e1a92c";
  g.fillStyle = "#f6efdb"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(0,0,0,.14)"; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4);
  g.fillStyle = head; g.fillRect(0, 0, w, 84);
  drawIcon(g, ex ? ex.kind : "bolt", 44, 42, 26, "#ffffff", head);
  g.fillStyle = "#fff"; g.font = `900 ${kind === "nourriture" ? 24 : 28}px ${FONT}`; g.textAlign = "left"; g.textBaseline = "middle"; g.fillText(ex ? ex.label : "FACTURE", 82, 44);
  for (let i = 0; i < 5; i++) { const y = 112 + i * 36; g.fillStyle = "rgba(60,60,60,.22)"; g.fillRect(20, y, 96 + (i % 3) * 22, 11); g.fillStyle = "rgba(60,60,60,.42)"; g.fillRect(w - 20 - 56 - (i % 2) * 14, y, 56 + (i % 2) * 14, 11); }
  g.strokeStyle = "rgba(60,60,60,.35)"; g.lineWidth = 2; g.setLineDash([8, 6]); g.beginPath(); g.moveTo(20, 304); g.lineTo(w - 20, 304); g.stroke(); g.setLineDash([]);
  g.fillStyle = "rgba(40,40,40,.55)"; g.fillRect(20, 318, 80, 14); g.fillStyle = "rgba(40,40,40,.8)"; g.fillRect(w - 20 - 90, 314, 90, 20);
}));
export const texLine = () => once("line", () => mk(64, 64, (g, w, h) => { g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); }));

/* ---------- foule instanciée douce ---------- */
export function makeCrowd(n, { bodyH = 0.8 } = {}) {
  const bodyG = new T.CapsuleGeometry(0.25, bodyH, 1, 6); bodyG.translate(0, bodyH * 0.9, 0);
  const headG = new T.SphereGeometry(0.21, 7, 5); headG.translate(0, bodyH * 0.9 + bodyH / 2 + 0.43, 0);
  { const pos = headG.attributes.position, col = []; for (let k = 0; k < pos.count; k++) { const hair = pos.getY(k) > bodyH * 0.9 + bodyH / 2 + 0.5 || pos.getZ(k) < -0.08 ? 0.3 : 1; col.push(hair, hair, hair); } headG.setAttribute("color", new T.Float32BufferAttribute(col, 3)); }
  const bodies = new T.InstancedMesh(bodyG, new T.MeshLambertMaterial({ color: 0xffffff }), n), heads = new T.InstancedMesh(headG, new T.MeshLambertMaterial({ color: 0xffffff, vertexColors: true }), n);
  const c = new T.Color(); for (let i = 0; i < n; i++) { c.setHex(CLOTH[Math.floor(H(i, 5) * 8)]); c.multiplyScalar(0.85 + H(i, 8) * 0.3); bodies.setColorAt(i, c); c.setHex(SKIN[Math.floor(H(i, 6) * 6)]); heads.setColorAt(i, c); }
  bodies.frustumCulled = false; heads.frustumCulled = false; return { bodies, heads, n };
}
export function setCrowd(cr, i, x, y, z, sc, ry = 0, rz = 0) { _o.position.set(x, y, z); _o.rotation.set(0, ry, rz); _o.scale.setScalar(Math.max(1e-4, sc)); _o.updateMatrix(); cr.bodies.setMatrixAt(i, _o.matrix); cr.heads.setMatrixAt(i, _o.matrix); }
export function flushCrowd(cr) { cr.bodies.instanceMatrix.needsUpdate = true; cr.heads.instanceMatrix.needsUpdate = true; }

/* ---------- bandeau (ruban) dont les sommets sont mis à jour à chaque image ---------- */
export function makeRibbon(nPts, mat) {
  const geo = new T.BufferGeometry(); const pos = new Float32Array(nPts * 2 * 3); geo.setAttribute("position", new T.BufferAttribute(pos, 3));
  const idx = []; for (let i = 0; i < nPts - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } geo.setIndex(idx);
  const m = new T.Mesh(geo, mat); m.frustumCulled = false; m.userData = { pos, n: nPts, geo }; return m;
}
export function setRibbon(m, pts, w) { const { pos, n, geo } = m.userData; for (let i = 0; i < n; i++) { const [x, y, z] = pts[i]; pos[i * 6] = x; pos[i * 6 + 1] = y - w / 2; pos[i * 6 + 2] = z; pos[i * 6 + 3] = x; pos[i * 6 + 4] = y + w / 2; pos[i * 6 + 5] = z; } geo.attributes.position.needsUpdate = true; }

/* ---------- accessoires 3D ---------- */
/** billet (boîte mince) : dessus/dessous texturés, tranche verte. Échelle d'instance 0,385 => billet 0,5 x 0,22 */
export function billBoxGeo() { return new T.BoxGeometry(1.3, 0.14, 0.58); }
export function billBoxMats() { const tx = billTex(); const top = new T.MeshBasicMaterial({ map: tx }), side = new T.MeshBasicMaterial({ color: 0x1b6a3b }); return [side, side, top, top, side, side]; }
export function houseMini(wall = 0xf3e5c9, roof = 0xc2543a, s = 1) {
  const g = new T.Group(); bx(1.0, 0.6, 0.8, M(wall), 0, 0.3, 0, g); const r = mesh(new T.ConeGeometry(0.88, 0.55, 4), M(roof), 0, 0.88, 0, g); r.rotation.y = Math.PI / 4; r.scale.z = 0.82;
  bx(0.2, 0.34, 0.04, M(0x6a3b1f), 0, 0.17, 0.41, g); for (const x of [-0.3, 0.3]) bx(0.2, 0.2, 0.04, MB(0xffe29a), x, 0.38, 0.41, g); bx(0.14, 0.34, 0.14, M(0x8a4a3a), 0.3, 1.0, -0.12, g); g.scale.setScalar(s); return g;
}
export function tableLamp() {
  const g = new T.Group(); cy(0.1, 0.12, 0.04, M(0x6a4a2a), 0, 0.02, 0, g, 12); cy(0.014, 0.014, 0.3, M(0x6a4a2a), 0, 0.19, 0, g, 6);
  const sh = new T.Mesh(new T.CylinderGeometry(0.1, 0.17, 0.2, 14, 1, true), new T.MeshBasicMaterial({ color: 0xffd69a, side: T.DoubleSide })); sh.position.y = 0.38; g.add(sh); g.userData.shade = sh; sp(0.05, MB(0xfff3c8), 0, 0.37, 0, g, 8, 6); return g;
}
export function plant(h = 1, pot = 0xc4683f, leaf = 0x3f9d3f, n = 9) {
  const g = new T.Group(); cy(0.2 * h, 0.14 * h, 0.3 * h, M(pot), 0, 0.15 * h, 0, g, 12);
  for (let i = 0; i < n; i++) { const a = i / n * 6.283, l = mesh(new T.ConeGeometry(0.09 * h, 0.7 * h, 5), M(leaf), Math.cos(a) * 0.13 * h, 0.6 * h, Math.sin(a) * 0.13 * h, g); l.rotation.z = Math.cos(a) * 0.5; l.rotation.x = -Math.sin(a) * 0.5; l.position.y = (0.55 + H(i, 3) * 0.2) * h; }
  return g;
}
export function floorLamp() {
  const g = new T.Group(); cy(0.2, 0.24, 0.05, M(0x2a2a2e), 0, 0.025, 0, g, 14); cy(0.03, 0.03, 1.7, M(0x2a2a2e), 0, 0.9, 0, g, 8);
  const sh = new T.Mesh(new T.CylinderGeometry(0.28, 0.42, 0.5, 16, 1, true), new T.MeshBasicMaterial({ color: 0xffd69a, side: T.DoubleSide })); sh.position.y = 1.85; g.add(sh); g.userData.shade = sh; return g;
}
