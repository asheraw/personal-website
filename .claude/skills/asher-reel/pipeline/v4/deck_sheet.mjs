// node deck_sheet.mjs <n>  -> cN-deck/sheet.jpg : 6 scene stills (every 3rd) in a 3x2 grid, for a quick visual check
import fs from "fs"; import { spawnSync } from "child_process";
const n = process.argv[2], d = `c${n}-deck/stills`;
const f = fs.readdirSync(d).filter((x) => /^t_.*\.jpg$/.test(x)).sort((a, b) => parseFloat(a.slice(2)) - parseFloat(b.slice(2)));
const pick = [1, 4, 6, 8, 11, 13].map((i) => f[Math.min(i, f.length - 1)]);
const args = ["-v", "error", "-y", ...pick.flatMap((p) => ["-i", `${d}/${p}`]), "-filter_complex", pick.map((_, i) => `[${i}]scale=640:-1[s${i}]`).join(";") + ";[s0][s1][s2]hstack=3[r1];[s3][s4][s5]hstack=3[r2];[r1][r2]vstack", `c${n}-deck/sheet.jpg`];
console.log(spawnSync("ffmpeg", args, { encoding: "utf8" }).stderr || "ok", pick.join(" "));
