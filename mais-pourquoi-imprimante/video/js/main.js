import * as T from "three";
import { clamp, sstep, lin, eio, eout, ein, kf, lerp } from "./util.js";
import { buildPrinter, updatePrinter } from "./printer.js";
import { buildBills, updateBills, localTime } from "./bills.js";
import { buildRoom, updateRoom, flick } from "./room.js";
import { buildMarket, updateMarket, MX } from "./market.js";
import { buildWorld, updateWorld, WC, RING, SECTORS, sectorPos } from "./world.js";
import { buildFinance, updateFinance, FX, NODES } from "./finance.js";
import { shotList, evalShots, shake } from "./shots.js";

export const W = 1080, H = 1920;
const canvas = document.getElementById("gl");
const renderer = new T.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.outputColorSpace = T.SRGBColorSpace;
const scene = new T.Scene(); scene.background = new T.Color(0x030605); scene.fog = new T.FogExp2(0x030605, 0.012);
const cam = new T.PerspectiveCamera(42, W / H, 0.1, 400);

const room = buildRoom(); const printer = buildPrinter(); const bills = buildBills();
const roomGroup = new T.Group(); roomGroup.add(room, printer, bills); scene.add(roomGroup);
const market = buildMarket(); scene.add(market);
const world = buildWorld(); scene.add(world);
const fin = buildFinance(); scene.add(fin);
import { billTex } from "./tex.js";
const lastBill = new T.Mesh(new T.PlaneGeometry(1.3, 0.58), new T.MeshBasicMaterial({ map: billTex(), side: T.DoubleSide })); scene.add(lastBill);
const bgA = new T.Color(0x030605), bgB = new T.Color(0x16373a);

