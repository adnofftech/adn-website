# Rapport final, mission de nuit

Rédigé le 2026-10-26 (heure de La Réunion). Tout ce qui est écrit « testé » l'a été réellement dans la session ; le reste est signalé.

## 1. Ce que j'ai choisi de construire
**KAPTUR Radar** : un outil local qui (1) trouve des entreprises réunionnaises dans l'annuaire public, (2) audite leur site web avec 15 vérifications factuelles, (3) prépare des messages de prospection (WhatsApp, e-mail, appel, relances) qui citent ces constats, (4) suit le pipeline jusqu'au client. Il sert à vendre vos formules KAPTUR. Ce n'est pas un produit que vous vendez : c'est votre moteur de prospection.

## 2. Pourquoi ce modèle
- Coût de lancement : 0 €. Python standard, SQLite, aucune clé API, aucun abonnement.
- Votre dossier montre que le blocage est de trouver et d'approcher des clients (liste de prospects déjà ouverte, objectif de 5 abonnés annuels). L'outil s'y attaque directement.
- Vous avez déjà des prix et un matériel : TEST 99 €, START 249 €/mois, PRO 399 €/mois ; iPhone, DJI Osmo Pocket 3, CapCut.
- J'ai écarté : un micro-SaaS (aucun client ni preuve de demande, vente lente sans budget) et un agent IA à clé API (dépendance payante ou non vérifiable cette nuit).
- Limite assumée : c'est un outil d'aide à la vente, pas une source de revenu en soi. Le revenu vient de vos prestations vidéo.

## 3. Ce qui existe réellement
| Élément | Fichier | État |
|---|---|---|
| Audit de site (15 points, respect robots.txt, refus des adresses privées) | `radar/audit.py` | testé, y compris sur une vraie page web |
| Messages personnalisés (DM, e-mail avec mention de désinscription, appel, 2 relances) | `radar/messages.py` | testé |
| Base de prospects, statuts, relances | `radar/store.py` | testé |
| Recherche annuaire public (entrepreneurs individuels et non diffusibles exclus) | `radar/find.py` | testé sur données fictives et sur l'API réelle |
| Ligne de commande | `radar/cli.py` | testé (import CSV, export, demo) |
| Interface web locale | `radar/web.py` | testé en navigateur et par tests |
| Page de vente « audit offert » | `vente/audit-offert.html` | rendue et relue ; pas publiée |
| Offre, méthode, scripts, plan 7 jours | `docs/`, `PLAN_DE_LANCEMENT.md` | rédigés |

## 4. Où sont les fichiers
Dossier `kaptur-radar/` du dépôt `adnofftech/adn-website`, branche `claude/beautiful-heisenberg-012454`. Rien n'est sur `main`, rien n'est publié.

