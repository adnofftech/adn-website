import { db, tx, nextNumber } from '../db.js';
import { HttpError, str, num, isoDate, today, addDays, oneOf } from '../util.js';
import { computeTotals } from '../calc.js';
import { ownClient, logInteraction } from './clients.js';
import { renderQuotePdf } from '../pdf.js';

export const FOLLOWUP_MIN_HOURS = 48;
export const FOLLOWUP_MAX = 3;
const TRANSITIONS = { brouillon: ['envoye'], envoye: ['accepte', 'refuse'], expire: [], accepte: [], refuse: [] };
const LABEL = { envoye: 'Devis envoyé', accepte: 'Devis accepté', refuse: 'Devis refusé' };
const CLIENT_STATUS = { envoye: 'devis_envoye', accepte: 'accepte', refuse: 'refuse' };

export function expireQuotes(cid) {
  db.prepare("UPDATE quotes SET status='expire', updated_at=datetime('now') WHERE company_id=? AND status='envoye' AND valid_until < ?").run(cid, today());
}
function ownQuote(cid, id) {
  expireQuotes(cid);
  const q = db.prepare('SELECT * FROM quotes WHERE id=? AND company_id=?').get(id, cid);
  if (!q) throw new HttpError(404, 'Devis introuvable.');
  return q;
}
function loadFull(cid, id) {
  const q = ownQuote(cid, id);
  return {
    ...q,
    lines: db.prepare('SELECT * FROM quote_lines WHERE quote_id=? AND company_id=? ORDER BY position').all(q.id, cid),
    client: db.prepare('SELECT * FROM clients WHERE id=? AND company_id=?').get(q.client_id, cid),
    followups: db.prepare('SELECT * FROM followups WHERE quote_id=? AND company_id=? ORDER BY id DESC').all(q.id, cid),
  };
}
function parseLines(raw, regime) {
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 50) throw new HttpError(400, 'Ajoutez entre 1 et 50 lignes au devis.');
  const lines = raw.map((l, i) => ({
    position: i,
    description: str(l.description, `Ligne ${i + 1} : description`, { required: true, max: 300 }),
    quantity: num(l.quantity, `Ligne ${i + 1} : quantité`, { min: 0.01, max: 100000 }),
    unit_price_cents: num(l.unit_price_cents, `Ligne ${i + 1} : prix`, { max: 1e9, int: true }),
    discount_pct: num(l.discount_pct ?? 0, `Ligne ${i + 1} : remise`, { max: 100 }),
    vat_rate: num(l.vat_rate ?? 0, `Ligne ${i + 1} : TVA`, { max: 100 }),
  }));
  return computeTotals(lines, regime);
}
function saveLines(cid, quoteId, lines) {
  db.prepare('DELETE FROM quote_lines WHERE quote_id=? AND company_id=?').run(quoteId, cid);
  const ins = db.prepare('INSERT INTO quote_lines (quote_id,company_id,position,description,quantity,unit_price_cents,discount_pct,vat_rate) VALUES (?,?,?,?,?,?,?,?)');
  for (const l of lines) ins.run(quoteId, cid, l.position, l.description, l.quantity, l.unit_price_cents, l.discount_pct, l.vat_rate);
}

export function whatsappNumber(phone) {
  let d = (phone || '').replace(/[^\d+]/g, '');
  if (d.startsWith('+')) return d.slice(1);
  if (d.startsWith('00')) return d.slice(2);
  if (/^0\d{9}$/.test(d)) return (/^0(262|692|693)/.test(d) ? '262' : '33') + d.slice(1);
  return d.replace(/\D/g, '');
}
export function followupMessage(q, client, company) {
  const hello = client.first_name ? `Bonjour ${client.first_name}` : 'Bonjour';
  const what = q.title || client.service_wanted || 'votre projet';
  return `${hello}, je me permets de revenir vers vous concernant le devis pour ${what} (n° ${q.number}). Avez-vous eu le temps d’en prendre connaissance ? Je reste disponible si vous avez des questions. Bonne journée !\n${company.owner_name} — ${company.name}`;
}

