import * as T from "three";
import { floorTex, glowTex } from "./tex.js";
import { sstep, eio, lin } from "./util.js";

export const flick = (t) => (t < 0.15 ? 0 : t < 0.25 ? 0.9 : t < 0.31 ? 0.12 : t < 0.42 ? 0.8 : t < 0.48 ? 0.3 : 1);

export function buildRoom() {
  const g = new T.Group(); const r = {};
  const wallM = new T.MeshLambertMaterial({ color: 0x2d4a3c });
  const floorT = floorTex();
  const floor = new T.Mesh(new T.PlaneGeometry(60, 60), new T.MeshLambertMaterial({ map: floorT })); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, 10); g.add(floor); r.floor = floor;
  // murs : pivotent autour de leur base pour se déplier lors de la révélation (scène 4)
  const mkWall = (w, h, x, z, ry, name) => { const piv = new T.Group(); piv.position.set(x, 0, z); piv.rotation.y = ry; const m = new T.Mesh(new T.BoxGeometry(w, h, 0.5), wallM); m.position.set(0, h / 2, 0); piv.add(m); piv.userData.base = ry; g.add(piv); r[name] = piv; return piv; };
  mkWall(28, 12, 0, -5, 0, "back");
  mkWall(40, 12, -13, 12, Math.PI / 2, "left");
  mkWall(40, 12, 13, 12, -Math.PI / 2, "right");
  mkWall(28, 12, 0, 31, Math.PI, "front");
  // bandes lumineuses au plafond (tubes) + poutres
  r.tubes = [];
  for (let i = 0; i < 6; i++) for (const x of [-6, 6]) { const m = new T.Mesh(new T.BoxGeometry(0.35, 0.12, 5), new T.MeshBasicMaterial({ color: 0xdfffe9 })); m.position.set(x, 11.6, -2 + i * 6); g.add(m); r.tubes.push(m); }
  // couloir côté porte (x>13)
  const cor = new T.Mesh(new T.BoxGeometry(34, 0.2, 7), new T.MeshLambertMaterial({ color: 0x0c120f })); cor.position.set(30, -0.1, 14.2); g.add(cor);
  // lumières
  r.hemi = new T.HemisphereLight(0x9fe8bd, 0x0b1410, 0); g.add(r.hemi);
  r.key = new T.DirectionalLight(0xfff0cf, 0); r.key.position.set(6, 16, 12); g.add(r.key);
  r.slot = new T.PointLight(0xffc34d, 0, 40, 1.6); r.slot.position.set(0, 2.2, 4.5); g.add(r.slot);
  r.fill = new T.PointLight(0x4cffb0, 0, 60, 1.5); r.fill.position.set(0, 9, 14); g.add(r.fill);
  g.userData = r; return g;
}

export function updateRoom(g, t, lt, on) {
  const r = g.userData; const fl = flick(t) * (t < 29.5 ? 1 : 0.6);
  r.hemi.intensity = 0.03 + 0.62 * fl; r.key.intensity = 1.05 * fl; r.slot.intensity = 26 * on * fl; r.fill.intensity = 22 * fl * (t < 9.8 ? sstep(1, 4, t) : 1);
  r.tubes.forEach((m, i) => m.material.color.setRGB(fl * 0.87, fl, fl * 0.92));
  // dépliage des murs (30.4 -> 31.6) : chaque mur bascule vers l'extérieur et à plat
  const u = eio(lin(30.4, 31.6, t));
  const fold = (piv, sign) => { piv.rotation.z = 0; piv.rotation.x = 0; };
  r.back.rotation.set(-u * (Math.PI / 2), 0, 0);
  r.front.rotation.set(0, Math.PI, 0); r.front.rotateX(-u * (Math.PI / 2) * 1);
  r.left.rotation.set(0, Math.PI / 2, 0); r.left.rotateX(-u * (Math.PI / 2));
  r.right.rotation.set(0, -Math.PI / 2, 0); r.right.rotateX(-u * (Math.PI / 2));
  r.tubes.forEach((m) => { m.visible = u < 0.5; });
}
