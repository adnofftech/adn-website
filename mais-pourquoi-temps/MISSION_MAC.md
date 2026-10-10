# Mission (session sur le Mac de l'utilisateur) — créer les mini-vidéos stickman sur vibes.ai

Contexte : l'utilisateur prépare une vidéo YouTube de 8 min 07 (narration de Léo : `audio/narration_leo_complete_normalisee.mp3`, texte : `script.txt`). Il veut l'animer avec des mini-vidéos de 5 secondes avec **le même personnage stickman 2D** que son projet vibes.ai :
https://vibes.ai/projects/766fdb44-9ea4-42f7-b602-e65d5359881a

Le plan est prêt : `PLAN_CLIPS.md` (94 clips : minutage, texte dit, idée de visuel, prompt anglais). Les prompts seuls sont dans `prompts_clips.txt`, les mêmes données en JSON dans `plan_clips.json` (champ `prompt_en`).

## À faire
1. Ouvre le projet vibes.ai dans un navigateur (l'utilisateur doit déjà y être connecté ; ne saisis aucun mot de passe : s'il faut se connecter, demande-lui). Repère le personnage stickman du projet et comment le réutiliser comme référence (image, personnage enregistré, etc.).
2. **Avant toute génération**, regarde combien coûte une vidéo (crédits ou euros) et le solde disponible. Calcule le coût des 94 clips. Dis-le à l'utilisateur et **attends son accord** avant de lancer plus de 3 clips d'essai si le total dépasse son solde ou semble élevé.
3. Fais d'abord 2 ou 3 clips d'essai (clips 1, 2 et 15 par exemple), montre le résultat à l'utilisateur et vérifie : même personnage d'un clip à l'autre, format 16:9, 5 secondes, pas de texte parasite. Ajuste le prompt si besoin (le bloc de style est en tête de `PLAN_CLIPS.md`).
4. Génère ensuite les clips restants dans l'ordre du plan (clips 1 à 92, le 71 étant en trois parties 71a, 71b, 71c). Garde le même personnage.
5. Télécharge chaque clip dans un dossier `clips/` à côté de ce fichier, nommé `clip_01.mp4`, `clip_02.mp4`, …, `clip_71a.mp4`, etc. (numéro du plan). Tiens un fichier `clips/journal.md` : numéro, prompt utilisé, réussi ou non, remarques.
6. Si un clip est raté (personnage différent, déformé, texte parasite), régénère-le au plus 2 fois puis signale-le dans le journal sans insister.
7. Ne change aucun réglage de compte, d'abonnement ou de paiement. N'achète rien. Si le site propose d'acheter des crédits, arrête-toi et demande à l'utilisateur.
8. Quand c'est fini, résume : nombre de clips réussis, ratés, crédits dépensés, emplacement des fichiers. Si tu travailles dans un clone du dépôt, ne pousse pas les vidéos sur GitHub (trop lourdes) : laisse-les en local.

## Limites connues
* Cette mission n'a pas pu être faite depuis la session cloud d'origine (pas d'accès à l'ordinateur) : rien n'a encore été généré.
* Les noms de personnes du texte (Wittmann, Ornstein, Draaisma) ne figurent pas dans les prompts : aucun texte ne doit apparaître dans les clips.
