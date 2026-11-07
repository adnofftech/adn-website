# Devis974 — Publicité 55 s · dossier de production

**Promesse** : « Moins de paperasse, plus de chantiers signés. »
**Formats** : 9:16 1080×1920 (maître, réseaux sociaux) et 16:9 1920×1080 (site), même timeline, 30 i/s, H.264 + AAC, −14 LUFS.
**Méthode** : motion design 100 % codé (moteur HTML `seek(t)` déterministe → Playwright image par image → ffmpeg), selon le pipeline de `howseen-ai/claude-motion-design`. Règles reprises de `tugrawork-creator/saas-motion-kit` : un seul système visuel (le téléphone est le fil conducteur du début à la fin), aucune fausse fonctionnalité, personnes générées = acteurs, jamais des clients.

## 1. Vérité à l'écran (contrôlée avec le code de l'application)
| Montré dans la pub | Statut réel dans Devis974 |
|---|---|
| Fiche prospect (nom, téléphone, prestation, source, statut) | ✅ développé |
| Devis : client, prestation modèle, calcul HT/TVA/TTC, PDF | ✅ développé (le PDF reproduit la mise en page réelle) |
| Relance prévue, message prérempli, Copier, bouton WhatsApp/e-mail, « J'ai relancé », historique | ✅ développé — **envoi manuel** : le bouton ouvre WhatsApp avec le texte, rien n'est envoyé automatiquement |
| Tableau de bord, graphique, devis accepté | ✅ développé |
| Factures / paiements, formulaire public, relances auto | ❌ non montrés (prévus) |
| Tarifs, essai gratuit, URL | ❌ non affichés (non validés) → « Bientôt disponible à La Réunion » |

Les écrans sont reconstruits en code avec les couleurs, la police et les libellés exacts de l'application, avec des données fictives (« Clim Océan », « Marie Payet »). Mention à l'écran : *Interface Devis974 · données d'exemple*. Le taux de TVA de 8,5 % est celui que l'artisan fictif a choisi dans ses réglages (l'application n'impose aucun taux).

## 2. Script et voix off
| Temps | Voix off | Texte à l'écran |
|---|---|---|
| 0–5 | À La Réunion, quand on est artisan, les journées passent vite… | Des clients à rappeler ? / Des devis en retard ? / Trop de paperasse ? |
| 5–12 | Entre les appels, les devis et les relances, difficile de tout gérer. | Et si vous perdiez des clients sans le savoir ? |
| 12–18 | Découvrez Devis974, le logiciel pensé pour les artisans réunionnais. | Devis974 · Découvrez Devis974 · Votre gestion commerciale, simplifiée. |
| 18–26 | Retrouvez vos clients, leurs demandes et vos prochaines actions au même endroit. | Tous vos clients. Un seul espace. |
| 26–35 | Préparez vos devis professionnels rapidement et gardez une trace de chaque proposition. | Des devis simples et rapides. |
| 35–43 | Et surtout, n'oubliez plus les clients qui attendent votre réponse. | Chaque opportunité compte. |
| 43–49 | Moins d'administratif, plus de temps pour votre métier. | Moins d'administratif / Plus de suivi / Plus de temps pour vos chantiers |
| 49–55 | Devis974. Le logiciel pensé pour les pros péi. | Moins de paperasse, plus de chantiers signés. · [Découvrez Devis974] · Bientôt disponible à La Réunion |

Les répliques sont incrustées en sous-titres (vidéo lisible sans le son) et fournies dans `out/devis974_sous-titres.srt`.
**Casting voix** : homme, 25-35 ans, français standard chaleureux, débit publicitaire ~150 mots/min, légère couleur réunionnaise naturelle sur « pros péi », sans caricature.

## 3. Storyboard (ce qui est réellement animé)
1. **0–5 Accroche** — Fond fin de journée (bleu nuit, lueur orangée), silhouettes de feuilles tropicales en parallaxe, étiquette « 📍 Saint-Paul · fin d'intervention ». Le téléphone vibre 7 fois ; chaque notification s'empile sur l'écran verrouillé **et** jaillit en bulle autour (messages, appels manqués, e-mail, rappel). Trois questions en typographie masquée.
2. **5–12 Problème** — Le téléphone recule ; 7 papiers (devis Word v3, post-it « Rappeler M. Hoarau !! », facture « À relancer », carnet de chantiers, post-it URGENT…) tombent un par temps de musique et le recouvrent. Lente poussée caméra. À 11,25 s un balayage lumineux efface le chaos.
3. **12–18 Révélation** — Sur la première frappe de la musique : trait lumineux → logo qui « s'ouvre », rayons qui partent du logo, « Découvrez Devis974 / Votre gestion commerciale, simplifiée. ». Le logo se range, le téléphone remonte en 3D avec le tableau de bord.
4. **18–26 Clients** — Le fond clair inonde l'écran depuis le téléphone. Appui « + Nouveau », la fiche se remplit en frappe (Marie Payet, 0692…, Nettoyage clim 2 splits, WhatsApp, Nouveau prospect), Enregistrer, la ligne arrive en tête de liste. Puces : Nouveau prospect → Demande reçue → Client enregistré ✓.
5. **26–35 Devis** — Sélection du client, prestation modèle ajoutée, déplacement, totaux qui comptent jusqu'à 168,18 € TTC. « Télécharger le PDF » : la feuille A4 sort du téléphone en 3D, coche verte.
6. **35–43 Relance** — Statut « Envoyé », bannière orange « Relance prévue aujourd'hui », message prérempli, Copier → « Message copié », « J'ai relancé » → historique.
7. **43–49 Bénéfices** — Tableau de bord qui se remplit, le devis passe « Accepté » (toast vert), trois messages successifs.
8. **49–55 Appel à l'action** — Retour au bleu nuit, le téléphone se résorbe, logo, slogan mot à mot, bouton « Découvrez Devis974 » avec reflet, « Bientôt disponible à La Réunion ».

