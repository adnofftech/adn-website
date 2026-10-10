"""Sound design synthétisé (numpy) pour « MAIS POURQUOI — L'imprimante à billets ».
Génère video/audio/bed.wav : musique + SFX, ducké sous la narration Léo.
Aucune ressource externe : tout est synthétisé, déterministe (seed fixe)."""
import numpy as np, wave, json, subprocess, os, sys
SR = 44100
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DUR = 69.5
N = int(DUR * SR)
rng = np.random.default_rng(7)
t = np.arange(N) / SR
mix_music = np.zeros(N); mix_sfx = np.zeros(N)

def add(buf, sig, at, gain=1.0):
    i = int(at * SR); j = min(N, i + len(sig))
    if i < N and j > i: buf[i:j] += sig[: j - i] * gain

def env(n, a=0.005, r=0.1):
    e = np.ones(n); na = max(1, int(a * SR)); nr = max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na); e[-nr:] *= np.linspace(1, 0, nr); return e

def noise(d): return rng.standard_normal(int(d * SR))

def lp(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); y = np.zeros_like(x); s = 0.0
    for i in range(len(x)): s = (1 - a) * x[i] + a * s; y[i] = s
    return y

def lpf(x, fc):  # fast FFT lowpass
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X[f > fc] = 0; return np.fft.irfft(X, len(x))

def hpf(x, fc):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X[f < fc] = 0; return np.fft.irfft(X, len(x))

def bandpass(x, lo, hi): return hpf(lpf(x, hi), lo)

def whoosh(d=0.8, up=True):
    n = int(d * SR); x = bandpass(noise(d), 300, 6000)
    sweep = np.linspace(0, 1, n) ** 2 if up else np.linspace(1, 0, n) ** 2
    e = np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5
    return x * e * (0.3 + 0.7 * sweep)

def impact(d=1.2, f0=70):
    n = int(d * SR); tt = np.arange(n) / SR
    k = np.sin(2 * np.pi * (f0 + 90 * np.exp(-tt * 18)) * tt) * np.exp(-tt * 4.5)
    c = lpf(noise(d), 900) * np.exp(-tt * 9) * 0.6
    return k + c

def mech_loop(d, rate_start, rate_end):
    """Moteur d'imprimante : battement de rouleaux dont la cadence évolue."""
    n = int(d * SR); out = np.zeros(n)
    ph = np.cumsum(np.linspace(rate_start, rate_end, n)) / SR
    ticks = np.diff(np.floor(ph), prepend=0) > 0
    idx = np.where(ticks)[0]
    for i in idx:
        L = int(0.05 * SR); seg = bandpass(noise(0.05), 800, 4500)[:L] * np.exp(-np.arange(L) / SR * 90)
        out[i:i+L] += seg[: max(0, min(L, n - i))] * 0.8
    tt = np.arange(n) / SR
    motor = np.sin(2 * np.pi * (45 + 25 * np.linspace(rate_start, rate_end, n) / max(rate_end, 1)) * tt) * 0.35
    return out + motor

def paper_rustle(d):
    n = int(d * SR); x = hpf(noise(d), 2500) * (0.5 + 0.5 * np.sin(np.linspace(0, 40 * np.pi, n)) ** 2)
    return x * env(n, 0.02, 0.15) * 0.5

def coin_ping(f=1760):
    n = int(0.5 * SR); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * tt) + 0.5 * np.sin(2 * np.pi * f * 2.01 * tt)) * np.exp(-tt * 9) * 0.5

def tick(f=2400, d=0.04):
    n = int(d * SR); tt = np.arange(n) / SR; return np.sin(2 * np.pi * f * tt) * np.exp(-tt * 120) * 0.6

def cutoff(d=0.9):
    """Effet de coupure : chute de pitch + silence brutal."""
    n = int(d * SR); tt = np.arange(n) / SR
    f = 600 * np.exp(-tt * 5)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 3.5) * 0.7 + lpf(noise(d), 1500) * np.exp(-tt * 6) * 0.4

def glitch(d=0.5):
    n = int(d * SR); x = np.sign(np.sin(2 * np.pi * rng.uniform(80, 900) * np.arange(n) / SR)) * (rng.random(n) > 0.55)
    return x * env(n, 0.002, 0.2) * 0.3

def swoosh_riser(d=2.0):
    n = int(d * SR); tt = np.arange(n) / SR
    return bandpass(noise(d), 500, 8000) * (tt / d) ** 3 * 0.9

