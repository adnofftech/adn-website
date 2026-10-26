"""Recherche d'entreprises réunionnaises dans l'annuaire public (API gratuite, sans clé).

Source : https://recherche-entreprises.api.gouv.fr (données ouvertes de l'État).
Garde-fous : on ne retient ni les entrepreneurs individuels (le nom de l'entreprise est
celui d'une personne), ni les établissements non diffusibles.
"""
from __future__ import annotations

import json
import urllib.parse
import urllib.request

API = "https://recherche-entreprises.api.gouv.fr/search"

# préfixe NAF -> secteur de l'outil
NAF_SECTOR = [
    ("56", "restauration"), ("55", "hôtellerie"), ("68", "immobilier"),
    ("41", "BTP"), ("42", "BTP"), ("43", "BTP"),
    ("47", "commerce"), ("96.02", "beauté"), ("86", "santé"),
]
# secteur -> codes NAF à interroger (un appel par code)
SECTOR_NAF = {
    "restauration": ["56.10A", "56.10C"],
    "hôtellerie": ["55.10Z", "55.20Z"],
    "immobilier": ["68.31Z"],
    "BTP": ["41.20A", "43.21A", "43.32A", "43.39Z"],
    "commerce": ["47.11B", "47.71Z", "47.78C"],
    "beauté": ["96.02A", "96.02B"],
    "santé": ["86.23Z"],
}


def sector_of(naf: str) -> str:
    for prefix, sector in NAF_SECTOR:
        if naf.startswith(prefix):
            return sector
    return "autre"


def _fetch(params: dict) -> dict:
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "KapturRadar/0.1", "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read(3_000_000).decode("utf-8"))


def parse(payload: dict, *, include_individuals: bool = False) -> list[dict]:
    out = []
    for r in payload.get("results", []):
        if r.get("etat_administratif") != "A":
            continue
        if r.get("statut_diffusion") not in (None, "O"):
            continue
        if not include_individuals and str(r.get("nature_juridique", "")).startswith("1"):
            continue
        siege = r.get("siege") or {}
        adresse = siege.get("adresse") or ""
        if "NON-DIFFUSIBLE" in adresse.upper():
            continue
        naf = siege.get("activite_principale") or r.get("activite_principale") or ""
        commune = (siege.get("libelle_commune") or "").title()
        out.append({
            "name": (r.get("nom_raison_sociale") or r.get("nom_complet") or "").title(),
            "siren": r.get("siren") or "",
            "sector": sector_of(naf),
            "commune": commune,
            "address": adresse.title(),
            "source": "annuaire-entreprises",
        })
    return out


def search(sector: str, *, commune_postal: str | None = None, pages: int = 1, per_page: int = 25,
           include_individuals: bool = False, fetch=_fetch) -> list[dict]:
    if sector not in SECTOR_NAF:
        raise ValueError(f"Secteur sans code NAF : {sector}. Choix : {', '.join(SECTOR_NAF)}")
    seen, found = set(), []
    for naf in SECTOR_NAF[sector]:
        for page in range(1, pages + 1):
            params = {"departement": "974", "activite_principale": naf, "etat_administratif": "A",
                      "per_page": per_page, "page": page}
            if commune_postal:
                params["code_postal"] = commune_postal
            for item in parse(fetch(params), include_individuals=include_individuals):
                if item["siren"] and item["siren"] not in seen:
                    seen.add(item["siren"])
                    found.append(item)
    return found
