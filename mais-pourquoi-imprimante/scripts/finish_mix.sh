#!/usr/bin/env bash
# Raccorde le début re-rendu (0-30 s) à la fin existante (30 s -> fin) et remplace toute la piste audio
# par : narration Léo + bed (musique/SFX) abaissé.   usage: finish_mix.sh new0_30.mp4 old_full.mp4 out.mp4
set -e
NEW="$1"; OLD="$2"; OUT="$3"; D="$(cd "$(dirname "$0")/.." && pwd)"
ffmpeg -v error -y -i "$NEW" -ss 30 -i "$OLD" \
  -i "$D/audio/narration_leo.mp3" -i "$D/video/audio/bed.wav" \
  -filter_complex "[0:v]trim=0:30,setpts=PTS-STARTPTS,fps=30[a];[1:v]trim=start=0:end=39.5,setpts=PTS-STARTPTS,fps=30[b];[a][b]concat=n=2:v=1:a=0[v];\
[2:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=2.0[n];[3:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.5[m];\
[n][m]amix=inputs=2:duration=longest:normalize=0,alimiter=limit=0.95[aud]" \
  -map "[v]" -map "[aud]" -t 69.5 -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart "$OUT"
