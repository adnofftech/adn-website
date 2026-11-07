import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const path = process.env.DB_PATH || new URL('../data/devis974.db', import.meta.url).pathname;
if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
export const db = new DatabaseSync(path);
db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');

db.exec(`
CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY, slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL, owner_name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL,
  sector TEXT NOT NULL, address TEXT NOT NULL DEFAULT '', postal_code TEXT NOT NULL DEFAULT '', city TEXT NOT NULL DEFAULT '',
  siret TEXT NOT NULL DEFAULT '', legal_form TEXT NOT NULL DEFAULT '', vat_number TEXT NOT NULL DEFAULT '',
  vat_regime TEXT NOT NULL DEFAULT 'franchise' CHECK (vat_regime IN ('franchise','applicable')),
  default_vat_rate REAL NOT NULL DEFAULT 0,
  payment_terms TEXT NOT NULL DEFAULT 'Acompte de 30 % à la commande, solde à la fin de la prestation.',
  legal_notes TEXT NOT NULL DEFAULT '',
  quote_validity_days INTEGER NOT NULL DEFAULT 30,
  followup_delay_days INTEGER NOT NULL DEFAULT 3,
  logo BLOB, logo_mime TEXT,
  plan TEXT NOT NULL DEFAULT 'trial', trial_ends_at TEXT NOT NULL,
  is_demo INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY, company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'owner',
  email_verified INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS reset_tokens (
  token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY, company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL DEFAULT '', last_name TEXT NOT NULL, company_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '', city TEXT NOT NULL DEFAULT '', postal_code TEXT NOT NULL DEFAULT '',
  service_wanted TEXT NOT NULL DEFAULT '', need TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'autre', status TEXT NOT NULL DEFAULT 'nouveau',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_clients_company ON clients(company_id);
CREATE TABLE IF NOT EXISTS interactions (
  id INTEGER PRIMARY KEY, company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_inter_client ON interactions(client_id);
CREATE TABLE IF NOT EXISTS service_templates (
  id INTEGER PRIMARY KEY, company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  label TEXT NOT NULL, unit_price_cents INTEGER NOT NULL DEFAULT 0, vat_rate REAL NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS quotes (
  id INTEGER PRIMARY KEY, company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  number TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'brouillon'
    CHECK (status IN ('brouillon','envoye','accepte','refuse','expire')),
  title TEXT NOT NULL DEFAULT '',
  issue_date TEXT NOT NULL, valid_until TEXT NOT NULL,
  payment_terms TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '',
  vat_regime TEXT NOT NULL DEFAULT 'franchise',
  subtotal_ht_cents INTEGER NOT NULL DEFAULT 0, total_vat_cents INTEGER NOT NULL DEFAULT 0, total_ttc_cents INTEGER NOT NULL DEFAULT 0,
  sent_at TEXT, decided_at TEXT, followup_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (company_id, number)
);
CREATE INDEX IF NOT EXISTS idx_quotes_company ON quotes(company_id, status);
CREATE TABLE IF NOT EXISTS quote_lines (
  id INTEGER PRIMARY KEY, quote_id INTEGER NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  position INTEGER NOT NULL, description TEXT NOT NULL,
  quantity REAL NOT NULL, unit_price_cents INTEGER NOT NULL, discount_pct REAL NOT NULL DEFAULT 0, vat_rate REAL NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS followups (
  id INTEGER PRIMARY KEY, company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  quote_id INTEGER NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  channel TEXT NOT NULL, message TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS counters (
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, year INTEGER NOT NULL, value INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (company_id, kind, year)
);
CREATE TABLE IF NOT EXISTS error_log (
  id INTEGER PRIMARY KEY, at TEXT NOT NULL DEFAULT (datetime('now')), path TEXT, message TEXT
);
`);

/** Exécute fn dans une transaction (rollback si exception). */
export function tx(fn) {
  db.exec('BEGIN IMMEDIATE');
  try { const r = fn(); db.exec('COMMIT'); return r; }
  catch (e) { db.exec('ROLLBACK'); throw e; }
}

/** Prochain numéro séquentiel pour une entreprise (ex. DEV-2026-0003). */
export function nextNumber(companyId, kind, prefix, year) {
  db.prepare(`INSERT INTO counters (company_id, kind, year, value) VALUES (?,?,?,0)
              ON CONFLICT(company_id, kind, year) DO NOTHING`).run(companyId, kind, year);
  db.prepare('UPDATE counters SET value = value + 1 WHERE company_id=? AND kind=? AND year=?').run(companyId, kind, year);
  const { value } = db.prepare('SELECT value FROM counters WHERE company_id=? AND kind=? AND year=?').get(companyId, kind, year);
  return `${prefix}-${year}-${String(value).padStart(4, '0')}`;
}
