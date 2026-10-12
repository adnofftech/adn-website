#!/usr/bin/env python3
"""Génère les pages statiques de Ma Pause Beauté. Usage : python3 tools/build.py (depuis la racine du dépôt).
Les tarifs se modifient dans tarifs.json, puis on relance ce script."""
import os, json
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

def ic(n):
    return open(f'assets/icons/{n}.svg').read().replace('<svg ', '<svg class="icon" aria-hidden="true" focusable="false" ', 1)

NB = ' '
TEL, TELTXT = 'tel:+262693873982', f'06{NB}93{NB}87{NB}39{NB}82'
IG = 'https://www.instagram.com/_mapausebeaute_/'
NAV = [('index.html', 'Accueil'), ('prestations.html', 'Prestations'), ('galerie.html', 'Galerie'), ('contact.html', 'Contact')]
CATS = json.load(open('tarifs.json', encoding='utf8'))['categories']
CAT = {c['id']: c for c in CATS}
fmt = lambda s: s.replace(' ', NB)

def wordmark(): return 'Ma Pause <span>Beauté</span>'

def page(fn, title, desc, body):
    items = ''.join(f'<li><a href="{h}"{" aria-current=\"page\"" if h == fn else ""}>{t}</a></li>' for h, t in NAV)
    open(fn, 'w').write(f'''<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title><meta name="description" content="{desc}">
<link rel="preload" href="assets/fonts/newsreader-latin-standard-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/style.css"></head><body>
<header class="top"><div class="wrap"><a class="brand" href="index.html" aria-label="Ma Pause Beauté, accueil"><img src="assets/img/logo.jpg" alt="" width="50" height="50"><b>{wordmark()}</b></a>
<nav id="nav" aria-label="Navigation principale"><ul>{items}</ul><a class="btn m-cta" href="{TEL}">Prendre rendez-vous</a></nav>
<a class="btn" href="{TEL}">Prendre rendez-vous</a>
<button class="burger" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="nav">{ic('list')}</button></div></header>
<main>{body}</main>
<footer><div class="wrap"><div class="foot-band"><div><div class="brand"><img src="assets/img/logo.jpg" alt="" width="50" height="50"><b>{wordmark()}</b></div><p>Je révèle la beauté qui est déjà en vous.</p></div>
<div class="foot-links"><a href="{TEL}">{ic('phone')}{TELTXT}</a><span style="display:inline-flex;gap:.5rem;align-items:center;padding:.2rem 0">{ic('map-pin')}Moufia, Sainte-Clotilde</span><a href="{IG}" rel="noopener">{ic('instagram-logo')}Instagram</a></div></div>
<p class="legal">Maquette de refonte, projet non officiel. Sur rendez-vous. Contenus à valider avec le salon.</p></div></footer>
<script src="assets/main.js"></script></body></html>''')

rows = ''.join(f'<li><a href="prestations.html#{c["id"]}"><b>{c["titre"]}</b><span>{c["sous"]}</span><i>dès{NB}{c["des"]}{NB}€</i></a></li>' for c in [CAT[k] for k in ['powder-brows', 'candy-lips', 'cils', 'onglerie', 'spa']])

