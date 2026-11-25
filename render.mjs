// Headless crayon renderer.
//   node render.mjs frames "0-224"            -> frames/00000.jpg ... (full 1080x1920)
//   node render.mjs stills/check 0,150,300    -> stills/check_0.jpg ... (half size; SCALE env overrides)
// EP env picks the episode folder (default /current). Serves the repo root on 127.0.0.1 only.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const [mode, spec] = process.argv.slice(2);
if (!mode || !spec) { console.error('usage: node render.mjs frames "a-b" | node render.mjs <prefix> f1,f2,...'); process.exit(2); }
const isFrames = mode === "frames";
const scale = Number(process.env.SCALE || (isFrames ? 1 : 0.5));
const EP = process.env.EP || "/current";

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json" };
const server = http.createServer((req, res) => {
  const p = path.normalize(path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname)));
  if (!p.startsWith(ROOT + path.sep) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { "content-type": TYPES[path.extname(p)] || "application/octet-stream", "cache-control": "no-store" });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.goto(`http://127.0.0.1:${port}/engine/index.html?ep=${encodeURIComponent(EP)}&scale=${scale}`);
await page.waitForFunction(() => window.engineReady || window.engineError, null, { timeout: 120000 });
const err = await page.evaluate(() => window.engineError);
if (err || errors.length) { console.error("engine failed to load:\n", err || errors.join("\n")); await browser.close(); server.close(); process.exit(1); }
const total = await page.evaluate(() => window.TOTAL);
const metaPath = path.join(ROOT, EP, "meta.json");
if (fs.existsSync(metaPath)) {
  const mt = JSON.parse(fs.readFileSync(metaPath, "utf8")).total_frames;
  if (mt !== total) { console.error(`story.js TOTAL=${total} but meta.json total_frames=${mt}`); await browser.close(); server.close(); process.exit(1); }
}

let list;
if (isFrames) {
  const [a, b] = spec.split("-").map(Number);
  list = []; for (let f = a; f <= Math.min(b, total - 1); f++) list.push(f);
  fs.mkdirSync(path.join(ROOT, "frames"), { recursive: true });
} else {
  list = spec.split(",").map(Number).filter((f) => f >= 0 && f < total);
  fs.mkdirSync(path.dirname(path.resolve(ROOT, mode)), { recursive: true });
}

const t0 = Date.now();
for (const f of list) {
  const url = await page.evaluate((n) => window.renderFrame(n), f);
  if (errors.length) { console.error(`frame ${f}:`, errors.join("\n")); process.exitCode = 1; break; }
  const file = isFrames ? path.join(ROOT, "frames", String(f).padStart(5, "0") + ".jpg") : path.resolve(ROOT, `${mode}_${f}.jpg`);
  fs.writeFileSync(file, Buffer.from(url.split(",")[1], "base64"));
}
console.log(`rendered ${list.length} frame(s) of ${total} in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
await browser.close();
server.close();
