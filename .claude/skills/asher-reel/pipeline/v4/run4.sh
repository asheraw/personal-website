#!/bin/sh
# usage: sh run4.sh   (from _work/c1) -> renders "01 Claude Reel 1 - IG.mp4" next to the raws. Needs lemo-opuscar at ~/lemo-opuscar.
P="D:/Work/Social Media/2026/11-02 Imperfect offers"; R="$P/_work"; LIB=/c/Users/Admin/lemo-opuscar
export HOOK="${HOOK:-I Copied The Experts.|Sold <b>NOTHING</b>.}"
node silence.mjs >/dev/null && node edl.mjs && node edl3.mjs || exit 1
cp edl.json words.json ranges.json ../c1-board/ && (cd ../c1-board && python build_film.py >/dev/null) || exit 1
cd $LIB && node core/render/events.mjs "$R/c1-board" --out "$R/c1-board/events.json" | tail -1 && node core/render/video.mjs "$R/c1-board" --fps 30 --workers 6 --out "$R/c1-board/out/board.mp4" | tail -1 || exit 1
cd "$R/c1"; mkdir -p assets; cp "$R/c1-board/out/board.mp4" assets/board.mp4
[ -f popP.mp4 ] || /d/Work/whisper-env/Scripts/python.exe bake.py 460
cp person.mp4 popP.mp4 popM.mp4 thumb/thumb.png assets/
[ -d assets/fonts ] || cp -r ../../../10-22\ Offer\ regrets/_work/reel-8/assets/fonts assets/
python mix2.py && node build4.mjs && npx hyperframes render -o renders/silent.mp4 --fps 30 2>&1 | grep -E "Render complete|rror" | tail -2
ffmpeg -v error -y -i renders/silent.mp4 -i mix.wav -map 0:v -map 1:a -c:v copy -af "loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 -c:a aac -b:a 192k -shortest -movflags +faststart "$P/01 Claude Reel 1 - IG v1.mp4" && echo done