page('index.html', 'Ma Pause Beauté, powder brows, cils et onglerie à Sainte-Clotilde', 'Powder brows, candy lips, extensions de cils, onglerie et head spa à Moufia, Sainte-Clotilde, La Réunion. Sur rendez-vous.', f'''
<div class="hero"><div class="wrap"><div class="rise"><h1>La beauté qui est <em>déjà</em> en vous.</h1>
<p>Powder brows, candy lips, extensions de cils, onglerie et head spa à Moufia, Sainte-Clotilde.</p>
<div class="cta-row"><a class="btn" href="{TEL}">Prendre rendez-vous</a><a class="btn btn-line" href="prestations.html">Voir les tarifs</a></div></div>
<div class="arch rise"><span class="ring"></span><img class="main" src="assets/img/photo-09.jpg" alt="Manucure rouge en amande avec strass" width="640" height="640"><img class="dot" src="assets/img/photo-14.jpg" alt="Pédicure bleu pastel, pieds en sandales" width="360" height="640"></div></div></div>
<section><div class="wrap"><h2 class="sec-head reveal">Cinq façons de prendre soin de vous.</h2><ul class="rows reveal">{rows}</ul></div></section>
<section class="time"><div class="wrap"><div class="reveal"><blockquote>Prévoyez du temps pour votre beauté.</blockquote><p>Comptez 2h minimum pour les sourcils et 3h minimum pour les lèvres. Chaque minute compte pour un résultat précis, soigné et parfaitement réalisé.</p></div>
<figure class="reveal"><img src="assets/img/photo-06.jpg" alt="Fauteuils en velours bleu du salon" loading="lazy"></figure></div></section>
<section><div class="wrap"><h2 class="sec-head reveal">Quelques réalisations.</h2>
<div class="strip reveal"><img src="assets/img/photo-02.jpg" alt="Manucure french sur ongles roses" loading="lazy"><img src="assets/img/photo-13.jpg" alt="Manucure rose avec motifs" loading="lazy"><img src="assets/img/photo-15.jpg" alt="Manucure french avec fleur" loading="lazy"><img src="assets/img/photo-14.jpg" alt="Pédicure bleu pastel" loading="lazy"></div>
<p class="reveal"><a class="tlink" href="galerie.html">Voir toute la galerie</a></p></div></section>
<section class="infos inv"><div class="wrap"><h2 class="reveal">Sur rendez-vous.</h2>
<div class="info-grid reveal"><div><h3>Où</h3><p>Moufia, Sainte-Clotilde<br>97490, La Réunion</p></div><div><h3>Réservation</h3><p><a class="tlink" href="{TEL}">{TELTXT}</a></p></div><div><h3>Instagram</h3><p><a class="tlink" href="{IG}" rel="noopener">@_mapausebeaute_</a></p></div></div>
<div class="cta-row reveal"><a class="btn" href="{TEL}">Prendre rendez-vous</a></div></div></section>''')

def cat_html(c):
    lis = ''.join(f'<li><span>{i["nom"]}</span><span class="d"></span><span class="p">{fmt(i["prix"])}</span></li>' for i in c['items'])
    notes = ''.join(f'<p class="note">{n}</p>' for n in c['notes'])
    return f'<section class="cat" id="{c["id"]}" style="padding:0"><h2>{c["titre"]}</h2><ul>{lis}</ul>{notes}</section>'

page('prestations.html', 'Prestations et tarifs, Ma Pause Beauté', 'Tarifs de Ma Pause Beauté à Sainte-Clotilde : powder brows, candy lips, extensions de cils, onglerie, head et foot spa.', f'''
<div class="wrap"><div class="page-head"><h1>Prestations et tarifs</h1><p>Sur rendez-vous, au <a class="tlink" href="{TEL}">{TELTXT}</a>.</p></div>
<div class="tarifs"><div class="cats">{''.join(cat_html(c) for c in CATS)}<p><a class="btn" href="{TEL}">Prendre rendez-vous</a></p></div>
<aside><img src="assets/img/photo-09.jpg" alt="Manucure rouge en amande avec strass" loading="lazy"></aside></div></div>''')

alts = {2: 'Manucure french sur ongles roses', 3: 'Gros plan sur des sourcils après powder brows', 9: 'Manucure rouge en amande avec strass', 12: 'Gros plan sur des sourcils', 13: 'Manucure rose avec motifs', 14: 'Pédicure bleu pastel, pieds en sandales', 15: 'Manucure french avec fleur'}
imgs = ''.join(f'<img src="assets/img/photo-{k:02d}.jpg" alt="{a}" loading="lazy">' for k, a in alts.items())
page('galerie.html', 'Galerie, Ma Pause Beauté', 'Réalisations de Ma Pause Beauté : onglerie, sourcils et ambiance du salon à Sainte-Clotilde.', f'''
<div class="wrap"><div class="page-head"><h1>Galerie</h1></div><div class="gal">{imgs}</div></div>''')

page('contact.html', 'Contact, Ma Pause Beauté', 'Prendre rendez-vous chez Ma Pause Beauté, Moufia, Sainte-Clotilde.', f'''
<div class="contact"><div class="wrap"><div class="page-head"><h1>Contact</h1><p>Sur rendez-vous.</p></div>
<div class="cta-row"><a class="btn" href="{TEL}">Prendre rendez-vous</a><a class="btn btn-line" href="{IG}" rel="noopener">Voir Instagram</a></div>
<div class="info-grid" style="margin-top:var(--space-xl)"><div><h3>Où</h3><p>Moufia, Sainte-Clotilde<br>97490, La Réunion</p></div><div><h3>Réservation</h3><p><a class="tlink" href="{TEL}">{TELTXT}</a></p></div><div><h3>Instagram</h3><p><a class="tlink" href="{IG}" rel="noopener">@_mapausebeaute_</a></p></div></div></div></div>''')
