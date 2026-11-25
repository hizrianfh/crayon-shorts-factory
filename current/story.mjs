// Episode: Kenapa es batu mengapung? — liquid water "butiran" jostle tightly like kids rushing into class;
// when water freezes they hold hands in rings (a honeycomb with empty spaces), so ice takes more room and is
// lighter than the same-size water -> it floats. Lakes freeze on top, fish stay safe below.
import fs from "node:fs";
const PH = JSON.parse(fs.readFileSync(new URL("./work/words.json", import.meta.url), "utf8"));
export const TOTAL = PH.total_frames;

const norm = (s) => s.toLowerCase().replace(/[^a-z]/g, "");
// f0 of the n-th word (0-based) that starts with `w`
const at = (w, n = 0, d = 0) => (PH.words.filter((x) => norm(x.text).startsWith(w))[n]?.f0 ?? d);

const T_KENAPA = at("kenapa", 0, 67), T_ES1 = at("es", 0, 88), T_MENGAPUNG1 = at("mengapung", 0, 109), T_PADAHAL = at("padahal", 0, 160);
const T_YUK = at("yuk", 0, 238), T_AIR = at("air", 1, 301), T_BUTIRAN = at("butiran", 0, 350), T_SAKING = at("saking", 0, 413), T_MATA = at("mata", 0, 461);
const T_WAKTU = at("waktu", 0, 527), T_BERDESAKAN = at("berdesakan", 0, 592), T_SEPERTI = at("seperti", 0, 629), T_RAPAT = at("rapat", 0, 710);
const T_TAPI = at("tapi", 0, 763), T_MEMBEKU = at("membeku", 0, 819), T_BERGANDENGAN = at("bergandengan", 0, 874), T_MELINGKAR = at("melingkar", 0, 948);
const T_BERGANDENGAN2 = at("bergandengan", 1, 1054), T_TEMPAT = at("tempat", 0, 1102), T_JADI = at("jadi", 0, 1149), T_RUANG = at("ruang", 0, 1222);
const T_ES_JADI = at("es", 3, 1265), T_RINGAN = at("ringan", 0, 1292), T_MAKANYA = at("makanya", 0, 1371), T_MENGAPUNG2 = at("mengapung", 1, 1425);
const T_DANAU = at("danau", 0, 1476), T_DI_DANAU = T_DANAU - 8, T_ESNYA = at("esnya", 0, 1521), T_IKAN = at("ikanikan", 0, 1571), T_AMAN = at("aman", 0, 1603);
const T_KEREN = at("keren", 0, 1661), T_COBA = at("coba", 0, 1705);

const TITLES = [[T_MENGAPUNG1 - 2, T_BUTIRAN - 2, "Mengapung?", "#5aa9e6"], [T_BUTIRAN - 2, T_BERGANDENGAN - 2, "Butiran Air", "#3b82f6"],
  [T_BERGANDENGAN - 2, T_RINGAN - 2, "Bergandengan!", "#9b6ad6"], [T_RINGAN - 2, T_DI_DANAU - 2, "Lebih Ringan!", "#ff9f1c"]];

// world regions (laid out left -> right; the camera pans between them)
const A = [640, 900], B = [2100, 820], CB = [3500, 900], E = [4800, 900], D = [6200, 900];
const R_MAG = 310;
const ICE = "#cfefff", WATER = "#5aa9e6", DRINK = "#e9a54a";

