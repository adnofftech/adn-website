"""Sous-titres : groupes de mots tirés de timing.json (texte = script définitif) -> video/js/captions.js"""
import json, re, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = json.load(open(f"{ROOT}/timing.json"))
words = [w for s in T["scenes"] for w in s["words"]]
def endp(w): return bool(re.search(r"[.?!:…]$", w)) or w.endswith("…")
chunks, cur = [], []
def flush():
    global cur
    if cur: chunks.append(cur); cur = []
# scène de chaque mot (pour ne jamais faire déborder un groupe sur la scène suivante)
scene_of = [sc["n"] if "n" in sc else i + 1 for i, sc in enumerate(T["scenes"]) for _ in sc["words"]]
# coupures voulues avant un mot (scène, mot déjà en majuscules) : évite « NE » ou « DE » seuls en fin de ligne
BREAK_BEFORE = {(5, "AUQUEL"), (6, "DE")}
MAXC = 28  # 2 lignes maximum à 66 px dans 860 px de large
seen_break = set()
for n, w in enumerate(words):
    up = w[2].upper()
    if cur:
        txt0 = " ".join(x[2] for x in cur)
        newscene = scene_of[n] != scene_of[n - 1]
        brk = (scene_of[n], up) in BREAK_BEFORE and (scene_of[n], up) not in seen_break and (scene_of[n] != 6 or cur[-1][2].upper().startswith("JUSTE"))
        toolong = len(cur) >= 3 and len(txt0) + 1 + len(w[2]) > MAXC and not (endp(w[2]) and len(txt0) + 1 + len(w[2]) <= MAXC + 6)
        if newscene or brk or toolong:
            if brk: seen_break.add((scene_of[n], up))
            flush()
    cur.append(w); txt = " ".join(x[2] for x in cur)
    nxt = words[n + 1][2] if n + 1 < len(words) else ""
    absorb = endp(nxt) or nxt.endswith(",")
    if endp(w[2]): flush()
    elif w[2].endswith(",") and len(cur) >= 3: flush()
    elif (len(cur) >= 5 or len(txt) > 22) and not absorb: flush()
    elif len(cur) >= 6 or len(txt) > MAXC: flush()
flush()
merged = []
for c in chunks:
    if merged and len(c) == 1 and len(merged[-1]) <= 5 and c[0][0] - merged[-1][-1][1] < 0.5 and not endp(merged[-1][-1][2]): merged[-1] += c
    else: merged.append(c)
out = []
for k, c in enumerate(merged):
    start = c[0][0]; end = merged[k + 1][0][0] if k + 1 < len(merged) else c[-1][1] + 0.5
    end = min(end, c[-1][1] + 0.45)
    out.append({"s": round(start, 2), "e": round(end, 2), "w": [[x[0], x[1], x[2].upper()] for x in c]})
open(f"{ROOT}/video/js/captions.js", "w", encoding="utf-8").write("window.CAPTIONS=" + json.dumps(out, ensure_ascii=False) + ";\n")
print(len(words), "mots,", len(out), "groupes"); print(" | ".join(" ".join(x[2] for x in c["w"]) for c in out[:12]))
