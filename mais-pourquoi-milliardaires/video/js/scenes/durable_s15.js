// Scène 15 — « Sauf qu'une fois cet argent dépensé, si elles n'ont toujours pas de revenus stables, le problème risque de revenir. »
// Table du bénéficiaire (raccord avec le module life) : facture réglée + pile de billets qui s'envolent un à un vers logement / nourriture / énergie / transport,
// calendrier dont les pages tournent (factures récurrentes pictogrammes, aucun montant), jauge « SOLDE » qui baisse, tuyau de revenu stable VIDE (robinet fermé),
// puis les factures reviennent sur la table. Aucun chiffre inventé : jauge à segments, numéros de jours de calendrier uniquement.
import { T, PAL, H, clamp, lerp, sstep, lin, eio, eout, ein, eoutBack, mk, FONT, textPlane, glow, M, MB, mesh, bx, cy, sp, put, hide, mixHex, pop, setS, bez, _o, _c, _v,
  texIcon, iconPlane, planeMat, EXP, EXP_KEYS, texGingham, texWood, texWall, texTag, texStamp, texInvoice, billBoxGeo, billBoxMats, tableLamp, plant, floorLamp, drawIcon } from "./durable_kit.js";
import { onset } from "../plan.js";

const o15 = (re, k = 0) => onset(15, re, k);
export const T15 = { sauf: o15(/^sauf$/), quune: o15(/^qunune$|^quune$/), fois: o15(/^fois$/), argent: o15(/^argent$/), depense: o15(/^depense/), si: o15(/^si$/), toujours: o15(/^toujours$/), revenus: o15(/^revenus$/), stables: o15(/^stables$/), le: o15(/^le$/), probleme: o15(/^probleme$/), risque: o15(/^risque$/), de: o15(/^de$/, 1), revenir: o15(/^revenir$/) };
export const TOP = 0.9;                       // dessus de table
const NB = 48;
const ICON = { logement: [-0.89, 1.7, -0.78], nourriture: [-0.23, 1.8, -0.78], energie: [0.43, 1.8, -0.78], transport: [1.09, 1.7, -0.78] };
const ICON_T = { logement: T15.fois + 0.0, nourriture: T15.fois + 0.05, energie: T15.fois + 0.1, transport: T15.fois + 0.15 };
const PILE = [0.35, -0.12];
const CAL = { x: -0.35, yTop: 4.22, z: -1.96 };
const FLIPS = [60.26, 61.63, 63.0], FLIP_D = 0.28;
const PERIOD_A = [59.14, 60.52, 61.89, 63.26], RATE = 27;
const MONTHS = ["JANVIER", "FÉVRIER", "MARS", "AVRIL"], W0 = [2, 4, 0, 3];
const PIN_DAYS = { logement: [1], nourriture: [5, 12, 19, 26], energie: [8, 22], transport: [15] };
const LAND_T = [T15.probleme, T15.risque, T15.de, T15.revenir];            // instants d'atterrissage des factures qui reviennent
const LAND = [[-0.52, 0.04], [0.0, 0.0], [0.52, 0.05], [1.04, 0.0]];       // (x, z) sur la table
const PIPE = { y: 4.78, z: -1.2, x0: -2.8, xv: -0.45, xs: 0.95 };

