import * as T from "three";
import { H, lin, eio, eout, eoutBack, lerp, kf, clamp, sstep } from "./util.js";
import { mk, FONT, MONO, glowTex } from "./tex.js";

export const FX = 600;
const MINT = 0x47f0a0, GOLD = 0xe8b84a, RED = 0xff3b30;
export const NODES = { bank: [-5.5, 2], house: [5.5, 2], h2: [8.5, 9], h3: [2.5, 9.5], f1: [11, -2.5], f2: [-11, 9], cb: [-5.5, -12], state: [6.5, -12] };
const L = (a, b) => [NODES[a], NODES[b]];
const LINKS = { loan: L("bank", "house"), p1: L("house", "f1"), p2: L("h2", "bank"), p3: L("h3", "f2"), p4: L("f1", "bank"), pol: L("cb", "bank"), blocked: L("cb", "state") };

function card(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace; return { c, tx, last: "", draw }; }
const acct = () => card(512, 256, null);
function drawAcct(o, v) { const s = String(v); if (o.last === s) return; o.last = s; const g = o.c.getContext("2d"); g.fillStyle = "#06201a"; g.fillRect(0, 0, 512, 256); g.strokeStyle = "#47f0a0"; g.lineWidth = 6; g.strokeRect(6, 6, 500, 244); g.fillStyle = "#47f0a0"; g.font = `700 34px ${MONO}`; g.textAlign = "left"; g.fillText("COMPTE COURANT", 28, 62); g.fillStyle = "#e8b84a"; g.font = `900 78px ${FONT}`; g.textAlign = "center"; g.fillText(v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " €", 256, 168); o.tx.needsUpdate = true; }

