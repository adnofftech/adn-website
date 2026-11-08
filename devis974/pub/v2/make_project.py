"""Génère les sous-titres de la voix off et un projet FCPXML 1.10 (Final Cut Pro / DaVinci Resolve) par format.
Pistes : V1 = image du film (sans son) ; A1 = musique (fichier client, à relier) ; A2 = voix off ; A3 = effets.
Marqueurs : chaque coupe du storyboard (temps musicaux) et chaque mesure (124 BPM)."""
import json, os, re
from fractions import Fraction as Fr
HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(HERE, "timeline.json"))); BJ = json.load(open(os.path.join(HERE, "beats.json")))
BT = BJ["beats"]; T = TL["duration"]; FPS = 30
def b(x):
    i = int(x); f = x - i
    return BT[-1] + (x - len(BT) + 1) * 0.48387 if i >= len(BT) - 1 else BT[i] + f * (BT[i + 1] - BT[i])
# sous-titres voix off (version sans musique)
TEXT = {"l0": "À La Réunion, quand on est artisan, les journées passent vite…", "l1": "Entre les appels, les devis et les relances, difficile de tout gérer.",
        "l2": "Découvrez Devis974, le logiciel pensé pour les artisans réunionnais.", "l3": "Retrouvez vos clients, leurs demandes et vos prochaines actions au même endroit.",
        "l8": "Des devis propres, prêts à envoyer.", "l5": "Et surtout, n’oubliez plus les clients qui attendent votre réponse.", "l7": "Devis974. Le logiciel pensé pour les pros péi."}
spans = json.load(open(os.path.join(HERE, "out_vo_spans.json")))
ts = lambda x: f"00:00:{int(x):02d},{int(round((x % 1) * 1000)) % 1000:03d}"
with open(os.path.join(HERE, "out/devis974_v2_voix-off.srt"), "w") as f:
    for i, (n, a, z) in enumerate(spans): f.write(f"{i + 1}\n{ts(a)} --> {ts(min(z, T))}\n{TEXT[n]}\n\n")
# coupes du storyboard (début de chaque ligne du registre)
cuts = []
for ln in open(os.path.join(HERE, "STORYBOARD.md")):
    m = re.match(r"\| (\d+) \| 0:(\d+\.\d+) \| [\d.]+ \| (\w+) \|.*\|\s*$", ln)
    if m: cuts.append((float(m.group(2)), f"Plan {m.group(1)} · {m.group(3)}"))
def fr(sec): f = round(sec * FPS); return f"{f}/{FPS}s" if f % FPS else f"{f // FPS}s"
for fmt, (w, h) in {"9x16": (1080, 1920), "16x9": (1920, 1080)}.items():
    D = fr(T)
    marks = "".join(f'<marker start="{fr(t)}" duration="1/30s" value="{v}"/>' for t, v in cuts)
    marks += "".join(f'<marker start="{fr(b(4 * k))}" duration="1/30s" value="Mesure {k}"/>' for k in range(17))
    xml = f'''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.10">
 <resources>
  <format id="r1" name="FFVideoFormat{h}p30" frameDuration="1/30s" width="{w}" height="{h}"/>
  <asset id="a1" name="image_{fmt}" start="0s" duration="{D}" hasVideo="1" format="r1"><media-rep kind="original-media" src="./devis974_v2_{fmt}_image.mp4"/></asset>
  <asset id="a2" name="musique (fichier client, à relier)" start="0s" duration="{D}" hasAudio="1" audioSources="1" audioChannels="2" audioRate="48000"><media-rep kind="original-media" src="./stems/music.wav"/></asset>
  <asset id="a3" name="voix off" start="0s" duration="{D}" hasAudio="1" audioSources="1" audioChannels="2" audioRate="48000"><media-rep kind="original-media" src="./stems/vo.wav"/></asset>
  <asset id="a4" name="effets" start="0s" duration="{D}" hasAudio="1" audioSources="1" audioChannels="2" audioRate="48000"><media-rep kind="original-media" src="./stems/sfx.wav"/></asset>
 </resources>
 <library><event name="Devis974 v2"><project name="Devis974 v2 · {fmt} · 124 BPM">
  <sequence format="r1" duration="{D}" tcStart="0s" tcFormat="NDF" audioLayout="stereo" audioRate="48k">
   <spine>
    <asset-clip ref="a1" offset="0s" name="image_{fmt}" duration="{D}">
     {marks}
     <asset-clip ref="a2" lane="-1" offset="0s" name="musique" duration="{D}" audioRole="music"/>
     <asset-clip ref="a3" lane="-2" offset="0s" name="voix off" duration="{D}" audioRole="dialogue"/>
     <asset-clip ref="a4" lane="-3" offset="0s" name="effets" duration="{D}" audioRole="effects"/>
    </asset-clip>
   </spine>
  </sequence>
 </project></event></library>
</fcpxml>
'''
    open(os.path.join(HERE, f"out/devis974_v2_{fmt}.fcpxml"), "w").write(xml)
print(len(cuts), "coupes ·", len(spans), "répliques")
