// node sheet_idx.mjs <n> <i,j,k,...> [cols] [width] -> cN-deck/sheet_idx.jpg : chosen scene stills in a grid (quick visual check)
import fs from "fs"; import { spawnSync } from "child_process";
const n = process.argv[2], idx = process.argv[3].split(",").map(Number), cols = +(process.argv[4] || 4), W = +(process.argv[5] || 480);
const D = JSON.parse(fs.readFileSync(`c${n}/deck.json`, "utf8")), S = D.scenes.filter((x) => !x.filmOnly);
const nm = (i) => `c${n}-deck/stills/t_${+(i === S.length - 1 ? D.dur - 0.2 : Math.max(S[i].t + 0.2, S[i + 1].t - 0.45)).toFixed(2)}.jpg`;
const rows = Math.ceil(idx.length / cols), H = Math.round(W * 9 / 16);
const inputs = idx.flatMap((i) => ["-i", nm(i)]);
const f = idx.map((_, k) => `[${k}]scale=${W}:${H}[s${k}]`).join(";") + ";" + Array.from({ length: rows }, (_, r) => { const a = idx.map((_, k) => k).slice(r * cols, r * cols + cols); return a.map((k) => `[s${k}]`).join("") + `hstack=${a.length}[r${r}]`; }).join(";") + ";" + Array.from({ length: rows }, (_, r) => `[r${r}]`).join("") + (rows > 1 ? `vstack=${rows}` : "copy");
const r = spawnSync("ffmpeg", ["-v", "error", "-y", ...inputs, "-filter_complex", f, `c${n}-deck/sheet_idx.jpg`], { encoding: "utf8" }); console.log(r.stderr || "ok");