export function buildFinance() {
  const g = new T.Group(); g.position.set(FX, 0, 0); const f = {};
  const gt = mk(512, 512, (c) => { c.fillStyle = "#030f0c"; c.fillRect(0, 0, 512, 512); c.strokeStyle = "rgba(71,240,160,.32)"; c.lineWidth = 3; for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(i * 64, 0); c.lineTo(i * 64, 512); c.stroke(); c.beginPath(); c.moveTo(0, i * 64); c.lineTo(512, i * 64); c.stroke(); } }, { repeat: [14, 14] });
  const fl = new T.Mesh(new T.PlaneGeometry(130, 130), new T.MeshBasicMaterial({ map: gt })); fl.rotation.x = -Math.PI / 2; fl.position.y = -0.02; g.add(fl);
  g.add(new T.HemisphereLight(0xcfeee0, 0x0a2a20, 1.35)); const dl = new T.DirectionalLight(0xffffff, 1.7); dl.position.set(10, 30, 25); g.add(dl);
  const lam = (c, e = 0) => new T.MeshLambertMaterial({ color: c, emissive: e });
  const bx = (w, h, d, m, x, y, z, p) => { const o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x, y, z); p.add(o); return o; };
  const cy = (r, h, m, x, y, z, p, seg = 16) => { const o = new T.Mesh(new T.CylinderGeometry(r, r, h, seg), m); o.position.set(x, y, z); p.add(o); return o; };
  // bâtiment à colonnes (banque / banque centrale / État)
  const temple = (x, z, scale, body, trim, dome) => { const t = new T.Group(); t.position.set(x, 0, z); t.scale.setScalar(scale); bx(6.4, 0.6, 4.4, lam(trim), 0, 0.3, 0, t); bx(5.6, 3.2, 3.6, lam(body), 0, 2.2, 0, t); for (let i = 0; i < 5; i++) cy(0.26, 3.2, lam(trim, 0x221800), -2.4 + i * 1.2, 2.2, 2.0, t); bx(6.2, 0.45, 4.2, lam(trim), 0, 4.0, 0, t); if (dome) { const d = new T.Mesh(new T.SphereGeometry(1.8, 24, 12, 0, 6.283, 0, 1.57), lam(trim, 0x221800)); d.position.set(0, 4.2, 0); t.add(d); } else { const p = new T.Mesh(new T.ConeGeometry(3.4, 1.3, 3), lam(trim, 0x221800)); p.rotation.y = Math.PI / 2; p.scale.set(1, 1, 0.55); p.position.set(0, 4.9, 1.0); p.rotation.set(0, 0, 0); p.rotation.y = 0; t.add(p); } g.add(t); return t; };
  f.bank = temple(NODES.bank[0], NODES.bank[1], 1, 0xe9dfc3, 0xe8b84a, false);
  f.cb = temple(NODES.cb[0], NODES.cb[1], 1.35, 0xd8e1e6, 0xaab6bd, true);
  f.state = temple(NODES.state[0], NODES.state[1], 1.2, 0xf0f2f6, 0x2d6cc0, true);
  // étoiles de la banque centrale
  f.stars = new T.Group(); for (let i = 0; i < 12; i++) { const s = new T.Mesh(new T.SphereGeometry(0.22, 8, 6), new T.MeshBasicMaterial({ color: 0xffd23a })); const a = i / 12 * 6.283; s.position.set(Math.cos(a) * 3.2, 0, Math.sin(a) * 3.2); f.stars.add(s); } f.stars.position.set(NODES.cb[0], 11.5, NODES.cb[1]); g.add(f.stars);
  // maisons / entreprises
  const house = (x, z, c) => { const h = new T.Group(); h.position.set(x, 0, z); bx(3.2, 2.3, 3.2, lam(0xe9f4ee), 0, 1.15, 0, h); const r = new T.Mesh(new T.ConeGeometry(2.7, 1.8, 4), lam(c)); r.rotation.y = Math.PI / 4; r.position.y = 3.2; h.add(r); g.add(h); return h; };
  const firm = (x, z, c) => { const h = new T.Group(); h.position.set(x, 0, z); bx(3.8, 3.4, 3.0, lam(c), 0, 1.7, 0, h); bx(2.4, 0.4, 0.2, new T.MeshBasicMaterial({ color: GOLD }), 0, 2.6, 1.55, h); g.add(h); return h; };
  f.house = house(...NODES.house, 0x2f9a6a); f.h2 = house(...NODES.h2, 0x3a8fb5); f.h3 = house(...NODES.h3, 0xb5823a); f.f1 = firm(...NODES.f1, 0x4a6b8a); f.f2 = firm(...NODES.f2, 0x8a6b4a);
  f.nodes = [f.house, f.h2, f.h3, f.f1, f.f2, f.bank];
  // liens + impulsions
  f.linkMesh = {}; for (const [k, [a, b]] of Object.entries(LINKS)) { const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz); const m = new T.Mesh(new T.BoxGeometry(0.16, 0.16, len), new T.MeshBasicMaterial({ color: k === "blocked" ? RED : MINT, transparent: true, opacity: 0.55 })); m.position.set((a[0] + b[0]) / 2, 0.5, (a[1] + b[1]) / 2); m.rotation.y = Math.atan2(dx, dz); g.add(m); f.linkMesh[k] = m; }
  f.pulses = new T.InstancedMesh(new T.SphereGeometry(0.34, 10, 8), new T.MeshBasicMaterial({ color: 0xffffff }), 160); f.pulses.frustumCulled = false; g.add(f.pulses);
  // panneau 100 cases
  f.tiles = new T.InstancedMesh(new T.BoxGeometry(0.86, 0.86, 0.22), new T.MeshLambertMaterial({ color: 0xffffff, emissive: 0x112211 }), 100); f.tiles.frustumCulled = false; g.add(f.tiles);
  const c = new T.Color(); for (let i = 0; i < 100; i++) f.tiles.setColorAt(i, c.setHex(i >= 91 ? GOLD : MINT));
  // compte bancaire flottant + barrière + verrou + bouton de taux
  f.acct = acct(); f.acctM = new T.Mesh(new T.PlaneGeometry(5, 2.5), new T.MeshBasicMaterial({ map: f.acct.tx, transparent: true })); f.acctM.position.set(NODES.house[0], 7.4, NODES.house[1] + 1); g.add(f.acctM);
  f.guards = []; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; const p = new T.Mesh(new T.BoxGeometry(2.6, 5, 0.12), new T.MeshBasicMaterial({ color: MINT, transparent: true, opacity: 0.3 })); p.position.set(NODES.bank[0] + Math.cos(a) * 5.2, 0, NODES.bank[1] + Math.sin(a) * 5.2); p.rotation.y = -a + Math.PI / 2; g.add(p); f.guards.push(p); }
  f.barrier = new T.Mesh(new T.BoxGeometry(5.2, 6, 0.9), new T.MeshLambertMaterial({ color: RED, emissive: 0x500a06 })); f.barrier.position.set(0.5, 0, -12); g.add(f.barrier);
  f.knob = new T.Group(); const kb = new T.Mesh(new T.CylinderGeometry(1.6, 1.6, 0.7, 28), new T.MeshPhongMaterial({ color: 0xdfe6ea, shininess: 90 })); kb.rotation.x = Math.PI / 2; f.knob.add(kb); const ptr = new T.Mesh(new T.BoxGeometry(0.28, 1.5, 0.3), new T.MeshBasicMaterial({ color: RED })); ptr.position.set(0, 0.8, 0.45); f.knob.add(ptr); f.knob.position.set(NODES.cb[0], 8.2, NODES.cb[1] + 4.1); g.add(f.knob);
  f.loan = new T.Mesh(new T.PlaneGeometry(1.6, 2.1), new T.MeshBasicMaterial({ color: 0xfff4c9, side: T.DoubleSide })); g.add(f.loan);
  f.tokens = new T.InstancedMesh(new T.SphereGeometry(0.3, 8, 6), new T.MeshBasicMaterial({ color: GOLD }), 90); f.tokens.frustumCulled = false; g.add(f.tokens);
  g.userData = f; return g;
}

