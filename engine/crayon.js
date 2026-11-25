// Wax Crayon Storybook helpers: grainy wax strokes, scribble-hatched fills, paper tooth,
// and the chunky storybook character drawer. Everything is seeded, so a frame always renders the same.
// Boiling lines: callers pass seed + Math.floor(frame / 4) so jitter changes every 4 frames.
import { shade, mix } from "./toonbase.js";

export const CHARCOAL = "#2a2522";
export const NAVY = "#1f293d";
export const PAPER = "#f6efe2";
export { shade, mix };

/** deterministic PRNG in [0,1) */
export const rng = (seed) => {
  let a = (seed * 2654435761) >>> 0 || 1;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
};
export const boil = (frame) => Math.floor(frame / 4);

// wax grain: the colour with paper-tooth holes, as a repeating pattern (cached per colour)
const grainCache = new Map();
const grain = (g, color) => {
  let pat = grainCache.get(color);
  if (pat) return pat;
  const c = new OffscreenCanvas(96, 96), x = c.getContext("2d"), r = rng(color.length * 977 + parseInt(color.slice(1), 16));
  x.fillStyle = color; x.fillRect(0, 0, 96, 96);
  x.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 520; i++) { x.globalAlpha = 0.35 + r() * 0.65; x.fillRect(r() * 96, r() * 96, 1 + r() * 2.2, 1 + r() * 1.2); }
  pat = g.createPattern(c, "repeat");
  grainCache.set(color, pat);
  return pat;
};

const jit = (pts, amt, r) => pts.map(([x, y]) => [x + (r() - 0.5) * amt, y + (r() - 0.5) * amt]);
const trace = (g, pts, close) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); if (close) g.closePath(); };

/** grainy multi-pass wax stroke along a polyline */
export function crayonStroke(g, pts, { color = CHARCOAL, width = 10, seed = 1, passes = 3, jitter, close = false } = {}) {
  const r = rng(seed), j = jitter ?? width * 0.35;
  g.save(); g.lineCap = "round"; g.lineJoin = "round"; g.strokeStyle = grain(g, color);
  for (let p = 0; p < passes; p++) {
    g.globalAlpha = p ? 0.55 : 0.95;
    g.lineWidth = width * (p ? 0.55 + r() * 0.35 : 1);
    trace(g, jit(pts, j, r), close); g.stroke();
  }
  g.restore();
}

/** wax fill: grainy pigment + diagonal scribble hatching in a darker and a lighter tone */
export function crayonFill(g, pts, { color, seed = 1, angle = -0.8, gap = 9, outline = CHARCOAL, width = 11 } = {}) {
  const r = rng(seed);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  g.save();
  trace(g, pts, true); g.clip();
  g.fillStyle = grain(g, color); g.globalAlpha = 0.92; g.fillRect(x0 - 2, y0 - 2, x1 - x0 + 4, y1 - y0 + 4);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2 + 10, ca = Math.cos(angle), sa = Math.sin(angle);
  g.lineCap = "round";
  for (const [tone, alpha, off] of [[shade(color, 0.78), 0.5, 0], [mix(color, "#ffffff", 0.35), 0.35, gap / 2]]) {
    g.strokeStyle = grain(g, tone); g.globalAlpha = alpha;
    for (let d = -R + off; d < R; d += gap) {
      g.lineWidth = 2 + r() * 3;
      const px = cx - sa * d, py = cy + ca * d, w = R * (0.7 + r() * 0.3);
      g.beginPath(); g.moveTo(px - ca * w + (r() - 0.5) * 6, py - sa * w); g.lineTo(px + ca * w, py + sa * w + (r() - 0.5) * 6); g.stroke();
    }
  }
  g.restore();
  if (outline) crayonStroke(g, pts, { color: outline, width, seed: seed + 7, close: true });
}

