#!/bin/sh
# Transcribe Videos 02-12 (whisper medium, word times) + real silences. Run from _work.
M="/d/Work/Social Media/2026/11-16 Blending in vs Standing out/Materials"
for n in 2 3 4 5 6 7 8 9 10 11 12; do
  d=c$n; mkdir -p $d
  f=$(ls "$M" | grep -E "^Video +0?$n( |\.)" | head -1)
  [ -f $d/src.mp4 ] || cp "$M/$f" $d/src.mp4
  sed "s/Reel 10/Video $n/" c1/silence.mjs > $d/silence.mjs
  (cd $d && node silence.mjs > /dev/null)
  [ -f $d/tx.json ] || /d/Work/whisper-env/Scripts/python.exe /c/Users/Admin/.claude/skills/asher-reel/pipeline/whisper_tx.py $d/src.mp4 $d/tx.json medium
  echo "done $n ($f)"
done
