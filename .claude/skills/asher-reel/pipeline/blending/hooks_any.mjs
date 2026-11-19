// node hooks_any.mjs <n> (from _work, after film_any) -> cN/hooks_video.json + cN/env.sh (KEYS, ZOOMS, LAND, MUSIC, MUSIC_SCENE, BILLIE, OUT)
import fs from "fs";
import { C } from "./cuts.mjs";
import { R } from "./reels.mjs";
const n = +process.argv[2], X = C[n], T = JSON.parse(fs.readFileSync(`c${n}-film/times.json`, "utf8")).scenes;
const H = X.hooks.map(([k, h], i) => [i === 0 ? 1.0 : +T[k].toFixed(2), h]).sort((a, b) => a[0] - b[0]);
fs.writeFileSync(`c${n}/hooks_video.json`, JSON.stringify(H, null, 1));
const q = (s) => `'${String(s).replace(/'/g, "'\\''")}'`;
const NN = String(n).padStart(2, "0");
fs.writeFileSync(`c${n}/env.sh`, [`export KEYS=${q(X.keys)}`, `export ZOOMS=${q(JSON.stringify(X.zooms))}`, `export LAND=${q(JSON.stringify(X.land || []))}`, `export MUSIC=${q(X.music)}`,
  X.musicAtScene !== undefined ? `export MUSIC_SCENE=${X.musicAtScene}` : "unset MUSIC_SCENE", X.sting ? `export STING_AT=${q(JSON.stringify(X.sting.at))} STING_FILE=${q(X.sting.file)} STING_GAIN=${X.sting.gain} STING_OFF=${X.sting.off || 0} STING_LEN=${X.sting.len || 2.3}` : "unset STING_AT", `export PROPER=${q(X.proper || "")}`, `OUT=${q(`${NN} ${R[n].title} - v${X.ver || 1}.mp4`)}`].join("\n") + "\n");
console.log("hooks", H.map((h) => h[0]).join(" "));
