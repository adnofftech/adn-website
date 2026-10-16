# PROJECT : portefeuille de business IA à coût de départ nul
Créé le 2026-10-16. Pilote : Claude Code. Exécutant technique : Codex (si disponible, voir ARCHITECTURE.md). Décideur : l'utilisateur.

## Contraintes (non négociables)
0 € de dépense supplémentaire (hors abonnements Claude/Codex, suivis à part). Pas de pub payante, pas de faux témoignages/chiffres, pas de spam, pas d'envoi externe sans validation. Aucun résultat inventé.

## Faits observés (vérifiés dans le dépôt)
- Le dépôt `adn-website` contient déjà un savoir-faire : sites statiques propres (Python build + JSON tarifs), maquettes de refonte pour des commerces locaux (Ma Pause Beauté, Sainte-Clotilde ; La Terrasse de Bourbon ; La Fabrique), déployables gratuitement via GitHub Pages.
- Hypothèse H1 (à confirmer) : vous êtes basé à La Réunion et votre marché de départ est local (TPE/commerces).
- Hypothèse H2 : vous n'avez pas encore de statut juridique pour facturer (micro-entreprise). Sans lui, aucune vente légale : c'est la première validation humaine.

## Portefeuille (3 expériences, voir ops/experiments.csv)
| Id | Rôle | Offre | Prix test |
|---|---|---|---|
| E1 | Vente rapide de service | Site vitrine pour TPE, maquette d'abord | 390 € |
| E2 | Porte d'entrée automatisée | Audit express de présence en ligne | 0 € puis tester 29 € |
| E3 | Volume numérique | Kits de site par métier | 29 € |
| (plus tard) | Récurrent | Maintenance + contenus, après les premiers clients E1 | 19-39 €/mois (hypothèse) |
Les prix sont des hypothèses de test, pas des prix de marché prouvés.

## Règles de décision
Chaque expérience a un objectif et un seuil d'abandon (experiments.csv). `python3 ops/bos.py experiments` donne le verdict : RENFORCER / ITÉRER / ABANDONNER. Pas plus de 3 expériences actives tant qu'une première vente n'est pas obtenue.
