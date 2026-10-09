#!/usr/bin/env python3
"""Sound design + music bed for « Mais pourquoi — L'imprimante à billets ».

Everything is synthesised procedurally (numpy only) so the project is fully reusable
and royalty-free. Timings come from TIMING below — keep them in sync with index.html
(window.TIMING). Outputs stereo 44.1 kHz WAV files in ../audio/:
  - sfx.wav    : machine, paper, impacts, transitions, price ticks, freeze cut, UI blips
  - music.wav  : discreet dynamic bed (already low-level so the voice stays on top)
"""
import json, os, sys, wave
import numpy as np

SR = 44100
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "audio")
os.makedirs(OUT, exist_ok=True)

TIMING = dict(S=[0, 10, 20, 38, 53, 72], END=86.0, FREEZE=41.8)
END, FREEZE = TIMING["END"], TIMING["FREEZE"]
N = int(END * SR)
rng = np.random.default_rng(7)


def t_(d):
    return np.arange(int(d * SR)) / SR


def env(n, a=0.005, d=0.2, curve=3.0):
    x = np.arange(n) / SR
    e = np.minimum(1, x / max(a, 1e-4)) * np.exp(-curve * x / max(d, 1e-4))
    return e


def noise(n):
    return rng.standard_normal(n)


def filt(x, lo=None, hi=None):
    """Smooth FFT band-pass (lo = high-pass corner, hi = low-pass corner, Hz)."""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    m = np.ones_like(f)
    if lo:
        m *= 1 / (1 + (lo / np.maximum(f, 1e-3)) ** 4)
    if hi:
        m *= 1 / (1 + (f / hi) ** 4)
    return np.fft.irfft(X * m, len(x))


def place(buf, snd, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= buf.shape[0] or i + len(snd) <= 0:
        return
    j = min(buf.shape[0], i + len(snd))
    s = snd[: j - i] * gain
    l, r = (1 - max(0, pan)), (1 + min(0, pan))
    buf[i:j, 0] += s * l
    buf[i:j, 1] += s * r


def sine(f, d, ph=0):
    t = t_(d)
    return np.sin(2 * np.pi * f * t + ph)


def sweep(f0, f1, d, shape="exp"):
    t = t_(d)
    if shape == "exp":
        f = f0 * (f1 / f0) ** (t / d)
        ph = 2 * np.pi * np.cumsum(f) / SR
    else:
        f = f0 + (f1 - f0) * t / d
        ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph)


def saw(f, d):
    t = t_(d)
    return 2 * ((t * f) % 1) - 1


def norm(x, peak=0.9):
    m = np.max(np.abs(x)) + 1e-9
    return x / m * peak


# ----------------------------------------------------------------------------- SFX
sfx = np.zeros((N, 2))

# 1) Printer start-up (0.4 → 3.4): motor spool-up + clunk + relays
d = 3.2
f = 28 * (110 / 28) ** (t_(d) / d)
motor = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.6 + saw(1, d) * 0
motor += 0.35 * np.sin(2 * np.pi * np.cumsum(f * 2.01) / SR)
motor += 0.25 * filt(noise(len(motor)), 80, 900)
motor *= np.minimum(1, t_(d) / 0.4)
place(sfx, motor, 0.4, 0.55)
place(sfx, filt(noise(int(0.25 * SR)), 60, 600) * env(int(0.25 * SR), 0.002, 0.08), 0.35, 1.2)  # clunk
for tt in (0.9, 1.15, 1.6):  # relay clicks
    place(sfx, filt(noise(2000), 1500, 6000) * env(2000, 0.001, 0.02), tt, 0.5)

# 2) Machine running: roller whir (pitch rises with the machine speed) until FREEZE
def machine_phase(t):
    rev = 0.8 * t + 0.05 * t * t
    return rev


