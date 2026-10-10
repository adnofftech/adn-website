// MODULE « life » — scènes 4 et 14 : ce que l'argent pourrait changer (courses, facture/loyer, porte, soins) puis les besoins quotidiens.
// Contrat : ../../../CONTRACT.md. Fonction pure de t, déterministe, matériaux Lambert/Basic, 3 lumières.
import { T, PAL, SKIN, CLOTH, M, MB, mesh, bx, cy, sp, glowSprite, makeSparks, makeFlashes, kf, eio, eout, eoutBack, sstep, lin, H, textPlane, clamp, lerp,
  person, table, chair, bread, milk, fruitBowl, veggieBag, invoice, stampTool, bill, ghostBill, wallPanel, plant, frame, medCross, texFloor, texWall, texSky, texInterior, texArt } from "./life_kit.js";
import { MODULES, windowsOf, onset } from "../plan.js";
import { shotList, evalShots } from "../shots.js";
import { buildS14, updateS14, S14_LIGHTS, S14_ENV, ZS, S14_SHOTS, S14_SHAKE } from "./life_s14.js";

export const ID = "life";
export const OFFSET = MODULES[ID].offset;
export const WINDOWS = windowsOf(ID);
const [W4, W14] = WINDOWS; const [a4, b4] = W4;
const [ox, oy, oz] = OFFSET;

/* ---------- instants des mots (scène 4) ---------- */
const o4 = (re, k = 0) => onset(4, re, k);
const T4 = { certaines: o4(/^certaines$/), familles: o4(/^familles$/), cet: o4(/^cet$/), argent: o4(/^argent$/), pourrait: o4(/^pourrait$/), tout: o4(/^tout$/), changer: o4(/^changer$/),
  manger: o4(/^manger$/), a: o4(/^à$/), leur: o4(/^leur$/), faim: o4(/^faim$/), se1: o4(/^se$/, 0), loger: o4(/^loger$/), se2: o4(/^se$/, 1), soigner: o4(/^soigner$/) };

/* ---------- utilitaires ---------- */
const pop = (t, t0, d = 0.32) => eoutBack(lin(t0, t0 + d, t));
const mixHex = (a, b, u) => { const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255, br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255; return ((ar + (br - ar) * u) << 16) | ((ag + (bg - ag) * u) << 8) | (ab + (bb - ab) * u); };
const keyHex = (t, keys) => { if (t <= keys[0][0]) return keys[0][1]; for (let i = 0; i < keys.length - 1; i++) { const [t0, c0] = keys[i], [t1, c1] = keys[i + 1]; if (t < t1) return mixHex(c0 | 0, c1 | 0, eio((t - t0) / (t1 - t0))); } return keys[keys.length - 1][1]; };
/** piste d'un objet : keys = [{t, v:[...], e, arc}] -> tableau interpolé (arc = hauteur de l'arc sur y) */
function track(t, keys) {
  if (t <= keys[0].t) return keys[0].v.slice();
  for (let i = 0; i < keys.length - 1; i++) { const a = keys[i], b = keys[i + 1]; if (t < b.t) { const u = (t - a.t) / (b.t - a.t), e = (a.e || eio)(u); const o = a.v.map((x, j) => x + (b.v[j] - x) * e); if (a.arc) o[1] += a.arc * Math.sin(Math.PI * u); return o; } }
  return keys[keys.length - 1].v.slice();
}
const hold = (u) => u;
const setS = (o, s) => { o.visible = s > 0.003; o.scale.setScalar(Math.max(1e-4, s)); };
const FLAT = 1.05;

/* ---------- la voix → le billet héros (scène 4) ---------- */
// v = [x, y, z, s, rx, ry, rz]
const HERO = [
  { t: T4.cet, v: [0.0, 3.3, 0.5, 0.1, 0.4, 0.8, 0.5], arc: 0.8 },                                  // naît du point lumineux de la lampe
  { t: T4.pourrait + 0.28, v: [-0.78, 1.36, 0.1, 0.5, 0.0, 0.0, 0.08], e: hold },                   // arrive dans les mains de la mère
  { t: T4.changer - 0.05, v: [-0.78, 1.4, 0.1, 0.52, 0.0, 0.0, 0.05] },
  { t: T4.changer + 0.3, v: [-0.78, 2.55, 0.0, 0.62, 0.0, 0.0, -0.08], arc: 0.35 },                  // levé haut : « tout changer »
  { t: T4.manger - 0.02, v: [0.0, 1.02, 0.5, 0.56, -1.2, 0.0, 0.0], e: hold },                       // se pose sur la table
  { t: T4.faim + 0.2, v: [0.0, 1.02, 0.5, 0.5, -1.2, 0.0, 0.1], arc: 1.1, e: eio },                  // file vers la facture
  { t: T4.se1 - 0.01, v: [14.0, 1.7, -1.3, 0.62, -0.3, 0.0, 0.0] },
];

