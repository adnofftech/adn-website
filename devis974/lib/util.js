export class HttpError extends Error {
  constructor(status, message, fields) { super(message); this.status = status; this.fields = fields; }
}
const TZ = 'Indian/Reunion';
/** Date du jour (AAAA-MM-JJ) à l'heure de La Réunion. */
export function today(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d);
}
export function addDays(iso, n) {
  const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10);
}
// --- validation ---
export function str(v, name, { max = 200, required = false } = {}) {
  const s = (v ?? '').toString().trim();
  if (required && !s) throw new HttpError(400, `Le champ « ${name} » est obligatoire.`);
  if (s.length > max) throw new HttpError(400, `Le champ « ${name} » est trop long (${max} caractères maximum).`);
  // retire les caractères de contrôle (hors retours à la ligne)
  return s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}
export function email(v, name = 'E-mail', required = true) {
  const s = str(v, name, { max: 254, required }).toLowerCase();
  if (s && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) throw new HttpError(400, `${name} : adresse invalide.`);
  return s;
}
export function num(v, name, { min = 0, max = 1e9, int = false } = {}) {
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
  if (!Number.isFinite(n) || n < min || n > max || (int && !Number.isInteger(n)))
    throw new HttpError(400, `Le champ « ${name} » est invalide.`);
  return n;
}
export function oneOf(v, list, name) {
  if (!list.includes(v)) throw new HttpError(400, `Valeur invalide pour « ${name} ».`);
  return v;
}
export function isoDate(v, name) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v || '') || Number.isNaN(Date.parse(v))) throw new HttpError(400, `Date invalide : ${name}.`);
  return v;
}
export function slugify(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'entreprise';
}
// --- limitation de débit en mémoire ---
const buckets = new Map();
export function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const arr = (buckets.get(key) || []).filter(t => now - t < windowMs);
  if (arr.length >= max) { buckets.set(key, arr); return false; }
  arr.push(now); buckets.set(key, arr); return true;
}
setInterval(() => { const now = Date.now(); for (const [k, a] of buckets) if (!a.some(t => now - t < 3600e3)) buckets.delete(k); }, 600e3).unref();
