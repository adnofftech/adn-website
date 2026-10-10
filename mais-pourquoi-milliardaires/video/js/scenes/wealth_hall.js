// Salle des coffres (S1, S2, S18) : coque (murs, coffres, écrans), plafond lumineux, piles de richesses, montagne de billets, foule, billets en vol, pluie d'argent.
import { T, H, PAL, SKIN, CLOTH, clamp, lerp, sstep, lin, eio, eout, ein, eoutBack, mk, billTex, glowTex, floorTex, FONT, MONO } from "../shared.js";
import { heapTex } from "../tex.js";
import { _o, _c, _v, put, hide, pop, popAt, mixHex, bez } from "./wealth_lib.js";

export const MT = { R: 11, H: 22.5 };
export const HALL = { xw: 17, h: 24, zf: 46, zb: -44 };
const TAU = Math.PI * 2;
export const mtnY = (r, a) => { const u = r / MT.R; if (u >= 1) return 0; return MT.H * Math.pow(1 - u * u, 1.15) * (0.97 + 0.03 * Math.sin(a * 5 + u * 8)); };
const mtnRad = (a, y) => 1 + 0.03 * Math.sin(a * 7 + y * 0.3) + 0.025 * Math.sin(a * 13 - y * 0.5) + 0.012 * Math.sin(a * 23 + y);

const panelTex = (rx, ry) => mk(256, 256, (g, w, h) => {
  g.fillStyle = "#0d1512"; g.fillRect(0, 0, w, h); g.strokeStyle = "#2a4a3c"; g.lineWidth = 4; g.strokeRect(5, 5, w - 10, h - 10);
  g.strokeStyle = "#16271f"; g.lineWidth = 2; g.beginPath(); g.moveTo(w / 2, 5); g.lineTo(w / 2, h - 5); g.moveTo(5, h / 2); g.lineTo(w - 5, h / 2); g.stroke();
  g.fillStyle = "#4a6e5c"; for (const [x, y] of [[16, 16], [w - 16, 16], [16, h - 16], [w - 16, h - 16]]) { g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); }
}, { repeat: [rx, ry] });
const cashTex = () => mk(128, 64, (g, w, h) => {
  g.fillStyle = "#2c8a52"; g.fillRect(0, 0, w, h); g.fillStyle = "rgba(255,255,255,.10)"; for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 1);
  g.fillStyle = "#e9dfb4"; g.fillRect(w * 0.42, 0, w * 0.16, h); g.fillStyle = "#1a5c36"; g.fillRect(w * 0.42, h * 0.4, w * 0.16, h * 0.2);
});
const digitStrip = () => mk(320, 640, (g, w, h) => {
  g.clearRect(0, 0, w, h); g.textAlign = "center"; g.textBaseline = "middle"; g.font = `900 56px ${MONO}`;
  for (let c = 0; c < 5; c++) for (let r = 0; r < 10; r++) { g.fillStyle = c === 2 ? "#ffd46a" : "#7dffc4"; g.fillText(String(Math.floor(H(c * 10 + r, 3) * 10)), c * 64 + 32, r * 64 + 34); }
}, { repeat: [1, 0.2] });

