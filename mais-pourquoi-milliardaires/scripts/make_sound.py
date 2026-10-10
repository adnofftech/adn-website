"""Sound design synthétisé (numpy) — MAIS POURQUOI : et si on redistribuait tout ?
Génère  video/audio/bed.wav  (musique + SFX, ducké sous la voix)  et  audio/final_mix.wav  (voix Léo + bed, niveaux finaux).
Tous les événements sont calés sur les mots réels de la narration (timing.json). Déterministe (seed fixe), aucune ressource externe."""
import numpy as np, wave, json, subprocess, os, re, unicodedata
SR = 44100
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = json.load(open(f"{ROOT}/timing.json"))
DUR = T["videoDuration"]; N = int(DUR * SR)
rng = np.random.default_rng(11)
mus = np.zeros(N); sfx = np.zeros(N)

# ------------------------------------------------------------------ outils
def strip(x): return "".join(c for c in unicodedata.normalize("NFD", x) if unicodedata.category(c) != "Mn")
def norm(x): return re.sub(r"[^a-z0-9]", "", strip(x.lower()))
def on(n, pat, k=0):
    pat = strip(pat)
    h = [w for w in T["scenes"][n - 1]["words"] if re.search(pat, norm(w[2]))]
    if not h: raise SystemExit(f"mot introuvable: scène {n} /{pat}/")
    return h[k][0]
def add(buf, sig, at, gain=1.0):
    i = int(at * SR); j = min(N, i + len(sig))
    if 0 <= i < N and j > i: buf[i:j] += sig[: j - i] * gain
def env(n, a=0.005, r=0.1):
    e = np.ones(n); na = max(1, int(a * SR)); nr = max(1, int(r * SR)); e[:na] = np.linspace(0, 1, na); e[-nr:] *= np.linspace(1, 0, nr); return e
def noise(d): return rng.standard_normal(int(d * SR))
def lpf(x, fc): X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X[f > fc] = 0; return np.fft.irfft(X, len(x))
def hpf(x, fc): X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X[f < fc] = 0; return np.fft.irfft(X, len(x))
def bp(x, lo, hi): return hpf(lpf(x, hi), lo)
def kf(t, keys):
    if t <= keys[0][0]: return keys[0][1]
    for (t0, v0), (t1, v1) in zip(keys, keys[1:]):
        if t < t1: return v0 + (v1 - v0) * (t - t0) / (t1 - t0)
    return keys[-1][1]
def curve(keys):  # courbe de gain échantillonnée
    tt = np.arange(N) / SR; xs = [k[0] for k in keys]; ys = [k[1] for k in keys]; return np.interp(tt, xs, ys)

# ------------------------------------------------------------------ sons
def impact(d=1.2, f0=60, amp=1.0):
    n = int(d * SR); t = np.arange(n) / SR
    return amp * (np.sin(2 * np.pi * (f0 + 90 * np.exp(-t * 18)) * t) * np.exp(-t * 4.5) + lpf(noise(d), 900) * np.exp(-t * 9) * 0.6)
def whoosh(d=0.8, up=True, lo=300, hi=6000):
    n = int(d * SR); x = bp(noise(d), lo, hi); s = np.linspace(0, 1, n) ** 2 if up else np.linspace(1, 0, n) ** 2
    return x * np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5 * (0.3 + 0.7 * s)
def riser(d=2.0, hi=9000):
    n = int(d * SR); t = np.arange(n) / SR; return bp(noise(d), 400, hi) * (t / d) ** 3 * 0.9
def tick(f=2400, d=0.04, amp=0.6):
    n = int(d * SR); t = np.arange(n) / SR; return amp * np.sin(2 * np.pi * f * t) * np.exp(-t * 120)
def ping(f=1760, amp=0.5, d=0.5):
    n = int(d * SR); t = np.arange(n) / SR; return amp * (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.01 * t)) * np.exp(-t * 9)
