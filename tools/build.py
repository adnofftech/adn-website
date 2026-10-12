#!/usr/bin/env python3
"""Génère les pages statiques de La Terrasse de Bourbon. Usage : python3 tools/build.py (depuis la racine du dépôt).
Les suggestions du moment se modifient dans suggestions.json, puis on relance ce script."""
import os, json
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

def ic(n):
    return open(f'assets/icons/{n}.svg').read().replace('<svg ', '<svg class="icon" aria-hidden="true" focusable="false" ', 1)

TEL, TELTXT = 'tel:+262692253538', '0692\u00a025\u00a035\u00a038'
MAP = 'https://www.google.com/maps/search/?api=1&query=7+rue+de+l%27Amiral+Lacaze+97400+Saint-Denis'
FB = 'https://www.facebook.com/laterrassedebourbon'
NAV = [('index.html', 'Accueil'), ('suggestions.html', 'Suggestions'), ('galerie.html', 'Galerie'), ('contact.html', 'Contact')]
SUG = json.load(open('suggestions.json', encoding='utf8'))
ITEMS = {i['nom']: i for s in SUG['sections'] for i in s['items']}
NB = ' '

def page(fn, title, desc, body):
    items = ''.join(f'<li><a href="{h}"{" aria-current=\"page\"" if h == fn else ""}>{t}</a></li>' for h, t in NAV)
    open(fn, 'w').write(f'''<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title><meta name="description" content="{desc}">
<link rel="preload" href="assets/fonts/bricolage-grotesque-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/style.css"></head><body>
<header class="top"><div class="wrap"><a class="brand" href="index.html" aria-label="La Terrasse de Bourbon, accueil"><img src="assets/img/logo.jpg" alt="" width="40" height="40">La Terrasse de Bourbon</a>
<nav id="nav" aria-label="Navigation principale"><ul>{items}</ul><a class="btn m-cta" href="{TEL}">Réserver</a></nav>
<a class="btn" href="{TEL}">Réserver</a>
<button class="burger" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="nav">{ic('list')}</button></div></header>
<main>{body}</main>
<footer><div class="wrap"><div class="foot-band"><div><img src="assets/img/logo.jpg" alt="La Terrasse de Bourbon" width="72" height="72"><p>Un moment convivial au cœur de Saint-Denis.</p></div>
<div class="foot-links"><a href="{TEL}">{ic('phone')}{TELTXT}</a><a href="{MAP}" rel="noopener">{ic('map-pin')}7 rue de l'Amiral Lacaze, Saint-Denis</a><span>{ic('clock')}Du déjeuner au soir, 7 jours sur 7</span>
<a href="{FB}" rel="noopener">{ic('facebook-logo')}Facebook</a></div></div>
<p class="legal">Maquette de refonte, projet non officiel. Prix TTC. Contenus à valider avec le restaurant.</p></div></footer>
<script src="assets/main.js"></script></body></html>''')

def it(name):
    i = ITEMS[name]
    return i, i['prix'].replace(' ', NB)

fil, fil_p = it('Faux-filet 300 g (halal)')
ris, ris_p = it('Risotto « mer » de fregola sarda')
zou, zou_p = it('Zourite en deux déclinaisons')
bur, bur_p = it('Burger de la semaine')
sal, sal_p = it('Salade fraîcheur')