// ------------------------------------------------------------------ montagne
export function buildMountain() {
  const g = new T.Group(); const SEG = 40;
  const prof = []; for (let i = 0; i <= SEG; i++) { const u = i / SEG; prof.push(new T.Vector2(Math.max(0.001, u * MT.R), MT.H * Math.pow(1 - u * u, 1.15))); }
  const hg = new T.LatheGeometry(prof.reverse(), 72); const pos = hg.attributes.position;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i); const a = Math.atan2(z, x); const n = mtnRad(a, y); pos.setXYZ(i, x * n, y, z * n); }
  hg.computeVertexNormals();
  const mtn = new T.Mesh(hg, new T.MeshLambertMaterial({ map: heapTex(), emissive: 0x07281a })); g.add(mtn);
  // billets collés sur les flancs (vrais billets lisibles de près)
  const NB = 1100; const im = new T.InstancedMesh(new T.PlaneGeometry(1.3, 0.58), new T.MeshLambertMaterial({ map: billTex(), side: T.DoubleSide, emissive: 0x0c2a16 }), NB); im.frustumCulled = false;
  const nrm = new T.Vector3(), qa = new T.Quaternion(), qb = new T.Quaternion(), zax = new T.Vector3(0, 0, 1), col = new T.Color();
  for (let i = 0; i < NB; i++) {
    const a = H(i, 1) * TAU, u = Math.sqrt(H(i, 2)) * 0.96; const r0 = u * MT.R; const y0 = mtnY(r0, a); const e = 0.05; const s = (mtnY(r0 + e, a) - mtnY(r0 - e, a)) / (2 * e);
    nrm.set(-s * Math.cos(a), 1, -s * Math.sin(a)).normalize(); const n = mtnRad(a, y0); const off = 0.05 + 0.03 * (i % 5);
    qa.setFromUnitVectors(zax, nrm); qb.setFromAxisAngle(nrm, H(i, 3) * TAU); qb.multiply(qa);
    _o.position.set(r0 * n * Math.cos(a) + nrm.x * off, y0 + nrm.y * off, r0 * n * Math.sin(a) + nrm.z * off); _o.quaternion.copy(qb); _o.scale.setScalar(1.5 + H(i, 4) * 0.9); _o.updateMatrix(); im.setMatrixAt(i, _o.matrix);
    const k = H(i, 5); col.setRGB(0.75 + 0.25 * H(i, 6), 0.85 + 0.15 * H(i, 7), 0.7 + 0.2 * k); if (k > 0.86) col.setRGB(1, 0.92, 0.55); im.setColorAt(i, col);
  }
  g.add(im); g.userData = { mtn, bills: im };
  return g;
}

