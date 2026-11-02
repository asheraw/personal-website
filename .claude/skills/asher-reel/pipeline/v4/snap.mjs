// node snap.mjs <hyperframes-project-dir> <out.png>   (snapshot frame 0.1 s of a HyperFrames page and copy the png)
import { spawnSync } from "child_process"; import fs from "fs";
const [dir, out] = process.argv.slice(2);
const r = spawnSync("npx", ["hyperframes", "snapshot", "--at", "0.1"], { cwd: dir, encoding: "utf8", shell: true });
const m = (r.stdout + r.stderr).match(/^\s*(.*frame-00-at-0\.1s\.png)\s*$/m);
if (!m) { console.log(r.stdout, r.stderr); process.exit(1); }
const p = m[1].trim().replace(/\\/g, "/"); fs.copyFileSync(/^[A-Za-z]:/.test(p) ? p : dir + "/" + p, out); console.log("saved", out);
