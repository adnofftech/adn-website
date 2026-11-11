// Utilitaires déterministes (aucune horloge, aucun Math.random).
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const lin = (a, b, x) => clamp((x - a) / (b - a));
export const eio = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const eout = (t) => 1 - Math.pow(1 - t, 3);
export const ein = (t) => t * t * t;
export const eoutBack = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
export const eoutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
/** hachage déterministe 0..1 */
export const H = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
/** valeur interpolée sur une liste de clés [[t, v, easeFn?], ...] */
export function kf(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0, e] = keys[i]; const [t1, v1] = keys[i + 1];
    if (t < t1) { if (t1 === t0) continue; const u = (t - t0) / (t1 - t0); return v0 + (v1 - v0) * (e ? e(u) : u); }
  }
  return keys[keys.length - 1][1];
}
/** table d'intégration d'une vitesse -> angle(t) */
export function integrate(speedFn, tMax = 72, step = 0.01) {
  const n = Math.ceil(tMax / step) + 1; const tab = new Float64Array(n); let a = 0;
  for (let i = 1; i < n; i++) { a += speedFn((i - 0.5) * step) * step; tab[i] = a; }
  return (t) => { const x = clamp(t, 0, tMax) / step; const i = Math.min(n - 2, Math.floor(x)); return tab[i] + (tab[i + 1] - tab[i]) * (x - i); };
}
export const fmt = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
