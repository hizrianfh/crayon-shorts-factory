// Crayon-on-graph-paper 2D engine (@napi-rs/canvas). Everything is seeded and pure in the frame number.
// Boil: pass boil(f) (= Math.floor(f / 4)) as boilSeed so wax jitter changes every 4 frames.
// Draw-on: `progress` 0..1 reveals strokes along their length and fills hatch-line by hatch-line.
import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import { fileURLToPath } from "node:url";
export * from "./motion.js";
import { smooth, clamp, lerp } from "./motion.js";

export const W = 1080, H = 1920;
export const PAPER = "#fbf5e6", GRID = "#c9ccd2", CHARCOAL = "#2a2522";
export const COL = { yellow: "#ffd23f", red: "#ef4b3f", pink: "#ff8fb1", orange: "#ff9f1c", green: "#5cb85c", leaf: "#3f9b4f",
  sky: "#6ec3f4", blue: "#3a7bd5", purple: "#9b6ad6", brown: "#9a6a3f", cream: "#fff6dc", white: "#ffffff", skin: "#f7d2b0" };

GlobalFonts.registerFromPath(fileURLToPath(new URL("../fonts/Fredoka-Bold.ttf", import.meta.url)), "Fredoka");

export const boil = (f) => Math.floor(f / 4);
export const rng = (seed) => {
  let a = (seed * 2654435761) >>> 0 || 1;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
};
export const shade = (c, k) => { const n = parseInt(c.slice(1), 16); const h = (v) => Math.min(255, Math.round(v * k)).toString(16).padStart(2, "0"); return `#${h(n >> 16 & 255)}${h(n >> 8 & 255)}${h(n & 255)}`; };
export const tint = (c, t) => { const n = parseInt(c.slice(1), 16); const h = (v) => Math.round(v + (255 - v) * t).toString(16).padStart(2, "0"); return `#${h(n >> 16 & 255)}${h(n >> 8 & 255)}${h(n & 255)}`; };

// ---------- geometry ----------
export const ell = (cx, cy, rx, ry, n = 32) => Array.from({ length: n }, (_, i) => [cx + rx * Math.cos((i / n) * 2 * Math.PI), cy + ry * Math.sin((i / n) * 2 * Math.PI)]);
export const rrect = (x0, y0, x1, y1, r) => {
  const p = [];
  for (const [cx, cy, a] of [[x1 - r, y0 + r, -90], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, 90], [x0 + r, y0 + r, 180]])
    for (let i = 0; i <= 6; i++) { const t = ((a + 15 * i) * Math.PI) / 180; p.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); }
  return p;
};
/** cubic bezier polyline */
export const bezier = (p0, p1, p2, p3, n = 40) => Array.from({ length: n + 1 }, (_, i) => {
  const t = i / n, s = 1 - t;
  return [s * s * s * p0[0] + 3 * s * s * t * p1[0] + 3 * s * t * t * p2[0] + t * t * t * p3[0], s * s * s * p0[1] + 3 * s * s * t * p1[1] + 3 * s * t * t * p2[1] + t * t * t * p3[1]];
});
const lens = (pts) => { const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return L; };
/** point + heading (radians) at fraction t of a polyline's length: move things along flight paths */
export function along(pts, t) {
  const L = lens(pts), d = clamp(t) * L[L.length - 1];
  let i = 1; while (i < pts.length - 1 && L[i] < d) i++;
  const a = pts[i - 1], b = pts[i], k = (d - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]);
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, Math.atan2(b[1] - a[1], b[0] - a[0])];
}
/** the first `progress` of a polyline (by length) */
export function partial(pts, progress) {
  if (progress >= 1) return pts;
  if (progress <= 0) return [];
  const L = lens(pts), d = progress * L[L.length - 1], out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (L[i] <= d) { out.push(pts[i]); continue; }
    const k = (d - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]);
    out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k]);
    break;
  }
  return out;
}

