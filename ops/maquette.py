#!/usr/bin/env python3
"""Génère une maquette de site 100 % locale. Usage : python3 ops/maquette.py brief.json
Sortie : ops/data/maquettes/<slug>/index.html (ignoré par Git, à ne jamais publier ni héberger).
brief.json : {"nom","metier","ville","tel","accroche","couleur":"#hex","services":[{"nom","prix"}],"photos":["chemin/local.jpg"]}
Tout champ absent reste neutre : aucune information inventée, les textes d'exemple sont signalés."""
import html, json, os, re, shutil, sys, unicodedata
HERE = os.path.dirname(os.path.abspath(__file__))
E = lambda s: html.escape(str(s), quote=True)

def slug(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-') or 'maquette'

def valide_couleur(c): return c if re.fullmatch(r'#[0-9a-fA-F]{6}', c or '') else '#8a5a44'

def rendu(b, photos):
    tel = re.sub(r'[^0-9+]', '', b.get('tel', ''))
    svc = ''.join(f'<li><span>{E(s["nom"])}</span><b>{E(s.get("prix", ""))}</b></li>' for s in b.get('services', []))
    cats = ''.join(f'<li><span>{E(c["nom"])}</span><i>{E(c.get("detail", ""))}</i></li>' for c in b.get('categories', []))
    infos = ''.join(f'<p>{x}</p>' for x in [E(b['adresse']) if b.get('adresse') else '', f'{E(b["avis"])}' if b.get('avis') else '', f'<a href="{E(b["instagram"])}" rel="noopener">Instagram</a>' if str(b.get('instagram', '')).startswith('https://') else ''] if x)
    imgs = ''.join(f'<img src="{E(p)}" alt="Photo de {E(b["nom"])}" loading="lazy">' for p in (photos[1:] or photos))
    accroche = b.get('accroche') or f'{b["metier"]} à {b["ville"]}'
    ig = b.get('instagram', '')
    cta = f'<a class="btn" href="tel:{E(tel)}">Appeler</a>' if tel else (f'<a class="btn" href="{E(ig)}" rel="noopener">Voir sur Instagram</a>' if str(ig).startswith('https://') else '')
    return f'''<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>{E(b["nom"])}, {E(b["metier"])} à {E(b["ville"])}</title>
<style>:root{{--c:{valide_couleur(b.get("couleur"))};--bg:#fffaf6;--tx:#2b2220}}
@media(prefers-color-scheme:dark){{:root{{--bg:#1d1715;--tx:#f4e9e2}}}}
*{{box-sizing:border-box}}body{{margin:0;font:1.05rem/1.6 system-ui,sans-serif;background:var(--bg);color:var(--tx)}}
.wrap{{max-width:60rem;margin:auto;padding:0 1rem}}header{{padding:3rem 0 2rem}}h1{{font-size:clamp(2rem,6vw,3.2rem);line-height:1.1;margin:.2em 0}}
.btn{{display:inline-block;background:var(--c);color:#fff;padding:.8rem 1.4rem;border-radius:99px;text-decoration:none;font-weight:600}}
ul{{list-style:none;padding:0}}li{{display:flex;justify-content:space-between;gap:1rem;padding:.7rem 0;border-bottom:1px solid #8884}}
.g{{display:grid;grid-template-columns:repeat(auto-fit,minmax(14rem,1fr));gap:.8rem}}.g img{{width:100%;aspect-ratio:1;object-fit:cover;border-radius:.6rem}}
i{{opacity:.7;font-style:normal;font-size:.9rem}}.hero{{display:grid;grid-template-columns:1.1fr .9fr;gap:2rem;align-items:center}}@media(max-width:640px){{.hero{{grid-template-columns:1fr}}}}
h2{{margin-top:2.5rem;padding-bottom:.4rem;border-bottom:3px solid var(--c);display:inline-block}}.hero p:first-child{{color:var(--c);font-weight:600;letter-spacing:.06em;text-transform:uppercase;font-size:.85rem}}.hero>*{{min-width:0}}body{{overflow-wrap:anywhere}}a{{color:var(--c)}}img.ph{{width:100%;border-radius:1rem;aspect-ratio:4/3;object-fit:cover}}footer{{padding:2rem 0;font-size:.85rem;opacity:.75}}</style></head><body><div class="wrap">
<header class="hero"><div><p>{E(b["metier"])} · {E(b["ville"])}</p><h1>{E(b["nom"])}</h1><p>{E(accroche)}</p>{cta}</div>{f'<img class="ph" src="{E(photos[0])}" alt="Photo de {E(b["nom"])}">' if photos else ''}</header>
{f'<section><h2>Prestations</h2><ul>{svc}</ul></section>' if svc else ''}
{f'<section><h2>Nos univers</h2><ul class="cat">{cats}</ul></section>' if cats else ''}
{f'<section><h2>Réalisations</h2><div class="g">{imgs}</div></section>' if imgs else ''}
{f'<section><h2>Infos pratiques</h2>{infos}</section>' if infos else ''}
<footer>Maquette de démonstration kaptur, non publiée. Contenus d'exemple à valider avec le commerçant.</footer></div></body></html>'''

def generer(b, out_root=None):
    for k in ('nom', 'metier', 'ville'):
        if not b.get(k): raise ValueError(f'champ obligatoire manquant : {k}')
    d = os.path.join(out_root or os.path.join(HERE, 'data', 'maquettes'), slug(b['nom']))
    os.makedirs(d, exist_ok=True); photos = []
    for p in b.get('photos', []):
        if os.path.isfile(p):
            shutil.copy(p, os.path.join(d, os.path.basename(p))); photos.append(os.path.basename(p))
    with open(os.path.join(d, 'index.html'), 'w', encoding='utf8') as f: f.write(rendu(b, photos))
    return os.path.join(d, 'index.html')

if __name__ == '__main__':
    if len(sys.argv) != 2: sys.exit(__doc__)
    try: print(generer(json.load(open(sys.argv[1], encoding='utf8'))))
    except (ValueError, OSError, json.JSONDecodeError) as e: sys.exit(f'Erreur : {e}')
