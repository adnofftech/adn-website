// Scène 7 du module shares : l'entreprise (tour) apparaît, se décompose en maquette éclatée dont les parts appartiennent à des actionnaires différents,
// une part (or) est mise en évidence avec son investisseur, puis usine / bureaux / salariés / produits, reconnexion, et le certificat final.
import { T, H, clamp, lerp, sstep, lin, eio, eout, ein, eoutBack, glowTex, certTex, FONT, MONO, textPlane, glow, mk } from "../shared.js";
import { _o, mixHex, pop, put, hide, inst, lam, bas, addMat, chartTex, ribbonTex, beamTex, investorIcon, buildFactory, buildOffice, buildWorkers, buildProducts } from "./shares_lib.js";

const FH = 1.7, BW = 4.5, NF = 8, QX = [1, -1, -1, 1], QZ = [1, 1, -1, -1];     // quadrants : 0 (+x,+z) 1 (-x,+z) 2 (-x,-z) 3 (+x,-z)
const COL = { G: 0xf0b93a, B: 0x3b82d6, C: 0xf0654f, T: 0x25b8a3, W: 0xc9d3dc };
//  OWN[étage][quadrant] : G = l'investisseur mis en évidence, B/C/T = autres actionnaires, W = autres porteurs
const OWN = ["WWTW", "WBTC", "GBWC", "GWTC", "GWTW", "GBTC", "GBWC", "WBWC"];
const ICONS = [["usine", -12, 8, "USINE"], ["bureaux", 12, 8, "BUREAUX"], ["salaries", -11.5, -7.5, "SALARIÉS"], ["produits", 11.5, -7.5, "PRODUITS"]];

