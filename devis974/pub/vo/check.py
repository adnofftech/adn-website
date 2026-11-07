import subprocess, sys, numpy as np
from faster_whisper import WhisperModel
m = WhisperModel("small", device="cpu", compute_type="int8")
for f in sys.argv[1:]:
    a = np.frombuffer(subprocess.run(["ffmpeg","-v","quiet","-i",f,"-ac","1","-ar","16000","-f","f32le","-"],capture_output=True).stdout, np.float32)
    segs, _ = m.transcribe(a, language="fr", word_timestamps=True); segs = list(segs)
    w = [x for s in segs for x in s.words]
    print(f.split('/')[-1], f"{len(a)/16000:.2f}s", f"[{w[0].start:.2f}-{w[-1].end:.2f}]" if w else "", "|", " ".join(s.text.strip() for s in segs), flush=True)
