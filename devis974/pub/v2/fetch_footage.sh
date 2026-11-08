#!/usr/bin/env bash
# Récupère les vidéos filmées (Pexels License / Mixkit Free License) puis extrait les images du film.
set -euo pipefail
D="${STOCK:-$(dirname "$0")/stock}"; mkdir -p "$D"
python3 - "$D" <<'PY'
import json, os, subprocess, sys
d = sys.argv[1]; C = json.load(open(os.path.join(os.path.dirname(os.path.abspath(sys.argv[0])) if False else ".", "clips.json")))
for k, c in C.items():
    if k.startswith("_"): continue
    src, f = c["src"], os.path.join(d, c["src"] + ".mp4")
    if os.path.exists(f) and os.path.getsize(f) > 10000: continue
    i = src.split("_")[1]
    url = f"https://www.pexels.com/download/video/{i}/" if src.startswith("px") else f"https://assets.mixkit.co/videos/{i}/{i}-720.mp4"
    subprocess.run(["curl", "-sS", "-A", "Mozilla/5.0", "-L", "-o", f, url], check=True); print("ok", src)
PY
STOCK="$D" python3 extract_footage.py
