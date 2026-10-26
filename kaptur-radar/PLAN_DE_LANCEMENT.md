# Plan de lancement, 7 jours

Objectif : **un premier TEST payé** (99 €) en 7 jours. Ce plan suppose 2 à 3 heures de travail par jour. Les chiffres de résultats sont des hypothèses à mesurer, pas des promesses.

## Avant le jour 1 (30 minutes)
- [ ] Lancer les tests : `python3 -m unittest discover -s tests -t .`
- [ ] `python3 -m radar demo` puis `python3 -m radar serve` : parcourir l'interface une fois.
- [ ] Décider : qui envoie (Ensone ou Adrien), comment encaisser, et vérifier l'activité déclarée pour facturer.
- [ ] Préparer 2 ou 3 vidéos exemples sur @kaptur.visual.
- [ ] Supprimer les données de démo : effacer `data/radar.db`.

## Jour 1 : constituer la liste
- [ ] Importer votre Google Sheet (export CSV) et/ou `radar find` sur 2 secteurs et 2 codes postaux.
- [ ] Compléter 15 fiches (site, téléphone, Instagram) : environ 45 minutes.
- [ ] `radar audit --all`, puis relire les 10 scores les plus bas.

## Jour 2 : 10 premiers contacts
- [ ] Vérifier à l'œil les constats de 10 entreprises.
- [ ] Appeler ou écrire à 10 entreprises (messages générés, relus et adaptés).
- [ ] `radar status ID contacté` pour chacune.

## Jour 3 : relances et 10 nouveaux contacts
- [ ] `radar list --due` : relance 1 avec un exemple vidéo.
- [ ] 10 nouveaux contacts.

## Jour 4 : rendez-vous
- [ ] Caler les premiers appels de 15 minutes. Préparer 3 idées de vidéos par entreprise intéressée.

## Jour 5 : premier TEST
- [ ] Confirmer par écrit (WhatsApp) le contenu, le prix, la date de tournage. Encaisser avant de tourner.

## Jour 6 : tournage et montage
- [ ] Tournage (1 à 2 h), montage CapCut. Noter le temps réel passé, c'est la donnée la plus importante pour fixer vos prix.

## Jour 7 : bilan
- [ ] Compter : contacts faits, réponses, rendez-vous, TEST vendus. Calculer vos vrais taux. Ajuster message, cible, prix.
- [ ] Livrer et proposer START à J+7 après livraison.

## Indicateurs à noter chaque soir
Contacts envoyés, réponses reçues, rendez-vous, TEST vendus, temps passé. Sans ces chiffres, impossible de savoir si l'approche fonctionne.

## Si rien ne répond après 40 contacts
Changer une variable à la fois : le secteur (immobilier plutôt que restauration), le canal (appel plutôt que message), l'offre (tournage gratuit d'un seul Reel en échange d'un avis), ou la cible (entreprises avec site récent mais sans vidéo).
