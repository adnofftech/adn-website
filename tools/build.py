#!/usr/bin/env python3
"""Génère les pages statiques du site Bouillon Kerval. Usage : python3 tools/build.py (depuis la racine du dépôt)."""
import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

def ic(n):
    return open(f'assets/icons/{n}.svg').read().replace('<svg ', '<svg class="icon" aria-hidden="true" focusable="false" ', 1)

TEL = 'tel:+262263044036'
TELTXT = '0263 04 40 36'
MAP = 'https://www.google.com/maps/search/?api=1&query=41+rue+Georges+Guynemer+97438+Sainte-Marie'
FB = 'https://www.facebook.com/bouillonkerval/'
IG = 'https://www.instagram.com/bouillonkerval/'
NAV = [('index.html', 'Accueil'), ('la-carte.html', 'La carte'), ('notre-histoire.html', 'Notre histoire'), ('galerie.html', 'Galerie'), ('contact.html', 'Contact')]

def page(fn, title, desc, body):
    items = ''.join(f'<li><a href="{h}"{" aria-current=\"page\"" if h == fn else ""}>{t}</a></li>' for h, t in NAV)
    open(fn, 'w').write(f'''<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title><meta name="description" content="{desc}">
<link rel="preload" href="assets/fonts/archivo-latin-standard-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/style.css"></head><body>
<header class="top"><div class="wrap"><a class="brand" href="index.html" aria-label="Bouillon Kerval, accueil"><img src="assets/img/logo-red.png" alt="Bouillon Kerval Réunion" width="99" height="42"></a>
<nav id="nav" aria-label="Navigation principale"><ul>{items}</ul><a class="btn m-cta" href="{TEL}">Réserver</a></nav>
<a class="btn" href="{TEL}">Réserver</a>
<button class="burger" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="nav">{ic('list')}</button></div></header>
<main>{body}</main>
<footer><div class="wrap"><div class="foot-band"><div><img src="assets/img/logo-red.png" alt="Bouillon Kerval Réunion" width="128" height="54"><p>Le bouillon parisien rencontre les saveurs réunionnaises.</p></div>
<div class="foot-links"><a href="{TEL}">{ic('phone')}{TELTXT}</a><a href="{MAP}" rel="noopener">{ic('map-pin')}41 rue Georges Guynemer, Sainte-Marie</a><span style="display:inline-flex;gap:.5rem;align-items:center;font-size:1.1rem">{ic('clock')}Tous les jours de 8h à 22h30</span>
<a href="{IG}" rel="noopener">{ic('instagram-logo')}Instagram</a><a href="{FB}" rel="noopener">{ic('facebook-logo')}Facebook</a></div></div>
<p class="legal">Maquette de refonte, projet non officiel. Prix TTC, service compris. Contenus à valider avec le restaurant.</p></div>
<img class="foot-mount" src="assets/img/mountain-red.png" alt="" loading="lazy"></footer>
<script src="assets/main.js"></script></body></html>''')