tm = t_(FREEZE - 1.5)
rev = machine_phase(tm + 1.5)
fund = 55 + 28 * rev ** 0.55
whir = np.sin(2 * np.pi * np.cumsum(fund) / SR) * 0.5
whir += 0.3 * np.sin(2 * np.pi * np.cumsum(fund * 3.01) / SR)
# roller clatter: amplitude modulated at the roller rate
rate = 4 + 1.2 * rev
am = 0.55 + 0.45 * np.sign(np.sin(2 * np.pi * np.cumsum(rate) / SR))
whir = whir * am
whir += 0.25 * filt(noise(len(whir)), 400, 3500) * (0.4 + 0.6 * (tm / tm[-1]))
whir *= np.minimum(1, tm / 1.0) * (0.35 + 0.65 * (tm / tm[-1]))
place(sfx, whir, 1.5, 0.30)

# 3) Paper swishes & bill rustle (density increases like the on-screen bill rate)
M = 1800
for i in range(0, M, 3):
    f_ = i / M
    ts = 1.2 + 38.6 * f_ ** 0.55
    n_ = int(0.09 * SR)
    sw = filt(noise(n_), 2500, 9000) * env(n_, 0.004, 0.05)
    place(sfx, sw, ts, 0.10 + 0.12 * f_, pan=rng.uniform(-0.6, 0.6))
# landing thuds on the pile (soft) – a few per second late in the build
for ts in np.linspace(6, 40, 70):
    n_ = int(0.12 * SR)
    th = filt(noise(n_), 60, 500) * env(n_, 0.002, 0.07)
    place(sfx, th, ts + 0.9, 0.12, pan=rng.uniform(-0.5, 0.5))

# 4) Impacts when the mountain appears
def impact(t, g=1.0):
    n_ = int(1.6 * SR)
    boom = sweep(95, 32, 1.6) * env(n_, 0.002, 0.7, 2.6)
    boom += 0.5 * filt(noise(n_), 40, 300) * env(n_, 0.001, 0.25)
    place(sfx, boom, t, 0.9 * g)
    place(sfx, filt(noise(int(0.5 * SR)), 1200, 9000) * env(int(0.5 * SR), 0.001, 0.12), t, 0.25 * g)

impact(10.0, 0.8)    # S2 start: the room overflows
impact(13.6, 1.0)    # "montagne"
impact(16.4, 0.7)    # camera inside the pile

# 5) Transition whooshes / risers (synced to scene cuts)
def whoosh(t0, d=0.9, f0=300, f1=5000, g=0.6, rev_=False):
    n_ = int(d * SR)
    w = filt(noise(n_), f0, None)
    cut = np.linspace(f0, f1, n_)
    w = filt(w, None, f1) * (np.linspace(0, 1, n_) ** 2 if not rev_ else np.linspace(1, 0, n_) ** 2)
    place(sfx, w, t0, g)

whoosh(9.1, 0.9, 400, 6000, 0.55)       # S1 → S2
whoosh(18.9, 1.1, 300, 8000, 0.7)       # S2 → S3 (brutal): riser
place(sfx, filt(noise(int(0.3 * SR)), 800, 12000) * env(int(0.3 * SR), 0.001, 0.15), 20.0, 0.9)  # glitch hit on the cut
place(sfx, sweep(1800, 90, 0.35) * env(int(0.35 * SR), 0.001, 0.3), 20.0, 0.5)
whoosh(37.2, 0.8, 300, 5000, 0.5)       # S3 → S4
whoosh(51.6, 1.3, 200, 7000, 0.6)       # machine disappears → S5
whoosh(70.8, 1.2, 250, 6500, 0.55)      # S5 → S6
impact(72.0, 0.6)

# 6) Supermarket: digit-flip ticks accelerating + registers + beeps
t_tick = 21.0
k = 0
while t_tick < 37.6:
    u = (t_tick - 21.0) / 16.6
    n_ = int(0.03 * SR)
    place(sfx, filt(noise(n_), 2000, 8000) * env(n_, 0.001, 0.012), t_tick, 0.22 + 0.2 * u, pan=rng.uniform(-0.4, 0.4))
    t_tick += 0.34 - 0.27 * u ** 0.7
    k += 1
for tt in (23.4, 29.2, 33.6):  # cash-register ping
    p = (sine(1568, 0.5) + 0.5 * sine(2349, 0.5)) * env(int(0.5 * SR), 0.002, 0.28)
    place(sfx, p, tt, 0.14)
for tt in (27.0, 31.0, 35.0):  # price "beep" scanner
    place(sfx, sine(1900, 0.09) * env(int(0.09 * SR), 0.002, 0.06), tt, 0.14)

