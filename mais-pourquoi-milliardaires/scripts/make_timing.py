"""Aligne le script DÉFINITIF (script.txt, jamais modifié) sur les timings mot à mot (Whisper)
-> video/js/timing.js + timing.json : fenêtres des 18 scènes + mots (texte = script)."""
import json, re, os, difflib
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
raw = json.load(open(f"{ROOT}/audio/word_timings.json"))
tok = []
for s, e, w in raw:
    if tok and (w.startswith("'") or w.startswith("-") or w in {"?", "!", "%", ".", ",", "…"}): tok[-1][2] += w; tok[-1][1] = e
    else: tok.append([s, e, w])
paras = [p.strip() for p in open(f"{ROOT}/script.txt", encoding="utf-8").read().split("\n\n") if p.strip()]
words = []   # (scene_index, texte)
for i, p in enumerate(paras):
    toks = []
    for w in p.split():
        if w in {"?", "!", ":", "…"} and toks: toks[-1] += " " + w if w != "…" else w
        else: toks.append(w)
    words += [(i, t) for t in toks]
norm = lambda x: re.sub(r"[^a-zàâçéèêëîïôûùüÿœ0-9]", "", x.lower())
a = [norm(t) for _, t in words]; b = [norm(t[2]) for t in tok]
print("script", len(a), "whisper", len(b))
sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
tim = [None] * len(a)
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag == "equal":
        for k in range(i2 - i1): tim[i1 + k] = (tok[j1 + k][0], tok[j1 + k][1])
    elif tag == "replace":
        n, m = i2 - i1, j2 - j1
        for k in range(n):                       # répartition proportionnelle sur l'intervalle remplacé
            jj = j1 + min(m - 1, int(k * m / n)); tim[i1 + k] = (tok[jj][0], tok[jj][1])
# trous éventuels : interpolation
for i, t in enumerate(tim):
    if t is None:
        p = next((tim[k] for k in range(i - 1, -1, -1) if tim[k]), (0, 0)); q = next((tim[k] for k in range(i + 1, len(tim)) if tim[k]), p)
        tim[i] = (p[1], max(p[1], q[0]))
DUR = 83.36
W = [[round(s, 2), round(e, 2), t, si] for (si, t), (s, e) in zip(words, tim)]
scenes = []
for i, p in enumerate(paras):
    ws = [w for w in W if w[3] == i]
    scenes.append({"n": i + 1, "text": p, "start": ws[0][0], "words": [[w[0], w[1], w[2]] for w in ws]})
for k, s in enumerate(scenes): s["end"] = scenes[k + 1]["start"] if k + 1 < len(scenes) else round(DUR + 0.6, 2)
scenes[0]["start"] = 0.0
out = {"duration": DUR, "videoDuration": round(DUR + 0.6, 2), "scenes": scenes}
json.dump(out, open(f"{ROOT}/timing.json", "w"), ensure_ascii=False, indent=1)
open(f"{ROOT}/video/js/timing.js", "w", encoding="utf-8").write("export const TIMING = " + json.dumps(out, ensure_ascii=False) + ";\n")
open(f"{ROOT}/video/js/timing.global.js", "w", encoding="utf-8").write("window.TIMING = " + json.dumps(out, ensure_ascii=False) + ";\n")
for s in scenes: print(f"S{s['n']:>2}  {s['start']:6.2f} → {s['end']:6.2f}  {s['text'][:60]}")
