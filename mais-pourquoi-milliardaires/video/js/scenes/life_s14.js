// Module « life » — scène 14 : « Des millions de personnes pourraient enfin payer leurs factures et améliorer leur quotidien. »
// Décor : la table du bénéficiaire (raccord avec le module wealth), une foule douce instanciée, une facture qui devient « RÉGLÉE »,
// un panier qui se remplit, un loyer payé, un bus (service/école) puis un intérieur plus confortable qui se construit autour de la table.
import { T, PAL, SKIN, CLOTH, M, MB, mesh, bx, cy, sp, glowSprite, kf, eio, eout, eoutBack, sstep, lin, H, lerp,
  person, table, chair, bread, milk, houseMini, tableLamp, invoice, stampTool, bus, wallPanel, plant, frame, floorLamp, texFloor, texWall, texSky, texArt, mk, texCheck, texTiles } from "./life_kit.js";
import { windowsOf, onset } from "../plan.js";

export const ZS = -80;
const [a14, b14] = windowsOf("life")[1];
const o14 = (re, k = 0) => onset(14, re, k);
const T14 = { millions: o14(/^millions$/), de: o14(/^de$/), personnes: o14(/^personnes$/), pourraient: o14(/^pourraient$/), enfin: o14(/^enfin$/), payer: o14(/^payer$/), leurs: o14(/^leurs$/), factures: o14(/^factures$/), et: o14(/^et$/), ameliorer: o14(/^améliorer$/), leur: o14(/^leur$/), quotidien: o14(/^quotidien$/) };
export const BENEFICIARY = { skin: 0xcf9468, shirt: 0x2a9d8f, hair: 0x1a120c, style: "bun" };
const TOP = 0.872, BX = -13;
const pop = (t, t0, d = 0.32) => eoutBack(lin(t0, t0 + d, t));
const setS = (o, s) => { o.visible = s > 0.003; o.scale.setScalar(Math.max(1e-4, s)); };
const mixHex = (a, b, u) => { const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255, br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255; return ((ar + (br - ar) * u) << 16) | ((ag + (bg - ag) * u) << 8) | (ab + (bb - ab) * u); };
const keyHex = (t, keys) => { if (t <= keys[0][0]) return keys[0][1]; for (let i = 0; i < keys.length - 1; i++) { const [t0, c0] = keys[i], [t1, c1] = keys[i + 1]; if (t < t1) return mixHex(c0, c1, eio((t - t0) / (t1 - t0))); } return keys[keys.length - 1][1]; };
const rise = (obj, parent) => { const w = new T.Group(); w.position.set(obj.position.x, 0, obj.position.z); obj.position.set(0, obj.position.y, 0); w.add(obj); parent.add(w); return w; };

