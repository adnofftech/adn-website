"""Ligne de commande de KAPTUR Radar. Usage : python -m radar --help"""
from __future__ import annotations

import argparse
import csv
import io
import os
import pathlib
import sys

from . import audit as audit_mod
from . import demo as demo_mod
from . import find as find_mod
from . import messages, store

CSV_FIELDS = ["name", "sector", "commune", "address", "phone", "email", "website", "instagram", "status", "score", "notes", "next_followup"]
SENDERS = {"ensone": messages.Sender("Ensone", "0693 85 54 26"), "adrien": messages.Sender("Adrien", "0693 82 40 54")}


def _db(args):
    return args.db or os.environ.get("RADAR_DB")


def _row_dict(row) -> dict:
    return {k: row[k] for k in row.keys()}


def do_audit(con, pid: int, html_file: str | None = None):
    row = store.get(con, pid)
    if row is None:
        raise KeyError(pid)
    if row["source"] == "demo" and not html_file:
        res = demo_mod.audit_for(row["name"]) or audit_mod.no_site_result()
    elif html_file:
        html = pathlib.Path(html_file).read_text(encoding="utf-8", errors="replace")
        res = audit_mod.analyze_html(html, row["website"] or html_file)
    elif row["website"]:
        res = audit_mod.audit_url(row["website"])
    else:
        res = audit_mod.no_site_result()
    store.save_audit(con, pid, res.to_dict())
    return res


def print_audit(res):
    if res.error:
        print(f"  ! {res.error}")
        return
    print(f"  Score : {res.score}/100  (réponse {res.elapsed_ms} ms, {max(1, res.size_bytes // 1024)} Ko)")
    for c in res.failed:
        print(f"  - {c.label} : {c.detail}")


def cmd_add(a, con):
    pid = store.add_prospect(con, a.name, sector=a.sector, commune=a.commune, website=a.website, phone=a.phone, email=a.email, instagram=a.instagram, notes=a.notes)
    print(f"Prospect #{pid} ajouté : {a.name}")


def cmd_find(a, con):
    items = find_mod.search(a.sector, commune_postal=a.postal, pages=a.pages, include_individuals=a.include_individuals)
    items = items[: a.limit]
    if not items:
        print("Aucun résultat.")
        return
    added = 0
    for it in items:
        print(f"- {it['name']} ({it['commune']}) SIREN {it['siren']}")
        if not a.dry_run:
            try:
                store.add_prospect(con, **it)
                added += 1
            except ValueError:
                pass
    print(f"{len(items)} trouvé(s), {added} ajouté(s)." if not a.dry_run else f"{len(items)} trouvé(s) (simulation, rien d'ajouté).")
    if not a.dry_run:
        print("Ensuite : cherchez leur site, téléphone et Instagram à la main (Google Maps, Facebook), puis complétez avec la commande « edit ».")


def cmd_edit(a, con):
    fields = {k: v for k, v in (("website", a.website), ("phone", a.phone), ("email", a.email), ("instagram", a.instagram), ("commune", a.commune), ("sector", a.sector), ("notes", a.notes)) if v is not None}
    store.update(con, a.id, **fields)
    print("Mis à jour.")


def cmd_list(a, con):
    rows = store.list_prospects(con, status=a.status, sector=a.sector, due_only=a.due)
    if not rows:
        print("Aucun prospect.")
        return
    for r in rows:
        score = "-" if r["score"] is None else str(r["score"])
        due = f" relance {r['next_followup']}" if r["next_followup"] else ""
        print(f"#{r['id']:<3} {r['name'][:34]:<34} {r['sector']:<12} {r['commune'][:18]:<18} score {score:>3}  [{r['status']}]{due}")


def cmd_audit(a, con):
    ids = [r["id"] for r in store.list_prospects(con)] if a.all else [a.id]
    for pid in ids:
        row = store.get(con, pid)
        if row is None:
            print(f"Prospect #{pid} introuvable.")
            return 1
        print(f"#{pid} {row['name']}")
        print_audit(do_audit(con, pid, a.file))


