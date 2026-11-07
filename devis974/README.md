# Devis974 — MVP (étape 1)

SaaS de gestion commerciale pour artisans de La Réunion : prospects, devis PDF, relances.
Node 22 (≥ 22.13) · SQLite intégré (`node:sqlite`) · 1 seule dépendance (`pdfkit`) · aucun service payant.

## Lancer
```bash
cd devis974
npm install
npm run seed      # (facultatif) 3 entreprises fictives de démonstration
npm start         # http://localhost:3974  (PORT=… pour changer)
npm test          # 12 tests de bout en bout, dont l'isolation entre entreprises
```
Comptes de démo (mot de passe `Demo-974-Exemple`) : `demo-clim@devis974.example`, `demo-plombier@devis974.example`, `demo-jardin@devis974.example`.
Les données démo sont marquées `is_demo=1`, nommées « (démo) » et séparées des vrais comptes ; `npm run seed` ne remplace que elles.

Variables d'environnement : `PORT`, `DB_PATH` (défaut `data/devis974.db`), `NODE_ENV=production` (cookie `Secure`, à servir derrière HTTPS).

## État des fonctionnalités
**Opérationnelles et testées** : inscription / connexion / déconnexion / réinitialisation du mot de passe · profil entreprise (identité, TVA, mentions, logo) · isolation multi-entreprise côté serveur · tableau de bord calculé sur les vraies données (+ graphique 6 mois) · CRM (fiche, recherche, filtres, tris, historique) · devis (numérotation `DEV-AAAA-NNNN` par entreprise, lignes, remises, TVA par ligne ou franchise, modèles de prestations, statuts, duplication, brouillon seul modifiable) · PDF professionnel avec logo et mentions · relances manuelles (date, message personnalisé, copie, lien WhatsApp `wa.me` prérempli, `mailto:`, historique, limite : 48 h mini entre deux, 3 max par devis) · export JSON et suppression du compte (RGPD) · limitation de débit, CSRF, validation serveur, en-têtes de sécurité · quotas d'essai (14 jours / 15 devis).

**Simulé / limité** : aucune simulation de paiement. Le plan `trial` est le seul actif ; Starter/Pro existent dans la logique de quotas mais ne peuvent pas être souscrits. Le graphique et les statistiques du site vitrine (page d'accueil) sont des **illustrations** signalées comme telles.

**Non configuré (nécessite un service externe)** : envoi d'e-mails (le lien de réinitialisation est écrit dans les logs serveur ; l'e-mail de devis passe par `mailto:` avec PDF à joindre) · vérification d'e-mail · paiement (Stripe ou autre) · WhatsApp : lien manuel uniquement, pas d'envoi automatique.

**À développer (étape 2+)** : formulaire public `/demande/<slug>` (le `slug` existe déjà en base) · factures, avoirs, paiements · relances automatiques par e-mail · abonnements Stripe · espace administrateur · multi-utilisateurs · sauvegardes automatisées · anti-spam du formulaire public · stockage des photos.

## Sauvegarde / restauration
Toutes les données sont dans un fichier SQLite : `sqlite3 data/devis974.db ".backup backup.db"` (ou copie du fichier serveur arrêté). Restauration : remplacer le fichier et redémarrer.

## Limites à connaître
- Mentions légales : champs configurables mais **aucune garantie de conformité** ; à faire valider (comptable/juriste). Aucun taux de TVA n'est supposé : l'artisan choisit franchise ou son taux.
- Limiteur de débit et sessions en mémoire/SQLite mono-instance : suffisant pour un MVP, à externaliser pour du multi-serveur.
- `legal.html` est un modèle à compléter.
- Ce dossier est dans un dépôt déployé par GitHub Pages : seul le contenu statique serait publié, **pas le serveur**. Il faut un hébergement Node pour l'application (ou déplacer `devis974/` dans son propre dépôt).
