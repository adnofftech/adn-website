// Utilitaires du module « wealth » : matrices instanciées, point d'interrogation extrudé, afficheur 7 segments 3D, texte épais.
import { T, H, lerp, clamp, sstep, lin, eio, eoutBack, textPlane, FONT, MONO, mk } from "../shared.js";

export const _o = new T.Object3D();
export const _c = new T.Color();
export const _v = new T.Vector3();
export const pop = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : eoutBack(u));
export const popAt = (t, t0, d = 0.35) => pop((t - t0) / d);
/** Écrit une matrice TRS (rotation Euler) dans un InstancedMesh */
export function put(im, i, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) {
  _o.position.set(x, y, z); _o.rotation.set(rx, ry, rz); _o.scale.set(sx, sy, sz); _o.updateMatrix(); im.setMatrixAt(i, _o.matrix);
}
export const hide = (im, i) => { _o.position.set(0, -999, 0); _o.rotation.set(0, 0, 0); _o.scale.set(0.0001, 0.0001, 0.0001); _o.updateMatrix(); im.setMatrixAt(i, _o.matrix); };
export const mixHex = (a, b, u, out = _c) => { out.setHex(a); const r = out.r, g = out.g, bl = out.b; out.setHex(b); out.r = r + (out.r - r) * u; out.g = g + (out.g - g) * u; out.b = bl + (out.b - bl) * u; return out; };
export const bez = (p0, c, p1, s, out) => { const a = (1 - s) * (1 - s), b = 2 * (1 - s) * s, d = s * s; out.set(a * p0.x + b * c.x + d * p1.x, a * p0.y + b * c.y + d * p1.y, a * p0.z + b * c.z + d * p1.z); return out; };
export const bezT = (p0, c, p1, s, out) => { out.set(2 * (1 - s) * (c.x - p0.x) + 2 * s * (p1.x - c.x), 2 * (1 - s) * (c.y - p0.y) + 2 * s * (p1.y - c.y), 2 * (1 - s) * (c.z - p0.z) + 2 * s * (p1.z - c.z)); return out.normalize(); };

