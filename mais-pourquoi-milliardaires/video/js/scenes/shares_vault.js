// Zone « coffre » du module shares : coffre-fort, mur de billets qui se retournent en certificats, piles de billets -> bâtiments,
// univers flottant d'actions, couloir d'anneaux, réseau d'entreprises. Repère local : plaque du coffre en z∈[-4,0], face avant vers +z, axe de plongée (0, ~10.5).
import { T, H, clamp, lerp, sstep, lin, eio, eout, ein, eoutBack, billTex, glowTex, certTex, FONT, MONO, textPlane, glow, makePerson } from "../shared.js";
import { shareCert, _o, mixHex, pop, put, hide, inst, lam, bas, addMat, rep, uvScale, chartTex, gridTex, pieTex, winTex, buildVault } from "./shares_lib.js";

const _tc = new T.Color(), _cf = new T.Vector3(), _cr = new T.Vector3(), _cu = new T.Vector3(), _cup = new T.Vector3(0, 1, 0);
export const HZ = [0, 0, -112];                              // centre de l'entreprise (S7) dans le réseau
export const axisY = (z) => (z > -22 ? 10.5 : z > -44 ? lerp(10.5, 24, (-22 - z) / 22) : lerp(24, 34, clamp((-44 - z) / 14)));
const PALT = [0x2ee6a6, 0x3b82d6, 0xe8b84a, 0xf0654f, 0x9a6bd6, 0xe9eef2, 0x25b8a3];
const clearOfAxis = (x, y, z, rmin) => { const dy = y - axisY(z), r = Math.hypot(x, dy); if (r >= rmin) return [x, y]; const k = r < 1e-3 ? 1 : rmin / r; return [r < 1e-3 ? rmin : x * k, axisY(z) + (r < 1e-3 ? 0 : dy * k)]; };
const WALL_Z = -16, COLS = 8, ROWS = 17;
const PILES = [[6.9, 9.2, 13], [11.6, 5.2, 17], [10.8, 15, 11], [18.5, 10, 14], [-25, 7, 12]];

