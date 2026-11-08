# Storyboard — Devis974 · « La grille »

Theme: 084 Swiss Grid (adapté) · Format: 1080x1920 + 1920x1080 · Length: 33.0 · Sound: music (fourni) / VO + sfx (sans musique)

## Message & tone
- **Sentence:** I want to say "Moins de paperasse, plus de chantiers signés" in a bold tone, so the viewer feels that the chaos of calls and papers finally fits in one clean grid.
- **Tone arc:** urgent → bold → trustworthy → warm
- accent: blue
- **Motif (optional):** la grille de modules : elle se dessine au début, enferme le chaos, puis range le produit, et se referme sur le logo à la fin.

## Ledger

Grille : 124 BPM, temps = 0,4839 s, mesure = 1,935 s, phase 0,067 s (mesurée), coupes recalées sur les attaques réelles.

| # | start | dur | beat | tone | entrance | transition_out | ease | direction | palette | camera | components | new_component | sfx | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 0:00.07 | 0.97 | hook | urgent | grid-stroke-on | whip-pan | expo.out | left | navy+paper | push-in | footage-electricien, headline | grid-cell footage tiles | tick | 2 temps ; le plan s'ouvre sur le 1er temps |
| 2 | 0:01.04 | 0.97 | hook | urgent | module-snap | match-cut-motion | steps(4) | right | navy+paper | locked | footage-plombier, headline | | tick | 2 temps ; même geste de la main d'un plan à l'autre |
| 3 | 0:02.00 | 1.96 | hook | urgent | split-in | split-stack | power3.out | up | navy+orange | locked | footage-marteau, giant-numeral | | pop | mesure 1 ; compteur = pastilles réellement visibles |
| 4 | 0:03.96 | 1.94 | problem | urgent | rise+fade | parallax-slide | power2.out | down | paper+navy | dolly | footage-telephone, notification-cards | | buzz | mesure 2 |
| 5 | 0:05.90 | 1.91 | problem | urgent | slide-left | beat-cut-hold | sine.inOut | left | navy+paper | push-in | footage-paperasse, headline | | thud | surprise: gel 0,4 s avant l'impact 7,82 |
| 6 | 0:07.81 | 1.93 | reveal | bold | mask-open | product-shape-mask | power4.out | radial | blue+navy | locked | logo, row-flood | | stab | impact 7,82 ; événement couleur : le bleu remplit la ligne |
| 7 | 0:09.74 | 1.94 | reveal | bold | scale-from-center | push-through | expo.inOut | center | paper+navy | push-in | capture-site-vitrine | | whoosh | vraie page d'accueil ; accent sur 10,72 |
| 8 | 0:11.68 | 3.87 | proof | trustworthy | type-mask | focal-iris | sine.inOut | left | paper+blue | parallax | capture-tableau-de-bord, capture-clients | | tick | vraies captures, cadrées hors bannière d'essai |
| 9 | 0:15.55 | 3.87 | proof | trustworthy | iris-open | cursor-carry | power2.out | up | paper+navy | locked | capture-saisie-prospect, step-chips | | keys | drop ; saisie réelle lettre par lettre |
| 10 | 0:19.42 | 3.88 | proof | bold | slide-up | graphic-match-color | back.out(1.2) | right | paper+green | dolly | capture-devis, vrai-PDF, check | | confirm | vrai calcul puis le PDF réellement généré sort du devis |
| 11 | 0:23.30 | 3.86 | proof | warm | drop-in | speed-ramp | power2.inOut | down | paper+orange | locked | capture-relance, banner | | ding | surprise: impact 23,30 → bannière orange « Relance prévue » |
| 12 | 0:27.16 | 0.48 | benefit | warm | motif:word-swap | motif:beat-cut | expo.out | left | navy+paper | dolly | footage-jardinier | | pop | rafale volontaire : un mot qui change à chaque temps (motif), le rythme du rap porte la répétition |
| 13 | 0:27.64 | 0.48 | benefit | warm | motif:word-swap | motif:beat-cut | expo.out | right | navy+paper | dolly | footage-plomberie | | pop | |
| 14 | 0:28.13 | 0.48 | benefit | warm | motif:word-swap | motif:beat-cut | expo.out | left | navy+paper | dolly | footage-nettoyage | | pop | accent 28,38 |
| 15 | 0:28.61 | 0.49 | benefit | warm | motif:word-swap | type-carry | expo.out | up | navy+paper | dolly | footage-enduit | | pop | « signés » passe dans le slogan |
| 16 | 0:29.10 | 1.93 | cta | bold | letter-stagger | motif:grid-close | power4.out | center | blue+navy | locked | logo, slogan, button | | reveal | la grille se referme |
| 17 | 0:31.03 | 1.97 | cta | warm | blur-in | hold-end | sine.out | center | navy+blue | push-in | lockup, mention | | sub-hit | impact final 31,04 ; tenue |

## The seven questions (answer before you build)
1. **Quoi, quel ton ?** La phrase ci-dessus, ton franc.
2. **Répétitions ?** Vérifiées par `variety_audit.py` (voir rapport).
3. **Sens des transitions** : whip = la journée qui s'accélère ; split-stack = les demandes qui s'empilent ; match-cut = le même geste sur un autre plan ; hold = « regardez » avant la révélation ; masque logo = la marque ouvre le produit ; push-through = on entre dans l'application ; iris = zoom sur l'action ; cursor-carry = le bouton cliqué devient l'écran suivant ; object-carry = le devis devient PDF ; match colour = le vert du PDF validé appelle l'orange de la relance ; speed-ramp = la journée reprend ; type-carry = le mot « signés » passe dans le slogan.
4. **Couleurs** : bleu nuit + papier, orange pour l'urgence (problème, relance), bleu une seule fois en plein (révélation), vert pour le PDF validé.
5. **Nouveau composant** : les vidéos filmées vivent dans des cases de la grille qui s'ouvrent module par module.
6. **Surprises** : gel à 7,3 s avant l'impact ; bannière orange sur l'impact 23,30.
7. **Film précédent** : v1 entièrement en interface reconstruite sur fond dégradé, téléphone 3D ; ici grille Swiss, vraies vidéos, vraies captures.

## Frames
### Frame 1 · Hook — un électricien au travail dans une case de grille ; « Des clients à rappeler ? » aligné à gauche ; temps fort : la case s'ouvre sur 0,07.
### Frame 2 · Reveal — la ligne bleue traverse la grille sur 7,82 ; « Devis974 » s'aligne sur les modules.
### Frame 3 · Proof — vraie saisie du prospect (captures réelles) sur le drop 15,55 ; puces « Nouveau prospect → Demande reçue → Client enregistré ».
### Frame 4 · CTA — logo + « Moins de paperasse, plus de chantiers signés. » + bloc « Découvrez Devis974 » + « Bientôt disponible à La Réunion ».
