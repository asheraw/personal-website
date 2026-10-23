// node sheet.mjs <stillsDir> <out.jpg> <cols> t1 t2 ...   -> contact sheet of t_<t>.jpg
import { spawnSync } from "child_process";
const [dir, out, cols, ...ts] = process.argv.slice(2);
const inputs = ts.flatMap((t) => ["-i", `${dir}/t_${t}.jpg`]);
const sc = ts.map((_, i) => `[${i}]scale=480:-1[s${i}]`).join(";");
const rows = []; for (let i = 0; i < ts.length; i += +cols) { const r = ts.slice(i, i + +cols).map((_, j) => `[s${i + j}]`).join(""); rows.push([r, Math.min(+cols, ts.length - i)]); }
const hs = rows.map(([r, n], k) => `${r}hstack=${Math.max(2, n)}${n < 2 ? "" : ""}[r${k}]`).join(";");
const v = rows.map((_, k) => `[r${k}]`).join("") + `vstack=${rows.length}`;
const fc = `${sc};${hs};${v}`;
const r = spawnSync("ffmpeg", ["-v", "error", "-y", ...inputs, "-filter_complex", fc, out], { encoding: "utf8" }); console.log(r.stderr || "ok");
