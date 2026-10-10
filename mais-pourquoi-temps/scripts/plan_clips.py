"""Plan de plans : découpe la narration (2 parties) en séquences d'environ 5 s à partir des temps de mots,
associe à chacune une idée de visuel (stickman 2D) et un prompt prêt à coller dans un générateur de vidéo.
sorties : PLAN_CLIPS.md, plan_clips.json, prompts_clips.txt (dans le dossier du projet)"""
import json, re, unicodedata, difflib, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OFF2 = 237.244082 + 0.25  # début de la partie 2 dans narration_leo_complete.mp3

def toks(w):
    t = unicodedata.normalize("NFD", w.lower().replace("’", "'")); t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return [x for x in re.split(r"[ ']+", re.sub(r"[^a-z0-9' ]", " ", t)) if x]

# 1) mot de référence -> temps (alignement sur la transcription locale)
allw = []
for n, off in ((1, 0.0), (2, OFF2)):
    ref = open(f"{ROOT}/texte_partie{n}.txt", encoding="utf-8").read().split()
    d = json.load(open(f"{ROOT}/audio/partie{n}_mots.json", encoding="utf-8"))
    hyp = [(t, s, e) for s, e, w in d["words"] for t in toks(w)]
    rt, owner = [], []
    for i, w in enumerate(ref):
        for t in toks(w): rt.append(t); owner.append(i)
    sm = difflib.SequenceMatcher(None, rt, [h[0] for h in hyp], autojunk=False)
    tm = {}
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op in ("equal", "replace") and j2 > j1:
            for k in range(i1, i2):
                j = min(j1 + int((k - i1) * (j2 - j1) / max(1, i2 - i1)), j2 - 1); w = owner[k]
                s, e = hyp[j][1], hyp[j][2]; tm[w] = (min(tm.get(w, (s, s))[0], s), max(tm.get(w, (e, e))[1], e))
    last = 0.0
    for i, w in enumerate(ref):
        if i not in tm:
            nxt = next((tm[j][0] for j in range(i + 1, len(ref)) if j in tm), last + 0.3); tm[i] = (last, min(nxt, last + 0.3))
        last = tm[i][1]
    allw += [(w, tm[i][0] + off, tm[i][1] + off) for i, w in enumerate(ref)]

# 2) séquences de ~5 s sur frontières de phrase
sents, cur = [], []
for w in allw:
    cur.append(w)
    if re.search(r"[.?!…]$", w[0]): sents.append(cur); cur = []
if cur: sents.append(cur)
dur = lambda c: c[-1][2] - c[0][1]
segs, cur = [], []
for s in sents:
    if cur and dur(cur + s) > 6.4: segs.append(cur); cur = []
    cur += s
    if dur(cur) >= 4.2: segs.append(cur); cur = []
if cur:
    if segs and dur(cur) < 2.5 and dur(segs[-1] + cur) < 7.5: segs[-1] += cur
    else: segs.append(cur)
assert len(segs) == 92, len(segs)

# la séquence 71 (13 s) est coupée en 3 clips
def split71(c):
    i1 = next(i for i, w in enumerate(c) if w[0].endswith(":")); i2 = next(i for i, w in enumerate(c) if w[0].startswith("plat"))
    return [c[:i1 + 1], c[i1 + 1:i2 + 1], c[i2 + 1:]]

