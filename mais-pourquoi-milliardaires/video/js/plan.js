// Plan de réalisation : quels modules 3D illustrent quelles scènes (numéros = paragraphes de script.txt).
import { TIMING } from "./timing.js";
export const MODULES = {
  wealth:  { offset: [0, 0, 0],       scenes: [1, 2, 3, 13, 18], title: "Richesses, redistribution, carte du monde" },
  life:    { offset: [1000, 0, 0],    scenes: [4, 14],           title: "Vie quotidienne (courses, facture, logement, soins)" },
  shares:  { offset: [2000, 0, 0],    scenes: [5, 6, 7],         title: "Billet suspendu → action → coffre → entreprises" },
  market:  { offset: [3000, 0, 0],    scenes: [8, 9, 10],        title: "Marché : tout le monde vend, pas assez d'acheteurs, chute" },
  impact:  { offset: [4000, 0, 0],    scenes: [11, 12],          title: "Impact sur les entreprises et propagation de la panique" },
  durable: { offset: [5000, 0, 0],    scenes: [15, 16, 17],      title: "Dépenses récurrentes, aide ponctuelle vs stabilité, économie connectée" },
};
export const VIDEO_DURATION = TIMING.videoDuration;
export const scene = (n) => TIMING.scenes[n - 1];
/** fenêtres [t0,t1] où le module est à l'écran (scènes consécutives fusionnées) */
export function windowsOf(id) {
  const ws = []; for (const n of MODULES[id].scenes) { const s = scene(n); const last = ws[ws.length - 1]; if (last && Math.abs(last[1] - s.start) < 1e-6) last[1] = s.end; else ws.push([s.start, s.end]); }
  return ws;
}
export const inWindows = (id, t) => windowsOf(id).some(([a, b]) => t >= a && t < b);
export const moduleAt = (t) => Object.keys(MODULES).find((id) => inWindows(id, t));
/** instants de début de chaque mot d'une scène (texte du script) */
export const wordsOf = (n) => scene(n).words;
/** instant de début du k-ième mot de la scène n dont le texte (minuscules, sans ponctuation) correspond à re ; ex. onset(8, /vendre/) */
export function onset(n, re, k = 0) {
  const strip = (x) => x.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const norm = (x) => x.toLowerCase().replace(/[^a-zàâçéèêëîïôûùüÿœ0-9']/g, "");
  const re2 = new RegExp(strip(re.source), re.flags);          // accepte les motifs avec ou sans accents
  const hits = scene(n).words.filter((w) => re.test(norm(w[2])) || re2.test(strip(norm(w[2])))); if (!hits[k]) throw new Error(`onset: mot introuvable scène ${n} ${re}`); return hits[k][0];
}
export const endOf = (n) => scene(n).end;
export const startOf = (n) => scene(n).start;