const topPlane = (w, h) => { const g = new T.PlaneGeometry(w, h); g.translate(0, -h / 2, 0); return g; };
const botPlane = (w, h) => { const g = new T.PlaneGeometry(w, h); g.translate(0, h / 2, 0); return g; };
const texCal = (k) => mk(480, 608, (g, w, h) => {
  g.fillStyle = "#f7f1e0"; g.fillRect(0, 0, w, h); g.fillStyle = "#b8453a"; g.fillRect(0, 0, w, 128);
  g.fillStyle = "#1b1410"; for (const x of [150, 330]) { g.beginPath(); g.arc(x, 22, 9, 0, 7); g.fill(); }
  g.fillStyle = "#fff"; g.font = `900 52px ${FONT}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(MONTHS[k], w / 2, 74);
  g.font = `900 24px ${FONT}`; g.fillStyle = "#8a7a66"; "LMMJVSD".split("").forEach((c, i) => g.fillText(c, 48 + 64 * i, 152));
  g.strokeStyle = "rgba(0,0,0,.08)"; g.lineWidth = 2;
  for (let d = 1; d <= 30; d++) { const c = (d - 1 + W0[k]) % 7, r = Math.floor((d - 1 + W0[k]) / 7); const x = 48 + 64 * c, y = 208 + 64 * r; g.strokeRect(x - 30, y - 30, 60, 60); g.fillStyle = c === 6 ? "#b8453a" : "#4a4036"; g.font = `900 25px ${FONT}`; g.fillText(String(d), x, y + 2); }
});
const texX = () => mk(64, 64, (g) => { g.strokeStyle = "#c0392b"; g.lineWidth = 9; g.lineCap = "round"; g.beginPath(); g.moveTo(10, 10); g.lineTo(54, 54); g.moveTo(54, 10); g.lineTo(10, 54); g.stroke(); });
const texToday = () => mk(64, 64, (g) => { g.strokeStyle = "#e8b84a"; g.lineWidth = 8; g.beginPath(); g.roundRect(5, 5, 54, 54, 10); g.stroke(); g.fillStyle = "rgba(232,184,74,.22)"; g.fill(); });
const cell = (k, d) => { const c = (d - 1 + W0[k]) % 7, r = Math.floor((d - 1 + W0[k]) / 7); return [-0.6 + 0.2 * c, -(0.65 + 0.2 * r)]; };

export function buildS15(root) {
  const g = new T.Group(); root.add(g); const S = { g };
  // ---------- pièce : sol, mur, plinthe, tapis ----------
  { const fl = new T.Mesh(new T.PlaneGeometry(40, 30), new T.MeshLambertMaterial({ map: texWood([10, 7]), emissive: 0x201208 })); fl.rotation.x = -Math.PI / 2; fl.position.set(0, 0, -2); g.add(fl); S.floor = fl; }
  { const wall = new T.Mesh(new T.PlaneGeometry(26, 9), new T.MeshLambertMaterial({ map: texWall("#f2dcc0", "#e6c9a4", [28, 1]), emissive: 0x3a2a1c })); wall.position.set(0, 4.5, -2.1); g.add(wall); S.wall = wall; }
  bx(26, 1.1, 0.08, M(0x2f7a6c, 0x0c241e), 0, 0.55, -2.05, g); bx(26, 0.06, 0.12, M(0xf3e6c8, 0x2a2418), 0, 1.12, -2.04, g);
  { const rug = cy(2.7, 2.7, 0.02, M(0xc0654a, 0x2a1008), 0, 0.012, 0.2, g, 40); cy(2.15, 2.15, 0.024, M(0xe9ae62, 0x2a1c08), 0, 0.002, 0, rug, 40); cy(1.65, 1.65, 0.028, M(0xc0654a, 0x2a1008), 0, 0.004, 0, rug, 40); }
  { const pa = plant(1.9); pa.position.set(1.95, 0, -1.7); g.add(pa); const pb = plant(1.2, 0xd98f3a, 0x4ca64a); pb.position.set(-2.2, 0, -1.5); g.add(pb); }
  { const fl2 = floorLamp(); fl2.position.set(-1.75, 0, -1.75); g.add(fl2); S.floorLamp = fl2; const gl = glow(0xffc070, 4.2, 0.4); gl.position.set(-1.75, 1.85, -1.5); g.add(gl); S.flGlow = gl; }
  { const f1 = new T.Group(); bx(0.62, 0.8, 0.05, M(0x5a3a1c), 0, 0, 0, f1); const pic = new T.Mesh(new T.PlaneGeometry(0.5, 0.68), new T.MeshLambertMaterial({ map: mk(64, 80, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#ffd9a0"); gr.addColorStop(1, "#f29f5c"); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = "#fff0b0"; c.beginPath(); c.arc(w * 0.68, h * 0.34, 10, 0, 7); c.fill(); c.fillStyle = "rgba(20,70,50,.8)"; c.beginPath(); c.moveTo(0, h); c.lineTo(0, h * 0.7); c.quadraticCurveTo(w * 0.3, h * 0.45, w * 0.55, h * 0.72); c.quadraticCurveTo(w * 0.8, h * 0.6, w, h * 0.75); c.lineTo(w, h); c.fill(); }), emissive: 0x2a2218 })); pic.position.z = 0.03; f1.add(pic); f1.position.set(1.28, 3.0, -2.02); g.add(f1); }

  // ---------- table ----------
  { const tb = new T.Group(); bx(2.9, 0.07, 2.3, M(0xb9824f, 0x1e1006), 0, TOP - 0.035, 0.25, tb); bx(2.66, 0.1, 2.06, M(0x8b5a33), 0, TOP - 0.12, 0.25, tb);
    const cloth = new T.Mesh(new T.PlaneGeometry(2.94, 2.34), new T.MeshLambertMaterial({ map: texGingham(), emissive: 0x2a1810 })); cloth.rotation.x = -Math.PI / 2; cloth.position.set(0, TOP + 0.003, 0.25); tb.add(cloth);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) bx(0.1, TOP - 0.07, 0.1, M(0x8b5a33), sx * 1.36, (TOP - 0.07) / 2, sz * 1.05 + 0.25, tb); g.add(tb); }
  // lampe de table (raccord life)
  { const tl = tableLamp(); tl.position.set(-1.18, TOP, -0.62); g.add(tl); S.tl = tl; const gl = glow(0xffc070, 2.4, 0.4); gl.position.set(-1.18, TOP + 0.4, -0.62); g.add(gl); S.tlGlow = gl; }

  // ---------- facture réglée (raccord avec S14) ----------
  { const w = 0.6, h = w * 352 / 256; const inv = new T.Group(); inv.position.set(-1.15, TOP + 0.004, 0.45); inv.rotation.x = -(Math.PI / 2 - 0.6); inv.rotation.z = 0.06; g.add(inv); S.inv0 = inv;
    inv.add(new T.Mesh(botPlane(w, h), new T.MeshLambertMaterial({ map: texInvoice("logement"), emissive: 0x6a6a60, side: T.DoubleSide })));
    const st = new T.Mesh(new T.PlaneGeometry(w * 0.9, w * 0.9 * 200 / 512), new T.MeshBasicMaterial({ map: texStamp(), transparent: true, depthWrite: false })); st.position.set(0, h * 0.34, 0.006); st.rotation.z = -0.16; inv.add(st);
    const ck = new T.Mesh(new T.PlaneGeometry(w * 0.3, w * 0.3), planeMat(texIcon("check", { fg: "#eafff1", bg: "#17a65a", ring: null }), { depthWrite: false })); ck.position.set(-w * 0.2, h * 0.64, 0.01); inv.add(ck); }

  // ---------- la pile de billets (instanciée, 48 billets) ----------
  const im = new T.InstancedMesh(billBoxGeo(), billBoxMats(), NB); im.frustumCulled = false; g.add(im); S.im = im;
  const LAYERS = [[3, 5], [3, 4], [2, 4], [2, 3], [2, 2], [1, 2], [1, 1]]; const slots = [];
  LAYERS.forEach(([nx, nz], L) => { for (let ix = 0; ix < nx; ix++) for (let iz = 0; iz < nz; iz++) { const i = slots.length; slots.push({ L, ix, iz, x: PILE[0] + (ix - (nx - 1) / 2) * 0.6 + (H(i, 1) - 0.5) * 0.05 + (L % 2 ? 0.05 : -0.03), y: TOP + 0.04 + L * 0.063, z: PILE[1] + (iz - (nz - 1) / 2) * 0.27 + (H(i, 2) - 0.5) * 0.03, yaw: (H(i, 3) - 0.5) * 0.3, s: 59.14 + 0.009 * i, tilt: (H(i, 4) - 0.5) * 2.4, spin: (H(i, 5) - 0.5) * 3 }); } });
  // ordre de départ : couches du haut d'abord ; pour la couche 0, l'arrière d'abord (les 2 derniers billets restent à l'avant)
  const order = slots.map((_, i) => i).sort((a, b) => (slots[b].L - slots[a].L) || (slots[a].L === 0 ? (slots[a].x - slots[b].x) || (slots[a].z - slots[b].z) : H(a, 9) - H(b, 9)));
  const dep = new Array(NB).fill(1e9), dest = new Array(NB).fill(0);
  order.forEach((i, k) => { dep[i] = k < 8 ? 59.88 + k * 0.055 : k < 43 ? 60.4 + (k - 8) * 0.0155 : k === 43 ? 61.95 : k === 44 ? 62.55 : k === 45 ? 63.3 : 1e9; dest[i] = (k + Math.floor(H(k, 7) * 2)) % 4; });
  S.slots = slots; S.dep = dep; S.dest = dest; S.dur = slots.map((_, i) => 0.5 + 0.16 * H(i, 11));

  // ---------- les 4 dépenses (pastilles) ----------
  S.icons = EXP_KEYS.map((k, n) => { const grp = new T.Group(); grp.position.set(...ICON[k]); g.add(grp);
    const bgd = new T.Mesh(new T.CircleGeometry(0.31, 28), new T.MeshBasicMaterial({ color: 0x120c08 })); bgd.position.z = -0.01; grp.add(bgd);
    const pl = iconPlane(EXP[k].kind, 0.5, { bg: EXP[k].bg }); grp.add(pl);
    const lab = textPlane(EXP[k].label, { w: 0.64, h: 0.15, px: 320, size: 0.5, color: "#f3ecd4", bg: "rgba(10,8,6,.6)" }); lab.position.set(0, 0.4, 0.01); grp.add(lab);
    const gl = glow(EXP[k].hex, 1.5, 0); gl.position.z = 0.03; grp.add(gl);
    return { grp, pl, lab, gl, k }; });

  // ---------- jauge SOLDE (10 segments) ----------
  { const gp = new T.Group(); gp.position.set(0.05, TOP + 0.01, 1.32); gp.rotation.x = -1.12; g.add(gp); S.gauge = gp;
    bx(1.7, 0.52, 0.06, M(0x1d1f22, 0x0a0a0c), 0, 0.26, 0, gp); bx(1.76, 0.03, 0.08, M(PAL.gold, 0x4a3808), 0, 0.535, 0, gp);
    const seg = new T.InstancedMesh(new T.BoxGeometry(0.13, 0.22, 0.04), new T.MeshBasicMaterial({ color: 0xffffff }), 10); seg.frustumCulled = false; seg.position.set(0, 0.17, 0.05); gp.add(seg); S.seg = seg;
    const lb = textPlane("SOLDE", { w: 0.7, h: 0.17, px: 320, size: 0.7, color: "#f3ecd4", align: "left" }); lb.position.set(-0.52, 0.4, 0.04); gp.add(lb); }

  // ---------- les factures qui reviennent ----------
  S.inv = EXP_KEYS.map((k, n) => { const w = 0.5, h = w * 352 / 256; const grp = new T.Group(); g.add(grp); const lean = new T.Group(); grp.add(lean); lean.rotation.x = -(Math.PI / 2 - 0.6);
    lean.add(new T.Mesh(botPlane(w, h), new T.MeshLambertMaterial({ map: texInvoice(k), emissive: 0x4e4e46, side: T.DoubleSide })));
    const tag = new T.Mesh(new T.PlaneGeometry(w * 0.72, w * 0.72 * 96 / 320), new T.MeshBasicMaterial({ map: texTag(), transparent: true, depthWrite: false })); tag.position.set(w * 0.08, h * 0.3, 0.008); tag.rotation.z = 0.12; lean.add(tag);
    grp.visible = false; return { grp, lean, tag, w, h, k, n }; });

  // ---------- calendrier mural : 4 pages empilées, chacune avec ses pastilles de factures récurrentes ----------
  { const board = bx(1.66, 2.2, 0.05, M(0x5a3a24, 0x1a0e06), CAL.x, CAL.yTop - 1.05, CAL.z - 0.1, g); S.calBoard = board;
    const nail = sp(0.04, M(0xe8b84a), CAL.x, CAL.yTop + 0.08, CAL.z - 0.05, g, 8, 6); }
  S.pages = []; const xTex = texX(), todayTex = texToday();
  for (let k = 0; k < 4; k++) {
    const pv = new T.Group(); pv.position.set(CAL.x, CAL.yTop, CAL.z + 0.016 * (3 - k)); g.add(pv);
    const geo = topPlane(1.5, 1.9);
    pv.add(new T.Mesh(geo, new T.MeshLambertMaterial({ map: texCal(k), emissive: 0x6a6458, side: T.FrontSide })));
    pv.add(new T.Mesh(geo, new T.MeshLambertMaterial({ color: 0xe6dcc4, emissive: 0x3a362c, side: T.BackSide })));
    const today = new T.Mesh(new T.PlaneGeometry(0.2, 0.2), new T.MeshBasicMaterial({ map: todayTex, transparent: true, depthWrite: false })); today.position.z = 0.004; pv.add(today);
    const xs = new T.InstancedMesh(new T.PlaneGeometry(0.15, 0.15), new T.MeshBasicMaterial({ map: xTex, transparent: true, alphaTest: 0.3 }), 30); xs.frustumCulled = false; xs.position.z = 0.006; pv.add(xs);
    const pins = []; for (const key of EXP_KEYS) for (const d of PIN_DAYS[key]) { const p = iconPlane(EXP[key].kind, 0.18, { bg: EXP[key].bg }); const [cx, cy2] = cell(k, d); p.position.set(cx, cy2, 0.012); pv.add(p); pins.push({ p, d, t0: PERIOD_A[k] + (d - 1) / RATE }); }
    S.pages.push({ pv, today, xs, pins, k }); }

  // ---------- tuyau du revenu stable : ABSENT (vide, robinet fermé, pointillé grisé) ----------
  { const pg = new T.Group(); pg.position.set(PIPE.x0, PIPE.y, PIPE.z); g.add(pg); S.pipeG = pg;
    const steel = M(0x95a8a0, 0x1a2a26), dark = M(0x1a1f1e);
    const len = PIPE.xs - PIPE.x0; const main = cy(0.1, 0.1, len, steel, len / 2, 0, 0, pg, 14); main.rotation.z = Math.PI / 2; S.pipeMain = main;
    for (const x of [0.4, len * 0.45, len - 0.35]) { const fl = cy(0.15, 0.15, 0.06, steel, x, 0, 0, pg, 14); fl.rotation.z = Math.PI / 2; }
    // intérieur sombre visible à l'extrémité gauche (tuyau vide)
    { const tube = mesh(new T.CylinderGeometry(0.085, 0.085, len - 0.02, 12, 1, true), new T.MeshBasicMaterial({ color: 0x050808, side: T.BackSide }), len / 2, 0, 0, pg); tube.rotation.z = Math.PI / 2; }
    // supports muraux
    for (const x of [0.9, len * 0.7]) { bx(0.1, 0.1, 0.9, M(0x4a5552), x, 0, -0.45, pg); }
    // robinet fermé
    const vx = PIPE.xv - PIPE.x0; const val = new T.Group(); val.position.set(vx, 0, 0); pg.add(val); S.valve = val;
    bx(0.34, 0.3, 0.34, steel, 0, 0, 0, val); cy(0.04, 0.04, 0.3, steel, 0, 0.28, 0, val, 8);
    const wheel = new T.Group(); wheel.position.y = 0.44; val.add(wheel); S.wheel = wheel;
    const tr = mesh(new T.TorusGeometry(0.2, 0.035, 8, 20), M(0xd8382b, 0x4a0c08), 0, 0, 0, wheel); tr.rotation.x = Math.PI / 2; for (let i = 0; i < 3; i++) { const sk = bx(0.4, 0.03, 0.03, M(0xd8382b, 0x4a0c08), 0, 0, 0, wheel); sk.rotation.y = i * Math.PI / 3; }
    // coude + bec
    const sx = PIPE.xs - PIPE.x0; sp(0.14, steel, sx, 0, 0, pg, 12, 8); cy(0.1, 0.1, 0.5, steel, sx, -0.27, 0, pg, 12); cy(0.1, 0.07, 0.16, steel, sx, -0.6, 0, pg, 12); S.spout = [sx, -0.7];
    // plaque « REVENU STABLE » + étiquette FERMÉ
    const pl = textPlane("REVENU STABLE", { w: 1.1, h: 0.26, px: 512, size: 0.42, color: "#b4c0ba", bg: "#202624", border: "#6a7570" }); pl.position.set(0.5 - PIPE.x0, 0.36, 0.06); pg.add(pl); S.plaque = pl;
    const fm = textPlane("FERMÉ", { w: 0.62, h: 0.24, px: 320, size: 0.66, color: "#fff7ee", bg: "#d8382b" }); fm.position.set(vx - 0.75, 0.0, 0.2); pg.add(fm); S.closed = fm; }
  // pointillé gris du flux absent (de la sortie du bec jusqu'à la pile)
  { S.dots = []; const A = [PIPE.xs, PIPE.y - 0.82, PIPE.z], B = [PILE[0] + 0.1, 1.38, PILE[1] - 0.05], C = [PIPE.xs - 0.1, 2.4, -0.4]; const tmp = new T.Vector3();
    for (let i = 0; i < 14; i++) { const u = i / 13; bez(A, C, B, u, tmp); const d = sp(0.045, new T.MeshBasicMaterial({ color: 0x9aa6a0, transparent: true, opacity: 0.5 }), tmp.x, tmp.y, tmp.z, g, 8, 6); d.userData.u = u; S.dots.push(d); } }
  // impulsions de revenu qui buttent sur le robinet fermé
  S.pulses = [0, 1, 2].map(() => { const m = sp(0.075, new T.MeshBasicMaterial({ color: 0xe8b84a, transparent: true, opacity: 0.8 }), 0, 0, 0, g, 8, 6); m.visible = false; return m; });
  S.valveFlash = glow(0xff5a3a, 1.2, 0); S.valveFlash.position.set(PIPE.xv - 0.24, PIPE.y, PIPE.z + 0.1); g.add(S.valveFlash);
  S.spark = glow(0xffe6a0, 1.0, 0); g.add(S.spark);
  S.lowGlow = glow(0xff4a30, 1.6, 0); S.lowGlow.position.set(PILE[0] + 0.6, TOP + 0.2, 0.3); g.add(S.lowGlow);
  return S;
}

const gaugeLevel = (S, t) => { let a = 0; for (let i = 0; i < NB; i++) a += sstep(S.slots[i].s, S.slots[i].s + 0.32, t) - sstep(S.dep[i], S.dep[i] + 0.3, t); return a / NB; };
const GCOL = [0xff3b30, 0xff4a30, 0xff6a30, 0xff8c2a, 0xffae2a, 0xffd12a, 0xdde02a, 0xa8e03a, 0x6ae04a, 0x3ae070];
const SC = 0.45;

export function updateS15(S, t) {
  const dim = sstep(61.0, 63.4, t);
  // ---- billets
  const im = S.im, dist = [0, 0, 0, 0]; const arrivals = [[], [], [], []];
  for (let i = 0; i < NB; i++) {
    const s = S.slots[i], dp = S.dep[i];
    if (t < s.s) { hide(im, i); continue; }
    if (t < dp) { const u = eout(lin(s.s, s.s + 0.32, t)); const k = 1 - u; put(im, i, s.x, s.y + 1.8 * k, s.z, SC, SC, SC, k * s.tilt, s.yaw + k * s.spin, 0); continue; }
    const du = S.dur[i], u = (t - dp) / du; arrivals[S.dest[i]].push(dp + du);
    if (u >= 1) { hide(im, i); continue; }
    const P1 = ICON[EXP_KEYS[S.dest[i]]], mid = [(s.x + P1[0]) / 2 + (H(i, 12) - 0.5) * 0.6, Math.max(s.y, P1[1]) + 0.8 + 0.5 * H(i, 13), (s.z + P1[2]) / 2 + 0.55];
    const pu = u * u * (3 - 2 * u); bez([s.x, s.y, s.z], mid, P1, pu, _v);
    put(im, i, _v.x, _v.y, _v.z, SC * (1 - 0.8 * sstep(0.78, 1, u)), SC, SC * (1 - 0.8 * sstep(0.78, 1, u)), Math.PI * 0.0 + (-Math.PI / 2) * 0 + u * (3.2 + 2 * H(i, 14)), s.yaw + u * (2 + 3 * H(i, 15)), u * 2 * (H(i, 16) - 0.5));
  }
  im.instanceMatrix.needsUpdate = true;
  // ---- pastilles de dépenses : apparition, pulsation à chaque billet reçu, atténuation, flash quand la facture repart
  S.icons.forEach((ic, n) => {
    const k = EXP_KEYS[n]; let pulse = 0, hits = 0; for (const a of arrivals[n]) { const d = t - a; if (d > 0 && d < 0.3) { pulse += 0.5 * Math.exp(-d * 14); hits++; } }
    pulse = Math.min(0.3, pulse * 0.2);
    const sc = pop(t, ICON_T[k], 0.3); const inv = S.inv[n], lt = LAND_T[n], depT = lt - 0.36; const out = sstep(depT - 0.05, depT + 0.12, t) * (1 - sstep(lt - 0.1, lt + 0.3, t));
    setS(ic.grp, sc * (1 + pulse + 0.25 * out)); ic.grp.position.y = ICON[k][1] + 0.025 * Math.sin(t * 2.1 + n * 1.3);
    const dm = 1 - 0.5 * sstep(61.2, 61.9, t) + 0.5 * out; ic.pl.material.color.setScalar(clamp(dm, 0.35, 1.2)); ic.gl.material.opacity = clamp(pulse * 1.6 + 0.5 * out, 0, 0.7);
    ic.lab.visible = sc > 0.5;
  });
  // ---- factures qui reviennent
  S.inv.forEach((iv, n) => {
    const lt = LAND_T[n], depT = lt - 0.36; const u = lin(depT, lt, t); iv.grp.visible = t >= depT;
    if (t < depT) return;
    const P0 = ICON[EXP_KEYS[n]], P1 = [LAND[n][0], TOP + 0.004, LAND[n][1]]; const e = u * u * (3 - 2 * u);
    const mid = [(P0[0] + P1[0]) / 2, Math.max(P0[1], 1.6) + 0.3, (P0[2] + P1[2]) / 2 + 0.7]; bez(P0, mid, P1, e, _v);
    const land = t >= lt, since = t - lt, bounce = land ? 0.07 * Math.exp(-since * 9) * Math.abs(Math.sin(since * 22)) : 0;
    iv.grp.position.set(_v.x, _v.y + bounce, _v.z); iv.grp.rotation.y = lerp(0.5 * (n % 2 ? -1 : 1), 0.05 * (n - 1.5), e); iv.grp.rotation.z = lerp(0.6, 0.0, e) * 0.5;
    const grow = lerp(0.42, 1, eout(u)) * (land ? 1 + 0.12 * Math.exp(-since * 12) : 1); iv.grp.scale.setScalar(grow);
    const tg = land ? pop(t, lt + 0.02, 0.22) : 0; setS(iv.tag, tg); iv.tag.visible = tg > 0.01;
  });
  // ---- facture réglée : discrète pendant l'urgence, légèrement relevée en fin
  { const ex = eio(lin(T15.le - 0.04, T15.le + 0.34, t)); S.inv0.position.x = -1.15 - 1.3 * ex; S.inv0.position.y = TOP + 0.004 + 0.25 * Math.sin(ex * Math.PI); S.inv0.rotation.z = 0.06 + 0.5 * ex; S.inv0.scale.setScalar(1 - 0.35 * ex); S.inv0.visible = ex < 0.999; }
  // ---- jauge SOLDE
  { const lv = gaugeLevel(S, t); const blink = t > T15.probleme ? 0.65 + 0.35 * Math.sin(t * 13) : 1;
    for (let k = 0; k < 10; k++) { const f = clamp(lv * 10 - k, 0, 1); const lit = f > 0.02; const col = lit ? GCOL[k] : 0x2a2d2f; _c.setHex(col); _c.multiplyScalar(lit ? (0.55 + 0.45 * f) * (k < 2 ? blink : 1) : 1); S.seg.setColorAt(k, _c); _o.position.set(-0.69 + 0.153 * k, 0, 0); _o.rotation.set(0, 0, 0); _o.scale.set(1, 1, 1); _o.updateMatrix(); S.seg.setMatrixAt(k, _o.matrix); }
    S.seg.instanceColor.needsUpdate = true; S.seg.instanceMatrix.needsUpdate = true; S.gaugeLevel = lv; }
  // ---- calendrier
  S.pages.forEach((P, k) => {
    const ft = k < 3 ? FLIPS[k] : 1e9; const fu = k < 3 ? lin(ft, ft + FLIP_D, t) : 0; const th = (Math.PI / 2) * Math.pow(fu, 1.6);
    P.pv.scale.y = Math.max(1e-3, Math.cos(th)); P.pv.rotation.x = -0.35 * Math.sin(th * 2); P.pv.position.z = CAL.z + 0.016 * (3 - k) + 0.25 * Math.sin(th);
    P.pv.visible = !(k < 3 && fu >= 1) && (k === 0 || t >= FLIPS[k - 1] - 0.4);
    if (!P.pv.visible) return;
    const a = PERIOD_A[k], dayf = 1 + RATE * Math.max(0, t - a), day = Math.min(30, Math.floor(dayf)); const active = t >= a && k >= 0;
    const [cx, cy2] = cell(k, day); P.today.position.set(cx, cy2, 0.004); P.today.visible = active; P.today.scale.setScalar(1 + 0.08 * Math.sin(t * 20));
    for (let d = 1; d <= 30; d++) { if (active && d < day) { const [x, y] = cell(k, d); put(P.xs, d - 1, x, y, 0, 1, 1, 1, 0, 0, 0.1 * (H(d + k * 31, 3) - 0.5)); } else hide(P.xs, d - 1); }
    P.xs.instanceMatrix.needsUpdate = true;
    for (const pn of P.pins) { const s = pop(t, pn.t0, 0.2); setS(pn.p, s * (1 + 0.25 * Math.exp(-Math.max(0, t - pn.t0) * 9))); }
  });
  // ---- tuyau absent
  { const g0 = lin(61.2, 61.62, t); const pgS = eio(g0); S.pipeG.visible = g0 > 0.001; S.pipeG.scale.x = Math.max(1e-3, pgS);
    S.plaque.visible = t >= T15.revenus; setS(S.plaque, pop(t, T15.revenus, 0.28)); S.plaque.scale.set(Math.max(1e-4, pop(t, T15.revenus, 0.28)), Math.max(1e-4, pop(t, T15.revenus, 0.28)), 1);
    const w = pop(t, 61.55, 0.3); S.valve.scale.setScalar(Math.max(1e-4, w)); S.valve.visible = w > 0.01;
    S.wheel.rotation.y = -(2.2 * Math.PI) * eout(lin(61.62, 62.0, t)) + 0.9;       // le robinet se ferme (rotation puis blocage)
    const fm = pop(t, 62.0, 0.26); S.closed.visible = fm > 0.01; S.closed.scale.setScalar(Math.max(1e-4, fm)); S.closed.rotation.z = 0.06 * Math.sin(t * 5) * fm;
    // pointillé : se trace de haut en bas, onde « il devrait y avoir du flux » sans que rien n'arrive
    S.dots.forEach((d, i) => { const u = d.userData.u; const s = pop(t, 61.85 + u * 0.35, 0.18); setS(d, s); const wv = t > T15.stables ? Math.exp(-Math.pow((t - T15.stables - 0.1 - u * 0.5) / 0.09, 2)) : 0; d.material.opacity = (0.34 + 0.06 * Math.sin(t * 3 + i)) + 0.5 * wv; d.material.color.setHex(wv > 0.3 ? 0xe8b84a : 0x9aa6a0); });
    S.pulses.forEach((p, j) => { const ph = ((t - T15.revenus) / 0.85 + j / 3); const on = t > T15.revenus && t < 63.0; const f = ph - Math.floor(ph); p.visible = on && f < 0.97; const x = PIPE.x0 + 0.1 + (PIPE.xv - PIPE.x0 - 0.35) * f; p.position.set(x, PIPE.y, PIPE.z); p.material.opacity = 0.85 * (1 - sstep(0.85, 0.97, f)); p.scale.setScalar(1 - 0.5 * sstep(0.85, 0.97, f)); });
    let vf = 0; for (let j = 0; j < 3; j++) { const ph = ((t - T15.revenus) / 0.85 + j / 3); const f = ph - Math.floor(ph); if (t > T15.revenus && t < 63.0 && f > 0.9) vf = Math.max(vf, (f - 0.9) / 0.1); }
    S.valveFlash.material.opacity = 0.6 * vf; S.valveFlash.scale.setScalar(0.8 + 0.8 * vf); }
  S.lowGlow.material.opacity = 0.5 * sstep(63.7, 64.1, t) * (0.6 + 0.4 * Math.sin(t * 12));
  // ---- lampe qui faiblit
  { const lampOn = 1 - 0.55 * dim; const fl = t > T15.risque - 0.02 && t < T15.risque + 0.25 ? 0.5 + 0.5 * Math.sin(t * 60) : 1; S.tl.userData.shade.material.color.setHex(hexMixLamp(lampOn * fl)); S.tlGlow.material.opacity = 0.4 * lampOn * fl; S.flGlow.material.opacity = 0.4 * (1 - 0.7 * dim); }
}
const hexMixLamp = (u) => mixHex(0x7a5a3a, 0xffd69a, clamp(u, 0, 1)).getHex();

export const S15_LIGHTS = (t) => {
  const cold = sstep(61.2, 63.3, t);
  return {
    hemiC: mixHex(0xffeedd, 0xa9bbd8, cold).getHex(), hemiG: mixHex(0x6a4a34, 0x1c2230, cold).getHex(), hemi: lerp(1.2, 0.62, cold),
    dirC: mixHex(0xffd7a0, 0xb8c8ee, cold).getHex(), dir: lerp(1.15, 0.7, cold), dirP: [-4, 9, 8],
    ptC: 0xffb866, ptP: [-1.15, 1.75, -0.35], pt: lerp(9, 2.5, cold) * (t > T15.risque - 0.02 && t < T15.risque + 0.25 ? 0.5 + 0.5 * Math.sin(t * 60) : 1),
  };
};
export const S15_ENV = (t) => { const cold = sstep(61.2, 63.3, t); return { bg: mixHex(0x1a0f08, 0x070b10, cold).getHex(), fog: 0.012 }; };
export const S15_SHAKE = (t) => { let a = 0; for (const lt of LAND_T) { const d = t - lt; if (d >= 0 && d < 0.18) a = Math.max(a, 0.035 * Math.pow(1 - d / 0.18, 2)); } return a; };
