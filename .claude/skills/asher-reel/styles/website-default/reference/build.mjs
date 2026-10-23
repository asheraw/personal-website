// Generates index.html from template.html:  node build.mjs
//  - subtitle chunks from transcript.json (Parakeet word timings): <=3 words, sentence case, KEYWORDS in caps + gold
//  - every <audio> tag (music + sound effects) laid out on non-overlapping lanes
import fs from "fs";
import { execFileSync } from "child_process";

const DUR = 88.33;

// ---------- subtitles ----------
const t = JSON.parse(fs.readFileSync("transcript.json", "utf8"));
let raw = (t.words || t).map((w) => ({ s: w.start, e: w.end, t: w.text }));
const fixed = [];
for (let i = 0; i < raw.length; i++) {
  const w = raw[i];
  const low = w.t.toLowerCase().replace(/[.,?!]/g, "");
  if (low === "uh" || low === "um") continue;
  if (low === "forty" && raw[i + 1] && raw[i + 1].t.toLowerCase().startsWith("two")) {
    fixed.push({ s: w.s, e: raw[i + 1].e, t: "42" + (/[.,?!]$/.test(raw[i + 1].t) ? raw[i + 1].t.slice(-1) : "") });
    i++;
    continue;
  }
  if (low === "at" && /^\.?com/.test(raw[i + 1]?.t.toLowerCase() || "")) { // not expected, ASR joins it
    fixed.push(w); continue;
  }
  if (low === "at.com" || low === "atcom") { fixed.push({ s: w.s, e: w.e, t: "asheraw.com" }); continue; }
  fixed.push(w);
}
const KEYS = new Set(["42", "point", "polished", "proof", "thought", "ai", "beautifully", "good", "forgotten", "rented", "rules",
  "change", "rent", "stall", "mall", "data", "trust", "virality", "views", "vain", "money", "brand", "asheraw.com",
  "authentic", "sustainable", "home", "affected"]);
const FORCE = new Set([4.72, 4.96]); // "social media" only the first time
const words = fixed.map((w, i) => {
  const punct = (w.t.match(/[.,?!]$/) || [""])[0];
  const bare = w.t.replace(/[.,?!]+$/, "");
  const prev = fixed[i - 1];
  const sentStart = i === 0 || /[.?!]$/.test(prev.t);
  const key = KEYS.has(bare.toLowerCase()) || [...FORCE].some((f) => Math.abs(f - w.s) < 0.06);
  let text;
  if (key) text = bare.toUpperCase();
  else if (/^i('m|'ve|'ll|'d)?$/i.test(bare)) text = "I" + bare.slice(1).toLowerCase();
  else text = sentStart ? bare[0].toUpperCase() + bare.slice(1).toLowerCase() : bare.toLowerCase();
  return { s: w.s, e: w.e, text, key, punct };
});
const chunks = [];
let cur = [];
const flush = () => { if (cur.length) { chunks.push(cur); cur = []; } };
words.forEach((w, i) => {
  cur.push(w);
  const next = words[i + 1];
  const gap = next ? next.s - w.e : 9;
  if (cur.length >= 3 || w.punct || gap > 0.3) flush();
});
flush();
// avoid single-word orphans created by a break right after a long gap: fine as-is (keywords often stand alone)
const CHUNKS = chunks.map((c, i) => {
  const start = c[0].s;
  const nextStart = chunks[i + 1] ? chunks[i + 1][0].s : DUR;
  const lastEnd = c[c.length - 1].e;
  let end = nextStart - lastEnd <= 0.4 ? nextStart : lastEnd + 0.25;
  end = Math.min(end, DUR);
  if (end - start < 0.3) end = Math.min(start + 0.3, nextStart);
  return [+start.toFixed(2), +end.toFixed(2), c.map((w) => ({ t: w.text, k: w.key ? 1 : 0 }))];
});
CHUNKS[0][0] = 0;

