"""Bande-son Devis974 (55 s) : 'Motivating Mornings' (Mixkit #33, licence gratuite Mixkit, 120 BPM),
démarrée à 0,15 s pour que son premier impact (12,15 s) tombe sur la révélation du logo (12,0 s).
Effets 100 % synthétisés (numpy), placés sur les instants exacts de l'animation. Normalisation -14 LUFS."""
import json, subprocess
from pathlib import Path
import numpy as np
HERE = Path(__file__).parent; SR, T = 48000, 55.0; N = int(SR * T); rng = np.random.default_rng(974)
def load(p):
    raw = subprocess.run(["ffmpeg", "-v", "quiet", "-i", str(p), "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()
mus = load(HERE / "assets/audio/m33.mp3")[int(.15 * SR):][:N]
mix = np.zeros((N, 2), np.float32); mix[:len(mus)] = mus * .8
env = np.ones(N); env[:int(SR * 12)] = .75                    # intro un peu plus basse (tension)
f0 = int(53.4 * SR); env[f0:] = np.linspace(1, 0, N - f0) ** 1.5
mix *= env[:, None]
t_ = lambda d: np.arange(int(d * SR)) / SR
def tone(f, d, dec, f2=None):
    t = t_(d); ph = 2 * np.pi * np.cumsum(np.linspace(f, f2 or f, len(t))) / SR
    return np.sin(ph) * np.exp(-t / dec)
def noise(d, a=.01, r=.2, lp=.2):
    n = rng.standard_normal(int(d * SR)); k = int(1 / lp)
    n = np.convolve(n, np.ones(k) / k, 'same'); t = t_(d)
    return n * np.minimum(t / a, 1) * np.exp(-np.maximum(t - a, 0) / r)
SFX = {
  'pop': lambda: tone(880, .12, .03, 1500) * .9,
  'buzz': lambda: np.sin(2 * np.pi * 165 * t_(.22)) * (np.sin(2 * np.pi * 28 * t_(.22)) > 0) * np.exp(-t_(.22) / .25),
  'thud': lambda: tone(140, .25, .06, 60) + np.pad(noise(.12, .002, .03, .08), (0, int(.13 * SR))) * .6,
  'whoosh': lambda: noise(.6, .25, .18, .3) * 1.4,
  'click': lambda: tone(2200, .04, .006) + np.pad(noise(.02, .001, .004, .5), (0, int(.02 * SR))) * .5,
  'key': lambda: tone(3200, .03, .004) * .6 + np.pad(noise(.02, .001, .003, .5), (0, int(.01 * SR))) * .4,
  'ok': lambda: np.concatenate([tone(988, .09, .08), tone(1319, .35, .12)]),
  'ding': lambda: tone(1568, .6, .2) * .7 + tone(2093, .6, .15) * .3,
  'sub': lambda: tone(70, .9, .35, 45),
  'tick': lambda: tone(1800, .03, .005) * .5,
}
EV = []
for tn in [.35, .85, 1.35, 1.85, 2.35, 2.85, 3.3]: EV += [(tn, 'buzz', .22), (tn + .08, 'pop', .12)]
EV += [(t, 'thud', .3) for t in [5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5]]
EV += [(11.25, 'whoosh', .35), (12.0, 'sub', .45), (15.8, 'whoosh', .18)]
for a, b, txt in [(19.75, 20.35, 'Marie Payet'), (20.45, 21.0, '0692 12 34 56'), (21.1, 21.95, 'Nettoyage clim 2 splits')]:
    EV += [(a + (b - a) * i / len(txt), 'key', .1) for i in range(len(txt)) if txt[i] != ' ']
EV += [(t, 'click', .25) for t in [19.2, 22.1, 22.4, 23.05, 26.6, 27.8, 28.7, 31.05, 37.0, 39.4, 41.05]]
EV += [(t, 'ok', .2) for t in [23.35, 33.0, 41.25, 45.5]]
EV += [(t, 'whoosh', .16) for t in [17.85, 26.0, 35.0, 43.0, 48.85]] + [(31.2, 'whoosh', .22)]
EV += [(29.45 + i * .1, 'tick', .12) for i in range(12)] + [(36.0, 'buzz', .2), (36.05, 'ding', .2), (49.15, 'sub', .4), (51.1, 'pop', .15)]
for t, k, g in EV:
    s = SFX[k](); s = s / (np.abs(s).max() + 1e-9) * g; i0 = int(t * SR); hi = min(N, i0 + len(s))
    mix[i0:hi] += s[:hi - i0, None]
raw = HERE / "out/raw.wav"; raw.parent.mkdir(exist_ok=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", str(raw)], input=mix.astype(np.float32).tobytes(), check=True)
m = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(raw), "-af", "loudnorm=I=-14:TP=-1.3:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
j = json.loads(m[m.rindex("{"):m.rindex("}") + 1])
af = f"loudnorm=I=-14:TP=-1.3:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af", af, "-ar", str(SR), str(HERE / "out/audio.wav")], check=True)
print("audio ok, entrée", j['input_i'], "LUFS")