export function buildZone() {
  const g = new T.Group(), Z = {};
  const ft = gridTex("rgba(90,200,170,.30)", "#04090d"); rep(ft, 80, 100);
  Z.floor = new T.Mesh(new T.PlaneGeometry(640, 800), new T.MeshBasicMaterial({ map: ft })); Z.floor.rotation.x = -Math.PI / 2; Z.floor.position.set(0, -0.02, -250); g.add(Z.floor);
  Z.vt = buildVault(); g.add(Z.vt); Z.V = Z.vt.userData;
  Z.inGlow = glow(0x7dffb2, 16, 0.55); Z.inGlow.position.set(0, 10, -3); g.add(Z.inGlow);
  Z.warm = glow(0xffd27a, 34, 0.0); Z.warm.position.set(0, 9, 4); g.add(Z.warm);
  Z.spill = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: glowTex(), color: 0x7dffb2, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false })); Z.spill.rotation.x = -Math.PI / 2; Z.spill.position.set(5, 0.12, 9); Z.spill.scale.set(34, 26, 1); g.add(Z.spill);
  Z.person = makePerson({ skin: 0xe0ac82, shirt: 0xf2c230, pants: 0x2b3a4a, scale: 1.05 }); Z.person.position.set(-4.4, 1.1, 10.5); Z.person.rotation.y = Math.PI + 0.12; g.add(Z.person);
  // ---- mur de billets (z = WALL_Z) : bill devant, certificat derrière
  const N = COLS * ROWS; Z.wN = N; Z.w = [];
  const pg = new T.PlaneGeometry(1, 1);
  Z.wFront = inst(pg, new T.MeshBasicMaterial({ map: billTex() }), N); Z.wBack = inst(pg, new T.MeshBasicMaterial({ map: shareCert() }), N);
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const i = r * COLS + c, x = (c - (COLS - 1) / 2) * 2.3, y = 1.5 + r * 1.0, d = Math.hypot(x, y - 10);
    let sx = x * 1.55 + (H(i, 1) - 0.5) * 9, sy = 10.5 + (y - 10.5) * 1.5 + (H(i, 2) - 0.5) * 6, sz = WALL_Z - 6 - H(i, 3) * 44; sy = Math.max(1.4, sy);
    [sx, sy] = clearOfAxis(sx, sy, sz, 5.2); sy = Math.max(1.4, sy);
    Z.w.push({ x, y, sx, sy, sz, tf: 22.9 + (d / 12) * 0.42 + H(i, 4) * 0.05, ph: H(i, 5) * 6.283 });
  }
  g.add(Z.wFront, Z.wBack);
  // ---- piles de liasses -> bâtiments
  Z.bricks = inst(new T.BoxGeometry(1.86, 0.68, 0.88), new T.MeshLambertMaterial({ map: billTex(), color: 0xcfe9d3, emissive: 0x08200f }), PILES.length * 45); g.add(Z.bricks);
  const wt = winTex(); Z.wt = wt;
  Z.pTowers = PILES.map(([x, z, h], i) => { const geo = uvScale(new T.BoxGeometry(5.7, h, 2.7), 1.4, h / 9.6); const m = new T.Mesh(geo, new T.MeshLambertMaterial({ map: wt, color: PALT[i % PALT.length], emissive: 0x0a0e12 })); m.position.set(x, h / 2, z); g.add(m); return m; });
  Z.pRings = PILES.map(([x, z]) => { const m = new T.Mesh(new T.RingGeometry(0.9, 1.0, 48), addMat(0xffd27a, 0)); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.1, z); g.add(m); return m; });
  // ---- pluie de billets / de certificats devant le coffre
  const NR = 56; Z.rain = []; for (let i = 0; i < NR; i++) Z.rain.push({ x: H(i, 1) < 0.7 ? 2.5 + H(i, 2) * 24 : -31 + H(i, 2) * 9, z: 3.5 + H(i, 3) * 17, ph: H(i, 4) * 34, sp: 1.6 + H(i, 5) * 1.4, s: 0.8 + H(i, 6) * 0.5 });
  Z.rBill = inst(pg, new T.MeshBasicMaterial({ map: billTex(), side: T.DoubleSide }), NR); Z.rCert = inst(pg, new T.MeshBasicMaterial({ map: shareCert(), side: T.DoubleSide }), NR); g.add(Z.rBill, Z.rCert);
  // ---- univers flottant : certificats, pièces, parts, graphiques, tours au sol, anneaux
  const gen = (n, k, zmin, zspan, rmin, rspan) => { const a = []; for (let i = 0; i < n; i++) { const z = zmin - H(i, k) * zspan, r = rmin + H(i, k + 1) * rspan, an = H(i, k + 2) * 6.283; let x = Math.cos(an) * r, y = axisY(z) + Math.sin(an) * r * 0.85; y = Math.max(1.6, y); [x, y] = clearOfAxis(x, y, z, 5); y = Math.max(1.6, y); a.push({ x, y, z, b: 22.86 + (-z - 20) / 70 + H(i, k + 3) * 0.12, ph: H(i, k + 4) * 6.283, s: 0.75 + H(i, k + 5) * 0.6, i }); } return a; };
  Z.certs = gen(90, 20, -20, 56, 5.5, 17); Z.certI = inst(new T.PlaneGeometry(1.7, 1.06), new T.MeshBasicMaterial({ map: shareCert(), side: T.DoubleSide }), Z.certs.length); { const wc = new T.Color(1, 1, 1); for (let i = 0; i < Z.certs.length; i++) Z.certI.setColorAt(i, wc); } g.add(Z.certI);
  Z.coins = gen(36, 40, -20, 56, 5.5, 18); Z.coinI = inst((() => { const c = new T.CylinderGeometry(0.62, 0.62, 0.14, 24); c.rotateX(Math.PI / 2); return c; })(), new T.MeshLambertMaterial({ color: 0xe8b84a, emissive: 0x5a3c00 }), Z.coins.length); g.add(Z.coinI);
  Z.pies = gen(12, 60, -22, 46, 6, 14); Z.pieI = inst((() => { const c = new T.CylinderGeometry(1.35, 1.35, 0.24, 36); c.rotateX(Math.PI / 2); return c; })(), new T.MeshLambertMaterial({ map: pieTex(), emissive: 0x0b1a2a }), Z.pies.length); g.add(Z.pieI);
  Z.cards = gen(14, 80, -22, 50, 6, 14); Z.cardI = inst(new T.PlaneGeometry(3.4, 2.1), new T.MeshBasicMaterial({ map: chartTex(3, "COURS"), side: T.DoubleSide }), Z.cards.length); g.add(Z.cardI);
  // tours au sol : 4 classes (hauteurs), croissance uniforme
  Z.tw = []; const cls = [[3.6, 7], [4.2, 10], [4.6, 14], [5.2, 19]]; Z.twI = cls.map(([w, h]) => { const im = inst(uvScale(new T.BoxGeometry(w, h, w), w / 4, h / 9.6), new T.MeshLambertMaterial({ map: wt, color: 0xffffff, emissive: 0x080c12 }), 8); g.add(im); im.userData = { w, h, n: 0 }; return im; });
  for (let i = 0; i < 28; i++) { const c = Math.floor(H(i, 90) * 4), im = Z.twI[c], k = im.userData.n; if (k >= 8) continue; im.userData.n++; const z = -26 - H(i, 91) * 44, x = (H(i, 92) < 0.5 ? -1 : 1) * (7.5 + H(i, 93) * 24); im.setColorAt(k, new T.Color(PALT[Math.floor(H(i, 94) * PALT.length)])); Z.tw.push({ c, k, x, z, b: 22.95 + (-z - 26) / 60 + H(i, 95) * 0.1 }); }
  // anneaux du couloir
  Z.rings = []; for (let k = 0; k < 7; k++) { const m = new T.Mesh(new T.RingGeometry(8.3, 8.9, 72), addMat(k % 2 ? 0xe8b84a : 0x47f0a0, 0.0)); m.position.set(0, axisY(-8 - k * 9), -8 - k * 9); g.add(m); Z.rings.push(m); }
  Z.tags = [["ACTIONS", -2.6, 11.7, -9, "#e8b84a", 0.0], ["BÂTIMENTS", 2.8, 9.2, -9, "#6fa8ff", 0.1], ["PARTICIPATIONS", -1.2, 6.9, -9, "#47f0a0", 0.2]].map(([txt, x, y, z, col, d]) => { const m = textPlane(txt, { w: txt.length > 10 ? 8.6 : 5.6, h: 1.55, px: 1024, color: col, bg: "rgba(6,12,22,.9)", border: col, size: 0.4 }); m.position.set(x, y, z); m.userData.d = d; g.add(m); return m; });
  Z.tunnelGlow = glow(0xd8fff0, 38, 0.0); Z.tunnelGlow.position.set(0, 12, -86); g.add(Z.tunnelGlow);
  // ---- réseau d'entreprises (autour de l'entreprise, couloir dégagé devant elle)
  Z.nb = []; const nc = [[4.4, 6], [4.2, 9], [4.8, 12], [5.4, 16]]; Z.nbI = nc.map(([w, h]) => { const im = inst(uvScale(new T.BoxGeometry(w, h, w), w / 4, h / 9.6), new T.MeshLambertMaterial({ map: wt, color: 0xffffff, emissive: 0x080c12 }), 36); g.add(im); im.userData = { w, h, n: 0 }; return im; });
  const cols = 11, rows = 10;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c, x = (c - (cols - 1) / 2) * 11.5 + (H(i, 1) - 0.5) * 4.5, z = -78 - r * 10 + (H(i, 2) - 0.5) * 4.5;
    if (Math.hypot(x - HZ[0], z - HZ[2]) < 27 || (Math.abs(x) < 44 && z > -100)) continue;
    const cl = Math.floor(H(i, 3) * 4), im = Z.nbI[cl], k = im.userData.n; if (k >= 36) continue; im.userData.n++;
    im.setColorAt(k, new T.Color(PALT[Math.floor(H(i, 4) * PALT.length)]).lerp(new T.Color(0xffffff), 0.25));
    Z.nb.push({ cl, k, x, z, h: im.userData.h, b: 23.55 + ((-z - 76) / 100) * 0.32 + H(i, 5) * 0.06, c, r });
  }
  // traces lumineuses au sol + impulsions + nœuds
  Z.links = []; const idx = {}; Z.nb.forEach((b, i) => { idx[b.r + "_" + b.c] = i; });
  Z.nb.forEach((b, i) => { for (const [dc, dr] of [[1, 0], [0, 1], [1, 1]]) { const j = idx[(b.r + dr) + "_" + (b.c + dc)]; if (j !== undefined && (dc + dr < 2 || H(i, 7) > 0.55)) Z.links.push([i, j]); } });
  Z.hub = Z.links.length; Z.nb.map((b, i) => [Math.hypot(b.x - HZ[0], b.z - HZ[2]), i]).sort((a, b) => a[0] - b[0]).slice(0, 7).forEach(([, i]) => Z.links.push([i, -1]));
  Z.linkI = inst(new T.BoxGeometry(1, 1, 1), addMat(0x47f0a0, 0.75), Z.links.length); g.add(Z.linkI);
  Z.pulseI = inst(new T.SphereGeometry(0.5, 10, 8), new T.MeshBasicMaterial({ color: 0xffffff }), Z.links.length); g.add(Z.pulseI);
  const nodeG = new T.BufferGeometry(); nodeG.setAttribute("position", new T.BufferAttribute(new Float32Array(Z.nb.length * 3), 3)); Z.nodes = new T.Points(nodeG, new T.PointsMaterial({ map: glowTex(), size: 7, color: 0x9fffe0, transparent: true, opacity: 0.9, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true })); Z.nodes.frustumCulled = false; g.add(Z.nodes);
  g.userData = Z; return g;
}