# 3) idées de visuels : (chapitre, idée FR, scène EN)
V = {
1: ("Intro", "Le stickman adulte rêveur ; dans une bulle de pensée, un petit stickman enfant court dans un champ sous un grand soleil.", "the stickman sits dreamily, a thought bubble pops above his head showing a tiny child stickman running through a sunny meadow under a huge smiling sun"),
2: ("Intro", "Des pages de calendrier s'envolent en accéléré, de janvier à juin ; le stickman est surpris.", "calendar pages flip and fly off at high speed from January to June while the stickman watches with a surprised face"),
3: ("Intro", "Il cligne des yeux : un sapin de Noël apparaît d'un coup ; puis une horloge qui tourne à rythme parfaitement régulier.", "the stickman blinks hugely, a Christmas tree suddenly pops in, then a round clock ticks at a perfectly steady pace"),
4: ("Intro", "Le stickman perplexe avec des points d'interrogation ; une grande horloge murale tourne normalement et affiche une coche verte.", "the puzzled stickman with floating question marks next to a big wall clock that ticks normally and shows a green check mark"),
5: ("Le cerveau", "La tête du stickman devient transparente : un petit cerveau avec des engrenages, un œil, des albums de souvenirs.", "the stickman's head turns transparent revealing a cute brain with small gears, an eye and little memory albums"),
6: ("Le cerveau", "Une balance : d'un côté une horloge, de l'autre un album photo ; elle penche vers l'album.", "a balance scale with a clock on one side and a photo album on the other, it tips toward the album"),
7: ("Enfance", "Un petit stickman enfant (casquette) découvre un terrain de jeux, yeux écarquillés, objets qui apparaissent.", "a small child stickman with a cap discovers a colorful playground with wide eyes, new objects popping up around him"),
8: ("Enfance", "Une horloge-sablier d'où débordent plein d'icônes : ballon, cerf-volant, coccinelle, glace.", "an hourglass overflowing with tiny icons: ball, kite, ladybug, ice cream, all bouncing out"),
9: ("Enfance", "L'enfant traverse une flaque comme un fleuve en pirate ; puis un volet de transition vers le stickman adulte.", "the child stickman crosses a puddle like a river in a pirate pose, then a wipe transition reveals the adult stickman"),
10: ("Journée adulte", "Le stickman adulte répète en boucle : réveil, téléphone, café, sur un tapis roulant, les yeux mi-clos.", "the adult stickman repeats the same morning loop on a conveyor belt: alarm clock, phone, coffee, half-closed eyes, autopilot"),
11: ("Journée adulte", "Le jour (soleil puis lune) s'évapore en vapeur au-dessus du stickman qui regarde ses mains vides.", "a sun-to-moon day bubble evaporates into steam above the stickman who looks at his empty hands"),
12: ("Journée adulte", "Deux étagères : celle de l'enfant pleine de photos colorées, celle de l'adulte presque vide, grise.", "two shelves: a child's shelf full of colorful photos, an adult's shelf almost empty and grey"),
13: ("Horloge interne", "Une clé dorée apparaît ; le stickman ouvre sa tête : une horloge bancale, dessinée à la main.", "a golden key appears, the stickman opens a hatch in his head and finds a wobbly hand-drawn clock"),
14: ("Horloge interne", "Dans la tête, un atelier bricolé : un œil, un cœur, un muscle, un album, assemblés avec du scotch.", "inside his head a tiny workshop assembling an eye, a heart, a muscle and a photo album with duct tape"),
15: ("Attention", "Le stickman, menton dans la main, fixe une horloge dont la trotteuse avance au ralenti ; une boule d'herbe sèche passe.", "the stickman rests his chin on his hand staring at a clock whose second hand moves in slow motion, a tumbleweed rolls by"),
16: ("Attention", "Il joue à fond à un jeu vidéo ; derrière lui l'horloge tourne comme une folle, sans qu'il regarde.", "the stickman is deeply absorbed in a video game while the clock behind him spins wildly unnoticed"),
17: ("Attention", "Un faisceau de lampe de poche, parti de ses yeux, passe de l'horloge au jeu ; l'horloge s'estompe.", "a flashlight beam from his eyes slides from the clock to the game, the clock fades into the background"),
18: ("William James", "Un stickman psychologue à lunettes rondes et moustache devant un tableau ; une photocopieuse sort une copie floue.", "a stickman psychologist with round glasses and a mustache at a chalkboard, a photocopier next to him prints a blurry copy"),
19: ("William James", "Il construit avec des briques de couleurs un sablier en forme de cerveau ; une loupe choisit les briques.", "he builds a brain-shaped hourglass out of colorful bricks while a magnifying glass picks which bricks to use"),
20: ("Nouveauté", "Le stickman vieillit sur un escalier d'âges ; une étoile scintillante « nouveau » apparaît.", "the stickman climbs a staircase of ages getting older, a sparkling star appears at the top"),
21: ("Nouveauté", "L'enfant rencontre un chien, un escargot, une grosse boîte ; étincelles de surprise.", "the child stickman meets a dog, a snail and a big box, surprise sparks around his head"),
22: ("Nouveauté", "La tête de l'enfant : ampoules, fils qui relient des icônes ; des cadeaux « premières fois » s'ouvrent.", "the child's head lights up with bulbs and strings linking icons, gift boxes of first times open around him"),
23: ("Prévisible", "Un chemin droit balisé de panneaux identiques, tout en gris ; le stickman le suit.", "a straight path with identical grey signposts, the stickman walks along it"),
24: ("Prévisible", "Il marche les yeux fermés sur une piste en boucle, gestes de robot ; un levier « pilote auto » sur ON.", "he walks with closed eyes on a looping track doing robot-like gestures, an autopilot lever clicks to ON"),
25: ("Prévisible", "Une batterie qui reste verte ; puis des jours-cartes identiques et grises empilés en paquet.", "a battery icon stays green, then identical grey day-cards stack up into a deck"),
26: ("Deux trajets", "Le stickman dans une ville inconnue et colorée : façades, notes de musique, passants.", "the stickman strolls through an unfamiliar colorful city: facades, music notes, passers-by"),
27: ("Deux trajets", "Le même stickman sur son trajet gris habituel ; il arrive avec une bulle de parole vide.", "the same stickman on his dull grey daily commute, arriving with an empty speech bubble"),
28: ("Deux trajets", "Deux minuteurs identiques ; puis deux bocaux : l'un plein de billes colorées, l'autre presque vide.", "two identical timers, then two jars: one full of colorful marbles, the other nearly empty"),
29: ("Wittmann", "Un stickman chercheur en blouse avec un bloc-notes observe un sujet relié à des capteurs : corps, cœur, cerveau qui brillent.", "a researcher stickman in a lab coat with a clipboard observes a subject wired with sensors, body heart and brain glowing"),
30: ("Wittmann", "Plusieurs cadrans (attention, sensations, contexte) qui marquent chacun une heure différente.", "several dials, each showing a different time, representing attention, body sensations and context"),
31: ("Nuance", "Le stickman lève la main (« attention ») avec un triangle d'alerte ; une ampoule « une seule réponse » barrée, remplacée par des pièces de puzzle.", "the stickman raises a hand with a warning triangle, a single-answer lightbulb is crossed out and replaced by several puzzle pieces"),
32: ("Nuance", "Deux pièces de puzzle s'emboîtent : « sur le moment » (chronomètre) et « après coup » (rétroviseur/album).", "two puzzle pieces snap together: one with a stopwatch (in the moment), one with a rewind arrow and album (afterwards)"),
33: ("Paradoxe", "Un chronomètre qui s'étire puis rétrécit quand le stickman se retourne avec effet de rembobinage.", "a stopwatch stretches long then shrinks as the stickman looks back with a rewind effect"),
34: ("Salle d'attente", "Le stickman entre dans une salle d'attente banale : chaises alignées, plante verte.", "the stickman walks into a plain waiting room with lined-up chairs and a potted plant"),
35: ("Salle d'attente", "Il regarde sa montre sans cesse ; chaque coup d'œil agrandit l'horloge ; goutte de sueur.", "he keeps checking his wristwatch, every glance makes the clock grow bigger, a sweat drop appears"),
36: ("Salle d'attente", "Une horloge élastique qui s'étire ; puis une bulle de souvenir vide avec une petite boule de poussière.", "an elastic clock stretches, then a memory bubble appears empty with a tiny dust bunny inside"),
37: ("Salle d'attente", "Un très long ruban de temps contre une minuscule boîte à souvenirs vide.", "a very long ribbon of time next to a tiny empty memory box"),
38: ("Voyage", "Le stickman avec un sac à dos passe en accéléré devant montagne, plage, ville, nouveaux amis.", "the stickman with a backpack quickly passes a mountain, a beach, a city and new friends"),
39: ("Voyage", "Les jours filent sur un calendrier pendant qu'il est occupé ; il rentre chez lui avec sa valise et regarde la route derrière.", "calendar days fly by while he is busy, then he arrives home with his suitcase and looks back down the road"),
40: ("Voyage", "Une bulle de souvenir gigantesque d'où jaillissent des polaroïds ; il est émerveillé.", "a gigantic memory bubble bursts with polaroid photos, the stickman looks amazed"),
41: ("Voyage", "Deux frises : une semaine normale (barre grise fine) contre le voyage (barre longue, dense, colorée).", "two timelines: a normal week as a thin grey bar versus the trip as a long dense colorful bar full of photos"),
42: ("Ornstein", "Un stickman psychologue en nœud papillon devant des piles de cartes d'infos qui entrent dans un entonnoir en forme de tête ; une jauge monte.", "a stickman psychologist with a bow tie feeds piles of information cards into a head-shaped funnel while a gauge rises"),
43: ("Ornstein", "Un boulier barré dans le cerveau ; une étagère de souvenirs dont l'épaisseur change la durée perçue.", "an abacus crossed out inside the brain, a shelf of memories whose thickness changes a perceived duration bar"),
44: ("Deux questions", "Deux bulles à points d'interrogation : « pendant » (chronomètre) et « après » (rétroviseur).", "two speech bubbles with question marks: one with a stopwatch icon, one with a rear-view mirror icon"),
45: ("Été vs année", "Deux engrenages qui ne s'engrènent pas ; puis un été d'enfance sur une plage face à une année de bureau.", "two gears that do not mesh, then a childhood summer beach scene versus a grey office year"),
46: ("Souvenirs reconstruits", "Deux règles parfaites barrées ; le stickman assemble un collage de morceaux de souvenirs.", "two perfect rulers crossed out, the stickman assembles a collage from scraps of memories"),
47: ("Repères d'enfance", "Un chemin sinueux jalonné de drapeaux : cartable, gâteau, cartons de déménagement, copain, télescope.", "a winding path marked with flags: school bag, birthday cake, moving boxes, a new friend, a telescope"),
48: ("Repères d'enfance", "Le chemin plein de drapeaux, puis un autre chemin fait de semaines grises identiques.", "the path full of flags, then a different path made of identical grey weeks"),
49: ("Semaines répétitives", "Succession rapide d'icônes : cahier, ordinateur, bus, écran de téléphone, café.", "a rapid sequence of icons: notebook, laptop, bus, phone screen, coffee cup"),
50: ("Semaines répétitives", "Des cartes de semaines identiques glissent et leurs couleurs se mélangent comme de la peinture.", "identical week cards slide and their colors blend together like paint"),
51: ("Semaines répétitives", "Deux lundis qui fusionnent ; un accordéon se replie en un petit bloc dans la tête.", "two Mondays merge, a long accordion folds into a compact block inside the stickman's head"),
52: ("Un cinquième / cinquantième", "Une frise de vie : le stickman vieillit pendant qu'une petite part « une année » rétrécit.", "a life timeline where the stickman ages while a slice representing one year keeps shrinking"),
53: ("Un cinquième / cinquantième", "Camembert de l'enfant : une année = grosse part ; camembert du vieux stickman : très fine part.", "a pie chart for the child where one year is a big slice, a pie chart for the old stickman where one year is a very thin slice"),
54: ("Un cinquième / cinquantième", "Le stickman hoche la tête, ampoule ; une loupe compare les deux parts.", "the stickman nods with a lightbulb while a magnifying glass compares the two slices"),
55: ("Métaphore", "Même schéma, un point d'interrogation s'affiche ; le stickman secoue la tête, balance incertaine.", "the same chart with a question mark appearing, the stickman shakes his head, an uncertain scale wobbles"),
56: ("Métaphore", "Une équation simple effacée au tableau, remplacée par un enchevêtrement de flèches, d'engrenages, d'émotions.", "a simple equation is wiped off a board and replaced by a tangle of arrows, gears and emotion icons"),
57: ("Métaphore", "Une tablette de pierre « loi » barrée ; le stickman tient une lanterne qui éclaire (métaphore).", "a stone tablet 'law' is crossed out, the stickman holds a lantern that illuminates the scene instead"),
58: ("Stress", "Le stickman nerveux tient son téléphone, gouttes de sueur, sirène d'alerte, yeux grands ouverts.", "the nervous stickman clutches his phone waiting for news, sweat drops, a flashing alert siren, wide eyes"),
59: ("Stress", "Gros plan sur une trotteuse ; les yeux du stickman suivent chaque tic avec des lignes de concentration.", "extreme close-up of a second hand, the stickman's eyes track every tick with focus lines"),
60: ("Stress", "Stickman épuisé, cernes ; les jours se fondent dans un brouillard, photos floues.", "an exhausted stickman with eye bags, days dissolving into fog, memory photos blurry"),
61: ("Émotions", "Le stickman sous un poids : une jauge de pression se divise en deux issues ; puis un cœur qui s'illumine.", "the stickman under a heavy weight, a pressure gauge splits into two outcomes, then a heart glows"),
62: ("Émotions", "Ralenti : le stickman saute de surprise à une fête, confettis suspendus ; la trotteuse ralentit.", "slow motion: the stickman jumps in surprise at a party, confetti hangs in the air, the second hand slows"),
63: ("Émotions", "Une caméra de cinéma dans la tête ; une pellicule avec des images supplémentaires barrées.", "a film camera inside his head, a film strip with extra frames crossed out"),
64: ("Émotions", "Un escargot-horloge (ralenti) et une photo détaillée : deux icônes qui se chevauchent comme un diagramme de Venn.", "a snail-clock for slow motion and a detailed photo overlap like a Venn diagram while the stickman points at them"),
65: ("Draaisma", "Un stickman chercheur entouré d'albums photo et de journaux intimes, feuilletant le journal d'une vie.", "a researcher stickman surrounded by photo albums and diaries, flipping through the diary of a life"),
66: ("Draaisma", "Devant un écran de cinéma : une bobine complète barrée ; seules quelques scènes clignotent.", "in front of a cinema screen a full film reel is crossed out, only a few scenes flash"),
67: ("Draaisma", "Il épingle des polaroïds sur un tableau de liège et les relie avec une ficelle pour raconter une histoire.", "he pins polaroid scenes on a corkboard and connects them with string into a story"),
68: ("Draaisma", "Un tableau de liège plein d'épingles pour la période riche (étirée) contre quelques épingles ailleurs.", "a corkboard with many pins for the eventful period (stretched) versus very few pins elsewhere"),
69: ("Conseils", "Le stickman a une idée (ampoule) et montre du doigt un chemin lumineux avec un panneau.", "the stickman gets an idea with a lightbulb and points to a glowing path with a signpost"),
70: ("Conseils", "Des blocs de semaines grises fondent en une seule flaque grise.", "grey week blocks melt together into one grey puddle"),
"71a": ("Conseils", "Les blocs gris, puis un bloc coloré inséré avec des étincelles : un nouveau repère.", "grey blocks in a row, then a colorful block is inserted with sparkles as a new landmark"),
"71b": ("Conseils", "Trois vignettes rapides : apprendre (livre, crayon), visiter (épingle de carte), cuisiner (poêle).", "three quick vignettes: learning (book and pencil), visiting (map pin), cooking (frying pan)"),
"71c": ("Conseils", "Rencontrer du monde (poignée de main), changer d'itinéraire (flèches qui dévient), se consacrer à un projet (le stickman construit/peint).", "three quick vignettes: meeting people (handshake), changing route (arrows diverting), devoting himself to a project (the stickman paints or builds)"),
72: ("Conseils", "Le stickman court sur un tapis roulant après une étoile « nouveau », essoufflé ; il s'arrête, épuisé.", "the stickman runs on a treadmill chasing a glowing star, out of breath, then stops exhausted"),
73: ("Conseils", "Il essaie de pousser l'aiguille de l'horloge ou de retenir le balancier ; rien ne bouge ; haussement d'épaules.", "he tries to push back the clock hand and hold the pendulum but nothing budges, he shrugs"),
74: ("Conseils", "Il dissipe un brouillard gris (automatismes) avec une lampe : un moment net et ensoleillé apparaît.", "he clears a grey fog of habits with a flashlight and a vivid sunny picnic moment appears"),
75: ("Exercice du soir", "Le stickman dans son lit avec un carnet ; trois bulles lumineuses flottent au-dessus de lui.", "the stickman in bed with a notebook, three glowing bubbles float above him"),
76: ("Exercice du soir", "Bulles vagues et grises barrées ; puis des bulles concrètes : phrase, ampoule+livre, épingle de lieu, visage qui rit.", "vague grey bubbles are crossed out, replaced by concrete ones: a speech bubble, a lightbulb with a book, a map pin, a laughing face"),
77: ("Exercice du soir", "Il met des lunettes-loupes et les détails de la pièce deviennent nets.", "he puts on magnifier glasses and details of the room sharpen into focus"),
78: ("Présence", "Le stickman savoure un fruit ou une glace les yeux fermés ; étincelles de goût.", "the stickman savors a piece of fruit or an ice cream with closed eyes, taste sparkles"),
79: ("Présence", "Deux stickmen discutent ; l'un range son téléphone dans un tiroir et écoute en se penchant ; puis un nouveau lieu.", "two stickmen chat, one puts his phone face down in a drawer and leans in to listen, then a new place appears"),
80: ("Présence", "Il s'arrête de courir et observe les détails (oiseau, fenêtre) ; un nuage « la suite » se dissipe ; un seul projecteur.", "he stops sprinting and observes details like a bird and a window, a 'what's next' cloud dissolves, a single spotlight remains"),
81: ("Présence", "Il choisit où diriger sa lampe (attention) ; puis un nuage « problème » s'envole ; il se détend.", "he chooses where to aim his flashlight of attention, then a 'problem' cloud floats away and he relaxes"),
82: ("Rassurer", "Un groupe de stickmen divers avec des horloges de vitesses différentes, tous bien, tous souriants.", "a diverse group of stickmen each with a clock running at a different speed, all fine and smiling"),
83: ("Rassurer", "Le stickman rentre par sa rue familière ; son cerveau tamponne des coches sur les objets connus.", "the stickman walks home along a familiar street while his brain stamps check marks on known objects"),
84: ("Conclusion", "Un éclair traverse un calendrier ; le stickman à la fenêtre, menton en main ; deux calendriers comparés avec un point d'interrogation.", "a lightning bolt crosses a calendar, the stickman at a window strokes his chin, two calendars are compared with a question mark"),
85: ("Conclusion", "Il raconte une histoire à un ami, calendrier et téléphone mis de côté ; puis bulle vers lui-même plus âgé qui sourit à un souvenir.", "he tells a story to a friend with phone and calendar set aside, then a thought bubble shows his older self smiling at a memory"),
86: ("Conclusion", "Un métronome ou une horloge à battement calme et constant.", "a metronome with a calm steady swing next to a regular clock"),
87: ("Conclusion", "Des traces de pas lumineuses derrière le stickman sur une plage ; les plus profondes scintillent.", "glowing footprints trail behind the stickman along a beach, the deepest ones sparkle"),
88: ("Conclusion", "L'enfant dans un été sans fin : colline, soleil qui ne se couche pas, premier vélo, première éclaboussure.", "the child in an endless summer: rolling hills, a sun that never sets, first bike ride, first splash in the sea"),
89: ("Conclusion", "Le stickman adulte trouve une étincelle/un coffre lumineux dans sa poitrine et sourit.", "the adult stickman finds a glowing spark in his chest and smiles"),
90: ("Conclusion", "Il regarde sa rue familière avec des coches de reconnaissance, se frotte les yeux : les couleurs éclosent, tout est neuf.", "he looks at his familiar street with recognition check marks, rubs his eyes and the colors bloom as if everything were new"),
91: ("Final", "Des pages de calendrier défilent vite, mais l'horloge reste calme ; le stickman hausse les épaules en souriant.", "calendar pages flip quickly but the clock stays calm, the stickman shrugs with a smile"),
92: ("Final", "Le stickman tourne la tête : à côté de lui, une petite fleur/porte lumineuse qu'il n'avait jamais vue ; lever de soleil chaud, poussée lente.", "the stickman turns his head and notices a little glowing flower or door right beside him that he never saw, warm sunrise, slow push-in, joyful curiosity"),
}
COLORS = ["warm yellow", "soft blue", "mint green", "peach", "lavender", "light coral", "pale teal", "sand beige"]
STYLE = ("Simple 2D animated stickman, hand-drawn flat vector style, thick black outline, round white head with two dot eyes and expressive eyebrows, "
         "thin line limbs, minimal props, smooth cartoon animation, 16:9, no on-screen text, no logos, no watermark")

