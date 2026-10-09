// MODULE-GABARIT (à remplacer). Contrat : voir ../../CONTRACT.md
import { T, lam, basic, PAL, kf, eio, glow } from "../shared.js";
import { MODULES, windowsOf, startOf, endOf, onset } from "../plan.js";
export const ID = "wealth";
export const OFFSET = MODULES[ID].offset;
export const WINDOWS = windowsOf(ID);
export const ENV = (t) => ({ bg: 0x030605, fog: 0.012 });
export const SHAKE = (t) => 0;
export function build() {
  const g = new T.Group(); g.position.set(...OFFSET);
  g.add(new T.HemisphereLight(0xcfeee0, 0x0a2a20, 1.4));
  const cube = new T.Mesh(new T.BoxGeometry(2, 2, 2), lam(PAL.gold)); cube.position.y = 1; g.add(cube); g.userData.cube = cube;
  const floor = new T.Mesh(new T.PlaneGeometry(60, 60), lam(0x10201a)); floor.rotation.x = -Math.PI / 2; g.add(floor);
  return g;
}
export function update(g, t) { g.userData.cube.rotation.y = t; }
const [ox, oy, oz] = OFFSET;
// SHOTS : clés caméra en coordonnées MONDE (déjà décalées de OFFSET). La première clé de chaque fenêtre doit avoir t = début de fenêtre.
export const SHOTS = WINDOWS.flatMap(([a, b]) => [
  { t: a, p: [ox - 6, 4, oz + 12], l: [ox, 1, oz], f: 42 },
  { t: b - 0.01, p: [ox + 6, 3, oz + 9], l: [ox, 1, oz], f: 42, e: eio },
]);