// ---------- audio ----------
const SK = "C:/Users/Admin/.claude/skills/media-use/audio/assets/sfx/";
fs.mkdirSync("assets/sfx", { recursive: true });
const need = ["riser", "whoosh-cinematic", "whoosh-short", "impact-bass-1", "impact-bass-2", "sparkle", "pop", "chime", "click-soft", "glitch-1", "glitch-2", "key-press", "typing", "ping", "error"];
for (const n of need) if (!fs.existsSync(`assets/sfx/${n}.mp3`)) fs.copyFileSync(`${SK}${n}.mp3`, `assets/sfx/${n}.mp3`);
const dur = {};
for (const n of need) dur[n] = parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", `assets/sfx/${n}.mp3`]).toString());

// [time, file, volume, {dur?, from?}]   "from" = media-start (jump into the file)
const SFX = [
  // opening: riser -> slam
  [0.15, "riser", 0.5, { dur: 1.65, from: 2.85 }], [1.8, "impact-bass-1", 0.6], [1.8, "whoosh-cinematic", 0.3, { dur: 2.2, from: 2.2 }],
  [2.05, "pop", 0.35], [2.55, "whoosh-short", 0.3], [2.9, "pop", 0.45], [3.82, "whoosh-short", 0.3], [4.72, "pop", 0.3],
  [5.4, "whoosh-short", 0.3], [6.38, "sparkle", 0.45], [6.98, "whoosh-short", 0.3], [7.35, "pop", 0.3],
  [6.6, "riser", 0.4, { dur: 2.5, from: 2 }], [9.1, "impact-bass-2", 0.5], [9.12, "chime", 0.5],
  [9.75, "whoosh-short", 0.3], [10.3, "pop", 0.4], [11.9, "whoosh-short", 0.25], [12.72, "pop", 0.4], [13.0, "glitch-1", 0.22, { dur: 0.6 }],
  [14.1, "whoosh-short", 0.25], [14.7, "sparkle", 0.45, { dur: 1.2 }],
  // looks very very good / many people / forgotten
  [16.4, "whoosh-short", 0.3], [17.2, "pop", 0.35], [17.95, "sparkle", 0.5], [18.3, "whoosh-short", 0.25], [20.25, "pop", 0.35],
  [21.0, "pop", 0.4], [21.85, "whoosh-short", 0.3], [22.2, "pop", 0.3], [23.0, "glitch-2", 0.2, { dur: 0.5 }],
  // rented platform
  [23.3, "whoosh-short", 0.3], [24.2, "pop", 0.3], [24.6, "impact-bass-2", 0.55, { dur: 1.6 }], [25.8, "whoosh-short", 0.3],
  // rules change
  [26.85, "pop", 0.35], [27.7, "click-soft", 0.35], [27.9, "click-soft", 0.35], [28.1, "click-soft", 0.35], [28.4, "pop", 0.35],
  [29.45, "whoosh-short", 0.3],
  // stall in the mall
  [32.1, "pop", 0.35], [32.7, "ping", 0.35], [33.35, "whoosh-short", 0.3],
  // rent receipt
  [33.5, "click-soft", 0.35], [35.95, "key-press", 0.4], [37.25, "key-press", 0.4], [38.35, "key-press", 0.4], [39.65, "key-press", 0.4],
  [40.55, "key-press", 0.4], [41.25, "whoosh-short", 0.3],
  // rules change, you're affected
  [42.6, "pop", 0.35], [43.8, "pop", 0.4], [44.0, "ping", 0.25], [44.35, "ping", 0.22], [44.7, "ping", 0.2], [44.85, "whoosh-short", 0.3],
  // help people -> home page
  [46.1, "pop", 0.35], [48.0, "pop", 0.3], [48.75, "whoosh-short", 0.3], [49.55, "pop", 0.45], [49.6, "sparkle", 0.3, { dur: 1.2 }],
  [50.65, "whoosh-short", 0.3], [51.75, "click-soft", 0.4], [52.1, "click-soft", 0.4], [52.45, "click-soft", 0.4], [53.25, "whoosh-short", 0.3],
  // the build to "Trust."
  [53.95, "riser", 0.5, { dur: 2.6, from: 1.9 }], [56.55, "impact-bass-1", 0.7], [56.58, "chime", 0.55], [56.5, "whoosh-cinematic", 0.3, { dur: 2.2, from: 2.2 }],
  [57.25, "whoosh-short", 0.3],
  // virality / views / vain
  [59.4, "pop", 0.35], [60.5, "pop", 0.35], [60.7, "typing", 0.3, { dur: 2.2 }], [62.9, "error", 0.22, { dur: 0.9 }], [63.5, "whoosh-short", 0.3],
  // views != money
  [63.85, "pop", 0.35], [64.4, "pop", 0.35], [67.0, "pop", 0.4], [67.55, "ping", 0.4], [68.15, "whoosh-short", 0.3],
  // build trust / personal brand
  [69.2, "pop", 0.35], [70.3, "pop", 0.35], [71.0, "sparkle", 0.45], [71.8, "whoosh-short", 0.3],
  // follow along, asheraw.com, social icons
  [72.0, "pop", 0.35], [73.25, "pop", 0.4], [73.3, "sparkle", 0.35, { dur: 1.2 }], [75.1, "click-soft", 0.3], [75.25, "click-soft", 0.3],
  [75.4, "click-soft", 0.3], [75.55, "click-soft", 0.3], [76.15, "whoosh-short", 0.3],
  // more content / authentic, sustainable, long-term
  [77.6, "pop", 0.35], [79.0, "pop", 0.35], [79.8, "whoosh-short", 0.3], [80.45, "pop", 0.4], [81.65, "pop", 0.4], [82.75, "pop", 0.4],
  [83.55, "whoosh-short", 0.3],
  // end card
  [83.8, "chime", 0.45], [84.4, "pop", 0.35], [85.4, "click-soft", 0.3], [85.5, "click-soft", 0.3], [85.6, "click-soft", 0.3], [85.7, "click-soft", 0.3],
].sort((a, b) => a[0] - b[0]);

