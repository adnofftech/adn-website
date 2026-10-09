// Carte du monde stylisée en relief (S3, S13) : colonnes/points procéduraux, flux lumineux, jetons, silhouettes, hub de distribution, bénéficiaire, chiffres géants.
import { T, H, clamp, lerp, sstep, lin, eio, eout, ein, eoutBack, glowTex, billTex, mk, FONT, MONO, glow, makePerson, SKIN, CLOTH } from "../shared.js";
import { _o, _c, _v, put, hide, pop, mixHex, bez, makeSegDisplay, fatText, smallText } from "./wealth_lib.js";

const TAU = Math.PI * 2;
export const MAPC = { kx: 0.27, kz: 0.5, lon0: 10, zN: -22, latS: -56, lonMin: -135, dLon: 3.67, dLat: 2.2, cols: 79, rows: 62 };
export const mapXZ = (lon, lat) => [(lon - MAPC.lon0) * MAPC.kx, MAPC.zN - (lat - MAPC.latS) * MAPC.kz];
export const HUB = new T.Vector3(-12, 1.0, -52.5);     // « système de distribution » (S13)
export const SRC3 = new T.Vector3(0, 25.5, -3);          // sommet de la montagne (S3) d'où partent les flux

// ------------------------------------------------------------------ continents (lon, lat), volontairement grossiers
const P = (s) => s.trim().split(/\s+/).map((p) => p.split(",").map(Number));
const LAND = [
  // Amérique du Nord
  P("-168,65 -165,69 -156,71 -141,69.5 -128,70 -115,68.5 -105,68 -95,69 -88,68 -82,67 -85,64 -93,61 -94,58 -88,56 -82,55 -79,52 -78,58 -76,62 -70,61 -64,60 -61,56 -57,52 -60,48 -66,45 -70,42 -74,39 -76,35 -80,32 -81,28 -80,25.5 -83,26 -84,30 -89,30 -94,29.5 -97,26 -97.5,22 -95,18.5 -91,18.5 -90,21 -87,21 -88,16 -84,15.5 -83,10 -80,8.5 -78,8 -80,7 -84,8.5 -86,11 -88,13 -92,14.5 -96,15.7 -101,17.5 -105,20 -106,23 -110,27 -113,31 -117,32.5 -120,34.5 -122,37.5 -124,40.5 -124,46 -124.5,48.5 -127,50.5 -131,54 -136,58 -141,60 -148,60.5 -152,59 -158,56.5 -164,54.8 -160,58.5 -165,61"),
  P("-73,78 -60,82 -35,83 -20,81 -19,76 -22,70 -33,68 -43,60 -50,62 -54,67 -58,75"),               // Groenland
  P("-80,73 -68,70.5 -62,66.5 -66,62 -72,64 -78,64.5 -85,70"), P("-118,70 -105,73 -100,70 -105,68.5 -115,69"), P("-90,77 -76,79 -62,82.5 -80,83 -95,81"),
  P("-85,22 -80,23 -74,20 -77.5,20 -82,22.5"), P("-74.5,18.5 -72,19.8 -68.5,18.5 -71,18"),
  // Amérique du Sud
  P("-77,8.5 -72,12 -65,10.5 -60,8.5 -52,5 -50,0 -44,-2.5 -39,-4 -35,-6 -35,-9 -38,-13 -39,-18 -41,-22 -45,-24 -49,-26 -48.5,-28 -52,-33 -57,-35 -57.5,-38 -62,-39 -65,-42 -65,-46 -68,-50 -69,-52.5 -72,-53.5 -75,-50 -74,-44 -73.5,-38 -71.5,-30 -70.5,-20 -76,-14 -79,-8 -81,-5 -80,-2 -80,1 -78,2 -77.5,6"),
  // Eurasie
  P("-9,37 -9,43.5 -1.5,43.5 -1.5,46 -4.5,48.5 2,51 5,53.5 8,54 8.5,57 10.5,57.5 10.5,55 14,54.2 19.5,54.5 21,57 24,57.5 24,59.5 30,60 22,60.5 21.5,64 25,65.5 22,66 18,62.5 19,59.5 16.5,56.5 12.5,56 11,59 5.5,59 5.5,62 10,64 15,68 22,70.5 30,70.5 40,68 44,66.5 53,68.5 60,69 68,69 73,72 80,73.5 90,75.5 100,77 112,74 125,73 140,72.5 150,71 160,70 170,69.5 180,68.5 188,66.5 184,64.5 178,62.5 170,60 163,60 162,57 160,53.5 156.5,51 155.5,57 150,59.5 143,59 138,55 141,52 140,48 135,43 131,42.5 129.5,40 129.2,35.5 126.5,34.5 126,37.5 124.5,39.8 121,40.5 118,39 119,37.2 122.5,37 120.5,35 121.8,31.5 121.5,28.5 119,25 116,22.8 110.5,21.2 108,21.5 106.5,19 108.5,15.5 109.2,12 105,8.6 104.8,10.5 100.5,13.5 100,9.5 102,6 103.5,1.5 101,2.5 98.5,8 98.5,13.5 97.5,16.5 94.5,16 94.5,19.5 92.2,21 90,22 87,21.5 84.5,19 81.5,16.5 80.2,13 79.8,10 78,8.3 76.3,9.8 75,13.5 73,17.5 72.8,21 70,21 68.5,23.5 66.5,25 61.5,25.2 57.5,25.7 56,26.5 51.5,27.5 48,30 48.5,28 50,26 51.5,24.5 55,25 56.5,24.5 59.5,22.5 57,19 52,16.5 45,13 43.2,12.7 42.8,15 39,21.5 35,28 34.2,31 35.5,34.5 36.2,36.8 30,36.3 27,37 26.3,39.5 29,41 32,41.8 36,41.5 41.5,41.5 41.5,43 37.5,45 35,45.2 33.5,44.5 30,46 30,45.2 28,43 26,41 23.5,38 21,38 19.5,42 13.5,45.5 12.5,44 16,41.5 18.5,40 16,38 15.7,40 12,42 10,44 8,44 3.5,43.2 3,42 0,39.5 -0.5,38.5 -2,36.7 -5.5,36"),
  // Afrique
  P("-17,21 -16,28 -9.8,30 -6,35.8 -2,35 3,36.8 10,37.3 11,33.5 15,32.3 20,30.8 22,32.8 29,31 32.5,30 33,27 35.5,24 37.2,19.5 39,15.5 43,12.5 44,10.5 51.2,11.8 48,6 43,-1 40.5,-3 39,-6.5 40.5,-11 40.5,-15 35,-20 35.5,-24 32.8,-26 32.5,-29 28,-33 25.5,-34 20,-34.8 18.3,-34 17.5,-30 15,-26.5 14,-22 11.8,-17.2 13.5,-12 12.3,-6 9.5,-1 9.5,3.8 6,4.4 4.5,6.2 1,6 -2,4.8 -7.5,4.4 -12,7.5 -15,11 -17.2,14.8 -16.5,19"),
  // Océanie / îles
  P("114,-22 114,-26 115,-34 119,-34.8 124,-33.5 129,-31.7 135,-34.8 138,-35.5 140,-38 146,-39 150,-37.5 153,-31 153,-26 150,-22.5 146,-18.5 145.5,-15 143.5,-12.5 142.5,-10.8 141.5,-13 141,-17 136,-15 135.8,-12 132,-11.3 130,-12.6 127,-14 125,-15 122.5,-17.5 120,-19.5"),
  P("95.5,5.5 98,4 104,-1.5 106,-5.8 102,-4.5 98,0"), P("105.5,-6.5 114.5,-7.5 114.5,-8.6 106,-7.8"), P("109,1.5 111,1.8 114,4.5 117.5,7 119,5 118,1 116,-3.5 111,-3 110,-1.5"),
  P("131,-1 135,-3.3 141,-2.6 147,-6 150.5,-10.5 147,-10 143,-9 138,-8 135,-4.5"), P("120,18.5 122,18 122,13 124,12 126,7 125.5,6 122,7 120,14"),
  P("130.5,31 132,33.8 135,34.5 139.5,35.2 141,38 142,41.5 140,40.5 139.8,38.5 137,37 136,35.7 132.5,35.5 130.5,33.5"), P("140,42 143,42.5 145.5,43.5 142,45.5 141.5,43.5 140,43"),
  P("80,9.5 81.8,7.5 80.5,6 79.8,8"), P("-5.5,50 1.5,51 1.7,52.8 -0.5,54.5 -2,56 -2,57.5 -3.5,58.6 -5,58.5 -6,56.5 -5,54.7 -3,53.5 -4.5,51.5"), P("-10,51.5 -6,52 -6,55 -8,55.2 -10,54"),
  P("-24,65.5 -18,66.5 -14,65 -18,63.5 -23,64"), P("44,-25 47.5,-25 50,-15 49.5,-12 47,-15 44,-20"), P("173,-35 175,-37 178,-38 175,-41.5 174.5,-40 173,-38.5"), P("172.5,-40.8 174,-41.5 171,-45 168,-46.5 166.5,-45.5"),
  P("52,71 58,76 68,77 56,73"), P("142,46 143,54 142,54 141.7,48"),
];
const SEAS = [P("28,41.5 28,45 33,46 38,47 41.5,42 36,41.5 31,41.2"), P("47,45 53,46.5 54,41 53,37 49,37.5 49,40.5")];
function inPoly(lon, lat, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) c = !c; } return c; }
const landAt = (lon, lat) => LAND.some((p) => inPoly(lon, lat, p)) && !SEAS.some((p) => inPoly(lon, lat, p));
const RIDGES = [[-71, -30, 4, 22, 2.8], [-73, -8, 4, 10, 2.0], [-112, 42, 7, 14, 2.4], [85, 31, 14, 4, 3.6], [10, 46, 6, 2.5, 1.8], [38, 8, 4, 7, 1.8], [100, 28, 4, 9, 1.8], [-5, 32, 6, 3, 1.4], [60, 38, 6, 5, 1.6], [145, -5, 6, 3, 1.6]];
const relief = (lon, lat) => { let h = 0.45 + 0.35 * (0.5 + 0.5 * Math.sin(lon * 0.23 + lat * 0.11) * Math.cos(lat * 0.17 - lon * 0.05)); for (const [cx, cy, sx, sy, a] of RIDGES) h += a * Math.exp(-(((lon - cx) / sx) ** 2 + ((lat - cy) / sy) ** 2)); return h; };

