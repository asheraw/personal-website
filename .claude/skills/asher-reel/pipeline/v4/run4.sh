#!/bin/sh
set -e
# usage: sh run4.sh [web]   (from _work/c1). Renders "01 Claude Reel 1 - IG v3.mp4" or "... - Other platforms v1.mp4" next to the raws.
# Layout: Asher stays in the lower half (no push-down, no pop-out), soft top edge, hook at the very top, thumbnail = frame 0. SP (speed) defaults to 1.0; use SP=1.1 only if the reel is near/over 90 s.
P="D:/Work/Social Media/2026/11-02 Imperfect offers"; R="$P/_work"; LIB=/c/Users/Admin/lemo-opuscar
V=${1:-ig}; if [ "$V" = web ]; then export WEB=1; Q="--q variant=web"; SUF=_web; OUT="01 Claude Reel 1 - Other platforms v1.mp4"; else Q=""; SUF=""; OUT="01 Claude Reel 1 - IG v3.mp4"; fi
export HOOK="${HOOK:-Here's how "being smart" by copying experts actually made me <b>fail</b> to make any sales for my offer}"
node silence.mjs >/dev/null && node edl.mjs && node edl3.mjs || exit 1
cp edl.json words.json ranges.json ../c1-board/ && (cd ../c1-board && python build_film2.py >/dev/null) || exit 1
cd $LIB && node core/render/events.mjs "$R/c1-board" $Q --out "$R/c1-board/events$SUF.json"  && node core/render/video.mjs "$R/c1-board" $Q --fps 30 --workers 6 --out "$R/c1-board/out/board$SUF.mp4"
cd "$R/c1"; mkdir -p assets; cp "$R/c1-board/out/board$SUF.mp4" assets/board.mp4
/d/Work/whisper-env/Scripts/python.exe bake.py 460 --person-only || exit 1
cp person.mp4 thumb/thumb.png assets/; cp person.mp4 assets/popP.mp4; cp person.mp4 assets/popM.mp4
[ -d assets/fonts ] || cp -r ../../../10-22\ Offer\ regrets/_work/reel-8/assets/fonts assets/
python mix2.py && node build4.mjs && npx hyperframes render -o renders/silent$SUF.mp4 --fps 30 2>&1 | grep -E "Render complete|rror" | tail -2
ffmpeg -v error -y -i renders/silent$SUF.mp4 -i mix.wav -map 0:v -map 1:a -c:v copy -af "loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 -c:a aac -b:a 192k -shortest -movflags +faststart "$P/$OUT" && echo "done $OUT"