# 7) The reveal: tape-stop then a CUT (silence) then a deep boom
n_ = int(0.9 * SR)
tape = sweep(260, 30, 0.9) * np.linspace(1, 0.2, n_)
tape += 0.4 * filt(noise(n_), 100, 1500) * np.linspace(1, 0, n_)
place(sfx, tape, FREEZE - 0.9, 0.5)
place(sfx, sine(48, 2.4) * env(int(2.4 * SR), 0.01, 1.2, 2.2), FREEZE + 0.75, 0.85)  # sub boom after the beat of silence
place(sfx, (sine(784, 1.6) + 0.5 * sine(1176, 1.6)) * env(int(1.6 * SR), 0.01, 0.9), FREEZE + 0.8, 0.07)  # shimmer

# richness items popping: soft "pop" per word (45.8 → 52)
for tt in (46.2, 47.4, 48.5, 49.4, 50.4, 51.4):
    n_ = int(0.25 * SR)
    place(sfx, sweep(300, 900, 0.25) * env(n_, 0.002, 0.1), tt, 0.16)

# 8) Diagram scene (S5): blips, transfers, loan "creation", forbidden buzz
def ping(t, f=880, g=0.14, d=0.35):
    n_ = int(d * SR)
    place(sfx, (sine(f, d) + 0.4 * sine(f * 2, d)) * env(n_, 0.002, d * 0.5), t, g)

for tt, f in ((53.9, 523), (54.5, 659), (55.1, 784), (55.8, 988)):
    ping(tt, f)
for tt in np.arange(56.4, 58.4, 0.25):
    ping(tt, 1320, 0.05, 0.12)
for i, f in enumerate((392, 494, 587, 784, 988)):
    ping(60.0 + i * 0.16, f, 0.13, 0.5)  # loan creation arpeggio
ping(60.9, 1568, 0.10, 0.7)
for tt in (64.6, 65.2, 65.8):  # rate dial ticks
    place(sfx, filt(noise(1500), 1200, 5000) * env(1500, 0.001, 0.015), tt, 0.35)
place(sfx, saw(110, 0.28) * env(int(0.28 * SR), 0.002, 0.2) * 0.6, 68.9, 0.22)  # forbidden buzz
place(sfx, saw(98, 0.28) * env(int(0.28 * SR), 0.002, 0.2) * 0.6, 69.25, 0.22)

# 9) Final bill, city: paper flutter, soft chime, rising shimmer, distant city hum
n_ = int(3.2 * SR)
flut = filt(noise(n_), 1500, 6000) * (0.5 + 0.5 * np.sin(2 * np.pi * 5 * t_(3.2))) ** 2 * np.linspace(0.8, 0.1, n_)
place(sfx, flut, 72.3, 0.14)
ping(76.0, 1046, 0.12, 1.0)
ping(76.15, 1568, 0.08, 1.2)
n_ = int(7 * SR)
hum = filt(noise(n_), 60, 400) * np.linspace(0, 1, n_) ** 1.5
place(sfx, hum, 77, 0.22)
place(sfx, sweep(200, 1600, 6) * np.linspace(0, 1, int(6 * SR)) ** 2, 76.5, 0.12)

# ----- the CUT: duck everything in sfx except the planned events right after the freeze
gate = np.ones(N)
a, b = int((FREEZE - 0.02) * SR), int((FREEZE + 0.7) * SR)
gate[a:b] = 0.0
ramp = int(0.01 * SR)
gate[a - ramp:a] = np.linspace(1, 0, ramp)
gate[b:b + ramp * 6] = np.linspace(0, 1, ramp * 6)
# keep the tape-stop tail audible by applying the gate only to what's after FREEZE-0.02
sfx_gated = sfx * gate[:, None]

# ----------------------------------------------------------------------------- MUSIC
music = np.zeros((N, 2))
BPM = 112
beat = 60 / BPM

def kick(t, g=1.0):
    n_ = int(0.35 * SR)
    place(music, sweep(120, 42, 0.35) * env(n_, 0.001, 0.18, 4), t, 0.5 * g)

