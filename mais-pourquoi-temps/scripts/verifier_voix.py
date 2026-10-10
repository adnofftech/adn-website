"""Vérifie qu'une narration générée dit bien le texte prévu : transcription locale (faster-whisper),
comparaison mot à mot avec le script, et horodatage de chaque mot.
usage : python3 verifier_voix.py <audio.mp3> <texte_attendu.txt> <sortie.json>"""
import sys, json, re, subprocess, difflib, unicodedata
import numpy as np
from faster_whisper import WhisperModel

audio, ref_path, out_path = sys.argv[1:4]
# décodage en 16 kHz mono flottant (le décodeur interne de faster-whisper n'est pas utilisé)
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", audio, "-f", "f32le", "-ac", "1", "-ar", "16000", "-"], capture_output=True, check=True).stdout
wave = np.frombuffer(raw, dtype=np.float32)
model = WhisperModel("small", device="cpu", compute_type="int8")
segs, info = model.transcribe(wave, language="fr", word_timestamps=True, vad_filter=False, beam_size=5)
words = [(w.start, w.end, w.word.strip()) for s in segs for w in s.words]

def norm(x):
    x = unicodedata.normalize("NFD", x.lower().replace("’", "'"))
    x = "".join(c for c in x if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9']", "", x)

ref = [t for t in open(ref_path, encoding="utf-8").read().split() if norm(t)]
hyp = [w for w in words if norm(w[2])]
a = [norm(t) for t in ref]; b = [norm(w[2]) for w in hyp]
sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
diffs = [(op, " ".join(ref[i1:i2]), " ".join(w[2] for w in hyp[j1:j2])) for op, i1, i2, j1, j2 in sm.get_opcodes() if op != "equal"]
print("durée audio %.1f s | mots attendus %d | mots entendus %d | similitude %.1f %%" % (len(wave) / 16000, len(a), len(b), 100 * sm.ratio()))
for d in diffs[:60]: print(d)
json.dump({"words": [[round(s, 2), round(e, 2), t] for s, e, t in words], "diffs": diffs, "ratio": sm.ratio(), "duration": len(wave) / 16000}, open(out_path, "w", encoding="utf-8"), ensure_ascii=False)
