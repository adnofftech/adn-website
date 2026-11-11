/* Bibliothèque 2D « stickman » (SVG + GSAP). Tout est déterministe : aucune horloge, aucun hasard.
   Repère : 1920x1080, origine en haut à gauche. Angles en degrés, dans le repère de l'écran : 0 = le membre pend vers le bas,
   +90 = il pointe vers la GAUCHE de l'écran, -90 = vers la DROITE, ±180 = vers le haut. */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const INK = "#1c2033", LINE = 9;
  const R = { INK, W: 1920, H: 1080, LINE };
  R.pal = { yellow: "#ffd35c", blue: "#5b8def", red: "#ee5d55", green: "#46b97a", orange: "#ff9a4d", purple: "#9a74e8", teal: "#3fb7b0", pink: "#ff8fb1", grey: "#aeb6c4", paper: "#fffdf6", sky: "#bfe0ff", brown: "#a06f4c", dark: "#2a3048" };
  R.bgs = ["#fff3c4", "#d9ebff", "#d8f5e4", "#ffe3cf", "#e7ddff", "#ffd9d3", "#d4f2f0", "#f3ead7"];

  R.el = function (tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in (attrs || {})) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const E = R.el;
  R.g = (parent, attrs) => E("g", attrs || {}, parent);
  R.place = (el, x, y, extra) => { gsap.set(el, Object.assign({ x, y, transformOrigin: "0px 0px" }, extra || {})); return el; };
  const stroke = (o) => Object.assign({ fill: "none", stroke: INK, "stroke-width": LINE, "stroke-linecap": "round", "stroke-linejoin": "round" }, o || {});
  R.line = (p, x1, y1, x2, y2, o) => E("line", Object.assign(stroke(o), { x1, y1, x2, y2 }), p);
  R.path = (p, d, o) => E("path", Object.assign(stroke(), o || {}, { d }), p);
  R.circle = (p, cx, cy, r, fill, o) => E("circle", Object.assign(stroke(), { cx, cy, r, fill: fill || "none" }, o || {}), p);
  R.rect = (p, x, y, w, h, fill, o) => E("rect", Object.assign(stroke(), { x, y, width: w, height: h, rx: (o && o.rx) || 10, fill: fill || "none" }, o || {}), p);
  R.poly = (p, pts, fill, o) => E("polygon", Object.assign(stroke(), { points: pts, fill: fill || "none" }, o || {}), p);
  R.text = (p, str, x, y, size, fill, o) => { const t = E("text", Object.assign({ x, y, "font-size": size || 48, fill: fill || INK, "text-anchor": "middle", "font-family": "'Archivo Black','Arial Black',sans-serif", "font-weight": 800 }, o || {}), p); t.textContent = str; return t; };

  /* ---------- animations utilitaires (tl = timeline maître, t = temps absolu) ---------- */
  R.pop = (tl, el, t, d, o) => tl.fromTo(el, { scale: 0, opacity: 0, transformOrigin: "50% 50%" }, Object.assign({ scale: 1, opacity: 1, duration: d || 0.35, ease: "back.out(2)" }, o || {}), t);
  R.fadeIn = (tl, el, t, d) => tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: d || 0.3, ease: "power1.out" }, t);
  R.fadeOut = (tl, el, t, d) => tl.to(el, { opacity: 0, duration: d || 0.3, ease: "power1.in" }, t);
  R.slideIn = (tl, el, t, d, dx, dy) => tl.from(el, { x: "+=" + (dx || 0), y: "+=" + (dy || 0), opacity: 0, duration: d || 0.5, ease: "power3.out" }, t);
  R.shake = (tl, el, t, d, amp) => { const n = Math.max(2, Math.round((d || 0.4) / 0.05)); for (let i = 0; i < n; i++) tl.to(el, { x: "+=" + ((i % 2 ? -1 : 1) * (amp || 8)), duration: 0.05, ease: "none" }, t + i * 0.05); tl.to(el, { x: "+=0", duration: 0.01 }, t + n * 0.05); };
  R.pulse = (tl, el, t, d, k) => tl.to(el, { scale: k || 1.12, duration: (d || 0.4) / 2, yoyo: true, repeat: 1, ease: "sine.inOut", transformOrigin: "50% 50%" }, t);
  R.camera = (tl, cam, t, d, o) => tl.to(cam, Object.assign({ duration: d, ease: "sine.inOut", transformOrigin: "960px 540px" }, o), t); // push-in : {scale:1.15}
  R.bob = (tl, el, t, d, amp, per) => { const n = Math.max(1, Math.round(d / (per || 1))); for (let i = 0; i < n; i++) tl.to(el, { y: "+=" + (amp || 10), duration: (per || 1) / 2, yoyo: true, repeat: 1, ease: "sine.inOut" }, t + i * (per || 1)); };
  R.spin = (tl, el, t, d, turns, ease) => tl.to(el, { rotation: "+=" + 360 * (turns || 1), duration: d, ease: ease || "none", transformOrigin: "50% 50%" }, t);

  /* ---------- le stickman ---------- */
  const FACES = {
    neutral: { eye: 1, brow: 0, mouth: "M-12 18 Q0 22 12 18" },
    happy: { eye: 1, brow: -6, mouth: "M-16 14 Q0 34 16 14" },
    big: { eye: 1.3, brow: -10, mouth: "M-18 12 Q0 40 18 12 Z" },
    sad: { eye: 1, brow: 12, mouth: "M-14 26 Q0 14 14 26" },
    surprised: { eye: 1.5, brow: -14, mouth: "M-7 16 Q0 34 7 16 Q0 12 -7 16 Z" },
    think: { eye: 0.9, brow: 8, mouth: "M-12 22 L10 18" },
    sleepy: { eye: 0.15, brow: 6, mouth: "M-10 22 Q0 18 10 22" },
    worry: { eye: 1.2, brow: 14, mouth: "M-14 26 Q-5 18 0 24 Q5 18 14 26" },
  };
  R.stick = function (parent, o) {
    o = o || {};
    const col = o.color || "#ffffff";
    const root = E("g", {}, parent); R.place(root, o.x || 960, o.y || 700, { scale: o.s || 1 });
    const lean = E("g", {}, root); gsap.set(lean, { transformOrigin: "0px 0px" });
    const legs = {}, arms = {};
    // jambes (depuis la hanche)
    [["L", 18], ["R", -18]].forEach(([k, dx]) => {
      const th = E("g", {}, root); R.place(th, dx / 2, 0, { rotation: 0 });
      R.line(th, 0, 0, 0, 88); const sh = E("g", {}, th); R.place(sh, 0, 88, { rotation: 0 }); R.line(sh, 0, 0, 0, 82);
      R.line(sh, 0, 82, k === "L" ? 26 : -26, 90, { "stroke-width": LINE }); // pied
      legs[k] = { th, sh };
    });
    // torse
    R.line(lean, 0, 0, 0, -128);
    // bras (depuis l'épaule)
    [["L", 0], ["R", 0]].forEach(([k]) => {
      const up = E("g", {}, lean); R.place(up, 0, -112, { rotation: k === "L" ? 8 : -8 });
      R.line(up, 0, 0, 0, 72); const fo = E("g", {}, up); R.place(fo, 0, 72, { rotation: 0 }); R.line(fo, 0, 0, 0, 66);
      const hand = R.circle(fo, 0, 70, 7, INK, { "stroke-width": 3 });
      arms[k] = { up, fo, hand };
    });
    // tête
    const head = E("g", {}, lean); R.place(head, 0, -128, { rotation: 0 });
    R.line(head, 0, 0, 0, -8);
    const hc = R.circle(head, 0, -54, 48, col);
    const face = E("g", {}, head); R.place(face, 0, -54);
    const eyeL = R.circle(face, -17, -6, 5.5, INK, { "stroke-width": 0 }), eyeR = R.circle(face, 17, -6, 5.5, INK, { "stroke-width": 0 });
    const browL = R.line(face, -26, -22, -8, -22, { "stroke-width": 4.5 }), browR = R.line(face, 8, -22, 26, -22, { "stroke-width": 4.5 });
    const mouth = R.path(face, FACES.neutral.mouth, { "stroke-width": 4.5 });
    const api = { root, lean, head, arms, legs, face, hc, x: o.x || 960, y: o.y || 700 };
    const J = { aL: [arms.L.up], eL: [arms.L.fo], aR: [arms.R.up], eR: [arms.R.fo], lL: [legs.L.th], kL: [legs.L.sh], lR: [legs.R.th], kR: [legs.R.sh], lean: [lean], head: [head] };
    api.joints = J;
    api.set = function (p) { for (const k in p) if (J[k]) gsap.set(J[k][0], { rotation: p[k] }); if (p.face) api.setFace(p.face); return api; };
    api.pose = function (tl, t, d, p, ease) { for (const k in p) if (J[k]) tl.to(J[k][0], { rotation: p[k], duration: d, ease: ease || "power2.inOut" }, t); if (p.face) api.faceTo(tl, t, p.face); return api; };
    api.setFace = function (n) { const f = FACES[n] || FACES.neutral; mouth.setAttribute("d", f.mouth); gsap.set([eyeL, eyeR], { scaleY: f.eye, scaleX: f.eye > 1 ? 1.1 : 1, transformOrigin: "50% 50%" }); gsap.set(browL, { rotation: f.brow, transformOrigin: "-17px -22px" }); gsap.set(browR, { rotation: -f.brow, transformOrigin: "17px -22px" }); };
    api.faceTo = function (tl, t, n) { tl.call(() => api.setFace(n), null, t); tl.call(() => api.setFace(n), null, t); return api; }; // bascule nette (déterministe au seek avant/arrière : voir faceSeq)
    api.move = function (tl, t, d, x, y, ease) { tl.to(root, { x, y: y === undefined ? api.y : y, duration: d, ease: ease || "power2.inOut" }, t); return api; };
    api.scaleTo = function (tl, t, d, s, ease) { tl.to(root, { scale: s, duration: d, ease: ease || "power2.inOut" }, t); return api; };
    api.flip = function (dir) { gsap.set(root, { scaleX: (dir < 0 ? -1 : 1) * Math.abs(gsap.getProperty(root, "scaleX")) }); return api; };
    api.say = function () { return api; };
    // Marche : balancier de jambes/bras pendant d secondes, déplacement dx. Cycle déterministe.
    api.walk = function (tl, t, d, dx, o) {
      o = o || {}; const per = o.period || 0.6, n = Math.max(1, Math.round(d / per)), amp = o.amp || 28;
      for (let i = 0; i < n; i++) {
        const a = i % 2 ? -1 : 1, tt = t + i * per;
        tl.to(legs.L.th, { rotation: amp * a, duration: per, ease: "sine.inOut" }, tt); tl.to(legs.R.th, { rotation: -amp * a, duration: per, ease: "sine.inOut" }, tt);
        tl.to(legs.L.sh, { rotation: a > 0 ? 0 : 22, duration: per, ease: "sine.inOut" }, tt); tl.to(legs.R.sh, { rotation: a > 0 ? 22 : 0, duration: per, ease: "sine.inOut" }, tt);
        if (!o.keepArms) { tl.to(arms.L.up, { rotation: -amp * a * 0.9, duration: per, ease: "sine.inOut" }, tt); tl.to(arms.R.up, { rotation: amp * a * 0.9, duration: per, ease: "sine.inOut" }, tt); }
        tl.to(root, { y: "+=" + -6, duration: per / 2, yoyo: true, repeat: 1, ease: "sine.inOut" }, tt);
      }
      tl.to(root, { x: "+=" + dx, duration: d, ease: o.ease || "none" }, t);
      tl.to([legs.L.th, legs.R.th, legs.L.sh, legs.R.sh], { rotation: 0, duration: 0.25, ease: "power2.out" }, t + d);
      return api;
    };
    api.setFace(o.face || "neutral");
    if (o.pose) api.set(o.pose);
    return api;
  };
  // poses prêtes à l'emploi
  R.poses = {
    idle: { aL: 8, eL: 6, aR: -8, eR: -6, lL: 0, kL: 0, lR: 0, kR: 0, lean: 0, head: 0 },
    arms_up: { aL: 160, eL: 10, aR: -160, eR: -10 },
    point_right: { aR: -90, eR: 0, aL: 8, eL: 6 },
    point_left: { aL: 90, eL: 0, aR: -8, eR: -6 },
    shrug: { aL: 40, eL: 70, aR: -40, eR: -70, head: 6 },
    think: { aR: -30, eR: -125, aL: 8, eL: 6, head: -6 },
    cheer: { aL: 150, eL: 20, aR: -150, eR: -20, face: "big" },
    sit: { lL: 90, kL: -90, lR: 90, kR: -90 },
    run: { aL: -50, eL: -60, aR: 50, eR: -60, lL: 40, kL: 40, lR: -40, kR: 0, lean: -8 },
    hold_front: { aL: 55, eL: -75, aR: -55, eR: 75 },
  };
  R.child = function (parent, o) { o = Object.assign({ s: 0.62, color: "#fff3c4" }, o || {}); const c = R.stick(parent, o); return c; }; // enfant : même rig, plus petit (ajoutez une casquette via R.cap)
  R.cap = function (st, color) { const c = R.g(st.head); R.path(c, "M-46 -70 Q0 -122 46 -70 Z", { fill: color || R.pal.red }); R.line(c, 40, -72, 78, -66); return c; };

  /* ---------- accessoires (retournent un groupe <g> déjà positionné) ---------- */
  const P = (R.props = {});
  P.clock = (p, x, y, r, o) => { o = o || {}; const g = R.g(p); R.place(g, x, y); R.circle(g, 0, 0, r, "#fff", { "stroke-width": 8 }); for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; R.line(g, Math.sin(a) * r * 0.82, -Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.92, -Math.cos(a) * r * 0.92, { "stroke-width": 4 }); }
    const mh = R.g(g); R.line(mh, 0, 0, 0, -r * 0.55, { "stroke-width": 7 }); const hh = R.g(g); R.line(hh, 0, 0, 0, -r * 0.35, { "stroke-width": 8 }); gsap.set([mh, hh], { transformOrigin: "0px 0px" }); gsap.set(mh, { rotation: o.m || 0 }); gsap.set(hh, { rotation: o.h || 300 }); R.circle(g, 0, 0, 6, INK); g.hands = { m: mh, h: hh }; return g; };
  P.tick = (tl, clock, t, d, turns) => { tl.to(clock.hands.m, { rotation: "+=" + 360 * turns, duration: d, ease: "none" }, t); tl.to(clock.hands.h, { rotation: "+=" + 30 * turns, duration: d, ease: "none" }, t); };
  P.calendar = (p, x, y, w, label, o) => { const g = R.g(p); R.place(g, x, y); const h = w * 1.05; R.rect(g, -w / 2, -h / 2, w, h, "#fff", { rx: 14 }); R.rect(g, -w / 2, -h / 2, w, h * 0.22, (o && o.color) || R.pal.red, { rx: 14 }); if (label) R.text(g, label, 0, -h / 2 + h * 0.16, h * 0.14, "#fff"); for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) R.rect(g, -w * 0.36 + c * w * 0.19, -h * 0.12 + r * h * 0.22, w * 0.12, h * 0.13, "#e8ecf4", { "stroke-width": 0, rx: 4 }); return g; };
  P.brain = (p, x, y, s) => { const g = R.g(p); R.place(g, x, y, { scale: s || 1 }); R.path(g, "M-70 10 Q-95 -30 -55 -55 Q-40 -90 0 -75 Q40 -92 58 -55 Q98 -30 70 10 Q80 50 38 56 Q10 78 -18 58 Q-66 58 -70 10 Z", { fill: R.pal.pink, "stroke-width": 7 }); R.path(g, "M0 -75 Q-8 -30 4 56 M-45 -30 Q-20 -20 -8 -34 M40 -28 Q22 -14 8 -26 M-50 20 Q-26 12 -6 24 M44 22 Q24 16 8 28", { "stroke-width": 4 }); return g; };
  P.bulb = (p, x, y, s) => { const g = R.g(p); R.place(g, x, y, { scale: s || 1 }); R.path(g, "M-30 20 Q-52 -10 -40 -44 Q-20 -80 20 -70 Q58 -56 50 -14 Q46 4 30 20 Z", { fill: R.pal.yellow, "stroke-width": 7 }); R.rect(g, -22, 22, 44, 14, R.pal.grey, { rx: 4, "stroke-width": 6 }); R.rect(g, -16, 38, 32, 12, R.pal.grey, { rx: 4, "stroke-width": 6 }); [[-70, -50, -90, -64], [70, -50, 92, -64], [0, -96, 0, -120]].forEach(a => R.line(g, a[0], a[1], a[2], a[3], { "stroke-width": 6 })); return g; };
  P.bubble = (p, x, y, w, h) => { const g = R.g(p); R.place(g, x, y); R.path(g, `M${-w / 2} ${-h / 2} Q${-w / 2} ${-h / 2 - 20} ${-w / 2 + 40} ${-h / 2 - 20} L${w / 2 - 40} ${-h / 2 - 20} Q${w / 2} ${-h / 2 - 20} ${w / 2} ${-h / 2} L${w / 2} ${h / 2} Q${w / 2} ${h / 2 + 20} ${w / 2 - 40} ${h / 2 + 20} L${-w / 2 + 40} ${h / 2 + 20} Q${-w / 2} ${h / 2 + 20} ${-w / 2} ${h / 2} Z`, { fill: "#fff", "stroke-width": 7 }); const tail = R.g(g); R.circle(tail, -w / 2 + 30, h / 2 + 44, 12, "#fff", { "stroke-width": 6 }); R.circle(tail, -w / 2 + 6, h / 2 + 76, 7, "#fff", { "stroke-width": 5 }); g.inner = R.g(g); return g; };
  P.qmark = (p, x, y, s, col) => { const g = R.g(p); R.place(g, x, y, { scale: s || 1 }); R.text(g, "?", 0, 0, 120, col || R.pal.red, { stroke: INK, "stroke-width": 6, "paint-order": "stroke" }); return g; };
  P.sun = (p, x, y, r) => { const g = R.g(p); R.place(g, x, y); const rays = R.g(g); for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; R.line(rays, Math.sin(a) * r * 1.25, -Math.cos(a) * r * 1.25, Math.sin(a) * r * 1.6, -Math.cos(a) * r * 1.6, { "stroke-width": 8, stroke: R.pal.orange }); } R.circle(g, 0, 0, r, R.pal.yellow); R.circle(g, -r * 0.3, -r * 0.1, 5, INK, { "stroke-width": 0 }); R.circle(g, r * 0.3, -r * 0.1, 5, INK, { "stroke-width": 0 }); R.path(g, `M${-r * 0.35} ${r * 0.25} Q0 ${r * 0.55} ${r * 0.35} ${r * 0.25}`, { "stroke-width": 5 }); g.rays = rays; return g; };
  P.star = (p, x, y, r, col) => { const g = R.g(p); R.place(g, x, y); let pts = ""; for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; pts += `${Math.sin(a) * rr},${-Math.cos(a) * rr} `; } R.poly(g, pts, col || R.pal.yellow, { "stroke-width": 6 }); return g; };
  P.book = (p, x, y, w) => { const g = R.g(p); R.place(g, x, y); R.rect(g, -w / 2, -w * 0.35, w, w * 0.7, R.pal.blue, { rx: 8 }); R.rect(g, -w / 2 + 12, -w * 0.35 + 12, w - 24, w * 0.7 - 24, "#fff", { rx: 4, "stroke-width": 4 }); R.line(g, 0, -w * 0.3, 0, w * 0.3, { "stroke-width": 4 }); return g; };
  P.phone = (p, x, y, s) => { const g = R.g(p); R.place(g, x, y, { scale: s || 1 }); R.rect(g, -42, -80, 84, 160, R.pal.dark, { rx: 16 }); R.rect(g, -34, -66, 68, 124, R.pal.sky, { rx: 6, "stroke-width": 3 }); return g; };
  P.hourglass = (p, x, y, s) => { const g = R.g(p); R.place(g, x, y, { scale: s || 1 }); R.path(g, "M-44 -80 L44 -80 L8 0 L44 80 L-44 80 L-8 0 Z", { fill: "#fff", "stroke-width": 7 }); R.poly(g, "-30,-70 30,-70 6,-6 -6,-6", R.pal.yellow, { "stroke-width": 0 }); R.poly(g, "-36,72 36,72 14,40 -14,40", R.pal.yellow, { "stroke-width": 0 }); R.line(g, -52, -80, 52, -80); R.line(g, -52, 80, 52, 80); return g; };
  P.heart = (p, x, y, s, col) => { const g = R.g(p); R.place(g, x, y, { scale: s || 1 }); R.path(g, "M0 40 C-80 -10 -50 -70 0 -30 C50 -70 80 -10 0 40 Z", { fill: col || R.pal.red, "stroke-width": 6 }); return g; };
  P.check = (p, x, y, s, col) => { const g = R.g(p); R.place(g, x, y, { scale: s || 1 }); R.circle(g, 0, 0, 40, col || R.pal.green, { "stroke-width": 6 }); R.path(g, "M-18 2 L-5 16 L20 -14", { stroke: "#fff", "stroke-width": 10 }); return g; };
  P.cross = (p, x, y, s, col) => { const g = R.g(p); R.place(g, x, y, { scale: s || 1 }); R.circle(g, 0, 0, 40, col || R.pal.red, { "stroke-width": 6 }); R.path(g, "M-16 -16 L16 16 M16 -16 L-16 16", { stroke: "#fff", "stroke-width": 10 }); return g; };
  P.arrow = (p, x1, y1, x2, y2, col) => { const g = R.g(p); const a = Math.atan2(y2 - y1, x2 - x1), hl = 28; R.line(g, x1, y1, x2, y2, { stroke: col || INK, "stroke-width": 10 }); R.path(g, `M${x2 - Math.cos(a - 0.5) * hl} ${y2 - Math.sin(a - 0.5) * hl} L${x2} ${y2} L${x2 - Math.cos(a + 0.5) * hl} ${y2 - Math.sin(a + 0.5) * hl}`, { stroke: col || INK, "stroke-width": 10 }); return g; };
  P.gear = (p, x, y, r, col) => { const g = R.g(p); R.place(g, x, y); let pts = ""; for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, rr = i % 2 ? r * 0.82 : r; pts += `${Math.sin(a) * rr},${-Math.cos(a) * rr} `; } R.poly(g, pts, col || R.pal.grey, { "stroke-width": 6 }); R.circle(g, 0, 0, r * 0.3, "#fff", { "stroke-width": 6 }); return g; };
  P.magnifier = (p, x, y, s) => { const g = R.g(p); R.place(g, x, y, { scale: s || 1 }); R.circle(g, 0, 0, 44, "rgba(255,255,255,.55)", { "stroke-width": 8 }); R.line(g, 32, 32, 76, 76, { "stroke-width": 14 }); return g; };
  P.flag = (p, x, y, col) => { const g = R.g(p); R.place(g, x, y); R.line(g, 0, 0, 0, -120, { "stroke-width": 8 }); R.poly(g, "0,-120 70,-100 0,-78", col || R.pal.red, { "stroke-width": 6 }); return g; };
  P.photo = (p, x, y, w, col) => { const g = R.g(p); R.place(g, x, y); R.rect(g, -w / 2, -w * 0.45, w, w * 0.9, "#fff", { rx: 6, "stroke-width": 6 }); R.rect(g, -w / 2 + 10, -w * 0.45 + 10, w - 20, w * 0.62, col || R.pal.sky, { rx: 3, "stroke-width": 3 }); R.circle(g, -w * 0.15, -w * 0.18, w * 0.09, R.pal.yellow, { "stroke-width": 0 }); R.poly(g, `${-w / 2 + 10},${w * 0.17} ${-w * 0.1},${-w * 0.08} ${w * 0.12},${w * 0.12} ${w * 0.25},${0} ${w / 2 - 10},${w * 0.17}`, R.pal.green, { "stroke-width": 0 }); return g; };
  P.tree = (p, x, y, s, col) => { const g = R.g(p); R.place(g, x, y, { scale: s || 1 }); R.rect(g, -14, -60, 28, 70, R.pal.brown, { rx: 4 }); R.circle(g, 0, -100, 60, col || R.pal.green); return g; };
  P.cloud = (p, x, y, s, col) => { const g = R.g(p); R.place(g, x, y, { scale: s || 1 }); R.path(g, "M-70 20 Q-100 20 -92 -10 Q-90 -40 -55 -36 Q-40 -76 0 -62 Q40 -80 62 -40 Q100 -36 94 -4 Q96 22 66 20 Z", { fill: col || "#fff", "stroke-width": 6 }); return g; };
  P.house = (p, x, y, s, col) => { const g = R.g(p); R.place(g, x, y, { scale: s || 1 }); R.rect(g, -80, -80, 160, 100, col || R.pal.orange, { rx: 4 }); R.poly(g, "-98,-80 0,-150 98,-80", R.pal.red); R.rect(g, -18, -30, 36, 50, R.pal.brown, { rx: 3 }); R.rect(g, 38, -58, 30, 30, R.pal.sky, { rx: 3 }); return g; };
  P.lamp = (p, x, y, s) => { const g = R.g(p); R.place(g, x, y, { scale: s || 1 }); R.line(g, 0, 0, 0, -100); R.poly(g, "-40,-100 40,-100 24,-150 -24,-150", R.pal.yellow); R.rect(g, -30, 0, 60, 12, R.pal.dark, { rx: 4 }); return g; };
  P.table = (p, x, y, w) => { const g = R.g(p); R.place(g, x, y); R.rect(g, -w / 2, 0, w, 24, R.pal.brown, { rx: 6 }); R.line(g, -w / 2 + 24, 24, -w / 2 + 24, 150); R.line(g, w / 2 - 24, 24, w / 2 - 24, 150); return g; };
  P.shelf = (p, x, y, w) => { const g = R.g(p); R.place(g, x, y); R.rect(g, -w / 2, 0, w, 16, R.pal.brown, { rx: 4 }); return g; };
  P.ground = (p, y, col) => { const g = R.g(p); R.rect(g, -20, y, 1960, 1200 - y, col || "#8ed6a0", { "stroke-width": 0, rx: 0 }); R.line(g, -20, y, 1940, y, { "stroke-width": 8 }); return g; };
  P.confetti = (p, tl, t, n, x, y) => { const g = R.g(p); const cols = [R.pal.red, R.pal.yellow, R.pal.blue, R.pal.green, R.pal.pink]; for (let i = 0; i < n; i++) { const c = R.rect(g, 0, 0, 14, 22, cols[i % 5], { rx: 2, "stroke-width": 0 }); const a = (i / n) * 6.283, v = 160 + (i * 37) % 160; R.place(c, x, y, { rotation: i * 40 }); tl.fromTo(c, { opacity: 1 }, { x: x + Math.cos(a) * v, y: y + Math.sin(a) * v * 0.7 + 120, rotation: "+=360", opacity: 0, duration: 1.4, ease: "power2.out" }, t); } return g; };
  P.sparkle = (p, x, y, r) => { const g = R.g(p); R.place(g, x, y); R.path(g, `M0 ${-r} Q4 -4 ${r} 0 Q4 4 0 ${r} Q-4 4 ${-r} 0 Q-4 -4 0 ${-r} Z`, { fill: R.pal.yellow, "stroke-width": 4 }); return g; };

  /* décor : fond uni + sol facultatif ; renvoie le <rect> du fond */
  R.setBg = (svg, col) => { const r = svg.querySelector(".bg"); if (r) r.setAttribute("fill", col); return r; };
  window.RIG = R;
  window.SCENES = window.SCENES || {};
})();