// ------------------------------------------------------------------ foule
export const BLOCKS = [ // x0, x1, z0, z1, nx, nz, tardif (S18 seulement), teinte du faisceau
  [-10.0, -4.8, 10.8, 18.0, 5, 7, 0, 0x47f0a0], [4.8, 10.0, 10.8, 18.0, 5, 7, 0, 0xffd27a], [-15.6, -10.4, 6.0, 15.0, 5, 6, 0, 0x7ad7ff], [10.4, 15.6, 6.0, 15.0, 5, 6, 0, 0xff9a7a],
  [-10.0, -4.8, 19.0, 24.0, 6, 4, 1, 0xc9a0ff], [4.8, 10.0, 19.0, 24.0, 6, 4, 1, 0x47f0a0], [-15.4, -9.8, 16.0, 25.0, 6, 5, 1, 0xffd27a], [9.8, 15.4, 16.0, 25.0, 6, 5, 1, 0x7ad7ff],
];
const blockC = (b) => [(b[0] + b[1]) / 2, (b[2] + b[3]) / 2];
function makeCrowd() {
  const people = [];
  BLOCKS.forEach(([x0, x1, z0, z1, nx, nz, late], ci) => {
    for (let a = 0; a < nx; a++) for (let b = 0; b < nz; b++) {
      const i = people.length; let x = x0 + ((a + 0.5 + (H(i, 11) - 0.5) * 0.7) / nx) * (x1 - x0), z = z0 + ((b + 0.5 + (H(i, 12) - 0.5) * 0.7) / nz) * (z1 - z0);
      const d = Math.hypot(x, z); if (d < MT.R + 1.4) { x *= (MT.R + 1.4) / d; z *= (MT.R + 1.4) / d; }
      people.push({ x, z, ci, late, sc: 1.75 + 0.3 * H(i, 13), skin: SKIN[Math.floor(H(i, 14) * SKIN.length)], cloth: CLOTH[Math.floor(H(i, 15) * CLOTH.length)], tp: late ? 79.25 + 0.9 * H(i, 16) : 2.55 + 0.05 * ci + 0.45 * H(i, 16), ph: H(i, 17) * TAU });
    }
  });
  const N = people.length; const grp = new T.Group();
  const bodyG = new T.CylinderGeometry(0.22, 0.36, 1.3, 6, 1); bodyG.translate(0, 0.65, 0);
  const headG = new T.IcosahedronGeometry(0.27, 0); headG.translate(0, 1.58, 0);
  const bodyM = new T.MeshLambertMaterial({ color: 0xffffff, emissive: 0x181818 }), headM = new T.MeshLambertMaterial({ color: 0xffffff, emissive: 0x181818 });
  const mkArm = (sx) => { const g = new T.BoxGeometry(0.11, 0.66, 0.11); g.translate(0, 0.33, 0); g.rotateZ(-sx * 0.62); g.translate(sx * 0.27, 1.12, 0); return g.toNonIndexed(); };
  const aL = mkArm(-1), aR = mkArm(1); const armG = new T.BufferGeometry();
  for (const nm of ['position', 'normal', 'uv']) { const A = aL.attributes[nm].array, B = aR.attributes[nm].array; const c = new Float32Array(A.length + B.length); c.set(A); c.set(B, A.length); armG.setAttribute(nm, new T.BufferAttribute(c, aL.attributes[nm].itemSize)); }
  const armM = new T.MeshLambertMaterial({ color: 0xffffff, emissive: 0x181818 });
  const arms = new T.InstancedMesh(armG, armM, N); arms.frustumCulled = false;
  const bodies = new T.InstancedMesh(bodyG, bodyM, N), heads = new T.InstancedMesh(headG, headM, N); bodies.frustumCulled = heads.frustumCulled = false;
  const col = new T.Color(); people.forEach((p, i) => { bodies.setColorAt(i, col.setHex(p.cloth)); heads.setColorAt(i, col.setHex(p.skin)); arms.setColorAt(i, col.setHex(p.skin)); });
  grp.add(bodies, heads, arms);
  const beams = BLOCKS.map((b) => {
    const [cx, cz] = blockC(b);
    const m = new T.Mesh(new T.CylinderGeometry(0.5, (b[1] - b[0]) * 0.5, 23.4, 14, 1, true), new T.MeshBasicMaterial({ color: b[7], transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
    m.position.set(cx, 11.7, cz); grp.add(m); return m;
  });
  grp.userData = { people, bodies, heads, arms, bodyM, headM, armM, beams, N };
  return grp;
}

// ------------------------------------------------------------------ richesses
function pyramid(arr, cx, cz, ry, nx, nz, w, h, d, ta, step = 0.06) {
  let layer = 0, y = 0; const c = Math.cos(ry), s = Math.sin(ry);
  while (nx >= 1 && nz >= 1) {
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const lx = (i - (nx - 1) / 2) * w * 1.03, lz = (j - (nz - 1) / 2) * d * 1.03;
      arr.push({ x: cx + lx * c + lz * s, y: y + h / 2, z: cz - lx * s + lz * c, ry, sw: w, sh: h, sd: d, ta: ta < 0 ? -1 : ta + layer * step + 0.015 * (i + j) });
    }
    y += h; layer++; nx--; if (nz > 1 && layer % 2 === 0) nz--;
  }
}
function makeRiches() {
  const grp = new T.Group(); const cash = [], gold = [], coin = [];
  // piles qui apparaissent sur « milliardaires » (1,92) et s'accumulent autour du cadre
  const TM = 1.92;
  const sites = [
    ["gold", -6.9, 47, 0.2, TM + 0.02, 0.78], ["cash", 7.0, 44.5, -0.2, TM + 0.07, 0.74], ["coin", -6.2, 40.5, 0, TM + 0.13, 0.9], ["gold", 6.9, 38.5, 0.3, TM + 0.19, 0.78],
    ["cash", -7.1, 34.5, 0.1, TM + 0.25, 0.74], ["coin", 6.3, 32.5, 0, TM + 0.31, 0.9], ["gold", -7.2, 28.5, -0.15, TM + 0.37, 0.7], ["cash", 7.3, 27, 0.2, TM + 0.43, 0.7],
    ["gold", -12.4, 46, -0.2, TM + 0.5, 1], ["cash", 12.6, 42.5, 0.3, TM + 0.55, 1], ["cash", -12.8, 35, 0.2, TM + 0.6, 1], ["gold", 12.6, 33, -0.2, TM + 0.65, 1],
    ["gold", -13.4, 26, 0.1, TM + 0.7, 1], ["cash", 13.4, 24, -0.1, TM + 0.75, 1],
  ];
  for (const [ty, x, z, ry, ta, k0] of sites) {
    if (ty === "gold") pyramid(gold, x, z, ry, 6, 3, 1.45 * k0, 0.62 * k0, 0.78 * k0, ta);
    else if (ty === "cash") pyramid(cash, x, z, ry, 5, 3, 1.8 * k0, 0.9 * k0, 1.15 * k0, ta);
    else for (let k = 0; k < 3; k++) for (let c = 0; c < 15; c++) coin.push({ x: x + (k - 1) * 1.5, y: 0.13 + c * 0.26, z: z + (k === 1 ? 0.5 : -0.3), ry: H(c + k * 20, 3), sw: 1.4, sh: 0.26, sd: 1.4, ta: ta + k * 0.05 + c * 0.03 });
  }
  // grosses piles permanentes au fond / sur les côtés
  const perm = [["gold", -13.2, -14, 0.1], ["cash", 13.2, -17, -0.1], ["gold", 13.2, -30, 0.1], ["cash", -13.2, -26, 0.2], ["gold", -13, 4, 0.05], ["cash", 13.3, 1, -0.05]];
  for (const [ty, x, z, ry] of perm) { if (ty === "gold") pyramid(gold, x, z, ry, 6, 3, 1.45, 0.62, 0.78, -1); else pyramid(cash, x, z, ry, 5, 3, 1.8, 0.9, 1.15, -1); }
  const mk3 = (arr, geo, mat) => { const im = new T.InstancedMesh(geo, mat, Math.max(1, arr.length)); im.frustumCulled = false; grp.add(im); return im; };
  const cashM = new T.MeshLambertMaterial({ map: cashTex(), emissive: 0x0a2a14 }), goldM = new T.MeshLambertMaterial({ color: 0xf1c050, emissive: 0x6b4608 }), coinM = new T.MeshLambertMaterial({ color: 0xf6d36a, emissive: 0x74510a });
  const cashI = mk3(cash, new T.BoxGeometry(1, 1, 1), cashM), goldI = mk3(gold, new T.BoxGeometry(1, 1, 1), goldM), coinI = mk3(coin, new T.CylinderGeometry(0.5, 0.5, 1, 8), coinM);
  const colr = new T.Color(); gold.forEach((it, i) => goldI.setColorAt(i, colr.setHex(0xffffff).multiplyScalar(0.85 + 0.15 * H(i, 2)))); cash.forEach((it, i) => cashI.setColorAt(i, colr.setHex(0xffffff).multiplyScalar(0.8 + 0.2 * H(i, 3)))); coin.forEach((it, i) => coinI.setColorAt(i, colr.setHex(0xffffff).multiplyScalar(0.85 + 0.15 * H(i, 4))));
  const setAll = (im, arr, t) => { arr.forEach((it, i) => { const s = it.ta < 0 ? 1 : pop((t - it.ta) / 0.3); if (s <= 0.001) hide(im, i); else put(im, i, it.x, it.y * (it.ta < 0 ? 1 : s), it.z, it.sw * s, it.sh * s, it.sd * s, 0, it.ry, 0); }); im.instanceMatrix.needsUpdate = true; };
  grp.userData = { cash, gold, coin, cashI, goldI, coinI, setAll };
  setAll(cashI, cash, 99); setAll(goldI, gold, 99); setAll(coinI, coin, 99);
  return grp;
}

// ------------------------------------------------------------------ billets en vol (S1, S18) et pluie (S2)
function makeFlights(people, N, tA, tB, seedK, onlyEarly) {
  const list = []; const idx = people.map((p, i) => i).filter((i) => !onlyEarly || !people[i].late);
  for (let i = 0; i < N; i++) {
    // les billets visent un voisin sur 4 : ça forme des flux denses et lisibles (montagne -> groupe de silhouettes) plutôt qu'une gerbe
    const kk = Math.floor(H(i, seedK + 1) * idx.length); const pj = people[idx[kk - (kk % 4)]]; const cl = blockC(BLOCKS[pj.ci]);
    const a0 = Math.atan2(cl[1], cl[0]) + (H(i, seedK + 2) - 0.5) * 0.3; const u0 = 0.5 + 0.45 * H(i, seedK + 3); const r0 = u0 * MT.R;
    const p0 = new T.Vector3(Math.cos(a0) * r0, mtnY(r0, a0) + 0.5, Math.sin(a0) * r0);
    const p1 = new T.Vector3(pj.x + (H(i, seedK + 4) - 0.5) * 0.6, 1.85 * pj.sc + 0.4 + H(i, seedK + 5) * 0.8, pj.z + (H(i, seedK + 6) - 0.5) * 0.6);
    // arc bas : la courbe redescend vers les têtes (plus de gerbe vers le plafond)
    const dist = p0.distanceTo(p1); const c = new T.Vector3().addVectors(p0, p1).multiplyScalar(0.5); c.y += 1.4 + 0.09 * dist; c.x += (H(i, seedK + 7) - 0.5) * 1.4; c.z += (H(i, seedK + 8) - 0.5) * 1.4;
    list.push({ t0: tA + (tB - tA) * Math.pow(H(i, seedK + 9), onlyEarly ? 1.25 : 1), dur: 1.1 + 0.9 * H(i, seedK + 10), p0, c, p1, sp: [3 + 6 * H(i, seedK + 11), 2 + 5 * H(i, seedK + 12), 4 * (H(i, seedK + 13) - 0.5)], sc: 1.25 + 0.5 * H(i, seedK + 14) });
  }
  return list;
}

export function buildHall() {
  const hall = new T.Group(); const U = {};
  // ---- coque : deux murs latéraux + mur du fond, chacun pivotant à son pied (ils basculent vers l'extérieur en S3)
  const shell = new T.Group(); hall.add(shell); U.shell = shell; U.screens = [];
  const wallMat = new T.MeshLambertMaterial({ map: panelTex(20, 4), color: 0xd8e6df, emissive: 0x0a1612 });
  const backMat = new T.MeshLambertMaterial({ map: panelTex(6, 4), color: 0xc4d4cc, emissive: 0x050b08 });
  const trimM = new T.MeshBasicMaterial({ color: 0xe8b84a }), ledM = new T.MeshBasicMaterial({ color: 0x47f0a0 });
  const c0 = new T.Color();
  const addScreen = (grp, x, y, z, ry, w, h, k) => {
    const bg = new T.Mesh(new T.PlaneGeometry(w + 0.6, h + 0.6), new T.MeshBasicMaterial({ color: 0x021008 })); bg.position.set(x, y, z); bg.rotation.y = ry;
    const frame = new T.Mesh(new T.PlaneGeometry(w + 1.0, h + 1.0), new T.MeshBasicMaterial({ color: 0xe8b84a })); frame.position.set(x, y, z); frame.rotation.y = ry;
    const tx = digitStrip(); const dg = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tx, transparent: true })); dg.position.set(x, y, z); dg.rotation.y = ry;
    const off = 0.03; const dx = Math.sin(ry) * off, dz = Math.cos(ry) * off; bg.position.x += dx; bg.position.z += dz; dg.position.x += dx * 2; dg.position.z += dz * 2;
    const glo = new T.Mesh(new T.PlaneGeometry(w + 2.4, h + 2.4), new T.MeshBasicMaterial({ color: 0x47f0a0, transparent: true, opacity: 0.18, blending: T.AdditiveBlending, depthWrite: false })); glo.position.set(x, y, z); glo.rotation.y = ry;
    grp.add(frame, bg, glo, dg); U.screens.push({ tx, k, ph: H(k, 9) });
  };
  const buildSide = (s) => {
    const g = new T.Group(); g.position.set(s * HALL.xw, 0, 0);
    const w = new T.Mesh(new T.PlaneGeometry(122, HALL.h), wallMat); w.position.set(0, HALL.h / 2, 17); w.rotation.y = s < 0 ? Math.PI / 2 : -Math.PI / 2; g.add(w);
    for (const [y, m, hh] of [[0.12, ledM, 0.12], [10.2, trimM, 0.2], [14.6, trimM, 0.14], [22.4, ledM, 0.12]]) { const b = new T.Mesh(new T.BoxGeometry(0.12, hh, 122), m); b.position.set(-s * 0.05, y, 17); g.add(b); }
    const safeN = 40; const bodyI = new T.InstancedMesh(new T.BoxGeometry(2.7, 4.4, 3.9), new T.MeshLambertMaterial({ color: 0xffffff, emissive: 0x0a1210 }), safeN);
    const doorI = new T.InstancedMesh(new T.CylinderGeometry(1.45, 1.45, 0.16, 10), new T.MeshLambertMaterial({ color: 0xffffff, emissive: 0x16201c }), safeN);
    const wheelI = new T.InstancedMesh(new T.TorusGeometry(0.55, 0.1, 4, 6), new T.MeshLambertMaterial({ color: 0xe8b84a, emissive: 0x6b4608 }), safeN);
    bodyI.frustumCulled = doorI.frustumCulled = wheelI.frustumCulled = false; let si = 0;
    for (let row = 0; row < 2; row++) for (let k = 0; k < 20; k++) {
      const z = 72 - k * 5.5, y = 2.25 + row * 4.55; put(bodyI, si, -s * 1.35, y, z, 1, 1, 1); bodyI.setColorAt(si, c0.setHex(0x4a5a54).multiplyScalar(0.8 + 0.4 * H(si + s * 50, 5)));
      put(doorI, si, -s * 2.78, y, z, 1, 1, 1, 0, 0, Math.PI / 2); doorI.setColorAt(si, c0.setHex(0x9db1a8).multiplyScalar(0.75 + 0.35 * H(si + s * 50, 6)));
      put(wheelI, si, -s * 2.9, y, z, 1, 1, 1, 0, Math.PI / 2, H(si + s * 50, 7) * 6); si++;
    }
    g.add(bodyI, doorI, wheelI);
    // écrans inclinés vers la caméra (sinon ils sont vus de biais et illisibles) et agrandis
    [56, 34, 12, -10, -30].forEach((z, k) => addScreen(g, -s * 3.6, 15.5, z, -s * (Math.PI / 2 - 0.45), 11, 6, k + (s > 0 ? 5 : 0)));
    shell.add(g); return g;
  };
  U.sideL = buildSide(-1); U.sideR = buildSide(1);
  const back = new T.Group(); back.position.set(0, 0, HALL.zb); shell.add(back); U.back = back;
  const wb = new T.Mesh(new T.PlaneGeometry(2 * HALL.xw, HALL.h), backMat); wb.position.set(0, HALL.h / 2, 0); back.add(wb);
  [-11.5, 0, 11.5].forEach((x, k) => addScreen(back, x, 15.5, 0.1, 0, 10.5, 5.8, k + 10));
  // feux de piste le long de l'allée centrale (repères de vitesse + lignes de fuite vers la montagne)
  U.runway = new T.InstancedMesh(new T.BoxGeometry(0.5, 0.07, 1.5), new T.MeshBasicMaterial({ color: 0xffffff }), 34); U.runway.frustumCulled = false;
  for (let k = 0; k < 17; k++) for (const sd of [-1, 1]) { const i = k * 2 + (sd > 0 ? 1 : 0); put(U.runway, i, sd * 2.7, 0.06, 70 - k * 3.1, 1, 1, 1); U.runway.setColorAt(i, _c.setRGB(0, 0, 0)); }
  shell.add(U.runway);
  // ---- sol (partagé avec la carte) + plafond
  const ceil = new T.Group(); hall.add(ceil); U.ceil = ceil;
  const cp = new T.Mesh(new T.PlaneGeometry(2 * HALL.xw, 122), new T.MeshLambertMaterial({ color: 0x16231e, emissive: 0x08120e })); cp.rotation.x = Math.PI / 2; cp.position.set(0, HALL.h, 17); ceil.add(cp);
  const NS = 4 * 16; const strips = new T.InstancedMesh(new T.BoxGeometry(1.2, 0.16, 4.6), new T.MeshBasicMaterial({ color: 0xffffff }), NS); strips.frustumCulled = false;
  U.stripRows = []; let q = 0; for (const x of [-11, -3.7, 3.7, 11]) for (let r = 0; r < 16; r++) { put(strips, q, x, HALL.h - 0.1, 72 - r * 7.4, 1, 1, 1); strips.setColorAt(q, _c.setRGB(0, 0, 0)); U.stripRows.push(r); q++; }
  ceil.add(strips); U.strips = strips;
  U.beams = []; [[-3.7, 52], [3.7, 36], [-11, 24], [11, 40], [-3.7, 16], [3.7, -4], [-11, -18], [11, -30]].forEach(([x, z]) => { const b = new T.Mesh(new T.ConeGeometry(2.4, HALL.h - 0.5, 14, 1, true), new T.MeshBasicMaterial({ color: 0xdfffe9, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); b.position.set(x, (HALL.h - 0.5) / 2 + 0.2, z); ceil.add(b); U.beams.push(b);
    const pool = new T.Mesh(new T.CircleGeometry(3.4, 20), new T.MeshBasicMaterial({ map: glowTex(), color: 0xcfffe6, transparent: true, opacity: 0.28, blending: T.AdditiveBlending, depthWrite: false })); pool.rotation.x = -Math.PI / 2; pool.position.set(x, 0.05, z); shell.add(pool); });
  // poutres du plafond
  const trusses = new T.InstancedMesh(new T.BoxGeometry(2 * HALL.xw, 0.55, 0.7), new T.MeshLambertMaterial({ color: 0x2a3a34, emissive: 0x0a1410 }), 17); trusses.frustumCulled = false; for (let r = 0; r < 17; r++) put(trusses, r, 0, HALL.h - 0.45, 76 - r * 7.4 + 3.7, 1, 1, 1); ceil.add(trusses);
  // ---- richesses, foule, billets
  U.riches = makeRiches(); hall.add(U.riches);
  U.crowd = makeCrowd(); hall.add(U.crowd);
  const people = U.crowd.userData.people;
  U.fl1 = makeFlights(people, 640, 2.74, 5.25, 100, true);
  U.fl18 = makeFlights(people, 900, 77.6, 83.2, 300, false);
  const bmat = new T.MeshBasicMaterial({ map: billTex(), side: T.DoubleSide }); U.billMat = bmat;
  U.bills = new T.InstancedMesh(new T.PlaneGeometry(1.3, 0.58), bmat, 900); U.bills.frustumCulled = false; hall.add(U.bills);
  U.rain = []; for (let i = 0; i < 420; i++) { const pj = people[Math.floor(H(i, 401) * people.length)]; U.rain.push({ x: pj.x + (H(i, 402) - 0.5) * 2.6, z: pj.z + (H(i, 403) - 0.5) * 2.6, ph: H(i, 404), ta: 5.3 + 1.5 * H(i, 405), sp: H(i, 406) * 6, sw: H(i, 407) * TAU, late: pj.late }); }
  U.rainI = new T.InstancedMesh(new T.PlaneGeometry(1.3, 0.58), bmat, 420); U.rainI.frustumCulled = false; hall.add(U.rainI);
  return { hall, U };
}

/** Billets en vol et pluie : état à t (pur) */
const _p = new T.Vector3();
export function updateBills(U, t, W) {
  let n = 0; const im = U.bills;
  const run = (list, lo, hi) => {
    if (t < lo || t > hi) return;
    for (const f of list) {
      const u = (t - f.t0) / f.dur; if (u <= 0 || u >= 1) continue; if (n >= 900) break;
      const s = u * u * (3 - 2 * u) * 0.7 + u * 0.3; bez(f.p0, f.c, f.p1, s, _p);
      const sc = f.sc * Math.min(1, u / 0.08) * Math.min(1, (1 - u) / 0.12); const age = (t - f.t0);
      put(im, n++, _p.x, _p.y, _p.z, sc, sc, sc, f.sp[0] * age, f.sp[1] * age, f.sp[2] * age);
    }
  };
  run(U.fl1, 2.7, 7.6); run(U.fl18, 79.1, 84);
  im.count = n; im.instanceMatrix.needsUpdate = true;
  // pluie d'argent (S2) : figée au ralenti après « non ? »
  const r = U.rainI; let m = 0;
  if (t > 5.3 && t < 8.4) {
    const hide2 = 1 - sstep(7.6, 8.2, t);
    for (const b of U.rain) {
      if (W < b.ta) continue; const cyc = 2.5; const f = ((W - b.ta + b.ph * cyc) / cyc) % 1; const y = 24 - 21.4 * f; const sw = Math.sin(W * 1.6 + b.sw) * 0.5;
      const k = Math.min(1, (W - b.ta) / 0.3) * hide2; put(r, m++, b.x + sw, y, b.z + Math.cos(W * 1.3 + b.sw) * 0.4, k, k, k, W * 2.4 + b.sp, W * 1.7 + b.sp, W * 2.1);
    }
  }
  r.count = m; r.instanceMatrix.needsUpdate = true;
}

/** Foule : apparition, rebond de joie, teinte, faisceaux */
export function updateCrowd(c, t, joy, tone) {
  const { people, bodies, heads, arms, bodyM, headM, armM, beams } = c.userData;
  for (let i = 0; i < people.length; i++) {
    const p = people[i]; const s = pop((t - p.tp) / 0.4); if (s <= 0.001 || (p.late && t < p.tp)) { hide(bodies, i); hide(heads, i); hide(arms, i); continue; }
    const bob = joy * 0.22 * Math.abs(Math.sin(t * 7.5 + p.ph)); const k = p.sc * s;
    put(bodies, i, p.x, bob, p.z, k, k * (1 + 0.04 * Math.sin(t * 7.5 + p.ph) * joy), k, 0, 0, 0); put(heads, i, p.x, bob, p.z, k, k, k, 0, 0, 0); put(arms, i, p.x, bob, p.z, k, k * (1 + 0.1 * joy * Math.sin(t * 9 + p.ph)), k, 0, 0, 0);
  }
  bodies.instanceMatrix.needsUpdate = true; heads.instanceMatrix.needsUpdate = true; arms.instanceMatrix.needsUpdate = true;
  mixHex(0xffffff, 0x7f93b8, tone, bodyM.color); headM.color.copy(bodyM.color); armM.color.copy(bodyM.color);
  beams.forEach((b, i) => { const late = BLOCKS[i][6]; const on = late ? sstep(79.3, 79.9, t) : sstep(2.6, 3.2, t); b.material.opacity = 0.085 * on * (1 - 0.5 * tone); b.visible = on > 0.01; });
}