# ------------------------------------------------------------------ musique
BPM = 124; beat = 60 / BPM
def kick(): 
    n = int(0.3 * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * (45 + 110 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 9)
def hat(o=False):
    d = 0.18 if o else 0.05; n = int(d * SR)
    return hpf(noise(d), 7000) * np.exp(-np.arange(n) / SR * (22 if o else 90)) * 0.5
def bass(f, d):
    n = int(d * SR); tt = np.arange(n) / SR
    return lpf((2 * ((f * tt) % 1) - 1) * 0.6 + np.sin(2 * np.pi * f * tt) * 0.5, 600) * env(n, 0.005, 0.08)
def pad(freqs, d):
    n = int(d * SR); tt = np.arange(n) / SR; x = np.zeros(n)
    for f in freqs:
        for det in (0.996, 1.004): x += np.sin(2 * np.pi * f * det * tt) 
    return lpf(x / (2 * len(freqs)), 1800) * env(n, 0.8, 1.0)
def pluck(f):
    n = int(0.35 * SR); tt = np.arange(n) / SR
    return lpf(np.sign(np.sin(2 * np.pi * f * tt)) * np.exp(-tt * 9), 2500) * 0.5

root = [55.0, 55.0, 49.0, 41.2]            # La, La, Sol, Mi (progression mineure)
chords = [[220, 261.6, 329.6], [220, 261.6, 329.6], [196, 246.9, 293.7], [164.8, 207.7, 246.9]]
arp = [220, 261.6, 329.6, 392, 329.6, 261.6, 220, 261.6]
bars = int(DUR / (4 * beat)) + 1
STOP_FROM, STOP_TO = 29.55, 30.15   # coupure de la révélation : musique suspendue
for b in range(bars):
    t0 = b * 4 * beat
    c = b % 4
    add(mix_music, pad(chords[c], 4 * beat), t0, 0.22)
    intensity = 0.0 if t0 < 1.0 else 1.0
    for k in range(4):
        tb = t0 + k * beat
        if tb > 1.5: add(mix_music, kick(), tb, 0.9 * intensity)
        add(mix_music, hat(), tb + beat / 2, 0.35)
        if tb > 3.0: add(mix_music, hat(True), tb + beat * 0.75, 0.15)
    for k in range(8):
        tb = t0 + k * beat / 2
        if tb > 3.0: add(mix_music, bass(root[c], beat / 2 * 0.9), tb, 0.55)
        add(mix_music, pluck(arp[k] * (2 if c % 2 else 1) * 1.0), tb, 0.28 if tb > 6 else 0.0)
# coupure de la musique à la révélation (arrêt net puis retour doux)
gate = np.ones(N)
a, b_ = int(STOP_FROM * SR), int(STOP_TO * SR)
gate[a:b_] = 0.0
rec = int(1.2 * SR); gate[b_:b_ + rec] = np.linspace(0, 1, rec) ** 2
# section « twist » (finance) : on allège la musique (pas de kick après 38.6 s jusqu'à 57 s)
mix_music *= gate
# fin : fade out
fo = int(2.0 * SR); mix_music[-fo:] *= np.linspace(1, 0, fo)

# ------------------------------------------------------------------ SFX (calés sur word_timings.json)
# Scène 1 — démarrage de l'imprimante
add(mix_sfx, impact(1.5, 55), 0.0, 0.9)
add(mix_sfx, swoosh_riser(1.2), 0.05, 0.5)
add(mix_sfx, mech_loop(9.0, 6, 12), 0.5, 0.30)           # moteur + rouleaux, imprimante à l'écran (0.5 → 9.5)
add(mix_sfx, mech_loop(2.55, 12, 34), 26.96, 0.30)       # accélération avant l'arrêt (26.96 → 29.5)
for i, tt in enumerate(np.linspace(0.8, 3.0, 14)): add(mix_sfx, paper_rustle(0.18), tt, 0.5)
add(mix_sfx, whoosh(0.7), 2.55, 0.8)                        # plongée caméra vers les billets
# Scène 2 — rêve
add(mix_sfx, impact(1.0, 65), 3.18, 0.7)
add(mix_sfx, impact(1.0, 60), 4.6, 0.6)                     # « millions »
add(mix_sfx, impact(1.4, 50), 5.5, 0.9)                     # « milliards »
add(mix_sfx, whoosh(1.4), 6.3, 0.9)                         # traversée de la montagne
add(mix_sfx, paper_rustle(1.2), 6.5, 0.7)
add(mix_sfx, coin_ping(1568), 8.4, 0.5); add(mix_sfx, coin_ping(2093), 8.7, 0.4)
# Scène 3 — supermarché
add(mix_sfx, whoosh(0.4, False), 9.5, 1.0); add(mix_sfx, impact(0.8, 80), 9.78, 0.9)   # « piège »
add(mix_sfx, tick(1800), 11.9, 0.6)                          # « ne se mange pas »
add(mix_sfx, coin_ping(1318), 12.98, 0.5)                    # « acheter »
for tt in (14.2, 14.9, 15.8): add(mix_sfx, tick(1200), tt, 0.5)
for tt in np.linspace(16.9, 19.9, 14): add(mix_sfx, tick(900 + 90 * (tt - 16.9)), tt, 0.35)
for k, tt in enumerate((20.1, 20.35, 20.6, 20.85)): add(mix_sfx, tick(1500 + 350 * k), tt, 0.8)  # prix qui grimpent
add(mix_sfx, impact(1.0, 48), 21.4, 0.8)                     # « inflation »
add(mix_sfx, glitch(0.5), 22.6, 0.6)                         # « achète moins » (rétrécissement)
add(mix_sfx, tick(600, 0.1), 24.3, 0.9); add(mix_sfx, tick(500, 0.1), 25.2, 0.9)
# Scène 4 — révélation
add(mix_sfx, whoosh(0.9), 26.9, 1.0)
add(mix_sfx, swoosh_riser(2.5), 27.0, 0.7)                  # montée avant l'arrêt
add(mix_sfx, cutoff(1.4), 29.5, 1.0)                         # COUPURE
add(mix_sfx, whoosh(1.5, False), 30.1, 0.9)                  # recul de caméra
for k, tt in enumerate((32.54, 33.5, 34.3, 35.0, 35.75, 37.2)): add(mix_sfx, coin_ping(900 + 250 * k), tt, 0.4)
# Scène 5 — twist
add(mix_sfx, whoosh(0.8), 38.2, 1.0); add(mix_sfx, glitch(0.6), 38.7, 0.8); add(mix_sfx, impact(1.0, 60), 38.9, 0.7)
add(mix_sfx, impact(0.9, 70), 42.6, 0.6)                    # « 90 % »
for tt in np.linspace(43.0, 45.2, 9): add(mix_sfx, tick(2000 + 100 * (tt - 43)), tt, 0.3)
add(mix_sfx, coin_ping(1760), 46.9, 0.6)                    # crédit accordé
add(mix_sfx, coin_ping(2349), 47.7, 0.6)                    # monnaie créée
add(mix_sfx, tick(800, 0.08), 49.4, 0.9); add(mix_sfx, tick(800, 0.08), 49.9, 0.9)   # règles/limites
add(mix_sfx, whoosh(0.7), 50.9, 0.8)
for tt in np.linspace(51.9, 53.5, 6): add(mix_sfx, tick(500 + 120 * (tt - 51.9), 0.06), tt, 0.5)   # molette des taux
add(mix_sfx, impact(1.2, 45), 55.0, 1.0)                    # barrière « interdit »
add(mix_sfx, tick(300, 0.2), 55.0, 1.0)
# Scène 6 — conclusion
add(mix_sfx, whoosh(1.0, False), 56.4, 0.9)
add(mix_sfx, impact(0.8, 85), 56.9, 0.8)                    # dernier billet
add(mix_sfx, paper_rustle(1.6), 57.2, 0.5)
add(mix_sfx, whoosh(2.2), 58.9, 0.8)                        # remontée vers la ville
for tt in (59.4, 60.0, 60.6): add(mix_sfx, coin_ping(1400 + 200 * (tt - 59)), tt, 0.35)
add(mix_sfx, coin_ping(1976), 64.64, 0.5)                   # question
add(mix_sfx, impact(1.4, 58), 67.6, 0.7)                    # « Dis-le en commentaire »

# ------------------------------------------------------------------ ducking sous la narration
wav = os.path.join(ROOT, "audio", "narr_44k.wav")
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", os.path.join(ROOT, "audio", "narration_leo.mp3"), "-ar", str(SR), "-ac", "1", wav], check=True)
w = wave.open(wav); v = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768; w.close()
v = np.pad(v, (0, max(0, N - len(v))))[:N]
win = int(0.05 * SR); e = np.sqrt(np.convolve(v ** 2, np.ones(win) / win, mode="same"))
act = np.clip(e / 0.03, 0, 1)
k = int(0.12 * SR); act = np.convolve(act, np.ones(k) / k, mode="same")         # lissage (attaque/relâche)
duck_music = 1 - 0.88 * act      # musique : -13 dB sous la voix
duck_sfx = 1 - 0.70 * act        # SFX : -5 dB sous la voix
music = mix_music * duck_music; sfx = mix_sfx * duck_sfx
bed = music * 0.30 + sfx * 0.50
bed = np.tanh(bed * 1.2) / np.tanh(1.2)
peak = np.max(np.abs(bed)); bed = bed / peak * 0.55
out = os.path.join(ROOT, "video", "audio"); os.makedirs(out, exist_ok=True)
pcm = (bed * 32767).astype(np.int16)
with wave.open(os.path.join(out, "bed.wav"), "wb") as f:
    f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes(pcm.tobytes())
os.remove(wav)
print("bed.wav", DUR, "s, peak", float(peak))