## 4. Identité
Bleu nuit #10243A, bleu #2563EB (accent unique, dégradé animé sur les mots clés), blanc, gris clair #F4F7FB, vert #16A34A (validations), orange #EA7A1A (urgence). Police Inter (celle de l'application). Ressorts amortis (pas de rebond), une action principale à la fois, texte dans les zones de sécurité TikTok/Reels.

## 5. Son
- Musique : « Motivating Mornings » (Mixkit, licence gratuite Mixkit, usage commercial autorisé, sans attribution obligatoire). 120 BPM, intro calme pendant le problème, premier impact calé sur la révélation à 12,0 s, fondu final.
- Effets synthétisés en code (aucun fichier tiers) : vibrations, pops de notification, chutes de papier sur les temps, whooshes de transition, clics, frappe clavier synchronisée lettre par lettre, tic du compteur, carillons de validation, sub-bass sur le logo.
- **Voix off** : générée en local avec **VibeVoice-Realtime-0.5B** (Microsoft, licence MIT), voix française expérimentale `fr-Spk0_man`, sur processeur, sans service payant. Une réplique par fichier, posée au début de sa scène ; coupe-bas, compression légère ; musique baissée d'environ 12 dB sous la voix.
- Contrôle qualité : chaque prise est retranscrite par Whisper (faster-whisper small) et comparée au texte ; jusqu'à 6 prises par réplique, la plus fidèle est retenue. Orthographes phonétiques utilisées : « Devis, neuf sept quatre » (prononciation locale de 974).
- Écart assumé par rapport au script initial : « Moins de paperasse, plus de temps pour votre métier » est devenu « Moins **d'administratif**, plus de temps pour votre métier » (VibeVoice ne prononçait pas « paperasse » correctement). Le slogan final à l'écran reste « Moins de paperasse, plus de chantiers signés. ».
- Microsoft indique que le français de ce modèle est expérimental : le timbre reste un peu synthétique. Bonne pratique recommandée par Microsoft : signaler que la voix est générée par IA lors de la diffusion.

## 6. Prompts pour les plans photoréalistes (à générer seulement avec votre accord)
Règles communes : photo réaliste, lumière naturelle de La Réunion, pas de logo ni de texte lisible dans l'image (l'interface est incrustée ensuite), mains réalistes, personnes 100 % fictives, ni carte postale ni cliché touristique.
- **P1 (0–5 s)** : « Technicien climatisation réunionnais, 35 ans, polo bleu marine uni, termine le nettoyage d'une unité murale split dans le séjour d'une case créole moderne (varangue, persiennes bois, lumière de fin d'après-midi), il sort son téléphone de sa poche et le regarde, plan moyen, 35 mm, profondeur de champ faible, style publicité cinéma, 9:16. »
- **P2 (5–12 s)** : « Plombière d'une trentaine d'années assise dans son utilitaire blanc garé dans une rue de Saint-Paul, tablette et papiers éparpillés sur le tableau de bord, téléphone qui sonne, expression fatiguée mais déterminée, lumière dorée, 9:16. »
- **P3 (43–49 s)** : « Jardinier paysagiste réunionnais range ses outils dans une cour tropicale (frangipanier, muret en pierre de basalte), regarde son téléphone et sourit légèrement, fin de journée, plan large puis serré, 9:16. »
- **P4 (43–49 s)** : « Électricien range sa caisse à outils, une cliente lui serre la main sur le pas de la porte d'une maison à Saint-André, ambiance chaleureuse, aucune marque visible. »
Intégration prévue : 1,5–2 s par plan en ouverture de scène, l'interface Devis974 posée en surimpression ; les plans restent étiquetés comme mise en scène.

## 7. Limites et suite
- **Plans photoréalistes non produits** : la génération d'images et de vidéos réalistes consomme des crédits payants. Les prompts du § 6 sont prêts.
- Les images d'artisans réels sous licence (banques d'images) n'ont pas été utilisées : risque de faire croire qu'une personne identifiable recommande le produit.
- Aucune URL affichée tant que le site n'est pas en ligne.

## 8. Reproduire
```bash
# musique : https://assets.mixkit.co/music/33/33.mp3 → assets/audio/m33.mp3 (non redistribuée ici)
python3 -m http.server 8790 &                 # depuis ce dossier
python3 audio.py                              # out/audio.wav
node render.cjs probe v 1 13 30               # images de contrôle
node render.cjs chunk v 0 3 & node render.cjs chunk v 1 3 & node render.cjs chunk v 2 3
node render.cjs encode v                      # idem avec h pour le 16:9
```
Aperçu interactif : ouvrir `film.html` (ou `film.html?f=h`) puis Espace = lecture, ←/→ = image par image.
