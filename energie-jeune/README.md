# Énergie Jeune – démo cliquable (données fictives)

Application interne pour organiser les interventions, coordonner 12 volontaires et gérer les voitures KM et PM.
HTML/CSS/JS sans dépendance : ouvrir `index.html` via un serveur statique (`python3 -m http.server`).

- Données : stockées dans le navigateur (`localStorage`), toutes fictives, réinitialisables (Réglages).
- Horloge de démo fixée à 09:30 (fuseau Indian/Reunion), réglable en haut à droite.
- Espaces : Claire, ou un volontaire (sélecteur en haut à droite) — simulation, pas d'authentification.
- Parcours guidé : `#/guide`. État opérationnel / à connecter : `#/reglages`.
- Tests : `node tests/logic.test.js` ; `node tests/e2e.js [url]` (Playwright, scénario complet).

Version déployée à prévoir : comptes individuels, droits côté serveur, base commune, pièces jointes privées,
boîte pro via autorisation OAuth de Claire avec validation avant envoi.
