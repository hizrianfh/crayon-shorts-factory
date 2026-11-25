#!/usr/bin/env bash
# bash finish.sh <name>  ->  out/<name>.mp4 (1080x1920, 30 fps, H.264 + AAC, -14 LUFS)
# needs frames/00000.jpg... and mix.wav
set -euo pipefail
name="${1:-crayon_short}"
mkdir -p out
n=$(ls frames/*.jpg | wc -l)
expected=$(python3 -c 'import json;print(json.load(open("current/meta.json"))["total_frames"])')
[ "$n" -eq "$expected" ] || { echo "frames/ has $n frames, meta.json says $expected" >&2; exit 1; }
ffmpeg -y -v error -framerate 30 -i frames/%05d.jpg -i mix.wav \
  -map 0:v:0 -map 1:a:0 -c:v libx264 -preset medium -crf 18 -vf "scale=1080:1920:flags=lanczos:out_range=tv,format=yuv420p" -color_range tv \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11" -c:a aac -b:a 192k -ar 48000 -movflags +faststart -shortest "out/$name.mp4"
echo "out/$name.mp4 $(du -h "out/$name.mp4" | cut -f1)"
