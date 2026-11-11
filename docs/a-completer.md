# À compléter et à vérifier avant publication

## Médias attendus

| Emplacement | Fichier | Cadrage utile |
|---|---|---|
| Premier écran de l’accueil (et carte N° 01) | photo originale de la composition florale, portrait 4:5, 1600 px de large au moins | sujet centré, peau et encre nettes |
| Galerie, pièces N° 02 à 04 | lettrage, composition à l’oiseau, pièce détaillée avec ombrages : originaux (pas les captures Instagram) | portrait 4:5 ; un gros plan par pièce si possible (`detail`) |
| Pièces supplémentaires | toute autre réalisation autorisée | idem ; les filtres s’activent à partir de 6 pièces |
| Logo officiel | SVG ou PNG haute définition, s’il existe | remplace la signature typographique dans `Signature.astro` et `public/favicon.svg` |

Pour chaque photo : accord de la personne tatouée pour la publication (champ `publication` du fichier de données).

## Informations professionnelles (mentions légales)

Identité ou raison sociale, statut, SIRET, adresse de correspondance publiable, e-mail de contact, directeur de la publication, hébergeur et durée de conservation de ses journaux. À renseigner dans `src/data/site.ts` (`mentions`). Domaine définitif (`SITE_URL`) pour les URL canoniques et le sitemap.

## Points à clarifier avec l’artiste

1. **Lien de messagerie Instagram** `https://ig.me/m/lartiste.ink` : non vérifiable depuis l’environnement de développement (connexion refusée par le réseau). À tester sur un téléphone avec et sans l’application Instagram. Le profil reste proposé en repli sous le bouton.
2. **Tatouage à domicile** : modalités d’exercice à confirmer (cadre réglementaire, hygiène, zones réellement desservies). Rubrique activable par `conditions.domicile.visible`.
3. **Confirmation du rendez-vous** : que devient l’acompte lorsque la confirmation manque ? Les supports annoncent une annulation automatique sans préciser ce point.
4. **Liste noire** : une story mentionne une mise sur liste noire après rendez-vous non confirmé ou manqué. Non reprise sur le site. Souhaite-t-il la formuler publiquement, et comment l’applique-t-il ?
5. **Soins après tatouage** : la transcription de la fiche (voir `docs/sources.md`) doit être validée avec l’artiste et les recommandations sanitaires avant d’être publiée. Le site affiche en attendant « Les consignes de soins vous seront communiquées après la séance. »
6. **Comparaison avec 1 200 € en salon** : présente sur une affiche, non utilisée. À sourcer avant tout usage commercial.
7. **Adresse d’accueil** : seule la commune (Saint-Paul) est affichée. Une adresse précise, une carte et des horaires nécessitent les coordonnées réelles ; les données structurées n’en contiennent pas pour l’instant.
8. **Moyens de paiement de l’acompte** : espèces en amont ou virement, modalités communiquées en privé. Confirmer la formulation.
9. **Expérience, diplômes, nombre de clients, avis** : aucun argument de ce type n’est affiché faute d’information attestée. À fournir si souhaité.
10. **Statistiques Instagram** : volontairement absentes du site (données datées).

## Mise en ligne

- Passer `PREVIEW=false`, renseigner `SITE_URL`, vider `BASE_PATH` si domaine propre, remplacer `public/robots.txt` par une version autorisant l’indexation et ajouter un sitemap (`@astrojs/sitemap`) une fois le domaine connu.
- Retirer les textures d’attente (`placeholder: true`) au profit des originaux.
