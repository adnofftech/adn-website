# Rachid Shopp – site de validation

Site statique, sans dépendance. Cinq pages : `index.html`, `reparations.html`, `accessoires.html`, `parfums.html`, `demande.html`.

## Ouvrir l'aperçu

Depuis la racine du dépôt :

```bash
python3 -m http.server 8080
```

puis ouvrir <http://localhost:8080/rachid-shopp/>. Sur téléphone, utiliser l'adresse IP de l'ordinateur sur le même réseau Wi-Fi (ex. `http://192.168.1.20:8080/rachid-shopp/`). Un double-clic sur `index.html` fonctionne aussi, sauf la pré-sélection via l'URL sur `demande.html` selon le navigateur.

## Modifier les contenus

| Quoi | Où |
| --- | --- |
| Prix, noms, variantes, compatibilités des 28 articles | `data.js` → `produits`. `"price_eur": null` affiche « Tarif sur demande ». |
| Les 58 tarifs de réparation et les pièces sur commande | `data.js` → `reparations` (`service`, `model`, `price_eur`). Un modèle absent d'une prestation affiche « Tarif sur demande ». |
| Horaires, livraison, éléments à fournir dans un message | `config.js` |
| Canal de commande officiel (WhatsApp, Snapchat…) | `config.js` → `contact.url` et `contact.libelle`. Vide = seul le bouton « Copier » est proposé. |
| Changer un visuel produit | Remplacer le fichier dans `img/produits/` (même nom) ou modifier le champ `image` dans `data.js`. Les cartes fournies (640 × 680) intègrent un cadre : le site n'affiche que leur zone photo (voir `.card .ph` dans `style.css`). Pour une vraie photo, mettre une image carrée et retirer ce recadrage. |
| Bannière d'accueil, visuels de catégories, logo | `img/accueil-*.webp`, `img/categories/`, `img/identite/` |
| Textes des pages | `gabarits/body-*.html`, puis régénérer (ci-dessous). Ou éditer directement les `.html` si on n'utilise pas le générateur. |
| En-tête, pied de page, balises `<head>` | `gabarits/generer-pages.py` |
| Prix « à confirmer » (10 € protection Air et lentilles effet diamant) | `TO_CONFIRM` dans `app.js` : retirer les références une fois validées. |

Régénérer les pages après modification d'un gabarit :

```bash
python3 gabarits/generer-pages.py .
```

## Avant la mise en ligne

1. Compléter la liste de validation (`02-VALIDATION-RACHID.md` du dossier source), en particulier le canal de commande, les coordonnées et mentions du vendeur.
2. Retirer `<meta name="robots" content="noindex">` dans `gabarits/generer-pages.py` et régénérer.
3. Le déploiement GitHub Pages part de `main` : fusionner la branche, le site sera servi sous `/rachid-shopp/`.