// paper tooth overlay (built once per size): warm fibres + speckle + soft vignette, multiplied over the frame
let paperCache = null;
export function paperGrainOverlay(g, w, h) {
  if (!paperCache || paperCache.width !== w || paperCache.height !== h) {
    const c = new OffscreenCanvas(w, h), x = c.getContext("2d"), r = rng(4242), s = w / 1080;
    x.fillStyle = "#ffffff"; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 60000 * s * s; i++) { x.fillStyle = r() < 0.5 ? "rgba(120,96,70,0.10)" : "rgba(255,250,240,0.25)"; x.fillRect(r() * w, r() * h, 1 + r() * 2 * s, 1 + r() * 2 * s); }
    x.strokeStyle = "rgba(140,110,80,0.06)";
    for (let i = 0; i < 1400; i++) { const px = r() * w, py = r() * h, a = r() * Math.PI; x.lineWidth = s; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * 18 * s, py + Math.sin(a) * 18 * s); x.stroke(); }
    const v = x.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.75);
    v.addColorStop(0, "rgba(255,255,255,0)"); v.addColorStop(1, "rgba(150,110,80,0.28)");
    x.fillStyle = v; x.fillRect(0, 0, w, h);
    paperCache = c;
  }
  g.save(); g.globalCompositeOperation = "multiply"; g.drawImage(paperCache, 0, 0); g.restore();
}

// ---------------- storybook characters ----------------
// Design space 600 x 1000, soles at y = 975. Chunky: big round head (~2.7 heads tall), mitten hands, boots.
// Outfit: { coat, pants, boots, skin?, hair?, hat?: null|"cap"|"top"|"bonnet"|"helmet", hatColor?, scarf?, beard?, apron?, build?: "adult"|"kid"|"stout", ink?: CHARCOAL|NAVY }
// opts: { pose: "idle"|"walk"|"run"|"point"|"shock"|"cheer"|"think", expr: "neutral"|"happy"|"grin"|"shock"|"worried"|"smug"|"sad",
//         phase (walk cycle 0..1), blink (0..1), breathe (-1..1), frame, seed }
const ELL = (cx, cy, rx, ry, n = 28) => Array.from({ length: n }, (_, i) => [cx + rx * Math.cos((i / n) * 6.2832), cy + ry * Math.sin((i / n) * 6.2832)]);
const RRECT = (x0, y0, x1, y1, rr) => {
  const p = [];
  for (const [cx, cy, a] of [[x1 - rr, y0 + rr, -90], [x1 - rr, y1 - rr, 0], [x0 + rr, y1 - rr, 90], [x0 + rr, y0 + rr, 180]])
    for (let i = 0; i <= 5; i++) { const t = ((a + 18 * i) * Math.PI) / 180; p.push([cx + rr * Math.cos(t), cy + rr * Math.sin(t)]); }
  return p;
};