# ---------- Accueil ----------
page('index.html', 'Bouillon Kerval, restaurant à Sainte-Marie, La Réunion', 'Le bouillon parisien rencontre les saveurs réunionnaises. 41 rue Georges Guynemer, Sainte-Marie, ouvert tous les jours de 8h à 22h30.', f'''
<div class="hero on-red"><img class="mount" src="assets/img/mountain-light.png" alt="">
<div class="wrap"><div class="rise"><h1>Le bouillon parisien rencontre les saveurs réunionnaises.</h1>
<p>Une brasserie à Sainte-Marie, ouverte tous les jours de 8h à 22h30.</p>
<div class="cta-row"><a class="btn" href="{TEL}">Réserver</a><a class="btn btn-ghost" href="la-carte.html">Voir la carte</a></div></div>
<div class="hero-photos rise"><img src="assets/img/photo-35.jpg" alt="Plat mijoté et frites vu du dessus" width="414" height="414"><img src="assets/img/photo-09.jpg" alt="Gratins en cocotte rouge avec salade" width="414" height="414"></div></div></div>
<section><div class="wrap"><div class="sec-head reveal"><h2>À la carte</h2><p>Des plats de brasserie et des classiques de La Réunion, à prix doux.</p></div>
<div class="bento">
<article class="tile t1 reveal"><h3>Plat du jour</h3><p class="price">13,90 €</p><p>Du lundi au vendredi midi, hors jours fériés.</p></article>
<article class="tile t2 reveal"><img src="assets/img/photo-31.jpg" alt="Tartare de bœuf et verre de vin rouge" loading="lazy"><h3>Tartare de bœuf</h3><p class="price">16,90 €</p></article>
<article class="tile t3 reveal"><img src="assets/img/photo-28.jpg" alt="Dessert à la mangue" loading="lazy"><h3>Chou à la mangue</h3><p class="price">7,00 €</p></article>
<article class="tile t4 reveal"><div><h3>Rougail saucisse</h3><p>Généreux, savoureux, servi à toute heure pour toutes les faims.</p></div><p class="price">12,90 €</p></article></div>
<p class="more reveal"><a class="btn btn-ghost" href="la-carte.html">Toute la carte</a></p></div></section>
<section class="story"><div class="wrap"><img class="reveal" src="assets/img/photo-36.jpg" alt="Vapeur s'élevant d'une marmite, en noir et blanc" loading="lazy">
<div class="reveal"><h2>Le Kerval, c'est là-haut.</h2><p>À 1 850 mètres d'altitude, au cœur de Mafate, le Plateau du Kerval se niche au pied du Gros Morne. Notre nom raconte La Réunion, ses paysages et ses racines.</p><a class="btn btn-ghost" href="notre-histoire.html">Notre histoire</a></div></div></section>
<section class="reviews"><div class="wrap"><div class="reveal"><p class="score">4,4<small>/5</small></p><p class="src">Note Google sur 267 avis. Avis non vérifiés.</p></div>
<div class="quotes reveal"><figure><blockquote>Super moment au bouillon kerval, très bon rapport qualité prix, super accueil, service rapide et efficace. Je conseille fortement.</blockquote><cite>Marie Judith Martial, Google</cite></figure>
<div class="small"><figure><blockquote>Très bon rapport qualité prix, personnel très sympathique et à votre écoute.</blockquote><cite>Nara Shaft, Facebook</cite></figure><figure><blockquote>Accueil et service au top</blockquote><cite>Anquibou Jean Patrick, Facebook</cite></figure></div></div></div></section>
<section class="infos"><div class="wrap"><div class="reveal"><h2>Venir nous voir</h2><p style="margin:1rem 0 1.5rem">Dans la zone aéroportuaire de Sainte-Marie, à proximité de l'aéroport.</p><a class="btn btn-ghost" href="{MAP}" rel="noopener">Itinéraire</a></div>
<dl class="reveal"><div><dt>{ic('map-pin')}Adresse</dt><dd>41 rue Georges Guynemer, 97438 Sainte-Marie</dd></div>
<div><dt>{ic('clock')}Horaires</dt><dd>Tous les jours, de 8h à 22h30.</dd></div>
<div><dt>{ic('phone')}Réservation</dt><dd><a class="link" href="{TEL}">{TELTXT}</a></dd></div></dl></div></section>
<section class="final on-red"><img class="mount" src="assets/img/mountain-light.png" alt="" loading="lazy"><div class="wrap"><div><h2>Le goût péi, le vrai.</h2><p class="num">{TELTXT}</p></div><a class="btn" href="{TEL}">Réserver</a></div></section>''')

# ---------- Carte (transcription de la carte fournie) ----------
def items(rows):
    out = ''
    for r in rows:
        name, price = r[0], r[1]
        desc = f'<span class="desc">{r[2]}</span>' if len(r) > 2 else ''
        out += f'<li><span>{name}{desc}</span><span class="d"></span><span class="p">{price}</span></li>'
    return f'<ul>{out}</ul>'

def sec(title, rows, extra=''):
    return f'<section><h2>{title}</h2>{items(rows)}{extra}</section>'

