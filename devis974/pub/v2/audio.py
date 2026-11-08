"""Bande-son Devis974 v2 (33 s) : stems séparés + deux mixages.
- music.wav : morceau fourni par le client (non redistribué), calé à 0 s, 124 BPM, fin du morceau 31,2 s.
- sfx.wav   : effets synthétisés par saas-motion-kit/tools/warm_sfx.py (pop, tick, confirm, reveal, whoosh-soft, error-soft) + impact final.
- vo.wav    : voix off VibeVoice-Realtime-0.5B (fr-Spk0_man), calée sur les scènes.
Mixages : avec musique = musique + effets (pas de voix : le morceau est chanté) ; sans musique = voix + effets.
Normalisation -14 LUFS / -1.5 dBTP (réglage social du kit)."""
import json, subprocess, os, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); SR = 48000
TL = json.load(open(os.path.join(HERE, "timeline.json"))); BJ = json.load(open(os.path.join(HERE, "beats.json")))
T = TL["duration"]; N = int(T * SR); BT = BJ["beats"] if TL["sync"] == "beats" else BJ["beats_grid"]
MUSIC = os.environ.get("MUSIC", "/home/user/d974ad/music/track.wav")
def b(x):
    i = int(np.floor(x)); f = x - i
    if i >= len(BT) - 1: return BT[-1] + (x - len(BT) + 1) * 0.48387
    return BT[i] + f * (BT[i + 1] - BT[i])
def load(p, af=None):
    cmd = ["ffmpeg", "-v", "quiet", "-i", p] + (["-af", af] if af else []) + ["-ac", "2", "-ar", str(SR), "-f", "f32le", "-"]
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32).reshape(-1, 2).copy()
def place(dst, s, t, g):
    i0 = int(round(t * SR)); hi = min(len(dst), i0 + len(s))
    if hi > i0 >= 0: dst[i0:hi] += s[:hi - i0] * g
# --- musique
music = np.zeros((N, 2), np.float32)
if os.path.exists(MUSIC):
    m = load(MUSIC); n = min(len(m), N); music[:n] = m[:n]
    fi = int(0.02 * SR); music[:fi] *= np.linspace(0, 1, fi)[:, None]
    a, z = int(30.98 * SR), min(n, int(31.2 * SR)); music[a:z] *= np.linspace(1, 0, z - a)[:, None] ** 1.5; music[z:] = 0
# --- effets (warm_sfx du kit)
S = {k: load(os.path.join(HERE, "assets/sfx", k + ".wav")) for k in ["pop", "tick", "confirm", "reveal", "whoosh-soft", "error-soft"]}
for k in S: S[k] /= np.abs(S[k]).max() + 1e-9
sfx = np.zeros((N, 2), np.float32)
E = [(b(0), "reveal", .35), (b(2) - .08, "whoosh-soft", .45)]
E += [(b(4 + i), "pop", .22) for i in range(12)]                                   # pastilles comptées
E += [(b(8 + i) + .02, "tick", .35) for i in range(4)]                             # notifications
E += [(b(15), "tick", .5), (b(16), "reveal", .55), (b(19.6), "whoosh-soft", .4), (b(24) - .1, "whoosh-soft", .45), (b(28), "tick", .3)]
caps = json.load(open(os.path.join(HERE, "assets/caps/index.json")))["mobile"]
typing = sum(len(caps[s]) for s in ["type_prenom", "type_nom", "type_tel", "type_ville", "type_presta"])
t1, t2 = b(32) + 0.22, b(37.3)
E += [(t1 + (t2 - t1) * k / typing, "tick", .16) for k in range(typing)]          # une frappe par capture réelle
E += [(b(38.45), "tick", .5), (b(39.55), "tick", .5), (b(40), "whoosh-soft", .3)]
E += [(b(c["in"]), "pop", .3) for c in TL["chips"]]
E += [(b(44), "whoosh-soft", .5), (b(46), "confirm", .5), (b(48), "error-soft", .28), (b(52), "tick", .5), (b(54), "tick", .5), (b(54.2), "confirm", .45)]
E += [(b(55.5), "whoosh-soft", .55)] + [(b(56 + i), "tick", .4) for i in range(4)]
E += [(b(60), "reveal", .5), (b(62), "pop", .4), (b(64), "confirm", .55)]
for t, k, g in E: place(sfx, S[k], t, g)
tt = np.arange(int(2.2 * SR)) / SR                                                  # impact final grave
hit = (np.sin(2 * np.pi * np.cumsum(np.linspace(62, 40, len(tt))) / SR) * np.exp(-tt / 0.55))[:, None] * np.ones((1, 2))
place(sfx, hit.astype(np.float32), b(64), .6)
# --- voix off
VO = [("l0", 0.10, 1.0), ("l1", 3.35, 1.1), ("l2", 8.15, 1.0), ("l3", 14.30, 1.0), ("l8", 19.60, 1.0), ("l5", 23.45, 1.0), ("l7", 27.50, 1.0)]
vo = np.zeros((N, 2), np.float32); spans = []
for name, t0, tempo in VO:
    v = load(os.path.join(HERE, "assets/vo", name + ".wav"), f"atempo={tempo},highpass=f=80,acompressor=threshold=-20dB:ratio=3:attack=5:release=120:makeup=2,equalizer=f=3000:t=q:w=1:g=2")
    v = v / (np.abs(v).max() + 1e-9) * .9; place(vo, v, t0, 1.0); spans.append((name, t0, t0 + len(v) / SR))
json.dump(spans, open(os.path.join(HERE, "out_vo_spans.json"), "w"))
# --- écriture
os.makedirs(os.path.join(HERE, "out/stems"), exist_ok=True)
def wav(x, p): subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-c:a", "pcm_s24le", p], input=x.astype(np.float32).tobytes(), check=True)
def norm(x, p):
    raw = p + ".raw.wav"; wav(x, raw)
    m = subprocess.run(["ffmpeg", "-hide_banner", "-i", raw, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
    j = json.loads(m[m.rindex("{"):m.rindex("}") + 1])
    af = f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af", af, "-ar", str(SR), "-c:a", "pcm_s24le", p], check=True); os.remove(raw)
wav(music * .9, os.path.join(HERE, "out/stems/music.wav")); wav(sfx, os.path.join(HERE, "out/stems/sfx.wav")); wav(vo, os.path.join(HERE, "out/stems/vo.wav"))
norm(music * .9 + sfx * .55, os.path.join(HERE, "out/mix_avec_musique.wav"))
norm(vo + sfx * .5, os.path.join(HERE, "out/mix_sans_musique.wav"))
print("ok — voix :", [(n, round(a, 2), round(z, 2)) for n, a, z in spans])
