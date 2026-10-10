import * as T from "three";
import { sheetTex, stripeTex, screenTex, glowTex } from "./tex.js";
import { integrate, sstep, kf, eio } from "./util.js";

/** vitesse des rouleaux (rad/s) en fonction du temps global narration */
export const rollerSpeed = (t) => kf(t, [[0, 0], [0.25, 0], [1.4, 7, eio], [26.96, 8.5], [29.45, 34, (u) => u * u], [29.5, 0], [56.8, 0], [58.5, 3, eio], [60, 2.5]]);
export const rollerAngle = integrate(rollerSpeed);

export function buildPrinter() {
  const g = new T.Group(); const part = {};
  const dark = new T.MeshPhongMaterial({ color: 0x1b2622, shininess: 70, specular: 0x4f6a5e });
  const steel = new T.MeshPhongMaterial({ color: 0x95a8a0, shininess: 110, specular: 0xffffff });
  const gold = new T.MeshPhongMaterial({ color: 0xdaa83a, shininess: 120, specular: 0x886f30, emissive: 0x1a1200 });
  const box = (w, h, d, m, x, y, z, parent = g) => { const o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x, y, z); parent.add(o); return o; };
  const cyl = (r, l, m, x, y, z, parent = g, seg = 28) => { const o = new T.Mesh(new T.CylinderGeometry(r, r, l, seg), m); o.rotation.z = Math.PI / 2; o.position.set(x, y, z); parent.add(o); return o; };

  box(8.6, 0.35, 5.4, dark, 0, 0.175, 0); box(8.7, 0.07, 5.5, gold, 0, 0.37, 0);
  box(6.6, 1.9, 3.6, dark, 0, 1.32, 0);                                         // caisson
  for (const x of [-3.4, 3.4]) box(0.12, 1.9, 3.7, gold, x, 1.32, 0);
  const warn = new T.MeshBasicMaterial({ map: stripeTex() }); box(6.6, 0.18, 0.06, warn, 0, 0.62, 1.82);
  // fente de sortie (chute) et lèvres
  box(5.6, 0.14, 0.7, steel, 0, 1.55, 1.95); const ramp = box(5.6, 0.1, 1.6, steel, 0, 1.0, 2.35); ramp.rotation.x = -0.28;
  const slotGlow = new T.Mesh(new T.PlaneGeometry(5.3, 0.26), new T.MeshBasicMaterial({ color: 0xffc54d })); slotGlow.position.set(0, 1.3, 1.83); g.add(slotGlow); part.slotGlow = slotGlow;
  // montants + capot haut
  for (const x of [-3.1, 3.1]) for (const z of [-1.55, 1.55]) box(0.3, 2.9, 0.3, steel, x, 3.6, z);
  box(6.7, 0.55, 3.7, dark, 0, 5.25, 0); box(6.8, 0.07, 3.8, gold, 0, 5.55, 0);
  // bobine de papier + supports
  const reel = cyl(1.0, 5.5, new T.MeshPhongMaterial({ color: 0xe9efe9, shininess: 10 }), 0, 6.55, -0.95); part.reel = reel;
  for (const x of [-2.9, 2.9]) { box(0.2, 1.7, 0.2, steel, x, 5.95, -0.95); cyl(0.28, 0.25, gold, x * 1.01, 6.55, -0.95); }
  // rouleaux
  const rolDef = [[4.3, -0.55, 0.52], [3.4, 0.2, 0.48], [2.75, -0.35, 0.5], [2.6, 0.85, 0.46]];
  part.rollers = rolDef.map(([y, z, r], i) => { const m = cyl(r, 5.9, i % 2 ? steel : gold, 0, y, z); for (const x of [-3.0, 3.0]) cyl(r * 0.45, 0.35, dark, x, y, z); return m; });
  // bande de papier : 5 segments (blanc -> encre or -> billets)
  const pts = [[5.55, -0.95], [4.3 + 0.52, -0.55], [3.4 + 0.47, 0.2], [2.75 - 0.0, -0.35], [2.6 - 0.46, 0.85], [1.3, 1.82]];
  const texs = [sheetTex(0), sheetTex(0), sheetTex(1), sheetTex(2), sheetTex(2)]; part.sheetTex = texs;
  texs.forEach((t) => { t.wrapS = t.wrapT = T.RepeatWrapping; });
  for (let i = 0; i < 5; i++) {
    const [y0, z0] = pts[i], [y1, z1] = pts[i + 1]; const dy = y1 - y0, dz = z1 - z0, len = Math.hypot(dy, dz);
    const p = new T.Mesh(new T.PlaneGeometry(5.3, len), new T.MeshBasicMaterial({ map: texs[i], side: T.DoubleSide })); p.geometry.attributes.uv.array.forEach((v, k, a) => { if (k % 2) a[k] = v * len / 1.4; });
    p.position.set(0, (y0 + y1) / 2, (z0 + z1) / 2); p.rotation.x = Math.atan2(dz, dy); g.add(p);
  }
  // réservoirs d'encre (verre lumineux)
  const ink = [0x35f2a1, 0xe8b84a];
  [-4.25, 4.25].forEach((x, i) => { const tk = new T.Mesh(new T.CylinderGeometry(0.62, 0.62, 2.8, 24), new T.MeshBasicMaterial({ color: ink[i], transparent: true, opacity: 0.85 })); tk.position.set(x, 2.1, 0.2); g.add(tk); cyl(0.7, 0.4, steel, x, 3.62, 0.2).rotation.z = 0; box(0.2, 1.4, 0.2, steel, x * 0.93, 4.5, 0.2); });
  // pupitre de contrôle + écran
  const scr = new T.Mesh(new T.PlaneGeometry(2.6, 1.3), new T.MeshBasicMaterial({ map: screenTex("IMPRESSION", "∞ billets") })); scr.position.set(-1.7, 5.3, 2.0); scr.rotation.x = -0.2; g.add(scr);
  box(2.9, 1.6, 0.25, dark, -1.7, 5.3, 1.9).rotation.x = -0.2; box(2.9, 0.07, 0.3, gold, -1.7, 4.5, 2.02);
  part.leds = [];
  for (let i = 0; i < 7; i++) { const m = new T.Mesh(new T.SphereGeometry(0.1, 10, 8), new T.MeshBasicMaterial({ color: 0x35f2a1 })); m.position.set(-3.0 + i * 0.45, 1.95, 1.84); g.add(m); part.leds.push(m); }
  // glow de la fente
  const glow = new T.Sprite(new T.SpriteMaterial({ map: glowTex(), color: 0xffc54d, blending: T.AdditiveBlending, depthWrite: false, transparent: true })); glow.scale.set(11, 4, 1); glow.position.set(0, 1.4, 2.4); g.add(glow); part.glow = glow;
  const standby = new T.Mesh(new T.SphereGeometry(0.14, 10, 8), new T.MeshBasicMaterial({ color: 0xff5a2a })); standby.position.set(3.0, 1.95, 1.84); g.add(standby); part.standby = standby;
  g.userData = part; return g;
}

