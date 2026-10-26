"""Données de démonstration 100 % fictives (noms et sites inventés). Jamais présentées comme réelles."""
from __future__ import annotations

import pathlib

from . import audit, store

DATA = pathlib.Path(__file__).parent / "demo_data"

DEMO = [
    ("Garage Démo Océan", "autre", "Saint-Pierre", "vieux_site.html", "http://garage-demo-ocean.example/"),
    ("Restaurant Démo Lagon", "restauration", "Saint-Gilles-les-Bains", "site_moyen.html", "https://demo-lagon.example/"),
    ("Institut Démo Bourbon", "beauté", "Saint-Denis", "bon_site.html", "https://institut-demo-bourbon.example/"),
    ("Agence Démo Immo 974", "immobilier", "Sainte-Clotilde", None, ""),
    ("Menuiserie Démo Piton", "BTP", "Le Tampon", "vieux_site.html", "http://menuiserie-demo-piton.example/"),
]
MARK = "DÉMO fictive"


def load(con) -> list[int]:
    ids = []
    for name, sector, commune, fixture, url in DEMO:
        pid = store.add_prospect(con, name, sector=sector, commune=commune, website=url, source="demo", notes=MARK)
        if fixture:
            html = (DATA / fixture).read_text(encoding="utf-8")
            res = audit.analyze_html(html, url, final_url=url, elapsed_ms=700)
            store.save_audit(con, pid, res.to_dict())
        ids.append(pid)
    return ids


def audit_for(name: str):
    """Audit hors ligne d'un prospect de démo (les sites .example n'existent pas)."""
    for n, _sector, _commune, fixture, url in DEMO:
        if n == name and fixture:
            return audit.analyze_html((DATA / fixture).read_text(encoding="utf-8"), url, final_url=url, elapsed_ms=700)
    return None
