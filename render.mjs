// Pure 2D crayon renderer: draws 1080x1920 frames with @napi-rs/canvas and pipes raw RGBA into ffmpeg.
//   node render.mjs video                 -> out/silent.mp4 (whole episode, no audio)
//   node render.mjs stills 0,60,120       -> stills/f_<n>.png + stills/contact_sheet.jpg
// EP env = episode folder (default current). The story is <EP>/story.mjs:
//   export const TOTAL; export function frame(g, f, ctx)   ctx = { C (engine), W, H, FPS, words, phrases, chunks, wordAt(f), phraseAt(f) }
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import { createCanvas } from "@napi-rs/canvas";
import * as C from "./engine/crayon2d.mjs";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const [mode, spec] = process.argv.slice(2);
if (!["video", "stills"].includes(mode) || (mode === "stills" && !spec)) { console.error('usage: node render.mjs video | node render.mjs stills 0,60,120'); process.exit(2); }
const EP = path.resolve(ROOT, process.env.EP || "current");
const story = await import(pathToFileURL(path.join(EP, "story.mjs")).href);
// Step B output; phrases.json = episodes made before the Whisper step
const phPath = ["words.json", "phrases.json"].map((f) => path.join(EP, "work", f)).find((f) => fs.existsSync(f));
const ph = phPath ? JSON.parse(fs.readFileSync(phPath, "utf8")) : { words: [], phrases: [], chunks: [] };
const metaPath = path.join(EP, "meta.json");
if (fs.existsSync(metaPath)) {
  const mt = JSON.parse(fs.readFileSync(metaPath, "utf8")).total_frames;
  if (mt !== story.TOTAL) { console.error(`story.mjs TOTAL=${story.TOTAL} but meta.json total_frames=${mt}`); process.exit(1); }
}
const find = (list, f) => list.find((x) => f >= x.f0 && f < x.f1) ?? null;
const ctx = { C, W: C.W, H: C.H, FPS: 30, words: ph.words, phrases: ph.phrases, chunks: ph.chunks ?? [], wordAt: (f) => find(ph.words, f), phraseAt: (f) => find(ph.phrases, f) };

const canvas = createCanvas(C.W, C.H), g = canvas.getContext("2d");
const draw = (f) => {
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
  g.fillStyle = C.PAPER; g.fillRect(0, 0, C.W, C.H);
  g.save(); story.frame(g, f, ctx); g.restore();
  C.paperOverlay(g);
};

const t0 = Date.now();
if (mode === "stills") {
  const frames = spec.split(",").map(Number).filter((f) => f >= 0 && f < story.TOTAL);
  fs.mkdirSync(path.join(ROOT, "stills"), { recursive: true });
  const cols = 3, tw = 360, th = 640, rows = Math.ceil(frames.length / cols);
  const sheet = createCanvas(cols * tw + (cols + 1) * 8, rows * th + (rows + 1) * 8), sg = sheet.getContext("2d");
  sg.fillStyle = C.CHARCOAL; sg.fillRect(0, 0, sheet.width, sheet.height);
  frames.forEach((f, i) => {
    draw(f);
    fs.writeFileSync(path.join(ROOT, "stills", `f_${f}.png`), canvas.toBuffer("image/png"));
    const x = 8 + (i % cols) * (tw + 8), y = 8 + Math.floor(i / cols) * (th + 8);
    sg.drawImage(canvas, x, y, tw, th);
    sg.fillStyle = "#fff"; sg.font = "26px Fredoka"; sg.fillText(`f ${f}`, x + 10, y + 32);
  });
  fs.writeFileSync(path.join(ROOT, "stills", "contact_sheet.jpg"), sheet.toBuffer("image/jpeg", 88));
  console.log(`stills/contact_sheet.jpg: ${frames.length} stills in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
} else {
  fs.mkdirSync(path.join(ROOT, "out"), { recursive: true });
  const ff = spawn("ffmpeg", ["-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${C.W}x${C.H}`, "-r", "30", "-i", "-",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "12", "-pix_fmt", "yuv420p", path.join(ROOT, "out", "silent.mp4")], { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((res, rej) => ff.on("close", (c) => (c ? rej(new Error(`ffmpeg exited ${c}`)) : res())));
  for (let f = 0; f < story.TOTAL; f++) {
    draw(f);
    if (!ff.stdin.write(canvas.data())) await new Promise((r) => ff.stdin.once("drain", r));
  }
  ff.stdin.end();
  await done;
  const s = (Date.now() - t0) / 1000;
  console.log(`out/silent.mp4: ${story.TOTAL} frames in ${s.toFixed(1)} s (${(story.TOTAL / s).toFixed(1)} fps)`);
}