def cmd_message(a, con):
    row = store.get(con, a.id)
    if row is None:
        print("Prospect introuvable.")
        return 1
    last = store.last_audit(con, a.id)
    m = messages.build(_row_dict(row), last, SENDERS.get(a.sender.lower(), messages.Sender(a.sender)))
    kinds = ["dm", "email", "call", "relance_1", "relance_2"] if a.kind == "all" else [a.kind]
    titles = {"dm": "MESSAGE WHATSAPP / INSTAGRAM", "email": "E-MAIL", "call": "SCRIPT D'APPEL", "relance_1": "RELANCE 1 (J+3)", "relance_2": "RELANCE 2 (J+7)"}
    if last is None and row["website"]:
        print("(Pas encore d'audit : lancez d'abord « audit » pour personnaliser avec de vrais constats.)\n")
    for k in kinds:
        print(f"=== {titles[k]} ===")
        if k == "email":
            print(f"Objet : {m['email_subject']}\n")
        print(m[k] + "\n")
    print("Rien n'a été envoyé. Relisez, adaptez, envoyez vous-même.")


def cmd_status(a, con):
    store.set_status(con, a.id, a.status, a.in_days)
    print(f"Prospect #{a.id} : {a.status}")


def cmd_stats(a, con):
    for s, n in store.stats(con).items():
        print(f"{s:<14} {n}")


def _read_csv(text: str) -> list[dict]:
    text = text.lstrip("﻿")
    try:
        dialect = csv.Sniffer().sniff(text[:2000], delimiters=",;\t")
    except csv.Error:
        dialect = csv.excel
    return list(csv.DictReader(io.StringIO(text), dialect=dialect))


ALIASES = {"nom": "name", "entreprise": "name", "société": "name", "secteur": "sector", "ville": "commune", "adresse": "address",
           "téléphone": "phone", "telephone": "phone", "tel": "phone", "mail": "email", "e-mail": "email", "site": "website",
           "site web": "website", "notes": "notes", "note": "notes"}


def cmd_import(a, con):
    text = pathlib.Path(a.file).read_text(encoding="utf-8-sig", errors="replace")
    ok = skipped = 0
    for raw in _read_csv(text):
        row = {}
        for k, v in raw.items():
            if k is None:
                continue
            key = ALIASES.get(k.strip().lower(), k.strip().lower())
            row[key] = (v or "").strip()
        name = row.get("name", "")
        sector = row.get("sector") or "autre"
        if sector not in store.SECTORS:
            sector = "autre"
        try:
            store.add_prospect(con, name, sector=sector, commune=row.get("commune", ""), address=row.get("address", ""),
                               phone=row.get("phone", ""), email=row.get("email", ""), website=row.get("website", ""),
                               instagram=row.get("instagram", ""), notes=row.get("notes", ""), source="import-csv")
            ok += 1
        except ValueError:
            skipped += 1
    print(f"{ok} importé(s), {skipped} ignoré(s) (nom vide ou doublon).")


def cmd_export(a, con):
    out = io.StringIO()
    w = csv.DictWriter(out, fieldnames=CSV_FIELDS, extrasaction="ignore")
    w.writeheader()
    for r in store.list_prospects(con):
        d = _row_dict(r)
        # neutralise les formules si le CSV est ouvert dans un tableur
        w.writerow({k: ("'" + str(v) if isinstance(v, str) and v[:1] in "=+-@" else v) for k, v in d.items()})
    pathlib.Path(a.file).write_text(out.getvalue(), encoding="utf-8-sig")
    print(f"Exporté dans {a.file}")


def cmd_demo(a, con):
    ids = demo_mod.load(con)
    print(f"{len(ids)} prospects FICTIFS chargés (marqués « {demo_mod.MARK} »). Essayez : python -m radar list")