page('index.html', 'La Terrasse de Bourbon, restaurant et bar à cocktails à Saint-Denis', 'Restaurant et bar à cocktails au cœur de Saint-Denis, La Réunion : produits frais, suggestions du moment, soirées. 7 rue de l\'Amiral Lacaze.', f'''
<div class="hero"><div class="wrap"><div class="rise"><h1>Un moment convivial au cœur de Saint-Denis.</h1>
<p>Produits frais, cocktails et soirées sous la grande charpente, du déjeuner au soir.</p>
<div class="cta-row"><a class="btn" href="{TEL}">Réserver</a><a class="btn btn-ghost" href="suggestions.html">Voir les suggestions</a></div></div>
<div class="hero-visual rise"><img class="sign" src="assets/img/logo.jpg" alt="Enseigne néon La Terrasse de Bourbon devant un mur végétal" width="480" height="480"><div class="col"><img src="assets/img/photo-28.jpg" alt="Viande grillée et salade" width="414" height="414"><img src="assets/img/photo-13.jpg" alt="Plat de moules et fruits de mer dans un bol bleu" width="414" height="414"></div></div></div></div>
<section><div class="wrap"><div class="sec-head reveal"><h2>Les suggestions du moment</h2><p>{SUG['note']}</p></div>
<div class="bento">
<article class="tile ph reveal"><img src="assets/img/photo-28.jpg" alt="" loading="lazy"><h3>Faux-filet 300{NB}g</h3><p>Halal, sauce foie gras.</p><p class="price">{fil_p}</p></article>
<article class="tile ph reveal"><img src="assets/img/photo-13.jpg" alt="" loading="lazy"><h3>Risotto « mer »</h3><p>Crémeux au combava, crevettes, moules, Saint-Jacques.</p><p class="price">{ris_p}</p></article>
<article class="tile t3 reveal"><h3>{zou['nom']}</h3><p>{zou['description']}</p><p class="price">{zou_p}</p></article>
<article class="tile t4 reveal"><h3>{bur['nom']}</h3><p>{bur['description']}</p><p class="price">{bur_p}</p></article>
<article class="tile t5 reveal"><h3>{sal['nom']}</h3><p>{sal['description']}</p><p class="price">{sal_p}</p></article></div>
<p class="more reveal"><a class="btn btn-ghost" href="suggestions.html">Toutes les suggestions</a></p></div></section>
<section class="night"><div class="wrap"><div class="reveal"><h2>Cocktails et soirées.</h2><p>Un bar à cocktails, des soirées à thème avec DJ, comme Bourbon Latino avec DJ Pepito, entrée libre. Les dates sont annoncées sur Facebook.</p><a class="btn btn-ghost" href="{FB}" rel="noopener">Suivre sur Facebook</a></div>
<div class="trio reveal"><img src="assets/img/photo-14.jpg" alt="Cocktails trinqués" loading="lazy"><img src="assets/img/photo-20.jpg" alt="Cocktail à l'orange et au romarin" loading="lazy"><img src="assets/img/photo-24.jpg" alt="Cocktail dans un verre tiki" loading="lazy"></div></div></section>
<section class="reviews"><div class="wrap"><div class="reveal"><p class="score">4,1<small>/5</small></p><p class="src">Note Google sur 518 avis. Avis non vérifiés.</p><p class="reco">86{NB}% de recommandations sur Facebook (213 avis).</p></div>
<div class="quotes reveal"><figure><blockquote>Nous avons passé un excellent moment. Les plats étaient délicieux, bien présentés et le service très agréable. Une équipe accueillante et sympathique.</blockquote><cite>Vanessa Nagre, Facebook</cite></figure>
<div class="small"><figure><blockquote>Un de nos restaurants préférés ! Toujours bien accueillis !</blockquote><cite>Manon Rochefeuille, Facebook</cite></figure><figure><blockquote>Le service est très agréable et professionnel, les plats sont délicieux et le menu enfant très copieux.</blockquote><cite>Alicia Hoarau, Google</cite></figure></div></div></div></section>
<section class="infos"><div class="wrap"><div class="reveal"><h2>Venir nous voir</h2><p style="margin:1rem 0 1.5rem;color:var(--color-ink-2)">Au centre de Saint-Denis, rue de l'Amiral Lacaze.</p><a class="btn btn-ghost" href="{MAP}" rel="noopener">Itinéraire</a></div>
<dl class="reveal"><div><dt>{ic('clock')}Horaires</dt><dd><b>Lundi au jeudi :</b> 12h à 14h30 et 17h à 23h<br><b>Vendredi et samedi :</b> 12h à 14h30 et 17h à minuit<br><b>Dimanche :</b> 12h à 14h30</dd></div>
<div><dt>{ic('map-pin')}Adresse</dt><dd>7 rue de l'Amiral Lacaze, 97400 Saint-Denis</dd></div>
<div><dt>{ic('phone')}Réservation</dt><dd><a class="link" href="{TEL}">{TELTXT}</a></dd></div></dl></div></section>
<section class="final"><div class="wrap"><h2>Une table vous attend.</h2><a class="btn" href="{TEL}">Réserver</a></div></section>''')

