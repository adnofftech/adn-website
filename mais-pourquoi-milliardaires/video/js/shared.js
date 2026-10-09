// Utilitaires 3D partagés par tous les modules de scènes (aucun hasard non seedé, aucune horloge).
import * as T from "three";
import { H, clamp, lerp, sstep, lin, eio, eout, ein, eoutBack, kf } from "./util.js";
import { mk, billTex, glowTex, floorTex, FONT, MONO, drawBill } from "./tex.js";
export { T, H, clamp, lerp, sstep, lin, eio, eout, ein, eoutBack, kf, mk, billTex, glowTex, floorTex, FONT, MONO, drawBill };

export const PAL = { ink: 0x030605, green: 0x1f8a4c, mint: 0x47f0a0, gold: 0xe8b84a, paper: 0xf3ecd4, red: 0xff4a3d, blue: 0x2d6cc0, warm: 0xffb866, steel: 0x95a8a0 };
export const SKIN = [0xf1c9a5, 0xe0ac82, 0xc68642, 0x8d5524, 0x5c3a1e, 0xffdbb4];
export const CLOTH = [0xe0453a, 0x2d6cc0, 0xf2c230, 0x3aa65c, 0xee8a2b, 0x8a4fb5, 0xf4f1e6, 0x2a9d8f];

/** Personnage 3D stylisé chaleureux (corps arrondi, tête, bras/jambes articulés par rotation de groupes).
 *  userData: armL, armR, legL, legR, head, body — animables par rotation.x / rotation.z. Hauteur ≈ 1.8 * scale. */
export function makePerson({ skin = SKIN[1], shirt = CLOTH[1], pants = 0x2b3a4a, scale = 1, hair = 0x2a1a10, kind = "adult" } = {}) {
  const g = new T.Group(); const s = kind === "child" ? 0.62 : 1;
  const L = (c, em = 0) => new T.MeshLambertMaterial({ color: c, emissive: em });
  const body = new T.Mesh(new T.CapsuleGeometry(0.3, 0.62, 4, 12), L(shirt)); body.position.y = 1.12; g.add(body);
  const head = new T.Mesh(new T.SphereGeometry(0.25, 16, 12), L(skin)); head.position.y = 1.78; g.add(head);
  const cap = new T.Mesh(new T.SphereGeometry(0.265, 14, 8, 0, 6.283, 0, 1.25), L(hair)); cap.position.y = 1.8; g.add(cap);
  const limb = (r, len, c, x, y, rotz) => { const p = new T.Group(); p.position.set(x, y, 0); const m = new T.Mesh(new T.CapsuleGeometry(r, len, 3, 8), L(c)); m.position.y = -len / 2 - r; p.add(m); p.rotation.z = rotz; g.add(p); return p; };
  const armL = limb(0.1, 0.5, skin, -0.42, 1.5, 0.12), armR = limb(0.1, 0.5, skin, 0.42, 1.5, -0.12);
  const legL = limb(0.13, 0.55, pants, -0.16, 0.72, 0), legR = limb(0.13, 0.55, pants, 0.16, 0.72, 0);
  g.scale.setScalar(scale * s); g.userData = { armL, armR, legL, legR, head, body };
  return g;
}
/** Plan texte (CanvasTexture) mis à jour à la demande : mesh.userData.set(text, colorOverride?) */
export function textPlane(text, { w = 4, h = 1.2, px = 512, font = FONT, color = "#f3ecd4", bg = null, weight = 900, size = 0.62, align = "center", border = null } = {}) {
  const c = document.createElement("canvas"); c.width = px; c.height = Math.round(px * h / w); const g = c.getContext("2d");
  const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace; tx.anisotropy = 4; let last = null;
  const draw = (t, col = color) => { const key = t + "|" + col; if (key === last) return; last = key; g.clearRect(0, 0, c.width, c.height);
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height); } if (border) { g.strokeStyle = border; g.lineWidth = 6; g.strokeRect(4, 4, c.width - 8, c.height - 8); }
    g.fillStyle = col; g.font = `${weight} ${Math.round(c.height * size)}px ${font}`; g.textAlign = align; g.textBaseline = "middle"; g.fillText(t, align === "center" ? c.width / 2 : 16, c.height / 2 + 2); tx.needsUpdate = true; };
  draw(text);
  const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tx, transparent: true, side: T.DoubleSide, depthWrite: false })); m.userData.set = draw; return m;
}
export const glow = (color = 0xffffff, size = 4, opacity = 0.6) => { const s = new T.Sprite(new T.SpriteMaterial({ map: glowTex(), color, blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity })); s.scale.set(size, size, 1); return s; };
export const lam = (c, e = 0) => new T.MeshLambertMaterial({ color: c, emissive: e });
export const basic = (c, o = 1) => new T.MeshBasicMaterial({ color: c, transparent: o < 1, opacity: o });
/** Billet générique (clairement fictif) : plan 1.3 x 0.58 */
export const billMesh = (tex = billTex()) => new T.Mesh(new T.PlaneGeometry(1.3, 0.58), new T.MeshBasicMaterial({ map: tex, side: T.DoubleSide }));
/** Pile/lingot etc. : bille utilitaire */
export const box = (w, h, d, mat, x = 0, y = 0, z = 0, parent) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent?.add(m); return m; };
export const cyl = (r, h, mat, x = 0, y = 0, z = 0, parent, seg = 20) => { const m = new T.Mesh(new T.CylinderGeometry(r, r, h, seg), mat); m.position.set(x, y, z); parent?.add(m); return m; };
/** Certificat d'action stylisé (texte fictif) */
export function certTex(label = "ACTION") { return mk(512, 320, (g, w, h) => { g.fillStyle = "#f3ecd4"; g.fillRect(0, 0, w, h); g.strokeStyle = "#1f8a4c"; g.lineWidth = 10; g.strokeRect(12, 12, w - 24, h - 24); g.lineWidth = 3; g.strokeRect(30, 30, w - 60, h - 60);
  g.fillStyle = "#1f8a4c"; g.font = `900 70px ${FONT}`; g.textAlign = "center"; g.fillText(label, w / 2, 120); g.font = `700 28px ${MONO}`; g.fillStyle = "#555"; g.fillText("PART DU CAPITAL · SOCIÉTÉ FICTIVE", w / 2, 170);
  g.fillStyle = "#e8b84a"; g.beginPath(); g.arc(w / 2, 240, 42, 0, 7); g.fill(); g.fillStyle = "#1f8a4c"; g.font = `900 40px ${FONT}`; g.fillText("%", w / 2, 254); }); }