// ---------- plans caméra : imprimante / salle (scènes 1-2) ----------
const SA = shotList([
  { t: 0.0, p: [-9, 3.2, 26], l: [0, 3.3, 0], f: 40 },
  { t: 2.2, p: [-3.5, 2.6, 15.5], l: [0, 2.4, 3], f: 42, e: eio },
  { t: 3.1, p: [1.5, 8.5, 9.5], l: [0, 0.6, 12], f: 50, e: eio },
  { t: 4.2, p: [-6.5, 9.5, 6.5], l: [0, 2.5, 14.5], f: 50, e: eio },
  { t: 6.2, p: [-12, 6.5, 26], l: [0, 3.5, 14], f: 55, e: eio },
  { t: 7.5, p: [10.5, 5.5, 20], l: [-2, 4.5, 14], f: 62, e: eio },
  { t: 8.1, p: [3, 11.5, 22], l: [0, 6, 14.5], f: 58, e: eio },
  { t: 9.78, p: [0.5, 9.5, 14.8], l: [0, 6, 14.5], f: 70, e: ein },
  // ---- scène 3 : supermarché (coordonnées locales + MX)
  { t: 9.78, p: [MX + 3.5, 1.5, 1], l: [MX - 1, 2.2, -14], f: 66, r: 0.22 },
  { t: 10.9, p: [MX + 0.3, 1.7, -3.2], l: [MX - 0.6, 1.5, -10], f: 52, r: 0, e: eio },
  { t: 11.0, p: [MX - 0.3, 2.1, -3.6], l: [MX - 0.4, 1.2, -8], f: 42, e: eio },
  { t: 12.4, p: [MX - 0.1, 2.0, -3.7], l: [MX + 0.0, 1.25, -8], f: 40, e: eio },
  { t: 13.7, p: [MX + 0.9, 2.0, -3.9], l: [MX + 1.0, 1.3, -8], f: 40, e: eio },
  { t: 14.5, p: [MX + 0.2, 2.2, -8.6], l: [MX + 0, 1.0, -12.3], f: 46, e: eio },
  { t: 16.84, p: [MX + 0, 2.1, -9.6], l: [MX + 0, 1.1, -14], f: 50, e: eio },
  { t: 19.9, p: [MX + 0, 1.7, -13.2], l: [MX + 0, 1.2, -16], f: 44, e: eio },
  { t: 20.0, p: [MX + 0.6, 2.1, -4.6], l: [MX - 2.9, 1.9, -6.6], f: 42, e: eio },
  { t: 21.4, p: [MX + 0.8, 2.1, -5.2], l: [MX - 2.9, 2.0, -6.7], f: 40, e: eio },
  { t: 22.4, p: [MX - 0.5, 2.0, -3.9], l: [MX - 1.0, 1.3, -8], f: 42, e: eio },
  { t: 24.1, p: [MX - 0.6, 1.95, -4.1], l: [MX - 1.0, 1.3, -8], f: 40, e: eio },
  { t: 24.3, p: [MX + 0, 2.2, -2], l: [MX + 0, 2.0, -14], f: 56, e: eio },
  { t: 26.9, p: [MX + 0, 2.4, -3.2], l: [MX + 0, 2.0, -14], f: 58, e: eio },
  { t: 27.4, p: [MX + 0, 2.6, -8], l: [MX + 0, 2.0, -14], f: 80, r: -0.3, e: ein },
  // ---- scène 4 : retour imprimante, accélération, arrêt, recul, tour des secteurs
  { t: 27.4, p: [-9, 13, 16], l: [0, 3.5, 3], f: 52, r: 0.0 },
  { t: 29.5, p: [-4.5, 10.5, 9.5], l: [0, 3.0, 2], f: 42, e: eio },
  { t: 30.0, p: [-4.5, 10.5, 9.5], l: [0, 3.0, 2], f: 42 },
  { t: 31.6, p: [-18, 26, 46], l: [0, 3, 14], f: 55, e: eio },
  { t: 32.42, p: [WC.x + 4 * Math.cos(-0.2), 24, WC.z + 4 * Math.sin(-0.2)], l: [WC.x + RING, 3, WC.z], f: 50, e: eio },
  { t: 32.82, p: [WC.x + 4 * Math.cos(-0.2), 24, WC.z + 4 * Math.sin(-0.2)], l: [WC.x + RING, 3, WC.z], f: 50 },
  ...SECTORS.slice(1).flatMap((s) => { const a = s.a; const px = WC.x + 4 * Math.cos(a - 0.2), pz = WC.z + 4 * Math.sin(a - 0.2); const [tx, tz] = sectorPos(a); const k = { p: [px, 24, pz], l: [tx, 3, tz], f: 50 }; return [{ t: s.t - 0.12, ...k, e: eio }, { t: s.t + 0.28, ...k }]; }),
  { t: 38.3, p: [0, 75, 16], l: [0, 2, 13], f: 58, e: eio },
  { t: 39.1, p: [0, 10, 8], l: [0, 2.4, 1.5], f: 66, e: ein },
  // ---- scène 5 : finance (coordonnées locales + FX)
  { t: 39.2, p: [FX + 0, 24, 36], l: [FX, 0, 2], f: 58 },
  { t: 40.6, p: [FX - 5, 13, 26], l: [FX, 2, 2], f: 54, e: eio },
  { t: 41.5, p: [FX, 10, 24], l: [FX, 8.5, -2], f: 52, e: eio },
  { t: 45.8, p: [FX, 9, 24], l: [FX, 8.5, -2], f: 52, e: eio },
  { t: 46.2, p: [FX - 1, 14, 28], l: [FX - 1, 2.5, 2], f: 46, e: eio },
  { t: 47.2, p: [FX + 0, 15, 30], l: [FX, 3, 2], f: 50, e: eio },
  { t: 49.1, p: [FX - 6, 12, 20], l: [FX - 5.5, 2.5, 2], f: 48, e: eio },
  { t: 50.7, p: [FX - 3, 17, 8], l: [FX - 5.5, 3, -12], f: 52, e: eio },
  { t: 52.4, p: [FX - 1, 14, 12], l: [FX - 5.5, 3, -6], f: 52, e: eio },
  { t: 53.7, p: [FX + 0.5, 18, 16], l: [FX + 0.5, 3, -12], f: 54, e: eio },
  { t: 55.4, p: [FX + 0.5, 15, 12], l: [FX + 0.5, 3, -12], f: 52, e: eio },
  { t: 56.45, p: [FX + 1, 46, 26], l: [FX, 0, -2], f: 62, e: ein },
  // ---- scène 6 : dernier billet, remontée vers la ville
  { t: 56.6, p: [-8.5, 2.6, 4.5], l: [0, 1.2, 3], f: 40 },
  { t: 58.8, p: [-6.8, 2.2, 4.3], l: [0.3, 0.5, 3.4], f: 36, e: eio },
  { t: 59.1, p: [-6.8, 2.2, 4.3], l: [0.3, 0.5, 3.4], f: 36 },
  { t: 61.6, p: [-36, 40, 60], l: [0, 3, 13], f: 56, e: eio },
  { t: 69.5, p: [32, 38, 58], l: [0, 3, 13], f: 54 },
]);