secs = ''
for s in SUG['sections']:
    lis = ''.join(f'<li><b>{i["nom"]}</b><span class="p">{i["prix"].replace(" ", NB)}</span><span class="d">{i["description"]}</span></li>' for i in s['items'])
    secs += f'<div><h2>{s["titre"]}</h2><ul>{lis}</ul></div>'
page('suggestions.html', 'Suggestions du moment, La Terrasse de Bourbon', 'Les suggestions du moment de La Terrasse de Bourbon à Saint-Denis : tapas, plats, burger de la semaine.', f'''
<div class="wrap"><div class="page-head"><h1>Suggestions du moment</h1><p>{SUG['note']}</p></div>
<div class="sug"><div class="lists">{secs}</div><img src="assets/img/photo-27.jpg" alt="Faux-filet, frites et salade" width="414" height="414"></div>
<p class="note" style="margin-bottom:var(--space-2xl)">Dessert du moment, boissons et cocktails : à découvrir sur place. <a class="link" href="{TEL}">Réserver au {TELTXT}</a></p></div>''')

alts = {1: 'Gâteau au chocolat en parts', 2: 'Buffet de pizzas, verrines et beignets', 4: 'Assiettes de tapas et salades', 5: 'Salade de poulet croustillant à la sauce', 6: 'Salade césar dans un bol bleu', 8: 'Buffet de petits sandwiches et mignardises', 9: 'Verrines de crème au chocolat', 10: 'Cocktails et bières sur un plateau', 11: 'Beignets au sucre glace', 12: 'Plat grillé aux herbes fraîches', 13: 'Plat de moules et fruits de mer dans un bol bleu', 14: 'Cocktails trinqués', 15: 'Trinquer avec cocktails et bière', 16: 'Gaufres garnies', 17: 'Buffet de viennoiseries et sandwiches', 19: 'Cocktail aux agrumes', 20: 'Cocktail à l\'orange et au romarin', 21: 'Pièces de viande panées aux graines de sésame', 22: 'Buffet de viennoiseries', 23: 'Croissants et chaussons', 24: 'Cocktail dans un verre tiki', 26: 'Plat gratiné à la poêle', 27: 'Faux-filet, frites et salade', 28: 'Viande grillée et salade', 29: 'Cocktail avec une paille'}
imgs = ''.join(f'<img src="assets/img/photo-{k:02d}.jpg" alt="{a}" loading="lazy" width="414" height="414">' for k, a in alts.items())
page('galerie.html', 'Galerie, La Terrasse de Bourbon', 'Photos des plats, cocktails et de l\'ambiance de La Terrasse de Bourbon.', f'''
<div class="wrap"><div class="page-head"><h1>Galerie</h1></div><div class="gal">{imgs}</div></div>''')

page('contact.html', 'Contact, La Terrasse de Bourbon', 'Réserver et venir à La Terrasse de Bourbon, 7 rue de l\'Amiral Lacaze à Saint-Denis.', f'''
<div class="contact"><div class="wrap"><div><h1 style="font-size:clamp(2.2rem,5vw,3.6rem)">Contact</h1><p style="margin:1rem 0 1.5rem;color:var(--color-ink-2)">Réservation par téléphone.</p><div class="cta-row"><a class="btn" href="{TEL}">Réserver</a><a class="btn btn-ghost" href="{MAP}" rel="noopener">Itinéraire</a></div></div>
<dl><div><dt>{ic('phone')}Téléphone</dt><dd><a class="link" href="{TEL}">{TELTXT}</a></dd></div><div><dt>{ic('map-pin')}Adresse</dt><dd>7 rue de l'Amiral Lacaze, 97400 Saint-Denis</dd></div>
<div><dt>{ic('clock')}Horaires</dt><dd><b>Lundi au jeudi :</b> 12h à 14h30 et 17h à 23h<br><b>Vendredi et samedi :</b> 12h à 14h30 et 17h à minuit<br><b>Dimanche :</b> 12h à 14h30</dd></div>
<div><dt>{ic('facebook-logo')}Réseaux</dt><dd><a class="link" href="{FB}" rel="noopener">Facebook</a></dd></div></dl></div></div>''')
