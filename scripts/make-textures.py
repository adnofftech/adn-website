#!/usr/bin/env python3
"""Génère les textures d'encre utilisées comme emplacements réservés (planches sans photo)
et comme fond d'ambiance. Usage : python3 scripts/make-textures.py
Sortie : src/assets/encre/planche-01.jpg … planche-04.jpg, planche-04-detail.jpg, ambiance.jpg
Ces images ne représentent aucun tatouage : elles seront remplacées par les photographies originales."""
import numpy as np
from PIL import Image, ImageFilter
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src', 'assets', 'encre')
os.makedirs(OUT, exist_ok=True)

ENCRE = np.array([11, 10, 10], dtype=np.float32)
CHARBON = np.array([25, 22, 22], dtype=np.float32)
IVOIRE = np.array([245, 239, 231], dtype=np.float32)
ROUGE = np.array([164, 38, 52], dtype=np.float32)

def noise(rng, w, h, octaves=(8, 16, 32, 64, 128), weights=None):
    acc = np.zeros((h, w), dtype=np.float32)
    weights = weights or [1 / (2 ** i) for i in range(len(octaves))]
    for o, wt in zip(octaves, weights):
        g = rng.random((max(2, h * o // max(w, h)), max(2, o)), dtype=np.float32)
        im = Image.fromarray((g * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
        acc += wt * (np.asarray(im, dtype=np.float32) / 255)
    acc -= acc.min(); acc /= (acc.max() or 1)
    return acc

def smooth(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)

def planche(seed, w=1200, h=1500, red=0.0, detail=False):
    rng = np.random.default_rng(seed)
    base = noise(rng, w, h)
    blooms = noise(rng, w, h, octaves=(3, 6, 12), weights=(1, .5, .25))
    fine = noise(rng, w, h, octaves=(200, 400), weights=(1, .6))
    img = CHARBON + (ENCRE - CHARBON) * smooth(blooms, .35, .8)[..., None]
    # veines claires : fibres de papier/encre diluée
    veins = smooth(base, .55, .72) * (1 - smooth(blooms, .3, .7))
    img += (IVOIRE - img) * (veins * .09)[..., None]
    # grain
    img += ((fine - .5) * 10)[..., None]
    if red > 0:
        rb = noise(rng, w, h, octaves=(2, 5), weights=(1, .4))
        rmask = smooth(rb, .78, .97) * red
        img += (ROUGE - img) * rmask[..., None] * .75
    if detail:
        # un recadrage plus serré avec plus de grain, pour simuler la vue détail
        img = img[h // 4: h // 4 + h // 2, w // 4: w // 4 + w // 2]
        pil = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).resize((w, h), Image.LANCZOS)
        pil = pil.filter(ImageFilter.GaussianBlur(0.6))
        return pil
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))

jobs = [
    ('planche-01.jpg', dict(seed=11, red=.0)),
    ('planche-02.jpg', dict(seed=23, red=.9)),
    ('planche-03.jpg', dict(seed=37, red=.0)),
    ('planche-04.jpg', dict(seed=41, red=.5)),
    ('planche-04-detail.jpg', dict(seed=41, red=.5, detail=True)),
    ('ambiance.jpg', dict(seed=7, red=.35, w=1600, h=1000)),
]
for name, kw in jobs:
    im = planche(**kw)
    im.save(os.path.join(OUT, name), quality=80, optimize=True, progressive=True)
    print(name, im.size, os.path.getsize(os.path.join(OUT, name)) // 1024, 'ko')
