import { db } from '../db.js';
import { today } from '../util.js';
import { expireQuotes } from './quotes.js';

export default function (add) {
  add('GET', '/api/dashboard', { auth: true }, ctx => {
    const cid = ctx.cid; expireQuotes(cid);
    const one = (sql, ...a) => db.prepare(sql).get(cid, ...a);
    const t = today();
    const sum = s => one(`SELECT COUNT(*) n, COALESCE(SUM(total_ttc_cents),0) total FROM quotes WHERE company_id=? AND status='${s}'`);
    const accepted = sum('accepte'), pending = sum('envoye'), refused = sum('refuse'), expired = sum('expire');
    const decided = accepted.n + refused.n + expired.n;

    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(t + 'T12:00:00Z'); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - i);
      months.push(d.toISOString().slice(0, 7));
    }
    const issued = Object.fromEntries(db.prepare(`SELECT substr(issue_date,1,7) m, SUM(total_ttc_cents) s FROM quotes WHERE company_id=? AND status!='brouillon' GROUP BY m`).all(cid).map(r => [r.m, r.s]));
    const won = Object.fromEntries(db.prepare(`SELECT substr(decided_at,1,7) m, SUM(total_ttc_cents) s FROM quotes WHERE company_id=? AND status='accepte' GROUP BY m`).all(cid).map(r => [r.m, r.s]));

    return {
      new_prospects: one("SELECT COUNT(*) n FROM clients WHERE company_id=? AND status='nouveau'").n,
      pending_quotes: pending,
      accepted,
      // Les factures arrivent à l'étape 2 : on n'affiche aucun chiffre inventé.
      unpaid_invoices: null,
      followups_due: one("SELECT COUNT(*) n FROM quotes WHERE company_id=? AND status='envoye' AND followup_date<=?", t).n,
      acceptance_rate: decided ? Math.round(accepted.n * 100 / decided) : null,
      decided_count: decided,
      monthly: months.map(m => ({ month: m, issued_cents: issued[m] || 0, accepted_cents: won[m] || 0 })),
      priorities: {
        to_call: db.prepare(`SELECT id,first_name,last_name,phone,service_wanted,status FROM clients WHERE company_id=? AND status IN ('nouveau','a_contacter') ORDER BY created_at ASC LIMIT 5`).all(cid),
        to_follow_up: db.prepare(`SELECT q.id,q.number,q.title,q.followup_date,q.total_ttc_cents,c.first_name,c.last_name FROM quotes q JOIN clients c ON c.id=q.client_id
          WHERE q.company_id=? AND q.status='envoye' AND q.followup_date<=? ORDER BY q.followup_date ASC LIMIT 5`).all(cid, t),
        to_prepare: db.prepare(`SELECT id,first_name,last_name,service_wanted FROM clients WHERE company_id=? AND status='devis_a_preparer' ORDER BY updated_at ASC LIMIT 5`).all(cid),
      },
      recent: db.prepare(`SELECT i.kind,i.content,i.created_at,c.id client_id,c.first_name,c.last_name FROM interactions i JOIN clients c ON c.id=i.client_id
        WHERE i.company_id=? ORDER BY i.id DESC LIMIT 8`).all(cid),
    };
  });
}
