# HANDOFF 001 : Claude -> Codex
**Objectif** : script `tools/audit.py` qui, à partir d'un JSON décrivant un commerce (nom, métier, ville, URL du site s'il existe), produit une page HTML d'audit express 1 page (constats vérifiables : balises title/description, viewport, HTTPS, temps de chargement, présence de téléphone cliquable). Aucune donnée inventée : un champ non mesurable s'affiche « non vérifié ».
**Contexte** : voir ops/PROJECT.md. Réutiliser le style de tools/build.py et assets/tokens.css. Python stdlib uniquement, 0 abonnement.
**Fichiers** : tools/audit.py (nouveau), ops/tests/test_audit.py (nouveau). Ne pas modifier index.html ni les pages existantes.
**Critères d'acceptation** : fonctionne hors ligne sur un fichier HTML local (option --file); mode réseau avec timeout 10 s; sortie accessible (lang, alt, contraste); aucun secret en log.
**Tests attendus** : unittest sur 3 HTML d'exemple (bon, mauvais, vide); `python3 -m unittest discover -s ops/tests` vert.
**Retour** : ops/REPORTS/001-report.md (ce qui est fait, ce qui ne l'est pas, commandes exécutées).
