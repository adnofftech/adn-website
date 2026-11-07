import { db, tx } from '../db.js';
import { HttpError, str, email, oneOf } from '../util.js';

export const STATUSES = ['nouveau', 'a_contacter', 'devis_a_preparer', 'devis_envoye', 'en_attente', 'accepte', 'refuse', 'termine'];
export const SOURCES = ['whatsapp', 'telephone', 'facebook', 'site_web', 'autre'];
const SORTS = { recent: 'c.created_at DESC', nom: 'c.last_name COLLATE NOCASE ASC', maj: 'c.updated_at DESC' };

export function ownClient(cid, id) {
  const c = db.prepare('SELECT * FROM clients WHERE id=? AND company_id=?').get(id, cid);
  if (!c) throw new HttpError(404, 'Client introuvable.');
  return c;
}
export function logInteraction(cid, clientId, kind, content) {
  db.prepare('INSERT INTO interactions (company_id,client_id,kind,content) VALUES (?,?,?,?)').run(cid, clientId, kind, content);
}
function fields(b) {
  return {
    first_name: str(b.first_name, 'Prénom', { max: 80 }), last_name: str(b.last_name, 'Nom', { required: true, max: 80 }),
    company_name: str(b.company_name, 'Société', { max: 120 }), phone: str(b.phone, 'Téléphone', { max: 30 }),
    email: email(b.email, 'E-mail', false), address: str(b.address, 'Adresse', { max: 200 }),
    city: str(b.city, 'Ville', { max: 80 }), postal_code: str(b.postal_code, 'Code postal', { max: 10 }),
    service_wanted: str(b.service_wanted, 'Prestation', { max: 160 }), need: str(b.need, 'Besoin', { max: 2000 }),
    source: oneOf(b.source || 'autre', SOURCES, 'Source'), status: oneOf(b.status || 'nouveau', STATUSES, 'Statut'),
    notes: str(b.notes, 'Notes', { max: 4000 }),
  };
}

export default function (add) {
  add('GET', '/api/clients', { auth: true }, ctx => {
    const { q = '', status = '', source = '', sort = 'recent' } = ctx.query;
    const where = ['c.company_id = ?']; const args = [ctx.cid];
    if (status) { where.push('c.status = ?'); args.push(oneOf(status, STATUSES, 'statut')); }
    if (source) { where.push('c.source = ?'); args.push(oneOf(source, SOURCES, 'source')); }
    if (q) {
      where.push(`(c.first_name || ' ' || c.last_name || ' ' || c.company_name || ' ' || c.phone || ' ' || c.email || ' ' || c.city) LIKE ? ESCAPE '\\'`);
      args.push('%' + q.slice(0, 80).replace(/[\\%_]/g, m => '\\' + m) + '%');
    }
    return db.prepare(`SELECT c.*, (SELECT COUNT(*) FROM quotes WHERE client_id=c.id) AS quote_count
      FROM clients c WHERE ${where.join(' AND ')} ORDER BY ${SORTS[sort] || SORTS.recent} LIMIT 500`).all(...args);
  });

  add('POST', '/api/clients', { auth: true }, ctx => {
    const d = fields(ctx.body);
    return tx(() => {
      const r = db.prepare(`INSERT INTO clients (company_id,first_name,last_name,company_name,phone,email,address,city,postal_code,service_wanted,need,source,status,notes)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(ctx.cid, ...Object.values(d));
      logInteraction(ctx.cid, r.lastInsertRowid, 'note', 'Fiche créée.');
      return db.prepare('SELECT * FROM clients WHERE id=?').get(r.lastInsertRowid);
    });
  });

  add('GET', '/api/clients/:id', { auth: true }, ctx => {
    const c = ownClient(ctx.cid, ctx.params.id);
    return {
      ...c,
      interactions: db.prepare('SELECT * FROM interactions WHERE client_id=? AND company_id=? ORDER BY id DESC').all(c.id, ctx.cid),
      quotes: db.prepare('SELECT id,number,status,title,total_ttc_cents,issue_date FROM quotes WHERE client_id=? AND company_id=? ORDER BY id DESC').all(c.id, ctx.cid),
    };
  });

  add('PUT', '/api/clients/:id', { auth: true }, ctx => {
    const old = ownClient(ctx.cid, ctx.params.id);
    const d = fields(ctx.body);
    tx(() => {
      db.prepare(`UPDATE clients SET first_name=?,last_name=?,company_name=?,phone=?,email=?,address=?,city=?,postal_code=?,service_wanted=?,need=?,source=?,status=?,notes=?,updated_at=datetime('now')
        WHERE id=? AND company_id=?`).run(...Object.values(d), old.id, ctx.cid);
      if (old.status !== d.status) logInteraction(ctx.cid, old.id, 'statut', `Statut : ${old.status} → ${d.status}`);
    });
    return db.prepare('SELECT * FROM clients WHERE id=?').get(old.id);
  });

  add('DELETE', '/api/clients/:id', { auth: true }, ctx => {
    const c = ownClient(ctx.cid, ctx.params.id);
    const n = db.prepare("SELECT COUNT(*) n FROM quotes WHERE client_id=? AND company_id=? AND status IN ('envoye','accepte')").get(c.id, ctx.cid).n;
    if (n) throw new HttpError(409, 'Ce client a des devis envoyés ou acceptés : suppression impossible.');
    db.prepare('DELETE FROM clients WHERE id=? AND company_id=?').run(c.id, ctx.cid);
    return { ok: true };
  });

  add('POST', '/api/clients/:id/interactions', { auth: true }, ctx => {
    const c = ownClient(ctx.cid, ctx.params.id);
    const kind = oneOf(ctx.body.kind || 'note', ['note', 'appel', 'message', 'visite'], 'Type');
    logInteraction(ctx.cid, c.id, kind, str(ctx.body.content, 'Contenu', { required: true, max: 2000 }));
    db.prepare("UPDATE clients SET updated_at=datetime('now') WHERE id=?").run(c.id);
    return { ok: true };
  });
}