const o = new T.Object3D(); const col = new T.Color();
const pos = (k, u) => { const [a, b] = LINKS[k]; return [lerp(a[0], b[0], u), 0.5, lerp(a[1], b[1], u)]; };
export function updateFinance(g, t) {
  const f = g.userData; const appear = eoutBack(lin(39.2, 40.0, t));
  // stages
  const panel = eio(lin(41.5, 41.95, t)) * (1 - eio(lin(45.75, 46.15, t)));
  const nodesS = Math.max(0.001, appear * (1 - panel * 0.999));
  f.nodes.forEach((n) => n.scale.setScalar(nodesS)); [f.cb, f.state].forEach((n, i) => n.scale.setScalar(Math.max(0.001, nodesS * (i ? 1.2 : 1.35))));
  f.stars.visible = f.knob.visible = nodesS > 0.05; f.stars.rotation.y = t * 0.6;
  Object.values(f.linkMesh).forEach((m) => { m.visible = nodesS > 0.05; });
  f.linkMesh.pol.visible = f.linkMesh.blocked.visible = t > 50.6 && nodesS > 0.05; f.linkMesh.loan.visible = t > 45.8;
  // panneau 100 cases : apparition en vague, 91 menthe / 9 or
  for (let i = 0; i < 100; i++) { const cx = i % 10, cy = 9 - Math.floor(i / 10); const delay = (cx + (9 - cy)) * 0.05; const s = eoutBack(lin(41.6 + delay, 41.95 + delay, t)) * panel; o.position.set(FX * 0 + (cx - 4.5) * 0.98, 8.5 + (cy - 4.5) * 0.98, -2 + Math.sin(t * 2 + i) * 0.05); o.rotation.set(0, 0, 0); o.scale.setScalar(Math.max(0.001, s) * (i >= 91 ? 1 + 0.12 * Math.sin(t * 8 + i) : 1)); o.updateMatrix(); f.tiles.setMatrixAt(i, o.matrix); }
  f.tiles.instanceMatrix.needsUpdate = true; f.tiles.visible = panel > 0.01;
  // impulsions de paiement (réseau) + prêt + politique
  let n = 0; const add = (k, u, c, s = 1) => { const p = pos(k, ((u % 1) + 1) % 1); o.position.set(p[0], p[1] + 0.2, p[2]); o.rotation.set(0, 0, 0); o.scale.setScalar(s); o.updateMatrix(); f.pulses.setMatrixAt(n, o.matrix); f.pulses.setColorAt(n, col.setHex(c)); n++; };
  const rate = kf(t, [[50.9, 0.1], [52.0, 1.2, eio], [53.6, 3.2, eio], [60, 3.2]]); const flow = 0.36 / (1 + rate);
  if (nodesS > 0.05) {
    for (const k of ["p1", "p2", "p3", "p4"]) for (let j = 0; j < 4; j++) add(k, t * (0.3 + 0.05 * j) + j * 0.25 + H(j, k.length) , j % 2 ? GOLD : MINT, 0.8 * nodesS);
    if (t > 45.8 && t < 56.6) for (let j = 0; j < 5; j++) add("loan", t * flow * (t > 50.9 ? 1 : 1.0) + j * 0.2, MINT, 1.0);
    if (t > 50.6 && t < 53.7) for (let j = 0; j < 4; j++) add("pol", -t * 0.3 + j * 0.25, GOLD, 0.8);
    if (t > 53.75 && t < 56.6) { const hit = lin(53.8, 54.95, t); for (let j = 0; j < 5; j++) { let u = (t * 0.45 + j * 0.2) % 1; const lim = 0.54; if (t > 54.95 || u > lim) u = u > lim ? lim - (u - lim) * 0.8 : u; add("blocked", Math.min(u, 0.99), RED, 1.0); } }
  }
  f.pulses.count = n; f.pulses.instanceMatrix.needsUpdate = true; if (f.pulses.instanceColor) f.pulses.instanceColor.needsUpdate = true;
  // prêt (papier) qui voyage banque -> maison (46.3 -> 47.5)
  const lu = lin(46.3, 47.5, t); f.loan.visible = lu > 0 && lu < 1; const p = pos("loan", eio(lu)); f.loan.position.set(p[0], 3.4 + Math.sin(Math.PI * lu) * 5, p[2]); f.loan.rotation.set(0.4, t * 5, 0.3);
  // compte : apparition (47.55) + solde qui monte
  const ac = eoutBack(lin(47.55, 47.95, t)) * (1 - eio(lin(50.9, 51.3, t))); f.acctM.scale.setScalar(Math.max(0.001, ac)); f.acctM.visible = ac > 0.01; drawAcct(f.acct, Math.round(200000 * eout(lin(47.7, 48.9, t))));
  // jetons de monnaie créée
  let k = 0; const tb = t - 47.6; if (tb > 0 && tb < 2) for (let i = 0; i < 90; i++) { const u = clamp(tb - H(i, 1) * 0.5) / 1.4; if (u <= 0 || u >= 1) continue; const a = H(i, 2) * 6.283, r = 1 + 4.5 * eout(u); o.position.set(NODES.house[0] + Math.cos(a) * r * 0.6, 7 - u * 4 + Math.sin(a) * r * 0.2, NODES.house[1] + 1 + Math.sin(a) * r * 0.4); o.scale.setScalar(1 - u * 0.8); o.rotation.set(0, 0, 0); o.updateMatrix(); f.tokens.setMatrixAt(k++, o.matrix); }
  f.tokens.count = k; f.tokens.instanceMatrix.needsUpdate = true;
  // règles et limites : barrières qui se lèvent autour de la banque
  f.guards.forEach((gd, i) => { const u = eoutBack(lin(49.2 + i * 0.03, 49.7 + i * 0.03, t)) * (1 - eio(lin(50.9, 51.3, t))); gd.scale.y = Math.max(0.001, u); gd.position.y = 2.5 * u; gd.visible = u > 0.01; gd.material.opacity = 0.25 + 0.15 * Math.sin(t * 6 + i); });
  // bouton de taux : tourne
  f.knob.rotation.z = -kf(t, [[50.9, 0], [53.7, 4.2, eio], [60, 4.2]]); f.knob.visible = f.knob.visible && t > 50.5 && t < 56.6;
  // barrière "interdit" (frappe à 54.9)
  const bu = eoutBack(lin(54.75, 55.0, t)); f.barrier.scale.y = Math.max(0.001, bu); f.barrier.position.y = 3 * bu; f.barrier.visible = bu > 0.01 && nodesS > 0.05; f.barrier.position.x = lerp(NODES.cb[0], NODES.state[0], 0.5);
}
