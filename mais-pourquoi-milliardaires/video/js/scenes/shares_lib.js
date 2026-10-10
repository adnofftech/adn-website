// Aides du module « shares » : matrices instanciées, textures canvas procédurales, coffre-fort, icônes.
// Tout est déterministe (hash H), aucune horloge, aucun réseau.
import { T, H, clamp, lerp, sstep, lin, eio, eout, ein, eoutBack, mk, billTex, glowTex, FONT, MONO, textPlane, makePerson, SKIN, CLOTH } from "../shared.js";

export const _o = new T.Object3D();
const _t = new T.Color();
export const mixHex = (a, b, u, out = new T.Color()) => { out.setHex(a); _t.setHex(b); return out.lerp(_t, u); };
export const pop = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : eoutBack(u));
export const popAt = (t, t0, d = 0.35) => pop((t - t0) / d);
export function put(im, i, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) { _o.position.set(x, y, z); _o.rotation.set(rx, ry, rz); _o.scale.set(sx, sy, sz); _o.updateMatrix(); im.setMatrixAt(i, _o.matrix); }
export const hide = (im, i) => { _o.position.set(0, -999, 0); _o.rotation.set(0, 0, 0); _o.scale.set(1e-4, 1e-4, 1e-4); _o.updateMatrix(); im.setMatrixAt(i, _o.matrix); };
export function inst(geo, mat, n) { const im = new T.InstancedMesh(geo, mat, n); im.frustumCulled = false; for (let i = 0; i < n; i++) hide(im, i); im.instanceMatrix.needsUpdate = true; return im; }
export const lam = (c, e = 0) => new T.MeshLambertMaterial({ color: c, emissive: e });
export const bas = (c, o = 1, side = T.FrontSide) => new T.MeshBasicMaterial({ color: c, transparent: o < 1, opacity: o, side });
export const addMat = (c, o = 1) => new T.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
export const rep = (tex, a, b) => { tex.wrapS = tex.wrapT = T.RepeatWrapping; tex.repeat.set(a, b); return tex; };
export const uvScale = (geo, su, sv) => { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); return geo; };

