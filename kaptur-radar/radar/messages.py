"""Messages de prospection personnalisés à partir de constats réels.

Rien n'est envoyé : ce module produit du texte que l'humain relit, adapte et envoie.
Aucune statistique ni témoignage inventé : seuls les constats de l'audit sont cités.
"""
from __future__ import annotations

from dataclasses import dataclass

OFFER = {
    "name": "KAPTUR TEST",
    "price": "99 €",
    "what": "1 tournage et 3 vidéos courtes livrées, paiement unique, sans engagement",
}

# constat de l'audit -> (phrase pour le message, ordre de priorité commercial)
HOOKS = {
    "video": "il n'y a pas de vidéo sur votre page d'accueil",
    "mobile": "votre site ne s'adapte pas bien à l'écran d'un téléphone",
    "contact": "je n'ai pas trouvé de téléphone ni d'e-mail visibles sur la page d'accueil",
    "social": "votre site n'est relié à aucun de vos réseaux sociaux",
    "https": "votre site s'ouvre sans cadenas de sécurité",
    "description": "Google n'a pas de description claire de votre activité à afficher",
    "fresh": "la date en bas de page laisse penser que le site n'est plus mis à jour",
    "speed": "la page met du temps à s'afficher",
    "whatsapp": "il n'y a pas de bouton WhatsApp pour vous écrire en un clic",
}
HOOK_ORDER = ["video", "mobile", "contact", "social", "https", "fresh", "speed", "description", "whatsapp"]

SECTOR_IDEA = {
    "restauration": "un Reel de 20 secondes sur un plat signature, la salle ou la terrasse",
    "hôtellerie": "un Reel sur les chambres, la vue et le petit-déjeuner",
    "immobilier": "une visite vidéo courte d'un bien, filmée à la verticale pour Instagram et TikTok",
    "BTP": "un Reel de chantier avant/après et de l'équipe au travail",
    "commerce": "un Reel sur vos nouveautés et l'ambiance de votre boutique",
    "beauté": "un Reel sur le résultat d'un soin et le cadre de l'institut",
    "santé": "une courte vidéo de présentation du cabinet et de l'équipe",
    "autre": "un Reel de 20 secondes qui montre ce que vous faites et pourquoi on vous choisit",
}


@dataclass
class Sender:
    name: str = "Ensone"
    whatsapp: str = "0693 85 54 26"
    email: str = "kaptur.visual@gmail.com"
    instagram: str = "@kaptur.visual"


def pick_hooks(audit: dict | None, n: int = 2) -> list[str]:
    """Retourne les ids de constats à citer (les plus parlants, parmi ceux réellement relevés)."""
    if not audit or audit.get("error"):
        return []
    failed = set(audit.get("failed_ids") or [c["id"] for c in audit.get("checks", []) if not c["ok"]])
    return [h for h in HOOK_ORDER if h in failed][:n]


def _constat(hooks: list[str], has_site: bool) -> str:
    if not has_site:
        return "je n'ai pas trouvé de site internet pour votre entreprise"
    if not hooks:
        return "votre site est plutôt bien tenu, mais il manque de contenu vidéo régulier"
    parts = [HOOKS[h] for h in hooks]
    return " et que ".join(parts) if len(parts) == 2 else parts[0]


def build(prospect: dict, audit: dict | None, sender: Sender | None = None) -> dict:
    s = sender or Sender()
    name = prospect["name"]
    sector = prospect.get("sector") or "autre"
    commune = prospect.get("commune") or ""
    has_site = bool(prospect.get("website"))
    hooks = pick_hooks(audit, 2) if has_site else []
    constat = _constat(hooks, has_site)
    idea = SECTOR_IDEA.get(sector, SECTOR_IDEA["autre"])
    where = f" à {commune}" if commune else ""
    if has_site and audit and not audit.get("error") and hooks:
        intro = f"En regardant le site de {name}, j'ai remarqué que {constat}."
    elif has_site and audit and audit.get("error"):
        intro = f"J'ai essayé d'ouvrir le site de {name} mais il ne répondait pas."
    elif has_site:
        intro = f"J'ai regardé la présence en ligne de {name} : {constat}."
    else:
        intro = f"En cherchant {name}{where} sur internet, {constat}."
    pitch = (f"Je suis {s.name}, de KAPTUR, une agence de vidéo courte à La Réunion. "
             f"Pour {name}, je verrais bien {idea}.")
    offer = (f"Pour essayer sans risque : {OFFER['name']}, {OFFER['what']}, {OFFER['price']}.")

    dm = (f"Bonjour, {intro}\n{pitch}\n{offer}\n"
          f"Si cela vous intéresse, je peux vous montrer un exemple. Bonne journée ! {s.name}, {s.whatsapp}")
    subject = f"{name} : une idée de vidéo courte" if hooks or not has_site else f"{name} : une idée pour votre vidéo"
    email = (
        f"Bonjour,\n\n{intro}\n\n{pitch}\n\n{offer}\n\n"
        f"Je peux vous envoyer un exemple ou passer vous voir {('à ' + commune) if commune else 'sur place'} 15 minutes, sans engagement.\n\n"
        f"Cordialement,\n{s.name}\nKAPTUR, vidéo courte à La Réunion\n{s.whatsapp} · {s.email} · {s.instagram}\n\n"
        f"Je vous écris car votre entreprise est référencée publiquement comme professionnelle. "
        f"Si vous ne souhaitez plus recevoir de message de ma part, répondez simplement « STOP » et je ne vous recontacterai pas."
    )
    call = (
        f"[Ouverture, 10 s] Bonjour, {s.name} de KAPTUR, on fait de la vidéo courte pour les entreprises réunionnaises. Je tombe bien ou je vous dérange ?\n"
        f"[Raison, 15 s] J'ai regardé {name} : {constat}. Je pense qu'{idea} aurait sa place chez vous.\n"
        f"[Question] Aujourd'hui, comment vos clients vous découvrent-ils ? Vous publiez déjà des vidéos ?\n"
        f"[Proposition] On propose un essai : {OFFER['what']}, {OFFER['price']}, sans engagement. Je peux passer 15 minutes cette semaine ?\n"
        f"[Si non] Aucun souci. Puis-je vous envoyer un exemple sur WhatsApp, et vous me dites ce que vous en pensez ?\n"
        f"[Clôture] Noter : date du prochain contact, objection principale."
    )
    follow1 = (f"Bonjour, je me permets de revenir vers vous au sujet de {name}. "
               f"Je vous envoie un exemple de vidéo courte pour vous donner une idée du rendu. Qu'en pensez-vous ? {s.name}, KAPTUR")
    follow2 = (f"Bonjour, dernier message de ma part pour ne pas vous déranger : {OFFER['name']} reste disponible "
               f"({OFFER['price']}, sans engagement) si le sujet vous intéresse un jour. Belle journée ! {s.name}, KAPTUR")
    return {
        "hooks": hooks,
        "constat": constat,
        "dm": dm,
        "email_subject": subject,
        "email": email,
        "call": call,
        "relance_1": follow1,
        "relance_2": follow2,
    }
