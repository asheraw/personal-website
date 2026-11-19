#!/bin/sh
# usage (from _work): sh run_any.sh <n>   -> "<NN> <title> - v1.mp4" in the project root (one version for all platforms)
set -e
n=$1; P="D:/Work/Social Media/2026/11-16 Blending in vs Standing out"; R="$P/_work"; LIB=/c/Users/Admin/lemo-opuscar; PY=/d/Work/whisper-env/Scripts/python.exe
cd "$R"
for f in bake.py; do cp c1/$f c$n/$f; done
cp build4_any.mjs c$n/build4.mjs
cp mix_any.py c$n/mix2.py
node edl_any.mjs $n
(cd c$n && node ../edl3_any.mjs)
python mk_film_any.py >/dev/null && python mk_anim2.py >/dev/null && python fb5.py >/dev/null && node film_any.mjs $n
node hooks_any.mjs $n
. ./c$n/env.sh
export HOOKS="$(cat c$n/hooks_video.json)"
cd $LIB && node core/render/events.mjs "$R/c$n-film" --out "$R/c$n-film/events.json" && node core/render/video.mjs "$R/c$n-film" --fps 30 --workers 4 --out "$R/c$n-film/out/board.mp4"
cd "$R/c$n"; mkdir -p assets/fonts renders; cp "$R/c$n-film/out/board.mp4" assets/board.mp4
$PY bake.py 460 --person-only
cp person.mp4 assets/; cp person.mp4 assets/popP.mp4; cp person.mp4 assets/popM.mp4
cp "$R/c$n-deck/stills/thumb.png" assets/thumb.png; cp "$R/endcard.png" assets/endcard.png
cp /c/Users/Admin/.claude/skills/asher-reel/pipeline/fonts/Montserrat-800.woff2 assets/fonts/
$PY mix2.py && node build4.mjs && npx hyperframes render -o renders/silent.mp4 --fps 30 2>&1 | grep -E "Render complete|rror" | tail -3
ffmpeg -v error -y -i renders/silent.mp4 -i mix.wav -map 0:v -map 1:a -c:v copy -af "loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 -c:a aac -b:a 192k -shortest -movflags +faststart "$P/$OUT" && echo "done $OUT"
