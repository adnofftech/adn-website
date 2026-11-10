# Rachid Shopp – maquette de validation

Ouvrir `index.html` (fonctionne en local, sans serveur). En ligne : `/rachid-shopp/` du dépôt.

## Modifier les contenus
- **Prix, noms, compatibilités** : `data.js` (un bloc par produit ; `"price_eur": null` = « Tarif sur demande »).
- **Tarifs de réparation** : même fichier, liste `reparations` (service, model, price_eur). Un modèle absent d'une prestation affiche « Tarif sur demande ».
- **Changer un visuel** : remplacer le fichier dans `img/produits/` (même nom, format carré WebP) ou changer le champ `image`.
- **Textes, horaires, livraison** : `index.html`.
- Le prix des protections caméra Air et des lentilles « effet diamant » (10 €) est signalé « à confirmer » (`TO_CONFIRM` dans `app.js`).

## Avant publication
Voir les points ouverts du dossier (`02-VALIDATION-RACHID.md`) : canal de commande officiel, coordonnées et mentions du vendeur, conditions de vente, paiement, modalités de la garantie de 2 mois, photos originales. Retirer `<meta name="robots" content="noindex">` à la mise en ligne définitive.
