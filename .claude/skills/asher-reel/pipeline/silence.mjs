// real silences in Reel 2.mp4 (from the audio, not from ASR word times) -> silence.json [[start,end],...] in clip time
import fs from "fs"; import { spawnSync } from "child_process";
const r = spawnSync("ffmpeg", ["-hide_banner", "-i", "../Raws/Reel 2.mp4", "-vn", "-af", "silencedetect=noise=-42dB:d=0.18", "-f", "null", "-"], { encoding: "utf8" });
const out = []; let s = null;
for (const ln of r.stderr.split("\n")) {
  const a = ln.match(/silence_start: ([\d.]+)/), b = ln.match(/silence_end: ([\d.]+)/);
  if (a) s = +a[1]; if (b && s != null) { out.push([+s.toFixed(3), +(+b[1]).toFixed(3)]); s = null; }
}
fs.writeFileSync("silence.json", JSON.stringify(out));
console.log(out.length, "silences; total", out.reduce((t, [a, b]) => t + b - a, 0).toFixed(1), "s");
console.log(out.filter(([a, b]) => b - a > 0.4 && a > 4 && b < 81).map(([a, b]) => a.toFixed(2) + "-" + b.toFixed(2)).join("  "));
