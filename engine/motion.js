// Timing + motion helpers for story.js (import from "engine/motion.js"). All functions are pure in `f` (frame).
export const FPS = 30;
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const smooth = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); }; // smootherstep
export const prog = (f, a, b) => clamp((f - a) / Math.max(1, b - a));

/** piecewise smootherstep through keys [[frame, value], ...]; value may be a number or [x,y,z] */
export function keys(f, ks) {
  if (f <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    const [f0, v0] = ks[i - 1], [f1, v1] = ks[i];
    if (f <= f1) { const t = smooth((f - f0) / Math.max(1, f1 - f0)); return Array.isArray(v0) ? lerp3(v0, v1, t) : lerp(v0, v1, t); }
  }
  return ks[ks.length - 1][1];
}

/** shot lookup: SHOTS = [{a, b, ...}] -> { shot, i, t (local frame), p (0..1) } */
export function shotAt(SHOTS, f) {
  let i = SHOTS.findIndex((s) => f >= s.a && f < s.b);
  if (i < 0) i = f < SHOTS[0].a ? 0 : SHOTS.length - 1;
  const s = SHOTS[i];
  return { shot: s, i, t: f - s.a, p: prog(f, s.a, s.b) };
}

/** walk cycle phase (0..1) for `speed` m/s with a stride of `stride` m (one cycle = two steps) */
export const walkPhase = (f, speed = 1.3, stride = 0.7) => ((f / FPS) * speed / (2 * stride)) % 1;
/** blink amount 0..1 (4-frame blinks every ~0.6-2.3 s, seeded per character) */
export function blink(f, seed = 1) {
  let t = 0, k = 0;
  while (t <= f) { const gap = 18 + Math.floor(((Math.sin(seed * 91.7 + k * 12.9) + 1) / 2) * 52); if (f < t + 4 && f >= t) return [0.6, 1, 1, 0.5][f - t]; t += gap; k++; }
  return 0;
}
/** idle breathing -1..1, ~0.3 Hz, seeded offset */
export const breathe = (f, seed = 1) => Math.sin(f * 0.065 + seed * 1.7);
/** impact flip-shake: offset in metres, flips sign every frame and decays over 7 frames from f0 */
export const shake = (f, f0, amp = 0.08) => (f >= f0 && f < f0 + 7 ? amp * (1 - (f - f0) / 7) * (f % 2 ? 1 : -1) : 0);
/** slow camera creep: moves pos toward look by `rate` fraction per frame of shot time (default 0.25 %/f) */
export const creep = (pos, look, t, rate = 0.0025) => lerp3(pos, look, Math.min(0.5, t * rate));
