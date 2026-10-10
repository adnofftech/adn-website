# MAIS POURQUOI ? — « Pourquoi le temps file de plus en plus vite en grandissant ? » (narration)

Narration de 8 min 07 s, voix « Léo – Energetic & Engaging » (ElevenLabs, modèle `eleven_v4`), texte fourni par l'utilisateur.

## Fichiers
* `script.txt` — texte intégral tel que fourni (sans les deux indications de ton de la fin).
* `audio/narration_leo_complete.mp3` — narration complète, telle que générée (partie 1 + 0,25 s de silence + partie 2), mono 44,1 kHz, 192 kb/s, niveau d'origine ≈ −30 LUFS (bas).
* `audio/narration_leo_complete_normalisee.mp3` — même narration, volume remonté à ≈ −16,6 LUFS (crête −1,5 dB), prête à l'emploi.
* `audio/partie1.mp3` (3 min 57) et `audio/partie2.mp3` (4 min 10) — les deux générations brutes ; `texte_partie1.txt`, `texte_partie2.txt` — leur texte.
* `audio/partie*_mots.json` — transcription locale (faster-whisper) avec le début de chaque mot ; `scripts/verifier_voix.py` — comparaison avec le texte.

## Génération
* Limite du service : 5 000 caractères par texte ; le script en fait 9 647, donc 2 générations coupées entre « …Deux trucs qui marchent pas pareil. » et « Alors, pourquoi un été d'enfance… ».
* Indications de ton demandées (« curiosité joyeuse », « avec enthousiasme ») traduites en balises `[curious] [happy] [excited]` au début de chaque partie.

## Contrôle
* Transcription locale ≈ 96 % identique au texte ; les écarts relevés sont des pluriels inaudibles, « 24h » lu « 24 heures », des noms propres épelés autrement par le transcripteur (Wittmann, Ornstein, Draaisma) et quelques « ne » / « il y a » possiblement ajoutés. Non vérifié à l'écoute.
