# ARCHITECTURE
## Capacités réelles détectées (audit 2026-10-16)
**Environnement** : conteneur cloud éphémère (Linux, 4 CPU, 15 Go RAM), PAS votre ordinateur. Il est recréé après inactivité : tout ce qui compte doit être poussé dans Git.
**Présents** : Python 3.13, Node 22, PHP, Ruby, Rust, Go, Docker, git, jq, curl, Chromium/Playwright. Recherche web (outil WebSearch/WebFetch). Connecteurs : Gmail, Google Drive, Google Calendar (brouillons possibles), Shopify, ElevenLabs, vidIQ, Motion, GitHub (limité au dépôt adn-website).
**Absents** : Codex (`codex` introuvable, aucune config ~/.codex), cron/crontab, sqlite3 CLI (le module Python existe), accès libre à Internet (curl vers github.com/duckduckgo a échoué ou expiré; passer par WebFetch/WebSearch).
**Quotas/facturation** : non visibles depuis cette session. Les outils ElevenLabs/Motion/vidIQ consomment des crédits potentiellement payants, et Viberate propose un abonnement : NE PAS les utiliser sans accord.

## Ce que je fais seul
Recherche, scoring, spécifications, code Python/HTML, tests, rapports, brouillons d'emails (Gmail draft, jamais envoyés), commits sur la branche de travail, tâches planifiées côté Claude (create_trigger) tant que le compte les autorise.
## Ce qui exige Codex
Rien de strictement : Claude Code sait coder. Codex est utile en parallèle (revue croisée, gros volumes de génération). Non disponible ici : il faut le lancer sur votre machine, avec ses fichiers HANDOFFS/.
## Ce qui exige votre validation
Statut juridique/facturation, création de comptes (paiement, plateforme, domaine), tout envoi externe, publication sous votre nom, devis/contrats, données personnelles.
## Impossible ici
Communication directe Claude↔Codex (aucun canal), autonomie permanente (le conteneur et les quotas doivent être actifs), tâches cron locales.

## Coordination par fichiers (aucun canal direct)
```
ops/PROJECT.md ROADMAP.md TASKS.md ARCHITECTURE.md DECISIONS.md METRICS.md
ops/HANDOFFS/NNN-titre.md   Claude -> Codex : objectif, contexte, fichiers, critères d'acceptation, tests
ops/REPORTS/                 Codex -> Claude : compte rendu; rapports quotidiens
ops/tests/ ops/logs/         tests unittest; journaux sans secrets (ignorés par Git)
ops/data/                    prospects.csv, ledger.csv : DONNÉES PERSONNELLES, ignorées par Git
ops/bos.py                   CLI : score, prospects, ledger, experiments, report
```
Boucle : Claude écrit un HANDOFF → l'utilisateur lance Codex dessus → Codex écrit un REPORT → Claude relit le diff, exécute les tests, valide ou renvoie.
Sécurité : le dépôt est publié sur GitHub Pages ; ops/ ne doit pas être exposé (voir DECISIONS D-004). Arrêt immédiat : supprimer les tâches planifiées (list_triggers/delete_trigger) ; bos.py n'envoie rien et ne tourne que sur commande.