let applyShots = SA;
export function renderAt(t) {
  const lt = localTime(t);
  const on = flick(t);
  fin.visible = t >= 39.2 && t < 56.6; if (fin.visible) updateFinance(fin, t);
  roomGroup.visible = t < 9.78 || (t >= 27.2 && t < 39.2) || t >= 56.2; world.visible = (t >= 30.3 && t < 39.2) || t >= 56.2; market.visible = t >= 9.78 && t < 27.4;
  updateMarket(market, t); if (world.visible) updateWorld(world, t); updateRoom(room, t, lt, on); updatePrinter(printer, t, lt, 0, on); updateBills(bills, lt, t >= 29.5);
  // dissolution de l'imprimante (38.7 -> 39.15) avec glitch
  const ds = t < 56 ? 1 - eio(lin(38.7, 39.15, t)) : 1; printer.scale.setScalar(Math.max(0.001, ds)); printer.position.set(Math.sin(t * 90) * 0.12 * (1 - ds), 0, 0); printer.rotation.y = Math.sin(t * 70) * 0.08 * (1 - ds);
  // dernier billet (56.9 -> 59.5), mouvement lent
  { const u = lin(56.9, 59.6, t); lastBill.visible = t >= 56.9; const y = kf(u, [[0, 1.32], [0.22, 1.1, eio], [0.38, 0.82, eio], [1, 0.07, (x) => x * x]]); const z = kf(u, [[0, 2.1], [0.38, 3.15, eio], [1, 3.75, eout]]); const x = Math.sin(u * 9) * 0.3 * u;
    lastBill.position.set(x, y, z); lastBill.rotation.set(-Math.PI / 2 + 0.3 * Math.sin(u * 11) * (1 - u * 0.8), Math.sin(u * 6) * 0.5, 0.3 * Math.sin(u * 8) * (1 - u)); }
  const bgk = sstep(58.6, 62, t); scene.background.copy(bgA).lerp(bgB, bgk); if (t >= 30.3 && t < 39.2) scene.background.setHex(0x0b2427); scene.fog.color.copy(scene.background); scene.fog.density = lerp(0.012, 0.004, bgk) * (world.visible ? 0.5 : 1);
  const c = evalShots(t, SA);
  const sh = shake(t, t < 3 ? 0.012 : t < 26.96 ? 0 : t < 29.5 ? 0.09 * lin(26.96, 29.5, t) : 0.05);
  cam.position.set(c.p[0] + sh[0], c.p[1] + sh[1], c.p[2] + sh[2]); cam.up.set(Math.sin(c.roll), Math.cos(c.roll), 0);
  cam.lookAt(c.l[0], c.l[1], c.l[2]); cam.fov = c.fov; cam.updateProjectionMatrix();
  renderer.render(scene, cam);
}
window.__renderAt = renderAt;
window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(window.__hfThreeTime || 0);
window.__ready = true;