export function updatePrinter(g, t, lt, rate, on) {
  const p = g.userData; const a = rollerAngle(t);
  p.rollers.forEach((r, i) => { r.rotation.x = a * (i % 2 ? -1 : 1); });
  p.reel.rotation.x = a * 0.4;
  p.sheetTex.forEach((tx) => { tx.offset.y = -a * 0.11; });
  const live = sstep(0.3, 1.2, t) * (t < 29.5 || t > 56.5 ? 1 : 0.0);
  p.slotGlow.material.color.setHex(0xffc54d); p.slotGlow.material.opacity = 1;
  p.glow.material.opacity = 0.1 + 0.45 * on * (0.55 + 0.45 * Math.sin(a * 1.7)) * (t < 29.5 || t > 56.8 ? 1 : 0.35);
  p.leds.forEach((l, i) => { const k = Math.sin(a * 0.8 - i * 0.9) > 0 ? 1 : 0.15; l.material.color.setRGB(0.2 * k + 0.05, 0.95 * k, 0.6 * k); if (t >= 29.5 && t < 56.5) l.material.color.setRGB(0.9, 0.1, 0.05); });
  p.standby.visible = t < 0.9 || (t >= 29.5 && t < 56.5);
  p.standby.material.color.setHex(t < 0.9 ? (Math.floor(t * 4) % 2 ? 0xff5a2a : 0x551a0a) : 0xff2a1a);
}