export function buildS7() {
  const g = new T.Group(), S = {};
  // tour : 32 blocs (étage x quadrant)
  S.blocks = inst(new T.BoxGeometry(1, 1, 1), new T.MeshLambertMaterial({ map: ribbonTex(), color: 0xffffff, emissive: 0x0d141c }), NF * 4);
  S.shell = inst(new T.BoxGeometry(1, 1, 1), new T.MeshBasicMaterial({ color: 0xffd25a, side: T.BackSide }), 8);
  S.meta = []; const c = new T.Color();
  for (let k = 0; k < NF; k++) for (let j = 0; j < 4; j++) { const o = OWN[k][j]; S.meta.push({ k, j, o, i: k * 4 + j }); S.blocks.setColorAt(k * 4 + j, c.setHex(COL[o])); }
  S.gold = S.meta.filter((m) => m.o === "G");
  g.add(S.blocks, S.shell);
  S.beam = new T.Mesh(new T.CylinderGeometry(7, 7, 70, 32, 1, true), new T.MeshBasicMaterial({ map: beamTex(), color: 0xffe2a0, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); S.beam.position.y = 35; g.add(S.beam);
  S.glowG = glow(0xffd25a, 16, 0); g.add(S.glowG);
  // investisseurs : G (or), B (fonds), C, T
  S.inv = [["G", 0, 0], ["B", 1, 1], ["C", 3, 2], ["T", 2, 3]].map(([o, q, v]) => { const ic = investorIcon(COL[o], v, 2.0); ic.visible = false; g.add(ic); const st = new T.Mesh(new T.CylinderGeometry(0.08, 0.08, 1, 6), addMat(COL[o], 0.0)); g.add(st); return { o, q, ic, st }; });
  S.tagPart = textPlane("UNE PART DU CAPITAL", { w: 8.4, h: 1.5, px: 512, color: "#ffd25a", bg: "rgba(8,14,24,.9)", border: "#ffd25a", size: 0.5 }); g.add(S.tagPart);
  S.coins = inst((() => { const cg = new T.CylinderGeometry(0.5, 0.5, 0.12, 20); cg.rotateX(Math.PI / 2); return cg; })(), new T.MeshBasicMaterial({ color: 0xffd25a }), 16); g.add(S.coins);
  // icônes
  S.icons = ICONS.map(([k, x, z, label]) => {
    const w = new T.Group(); w.position.set(x, 0, z);
    const disc = new T.Mesh(new T.CircleGeometry(4.4, 40), bas(0x0a1424)); disc.rotation.x = -Math.PI / 2; disc.position.y = 0.06; w.add(disc);
    const ring = new T.Mesh(new T.RingGeometry(4.4, 4.9, 48), bas(0x47f0a0)); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.07; w.add(ring);
    const model = k === "usine" ? buildFactory() : k === "bureaux" ? buildOffice(chartTex(5, "COURS")) : k === "salaries" ? buildWorkers() : buildProducts(); model.scale.setScalar(1.45); w.add(model);
    const tag = textPlane(label, { w: 5.6, h: 1.25, px: 512, color: "#f3ecd4", bg: "rgba(8,14,24,.88)", border: "#47f0a0", size: 0.5 }); tag.position.set(0, 8.6, 0); w.add(tag);
    const halo = glow(0x47f0a0, 12, 0.0); halo.position.y = 3.5; w.add(halo);
    g.add(w); return { k, w, model, tag, halo, ring, x, z };
  });
  S.traces = inst(new T.BoxGeometry(1, 1, 1), addMat(0x47f0a0, 0.8), 4); g.add(S.traces);
  S.pulses = inst(new T.SphereGeometry(0.6, 10, 8), new T.MeshBasicMaterial({ color: 0xffffff }), 12); g.add(S.pulses);
  S.sign = textPlane("ENTREPRISE", { w: 9.6, h: 1.9, px: 512, color: "#f3ecd4", bg: "rgba(8,14,24,.9)", border: "#e8b84a", size: 0.5 }); S.sign.position.set(0, 2.2, 7.4); g.add(S.sign);
  // certificat final
  S.cert = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: certTex("ACTION"), side: T.DoubleSide })); S.cert.scale.set(5.6, 3.5, 1); g.add(S.cert);
  S.certGlow = glow(0xffd25a, 16, 0); g.add(S.certGlow);
  // barre F3 (hologramme collé à la caméra)
  S.hud = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: hudTex(), transparent: true, depthTest: false, depthWrite: false })); S.hud.renderOrder = 50; S.hud.frustumCulled = false; g.add(S.hud);
  g.userData = S; return g;
}
function hudTex() {
  return mk(1024, 300, (g, w, h) => {
    g.fillStyle = "rgba(6,12,22,.92)"; g.fillRect(0, 0, w, h); g.strokeStyle = "#47f0a0"; g.lineWidth = 5; g.strokeRect(3, 3, w - 6, h - 6);
    g.fillStyle = "#bfeaff"; g.font = `700 27px ${MONO}`; g.textAlign = "left"; g.textBaseline = "alphabetic"; g.fillText("PATRIMOINE D'UN MILLIARDAIRE · EN MOYENNE", 28, 46);
    const x0 = 28, bw = w - 56, y0 = 66, bh = 110, w73 = bw * 0.73, w26 = bw * 0.26;
    g.fillStyle = "#1f8a4c"; g.fillRect(x0, y0, w73, bh); g.fillStyle = "#e8b84a"; g.fillRect(x0 + w73 + 4, y0, w26 - 4, bh);
    g.fillStyle = "#f3ecd4"; g.font = `900 76px ${FONT}`; g.textAlign = "center"; g.fillText("~73 %", x0 + w73 / 2, y0 + 82); g.fillStyle = "#1a1203"; g.fillText("~26 %", x0 + w73 + 4 + (w26 - 4) / 2, y0 + 82);
    g.font = `700 31px ${MONO}`; g.fillStyle = "#6dffb8"; g.fillText("parts d'entreprises", x0 + w73 / 2, y0 + bh + 38); g.fillStyle = "#ffd25a"; g.fillText("liquide", x0 + w73 + 4 + (w26 - 4) / 2, y0 + bh + 38);
    g.fillStyle = "rgba(243,236,212,.7)"; g.font = `700 22px ${MONO}`; g.textAlign = "left"; g.fillText("Altrata, Billionaire Census 2026 (données 2025) · moyenne par milliardaire", 28, h - 14);
  });
}