def cmd_serve(a, con):
    from . import web
    web.serve(a.port, _db(a))


def build_parser():
    p = argparse.ArgumentParser(prog="radar", description="KAPTUR Radar : trouver, auditer et approcher des entreprises réunionnaises.")
    p.add_argument("--db", help="chemin de la base SQLite (défaut : data/radar.db)")
    sub = p.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("add", help="ajouter un prospect à la main")
    s.add_argument("name"); s.add_argument("--sector", default="autre", choices=store.SECTORS)
    for f in ("commune", "website", "phone", "email", "instagram", "notes"):
        s.add_argument(f"--{f}", default="")
    s.set_defaults(fn=cmd_add)

    s = sub.add_parser("find", help="chercher des entreprises dans l'annuaire public")
    s.add_argument("sector", choices=list(find_mod.SECTOR_NAF))
    s.add_argument("--postal", help="code postal, ex. 97400")
    s.add_argument("--pages", type=int, default=1); s.add_argument("--limit", type=int, default=20)
    s.add_argument("--dry-run", action="store_true"); s.add_argument("--include-individuals", action="store_true")
    s.set_defaults(fn=cmd_find)

    s = sub.add_parser("edit", help="compléter la fiche d'un prospect")
    s.add_argument("id", type=int)
    for f in ("website", "phone", "email", "instagram", "commune", "notes"):
        s.add_argument(f"--{f}")
    s.add_argument("--sector", choices=store.SECTORS)
    s.set_defaults(fn=cmd_edit)

    s = sub.add_parser("list", help="lister les prospects")
    s.add_argument("--status", choices=store.STATUSES); s.add_argument("--sector", choices=store.SECTORS)
    s.add_argument("--due", action="store_true", help="relances à faire aujourd'hui ou en retard")
    s.set_defaults(fn=cmd_list)

    s = sub.add_parser("audit", help="auditer le site d'un prospect")
    g = s.add_mutually_exclusive_group(required=True)
    g.add_argument("id", type=int, nargs="?"); g.add_argument("--all", action="store_true")
    s.add_argument("--file", help="analyser un fichier HTML local au lieu de télécharger le site")
    s.set_defaults(fn=cmd_audit)

    s = sub.add_parser("message", help="préparer les messages pour un prospect (rien n'est envoyé)")
    s.add_argument("id", type=int)
    s.add_argument("--kind", default="all", choices=["all", "dm", "email", "call", "relance_1", "relance_2"])
    s.add_argument("--sender", default="Ensone")
    s.set_defaults(fn=cmd_message)

    s = sub.add_parser("status", help="changer le statut d'un prospect")
    s.add_argument("id", type=int); s.add_argument("status", choices=store.STATUSES)
    s.add_argument("--in-days", type=int, help="date de prochaine relance, en jours")
    s.set_defaults(fn=cmd_status)

    sub.add_parser("stats", help="entonnoir de prospection").set_defaults(fn=cmd_stats)
    s = sub.add_parser("import", help="importer un CSV (export de votre Google Sheet)"); s.add_argument("file"); s.set_defaults(fn=cmd_import)
    s = sub.add_parser("export", help="exporter en CSV"); s.add_argument("file"); s.set_defaults(fn=cmd_export)
    sub.add_parser("demo", help="charger 5 prospects fictifs").set_defaults(fn=cmd_demo)
    s = sub.add_parser("serve", help="lancer l'interface web locale"); s.add_argument("--port", type=int, default=8765); s.set_defaults(fn=cmd_serve)
    return p


def main(argv=None) -> int:
    args = build_parser().parse_args(argv)
    try:
        with store.connect(_db(args)) as con:
            rc = args.fn(args, con)
            return rc or 0
    except (ValueError, KeyError, FileNotFoundError, find_mod.FindError) as e:
        print(f"Erreur : {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
