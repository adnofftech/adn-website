import subprocess, sys, os, re, difflib, numpy as np, shutil
from faster_whisper import WhisperModel
VV = "/home/user/microsoft/VibeVoice"; OUT = "/home/user/devis974-pub/vo"
TARGET = {1: "entre les appels les devis et les relances difficile de tout gérer",
  2: "découvrez devis 974 le logiciel pensé pour les artisans réunionnais",
  4: "préparez vos devis professionnels rapidement et gardez une trace de chaque proposition",
  6: "moins d administratif plus de temps pour votre métier",
  7: "devis 974 le logiciel pensé pour les pros péi"}
VAR = {6: ["Moins d'administratif, plus de temps pour votre métier.", "Moins d'administratif... et plus de temps pour votre métier !"],
  4: ["Préparez vos devis professionnels rapidement, et gardez une trace de chaque proposition.", "Préparez vos devis professionnels, rapidement... et gardez une trace de chaque proposition."]}
m = WhisperModel("small", device="cpu", compute_type="int8")
norm = lambda s: re.sub(r"[^a-zàâçéèêëîïôûùüÿœ0-9 ]", " ", s.lower().replace("neuf sept quatre", "974").replace("dévi", "devis").replace("péï", "péi").replace("péyi", "péi").replace("pé-i","péi").replace("pa-pe-rasse","paperasse").replace("papeurasse","paperasse")).split()
def score(f, i):
    a = np.frombuffer(subprocess.run(["ffmpeg","-v","quiet","-i",f,"-ac","1","-ar","16000","-f","f32le","-"],capture_output=True).stdout, np.float32)
    txt = " ".join(s.text for s in m.transcribe(a, language="fr")[0])
    return difflib.SequenceMatcher(None, norm(txt), norm(TARGET[i])).ratio(), txt
for i, vars_ in VAR.items():
    best = (0, None, None)
    for v, text in enumerate(vars_):
        for take in range(2):
            open(f"{OUT}/t.txt", "w").write(text + "\n")
            subprocess.run([f"/home/user/vv/bin/python", f"{OUT}/run_vv.py", "--model_path", "microsoft/VibeVoice-Realtime-0.5B", "--txt_path", f"{OUT}/t.txt",
                            "--speaker_name", "fr-Spk0_man", "--output_dir", f"{OUT}/tk", "--device", "cpu"], cwd=VV, capture_output=True)
            f = f"{OUT}/tk/l{i}_v{v}_k{take}.wav"; shutil.move(f"{OUT}/tk/t_generated.wav", f)
            sc, txt = score(f, i); print(i, v, take, round(sc, 2), txt.strip(), flush=True)
            if sc > best[0]: best = (sc, f, txt)
    shutil.copy(best[1], f"{OUT}/out/l{i}_generated.wav"); print("=> ligne", i, "retenue", round(best[0], 2), best[2].strip(), flush=True)
