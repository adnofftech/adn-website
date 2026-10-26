"""Audit d'un site web : récupère la page d'accueil et vérifie des points concrets.

Rien n'est inventé : chaque constat vient du HTML réellement reçu.
Bibliothèque standard uniquement.
"""
from __future__ import annotations

import ipaddress
import re
import socket
import time
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser
from dataclasses import dataclass, field, asdict
from html.parser import HTMLParser

USER_AGENT = "KapturRadar/0.1 (audit ponctuel d'une page d'accueil; kaptur.visual@gmail.com)"
MAX_BYTES = 2_000_000
TIMEOUT = 10

SOCIAL_HOSTS = {
    "instagram": ("instagram.com",),
    "facebook": ("facebook.com", "fb.com"),
    "tiktok": ("tiktok.com",),
    "youtube": ("youtube.com", "youtu.be"),
    "linkedin": ("linkedin.com",),
}
VIDEO_HOSTS = ("youtube.com", "youtu.be", "vimeo.com", "dailymotion.com", "tiktok.com")


def normalize_url(raw: str) -> str:
    raw = (raw or "").strip()
    if not raw:
        raise ValueError("URL vide")
    if re.match(r"^(javascript|data|vbscript|mailto|tel|file|ftp|about|blob):", raw, re.I):
        raise ValueError("Seuls http et https sont acceptés")
    if not re.match(r"^[a-z][a-z0-9+.-]*://", raw, re.I):
        raw = "https://" + raw
    parts = urllib.parse.urlsplit(raw)
    if parts.scheme not in ("http", "https"):
        raise ValueError("Seuls http et https sont acceptés")
    if not parts.hostname:
        raise ValueError("URL sans nom de domaine")
    return urllib.parse.urlunsplit((parts.scheme, parts.netloc, parts.path or "/", parts.query, ""))