## 5. Lancer le projet
```bash
cd kaptur-radar
python3 -m unittest discover -s tests -t .      # 66 tests
python3 -m radar demo                            # 5 entreprises FICTIVES
python3 -m radar serve                           # http://127.0.0.1:8765/
```
Sous Windows : double-clic sur `lancer.bat` (nécessite Python 3.10+ installé : https://www.python.org). Je n'ai pas testé `lancer.bat`.

## 6. Tester les fonctions principales
- Audit : `python3 -m radar audit 1` (après `demo`) → score 8/100 avec la liste des défauts.
- Message : `python3 -m radar message 1 --kind dm`.
- Annuaire : `python3 -m radar find restauration --postal 97434 --limit 5 --dry-run` (nécessite Internet).
- Import : `python3 -m radar import fichier.csv` (colonnes nom, secteur, ville, téléphone, site...).

## 7. Ce qui fonctionne, ce qui ne fonctionne pas
**Fonctionne (vérifié)** : tout ce qui est listé au point 3.
**Ne fonctionne pas ou non vérifié** :
- **Je n'ai pas travaillé sur votre ordinateur.** La session tourne dans le cloud. Je n'ai pas vu votre Google Sheet ni vos fichiers. Codex n'était pas disponible : tout le code est de moi, sans second regard indépendant.
- Un audit sur un site construit entièrement en JavaScript peut être incomplet (le HTML reçu est presque vide).
- L'audit ne mesure pas la vraie vitesse de chargement (une seule requête HTML, sans images ni scripts).
- `lancer.bat` et l'exécution sous Windows ne sont pas testés.
- L'API de l'annuaire a coupé plusieurs connexions pendant mes tests (proxy de la session) ; l'outil réessaie 3 fois puis affiche un message clair. Sur votre connexion, cela devrait être plus stable, non vérifié.
- Aucune demande n'a été validée par un vrai prospect. **Le marché n'est pas validé.**

## 8. Preuves
- `docs/PREUVES_TESTS.txt` : sortie complète des 66 tests (OK).
- Audit réel d'une page web publique (example.com) : score 41/100 en 186 ms, constats cohérents avec la page (pas de description, 25 mots, aucun titre principal).
- Recherche réelle dans l'annuaire : l'API renvoie bien l'établissement correspondant au code postal demandé ; j'ai corrigé l'outil pour l'utiliser au lieu du siège (constaté sur des résultats réels).
- Captures de l'interface (liste, fiche prospect avec audit et messages) vérifiées visuellement, et du bouton « Copier » (une erreur de presse-papiers en navigateur sans autorisation a été corrigée par un repli).

## 9. Client idéal
Entreprise réunionnaise de 1 à 20 salariés, clientèle locale, avec site ou page sociale mais peu de vidéo. Secteurs de départ : immobilier, hôtellerie-restauration, BTP, commerce de proximité (ceux de votre dossier). Hypothèse, à confirmer par les 10 à 20 premiers contacts.

## 10. Prix et détermination
TEST 99 €, START 249 €/mois, PRO 399 €/mois : vos tarifs, conservés. Cohérence : ≈ 31 à 33 € par vidéo livrée dans les trois formules. Repère concurrent issu de votre dossier : 290 à 690 € pour un site. **Non validé** : personne n'a encore payé. Mesurez le temps réel d'un TEST avant de figer le prix.

## 11. Obtenir le premier client
Chemin le plus court : 20 à 30 contacts personnalisés en 3 jours, vers des entreprises à faible score de site, par appel ou message, offre d'entrée TEST à 99 €, appel de retour à J+7 pour proposer START. Détail jour par jour : `PLAN_DE_LANCEMENT.md`.

## 12. Actions pour demain matin (dans l'ordre)
1. Décider qui envoie et comment encaisser ; vérifier que vous pouvez facturer légalement (SIRET).
2. Lancer l'outil, tester la démo (10 minutes).
3. Exporter votre Google Sheet en CSV et l'importer ; compléter 15 fiches.
4. `radar audit --all`, vérifier à l'œil les constats des 10 premiers.
5. Envoyer les 10 premiers messages (relus par vous).
6. Préparer 2 ou 3 vidéos exemples sur @kaptur.visual.

## 13. Coûts
Engagés : 0 €. Aucun achat, abonnement ni paiement.
Futurs éventuels, tous optionnels : nom de domaine et hébergement si vous publiez la page de vente (non chiffrés ici, je n'ai rien vérifié) ; statut juridique et déclarations si vous n'en avez pas encore ; outil de paiement (à choisir).

## 14. Risques et limites
- Pas de preuve de demande. Le taux de réponse réel est inconnu : mesurez-le.
- Cadre légal de la prospection : j'ai inclus identification et désinscription dans les e-mails, mais je ne suis pas juriste. Vérifiez sur cnil.fr.
- L'outil audite le site d'un tiers par une requête de lecture, sans contourner de protection. Le `robots.txt` est respecté.
- Si le site d'un prospect est bien tenu, le message ne cite aucun défaut (testé) : l'outil n'invente rien.
- Dépendance à vous : l'offre repose sur votre temps de tournage et de montage. Ne vendez pas plus que ce que vous pouvez livrer.

## 15. Meilleure prochaine action
Envoyer les 10 premiers messages à des entreprises à faible score, puis noter chaque réponse dans l'outil. Tout le reste dépend de ces premières réponses réelles.
