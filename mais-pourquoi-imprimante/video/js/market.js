import * as T from "three";
import { billTex, mk, FONT, MONO, glowTex } from "./tex.js";
import { H, kf, lin, sstep, eio, eout, eoutBack, clamp, lerp } from "./util.js";

export const MX = 300;                      // décalage monde du supermarché
const PAL = [0xf4f1e6, 0xd8382c, 0xf2c230, 0x2d6cc0, 0xee8a2b, 0x3aa65c, 0xf0e2b8, 0x8a4fb5];
export const TAGS = [["PAIN", 1.2], ["LAIT", 0.95], ["POMMES", 2.5], ["PÂTES", 1.4], ["CAFÉ", 3.9], ["RIZ", 1.1]];
export const priceMult = (t) => (t < 20.1 ? 1 : t < 20.35 ? 2 : t < 20.6 ? 3.5 : t < 20.85 ? 6 : 9);

function tagCanvas() { const c = document.createElement("canvas"); c.width = 256; c.height = 160; const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace; return { c, tx, last: "" }; }
function drawTag(o, name, price, hot) {
  const s = name + price.toFixed(2); if (s === o.last) return; o.last = s; const g = o.c.getContext("2d");
  g.fillStyle = hot > 0.5 ? "#e8392c" : "#fff4c9"; g.fillRect(0, 0, 256, 160); g.fillStyle = hot > 0.5 ? "#fff" : "#1a1a1a"; g.textAlign = "center";
  g.font = `700 30px ${MONO}`; g.fillText(name, 128, 40); g.font = `900 62px ${FONT}`; g.fillText(price.toFixed(2).replace(".", ","), 118, 112); g.font = `900 34px ${FONT}`; g.fillText("€", 226, 112);
  g.fillRect(14, 126, 228, 6); o.tx.needsUpdate = true;
}

