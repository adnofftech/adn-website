# MISSION_STATUS

Dernière mise à jour : 2026-10-26 20:05 (heure de La Réunion). Échéance : 2026-10-27 06:00.

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
- [ ] Moteur d'audit de site (`radar/audit.py`)
- [ ] Générateur de messages (`radar/messages.py`)
- [ ] Base de prospects SQLite (`radar/store.py`)
- [ ] Recherche annuaire public (`radar/find.py`)
- [ ] CLI (`radar/cli.py`)
- [ ] Interface web locale (`radar/web.py`)
- [ ] Tests automatisés
- [ ] Démo avec données fictives
- [ ] Offre, scripts, plan de lancement, rapport final

## Commandes de lancement
À remplir après construction.

## Tests
Aucun pour l'instant.

## Erreurs non résolues
Aucune.

## Prochaine action
Écrire `radar/audit.py` et ses tests.

## Dépendances ou autorisations manquantes
- Liste réelle de vos prospects (export CSV du Google Sheet) : à fournir.
- Aucune publication ni envoi n'est fait sans votre accord.
