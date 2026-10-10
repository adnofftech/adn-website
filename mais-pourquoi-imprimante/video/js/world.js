import * as T from "three";
import { H, lin, eio, eoutBack, lerp, clamp, sstep } from "./util.js";
import { mk } from "./tex.js";

export const WC = { x: 0, z: 13 }, RING = 40;
export const SECTORS = [
  { id: "farm", a: 0, t: 32.54, label: "NOURRITURE" },
  { id: "house", a: 1.0472, t: 33.46, label: "LOGEMENTS" },
  { id: "energy", a: 2.0944, t: 34.2, label: "ÉNERGIE" },
  { id: "shops", a: 3.1416, t: 34.98, label: "SERVICES" },
  { id: "tech", a: 4.1888, t: 35.72, label: "TECHNOLOGIES" },
  { id: "work", a: 5.236, t: 36.84, label: "TRAVAIL" },
];
export const sectorPos = (a, r = RING) => [WC.x + r * Math.cos(a), WC.z + r * Math.sin(a)];

class SetB {
  constructor() { this.b = []; this.c = []; this.y = []; }
  box(x, y, z, w, h, d, col, ry = 0) { this.b.push([x, y + h / 2, z, w, h, d, col, ry]); }
  cone(x, y, z, r, h, col, seg = 8) { this.c.push([x, y + h / 2, z, r, h, col, seg]); }
  cyl(x, y, z, r, h, col) { this.y.push([x, y + h / 2, z, r, h, col]); }
  build(lam = true) {
    const g = new T.Group(); const o = new T.Object3D(); const col = new T.Color();
    const mat = () => new T.MeshLambertMaterial({ color: 0xffffff });
    const mkI = (geo, arr, f) => { if (!arr.length) return; const im = new T.InstancedMesh(geo, mat(), arr.length); arr.forEach((a, i) => { f(a); o.updateMatrix(); im.setMatrixAt(i, o.matrix); col.setHex(a[a.length > 7 ? 6 : a.length - 1 - (a === arr[0] && 0)]); }); g.add(im); return im; };
    if (this.b.length) { const im = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), mat(), this.b.length); this.b.forEach((a, i) => { o.position.set(a[0], a[1], a[2]); o.scale.set(a[3], a[4], a[5]); o.rotation.set(0, a[7], 0); o.updateMatrix(); im.setMatrixAt(i, o.matrix); im.setColorAt(i, col.setHex(a[6])); }); g.add(im); }
    for (const seg of [4, 8]) { const arr = this.c.filter((a) => a[6] === seg); if (!arr.length) continue; const im = new T.InstancedMesh(new T.ConeGeometry(1, 1, seg), mat(), arr.length); arr.forEach((a, i) => { o.position.set(a[0], a[1], a[2]); o.scale.set(a[3], a[4], a[3]); o.rotation.set(0, Math.PI / 4, 0); o.updateMatrix(); im.setMatrixAt(i, o.matrix); im.setColorAt(i, col.setHex(a[5])); }); g.add(im); }
    if (this.y.length) { const im = new T.InstancedMesh(new T.CylinderGeometry(1, 1, 1, 14), mat(), this.y.length); this.y.forEach((a, i) => { o.position.set(a[0], a[1], a[2]); o.scale.set(a[3], a[4], a[3]); o.rotation.set(0, 0, 0); o.updateMatrix(); im.setMatrixAt(i, o.matrix); im.setColorAt(i, col.setHex(a[5])); }); g.add(im); }
    return g;
  }
}
const P = (m, x, y, z) => { m.position.set(x, y, z); return m; };
const M = (c, e = 0) => new T.MeshLambertMaterial({ color: c, emissive: e });
const MB = (c) => new T.MeshBasicMaterial({ color: c });

