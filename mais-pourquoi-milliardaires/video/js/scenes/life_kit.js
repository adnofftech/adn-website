// Module « life » — boîte à outils : matériaux, textures canvas, personnages chaleureux, accessoires du quotidien.
// Tout est déterministe (aucun hasard non seedé, aucune horloge) et procédural (aucune texture réseau).
import { T, PAL, SKIN, CLOTH, makePerson, textPlane, kf, eio, eout, eoutBack, sstep, lin, H, mk, FONT, MONO, billTex, glowTex, clamp, lerp } from "../shared.js";
export { T, PAL, SKIN, CLOTH, textPlane, kf, eio, eout, eoutBack, sstep, lin, H, mk, FONT, MONO, clamp, lerp };

/* ---------- matériaux partagés ---------- */
const _m = new Map();
export const M = (c, e = 0) => { const k = c + ":" + e; let m = _m.get(k); if (!m) { m = new T.MeshLambertMaterial({ color: c, emissive: e }); _m.set(k, m); } return m; };
export const MB = (c) => { const k = "b" + c; let m = _m.get(k); if (!m) { m = new T.MeshBasicMaterial({ color: c }); _m.set(k, m); } return m; };
export const mesh = (geo, mat, x = 0, y = 0, z = 0, parent) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); if (parent) parent.add(m); return m; };
export const bx = (w, h, d, mat, x, y, z, p) => mesh(new T.BoxGeometry(w, h, d), mat, x, y, z, p);
export const cy = (rt, rb, h, mat, x, y, z, p, seg = 16) => mesh(new T.CylinderGeometry(rt, rb, h, seg), mat, x, y, z, p);
export const sp = (r, mat, x, y, z, p, ws = 14, hs = 10) => mesh(new T.SphereGeometry(r, ws, hs), mat, x, y, z, p);

/* ---------- lueurs et étincelles ---------- */
let _gt; const GT = () => _gt || (_gt = glowTex());
export function glowSprite(color, size, opacity = 1) {
  const s = new T.Sprite(new T.SpriteMaterial({ map: GT(), color, blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity }));
  s.scale.set(size, size, 1); return s;
}
/** Étincelles instanciées (un seul Points) : add(t0, [x,y,z], {n, col, speed, life, up}) puis update(t). Fonction pure de t. */
export function makeSparks(maxPts = 420) {
  const pos = new Float32Array(maxPts * 3), col = new Float32Array(maxPts * 3);
  const geo = new T.BufferGeometry(); geo.setAttribute("position", new T.BufferAttribute(pos, 3)); geo.setAttribute("color", new T.BufferAttribute(col, 3));
  const mat = new T.PointsMaterial({ size: 0.13, map: GT(), vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true });
  const obj = new T.Points(geo, mat); obj.frustumCulled = false;
  const ev = []; let used = 0; const c = new T.Color();
  return {
    obj,
    add(t0, p, o = {}) { const n = o.n ?? 10; if (used + n > maxPts) return; ev.push({ t0, p, n, i0: used, col: o.col ?? 0xffd27a, speed: o.speed ?? 1.6, life: o.life ?? 0.7, up: o.up ?? 0.7, g: o.g ?? 2.2 }); used += n; },
    update(t) {
      col.fill(0);
      for (const e of ev) {
        const tau = t - e.t0; if (tau < 0 || tau > e.life) continue; const k = tau / e.life, f = Math.pow(1 - k, 1.6); c.setHex(e.col);
        for (let j = 0; j < e.n; j++) {
          const i = e.i0 + j, a = H(i, 1) * 6.283, r = 0.35 + H(i, 2) * 0.65, sp2 = e.speed * (0.45 + H(i, 3) * 0.75), u = e.up * (0.25 + H(i, 4));
          pos[i * 3] = e.p[0] + Math.cos(a) * r * sp2 * tau; pos[i * 3 + 1] = e.p[1] + u * sp2 * tau - e.g * tau * tau * 0.5; pos[i * 3 + 2] = e.p[2] + Math.sin(a) * r * sp2 * tau;
          const tw = 0.7 + 0.3 * Math.sin(tau * 40 + j * 2.1); col[i * 3] = c.r * f * tw; col[i * 3 + 1] = c.g * f * tw; col[i * 3 + 2] = c.b * f * tw;
        }
      }
      geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
    },
  };
}
/** Éclats de lumière (sprites additifs) : flash(t0, pos, size, color, dur, peak) */
export function makeFlashes(parent, max = 18) {
  const arr = [];
  for (let i = 0; i < max; i++) { const s = glowSprite(0xffd27a, 1, 0); s.visible = false; parent.add(s); arr.push({ s, used: false }); }
  const ev = []; let k = 0;
  return {
    add(t0, p, size = 2.5, color = 0xffd27a, dur = 0.5, peak = 0.9) { if (k >= max) return; ev.push({ t0, p, size, color, dur, peak, o: arr[k++] }); },
    update(t) { for (const e of ev) { const u = (t - e.t0) / e.dur; const s = e.o.s; if (u < 0 || u > 1) { s.visible = false; continue; } s.visible = true; s.position.set(e.p[0], e.p[1], e.p[2]); const z = e.size * (0.35 + 0.65 * eout(u)); s.scale.set(z, z, 1); s.material.color.setHex(e.color); s.material.opacity = e.peak * Math.pow(1 - u, 1.8) * (u < 0.08 ? u / 0.08 : 1); } },
  };
}

