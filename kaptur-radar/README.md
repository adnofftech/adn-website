# KAPTUR Radar

Outil local pour trouver des entreprises réunionnaises, auditer leur site web avec de vrais constats, et préparer des messages de prospection personnalisés pour vendre les formules KAPTUR. Gratuit, sans dépendance : Python 3.10+ uniquement.

**Rien n'est envoyé automatiquement.** L'outil prépare, vous relisez et vous envoyez.

## Installation

```bash
cd kaptur-radar
python3 --version        # 3.10 ou plus récent
python3 -m unittest discover -s tests -t .    # 66 tests, doit finir par OK
```

Aucune installation de paquet n'est nécessaire.

## Démonstration (données fictives, hors ligne)

```bash
python3 -m radar demo        # charge 5 entreprises inventées
python3 -m radar serve       # puis ouvrir http://127.0.0.1:8765/
```

La base de démo est `data/radar.db`. Pour repartir de zéro : supprimez ce fichier.

## Utilisation réelle

```bash
python3 -m radar find restauration --postal 97400 --limit 20 --dry-run   # voir ce que l'annuaire public renvoie
python3 -m radar find restauration --postal 97400 --limit 20             # ajouter à la base
python3 -m radar edit 6 --website exemple.re --phone "0692 .. .. .."     # compléter à la main
python3 -m radar audit 6                                                  # audit du site (une seule requête)
python3 -m radar message 6                                                # WhatsApp, e-mail, script d'appel, relances
python3 -m radar status 6 contacté                                        # programme la relance à J+3
python3 -m radar list --due                                               # qui relancer aujourd'hui
python3 -m radar import mes_prospects.csv                                 # votre Google Sheet exporté en CSV
python3 -m radar export sauvegarde.csv
```

Secteurs pour `find` : restauration, hôtellerie, immobilier, BTP, commerce, beauté, santé.

## Ce que l'outil fait et ne fait pas

- **Source des entreprises** : annuaire public `recherche-entreprises.api.gouv.fr` (gratuit, sans clé). Les entrepreneurs individuels et les établissements non diffusibles sont exclus (leur nom est celui d'une personne).
- **Ce que l'annuaire ne donne pas** : site web, téléphone, e-mail, Instagram. Il faut les chercher à la main (voir `docs/PROSPECTION.md`).
- **Audit** : 15 points vérifiés dans le HTML de la page d'accueil (https, mobile, titre, description, contact, WhatsApp, réseaux, vidéo, fraîcheur, vitesse, etc.). Respecte `robots.txt`. Refuse les adresses locales et privées.
- **Limite** : l'audit lit le HTML tel que le serveur l'envoie. Un site entièrement construit par JavaScript côté navigateur peut paraître vide. Vérifiez toujours à l'œil avant d'envoyer un message.
- **Pas d'IA ni de clé API** : les messages sont construits par des règles à partir des constats. C'est voulu : gratuit, prévisible, vérifiable.

## Structure

```
radar/audit.py     audit d'un site
radar/messages.py  messages de prospection
radar/store.py     base SQLite des prospects
radar/find.py      recherche dans l'annuaire public
radar/cli.py       ligne de commande
radar/web.py       interface locale (127.0.0.1)
radar/demo.py      données fictives
tests/             66 tests
docs/              offre, méthode de prospection, scripts, exemples
vente/             page de vente locale « audit offert »
```
