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
for n, w in enumerate(words):
    cur.append(w); txt = " ".join(x[2] for x in cur)
    nxt = words[n + 1][2] if n + 1 < len(words) else ""
    absorb = endp(nxt) or nxt.endswith(",")
    if endp(w[2]): flush()
    elif w[2].endswith(",") and len(cur) >= 3: flush()
    elif (len(cur) >= 5 or len(txt) > 26) and not absorb: flush()
    elif len(cur) >= 6 or len(txt) > 34: flush()
flush()
merged = []
for c in chunks:
    if merged and len(c) == 1 and len(merged[-1]) <= 5 and c[0][0] - merged[-1][-1][1] < 0.5: merged[-1] += c
    else: merged.append(c)
out = []
for k, c in enumerate(merged):
    start = c[0][0]; end = merged[k + 1][0][0] if k + 1 < len(merged) else c[-1][1] + 0.5
    end = min(end, c[-1][1] + 0.45)
    out.append({"s": round(start, 2), "e": round(end, 2), "w": [[x[0], x[1], x[2].upper()] for x in c]})
open(f"{ROOT}/video/js/captions.js", "w", encoding="utf-8").write("window.CAPTIONS=" + json.dumps(out, ensure_ascii=False) + ";\n")
print(len(words), "mots,", len(out), "groupes"); print(" | ".join(" ".join(x[2] for x in c["w"]) for c in out[:12]))
