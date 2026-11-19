// node thumb_art.mjs <n> "<scene prompt>"  -> cN/thumb_art.png
// Character art for the thumbnail via OpenRouter (ACE Studio's key), using Asher's two character reference sheets as image inputs.
import fs from "fs";
const [n, scene] = [process.argv[2], process.argv[3]];
const env = fs.readFileSync("D:/Work/Dev/ace-studio/.env.local", "utf8");
const KEY = (env.match(/^OPENROUTER_API_KEY=(.*)$/m) || [])[1]?.trim().replace(/^["']|["']$/g, "");
if (!KEY) throw new Error("no OPENROUTER_API_KEY in ace-studio/.env.local");
const M = "D:/Work/Social Media/2026/11-16 Blending in vs Standing out/Materials/";
const img = (f) => "data:image/jpeg;base64," + fs.readFileSync(M + f).toString("base64");
const MODEL = process.env.MODEL || "google/gemini-nano-banana-2.1";
const prompt = `Using the two character reference sheets (same man: black snapback cap with the Chinese character 胡 on the front, rectangular glasses, light blue-grey blazer, black t-shirt), draw this exact man as the hero of a vertical social-media thumbnail illustration.
Scene: ${scene}
Style: the same hand-drawn engraved pen-and-ink hatching look as the reference sheets, with soft colour washes; bold, clean silhouette that reads at small size; the man fills the lower two-thirds of the frame, head and shoulders large, face clearly visible and expressive, looking at the viewer.
Background: plain dark green chalkboard texture, very dark at the top third (leave the top third empty for a headline added later), any props drawn in chalk-like or ink style. Accent colour: warm yellow #ffd23f.
No text, no letters, no words, no numbers anywhere except the 胡 on the cap. No watermark. Portrait 9:16.`;
const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", "X-Title": "ACE Studio" },
  body: JSON.stringify({ model: MODEL, modalities: ["image", "text"], image_config: { aspect_ratio: "9:16" },
    messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: img("Asher Character Reference Sheet - Face.jpeg") } }, { type: "image_url", image_url: { url: img("Asher Character Reference Sheet - Body.jpeg") } }] }] }),
});
if (!r.ok) { console.error("HTTP", r.status, (await r.text()).slice(0, 400)); process.exit(1); }
const j = await r.json();
const url = j.choices?.[0]?.message?.images?.[0]?.image_url?.url;
if (!url) { console.error("no image:", JSON.stringify(j).slice(0, 400)); process.exit(1); }
fs.mkdirSync(`c${n}`, { recursive: true });
fs.writeFileSync(`c${n}/thumb_art.png`, Buffer.from(url.split(",")[1], "base64"));
console.log("ok", n, MODEL, "cost", j.usage?.cost ?? "?");
