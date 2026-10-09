// MODULE « durable » — scènes 15 (le problème peut revenir), 16 (aider ≠ résoudre durablement), 17 (l'économie reconnectée). Fenêtre unique [59.44, 79.16].
// Contrat : ../../CONTRACT.md. Fonction pure du temps global t ; aucun état entre deux appels.
import { T, PAL, lerp, sstep, lin, eio, eout, ein, mixHex } from "./durable_kit.js";
import { MODULES, windowsOf, startOf, endOf } from "../plan.js";
import { buildS15, updateS15, S15_LIGHTS, S15_ENV, S15_SHAKE, T15 } from "./durable_s15.js";
import { buildS16, updateS16, S16_LIGHTS, S16_ENV, S16_SHAKE, T16 } from "./durable_s16.js";
import { buildS17, updateS17, S17_LIGHTS, S17_ENV, S17_SHAKE, T17 } from "./durable_s17.js";

export const ID = "durable";
export const OFFSET = MODULES[ID].offset;
export const WINDOWS = windowsOf(ID);
const [ox, oy, oz] = OFFSET;
const A15 = startOf(15), B15 = endOf(15), B16 = endOf(16), B17 = endOf(17);    // 59.44, 64.72, 70.90, 79.16
const O16 = 200, O17 = 400;                                                      // décalage en x des zones S16 et S17 dans le groupe
const which = (t) => (t < B15 ? 15 : t < B16 ? 16 : 17);

export const ENV = (t) => (which(t) === 15 ? S15_ENV(t) : which(t) === 16 ? S16_ENV(t) : S17_ENV(t));
export const SHAKE = (t) => (which(t) === 15 ? S15_SHAKE(t) : which(t) === 16 ? S16_SHAKE(t) : S17_SHAKE(t));

// ---- caméra (coordonnées MONDE) ----
const V15 = (x, y, z) => [x + ox, y + oy, z + oz];
const V16 = (x, y, z) => [x + ox + O16, y + oy, z + oz];
const V17 = (x, y, z) => [x + ox + O17, y + oy, z + oz];
export const SHOTS = [
  // S15 : la table, la pile qui fond, le tuyau absent, les factures qui reviennent, gros plan sur le solde
  { t: A15, p: V15(0.15, 4.6, 8.2), l: V15(0.1, 1.55, 0), f: 48 },
  { t: 60.3, p: V15(0.2, 4.3, 7.3), l: V15(0.25, 1.6, 0), f: 46, e: eio },
  { t: 61.15, p: V15(0.3, 4.7, 8.8), l: V15(0.3, 2.0, -0.3), f: 48, e: eio },
  { t: 61.9, p: V15(0.5, 5.0, 9.2), l: V15(0.45, 2.4, -0.5), f: 50 },
  { t: 62.4, p: V15(0.5, 4.9, 9.0), l: V15(0.4, 2.2, -0.4), f: 50, e: eio },
  { t: 63.0, p: V15(0.35, 3.9, 6.9), l: V15(0.3, 1.4, 0.1), f: 46, e: eio },
  { t: 64.0, p: V15(0.35, 4.2, 5.9), l: V15(0.3, 1.15, 0.3), f: 43, e: eio },
  { t: B15 - 0.01, p: V15(0.35, 4.5, 5.4), l: V15(0.3, 1.0, 0.45), f: 42 },
  // S16 : image scindée (argent immédiat à gauche / stabilité durable à droite), traversée puis recul
  { t: B15, p: V16(-2.4, 9.5, 17.5), l: V16(-2.2, 3.4, -0.8), f: 50 },
  { t: 65.9, p: V16(-3.2, 8.0, 15.0), l: V16(-3.0, 3.1, -0.8), f: 48, e: eio },
  { t: 67.0, p: V16(-2.2, 7.8, 16.5), l: V16(-2.0, 3.0, -0.8), f: 49, e: eio },
  { t: 67.68, p: V16(0.0, 8.2, 18.5), l: V16(0.0, 2.8, -0.8), f: 50, e: eio },
  { t: 68.6, p: V16(1.9, 8.3, 17.0), l: V16(2.4, 2.6, -1.5), f: 48, e: eio },
  { t: 69.7, p: V16(3.2, 8.8, 17.0), l: V16(3.2, 2.4, -2.0), f: 48, e: eio },
  { t: 70.25, p: V16(1.8, 11, 21), l: V16(1.6, 2.2, -1.2), f: 50, e: eio },
  { t: B16 - 0.01, p: V16(0.4, 12.5, 24.5), l: V16(0.3, 2.0, -0.8), f: 50 },
  // S17 : patrimoine isolé, les liens se tissent, travelling arrière jusqu'à l'économie complète
  { t: B16, p: V17(2.2, 3.4, 12.5), l: V17(0, 1.4, 0), f: 44 },
  { t: 72.3, p: V17(-1.8, 3.2, 10.6), l: V17(0, 1.5, 0), f: 44, e: eio },
  { t: 73.45, p: V17(0.4, 2.6, 7.4), l: V17(0, 1.9, 0), f: 42, e: eio },
  { t: 74.34, p: V17(1.6, 6.5, 15.5), l: V17(0, 1.5, -1.8), f: 46, e: eio },
  { t: 75.4, p: V17(3.4, 9.0, 20), l: V17(0.8, 1.2, -1.2), f: 48, e: eio },
  { t: 76.15, p: V17(1.5, 13, 25), l: V17(0.4, 0.9, -0.6), f: 50, e: eio },
  { t: 76.8, p: V17(-1.0, 17, 30), l: V17(0, 0.7, -0.4), f: 50, e: eio },
  { t: 77.9, p: V17(0, 23, 35), l: V17(0, 0.6, -0.3), f: 49, e: eio },
  { t: B17 - 0.01, p: V17(0, 27, 37), l: V17(0, 0.4, -0.2), f: 48 },
];