// ---- molecules: liquid (tight triangular packing) -> ice (honeycomb rings, more room, empty centres)
const L = 70, HEX_C = [];
{
  const s = L * Math.sqrt(3);
  for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) { const x = (i + j * 0.5) * s, y = j * s * Math.sqrt(3) / 2; if (Math.hypot(x, y) < 160) HEX_C.push([x, y]); }
}
const LAT = [];
for (const [hx, hy] of HEX_C) for (let k = 0; k < 6; k++) {
  const a = (k / 6) * 2 * Math.PI + Math.PI / 6, p = [hx + Math.cos(a) * L, hy + Math.sin(a) * L];
  if (!LAT.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 5)) LAT.push(p);
}
const LINKS = [];
for (let i = 0; i < LAT.length; i++) for (let j = i + 1; j < LAT.length; j++) if (Math.abs(Math.hypot(LAT[i][0] - LAT[j][0], LAT[i][1] - LAT[j][1]) - L) < 3) LINKS.push([i, j]);
const N = LAT.length;
const GRID = [];
for (let i = -8; i <= 8; i++) for (let j = -8; j <= 8; j++) GRID.push([(i + j * 0.5) * 46, j * 46 * Math.sqrt(3) / 2]);
GRID.sort((p, q) => Math.hypot(...p) - Math.hypot(...q));
const LIQ = GRID.slice(0, N);
// pair each lattice spot with its nearest unused liquid spot
const MAP = new Array(N);
{
  const used = new Set();
  [...LAT.keys()].sort((i, j) => Math.hypot(...LAT[i]) - Math.hypot(...LAT[j])).forEach((i) => {
    let best = -1, bd = 1e9;
    LIQ.forEach((p, k) => { if (used.has(k)) return; const d = Math.hypot(p[0] - LAT[i][0] * 0.7, p[1] - LAT[i][1] * 0.7); if (d < bd) { bd = d; best = k; } });
    used.add(best); MAP[i] = best;
  });
}
const R_LIQ = Math.max(...LIQ.map((p) => Math.hypot(...p))) + 26, R_ICE = Math.max(...LAT.map((p) => Math.hypot(...p))) + 26;

// camera key helper: put world point (x, y) at screen x ~640 (right of Lala)
const K = (f, x, y, zoom = 1, rot = 0) => [f, { x: x - 100 / zoom, y, zoom, rot }];