// ---------- wax ----------
const grainCache = new Map();
/** the colour with paper-tooth holes, as a repeating pattern */
export function grain(g, color) {
  if (grainCache.has(color)) return grainCache.get(color);
  const c = createCanvas(96, 96), x = c.getContext("2d"), r = rng(parseInt(color.slice(1), 16) + 7);
  x.fillStyle = color; x.fillRect(0, 0, 96, 96);
  x.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 480; i++) { x.globalAlpha = 0.3 + r() * 0.7; x.fillRect(r() * 96, r() * 96, 1 + r() * 2.4, 1 + r() * 1.3); }
  const p = g.createPattern(c, "repeat");
  grainCache.set(color, p);
  return p;
}
const trace = (g, pts, close) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); if (close) g.closePath(); };

/** grainy multi-pass wax stroke; progress reveals it along its length */
export function crayonStroke(g, pts, color = CHARCOAL, progress = 1, boilSeed = 0, { width = 10, passes = 3, close = false, jitter } = {}) {
  const src = close ? [...pts, pts[0]] : pts, p = partial(src, progress);
  if (p.length < 2) return;
  const r = rng(boilSeed * 977 + pts.length * 31 + Math.round(pts[0][0] * 7 + pts[0][1])), j = jitter ?? width * 0.3;
  g.save(); g.lineCap = "round"; g.lineJoin = "round"; g.strokeStyle = grain(g, color);
  for (let k = 0; k < passes; k++) {
    g.globalAlpha = k ? 0.5 : 0.95; g.lineWidth = width * (k ? 0.5 + r() * 0.35 : 1);
    trace(g, p.map(([x, y]) => [x + (r() - 0.5) * j, y + (r() - 0.5) * j]), false); g.stroke();
  }
  g.restore();
}

/** wax fill: grainy pigment + diagonal scribble hatching, then an outline. progress grows the hatching across the shape */
export function crayonFill(g, pts, color, { progress = 1, boilSeed = 0, outline = CHARCOAL, width = 9, gap = 11, angle = -0.8 } = {}) {
  if (progress <= 0) return;
  const r = rng(boilSeed * 131 + pts.length * 17 + Math.round(pts[0][0] + pts[0][1] * 3));
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2 + 8, ca = Math.cos(angle), sa = Math.sin(angle);
  g.save(); trace(g, pts, true); g.clip();
  if (progress >= 1) { g.globalAlpha = 0.9; g.fillStyle = grain(g, color); g.fillRect(x0 - 2, y0 - 2, x1 - x0 + 4, y1 - y0 + 4); }
  g.lineCap = "round";
  for (const [tone, alpha, off] of [[progress >= 1 ? shade(color, 0.8) : color, progress >= 1 ? 0.5 : 0.95, 0], [tint(color, 0.35), 0.35, gap / 2]]) {
    g.strokeStyle = grain(g, tone); g.globalAlpha = alpha;
    for (let d = -R + off; d < -R + 2 * R * progress; d += gap) {
      g.lineWidth = 3 + r() * 4;
      const px = cx - sa * d, py = cy + ca * d, w = R * (0.75 + r() * 0.25);
      g.beginPath(); g.moveTo(px - ca * w + (r() - 0.5) * 6, py - sa * w); g.lineTo(px + ca * w, py + sa * w + (r() - 0.5) * 6); g.stroke();
    }
  }
  g.restore();
  if (outline) crayonStroke(g, pts, outline, progress, boilSeed, { width, close: true });
}

