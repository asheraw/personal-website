#!/bin/sh
# usage: sh run.sh ig|web   (from _work/reel-4).  Needs lemo-opuscar at ~/lemo-opuscar.
V=${1:-ig}; R="D:/Work/Social Media/2026/10-22 Offer regrets/_work"; LIB=/c/Users/Admin/lemo-opuscar
if [ "$V" = web ]; then export WEB=1; Q="--q variant=web"; SUF=_web; OUT="Reel 4 - Other platforms.mp4"; else Q=""; SUF=""; OUT="Reel 4 - Instagram.mp4"; fi
node edl.mjs && node edl3.mjs && cp ranges.json "../reel-4-board/ranges$SUF.json" && cp hold.json words_clip.json ../reel-4-board/ || exit 1
cd $LIB && node core/render/events.mjs "$R/reel-4-board" $Q --out "$R/reel-4-board/events$SUF.json" | tail -1 && node core/render/video.mjs "$R/reel-4-board" $Q --fps 30 --workers 6 --out "$R/reel-4-board/out/board$SUF.mp4" | tail -1 || exit 1
cp "$R/reel-4-board/out/board$SUF.mp4" "$R/reel-4/assets/board.mp4"; cd "$R/reel-4"
python mix2.py && node build.mjs | head -1 && npx hyperframes render -o renders/silent$SUF.mp4 --fps 30 2>&1 | grep -E "Render complete|rror" | tail -2
ffmpeg -v error -y -i renders/silent$SUF.mp4 -i mix.wav -map 0:v -map 1:a -c:v copy -af "loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 -c:a aac -b:a 192k -shortest -movflags +faststart "../../$OUT" && echo "done $OUT"
