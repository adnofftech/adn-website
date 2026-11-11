"""Aligne le texte exact du script sur les timings mot à mot (Whisper) -> video/js/captions.js"""
import json, re, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
raw = json.load(open(f"{ROOT}/audio/word_timings.json"))
# fusionne les jetons whisper (l + 'argent, Dis + -le, ponctuation)
tok = []
for s, e, w in raw:
    if tok and (w.startswith("'") or w.startswith("-") or w in {"?", "!", "%", ".", ","}):
        tok[-1][2] += w; tok[-1][1] = e
    else: tok.append([s, e, w])
script = []
for w in open(f"{ROOT}/narration.txt", encoding="utf-8").read().split():
    if script and w in {"?", "!", ":", ";"}: script[-1] += " " + w if w in {"?", "!", ":"} else w
    else: script.append(w)
# cas particulier : "90 %" (whisper) = "quatre-vingt-dix pour cent" (script)
words = []; i = 0; skip = 0
for sw in script:
    if skip:
        skip -= 1; continue
    if sw == "quatre-vingt-dix":
        s, e, _ = tok[i]; s2, e2 = s, e; i += 1; skip = 2
        d = (e2 - s) / 3
        words += [[s, s + d, "quatre-vingt-dix"], [s + d, s + 2 * d, "pour"], [s + 2 * d, e2, "cent"]]
    else:
        s, e, _ = tok[i]; i += 1; words.append([s, e, sw])
assert i == len(tok), (i, len(tok))
# découpage en groupes de sous-titres
chunks, cur = [], []
def flush():
    global cur
    if cur: chunks.append(cur); cur = []
def endp(w): return bool(re.search(r"[.?!:]$", w))
for n, w in enumerate(words):
    cur.append(w); txt = " ".join(x[2] for x in cur)
    nxt = words[n + 1][2] if n + 1 < len(words) else ""
    last2 = endp(nxt) or bool(re.search(r",$", nxt))     # le mot suivant clôt une phrase : on l'absorbe pour éviter un orphelin
    if endp(w[2]) and len(cur) >= 2: flush()
    elif endp(w[2]): flush()
    elif re.search(r",$", w[2]) and len(cur) >= 3: flush()
    elif (len(cur) >= 5 or len(txt) > 26) and not last2: flush()
    elif len(cur) >= 6 or len(txt) > 34: flush()
flush()
# fusionne les groupes orphelins (1 mot) avec le précédent si l'écart est court
merged = []
for c in chunks:
    if merged and len(c) == 1 and len(merged[-1]) <= 5 and c[0][0] - merged[-1][-1][1] < 0.5: merged[-1] += c
    else: merged.append(c)
chunks = merged
out = []
for k, c in enumerate(chunks):
    start = c[0][0]; end = (chunks[k + 1][0][0] if k + 1 < len(chunks) else c[-1][1] + 0.4)
    end = min(end, c[-1][1] + 0.45)
    out.append({"s": round(start, 2), "e": round(end, 2), "w": [[round(x[0], 2), round(x[1], 2), x[2].upper()] for x in c]})
open(f"{ROOT}/video/js/captions.js", "w", encoding="utf-8").write("window.CAPTIONS=" + json.dumps(out, ensure_ascii=False) + ";\n")
print(len(words), "mots,", len(out), "groupes")
for c in out[:6] + out[-3:]: print(c["s"], c["e"], " ".join(x[2] for x in c["w"]))
