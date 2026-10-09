// Assemblage : un module 3D par groupe de scènes, bascule selon la fenêtre temporelle (cut), caméra et ambiance du module actif.
import * as T from "three";
import { MODULES, moduleAt, VIDEO_DURATION } from "./plan.js";
import { shotList, evalShots, shake } from "./shots.js";
export const W = 1080, H = 1920;
const renderer = new T.WebGLRenderer({ canvas: document.getElementById("gl"), antialias: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.outputColorSpace = T.SRGBColorSpace;
const scene = new T.Scene(); scene.background = new T.Color(0x030605); scene.fog = new T.FogExp2(0x030605, 0.01);
const cam = new T.PerspectiveCamera(42, W / H, 0.1, 600);
const mods = {};
for (const id of Object.keys(MODULES)) {
  const m = await import(`./scenes/${id}.js`); const g = m.build(); g.visible = false; scene.add(g);
  mods[id] = { m, g, tr: shotList(m.SHOTS) };
}
let lastId = null;
export function renderAt(t) {
  const id = moduleAt(Math.min(t, VIDEO_DURATION - 0.001)) || "wealth";
  for (const k of Object.keys(mods)) mods[k].g.visible = k === id;
  const { m, g, tr } = mods[id];
  m.update(g, t);
  const c = evalShots(t, tr); const k = shake(t, m.SHAKE ? m.SHAKE(t) : 0);
  cam.position.set(c.p[0] + k[0], c.p[1] + k[1], c.p[2] + k[2]); cam.up.set(Math.sin(c.roll), Math.cos(c.roll), 0); cam.lookAt(...c.l); cam.fov = c.fov; cam.updateProjectionMatrix();
  const env = m.ENV ? m.ENV(t) : { bg: 0x030605, fog: 0.01 }; scene.background.setHex(env.bg); scene.fog.color.setHex(env.bg); scene.fog.density = env.fog;
  renderer.render(scene, cam);
}
window.__renderAt = renderAt;
window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(window.__hfThreeTime || 0);
window.__ready = true;