/* ---------- construction ---------- */
export function build() {
  const root = new T.Group(); root.position.set(...OFFSET); const U = root.userData = {};
  // lumières (3 au total)
  const hemi = new T.HemisphereLight(0xffe2c0, 0x5a3820, 0.4); root.add(hemi);
  const dir = new T.DirectionalLight(0xfff0dc, 0.6); dir.position.set(-5, 10, 9); dir.target.position.set(0, 0, 0); root.add(dir); root.add(dir.target);
  const pt = new T.PointLight(0xffb25a, 10, 0, 1.7); pt.position.set(0, 3.2, 0.8); root.add(pt);
  U.hemi = hemi; U.dir = dir; U.pt = pt;
  const sparks = makeSparks(560); root.add(sparks.obj); const flashes = makeFlashes(root, 24);
  U.sparks = sparks; U.flashes = flashes;
  const blob = (parent, x, z, r, y = 0.012, o = 0.32) => { const m = mesh(new T.CircleGeometry(r, 18), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: o, depthWrite: false }), x, y, z, parent); m.rotation.x = -Math.PI / 2; return m; };

  /* ===== décor continu (scène 4) ===== */
  const g4 = new T.Group(); root.add(g4); U.g4 = g4;
  const floor = mesh(new T.PlaneGeometry(76, 22), new T.MeshLambertMaterial({ map: texFloor([19, 5.5]) }), 14, 0, 3, g4); floor.rotation.x = -Math.PI / 2;
  const WZ = -2.6;
  const wA = wallPanel(18, 10, 0xffffff, 0x6a4a38, texWall("#f4dfbd", "#ecd3a8", [9, 1])); wA.position.set(-2, 0, WZ); g4.add(wA);
  const wBl = wallPanel(6.4, 10, 0xffffff, 0x6a3a30, texWall("#e9a98a", "#dd9a79", [3, 1])); wBl.position.set(10.2, 0, WZ); g4.add(wBl);       // x 7..13.4
  const wBr = wallPanel(6.4, 10, 0xffffff, 0x6a3a30, texWall("#e9a98a", "#dd9a79", [3, 1])); wBr.position.set(17.8, 0, WZ); g4.add(wBr);       // x 14.6..21
  const wBt = wallPanel(1.2, 7.5, 0xffffff, 0x6a3a30, texWall("#e9a98a", "#dd9a79", [1, 1])); wBt.position.set(14, 2.5, WZ); g4.add(wBt);
  const wC = wallPanel(18, 10, 0xffffff, 0x9a7a5c, texWall("#f6e6cc", "#ecd5b0", [9, 1])); wC.position.set(30, 0, WZ); g4.add(wC);
  // plinthes / lambris
  bx(18, 1.1, 0.12, M(0xb98156), -2, 0.55, WZ + 0.08, g4); bx(18, 0.07, 0.16, M(0xf3e6c8), -2, 1.13, WZ + 0.08, g4);
  bx(6.4, 1.1, 0.12, M(0x8b4f3a), 10.2, 0.55, WZ + 0.08, g4); bx(6.4, 1.1, 0.12, M(0x8b4f3a), 17.8, 0.55, WZ + 0.08, g4); bx(6.4, 0.07, 0.16, M(0xf3e6c8), 10.2, 1.13, WZ + 0.08, g4); bx(6.4, 0.07, 0.16, M(0xf3e6c8), 17.8, 1.13, WZ + 0.08, g4);
  bx(18, 1.1, 0.12, M(0xe0d2b4), 30, 0.55, WZ + 0.08, g4); bx(18, 0.07, 0.16, M(0xffffff), 30, 1.13, WZ + 0.08, g4);

  /* ===== A : cuisine ===== */
  const rug = cy(2.1, 2.1, 0.02, M(0xa8483a), 0, 0.012, 0.5, g4, 40); cy(1.65, 1.65, 0.024, M(0xe0a85e), 0, 0.014, 0.5, g4, 40); cy(1.35, 1.35, 0.028, M(0xa8483a), 0, 0.016, 0.5, g4, 40);
  const tbl = table(2.2, 1.15, 0.86); tbl.position.set(0, 0, 0.5); g4.add(tbl);
  // lampe suspendue
  const lamp = new T.Group(); lamp.position.set(0, 0, 0.5); g4.add(lamp);
  cy(0.012, 0.012, 5.8, M(0x222222), 0, 6.3, 0, lamp, 4);
  const shade = mesh(new T.ConeGeometry(0.62, 0.42, 20, 1, true), new T.MeshLambertMaterial({ color: 0xe8b84a, emissive: 0x7a4a10, side: T.DoubleSide }), 0, 3.62, 0, lamp);
  const bulb = sp(0.13, MB(0xfff4cc), 0, 3.4, 0, lamp, 10, 8);
  const lampHalo = glowSprite(0xffa850, 10, 0.5); lampHalo.position.set(0, 3.4, 0.5); g4.add(lampHalo); U.lampHalo = lampHalo;
  const lampCore = glowSprite(0xfff1c4, 2.4, 1); lampCore.position.set(0, 3.4, 0.7); g4.add(lampCore); U.lampCore = lampCore;
  // fenêtre, rideaux, étagère, frigo, plantes
  bx(1.8, 2.1, 0.08, M(0xf5ead2), -3.4, 2.75, WZ + 0.06, g4);
  const sky = new T.Mesh(new T.PlaneGeometry(1.55, 1.85), new T.MeshBasicMaterial({ map: texSky() })); U.sky = sky; sky.position.set(-3.4, 2.75, WZ + 0.11); g4.add(sky);
  bx(0.06, 1.85, 0.05, M(0xf5ead2), -3.4, 2.75, WZ + 0.13, g4); bx(1.55, 0.06, 0.05, M(0xf5ead2), -3.4, 2.75, WZ + 0.13, g4);
  bx(0.42, 2.3, 0.14, M(0xd9a05b), -4.5, 2.7, WZ + 0.12, g4); bx(0.42, 2.3, 0.14, M(0xd9a05b), -2.3, 2.7, WZ + 0.12, g4); bx(2.3, 0.06, 0.06, M(0x5a3a1c), -3.4, 3.9, WZ + 0.14, g4);
  bx(1.8, 0.06, 0.42, M(0xb9824f), 2.4, 2.55, WZ + 0.25, g4);
  [[0xe8b84a, 1.8], [0xd9342b, 2.2], [0x7fb857, 2.6], [0xf3ecd4, 3.0]].forEach(([c, x], i) => cy(0.11, 0.11, 0.28 + (i % 2) * 0.08, M(c, 0x1a1006), x - 0.4, 2.72 + (i % 2) * 0.04, WZ + 0.27, g4, 10));
  bx(0.98, 2.2, 0.82, M(0xcfe3dc), 4.5, 1.1, WZ + 0.5, g4); bx(0.04, 0.5, 0.05, M(0x8a9a94), 4.0, 1.2, WZ + 0.93, g4);
  for (const [x, y, c] of [[4.3, 1.9, 0xf2c230], [4.7, 1.6, 0xe0453a], [4.45, 1.3, 0x2d6cc0]]) { const dwg = new T.Mesh(new T.PlaneGeometry(0.28, 0.34), new T.MeshBasicMaterial({ color: c })); dwg.position.set(x, y, WZ + 0.92); dwg.rotation.z = (x - 4.4) * 0.5; g4.add(dwg); }
  const pl1 = plant(1.9); pl1.position.set(-5.4, 0, -1.4); g4.add(pl1); const pl2 = plant(1.3, 0xd98f3a, 0x4ca64a); pl2.position.set(3.2, 0, 2.6); g4.add(pl2);

  // famille (4 personnes)
  const mum = person({ skin: SKIN[3], shirt: 0xf4f1e6, dress: 0xd9703a, hair: 0x1a120c, style: "curly" });
  const dad = person({ skin: 0xb98258, shirt: 0x2d6cc0, pants: 0x2b3a4a, hair: 0x15100c });
  const girl = person({ skin: SKIN[3], shirt: 0xf2c230, dress: 0xf2c230, hair: 0x1a120c, style: "pigtails", kind: "child" });
  const boy = person({ skin: 0xb98258, shirt: 0x3aa65c, pants: 0x3a4a6a, hair: 0x2a1a10, kind: "child", scale: 1.25 });
  const fam = [[mum, -0.85, -0.7, 0.28, T4.certaines - 0.04], [dad, 0.85, -0.7, -0.28, T4.certaines + 0.08], [girl, -1.6, 0.55, 0.7, T4.familles - 0.1], [boy, 1.55, 0.55, -0.7, T4.familles + 0.0]];
  U.fam = fam.map(([p, x, z, ry, t0], i) => { p.position.set(x, 0, z); p.rotation.y = ry; p.userData.s0 = p.scale.x; p.userData.x0 = x; p.userData.z0 = z; p.userData.ry0 = ry; p.userData.t0 = t0; p.userData.ph = i * 1.7; g4.add(p); blob(g4, x, z, 0.42 * (i > 1 ? 0.75 : 1)); return p; });
  U.mum = mum; U.dad = dad; U.girl = girl; U.boy = boy;

  // billet héros + traînée + billets fils (courses)
  const hero = bill(); hero.renderOrder = 5; g4.add(hero); U.hero = hero;
  U.ghosts = [0.4, 0.22, 0.1].map((o) => { const gm = ghostBill(o); gm.renderOrder = 4; g4.add(gm); return gm; });
  const heroGlow = glowSprite(0xffd27a, 2.6, 0.6); g4.add(heroGlow); U.heroGlow = heroGlow;
  // courses
  const TOP = 0.872; const items = [
    { o: bread(), x: -0.5, z: 0.68, ry: 0.45, t: T4.manger, s: 1.15 },
    { o: milk(), x: -0.4, z: 0.1, ry: 0.3, t: T4.a + 0.02, s: 1.3 },
    { o: fruitBowl(), x: 0.55, z: 0.74, ry: 0, t: T4.leur, s: 1.3 },
    { o: veggieBag(), x: 0.12, z: 0.05, ry: -0.15, t: T4.faim, s: 1.3 },
  ];
  U.items = items.map((it) => { it.o.position.set(it.x, TOP, it.z); it.o.rotation.y = it.ry; g4.add(it.o); const sb = ghostBill(0.95); sb.renderOrder = 6; g4.add(sb); it.sb = sb; sparks.add(it.t + 0.1, [it.x, TOP + 0.15, it.z], { n: 10, col: 0xffe6a0, speed: 0.9, life: 0.6, up: 1.4 }); flashes.add(it.t + 0.06, [it.x, TOP + 0.3, it.z + 0.1], 1.4, 0xffd27a, 0.4, 0.8); return it; });

  /* ===== B : porte du logement ===== */
  const B = new T.Group(); g4.add(B); U.B = B;
  const doorX = 14; const frameM = M(0xf3e9d8);
  bx(0.2, 2.62, 0.22, frameM, doorX - 0.7, 1.31, WZ + 0.1, B); bx(0.2, 2.62, 0.22, frameM, doorX + 0.7, 1.31, WZ + 0.1, B); bx(1.6, 0.2, 0.22, frameM, doorX, 2.62, WZ + 0.1, B);
  // intérieur chaleureux derrière la porte
  const inBack = new T.Mesh(new T.PlaneGeometry(4.2, 4.2), new T.MeshBasicMaterial({ map: texInterior() })); inBack.position.set(doorX, 1.9, WZ - 1.9); B.add(inBack);
  for (const sx of [-1, 1]) { const w = mesh(new T.PlaneGeometry(2.0, 3.4), new T.MeshBasicMaterial({ color: 0xf2b56a, side: T.DoubleSide }), doorX + sx * 0.72, 1.7, WZ - 0.9, B); w.rotation.y = Math.PI / 2; }
  const inFloor = mesh(new T.PlaneGeometry(1.5, 2.0), new T.MeshBasicMaterial({ color: 0xe29a4f }), doorX, 0.01, WZ - 0.9, B); inFloor.rotation.x = -Math.PI / 2;
  const inCeil = mesh(new T.PlaneGeometry(1.5, 2.0), new T.MeshBasicMaterial({ color: 0xffd9a0 }), doorX, 3.1, WZ - 0.9, B); inCeil.rotation.x = Math.PI / 2;
  const hinge = new T.Group(); hinge.position.set(doorX - 0.6, 0, WZ + 0.14); B.add(hinge); U.hinge = hinge;
  bx(1.2, 2.5, 0.07, M(0x2b7a78), 0.6, 1.25, 0, hinge); bx(0.82, 0.9, 0.04, M(0x35908c), 0.6, 1.72, 0.045, hinge); bx(0.82, 0.9, 0.04, M(0x35908c), 0.6, 0.62, 0.045, hinge); sp(0.06, M(PAL.gold, 0x4a3000), 1.05, 1.25, 0.1, hinge, 10, 8);
  bx(1.5, 0.03, 0.8, M(0x7a4a2a), doorX, 0.015, WZ + 0.9, B);
  // lueur qui s'échappe : trapèze au sol (additif)
  { const geo = new T.BufferGeometry(); const v = [-0.6, 0, 0, 0.6, 0, 0, -1.9, 0, 3.4, 1.9, 0, 3.4]; geo.setAttribute("position", new T.Float32BufferAttribute(v, 3)); geo.setAttribute("color", new T.Float32BufferAttribute([1, 0.75, 0.38, 1, 0.75, 0.38, 0, 0, 0, 0, 0, 0], 3)); geo.setIndex([0, 2, 1, 1, 2, 3]);
    const spill = new T.Mesh(geo, new T.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); spill.position.set(doorX, 0.05, WZ + 0.15); B.add(spill); U.spill = spill; }
  const doorGlow = glowSprite(0xffc070, 4.6, 0); doorGlow.position.set(doorX, 1.4, WZ + 0.5); B.add(doorGlow); U.doorGlow = doorGlow;
  // lanterne, plante, console + facture
  sp(0.2, new T.MeshBasicMaterial({ color: 0xfff0c0 }), doorX - 2.1, 2.7, WZ + 0.2, B, 10, 8); const lanG = glowSprite(0xffb858, 1.6, 0.6); lanG.position.set(doorX - 2.1, 2.7, WZ + 0.4); B.add(lanG);
  const pl3 = plant(1.5, 0xa84a3a, 0x3f9d3f); pl3.position.set(doorX + 2.2, 0, -1.7); B.add(pl3);
  const conX = 14.0, conZ = -1.5; bx(1.9, 0.07, 1.35, M(0xb9824f), conX, 0.93, conZ, B); for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(0.08, 0.9, 0.08, M(0x8b5a33), conX + sx * 0.85, 0.45, conZ + sz * 0.58, B);
  const invB = invoice("loyer", 1.0); invB.g.position.set(14.0, 0.97, -0.86); invB.g.rotation.x = -(Math.PI / 2 - 0.5); B.add(invB.g); U.invB = invB;
  const tool = stampTool(); tool.rotation.x = Math.PI / 2; tool.position.set(0.05, invB.h * 0.3, 1.2); invB.g.add(tool); U.toolB = tool;
  const keyG = new T.Group(); { const ring = mesh(new T.TorusGeometry(0.07, 0.014, 6, 12), M(PAL.gold, 0x4a3000), 0, 0, 0, keyG); bx(0.02, 0.18, 0.015, M(PAL.gold, 0x4a3000), 0, -0.14, 0, keyG); bx(0.06, 0.02, 0.015, M(PAL.gold, 0x4a3000), 0.03, -0.2, 0, keyG); } keyG.position.set(doorX + 0.95, 1.4, WZ + 0.3); B.add(keyG); U.keyG = keyG;
  blob(B, 14, -0.7, 0.9, 0.016, 0.0);

  /* ===== C : cabinet de soins ===== */
  const Cx = 28; const C = new T.Group(); g4.add(C); U.C = C;
  const cross = medCross(0.78); cross.position.set(Cx, 3.95, WZ + 0.18); C.add(cross); U.cross = cross;
  const crossHalo = glowSprite(0x4dff9a, 6.5, 0); crossHalo.position.set(Cx, 3.95, WZ + 0.5); C.add(crossHalo); U.crossHalo = crossHalo;
  const sign = textPlane("SANTÉ", { w: 2.3, h: 0.56, px: 512, color: "#0e6a43", bg: "#f6fff9", border: "#2ee08a", size: 0.62 }); sign.position.set(Cx, 2.62, WZ + 0.1); C.add(sign);
  bx(2.7, 1.0, 0.7, M(0xf4f6f4), Cx, 0.5, -0.95, C); bx(2.8, 0.08, 0.8, M(0xb9824f), Cx, 1.04, -0.95, C); bx(0.5, 0.34, 0.04, M(0x2a2e30), Cx + 0.7, 1.35, -1.15, C); bx(0.44, 0.28, 0.01, MB(0x9fe8d6), Cx + 0.7, 1.35, -1.12, C); bx(0.06, 0.2, 0.06, M(0x2a2e30), Cx + 0.7, 1.18, -1.15, C);
  const pl4 = plant(0.7, 0xf3ecd4, 0x4ca64a); pl4.position.set(Cx - 1.0, 1.08, -0.95); C.add(pl4);
  // salle d'attente : chaises, affiche
  for (const x of [-3.4, -2.6]) { const ch = chair(0x2a8f87); ch.position.set(Cx + x, 0, -0.2); ch.rotation.y = 0.25; C.add(ch); }
  const pl5 = plant(1.7, 0xc4683f, 0x3f9d3f); pl5.position.set(Cx - 4.6, 0, -1.6); C.add(pl5); const pl6 = plant(1.2, 0xe8e0cf, 0x4ca64a); pl6.position.set(Cx + 3.2, 0, 2.4); C.add(pl6);
  const poster = new T.Mesh(new T.PlaneGeometry(0.9, 1.2), new T.MeshBasicMaterial({ map: texArt("#bfe9dc", "#7ccfb6", "#fff3b0") })); poster.position.set(Cx + 3.0, 2.3, WZ + 0.1); C.add(poster); const frP = bx(1.0, 1.3, 0.05, M(0xf6fff9), Cx + 3.0, 2.3, WZ + 0.07, C);
  const doc = person({ skin: SKIN[4], shirt: 0x2a9d8f, coat: 0xf6f8f8, hair: 0x14100c, style: "short" });
  const par = person({ skin: SKIN[0], shirt: 0xe0453a, pants: 0x3a4a6a, hair: 0x6b3f1e, style: "long", dress: null });
  const kid = person({ skin: SKIN[0], shirt: 0x8a4fb5, hair: 0x6b3f1e, style: "pigtails", kind: "child", scale: 1.1 });
  doc.userData.s0 = doc.scale.x; par.userData.s0 = par.scale.x; kid.userData.s0 = kid.scale.x; doc.position.set(Cx - 0.15, 0, -1.8); doc.rotation.y = -0.15; C.add(doc); C.add(par); C.add(kid);
  blob(C, Cx - 0.15, -1.8, 0.4); U.doc = doc; U.par = par; U.kid = kid;
  sparks.add(T4.soigner + 0.02, [Cx, 3.95, WZ + 0.5], { n: 26, col: 0x9dffd0, speed: 2.2, life: 1.0, up: 0.6 }); sparks.add(T4.soigner + 0.06, [Cx, 3.95, WZ + 0.5], { n: 16, col: 0xffffff, speed: 1.5, life: 0.8, up: 0.4 });
  flashes.add(T4.soigner, [Cx, 3.95, WZ + 0.6], 7, 0x6dffb0, 0.7, 0.9); flashes.add(T4.soigner + 0.12, [Cx, 3.95, WZ + 0.6], 5, 0xffffff, 0.5, 0.5);
  // billet de fin (unique)
  const bill2 = bill(); bill2.renderOrder = 7; g4.add(bill2); U.bill2 = bill2; U.ghosts2 = [0.5, 0.3, 0.15].map((o) => { const gm = ghostBill(o); gm.renderOrder = 6; g4.add(gm); return gm; });
  const bill2Glow = glowSprite(0xffd27a, 3.2, 0); g4.add(bill2Glow); U.bill2Glow = bill2Glow;
  const dim = new T.Mesh(new T.PlaneGeometry(40, 40), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false })); dim.position.set(28.5, 2.3, 0.55); dim.renderOrder = 3; g4.add(dim); U.dim = dim;

  /* ===== événements d'étincelles et d'éclats (scène 4) ===== */
  sparks.add(a4 + 0.02, [0, 3.4, 0.7], { n: 18, col: 0xffd890, speed: 1.4, life: 1.3, up: 0.4, g: 0.3 });
  sparks.add(T4.cet, [0, 3.35, 0.6], { n: 14, col: 0xffe2a0, speed: 1.1, life: 0.7 });
  sparks.add(T4.pourrait + 0.28, [-0.62, 1.7, 0.0], { n: 12, col: 0xffe2a0, speed: 0.9, life: 0.7 });
  sparks.add(T4.changer, [-0.62, 1.95, 0.0], { n: 30, col: 0xffd27a, speed: 2.3, life: 1.0, up: 1.0 }); flashes.add(T4.changer, [-0.62, 1.95, 0.2], 6, 0xffc060, 0.7, 0.8);
  sparks.add(T4.se1 + 0.14, [14.1, 1.3, -1.2], { n: 20, col: 0x5dffb0, speed: 1.8, life: 0.8, up: 1.1 }); flashes.add(T4.se1 + 0.12, [14.1, 1.35, -1.1], 3.6, 0x5dffb0, 0.5, 0.85);
  sparks.add(T4.loger + 0.44, [14, 1.4, -2.4], { n: 22, col: 0xffd27a, speed: 1.6, life: 1.0, up: 0.5 }); flashes.add(T4.loger + 0.3, [14, 1.4, -2.3], 6.5, 0xffc874, 0.9, 0.7);
  sparks.add(a4 + 4.86, [28, 2.8, -1.4], { n: 12, col: 0xffe6a0, speed: 1.0, life: 0.7 });
  U.sparks = sparks; U.flashes = flashes;

  // flash plein cadre (lumière qui monte) : plan collé à la caméra
  const veil = new T.Mesh(new T.PlaneGeometry(14, 14), new T.MeshBasicMaterial({ color: 0xffc070, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, depthTest: false })); veil.renderOrder = 99; veil.frustumCulled = false; root.add(veil); U.veil = veil;

  /* ===== scène 14 ===== */
  U.s14 = buildS14(root, { sparks, flashes, blob });
  return root;
}