def thud(f=90, d=0.25, amp=0.8):
    n = int(d * SR); t = np.arange(n) / SR; return amp * np.sin(2 * np.pi * (f + 60 * np.exp(-t * 40)) * t) * np.exp(-t * 14) + 0.3 * amp * lpf(noise(d), 600) * np.exp(-t * 30)
def rustle(d=0.4, amp=0.5):
    n = int(d * SR); x = hpf(noise(d), 2500) * (0.5 + 0.5 * np.sin(np.linspace(0, 40 * np.pi, n)) ** 2); return amp * x * env(n, 0.01, 0.15)
def clack(amp=0.7):
    n = int(0.09 * SR); t = np.arange(n) / SR; return amp * (bp(noise(0.09), 1200, 5000) * np.exp(-t * 70) + np.sin(2 * np.pi * 220 * t) * np.exp(-t * 60) * 0.6)
def vault_open(d=1.6):
    n = int(d * SR); t = np.arange(n) / SR; creak = bp(noise(d), 120, 900) * (0.5 + 0.5 * np.sin(2 * np.pi * 7 * t)) * np.sin(np.pi * t / d); boom = np.sin(2 * np.pi * 48 * t) * np.exp(-t * 2.2) * 0.8; return 0.7 * creak + boom
def vault_clunk(): n = int(0.5 * SR); t = np.arange(n) / SR; return thud(70, 0.5, 1.0) + 0.5 * bp(noise(0.5), 300, 2500) * np.exp(-t * 18)
def cutoff(d=0.9):
    n = int(d * SR); t = np.arange(n) / SR; f = 600 * np.exp(-t * 5); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.5) * 0.6 + lpf(noise(d), 1500) * np.exp(-t * 6) * 0.35
def fall(d=1.1):  # glissando descendant (chute du graphique)
    n = int(d * SR); t = np.arange(n) / SR; f = 900 * np.exp(-t * 2.6) + 60; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6) * 0.7
