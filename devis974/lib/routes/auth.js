import { randomBytes } from 'node:crypto';
import { db, tx } from '../db.js';
import { hashPassword, verifyPassword, checkPasswordStrength, createSession, destroySession, cookieHeader, SESSION_MAX_AGE, sha } from '../auth.js';
import { HttpError, str, email, oneOf, slugify, today, addDays, rateLimit } from '../util.js';

export const SECTORS = ['Nettoyage de climatisation', 'Plomberie', 'Électricité', 'Peinture / bâtiment', 'Jardinage / paysagisme', 'Nettoyage', 'Réparation à domicile', 'Autre service'];
const DEFAULT_TEMPLATES = ['Main-d’œuvre (heure)', 'Déplacement'];

export function publicCompany(c) {
  const { logo, ...rest } = c;
  return { ...rest, has_logo: !!logo };
}

export default function (add) {
  add('POST', '/api/auth/register', { limit: [5, 3600e3] }, ctx => {
    const b = ctx.body;
    const d = {
      name: str(b.name, 'Nom de l’entreprise', { required: true, max: 120 }),
      owner_name: str(b.owner_name, 'Nom du responsable', { required: true, max: 120 }),
      email: email(b.email, 'E-mail professionnel'),
      phone: str(b.phone, 'Téléphone', { required: true, max: 30 }),
      sector: oneOf(b.sector, SECTORS, 'Secteur d’activité'),
      address: str(b.address, 'Adresse', { max: 200 }),
      postal_code: str(b.postal_code, 'Code postal', { max: 10 }),
      city: str(b.city, 'Ville', { max: 80 }),
      siret: str(b.siret, 'SIRET', { max: 20 }).replace(/\s/g, ''),
    };
    if (d.siret && !/^\d{14}$/.test(d.siret)) throw new HttpError(400, 'Le SIRET doit comporter 14 chiffres (ou rester vide pour le moment).');
    const vat_regime = oneOf(b.vat_regime, ['franchise', 'applicable'], 'Régime de TVA');
    let rate = 0;
    if (vat_regime === 'applicable') {
      rate = Number(b.default_vat_rate);
      if (!Number.isFinite(rate) || rate < 0 || rate > 100) throw new HttpError(400, 'Indiquez le taux de TVA applicable à votre activité.');
    }
    const pwErr = checkPasswordStrength(b.password);
    if (pwErr) throw new HttpError(400, pwErr);
    if (db.prepare('SELECT 1 FROM users WHERE email=?').get(d.email)) throw new HttpError(409, 'Un compte existe déjà avec cette adresse e-mail.');

    const token = tx(() => {
      let slug = slugify(d.name);
      if (db.prepare('SELECT 1 FROM companies WHERE slug=?').get(slug)) slug += '-' + randomBytes(2).toString('hex');
      const cid = Number(db.prepare(`INSERT INTO companies (slug,name,owner_name,email,phone,sector,address,postal_code,city,siret,vat_regime,default_vat_rate,trial_ends_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(slug, d.name, d.owner_name, d.email, d.phone, d.sector, d.address, d.postal_code, d.city, d.siret, vat_regime, rate, addDays(today(), 14)).lastInsertRowid);
      const uid = Number(db.prepare('INSERT INTO users (company_id,email,password_hash) VALUES (?,?,?)').run(cid, d.email, hashPassword(b.password)).lastInsertRowid);
      for (const label of DEFAULT_TEMPLATES) db.prepare('INSERT INTO service_templates (company_id,label,unit_price_cents,vat_rate) VALUES (?,?,0,?)').run(cid, label, rate);
      return createSession(uid, cid);
    });
    ctx.setCookie(cookieHeader(token, SESSION_MAX_AGE));
    return { ok: true };
  });

  add('POST', '/api/auth/login', { limit: [10, 60e3] }, ctx => {
    const e = email(ctx.body.email);
    const u = db.prepare('SELECT * FROM users WHERE email=?').get(e);
    const ok = verifyPassword(String(ctx.body.password ?? ''), u?.password_hash);
    if (!u || !ok) throw new HttpError(401, 'E-mail ou mot de passe incorrect.');
    ctx.setCookie(cookieHeader(createSession(u.id, u.company_id), SESSION_MAX_AGE));
    return { ok: true };
  });

  add('POST', '/api/auth/logout', {}, ctx => {
    destroySession(ctx.token);
    ctx.setCookie(cookieHeader('', 0));
    return { ok: true };
  });

  add('GET', '/api/auth/me', { auth: true }, ctx => {
    const c = db.prepare('SELECT * FROM companies WHERE id=?').get(ctx.cid);
    const u = db.prepare('SELECT email,email_verified FROM users WHERE id=?').get(ctx.session.user_id);
    return { user: u, company: publicCompany(c), entitlements: ctx.entitlements() };
  });

  // Réinitialisation : sans service e-mail configuré, le lien est écrit dans les journaux du serveur.
  add('POST', '/api/auth/forgot', { limit: [5, 3600e3] }, ctx => {
    const e = email(ctx.body.email);
    const u = db.prepare('SELECT id FROM users WHERE email=?').get(e);
    const res = { ok: true, message: 'Si un compte existe pour cette adresse, un lien de réinitialisation a été préparé.' };
    if (u) {
      const t = randomBytes(32).toString('base64url');
      db.prepare('INSERT INTO reset_tokens (token_hash,user_id,expires_at) VALUES (?,?,?)').run(sha(t), u.id, Date.now() + 3600e3);
      console.log(`[reset] E-mail non configuré. Lien pour ${e} : /app#/reinit/${t}`);
      if (process.env.DEV_EXPOSE_RESET === '1') res.dev_token = t;
    }
    res.email_configured = false;
    return res;
  });

  add('POST', '/api/auth/reset', { limit: [10, 3600e3] }, ctx => {
    const pwErr = checkPasswordStrength(ctx.body.password);
    if (pwErr) throw new HttpError(400, pwErr);
    const row = db.prepare('SELECT * FROM reset_tokens WHERE token_hash=?').get(sha(String(ctx.body.token || '')));
    if (!row || row.expires_at < Date.now()) throw new HttpError(400, 'Lien invalide ou expiré.');
    tx(() => {
      db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hashPassword(ctx.body.password), row.user_id);
      db.prepare('DELETE FROM reset_tokens WHERE user_id=?').run(row.user_id);
      db.prepare('DELETE FROM sessions WHERE user_id=?').run(row.user_id);
    });
    return { ok: true };
  });
}
