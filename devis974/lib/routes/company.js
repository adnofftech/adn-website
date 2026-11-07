import { db } from '../db.js';
import { HttpError, str, num, oneOf } from '../util.js';
import { publicCompany, SECTORS } from './auth.js';
import { verifyPassword } from '../auth.js';

const sniff = buf => (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) ? 'image/png'
  : buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff ? 'image/jpeg' : null);

export default function (add) {
  add('PUT', '/api/company', { auth: true }, ctx => {
    const b = ctx.body;
    const regime = oneOf(b.vat_regime, ['franchise', 'applicable'], 'Régime de TVA');
    const siret = str(b.siret, 'SIRET', { max: 20 }).replace(/\s/g, '');
    if (siret && !/^\d{14}$/.test(siret)) throw new HttpError(400, 'Le SIRET doit comporter 14 chiffres.');
    db.prepare(`UPDATE companies SET name=?,owner_name=?,phone=?,sector=?,address=?,postal_code=?,city=?,siret=?,legal_form=?,vat_number=?,
      vat_regime=?,default_vat_rate=?,payment_terms=?,legal_notes=?,quote_validity_days=?,followup_delay_days=? WHERE id=?`).run(
      str(b.name, 'Nom', { required: true, max: 120 }), str(b.owner_name, 'Responsable', { required: true, max: 120 }),
      str(b.phone, 'Téléphone', { required: true, max: 30 }), oneOf(b.sector, SECTORS, 'Secteur'),
      str(b.address, 'Adresse', { max: 200 }), str(b.postal_code, 'Code postal', { max: 10 }), str(b.city, 'Ville', { max: 80 }),
      siret, str(b.legal_form, 'Forme juridique', { max: 80 }), str(b.vat_number, 'N° TVA', { max: 30 }),
      regime, regime === 'franchise' ? 0 : num(b.default_vat_rate, 'Taux de TVA', { max: 100 }),
      str(b.payment_terms, 'Conditions de paiement', { max: 600 }), str(b.legal_notes, 'Mentions légales', { max: 1500 }),
      num(b.quote_validity_days, 'Validité', { min: 1, max: 365, int: true }), num(b.followup_delay_days, 'Délai de relance', { min: 1, max: 60, int: true }),
      ctx.cid);
    return publicCompany(db.prepare('SELECT * FROM companies WHERE id=?').get(ctx.cid));
  });

  // Logo : PNG/JPEG ≤ 400 Ko, type vérifié sur les octets (pas sur l'extension déclarée).
  add('PUT', '/api/company/logo', { auth: true, maxBody: 700_000 }, ctx => {
    const m = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(ctx.body.data || '');
    if (!m) throw new HttpError(400, 'Format de logo non pris en charge (PNG ou JPEG).');
    const buf = Buffer.from(m[2], 'base64');
    if (buf.length > 400_000) throw new HttpError(400, 'Logo trop volumineux (400 Ko maximum).');
    const mime = sniff(buf);
    if (!mime) throw new HttpError(400, 'Fichier image invalide.');
    db.prepare('UPDATE companies SET logo=?, logo_mime=? WHERE id=?').run(buf, mime, ctx.cid);
    return { ok: true };
  });
  add('DELETE', '/api/company/logo', { auth: true }, ctx => {
    db.prepare('UPDATE companies SET logo=NULL, logo_mime=NULL WHERE id=?').run(ctx.cid); return { ok: true };
  });
  add('GET', '/api/company/logo', { auth: true }, ctx => {
    const c = db.prepare('SELECT logo, logo_mime FROM companies WHERE id=?').get(ctx.cid);
    if (!c.logo) throw new HttpError(404, 'Aucun logo.');
    return ctx.raw(200, c.logo_mime, Buffer.from(c.logo), { 'Cache-Control': 'private, max-age=60' });
  });

  // Modèles de prestations
  add('GET', '/api/templates', { auth: true }, ctx =>
    db.prepare('SELECT * FROM service_templates WHERE company_id=? ORDER BY label').all(ctx.cid));
  add('POST', '/api/templates', { auth: true }, ctx => {
    const r = db.prepare('INSERT INTO service_templates (company_id,label,unit_price_cents,vat_rate) VALUES (?,?,?,?)').run(ctx.cid,
      str(ctx.body.label, 'Libellé', { required: true, max: 160 }), num(ctx.body.unit_price_cents, 'Prix', { max: 1e8, int: true }), num(ctx.body.vat_rate, 'TVA', { max: 100 }));
    return db.prepare('SELECT * FROM service_templates WHERE id=?').get(r.lastInsertRowid);
  });
  add('DELETE', '/api/templates/:id', { auth: true }, ctx => {
    const r = db.prepare('DELETE FROM service_templates WHERE id=? AND company_id=?').run(ctx.params.id, ctx.cid);
    if (!r.changes) throw new HttpError(404, 'Introuvable.'); return { ok: true };
  });

  // RGPD : export complet et suppression du compte
  add('GET', '/api/export', { auth: true }, ctx => {
    const q = (sql) => db.prepare(sql).all(ctx.cid);
    const company = publicCompany(db.prepare('SELECT * FROM companies WHERE id=?').get(ctx.cid));
    return ctx.raw(200, 'application/json', JSON.stringify({
      exported_at: new Date().toISOString(), company,
      clients: q('SELECT * FROM clients WHERE company_id=?'),
      interactions: q('SELECT * FROM interactions WHERE company_id=?'),
      quotes: q('SELECT * FROM quotes WHERE company_id=?'),
      quote_lines: q('SELECT * FROM quote_lines WHERE company_id=?'),
      followups: q('SELECT * FROM followups WHERE company_id=?'),
      service_templates: q('SELECT * FROM service_templates WHERE company_id=?'),
    }, null, 2), { 'Content-Disposition': 'attachment; filename="export-devis974.json"' });
  });
  add('POST', '/api/company/delete', { auth: true, limit: [5, 3600e3] }, ctx => {
    const u = db.prepare('SELECT password_hash FROM users WHERE id=?').get(ctx.session.user_id);
    if (!verifyPassword(String(ctx.body.password || ''), u.password_hash)) throw new HttpError(403, 'Mot de passe incorrect.');
    db.prepare('DELETE FROM companies WHERE id=?').run(ctx.cid); // cascade sur toutes les données
    return { ok: true };
  });
}