export function frame(g, f, { C, words }) {
  const b = C.boil(f), { COL } = C;
  const cam = C.Camera2D.keys(f, [
    K(0, A[0], A[1], 1), K(T_ES1 - 3, A[0], A[1] - 10, 1.06), K(T_PADAHAL - 3, A[0] + 10, A[1] - 40, 1.14), K(T_YUK - 3, A[0], A[1] - 60, 1.18, -1),
    K(T_YUK + 30, A[0] - 30, A[1] - 150, 1.45, -1),
    K(T_AIR - 6, B[0], B[1], 1.0), K(T_SAKING, B[0], B[1], 1.06), K(T_WAKTU - 3, B[0] + 10, B[1] - 10, 1.12), K(T_RAPAT - 3, B[0], B[1], 1.24, 1.5),
    K(T_TAPI, B[0], B[1], 1.15), K(T_MEMBEKU - 3, B[0], B[1], 1.05), K(T_MELINGKAR - 3, B[0], B[1], 1.15, -1), K(T_BERGANDENGAN2 - 3, B[0], B[1], 1.08),
    K(T_TEMPAT, B[0], B[1], 0.98), K(T_JADI, B[0], B[1], 1.02), K(T_RUANG - 3, B[0] + HEX_C[0][0], B[1] + HEX_C[0][1] + 70, 1.65, 2), K(T_ES_JADI - 12, B[0] + HEX_C[0][0], B[1] + HEX_C[0][1] + 75, 1.7, 2),
    K(T_ES_JADI + 14, CB[0] - 80, CB[1], 1.0), K(T_MAKANYA - 3, CB[0] - 70, CB[1] - 10, 1.08, -1),
    K(T_MAKANYA + 14, E[0], E[1], 1.05), K(T_MENGAPUNG2 - 3, E[0], E[1] - 20, 1.15), K(T_MENGAPUNG2 + 16, E[0] - 10, E[1], 1.6, 2), K(T_DI_DANAU - 4, E[0] - 10, E[1] + 5, 1.62, 2),
    K(T_DI_DANAU + 16, D[0] - 110, D[1] + 20, 1.0), K(T_ESNYA - 3, D[0] - 110, D[1], 1.06), K(T_IKAN - 3, D[0] - 100, D[1] + 60, 1.14, -1), K(T_KEREN, D[0] - 110, D[1] + 40, 1.06),
    K(T_COBA - 2, D[0] - 110, D[1] + 20, 1.02), K(T_COBA + 18, E[0], E[1] - 40, 1.12), K(TOTAL, E[0], E[1] - 50, 1.2, 1)]);
  cam.apply(g);
  C.drawGraphPaper(g, { x0: -1200, y0: -800, x1: 7600, y1: 2800 });

  // ================= A: the hook glass =================
  if (f < T_AIR + 10) {
    const dp = C.clamp(f / 26);
    const cubes = [
      { x: -55, t0: T_ES1, rot: -0.15 },
      { x: 55, t0: T_ES1 + 10, rot: 0.2 },
    ];
    glass(g, C, A[0], A[1], f, b, dp, cubes);
    // "es = air": cube icon, equals sign, water drop
    if (f >= T_PADAHAL - 2) {
      const p = C.clamp((f - T_PADAHAL + 2) / 18), y = A[1] - 420;
      g.save(); g.translate(A[0] - 150, y); g.rotate(Math.sin(f * 0.08) * 0.08);
      C.crayonFill(g, C.rrect(-50, -50, 50, 50, 14), ICE, { progress: p, boilSeed: b + 40, width: 7 });
      g.restore();
      C.crayonStroke(g, [[A[0] - 45, y - 14], [A[0] + 35, y - 14]], C.CHARCOAL, C.clamp(p * 2 - 0.6), b + 41, { width: 12 });
      C.crayonStroke(g, [[A[0] - 45, y + 18], [A[0] + 35, y + 18]], C.CHARCOAL, C.clamp(p * 2 - 0.8), b + 42, { width: 12 });
      drop(g, C, A[0] + 140, y + 10 + Math.sin(f * 0.1) * 6, 1, C.clamp(p * 2 - 1), b + 43);
    }
    // magnifying glass sweeps in on "yuk, kita intip"
    if (f >= T_YUK - 2) {
      const p = C.clamp((f - T_YUK + 2) / 22), cx = A[0] - 55, cy = A[1] - 175;
      C.crayonStroke(g, [[cx + 105, cy + 105], [cx + 210, cy + 220]], "#8a5a3b", p, b + 45, { width: 34 });
      C.crayonStroke(g, C.ell(cx, cy, 140, 140, 40), C.CHARCOAL, p, b + 46, { width: 20, close: true });
      if (p >= 1) C.drawSparkle(g, cx + 110, cy - 110, f - T_YUK - 20, { boilSeed: b + 47 });
    }
  }

  // ================= B: inside the magnifier =================
  if (f >= T_YUK + 10 && f < T_ES_JADI + 30) {
    const [mx, my] = B, ring = C.clamp((f - T_YUK - 10) / 26);
    const freeze = C.smooth(C.clamp((f - T_MEMBEKU + 3) / 50));
    const inner = freeze > 0.5 ? "#eef9ff" : "#e3f2ff";
    C.crayonFill(g, C.ell(mx, my, R_MAG, R_MAG, 48), inner, { progress: ring, boilSeed: b + 50, outline: null, gap: 16, width: 8 });
    C.crayonStroke(g, [[mx + R_MAG * 0.72, my + R_MAG * 0.72], [mx + R_MAG * 1.05, my + R_MAG * 1.05]], "#8a5a3b", ring, b + 51, { width: 40 });
    C.crayonStroke(g, C.ell(mx, my, R_MAG, R_MAG, 48), C.CHARCOAL, ring, b + 52, { width: 22, close: true });
    // snowflakes around the lens when it freezes
    if (f >= T_MEMBEKU - 2) for (const [dx, dy, s, d] of [[-330, -260, 1, 0], [300, -300, 0.8, 6], [360, 150, 0.9, 12], [-360, 120, 0.7, 18]]) {
      snowflake(g, C, mx + dx, my + dy + Math.sin(f * 0.05 + d) * 10, s, C.clamp((f - T_MEMBEKU + 2 - d) / 14), f * 0.01 + d, b + 53 + d);
    }
    // "tiny! eyes can't see it": a little eye with a cross
    if (f >= T_MATA - 2 && f < T_WAKTU + 6) {
      const p = C.clamp((f - T_MATA + 2) / 14), ex = mx + 250, ey = my - 360;
      C.crayonFill(g, [[ex - 70, ey], [ex - 35, ey - 32], [ex + 35, ey - 32], [ex + 70, ey], [ex + 35, ey + 32], [ex - 35, ey + 32]], COL.white, { progress: p, boilSeed: b + 60, width: 7 });
      C.crayonFill(g, C.ell(ex, ey, 20, 20, 14), "#6b3e26", { progress: p, boilSeed: b + 61, outline: null, gap: 5 });
      C.crayonStroke(g, [[ex - 85, ey - 50], [ex + 85, ey + 50]], COL.red, C.clamp(p * 2 - 1), b + 62, { width: 16 });
    }
    const dotsIn = (i) => C.clamp((f - T_BUTIRAN + 2 - i * 0.8) / 8);
    if (f >= T_BUTIRAN - 2) {
      // footprint outlines: the old (liquid) size vs the new (ice) size
      if (f >= T_BERGANDENGAN2 - 2 && f < T_RUANG) {
        const p = C.clamp((f - T_BERGANDENGAN2 + 2) / 24);
        C.dottedPath(g, C.ell(mx, my, R_LIQ, R_LIQ, 60).concat([[mx + R_LIQ, my]]), p, COL.blue, b + 70, { gap: 20, r: 5 });
        if (f >= T_TEMPAT - 2) {
          const q = C.clamp((f - T_TEMPAT + 2) / 16), w = Math.sin(f * 0.25) * 6;
          for (let k = 0; k < 4; k++) {
            const a = k * Math.PI / 2 + Math.PI / 4, r0 = R_LIQ - 10, r1 = R_ICE + 30 + w;
            const [ux, uy] = [Math.cos(a), Math.sin(a)];
            C.crayonStroke(g, [[mx + ux * r0, my + uy * r0], [mx + ux * r1, my + uy * r1]], COL.orange, q, b + 71 + k, { width: 13 });
            const tip = [mx + ux * r1, my + uy * r1], back = (s) => [tip[0] - ux * 26 + s * uy * 22, tip[1] - uy * 26 - s * ux * 22];
            C.crayonStroke(g, [back(1), tip, back(-1)], COL.orange, q, b + 75 + k, { width: 13 });
          }
        }
      }
      // molecule positions
      const jig = f >= T_BERDESAKAN - 2 && f < T_MEMBEKU ? 1.6 : 1;
      const swirl = f * 0.004;
      const pos = LAT.map((lp, i) => {
        const q = LIQ[MAP[i]];
        const ca = Math.cos(swirl), sa = Math.sin(swirl);
        const lx = q[0] * ca - q[1] * sa + Math.sin(f * 0.21 + i * 1.7) * 5 * jig, ly = q[0] * sa + q[1] * ca + Math.cos(f * 0.17 + i * 2.3) * 5 * jig;
        const ix = lp[0] + Math.sin(f * 0.12 + i) * 1.6, iy = lp[1] + Math.cos(f * 0.1 + i * 2) * 1.6;
        return [mx + lx + (ix - lx) * freeze, my + ly + (iy - ly) * freeze];
      });
      // hand-holding links
      if (f >= T_BERGANDENGAN - 4) {
        const p = C.clamp((f - T_BERGANDENGAN + 4) / 24);
        LINKS.forEach(([i, j], k) => C.crayonStroke(g, [pos[i], pos[j]], COL.skin, C.clamp(p * 1.6 - (k % 5) * 0.12), b + 80 + (k % 7), { width: 12, passes: 2 }));
      }
      // "standing in a ring": highlight the middle hexagon
      if (f >= T_MELINGKAR - 2 && f < T_BERGANDENGAN2) {
        const hp = C.clamp((f - T_MELINGKAR + 2) / 18), [hx, hy] = HEX_C[0];
        C.crayonStroke(g, C.ell(mx + hx, my + hy, L + 40, L + 40, 40), COL.yellow, hp, b + 90, { width: 14, close: true });
      }
      // empty spaces in the middle of each ring
      if (f >= T_RUANG - 4) HEX_C.forEach(([hx, hy], k) => {
        const p = C.clamp((f - T_RUANG + 4 - k * 3) / 12);
        C.dottedPath(g, C.ell(mx + hx, my + hy, 28 * p + 4, 28 * p + 4, 24).concat([[mx + hx + 28 * p + 4, my + hy]]), p, COL.orange, b + 95 + k, { gap: 14, r: 4 });
        if (k === 0) C.drawSparkle(g, mx + hx, my + hy, (f - T_RUANG + 30) % 30, { s: 0.6, boilSeed: b + 99 });
      });
      pos.forEach(([x, y], i) => molecule(g, C, x, y, dotsIn(i), f, i, b + 100 + i, freeze));
    }
    // "berebut / rapat": squeeze arrows pressing on the crowd
    if (f >= T_RAPAT - 3 && f < T_TAPI + 10) {
      const k = C.clamp((f - T_RAPAT + 3) / 12), w = Math.sin(f * 0.35) * 8;
      for (const sx of [-1, 1]) {
        const x0 = mx + sx * (R_MAG + 90 + w), x1 = mx + sx * (R_MAG + 20 + w);
        C.crayonStroke(g, [[x0, my], [x1, my]], COL.purple, k, b + 150 + sx, { width: 15 });
        C.crayonStroke(g, [[x1 + sx * 26, my - 24], [x1, my], [x1 + sx * 26, my + 24]], COL.purple, k, b + 152 + sx, { width: 15 });
      }
    }
  }

  // ================= C: the balance =================
  if (f >= T_JADI && f < T_MAKANYA + 30) {
    const [bx, by] = CB, p = C.clamp((f - T_ES_JADI + 14) / 26);
    const tilt = C.smooth(C.clamp((f - T_RINGAN + 2) / 22)) * 0.2 + Math.sin(f * 0.15) * 0.01 * C.clamp((f - T_RINGAN) / 10);
    C.crayonFill(g, [[bx - 110, by + 330], [bx + 110, by + 330], [bx + 30, by + 270], [bx - 30, by + 270]], "#8a5a3b", { progress: p, boilSeed: b + 160, width: 8 });
    C.crayonStroke(g, [[bx, by + 280], [bx, by - 140]], C.CHARCOAL, p, b + 161, { width: 26 });
    const ca = Math.cos(tilt), sa = Math.sin(tilt), end = (s) => [bx + s * 225 * ca, by - 140 + s * 225 * sa];
    C.crayonStroke(g, [end(-1), end(1)], "#8a5a3b", p, b + 162, { width: 30 });
    C.crayonFill(g, C.ell(bx, by - 140, 22, 22, 14), COL.red, { progress: p, boilSeed: b + 163, width: 6 });
    for (const s of [-1, 1]) {
      const [ex, ey] = end(s), py = ey + 190, q = C.clamp(p * 2 - 1);
      C.crayonStroke(g, [[ex, ey], [ex - 80, py]], C.CHARCOAL, q, b + 164 + s, { width: 7, passes: 2 });
      C.crayonStroke(g, [[ex, ey], [ex + 80, py]], C.CHARCOAL, q, b + 166 + s, { width: 7, passes: 2 });
      C.crayonFill(g, [[ex - 100, py], [ex + 100, py], [ex + 75, py + 30], [ex - 75, py + 30]], "#c9ccd2", { progress: q, boilSeed: b + 168 + s, width: 7 });
      const ip = C.clamp(p * 3 - 2);
      if (s < 0) { // ice cube with honeycomb pattern
        C.crayonFill(g, C.rrect(ex - 70, py - 140, ex + 70, py, 16), ICE, { progress: ip, boilSeed: b + 170, width: 8 });
        if (ip >= 1) hexes(g, C, ex, py - 70, 0.4, b + 171);
      } else { // same-size block of water, crowded dots
        C.crayonFill(g, C.rrect(ex - 70, py - 140, ex + 70, py, 16), WATER, { progress: ip, boilSeed: b + 172, width: 8 });
        if (ip >= 1) for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) C.crayonFill(g, C.ell(ex - 52 + c * 26 + (r % 2) * 6, py - 122 + r * 26, 9, 9, 10), "#2f6fc0", { boilSeed: b + 173 + r, outline: null, gap: 4, width: 4 });
      }
    }
    // up arrow on the lighter ice
    if (f >= T_RINGAN + 6) {
      const q = C.clamp((f - T_RINGAN - 6) / 14), [ex, ey] = end(-1), y0 = ey - 110 + Math.sin(f * 0.2) * 8;
      C.crayonStroke(g, [[ex, y0 + 50], [ex, y0 - 50]], COL.green, q, b + 180, { width: 15 });
      C.crayonStroke(g, [[ex - 25, y0 - 25], [ex, y0 - 52], [ex + 25, y0 - 25]], COL.green, q, b + 181, { width: 15 });
      C.drawSparkle(g, ex + 90, ey - 60, (f - T_RINGAN - 6) % 34, { s: 0.8, boilSeed: b + 182 });
    }
  }

  // ================= E: second glass, the cube pops back up =================
  if (f >= T_MAKANYA - 10) {
    const p = C.clamp((f - T_MAKANYA + 10) / 20);
    const cubes = [{ x: -70, t0: -100, rot: -0.2 }, { x: 40, t0: T_MAKANYA + 6, rot: 0.15, hexes: true }];
    glass(g, C, E[0], E[1], f, b + 200, p, cubes);
    if (f >= T_MENGAPUNG2 - 2) {
      const q = C.clamp((f - T_MENGAPUNG2 + 2) / 12), w = Math.sin(f * 0.25) * 6;
      for (const sx of [-1, 1]) {
        const x = E[0] + 40 + sx * 105, y0 = E[1] - 215 + w;
        C.crayonStroke(g, [[x, y0 + 50], [x, y0 - 30]], COL.green, q, b + 230 + sx, { width: 12 });
        C.crayonStroke(g, [[x - 20, y0 - 10], [x, y0 - 32], [x + 20, y0 - 10]], COL.green, q, b + 232 + sx, { width: 12 });
      }
      C.drawSparkle(g, E[0] + 120, E[1] - 300, (f - T_MENGAPUNG2) % 36, { s: 0.8, boilSeed: b + 234 });
      C.drawSparkle(g, E[0] - 60, E[1] - 290, (f - T_MENGAPUNG2 - 14) % 36, { s: 0.6, color: COL.pink, boilSeed: b + 235 });
    }
    if (f >= T_KEREN) for (const [sx, sy, d] of [[-210, -300, 0], [200, -120, 11], [-180, 60, 21], [210, 200, 30]]) C.drawSparkle(g, E[0] + sx, E[1] + sy, (f - T_KEREN - d + 40) % 40, { boilSeed: b + 240 + d });
  }

  // ================= D: the frozen lake =================
  if (f >= T_DI_DANAU - 30) {
    const [dx, dy] = D, p = C.clamp((f - T_DI_DANAU + 30) / 30);
    g.save(); g.translate(dx, dy); g.scale(0.85, 0.85); g.translate(-dx, -dy);
    // dirt bowl under the lake, snow caps on the rims
    const earth = [[dx - 345, dy - 30], [dx + 345, dy - 30], ...C.bezier([dx + 345, dy - 30], [dx + 310, dy + 420], [dx - 310, dy + 420], [dx - 345, dy - 30]).slice(1, -1)];
    C.crayonFill(g, earth, "#b07a4f", { progress: p, boilSeed: b + 300, width: 9 });
    for (const sx of [-1, 1]) C.crayonFill(g, C.ell(dx + sx * 330, dy - 32, 50, 18, 16), COL.white, { progress: p, boilSeed: b + 301 + sx, width: 6 });
    // lake water (bowl)
    const lake = [[dx - 300, dy - 20], [dx + 300, dy - 20], ...C.bezier([dx + 300, dy - 20], [dx + 260, dy + 380], [dx - 260, dy + 380], [dx - 300, dy - 20]).slice(1, -1)];
    C.crayonFill(g, lake, WATER, { progress: p, boilSeed: b + 302, width: 9 });
    // bare little tree
    C.crayonStroke(g, [[dx + 330, dy - 45], [dx + 330, dy - 260]], "#6b3e26", p, b + 303, { width: 18 });
    C.crayonStroke(g, [[dx + 330, dy - 170], [dx + 380, dy - 230]], "#6b3e26", p, b + 304, { width: 12 });
    C.crayonStroke(g, [[dx + 330, dy - 140], [dx + 300, dy - 200]], "#6b3e26", p, b + 305, { width: 12 });
    // ice sheet on top
    if (f >= T_ESNYA - 3) {
      const q = C.clamp((f - T_ESNYA + 3) / 22);
      C.crayonFill(g, [[dx - 305, dy - 50], [dx + 305, dy - 50], [dx + 300, dy + 10], [dx - 300, dy + 10]], ICE, { progress: q, boilSeed: b + 310, width: 9 });
      if (q >= 1) for (const [x0, x1] of [[-230, -180], [20, 80], [180, 230]]) C.crayonStroke(g, [[dx + x0, dy - 35], [dx + x1, dy - 5]], COL.white, 1, b + 311 + x0, { width: 9 });
      if (q > 0.6) for (const sx of [-190, 100]) C.drawSparkle(g, dx + sx, dy - 80, (f - T_ESNYA + 40) % 40, { s: 0.6, color: COL.white, boilSeed: b + 315 + sx });
    }
    // fish swim safely underneath
    if (f >= T_IKAN - 3) {
      const path1 = C.bezier([dx - 240, dy + 130], [dx - 70, dy + 60], [dx + 90, dy + 220], [dx + 230, dy + 110]);
      const path2 = C.bezier([dx + 220, dy + 230], [dx + 90, dy + 290], [dx - 90, dy + 170], [dx - 220, dy + 240]);
      const t = C.clamp((f - T_IKAN + 3) / 70);
      C.dottedPath(g, path1, t, COL.white, b + 320, { gap: 22, r: 4 });
      const [x1, y1, a1] = C.along(path1, C.smooth(t));
      fish(g, C, x1, y1 + Math.sin(f * 0.3) * 4, 1, a1, COL.orange, f, b + 321);
      const t2 = C.clamp((f - T_IKAN - 8) / 70), [x2, y2, a2] = C.along(path2, C.smooth(t2));
      fish(g, C, x2, y2 + Math.sin(f * 0.27 + 1) * 4, 0.8, a2, COL.red, f, b + 325);
      if (f >= T_AMAN) C.drawSparkle(g, dx, dy + 60, (f - T_AMAN) % 36, { s: 0.7, boilSeed: b + 330 });
    }
    // gentle snow
    for (let i = 0; i < 9; i++) {
      const ph = (f * 0.006 + i * 0.377) % 1, x = dx - 380 + i * 95 + Math.sin(f * 0.03 + i) * 20, y = dy - 560 + ph * 480;
      if (f > T_DI_DANAU - 10) C.crayonFill(g, C.ell(x, y, 9, 9, 10), "#a9d8f5", { boilSeed: b + 340 + i, width: 4, gap: 5 });
    }
    g.restore();
  }

  // ================= screen space: Lala + keyword titles =================
  g.setTransform(1, 0, 0, 1, 0, 0);
  C.crayonFill(g, C.ell(200, 1338, 120, 14, 18), "#d8cdb8", { boilSeed: b + 400, outline: null, gap: 6 });
  const pose = f < T_PADAHAL - 3 ? "wave" : f >= T_KEREN - 2 ? "cheer" : "point";
  const expr = f >= T_KEREN - 2 ? "laugh"
    : (f >= T_RAPAT - 2 && f < T_TAPI) ? "laugh"
    : (f >= T_MEMBEKU - 2 && f < T_MEMBEKU + 30) || (f >= T_RUANG - 2 && f < T_ES_JADI) || (f >= T_MENGAPUNG2 - 2 && f < T_DI_DANAU) ? "wow"
    : (f >= T_PADAHAL - 2 && f < T_YUK) || (f >= T_MATA - 2 && f < T_WAKTU) ? "think" : "happy";
  C.drawKidHost(g, 200, 1335, { s: 0.72, pose, expr, talk: C.talkAt(f, words), blink: C.blink(f, 7), breathe: C.breathe(f, 7), frame: f });
  for (const [t0, t1, text, color] of TITLES) if (f >= t0 && f < t1) C.drawKeywordTitle(g, text, 560, 300, f - t0, { color, boilSeed: b, size: 100 });
}