const ownColor = (o) => COL[o];
const _col = new T.Color(), _q = new T.Quaternion(), _m4 = new T.Matrix4(), _f = new T.Vector3(), _r = new T.Vector3(), _u = new T.Vector3(), _up = new T.Vector3(0, 1, 0);

/** TM : instants des mots ; cam : {p,l,fov} monde ; base : position monde de l'origine du groupe */
export function updateS7(S, t, TM, cam, base) {
  const vis = t >= TM.S7 - 0.05; if (!vis) { S.visible = false; return; }
  const e = eio(lin(TM.grande, TM.grande + 0.55, t)) * (1 - eio(lin(TM.sous, TM.sous + 0.42, t)));
  const hl = eio(lin(TM.partie - 0.05, TM.partie + 0.35, t)) * (1 - eio(lin(26.0, 26.5, t)));
  const face = (wx, wz) => Math.atan2(cam.p[0] - (base[0] + wx), cam.p[2] - (base[2] + wz));
  // ---- blocs
  const PULL = 5.3, gpos = (m) => { const q = m.j; return [QX[q] * (BW / 2 + 1.7 * e) + (m.o === "G" ? PULL * hl : 0), QZ[q] * (BW / 2 + 1.7 * e) + (m.o === "G" ? PULL * hl : 0)]; };
  for (const m of S.meta) {
    const u = lin(TM.S7 + 0.04 * m.k, TM.S7 + 0.04 * m.k + 0.3, t), [x, z] = gpos(m);
    if (u <= 0) { hide(S.blocks, m.i); continue; }
    const y = m.k * FH + FH / 2 + m.k * 0.8 * e + (m.o === "G" ? 0.8 * hl : 0) + 24 * (1 - eout(u));
    put(S.blocks, m.i, x, y, z, BW, FH * 0.97, BW);
    const dim = m.o === "G" ? 1 + 0.3 * hl : 1 - 0.5 * hl; S.blocks.setColorAt(m.i, _col.setHex(ownColor(m.o)).multiplyScalar(dim));
  }
  S.blocks.instanceMatrix.needsUpdate = true; S.blocks.instanceColor.needsUpdate = true;
  S.gold.forEach((m, n) => { const [x, z] = gpos(m); if (hl < 0.02) { hide(S.shell, n); return; } put(S.shell, n, x, m.k * FH + FH / 2 + m.k * 0.8 * e + 0.8 * hl, z, BW * 1.07, FH * 1.04, BW * 1.07); });
  S.shell.instanceMatrix.needsUpdate = true;
  // part en or : centre, halo
  const gx = QX[0] * (BW / 2 + 1.7 * e) + PULL * hl, gy = 4 * FH + FH / 2 + 4 * 0.8 * e + 0.8 * hl;
  S.glowG.position.set(gx, gy, gx); S.glowG.scale.setScalar(15 + 2 * Math.sin(t * 5)); S.glowG.material.opacity = 0.5 * hl;
  S.beam.material.opacity = 0.5 * sstep(24.05, 24.3, t) * (1 - sstep(TM.S7 + 0.2, TM.S7 + 0.7, t)); S.beam.visible = S.beam.material.opacity > 0.01;
  // ---- investisseurs
  S.inv.forEach((v, i) => {
    const q = v.q, isG = v.o === "G", b = isG ? TM.partie + 0.05 : TM.grande + 0.35 + 0.1 * i, s = pop((t - b) / 0.4);
    v.ic.visible = v.st.visible = s > 0.01; if (!v.ic.visible) return;
    const tx = isG ? gx : QX[q] * (BW / 2 + 1.7 * e), tz = isG ? gx : QZ[q] * (BW / 2 + 1.7 * e);
    const colTop = isG ? 7 * FH + 6 * 0.8 * e + 0.8 * hl : NF * FH + 7 * 0.8 * e, iy = colTop + 3.6 + 0.35 * Math.sin(t * 2.2 + i) + (isG ? 0.6 * hl : 0);
    v.ic.position.set(tx, iy, tz); v.ic.rotation.y = face(tx, tz); v.ic.scale.setScalar(Math.max(0.001, s * (isG ? 1.0 + 0.25 * hl : 0.8)));
    const bot = colTop - (isG ? 0 : 0) + 0.2, hgt = Math.max(0.1, iy - 2.0 - bot); v.st.position.set(tx, bot + hgt / 2, tz); v.st.scale.set(1, hgt, 1); v.st.material.opacity = 0.6 * Math.min(1, s);
  });
  { const tg = S.tagPart, k = pop((t - (TM.partie + 0.1)) / 0.35) * hl; tg.visible = k > 0.02; tg.position.set(gx, gy - 7.5 * 1, gx); tg.position.y = 4 * FH + FH / 2 + 4 * 0.8 * e - 6.4; tg.position.set(gx + 0.0, 4 * FH + FH / 2 + 4 * 0.8 * e - 6.9, gx + 2.4); tg.rotation.y = face(tg.position.x, tg.position.z); tg.scale.setScalar(Math.max(0.001, k)); }
  // pièces qui « investissent » : de l'investisseur vers la part (investie)
  { const inv = S.inv[0], p0 = inv.ic.position, on = t >= TM.investie - 0.02 && t < TM.investie + 0.95;
    for (let i = 0; i < 16; i++) {
      const u = ((t - TM.investie) / 0.5 - i * 0.12) % 1.6, uu = u / 0.6;
      if (!on || u < 0 || uu > 1) { hide(S.coins, i); continue; }
      const k = eio(uu), sx = p0.x + (H(i, 1) - 0.5) * 1.2, sy = p0.y - 1.4, sz = p0.z + (H(i, 2) - 0.5) * 1.2, ex = gx + (H(i, 3) - 0.5) * 2.4, ey = gy + 1 + (H(i, 4) - 0.5) * 6, ez = gx + (H(i, 5) - 0.5) * 2.4;
      put(S.coins, i, lerp(sx, ex, k), lerp(sy, ey, k) + 1.5 * Math.sin(Math.PI * k), lerp(sz, ez, k), 1 - 0.4 * k, 1 - 0.4 * k, 1 - 0.4 * k, 0, t * 6 + i, 0);
    }
    S.coins.instanceMatrix.needsUpdate = true; }
  // ---- icônes (usine, bureaux, salariés, produits)
  S.icons.forEach((ic, i) => {
    const b = TM.entreprises + 0.17 * i, s = pop((t - b) / 0.45); ic.w.visible = s > 0.005; if (!ic.w.visible) return;
    ic.w.scale.setScalar(Math.max(0.001, s)); ic.tag.rotation.y = face(ic.x, ic.z) - 0;
    ic.halo.material.opacity = 0.3 * Math.sin(Math.PI * clamp((t - b) / 0.8)) + 0.12; ic.ring.material.color.setHex(0x47f0a0);
    if (ic.k === "usine") ic.model.userData.smoke.forEach((sp, n) => { const f = ((t * 0.5 + n * 0.25) % 1); sp.position.set(-1.4 + (n % 2) * 2.9, 4.6 + f * 3, -0.5); sp.scale.setScalar(0.5 + 1.1 * f); sp.material.opacity = 0.45 * (1 - f); });
    if (ic.k === "salaries") ic.model.userData.people.forEach((p, n) => { p.position.y = Math.abs(Math.sin(t * 3.2 + n * 1.7)) * 0.07; const a = p.userData; a.armR.rotation.z = -0.12 - 0.5 * Math.max(0, Math.sin(t * 4 + n)) ; p.rotation.y = -0.25 * (n - 1) + 0.12 * Math.sin(t * 1.5 + n); });
    if (ic.k === "produits") { const st = ic.model.userData.star; st.rotation.y = t * 2.4; st.position.y = 2.25 + 0.15 * Math.sin(t * 3); }
  });
  { const t0 = TM.sous + 0.0, on = 4;
    for (let i = 0; i < 4; i++) {
      const ic = S.icons[i], k = eout(lin(t0 + 0.05 * i, t0 + 0.4 + 0.05 * i, t)), len = Math.hypot(ic.x, ic.z) - 5.2;
      if (k <= 0.001) { hide(S.traces, i); continue; }
      const dx = -ic.x / Math.hypot(ic.x, ic.z), dz = -ic.z / Math.hypot(ic.x, ic.z), sx = ic.x + dx * 4.9, sz = ic.z + dz * 4.9;
      _o.position.set(sx + dx * len * k / 2, 0.15, sz + dz * len * k / 2); _o.rotation.set(0, Math.atan2(dx, dz), 0); _o.scale.set(0.7, 0.1, Math.max(0.01, len * k)); _o.updateMatrix(); S.traces.setMatrixAt(i, _o.matrix);
    }
    S.traces.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < 12; i++) {
      const ic = S.icons[i % 4], f = ((t - t0) * 0.9 + (i >> 2) / 3) % 1, on2 = t >= t0 + 0.3 + 0.05 * (i % 4), len = Math.hypot(ic.x, ic.z) - 5.2;
      if (!on2) { hide(S.pulses, i); continue; }
      const dx = -ic.x / Math.hypot(ic.x, ic.z), dz = -ic.z / Math.hypot(ic.x, ic.z);
      put(S.pulses, i, ic.x + dx * (4.9 + len * f), 0.8, ic.z + dz * (4.9 + len * f), 1, 1, 1);
    }
    S.pulses.instanceMatrix.needsUpdate = true; }
  { const k = pop((t - TM.entreprises - 0.1) / 0.4); S.sign.visible = k > 0.01; S.sign.scale.setScalar(Math.max(0.001, k)); S.sign.rotation.y = face(0, 7.4) * 0.5; }
  // ---- certificat final : naît de la part, vient se centrer devant la tour
  { const a = TM.actions, u = lin(a - 0.02, a + 0.34, t), k = eout(u), sx = 2.25, sy = 9.0, sz = 2.25, ex = 0, ey = 8.2, ez = 9.6;
    S.cert.visible = S.certGlow.visible = t >= a - 0.02;
    S.cert.position.set(lerp(sx, ex, k), lerp(sy, ey, k) + 1.5 * Math.sin(Math.PI * k), lerp(sz, ez, k)); S.cert.scale.set(5.6, 3.5, 1).multiplyScalar(Math.max(0.001, 0.15 + 0.85 * pop(u * 1.0))); S.cert.rotation.set(0, (1 - k) * 0.9 + 0.0, (1 - k) * -0.25);
    S.certGlow.position.set(S.cert.position.x, S.cert.position.y, S.cert.position.z - 0.6); S.certGlow.scale.setScalar(15 * (0.4 + 0.6 * k)); S.certGlow.material.opacity = 0.55 * Math.sin(Math.PI * clamp(u * 0.9)) + 0.18 * k; }
  // ---- barre F3 : hologramme calé en bas du cadre (entre le sujet et les sous-titres)
  { const k = pop((t - (TM.investie + 0.05)) / 0.35) * (1 - sstep(TM.sous - 0.05, TM.sous + 0.3, t)); S.hud.visible = k > 0.01;
    if (S.hud.visible) {
      _f.set(cam.l[0] - cam.p[0], cam.l[1] - cam.p[1], cam.l[2] - cam.p[2]).normalize(); _r.crossVectors(_f, _up).normalize(); _u.crossVectors(_r, _f).normalize();
      const D = 4, hh = D * Math.tan((cam.fov * Math.PI) / 360), ww = hh * (1080 / 1920) * 2, pw = ww * 0.8;
      const cx = cam.p[0] + _f.x * D - _r.x * ww * 0.045 - _u.x * hh * 0.255, cy = cam.p[1] + _f.y * D - _r.y * ww * 0.045 - _u.y * hh * 0.255, cz = cam.p[2] + _f.z * D - _r.z * ww * 0.045 - _u.z * hh * 0.255;
      _m4.makeBasis(_r, _u, _f.clone().negate()); _q.setFromRotationMatrix(_m4);
      S.hud.position.set(cx - base[0], cy - base[1], cz - base[2]); S.hud.quaternion.copy(_q); S.hud.scale.set(pw * (0.9 + 0.1 * k), (pw * 300) / 1024 * (0.9 + 0.1 * k), 1); S.hud.material.opacity = Math.min(1, k * 1.3);
    } }
}