// ---- construction ----
export function build() {
  const g = new T.Group(); g.position.set(...OFFSET); const U = g.userData;
  const hemi = new T.HemisphereLight(0xffeedd, 0x6a4a34, 1.2), sun = new T.DirectionalLight(0xffd7a0, 1.1), pt = new T.PointLight(0xffb866, 0, 30, 1.6);
  sun.position.set(-4, 9, 8); g.add(hemi, sun, pt); U.hemi = hemi; U.sun = sun; U.pt = pt;
  const r15 = new T.Group(); g.add(r15); U.s15 = buildS15(r15); U.r15 = r15;
  const r16 = new T.Group(); r16.position.x = O16; g.add(r16); U.s16 = buildS16(r16); U.r16 = r16;
  const r17 = new T.Group(); r17.position.x = O17; g.add(r17); U.s17 = buildS17(r17); U.r17 = r17;
  return g;
}

// ---- mise à jour (pure) ----
export function update(g, t) {
  const U = g.userData; const w = which(t);
  U.r15.visible = w === 15; U.r16.visible = w === 16; U.r17.visible = w === 17;
  const L = w === 15 ? S15_LIGHTS(t) : w === 16 ? S16_LIGHTS(t) : S17_LIGHTS(t); const off = w === 15 ? 0 : w === 16 ? O16 : O17;
  U.hemi.color.setHex(L.hemiC); U.hemi.groundColor.setHex(L.hemiG); U.hemi.intensity = L.hemi;
  U.sun.color.setHex(L.dirC); U.sun.intensity = L.dir; U.sun.position.set(L.dirP[0] + off, L.dirP[1], L.dirP[2]); U.sun.target.position.set(off, 0, 0); U.sun.target.updateMatrixWorld();
  U.pt.color.setHex(L.ptC); U.pt.intensity = L.pt; U.pt.position.set(L.ptP[0] + off, L.ptP[1], L.ptP[2]); if (L.ptD) U.pt.distance = L.ptD;
  if (w === 15) updateS15(U.s15, t); else if (w === 16) updateS16(U.s16, t); else updateS17(U.s17, t);
}