// a drinking glass of iced tea with floating ice cubes. cube.t0 = frame it drops in (negative = already there)
function glass(g, C, cx, cy, f, b, dp, cubes) {
  const top = cy - 260, bot = cy + 260, surf = cy - 150;
  const wall = (y) => 175 - ((y - top) / (bot - top)) * 35;
  const drink = [[cx - wall(surf), surf + Math.sin(f * 0.1) * 3], [cx + wall(surf), surf - Math.sin(f * 0.1) * 3], [cx + wall(bot), bot], [cx - wall(bot), bot]];
  C.crayonFill(g, drink, DRINK, { progress: C.clamp(dp * 1.6 - 0.4), boilSeed: b + 1, width: 9, outline: null });
  // straw
  C.crayonStroke(g, [[cx + 80, bot - 60], [cx + 120, top - 40], [cx + 180, top - 110]], C.COL.red, C.clamp(dp * 2 - 1), b + 2, { width: 22 });
  for (const c of cubes) {
    const t = f - c.t0;
    if (dp < 1 || t < 0) continue;
    // drop in, sink, then bob up to float with the top poking out
    let y;
    if (t < 12) y = top - 220 + (surf + 40 - top + 220) * C.smooth(t / 12);
    else y = surf - 10 + 50 * Math.exp(-(t - 12) / 9) * Math.cos((t - 12) * 0.35);
    y += Math.sin(f * 0.09 + c.x) * 4;
    const s = c.hexes ? 1 : 1;
    g.save(); g.translate(cx + c.x, y); g.rotate(c.rot + Math.sin(f * 0.07 + c.x) * 0.05); g.scale(s, s);
    C.crayonFill(g, C.rrect(-52, -52, 52, 52, 14), ICE, { boilSeed: b + 10 + (c.x > 0 ? 1 : 0), width: 7 });
    C.crayonStroke(g, [[-30, -32], [8, -32]], C.COL.white, 1, b + 12, { width: 9 });
    if (c.hexes) hexes(g, C, 0, 4, 0.3, b + 13);
    g.restore();
    // splash on landing
    if (t >= 10 && t < 30) {
      const k = C.clamp((t - 10) / 10), fade = 1 - C.clamp((t - 20) / 10);
      g.save(); g.globalAlpha = fade;
      for (const a of [-0.8, -0.3, 0.3, 0.8]) C.crayonFill(g, C.ell(cx + c.x + Math.sin(a) * 90 * k, surf - 20 - Math.cos(a) * 70 * k, 10, 13, 10), "#f2c178", { boilSeed: b + 20, width: 4, gap: 5 });
      g.restore();
    }
  }
  // the part under the surface looks tinted
  if (dp >= 1) {
    g.save(); g.globalAlpha = 0.35; g.beginPath(); drink.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fillStyle = DRINK; g.fill(); g.restore();
  }
  const outline = [[cx - wall(top), top], [cx - wall(bot), bot], [cx + wall(bot), bot], [cx + wall(top), top]];
  C.crayonStroke(g, outline, C.CHARCOAL, dp, b + 3, { width: 16 });
  C.crayonStroke(g, [[cx - wall(top) + 30, top + 60], [cx - wall(top + 300) + 34, top + 300]], C.COL.white, C.clamp(dp * 2 - 1), b + 4, { width: 12 });
}

