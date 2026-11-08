"""Extrait les images (30 i/s) des plans filmés, étalonnage commun bleu nuit / lumière chaude, côté court 1200 px."""
import json, subprocess, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); STOCK = os.environ.get("STOCK", "/home/user/d974ad/stock")
C = json.load(open(os.path.join(HERE, "clips.json")))
GRADE = "eq=contrast=1.07:saturation=0.9:gamma=0.98,colorbalance=rs=-0.03:bs=0.05:rh=0.03:bh=-0.02,unsharp=5:5:0.4"
for name, c in C.items():
    if name.startswith("_"): continue
    out = os.path.join(HERE, "assets/footage", name); os.makedirs(out, exist_ok=True)
    src = os.path.join(STOCK, c["src"] + ".mp4")
    w, h = map(int, subprocess.run(["ffprobe","-v","error","-select_streams","v:0","-show_entries","stream=width,height","-of","csv=p=0",src],capture_output=True,text=True).stdout.strip().split(",")[:2])
    sc = "scale=-2:1200" if w >= h else "scale=1200:-2"
    subprocess.run(["ffmpeg","-v","error","-y","-ss",str(c["in"]),"-t",str(c["dur"]),"-i",src,"-vf",f"fps=30,{sc}:flags=lanczos,{GRADE}","-q:v","3",os.path.join(out,"%04d.jpg")],check=True)
    n = len([f for f in os.listdir(out) if f.endswith(".jpg")]); c["frames"] = n; c["w"], c["h"] = (w, h)
    print(f"{name:12s} {c['src']:12s} {w}x{h} -> {n} images")
json.dump(C, open(os.path.join(HERE, "assets/footage/index.json"), "w"), indent=1)
