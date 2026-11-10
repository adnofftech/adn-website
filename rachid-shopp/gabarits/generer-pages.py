# Génère les 5 pages du site à partir du gabarit commun (en-tête, pied) et des corps body-*.html.
# Usage, depuis rachid-shopp/ :  python3 gabarits/generer-pages.py .
import sys, pathlib, datetime
OUT = pathlib.Path(sys.argv[1])
HERE = pathlib.Path(__file__).parent
YEAR = datetime.date.today().year

# file, body class, <title>, description, close ("photo" on the home, "type" elsewhere)
PAGES = [
 ("index.html", "", "Rachid Shopp : réparations iPhone, accessoires et parfums à La Réunion",
  "Écran et batterie d’iPhone remplacés chez vous dès 60 €, verres trempés, protections caméra, parfums et muscs livrés gratuitement sur l’île.", "photo"),
 ("reparations.html", "", "Rachid Shopp : réparation d’écran et de batterie iPhone à domicile",
  "Le tarif de l’écran Soft OLED et de la batterie pour chaque iPhone, pièce et main-d’œuvre comprises, déplacement gratuit sur l’île.", "type"),
 ("accessoires.html", "", "Rachid Shopp : verres trempés et protections caméra pour iPhone",
  "Verre trempé 9H à 13 € pose comprise, protections intégrales caméra et protections de lentilles pour iPhone, livrées sur l’île.", "type"),
 ("parfums.html", "theme-perf", "Rachid Shopp : parfums, muscs et huiles parfumées à La Réunion",
  "Quatorze références Volaré, Lattafa, Paris Corner, Maison Alhambra et World Valentia, livrées gratuitement sur l’île.", "type"),
 ("demande.html", "", "Rachid Shopp : préparer une demande de réparation ou de commande",
  "Composez votre message de commande avec l’article, le modèle d’iPhone et le tarif, puis copiez-le pour l’envoyer à Rachid.", "type"),
]
NAV = [("reparations.html", "Réparations"), ("accessoires.html", "Accessoires"), ("parfums.html", "Parfums")]
ACTION = ("demande.html", "Préparer ma demande")

CLOSE_PHOTO = f'''
  <div class="closing__cta close--photo">
    <div class="closing__head">
      <div><h2>Une commande par message, livrée chez vous</h2>
      <p class="t-lead muted">Rachid répond de 6 h à 10 h et livre gratuitement sur l’île.</p></div>
      <a class="btn btn--primary" href="demande.html">Préparer ma demande</a>
    </div>
    <figure class="frame frame--photo closing__photo"><img src="img/categories/accessoires-large.webp" alt="Deux verres trempés posés sur des iPhone, en studio" width="1200" height="800" loading="lazy" decoding="async"></figure>
  </div>'''
CLOSE_TYPE = '''
  <div class="closing__cta close--type">
    <div class="closing__head">
      <div><h2>Une commande par message, livrée chez vous</h2>
      <p class="t-lead muted">Rachid répond de 6 h à 10 h et livre gratuitement sur l’île.</p></div>
      <a class="btn btn--primary" href="demande.html">Préparer ma demande</a>
    </div>
  </div>'''

def shell(file, cls, title, desc, body, close):
    nav = "".join(f'<li><a href="{h}"{" aria-current=\"page\"" if h == file else ""}>{l}</a></li>' for h, l in NAV)
    sheet = "".join(f'<li><a href="{h}">{l}</a></li>' for h, l in [("index.html", "Accueil")] + NAV)
    fcols = "".join(f'<li><a href="{h}">{l}</a></li>' for h, l in [("index.html", "Accueil")] + NAV + [ACTION])
    return f'''<!doctype html>
<html lang="fr" data-type="service" data-radius="soft" data-buttons="solid" data-motion>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="robots" content="noindex">
<meta name="page-type" content="service"><meta name="site-kind" content="other">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:type" content="website">
<meta property="og:image" content="img/apercu-partage.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#10141b">
<link rel="icon" href="img/identite/favicon.svg" type="image/svg+xml">
<link rel="icon" href="img/identite/favicon.ico" sizes="64x64">
<link rel="apple-touch-icon" href="img/identite/apple-touch-icon.png">
<link rel="preload" href="fonts/archivo-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="style.css">
<script>document.documentElement.classList.add('m-enter')</script>
</head>
<body class="{cls}">
<header class="nav nav--centre"><div class="wrap">
  <a class="skip-link" href="#top">Aller au contenu</a>
  <a class="nav__logo" href="index.html"><img src="img/identite/mot-symbole-clair.svg" alt="Rachid Shopp, accueil" width="640" height="120"></a>
  <nav class="nav__links" aria-label="Pages"><ul>{nav}</ul></nav>
  <div class="nav__actions">
    <a class="btn btn--primary nav__cta" href="{ACTION[0]}">{ACTION[1]}</a>
    <button class="nav__toggle" type="button" aria-expanded="false" aria-controls="menu" aria-label="Menu"><span></span><span></span></button>
  </div>
</div>
<div class="nav__sheet" id="menu" hidden><nav aria-label="Menu"><ul>{sheet}</ul></nav><a class="btn btn--primary" href="{ACTION[0]}">{ACTION[1]}</a></div>
</header>
<main id="top">
{body}
</main>
<footer class="closing footer--dark"><div class="wrap">{close}
  <div class="closing__dir">
    <div class="closing__brand"><img src="img/identite/mot-symbole-clair.svg" alt="" width="640" height="120"><p class="t-lead">Réparations iPhone, accessoires et parfums à La Réunion.</p></div>
    <nav class="closing__col" aria-label="Pied de page"><h3 class="t-label">Pages</h3><ul>{fcols}</ul></nav>
    <div class="closing__col"><h3 class="t-label">Commander</h3><ul><li>Par message écrit, avec l’adresse complète et le téléphone</li><li>Réponses de 6 h à 10 h</li><li>Livraisons programmées de 10 h à 18 h</li></ul></div>
  </div>
  <p class="closing__legal"><span>Rachid Shopp · La Réunion</span><span>{YEAR}</span></p>
</div></footer>
<script src="config.js"></script>
<script src="data.js"></script>
<script src="app.js"></script>
</body>
</html>
'''

for file, cls, title, desc, close in PAGES:
    body = (HERE / ("body-" + file)).read_text()
    (OUT / file).write_text(shell(file, cls, title, desc, body, CLOSE_PHOTO if close == "photo" else CLOSE_TYPE))
    print("écrit", file)
