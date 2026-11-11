// Banc d'essai d'un module de scène isolé : preview.html?m=<id>  (même rendu que main.js)
import * as T from "three";
import { shotList, evalShots, shake } from "./shots.js";
import { MODULES, windowsOf } from "./plan.js";
const id = new URLSearchParams(location.search).get("m");
const W = 1080, H = 1920;
const renderer = new T.WebGLRenderer({ canvas: document.getElementById("gl"), antialias: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.outputColorSpace = T.SRGBColorSpace;
const scene = new T.Scene(); scene.background = new T.Color(0x030605); scene.fog = new T.FogExp2(0x030605, 0.01);
const cam = new T.PerspectiveCamera(42, W / H, 0.1, 600);
const mod = await import(`./scenes/${id}.js`);
const g = mod.build(); scene.add(g);
const tr = shotList(mod.SHOTS);
function renderAt(t) {
  const inW = windowsOf(id).some(([a, b]) => t >= a && t < b); g.visible = true;
  mod.update(g, t);
  const c = evalShots(t, tr); const sh = mod.SHAKE ? mod.SHAKE(t) : 0; const k = shake(t, sh);
  cam.position.set(c.p[0] + k[0], c.p[1] + k[1], c.p[2] + k[2]); cam.up.set(Math.sin(c.roll), Math.cos(c.roll), 0); cam.lookAt(...c.l); cam.fov = c.fov; cam.updateProjectionMatrix();
  const env = mod.ENV ? mod.ENV(t) : { bg: 0x030605, fog: 0.01 }; scene.background.setHex(env.bg); scene.fog.color.setHex(env.bg); scene.fog.density = env.fog;
  renderer.render(scene, cam); return inW;
}
window.__renderAt = (t) => renderAt(t);
renderAt(windowsOf(id)[0][0]); window.__ready = true;