carte = ''.join([
    sec('Entrées', [('Œufs durs mayonnaise', '3,90 €'), ('Escargots x6', '7,50 €'), ('Chouchou vinaigrette', '5,90 €'), ('Boudin noir pimenté, achards', '4,80 €'), ('Fromage de tête', '6,30 €'), ('Terrine de campagne', '5,90 €'), ('Salade de chou coco frais', '6,90 €'), ('Soupe à l\'oignon', '5,90 €'), ('Assiette créole', '9,70 €')]),
    sec('Les plats de La Réunion', [('Rougail saucisse (porc)', '12,90 €'), ('Civet zourite', '16,80 €'), ('Rougail morue, papaye verte', '15,90 €'), ('Ti\'jak boucané volaille', '15,90 €')]),
    '<section class="box"><h2>Plat du jour</h2><p class="big">13,90 €</p><p>Du lundi au vendredi midi, hors jours fériés.</p></section>',
    sec('Les pâtes', [('Linguines du jour', '13,90 €')]),
    sec('Les plats', [('Espadon frais grillé, sauce au choix', '16,90 €'), ('Tartare de thon, frites et salade', '16,90 €'), ('Tartare de bœuf, frites et salade', '16,90 €'), ('Andouillette de Troyes, sauce moutarde à l\'ancienne', '17,90 €'), ('Paupiette de volaille façon normande', '14,90 €'), ('Hamburger du Bouillon (bœuf ou poulet)', '16,90 €'), ('Demi coquelet rôti, jus corsé, frites', '13,70 €'), ('Bœuf bourguignon', '16,90 €')]),
    sec('Les plats coup de cœur', [('Filet de kangourou 250 g', '22,90 €'), ('Filet de saumon grillé 200 g', '23,90 €'), ('Magret de canard 300 g', '29,90 €'), ('Bavette grillée 250 g', '28,00 €'), ('Assiette carnivore 400 g', '36,00 €', 'Magret, bavette, kangourou, 2 sauces, frites, salade')], '<p class="note">Avec 2 accompagnements et 1 sauce au choix.</p>'),
    sec('Les sauces', [('Roquefort', '2,70 €'), ('Combava', '2,70 €'), ('Moutarde à l\'ancienne', '2,70 €'), ('Poivre vert', '2,70 €'), ('Beurre maître d\'hôtel', '2,70 €'), ('Sauce au miel', '2,70 €')]),
    sec('Salades et assiettes', [('Tataki de thon, frites et salade', '14,90 €'), ('La Kerval', '15,90 €', 'Salade, tomate, champignons frais, poulet crispy, œuf dur, oignons frits, olives noires'), ('Océane', '15,90 €', 'Tartare de thon, champignons, tomate, pickles d\'oignons, saumon snacké, concombre'), ('Burrata, tomate à l\'ancienne', '13,90 €'), ('Camembert rôti, salade', '12,50 €'), ('Croque-monsieur, frites et salade', '13,90 €'), ('Assiette de fromages', '13,90 €'), ('Assiette de charcuteries', '12,90 €'), ('Omelette jambon-fromage, frites et salade', '8,90 €')]),
    sec('Les desserts', [('Chou à la mangue', '7,00 €'), ('Crème brûlée', '7,10 €'), ('Mousse au chocolat', '6,20 €'), ('Brioche perdue, boule de glace', '6,10 €'), ('Café gourmand', '10,90 €'), ('Profiterole glacée', '8,50 €'), ('Fondant au chocolat', '6,90 €'), ('Île flottante', '6,20 €'), ('Salade de fruits frais', '5,50 €'), ('Dessert du jour', '7,50 €')]),
    sec('Les glaces', [('1 boule', '3,00 €'), ('2 boules', '5,20 €'), ('3 boules', '8,10 €'), ('Chocolat liégeois', '6,90 €'), ('Café liégeois', '6,90 €'), ('Colonel', '7,80 €'), ('Supplément crème fouettée', '2,00 €')]),
    sec('Les accompagnements', [('Pommes de terre sautées', '3,00 €'), ('Riz', '1,90 €'), ('Légumes du jour', '3,00 €'), ('Salade', '2,10 €'), ('Linguines', '3,00 €'), ('Frites fraîches', '3,00 €'), ('Grains', '1,30 €')]),
    '<section><h2>Menu enfant</h2><ul><li><span>Un plat, une boisson, une glace</span><span class="d"></span><span class="p">8,90 €</span></li></ul><p class="note">Citronnade, thé glacé ou sirop. Steak haché, poulet crispy ou espadon. Boule de glace.</p></section>',
    '<section><h2>Boissons</h2><p class="note" style="margin-top:0">Citronnade maison, cocktails, vins : demandez la carte au restaurant.</p></section>',
])
page('la-carte.html', 'La carte, Bouillon Kerval', 'La carte complète du Bouillon Kerval à Sainte-Marie : entrées, plats de La Réunion, viandes et poissons, salades, desserts.', f'''
<div class="wrap"><div class="page-head"><h1>La carte</h1><p>Prix TTC, service compris. Origine des viandes : UE, France, Australie.</p></div>
<div class="menu">{carte}</div></div>''')