/** Point d'interrogation 3D : ExtrudeGeometry d'une courbe épaissie (crochet + tige) + point extrudé. Hauteur ≈ 2,9 unités, centré sur y≈0,6. */
export function makeQuestion({ depth = 0.62 } = {}) {
  const ctr = new T.SplineCurve([
    new T.Vector2(-0.66, 1.1), new T.Vector2(-0.55, 1.52), new T.Vector2(-0.2, 1.8), new T.Vector2(0.24, 1.78),
    new T.Vector2(0.58, 1.52), new T.Vector2(0.64, 1.12), new T.Vector2(0.44, 0.72), new T.Vector2(0.1, 0.46), new T.Vector2(0.0, 0.16)]);
  const P = ctr.getPoints(56); const n = P.length; const left = [], right = [], w = 0.215; const tg = [];
  for (let i = 0; i < n; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)]; let tx = b.x - a.x, ty = b.y - a.y; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l; tg.push([tx, ty]);
    left.push(new T.Vector2(P[i].x - ty * w, P[i].y + tx * w)); right.push(new T.Vector2(P[i].x + ty * w, P[i].y - tx * w));
  }
  const poly = [...left]; const [ex, ey] = tg[n - 1]; const nLx = -ey, nLy = ex;
  for (let k = 1; k < 8; k++) { const th = (k / 8) * Math.PI; poly.push(new T.Vector2(P[n - 1].x + w * (Math.cos(th) * nLx + Math.sin(th) * ex), P[n - 1].y + w * (Math.cos(th) * nLy + Math.sin(th) * ey))); }
  for (let i = n - 1; i >= 0; i--) poly.push(right[i]);
  const [sx, sy] = tg[0]; const nSx = -sy, nSy = sx;
  for (let k = 1; k < 8; k++) { const th = (k / 8) * Math.PI; poly.push(new T.Vector2(P[0].x + w * (-Math.cos(th) * nSx - Math.sin(th) * sx), P[0].y + w * (-Math.cos(th) * nSy - Math.sin(th) * sy))); }
  const ext = { depth, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.055, bevelSegments: 2, curveSegments: 10, steps: 1 };
  const g1 = new T.ExtrudeGeometry(new T.Shape(poly), ext); g1.translate(0, 0, -depth / 2);
  const dotS = new T.Shape(); dotS.absarc(0, -0.56, 0.255, 0, Math.PI * 2, false);
  const g2 = new T.ExtrudeGeometry(dotS, ext); g2.translate(0, 0, -depth / 2);
  const gt = mk(256, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#fff0b8"); gr.addColorStop(0.35, "#f6c755"); gr.addColorStop(0.7, "#d9962a"); gr.addColorStop(1, "#a96f14"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(255,255,255,.22)"; for (const [x0, wd] of [[0.2, 0.05], [0.55, 0.12]]) { g.beginPath(); g.moveTo(w * x0, 0); g.lineTo(w * (x0 + wd), 0); g.lineTo(w * (x0 + wd - 0.35), h); g.lineTo(w * (x0 - 0.35), h); g.fill(); } }, { repeat: [0.34, 0.34] }); gt.offset.set(0.3, 0.28);
  const st = mk(256, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#f2f7ff"); gr.addColorStop(0.35, "#b9cdee"); gr.addColorStop(0.7, "#7f98c4"); gr.addColorStop(1, "#4d6490"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(255,255,255,.3)"; for (const [x0, wd] of [[0.2, 0.05], [0.55, 0.12]]) { g.beginPath(); g.moveTo(w * x0, 0); g.lineTo(w * (x0 + wd), 0); g.lineTo(w * (x0 + wd - 0.35), h); g.lineTo(w * (x0 - 0.35), h); g.fill(); } }, { repeat: [0.34, 0.34] }); st.offset.set(0.3, 0.28);
  const front = new T.MeshLambertMaterial({ map: gt, color: 0xffffff, emissive: 0x5a3d06 });
  const side = new T.MeshLambertMaterial({ color: 0xb98524, emissive: 0x2c1c02 });
  const grp = new T.Group(); const body = new T.Mesh(g1, [front, side]); const dot = new T.Mesh(g2, [front, side]); grp.add(body, dot);
  grp.userData = { front, side, body, dot, goldMap: gt, steelMap: st };
  return grp;
}

/** Afficheur 7 segments 3D (segments en ExtrudeGeometry biseautée). slots = nombre de chiffres ; gapAfter = indices après lesquels on insère un espace (milliers). */
export function makeSegDisplay(slots, { gapAfter = [], pitch = 1.46, on = 0xf3c453, onEm = 0x8a5f10, offCol = 0x241c07 } = {}) {
  const L = 0.9, Th = 0.27; const s = new T.Shape();
  s.moveTo(-L / 2, 0); s.lineTo(-L / 2 + Th / 2, Th / 2); s.lineTo(L / 2 - Th / 2, Th / 2); s.lineTo(L / 2, 0); s.lineTo(L / 2 - Th / 2, -Th / 2); s.lineTo(-L / 2 + Th / 2, -Th / 2); s.closePath();
  const gH = new T.ExtrudeGeometry(s, { depth: 0.36, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 1, curveSegments: 1 }); gH.translate(0, 0, -0.18);
  const gV = gH.clone(); gV.rotateZ(Math.PI / 2);
  const mOn = new T.MeshLambertMaterial({ color: on, emissive: onEm }); const mOff = new T.MeshLambertMaterial({ color: offCol, emissive: 0x0a0802 });
  const SEGS = [[0, 1, 0], [0.5, 0.5, 1], [0.5, -0.5, 1], [0, -1, 0], [-0.5, -0.5, 1], [-0.5, 0.5, 1], [0, 0, 0]];
  const PAT = { 0: "abcdef", 1: "bc", 2: "abdeg", 3: "abcdg", 4: "bcfg", 5: "acdfg", 6: "acdefg", 7: "abc", 8: "abcdefg", 9: "abcdfg" };
  const grp = new T.Group(); const digits = []; let x = 0; let total = 0;
  for (let i = 0; i < slots; i++) {
    const d = new T.Group(); d.position.x = x; const segs = [];
    SEGS.forEach(([sx, sy, v]) => { const m = new T.Mesh(v ? gV : gH, mOff); m.position.set(sx, sy, 0); d.add(m); segs.push(m); });
    grp.add(d); digits.push({ d, segs }); total = x; x += pitch + (gapAfter.includes(i) ? 0.7 : 0);
  }
  grp.children.forEach((c) => { c.position.x -= total / 2; });
  const set = (vals) => { digits.forEach((dg, i) => { const v = vals[i]; dg.d.visible = v !== null && v !== undefined; if (!dg.d.visible) return; const pat = PAT[v]; dg.segs.forEach((m, k) => { m.material = pat.includes("abcdefg"[k]) ? mOn : mOff; }); }); };
  grp.userData = { set, width: total + 1.2, mOn, mOff };
  return grp;
}
/** Texte « épais » : pile de plans (couches sombres derrière, face dorée devant) pour un faux relief. */
export function fatText(text, { w = 8, h = 2.4, px = 1024, color = "#f3c453", size = 0.7, weight = 900, layers = 5, step = 0.07, back = 0x4a3208, font = FONT } = {}) {
  const g = new T.Group(); const planes = [];
  for (let i = layers; i >= 0; i--) {
    const m = textPlane(text, { w, h, px, color: i === 0 ? color : "#f3c453", size, weight, font }); m.position.z = -i * step; if (i > 0) m.material.color.setHex(back); g.add(m); planes.push(m);
  }
  g.userData.set = (t, col) => planes.forEach((p, i) => p.userData.set(t, i === planes.length - 1 ? (col || color) : "#f3c453"));
  g.userData.planes = planes; return g;
}
/** Texte simple (mention discrète) */
export const smallText = (text, { w = 20, h = 1, px = 1024, color = "#cfe3d8", size = 0.5, weight = 700, font = MONO } = {}) => textPlane(text, { w, h, px, color, size, weight, font });
/** Orientation « face caméra » : lacet complet + fraction du tangage */
export function faceCam(obj, camPos, pitchK = 0.6) {
  const dx = camPos[0] - obj.position.x, dy = camPos[1] - obj.position.y, dz = camPos[2] - obj.position.z;
  obj.rotation.order = "YXZ"; obj.rotation.y = Math.atan2(dx, dz); obj.rotation.x = -pitchK * Math.atan2(dy, Math.hypot(dx, dz)); obj.rotation.z = 0;
}
/** Texte d'une ligne ajusté à la largeur du plan (jamais coupé), ombre portée sombre pour rester lisible sur la carte. */
export function fitText(text, { w = 8, h = 1, px = 1024, color = "#f3ecd4", size = 0.6, weight = 700, font = MONO, fill = 0.97 } = {}) {
  const c = document.createElement("canvas"); c.width = px; c.height = Math.round((px * h) / w); const g = c.getContext("2d");
  let fs = Math.round(c.height * size); g.font = `${weight} ${fs}px ${font}`; const mw = g.measureText(text).width; if (mw > c.width * fill) fs = Math.floor((fs * c.width * fill) / mw);
  g.font = `${weight} ${fs}px ${font}`; g.textAlign = "center"; g.textBaseline = "middle"; g.shadowColor = "rgba(0,0,0,.9)"; g.shadowBlur = Math.round(fs * 0.2); g.fillStyle = color; g.fillText(text, c.width / 2, c.height / 2 + 2);
  const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace; tx.anisotropy = 4;
  return new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tx, transparent: true, side: T.DoubleSide, depthWrite: false }));
}
