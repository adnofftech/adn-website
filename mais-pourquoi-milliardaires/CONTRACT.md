# Contrat des modules de scènes 3D — vidéo « MAIS POURQUOI : et si on redistribuait tout ? »

Tu écris UN module `video/js/scenes/<id>.js` (et, si besoin, des fichiers d'aide `video/js/scenes/<id>_*.js`). **Ne modifie aucun autre fichier du projet** (sauf lire). D'autres agents travaillent en parallèle sur les autres modules.

## 1. Entrées de référence (à lire d'abord)
* `script.txt` : script DÉFINITIF — ne jamais le modifier. `timing.json` : fenêtre `[start,end]` de chacune des 18 scènes et mot à mot `[début, fin, mot]` (temps global en secondes, mêmes que la narration Léo, 83,4 s).
* `video/js/plan.js` : `MODULES[id]` (offset monde, scènes illustrées), `windowsOf(id)`, `onset(n, /regex/, k)` (début d'un mot dans la scène n), `startOf(n)`, `endOf(n)`.
* `video/js/shared.js` : `T`(three), palette, `makePerson`, `textPlane`, `glow`, `billMesh`, certificats, etc. `video/js/util.js` : `kf, eio, eout, eoutBack, sstep, lin, H` (hash déterministe). `video/js/tex.js` : textures canvas (billet générique fictif, sol, glow).
* `FACTS.md` (si présent) : seuls chiffres autorisés pour tout nombre affiché.
* Modèle de module : `video/js/scenes/wealth.js` (gabarit). Exemple de qualité visuelle visée : la première vidéo `../mais-pourquoi-imprimante/video/js/` (printer.js, bills.js, market.js, finance.js, world.js — à lire pour le style et les astuces de performance).

## 2. API du module (exports obligatoires)
```js
export const ID, OFFSET, WINDOWS;        // comme dans le gabarit
export function build()  -> THREE.Group  // tout le contenu + SES PROPRES LUMIÈRES (le groupe est masqué hors fenêtre => ses lumières aussi)
export function update(group, t)         // FONCTION PURE du temps global t (secondes). Jamais d'état entre deux appels.
export const SHOTS = [ {t, p:[x,y,z], l:[x,y,z], f, r, e}, ... ]   // caméra, coordonnées MONDE (ajoute OFFSET), e (facultatif) = easing appliqué à l'intervalle qui SUIT cette clé (de cette clé à la suivante), ex. eio ; sans e = linéaire
export const ENV = (t) => ({ bg: 0xRRGGBB, fog: densité })          // fond + brouillard
export const SHAKE = (t) => amplitude    // tremblement caméra (0 par défaut ; très rare, uniquement sur impacts voulus)
```
Contrat caméra : la PREMIÈRE clé de chaque fenêtre doit avoir `t = début de fenêtre` ; hors fenêtre, rien n'est évalué. Entre deux fenêtres du module, le montage fait un CUT.
Interpolation (`util.kf`) : entre clés `i` et `i+1`, valeur = v_i + (v_{i+1}-v_i)*e_i(u) (l'easing est celui de la clé de DÉPART). Pour un maintien, répète la clé.

## 3. Déterminisme (règle dure)
Pas de `Date.now`, `performance.now`, `Math.random`, `requestAnimationFrame`, fetch. Aléa = `H(i,k)` (hash seedé). Chaque image dépend UNIQUEMENT de `t`. Pas de textures chargées depuis le réseau : tout en canvas/géométrie procédurale.

## 4. Cadrage vertical 1080×1920 (9:16) et zones de sécurité
* Sujet principal dans la bande verticale y ∈ [260, 1250] px (soit ~14 % à ~65 % de la hauteur). Les sous-titres occupent y ∈ [1330, 1530] ; titres cinétiques HTML en haut (y ≈ 200–750) : **laisse de la place** dans la moitié haute pour du texte superposé, ne mets pas le détail important sous les sous-titres. Marge droite 150 px (boutons plateformes).
* FOV vertical 40–62°. Plein cadre, profondeur, parallaxe ; mouvement caméra continu mais LISIBLE (pas de vibration constante, pas de tremblement sauf impact voulu).

## 5. Budget de performance (rendu logiciel SwiftShader, ~0,4–1,5 s/image à 1080×1920)
* Matériaux `MeshLambertMaterial`/`MeshBasicMaterial` uniquement (pas de Standard/Physical), pas d'ombres, ≤ 3 lumières par module (hemisphere + 1 directionnelle + au plus 1 point), pas d'antialiasing, pas de post-traitement.
* `InstancedMesh` pour les répétitions (billets, blocs, silhouettes, points). Évite le sur-dessin massif (centaines de plans plein écran superposés). Géométrie visible ≲ 40 000 triangles.
* Mesure : le banc d'essai affiche le temps par image ; vise ≤ 1,5 s en moyenne, jamais > 3 s.

## 6. Direction artistique
Noir profond, vert monétaire, reflets métalliques, touches dorées (palette `PAL`). Billets génériques FICTIFS uniquement (`billTex` : « BANQUE DE FICTION »), jamais de reproduction de vrais billets. Personnes : style 3D chaleureux et respectueux (`makePerson`, teintes de peau variées), jamais de caricature. La lumière devient plus chaude quand l'argent aide (S4, S14), plus sombre/contrastée pour les risques (S5-S12).

## 7. Texte dans la 3D (diégétique)
Les gros titres cinétiques sont faits en HTML par le monteur : NE les fais PAS. Tu peux mettre dans la scène des textes diégétiques (chiffres sur écrans, étiquettes, factures, calendrier, panneaux) avec `textPlane`. Français, ton prudent (conditionnel pour les hypothèses). **Aucun chiffre inventé** : n'affiche que des valeurs de `FACTS.md` (avec source discrète) ou des symboles/maquettes clairement illustratifs (ex. « ×2 », barres sans valeur, « Qté »).

## 8. Synchronisation sur la voix (règle principale)
Chaque changement visuel majeur doit tomber sur le MOT correspondant (utilise `onset(n, /mot/)`). Ce que le spectateur voit doit correspondre à ce que Léo dit à cet instant. Ne laisse pas de visuel générique pendant une explication précise. Mouvement permanent mais au service du propos.
Prévois aussi : (a) **entrée** : à `t = début de fenêtre` la scène doit être déjà « en mouvement » avec l'élément de raccord indiqué dans ta mission ; (b) **sortie** : dans les 0,4 dernières secondes de chaque fenêtre, finis sur l'élément de raccord indiqué (le montage fait un cut/flash).

## 9. Test (obligatoire, itère jusqu'à ce que ce soit beau)
```bash
cd /home/user/adn-website/mais-pourquoi-milliardaires
node scripts/shot.mjs <id> 0.5,3,6,... /tmp/claude-0/shots-<id> <port-unique>   # PNG 1080x1920 ; ouvre-les avec Read pour les juger
```
Choisis un port unique à ton module (wealth 9101, life 9102, shares 9103, market 9104, impact 9105, durable 9106). Regarde TOUS les moments clés (≥ 2 images par phrase de ta mission, dont l'entrée et la sortie de chaque fenêtre), vérifie la lisibilité en miniature (portrait), l'absence de trous noirs, de géométrie traversant la caméra, de z-fighting, de texte illisible. Corrige. Teste aussi les bornes : t = début de fenêtre, début+0,05, fin−0,05.

## 10. Livrable (réponse finale, JSON via schéma)
Résumé honnête : pour chaque scène de ta mission, ce qui est montré et à quels instants (liste de `{t, mot, événement}`), temps de rendu moyen/max mesuré, problèmes connus restants, tout ce que tu n'as pas pu faire. Ne prétends pas avoir vérifié ce que tu n'as pas regardé.