// ---------------------------------------------------------------- textures
/** certificat d'action fictif (texte ajusté à la largeur) */
export const shareCert = () => mk(512, 320, (g, w, h) => {
  g.fillStyle = "#f3ecd4"; g.fillRect(0, 0, w, h);
  g.strokeStyle = "rgba(31,138,76,.16)"; g.lineWidth = 1; for (let i = 0; i < 26; i++) { g.beginPath(); g.arc(w / 2, h * 0.62, 20 + i * 8, 0, 7); g.stroke(); }
  g.strokeStyle = "#1f8a4c"; g.lineWidth = 10; g.strokeRect(12, 12, w - 24, h - 24); g.lineWidth = 3; g.strokeRect(30, 30, w - 60, h - 60);
  g.fillStyle = "#1f8a4c"; g.font = `900 72px ${FONT}`; g.textAlign = "center"; g.textBaseline = "alphabetic"; g.fillText("ACTION", w / 2, 122);
  g.font = `700 22px ${MONO}`; g.fillStyle = "#4a4a44"; g.fillText("PART DU CAPITAL · SOCIÉTÉ FICTIVE", w / 2, 168);
  g.fillStyle = "#e8b84a"; g.beginPath(); g.arc(w / 2, 238, 42, 0, 7); g.fill(); g.strokeStyle = "#a57c26"; g.lineWidth = 3; g.stroke(); g.fillStyle = "#1f8a4c"; g.font = `900 40px ${FONT}`; g.fillText("%", w / 2, 252);
  g.fillStyle = "#1f8a4c"; g.fillRect(70, 205, 110, 5); g.fillRect(w - 180, 205, 110, 5); g.fillRect(70, 222, 80, 5); g.fillRect(w - 150, 222, 80, 5);
});
/** graphique boursier (chandeliers + moyenne mobile) — aucun chiffre */
export const chartTex = (seed = 1, title = "BOURSE") => mk(512, 320, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#0b1d36"); gr.addColorStop(1, "#050d1b"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = "rgba(110,190,255,.20)"; g.lineWidth = 2;
  for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(0, (i * h) / 6); g.lineTo(w, (i * h) / 6); g.stroke(); }
  for (let i = 1; i < 9; i++) { g.beginPath(); g.moveTo((i * w) / 9, 0); g.lineTo((i * w) / 9, h); g.stroke(); }
  const n = 24, ser = []; let v = 0.5; for (let i = 0; i < n; i++) { v += (H(i * 3 + seed * 17, 1) - 0.45) * 0.2; v = clamp(v, 0.14, 0.88); ser.push(v); }
  const x0 = 24, x1 = w - 24, y0 = 82, y1 = h - 26;
  const area = g.createLinearGradient(0, y0, 0, y1); area.addColorStop(0, "rgba(46,230,166,.30)"); area.addColorStop(1, "rgba(46,230,166,0)");
  g.fillStyle = area; g.beginPath(); g.moveTo(x0, y1); ser.forEach((s, i) => g.lineTo(x0 + ((i + 0.5) * (x1 - x0)) / n, y1 - s * (y1 - y0))); g.lineTo(x1, y1); g.closePath(); g.fill();
  for (let i = 0; i < n; i++) {
    const c = ser[i], o = i ? ser[i - 1] : c - 0.02, up = c >= o, x = x0 + ((i + 0.5) * (x1 - x0)) / n, yo = y1 - o * (y1 - y0), yc = y1 - c * (y1 - y0);
    const hi = Math.min(yo, yc) - 6 - H(i, 2) * 16, lo = Math.max(yo, yc) + 6 + H(i, 3) * 16; g.strokeStyle = g.fillStyle = up ? "#2ee6a6" : "#ff5468"; g.lineWidth = 3;
    g.beginPath(); g.moveTo(x, hi); g.lineTo(x, lo); g.stroke(); g.fillRect(x - 7, Math.min(yo, yc), 14, Math.max(7, Math.abs(yc - yo)));
  }
  g.strokeStyle = "#6fd7ff"; g.lineWidth = 5; g.beginPath(); ser.forEach((s, i) => { const a = (ser[Math.max(0, i - 2)] + ser[Math.max(0, i - 1)] + s) / 3; const x = x0 + ((i + 0.5) * (x1 - x0)) / n, y = y1 - a * (y1 - y0); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
  g.strokeStyle = "#47f0a0"; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
  g.fillStyle = "#bfeaff"; g.font = `700 34px ${MONO}`; g.textAlign = "left"; g.textBaseline = "alphabetic"; g.fillText(title, 24, 52);
  g.fillStyle = "#2ee6a6"; g.font = `900 34px ${FONT}`; g.textAlign = "right"; g.fillText("▲", w - 54, 52); g.fillStyle = "#ff5468"; g.fillText("▼", w - 24, 52);
});
export const steelTex = () => mk(512, 512, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#2c353e"); gr.addColorStop(0.35, "#5d6b77"); gr.addColorStop(0.5, "#7d8d99"); gr.addColorStop(0.65, "#4f5c67"); gr.addColorStop(1, "#262e36");
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 700; i++) { const l = H(i, 1) > 0.5; g.fillStyle = `rgba(${l ? "255,255,255" : "0,0,0"},${0.02 + H(i, 2) * 0.04})`; g.fillRect(H(i, 3) * w, 0, 1 + H(i, 4) * 2.5, h); }
  g.strokeStyle = "rgba(0,0,0,.55)"; g.lineWidth = 5; g.strokeRect(5, 5, w - 10, h - 10); g.strokeStyle = "rgba(255,255,255,.14)"; g.lineWidth = 2; g.strokeRect(11, 11, w - 22, h - 22);
  g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = 3; g.beginPath(); g.moveTo(0, h * 0.14); g.lineTo(w, h * 0.14); g.moveTo(0, h * 0.86); g.lineTo(w, h * 0.86); g.stroke();
  for (let i = 0; i < 12; i++) for (const [x, y] of [[22 + (i * (w - 44)) / 11, 24], [22 + (i * (w - 44)) / 11, h - 24], [24, 22 + (i * (h - 44)) / 11], [w - 24, 22 + (i * (h - 44)) / 11]]) {
    g.fillStyle = "#1b2127"; g.beginPath(); g.arc(x + 1.5, y + 1.5, 6, 0, 7); g.fill(); g.fillStyle = "#9eabb6"; g.beginPath(); g.arc(x, y, 5.5, 0, 7); g.fill(); g.fillStyle = "#e6eef4"; g.beginPath(); g.arc(x - 1.5, y - 1.5, 2, 0, 7); g.fill();
  }
});
export const doorTex = () => mk(512, 512, (g, w, h) => {
  const c = w / 2, gr = g.createRadialGradient(c * 0.8, c * 0.7, 20, c, c, c); gr.addColorStop(0, "#93a3b0"); gr.addColorStop(0.55, "#62707c"); gr.addColorStop(1, "#323b44"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (const [r, wd, col] of [[250, 8, "rgba(0,0,0,.5)"], [236, 3, "rgba(255,255,255,.22)"], [180, 7, "rgba(0,0,0,.4)"], [170, 2, "rgba(255,255,255,.2)"], [104, 6, "rgba(0,0,0,.4)"]]) { g.strokeStyle = col; g.lineWidth = wd; g.beginPath(); g.arc(c, c, r, 0, 7); g.stroke(); }
  for (let i = 0; i < 16; i++) { const a = (i / 16) * 6.283, x = c + Math.cos(a) * 208, y = c + Math.sin(a) * 208; g.fillStyle = "#1c2329"; g.beginPath(); g.arc(x + 2, y + 2, 11, 0, 7); g.fill(); g.fillStyle = "#b4c0ca"; g.beginPath(); g.arc(x, y, 10, 0, 7); g.fill(); g.fillStyle = "#f3f8fb"; g.beginPath(); g.arc(x - 3, y - 3, 3.5, 0, 7); g.fill(); }
  g.strokeStyle = "rgba(0,0,0,.30)"; g.lineWidth = 5; for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283 + 0.2; g.beginPath(); g.moveTo(c + Math.cos(a) * 112, c + Math.sin(a) * 112); g.lineTo(c + Math.cos(a) * 165, c + Math.sin(a) * 165); g.stroke(); }
});
export const winTex = () => rep(mk(128, 256, (g, w, h) => {
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, w, h); const cols = 4, rows = 12, cw = w / cols, rh = h / rows;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const lit = H(r * 5 + c, 7) > 0.5; g.fillStyle = lit ? "#ffe7a0" : "#5d7794"; g.fillRect(c * cw + cw * 0.2, r * rh + rh * 0.22, cw * 0.6, rh * 0.52); }
  g.fillStyle = "rgba(0,0,0,.22)"; g.fillRect(0, 0, w, 6);
}), 1, 1);
export const ribbonTex = () => mk(128, 128, (g, w, h) => {
  g.fillStyle = "#f4f7fb"; g.fillRect(0, 0, w, h); g.fillStyle = "#a9c9e6"; g.fillRect(0, h * 0.22, w, h * 0.56);
  g.fillStyle = "rgba(255,255,255,.75)"; for (let x = 6; x < w; x += 16) g.fillRect(x, h * 0.22, 3, h * 0.56);
  g.fillStyle = "rgba(255,255,255,.4)"; g.fillRect(0, h * 0.22, w, 5); g.fillStyle = "rgba(0,0,0,.2)"; g.fillRect(0, h - 7, w, 7);
});
export const pieTex = () => mk(256, 256, (g, w, h) => {
  g.fillStyle = "#0b1626"; g.fillRect(0, 0, w, h); const c = 128;
  [[0, 0.46, "#2ee6a6"], [0.46, 0.74, "#3b82d6"], [0.74, 1, "#e8b84a"]].forEach(([a, b, col], i) => { g.fillStyle = col; const o = i === 2 ? 9 : 0, m = ((a + b) / 2) * 6.283 - 1.57; g.beginPath(); g.moveTo(c + Math.cos(m) * o, c + Math.sin(m) * o); g.arc(c + Math.cos(m) * o, c + Math.sin(m) * o, 112, a * 6.283 - 1.57, b * 6.283 - 1.57); g.closePath(); g.fill(); });
  g.strokeStyle = "#0b1626"; g.lineWidth = 6; for (const a of [0, 0.46, 0.74]) { g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.cos(a * 6.283 - 1.57) * 125, c + Math.sin(a * 6.283 - 1.57) * 125); g.stroke(); }
});
export const gridTex = (line = "rgba(80,190,255,.34)", base = "#050c18") => rep(mk(256, 256, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h); g.strokeStyle = line; g.lineWidth = 4; g.strokeRect(0, 0, w, h);
  g.strokeStyle = line.replace(/[\d.]+\)$/, "0.10)"); g.lineWidth = 2; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
  for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(160,220,255,${H(i, 9) * 0.05})`; g.fillRect(H(i, 1) * w, H(i, 2) * h, 2 + H(i, 3) * 12, 2); }
}), 1, 1);
/** faisceau vertical (dégradé) */
export const beamTex = () => mk(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.55, "rgba(255,255,255,.55)"); gr.addColorStop(1, "rgba(255,255,255,.95)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); const gx = g.createLinearGradient(0, 0, w, 0); gx.addColorStop(0, "rgba(0,0,0,.9)"); gx.addColorStop(0.5, "rgba(0,0,0,0)"); gx.addColorStop(1, "rgba(0,0,0,.9)"); g.globalCompositeOperation = "destination-out"; g.fillStyle = gx; g.fillRect(0, 0, w, h); });

// ---------------------------------------------------------------- coffre-fort (repère : plaque en z∈[-4,0], face avant à +z, centre de la porte en (0,10))
export function buildVault() {
  const g = new T.Group(), V = {};
  const sh = new T.Shape(); sh.moveTo(-11, 0); sh.lineTo(11, 0); sh.lineTo(11, 20); sh.lineTo(-11, 20); sh.lineTo(-11, 0);
  const hole = new T.Path(); hole.absarc(0, 10, 6.2, 0, Math.PI * 2, true); sh.holes.push(hole);
  const geo = new T.ExtrudeGeometry(sh, { depth: 4, bevelEnabled: false, curveSegments: 48 }); geo.translate(0, 0, -4);
  const pos = geo.attributes.position, uv = geo.attributes.uv; for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + 11) / 22, pos.getY(i) / 20);
  V.plate = new T.Mesh(geo, new T.MeshLambertMaterial({ map: steelTex(), color: 0xffffff, emissive: 0x0b1015 })); g.add(V.plate);
  const base = new T.Mesh(new T.BoxGeometry(24, 1.1, 7), lam(0x1c242b, 0x05080a)); base.position.set(0, 0.55, 1.5); g.add(base);
  const stripe = new T.Mesh(new T.BoxGeometry(24.02, 0.16, 7.02), bas(0xe8b84a)); stripe.position.set(0, 1.1, 1.5); g.add(stripe);
  // lunette (cadre) autour de la porte
  const gold = lam(0xd9a63a, 0x3a2506), goldD = lam(0xa57c26, 0x1c1203);
  const bez = new T.Mesh(new T.TorusGeometry(6.95, 0.38, 12, 72), goldD); bez.position.set(0, 10, 0.2); bez.scale.set(1, 1, 0.7); g.add(bez);
  // charnières
  for (const y of [5, 10, 15]) { const h = new T.Mesh(new T.CylinderGeometry(0.6, 0.6, 2.4, 16), goldD); h.position.set(-7.0, y, 0.55); g.add(h); }
  // porte
  V.pivot = new T.Group(); V.pivot.position.set(-6.7, 10, 0); g.add(V.pivot);
  V.door = new T.Group(); V.door.position.set(6.7, 0, 0); V.pivot.add(V.door);
  const dTex = doorTex();
  const body = new T.Mesh(new T.CylinderGeometry(6.6, 6.6, 1.6, 72), lam(0x56636e, 0x070a0d)); body.rotation.x = Math.PI / 2; V.door.add(body);
  const face = new T.Mesh(new T.CircleGeometry(6.58, 72), new T.MeshLambertMaterial({ map: dTex, emissive: 0x0c1014 })); face.position.z = 0.81; V.door.add(face);
  const back = new T.Mesh(new T.CircleGeometry(6.58, 48), new T.MeshLambertMaterial({ map: dTex, emissive: 0x0c1014 })); back.rotation.y = Math.PI; back.position.z = -0.81; V.door.add(back);
  V.wheel = new T.Group(); V.wheel.position.z = 0.95; V.door.add(V.wheel);
  V.wheel.add(new T.Mesh(new T.TorusGeometry(2.35, 0.3, 12, 48), gold));
  const hub = new T.Mesh(new T.CylinderGeometry(1.0, 1.0, 0.9, 24), gold); hub.rotation.x = Math.PI / 2; V.wheel.add(hub);
  for (let i = 0; i < 6; i++) { const sp = new T.Group(); sp.rotation.z = (i / 6) * 6.283; const b = new T.Mesh(new T.BoxGeometry(0.3, 2.7, 0.3), gold); b.position.y = 1.4; sp.add(b); const k = new T.Mesh(new T.SphereGeometry(0.36, 14, 10), gold); k.position.y = 2.95; sp.add(k); V.wheel.add(sp); }
  // plaque gravée
  // (remontée à y 19.1 : la porte entrouverte, vue d'en bas, ne la rogne plus ; exposée pour s'effacer quand le titre HTML arrive)
  const plq = textPlane("COFFRE-FORT", { w: 8.6, h: 1.5, px: 512, color: "#f1d58a", bg: "#10161b", border: "#d9a63a", size: 0.5 }); plq.position.set(0, 19.1, 0.06); plq.material.depthTest = false; plq.renderOrder = 6; g.add(plq); V.plq = plq;   // dessinée par-dessus les billets qui tombent
  // lueur d'interstice (anneau additif) + halo derrière la porte
  V.seam = new T.Mesh(new T.RingGeometry(6.0, 7.5, 72), addMat(0x7dffb2, 0)); V.seam.position.set(0, 10, 0.3); g.add(V.seam);
  g.userData = V; return g;
}

// ---------------------------------------------------------------- icônes
const sphere = (r, m, x, y, z, p, ws = 16, hs = 12) => { const o = new T.Mesh(new T.SphereGeometry(r, ws, hs), m); o.position.set(x, y, z); p.add(o); return o; };
const bx = (w, h, d, m, x, y, z, p) => { const o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x, y, z); p.add(o); return o; };
const cy = (r, h, m, x, y, z, p, seg = 20) => { const o = new T.Mesh(new T.CylinderGeometry(r, r, h, seg), m); o.position.set(x, y, z); p.add(o); return o; };

/** pastille d'actionnaire : fond rond + silhouette (variant : 0 buste, 1 institution à colonnes, 2 buste chignon, 3 duo) */
export function investorIcon(col, variant = 0, size = 1) {
  const g = new T.Group(), bgm = bas(0x0a1424), body = bas(col), skin = bas(0xf1c9a5);
  const disc = new T.Mesh(new T.CircleGeometry(1.45, 40), bgm); disc.position.z = -0.05; g.add(disc);
  const ring = new T.Mesh(new T.RingGeometry(1.45, 1.66, 48), bas(col)); ring.position.z = -0.04; g.add(ring);
  const bust = (x, s, hair) => { const b = new T.Group(); b.position.set(x, 0, 0); b.scale.setScalar(s); const sh = new T.Mesh(new T.SphereGeometry(0.78, 18, 10, 0, 6.283, 0, 1.5708), body); sh.scale.set(1, 0.82, 0.55); sh.position.y = -0.95; b.add(sh); sphere(0.36, skin, 0, 0.05, 0.05, b); if (hair) { const hr = sphere(0.39, bas(hair), 0, 0.12, -0.02, b); hr.scale.set(1, 0.9, 1); } return b; };
  if (variant === 0) { const b = bust(0, 1, 0x2a1a10); g.add(b); const tie = new T.Mesh(new T.ConeGeometry(0.13, 0.5, 4), bas(0xf4f1e6)); tie.rotation.x = Math.PI; tie.position.set(0, -0.6, 0.38); g.add(tie); }
  else if (variant === 1) { bx(1.7, 0.18, 0.5, bas(col), 0, -0.82, 0, g); for (let i = 0; i < 4; i++) bx(0.24, 1.0, 0.24, bas(0xf4f1e6), -0.62 + i * 0.41, -0.2, 0, g); const roof = new T.Mesh(new T.ConeGeometry(1.0, 0.55, 3), bas(col)); roof.rotation.y = Math.PI / 2; roof.scale.set(1, 1, 0.5); roof.position.y = 0.58; g.add(roof); }
  else if (variant === 2) { const b = bust(0, 1, 0x5a2d12); const bun = sphere(0.2, bas(0x5a2d12), 0, 0.5, -0.05, b); g.add(b); }
  else { g.add(bust(-0.46, 0.7, 0x1a1a1a)); g.add(bust(0.46, 0.7, 0x8a5a2a)); }
  g.scale.setScalar(size); g.userData = { ring, disc }; return g;
}
/** usine : hall + toits en dents de scie + cheminées + fenêtres lumineuses */
export function buildFactory() {
  const g = new T.Group(), wall = lam(0x9aa7b3, 0x0d1013), roof = lam(0x4a5a6a), win = bas(0xffd978), dark = lam(0x37424d);
  bx(3.6, 1.7, 2.2, wall, 0, 0.85, 0, g);
  for (let i = 0; i < 3; i++) { const r = new T.Mesh(new T.CylinderGeometry(0.62, 0.62, 2.3, 3), roof); r.rotation.x = Math.PI / 2; r.rotation.z = Math.PI; r.position.set(-1.2 + i * 1.2, 2.0, 0); r.scale.set(1, 1, 1); g.add(r); }
  for (const x of [-1.4, 1.5]) { cy(0.26, 2.7, lam(0xb9473a, 0x200805), x, 3.0, -0.5, g); cy(0.3, 0.2, dark, x, 4.4, -0.5, g); }
  for (let i = 0; i < 4; i++) { const w = new T.Mesh(new T.PlaneGeometry(0.5, 0.36), win); w.position.set(-1.35 + i * 0.9, 1.1, 1.11); g.add(w); }
  bx(0.7, 1.0, 0.06, dark, 1.25, 0.5, 1.11, g);
  const smoke = []; for (let i = 0; i < 4; i++) { const s = new T.Sprite(new T.SpriteMaterial({ map: glowTex(), color: 0xc8d4de, transparent: true, opacity: 0.4, depthWrite: false })); g.add(s); smoke.push(s); } g.userData.smoke = smoke;
  return g;
}
/** bureaux : bureau, écran avec graphique, fauteuil, plante */
export function buildOffice(chart) {
  const g = new T.Group(), wood = lam(0xb98a55, 0x120b04), metal = lam(0x2b3640);
  bx(3.0, 0.14, 1.4, wood, 0, 1.15, 0, g); for (const [x, z] of [[-1.35, -0.55], [1.35, -0.55], [-1.35, 0.55], [1.35, 0.55]]) bx(0.12, 1.1, 0.12, metal, x, 0.55, z, g);
  bx(1.5, 0.95, 0.1, metal, 0, 2.0, -0.3, g); const scr = new T.Mesh(new T.PlaneGeometry(1.36, 0.82), new T.MeshBasicMaterial({ map: chart })); scr.position.set(0, 2.0, -0.24); g.add(scr); bx(0.14, 0.55, 0.14, metal, 0, 1.45, -0.3, g);
  bx(0.9, 0.05, 0.38, lam(0x3a4650), 0.1, 1.24, 0.35, g);
  const ch = new T.Group(); ch.position.set(-0.9, 0, 1.55); bx(0.8, 0.12, 0.8, lam(0x2d6cc0), 0, 0.85, 0, ch); bx(0.8, 0.9, 0.12, lam(0x2d6cc0), 0, 1.35, -0.4, ch); cy(0.07, 0.8, metal, 0, 0.42, 0, ch, 10); cy(0.45, 0.08, metal, 0, 0.05, 0, ch, 14); g.add(ch);
  cy(0.2, 0.34, lam(0xc4683f), 1.2, 1.39, 0.35, g, 12); for (let i = 0; i < 5; i++) { const lf = sphere(0.14, lam(0x3aa65c), 1.2 + (H(i, 1) - 0.5) * 0.3, 1.78 + (i % 3) * 0.1, 0.35 + (H(i, 2) - 0.5) * 0.3, g, 8, 6); lf.scale.y = 1.7; }
  return g;
}
/** salariés : trois personnes, dont une avec casque */
export function buildWorkers() {
  const g = new T.Group(), P = [];
  [[-1.0, CLOTH[1], 0xe0ac82, 0], [0.0, CLOTH[2], 0x8d5524, 1], [1.0, CLOTH[3], 0xf1c9a5, 0]].forEach(([x, shirt, skin, hat], i) => {
    const p = makePerson({ skin, shirt, pants: 0x2b3a4a, scale: 1.0 + (i === 1 ? 0.06 : 0), hair: 0x2a1a10 }); p.position.set(x, 0, i === 1 ? -0.35 : 0.15); g.add(p); P.push(p);
    if (hat) { const h = new T.Mesh(new T.SphereGeometry(0.29, 14, 8, 0, 6.283, 0, 1.4), lam(0xf2c230, 0x3a2a00)); h.position.set(0, 1.86, 0); p.add(h); const br = cy(0.34, 0.04, lam(0xf2c230), 0, 1.84, 0, p, 16); }
  });
  g.userData.people = P; return g;
}
/** produits : caisses, colis, bidon */
export function buildProducts() {
  const g = new T.Group(); const card = lam(0xc9964f, 0x160e04), tape = lam(0xe6cf9c);
  const box = (w, h, d, x, y, z, ry, m = card) => { const b = bx(w, h, d, m, x, y, z, g); b.rotation.y = ry; const t = bx(w * 0.18, h * 1.01, d * 1.01, tape, x, y, z, g); t.rotation.y = ry; return b; };
  box(1.5, 1.0, 1.1, -0.5, 0.5, 0.2, 0.15); box(1.2, 0.9, 1.0, 0.95, 0.45, 0.0, -0.2); box(1.0, 0.8, 0.9, 0.1, 1.4, 0.15, 0.4); bx(1.0, 0.8, 0.9, lam(0x2d6cc0, 0x050a14), -0.15, 0.4, 1.3, g);
  const bag = new T.Mesh(new T.SphereGeometry(0.5, 14, 10), lam(0xe0453a, 0x180503)); bag.scale.y = 1.1; bag.position.set(1.15, 0.58, 1.25); g.add(bag);
  const star = new T.Mesh(new T.OctahedronGeometry(0.33), lam(0xf2c230, 0x4a3300)); star.position.set(0.1, 2.25, 0.15); g.add(star); g.userData.star = star;
  return g;
}
