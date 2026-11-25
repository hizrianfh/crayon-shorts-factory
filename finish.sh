#!/usr/bin/env bash
# bash finish.sh [name]  ->  out/<name>.mp4 (default out/final.mp4): 1080x1920 30 fps H.264 + AAC at -14 LUFS,
# with current/captions.ass burned in using the bundled fonts/ (identical locally and on Actions).
# needs out/silent.mp4 (node render.mjs video) and mix.wav (mix.py)
set -euo pipefail
name="${1:-final}"
ep="${EP:-current}"
[ -s out/silent.mp4 ] && [ -s mix.wav ] && [ -s "$ep/captions.ass" ] || { echo "need out/silent.mp4, mix.wav and $ep/captions.ass" >&2; exit 1; }
ffmpeg -y -v error -i out/silent.mp4 -i mix.wav -map 0:v:0 -map 1:a:0 \
  -vf "ass=$ep/captions.ass:fontsdir=fonts" -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11" -c:a aac -b:a 192k -ar 48000 -movflags +faststart -shortest "out/$name.mp4"
echo "out/$name.mp4 $(du -h "out/$name.mp4" | cut -f1)"