export function drawCharacter(g, o, opts = {}) {
  const { pose = "idle", expr = "neutral", phase = 0, blink = 0, breathe = 0, frame = 0, seed = 1 } = opts;
  const ink = o.ink ?? CHARCOAL, b = boil(frame), S = seed * 101 + b * 7;
  const kid = o.build === "kid", stout = o.build === "stout";
  const scale = kid ? 0.78 : 1, wide = stout ? 1.18 : 1;
  g.save();
  g.translate(300, 975); g.scale(scale, scale); g.translate(-300, -975);
  const moving = pose === "walk" || pose === "run";
  const amp = pose === "run" ? 0.75 : moving ? 0.5 : 0;
  const sw = Math.sin(phase * 6.2832);
  const bob = moving ? -Math.abs(Math.cos(phase * 6.2832)) * (pose === "run" ? 26 : 14) : breathe * 4;
  const hipY = 760 + bob, shY = 500 + bob, headY = 330 + bob + breathe * 2;
  const lean = pose === "run" ? 26 : pose === "walk" ? 10 : 0;

  // legs + boots (back leg first)
  const leg = (side, k) => {
    const a = side * sw * amp, hx = 300 + side * 34 * wide, fx = hx + Math.sin(a) * 210, fy = 935 - Math.max(0, -Math.cos(a + side * 0.9) * (moving ? 40 : 0) * (side * sw > 0 ? 1 : 0));
    const kx = (hx + fx) / 2 + (moving ? 14 : 0), ky = (hipY + fy) / 2;
    crayonStroke(g, [[hx, hipY], [kx, ky], [fx, fy]], { color: ink, width: 66, seed: S + k, passes: 2 });
    crayonStroke(g, [[hx, hipY], [kx, ky], [fx, fy]], { color: o.pants, width: 46, seed: S + k + 3, passes: 2 });
    crayonFill(g, RRECT(fx - 40, fy - 30, fx + 58, fy + 38, 22), { color: o.boots, seed: S + k + 5, gap: 8, outline: ink, width: 9 });
  };
  leg(-1, 1); leg(1, 2);

  // body: rounded coat with hatching
  const bw = 132 * wide;
  const body = [[300 - bw * 0.82 + lean, shY], [300 + bw * 0.82 + lean, shY], [300 + bw + lean * 0.4, hipY + 40], [300 - bw + lean * 0.4, hipY + 40]];
  const bodyR = [];
  for (let i = 0; i < 4; i++) { const p = body[i], q = body[(i + 1) % 4]; for (let t = 0; t < 1; t += 0.2) bodyR.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t + (i === 0 ? -Math.sin(t * Math.PI) * 26 : i === 2 ? Math.sin(t * Math.PI) * 12 : 0)]); }
  crayonFill(g, bodyR, { color: o.coat, seed: S + 11, outline: ink, width: 13 });
  if (o.apron) crayonFill(g, RRECT(300 - bw * 0.5 + lean * 0.6, shY + 90, 300 + bw * 0.5 + lean * 0.6, hipY + 30, 24), { color: o.apron, seed: S + 12, outline: ink, width: 8 });
  // buttons
  for (let i = 0; i < 3; i++) crayonFill(g, ELL(300 + lean * 0.7, shY + 70 + i * 62, 10, 10, 10), { color: shade(o.coat, 0.55), seed: S + 20 + i, outline: null });

  // arms: shoulder -> elbow -> mitten
  const arm = (side, k) => {
    const sx = 300 + side * bw * 0.78 + lean, sy = shY + 30;
    let hx, hy;
    if (pose === "point" && side === 1) { hx = sx + 230; hy = sy - 40; }
    else if (pose === "shock") { hx = sx + side * 120; hy = sy - 190; }
    else if (pose === "cheer") { hx = sx + side * 70; hy = sy - 250 + Math.sin(frame * 0.5 + side) * 12; }
    else if (pose === "think" && side === 1) { hx = 330 + lean; hy = headY + 110; }
    else { const a = -side * sw * amp * 0.9; hx = sx + side * 34 + Math.sin(a) * 170; hy = sy + Math.cos(a) * 200 + breathe * 3; }
    const ex = (sx + hx) / 2 + side * 26, ey = (sy + hy) / 2 + 10;
    crayonStroke(g, [[sx, sy], [ex, ey], [hx, hy]], { color: ink, width: 58, seed: S + k, passes: 2 });
    crayonStroke(g, [[sx, sy], [ex, ey], [hx, hy]], { color: o.coat, width: 40, seed: S + k + 2, passes: 2 });
    crayonFill(g, ELL(hx, hy, 34, 30, 16), { color: o.mitten ?? o.skin ?? "#f3d2b3", seed: S + k + 4, outline: ink, width: 9, gap: 7 });
  };
  arm(-1, 31); arm(1, 41);
  if (o.scarf) crayonFill(g, RRECT(300 - bw * 0.7 + lean, shY - 26, 300 + bw * 0.7 + lean, shY + 26, 22), { color: o.scarf, seed: S + 50, outline: ink, width: 9 });

  // head
  const hx = 300 + lean * 1.1, hr = 150;
  if (o.hair && o.hat !== "helmet") crayonFill(g, ELL(hx, headY - 20, hr * 1.05, hr * 0.95), { color: o.hair, seed: S + 60, outline: ink });
  crayonFill(g, ELL(hx, headY, hr, hr * 0.94, 36), { color: o.skin ?? "#f3d9bd", seed: S + 61, outline: ink, width: 13, gap: 12 });
  if (o.beard) crayonFill(g, [[hx - 110, headY + 30], [hx + 110, headY + 30], [hx + 70, headY + 150], [hx, headY + 175], [hx - 70, headY + 150]], { color: o.beard, seed: S + 62, outline: ink, width: 9 });
  // cheeks
  for (const s of [-1, 1]) crayonFill(g, ELL(hx + s * 82, headY + 46, 30, 18, 14), { color: "#ef8f86", seed: S + 63 + s, outline: null, gap: 6 });
  // eyes + brows (eyes shift slightly toward the facing side)
  const look = 12, ey = headY - 5, open = Math.max(0.08, 1 - blink);
  for (const s of [-1, 1]) {
    const ex = hx + s * 52 + look;
    if (expr === "happy" || expr === "grin") crayonStroke(g, [[ex - 20, ey + 6], [ex, ey - 12], [ex + 20, ey + 6]], { color: ink, width: 10, seed: S + 70 + s, passes: 2 });
    else {
      const ry = (expr === "shock" ? 30 : 22) * open;
      crayonFill(g, ELL(ex, ey, expr === "shock" ? 22 : 16, ry, 14), { color: ink, seed: S + 72 + s, outline: null, gap: 5 });
    }
    const tilt = expr === "worried" || expr === "sad" ? -s * 14 : expr === "smug" || expr === "grin" ? s * 10 : expr === "shock" ? 0 : s * 4;
    const by = ey - (expr === "shock" ? 70 : 50);
    crayonStroke(g, [[ex - 26, by + tilt], [ex + 26, by - tilt]], { color: o.brow ?? ink, width: 12, seed: S + 75 + s, passes: 2 });
  }
  // mouth
  const my = headY + 80, mx = hx + look;
  const mouth = {
    neutral: [[mx - 30, my], [mx, my + 6], [mx + 30, my]],
    happy: [[mx - 40, my - 6], [mx, my + 22], [mx + 40, my - 6]],
    smug: [[mx - 34, my + 4], [mx + 6, my + 8], [mx + 38, my - 12]],
    sad: [[mx - 34, my + 14], [mx, my - 4], [mx + 34, my + 14]],
    worried: [[mx - 34, my + 6], [mx - 12, my - 2], [mx + 10, my + 8], [mx + 34, my]],
  }[expr];
  if (mouth) crayonStroke(g, mouth, { color: ink, width: 11, seed: S + 80, passes: 2 });
  else if (expr === "grin") crayonFill(g, [[mx - 46, my - 8], [mx + 46, my - 8], [mx + 26, my + 30], [mx - 26, my + 30]], { color: "#fbf4ea", seed: S + 81, outline: ink, width: 9 });
  else crayonFill(g, ELL(mx, my + 10, 26, 34, 16), { color: "#7a2b2b", seed: S + 82, outline: ink, width: 9 }); // shock: open O

  // hats
  if (o.hat === "cap") crayonFill(g, [[hx - 150, headY - 70], [hx + 120, headY - 150], [hx + 200, headY - 80], [hx + 90, headY - 60]], { color: o.hatColor ?? "#d9483b", seed: S + 90, outline: ink });
  if (o.hat === "top") crayonFill(g, RRECT(hx - 95, headY - 330, hx + 95, headY - 110, 14).concat([[hx + 150, headY - 105], [hx - 150, headY - 105]]), { color: o.hatColor ?? "#3a3433", seed: S + 91, outline: ink });
  if (o.hat === "bonnet") crayonFill(g, ELL(hx - 10, headY - 70, 175, 120), { color: o.hatColor ?? "#e7b84a", seed: S + 92, outline: ink });
  if (o.hat === "helmet") crayonFill(g, ELL(hx, headY - 85, 165, 95).filter(([, y]) => y < headY - 50).concat([[hx + 180, headY - 50], [hx - 180, headY - 50]]), { color: o.hatColor ?? "#e8c13a", seed: S + 93, outline: ink });
  g.restore();
}