class _Page(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title = ""
        self._in_title = False
        self.meta: dict[str, str] = {}
        self.lang = ""
        self.h1 = 0
        self.imgs = 0
        self.imgs_alt = 0
        self.hrefs: list[str] = []
        self.iframes: list[str] = []
        self.videos = 0
        self.scripts = 0
        self.text: list[str] = []
        self._skip = 0
        self.forms = 0

    def handle_starttag(self, tag, attrs):
        a = {k.lower(): (v or "") for k, v in attrs}
        if tag == "html":
            self.lang = a.get("lang", "")
        elif tag == "title":
            self._in_title = True
        elif tag == "meta":
            key = (a.get("name") or a.get("property") or a.get("http-equiv") or "").lower()
            if key:
                self.meta[key] = a.get("content", "")
        elif tag == "h1":
            self.h1 += 1
        elif tag == "img":
            self.imgs += 1
            if a.get("alt", "").strip():
                self.imgs_alt += 1
        elif tag == "a" and a.get("href"):
            self.hrefs.append(a["href"])
        elif tag == "iframe" and a.get("src"):
            self.iframes.append(a["src"])
        elif tag == "video":
            self.videos += 1
        elif tag == "form":
            self.forms += 1
        elif tag in ("script", "style", "noscript"):
            self._skip += 1
            if tag == "script":
                self.scripts += 1

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
        elif tag in ("script", "style", "noscript") and self._skip:
            self._skip -= 1

    def handle_data(self, data):
        if self._in_title:
            self.title += data
        elif not self._skip:
            self.text.append(data)


@dataclass
class Check:
    id: str
    label: str
    ok: bool
    weight: int
    detail: str  # constat factuel
    why: str  # pourquoi cela compte pour le client


@dataclass
class AuditResult:
    url: str
    final_url: str = ""
    status: int = 0
    elapsed_ms: int = 0
    size_bytes: int = 0
    error: str = ""
    checks: list[Check] = field(default_factory=list)
    socials: dict[str, str] = field(default_factory=dict)
    score: int = 0

    @property
    def failed(self) -> list[Check]:
        return sorted((c for c in self.checks if not c.ok), key=lambda c: -c.weight)

    def to_dict(self) -> dict:
        d = asdict(self)
        d["failed_ids"] = [c.id for c in self.failed]
        return d


def _host_matches(url: str, hosts: tuple[str, ...]) -> bool:
    h = (urllib.parse.urlsplit(url).hostname or "").lower()
    return any(h == x or h.endswith("." + x) for x in hosts)


def analyze_html(html: str, url: str, *, status: int = 200, elapsed_ms: int = 0, final_url: str = "") -> AuditResult:
    """Analyse un HTML déjà obtenu. Fonction pure, testable hors ligne."""
    p = _Page()
    try:
        p.feed(html)
        p.close()
    except Exception:  # HTML cassé : on analyse ce qui a été lu
        pass
    final = final_url or url
    res = AuditResult(url=url, final_url=final, status=status, elapsed_ms=elapsed_ms, size_bytes=len(html.encode("utf-8", "ignore")))
    text = re.sub(r"\s+", " ", " ".join(p.text)).strip()
    desc = p.meta.get("description", "").strip()
    title = re.sub(r"\s+", " ", p.title).strip()
    hrefs = [urllib.parse.urljoin(final, h) for h in p.hrefs]

    for name, hosts in SOCIAL_HOSTS.items():
        for h in hrefs:
            if _host_matches(h, hosts):
                res.socials[name] = h
                break

    has_tel = any(h.lower().startswith("tel:") for h in p.hrefs) or bool(re.search(r"(?:\+262|0262|0692|0693)[\s.]?\d", text))
    has_mail = any(h.lower().startswith("mailto:") for h in p.hrefs) or bool(re.search(r"[\w.+-]+@[\w-]+\.[\w.]+", text))
    has_wa = any("wa.me" in h or "whatsapp.com" in h for h in hrefs)
    has_video = bool(p.videos) or any(_host_matches(src, VIDEO_HOSTS) for src in p.iframes)
    years = [int(y) for y in re.findall(r"(?:©|&copy;|copyright)\s*(?:\d{4}\s*[-–]\s*)?(20\d{2})", html, re.I)]
    year_now = time.localtime().tm_year

    def add(id, label, ok, weight, detail, why):
        res.checks.append(Check(id, label, bool(ok), weight, detail, why))

    add("https", "Site sécurisé (https)", final.startswith("https://"), 10,
        "Le site s'ouvre en https." if final.startswith("https://") else "Le site s'ouvre en http, sans cadenas.",
        "Les navigateurs affichent « non sécurisé » : cela fait fuir des visiteurs et nuit au référencement.")
    add("mobile", "Adapté au téléphone", "width=device-width" in p.meta.get("viewport", "").replace(" ", ""), 15,
        "La page déclare un affichage mobile." if "viewport" in p.meta else "Aucune balise d'affichage mobile détectée.",
        "Une grande partie des visiteurs vient d'un téléphone : un site non adapté se lit mal et se quitte vite.")
    add("title", "Titre de page clair", 15 <= len(title) <= 70, 8,
        f"Titre : « {title[:70]} »" if title else "Aucun titre de page.",
        "Le titre est ce qui s'affiche dans Google et dans l'onglet : il doit dire qui vous êtes et ce que vous faites.")
    add("description", "Description pour Google", len(desc) >= 50, 8,
        "Description présente." if desc else "Aucune description pour les moteurs de recherche.",
        "C'est la phrase affichée sous votre nom dans Google. Sans elle, Google choisit un extrait au hasard.")
    add("h1", "Un titre principal visible", p.h1 == 1, 5,
        f"{p.h1} titre(s) principal(aux) détecté(s)." ,
        "Un seul grand titre aide le visiteur et Google à comprendre la page en quelques secondes.")
    add("lang", "Langue déclarée", bool(p.lang), 2, f"Langue : {p.lang or 'non déclarée'}.",
        "Détail technique qui aide les navigateurs et l'accessibilité.")
    ratio = (p.imgs_alt / p.imgs) if p.imgs else 1
    add("alt", "Images décrites", ratio >= 0.7, 4,
        f"{p.imgs_alt} image(s) sur {p.imgs} avec description." if p.imgs else "Aucune image détectée.",
        "Les descriptions d'images servent à l'accessibilité et au référencement.")
    add("contact", "Moyen de contact visible", has_tel or has_mail or has_wa, 12,
        "Contact détecté (" + ", ".join(n for n, v in (("téléphone", has_tel), ("e-mail", has_mail), ("WhatsApp", has_wa)) if v) + ")." if (has_tel or has_mail or has_wa) else "Aucun téléphone, e-mail ni WhatsApp détecté sur la page d'accueil.",
        "Un visiteur intéressé doit pouvoir vous joindre en un geste, sans chercher.")
    add("whatsapp", "Contact WhatsApp en un clic", has_wa, 4,
        "Lien WhatsApp présent." if has_wa else "Pas de lien WhatsApp.",
        "Beaucoup de clients préfèrent écrire plutôt qu'appeler : un lien WhatsApp supprime une étape.")
    add("social", "Réseaux sociaux reliés au site", len(res.socials) >= 1, 8,
        "Réseaux liés : " + ", ".join(res.socials) + "." if res.socials else "Aucun lien vers Instagram, Facebook ou TikTok.",
        "Le site doit renvoyer vers les endroits où l'entreprise est active, et inversement.")
    add("video", "Vidéo sur la page d'accueil", has_video, 15,
        "Une vidéo est intégrée." if has_video else "Aucune vidéo sur la page d'accueil.",
        "La vidéo courte est un format très regardé sur Instagram et TikTok : sans elle, le site reste une vitrine figée.")
    add("fresh", "Site à jour", (not years) or max(years) >= year_now - 1, 6,
        (f"Dernière année affichée : {max(years)}." if years else "Pas d'année de copyright affichée."),
        "Une date ancienne en bas de page laisse penser que l'entreprise n'est plus active.")
    add("speed", "Chargement rapide", elapsed_ms == 0 or elapsed_ms <= 3000, 6,
        f"Réponse en {elapsed_ms} ms." if elapsed_ms else "Temps non mesuré.",
        "Au-delà de quelques secondes, une part des visiteurs part avant d'avoir vu la page.")
    add("weight", "Page légère", res.size_bytes <= 1_500_000, 3,
        (f"HTML de {res.size_bytes // 1024} Ko." if res.size_bytes >= 1024 else f"HTML de {res.size_bytes} octets."), "Une page lourde est lente en 4G.")
    add("content", "Contenu suffisant", len(text.split()) >= 80, 6,
        f"Environ {len(text.split())} mots sur la page.", "Une page trop pauvre ne convainc ni les clients ni Google.")

    total = sum(c.weight for c in res.checks)
    res.score = round(100 * sum(c.weight for c in res.checks if c.ok) / total) if total else 0
    return res


def robots_allows(url: str, opener=urllib.request.urlopen) -> bool:
    parts = urllib.parse.urlsplit(url)
    rp = urllib.robotparser.RobotFileParser()
    try:
        req = urllib.request.Request(f"{parts.scheme}://{parts.netloc}/robots.txt", headers={"User-Agent": USER_AGENT})
        with opener(req, timeout=TIMEOUT) as r:
            rp.parse(r.read(200_000).decode("utf-8", "ignore").splitlines())
    except Exception:
        return True  # pas de robots.txt lisible : on continue
    return rp.can_fetch(USER_AGENT, url)


def is_private_host(host: str) -> bool:
    """Vrai pour localhost et les adresses IP privées : l'outil ne doit pas sonder le réseau local."""
    host = (host or "").strip("[]").lower()
    if host in ("localhost", "localhost.localdomain") or host.endswith(".local") or host.endswith(".internal"):
        return True
    try:
        ip = ipaddress.ip_address(host)
    except ValueError:
        return False
    return ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast or ip.is_unspecified


def resolves_private(host: str) -> bool:
    """Vrai si le nom de domaine pointe vers une adresse privée (protection contre le détournement vers le réseau local)."""
    try:
        infos = socket.getaddrinfo(host, None)
    except OSError:
        return False  # introuvable : l'erreur réseau normale sera remontée plus loin
    return any(is_private_host(i[4][0]) for i in infos)


class _SafeRedirect(urllib.request.HTTPRedirectHandler):
    allow_private = False

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        host = urllib.parse.urlsplit(newurl).hostname or ""
        if not self.allow_private and (is_private_host(host) or resolves_private(host)):
            raise urllib.error.URLError("redirection vers une adresse locale refusée")
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def audit_url(raw_url: str, *, respect_robots: bool = True, allow_private: bool = False) -> AuditResult:
    """Télécharge la page d'accueil (une seule requête) et l'analyse."""
    try:
        url = normalize_url(raw_url)
    except ValueError as e:
        return AuditResult(url=raw_url or "", error=str(e))
    if not allow_private and is_private_host(urllib.parse.urlsplit(url).hostname or ""):
        return AuditResult(url=url, error="Adresse locale ou privée refusée.")
    if not allow_private and resolves_private(urllib.parse.urlsplit(url).hostname or ""):
        return AuditResult(url=url, error="Ce nom de domaine pointe vers une adresse locale : refusé.")
    if respect_robots and not robots_allows(url):
        return AuditResult(url=url, error="Le site demande aux robots de ne pas lire cette page (robots.txt).")
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html"})
    t0 = time.monotonic()
    try:
        handler = _SafeRedirect()
        handler.allow_private = allow_private
        with urllib.request.build_opener(handler).open(req, timeout=TIMEOUT) as r:
            raw = r.read(MAX_BYTES)
            status, final = r.status, r.geturl()
            charset = r.headers.get_content_charset() or "utf-8"
    except urllib.error.HTTPError as e:
        return AuditResult(url=url, status=e.code, error=f"Le site répond avec une erreur HTTP {e.code}.")
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        return AuditResult(url=url, error=f"Site inaccessible : {getattr(e, 'reason', e)}")
    elapsed = int((time.monotonic() - t0) * 1000)
    html = raw.decode(charset, "replace")
    return analyze_html(html, url, status=status, elapsed_ms=elapsed, final_url=final)


def no_site_result() -> AuditResult:
    """Prospect sans site : constat à part, utilisé par le générateur de messages."""
    return AuditResult(url="", error="Aucun site renseigné", score=0)
