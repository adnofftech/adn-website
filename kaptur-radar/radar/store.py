"""Base locale des prospects (SQLite, bibliothèque standard)."""
from __future__ import annotations

import datetime as dt
import json
import pathlib
import sqlite3
from contextlib import contextmanager

DEFAULT_DB = pathlib.Path(__file__).resolve().parent.parent / "data" / "radar.db"

STATUSES = ["à contacter", "contacté", "relancé", "réponse", "rdv / devis", "client", "perdu"]
SECTORS = ["restauration", "hôtellerie", "immobilier", "BTP", "commerce", "beauté", "santé", "autre"]

SCHEMA = """
CREATE TABLE IF NOT EXISTS prospects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  siren TEXT,
  sector TEXT NOT NULL DEFAULT 'autre',
  commune TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  instagram TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'à contacter',
  score INTEGER,
  notes TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'manuel',
  created TEXT NOT NULL,
  last_contact TEXT,
  next_followup TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_prospects_siren ON prospects(siren) WHERE siren IS NOT NULL AND siren <> '';
CREATE TABLE IF NOT EXISTS audits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prospect_id INTEGER NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  ts TEXT NOT NULL,
  data TEXT NOT NULL
);
"""

EDITABLE = {"name", "sector", "commune", "address", "phone", "email", "website", "instagram", "notes", "next_followup"}


def today() -> str:
    return dt.date.today().isoformat()


@contextmanager
def connect(path=None):
    path = pathlib.Path(path or DEFAULT_DB)
    if str(path) != ":memory:":
        path.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(str(path))
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys = ON")
    con.executescript(SCHEMA)
    try:
        yield con
        con.commit()
    finally:
        con.close()


def add_prospect(con, name: str, **fields) -> int:
    name = (name or "").strip()
    if not name:
        raise ValueError("Le nom est obligatoire")
    if fields.get("sector") and fields["sector"] not in SECTORS:
        raise ValueError(f"Secteur inconnu : {fields['sector']}")
    cols = {"name": name, "created": today()}
    for k in EDITABLE - {"name"} | {"siren", "source"}:
        if k in fields and fields[k] is not None:
            cols[k] = str(fields[k]).strip()
    if cols.get("siren") == "":
        cols.pop("siren")
    keys = ", ".join(cols)
    marks = ", ".join("?" for _ in cols)
    try:
        cur = con.execute(f"INSERT INTO prospects ({keys}) VALUES ({marks})", list(cols.values()))
    except sqlite3.IntegrityError as e:
        raise ValueError("Ce prospect existe déjà (même SIREN)") from e
    return cur.lastrowid


def get(con, pid: int):
    return con.execute("SELECT * FROM prospects WHERE id = ?", (pid,)).fetchone()


def update(con, pid: int, **fields) -> None:
    bad = set(fields) - EDITABLE
    if bad:
        raise ValueError(f"Champs non modifiables : {', '.join(sorted(bad))}")
    if fields.get("sector") and fields["sector"] not in SECTORS:
        raise ValueError(f"Secteur inconnu : {fields['sector']}")
    if not fields:
        return
    sets = ", ".join(f"{k} = ?" for k in fields)
    cur = con.execute(f"UPDATE prospects SET {sets} WHERE id = ?", [*fields.values(), pid])
    if cur.rowcount == 0:
        raise KeyError(pid)


def set_status(con, pid: int, status: str, followup_days: int | None = None) -> None:
    if status not in STATUSES:
        raise ValueError(f"Statut inconnu : {status}")
    fields = {"status": status}
    if status in ("contacté", "relancé", "réponse", "rdv / devis"):
        fields["last_contact"] = today()
    sets = ", ".join(f"{k} = ?" for k in fields)
    cur = con.execute(f"UPDATE prospects SET {sets} WHERE id = ?", [*fields.values(), pid])
    if cur.rowcount == 0:
        raise KeyError(pid)
    default_days = {"contacté": 3, "relancé": 4}
    days = followup_days if followup_days is not None else default_days.get(status)
    if days is not None:
        nxt = (dt.date.today() + dt.timedelta(days=days)).isoformat()
        con.execute("UPDATE prospects SET next_followup = ? WHERE id = ?", (nxt, pid))
    elif status in ("client", "perdu"):
        con.execute("UPDATE prospects SET next_followup = NULL WHERE id = ?", (pid,))


def save_audit(con, pid: int, result: dict) -> None:
    con.execute("INSERT INTO audits (prospect_id, ts, data) VALUES (?, ?, ?)", (pid, dt.datetime.now().isoformat(timespec="seconds"), json.dumps(result, ensure_ascii=False)))
    con.execute("UPDATE prospects SET score = ? WHERE id = ?", (result.get("score") if not result.get("error") else None, pid))


def last_audit(con, pid: int):
    row = con.execute("SELECT data, ts FROM audits WHERE prospect_id = ? ORDER BY id DESC LIMIT 1", (pid,)).fetchone()
    if not row:
        return None
    d = json.loads(row["data"])
    d["_ts"] = row["ts"]
    return d


def list_prospects(con, status: str | None = None, sector: str | None = None, due_only: bool = False):
    q, args = "SELECT * FROM prospects WHERE 1=1", []
    if status:
        q += " AND status = ?"; args.append(status)
    if sector:
        q += " AND sector = ?"; args.append(sector)
    if due_only:
        q += " AND next_followup IS NOT NULL AND next_followup <= ?"; args.append(today())
    q += " ORDER BY CASE WHEN score IS NULL THEN 1 ELSE 0 END, score ASC, id DESC"
    return con.execute(q, args).fetchall()


def delete(con, pid: int) -> None:
    con.execute("DELETE FROM prospects WHERE id = ?", (pid,))


def stats(con) -> dict:
    rows = con.execute("SELECT status, COUNT(*) n FROM prospects GROUP BY status").fetchall()
    out = {s: 0 for s in STATUSES}
    out.update({r["status"]: r["n"] for r in rows})
    return out
