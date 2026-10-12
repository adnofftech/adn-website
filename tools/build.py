#!/usr/bin/env python3
"""Génère les pages statiques de La Terrasse de Bourbon. Usage : python3 tools/build.py (depuis la racine du dépôt).
Les suggestions du moment se modifient dans suggestions.json, puis on relance ce script."""
import os, json
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

def ic(n):
    return open(f'assets/icons/{n}.svg').read().replace('<svg ', '<svg class="icon" aria-hidden="true" focusable="false" ', 1)

NB = ' '
TEL, TELTXT = 'tel:+262692253538', f'0692{NB}25{NB}35{NB}38'
MAP = 'https://www.google.com/maps/search/?api=1&query=7+rue+de+l%27Amiral+Lacaze+97400+Saint-Denis'
FB = 'https://www.facebook.com/laterrassedebourbon'
NAV = [('index.html', 'Accueil'), ('suggestions.html', 'Suggestions'), ('galerie.html', 'Galerie'), ('contact.html', 'Contact')]
SUG = json.load(open('suggestions.json', encoding='utf8'))
HOURS = f'<b>Lundi au jeudi :</b> 12h à 14h30 et 17h à 23h<br><b>Vendredi et samedi :</b> 12h à 14h30 et 17h à minuit<br><b>Dimanche :</b> 12h à 14h30'

def page(fn, title, desc, body, pad_close=True):
    items = ''.join(f'<li><a href="{h}"{" aria-current=\"page\"" if h == fn else ""}>{t}</a></li>' for h, t in NAV)
    open(fn, 'w').write(f'''<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title><meta name="description" content="{desc}">
<link rel="preload" href="assets/fonts/newsreader-latin-standard-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/style.css"></head><body>
<header class="mast"><div class="strip"><div class="wrap"><span>Ouvert tous les jours, 7 rue de l'Amiral Lacaze, Saint-Denis</span><a href="{TEL}">{TELTXT}</a></div></div>
<div class="wrap bar"><a class="brand" href="index.html" aria-label="La Terrasse de Bourbon, accueil"><img src="assets/img/logo.jpg" alt="" width="44" height="44">La Terrasse de Bourbon</a>
<nav id="nav" aria-label="Navigation principale"><ul>{items}</ul><a class="btn m-cta" href="{TEL}">Réserver</a></nav>
<a class="btn" href="{TEL}">Réserver</a>
<button class="burger" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="nav">{ic('list')}</button></div></header>
<main>{body}</main>
<footer class="close inv"><div class="wrap"><a class="big" href="{TEL}">Réserver, {TELTXT}</a>
<div class="cols"><div class="l"><a href="{MAP}" rel="noopener">{ic('map-pin')}7 rue de l'Amiral Lacaze, 97400 Saint-Denis</a><a href="{FB}" rel="noopener">{ic('facebook-logo')}Facebook</a></div>
<img src="assets/img/logo.jpg" alt="La Terrasse de Bourbon" width="72" height="72" style="width:72px;height:72px;border-radius:50%;object-fit:cover"></div>
<p class="legal">Maquette de refonte, projet non officiel. Prix TTC. Contenus à valider avec le restaurant.</p></div></footer>
<script src="assets/main.js"></script></body></html>''')

def menu_lists():
    out = ''
    for s in SUG['sections']:
        lis = ''.join(f'<li><b>{i["nom"]}</b><span class="dots"></span><span class="p">{i["prix"].replace(" ", NB)}</span><span class="d">{i["description"]}</span></li>' for i in s['items'])
        out += f'<h3>{s["titre"]}</h3><ul>{lis}</ul>'
    return out

REEL = [28, 13, 27, 4, 12, 21, 6, 9]
reel_a = ''.join(f'<img src="assets/img/photo-{k:02d}.jpg" alt="" width="300" height="300">' for k in REEL)
reel_b = reel_a.replace('<img ', '<img aria-hidden="true" ')

