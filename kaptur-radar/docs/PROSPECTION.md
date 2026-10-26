# Méthode de prospection gratuite

## 1. Trouver des entreprises (5 minutes pour 20 noms)
```bash
python3 -m radar find restauration --postal 97400 --limit 20
python3 -m radar find immobilier --postal 97490 --limit 20
```
Source : annuaire public des entreprises. Vous obtenez le nom, l'adresse et le SIREN. Ni site, ni téléphone, ni e-mail.

Si vous avez déjà votre Google Sheet de prospection (immobilier, hôtellerie, restauration, BTP, priorité A/B) : exportez-le en CSV (Fichier, Télécharger, CSV) puis `python3 -m radar import fichier.csv`. Colonnes reconnues : nom, secteur, ville, adresse, téléphone, e-mail, site, instagram, notes.

## 2. Compléter la fiche (3 minutes par entreprise)
Cherchez le nom de l'entreprise dans Google Maps et Facebook. Relevez : site web, téléphone, Instagram, et regardez les 5 dernières publications (dernière vidéo ? dernière date ?).
```bash
python3 -m radar edit 12 --website exemple.re --phone "0692 .. .. .." --instagram "@exemple" --notes "dernière publication en mars"
```
Ne gardez que des coordonnées professionnelles publiées par l'entreprise elle-même.

## 3. Auditer et trier
```bash
python3 -m radar audit --all
python3 -m radar list
```
La liste est triée du score le plus bas au plus haut : en haut, les entreprises qui ont le plus à gagner. **Vérifiez à l'œil les 3 premiers constats avant d'écrire** : ouvrez le site sur votre téléphone. Si l'outil se trompe (site construit en JavaScript, par exemple), corrigez le message.

## 4. Premier contact
Ordre conseillé (hypothèse à tester, je n'ai pas de données locales qui le prouvent) :
1. Téléphone ou passage sur place : plus personnel, le script est dans `docs/SCRIPTS.md`.
2. Message WhatsApp ou Instagram : `python3 -m radar message 12 --kind dm`.
3. E-mail : `python3 -m radar message 12 --kind email`.

Après envoi : `python3 -m radar status 12 contacté` (relance programmée à J+3). Chaque matin : `python3 -m radar list --due`.

## 5. Cadence
- J0 : premier message. J+3 : relance 1 (exemple de vidéo). J+7 : relance 2, courte, puis stop.
- Pas plus de 2 relances. Si réponse négative : `status perdu` et ne plus écrire.

## 6. Règles à respecter (à vérifier vous-même)
- Prospection par e-mail ou message vers un professionnel : en France, elle est en principe admise si le message concerne son activité professionnelle, si vous vous identifiez clairement et si vous offrez un moyen simple de refuser. Les messages générés contiennent cette mention. Vérifiez les règles actuelles sur cnil.fr avant de démarrer : je ne suis pas juriste.
- Respectez immédiatement toute demande d'arrêt, et notez-la dans la fiche (`status perdu`).
- Ne collectez pas d'informations personnelles inutiles (pas de numéro personnel d'un dirigeant, pas de profils privés).
- Aucun envoi en masse automatisé. L'outil ne le permet pas, gardez-le ainsi.

## 7. Ce dont vous avez besoin avant le premier envoi
- 2 ou 3 vidéos exemples sur votre Instagram (@kaptur.visual) à envoyer en réponse à « montrez-moi un exemple ».
- Un moyen d'encaisser le TEST (à choisir par vous).
- Une activité déclarée pour facturer.