/* ---------- caméra ---------- */
const TN = (f) => Math.tan(f * Math.PI / 360);
function shot(t, p, s, f = 46, o = {}) { const d = Math.hypot(s[0] - p[0], s[1] - p[1], s[2] - p[2]); const dy = o.dy ?? 0.12; const h = dy * d * TN(f); return { t, p: [p[0] + ox, p[1], p[2] + oz], l: [s[0] + ox + (o.dx ?? 0), s[1] - h, s[2] + oz], f, r: o.r ?? 0, e: o.e }; }
const S4_SHOTS = [
  shot(a4, [0.0, 3.0, 12.5], [0, 3.35, 0.5], 44, { dy: 0.04 }),
  shot(a4 + 0.5, [0.15, 2.9, 10.2], [0, 2.4, 0.3], 46, { dy: 0.08, e: eio }),
  shot(T4.cet, [-0.25, 2.55, 8.0], [-0.05, 1.7, 0.1], 46, { dy: 0.1 }),
  shot(T4.pourrait + 0.28, [-1.1, 2.0, 4.6], [-0.8, 1.55, -0.2], 44, { dy: 0.1, e: eio }),
  shot(T4.changer + 0.04, [-0.95, 1.9, 3.6], [-0.8, 1.7, -0.2], 42, { dy: 0.1 }),
  shot(T4.changer + 0.4, [-0.5, 2.3, 4.2], [-0.3, 1.6, 0.0], 42, { dy: 0.1, e: eio }),
  shot(T4.manger - 0.05, [-0.1, 2.3, 4.9], [0.0, 1.35, 0.2], 46, { dy: 0.1 }),
  shot(T4.faim + 0.2, [0.1, 2.2, 4.5], [0.0, 1.3, 0.2], 46, { dy: 0.1, e: eio }),
  shot(T4.se1 + 0.02, [14.3, 2.5, 4.3], [14, 1.2, -1.3], 44, { dy: 0.1 }),
  shot(T4.loger + 0.25, [14.05, 2.35, 3.7], [14, 1.35, -1.5], 42, { dy: 0.1, e: eio }),
  shot(T4.se2 - 0.12, [14.0, 1.85, 1.7], [14, 1.5, -2.7], 50, { dy: 0.05 }),
  shot(T4.se2 - 0.08, [14.0, 1.85, 1.3], [14, 1.5, -2.8], 50, { dy: 0.05, e: eio }),
  shot(T4.soigner - 0.03, [28.65, 2.5, 5.8], [28.55, 2.45, -1.4], 46, { dy: 0.2 }),
  shot(T4.soigner + 0.36, [28.6, 2.4, 5.2], [28.5, 2.3, -0.7], 46, { dy: 0.2, e: eio }),
  shot(b4 - 0.01, [28.5, 2.35, 4.3], [28.5, 2.35, 1.0], 40, { dy: 0.02 }),
];
const S14S = S14_SHOTS(ox, oz);
/** lisse la trajectoire (Hermite) entre les clés ; les intervalles marqués e (« whips ») gardent un arrêt franc aux deux bouts. Sortie : clés denses linéaires. */
function smooth(list, step = 0.04) {
  const n = list.length, V = list.map((k) => [k.p[0], k.p[1], k.p[2], k.l[0], k.l[1], k.l[2], k.f, k.r]), eased = list.map((k) => !!k.e);
  const tan = V.map((v, i) => v.map((x, j) => {
    const dp = i > 0 ? list[i].t - list[i - 1].t : 0, dn = i < n - 1 ? list[i + 1].t - list[i].t : 0;
    if ((i > 0 && eased[i - 1]) || (i < n - 1 && eased[i])) return 0;
    if (i === 0) return dn ? (V[1][j] - x) / dn : 0; if (i === n - 1) return dp ? (x - V[i - 1][j]) / dp : 0;
    return (V[i + 1][j] - V[i - 1][j]) / (dp + dn);
  }));
  const out = [];
  for (let i = 0; i < n - 1; i++) {
    const a = list[i], b = list[i + 1], dt = b.t - a.t, m = Math.max(1, Math.round(dt / step));
    for (let q = 0; q < m; q++) {
      const u = q / m; let w;
      if (eased[i]) { const e = eio(u); w = V[i].map((x, j) => x + (V[i + 1][j] - x) * e); }
      else { const u2 = u * u, u3 = u2 * u, h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2; w = V[i].map((x, j) => h00 * x + h10 * dt * tan[i][j] + h01 * V[i + 1][j] + h11 * dt * tan[i + 1][j]); }
      out.push({ t: a.t + u * dt, p: [w[0], w[1], w[2]], l: [w[3], w[4], w[5]], f: w[6], r: w[7] });
    }
  }
  const z = list[n - 1]; out.push({ t: z.t, p: z.p, l: z.l, f: z.f, r: z.r }); return out;
}
export const SHOTS = [...smooth(S4_SHOTS), ...smooth(S14S)];
const TR = shotList(SHOTS);