// tiny honeycomb pattern (ice inside view)
function hexes(g, C, x, y, s, b) {
  for (const [hx, hy] of HEX_C) {
    const pts = [];
    for (let k = 0; k <= 6; k++) { const a = (k / 6) * 2 * Math.PI + Math.PI / 6; pts.push([x + (hx + Math.cos(a) * L) * s * 0.5, y + (hy + Math.sin(a) * L) * s * 0.5]); }
    C.crayonStroke(g, pts, "#3b82f6", 1, b + hx, { width: 4, passes: 1 });
  }
}

// a cute water "butiran": blue ball with eyes; icy tint as it freezes
function molecule(g, C, x, y, p, f, i, b, freeze) {
  if (p <= 0) return;
  const r = 21 * C.pop(p * 12, 12), col = freeze > 0.5 ? "#7cc4f2" : "#3b8fe0";
  C.crayonFill(g, C.ell(x, y, r, r, 16), col, { boilSeed: b, width: 6, gap: 7 });
  if (p >= 1) {
    const bl = C.blink(f, i + 2);
    for (const sx of [-1, 1]) { g.fillStyle = C.CHARCOAL; g.beginPath(); g.ellipse(x + sx * 7, y - 3, 3.2, 4.2 * Math.max(0.15, 1 - bl), 0, 0, 7); g.fill(); }
  }
}