export function buildMarket() {
  const g = new T.Group(); g.position.set(MX, 0, 0); const m = {};
  // sol : damier clair, plafond sombre
  const ft = mk(256, 256, (c) => { c.fillStyle = "#cfd8d2"; c.fillRect(0, 0, 256, 256); c.fillStyle = "#9fb0a6"; c.fillRect(0, 0, 128, 128); c.fillRect(128, 128, 128, 128); }, { repeat: [8, 30] });
  const floor = new T.Mesh(new T.PlaneGeometry(14, 80), new T.MeshLambertMaterial({ map: ft })); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -30); g.add(floor);
  const ceil = new T.Mesh(new T.PlaneGeometry(14, 80), new T.MeshLambertMaterial({ color: 0x1d2622 })); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 5.6, -30); g.add(ceil);
  const endWall = new T.Mesh(new T.PlaneGeometry(14, 6), new T.MeshLambertMaterial({ color: 0x22332c })); endWall.position.set(0, 3, -44); g.add(endWall);
  // rayonnages (planches + fond)
  const shelfM = new T.MeshLambertMaterial({ color: 0xaeb9b3 }), backM = new T.MeshLambertMaterial({ color: 0x1b4a3c });
  const rows = [0.45, 1.35, 2.25, 3.15, 4.05];
  for (const s of [-1, 1]) {
    const back = new T.Mesh(new T.BoxGeometry(0.2, 5.4, 44), backM); back.position.set(s * 3.9, 2.7, -22); g.add(back);
    rows.forEach((y) => { const p = new T.Mesh(new T.BoxGeometry(1.0, 0.09, 44), shelfM); p.position.set(s * 3.4, y, -22); g.add(p); });
    const hdr = new T.Mesh(new T.BoxGeometry(0.2, 0.5, 44), new T.MeshBasicMaterial({ color: s < 0 ? 0xf2c230 : 0x3aa65c })); hdr.position.set(s * 3.0, 5.0, -22); g.add(hdr);
  }
  // produits (boîtes instanciées) — 2 faces x 5 rangées x 40 emplacements
  const per = 40, N = 2 * rows.length * per; const geo = new T.BoxGeometry(1, 1, 1);
  const im = new T.InstancedMesh(geo, new T.MeshLambertMaterial({ color: 0xffffff }), N); const o = new T.Object3D(); const col = new T.Color(); let k = 0;
  for (const s of [-1, 1]) rows.forEach((y, ri) => { for (let j = 0; j < per; j++) { const w = 0.34 + H(k, 1) * 0.12, h = 0.4 + H(k, 2) * 0.36, dz = 0.34 + H(k, 3) * 0.1; o.position.set(s * 3.3, y + 0.045 + h / 2, -1.0 - j * 1.06); o.scale.set(0.7, h, 0.8 * (w + 0.4)); o.updateMatrix(); im.setMatrixAt(k, o.matrix); col.setHex(PAL[Math.floor(H(k, 4) * PAL.length)]); im.setColorAt(k, col); k++; } });
  g.add(im);
  // néons de plafond
  const tubes = new T.InstancedMesh(new T.BoxGeometry(1.6, 0.1, 0.35), new T.MeshBasicMaterial({ color: 0xfff6dc }), 24);
  for (let i = 0; i < 24; i++) { o.position.set(0, 5.5, -2 - i * 3.4); o.scale.set(1, 1, 1); o.updateMatrix(); tubes.setMatrixAt(i, o.matrix); } g.add(tubes);
  g.add(Object.assign(new T.HemisphereLight(0xe9fff2, 0x4a5d52, 1.05), {}));
  const sun = new T.DirectionalLight(0xfff0d0, 0.9); sun.position.set(2, 8, 4); g.add(sun);
  // enseigne
  const sign = mk(512, 128, (c) => { c.fillStyle = "#0d2b20"; c.fillRect(0, 0, 512, 128); c.fillStyle = "#47f0a0"; c.font = `900 70px ${FONT}`; c.textAlign = "center"; c.fillText("SUPERMARCHÉ", 256, 90); });
  const sg = new T.Mesh(new T.PlaneGeometry(7, 1.75), new T.MeshBasicMaterial({ map: sign })); sg.position.set(0, 4.2, -43.9); g.add(sg);

  // étiquettes de prix (rayon gauche, face à l'allée)
  m.tags = TAGS.map(([n, p], i) => { const o2 = tagCanvas(); const mesh = new T.Mesh(new T.PlaneGeometry(1.3, 0.81), new T.MeshBasicMaterial({ map: o2.tx })); mesh.rotation.y = Math.PI / 2;
    mesh.position.set(-2.88, [1.35, 2.25, 3.15, 1.35, 2.25, 3.15][i] - 0.32, -6.2 - [0, 0.2, 0.4, 1.6, 1.8, 2.0][i] * 1.15 * (i < 3 ? 1 : 1)); g.add(mesh); return { o: o2, mesh, n, p }; });
  m.tags.forEach((t, i) => { t.mesh.position.z = -5.4 - (i % 3) * 1.45 - (i >= 3 ? 0 : 0); t.mesh.position.y = [1.1, 2.0, 2.9, 1.1, 2.0, 2.9][i]; if (i >= 3) t.mesh.position.z = -5.4 - (i - 3) * 1.45 - 0.0; });
  m.tags.forEach((t, i) => { if (i >= 3) { t.mesh.position.x = -2.88; t.mesh.position.z = -5.4 - (i - 3) * 1.45; t.mesh.position.y = 1.1 + 0; } });
  // table + accessoires
  const table = new T.Mesh(new T.BoxGeometry(3.6, 0.9, 1.5), new T.MeshLambertMaterial({ color: 0xe4ece6 })); table.position.set(0, 0.45, -8); g.add(table);
  const top = new T.Mesh(new T.BoxGeometry(3.7, 0.08, 1.6), new T.MeshLambertMaterial({ color: 0x2d6cc0 })); top.position.set(0, 0.94, -8); g.add(top);
  m.apple = new T.Mesh(new T.SphereGeometry(0.2, 18, 14), new T.MeshLambertMaterial({ color: 0xd8382c, emissive: 0x300808 })); g.add(m.apple);
  m.bread = new T.Mesh(new T.CylinderGeometry(0.11, 0.11, 1.2, 14), new T.MeshLambertMaterial({ color: 0xd9a05b, emissive: 0x3a2308 })); m.bread.rotation.z = Math.PI / 2; m.bread.rotation.y = 0.3; g.add(m.bread);
  m.milk = new T.Mesh(new T.BoxGeometry(0.3, 0.5, 0.3), new T.MeshLambertMaterial({ color: 0xf4f6ff, emissive: 0x101530 })); g.add(m.milk);
  m.bill = new T.Mesh(new T.PlaneGeometry(1.3, 0.58), new T.MeshBasicMaterial({ map: billTex(), side: T.DoubleSide })); g.add(m.bill);
  // croix rouge "pas comestible"
  m.x = new T.Group(); for (const r of [Math.PI / 4, -Math.PI / 4]) { const b = new T.Mesh(new T.BoxGeometry(1.7, 0.16, 0.06), new T.MeshBasicMaterial({ color: 0xff2a2a })); b.rotation.z = r; m.x.add(b); } g.add(m.x);
  // caisse + sac
  const reg = new T.Mesh(new T.BoxGeometry(0.9, 0.6, 0.8), new T.MeshLambertMaterial({ color: 0x2a3a34 })); reg.position.set(1.35, 1.28, -8); g.add(reg);
  const rs = new T.Mesh(new T.PlaneGeometry(0.62, 0.34), new T.MeshBasicMaterial({ color: 0x47f0a0 })); rs.position.set(1.35, 1.46, -7.58); rs.rotation.x = -0.35; g.add(rs); m.regScreen = rs;
  const bag = new T.Mesh(new T.BoxGeometry(0.6, 0.7, 0.45), new T.MeshLambertMaterial({ color: 0xb98a55 })); bag.position.set(0.75, 1.33, -8.6); g.add(bag); m.bag = bag;
  m.coin = new T.Mesh(new T.CylinderGeometry(0.45, 0.45, 0.1, 32), new T.MeshPhongMaterial({ color: 0xe8b84a, shininess: 100, emissive: 0x3a2800 })); m.coin.rotation.x = Math.PI / 2; g.add(m.coin);
  // piles : produits (fixes) vs argent (qui double)
  m.crates = []; for (let i = 0; i < 6; i++) { const c = new T.Mesh(new T.BoxGeometry(0.7, 0.5, 0.7), new T.MeshLambertMaterial({ color: PAL[(i + 1) % 5 + 1] })); c.position.set(-1.9 + (i % 3) * 0.78, 0.25 + Math.floor(i / 3) * 0.52, -12.2); g.add(c); m.crates.push(c); }
  m.stack = new T.Mesh(new T.BoxGeometry(2.2, 1, 1.1), new T.MeshLambertMaterial({ map: billTex(), color: 0xbfe8c8 })); g.add(m.stack);
  // essaim de billets qui poursuit les produits
  m.swarm = new T.InstancedMesh(new T.PlaneGeometry(0.9, 0.4), new T.MeshBasicMaterial({ map: billTex(), side: T.DoubleSide }), 180); m.swarm.frustumCulled = false; g.add(m.swarm);
  m.goods = new T.Group(); for (let i = 0; i < 6; i++) { const b = new T.Mesh(new T.BoxGeometry(0.45, 0.6, 0.45), new T.MeshLambertMaterial({ color: PAL[i + 1] })); b.position.set(-0.6 + (i % 3) * 0.6, 0.35 + Math.floor(i / 3) * 0.7, 0); m.goods.add(b); } m.goods.position.set(0, 0.75, -16); g.add(m.goods);
  const ped = new T.Mesh(new T.CylinderGeometry(1.4, 1.5, 0.75, 24), new T.MeshLambertMaterial({ color: 0xcfd8d2 })); ped.position.set(0, 0.37, -16); g.add(ped);
  g.userData = m; return g;
}