/* ---------- textures canvas ---------- */
const _c = {}; const once = (k, f) => (_c[k] ??= f());
export const billT = () => once("bill", () => billTex());
export const texGingham = () => once("gingham", () => mk(128, 128, (g, w, h) => { g.fillStyle = "#f8ecd8"; g.fillRect(0, 0, w, h); g.fillStyle = "rgba(205,70,55,.55)"; for (let i = 0; i < 4; i++) { g.fillRect(i * 32, 0, 16, h); g.fillRect(0, i * 32, w, 16); } }, { repeat: [5, 3] }));
export const texFloor = (rep = [14, 4]) => mk(256, 256, (g, w, h) => {
  g.fillStyle = "#a9754a"; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 4; r++) { for (let c = 0; c < 2; c++) { const x = c * 128 + (r % 2 ? 64 : 0) - 64 + (c ? 0 : 0); const sh = 150 + ((r * 7 + c * 13) % 5) * 7; g.fillStyle = `rgb(${sh + 25},${sh - 20},${sh - 70})`; g.fillRect(x + 2, r * 64 + 2, 124, 60); g.strokeStyle = "rgba(60,30,10,.35)"; g.lineWidth = 2; g.strokeRect(x + 2, r * 64 + 2, 124, 60); for (let k = 0; k < 4; k++) { g.strokeStyle = "rgba(90,50,20,.18)"; g.beginPath(); g.moveTo(x + 6, r * 64 + 14 + k * 12); g.lineTo(x + 120, r * 64 + 14 + k * 12 + (k % 2 ? 2 : -2)); g.stroke(); } } }
}, { repeat: rep });
export const texWall = (base, stripe, rep = [10, 1]) => mk(64, 64, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); g.fillStyle = stripe; g.fillRect(0, 0, 5, h); g.fillStyle = "rgba(255,255,255,.025)"; g.fillRect(32, 0, 2, h); }, { repeat: rep });
export const texTag = () => once("tag", () => mk(384, 112, (g, w, h) => { g.fillStyle = "#d8382b"; g.beginPath(); g.roundRect(4, 4, w - 8, h - 8, 26); g.fill(); g.strokeStyle = "#ffd6cf"; g.lineWidth = 5; g.stroke(); g.fillStyle = "#fff7ee"; g.font = `900 66px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("À PAYER", w / 2, h / 2 + 4); }));
export const texStamp = () => once("stamp", () => mk(512, 200, (g, w, h) => {
  g.clearRect(0, 0, w, h); g.strokeStyle = "#17a65a"; g.fillStyle = "#17a65a"; g.lineWidth = 12; g.beginPath(); g.roundRect(8, 8, w - 16, h - 16, 24); g.stroke(); g.lineWidth = 4; g.beginPath(); g.roundRect(26, 26, w - 52, h - 52, 14); g.stroke();
  g.font = `900 104px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("RÉGLÉE", w / 2, h / 2 + 6);
  g.globalCompositeOperation = "destination-out"; for (let i = 0; i < 90; i++) { g.globalAlpha = 0.35 + H(i, 3) * 0.5; g.beginPath(); g.arc(H(i, 1) * w, H(i, 2) * h, 1 + H(i, 4) * 3, 0, 7); g.fill(); }
}));
export const texCheck = () => once("check", () => mk(256, 256, (g, w, h) => { g.fillStyle = "#17a65a"; g.beginPath(); g.arc(128, 128, 118, 0, 7); g.fill(); g.strokeStyle = "#eafff1"; g.lineWidth = 22; g.lineCap = "round"; g.lineJoin = "round"; g.beginPath(); g.moveTo(66, 134); g.lineTo(112, 180); g.lineTo(194, 82); g.stroke(); }));
/** facture générique — aucune somme : barres seulement. kind: "loyer" (en-tête LOYER + maison) ou "elec" (éclair + goutte) */
export const texInvoice = (kind) => once("inv" + kind, () => mk(512, 704, (g, w, h) => {
  g.fillStyle = "#f6efdb"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(0,0,0,.12)"; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
  const head = kind === "loyer" ? "#2d6cc0" : "#e1a92c"; g.fillStyle = head; g.fillRect(0, 0, w, 150);
  if (kind === "loyer") { g.fillStyle = "#fff"; g.font = `900 92px ${FONT}`; g.textAlign = "left"; g.textBaseline = "middle"; g.fillText("LOYER", 34, 82);
    g.fillStyle = "#fff"; g.beginPath(); g.moveTo(392, 96); g.lineTo(436, 50); g.lineTo(480, 96); g.closePath(); g.fill(); g.fillRect(402, 94, 68, 38); g.fillStyle = head; g.fillRect(426, 106, 20, 26); }
  else { g.fillStyle = "#fff"; g.beginPath(); g.moveTo(120, 22); g.lineTo(76, 84); g.lineTo(108, 84); g.lineTo(90, 132); g.lineTo(142, 66); g.lineTo(108, 66); g.closePath(); g.fill(); g.fillStyle = "rgba(255,255,255,.9)"; g.beginPath(); g.moveTo(256, 28); g.quadraticCurveTo(300, 84, 256, 124); g.quadraticCurveTo(212, 84, 256, 28); g.fill(); g.fillRect(330, 54, 150, 16); g.fillRect(330, 86, 100, 16); }
  for (let i = 0; i < 6; i++) { const y = 196 + i * 62; g.fillStyle = "rgba(60,60,60,.22)"; g.fillRect(36, y, 190 + (i % 3) * 36, 18); g.fillStyle = "rgba(60,60,60,.42)"; g.fillRect(w - 36 - 96 - (i % 2) * 24, y, 96 + (i % 2) * 24, 18); }
  g.strokeStyle = "rgba(60,60,60,.35)"; g.lineWidth = 3; g.setLineDash([12, 10]); g.beginPath(); g.moveTo(36, 586); g.lineTo(w - 36, 586); g.stroke(); g.setLineDash([]);
  g.fillStyle = "rgba(40,40,40,.55)"; g.fillRect(36, 610, 150, 26); g.fillStyle = "rgba(40,40,40,.8)"; g.fillRect(w - 36 - 170, 606, 170, 34);
}));
export const texInterior = () => once("interior", () => mk(256, 512, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#f5c27a"); gr.addColorStop(0.55, "#e89a48"); gr.addColorStop(1, "#b9672a"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const r = g.createRadialGradient(128, 190, 6, 128, 190, 150); r.addColorStop(0, "rgba(255,255,230,.95)"); r.addColorStop(1, "rgba(255,230,160,0)"); g.fillStyle = r; g.fillRect(0, 0, w, h);
  g.fillStyle = "rgba(120,60,20,.55)"; g.fillRect(22, 330, 212, 56); g.fillRect(22, 300, 60, 40); g.fillRect(172, 300, 62, 40);
  g.fillStyle = "rgba(90,45,15,.5)"; g.fillRect(100, 280, 8, 52); g.beginPath(); g.moveTo(80, 282); g.lineTo(130, 282); g.lineTo(118, 250); g.lineTo(92, 250); g.fill();
  g.fillStyle = "rgba(70,120,70,.6)"; for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(210 + (i % 2) * 10, 400 - i * 12, 7, 24, (i - 3) * 0.2, 0, 7); g.fill(); }
  g.fillStyle = "rgba(255,255,255,.55)"; g.fillRect(30, 90, 70, 90); g.fillStyle = "rgba(160,110,60,.8)"; g.fillRect(64, 90, 4, 90); g.fillRect(30, 133, 70, 4);
}));
export const texArt = (a, b, c) => mk(128, 160, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = c; g.beginPath(); g.arc(w * 0.68, h * 0.34, 20, 0, 7); g.fill(); g.fillStyle = "rgba(20,70,50,.8)"; g.beginPath(); g.moveTo(0, h); g.lineTo(0, h * 0.7); g.quadraticCurveTo(w * 0.3, h * 0.45, w * 0.55, h * 0.72); g.quadraticCurveTo(w * 0.8, h * 0.6, w, h * 0.75); g.lineTo(w, h); g.fill(); });
export const texTiles = () => once("tiles", () => mk(128, 128, (g, w, h) => { g.fillStyle = "#bdb09c"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(70,55,40,.35)"; g.lineWidth = 3; g.strokeRect(1, 1, 126, 126); g.beginPath(); g.moveTo(64, 0); g.lineTo(64, 128); g.moveTo(0, 64); g.lineTo(128, 64); g.stroke(); }, { repeat: [6, 3] }));
export const texSky = () => once("sky", () => mk(128, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#ffb86b"); gr.addColorStop(0.6, "#ffd9a0"); gr.addColorStop(1, "#fff1cf"); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = "rgba(120,170,90,.7)"; g.beginPath(); g.moveTo(0, h); g.lineTo(0, h * 0.82); g.quadraticCurveTo(w * 0.4, h * 0.7, w, h * 0.84); g.lineTo(w, h); g.fill(); }));

/* ---------- personnages ---------- */
/** makePerson + visage souriant, coiffure, robe/blouse, sac à dos... Hauteur ≈ 1,8 × scale (enfant ×0,62). */
export function person(o = {}) {
  const { skin = SKIN[1], shirt = CLOTH[1], pants = 0x2b3a4a, hair = 0x2a1a10, style = "short", dress = null, coat = null, scale = 1, kind = "adult", pack = null, steth = false } = o;
  const g = makePerson({ skin, shirt, pants, scale, hair, kind });
  const hm = M(hair);
  const eye = MB(0x1d1411);
  for (const s of [-1, 1]) sp(0.03, eye, s * 0.088, 1.815, 0.222, g, 8, 6);
  const sm = new T.Mesh(new T.TorusGeometry(0.07, 0.013, 5, 14, Math.PI), MB(0x6b2a22)); sm.rotation.z = Math.PI; sm.position.set(0, 1.76, 0.245); g.add(sm);
  sp(0.033, M(skin), 0, 1.768, 0.246, g, 8, 6);
  for (const s of [-1, 1]) { const b = sp(0.04, MB(0xe58f7c), s * 0.15, 1.738, 0.188, g, 8, 6); b.scale.z = 0.3; b.material = new T.MeshBasicMaterial({ color: 0xe58f7c, transparent: true, opacity: 0.45 }); }
  if (style === "bun") sp(0.1, hm, 0, 2.03, -0.07, g, 10, 8);
  else if (style === "long") { const h2 = sp(1, hm, 0, 1.66, -0.1, g, 12, 10); h2.scale.set(0.27, 0.38, 0.17); }
  else if (style === "curly") sp(0.3, hm, 0, 1.9, -0.1, g, 12, 9);
  else if (style === "pigtails") for (const s of [-1, 1]) sp(0.085, hm, s * 0.26, 1.78, -0.04, g, 8, 6);
  if (dress) cy(0.3, 0.47, 0.66, M(dress), 0, 0.68, 0, g, 16);
  if (coat) { cy(0.345, 0.44, 1.0, M(coat), 0, 0.98, 0, g, 16); const ring = mesh(new T.TorusGeometry(0.15, 0.016, 6, 16), M(0x3a3f44), 0, 1.55, 0.06, g); ring.rotation.x = Math.PI / 2; sp(0.045, M(0xb8c2c8), 0.0, 1.18, 0.34, g, 8, 6); }
  if (pack) { bx(0.36, 0.46, 0.16, M(pack), 0, 1.15, -0.36, g); bx(0.38, 0.14, 0.17, M(PAL.gold), 0, 1.02, -0.36, g); }
  return g;
}

/* ---------- accessoires de table ---------- */
export function table(w = 2.2, d = 1.15, h = 0.86) {
  const g = new T.Group(); const wood = M(0xb9824f), dk = M(0x8b5a33);
  bx(w, 0.07, d, wood, 0, h - 0.035, 0, g); bx(w - 0.24, 0.1, d - 0.24, dk, 0, h - 0.12, 0, g);
  const cloth = bx(w + 0.06, 0.012, d + 0.06, new T.MeshLambertMaterial({ map: texGingham(), emissive: 0x1a0d08 }), 0, h + 0.006, 0, g);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(0.09, h - 0.07, 0.09, dk, sx * (w / 2 - 0.1), (h - 0.07) / 2, sz * (d / 2 - 0.1), g);
  g.userData.top = h + 0.012; return g;
}
export function chair(c = 0x8b5a33) { const g = new T.Group(); const m = M(c); bx(0.5, 0.06, 0.5, m, 0, 0.5, 0, g); bx(0.5, 0.62, 0.06, m, 0, 0.84, -0.22, g); for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(0.06, 0.5, 0.06, m, sx * 0.21, 0.25, sz * 0.21, g); return g; }
export function bread() {
  const g = new T.Group(); const crust = M(0xd39a55), dk = M(0xa8692e);
  const bag = mesh(new T.CapsuleGeometry(0.07, 0.5, 4, 10), crust, 0, 0.07, 0.0, g); bag.rotation.z = Math.PI / 2; bag.rotation.y = -0.25;
  for (let i = 0; i < 4; i++) { const s = sp(0.03, dk, -0.15 + i * 0.1, 0.128, 0.0, g, 6, 5); s.scale.set(1.8, 0.35, 0.9); s.rotation.y = -0.25; s.position.z = (-0.15 + i * 0.1) * 0.25; }
  const boule = sp(0.13, crust, 0.1, 0.09, 0.26, g, 12, 8); boule.scale.set(1, 0.72, 1); const sc = sp(0.04, dk, 0.1, 0.17, 0.26, g, 6, 5); sc.scale.set(2.2, 0.3, 0.5);
  return g;
}
export function milk() {
  const g = new T.Group(); bx(0.15, 0.25, 0.15, M(0xf7f5ec), 0, 0.125, 0, g); bx(0.153, 0.075, 0.153, M(0x2d6cc0), 0, 0.1, 0, g);
  const roof = mesh(new T.ConeGeometry(0.106, 0.09, 4), M(0xf0eee2), 0, 0.295, 0, g); roof.rotation.y = Math.PI / 4; cy(0.026, 0.026, 0.04, M(0x2d6cc0), 0, 0.35, 0, g, 8);
  const drop = mesh(new T.CircleGeometry(0.03, 10), MB(0x2d6cc0), 0, 0.17, 0.077, g); return g;
}
export function fruitBowl() {
  const g = new T.Group(); const bowl = mesh(new T.SphereGeometry(0.21, 16, 8, 0, 6.2832, Math.PI / 2, Math.PI / 2), new T.MeshLambertMaterial({ color: 0xc9703a, side: T.DoubleSide }), 0, 0.2, 0, g);
  cy(0.09, 0.1, 0.03, M(0x9b5326), 0, 0.01, 0, g, 12);
  sp(0.078, M(0xd9342b), -0.08, 0.27, 0.02, g, 10, 8); sp(0.078, M(0x8cc63f), 0.07, 0.27, -0.05, g, 10, 8); sp(0.075, M(0xf08a1c), 0.02, 0.29, 0.09, g, 10, 8); sp(0.07, M(0xd9342b), 0.0, 0.33, -0.01, g, 10, 8);
  const ban = mesh(new T.TorusGeometry(0.15, 0.03, 6, 14, 2.1), M(0xf2cf2e), 0.0, 0.31, 0.0, g); ban.rotation.set(1.2, 0.3, 0.2);
  return g;
}
export function veggieBag() {
  const g = new T.Group(); bx(0.38, 0.46, 0.22, M(0xc8a26a), 0, 0.23, 0, g); bx(0.4, 0.04, 0.24, M(0xb48c55), 0, 0.46, 0, g);
  const lab = textPlane("COURSES", { w: 0.32, h: 0.11, px: 320, color: "#5a3a1a", bg: "#f3ecd4", size: 0.56, border: "#b48c55" }); lab.position.set(0, 0.25, 0.115); g.add(lab);
  for (const [x, r] of [[-0.09, 0.25], [0.02, -0.15]]) { const c = mesh(new T.ConeGeometry(0.04, 0.3, 8), M(0xf08a1c), x, 0.6, -0.02, g); c.rotation.z = r; c.rotation.x = 3.14159; c.position.y = 0.58; sp(0.04, M(0x3f9d3f), x + Math.sin(r) * 0.12 * -1, 0.75, -0.02, g, 6, 5).scale.set(1, 1.5, 1); }
  cy(0.035, 0.04, 0.34, M(0xe9f0cf), 0.12, 0.62, 0.02, g, 8); cy(0.045, 0.03, 0.14, M(0x3f9d3f), 0.12, 0.84, 0.02, g, 8);
  sp(0.1, M(0x3f9d3f), -0.1, 0.55, 0.06, g, 10, 8); cy(0.03, 0.03, 0.1, M(0x7fb857), -0.1, 0.5, 0.06, g, 8);
  sp(0.06, M(0xd9342b), 0.04, 0.5, 0.1, g, 10, 8); return g;
}
export function basket() {
  const g = new T.Group(); const wk = new T.MeshLambertMaterial({ color: 0xb98a52, side: T.DoubleSide });
  mesh(new T.CylinderGeometry(0.3, 0.23, 0.24, 18, 1, true), wk, 0, 0.12, 0, g); cy(0.23, 0.23, 0.02, M(0x8a6234), 0, 0.01, 0, g, 16);
  const rim = mesh(new T.TorusGeometry(0.3, 0.018, 6, 20), M(0x8a6234), 0, 0.24, 0, g); rim.rotation.x = Math.PI / 2;
  const hd = mesh(new T.TorusGeometry(0.3, 0.017, 6, 20, Math.PI), M(0x8a6234), 0, 0.24, 0, g); hd.rotation.y = 0; hd.rotation.z = 0;
  for (let i = 0; i < 3; i++) { const b = mesh(new T.TorusGeometry(0.27 - i * 0.015, 0.008, 4, 18), M(0x946a3a), 0, 0.06 + i * 0.07, 0, g); b.rotation.x = Math.PI / 2; }
  return g;
}
export function houseMini() {
  const g = new T.Group(); bx(0.52, 0.3, 0.4, M(0xf3e5c9), 0, 0.15, 0, g);
  const roof = mesh(new T.ConeGeometry(0.46, 0.3, 4), M(0xc2543a), 0, 0.45, 0, g); roof.rotation.y = Math.PI / 4; roof.scale.z = 0.8;
  bx(0.09, 0.17, 0.02, M(0x6a3b1f), 0.0, 0.085, 0.205, g); bx(0.09, 0.09, 0.02, M(0xffe3a0, 0x886a30), -0.17, 0.17, 0.205, g); bx(0.09, 0.09, 0.02, M(0xffe3a0, 0x886a30), 0.17, 0.17, 0.205, g); bx(0.07, 0.14, 0.07, M(0x8a4a3a), 0.16, 0.56, -0.05, g);
  return g;
}
export function tableLamp() {
  const g = new T.Group(); cy(0.1, 0.12, 0.04, M(0x6a4a2a), 0, 0.02, 0, g, 12); cy(0.014, 0.014, 0.3, M(0x6a4a2a), 0, 0.19, 0, g, 6);
  const sh = new T.Mesh(new T.CylinderGeometry(0.1, 0.17, 0.2, 14, 1, true), new T.MeshBasicMaterial({ color: 0xffd69a, side: T.DoubleSide })); sh.position.y = 0.38; g.add(sh); g.userData.shade = sh; sp(0.05, MB(0xfff3c8), 0, 0.37, 0, g, 8, 6); return g;
}
/** facture : pivot au bord proche ; la feuille s'étend vers -z. Retourne {g, paper, tag, stamp, check} */
export function invoice(kind, w = 0.92) {
  const h = w * 1.375; const g = new T.Group(); const geo = new T.PlaneGeometry(w, h); geo.translate(0, h / 2, 0);
  const tx = texInvoice(kind);
  const paper = new T.Mesh(geo, new T.MeshLambertMaterial({ map: tx, emissiveMap: tx, emissive: 0x8a8a8a, side: T.DoubleSide })); g.add(paper);
  const tagGeo = new T.PlaneGeometry(w * 0.7, w * 0.7 * 112 / 384); const tag = new T.Mesh(tagGeo, new T.MeshBasicMaterial({ map: texTag(), transparent: true })); tag.position.set(w * 0.1, h * 0.16, 0.004); tag.rotation.z = 0.12; g.add(tag);
  const stGeo = new T.PlaneGeometry(w * 0.92, w * 0.92 * 200 / 512); const stamp = new T.Mesh(stGeo, new T.MeshBasicMaterial({ map: texStamp(), transparent: true, depthWrite: false })); stamp.position.set(0, h * 0.30, 0.008); stamp.rotation.z = -0.16; g.add(stamp);
  const ck = new T.Mesh(new T.PlaneGeometry(w * 0.34, w * 0.34), new T.MeshBasicMaterial({ map: texCheck(), transparent: true, depthWrite: false })); ck.position.set(-w * 0.22, h * 0.62, 0.01); g.add(ck);
  return { g, paper, tag, stamp, check: ck, h, w };
}
export function stampTool() {
  const g = new T.Group(); cy(0.045, 0.05, 0.22, M(0x9b6a3c), 0, 0.2, 0, g, 10); sp(0.07, M(0x9b6a3c), 0, 0.34, 0, g, 10, 8); bx(0.52, 0.06, 0.22, M(0x2a2e30), 0, 0.07, 0, g); bx(0.48, 0.03, 0.19, M(0x17a65a, 0x0a3a20), 0, 0.025, 0, g); return g;
}
export function bill() { const m = new T.Mesh(new T.PlaneGeometry(1.3, 0.58), new T.MeshBasicMaterial({ map: billT(), side: T.DoubleSide })); return m; }
export function ghostBill(op) { const m = new T.Mesh(new T.PlaneGeometry(1.3, 0.58), new T.MeshBasicMaterial({ map: billT(), side: T.DoubleSide, transparent: true, opacity: op, depthWrite: false })); return m; }

/* ---------- décor ---------- */
/** panneau vertical avec dégradé (bas -> haut) : le pivot est au bas */
export function wallPanel(w, h, cBottom, cTop, map = null, segY = 6) {
  const geo = new T.PlaneGeometry(w, h, 1, segY); geo.translate(0, h / 2, 0); const col = []; const a = new T.Color(cBottom), b = new T.Color(cTop), c = new T.Color();
  const pos = geo.attributes.position; for (let i = 0; i < pos.count; i++) { c.lerpColors(a, b, pos.getY(i) / h); col.push(c.r, c.g, c.b); }
  geo.setAttribute("color", new T.Float32BufferAttribute(col, 3)); return new T.Mesh(geo, new T.MeshLambertMaterial({ vertexColors: true, map, side: T.DoubleSide }));
}
export function plant(h = 1, pot = 0xc4683f, leaf = 0x3f9d3f, n = 9) {
  const g = new T.Group(); cy(0.2 * h, 0.14 * h, 0.3 * h, M(pot), 0, 0.15 * h, 0, g, 14); cy(0.19 * h, 0.19 * h, 0.02, M(0x3a2414), 0, 0.3 * h, 0, g, 12);
  for (let i = 0; i < n; i++) { const a = (i / n) * 6.283 + H(i, 3), tilt = 0.25 + H(i, 4) * 0.55, L = (0.5 + H(i, 5) * 0.45) * h; const piv = new T.Group(); piv.position.y = 0.3 * h; piv.rotation.y = a; piv.rotation.z = tilt; const lf = sp(1, M(i % 3 ? leaf : 0x58b24a), 0, L * 0.5, 0, piv, 8, 6); lf.scale.set(0.09 * h, L * 0.5, 0.025 * h); g.add(piv); }
  return g;
}
export function floorLamp() {
  const g = new T.Group(); cy(0.18, 0.2, 0.05, M(0x3a2a1a), 0, 0.025, 0, g, 14); cy(0.02, 0.02, 1.5, M(0x3a2a1a), 0, 0.78, 0, g, 6);
  const sh = new T.Mesh(new T.CylinderGeometry(0.2, 0.33, 0.46, 16, 1, true), new T.MeshBasicMaterial({ color: 0xffd896, side: T.DoubleSide })); sh.position.y = 1.72; g.add(sh); g.userData.shade = sh; sp(0.08, MB(0xfff6d6), 0, 1.7, 0, g, 8, 6); return g;
}
export function sofa(c = 0x2a8f87) { const g = new T.Group(); const m = M(c), dk = M(0x1c6b66); bx(1.9, 0.38, 0.8, m, 0, 0.3, 0, g); bx(1.9, 0.62, 0.22, m, 0, 0.62, -0.32, g); bx(0.22, 0.58, 0.8, dk, -1.0, 0.4, 0, g); bx(0.22, 0.58, 0.8, dk, 1.0, 0.4, 0, g); bx(0.5, 0.4, 0.14, M(0xe8b84a), -0.5, 0.62, -0.12, g).rotation.z = 0.15; bx(1.9, 0.1, 0.06, dk, 0, 0.08, 0.3, g); for (const sx of [-1, 1]) bx(0.08, 0.14, 0.08, M(0x3a2a1a), sx * 0.9, 0.07, 0.3, g); return g; }
export function frame(tex, w = 0.6, h = 0.76) { const g = new T.Group(); bx(w + 0.1, h + 0.1, 0.05, M(0x5a3a1c), 0, 0, 0, g); const p = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex })); p.position.z = 0.03; g.add(p); return g; }
export function medCross(s = 1) {
  const g = new T.Group(); const out = MB(0xf6fff9); const inner = new T.MeshBasicMaterial({ color: 0x2ee08a });
  bx(2.0 * s, 0.78 * s, 0.16, out, 0, 0, 0, g); bx(0.78 * s, 2.0 * s, 0.16, out, 0, 0, 0, g);
  bx(1.78 * s, 0.56 * s, 0.2, inner, 0, 0, 0.02, g); bx(0.56 * s, 1.78 * s, 0.2, inner, 0, 0, 0.02, g); g.userData.inner = inner; return g;
}
export function bus() {
  const g = new T.Group(); const yel = M(0xf8c42c), yel2 = M(0xeab01a), dk = M(0x2a2a2a);
  // coque creuse : flanc côté quai (z=+1) avec fenêtres et porte ouvertes, intérieur visible (l'enfant monte à bord)
  bx(4.2, 0.85, 0.1, yel, -0.5, 0.775, 1.0, g); bx(0.2, 0.85, 0.1, yel, 2.5, 0.775, 1.0, g);                   // bas du flanc, hors porte
  bx(5.2, 1.6, 0.1, yel, 0, 1.15, -1.0, g); bx(0.1, 1.6, 2.1, yel, -2.6, 1.15, 0, g); bx(0.1, 0.85, 2.1, yel, 2.6, 0.775, 0, g);
  bx(5.0, 0.08, 1.9, M(0x3a3a3e), 0, 0.64, 0, g); bx(5.22, 0.14, 2.12, dk, 0, 0.42, 0, g);
  bx(5.3, 0.16, 2.2, yel2, 0, 2.03, 0, g);
  for (const x of [-2.5, -1.4, -0.4, 0.6, 1.55, 2.5]) bx(0.2, 0.75, 0.1, yel, x, 1.575, 1.0, g);                     // montants
  bx(5.22, 0.07, 0.11, M(0x1f1f1f), 0, 0.9, 1.02, g);                                                          // bande noire
  for (const x of [-1.9, -0.9, 0.1, 1.05]) bx(0.8, 0.5, 0.5, M(0x8a2a2a), x, 0.95, -0.55, g);                  // banquettes
  const pane = new T.MeshBasicMaterial({ color: 0xffe9b0, transparent: true, opacity: 0.22, depthWrite: false });
  for (const x of [-1.9, -0.9, 0.1, 1.05]) { const w = new T.Mesh(new T.PlaneGeometry(0.82, 0.74), pane); w.position.set(x, 1.575, 1.03); g.add(w); }
  const ws = new T.Mesh(new T.PlaneGeometry(2.0, 0.75), pane); ws.rotation.y = Math.PI / 2; ws.position.set(2.62, 1.575, 0); g.add(ws);
  const dm = new T.MeshBasicMaterial({ color: 0xffe9b0, transparent: true, opacity: 0.4, depthWrite: false });
  const doorPivot = new T.Group(); doorPivot.position.set(1.6, 0, 1.04); g.add(doorPivot); const door = new T.Mesh(new T.PlaneGeometry(0.8, 1.3), dm); door.position.set(0.4, 1.3, 0); doorPivot.add(door);
  g.userData.doorPivot = doorPivot; g.userData.door = door;
  for (const sx of [-1.7, 1.7]) for (const sz of [-1, 1]) { const w = cy(0.46, 0.46, 0.3, MB(0x111111), sx, 0.46, sz * 1.0, g, 16); w.rotation.x = Math.PI / 2; const h = cy(0.2, 0.2, 0.32, M(0xb8c0c4), sx, 0.46, sz * 1.0, g, 10); h.rotation.x = Math.PI / 2; }
  sp(0.12, MB(0xfff1b8), 2.64, 0.95, 0.7, g, 8, 6); sp(0.12, MB(0xfff1b8), 2.64, 0.95, -0.7, g, 8, 6);
  const light = sp(0.09, MB(0x2ee08a), 1.55, 2.15, 1.05, g, 8, 6); g.userData.lamp = light;
  return g;
}