// ------------------------------------------------------------------ grille de cellules (calculée une fois, déterministe)
const [HERO_LON, HERO_LAT] = [36, 2], [DIVE_LON, DIVE_LAT] = [22, -5];
export const HERO_XZ = mapXZ(HERO_LON, HERO_LAT), DIVE_XZ = mapXZ(DIVE_LON, DIVE_LAT);
export const HERO_BASE = 0.45;
export const CELLS = (() => {
  const out = [];
  for (let j = 0; j < MAPC.rows; j++) for (let i = 0; i < MAPC.cols; i++) {
    const lon = MAPC.lonMin + (i + 0.5) * MAPC.dLon, lat = MAPC.latS + (j + 0.5) * MAPC.dLat; let hits = 0;
    for (const [dx, dy] of [[0, 0], [-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) if (landAt(lon + dx * MAPC.dLon, lat + dy * MAPC.dLat)) hits++;
    if (hits < 3) continue; const [x, z] = mapXZ(lon, lat); let h = relief(lon, lat);
    const dh = Math.hypot(x - HERO_XZ[0], z - HERO_XZ[1]); if (dh < 3.6) h = HERO_BASE * 0.6;
    out.push({ lon, lat, x, z, h, dN: Math.hypot(x, z + 4) / 95, idx: out.length, hero: false, dive: false, nearHero: dh < 3.6, j: H(out.length, 5) });
  }
  const near = (xz) => out.reduce((b, c) => (Math.hypot(c.x - xz[0], c.z - xz[1]) < Math.hypot(b.x - xz[0], b.z - xz[1]) ? c : b), out[0]);
  near(HERO_XZ).hero = true; near(DIVE_XZ).dive = true;
  return out;
})();
// cibles des flux (≈ 110 cellules réparties) ; la cellule du bénéficiaire en tête
export const TARGETS = (() => {
  const t = CELLS.filter((c) => c.hero); const hub2 = (c) => Math.hypot(c.x - HUB.x, c.z - HUB.z);
  CELLS.forEach((c) => { if (!c.hero && !c.nearHero && c.j < 0.085 && hub2(c) > 9) t.push(c); });
  return t;
})();
TARGETS.forEach((c, i) => { c.tgt = i; });

// ------------------------------------------------------------------ flux : rubans à sommets colorés + jetons
function buildFlows(origin, targets, { N = 20, w = 0.2, pk = 0.22, pb = 6, nCoin = 2 } = {}) {
  const A = targets.length; const nv = A * (N + 1) * 4; const pos = new Float32Array(nv * 3), col = new Float32Array(nv * 3); const idx = new Uint32Array(A * N * 12);
  const arcs = []; const p0 = new T.Vector3(), p1 = new T.Vector3(), c = new T.Vector3(), q = new T.Vector3(), tg = new T.Vector3(), side = new T.Vector3(), vn = new T.Vector3(), up = new T.Vector3(0, 1, 0), q2 = new T.Vector3();
  targets.forEach((tc, a) => {
    p0.copy(origin).add(new T.Vector3((H(a, 41) - 0.5) * 2.4, (H(a, 42) - 0.5) * 1.5, (H(a, 43) - 0.5) * 2.4)); p1.set(tc.x, tc.h + 0.5, tc.z);
    const len = p0.distanceTo(p1); c.addVectors(p0, p1).multiplyScalar(0.5); c.y += pb + pk * len; c.x += (H(a, 44) - 0.5) * len * 0.12; c.z += (H(a, 45) - 0.5) * len * 0.12;
    const arc = { a, p0: p0.clone(), c: c.clone(), p1: p1.clone(), len, dur: 0.8 + 0.45 * Math.min(1, len / 90), tl: 0 }; arcs.push(arc);
    for (let j = 0; j <= N; j++) {
      const s = j / N; bez(arc.p0, arc.c, arc.p1, s, q); bez(arc.p0, arc.c, arc.p1, Math.min(1, s + 0.01), q2); tg.subVectors(q2, q); if (tg.lengthSq() < 1e-9) tg.set(0, 0, -1); tg.normalize();
      side.crossVectors(tg, up); if (side.lengthSq() < 1e-6) side.set(1, 0, 0); side.normalize(); vn.crossVectors(side, tg).normalize();
      const b = (a * (N + 1) + j) * 4; const ww = w * (0.55 + 0.45 * Math.sin(s * Math.PI));
      const set = (k, v, sgn, dir) => { pos[(b + k) * 3] = v.x + dir.x * ww * sgn; pos[(b + k) * 3 + 1] = v.y + dir.y * ww * sgn; pos[(b + k) * 3 + 2] = v.z + dir.z * ww * sgn; };
      set(0, q, -1, side); set(1, q, 1, side); set(2, q, -1, vn); set(3, q, 1, vn);
      if (j < N) { const nb = b + 4; let o = (a * N + j) * 12; idx.set([b, b + 1, nb, b + 1, nb + 1, nb, b + 2, b + 3, nb + 2, b + 3, nb + 3, nb + 2], o); }
    }
  });
  const geo = new T.BufferGeometry(); geo.setAttribute("position", new T.BufferAttribute(pos, 3)); const ca = new T.BufferAttribute(col, 3); ca.setUsage(T.DynamicDrawUsage); geo.setAttribute("color", ca); geo.setIndex(new T.BufferAttribute(idx, 1));
  const mesh = new T.Mesh(geo, new T.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); mesh.frustumCulled = false;
  const coins = new T.InstancedMesh(new T.CylinderGeometry(0.5, 0.5, 0.16, 8), new T.MeshBasicMaterial({ color: 0xffffff }), A * nCoin); coins.frustumCulled = false;
  const g = new T.Group(); g.add(mesh, coins);
  return { group: g, mesh, coins, arcs, N, nCoin, col, ca };
}
const _qa = new T.Vector3();
/** Met à jour couleurs des rubans + jetons. front(a) -> progression 0..1 ; base(a) -> luminosité de base ; cA,cB couleurs (tête → origine / cible) */
function paintFlows(F, t, { front, base, colA, colB, pulse, coinCol, coinK, spd = 0.7, coinHead = null, coinMul = null }) {
  const { arcs, N, col, nCoin, coins } = F; let ci = 0; const c = new T.Color();
  for (let a = 0; a < arcs.length; a++) {
    const arc = arcs[a]; const f = front(a, arc); const bs = base(a, arc); const ph = H(a, 51) * 3;
    for (let j = 0; j <= N; j++) {
      const s = j / N; let I = 0; const rt = clamp(Math.pow(s / 0.22, 1.6), 0.015, 1);
      if (f > 0 && s <= f + 0.001) { const head = Math.exp(-((f - s) * 9)); I = bs * (0.55 + 0.45 * head); if (f < 1) I += 0.7 * Math.exp(-Math.pow((f - s) * 14, 2)); }
      if (pulse) { const pp = ((t * spd + ph) % 1); I += pulse * Math.exp(-Math.pow((s - pp) * 9, 2)); }
      I = Math.min(I * rt, 0.95); c.copy(colA).lerp(colB, s); const b = (a * (N + 1) + j) * 4;
      for (let k = 0; k < 4; k++) { col[(b + k) * 3] = c.r * I; col[(b + k) * 3 + 1] = c.g * I; col[(b + k) * 3 + 2] = c.b * I; }
    }
    for (let k = 0; k < nCoin; k++) {
      let s = ((t - arc.tl) / (arc.dur * 1.25) + k / nCoin); s -= Math.floor(s); const ch = coinHead ? coinHead(a, arc) : f; const ck = coinK * (coinMul ? coinMul(a, arc) : 1); const ok = ch > 0 && s <= ch && ck > 0.001 && t > arc.tl - 0.001;
      if (!ok) { hide(coins, ci); coins.setColorAt(ci, c.setRGB(0, 0, 0)); ci++; continue; }
      bez(arc.p0, arc.c, arc.p1, s, _qa); const sc = ck * (0.8 + 0.3 * H(a * 3 + k, 7)) * Math.min(1, s / 0.05, (1 - s) / 0.05 + 0.3);
      put(coins, ci, _qa.x, _qa.y, _qa.z, sc, sc, sc, 0.6 + t * 2, t * 6 + a, 0); coins.setColorAt(ci, coinCol); ci++;
    }
  }
  F.ca.needsUpdate = true; coins.instanceMatrix.needsUpdate = true; if (coins.instanceColor) coins.instanceColor.needsUpdate = true;
}

// ------------------------------------------------------------------ personnage chaleureux (visage) pour le bénéficiaire
function warmPerson(scale) {
  const p = makePerson({ skin: SKIN[3], shirt: 0x2a93b4, pants: 0x27384f, scale });
  const eyeM = new T.MeshBasicMaterial({ color: 0x1a0f08 });
  for (const sx of [-0.085, 0.085]) { const e = new T.Mesh(new T.SphereGeometry(0.032, 8, 6), eyeM); e.position.set(sx, 1.83, 0.235); p.userData.head.parent.add(e); }
  const sm = new T.Mesh(new T.TorusGeometry(0.075, 0.014, 6, 12, Math.PI), eyeM); sm.rotation.z = Math.PI; sm.position.set(0, 1.76, 0.245); p.userData.head.parent.add(sm);
  return p;
}

// ------------------------------------------------------------------ carte
const gradBeam = (r0, r1, h, seg = 18) => { const g = new T.CylinderGeometry(r0, r1, h, seg, 1, true); const pos = g.attributes.position; const col = new Float32Array(pos.count * 3); for (let i = 0; i < pos.count; i++) { const u = (pos.getY(i) + h / 2) / h; const v = Math.pow(1 - u, 1.5); col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = v; } g.setAttribute("color", new T.BufferAttribute(col, 3)); return g; };
const beamMat = (c, o) => new T.MeshBasicMaterial({ color: c, vertexColors: true, transparent: true, opacity: o, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
export function buildMap() {
  const map = new T.Group(); const M = {};
  const cg = new T.BoxGeometry(1, 1, 1); cg.translate(0, 0.5, 0); const ix = cg.index.array, keep = []; for (let i = 0; i < ix.length; i++) if (i < 18 || i >= 24) keep.push(ix[i]); cg.setIndex(keep);
  const n = CELLS.length; M.n = n;
  M.cols = new T.InstancedMesh(cg, new T.MeshLambertMaterial({ color: 0xffffff, emissive: 0x04140d }), n); M.cols.frustumCulled = false;
  const pg = new T.PlaneGeometry(0.9, 0.9); pg.rotateX(-Math.PI / 2);
  M.plates = new T.InstancedMesh(pg, new T.MeshBasicMaterial({ color: 0xffffff }), n); M.plates.frustumCulled = false;
  const hg = new T.PlaneGeometry(1, 1); hg.rotateX(-Math.PI / 2);
  M.halos = new T.InstancedMesh(hg, new T.MeshBasicMaterial({ map: glowTex(), color: 0xffffff, transparent: true, blending: T.AdditiveBlending, depthWrite: false }), n); M.halos.frustumCulled = false;
  for (let i = 0; i < n; i++) { M.cols.setColorAt(i, _c.setRGB(0, 0, 0)); M.plates.setColorAt(i, _c.setRGB(0, 0, 0)); M.halos.setColorAt(i, _c.setRGB(0, 0, 0)); }
  map.add(M.cols, M.plates, M.halos);
  M.fA = buildFlows(SRC3, TARGETS, { N: 22, w: 0.2, pk: 0.2, pb: 8, nCoin: 2 }); M.fB = buildFlows(HUB.clone().add(new T.Vector3(0, 2.2, 0)), TARGETS, { N: 20, w: 0.16, pk: 0.16, pb: 5, nCoin: 2 });
  M.fA.arcs.forEach((a, i) => { a.tl = 10.7 + 1.1 * H(i, 61); }); M.fB.arcs.forEach((a, i) => { a.tl = 53.88 + 0.14 * H(i, 62); a.dur = 0.4 + 0.36 * Math.min(1, a.len / 90); });
  map.add(M.fA.group, M.fB.group);
  const nT = TARGETS.length; const bodyG = new T.CylinderGeometry(0.22, 0.36, 1.3, 6, 1); bodyG.translate(0, 0.65, 0); const headG = new T.IcosahedronGeometry(0.27, 0); headG.translate(0, 1.58, 0);
  M.pBody = new T.InstancedMesh(bodyG, new T.MeshLambertMaterial({ color: 0xffffff, emissive: 0x151515 }), nT); M.pHead = new T.InstancedMesh(headG, new T.MeshLambertMaterial({ color: 0xffffff, emissive: 0x151515 }), nT);
  M.bars = new T.InstancedMesh(new T.BoxGeometry(0.34, 1, 0.34), new T.MeshBasicMaterial({ color: 0xffffff }), nT); M.pBody.frustumCulled = M.pHead.frustumCulled = M.bars.frustumCulled = false;
  TARGETS.forEach((c, i) => { M.pBody.setColorAt(i, _c.setRGB(0, 0, 0)); M.pHead.setColorAt(i, _c.setRGB(0, 0, 0)); M.bars.setColorAt(i, _c.setRGB(0, 0, 0)); });
  map.add(M.pBody, M.pHead, M.bars);
  M.stock = new T.InstancedMesh(new T.BoxGeometry(0.7, 0.7, 0.7), new T.MeshBasicMaterial({ color: 0xffffff }), 90); M.stock.frustumCulled = false; map.add(M.stock);
  M.stockData = Array.from({ length: 90 }, (_, i) => { const c = TARGETS[Math.floor(H(i, 71) * TARGETS.length)]; const p0 = new T.Vector3(c.x, c.h + 1, c.z), p1 = HUB.clone().add(new T.Vector3(0, 2.4, 0)); const cc = p0.clone().add(p1).multiplyScalar(0.5); cc.y += 6 + 0.2 * p0.distanceTo(p1); return { p0, c: cc, p1, t0: 52.2 + 1.4 * H(i, 72), dur: 0.9 + 0.5 * H(i, 73) }; });
  const hub = new T.Group(); hub.position.copy(HUB); M.hub = hub; map.add(hub);
  M.ringMat = new T.MeshBasicMaterial({ color: 0xffffff }); const ring = new T.Mesh(new T.TorusGeometry(6, 0.4, 8, 56), M.ringMat); ring.rotation.x = Math.PI / 2; ring.position.y = 0.5; hub.add(ring); M.ring = ring;
  const ring2 = new T.Mesh(new T.TorusGeometry(3.4, 0.22, 6, 40), M.ringMat); ring2.position.y = 3; ring2.rotation.x = Math.PI / 2; hub.add(ring2); M.ring2 = ring2;
  M.beam = new T.Mesh(gradBeam(0.7, 2.2, 46), beamMat(0xffffff, 0.4)); M.beam.position.y = 23; hub.add(M.beam);
  M.core = glow(0xffffff, 9, 0.9); M.core.position.y = 3; hub.add(M.core);
  M.gauge = new T.InstancedMesh(new T.BoxGeometry(0.9, 0.5, 1.5), new T.MeshBasicMaterial({ color: 0xffffff }), 28); M.gauge.frustumCulled = false; hub.add(M.gauge);
  for (let i = 0; i < 28; i++) { const a = (i / 28) * TAU; put(M.gauge, i, Math.cos(a) * 7.6, 0.4, Math.sin(a) * 7.6, 1, 1, 1, 0, -a + Math.PI / 2, 0); M.gauge.setColorAt(i, _c.setRGB(0, 0, 0)); }
  const hubPlate = new T.Mesh(new T.CircleGeometry(8.6, 40), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2, blending: T.AdditiveBlending, depthWrite: false })); hubPlate.rotation.x = -Math.PI / 2; hubPlate.position.y = 0.08; hub.add(hubPlate); M.hubPlate = hubPlate;
  // bénéficiaire (gros plan final S13)
  const hero = new T.Group(); hero.position.set(HERO_XZ[0], HERO_BASE, HERO_XZ[1]); M.hero = hero; map.add(hero);
  const plat = new T.Mesh(new T.CylinderGeometry(2.3, 2.5, 0.3, 28), new T.MeshLambertMaterial({ color: 0xd9a63a, emissive: 0x3a2808 })); plat.position.y = -0.1; hero.add(plat);
  const hp = warmPerson(2.0); hero.add(hp); M.heroP = hp;
  M.heroGlow = glow(0xff9a3c, 13, 0.0); M.heroGlow.position.set(0, 2.8, -2.2); hero.add(M.heroGlow);
  M.heroBeam = new T.Mesh(gradBeam(2.0, 2.8, 34), beamMat(0xffc870, 0.0)); M.heroBeam.position.set(0, 17, -0.4); hero.add(M.heroBeam);
  M.heroCoins = new T.InstancedMesh(new T.CylinderGeometry(0.5, 0.5, 0.12, 8), new T.MeshBasicMaterial({ color: 0xffd36a }), 60); M.heroCoins.frustumCulled = false; hero.add(M.heroCoins);
  M.dive = glow(0xffa640, 3, 0); M.dive.material.depthTest = false; M.dive.renderOrder = 20; map.add(M.dive);
  M.diveFill = glow(0xff9d2e, 3, 0); M.diveFill.material.blending = T.NormalBlending; M.diveFill.material.depthTest = false; M.diveFill.renderOrder = 21; map.add(M.diveFill); M.diveCell = CELLS.find((c) => c.dive);
  return { map, M };
}

// ------------------------------------------------------------------ mise à jour de la carte
const C = (h) => new T.Color(h);
const CS = { base: C(0x0e4030), hi: C(0x3cbd86), lit: C(0x6dffb8), gold: C(0xffd070), cold0: C(0x060d1e), cold1: C(0x15366f), mid0: C(0x2a1d4a), mid1: C(0x62367f), warm0: C(0x3a1c08), warm1: C(0xb0661c) };
const DAWN = [C(0x4f8cff), C(0x9a5cff), C(0xff6f8e), C(0xffa238), C(0xffd36a)];
export function dawn(u, out) { const x = clamp(u) * 4, i = Math.min(3, Math.floor(x)); return out.copy(DAWN[i]).lerp(DAWN[i + 1], x - i); }
const _k = new T.Color(), _k2 = new T.Color(), _k3 = new T.Color();
const act = (M, c) => (c.tgt !== undefined ? M.fA.arcs[c.tgt].tl + M.fA.arcs[c.tgt].dur : 11.86 + 1.14 * (0.55 * c.dN + 0.45 * c.j));
const _k4 = new T.Color();
function cell13(u, warm, out) { const a = _k2.copy(CS.cold0).lerp(CS.cold1, u), b = _k3.copy(CS.mid0).lerp(CS.mid1, u), c = _k4.copy(CS.warm0).lerp(CS.warm1, u); if (warm < 0.5) return out.copy(a).lerp(b, warm * 2); return out.copy(b).lerp(c, (warm - 0.5) * 2); }
/** mode 3 : S3 (carte vert/or, révélation radiale, points allumés) ; mode 13 : S13 (réseau froid qui se réchauffe) */
export function updateMap(M, t, mode, warm) {
  const n = M.n; const sweepZ = -22 - ((((t - 9.2) * 17) % 90) + 90) % 90; const dc = M.diveCell; const dive = sstep(12.6, 13.1, t);
  for (let i = 0; i < n; i++) {
    const c = CELLS[i]; let grow, litK = 0;
    if (mode === 3) { grow = pop((t - (8.15 + 1.3 * c.dN + 0.12 * c.j)) / 0.55); litK = pop((t - (c.dive ? 11.2 : act(M, c))) / 0.35); }
    else { grow = 1; litK = c.hero ? pop((t - 54.3) / 0.3) : c.tgt !== undefined ? pop((t - (M.fB.arcs[c.tgt].tl + M.fB.arcs[c.tgt].dur)) / 0.35) : 0; }
    const hh = Math.max(0.02, c.h * grow); put(M.cols, i, c.x, 0, c.z, 1.0, hh, 1.0);
    const u = Math.min(1, c.h / 3.4);
    if (mode === 3) { _k.copy(CS.base).lerp(CS.hi, 0.25 + 0.75 * u); const wv = Math.exp(-Math.pow((c.z - sweepZ) / 5, 2)); _k.lerp(CS.lit, 0.5 * wv); if (litK > 0.01) _k.lerp(CS.gold, litK * 0.22); }
    else { cell13(u, warm, _k); if (litK > 0) _k.lerp(CS.warm1, litK * 0.3); }
    M.cols.setColorAt(i, _k);
    const near = mode === 3 && dive > 0 ? dive * Math.exp(-(((c.x - dc.x) ** 2 + (c.z - dc.z) ** 2) / 40)) : 0;
    const ps = (mode === 3 ? litK : c.tgt !== undefined ? 0.3 + 0.7 * litK : 0.22) * (1 - 0.85 * near);
    if (ps > 0.01 && grow > 0.01) {
      put(M.plates, i, c.x, hh + 0.03, c.z, 1, 1, 1);
      if (mode === 3) { _k.copy(CS.lit).lerp(CS.gold, c.j < 0.5 ? 0.12 : 0.5 + 0.35 * c.j); if (c.dive) _k.setRGB(1, 0.72, 0.3); }
      else dawn(warm * (0.35 + 0.65 * litK), _k);
      M.plates.setColorAt(i, _k.multiplyScalar(ps));
      const hs = (mode === 3 ? 3.4 : 2.8) * ps * (c.dive ? 1.7 : 1); put(M.halos, i, c.x, hh + 0.08, c.z, hs, 1, hs); M.halos.setColorAt(i, _k.multiplyScalar(mode === 3 ? 0.8 : 0.32));
    } else { hide(M.plates, i); hide(M.halos, i); }
  }
  for (const k of ["cols", "plates", "halos"]) { M[k].instanceMatrix.needsUpdate = true; M[k].instanceColor.needsUpdate = true; }
}

export function updateS3Fx(M, t) {
  const F = M.fA; const on = t > 10.55; F.group.visible = on;
  if (on) paintFlows(F, t, { front: (a, arc) => clamp((t - arc.tl) / arc.dur), base: () => 0.3, colA: _k.setRGB(0.28, 0.95, 0.62), colB: _k2.setRGB(1, 0.82, 0.42), pulse: 0.4, coinCol: new T.Color(0xffd36a), coinK: 1.1, spd: 0.8 });
  const dc = M.diveCell; const dv = sstep(12.5, 13.18, t);
  M.dive.position.set(dc.x, dc.h + 1.0, dc.z); M.dive.scale.setScalar(lerp(3, 70, ein(dv))); M.dive.material.opacity = 0.25 + 0.55 * dv; M.dive.visible = t > 11.4;
  M.diveFill.position.copy(M.dive.position); M.diveFill.scale.setScalar(90); M.diveFill.material.opacity = sstep(12.9, 13.16, t); M.diveFill.visible = t > 12.85;
}

export function updateS13Fx(M, t, warm) {
  const F = M.fB; F.group.visible = true; const burst = sstep(53.96, 54.12, t); const fade = sstep(54.45, 54.75, t);
  const colA = dawn(warm, new T.Color()), colB = dawn(Math.min(1, warm + 0.18), new T.Color()).lerp(_k2.setRGB(1, 1, 1), 0.12);
  paintFlows(F, t, { front: () => 1, base: (a) => (a === 0 ? (0.28 + 0.4 * burst) * (1 - 0.85 * sstep(54.62, 54.77, t)) : (0.1 + 0.22 * burst) * (1 - fade * 0.95)), colA, colB, pulse: (0.18 + 0.4 * burst) * (1 - 0.9 * fade), coinCol: new T.Color(0xffd36a), coinK: 1.0, spd: 0.5 + 0.9 * burst,
    coinHead: (a, arc) => clamp((t - arc.tl) / arc.dur), coinMul: (a) => (a === 0 ? 1 : 1 - fade) });
  let m = 0;
  for (const s of M.stockData) { const u = (t - s.t0) / s.dur; if (u <= 0 || u >= 1) continue; const e = u * u * (3 - 2 * u); bez(s.p0, s.c, s.p1, e, _qa); const sc = 0.9 * Math.min(1, u / 0.1) * Math.min(1, (1 - u) / 0.15); put(M.stock, m, _qa.x, _qa.y, _qa.z, sc, sc, sc, u * 6, u * 5, 0); M.stock.setColorAt(m, _k.setRGB(0.55, 0.78, 1)); m++; }
  M.stock.count = m; M.stock.instanceMatrix.needsUpdate = true; if (M.stock.instanceColor) M.stock.instanceColor.needsUpdate = true;
  const nT = TARGETS.length;
  for (let i = 0; i < nT; i++) {
    const c = TARGETS[i]; const arc = M.fB.arcs[i]; const arr = arc.tl + arc.dur; const s0 = pop((t - (51.35 + 0.8 * H(i, 81))) / 0.4);
    const rec = c.hero ? pop((t - 54.35) / 0.3) : pop((t - arr) / 0.4); const bob = rec * 0.18 * Math.abs(Math.sin(t * 8 + i));
    const sc = 1.1 * s0; const y = c.h + 0.02;
    if (s0 < 0.01 || c.hero) { hide(M.pBody, i); hide(M.pHead, i); hide(M.bars, i); continue; }
    put(M.pBody, i, c.x, y + bob, c.z, sc, sc, sc); put(M.pHead, i, c.x, y + bob, c.z, sc, sc, sc);
    const base = _k.setRGB(0.34, 0.46, 0.7); const tone = _k2.setHex(CLOTH[Math.floor(H(i, 82) * CLOTH.length)]); M.pBody.setColorAt(i, _k3.copy(base).lerp(tone, rec)); M.pHead.setColorAt(i, new T.Color().copy(base).lerp(_c.setHex(SKIN[Math.floor(H(i, 83) * SKIN.length)]), rec));
    const bh = 0.05 + (1.2 + 2.4 * H(i, 84)) * eout(clamp((t - arr) / 0.9)); put(M.bars, i, c.x + 0.95, y, c.z, 1, bh, 1); M.bars.setColorAt(i, _k3.setRGB(0.4, 0.5, 0.8).lerp(_c.setRGB(1, 0.8, 0.3), rec));
  }
  for (const k of [M.pBody, M.pHead, M.bars]) { k.instanceMatrix.needsUpdate = true; k.instanceColor.needsUpdate = true; }
  const chg = sstep(52.2, 53.7, t), gold = sstep(53.64, 53.95, t); const hc = dawn(Math.max(gold * 0.8, warm * 0.9), _k);
  M.ringMat.color.copy(hc); M.ring.rotation.z = t * 0.5; M.ring2.rotation.z = -t * 0.9; M.ring2.position.y = 3 + Math.sin(t * 2) * 0.3;
  M.beam.material.color.copy(hc); M.beam.material.opacity = 0.1 + 0.22 * chg + 0.2 * burst; M.core.material.color.copy(hc); M.core.material.opacity = 0.45 + 0.4 * chg; M.core.scale.setScalar(7 + 4 * burst + 2 * Math.sin(t * 6) * chg);
  M.hubPlate.material.color.copy(hc); M.hubPlate.material.opacity = 0.14 + 0.2 * chg;
  const fill = clamp((t - 52.2) / 2.3); for (let i = 0; i < 28; i++) { const on = i / 28 < fill; M.gauge.setColorAt(i, on ? _c.copy(hc) : _c.setRGB(0.07, 0.1, 0.18)); } M.gauge.instanceColor.needsUpdate = true;
  // bénéficiaire
  const hp = pop((t - 53.9) / 0.4); M.hero.visible = hp > 0.01; M.hero.scale.setScalar(Math.max(0.001, hp));
  const up = sstep(54.35, 54.7, t); M.heroP.rotation.y = Math.sin(t * 1.3) * 0.1; M.heroP.userData.armL.rotation.z = lerp(0.12, -(Math.PI - 0.75), up); M.heroP.userData.armR.rotation.z = lerp(-0.12, Math.PI - 0.75, up);
  M.heroP.position.y = 0.16 * Math.abs(Math.sin(t * 7)) * sstep(54.5, 54.7, t);
  M.heroGlow.material.opacity = 0.5 * sstep(54.1, 54.55, t); M.heroBeam.material.opacity = 0.3 * sstep(54.0, 54.4, t);
  for (let i = 0; i < 44; i++) { const ta = 54.1 + 0.55 * H(i, 91); const u = (t - ta) / 0.85; if (u <= 0 || u >= 1) { hide(M.heroCoins, i); continue; } const a = H(i, 92) * TAU, r = 1.2 + 1.8 * H(i, 94); put(M.heroCoins, i, Math.cos(a) * r, 9 - u * 8, Math.sin(a) * r * 0.6 - 0.8, 0.3, 0.3, 0.3, u * 7 + i, u * 5, 0); }
  M.heroCoins.instanceMatrix.needsUpdate = true;
}

// ------------------------------------------------------------------ chiffres géants (S3) : posés en « HUD 3D » devant la caméra
const cardTex = () => mk(256, 128, (g, w, h) => { g.save(); g.translate(w / 2, h / 2); g.scale(1, h / w); const r = g.createRadialGradient(0, 0, 0, 0, 0, w / 2); r.addColorStop(0, "rgba(2,8,6,.9)"); r.addColorStop(0.6, "rgba(2,8,6,.6)"); r.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = r; g.fillRect(-w / 2, -w / 2, w, w); g.restore(); });
export function buildNumbers() {
  const A = new T.Group(), B = new T.Group(); const N = {};
  N.d18 = makeSegDisplay(5, { gapAfter: [1] }); N.d18.position.set(1.5, 0.2, 0); A.add(N.d18);
  N.tilde = fatText("≈", { w: 2.4, h: 2.6, px: 320, size: 0.9, layers: 4, step: 0.06 }); N.tilde.position.set(-4.05, 0.25, 0); A.add(N.tilde);
  N.unit = fatText("Md€", { w: 9, h: 3.2, px: 900, size: 0.8, layers: 5, step: 0.07 }); N.unit.position.set(0.25, -2.9, 0); A.add(N.unit);
  N.mention = smallText("Forbes 1er mars 2026 · converti au taux BCE du 09/10/2026", { w: 14.4, h: 0.78, px: 1700, size: 0.5 }); N.mention.position.set(0.25, -4.75, 0.1); A.add(N.mention);
  N.back = new T.Mesh(new T.PlaneGeometry(19, 8.4), new T.MeshBasicMaterial({ map: cardTex(), transparent: true, opacity: 0, depthWrite: false })); N.back.position.set(0.25, -2.0, -0.9); A.add(N.back);
  N.plus = smallText("plus de", { w: 3.4, h: 1.0, px: 480, size: 0.7, color: "#f3ecd4", font: FONT }); N.plus.position.set(-6.2, -0.1, 0); B.add(N.plus);
  N.d824 = makeSegDisplay(3, { pitch: 1.46 }); N.d824.position.set(-0.6, 0.2, 0); B.add(N.d824);
  N.mill1 = fatText("millions", { w: 6.2, h: 1.9, px: 800, size: 0.7, layers: 4, step: 0.06, color: "#f3ecd4" }); N.mill1.position.set(5.6, 0, 0); B.add(N.mill1);
  N.mill2 = fatText("de personnes", { w: 9.6, h: 1.6, px: 1200, size: 0.7, layers: 4, step: 0.06, color: "#f3ecd4" }); N.mill2.position.set(0.2, -2.35, 0); B.add(N.mill2);
  N.sub = smallText("moins de 3 $ par jour · Banque mondiale, 2024", { w: 13, h: 0.78, px: 1500, size: 0.52 }); N.sub.position.set(0.2, -4.0, 0.1); B.add(N.sub);
  N.back2 = new T.Mesh(new T.PlaneGeometry(19, 7.6), new T.MeshBasicMaterial({ map: cardTex(), transparent: true, opacity: 0, depthWrite: false })); N.back2.position.set(0.2, -1.9, -0.9); B.add(N.back2);
  return { A, B, N };
}
const digitsOf = (v, slots) => { const s = String(Math.max(0, Math.round(v))); const out = new Array(slots).fill(null); for (let i = 0; i < s.length; i++) out[slots - s.length + i] = Number(s[i]); return out; };
const _m4 = new T.Matrix4(), _fw = new T.Vector3(), _rt = new T.Vector3(), _up = new T.Vector3(), _qs = new T.Quaternion(), _eu = new T.Euler();
/** pose un groupe à une position écran (px,py en pixels 1080×1920) à la profondeur D devant la caméra */
export function placeHud(obj, cam, px, py, D, k, sway = 0, t = 0) {
  const [x, y, z] = cam.p; const eye = _fw.set(x, y, z); _up.set(Math.sin(cam.roll), Math.cos(cam.roll), 0);
  _m4.lookAt(eye, _rt.set(cam.l[0], cam.l[1], cam.l[2]), _up); obj.quaternion.setFromRotationMatrix(_m4);
  const f = _fw.set(cam.l[0] - x, cam.l[1] - y, cam.l[2] - z).normalize(); const r = _rt.crossVectors(f, _up).normalize(); const u = _up.crossVectors(r, f).normalize();
  const hD = 2 * Math.tan((cam.fov * Math.PI) / 360) * D, wD = hD * (1080 / 1920); const ox = ((px - 540) / 1080) * wD, oy = ((960 - py) / 1920) * hD;
  obj.position.set(x + f.x * D + r.x * ox + u.x * oy, y + f.y * D + r.y * ox + u.y * oy, z + f.z * D + r.z * ox + u.z * oy);
  _eu.set(0.05 * sway * Math.sin(t * 0.9), 0.16 * sway * Math.sin(t * 1.3), 0, "YXZ"); _qs.setFromEuler(_eu); obj.quaternion.multiply(_qs); obj.scale.setScalar(k);
}
export function updateNumbers(NB, t, cam) {
  const { A, B, N } = NB; const tM = 9.2, tMd = 9.86, tE = 10.22, tMi = 11.86; const out = 1 - sstep(12.52, 12.78, t);
  A.visible = t >= tM - 0.02 && out > 0.01;
  const v18 = 18000 * eout(clamp((t - tM) / 1.05)); N.d18.userData.set(digitsOf(t < tM ? 0 : v18, 5));
  const unitS = pop((t - tMd) / 0.32); N.unit.visible = unitS > 0.01; N.unit.scale.setScalar(Math.max(0.001, unitS)); N.unit.position.y = -2.9 + (1 - Math.min(1, unitS)) * 1.5;
  const ts = pop((t - (tM + 0.9)) / 0.3); N.tilde.visible = ts > 0.01; N.tilde.scale.setScalar(Math.max(0.001, ts));
  const ms = sstep(tE, tE + 0.4, t); N.mention.material.opacity = ms * 0.95; N.mention.visible = ms > 0.01;
  N.back.material.opacity = 0.85 * sstep(tM - 0.1, tM + 0.5, t);
  const pulse = 1 + 0.07 * Math.exp(-Math.pow((t - tMd) * 9, 2)) + 0.05 * Math.exp(-Math.pow((t - tE) * 9, 2));
  placeHud(A, cam, 540, 330, 70, 2.72 * pulse * (0.4 + 0.6 * out), 1, t);
  B.visible = t >= tMi - 0.05 && out > 0.01;
  const v824 = 824 * eout(clamp((t - tMi) / 0.55)); N.d824.userData.set(digitsOf(t < tMi ? 0 : v824, 3));
  const ps = pop((t - (tMi + 0.3)) / 0.3); for (const o of [N.mill1, N.mill2, N.plus]) { o.visible = ps > 0.01; if (o.userData.planes) o.scale.setScalar(Math.max(0.001, ps)); }
  N.sub.material.opacity = sstep(tMi + 0.55, tMi + 0.9, t) * 0.95; N.sub.visible = t > tMi + 0.5; N.back2.material.opacity = 0.85 * sstep(tMi, tMi + 0.4, t);
  placeHud(B, cam, 540, 1085, 70, 1.95 * (0.4 + 0.6 * out), 1, t + 3);
}
