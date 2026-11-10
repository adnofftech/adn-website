# Génère les 5 pages du site à partir du gabarit commun (en-tête, pied) et des corps body-*.html.
# Usage, depuis rachid-shopp/ :  python3 gabarits/generer-pages.py .
import sys, pathlib
OUT = pathlib.Path(sys.argv[1])
PAGES = [
 ("index.html","","Rachid Shopp – Réparations iPhone, accessoires et parfums à La Réunion","Réparation d’écran et de batterie iPhone, verres trempés, protections caméra, parfums et muscs. Livraison gratuite à La Réunion."),
 ("reparations.html","","Réparations iPhone – Rachid Shopp","Tarifs écran Soft OLED et batterie par modèle d’iPhone, pièce et main-d’œuvre comprises."),
 ("accessoires.html","","Accessoires iPhone – Rachid Shopp","Verre trempé 9H, protections intégrales caméra et protections de lentilles pour iPhone."),
 ("parfums.html","theme-perf","Parfums & muscs – Rachid Shopp","Parfums, extraits, muscs et huiles parfumées : 14 références disponibles à La Réunion."),
 ("demande.html","","Préparer ma demande – Rachid Shopp","Préparez un message de commande à copier et à envoyer à Rachid Shopp."),
]
NAV = [("index.html","Accueil"),("reparations.html","Réparations"),("accessoires.html","Accessoires"),("parfums.html","Parfums"),("demande.html","Commander")]
def shell(file, cls, title, desc, body):
    nav = "".join(f'<a href="{h}"{" aria-current=\"page\"" if h==file else ""}>{l}</a>' for h,l in NAV)
    fnav = "".join(f'<a href="{h}">{l}</a>' for h,l in NAV)
    return f'''<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="robots" content="noindex">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="img/apercu-partage.png">
<meta name="theme-color" content="#10141B">
<link rel="icon" href="img/identite/favicon.svg" type="image/svg+xml">
<link rel="icon" href="img/identite/favicon.ico" sizes="64x64">
<link rel="apple-touch-icon" href="img/identite/apple-touch-icon.png">
<link rel="stylesheet" href="style.css">
</head>
<body class="{cls}">
<a class="skip" href="#contenu">Aller au contenu</a>
<header class="top"><div class="wrap">
  <a class="brand" href="index.html"><img src="img/identite/mot-symbole-clair.svg" alt="Rachid Shopp – accueil" width="640" height="120"></a>
  <nav aria-label="Navigation principale">{nav}</nav>
</div></header>
<main id="contenu">
{body}
</main>
<footer><div class="wrap">
  <div><img src="img/identite/mot-symbole-clair.svg" alt="" width="640" height="120"><div>Rachid Shopp · La Réunion</div>
    <p>Commande par message écrit, livraison gratuite sur l’île. Informations du vendeur, conditions de vente et de retour : à compléter avant publication.</p></div>
  <nav aria-label="Pied de page">{fnav}</nav>
</div></footer>
<script src="config.js"></script>
<script src="data.js"></script>
<script src="app.js"></script>
</body>
</html>
'''
for file, cls, title, desc in PAGES:
    body = (pathlib.Path(__file__).parent / ("body-"+file)).read_text()
    (OUT/file).write_text(shell(file, cls, title, desc, body))
    print("écrit", file)
