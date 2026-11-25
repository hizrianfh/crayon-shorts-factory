// Demo episode: the contract every current/story.mjs follows.
//   export const TOTAL               -> total frames (read from work/words.json, so it always matches the voice)
//   export function frame(g, f, ctx) -> draw frame f. ctx.C = engine (engine/crayon2d.mjs), ctx.words / ctx.phrases /
//                                        ctx.chunks = narration timings measured by Whisper (f0/f1 frames, same as
//                                        subtitles.srt), ctx.wordAt(f) / ctx.phraseAt(f).
// Layout (1080x1920): keyword titles y 220-420, action y 450-1300, Lala feet <= y 1340,
// keep y 1380-1640 clear for the burned-in captions.
import fs from "node:fs";
const PH = JSON.parse(fs.readFileSync(new URL("./work/words.json", import.meta.url), "utf8"));
export const TOTAL = PH.total_frames;

// first frame of the first word that starts with `w` (case-insensitive), for syncing beats to narration
const at = (w, d = 0) => (PH.words.find((x) => x.text.toLowerCase().replace(/[^a-z]/g, "").startsWith(w))?.f0 ?? d);
const T_TITLE = at("di"), T_BEE = at("lebah", 40), T_FLOWER = at("bunga", 60);

export function frame(g, f, { C, words }) {
  const b = C.boil(f);
  // camera: gentle creep, then zoom into the flower on "bunga"
  const cam = C.Camera2D.keys(f, [[0, { x: 540, y: 960, zoom: 1 }], [T_FLOWER - 4, { x: 560, y: 940, zoom: 1.06 }], [T_FLOWER + 14, { x: 700, y: 900, zoom: 1.55, rot: 2 }], [TOTAL, { x: 705, y: 895, zoom: 1.62, rot: 2 }]]);
  cam.apply(g);
  C.drawGraphPaper(g);
  C.drawSun(g, 880, 560, { r: 80, frame: f, boilSeed: b });
  C.drawCloud(g, 300, 620, { s: 0.8, boilSeed: b + 3 });
  // ground scribble + flower drawing itself on
  C.crayonStroke(g, [[60, 1340], [400, 1325], [760, 1345], [1040, 1330]], C.COL.green, C.clamp(f / 20), b, { width: 22 });
  C.drawFlower(g, 700, 1330, { s: 1.15, progress: C.clamp((f - 6) / 30), boilSeed: b + 10, sway: Math.sin(f * 0.08) * 0.15 });
  // bee flies a dotted loop to the flower
  const path = C.bezier([150, 820], [420, 560], [520, 1050], [700, 960]);
  const tb = C.clamp((f - T_BEE) / 45);
  C.dottedPath(g, path, tb, C.CHARCOAL, b);
  if (f >= T_BEE) { const [x, y, a] = C.along(path, C.smooth(tb)); C.drawBee(g, x, y + Math.sin(f * 0.5) * 6, { s: 0.9, angle: a * 0.3, frame: f, boilSeed: b + 20 }); }
  if (f >= T_FLOWER) C.drawSparkle(g, 760, 880, f - T_FLOWER, { boilSeed: b + 30 });
  // Lala, talking along with the narration
  C.drawKidHost(g, 270, 1335, { s: 0.72, pose: f < T_BEE ? "wave" : "point", expr: f > T_FLOWER ? "wow" : "happy", talk: C.talkAt(f, words), blink: C.blink(f, 7), breathe: C.breathe(f, 7), frame: f });
  // screen-space keyword title
  g.setTransform(1, 0, 0, 1, 0, 0);
  C.drawKeywordTitle(g, "Di Taman!", 540, 300, f - T_TITLE, { color: C.COL.green, boilSeed: b });
}
