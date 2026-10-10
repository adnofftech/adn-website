import * as T from "three";
import { H } from "./util.js";
const mk = (w, h, draw, opts = {}) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); draw(g, w, h);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4;
  if (opts.repeat) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(opts.repeat[0], opts.repeat[1]); }
  return t;
};
export const FONT = '"Archivo Black","Arial Black","DejaVu Sans",sans-serif';
export const MONO = '"Space Mono","DejaVu Sans Mono",monospace';

/** Billet générique, clairement fictif ("BANQUE DE FICTION"). */
export function drawBill(g, w, h, hue = 0) {
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#2f9d5e"); gr.addColorStop(0.5, "#237a47"); gr.addColorStop(1, "#1c6a3d");
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = "rgba(220,255,225,.28)"; g.lineWidth = 1;
  for (let i = 0; i < 34; i++) { g.beginPath(); g.arc(w * 0.5, h * 0.5, 6 + i * 5.2, 0, 7); g.stroke(); }
  g.fillStyle = "rgba(0,0,0,.12)"; for (let x = 0; x < w; x += 6) g.fillRect(x, 0, 2, h);
  g.strokeStyle = "#f1d58a"; g.lineWidth = 7; g.strokeRect(14, 14, w - 28, h - 28);
  g.lineWidth = 2; g.strokeRect(26, 26, w - 52, h - 52);
  g.fillStyle = "#103c24"; g.beginPath(); g.ellipse(w / 2, h / 2, h * 0.34, h * 0.4, 0, 0, 7); g.fill();
  g.strokeStyle = "#f1d58a"; g.lineWidth = 4; g.stroke();
  g.fillStyle = "#f1d58a"; g.font = `900 ${h * 0.42}px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("100", w / 2, h / 2 + 4);
  g.font = `900 ${h * 0.17}px ${FONT}`; g.textAlign = "left"; g.fillText("100", 44, 58); g.textAlign = "right"; g.fillText("100", w - 44, h - 50);
  g.textAlign = "center"; g.font = `700 ${h * 0.085}px ${MONO}`; g.fillStyle = "rgba(241,213,138,.9)"; g.fillText("BANQUE DE FICTION", w * 0.5, 44);
  g.fillText("NON NÉGOCIABLE", w * 0.5, h - 30);
}
export const billTex = () => mk(512, 224, drawBill);

export const sheetTex = (stage) => mk(256, 256, (g, w, h) => {
  g.fillStyle = stage === 0 ? "#e9efe9" : stage === 1 ? "#efe6c8" : "#2a8b52"; g.fillRect(0, 0, w, h);
  g.strokeStyle = stage === 0 ? "rgba(0,0,0,.08)" : stage === 1 ? "rgba(190,140,30,.55)" : "rgba(241,213,138,.7)"; g.lineWidth = 3;
  for (let r = 0; r < 4; r++) { g.strokeRect(10, r * 64 + 6, w - 20, 52); if (stage > 0) { g.beginPath(); g.ellipse(w / 2, r * 64 + 32, 40, 20, 0, 0, 7); g.stroke(); } }
}, { repeat: [1, 1] });

export const heapTex = () => mk(512, 512, (g, w, h) => {
  g.fillStyle = "#1d6a3c"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 1500; i++) {
    const x = H(i, 1) * w, y = H(i, 2) * h, a = H(i, 3) * 3.14, l = 38 + H(i, 4) * 26, s = H(i, 5);
    g.save(); g.translate(x, y); g.rotate(a);
    g.fillStyle = s < 0.15 ? "#e9d9a0" : `hsl(${135 + H(i, 6) * 18},${42 + H(i, 7) * 22}%,${22 + H(i, 8) * 24}%)`;
    g.fillRect(-l / 2, -l * 0.22, l, l * 0.44); g.strokeStyle = "rgba(240,215,140,.55)"; g.lineWidth = 1.2; g.strokeRect(-l / 2 + 2, -l * 0.22 + 2, l - 4, l * 0.44 - 4); g.restore();
  }
}, { repeat: [3, 2] });

export const glowTex = () => mk(128, 128, (g, w, h) => {
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.25, "rgba(255,255,255,.45)"); r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r; g.fillRect(0, 0, w, h);
});
export const floorTex = () => mk(512, 512, (g, w, h) => {
  g.fillStyle = "#0b100d"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(90,170,120,.20)"; g.lineWidth = 2;
  for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * w / 4, 0); g.lineTo(i * w / 4, h); g.stroke(); g.beginPath(); g.moveTo(0, i * h / 4); g.lineTo(w, i * h / 4); g.stroke(); }
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(255,255,255,${H(i, 9) * 0.03})`; g.fillRect(H(i, 1) * w, H(i, 2) * h, 2 + H(i, 3) * 14, 2); }
}, { repeat: [10, 10] });
export const stripeTex = () => mk(128, 32, (g, w, h) => {
  g.fillStyle = "#e8b84a"; g.fillRect(0, 0, w, h); g.fillStyle = "#111"; for (let x = -32; x < w + 32; x += 32) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + 16, h); g.lineTo(x + 32, 0); g.lineTo(x + 16, 0); g.fill(); }
}, { repeat: [10, 1] });
export const screenTex = (txt, sub) => mk(512, 256, (g, w, h) => {
  g.fillStyle = "#04140b"; g.fillRect(0, 0, w, h); g.fillStyle = "#47f0a0"; g.font = `700 54px ${MONO}`; g.textAlign = "center"; g.fillText(txt, w / 2, 110);
  g.font = `700 34px ${MONO}`; g.fillStyle = "#e8b84a"; g.fillText(sub, w / 2, 180);
  g.strokeStyle = "rgba(71,240,160,.25)"; for (let y = 0; y < h; y += 6) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
});
export { mk };
