import * as T from "three";
import { billTex, heapTex } from "./tex.js";
import { H, lin, clamp } from "./util.js";

export const SLOT = { x: 0, y: 1.3, z: 2.0 };
export const HEAP = { cx: 0, cz: 14.5 };
export const LT_END = 12.32;                     // temps local de l'imprimante au moment de l'arrêt
// temps local : continue de 0 à 9.78, saute à 9.78 pendant le supermarché, reprend à 26.96
export const localTime = (t) => (t < 9.78 ? t : t < 26.96 ? 9.78 : Math.min(LT_END, 9.78 + (t - 26.96)));
const P = 2.2, A = 7.06, T0 = 0.9, LIFE = 3.4, N = 1100;
const C = (lt) => (lt <= T0 ? 0 : A * Math.pow(lt - T0, P));
const S = (i) => T0 + Math.pow(i / A, 1 / P);
export const heapH = (lt) => 0.15 + 9.6 * Math.pow(clamp(lt / LT_END), 0.95);
export const heapR = (lt) => 3 + 8.2 * Math.pow(clamp(lt / LT_END), 0.7);
export const heapY = (x, z, lt) => { const r = Math.hypot(x - HEAP.cx, z - HEAP.cz) / heapR(lt); return r >= 1 ? 0 : heapH(lt) * (1 - r * r); };

export function buildBills() {
  const g = new T.Group();
  const tex = billTex();
  const geo = new T.PlaneGeometry(1.3, 0.58);
  const mat = new T.MeshBasicMaterial({ map: tex, side: T.DoubleSide });
  const im = new T.InstancedMesh(geo, mat, N); im.frustumCulled = false; im.count = 0; g.add(im);
  // tas principal : paraboloïde bruité
  const prof = []; const SEG = 40;
  for (let i = 0; i <= SEG; i++) { const r = i / SEG; prof.push(new T.Vector2(Math.max(0.0001, r), 1 - r * r)); }
  const hg = new T.LatheGeometry(prof.map((p) => new T.Vector2(p.x, p.y)).reverse(), 72);
  const pos = hg.attributes.position;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i); const a = Math.atan2(z, x); const rr = Math.hypot(x, z); const n = 1 + 0.025 * Math.sin(a * 7 + y * 5) + 0.02 * Math.sin(a * 13 - rr * 9) + 0.01 * Math.sin(a * 23 + rr * 20); pos.setXYZ(i, x * n, y * (0.96 + 0.08 * Math.sin(a * 5 + rr * 8)), z * n); }
  hg.computeVertexNormals();
  const heap = new T.Mesh(hg, new T.MeshLambertMaterial({ map: heapTex(), emissive: 0x041a0c })); heap.position.set(HEAP.cx, 0, HEAP.cz); g.add(heap);
  // rivière de billets qui déborde par la porte (demi-cylindre couché sur X)
  const rv = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 40, 1, false, 0, Math.PI), new T.MeshLambertMaterial({ map: heapTex(), emissive: 0x041a0c, side: T.DoubleSide }));
  rv.rotation.z = Math.PI / 2; rv.rotation.y = 0; g.add(rv);
  g.userData = { im, heap, rv };
  return g;
}

const d = new T.Object3D(); const q = new T.Quaternion(); const e = new T.Euler();
export function updateBills(g, lt, frozen) {
  const { im, heap, rv } = g.userData;
  const hh = heapH(lt), rr = heapR(lt);
  heap.scale.set(rr, hh, rr);
  // rivière : sort par la porte (x=12) entre lt 7.6 et la fin
  const L = 36 * Math.pow(lin(7.2, LT_END, lt), 0.9);
  rv.visible = L > 0.2; rv.scale.set(3.6 * Math.min(1, L / 4), L, 3.6 * Math.min(1, L / 4)); rv.position.set(11.5 + L / 2, 0, 14.2); rv.rotation.set(0, 0, Math.PI / 2);
  rv.scale.set(L > 0 ? 2.8 * Math.min(1, L / 5) : 0.01, L, 5.2);   // (x->hauteur, y->longueur, z->largeur)
  rv.position.y = 0;
  // billets en vol / posés
  const iMin = Math.max(0, Math.ceil(C(lt - LIFE))), iMax = Math.floor(C(lt));
  let n = 0;
  for (let i = iMin; i <= iMax && n < N; i++) {
    const s = S(i); const tau = lt - s; if (tau < 0 || tau > LIFE) continue;
    const spread = 0.35 + 0.65 * Math.min(1, s / 6);
    const vz = 6.5 + H(i, 1) * 7.5 * (0.6 + 0.4 * Math.min(1, s / 5)); const vy = 3.2 + H(i, 2) * 3.4; const vx = (H(i, 3) - 0.5) * 11 * spread;
    const x0 = SLOT.x + (H(i, 4) - 0.5) * 3.0, y0 = SLOT.y, z0 = SLOT.z + 0.3;
    let tl = (vy + Math.sqrt(vy * vy + 19.6 * (y0 - 0.05))) / 9.8;
    for (let k = 0; k < 2; k++) { const yl = heapY(x0 + vx * tl, z0 + vz * tl, lt) + 0.05; tl = (vy + Math.sqrt(Math.max(0, vy * vy + 19.6 * (y0 - yl)))) / 9.8; }
    const land = tau >= tl; const tt = Math.min(tau, tl);
    let x = x0 + vx * tt, z = z0 + vz * tt, y = y0 + vy * tt - 4.9 * tt * tt;
    if (land) y = heapY(x, z, lt) + 0.04 + H(i, 5) * 0.06;
    const fly = land ? 0 : 1;
    // bascule/rotation en vol, à plat une fois posé
    e.set(-Math.PI / 2 + fly * (tt * (4 + H(i, 6) * 9)) + (1 - fly) * (H(i, 7) - 0.5) * 0.2, fly * (tt * (3 + H(i, 8) * 8)) + (1 - fly) * (H(i, 9) - 0.5) * 6.28, fly * (tt * (5 * (H(i, 10) - 0.5))), "YXZ");
    q.setFromEuler(e); d.position.set(x, y, z); d.quaternion.copy(q);
    const stretch = fly ? 1 + Math.min(1.6, 0.08 * Math.hypot(vz, vy - 9.8 * tt)) : 1;
    d.scale.set(stretch, 1, 1); d.updateMatrix(); im.setMatrixAt(n++, d.matrix);
  }
  im.count = n; im.instanceMatrix.needsUpdate = true;
}
