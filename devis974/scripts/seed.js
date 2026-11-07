// Données de démonstration : 3 entreprises fictives, marquées is_demo=1, avec comptes dédiés.
// Usage : npm run seed   (ne touche jamais aux comptes réels ; relancer remplace uniquement les démos)
import { db, tx, nextNumber } from '../lib/db.js';
import { hashPassword } from '../lib/auth.js';
import { computeTotals } from '../lib/calc.js';
import { today, addDays } from '../lib/util.js';

export const DEMO_PASSWORD = 'Demo-974-Exemple';
const T = today();
const ago = n => addDays(T, -n);

const DEMOS = [
  { slug: 'demo-clim-ocean', name: 'Clim Océan (démo)', owner: 'Axel Démo', email: 'demo-clim@devis974.example', phone: '0692 00 00 01', sector: 'Nettoyage de climatisation', city: 'Saint-Denis', postal: '97400', regime: 'applicable', rate: 8.5,
    services: [['Nettoyage climatisation split', 6500], ['Entretien annuel multi-split', 14000], ['Déplacement', 2500]],
    clients: [['Marie', 'Payet', 'Nettoyage clim 2 splits', 'whatsapp', 'nouveau'], ['Jean-Luc', 'Hoarau', 'Entretien annuel', 'telephone', 'devis_envoye'], ['Sophie', 'Grondin', 'Nettoyage clim salon', 'facebook', 'accepte'], ['Patrick', 'Técher', 'Dépannage clim', 'site_web', 'a_contacter'], ['Nadia', 'Boyer', 'Nettoyage 3 splits', 'whatsapp', 'refuse']] },
  { slug: 'demo-plomberie-bourbon', name: 'Plomberie Bourbon (démo)', owner: 'Yann Démo', email: 'demo-plombier@devis974.example', phone: '0693 00 00 02', sector: 'Plomberie', city: 'Saint-Paul', postal: '97460', regime: 'franchise', rate: 0,
    services: [['Main-d’œuvre (heure)', 4500], ['Remplacement chauffe-eau 200 L', 38000], ['Déplacement', 3000]],
    clients: [['Élodie', 'Rivière', 'Fuite salle de bain', 'telephone', 'devis_a_preparer'], ['Thierry', 'Maillot', 'Chauffe-eau solaire', 'whatsapp', 'en_attente'], ['Karine', 'Lebon', 'Rénovation sanitaires', 'autre', 'accepte']] },
  { slug: 'demo-jardin-tropical', name: 'Jardin Tropical (démo)', owner: 'Léa Démo', email: 'demo-jardin@devis974.example', phone: '0692 00 00 03', sector: 'Jardinage / paysagisme', city: 'Saint-Pierre', postal: '97410', regime: 'franchise', rate: 0,
    services: [['Entretien jardin (demi-journée)', 12000], ['Taille de haies (heure)', 3500], ['Évacuation déchets verts', 8000]],
    clients: [['Mathieu', 'Fontaine', 'Entretien mensuel jardin', 'facebook', 'devis_envoye'], ['Isabelle', 'Nirlo', 'Taille palmiers', 'telephone', 'nouveau'], ['Daniel', 'Cadet', 'Création massif', 'site_web', 'termine']] },
];
// [index client, titre, statut, jours depuis émission, lignes [index service, qté]]
const QUOTES = [
  [1, 'Entretien annuel', 'envoye', 6, [[1, 1], [2, 1]]], [2, 'Nettoyage salon', 'accepte', 25, [[0, 2], [2, 1]]], [4, 'Nettoyage 3 splits', 'refuse', 40, [[0, 3]]],
  [0, 'Nettoyage 2 splits', 'brouillon', 0, [[0, 2]]],
];

export function seed() {
  tx(() => {
    db.prepare('DELETE FROM companies WHERE is_demo=1').run();
    for (const d of DEMOS) {
      const cid = Number(db.prepare(`INSERT INTO companies (slug,name,owner_name,email,phone,sector,address,postal_code,city,vat_regime,default_vat_rate,legal_form,trial_ends_at,is_demo)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,1)`).run(d.slug, d.name, d.owner, d.email, d.phone, d.sector, 'Adresse fictive', d.postal, d.city, d.regime, d.rate, 'Entreprise fictive — exemple', addDays(T, 14)).lastInsertRowid);
      db.prepare('INSERT INTO users (company_id,email,password_hash) VALUES (?,?,?)').run(cid, d.email, hashPassword(DEMO_PASSWORD));
      for (const [l, p] of d.services) db.prepare('INSERT INTO service_templates (company_id,label,unit_price_cents,vat_rate) VALUES (?,?,?,?)').run(cid, l, p, d.rate);
      const ids = d.clients.map(([fn, ln, svc, src, st], i) => {
        const r = db.prepare(`INSERT INTO clients (company_id,first_name,last_name,phone,city,service_wanted,source,status,notes,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`)
          .run(cid, fn, ln, `0692 11 00 0${i}`, d.city, svc, src, st, 'Donnée fictive de démonstration.', ago(10 - i) + ' 09:00:00');
        db.prepare('INSERT INTO interactions (company_id,client_id,kind,content) VALUES (?,?,?,?)').run(cid, r.lastInsertRowid, 'note', 'Fiche créée (exemple).');
        return Number(r.lastInsertRowid);
      });
      QUOTES.forEach(([ci, title, status, days, items]) => {
        if (ci >= ids.length) return;
        const issue = ago(days);
        const t = computeTotals(items.map(([si, q], pos) => ({ position: pos, description: d.services[si][0], quantity: q, unit_price_cents: d.services[si][1], discount_pct: 0, vat_rate: d.rate })), d.regime);
        const r = db.prepare(`INSERT INTO quotes (company_id,client_id,number,status,title,issue_date,valid_until,payment_terms,vat_regime,subtotal_ht_cents,total_vat_cents,total_ttc_cents,sent_at,decided_at,followup_date)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(cid, ids[ci], nextNumber(cid, 'quote', 'DEV', Number(issue.slice(0, 4))), status, title + ' (exemple)', issue, addDays(issue, 30),
          'Acompte de 30 % à la commande, solde à la fin de la prestation.', d.regime, t.subtotal_ht_cents, t.total_vat_cents, t.total_ttc_cents,
          status === 'brouillon' ? null : issue, ['accepte', 'refuse'].includes(status) ? addDays(issue, 3) : null, status === 'envoye' ? addDays(issue, 3) : null);
        const ins = db.prepare('INSERT INTO quote_lines (quote_id,company_id,position,description,quantity,unit_price_cents,discount_pct,vat_rate) VALUES (?,?,?,?,?,?,?,?)');
        t.lines.forEach(l => ins.run(r.lastInsertRowid, cid, l.position, l.description, l.quantity, l.unit_price_cents, l.discount_pct, l.vat_rate));
      });
    }
  });
  return DEMOS.map(d => d.email);
}
if (process.argv[1].endsWith('seed.js')) console.log('Comptes de démonstration créés (mot de passe : ' + DEMO_PASSWORD + ')\n' + seed().join('\n'));