// ---------- paper ----------
let gridTile = null, paperTop = null;
/** cream notebook graph paper over a world-space rect (default: the page plus margin, so camera moves never show an edge) */
export function drawGraphPaper(g, { x0 = -W, y0 = -H, x1 = 2 * W, y1 = 2 * H, margin = true } = {}) {
  if (!gridTile) {
    const S = 240, c = createCanvas(S, S), x = c.getContext("2d"), r = rng(11);
    x.fillStyle = PAPER; x.fillRect(0, 0, S, S);
    for (let i = 0; i < 900; i++) { x.fillStyle = r() < 0.5 ? "rgba(150,120,80,0.07)" : "rgba(255,255,255,0.5)"; x.fillRect(r() * S, r() * S, 1 + r() * 2, 1 + r() * 2); }
    x.strokeStyle = GRID;
    for (let k = 0; k <= S; k += 60) {
      x.lineWidth = k % 240 === 0 ? 2.2 : 1.2; x.globalAlpha = k % 240 === 0 ? 0.55 : 0.38;
      x.beginPath(); x.moveTo(k, 0); x.lineTo(k, S); x.moveTo(0, k); x.lineTo(S, k); x.stroke();
    }
    gridTile = c;
  }
  g.save(); g.fillStyle = g.createPattern(gridTile, "repeat"); g.fillRect(x0, y0, x1 - x0, y1 - y0);
  if (margin) { g.strokeStyle = "rgba(239,100,110,0.55)"; g.lineWidth = 4; g.beginPath(); g.moveTo(110, y0); g.lineTo(110, y1); g.stroke(); }
  g.restore();
}
/** screen-space paper tooth + warm vignette, multiplied over the finished frame */
export function paperOverlay(g) {
  if (!paperTop) {
    const c = createCanvas(W, H), x = c.getContext("2d"), r = rng(4242);
    x.fillStyle = "#ffffff"; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 50000; i++) { x.fillStyle = r() < 0.5 ? "rgba(120,96,70,0.08)" : "rgba(255,250,240,0.25)"; x.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
    const v = x.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, H * 0.78);
    v.addColorStop(0, "rgba(255,255,255,0)"); v.addColorStop(1, "rgba(170,130,90,0.22)");
    x.fillStyle = v; x.fillRect(0, 0, W, H);
    paperTop = c;
  }
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = "multiply"; g.drawImage(paperTop, 0, 0); g.restore();
}

// ---------- camera ----------
/** 2D camera: (x, y) = world point at screen centre, zoom > 1 = closer, rot in degrees */
export class Camera2D {
  constructor(x = W / 2, y = H / 2, zoom = 1, rot = 0) { Object.assign(this, { x, y, zoom, rot }); }
  /** smootherstep through keys [[frame, {x, y, zoom, rot?}], ...] */
  static keys(f, ks) {
    let a = ks[0], b = ks[0];
    for (let i = 0; i < ks.length; i++) { if (ks[i][0] <= f) a = b = ks[i]; if (ks[i][0] > f) { b = ks[i]; break; } }
    const t = a === b ? 0 : smooth((f - a[0]) / (b[0] - a[0])), A = a[1], B = b[1];
    return new Camera2D(lerp(A.x, B.x, t), lerp(A.y, B.y, t), Math.exp(lerp(Math.log(A.zoom ?? 1), Math.log(B.zoom ?? 1), t)), lerp(A.rot ?? 0, B.rot ?? 0, t));
  }
  apply(g) { g.setTransform(1, 0, 0, 1, 0, 0); g.translate(W / 2, H / 2); g.rotate((this.rot * Math.PI) / 180); g.scale(this.zoom, this.zoom); g.translate(-this.x, -this.y); }
  /** world -> screen */
  toScreen(x, y) { const a = (this.rot * Math.PI) / 180, dx = (x - this.x) * this.zoom, dy = (y - this.y) * this.zoom; return [W / 2 + dx * Math.cos(a) - dy * Math.sin(a), H / 2 + dx * Math.sin(a) + dy * Math.cos(a)]; }
}