const o = new T.Object3D();
export function updateMarket(g, t) {
  const m = g.userData;
  // --- table : pomme / pain / lait / billet / croix / caisse (11 -> 13.7) puis pièce vs panier (22.5 -> 24)
  const bill_in = eoutBack(lin(10.9, 11.3, t)); const toReg = eio(lin(12.46, 13.0, t));
  const bx = lerp(-0.2, 1.35, toReg), by = lerp(1.35, 1.7, Math.sin(Math.PI * toReg) * 0.9 + toReg * 0.0) + (toReg > 0 ? 0 : 0) , bz = lerp(-7.7, -7.95, toReg);
  m.bill.position.set(bx, by + (1 - bill_in) * 1.5, bz); m.bill.rotation.set(-0.25 + toReg * 0.6, lerp(0.2, 0, toReg), toReg * 0.9); m.bill.scale.setScalar(Math.max(0.001, bill_in) * (1.5 - 0.7 * toReg) * (t > 13.1 ? Math.max(0, 1 - lin(13.1, 13.35, t)) : 1));
  const xk = eoutBack(lin(11.9, 12.15, t)) * (t < 12.5 ? 1 : Math.max(0, 1 - lin(12.46, 12.7, t)));
  m.x.position.set(-0.2, 1.35, -7.5); m.x.scale.setScalar(Math.max(0.001, xk) * 1.2); m.x.visible = xk > 0.01;
  const hop = lin(12.9, 13.25, t);
  const appleBase = [-1.1, 1.2, -8.1], appleBag = [0.75, 1.9, -8.6];
  const tr = t < 22.5 ? 0 : 1;
  m.apple.position.set(lerp(appleBase[0], appleBag[0], eio(hop)), lerp(appleBase[1], appleBag[1], eio(hop)) + Math.sin(Math.PI * hop) * 0.9, lerp(appleBase[2], appleBag[2], eio(hop)));
  // pièce + panier (22.6 : "chaque euro achète moins")
  const lose = (a, b) => 1 - eoutBack(lin(a, b, t));
  m.bread.position.set(-0.45, 1.1, -8.05); m.milk.position.set(0.2, 1.22, -8.0);
  m.bread.scale.setScalar(t > 22.5 ? Math.max(0.001, lose(23.1, 23.3)) : 1); m.milk.scale.setScalar(t > 22.5 ? Math.max(0.001, lose(22.78, 22.98)) : 1);
  if (t > 22.5) { m.apple.position.set(-1.1, 1.18, -8.1); m.apple.scale.setScalar(lerp(1, 0.55, eio(lin(23.5, 23.8, t)))); } else m.apple.scale.setScalar(1);
  m.coin.position.set(-1.4 + 0, 1.45, -7.4); m.coin.rotation.set(Math.PI / 2, 0, t * 2.2); m.coin.visible = t > 22.4 && t < 25;
  m.coin.scale.setScalar(t > 22.4 ? eoutBack(lin(22.4, 22.7, t)) : 0.001);
  m.bag.visible = true;
  m.regScreen.material.color.setHex(t > 13 && t < 13.6 ? 0xe8b84a : 0x47f0a0);
  // --- piles produits vs argent (13.8 -> 16.9)
  const gcount = kf(t, [[14.3, 0.2], [14.9, 1.6, eout], [15.6, 3.2, eout], [16.1, 6.4, eout], [16.8, 12, eout]]);
  m.stack.scale.set(1, Math.max(0.01, gcount * 0.5), 1); m.stack.position.set(1.4, Math.max(0.01, gcount * 0.5) / 2, -12.2);
  m.crates.forEach((c) => { c.visible = t > 13.9 && t < 21; });
  m.stack.visible = t > 14.2 && t < 20.2;
  // --- essaim (16.84 -> 19.9)
  const sw = m.swarm; let n = 0; const ts = t - 16.84; if (ts > 0 && t < 20.4) for (let k = 0; k < 180; k++) {
    const u = (ts * 0.42 + H(k, 1)) % 1; const ang = H(k, 2) * 6.28 + ts * (1.5 + H(k, 3)); const r = lerp(2.6, 0.9, eout(u)) * (0.6 + H(k, 4) * 0.7);
    const z = lerp(-1.5, -15.6, u); o.position.set(Math.cos(ang) * r * 0.9, 1.2 + Math.sin(ang) * r * 0.6 + H(k, 5) * 0.6, z); o.rotation.set(ts * 3 + k, ang, ts * 2); o.scale.setScalar(sstep(0, 0.1, u) * (1 - sstep(0.92, 1, u)) + 0.001); o.updateMatrix(); sw.setMatrixAt(n++, o.matrix);
  }
  sw.count = n; sw.instanceMatrix.needsUpdate = true;
  m.goods.visible = t > 16.3 && t < 20.5; m.goods.rotation.y = t * 0.3;
  // --- étiquettes de prix
  const mult = priceMult(t); const pop = kf(t, [[20.08, 0], [20.1, 1], [20.3, 0], [20.35, 1], [20.55, 0], [20.6, 1], [20.8, 0], [20.85, 1], [21.05, 0]]);
  m.tags.forEach((tg, i) => { drawTag(tg.o, tg.n, tg.p * mult, mult > 1 ? 1 : 0); tg.mesh.scale.setScalar(1 + 0.35 * pop * (i % 2 ? 1 : 0.8)); });
}