def sparkle(f, amp=0.35): return ping(f, amp, 0.35)
def chord(freqs, d, amp=0.3, warm=True):
    n = int(d * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for f in freqs:
        for det in (0.996, 1.004): x += np.sin(2 * np.pi * f * det * t)
    return lpf(x / (2 * len(freqs)), 1800 if warm else 1100) * amp * env(n, 0.6, 1.2)
def kick(): n = int(0.3 * SR); t = np.arange(n) / SR; return np.sin(2 * np.pi * (45 + 110 * np.exp(-t * 30)) * t) * np.exp(-t * 9)
def hat(o=False): d = 0.18 if o else 0.05; n = int(d * SR); return hpf(noise(d), 7000) * np.exp(-np.arange(n) / SR * (22 if o else 90)) * 0.5
def bassn(f, d): n = int(d * SR); t = np.arange(n) / SR; return lpf((2 * ((f * t) % 1) - 1) * 0.6 + np.sin(2 * np.pi * f * t) * 0.5, 600) * env(n, 0.005, 0.08)
def pluck(f, d=0.4): n = int(d * SR); t = np.arange(n) / SR; return lpf(np.sign(np.sin(2 * np.pi * f * t)) * np.exp(-t * 9), 2500) * 0.5

# ------------------------------------------------------------------ musique (sections calées sur les scènes)
S = {s["n"]: (s["start"], s["end"]) for s in T["scenes"]}
BPM = 100; beat = 60 / BPM; bar = 4 * beat
MIN = [[220, 261.6, 329.6], [174.6, 220, 261.6], [146.8, 174.6, 220], [164.8, 207.7, 246.9]]      # Am F Dm E
MAJ = [[261.6, 329.6, 392], [196, 246.9, 293.7], [220, 261.6, 329.6], [174.6, 220, 261.6]]         # C G Am F
ROOTS_MIN = [55, 43.65, 36.7, 41.2]; ROOTS_MAJ = [65.4, 49, 55, 43.65]
ARP_MIN = [220, 261.6, 329.6, 392, 329.6, 261.6, 220, 196]; ARP_MAJ = [261.6, 329.6, 392, 523.3, 392, 329.6, 261.6, 329.6]
warm_spans = [(S[4][0], S[5][0]), (S[13][0], S[15][0]), (S[17][0] + 3.0, S[18][0] + 1.5)]
is_warm = lambda t: any(a <= t < b for a, b in warm_spans)
# gains par couche
g_pad = curve([(0, 0.0), (0.4, 0.6), (S[4][0], 0.8), (S[5][0] - 0.02, 0.8), (S[5][0], 0.0), (S[5][0] + 0.6, 0.0), (S[5][0] + 1.4, 0.5), (S[8][0], 0.6), (S[10][0] + 2.2, 0.5), (S[11][0], 0.45), (S[13][0], 0.7), (S[15][0], 0.4), (S[16][0], 0.6), (S[17][0], 0.7), (S[18][0] - 0.3, 0.9), (S[18][0] + 1.5, 0.7), (DUR - 0.6, 0.0)])
g_kick = curve([(0, 0.0), (1.0, 0.0), (1.4, 0.8), (S[3][0] + 0.2, 0.8), (S[4][0], 0.0), (S[8][0] + 0.5, 0.0), (S[8][0] + 0.7, 0.55), (S[10][0] + 1.9, 0.7), (S[10][0] + 1.95, 0.0), (S[17][0] + 5.0, 0.0), (S[17][0] + 5.2, 0.5), (S[18][0] - 0.05, 0.5), (S[18][0], 0.0)])
g_arp = curve([(0, 0.0), (S[1][0] + 2.0, 0.0), (S[1][0] + 3.0, 0.6), (S[2][0], 0.6), (S[3][0] + 5.4, 0.6), (S[4][0], 0.8), (S[5][0], 0.0), (S[13][0], 0.0), (S[13][0] + 0.4, 0.7), (S[15][0] - 0.1, 0.7), (S[15][0], 0.0), (S[16][0], 0.0), (S[16][0] + 2.5, 0.5), (S[18][0] - 0.1, 0.8), (S[18][0] + 0.4, 0.0)])
g_bass = curve([(0, 0.0), (1.6, 0.0), (2.0, 0.7), (S[4][0], 0.0), (S[6][0] - 0.2, 0.0), (S[6][0], 0.5), (S[10][0] + 1.9, 0.6), (S[10][0] + 1.95, 0.0), (S[11][0] + 1.0, 0.4), (S[13][0], 0.0), (S[17][0] + 5.2, 0.0), (S[17][0] + 5.4, 0.5), (S[18][0], 0.0)])
nb = int(DUR / bar) + 1
for b in range(nb):
    t0 = b * bar; warm = is_warm(t0); chs = MAJ if warm else MIN; rt = ROOTS_MAJ if warm else ROOTS_MIN; c = b % 4
    add(mus, chord(chs[c], bar, 0.26, warm), t0, float(g_pad[min(N - 1, int(t0 * SR))]))
    for k in range(8):
        tb = t0 + k * beat / 2
        ga = float(g_arp[min(N - 1, int(tb * SR))])
        if ga > 0.02: add(mus, pluck((ARP_MAJ if warm else ARP_MIN)[k] * (1 if c % 2 == 0 else 1.122)), tb, 0.26 * ga)
        gb = float(g_bass[min(N - 1, int(tb * SR))])
        if gb > 0.02: add(mus, bassn(rt[c], beat / 2 * 0.9), tb, 0.5 * gb)
    for k in range(4):
        tb = t0 + k * beat; gk = float(g_kick[min(N - 1, int(tb * SR))])
        if gk > 0.02: add(mus, kick(), tb, 0.8 * gk); add(mus, hat(), tb + beat / 2, 0.28 * gk)
# S8-S10 : pouls de tension qui accélère (battements de plus en plus rapprochés)
tp = S[8][0] + 0.5; gap = 0.6
while tp < S[10][0] + 1.85:
    add(mus, thud(70, 0.2, 0.7), tp, 0.7); tp += gap; gap = max(0.14, gap * 0.93)
# coupures musicales exigées : arrêt net à S5 (début de phrase) ; rupture sur « non ? » ; musique qui se résout en S17
cut = np.ones(N); a = int(S[5][0] * SR); b = int((S[5][0] + 0.55) * SR); cut[a:b] = 0.0
rup = int(on(2, r"^non$") * SR); cut[rup:rup + int(0.12 * SR)] = 0.0                         # micro-silence avant le stinger de « non ? »
mus *= cut
add(mus, chord(MAJ[0] + [523.3, 659.3], 3.4, 0.5, True), S[17][1] - 1.6, 1.0)                    # accord de résolution (fin S17)
fo = int(1.2 * SR); mus[-fo:] *= np.linspace(1, 0, fo)

# ------------------------------------------------------------------ SFX calés sur les mots
# S1 — hook
add(sfx, impact(1.5, 52, 0.9), 0.0); add(sfx, riser(1.4), 0.0, 0.45); add(sfx, whoosh(1.4, True), 0.25, 0.7)
for k, tt in enumerate(np.linspace(0.3, 0.9, 5)): add(sfx, tick(1500 + 300 * k, 0.05, 0.4), tt)                       # lumières qui s'allument
add(sfx, rustle(0.5), 1.0, 0.5); add(sfx, whoosh(0.7, False), 1.2, 0.5)
for k, tt in enumerate(np.linspace(on(1, "milliardaires"), on(1, "monde") + 0.5, 5)): add(sfx, thud(80 + 10 * k, 0.25, 0.9), tt, 0.75)   # piles de richesses
for k in range(14): add(sfx, rustle(0.25), on(1, "donnaient") + 0.15 * k, 0.5)                                      # billets qui partent vers les silhouettes
add(sfx, riser(2.3), on(1, "donnaient"), 0.55)
# S2 — « non ? »
add(sfx, whoosh(0.5, False, 200, 2500), S[2][0] + 0.2, 0.6); add(sfx, riser(1.0), on(2, "pauvre") - 0.2, 0.5)
tn = on(2, r"^non$"); add(sfx, cutoff(0.9), tn + 0.12, 0.8); add(sfx, impact(1.1, 46, 0.9), tn + 0.12); add(sfx, whoosh(0.5, True), tn + 0.12, 0.6)
# S3 — l'échelle
add(sfx, whoosh(1.4, False, 150, 4000), S[3][0] + 0.2, 0.8); add(sfx, impact(1.3, 40, 0.8), S[3][0] + 0.3)
for k, tt in enumerate(np.linspace(on(3, "milliers"), on(3, "redistribu"), 16)): add(sfx, tick(1200 + 90 * k, 0.04, 0.45), tt)       # chiffres qui se construisent
add(sfx, impact(0.8, 55, 0.7), on(3, "milliards"), 0.6)
add(sfx, riser(1.3), on(3, "redistribu"), 0.5)
for k in range(26): add(sfx, sparkle(1400 + 80 * (k % 9), 0.22 + 0.01 * k), on(3, "millions") + 0.05 * k + 0.03 * (k % 3), 0.9)     # points lumineux
# S4 — la vie quotidienne (chaleur)
add(sfx, chord([392, 493.9, 587.3], 1.8, 0.35, True), S[4][0], 0.8); add(sfx, whoosh(0.8, False, 250, 3500), S[4][0], 0.4)
for k, tt in enumerate([on(4, "manger"), on(4, "manger") + 0.3, on(4, "manger") + 0.6, on(4, "faim")]): add(sfx, thud(190 - 15 * k, 0.12, 0.6), tt, 0.6)
add(sfx, rustle(0.4), on(4, "manger") + 0.1, 0.4)
add(sfx, clack(0.9), on(4, r"^se$"), 0.9); add(sfx, thud(130, 0.2, 0.9), on(4, r"^se$"), 0.8)                                 # tampon de la facture
add(sfx, whoosh(0.7, True, 200, 2500), on(4, "loger"), 0.5); add(sfx, ping(1318, 0.6), on(4, "loger") + 0.35)           # porte qui s'ouvre
add(sfx, ping(1568, 0.55), on(4, "soigner"), 0.9); add(sfx, ping(2093, 0.4), on(4, "soigner") + 0.22)                   # soin
# S5 — coupure et retournement
add(sfx, impact(0.6, 38, 0.55), S[5][0] + 0.55); add(sfx, hpf(noise(0.08), 3000) * 0.4, S[5][0] + 0.56)
add(sfx, whoosh(0.5, True, 400, 5000), S[5][0] + 0.9, 0.6); add(sfx, clack(0.8), on(5, "enorme"), 0.8)                  # billet -> action
add(sfx, riser(0.9, 7000), on(5, "enorme"), 0.6); add(sfx, tick(900, 0.12, 0.9), on(5, "problème"), 0.7)
for k, tt in enumerate(np.linspace(on(5, "problème") + 0.1, on(5, r"^pas$"), 7)): add(sfx, tick(700 + 120 * k, 0.04, 0.35), tt)   # graphique
# S6 — le coffre
add(sfx, vault_clunk(), on(6, r"^ce$"), 0.9); add(sfx, vault_open(1.7), on(6, r"^ce$") + 0.15, 0.9)
for k in range(10): add(sfx, sparkle(1000 + 120 * k, 0.28), on(6, "juste") + 0.07 * k, 0.8)                              # actions/bâtiments qui apparaissent
add(sfx, whoosh(0.9, True, 300, 5000), on(6, "dans") , 0.7)                                                               # traversée du coffre
# S7 — les actions
add(sfx, impact(0.7, 70, 0.6), S[7][0] + 0.1)
for k, tt in enumerate(np.linspace(on(7, "investie"), on(7, "forme"), 7)): add(sfx, clack(0.5), tt, 0.7)                  # maquette qui s'éclate
for k, w in enumerate(["entreprises", "forme", "actions"]): add(sfx, ping(900 + 220 * k, 0.45), on(7, w), 0.8)
add(sfx, riser(0.8), on(7, "forme") + 0.1, 0.5)
# S8 — tout le monde veut vendre : montée de tension, ordres de vente
add(sfx, whoosh(0.7, True), S[8][0], 0.6)
for k, tt in enumerate(np.linspace(on(8, "imagine") + 0.2, on(8, "milliardaires"), 8)): add(sfx, tick(1100 + 60 * k, 0.035, 0.35), tt)
t = on(8, "essaient"); gp = 0.20
while t < S[8][1] - 0.05: add(sfx, tick(1500 + 700 * ((t * 7) % 1), 0.03, 0.4), t); t += gp; gp = max(0.035, gp * 0.9)             # ordres de vente (accélèrent)
add(sfx, riser(S[8][1] - on(8, "essaient"), 9500), on(8, "essaient"), 0.8)
# S9 — pas assez d'acheteurs
add(sfx, impact(0.9, 52, 0.85), S[9][0]);
for k in range(9): add(sfx, thud(100 + 8 * (k % 3), 0.18, 0.6), on(9, "vendre") + 0.07 * k - 0.4, 0.55)                 # blocs rouges
tm = on(9, r"^mais$"); add(sfx, cutoff(0.5), tm - 0.02, 0.45)                                                              # rupture sur « mais »
for k, tt in enumerate([tm + 0.25, tm + 0.7, tm + 1.15]): add(sfx, ping(880 + 110 * k, 0.4), tt, 0.7)                     # quelques acheteurs, lents
add(sfx, vault_open(1.0) * 0.5, on(9, "forcement"), 0.7); add(sfx, whoosh(0.7, False), on(9, "acheteurs") + 0.2, 0.6)     # balance qui penche, plongée
# S10 — la chute
add(sfx, impact(0.8, 62, 0.8), S[10][0]); add(sfx, riser(on(10, "effondrer") - on(10, "prix"), 6000), on(10, "prix"), 0.6)
te = on(10, "effondrer"); add(sfx, fall(1.3), te - 0.05, 0.9); add(sfx, impact(1.4, 36, 1.0), te + 0.1)
for k, tt in enumerate(np.linspace(te, te + 0.9, 12)): add(sfx, tick(900 - 40 * k, 0.04, 0.35), tt)
# S11 — les entreprises
add(sfx, whoosh(0.9, True, 200, 3500), S[11][0] + 0.1, 0.7)
for k, tt in enumerate(np.linspace(on(11, "perdraient"), on(11, "bourse"), 8)): add(sfx, tick(1200 - 90 * k, 0.05, 0.35), tt)  # valeur qui baisse
add(sfx, whoosh(0.5, False, 200, 2000), on(11, "elles"), 0.4)
for tt in [on(11, "attirer") + 0.1, on(11, "financer") + 0.1, on(11, "developpement") + 0.1]: add(sfx, clack(0.6), tt, 0.7); add(sfx, tick(500, 0.12, 0.5), tt + 0.06, 0.6)   # projets en pause
# S12 — propagation
add(sfx, whoosh(0.5, True), S[12][0], 0.5)
for k, tt in enumerate(np.linspace(on(12, "panique"), on(12, "marches") + 0.6, 7)): add(sfx, ping(660 + 70 * k, 0.4, 0.6), tt, 0.8)    # onde de nœud en nœud
add(sfx, whoosh(1.8, False, 200, 3000), on(12, "consequences"), 0.8)
for k, tt in enumerate(np.linspace(on(12, "toucher"), on(12, "milliardaires"), 9)): add(sfx, tick(800 + 60 * k, 0.04, 0.3), tt)
# S13 — retour de la chaleur / distribution
add(sfx, whoosh(1.0, True, 200, 3500), S[13][0], 0.5); add(sfx, chord([329.6, 392, 493.9], 1.6, 0.35, True), S[13][0] + 0.1, 0.8)
for k in range(18): add(sfx, sparkle(1200 + 90 * (k % 8), 0.22), on(13, "argent") + 0.08 * k - 0.1, 0.8)                     # jetons lumineux
add(sfx, ping(1568, 0.5), on(13, "distribue"), 0.8)
# S14 — besoins quotidiens
for k, w in enumerate(["millions", "payer", "factures"]): add(sfx, ping(990 + 160 * k, 0.4), on(14, w), 0.7)
add(sfx, clack(0.9), on(14, "factures") + 0.3, 0.9); add(sfx, thud(130, 0.18, 0.8), on(14, "factures") + 0.3, 0.7)           # facture réglée
for k in range(5): add(sfx, thud(200 - 10 * k, 0.1, 0.4), on(14, "payer") + 0.18 * k, 0.5)                                # panier qui se remplit
add(sfx, chord([392, 493.9, 587.3, 784], 1.8, 0.4, True), on(14, "ameliorer"), 0.8); add(sfx, ping(1568, 0.5), on(14, "quotidien"), 0.7)
# S15 — le problème peut revenir
add(sfx, cutoff(0.6), S[15][0], 0.4)
for k, tt in enumerate(np.linspace(on(15, "depense"), on(15, "revenus"), 9)): add(sfx, rustle(0.22), tt, 0.55); add(sfx, tick(1700 - 90 * k, 0.04, 0.3), tt + 0.03)   # billets qui s'envolent
for k in range(7): add(sfx, clack(0.5), on(15, "revenus") + 0.1 + 0.55 * k, 0.5)                                         # pages de calendrier
add(sfx, ping(220, 0.8, 1.0), on(15, "stables"), 0.5)                                                                      # flux vide
for k, tt in enumerate(np.linspace(on(15, "probleme"), on(15, "revenir"), 5)): add(sfx, tick(600 - 60 * k, 0.09, 0.6), tt)          # factures qui reviennent
add(sfx, impact(0.9, 45, 0.6), on(15, "revenir"), 0.7)
# S16 — aider ≠ résoudre durablement
add(sfx, whoosh(1.2, True, 200, 5000), S[16][0], 0.6)
for k in range(24): add(sfx, rustle(0.2), on(16, "redistribuer") + 0.1 * k, 0.5);
for k, tt in enumerate(np.linspace(on(16, "redistribuer") + 0.5, on(16, "personnes") - 0.3, 6)): add(sfx, thud(110, 0.14, 0.6), tt, 0.5)
add(sfx, cutoff(0.5), on(16, r"^mais$") - 0.03, 0.4)
for k, w in enumerate(["suffit", "supprimer", "durablement", "pauvrete"]): add(sfx, ping(660 + 110 * k, 0.45, 0.7), on(16, w), 0.8)
# S17 — le système qui se reconnecte
for k, w in enumerate(["entreprises", "emplois", "biens", "services"]): add(sfx, clack(0.55), on(17, w), 0.8); add(sfx, ping(770 + 150 * k, 0.5, 0.7), on(17, w) + 0.04, 0.8)
add(sfx, riser(1.4, 6000), on(17, "depend") - 0.2, 0.4)
add(sfx, whoosh(2.0, False, 150, 3500), on(17, "permettent"), 0.6)
# S18 — question finale et son net
add(sfx, riser(on(18, r"^le$") - S[18][0] - 0.8, 7000), S[18][0] + 0.5, 0.5); add(sfx, whoosh(0.7, True), on(18, "milliardaires"), 0.5)
tq = on(18, "ferais"); add(sfx, impact(1.2, 56, 0.9), tq + 0.12); add(sfx, ping(1760, 0.6, 1.2), tq + 0.12, 0.9); add(sfx, ping(2349, 0.4, 1.4), tq + 0.2, 0.8)
# transitions de modules (changements de scène)
for tt, kind in [(S[3][1], "w"), (S[8][0], "w"), (S[11][0], "w"), (S[13][0], "w"), (S[14][0], "w"), (S[15][0], "w"), (S[18][0], "w")]: add(sfx, whoosh(0.35, True, 400, 6000), tt - 0.25, 0.5)

# ------------------------------------------------------------------ ducking sous la voix + mixage
nar = f"{ROOT}/audio/narr_44k.wav"
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", f"{ROOT}/audio/narration_leo.mp3", "-ar", str(SR), "-ac", "1", nar], check=True)
w = wave.open(nar); v = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768; w.close(); os.remove(nar)
v = np.pad(v, (0, max(0, N - len(v))))[:N]
win = int(0.05 * SR); e = np.sqrt(np.convolve(v ** 2, np.ones(win) / win, mode="same")); act = np.clip(e / 0.03, 0, 1)
k = int(0.12 * SR); act = np.convolve(act, np.ones(k) / k, mode="same")
bed = mus * (1 - 0.88 * act) * 0.30 + sfx * (1 - 0.70 * act) * 0.50
bed = np.tanh(bed * 1.2) / np.tanh(1.2); bed = bed / np.max(np.abs(bed)) * 0.55
def wr(path, x):
    with wave.open(path, "wb") as f: f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
os.makedirs(f"{ROOT}/video/audio", exist_ok=True); wr(f"{ROOT}/video/audio/bed.wav", bed)
final = (v * 2.0 + bed * 0.75) * 1.5; final = np.tanh(final / 0.95 * 1.0) * 0.95 if np.max(np.abs(final)) > 0.95 else final
wr(f"{ROOT}/audio/final_mix.wav", final)
db = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
sp = e > 0.02
print("bed.wav + final_mix.wav", DUR, "s | pendant la parole : voix %.1f dB, musique+effets %.1f dB, écart %.1f dB | pic final %.2f" % (db(v[sp] * 2.0 * 1.5), db(bed[sp] * 0.5 * 1.5), db(v[sp] * 2.0) - db(bed[sp] * 0.75), np.max(np.abs(final))))