export const linkEnds = (Z, L) => { const a = Z.nb[L[0]], b = L[1] < 0 ? { x: HZ[0], z: HZ[2] } : Z.nb[L[1]]; return [a.x, a.z, b.x, b.z]; };

export function updateZone(Z, t, TM, cam, cl) {
  const V = Z.V, nearK = (x, y, z) => sstep(2.6, 7.0, Math.hypot(x - cl[0], y - cl[1], z - cl[2]));   // aucun objet ne traverse la caméra : réduction à l'approche
  // ---------------- porte
  const ajar = 0.6, open = 1.72;
  const unlock = lin(TM.milliardaires - 0.1, TM.ce + 0.12, t), swing = eio(lin(TM.ce + 0.02, TM.ce + 1.0, t)), settle = Math.exp(-Math.max(0, t - (TM.ce + 1.0)) * 6) * Math.sin(Math.max(0, t - (TM.ce + 1.0)) * 14) * 0.03;
  const th = ajar + 0.06 * eio(lin(21.18, TM.ce + 0.1, t)) + (open - ajar - 0.06) * swing + (t > TM.ce + 1.0 ? settle : 0);
  V.pivot.rotation.y = -th; V.wheel.rotation.z = -6.4 * eio(unlock) - 0.8 * swing;
  const ajarK = 1 - sstep(TM.ce, TM.ce + 0.8, t);
  Z.spill.material.opacity = 0.55 * ajarK * (0.85 + 0.15 * Math.sin(t * 5)); Z.spill.visible = ajarK > 0.01;
  { const p = Z.person.userData, hd = -0.18 * sstep(21.18, 21.9, t) * (1 - sstep(TM.ce + 0.5, TM.ce + 1.0, t)); p.head.rotation.x = hd; p.armR.rotation.z = -0.12 - 0.25 * sstep(TM.ce + 0.1, TM.ce + 0.6, t); Z.person.visible = t < 23.75; }
  { const pk = 1 - sstep(22.25, 22.5, t); V.plq.visible = pk > 0.01; V.plq.material.opacity = pk; }
  V.seam.material.opacity = 0.5 * ajarK * (0.8 + 0.2 * Math.sin(t * 7)); Z.inGlow.material.opacity = 0.55 + 0.25 * Math.sin(t * 3) * ajarK;
  Z.warm.material.opacity = 0.32 * sstep(21.18, 22.6, t) * (1 - sstep(TM.juste, TM.juste + 0.6, t));
  // ---------------- mur : les billets se retournent en certificats puis se dispersent
  const wallOn = t < 24.15; Z.wFront.visible = Z.wBack.visible = wallOn;
  if (wallOn) {
    for (let i = 0; i < Z.wN; i++) {
      const w = Z.w[i], th2 = Math.PI * eio(lin(w.tf, w.tf + 0.34, t)), sc = eout(lin(w.tf + 0.28, w.tf + 1.15, t));
      const x = lerp(w.x, w.sx, sc), y = lerp(w.y, w.sy, sc), z = lerp(WALL_Z, w.sz, sc), spin = 0.35 * Math.sin(t * 0.9 + w.ph) * sc, tilt = 0.25 * Math.sin(t * 0.7 + w.ph * 1.3) * sc;
      const nk = nearK(x, y, z);
      if (nk < 0.02) { hide(Z.wFront, i); hide(Z.wBack, i); continue; }
      if (th2 < Math.PI / 2) { put(Z.wFront, i, x, y, z, 2.1 * (1 - 0.15 * sc) * nk, 0.94 * nk, 1, tilt, th2 + spin, 0); hide(Z.wBack, i); }
      else { hide(Z.wFront, i); put(Z.wBack, i, x, y, z, 1.62 * (1 + 0.1 * sc) * nk, 1.0 * (1 + 0.1 * sc) * nk, 1, tilt, th2 + Math.PI + spin, 0); }
    }
    Z.wFront.instanceMatrix.needsUpdate = true; Z.wBack.instanceMatrix.needsUpdate = true;
  }
  // ---------------- piles de liasses -> bâtiments
  Z.bricks.visible = t < TM.juste + 1.0; Z.rBill.visible = Z.rCert.visible = t < 23.9;
  if (Z.bricks.visible) {
    PILES.forEach(([px, pz], p) => {
      const t0 = TM.juste + 0.05 + p * 0.07;
      for (let l = 0; l < 5; l++) for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
        const i = p * 45 + l * 9 + a * 3 + b, k = lin(t0 + (4 - l) * 0.04, t0 + (4 - l) * 0.04 + 0.2, t);
        if (k >= 1) { hide(Z.bricks, i); continue; }
        put(Z.bricks, i, px + (a - 1) * 1.92 + (H(i, 1) - 0.5) * 0.08, 0.34 + l * 0.7 + 1.1 * ein(k) * 0, pz + (b - 1) * 0.92, 1 - 0.9 * ein(k), 1 - 0.9 * ein(k), 1 - 0.9 * ein(k), 0, (H(i, 2) - 0.5) * 0.1, 0);
      }
    });
    Z.bricks.instanceMatrix.needsUpdate = true;
  }
  PILES.forEach(([px, pz, h], p) => {
    const t0 = TM.juste + 0.1 + p * 0.07, s = Math.max(0.001, pop((t - t0) / 0.5)), m = Z.pTowers[p]; m.visible = t >= t0 - 0.01; m.scale.set(1, s, 1); m.position.y = (h * s) / 2;
    const u = clamp((t - t0) / 0.6), r = Z.pRings[p]; r.visible = u > 0 && u < 1; r.scale.setScalar(2 + 7 * eout(u)); r.material.opacity = 0.8 * (1 - u);
  });
  // ---------------- pluie : billets -> certificats
  if (Z.rBill.visible) {
    for (let i = 0; i < Z.rain.length; i++) {
      const r = Z.rain[i], y = 34 - ((t * r.sp + r.ph) % 34), tf = TM.juste + 0.08 + H(i, 8) * 0.35, k = lin(tf, tf + 0.2, t), bf = 1 - k;
      const rx = t * 1.6 + i, rz = Math.sin(t * 1.3 + i) * 0.6, fl = Math.PI * eio(k);
      const nk = nearK(r.x, y, r.z);
      if (k < 0.5) put(Z.rBill, i, r.x, y, r.z, 1.5 * r.s * nk, 0.66 * r.s * nk, 1, rx * 0.5, fl + 0.3 * Math.sin(t + i), rz); else hide(Z.rBill, i);
      if (k >= 0.5) put(Z.rCert, i, r.x, y, r.z, 1.25 * r.s * nk, 0.78 * r.s * nk, 1, rx * 0.4, fl + Math.PI + 0.3 * Math.sin(t + i), rz); else hide(Z.rCert, i);
    }
    Z.rBill.instanceMatrix.needsUpdate = true; Z.rCert.instanceMatrix.needsUpdate = true;
  }
  // ---------------- univers flottant
  // bande des sous-titres (y 1330-1530 px) : un certificat crème y fait perdre le contraste du mot doré -> on l'assombrit (projection écran de la caméra)
  const cap = sstep(23.0, 23.25, t) * (1 - sstep(24.2, 24.34, t)), cf = _cf.set(cam.l[0] - cam.p[0], cam.l[1] - cam.p[1], cam.l[2] - cam.p[2]).normalize(), cr = _cr.crossVectors(cf, _cup).normalize(), cu = _cu.crossVectors(cr, cf).normalize(), tn = Math.tan((cam.fov * Math.PI) / 360);
  const capDim = (x, y, z) => { if (cap < 0.01) return 1; const dx = x - cl[0], dy = y - cl[1], dz = z - cl[2], zc = dx * cf.x + dy * cf.y + dz * cf.z; if (zc < 0.5) return 1; const sy = (0.5 - 0.5 * ((dx * cu.x + dy * cu.y + dz * cu.z) / (zc * tn))) * 1920; return 1 - 0.58 * cap * sstep(1230, 1340, sy) * (1 - sstep(1540, 1650, sy)); };
  const uOn = t >= TM.juste + 0.0 && t < 24.4, fadeU = 1 - sstep(23.98, 24.28, t); Z.certI.visible = Z.coinI.visible = Z.pieI.visible = Z.cardI.visible = uOn; Z.twI.forEach((m) => { m.visible = uOn; });
  Z.rings.forEach((m, k) => { const b = TM.juste + 0.12 + k * 0.05, s = pop((t - b) / 0.4); m.visible = s > 0.01 && fadeU > 0.01; m.material.opacity = 0.55 * Math.min(1, s) * fadeU; m.scale.setScalar(1 + 0.02 * Math.sin(t * 3 + k)); });
  Z.tags.forEach((m) => { const k = pop((t - (TM.juste + 0.3 + m.userData.d)) / 0.25) * (1 - sstep(23.55, 23.68, t)); m.visible = k > 0.01; m.scale.setScalar(Math.max(0.001, k)); });
  Z.tunnelGlow.material.opacity = 0.0 + 0.55 * sstep(TM.juste + 0.15, TM.juste + 0.7, t) * (1 - sstep(23.9, 24.25, t)); Z.tunnelGlow.visible = Z.tunnelGlow.material.opacity > 0.01;
  if (uOn) {
    Z.certs.forEach((c, i) => { const s = pop((t - c.b) / 0.4) * c.s * fadeU * nearK(c.x, c.y, c.z); if (s < 0.01) { hide(Z.certI, i); return; } Z.certI.setColorAt(i, _tc.setScalar(capDim(c.x, c.y, c.z))); put(Z.certI, i, c.x + 0.4 * Math.sin(t * 0.7 + c.ph), c.y + 0.5 * Math.sin(t * 0.9 + c.ph * 1.7), c.z, s, s, s, 0.2 * Math.sin(t * 0.6 + c.ph), 0.5 * Math.sin(t * 0.5 + c.ph) + (c.x > 0 ? -0.35 : 0.35), 0.18 * Math.sin(t * 0.8 + c.ph)); });
    Z.coins.forEach((c, i) => { const s = pop((t - c.b) / 0.4) * c.s * fadeU * nearK(c.x, c.y, c.z); if (s < 0.01) { hide(Z.coinI, i); return; } put(Z.coinI, i, c.x, c.y + 0.5 * Math.sin(t * 1.1 + c.ph), c.z, s, s, s, 0.4 * Math.sin(t + c.ph), t * 2.2 + c.ph, 0); });
    Z.pies.forEach((c, i) => { const s = pop((t - c.b) / 0.45) * c.s * fadeU * nearK(c.x, c.y, c.z); if (s < 0.01) { hide(Z.pieI, i); return; } put(Z.pieI, i, c.x, c.y + 0.4 * Math.sin(t * 0.8 + c.ph), c.z, s, s, s, 0.15 * Math.sin(t + c.ph) + (c.y > axisY(c.z) ? 0.25 : -0.25), 0.4 * Math.sin(t * 0.7 + c.ph) + (c.x > 0 ? -0.4 : 0.4), t * 0.9 + c.ph); });
    Z.cards.forEach((c, i) => { const s = pop((t - c.b) / 0.4) * c.s * fadeU * nearK(c.x, c.y, c.z); if (s < 0.01) { hide(Z.cardI, i); return; } put(Z.cardI, i, c.x, c.y + 0.4 * Math.sin(t * 0.9 + c.ph), c.z, s, s, s, 0, (c.x > 0 ? -0.45 : 0.45) + 0.12 * Math.sin(t * 0.6 + c.ph), 0); });
    Z.twI.forEach((im) => { for (let k = 0; k < 8; k++) hide(im, k); });
    Z.tw.forEach((b) => { const s = pop((t - b.b) / 0.5) * fadeU; if (s < 0.005) return; put(Z.twI[b.c], b.k, b.x, (Z.twI[b.c].userData.h * s) / 2, b.z, 1, s, 1); });
    [Z.certI, Z.coinI, Z.pieI, Z.cardI, ...Z.twI].forEach((m) => { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; });
  }
  // ---------------- réseau d'entreprises
  const nOn = t >= 23.65; Z.nbI.forEach((m) => { m.visible = nOn; }); Z.linkI.visible = Z.pulseI.visible = Z.nodes.visible = nOn;
  if (nOn) {
    Z.nbI.forEach((im) => { for (let k = 0; k < im.userData.n; k++) hide(im, k); });
    const npos = Z.nodes.geometry.attributes.position;
    Z.nb.forEach((b, i) => { const s = pop((t - b.b) / 0.5); put(Z.nbI[b.cl], b.k, b.x, (b.h * Math.max(0, s)) / 2, b.z, 1, Math.max(0.001, s), 1); npos.setXYZ(i, b.x, b.h * Math.max(0.001, s) + 0.9, b.z); });
    Z.nbI.forEach((m) => { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }); npos.needsUpdate = true;
    Z.links.forEach((L, i) => {
      const [ax, az, bx, bz] = linkEnds(Z, L), a = Z.nb[L[0]], b = L[1] < 0 ? { b: a.b + 0.2 } : Z.nb[L[1]], on = clamp((t - Math.max(a.b, b.b) - 0.12) / 0.3);
      if (on <= 0) { hide(Z.linkI, i); hide(Z.pulseI, i); return; }
      const dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz);
      _o.position.set((ax + bx) / 2, 0.1, (az + bz) / 2); _o.rotation.set(0, Math.atan2(dx, dz), 0); _o.scale.set(0.7, 0.1, len * on); _o.updateMatrix(); Z.linkI.setMatrixAt(i, _o.matrix);
      const f = (t * (0.35 + 0.25 * H(i, 3)) + H(i, 4)) % 1; put(Z.pulseI, i, ax + dx * f, 0.7, az + dz * f, 1.3 * on, 1.3 * on, 1.3 * on);
    });
    Z.linkI.instanceMatrix.needsUpdate = true; Z.pulseI.instanceMatrix.needsUpdate = true;
  }
}
