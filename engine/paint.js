// Wax-crayon textures for the 3D world: cold-press paper tooth (#f6efe2) under every surface, a pigment layer,
// the material's own pattern drawn in crayon, then diagonal wax hatching. Plus the storybook sky.
import { crayonStroke, crayonFill, rng, shade, mix, PAPER, CHARCOAL } from "./crayon.js";

const BASE = {
  planks: "#b7834f", stone: "#a9a39a", grass: "#7fb04f", dirt: "#b98b5e", plaster: "#efd9b0",
  roofTiles: "#c4583f", marble: "#ece6dc", water: "#5d9fd1", brick: "#b5573f", metal: "#7d8a96",
};
export const SURFACES = Object.keys(BASE);

const cache = new Map();
/** CanvasTexture-ready canvas for a surface kind; `color` overrides the base pigment */
export function surfaceCanvas(kind, color) {
  const key = kind + (color ?? "");
  if (cache.has(key)) return cache.get(key);
  const N = 512, c = new OffscreenCanvas(N, N), g = c.getContext("2d"), r = rng(key.length * 131 + N);
  const col = color ?? BASE[kind] ?? "#c8b89a", dark = shade(col, 0.62);
  g.fillStyle = PAPER; g.fillRect(0, 0, N, N);
  crayonFill(g, [[0, 0], [N, 0], [N, N], [0, N]], { color: col, seed: 3, gap: 7, outline: null });
  const line = (pts, w = 5, cl = dark) => crayonStroke(g, pts, { color: cl, width: w, seed: Math.floor(r() * 1e6), passes: 2, jitter: 2 });
  switch (kind) {
    case "planks": for (let y = 0; y <= N; y += 64) { line([[0, y], [N, y]], 6); for (let x = (y / 64) % 2 ? 90 : 300; x < N; x += 420) line([[x, y], [x, y + 64]], 4); for (let k = 0; k < 3; k++) line([[r() * N, y + 20 + r() * 24], [r() * N, y + 20 + r() * 24]], 2, shade(col, 0.8)); } break;
    case "brick": for (let y = 0; y <= N; y += 42) { line([[0, y], [N, y]], 4); for (let x = (y / 42) % 2 ? 0 : 64; x < N; x += 128) line([[x, y], [x, y + 42]], 4); } break;
    case "stone": for (let i = 0; i < 26; i++) { const x = r() * N, y = r() * N, w = 40 + r() * 50; line([[x - w, y], [x - w * 0.6, y - w * 0.7], [x + w * 0.6, y - w * 0.7], [x + w, y], [x + w * 0.5, y + w * 0.6], [x - w * 0.5, y + w * 0.6], [x - w, y]], 4); } break;
    case "grass": for (let i = 0; i < 420; i++) { const x = r() * N, y = r() * N; line([[x, y], [x + (r() - 0.5) * 10, y - 14 - r() * 14]], 3, r() < 0.5 ? shade(col, 0.72) : mix(col, "#fff6a0", 0.35)); } break;
    case "dirt": for (let i = 0; i < 160; i++) { const x = r() * N, y = r() * N; line([[x, y], [x + 6, y + 2]], 3 + r() * 4, r() < 0.5 ? dark : mix(col, "#fff", 0.3)); } break;
    case "plaster": for (let i = 0; i < 6; i++) { let x = r() * N, y = r() * N; const p = [[x, y]]; for (let k = 0; k < 4; k++) p.push([x += (r() - 0.5) * 40, y += 10 + r() * 20]); line(p, 2, shade(col, 0.75)); } break;
    case "roofTiles": for (let y = 0; y < N; y += 48) for (let x = (y / 48) % 2 ? -32 : 0; x < N; x += 64) line(Array.from({ length: 9 }, (_, i) => [x + i * 8, y + 40 + Math.sin((i / 8) * Math.PI) * 14]), 5); break;
    case "marble": for (let i = 0; i < 8; i++) { let x = r() * N, y = 0; const p = [[x, y]]; while (y < N) p.push([x += (r() - 0.5) * 60, y += 30]); line(p, 2 + r() * 2, "#b9b2c4"); } break;
    case "water": for (let i = 0; i < 40; i++) { const x = r() * N, y = r() * N; line([[x, y], [x + 18, y - 6], [x + 36, y]], 4, mix(col, "#ffffff", 0.5)); } break;
    case "metal": for (let y = 0; y < N; y += 128) line([[0, y], [N, y]], 4); break;
  }
  cache.set(key, c);
  return c;
}

