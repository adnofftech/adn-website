import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { db } from './db.js';

const SESSION_DAYS = 14;
export const sha = s => createHash('sha256').update(s).digest('hex');

export function hashPassword(pw) {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString('hex')}$${scryptSync(pw, salt, 64).toString('hex')}`;
}
const DUMMY = hashPassword('dummy-password-for-timing');
export function verifyPassword(pw, stored) {
  const [alg, saltHex, hashHex] = (stored || DUMMY).split('$');
  if (alg !== 'scrypt') return false;
  const h = scryptSync(pw, Buffer.from(saltHex, 'hex'), 64);
  return timingSafeEqual(h, Buffer.from(hashHex, 'hex')) && !!stored;
}
export function checkPasswordStrength(pw) {
  if (typeof pw !== 'string' || pw.length < 10) return 'Le mot de passe doit contenir au moins 10 caractères.';
  if (pw.length > 200) return 'Mot de passe trop long.';
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return 'Le mot de passe doit contenir des lettres et des chiffres.';
  return null;
}
export function createSession(userId, companyId) {
  const token = randomBytes(32).toString('base64url');
  db.prepare('INSERT INTO sessions (token_hash,user_id,company_id,expires_at) VALUES (?,?,?,?)')
    .run(sha(token), userId, companyId, Date.now() + SESSION_DAYS * 86400e3);
  return token;
}
export function sessionFromToken(token) {
  if (!token) return null;
  const s = db.prepare(`SELECT s.user_id, s.company_id, s.expires_at, u.email FROM sessions s
    JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?`).get(sha(token));
  if (!s) return null;
  if (s.expires_at < Date.now()) { db.prepare('DELETE FROM sessions WHERE token_hash=?').run(sha(token)); return null; }
  return s;
}
export function destroySession(token) { if (token) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(sha(token)); }
export function cookieHeader(token, maxAgeSec) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `d974_sid=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secure}`;
}
export const SESSION_MAX_AGE = SESSION_DAYS * 86400;