def hat(t, g=1.0):
    n_ = int(0.05 * SR)
    place(music, filt(noise(n_), 7000, None) * env(n_, 0.001, 0.02), t, 0.07 * g, pan=0.2)

def pluck(t, f, g=1.0, d=0.35):
    n_ = int(d * SR)
    s = (saw(f, d) * 0.5 + sine(f, d) * 0.5)
    s = filt(s, None, 3200)
    s = s * (0.55 + 0.45 * np.exp(-np.linspace(0, 6, n_)))
    place(music, s * env(n_, 0.003, d * 0.5), t, 0.16 * g, pan=rng.uniform(-0.3, 0.3))

def bass(t, f, d=beat * 0.9, g=1.0):
    n_ = int(d * SR)
    s = sine(f, d) + 0.35 * sine(f * 2, d)
    place(music, s * env(n_, 0.004, d * 0.7, 2), t, 0.34 * g)

def pad(t, freqs, d, g=1.0):
    n_ = int(d * SR)
    s = sum(saw(f * (1 + 0.003 * j), d) for j, f in enumerate(freqs * 2)) / (len(freqs) * 2)
    s = filt(s, 150, 2200)
    e = np.minimum(1, t_(d) / (d * 0.35)) * np.minimum(1, (d - t_(d)) / (d * 0.35))
    place(music, s * e, t, 0.12 * g)

mid = lambda m: 440 * 2 ** ((m - 69) / 12)
prog = [(45, (57, 60, 64)), (41, (53, 57, 60)), (48, (60, 64, 67)), (43, (55, 59, 62))]  # Am F C G
bar = beat * 4

def section(t0, t1, level_kick, level_hat, level_arp, level_pad, level_bass):
    t = t0
    bi = 0
    while t < t1 - 1e-6:
        root, ch = prog[bi % 4]
        if level_pad:
            pad(t, [mid(x) for x in ch], bar * 1.02, level_pad)
        for k in range(8):
            tt = t + k * beat / 2
            if tt >= t1:
                break
            if level_bass and k in (0, 3, 4, 6):
                bass(tt, mid(root), beat * 0.45, level_bass)
            if level_arp:
                pluck(tt, mid(ch[k % 3] + 12), level_arp * (1 if k % 2 == 0 else 0.6))
            if level_hat and k % 2 == 1:
                hat(tt, level_hat)
        if level_kick:
            for k in range(4):
                if t + k * beat < t1:
                    kick(t + k * beat, level_kick)
        t += bar
        bi += 1

section(0.0, 10.0, 0.0, 0.0, 0.0, 0.7, 0.0)           # S1: dark intro pad (printer takes the spotlight)
section(1.5, 10.0, 0.7, 0.0, 0.0, 0.0, 0.0)           # kick fades in with the machine
section(10.0, 20.0, 1.0, 0.9, 0.5, 0.8, 0.9)          # S2: full groove, rising
section(20.0, 38.0, 0.8, 1.0, 0.9, 0.5, 0.8)          # S3: tension
section(38.0, FREEZE - 0.05, 1.0, 1.0, 1.0, 0.4, 1.0)  # S4 build
# silence at the freeze, then a pure warm pad for the reveal
section(FREEZE + 0.7, 53.0, 0.0, 0.0, 0.0, 1.0, 0.0)
section(53.0, 72.0, 0.3, 0.5, 0.6, 0.7, 0.4)          # S5: light, technical
section(72.0, END, 0.5, 0.6, 0.7, 1.0, 0.7)           # S6: resolution, major lift handled by the pad swell
# gentle final swell + fade
fin = np.ones(N)
tail = int(3.0 * SR)
fin[-tail:] = np.linspace(1, 0, tail)
music *= fin[:, None]
# cut music exactly like sfx at the freeze
music *= gate[:, None]
# global level: the bed sits well under the voice
music *= 0.55


def write(path, a):
    a = np.clip(a, -1, 1)
    pcm = (a * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


sfx_out = norm(sfx_gated, 0.85) * 0.9
music_out = norm(music, 0.8) * 0.9
write(os.path.join(OUT, "sfx.wav"), sfx_out)
write(os.path.join(OUT, "music.wav"), music_out)
print("wrote", os.path.join(OUT, "sfx.wav"), os.path.join(OUT, "music.wav"))