// ---------- motion ----------
/** pop-in scale 0 -> overshoot -> 1 over `dur` frames (easeOutBack) */
export const pop = (t, dur = 12) => { if (t <= 0) return 0; const x = clamp(t / dur), c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
/** mouth openness 0..1 while a narration word is active (words from phrases.json) */
export function talkAt(f, words = []) {
  const w = words.find((w) => f >= w.f0 && f < w.f1);
  if (!w) return 0;
  return [0.25, 0.9, 0.6, 1, 0.4][Math.floor((f - w.f0) / 3) % 5];
}
/** curved dotted path (flight / movement), revealed by progress */
export function dottedPath(g, pts, progress = 1, color = CHARCOAL, boilSeed = 0, { gap = 26, r = 5 } = {}) {
  const L = lens(pts), total = L[L.length - 1] * clamp(progress), rr = rng(boilSeed + 5);
  g.save(); g.fillStyle = grain(g, color);
  for (let d = 0; d < total; d += gap) { const [x, y] = along(pts, d / L[L.length - 1]); g.beginPath(); g.ellipse(x + (rr() - 0.5) * 3, y + (rr() - 0.5) * 3, r, r * 0.8, rr(), 0, 2 * Math.PI); g.fill(); }
  g.restore();
}

// ---------- host: Lala ----------
/** Lala, the recurring crayon kid host. (x, y) = between her feet; ~560 px tall at s = 1.
 *  opts: s, expr ("happy" | "wow" | "think" | "laugh"), blink 0..1, talk 0..1, pose ("idle" | "wave" | "point" | "cheer"), facing ±1, frame, breathe */
export function drawKidHost(g, x, y, { s = 1, expr = "happy", blink = 0, talk = 0, pose = "idle", facing = 1, frame = 0, breathe = 0 } = {}) {
  const b = boil(frame), B = (k) => b * 7 + k, ink = CHARCOAL;
  g.save(); g.translate(x, y); g.scale(s * facing, s); g.translate(0, breathe * 4);
  // legs + red sneakers
  for (const sx of [-1, 1]) {
    crayonFill(g, rrect(sx * 48 - 22, -150, sx * 48 + 22, -40, 18), COL.yellow, { boilSeed: B(1 + sx), width: 7 });
    crayonFill(g, rrect(sx * 48 - 40 + sx * 10, -48, sx * 48 + 40 + sx * 10, 0, 22), COL.red, { boilSeed: B(3 + sx), width: 8 });
  }
  // arms (behind body): shoulder (±95, -330)
  const hand = (sx) => pose === "cheer" ? [sx * 170, -520 + Math.sin(frame * 0.4 + sx) * 10]
    : pose === "wave" && sx === 1 ? [215 + Math.sin(frame * 0.35) * 35, -620]
    : pose === "point" && sx === 1 ? [250, -360] : [sx * 135, -190 + breathe * 3];
  for (const sx of [-1, 1]) {
    const [hx, hy] = hand(sx), arm = [[sx * 92, -330], [(sx * 92 + hx) / 2 + sx * 18, (-330 + hy) / 2 + 12], [hx, hy]];
    crayonStroke(g, arm, ink, 1, B(10 + sx), { width: 46, passes: 2 });
    crayonStroke(g, arm, "#8fd3ff", 1, B(12 + sx), { width: 30, passes: 2 });
    crayonFill(g, ell(hx, hy, 26, 24, 14), COL.skin, { boilSeed: B(14 + sx), width: 7, gap: 7 });
  }
  // body: light-blue shirt, yellow overalls with straps + pocket
  crayonFill(g, rrect(-110, -360, 110, -230, 50), "#8fd3ff", { boilSeed: B(20) });
  crayonFill(g, [[-112, -270], [112, -270], [128, -130], [-128, -130]], COL.yellow, { boilSeed: B(21) });
  crayonFill(g, rrect(-62, -330, 62, -250, 14), COL.yellow, { boilSeed: B(22), width: 8 });
  for (const sx of [-1, 1]) crayonStroke(g, [[sx * 50, -320], [sx * 80, -362]], shade(COL.yellow, 0.8), 1, B(23 + sx), { width: 16 });
  crayonFill(g, rrect(-34, -230, 34, -180, 10), shade(COL.yellow, 0.88), { boilSeed: B(26), width: 6 });
  for (const sx of [-1, 1]) crayonFill(g, ell(sx * 50, -318, 9, 9, 10), COL.red, { boilSeed: B(27 + sx), outline: null });
  // head: pigtails, face, bangs
  const hy = -500;
  for (const sx of [-1, 1]) { crayonFill(g, ell(sx * 150, hy - 30, 52, 62, 18), "#6b3e26", { boilSeed: B(30 + sx) }); crayonFill(g, ell(sx * 112, hy - 50, 18, 18, 10), COL.red, { boilSeed: B(32 + sx), width: 6 }); }
  crayonFill(g, ell(0, hy, 138, 128, 36), COL.skin, { boilSeed: B(34), gap: 13 });
  crayonFill(g, [[-132, hy - 30], [-110, hy - 105], [-40, hy - 135], [40, hy - 135], [110, hy - 105], [132, hy - 30], [70, hy - 70], [10, hy - 55], [-50, hy - 75]], "#6b3e26", { boilSeed: B(35) });
  for (const sx of [-1, 1]) crayonFill(g, ell(sx * 78, hy + 40, 26, 16, 14), COL.pink, { boilSeed: B(36 + sx), outline: null, gap: 6 });
  // eyes
  const open = Math.max(0.1, 1 - blink), big = expr === "wow" ? 1.35 : 1;
  for (const sx of [-1, 1]) {
    if (expr === "laugh") crayonStroke(g, [[sx * 46 - 18, hy + 4], [sx * 46, hy - 12], [sx * 46 + 18, hy + 4]], ink, 1, B(40 + sx), { width: 9, passes: 2 });
    else { crayonFill(g, ell(sx * 46, hy, 15 * big, 20 * big * open, 14), ink, { boilSeed: B(40 + sx), outline: null, gap: 5 }); if (open > 0.5) { g.fillStyle = "#fff"; g.beginPath(); g.arc(sx * 46 + 5, hy - 7, 5, 0, 7); g.fill(); } }
    const lift = expr === "wow" ? -14 : expr === "think" ? sx * 6 : 0;
    crayonStroke(g, [[sx * 46 - 20, hy - 42 + lift], [sx * 46 + 20, hy - 46 + lift]], ink, 1, B(43 + sx), { width: 8, passes: 2 });
  }
  // mouth: talking opens an oval, else expression
  const my = hy + 62;
  if (talk > 0.05 || expr === "wow") { const o = expr === "wow" ? 1 : talk; crayonFill(g, ell(0, my + 4, 24 + 6 * o, 8 + 22 * o, 16), "#b8323f", { boilSeed: B(50), width: 7, gap: 6 }); }
  else if (expr === "think") crayonStroke(g, [[-22, my + 6], [0, my + 2], [22, my - 6]], ink, 1, B(51), { width: 9, passes: 2 });
  else crayonStroke(g, [[-36, my - 6], [-14, my + 14], [14, my + 14], [36, my - 6]], ink, 1, B(52), { width: 9, passes: 2 });
  g.restore();
}

// ---------- titles ----------
/** playful keyword header that pops onto the page: crayon pill + rounded wax letters.
 *  t = frames since it appeared (0 = hidden). (x, y) = centre. */
export function drawKeywordTitle(g, text, x, y, t, { color = COL.orange, size = 120, boilSeed = 0, rot = -3 } = {}) {
  const sc = pop(t);
  if (sc <= 0) return;
  g.save(); g.translate(x, y); g.rotate((rot * Math.PI) / 180 + Math.sin(t * 0.15) * 0.015); g.scale(sc, sc);
  g.font = `${size}px Fredoka`; g.textAlign = "center"; g.textBaseline = "middle";
  const w = g.measureText(text).width, h = size * 1.25;
  crayonFill(g, rrect(-w / 2 - 50, -h / 2 - 10, w / 2 + 50, h / 2 + 10, h / 2), tint(color, 0.72), { boilSeed, width: 10 });
  const r = rng(boilSeed + 99);
  let cx = -w / 2;
  for (const ch of text) {
    const cw = g.measureText(ch).width, dy = Math.sin(t * 0.25 + cx * 0.02) * 4 + (r() - 0.5) * 3;
    g.save(); g.translate(cx + cw / 2, dy); g.rotate((r() - 0.5) * 0.08);
    g.lineJoin = "round"; g.lineWidth = size * 0.16; g.strokeStyle = grain(g, CHARCOAL); g.strokeText(ch, 0, 0);
    g.fillStyle = grain(g, color); g.fillText(ch, 0, 0);
    g.restore();
    cx += cw;
  }
  g.restore();
}

// ---------- props ----------
export function drawFlower(g, x, y, { s = 1, petal = COL.pink, center = COL.yellow, progress = 1, boilSeed = 0, sway = 0, stem = 260 } = {}) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const top = [Math.sin(sway) * 30, -stem];
  crayonStroke(g, [[0, 0], [top[0] * 0.4, -stem * 0.5], top], COL.leaf, clamp(progress * 2), boilSeed, { width: 18 });
  crayonFill(g, ell(28, -stem * 0.4, 42, 18, 14), COL.green, { progress: clamp(progress * 2 - 0.5), boilSeed: boilSeed + 1, width: 6 });
  const pp = clamp(progress * 2 - 1);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * 2 * Math.PI; crayonFill(g, ell(top[0] + Math.cos(a) * 62, top[1] + Math.sin(a) * 62, 48, 48, 18), petal, { progress: clamp(pp * 6 - i), boilSeed: boilSeed + 2 + i, width: 7 }); }
  crayonFill(g, ell(top[0], top[1], 44, 44, 20), center, { progress: pp, boilSeed: boilSeed + 9, width: 7, gap: 7 });
  g.restore();
}
export function drawBee(g, x, y, { s = 1, angle = 0, frame = 0, boilSeed = 0 } = {}) {
  g.save(); g.translate(x, y); g.rotate(angle); g.scale(s, s);
  const flap = Math.sin(frame * 1.7) * 0.5;
  for (const sy of [-1, 1]) { g.save(); g.rotate(sy * (0.6 + flap)); crayonFill(g, ell(-10, sy * 38, 26, 40, 14), "#e8f6ff", { boilSeed: boilSeed + sy, width: 6, gap: 8 }); g.restore(); }
  crayonFill(g, ell(0, 0, 58, 40, 24), COL.yellow, { boilSeed: boilSeed + 3 });
  for (const sx of [-14, 14]) crayonStroke(g, [[sx, -36], [sx + 4, 36]], CHARCOAL, 1, boilSeed + 4 + sx, { width: 13, passes: 2 });
  crayonFill(g, ell(54, 0, 22, 22, 14), CHARCOAL, { boilSeed: boilSeed + 5, outline: null, gap: 6 });
  g.fillStyle = "#fff"; g.beginPath(); g.arc(60, -6, 5, 0, 7); g.fill();
  g.restore();
}
export function drawSun(g, x, y, { r = 110, frame = 0, boilSeed = 0 } = {}) {
  for (let i = 0; i < 10; i++) { const a = (i / 10) * 2 * Math.PI + frame * 0.01; crayonStroke(g, [[x + Math.cos(a) * r * 1.25, y + Math.sin(a) * r * 1.25], [x + Math.cos(a) * r * 1.6, y + Math.sin(a) * r * 1.6]], COL.orange, 1, boilSeed + i, { width: 12 }); }
  crayonFill(g, ell(x, y, r, r, 30), COL.yellow, { boilSeed, width: 8 });
}
export function drawCloud(g, x, y, { s = 1, boilSeed = 0 } = {}) {
  const pts = [];
  for (let k = 0; k <= 24; k++) { const a = Math.PI + (k / 24) * Math.PI; pts.push([x + Math.cos(a) * 160 * s, y + Math.sin(a) * (70 + 30 * Math.abs(Math.sin(k * 0.8))) * s]); }
  crayonFill(g, pts, COL.white, { boilSeed, width: 7, gap: 14 });
}
export function drawSparkle(g, x, y, t, { s = 1, color = COL.yellow, boilSeed = 0 } = {}) {
  const k = pop(t, 8) * (1 - clamp((t - 14) / 10));
  if (k <= 0) return;
  const R = 46 * s * k, r = 12 * s * k, pts = [];
  for (let i = 0; i < 8; i++) { const a = (i / 8) * 2 * Math.PI - Math.PI / 2, d = i % 2 ? r : R; pts.push([x + Math.cos(a) * d, y + Math.sin(a) * d]); }
  crayonFill(g, pts, color, { boilSeed, width: 6, gap: 6 });
}