function drop(g, C, x, y, s, p, b) {
  if (p <= 0) return;
  const pts = [[x, y - 60 * s], ...C.bezier([x, y - 60 * s], [x + 45 * s, y - 10 * s], [x + 50 * s, y + 40 * s], [x, y + 40 * s]).slice(1), ...C.bezier([x, y + 40 * s], [x - 50 * s, y + 40 * s], [x - 45 * s, y - 10 * s], [x, y - 60 * s]).slice(1, -1)];
  C.crayonFill(g, pts, WATER, { progress: p, boilSeed: b, width: 7 });
}

function snowflake(g, C, x, y, s, p, rot, b) {
  if (p <= 0) return;
  for (let k = 0; k < 3; k++) {
    const a = rot + (k / 3) * Math.PI, ux = Math.cos(a) * 34 * s, uy = Math.sin(a) * 34 * s;
    C.crayonStroke(g, [[x - ux, y - uy], [x + ux, y + uy]], "#7cc4f2", p, b + k, { width: 9 });
  }
}

function fish(g, C, x, y, s, a, col, f, b) {
  g.save(); g.translate(x, y); g.rotate(a * 0.4); g.scale(s, s);
  const wag = Math.sin(f * 0.5) * 10;
  C.crayonFill(g, [[-40, 0], [-80, -30 + wag], [-80, 30 + wag]], col, { boilSeed: b, width: 6 });
  C.crayonFill(g, C.ell(0, 0, 55, 32, 20), col, { boilSeed: b + 1, width: 7 });
  g.fillStyle = C.CHARCOAL; g.beginPath(); g.arc(28, -6, 6, 0, 7); g.fill();
  g.restore();
}