clips = []
for i, s in enumerate(segs, 1):
    parts = split71(s) if i == 71 else [s]
    for k, p in enumerate(parts):
        key = f"71{'abc'[k]}" if i == 71 else i
        chap, fr, en = V[key]
        clips.append({"id": str(key), "debut": round(p[0][1], 2), "fin": round(p[-1][2], 2), "duree_voix": round(p[-1][2] - p[0][1], 2),
                      "chapitre": chap, "texte": " ".join(w[0] for w in p), "visuel_fr": fr, "scene_en": en})
chaps = list(dict.fromkeys(c["chapitre"] for c in clips))
for c in clips:
    bg = COLORS[chaps.index(c["chapitre"]) % len(COLORS)]
    c["prompt_en"] = f"{STYLE}. Pastel {bg} background. {c['scene_en'][0].upper() + c['scene_en'][1:]}. 5 seconds, gentle camera push-in, same stickman character as the reference."
json.dump(clips, open(f"{ROOT}/plan_clips.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
mmss = lambda t: f"{int(t // 60)}:{t % 60:04.1f}"
md = ["# Plan de plans — mini-vidéos de 5 s (stickman 2D)", "",
      f"{len(clips)} clips couvrant les 8 min 07 de narration (`audio/narration_leo_complete.mp3`). Chaque clip correspond à une phrase ou deux ; durée de voix moyenne ≈ 5 s.",
      "Hypothèses à confirmer : format 16:9 (vidéo YouTube), personnage = le stickman 2D de ton projet (à fournir comme référence au générateur), pas de texte à l'écran dans les clips (les générateurs écrivent mal), fond pastel par chapitre.", "",
      "## Bloc de style (à mettre en tête de chaque prompt)", "", f"> {STYLE}.", "", "## Clips", ""]
last = None
for c in clips:
    if c["chapitre"] != last: md += [f"### {c['chapitre']}", ""]; last = c["chapitre"]
    md += [f"**Clip {c['id']}** · {mmss(c['debut'])} → {mmss(c['fin'])} ({c['duree_voix']:.1f} s de voix)", f"> « {c['texte']} »", "", f"* Visuel : {c['visuel_fr']}", f"* Prompt : `{c['prompt_en']}`", ""]
open(f"{ROOT}/PLAN_CLIPS.md", "w", encoding="utf-8").write("\n".join(md))
open(f"{ROOT}/prompts_clips.txt", "w", encoding="utf-8").write("\n\n".join(f"[clip {c['id']} | {mmss(c['debut'])}-{mmss(c['fin'])}]\n{c['prompt_en']}" for c in clips) + "\n")
print(len(clips), "clips ;", sum(c["duree_voix"] for c in clips) / len(clips), "s de voix en moyenne ; plus longs :", sorted((c["duree_voix"], c["id"]) for c in clips)[-4:])