export function buildS14(root, fx) {
  const g = new T.Group(); g.position.set(0, 0, ZS); root.add(g); const S = { g };
  const { sparks, flashes, blob } = fx;
  const ground = mesh(new T.CircleGeometry(95, 48), M(0x7a5a46), 0, -0.01, 0, g); ground.rotation.x = -Math.PI / 2;
  { const tt = texTiles().clone(); tt.needsUpdate = true; tt.wrapS = tt.wrapT = T.RepeatWrapping; tt.repeat.set(5, 5); mesh(new T.CylinderGeometry(6.2, 6.2, 0.01, 48), new T.MeshLambertMaterial({ map: tt }), 0, 0.005, 0.4, g); }
  const sun = glowSprite(0xffa850, 70, 0.4); sun.material.fog = false; sun.position.set(0, 12, -70); g.add(sun); S.sun = sun;
  // ciel de fin de journée (dégradé) derrière tout
  const skyT = mk(8, 256, (c2, w, h) => { const gr = c2.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#3a2a46"); gr.addColorStop(0.35, "#a8584a"); gr.addColorStop(0.62, "#ffb066"); gr.addColorStop(0.8, "#ffd9a0"); gr.addColorStop(1, "#ffcf8a"); c2.fillStyle = gr; c2.fillRect(0, 0, w, h); });
  const skyM = new T.MeshBasicMaterial({ map: skyT, fog: false }); const skyP = new T.Mesh(new T.PlaneGeometry(520, 200), skyM); skyP.position.set(-20, 78, -110); g.add(skyP); S.skyM = skyM;
  // foule lointaine : trois bandeaux de silhouettes (3 quads) pour l'infini
  const farT = mk(1024, 192, (c2, w, h) => { for (let i = 0; i < 330; i++) { const x = H(i, 41) * w, sc = 0.7 + H(i, 42) * 0.5, bh = 70 * sc, bw = 22 * sc; const y0 = h - H(i, 43) * 26; c2.fillStyle = "#" + CLOTH[Math.floor(H(i, 44) * 8)].toString(16).padStart(6, "0"); c2.beginPath(); c2.roundRect(x - bw / 2, y0 - bh, bw, bh, bw * 0.45); c2.fill(); c2.fillStyle = "#" + SKIN[Math.floor(H(i, 45) * 6)].toString(16).padStart(6, "0"); c2.beginPath(); c2.arc(x, y0 - bh - bw * 0.42, bw * 0.46, 0, 7); c2.fill(); c2.fillStyle = "rgba(40,22,12,.8)"; c2.beginPath(); c2.arc(x, y0 - bh - bw * 0.55, bw * 0.46, Math.PI, 0); c2.fill(); } });
  S.far = []; [[-34, 96], [-39.5, 118], [-46, 144]].forEach(([z, w], i) => { const tx = farT.clone(); tx.needsUpdate = true; tx.wrapS = T.RepeatWrapping; tx.repeat.set(w / 26, 1); tx.offset.set(i * 0.37, 0); const m = new T.Mesh(new T.PlaneGeometry(w, 5), new T.MeshBasicMaterial({ map: tx, transparent: true, alphaTest: 0.5 })); m.position.set(i * 7 - 7, 2.3, z); m.userData.z = z; g.add(m); S.far.push(m); });
  // quartier derrière l'arrêt de bus : maisons à fenêtres allumées
  { const wall = [0xf0e0c4, 0xeab98f, 0xc9d9c2, 0xd7cdb8, 0xe6c3a8, 0xcfd9df, 0xf2d7a8]; for (let i = 0; i < 7; i++) { const x = -31 + i * 3.45 + H(i, 51) * 0.4, h2 = 2.8 + H(i, 52) * 1.5, z = -5.2 - (i % 2) * 0.9; bx(3.3, h2, 3, M(wall[i % 7]), x, h2 / 2, z, g); const rf = mesh(new T.ConeGeometry(2.7, 1.5, 4), M([0xb5503a, 0x8a4a3a, 0x6a4a5a][i % 3]), x, h2 + 0.75, z, g); rf.rotation.y = Math.PI / 4; rf.scale.z = 0.95;
      for (const wx of [-0.8, 0.8]) bx(0.55, 0.7, 0.05, MB(H(i * 3 + (wx > 0 ? 1 : 0), 53) > 0.3 ? 0xffd48a : 0x6a5a4a), x + wx, 1.6, z + 1.52, g); bx(0.6, 1.2, 0.05, M(0x6a3b1f), x, 0.6, z + 1.52, g); } }
  { const pole = cy(0.05, 0.06, 4.2, M(0x3a3a3e), BX + 4.4, 2.1, 3.3, g, 8); sp(0.2, MB(0xfff0c0), BX + 4.4, 4.35, 3.3, g, 8, 6); const lg = glowSprite(0xffc070, 3.4, 0.55); lg.position.set(BX + 4.4, 4.3, 3.45); g.add(lg); }

  /* ---- table du bénéficiaire ---- */
  const tbl = table(2.3, 1.15, 0.86); tbl.position.set(0, 0, 0.15); g.add(tbl);
  const chr = chair(0x8b5a33); chr.position.set(0, 0, -0.98); g.add(chr);
  const ben = person({ ...BENEFICIARY }); ben.userData.s0 = ben.scale.x; ben.position.set(0, -0.22, -0.9); g.add(ben); S.ben = ben;
  blob(g, 0, -0.9, 0.5);
  // facture centrale (électricité) : « À PAYER » -> « RÉGLÉE »
  const inv1 = invoice("elec", 0.8); inv1.g.position.set(0.0, TOP + 0.004, 0.55); inv1.g.rotation.x = -(Math.PI / 2 - 0.5); g.add(inv1.g); S.inv1 = inv1;
  const tool1 = stampTool(); tool1.rotation.x = Math.PI / 2; tool1.scale.setScalar(0.8); tool1.position.set(0.04, inv1.h * 0.3, 1.0); inv1.g.add(tool1); S.tool1 = tool1;
  // loyer : maison miniature + facture « LOYER »
  const hs = houseMini(); hs.position.set(-0.82, TOP, -0.22); hs.scale.setScalar(1.05); g.add(hs); S.house = hs;
  const inv2 = invoice("loyer", 0.5); inv2.g.position.set(-0.71, TOP + 0.004, 0.62); inv2.g.rotation.x = -(Math.PI / 2 - 0.5); g.add(inv2.g); S.inv2 = inv2;
  const tool2 = stampTool(); tool2.rotation.x = Math.PI / 2; tool2.scale.setScalar(0.5); tool2.position.set(0.03, inv2.h * 0.3, 0.7); inv2.g.add(tool2); S.tool2 = tool2;
  const chk = new T.Mesh(new T.PlaneGeometry(0.2, 0.2), new T.MeshBasicMaterial({ map: texCheck(), transparent: true, depthWrite: false })); chk.position.set(-0.82, TOP + 0.66, -0.15); g.add(chk); S.chk = chk;
  // panier
  const bsk = new T.Group(); bsk.position.set(0.76, TOP, 0.3); g.add(bsk);
  { const wk = new T.MeshLambertMaterial({ color: 0xb98a52, side: T.DoubleSide }); mesh(new T.CylinderGeometry(0.31, 0.24, 0.24, 18, 1, true), wk, 0, 0.12, 0, bsk); cy(0.24, 0.24, 0.02, M(0x8a6234), 0, 0.01, 0, bsk, 16);
    const rim = mesh(new T.TorusGeometry(0.31, 0.02, 6, 20), M(0x8a6234), 0, 0.24, 0, bsk); rim.rotation.x = Math.PI / 2; const hd = mesh(new T.TorusGeometry(0.3, 0.018, 6, 20, Math.PI), M(0x8a6234), 0, 0.24, 0, bsk); hd.rotation.y = Math.PI / 2; for (let i = 0; i < 3; i++) { const b = mesh(new T.TorusGeometry(0.28 - i * 0.015, 0.008, 4, 18), M(0x946a3a), 0, 0.06 + i * 0.07, 0, bsk); b.rotation.x = Math.PI / 2; } }
  const bi = []; const mkB = (o, x, y, z, t0) => { o.userData.rest = [x, y, z]; o.userData.t0 = t0; bsk.add(o); bi.push(o); return o; };
  { const b = bread(); b.scale.setScalar(0.62); mkB(b, -0.02, 0.08, 0.02, T14.factures + 0.02);
    const mk2 = milk(); mk2.scale.setScalar(0.85); mkB(mk2, 0.12, 0.1, -0.1, T14.factures + 0.13);
    const ap = new T.Group(); sp(0.075, M(0xd9342b), 0, 0.075, 0, ap, 10, 8); sp(0.075, M(0x8cc63f), 0.13, 0.075, 0.04, ap, 10, 8); sp(0.07, M(0xf08a1c), 0.05, 0.07, 0.14, ap, 10, 8); mkB(ap, -0.15, 0.1, 0.1, T14.factures + 0.24);
    const vg = new T.Group(); const c1 = mesh(new T.ConeGeometry(0.04, 0.3, 8), M(0xf08a1c), 0, 0.2, 0, vg); c1.rotation.x = Math.PI; c1.rotation.z = 0.35; sp(0.09, M(0x3f9d3f), 0.12, 0.15, 0.0, vg, 10, 8); sp(0.05, M(0x3f9d3f), 0.0, 0.36, 0.0, vg, 6, 5).scale.set(1, 1.4, 1); mkB(vg, 0.02, 0.1, 0.0, T14.factures + 0.35); }
  S.basketItems = bi; S.bsk = bsk;
  // lampe de table + tasse
  const tl = tableLamp(); tl.position.set(1.0, TOP, -0.3); g.add(tl); S.tl = tl; const tlGlow = glowSprite(0xffc070, 2.2, 0); tlGlow.position.set(1.0, TOP + 0.4, -0.3); g.add(tlGlow); S.tlGlow = tlGlow;
  { const mug = new T.Group(); cy(0.055, 0.05, 0.1, M(0xf3ecd4), 0, 0.05, 0, mug, 12); const hd = mesh(new T.TorusGeometry(0.035, 0.01, 6, 10), M(0xf3ecd4), 0.06, 0.05, 0, mug); mug.position.set(0.52, TOP, 0.0); g.add(mug); }

  /* ---- la foule douce (instances) ---- */
  const crowd = []; for (let r = 0; r < 18; r++) { const z = -4.4 - r * 1.55, W = 3.4 + 0.55 * (-z); for (let x = -W; x <= W; x += 1.75) { const i = crowd.length; crowd.push({ x: x + (H(i, 1) - 0.5) * 0.7, z: z + (H(i, 2) - 0.5) * 0.6, child: H(i, 3) < 0.24, ph: H(i, 4) * 6.28, ci: Math.floor(H(i, 5) * 8), si: Math.floor(H(i, 6) * 6) }); } }
  const N = crowd.length; S.crowdN = N;
  const bodyG = new T.CapsuleGeometry(0.25, 0.8, 1, 6); bodyG.translate(0, 0.72, 0);
  const headG = new T.SphereGeometry(0.21, 7, 5); headG.translate(0, 1.58, 0); { const pos = headG.attributes.position, col = []; for (let k = 0; k < pos.count; k++) { const hair = pos.getY(k) > 1.64 || pos.getZ(k) < -0.08 ? 0.3 : 1; col.push(hair, hair, hair); } headG.setAttribute("color", new T.Float32BufferAttribute(col, 3)); }
  const bodies = new T.InstancedMesh(bodyG, new T.MeshLambertMaterial({ color: 0xffffff }), N), heads = new T.InstancedMesh(headG, new T.MeshLambertMaterial({ color: 0xffffff, vertexColors: true }), N);
  const c = new T.Color(); crowd.forEach((p, i) => { c.setHex(CLOTH[p.ci]); c.multiplyScalar(0.8 + H(i, 8) * 0.3); bodies.setColorAt(i, c); c.setHex(SKIN[p.si]); heads.setColorAt(i, c); p.d = Math.hypot(p.x, p.z); });
  bodies.frustumCulled = false; heads.frustumCulled = false; g.add(bodies, heads); S.bodies = bodies; S.heads = heads; S.crowd = crowd; S.o = new T.Object3D();
  // lueurs au sol sous quelques familles + lucioles
  const gm = new T.MeshBasicMaterial({ color: 0xffb860, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false }); S.groundGlow = gm;
  for (let i = 0; i < 16; i++) { const p = crowd[Math.floor(H(i, 21) * N)]; const m = mesh(new T.CircleGeometry(1.5, 20), gm, p.x, 0.04, p.z, g); m.rotation.x = -Math.PI / 2; }
  { const n = 140, pos = new Float32Array(n * 3), col = new Float32Array(n * 3); const geo = new T.BufferGeometry(); geo.setAttribute("position", new T.BufferAttribute(pos, 3)); geo.setAttribute("color", new T.BufferAttribute(col, 3));
    const pts = new T.Points(geo, new T.PointsMaterial({ size: 0.11, map: sun.material.map, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); pts.frustumCulled = false; g.add(pts); S.motes = { pos, col, n, geo }; }

  /* ---- arrêt de bus : le service (transport / école) ---- */
  const busG = new T.Group(); const bsm = bus(); busG.add(bsm); g.add(busG); S.bus = busG; S.busM = bsm;
  mesh(new T.BoxGeometry(11, 0.14, 4.2), new T.MeshLambertMaterial({ map: texTiles() }), BX + 0.5, 0.07, 3.1, g); bx(11, 0.16, 0.25, M(0xd8cdb8), BX + 0.5, 0.08, 5.3, g); for (let i = 0; i < 9; i++) bx(1.1, 0.02, 0.18, M(0xf0e8d0), BX - 4.5 + i * 2.2, 0.011, 8.6, g);
  { cy(0.05, 0.05, 2.8, M(0x666b6e), BX - 1.9, 1.4, 4.3, g, 8); const sg = new T.Mesh(new T.CircleGeometry(0.4, 18), new T.MeshBasicMaterial({ map: mk(128, 128, (c2) => { c2.fillStyle = "#2d6cc0"; c2.fillRect(0, 0, 128, 128); c2.fillStyle = "#fff"; c2.fillRect(28, 34, 72, 46); c2.fillStyle = "#2d6cc0"; c2.fillRect(34, 40, 60, 20); c2.fillStyle = "#fff"; c2.beginPath(); c2.arc(44, 88, 8, 0, 7); c2.arc(84, 88, 8, 0, 7); c2.fill(); }) })); sg.position.set(BX - 1.9, 2.75, 4.36); g.add(sg); }
  const kid = person({ skin: SKIN[2], shirt: 0xe0453a, pants: 0x3a4a6a, hair: 0x1a120c, style: "pigtails", kind: "child", scale: 1.15, pack: 0x2d6cc0 }); kid.userData.s0 = kid.scale.x; g.add(kid); S.kid = kid;
  const mum2 = person({ skin: SKIN[2], shirt: 0x2a9d8f, hair: 0x1a120c, style: "bun", dress: 0x3a6ea5, scale: 1.0 }); mum2.userData.s0 = mum2.scale.x; g.add(mum2); S.mum2 = mum2;

  /* ---- intérieur confortable : se construit autour de la table ---- */
  const K = []; const kg = new T.Group(); g.add(kg);
  const addK = (obj, t0, mode = "up", d = 0.34) => { let o = obj; if (mode === "up") o = rise(obj, kg); else kg.add(obj); o.userData.k = { t0, mode, d, sy: o.scale.y, sx: o.scale.x }; K.push(o); return o; };
  const kFloor = mesh(new T.PlaneGeometry(6.6, 6.4), new T.MeshLambertMaterial({ map: texFloor([1.7, 1.7]) }), 0, 0.016, 0.2); kFloor.rotation.x = -Math.PI / 2; addK(kFloor, T14.ameliorer + 0.36, "fade");
  const rug = cy(1.9, 1.9, 0.02, M(0xc0654a), 0, 0.03, 0.2, null, 36); cy(1.45, 1.45, 0.024, M(0xe9ae62), 0, 0.001, 0, rug, 36); cy(1.1, 1.1, 0.028, M(0xc0654a), 0, 0.002, 0, rug, 36); addK(rug, T14.ameliorer + 0.4, "up", 0.3);
  const bw = wallPanel(6.6, 7, 0xffffff, 0x7a5a48, texWall("#f2dcc0", "#e6c9a4", [7, 1])); bw.position.set(0, 0, -3.0); addK(bw, T14.ameliorer + 0.38, "wall");
  const wains = bx(6.6, 1.05, 0.1, M(0x2f7a6c), 0, 0.525, -2.94, null); addK(wains, T14.ameliorer + 0.42, "up", 0.3); const rail = bx(6.6, 0.06, 0.13, M(0xf3e6c8), 0, 1.08, -2.93); addK(rail, T14.ameliorer + 0.44, "up", 0.3);
  for (const sx of [-1, 1]) { const sw = wallPanel(6.4, 7, 0xffffff, 0x6a4a38, texWall("#ecd0aa", "#e0bf92", [6, 1])); sw.position.set(sx * 3.3, 0, 0.2); sw.rotation.y = -sx * Math.PI / 2; addK(sw, T14.ameliorer + 0.4, "wall"); }
  { const wg = new T.Group(); bx(1.4, 1.7, 0.08, M(0xf5ead2), 0, 0, 0, wg); const sk = new T.Mesh(new T.PlaneGeometry(1.2, 1.5), new T.MeshBasicMaterial({ map: texSky() })); sk.position.z = 0.05; wg.add(sk); bx(0.05, 1.5, 0.04, M(0xf5ead2), 0, 0, 0.07, wg); bx(1.2, 0.05, 0.04, M(0xf5ead2), 0, 0, 0.07, wg);
    bx(0.3, 1.9, 0.1, M(0xd9a05b), -0.82, -0.05, 0.1, wg); bx(0.3, 1.9, 0.1, M(0xd9a05b), 0.82, -0.05, 0.1, wg); bx(2.0, 0.05, 0.05, M(0x5a3a1c), 0, 0.98, 0.1, wg); wg.position.set(-0.8, 2.55, -2.9); addK(wg, T14.ameliorer + 0.5, "pop"); }
  { const f1 = frame(texArt("#ffd9a0", "#f29f5c", "#fff0b0"), 0.55, 0.7); f1.position.set(0.85, 2.75, -2.9); addK(f1, T14.ameliorer + 0.55, "pop"); const f2 = frame(texArt("#bfe9dc", "#7ccfb6", "#fff3b0"), 0.44, 0.54); f2.position.set(1.45, 2.2, -2.9); addK(f2, T14.ameliorer + 0.6, "pop"); }
  { const sh = new T.Group(); bx(1.1, 0.05, 0.3, M(0xb9824f), 0, 0, 0, sh); [[0xe0453a, -0.35, 0.3], [0x2d6cc0, -0.27, 0.26], [0xf2c230, -0.19, 0.32]].forEach(([c2, x, h]) => bx(0.07, h, 0.2, M(c2), x, h / 2 + 0.025, 0, sh)); cy(0.07, 0.05, 0.2, M(0xd98f3a), 0.25, 0.125, 0, sh, 10); sp(0.1, M(0x3f9d3f), 0.25, 0.32, 0, sh, 8, 6); sh.position.set(1.3, 1.62, -2.78); addK(sh, T14.ameliorer + 0.62, "pop"); }
  const fl = floorLamp(); fl.position.set(1.75, 0, -2.2); addK(fl, T14.ameliorer + 0.5, "up", 0.34); S.floorLamp = fl; const flGlow = glowSprite(0xffc070, 4.4, 0); flGlow.position.set(1.75, 1.7, -2.0); g.add(flGlow); S.flGlow = flGlow;
  const pa = plant(1.8); pa.position.set(-1.5, 0, -2.3); addK(pa, T14.ameliorer + 0.5, "up", 0.4); const pb = plant(1.15, 0xd98f3a, 0x4ca64a); pb.position.set(1.6, 0, -0.9); addK(pb, T14.ameliorer + 0.58, "up", 0.4); const pc = plant(0.8, 0xa84a3a, 0x58b24a, 7); pc.position.set(-1.45, 0, -0.5); addK(pc, T14.ameliorer + 0.64, "up", 0.4);
  // guirlande lumineuse
  S.bulbs = []; for (let i = 0; i < 13; i++) { const x = -2.6 + i * 0.43, y = 3.55 - 0.32 * Math.sin((i / 12) * Math.PI); const b = sp(0.055, MB(0xffe7a8), x, y, -2.82, g, 6, 5); S.bulbs.push(b); const gl = glowSprite(0xffc870, 0.7, 0); gl.position.set(x, y, -2.78); g.add(gl); b.userData.gl = gl; b.userData.t0 = T14.ameliorer + 0.56 + i * 0.02; }
  S.K = K;
  /* ---- étincelles de la scène ---- */
  sparks.add(T14.payer + 0.04, [0.1, TOP + 0.5, 0.2], { n: 26, col: 0x5dffb0, speed: 2.0, life: 0.9, up: 1.2 }); flashes.add(T14.payer + 0.02, [0.1, TOP + 0.55, 0.3], 3.8, 0x5dffb0, 0.55, 0.85);
  sparks.add(T14.factures + 0.5, [-0.7, TOP + 0.4, 0.4], { n: 16, col: 0x5dffb0, speed: 1.4, life: 0.8, up: 1.2 }); flashes.add(T14.factures + 0.48, [-0.78, TOP + 0.55, 0.0], 2.8, 0x5dffb0, 0.5, 0.8);
  bi.forEach((o) => { sparks.add(o.userData.t0 + 0.1, [0.76 + o.userData.rest[0], TOP + 0.3, 0.3 + o.userData.rest[2]], { n: 8, col: 0xffe6a0, speed: 0.9, life: 0.6, up: 1.3 }); });
  sparks.add(T14.ameliorer + 0.02, [BX + 2.0, 1.9, 1.4], { n: 18, col: 0xffe6a0, speed: 1.5, life: 0.9 }); flashes.add(T14.ameliorer + 0.0, [BX + 2.0, 2.1, 1.5], 3.4, 0xffd27a, 0.6, 0.8);
  sparks.add(T14.ameliorer + 0.5, [BX + 0.8, 1.9, 0.9], { n: 14, col: 0xffe6a0, speed: 1.2, life: 0.8 });
  sparks.add(T14.quotidien + 0.0, [1.2, 2.1, -1.4], { n: 34, col: 0xffd27a, speed: 2.4, life: 1.2, up: 0.9, g: 1.0 }); sparks.add(T14.quotidien + 0.04, [-1.0, 2.4, -1.4], { n: 22, col: 0xfff0c0, speed: 1.8, life: 1.1, up: 0.9, g: 1.0 }); flashes.add(T14.quotidien - 0.02, [1.75, 1.7, -2.0], 6, 0xffc070, 0.9, 0.8);
  S.veilOpacity = (t) => { const u = 1 - Math.abs(t - (T14.quotidien - 0.04)) / 0.2; return u > 0 ? 0.5 * u * u : 0; };
  return S;
}

const COZY = T14.ameliorer + 0.34;
export function updateS14(S, t, U) {
  const o = S.o;
  // bénéficiaire (même personne que dans le module wealth)
  const ben = S.ben, bs = Math.sin(t * 2.2);
  ben.position.y = -0.22 + 0.012 * bs; ben.rotation.y = 0.06 * Math.sin(t * 0.9); ben.rotation.x = 0.05 + 0.05 * sstep(a14, a14 + 0.4, t) * (1 - sstep(T14.pourraient - 0.2, T14.pourraient, t));
  const tcP = T14.payer + 0.02; const yay = lin(tcP, tcP + 0.08, t) * (1 - lin(tcP + 0.5, tcP + 0.85, t));
  const rest = lin(a14, a14 + 0.05, t) * 0;
  ben.userData.legL.rotation.x = -1.5; ben.userData.legR.rotation.x = -1.5;
  const watch = 1 - yay;
  ben.userData.armL.rotation.set(-1.2 * watch - 2.5 * yay, 0, 0.3 * watch - 0.45 * yay); ben.userData.armR.rotation.set(-1.2 * watch - 2.5 * yay, 0, -0.3 * watch + 0.45 * yay);
  // foule : apparition en vague, du plus proche au plus lointain
  const N = S.crowdN; const popAll = 1;
  for (let i = 0; i < N; i++) {
    const p = S.crowd[i]; const t0 = T14.millions - 0.12 + p.d * 0.0095; const k = pop(t, t0, 0.34); const s = (p.child ? 0.62 : 0.9 + H(i, 9) * 0.18) * Math.max(0, k);
    const sway = Math.sin(t * 1.8 + p.ph) * 0.04; const bob = Math.abs(Math.sin(t * 2.6 + p.ph)) * 0.035;
    o.position.set(p.x, bob * (p.child ? 0.8 : 1), p.z); o.rotation.set(0, Math.sin(p.ph) * 0.5, sway); o.scale.set(s, s * (1 + 0.02 * Math.sin(t * 3 + p.ph)), s); if (s < 0.002) o.scale.set(1e-4, 1e-4, 1e-4); o.updateMatrix(); S.bodies.setMatrixAt(i, o.matrix); S.heads.setMatrixAt(i, o.matrix);
  }
  S.bodies.instanceMatrix.needsUpdate = true; S.heads.instanceMatrix.needsUpdate = true;
  S.groundGlow.opacity = 0.2 * pop(t, T14.millions + 0.0, 0.5) * (1 - sstep(COZY - 0.1, COZY + 0.2, t));
  // lucioles chaudes
  { const m = S.motes; for (let i = 0; i < m.n; i++) { const a = H(i, 31) * 6.283, r = 2 + H(i, 32) * 22; m.pos[i * 3] = Math.cos(a) * r * 0.9 + Math.sin(t * 0.6 + i) * 0.4; m.pos[i * 3 + 1] = 0.6 + ((H(i, 33) * 5 + t * (0.25 + H(i, 34) * 0.3)) % 5); m.pos[i * 3 + 2] = -3 - Math.abs(Math.sin(a)) * r * 1.2; const f = pop(t, T14.millions + 0.1, 0.5) * (0.5 + 0.5 * Math.sin(t * 3 + i)) * 0.7; m.col[i * 3] = 1 * f; m.col[i * 3 + 1] = 0.78 * f; m.col[i * 3 + 2] = 0.42 * f; } m.geo.attributes.position.needsUpdate = true; m.geo.attributes.color.needsUpdate = true; }
  S.sun.material.opacity = (0.42 + 0.2 * sstep(T14.pourraient, b14, t)) * (0.55 + 0.45 * sstep(T14.millions + 0.1, T14.pourraient, t));

  // facture 1 : À PAYER -> RÉGLÉE
  const i1 = S.inv1, tc = T14.payer + 0.02, st1 = t >= tc;
  const tr = t < tc ? 0.7 * Math.pow(1 - lin(tc - 0.3, tc, t), 1.6) : 0.7 * eout(lin(tc + 0.05, tc + 0.2, t)); const tx1 = t < tc ? 0 : 0.5 * eout(lin(tc + 0.05, tc + 0.2, t));
  S.tool1.position.set(0.04 + tx1, i1.h * 0.3, 0.04 + tr); S.tool1.scale.setScalar(0.8 * (t < tc ? 1 : 1 - 0.9 * lin(tc + 0.1, tc + 0.2, t))); S.tool1.visible = t >= tc - 0.31 && t < tc + 0.2;
  i1.tag.scale.setScalar(Math.max(1e-4, st1 ? 1 - lin(tc, tc + 0.1, t) : 1)); i1.tag.visible = !st1 || t < tc + 0.1;
  i1.stamp.scale.setScalar(Math.max(1e-4, st1 ? 1 + 0.9 * (1 - eout(lin(tc, tc + 0.18, t))) : 0)); i1.stamp.visible = st1;
  const ck1 = st1 ? pop(t, tc + 0.08, 0.26) : 0; i1.check.scale.setScalar(Math.max(1e-4, ck1)); i1.check.visible = ck1 > 0.01;
  i1.paper.position.z = st1 && t < tc + 0.12 ? -0.02 * Math.sin(lin(tc, tc + 0.12, t) * Math.PI) : 0;
  i1.g.position.y = TOP + 0.004 + (st1 ? 0.03 * Math.exp(-(t - tc) * 8) * Math.abs(Math.sin((t - tc) * 14)) : 0);
  // facture 2 (loyer) : réglée juste après, la maison s'éclaire
  const i2 = S.inv2, tc2 = T14.factures + 0.42, st2 = t >= tc2;
  const tr2 = t < tc2 ? 1.0 * Math.pow(1 - lin(tc2 - 0.26, tc2, t), 1.6) : 1.0 * eout(lin(tc2 + 0.06, tc2 + 0.26, t));
  S.tool2.position.z = 0.04 + tr2; S.tool2.visible = t >= tc2 - 0.27 && t < tc2 + 0.3;
  i2.tag.scale.setScalar(Math.max(1e-4, st2 ? 1 - lin(tc2, tc2 + 0.1, t) : 1)); i2.tag.visible = !st2 || t < tc2 + 0.1;
  i2.stamp.scale.setScalar(Math.max(1e-4, st2 ? 1 + 0.9 * (1 - eout(lin(tc2, tc2 + 0.18, t))) : 0)); i2.stamp.visible = st2;
  const ck2 = st2 ? pop(t, tc2 + 0.08, 0.26) : 0; i2.check.scale.setScalar(Math.max(1e-4, ck2)); i2.check.visible = ck2 > 0.01;
  S.chk.scale.setScalar(Math.max(1e-4, ck2)); S.chk.visible = ck2 > 0.01; S.chk.position.y = TOP + 0.66 + 0.03 * Math.sin(t * 4);
  S.house.scale.setScalar(1.05 * (1 + (st2 ? 0.14 * Math.max(0, Math.sin((t - tc2) * 12)) * Math.exp(-(t - tc2) * 6) : 0)));
  // panier : se remplit au rythme des mots
  for (const b of S.basketItems) {
    const t0 = b.userData.t0, rst = b.userData.rest, s = t < t0 ? 0 : pop(t, t0, 0.2), fall = 1 - eout(lin(t0, t0 + 0.2, t)); const bounce = t > t0 + 0.14 ? 0.03 * Math.abs(Math.sin((t - t0 - 0.14) * 16)) * Math.exp(-(t - t0 - 0.14) * 6) : 0;
    b.position.set(rst[0], rst[1] + 0.5 * fall + bounce, rst[2]); const base = b.userData.base ?? (b.userData.base = b.scale.x); b.scale.setScalar(Math.max(1e-4, s * base)); b.visible = s > 0.003;
  }
  S.bsk.scale.setScalar(1 + (t > T14.factures ? 0.05 * Math.max(0, Math.sin((t - T14.factures) * 14)) * Math.exp(-(t - T14.factures) * 4) : 0));
  // lampe de table : s'allume avec l'intérieur
  const lampOn = sstep(T14.quotidien - 0.04, T14.quotidien + 0.12, t);
  S.tl.userData.shade.material.color.setHex(mixHex(0x8a6a4a, 0xffd69a, lampOn)); S.tlGlow.material.opacity = 0.32 * lampOn; S.tlGlow.scale.setScalar(1.5 + 0.5 * lampOn);

  // bus + enfant : le service nécessaire (l'enfant monte à bord, puis salue sa mère à la fenêtre)
  const tD = T14.ameliorer;
  const bu = 1 - eout(lin(tD - 0.8, tD - 0.06, t));
  S.bus.position.set(BX - 14 * bu, 0, 0); S.bus.visible = t > tD - 0.82;
  const dOpen = eoutBack(lin(tD - 0.02, tD + 0.14, t)); S.busM.userData.doorPivot.scale.set(Math.max(0.04, 1 - 0.96 * Math.min(1, dOpen)), 1, 1); S.busM.userData.lamp.material.color.setHex(mixHex(0xff5a3a, 0x2ee08a, dOpen > 0.3 ? 1 : 0));
  const walkU = eio(lin(tD + 0.0, tD + 0.24, t)), enter = eio(lin(tD + 0.24, tD + 0.34, t)), seat = eio(lin(tD + 0.34, tD + 0.46, t));
  const S0 = [BX + 0.9, 3.5], E = [BX + 2.0, 1.5], IN = [BX + 2.0, 0.2], WN = [BX + 0.8, 0.3];
  let kx = lerp(S0[0], E[0], walkU), kz = lerp(S0[1], E[1], walkU), ky = 0;
  if (enter > 0) { kx = lerp(E[0], IN[0], enter); kz = lerp(E[1], IN[1], enter); ky = 0.64 * enter; }
  if (seat > 0) { kx = lerp(IN[0], WN[0], seat); kz = lerp(IN[1], WN[1], seat); ky = 0.64; }
  const kid = S.kid, moving = (walkU > 0 && walkU < 1) || (enter > 0 && enter < 1) || (seat > 0 && seat < 1) ? 1 : 0;
  const face = seat > 0 ? (seat < 1 ? Math.atan2(WN[0] - IN[0], WN[1] - IN[1]) : 0.0) : enter > 0 ? Math.atan2(IN[0] - E[0], IN[1] - E[1]) : Math.atan2(E[0] - S0[0], E[1] - S0[1]);
  kid.position.set(kx, ky + Math.abs(Math.sin(t * 10)) * 0.04 * moving, kz); kid.rotation.y = seat >= 1 ? 0.0 : face;
  const wvv = Math.sin(t * 9), wave = lin(tD + 0.46, tD + 0.56, t);
  kid.userData.legL.rotation.x = Math.sin(t * 10) * 0.5 * moving; kid.userData.legR.rotation.x = -Math.sin(t * 10) * 0.5 * moving;
  kid.userData.armL.rotation.set(-Math.sin(t * 10) * 0.4 * moving, 0, 0.12); kid.userData.armR.rotation.set(Math.sin(t * 10) * 0.4 * moving - 2.5 * wave, 0, -0.12 * (1 - wave) + 0.35 * wave + 0.3 * wave * wvv);
  setS(kid, kid.userData.s0 * (t > tD - 0.5 ? 1 : 0)); if (t <= tD - 0.5) kid.visible = false;
  const m2 = S.mum2; m2.position.set(BX + 0.1, 0, 3.4); m2.rotation.y = 0.25 + 0.2 * wave; setS(m2, m2.userData.s0 * pop(t, tD - 0.3, 0.3)); if (t < tD - 0.3) m2.visible = false;
  m2.userData.armR.rotation.set(-2.5 * wave, 0, -0.12 * (1 - wave) + 0.35 * wave + 0.3 * wvv * wave); m2.userData.armL.rotation.z = 0.12; m2.userData.legL.rotation.x = 0; m2.userData.legR.rotation.x = 0;
  { const sk = 0.5 + 0.5 * sstep(T14.millions + 0.1, T14.pourraient, t); S.skyM.color.setScalar(sk); S.skyM.visible = true; S.sun.visible = true; } S.far.forEach((m, i) => { const k = pop(t, T14.millions + 0.14 + i * 0.07, 0.4); m.scale.y = Math.max(1e-4, k); m.position.y = 2.5 * k - 0.1; m.visible = k > 0.003 && t < T14.ameliorer + 0.3; });

  // intérieur : se construit autour de la table
  for (const k of S.K) {
    const d = k.userData.k; const u = d.mode === "fade" ? lin(d.t0, d.t0 + d.d, t) : pop(t, d.t0, d.d);
    if (d.mode === "wall") { k.scale.set(1, Math.max(1e-4, u), 1); k.visible = u > 0.003; }
    else if (d.mode === "fade") { k.scale.setScalar(Math.max(1e-4, 0.4 + 0.6 * u)); k.visible = u > 0.003; }
    else { setS(k, d.sx * u); }
  }
  for (const b of S.bulbs) { const on = pop(t, b.userData.t0, 0.18); setS(b, on); b.userData.gl.material.opacity = 0.7 * Math.min(1, on) * (0.8 + 0.2 * Math.sin(t * 5 + b.position.x * 3)); b.userData.gl.scale.setScalar(0.5 + 0.35 * Math.min(1, on)); }
  S.flGlow.material.opacity = 0.38 * lampOn; S.flGlow.scale.setScalar(4.2 + 0.5 * Math.sin(t * 4));
}

export const S14_LIGHTS = (t) => {
  const cozy = sstep(T14.ameliorer + 0.3, T14.quotidien + 0.2, t);
  const onBus = sstep(T14.et - 0.02, T14.ameliorer - 0.05, t) * (1 - sstep(T14.ameliorer + 0.46, T14.ameliorer + 0.62, t));
  return {
    hemiC: mixHex(0xfff4ea, 0xffe3c0, cozy), hemiG: 0x6a4a34, hemi: kf(t, [[a14, 0.85], [T14.millions + 0.3, 0.98], [T14.ameliorer + 0.2, 1.0], [T14.quotidien + 0.1, 1.2]]),
    dirC: mixHex(0xfff0e0, 0xffd4a0, cozy), dir: kf(t, [[a14, 0.95], [T14.millions + 0.3, 1.25], [T14.ameliorer + 0.3, 1.2], [T14.quotidien, 0.8]]), dirP: [-8, 12, ZS + 16],
    ptC: 0xffc27c, ptP: [lerp(0.6, BX + 1.6, onBus), lerp(3.0, 3.0, onBus), ZS + lerp(0.9, 3.6, onBus)],
    pt: kf(t, [[a14, 8], [T14.pourraient, 8], [T14.ameliorer - 0.1, 9], [T14.quotidien - 0.02, 8], [T14.quotidien + 0.18, 12], [b14, 13]]),
  };
};
export const S14_ENV = (t) => ({ bg: keyHex(t, [[a14, 0x3a2314], [T14.millions + 0.5, 0x36210f], [T14.ameliorer, 0x30200f], [T14.quotidien + 0.2, 0x3c2514], [b14, 0x402816]]), fog: kf(t, [[a14, 0.02], [T14.millions + 0.7, 0.014], [T14.ameliorer + 0.3, 0.014], [T14.quotidien + 0.1, 0.022]]) });
export const S14_SHAKE = (t, bump) => Math.max(bump(T14.payer + 0.03, 0.04), bump(T14.factures + 0.45, 0.02));

/* ---------- caméra (coordonnées monde) ---------- */
const TN = (f) => Math.tan(f * Math.PI / 360);
export function S14_SHOTS(ox, oz) {
  const sh = (t, p, s, f = 46, o = {}) => { const d = Math.hypot(s[0] - p[0], s[1] - p[1], s[2] - p[2]); const dy = o.dy ?? 0.1; const h = dy * d * TN(f); return { t, p: [p[0] + ox, p[1], p[2] + oz + ZS], l: [s[0] + ox + (o.dx ?? 0), s[1] - h, s[2] + oz + ZS], f, r: o.r ?? 0, e: o.e }; };
  return [
    sh(a14, [0.3, 1.9, 2.6], [0.0, 1.35, -0.6], 40, { dy: 0.02 }),
    sh(T14.millions - 0.04, [0.18, 1.8, 2.2], [0.0, 1.3, -0.6], 38, { dy: 0.03, e: eio }),
    sh(T14.pourraient - 0.06, [3.4, 8.8, 11.5], [0.0, 1.2, -10], 56, { dy: -0.03, r: 0.03, e: eio }),
    sh(T14.enfin + 0.0, [0.29, 2.7, 3.1], [-0.11, 1.0, 0.1], 42, { dy: 0.13 }),
    sh(T14.payer + 0.04, [0.22, 2.45, 2.7], [-0.14, 0.98, 0.18], 40, { dy: 0.11, e: eio }),
    sh(T14.factures - 0.04, [-0.05, 2.6, 4.9], [-0.05, 1.05, 0.1], 46, { dy: 0.15 }),
    sh(T14.et - 0.02, [0.0, 2.55, 4.8], [-0.02, 1.05, 0.1], 46, { dy: 0.15, e: eio }),
    sh(T14.ameliorer - 0.04, [BX + 1.6, 1.8, 8.4], [BX + 0.7, 1.35, 1.8], 50, { dy: 0.06 }),
    sh(T14.ameliorer + 0.5, [BX + 1.3, 1.8, 7.4], [BX + 0.8, 1.45, 1.0], 48, { dy: 0.06, e: eio }),
    sh(T14.quotidien - 0.02, [0.8, 2.3, 5.4], [-0.1, 1.5, -0.8], 48, { dy: 0.1 }),
    sh(b14 - 0.01, [0.3, 2.0, 4.0], [-0.1, 1.5, -0.7], 46, { dy: 0.1 }),
  ];
}