/* ---------- ambiance ---------- */
export const ENV = (t) => {
  if (t >= W14[0] - 0.01) return S14_ENV(t);
  return { bg: keyHex(t, [[a4, 0x120a05], [a4 + 1.2, 0x2a170c], [T4.manger, 0x34200f], [T4.se1, 0x422614], [b4 - 0.45, 0x3a2312], [b4, 0x0a0604]]), fog: 0.016 };
};
export const SHAKE = (t) => {
  const bump = (t0, amp, d = 0.14) => { const u = (t - t0) / d; return u >= 0 && u <= 1 ? amp * (1 - u) : 0; };
  if (t >= W14[0] - 0.01) return S14_SHAKE(t, bump);
  return Math.max(bump(T4.changer + 0.02, 0.022), bump(T4.loger + 0.03, 0.04), bump(T4.soigner + 0.02, 0.012, 0.2));
};

/* ---------- animation (fonction pure de t) ---------- */
function idle(p, t, amp = 1) { const U = p.userData, s = Math.sin(t * 2.4 + U.ph); p.position.y = 0.012 * s * amp; U.armL.rotation.set(0, 0, 0.12 + 0.03 * s); U.armR.rotation.set(0, 0, -0.12 - 0.03 * s); }
const heroState = (t) => track(t, HERO);
function placeBill(m, st, vis = 1) { m.position.set(st[0], st[1], st[2]); m.rotation.set(st[4], st[5], st[6]); m.scale.setScalar(Math.max(1e-4, st[3] * vis)); m.visible = vis > 0.01; }