export default function (add) {
  add('GET', '/api/quotes', { auth: true }, ctx => {
    expireQuotes(ctx.cid);
    const where = ['q.company_id=?']; const args = [ctx.cid];
    if (ctx.query.status) { where.push('q.status=?'); args.push(oneOf(ctx.query.status, ['brouillon', 'envoye', 'accepte', 'refuse', 'expire'], 'statut')); }
    if (ctx.query.client_id) { where.push('q.client_id=?'); args.push(Number(ctx.query.client_id)); }
    return db.prepare(`SELECT q.id,q.number,q.status,q.title,q.issue_date,q.valid_until,q.total_ttc_cents,q.followup_date,
      c.first_name,c.last_name,c.company_name FROM quotes q JOIN clients c ON c.id=q.client_id
      WHERE ${where.join(' AND ')} ORDER BY q.id DESC LIMIT 500`).all(...args);
  });

  add('POST', '/api/quotes', { auth: true }, ctx => {
    const ent = ctx.entitlements();
    if (!ent.can_create_quotes) throw new HttpError(402, ent.reason);
    const b = ctx.body;
    const client = ownClient(ctx.cid, Number(b.client_id));
    const co = db.prepare('SELECT * FROM companies WHERE id=?').get(ctx.cid);
    const t = parseLines(b.lines, co.vat_regime);
    const issue = b.issue_date ? isoDate(b.issue_date, 'date') : today();
    const valid = b.valid_until ? isoDate(b.valid_until, 'validité') : addDays(issue, co.quote_validity_days);
    if (valid < issue) throw new HttpError(400, 'La date de validité précède la date du devis.');
    const id = tx(() => {
      const number = nextNumber(ctx.cid, 'quote', 'DEV', Number(issue.slice(0, 4)));
      const r = db.prepare(`INSERT INTO quotes (company_id,client_id,number,title,issue_date,valid_until,payment_terms,notes,vat_regime,subtotal_ht_cents,total_vat_cents,total_ttc_cents)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(ctx.cid, client.id, number, str(b.title, 'Objet', { max: 160 }), issue, valid,
        str(b.payment_terms ?? co.payment_terms, 'Conditions', { max: 600 }), str(b.notes, 'Notes', { max: 2000 }), co.vat_regime,
        t.subtotal_ht_cents, t.total_vat_cents, t.total_ttc_cents);
      saveLines(ctx.cid, r.lastInsertRowid, t.lines);
      if (['nouveau', 'a_contacter', 'devis_a_preparer'].includes(client.status))
        db.prepare("UPDATE clients SET status='devis_a_preparer', updated_at=datetime('now') WHERE id=?").run(client.id);
      logInteraction(ctx.cid, client.id, 'devis', `Brouillon ${number} créé.`);
      return Number(r.lastInsertRowid);
    });
    return loadFull(ctx.cid, id);
  });

  add('GET', '/api/quotes/:id', { auth: true }, ctx => loadFull(ctx.cid, ctx.params.id));

  add('PUT', '/api/quotes/:id', { auth: true }, ctx => {
    const q = ownQuote(ctx.cid, ctx.params.id);
    if (q.status !== 'brouillon') throw new HttpError(409, 'Un devis envoyé ne peut plus être modifié. Dupliquez-le pour en créer une nouvelle version.');
    const b = ctx.body;
    const client = ownClient(ctx.cid, Number(b.client_id));
    const co = db.prepare('SELECT * FROM companies WHERE id=?').get(ctx.cid);
    const t = parseLines(b.lines, co.vat_regime);
    const issue = isoDate(b.issue_date, 'date'); const valid = isoDate(b.valid_until, 'validité');
    if (valid < issue) throw new HttpError(400, 'La date de validité précède la date du devis.');
    tx(() => {
      db.prepare(`UPDATE quotes SET client_id=?,title=?,issue_date=?,valid_until=?,payment_terms=?,notes=?,vat_regime=?,subtotal_ht_cents=?,total_vat_cents=?,total_ttc_cents=?,updated_at=datetime('now')
        WHERE id=? AND company_id=?`).run(client.id, str(b.title, 'Objet', { max: 160 }), issue, valid, str(b.payment_terms, 'Conditions', { max: 600 }),
        str(b.notes, 'Notes', { max: 2000 }), co.vat_regime, t.subtotal_ht_cents, t.total_vat_cents, t.total_ttc_cents, q.id, ctx.cid);
      saveLines(ctx.cid, q.id, t.lines);
    });
    return loadFull(ctx.cid, q.id);
  });

  add('DELETE', '/api/quotes/:id', { auth: true }, ctx => {
    const q = ownQuote(ctx.cid, ctx.params.id);
    if (q.status !== 'brouillon') throw new HttpError(409, 'Seuls les brouillons peuvent être supprimés.');
    db.prepare('DELETE FROM quotes WHERE id=? AND company_id=?').run(q.id, ctx.cid);
    return { ok: true };
  });

  add('POST', '/api/quotes/:id/duplicate', { auth: true }, ctx => {
    const ent = ctx.entitlements();
    if (!ent.can_create_quotes) throw new HttpError(402, ent.reason);
    const q = loadFull(ctx.cid, ctx.params.id);
    const co = db.prepare('SELECT * FROM companies WHERE id=?').get(ctx.cid);
    const t = computeTotals(q.lines, co.vat_regime);
    const id = tx(() => {
      const issue = today();
      const number = nextNumber(ctx.cid, 'quote', 'DEV', Number(issue.slice(0, 4)));
      const r = db.prepare(`INSERT INTO quotes (company_id,client_id,number,title,issue_date,valid_until,payment_terms,notes,vat_regime,subtotal_ht_cents,total_vat_cents,total_ttc_cents)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(ctx.cid, q.client_id, number, q.title, issue, addDays(issue, co.quote_validity_days), q.payment_terms, q.notes, co.vat_regime, t.subtotal_ht_cents, t.total_vat_cents, t.total_ttc_cents);
      saveLines(ctx.cid, r.lastInsertRowid, t.lines.map((l, i) => ({ ...l, position: i })));
      return Number(r.lastInsertRowid);
    });
    return loadFull(ctx.cid, id);
  });

  add('POST', '/api/quotes/:id/status', { auth: true }, ctx => {
    const q = ownQuote(ctx.cid, ctx.params.id);
    const next = oneOf(ctx.body.status, ['envoye', 'accepte', 'refuse'], 'statut');
    if (!TRANSITIONS[q.status].includes(next)) throw new HttpError(409, 'Ce changement de statut n’est pas possible.');
    if (next === 'envoye' && q.valid_until < today()) throw new HttpError(409, 'La date de validité est dépassée : modifiez-la ou dupliquez le devis.');
    if (next === 'envoye' && q.total_ttc_cents <= 0) throw new HttpError(409, 'Le total du devis est nul : complétez les prix avant l’envoi.');
    const co = db.prepare('SELECT followup_delay_days FROM companies WHERE id=?').get(ctx.cid);
    tx(() => {
      if (next === 'envoye') db.prepare("UPDATE quotes SET status='envoye', sent_at=?, followup_date=?, updated_at=datetime('now') WHERE id=?").run(today(), addDays(today(), co.followup_delay_days), q.id);
      else db.prepare("UPDATE quotes SET status=?, decided_at=?, followup_date=NULL, updated_at=datetime('now') WHERE id=?").run(next, today(), q.id);
      db.prepare("UPDATE clients SET status=?, updated_at=datetime('now') WHERE id=? AND company_id=?").run(CLIENT_STATUS[next], q.client_id, ctx.cid);
      logInteraction(ctx.cid, q.client_id, 'devis', `${LABEL[next]} : ${q.number}.`);
    });
    return loadFull(ctx.cid, q.id);
  });

  add('GET', '/api/quotes/:id/pdf', { auth: true }, async ctx => {
    const q = loadFull(ctx.cid, ctx.params.id);
    const co = db.prepare('SELECT * FROM companies WHERE id=?').get(ctx.cid);
    const buf = await renderQuotePdf(q, co);
    return ctx.raw(200, 'application/pdf', buf, { 'Content-Disposition': `attachment; filename="${q.number}.pdf"`, 'Cache-Control': 'private, no-store' });
  });

  // ---- Relances ----
  add('GET', '/api/followups/due', { auth: true }, ctx => {
    expireQuotes(ctx.cid);
    const co = db.prepare('SELECT * FROM companies WHERE id=?').get(ctx.cid);
    const rows = db.prepare(`SELECT q.*, c.first_name,c.last_name,c.company_name,c.phone,c.email, c.service_wanted,
        (SELECT COUNT(*) FROM followups f WHERE f.quote_id=q.id) AS followup_count,
        (SELECT MAX(created_at) FROM followups f WHERE f.quote_id=q.id) AS last_followup
      FROM quotes q JOIN clients c ON c.id=q.client_id
      WHERE q.company_id=? AND q.status='envoye' ORDER BY q.followup_date ASC`).all(ctx.cid);
    return rows.map(r => ({
      id: r.id, number: r.number, title: r.title, total_ttc_cents: r.total_ttc_cents, followup_date: r.followup_date, sent_at: r.sent_at,
      client_name: [r.first_name, r.last_name].join(' ').trim(), phone: r.phone, email: r.email,
      followup_count: r.followup_count, last_followup: r.last_followup,
      overdue: r.followup_date <= today(), maxed: r.followup_count >= FOLLOWUP_MAX,
      message: followupMessage(r, r, co),
    }));
  });

  add('GET', '/api/quotes/:id/followup-message', { auth: true }, ctx => {
    const q = loadFull(ctx.cid, ctx.params.id);
    const co = db.prepare('SELECT * FROM companies WHERE id=?').get(ctx.cid);
    const message = followupMessage(q, q.client, co);
    const wa = whatsappNumber(q.client.phone);
    return {
      message,
      whatsapp_url: wa ? `https://wa.me/${wa}?text=${encodeURIComponent(message)}` : null,
      mailto_url: q.client.email ? `mailto:${q.client.email}?subject=${encodeURIComponent('Votre devis ' + q.number)}&body=${encodeURIComponent(message)}` : null,
    };
  });

  // Enregistre qu'une relance a été faite (manuellement par l'artisan) et reprogramme la suivante.
  add('POST', '/api/quotes/:id/followups', { auth: true }, ctx => {
    const q = ownQuote(ctx.cid, ctx.params.id);
    if (q.status !== 'envoye') throw new HttpError(409, 'Seuls les devis envoyés et sans réponse peuvent être relancés.');
    const channel = oneOf(ctx.body.channel, ['whatsapp', 'email', 'telephone', 'copie'], 'canal');
    const prev = db.prepare("SELECT COUNT(*) n, MAX(created_at) last FROM followups WHERE quote_id=? AND company_id=?").get(q.id, ctx.cid);
    if (prev.n >= FOLLOWUP_MAX) throw new HttpError(429, `Limite atteinte : ${FOLLOWUP_MAX} relances maximum par devis, pour ne pas harceler le client.`);
    if (prev.last && Date.now() - Date.parse(prev.last.replace(' ', 'T') + 'Z') < FOLLOWUP_MIN_HOURS * 3600e3)
      throw new HttpError(429, `Une relance a déjà été enregistrée il y a moins de ${FOLLOWUP_MIN_HOURS} h. Patientez avant de relancer à nouveau.`);
    const message = str(ctx.body.message, 'Message', { required: true, max: 2000 });
    tx(() => {
      db.prepare('INSERT INTO followups (company_id,quote_id,channel,message) VALUES (?,?,?,?)').run(ctx.cid, q.id, channel, message);
      db.prepare("UPDATE quotes SET followup_date=?, updated_at=datetime('now') WHERE id=?").run(addDays(today(), 4), q.id);
      db.prepare("UPDATE clients SET status='en_attente', updated_at=datetime('now') WHERE id=? AND company_id=?").run(q.client_id, ctx.cid);
      logInteraction(ctx.cid, q.client_id, 'relance', `Relance (${channel}) pour ${q.number}.`);
    });
    return loadFull(ctx.cid, q.id);
  });

  add('POST', '/api/quotes/:id/followup-date', { auth: true }, ctx => {
    const q = ownQuote(ctx.cid, ctx.params.id);
    if (q.status !== 'envoye') throw new HttpError(409, 'Seuls les devis envoyés peuvent avoir une relance programmée.');
    const date = isoDate(ctx.body.date, 'relance');
    if (date < today()) throw new HttpError(400, 'La date de relance doit être aujourd’hui ou plus tard.');
    db.prepare("UPDATE quotes SET followup_date=?, updated_at=datetime('now') WHERE id=?").run(date, q.id);
    return loadFull(ctx.cid, q.id);
  });
}