export function buildWorld() {
  const g = new T.Group(); g.position.set(WC.x, 0, WC.z); const w = { sets: {}, dyn: {} };
  // sol + routes
  const ground = new T.Mesh(new T.CircleGeometry(95, 64), new T.MeshLambertMaterial({ color: 0x2f6246 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.12; g.add(ground);
  const road = new T.Mesh(new T.RingGeometry(RING - 8, RING - 5.5, 96), new T.MeshLambertMaterial({ color: 0x3a4540, side: T.DoubleSide })); road.rotation.x = -Math.PI / 2; road.position.y = 0.03; g.add(road);
  for (const s of SECTORS) { const [x, z] = sectorPos(s.a); const pad = new T.Mesh(new T.CircleGeometry(15, 40), new T.MeshLambertMaterial({ color: 0x3c7a58 })); pad.rotation.x = -Math.PI / 2; pad.position.set(x - WC.x, 0.02, z - WC.z); g.add(pad);
    const sp = new T.Mesh(new T.RingGeometry(RING - 8, 0.01, 4), new T.MeshBasicMaterial()); // (placeholder inutilisé)
    const rd = new T.Mesh(new T.PlaneGeometry(RING - 20, 2.6), new T.MeshLambertMaterial({ color: 0x3a4540 })); rd.rotation.x = -Math.PI / 2; rd.rotation.z = -s.a; rd.position.set((x - WC.x) * 0.38, 0.03, (z - WC.z) * 0.38); g.add(rd); }
  const place = (id, a, build) => { const [x, z] = sectorPos(a); const grp = new T.Group(); grp.position.set(x - WC.x, 0, z - WC.z); grp.rotation.y = -a + Math.PI / 2; const sb = new SetB(); const extra = build(sb, grp); grp.add(sb.build()); g.add(grp); w.sets[id] = grp; grp.userData.extra = extra; };

  // ---- FERME ----
  place("farm", SECTORS[0].a, (s, grp) => {
    const cols = [0x4fa04d, 0xd2b04a, 0x3d8a45, 0xb89a3e];
    for (let i = 0; i < 4; i++) { const fx = -6 + (i % 2) * 8, fz = -5 + Math.floor(i / 2) * 7; s.box(fx, 0.05, fz, 7, 0.3, 5.5, cols[i]); for (let r = 0; r < 6; r++) s.box(fx, 0.35, fz - 2.2 + r * 0.9, 6.4, 0.5, 0.35, i % 2 ? 0xe8d47a : 0x2f7a3a); }
    s.box(7, 0, -5.5, 4.4, 3.2, 3.4, 0xb23a2c); s.cone(7, 3.2, -5.5, 3.6, 2.2, 0x5a2a1c, 4); s.cyl(11, 0, -5, 1.1, 6, 0xcfd6d2); s.cone(11, 6, -5, 1.2, 1.4, 0x9aa5a0, 10);
    for (let i = 0; i < 7; i++) { s.cyl(-10 + i * 1.7, 0, 8.2, 0.14, 1.2, 0x5a3b22); s.cone(-10 + i * 1.7, 1.1, 8.2, 0.9, 2.2, 0x2f7a3a); }
    const tr = new T.Group(); tr.add(P(new T.Mesh(new T.BoxGeometry(1.8, 0.9, 1.1), M(0x2f9a52)), 0, 0.9, 0)); tr.add(P(new T.Mesh(new T.BoxGeometry(0.8, 0.8, 0.9), M(0xdde7e0)), 0.3, 1.7, 0));
    for (const [x, z, r] of [[-0.6, 0.6, 0.55], [-0.6, -0.6, 0.55], [0.7, 0.55, 0.38], [0.7, -0.55, 0.38]]) { const wh = new T.Mesh(new T.CylinderGeometry(r, r, 0.3, 12), M(0x161616)); wh.rotation.x = Math.PI / 2; wh.position.set(x, r, z); tr.add(wh); }
    grp.add(tr); return { tractor: tr };
  });
  // ---- LOGEMENTS ----
  place("house", SECTORS[1].a, (s, grp) => {
    const wall = [0xf0e6cf, 0xe9c9a0, 0xd7e3ea, 0xf3d6d0]; for (let i = 0; i < 9; i++) { const x = -7 + (i % 3) * 7, z = -7 + Math.floor(i / 3) * 7; const hh = 2 + (i % 3) * 0.7; s.box(x, 0, z, 3.6, hh, 3.6, wall[i % 4]); s.cone(x, hh, z, 3.2, 2.0, [0xb5432e, 0x7a3b2a, 0x4a5d6a][i % 3], 4); s.box(x, 0.8, z + 1.81, 0.8, 1.1, 0.06, 0xffd77a); }
    const crane = new T.Group(); crane.add(P(new T.Mesh(new T.BoxGeometry(0.5, 11, 0.5), M(0xf0b429)), 0, 5.5, 0)); const arm = new T.Group(); arm.add(P(new T.Mesh(new T.BoxGeometry(9, 0.4, 0.4), M(0xf0b429)), 3, 0, 0)); arm.add(P(new T.Mesh(new T.BoxGeometry(0.15, 3, 0.15), M(0x222)), 6.5, -1.5, 0)); arm.position.y = 11; crane.add(arm); crane.position.set(10.5, 0, 6); grp.add(crane);
    const nh = new T.Mesh(new T.BoxGeometry(3.6, 2.4, 3.6), M(0xf0e6cf)); nh.position.set(10.5, 1.2, -3); grp.add(nh); return { arm, nh };
  });
  // ---- ÉNERGIE ----
  place("energy", SECTORS[2].a, (s, grp) => {
    const turbines = []; for (let i = 0; i < 4; i++) { const x = -9 + i * 6, z = -7 + (i % 2) * 3; s.cyl(x, 0, z, 0.32, 10, 0xe8eeee); const hub = new T.Group(); hub.position.set(x, 10.3, z + 0.5); for (let b = 0; b < 3; b++) { const bl = new T.Mesh(new T.BoxGeometry(0.25, 4.4, 0.08), M(0xf4f6f6)); bl.position.y = 2.2; const piv = new T.Group(); piv.rotation.z = b * 2.094; piv.add(bl); hub.add(piv); } grp.add(hub); turbines.push(hub); }
    for (let i = 0; i < 12; i++) { const x = -9 + (i % 6) * 3.4, z = 2.5 + Math.floor(i / 6) * 3.4; const p = new T.Mesh(new T.BoxGeometry(2.8, 0.1, 2.4), M(0x1b3f7a, 0x08204a)); p.position.set(x, 1.1, z); p.rotation.x = -0.5; grp.add(p); s.cyl(x, 0, z, 0.1, 1.1, 0x9aa5a0); }
    s.box(9.5, 0, 6, 0.4, 9, 0.4, 0x6b7773); s.box(9.5, 8, 6, 4, 0.2, 0.2, 0x6b7773); s.box(9.5, 6.6, 6, 3, 0.2, 0.2, 0x6b7773); return { turbines };
  });
  // ---- SERVICES ----
  place("shops", SECTORS[3].a, (s, grp) => {
    const aw = [0xe0453a, 0xf2c230, 0x2d6cc0, 0x3aa65c, 0xee8a2b]; for (let i = 0; i < 5; i++) { const x = -9 + i * 4.4; s.box(x, 0, -6, 3.8, 3.4, 3.4, 0xe9e1d0); s.box(x, 2.6, -4.1, 3.9, 0.35, 1.2, aw[i]); s.box(x, 0.5, -4.25, 2.3, 1.5, 0.06, 0xffe9a8); }
    s.box(-5, 0, 6, 8, 5, 5, 0xf2f6f6); s.box(-5, 3.2, 8.6, 2.6, 0.7, 0.1, 0xe0253a); s.box(-5, 2.55, 8.6, 0.7, 2.6, 0.1, 0xe0253a);
    s.box(7, 0, 6, 6, 4, 4.5, 0xe8c07a); s.cone(7, 4, 6, 4.4, 2.2, 0x7a3b2a, 4); s.cyl(11.5, 0, 9, 0.1, 6, 0xdddddd); s.box(12.4, 5, 9, 1.8, 1.1, 0.06, 0x2d6cc0);
    const ppl = new T.InstancedMesh(new T.CapsuleGeometry(0.28, 0.7, 4, 8), new T.MeshLambertMaterial({ color: 0xffffff }), 14); const col = new T.Color(); for (let i = 0; i < 14; i++) ppl.setColorAt(i, col.setHex([0xf2c230, 0xe0453a, 0x2d6cc0, 0xf4f1e6, 0x3aa65c][i % 5])); grp.add(ppl); return { ppl };
  });
  // ---- TECH ----
  place("tech", SECTORS[4].a, (s, grp) => {
    s.box(0, 0, 0, 5.5, 16, 5.5, 0x16302a); s.box(0, 16, 0, 4, 1.2, 4, 0x2a5a48);
    const glass = new T.Mesh(new T.BoxGeometry(5.7, 15.6, 5.7), new T.MeshBasicMaterial({ color: 0x47f0a0, transparent: true, opacity: 0.22 })); glass.position.y = 8; grp.add(glass);
    for (let k = 0; k < 7; k++) s.box(0, 1.5 + k * 2.1, 2.78, 4.6, 0.25, 0.05, 0x47f0a0);
    for (let i = 0; i < 4; i++) { s.box(-9 + i * 3.6, 0, 7, 3, 3 + (i % 2), 4, 0x1f3a33); s.box(-9 + i * 3.6, 1.6, 9.05, 2.4, 0.2, 0.05, 0xe8b84a); }
    const dish = new T.Group(); { const dm = new T.Mesh(new T.ConeGeometry(2, 1.2, 20, 1, true), new T.MeshLambertMaterial({ color: 0xdde7e0, side: T.DoubleSide })); dm.rotation.x = Math.PI * 0.75; dish.add(dm); } dish.position.set(0, 18.4, 0); grp.add(dish);
    const ring = new T.Mesh(new T.TorusGeometry(5.2, 0.12, 8, 48), MB(0x47f0a0)); ring.rotation.x = Math.PI / 2; ring.position.y = 10; grp.add(ring); return { dish, ring };
  });
  // ---- TRAVAIL / USINE ----
  place("work", SECTORS[5].a, (s, grp) => {
    s.box(-2, 0, -2, 12, 4.4, 8, 0x5a6a68); for (let i = 0; i < 4; i++) s.cone(-6.5 + i * 3, 4.4, -2, 1.6, 1.6, 0x3d4a48, 4);
    for (let i = 0; i < 3; i++) s.cyl(-7 + i * 3.6, 0, -6.6, 0.7, 11 + i, 0x8a4a3a);
    s.box(8.4, 0, 3, 11, 0.5, 1.3, 0x2a2f2e); s.box(0, 0, 8, 4, 2.2, 3, 0xf0b429); s.box(-4, 0, 8, 3, 3, 3, 0x9aa5a0);
    const crane = new T.Group(); crane.add(P(new T.Mesh(new T.BoxGeometry(0.5, 9, 0.5), M(0xe0453a)), 0, 4.5, 0)); const arm = new T.Group(); arm.add(P(new T.Mesh(new T.BoxGeometry(8, 0.4, 0.4), M(0xe0453a)), 2.5, 0, 0)); arm.position.y = 9; crane.add(arm); crane.position.set(-9, 0, 7); grp.add(crane);
    const crates = new T.InstancedMesh(new T.BoxGeometry(0.9, 0.9, 0.9), new T.MeshLambertMaterial({ color: 0xd9a05b }), 8); grp.add(crates);
    const wk = new T.InstancedMesh(new T.CapsuleGeometry(0.3, 0.8, 4, 8), new T.MeshLambertMaterial({ color: 0xffffff }), 10); const col = new T.Color(); for (let i = 0; i < 10; i++) wk.setColorAt(i, col.setHex(i % 2 ? 0xf0b429 : 0xe0653a)); grp.add(wk);
    const smoke = new T.InstancedMesh(new T.SphereGeometry(0.9, 8, 6), new T.MeshLambertMaterial({ color: 0xcfd6d2, transparent: true, opacity: 0.6 }), 30); grp.add(smoke); return { arm, crates, wk, smoke };
  });
  // voitures sur l'anneau
  w.cars = new T.InstancedMesh(new T.BoxGeometry(2.4, 1.1, 1.2), new T.MeshLambertMaterial({ color: 0xffffff }), 16); { const c = new T.Color(); for (let i = 0; i < 16; i++) w.cars.setColorAt(i, c.setHex([0xe0453a, 0xf2c230, 0x2d6cc0, 0xf4f1e6, 0x3aa65c][i % 5])); } w.cars.frustumCulled = false; g.add(w.cars);
  g.add(new T.HemisphereLight(0xe4f6ff, 0x3a6a50, 1.9)); const sun = new T.DirectionalLight(0xfff0cf, 2.4); sun.position.set(40, 60, 30); g.add(sun); w.sun = sun;
  g.userData = w; return g;
}

const o = new T.Object3D();
export function updateWorld(g, t) {
  const w = g.userData;
  for (const s of SECTORS) { const p = eoutBack(lin(s.t - 0.4, s.t + 0.3, t)); const base = t >= 57 ? 1 : p; const k = 1.0; w.sets[s.id].scale.set(k * lerp(0.9, 1, Math.min(1, base)), Math.max(0.03, 2.1 * lerp(0.02, 1, Math.min(1, base))), k * lerp(0.9, 1, Math.min(1, base))); }
  const e = (id) => w.sets[id].userData.extra;
  const f = e("farm").tractor; const u = (t * 0.25) % 2; f.position.set(-6 + (u < 1 ? u : 2 - u) * 8, 0, -5 + 0.0 + 3.2); f.rotation.y = u < 1 ? 0 : Math.PI;
  e("house").arm.rotation.y = Math.sin(t * 0.7) * 0.9; e("house").nh.scale.y = 0.3 + 0.7 * ((t * 0.12) % 1);
  e("energy").turbines.forEach((h, i) => { h.rotation.z = t * (1.3 + i * 0.12); });
  const ppl = e("shops").ppl; for (let i = 0; i < 14; i++) { const x = -10 + ((H(i, 1) * 20 + t * (0.8 + H(i, 2))) % 20), z = -2 + H(i, 3) * 4; o.position.set(x, 0.9 + Math.abs(Math.sin(t * 6 + i)) * 0.06, z); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1); o.updateMatrix(); ppl.setMatrixAt(i, o.matrix); } ppl.instanceMatrix.needsUpdate = true;
  e("tech").dish.rotation.y = t * 0.8; e("tech").ring.rotation.z = t * 0.5; e("tech").ring.position.y = 10 + Math.sin(t * 1.3) * 1.5;
  const wk = e("work"); wk.arm.rotation.y = Math.sin(t * 0.6) * 1.1;
  for (let i = 0; i < 8; i++) { const x = 3.2 + ((i * 1.4 + t * 1.6) % 11), z = 3; o.position.set(x, 0.95, z); o.scale.set(1, 1, 1); o.rotation.set(0, 0, 0); o.updateMatrix(); wk.crates.setMatrixAt(i, o.matrix); } wk.crates.instanceMatrix.needsUpdate = true;
  for (let i = 0; i < 10; i++) { o.position.set(-6 + (i % 5) * 3 + Math.sin(t * 1.2 + i) * 0.6, 0.9, 4.5 + Math.floor(i / 5) * 1.6); o.scale.set(1, 1 + 0.04 * Math.sin(t * 5 + i), 1); o.rotation.set(0, 0, 0); o.updateMatrix(); wk.wk.setMatrixAt(i, o.matrix); } wk.wk.instanceMatrix.needsUpdate = true;
  for (let i = 0; i < 30; i++) { const ch = i % 3; const u2 = ((t * 0.35 + i * 0.137) % 1); o.position.set(-7 + ch * 3.6 + u2 * 2.5, 11 + ch + u2 * 9, -6.6 + u2 * 1.5); const s2 = 0.5 + u2 * 1.6; o.scale.set(s2, s2, s2); o.rotation.set(0, 0, 0); o.updateMatrix(); wk.smoke.setMatrixAt(i, o.matrix); } wk.smoke.instanceMatrix.needsUpdate = true;
  for (let i = 0; i < 16; i++) { const a = H(i, 5) * 6.28 + t * (0.16 + (i % 3) * 0.02) * (i % 2 ? 1 : -1); const r = 38 - 5.5 - 1.2 * (i % 2 ? 1 : -1); o.position.set(Math.cos(a) * 38 * 0.0 + Math.cos(a) * (RING - 6.75 + (i % 2 ? 0.8 : -0.8)), 0.6, Math.sin(a) * (RING - 6.75 + (i % 2 ? 0.8 : -0.8))); o.rotation.set(0, -a + (i % 2 ? Math.PI / 2 : -Math.PI / 2), 0); o.scale.set(1, 1, 1); o.updateMatrix(); w.cars.setMatrixAt(i, o.matrix); } w.cars.instanceMatrix.needsUpdate = true;
}
