// node plan.mjs <n> <aMain> <bMain> -> cN/words_final.json (main take, silence-trimmed final times) + a compact transcript with final times
import fs from "fs";
const [n, a, b] = [process.argv[2], +process.argv[3], +process.argv[4]];
const W = JSON.parse(fs.readFileSync(`c${n}/tx.json`, "utf8")), S = JSON.parse(fs.readFileSync(`c${n}/silence.json`, "utf8"));
const cuts = S.filter(([s, e]) => e - s > 0.19 && s >= a && e < b).map(([s, e]) => [s + 0.05, e - 0.07]);
const f = (t) => (t - a) - cuts.reduce((m, [c0, c1]) => m + Math.max(0, Math.min(t, c1) - c0), 0);
const words = W.filter((w) => w.start >= a - 0.05 && w.start < b).map((w) => ({ w: w.text, s: +f(w.start).toFixed(2), e: +f(w.end).toFixed(2), raw: w.start }));
fs.writeFileSync(`c${n}/words_final.json`, JSON.stringify(words));
const dur = f(b);
console.log("final main length", dur.toFixed(1));
let line = "";
words.forEach((w, i) => { if (i === 0 || /[.?!]$/.test(words[i - 1].w)) { if (line) console.log(line); line = `[${w.s.toFixed(1)}] `; } line += w.w + " "; });
console.log(line);