export const SKIES = {
  day: { top: "#7fb3e6", hor: "#f6e6c8", cloud: "#ffffff", fog: "#efe4cf", sun: [1.0, 0.96, 0.86], amb: 0.95, key: 1.6 },
  golden: { top: "#f2a65e", hor: "#ffe0a6", cloud: "#fff2d8", fog: "#f7dcae", sun: [1.0, 0.78, 0.55], amb: 0.85, key: 1.5 },
  dusk: { top: "#4d5d9a", hor: "#f0a878", cloud: "#f7c8b2", fog: "#c9a59a", sun: [0.95, 0.66, 0.6], amb: 0.7, key: 1.0 },
  night: { top: "#1f293d", hor: "#4b5a82", cloud: "#8590b0", fog: "#3b4766", sun: [0.6, 0.68, 0.95], amb: 0.55, key: 0.6 },
  storm: { top: "#5e6672", hor: "#a9a9a0", cloud: "#cfd1cf", fog: "#9fa29c", sun: [0.85, 0.88, 0.92], amb: 0.8, key: 0.9 },
};

/** storybook sky into a 2D canvas: wax gradient bands, scribbled drifting clouds, crayon sun/moon */
export function paintSky(g, w, h, kind, frame) {
  const s = SKIES[kind] ?? SKIES.day, b = Math.floor(frame / 4);
  g.fillStyle = PAPER; g.fillRect(0, 0, w, h);
  const bands = 7;
  for (let i = 0; i < bands; i++) {
    const t = i / (bands - 1);
    crayonFill(g, [[-20, (h * i) / bands - 10], [w + 20, (h * i) / bands - 10], [w + 20, (h * (i + 1)) / bands + 14], [-20, (h * (i + 1)) / bands + 14]],
      { color: mix(s.top, s.hor, t), seed: 900 + i * 13 + b, gap: 14, outline: null });
  }
  const r = rng(77);
  if (kind === "night") for (let i = 0; i < 40; i++) crayonStroke(g, [[r() * w, r() * h * 0.6], [r() * w + 3, r() * h * 0.6 + 3]], { color: "#fff6c8", width: 4 * (w / 1080), seed: i + b });
  const orb = kind === "night" ? "#f3eccb" : kind === "day" ? "#ffe27a" : "#ffb36b";
  crayonFill(g, Array.from({ length: 24 }, (_, i) => [w * 0.78 + Math.cos(i / 3.82) * w * 0.08, h * 0.16 + Math.sin(i / 3.82) * w * 0.08]), { color: orb, seed: 50 + b, outline: shade(orb, 0.7), width: 6 });
  for (let i = 0; i < 5; i++) {
    const cw = w * (0.22 + r() * 0.18), x = ((r() * w * 1.4 + frame * w * 0.0006 * (1 + i * 0.3)) % (w * 1.4)) - w * 0.2, y = h * (0.06 + r() * 0.32);
    const pts = [];
    for (let k = 0; k <= 20; k++) { const a = (k / 20) * Math.PI; pts.push([x + Math.cos(a) * cw * 0.5, y - Math.sin(a) * cw * (0.22 + 0.06 * Math.sin(k * 2.1))]); }
    crayonFill(g, pts, { color: s.cloud, seed: 300 + i * 9 + b, outline: shade(s.cloud, 0.72), width: 5 * (w / 1080), gap: 10 });
  }
}
export { CHARCOAL };