export function update(g, t) {
  const U = g.userData; const inW14 = t >= W14[0] - 0.01;
  U.g4.visible = !inW14; U.s14.g.visible = inW14;
  // éclairage : reconstitué à chaque image
  if (!inW14) {
    const warm = sstep(a4, b4 - 0.5, t);
    U.hemi.color.setHex(mixHex(0xfff2e2, 0xffe6c8, warm)); U.hemi.groundColor.setHex(0x6a4a34);
    U.hemi.intensity = kf(t, [[a4, 0.03], [a4 + 0.25, 0.08], [a4 + 0.9, 0.55], [T4.changer, 0.72], [T4.soigner + 0.2, 0.78], [b4 - 0.3, 0.78], [b4, 0.12]]);
    U.dir.color.setHex(mixHex(0xfff0dc, 0xffdcae, warm)); U.dir.intensity = kf(t, [[a4, 0.0], [a4 + 0.3, 0.1], [a4 + 0.95, 0.6], [T4.changer, 0.8], [b4 - 0.3, 0.8], [b4, 0.1]]);
    const px = kf(t, [[a4, 0], [T4.faim + 0.1, 0, eio], [T4.se1 + 0.04, 14], [T4.se2 - 0.04, 14, eio], [T4.soigner + 0.08, 28]]);
    U.pt.position.set(px, kf(t, [[a4, 3.2], [T4.se1, 2.9], [T4.soigner, 3.0]]), kf(t, [[a4, 0.8], [T4.se1, -0.2], [T4.soigner, 0.4]]));
    U.pt.intensity = kf(t, [[a4, 0.0], [a4 + 0.2, 5], [a4 + 0.8, 5, eout], [T4.changer, 5.4], [T4.se1, 5], [T4.soigner + 0.1, 6], [b4 - 0.3, 5.4], [b4, 0.3]]);
    U.pt.color.setHex(0xffc27c);
    updateS4(U, t);
  } else {
    const L = S14_LIGHTS(t); U.hemi.color.setHex(L.hemiC); U.hemi.groundColor.setHex(L.hemiG); U.hemi.intensity = L.hemi; U.dir.color.setHex(L.dirC); U.dir.intensity = L.dir; U.dir.position.set(...L.dirP); U.dir.target.position.set(0, 0, ZS);
    U.pt.color.setHex(L.ptC); U.pt.position.set(...L.ptP); U.pt.intensity = L.pt;
    updateS14(U.s14, t, U);
  }
  // voile (flash plein cadre) collé à la caméra
  const c = evalShots(t, TR); const cp = [c.p[0] - ox, c.p[1], c.p[2] - oz]; const dv = [c.l[0] - c.p[0], c.l[1] - c.p[1], c.l[2] - c.p[2]]; const dl = Math.hypot(...dv) || 1;
  U.veil.position.set(cp[0] + dv[0] / dl * 0.6, cp[1] + dv[1] / dl * 0.6, cp[2] + dv[2] / dl * 0.6); U.veil.lookAt(c.p[0], c.p[1], c.p[2]);
  const vo = inW14 ? U.s14.veilOpacity(t) : Math.max(0, 0.16 * Math.pow(Math.max(0, 1 - Math.abs(t - (T4.changer + 0.06)) / 0.25), 2));
  U.veil.material.opacity = vo; U.veil.visible = vo > 0.004;
  U.sparks.update(t); U.flashes.update(t);
}