// Pre-mix every sound into ONE file: the renderer's mixer lowers the voice when it has ~100 separate inputs.
function bake(withMusic, out) {
  const inputs = [];
  const chains = [];
  const labels = [];
  const add = (file, vol, delaySec, from, d) => {
    const i = inputs.length;
    inputs.push(file);
    const ms = Math.round(delaySec * 1000);
    chains.push(`[${i}:a]aformat=sample_rates=44100:channel_layouts=stereo,atrim=start=${from}:duration=${d},asetpts=PTS-STARTPTS,volume=${vol},adelay=${ms}|${ms}[a${i}]`);
    labels.push(`[a${i}]`);
  };
  if (withMusic) add("assets/music-bed-full.wav", 0.17, 0, 0, DUR);
  SFX.forEach(([time, file, vol, o = {}]) => {
    const from = o.from || 0;
    const full = dur[file] - from;
    const d = +Math.min(o.dur || full, full, DUR - time).toFixed(3);
    add(`assets/sfx/${file}.mp3`, +(vol * 0.55).toFixed(3), time, from, d);
  });
  const g = chains.join(";\n") + `;\n${labels.join("")}amix=inputs=${labels.length}:normalize=0:dropout_transition=0,alimiter=limit=0.95:level=0,atrim=0:${DUR},aformat=sample_fmts=s16[out]`;
  fs.writeFileSync("bake.filter", g);
  const args = ["-v", "error", "-y"];
  inputs.forEach((f) => args.push("-i", f));
  args.push("-/filter_complex", "bake.filter", "-map", "[out]", "-ar", "44100", out);
  execFileSync("ffmpeg", args, { stdio: "inherit" });
}
bake(true, "assets/soundtrack.wav");      // music + sfx -> used in the render
bake(false, "assets/sfx-stem.wav");       // sfx only -> for swapping in your own music (CapCut)
const tags = [`<audio id="soundtrack" src="assets/soundtrack.wav" data-start="0" data-duration="${DUR}" data-track-index="2" data-volume="1"></audio>`];

let html = fs.readFileSync("src/template.html", "utf8");
html = html.replace("<!--AUDIO-->", tags.join("\n      ")).replace("/*CHUNKS_JSON*/[]", JSON.stringify(CHUNKS));
fs.writeFileSync("index.html", html);
console.log(`index.html: ${CHUNKS.length} subtitle chunks, ${SFX.length} sfx baked into assets/soundtrack.wav`);
console.log(CHUNKS.slice(0, 14).map((c) => c[0] + " " + c[2].map((w) => w.t).join(" ")).join("\n"));
