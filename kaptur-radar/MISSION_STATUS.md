# MISSION_STATUS

Dernière mise à jour : 2026-10-26 (soir) (heure de La Réunion). Échéance : 2026-10-27 06:00.

## Environnement réel (vérifié)
- Session Claude Code **dans le cloud** (conteneur Linux), pas sur votre ordinateur. Je ne vois pas vos fichiers locaux, ni votre Google Sheet de prospection.
- Codex : **non disponible** (`which codex` ne trouve rien). Je travaille seul.
- Outils : Python 3.13, Node 22, git, sqlite3 (module Python), curl. Aucune clé API payante, aucun achat.
- Réseau : l'API publique `recherche-entreprises.api.gouv.fr` répond (testé). Les sites de prospects dépendent du proxy de la session.
- Limite : une session ne garantit pas de tourner jusqu'à 06 h 00. Tout l'avancement est commité sur la branche `claude/beautiful-heisenberg-012454` pour qu'une reprise soit possible.

## Projet retenu
**KAPTUR Radar** : outil local de prospection qui trouve des entreprises réunionnaises (annuaire public), audite leur site web, et prépare des messages personnalisés basés sur ce qui manque réellement. Il alimente la vente des formules KAPTUR (TEST 99 €, START 249 €/mois, PRO 399 €/mois).

## Pourquoi
- Coût 0 € : Python standard, SQLite, aucune dépendance payante.
- Vend un service que vous avez déjà (KAPTUR) avec des prix déjà fixés dans votre dossier.
- Le goulot d'étranglement de KAPTUR est de trouver et d'approcher des clients : l'outil s'attaque à cela.
- Pas de dépendance à une clé API, ni à un envoi automatique : tout est validé par un humain.

## Tâches
- [x] Moteur d'audit de site (`radar/audit.py`)
- [x] Générateur de messages (`radar/messages.py`)
- [x] Base de prospects SQLite (`radar/store.py`)
- [x] Recherche annuaire public (`radar/find.py`)
- [x] CLI (`radar/cli.py`)
- [x] Interface web locale (`radar/web.py`)
- [x] Tests automatisés (66, OK)
- [x] Démo avec données fictives
- [x] Offre, scripts, plan de lancement, rapport final
- [ ] Validation par de vrais prospects (nécessite l'humain)

## Commandes de lancement
```bash
cd kaptur-radar
python3 -m unittest discover -s tests -t .
python3 -m radar demo
python3 -m radar serve   # http://127.0.0.1:8765/
```

## Tests
66 tests, tous OK (`docs/PREUVES_TESTS.txt`). Audit réel testé sur example.com. Recherche annuaire réelle testée (connexion parfois coupée par le proxy de la session).

## Erreurs non résolues
Aucune connue. Non testé : Windows (`lancer.bat`), sites 100 % JavaScript.


## Prochaine action
Attendre votre retour : envoyer les 10 premiers messages et noter les réponses. Voir `RAPPORT_FINAL.md` point 12.

## Dépendances ou autorisations manquantes
- Liste réelle de vos prospects (export CSV du Google Sheet) : à fournir.
- Aucune publication ni envoi n'est fait sans votre accord.