function updateS4(U, t) {
  const TOP = 0.872;
  // lampe : le point lumineux chaud d'où naît la scène
  const lampT = lin(a4, a4 + 1.0, t);
  U.lampHalo.material.opacity = lerp(0.95, 0.26, eout(lampT)); U.lampHalo.scale.setScalar(lerp(7, 9, eout(lampT)));
  U.lampCore.material.opacity = 1; U.lampCore.scale.setScalar(lerp(3.2, 2.0, eout(lampT)) * (1 + 0.04 * Math.sin(t * 7))); U.sky.material.color.setScalar(0.12 + 0.88 * sstep(a4 + 0.1, a4 + 1.0, t));

  // famille
  for (const p of U.fam) {
    const d = p.userData, pp = pop(t, d.t0, 0.45); setS(p, d.s0 * pp);
    idle(p, t); p.position.x = d.x0; p.position.z = d.z0; p.rotation.y = d.ry0; p.rotation.x = 0; p.rotation.z = 0;
  }
  const { mum, dad, girl, boy } = U;
  // « tout changer » : la famille se réjouit
  const joy = lin(T4.changer - 0.1, T4.changer + 0.12, t) * (1 - lin(T4.changer + 0.45, T4.changer + 0.8, t));
  const jb = Math.abs(Math.sin((t - T4.changer) * 11)) * joy;
  girl.position.y += jb * 0.18; boy.position.y += jb * 0.16; girl.userData.armL.rotation.set(-2.7 * joy, 0, 0.12 * (1 - joy) - 0.35 * joy); girl.userData.armR.rotation.set(-2.7 * joy, 0, -0.12 * (1 - joy) + 0.35 * joy); boy.userData.armL.rotation.set(-2.6 * joy, 0, 0.12 * (1 - joy) - 0.35 * joy); boy.userData.armR.rotation.set(-2.6 * joy, 0, -0.12 * (1 - joy) + 0.35 * joy);
  dad.userData.armR.rotation.set(-2.3 * joy, 0, -0.12 * (1 - joy) + 0.3 * joy); dad.position.y += jb * 0.05;
  // la mère reçoit le billet puis le pose sur la table
  const recv = lin(T4.pourrait - 0.15, T4.pourrait + 0.28, t), lift = lin(T4.changer, T4.changer + 0.3, t), put = lin(T4.changer + 0.38, T4.manger - 0.02, t);
  const arm = (-1.3 * recv + (-0.9) * lift) * (1 - put) + (-0.85 * put * (1 - lin(T4.manger, T4.manger + 0.3, t)));
  mum.userData.armL.rotation.set(arm, 0, 0.35 * recv * (1 - put) * (1 - lift) - 0.5 * lift * (1 - put) + 0.12 * put); mum.userData.armR.rotation.set(arm, 0, -0.35 * recv * (1 - put) * (1 - lift) + 0.5 * lift * (1 - put) - 0.12 * put);
  mum.rotation.x = 0.06 * recv - 0.1 * lift * (1 - put); mum.position.y += jb * 0.04;
  // enfants penchés vers la table, applaudissent à chaque course
  const claps = (t0) => { const u = (t - t0) / 0.22; return u > 0 && u < 1 ? Math.sin(u * Math.PI) : 0; };
  const cl = Math.max(claps(T4.manger), claps(T4.a), claps(T4.leur), claps(T4.faim));
  const lean = sstep(T4.manger - 0.2, T4.manger + 0.1, t) * 0.18;
  for (const k of [girl, boy]) { const s = k === girl ? 1 : -1; if (joy < 0.01) { k.rotation.z = -s * lean * 0.7; k.userData.armL.rotation.set(-0.9 * cl * lean * 4, 0, 0.12 + 0.2 * (1 - cl)); k.userData.armR.rotation.set(-0.9 * cl * lean * 4, 0, -0.12 - 0.2 * (1 - cl)); } }
  dad.rotation.z = -0.05 * sstep(T4.manger - 0.2, T4.manger + 0.2, t);

  // billet héros
  const st = heroState(t); const vis = (t >= T4.cet && t < T4.se1 + 0.02) ? 1 : 0;
  const spawnP = pop(t, T4.cet, 0.18); const fade = 1 - lin(T4.se1 - 0.05, T4.se1 + 0.02, t);
  placeBill(U.hero, st, vis * Math.min(1, spawnP) * fade);
  U.ghosts.forEach((gm, i) => { const tt = t - 0.035 * (i + 1); const sg = heroState(tt); const dist = Math.hypot(sg[0] - st[0], sg[1] - st[1], sg[2] - st[2]); const v = clamp(dist / 0.18, 0, 1) * vis * fade * (tt > T4.cet ? 1 : 0); placeBill(gm, sg, v); });
  U.heroGlow.position.set(st[0], st[1], st[2] + 0.1); U.heroGlow.material.opacity = vis * fade * (0.55 + 0.25 * Math.sin(t * 9)) * lin(T4.cet, T4.cet + 0.2, t); U.heroGlow.scale.setScalar(2.2 + 1.8 * lin(T4.pourrait, T4.changer + 0.1, t) * (1 - lin(T4.changer + 0.4, T4.manger, t)));
  // courses : billet fils -> objet
  for (const it of U.items) {
    const tl = it.t - 0.26, fl = lin(tl, it.t, t); const o = it.o;
    const sTar = [it.x, TOP + 0.55, it.z]; const sSrc = [0.0, 1.05, 0.5];
    const eF = eio(fl); it.sb.position.set(lerp(sSrc[0], sTar[0], eF), lerp(sSrc[1], sTar[1], eF) + Math.sin(Math.PI * fl) * 0.35, lerp(sSrc[2], sTar[2], eF)); it.sb.rotation.set(-1.0 + fl * 4, fl * 6, fl * 2);
    const sbS = 0.34 * (1 - lin(0.7, 1.0, fl)) * (t >= tl && t < it.t ? 1 : 0); it.sb.scale.setScalar(Math.max(1e-4, sbS)); it.sb.visible = sbS > 0.01;
    const s = t < it.t ? 0 : pop(t, it.t, 0.22); const fall = 1 - eout(lin(it.t, it.t + 0.2, t)); const bounce = t > it.t + 0.14 ? 0.05 * Math.abs(Math.sin((t - it.t - 0.14) * 16)) * Math.exp(-(t - it.t - 0.14) * 6) : 0;
    setS(o, s); o.position.set(it.x, TOP + 0.4 * fall + bounce, it.z); const sq = 1 + 0.12 * Math.max(0, Math.sin((t - it.t) * 14)) * Math.exp(-(t - it.t) * 7); o.scale.set(s * sq * it.s, s * it.s / sq, s * sq * it.s); if (s <= 0.003) o.visible = false;
  }

  // porte : facture -> tampon -> porte qui s'ouvre
  const inv = U.invB, appear = pop(t, T4.se1, 0.26);
  const away = lin(T4.loger + 0.28, T4.loger + 0.5, t);
  inv.g.visible = t >= T4.se1 - 0.02 && away < 1; const iS = Math.max(1e-4, appear * (1 - eio(away)));
  inv.g.scale.setScalar(iS); inv.g.position.set(14.0, 0.97 + 0.9 * eio(away), -0.86 + 0.5 * eio(away)); inv.g.rotation.x = -(Math.PI / 2 - 0.5) - 0.9 * eio(away); inv.g.rotation.z = 0.5 * eio(away);
  const tc = T4.loger + 0.02; const stampIn = t >= tc;
  const tr = t < tc ? 1.25 * Math.pow(1 - lin(tc - 0.3, tc, t), 1.6) : 1.25 * eout(lin(tc + 0.06, tc + 0.3, t));
  U.toolB.position.z = 0.04 + tr; U.toolB.visible = t >= tc - 0.31 && t < tc + 0.34;
  inv.tag.scale.setScalar(Math.max(1e-4, stampIn ? 1 - lin(tc, tc + 0.1, t) : 1)); inv.tag.visible = !stampIn || t < tc + 0.1;
  const sp2 = stampIn ? 1 + 0.35 * (1 - eout(lin(tc, tc + 0.18, t))) : 0; inv.stamp.scale.setScalar(Math.max(1e-4, sp2)); inv.stamp.visible = stampIn; inv.stamp.material.opacity = 1;
  const ck = stampIn ? pop(t, tc + 0.08, 0.26) : 0; inv.check.scale.setScalar(Math.max(1e-4, ck)); inv.check.visible = ck > 0.01;
  inv.paper.position.z = stampIn && t < tc + 0.12 ? -0.02 * Math.sin(lin(tc, tc + 0.12, t) * Math.PI) : 0;
  const open = eoutBack(lin(T4.loger + 0.22, T4.loger + 0.54, t)) * 1.0;
  U.hinge.rotation.y = Math.min(1.95, open * 1.9);
  const openK = sstep(T4.loger + 0.2, T4.loger + 0.55, t);
  U.spill.material.opacity = 0.7; U.spill.scale.set(1, 1, 0.2 + 0.8 * openK); U.spill.visible = openK > 0.01;
  U.doorGlow.material.opacity = 0.42 * openK; U.doorGlow.scale.setScalar(3.0 + 1.6 * openK);
  U.keyG.visible = false;

  // cabinet de soins : la croix s'allume, les patients arrivent, le soignant les accueille
  const on = lin(T4.soigner - 0.02, T4.soigner + 0.12, t);
  U.cross.userData.inner.color.setHex(mixHex(0x1c6a46, 0x34e07c, on)); U.cross.scale.setScalar(1 + 0.1 * Math.max(0, Math.sin((t - T4.soigner) * 9)) * Math.exp(-(t - T4.soigner) * 3));
  U.crossHalo.material.opacity = 0.58 * on * (0.85 + 0.15 * Math.sin(t * 5)); U.crossHalo.scale.setScalar(5.6 + 1.2 * Math.sin(t * 3));
  const Cx = 28, arriveU = eio(lin(T4.se1 + 0.1, T4.se2 + 0.0, t)); const walk = 1 - arriveU;
  const parX = lerp(29.55, 32.8, walk), kidX = lerp(28.75, 32.0, walk);
  U.par.position.set(parX, Math.abs(Math.sin(t * 9)) * 0.03 * (walk > 0.01 ? 1 : 0), 0.1); U.par.rotation.y = -1.1; U.kid.position.set(kidX, Math.abs(Math.sin(t * 9 + 1)) * 0.03 * (walk > 0.01 ? 1 : 0), 0.3); U.kid.rotation.y = -0.85;
  const wv = Math.sin(t * 8.5), ww = lin(T4.soigner + 0.05, T4.soigner + 0.25, t) * (1 - lin(b4 - 0.5, b4 - 0.3, t));
  U.par.userData.armL.rotation.set(0, 0, 0.12); U.par.userData.armR.rotation.set(-0.7 * walk, 0, -0.12); U.par.userData.legL.rotation.x = Math.sin(t * 9) * 0.5 * walk; U.par.userData.legR.rotation.x = -Math.sin(t * 9) * 0.5 * walk;
  U.kid.userData.armR.rotation.set(-2.4 * ww, 0, -0.12 * (1 - ww) + 0.4 * ww + 0.25 * ww * wv); U.kid.userData.armL.rotation.set(-0.6 * walk, 0, 0.12); U.kid.userData.legL.rotation.x = Math.sin(t * 9 + 1) * 0.5 * walk; U.kid.userData.legR.rotation.x = -Math.sin(t * 9 + 1) * 0.5 * walk;
  const d = U.doc; d.position.y = 0.012 * Math.sin(t * 2.4); d.userData.armL.rotation.set(-2.4 * ww, 0, 0.12 * (1 - ww) - 0.4 * ww - 0.25 * ww * Math.sin(t * 8.5 + 1)); d.userData.armR.rotation.set(-0.5 * lin(T4.soigner + 0.3, T4.soigner + 0.5, t), 0, -0.12); d.rotation.x = 0.05 * ww; d.rotation.y = -0.15;
  // billet unique qui monte au centre du cadre
  const e0 = T4.soigner + 0.35, fin = b4 - 0.02;
  const bs = track(t, [{ t: e0, v: [Cx + 0.05, 3.75, -1.7, 0.1, 0.2, 0.3, 0.6], arc: 0 }, { t: fin, v: [28.5, 2.36, 1.0, 0.62, 0.0, 0.0, 0.0], e: eout }]);
  const vis2 = t >= e0 ? 1 : 0; placeBill(U.bill2, bs, vis2);
  U.ghosts2.forEach((gm, i) => { const tt = t - 0.04 * (i + 1); const s2 = track(tt, [{ t: e0, v: [Cx + 0.05, 3.75, -1.7, 0.1, 0.2, 0.3, 0.6] }, { t: fin, v: [28.5, 2.36, 1.0, 0.62, 0.0, 0.0, 0.0], e: eout }]); placeBill(gm, s2, tt > e0 && t < fin - 0.08 ? 1 : 0); });
  U.bill2Glow.position.set(bs[0], bs[1], bs[2] - 0.05); U.bill2Glow.material.opacity = vis2 * lin(e0, fin, t) * 0.8; U.bill2Glow.scale.setScalar(2.4 + 2.6 * lin(e0, fin, t));
  // la salle s'éteint doucement pour isoler le billet (raccord)
  U.crossHalo.material.opacity *= 1 - lin(b4 - 0.34, b4 - 0.08, t);
  const dimO = 0.9 * sstep(T4.soigner + 0.55, b4 - 0.06, t); U.dim.material.opacity = dimO; U.dim.visible = dimO > 0.004;
}
