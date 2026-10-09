import { kf, eio, eout, ein, H } from "./util.js";
// Chaque piste: [t, valeur, ease]. Les plans sont définis scène par scène.
const V = (a) => a;
export const track = {
  px: [], py: [], pz: [], tx: [], ty: [], tz: [], fov: [], roll: [],
};
// helper : ajoute un plan {t, p:[x,y,z], l:[x,y,z], f, r, e}
export function shotList(list) {
  const out = { px: [], py: [], pz: [], tx: [], ty: [], tz: [], fov: [], roll: [] };
  for (const s of list) { const e = s.e; out.px.push([s.t, s.p[0], e]); out.py.push([s.t, s.p[1], e]); out.pz.push([s.t, s.p[2], e]);
    out.tx.push([s.t, s.l[0], e]); out.ty.push([s.t, s.l[1], e]); out.tz.push([s.t, s.l[2], e]); out.fov.push([s.t, s.f ?? 42, e]); out.roll.push([s.t, s.r ?? 0, e]); }
  return out;
}
export const evalShots = (t, tr) => ({
  p: [kf(t, tr.px), kf(t, tr.py), kf(t, tr.pz)], l: [kf(t, tr.tx), kf(t, tr.ty), kf(t, tr.tz)], fov: kf(t, tr.fov), roll: kf(t, tr.roll),
});
export const shake = (t, amp) => [Math.sin(t * 37.1) * amp, Math.sin(t * 43.7 + 1) * amp, Math.sin(t * 29.3 + 2) * amp * 0.6];