# ---------- Notre histoire ----------
page('notre-histoire.html', 'Notre histoire, Bouillon Kerval', 'D\'où vient le nom Bouillon Kerval : le Plateau du Kerval, au cœur de Mafate.', f'''
<div class="wrap"><div class="page-head"><h1>D'où vient le nom Bouillon Kerval ?</h1></div></div>
<section style="padding-top:var(--space-md)"><div class="wrap" style="display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,.8fr);gap:var(--space-xl);align-items:start"><div>
<p>Direction le cœur de Mafate, à 1 850 mètres d'altitude, pour découvrir le Plateau du Kerval, un petit coin exceptionnel de notre île, niché au pied du Gros Morne.</p><p style="margin-top:1.2rem">Une mare, une petite cascade, des paysages à couper le souffle… et surtout un nom chargé de notre territoire et de notre identité réunionnaise.</p>
<p style="margin-top:1.2rem">Chez Bouillon Kerval, notre nom n'a pas été choisi au hasard : il raconte La Réunion, ses paysages, ses racines et ce patrimoine que nous aimons tant.</p>
<p style="margin-top:1.2rem;font-size:var(--text-lg);color:var(--color-red);font-weight:600">Le Kerval, c'est là-haut. Bouillon Kerval, c'est un petit bout de tout ça dans votre assiette.</p></div>
<img src="assets/img/photo-36.jpg" alt="Vapeur s'élevant d'une marmite, en noir et blanc" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:var(--radius)"></div></section>
<section class="story"><div class="wrap" style="grid-template-columns:minmax(0,1fr)"><div><h2>Le goût péi, le vrai</h2><p>Tous nos pains burgers, les célèbres buns, sont faits maison par un artisan local. Moelleux, savoureux, préparés avec soin : la qualité se retrouve dans les moindres détails, jusqu'au pain.</p><a class="btn btn-ghost" href="la-carte.html">Voir la carte</a></div></div></section>''')

# ---------- Galerie ----------
alts = {1: 'Filet de poisson en croûte sur un plateau noir', 4: 'Œufs mayonnaise en petites assiettes', 6: 'Sauce versée sur un plat en cocotte', 9: 'Gratins en cocotte rouge avec salade', 10: 'La salle du restaurant', 16: 'Plat servi avec une bière', 22: 'Bouteilles de rosé Kerval', 23: 'Escargots en assiette', 25: 'Plat de viande et petit bol', 27: 'Plat mijoté et frites dans une assiette au liseré rouge', 28: 'Dessert à la mangue et à la vanille', 29: 'Plat et frites sur une assiette au liseré rouge', 30: 'Table de plats à partager', 31: 'Tartare de bœuf et verre de vin rouge', 32: 'Coupes de champagne et cierges magiques', 35: 'Plat mijoté et frites vu du dessus', 36: 'Vapeur s\'élevant d\'une marmite'}
imgs = ''.join(f'<img src="assets/img/photo-{k:02d}.jpg" alt="{a}" loading="lazy" width="414" height="414">' for k, a in alts.items())
page('galerie.html', 'Galerie, Bouillon Kerval', 'Photos des plats et de l\'ambiance du Bouillon Kerval.', f'''
<div class="wrap"><div class="page-head"><h1>Galerie</h1></div><div class="gal">{imgs}</div></div>''')

# ---------- Contact ----------
page('contact.html', 'Contact, Bouillon Kerval', 'Réserver et venir au Bouillon Kerval, 41 rue Georges Guynemer à Sainte-Marie.', f'''
<section class="infos" style="background:none"><div class="wrap"><div><h1 style="font-size:clamp(2.3rem,5.5vw,4rem)">Contact</h1><p style="margin:1rem 0 1.5rem">Réservation par téléphone.</p><div class="cta-row"><a class="btn" href="{TEL}">Réserver</a><a class="btn btn-ghost" href="{MAP}" rel="noopener">Itinéraire</a></div></div>
<dl><div><dt>{ic('phone')}Téléphone</dt><dd><a class="link" href="{TEL}">{TELTXT}</a></dd></div><div><dt>{ic('map-pin')}Adresse</dt><dd>41 rue Georges Guynemer, 97438 Sainte-Marie<br>Zone aéroportuaire</dd></div>
<div><dt>{ic('clock')}Horaires</dt><dd>Tous les jours, de 8h à 22h30.</dd></div>
<div><dt>{ic('instagram-logo')}Réseaux</dt><dd><a class="link" href="{IG}" rel="noopener">@bouillonkerval</a> et <a class="link" href="{FB}" rel="noopener">Facebook</a></dd></div></dl></div></section>''')