page('index.html', 'La Terrasse de Bourbon, restaurant et bar à cocktails à Saint-Denis', 'Restaurant et bar à cocktails au cœur de Saint-Denis, La Réunion : produits frais, suggestions du moment, soirées. 7 rue de l\'Amiral Lacaze.', f'''
<div class="hero"><div class="wrap"><h1 class="rise">Une table sous la <em>charpente</em>, à <span style="white-space:nowrap">Saint-Denis.</span></h1>
<div class="row rise"><p>Produits frais, cocktails et soirées, du déjeuner au soir.</p><div class="cta-row"><a class="btn" href="{TEL}">Réserver</a><a class="btn btn-line" href="suggestions.html">Voir les suggestions</a></div></div></div></div>
<div class="reel" role="img" aria-label="Plats et cocktails de La Terrasse de Bourbon"><div class="track">{reel_a}{reel_b}</div></div>
<section><div class="wrap"><p class="lead reveal">Sous une grande charpente en bois, entre végétation et néons, le déjeuner devient <em>soirée</em>.</p>
<div class="facts reveal"><div><b>Le déjeuner</b><span>Tous les jours, de 12h à 14h30.</span></div><div><b>Le soir</b><span>Du lundi au samedi dès 17h, jusqu'à 23h ou minuit.</span></div><div><b>Les soirées</b><span>Bourbon Latino, DJ Pepito, entrée libre.</span></div></div></div></section>
<section class="menu-block inv"><div class="wrap"><div class="reveal"><h2>Suggestions du moment</h2><p class="sub">{SUG['note']}</p>{menu_lists()}
<p class="foot">Dessert du moment, boissons et cocktails : à découvrir sur place. <a class="tlink" href="suggestions.html">Voir la page des suggestions</a></p></div>
<figure class="reveal"><img src="assets/img/photo-28.jpg" alt="Viande grillée et salade" loading="lazy"></figure></div></section>
<section class="night"><div class="wrap"><div class="reveal"><h2>Cocktails et soirées.</h2><p>Un bar à cocktails, des soirées à thème avec DJ, comme Bourbon Latino avec DJ Pepito. Les dates sont annoncées sur Facebook.</p><a class="btn btn-line" href="{FB}" rel="noopener">Suivre sur Facebook</a></div>
<div class="imgs reveal"><img src="assets/img/photo-20.jpg" alt="Cocktail à l'orange et au romarin" loading="lazy"><img src="assets/img/photo-24.jpg" alt="Cocktail dans un verre tiki" loading="lazy"></div></div></section>
<section class="reviews"><div class="wrap"><figure class="reveal"><blockquote>Nous avons passé un excellent moment. Les plats étaient délicieux, bien présentés et le service très agréable.</blockquote><cite>Vanessa Nagre, Facebook</cite></figure>
<div class="score-row reveal"><div><b>4,1/5</b><span>Note Google sur 518 avis, non vérifiés</span></div><div><b>86{NB}%</b><span>Recommandent sur Facebook, 213 avis</span></div></div>
<div class="more-q reveal"><figure><blockquote>Un de nos restaurants préférés ! Toujours bien accueillis !</blockquote><cite>Manon Rochefeuille, Facebook</cite></figure><figure><blockquote>Le service est très agréable et professionnel, les plats sont délicieux et le menu enfant très copieux.</blockquote><cite>Alicia Hoarau, Google</cite></figure></div></div></section>
<section class="infos"><div class="wrap"><h2 class="reveal">Venir nous voir</h2>
<div class="info-grid reveal"><div><h3>Horaires</h3><p>{HOURS}</p></div><div><h3>Adresse</h3><p>7 rue de l'Amiral Lacaze<br>97400 Saint-Denis</p><p style="margin-top:.8rem"><a class="tlink" href="{MAP}" rel="noopener">Itinéraire</a></p></div><div><h3>Réservation</h3><p><a class="tlink" href="{TEL}">{TELTXT}</a></p></div></div></div></section>''')

page('suggestions.html', 'Suggestions du moment, La Terrasse de Bourbon', 'Les suggestions du moment de La Terrasse de Bourbon à Saint-Denis : tapas, plats, burger de la semaine.', f'''
<div class="wrap"><div class="page-head"><h1>Suggestions du moment</h1></div></div>
<section class="menu-block inv" style="padding-top:var(--space-xl)"><div class="wrap"><div><p class="sub">{SUG['note']}</p>{menu_lists()}
<p class="foot">Dessert du moment, boissons et cocktails : à découvrir sur place. <a class="tlink" href="{TEL}">Réserver au {TELTXT}</a></p></div>
<figure><img src="assets/img/photo-27.jpg" alt="Faux-filet, frites et salade" loading="lazy"></figure></div></section>''')

alts = {1: 'Gâteau au chocolat en parts', 2: 'Buffet de pizzas, verrines et beignets', 4: 'Assiettes de tapas et salades', 5: 'Salade de poulet croustillant à la sauce', 6: 'Salade césar dans un bol bleu', 8: 'Buffet de petits sandwiches et mignardises', 9: 'Verrines de crème au chocolat', 10: 'Cocktails et bières sur un plateau', 11: 'Beignets au sucre glace', 12: 'Plat grillé aux herbes fraîches', 13: 'Plat de moules et fruits de mer dans un bol bleu', 14: 'Cocktails trinqués', 15: 'Trinquer avec cocktails et bière', 16: 'Gaufres garnies', 17: 'Buffet de viennoiseries et sandwiches', 19: 'Cocktail aux agrumes', 20: 'Cocktail à l\'orange et au romarin', 21: 'Pièces de viande panées aux graines de sésame', 22: 'Buffet de viennoiseries', 23: 'Croissants et chaussons', 24: 'Cocktail dans un verre tiki', 26: 'Plat gratiné à la poêle', 27: 'Faux-filet, frites et salade', 28: 'Viande grillée et salade', 29: 'Cocktail avec une paille'}
imgs = ''.join(f'<img src="assets/img/photo-{k:02d}.jpg" alt="{a}" loading="lazy" width="414" height="414">' for k, a in alts.items())
page('galerie.html', 'Galerie, La Terrasse de Bourbon', 'Photos des plats, cocktails et de l\'ambiance de La Terrasse de Bourbon.', f'''
<div class="wrap"><div class="page-head"><h1>Galerie</h1></div><div class="gal">{imgs}</div></div>''')

page('contact.html', 'Contact, La Terrasse de Bourbon', 'Réserver et venir à La Terrasse de Bourbon, 7 rue de l\'Amiral Lacaze à Saint-Denis.', f'''
<div class="contact"><div class="wrap"><div class="page-head"><h1>Contact</h1><p>Réservation par téléphone.</p></div>
<div class="cta-row"><a class="btn" href="{TEL}">Réserver</a><a class="btn btn-line" href="{MAP}" rel="noopener">Itinéraire</a></div>
<div class="info-grid" style="margin-top:var(--space-xl)"><div><h3>Horaires</h3><p>{HOURS}</p></div><div><h3>Adresse</h3><p>7 rue de l'Amiral Lacaze<br>97400 Saint-Denis</p></div><div><h3>Téléphone et réseaux</h3><p><a class="tlink" href="{TEL}">{TELTXT}</a><br><a class="tlink" href="{FB}" rel="noopener">Facebook</a></p></div></div></div></div>''')
