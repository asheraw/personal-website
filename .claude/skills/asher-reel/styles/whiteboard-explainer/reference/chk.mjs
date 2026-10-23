import { openDemo, closeServer } from "file:///C:/Users/Admin/lemo-opuscar/core/render/page.mjs";
const { browser, page } = await openDemo(process.argv[2], { w: 1920, h: 1080, q: process.argv[3] || "", warnings: true });
const bad = await page.evaluate(() => window.CHK());
console.log(bad.length, "problems");
for (const b of bad) console.log(JSON.stringify(b));
await browser.close(); closeServer();
