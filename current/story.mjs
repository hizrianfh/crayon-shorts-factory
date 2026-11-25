// Episode: Kenapa daun warnanya hijau? — inside the leaf live tiny green "chefs" (klorofil) that catch sunlight.
// Sunlight looks white but holds many colours; klorofil loves red + blue and uses them to cook the leaf's food
// (from water via the roots + air). Green isn't wanted much, so it bounces off (like a ball off a wall) into our eyes.
import fs from "node:fs";
const PH = JSON.parse(fs.readFileSync(new URL("./work/words.json", import.meta.url), "utf8"));
export const TOTAL = PH.total_frames;

const norm = (s) => s.toLowerCase().replace(/[^a-z]/g, "");
// f0 of the n-th word (0-based) that equals `w` exactly (after stripping punctuation)
const at = (w, n = 0, d = 0) => (PH.words.filter((x) => norm(x.text) === w)[n]?.f0 ?? d);

const T_KENAPA = at("kenapa", 0, 59), T_HIJAU0 = at("hijau", 0, 116), T_BUKAN = at("bukan", 0, 143), T_MERAH1 = at("merah", 0, 154);
const T_BIRU1 = at("biru", 0, 188), T_HIJAU1 = at("hijau", 1, 222), T_YUK = at("yuk", 0, 252), T_INTIP = at("intip", 0, 268);
const T_DI = at("di", 0, 304), T_ZAT = at("zat", 0, 346), T_KLOROFIL = at("klorofil", 0, 383), T_KLOROFIL2 = at("klorofil", 1, 422);
const T_KOKI = at("koki", 0, 468), T_DAPUR = at("dapur", 0, 498), T_TUGAS = at("tugasnya", 0, 532), T_MENANGKAP = at("menangkap", 0, 547);
const T_CAHAYA = at("cahaya", 1, 599), T_PUTIH = at("putih", 0, 655), T_PADAHAL = at("padahal", 0, 687), T_BANYAK = at("banyak", 0, 710);
const T_MERAH2 = at("merah", 1, 760), T_KUNING = at("kuning", 0, 790), T_HIJAU3 = at("hijau", 3, 820), T_BIRU2 = at("biru", 1, 851);
const T_KLOROFIL3 = at("klorofil", 2, 865), T_SUKA = at("suka", 0, 907), T_MERAH3 = at("merah", 2, 939), T_BIRU3 = at("biru", 2, 953);
const T_WARNA_ITU = at("warna", 2, 983), T_DIPAKAI = at("dipakai", 0, 1009), T_MEMASAK = at("memasak", 0, 1039), T_MAKANAN = at("makanan", 0, 1050);
const T_AIR = at("air", 0, 1105), T_AKAR = at("akar", 0, 1132), T_UDARA = at("udara", 0, 1162), T_TAPI2 = at("tapi", 1, 1195);
const T_HIJAU4 = at("hijau", 4, 1218), T_DISUKAI = at("disukai", 0, 1241), T_DIPANTULKAN = at("dipantulkan", 0, 1288), T_BOLA = at("bola", 0, 1330);
const T_TEMBOK = at("tembok", 0, 1364), T_CAHAYA3 = at("cahaya", 2, 1395), T_MATA = at("mata", 0, 1435), T_MAKANYA = at("makanya", 0, 1468);
const T_HIJAU6 = at("hijau", 6, 1495), T_KEREN = at("keren", 0, 1525), T_COBA = at("coba", 0, 1564);

const TITLES = [[T_HIJAU0 - 2, T_DI - 2, "Kenapa Hijau?", "#5cb85c"], [T_KLOROFIL - 2, T_BANYAK - 2, "Klorofil", "#3f9b4f"],
  [T_BANYAK - 2, T_DIPANTULKAN - 2, "Banyak Warna", "#ff9f1c"], [T_DIPANTULKAN - 2, T_MAKANYA - 2, "Dipantulkan!", "#3a7bd5"]];

// world regions (left -> right; the camera pans between them)
const A = [640, 900], B = [2100, 880], CC = [3500, 880], D = [4900, 900], E = [6300, 900], F = [7700, 900];
const R_LENS = 330;
const LEAF = "#5cb85c", LEAF_D = "#3f9b4f", LEAF_L = "#c9eeb5";
const GRAINS = [[0, 0], [-170, -90], [150, -120], [-120, 150], [170, 110], [10, -220], [-10, 230]];
const CHEF_C = [CC[0] + 130, CC[1] + 300];
const EYE = [E[0] + 250, E[1] - 330], HIT = [E[0] - 90, E[1] + 200];
const FAN = [["#ef4b3f", T_MERAH2], ["#ffd23f", T_KUNING], ["#5cb85c", T_HIJAU3], ["#3a7bd5", T_BIRU2]];
const PRISM = [CC[0] - 30, CC[1] - 120];
const fanEnd = (k) => [CC[0] + 330, CC[1] - 270 + k * 95];

// camera key helper: put world point (x, y) at screen x ~640 (right of Lala)
const K = (f, x, y, zoom = 1, rot = 0) => [f, { x: x - 100 / zoom, y, zoom, rot }];

export function frame(g, f, { C, words }) {
  const b = C.boil(f), { COL } = C;
  const cam = C.Camera2D.keys(f, [
    K(0, A[0], A[1], 1), K(T_HIJAU0 - 3, A[0], A[1] - 20, 1.08), K(T_BUKAN - 3, A[0], A[1] - 120, 1.04), K(T_HIJAU1, A[0] + 20, A[1] - 140, 1.12, -1),
    K(T_YUK - 3, A[0], A[1] - 40, 1.08), K(T_INTIP + 22, A[0] - 20, A[1] - 20, 1.55, 1),
    K(T_DI + 8, B[0], B[1], 1.0), K(T_KLOROFIL - 3, B[0], B[1], 1.08), K(T_KOKI - 3, B[0], B[1], 1.12, -1),
    K(T_KOKI + 14, B[0], B[1] + 10, 1.75, 2), K(T_TUGAS - 3, B[0], B[1] + 10, 1.8, 2), K(T_MENANGKAP + 8, B[0] + 60, B[1] - 110, 1.0), K(T_CAHAYA - 14, B[0] + 60, B[1] - 130, 1.06),
    K(T_CAHAYA + 8, CC[0], CC[1] - 80, 1.0), K(T_PUTIH - 3, CC[0] - 70, CC[1] - 130, 1.12), K(T_BANYAK - 3, CC[0] + 20, CC[1] - 60, 1.04),
    K(T_BIRU2 + 10, CC[0] + 80, CC[1] - 60, 1.14, -1), K(T_SUKA - 3, CC[0] + 60, CC[1] + 110, 1.08), K(T_MERAH3 - 3, CHEF_C[0] - 20, CHEF_C[1] - 230, 1.14, 1),
    K(T_WARNA_ITU - 8, CHEF_C[0] - 20, CHEF_C[1] - 220, 1.2, 1),
    K(T_WARNA_ITU + 8, D[0], D[1], 1.0), K(T_MEMASAK - 3, D[0], D[1] - 30, 1.08), K(T_MAKANAN + 12, D[0], D[1] - 110, 1.22, -1),
    K(T_AIR - 3, D[0], D[1] + 40, 1.0), K(T_UDARA, D[0] + 30, D[1], 1.08), K(T_TAPI2 - 12, D[0] + 30, D[1] - 10, 1.12),
    K(T_TAPI2 + 6, E[0], E[1], 1.0), K(T_DIPANTULKAN - 3, E[0] - 60, E[1], 1.12), K(T_BOLA - 3, E[0] + 80, E[1] + 80, 1.05),
    K(T_TEMBOK, E[0] + 200, E[1] + 160, 1.3, 1), K(T_CAHAYA3 - 3, E[0] + 60, E[1] - 60, 1.0), K(T_MATA, EYE[0] - 30, EYE[1] + 40, 1.6, 2), K(T_MAKANYA - 8, EYE[0] - 30, EYE[1] + 40, 1.65, 2),
    K(T_MAKANYA + 10, F[0], F[1], 1.0), K(T_KEREN, F[0], F[1] - 30, 1.06), K(TOTAL, F[0], F[1] - 30, 1.12, 1)]);
  cam.apply(g);
  C.drawGraphPaper(g, { x0: -1200, y0: -800, x1: 9000, y1: 2800 });

  // ================= A: the hook leaf =================
  if (f < T_DI + 12) {
    const [ax, ay] = A, p = C.clamp(f / 28), sw = Math.sin(f * 0.06) * 0.04;
    C.crayonStroke(g, [[ax + 40, ay + 340], [ax + 30, ay + 250], [ax + 10, ay + 200]], "#6b3e26", p, b + 1, { width: 22 });
    g.save(); g.translate(ax + 10, ay + 220); g.rotate(sw); g.translate(-ax - 10, -ay - 220);
    leaf(g, C, ax + 10, ay + 220, ax - 40, ay - 240, 260, LEAF, C.clamp(f / 30), b + 2);
    g.restore();
    // red X, blue X, green check
    const sws = [[COL.red, T_MERAH1, -1], ["#3a7bd5", T_BIRU1, -1], [LEAF, T_HIJAU1, 1]];
    sws.forEach(([col, t0, ok], k) => {
      if (f < t0 - 3 || f > T_INTIP + 16) return;
      const x = ax - 240 + k * 240, y = ay - 360, q = C.clamp((f - t0 + 3) / 12) * (1 - C.clamp((f - T_INTIP - 2) / 12)), wob = Math.sin(f * 0.1 + k) * 0.08;
      g.save(); g.translate(x, y + 70); g.rotate(wob); g.translate(-x, -y - 70);
      leaf(g, C, x, y + 70, x, y - 90, 80, col, q, b + 10 + k);
      g.restore();
      const r = C.clamp((f - t0 - 6) / 10) * (q >= 0.99 ? 1 : 0);
      if (ok < 0) {
        C.crayonStroke(g, [[x - 70, y - 70], [x + 70, y + 70]], C.CHARCOAL, r, b + 15 + k, { width: 16 });
        C.crayonStroke(g, [[x + 70, y - 70], [x - 70, y + 70]], C.CHARCOAL, C.clamp(r * 2 - 1), b + 18 + k, { width: 16 });
      } else {
        C.crayonStroke(g, [[x - 60, y + 10], [x - 15, y + 60], [x + 75, y - 70]], COL.yellow, r, b + 20, { width: 22 });
        if (r >= 1) C.drawSparkle(g, x + 90, y - 90, (f - t0 - 16) % 34, { boilSeed: b + 21 });
      }
    });
    // magnifying glass on "yuk, kita intip"
    if (f >= T_YUK - 2) {
      const q = C.clamp((f - T_YUK + 2) / 20), cx = ax - 20, cy = ay - 20;
      C.crayonFill(g, C.ell(cx, cy, 150, 150, 40), "#e9f8e2", { progress: q, boilSeed: b + 25, outline: null, gap: 18, width: 6 });
      C.crayonStroke(g, [[cx + 110, cy + 110], [cx + 220, cy + 230]], "#8a5a3b", q, b + 26, { width: 36 });
      C.crayonStroke(g, C.ell(cx, cy, 150, 150, 40), C.CHARCOAL, q, b + 27, { width: 20, close: true });
      if (q >= 1) for (const [dx, dy] of [[-40, -30], [50, 20], [-10, 60]]) C.crayonFill(g, C.ell(cx + dx, cy + dy, 22, 22, 14), LEAF_D, { boilSeed: b + 28 + dx, width: 5, gap: 6 });
    }
  }

  // ================= B: inside the leaf, the klorofil chefs =================
  if (f >= T_YUK + 10 && f < T_CAHAYA + 30) {
    const [bx, by] = B, ring = C.clamp((f - T_YUK - 10) / 26);
    C.crayonFill(g, C.ell(bx, by, R_LENS, R_LENS, 48), LEAF_L, { progress: ring, boilSeed: b + 50, outline: null, gap: 16, width: 8 });
    // leaf veins inside the lens
    if (ring >= 1) {
      C.crayonStroke(g, [[bx - 300, by + 120], [bx + 300, by - 120]], "#9fd88a", 1, b + 51, { width: 14, passes: 2 });
      for (const t of [-0.5, 0, 0.5]) { const x0 = bx + t * 300, y0 = by - t * 120; C.crayonStroke(g, [[x0, y0], [x0 + 70, y0 + 150]], "#9fd88a", 1, b + 52 + t * 4, { width: 9, passes: 2 }); C.crayonStroke(g, [[x0, y0], [x0 - 60, y0 - 160]], "#9fd88a", 1, b + 56 + t * 4, { width: 9, passes: 2 }); }
    }
    C.crayonStroke(g, [[bx + R_LENS * 0.72, by + R_LENS * 0.72], [bx + R_LENS * 1.05, by + R_LENS * 1.05]], "#8a5a3b", ring, b + 60, { width: 40 });
    C.crayonStroke(g, C.ell(bx, by, R_LENS, R_LENS, 48), C.CHARCOAL, ring, b + 61, { width: 22, close: true });
    // sun + rays caught by the chefs
    if (f >= T_MENANGKAP - 8) {
      const q = C.clamp((f - T_MENANGKAP + 8) / 14), sx = bx + 300, sy = by - 470;
      g.save(); g.translate(sx, sy); g.scale(q, q); g.translate(-sx, -sy);
      C.drawSun(g, sx, sy, { r: 70, frame: f, boilSeed: b + 62 });
      g.restore();
      GRAINS.forEach(([gx, gy], i) => {
        const r = C.clamp((f - T_MENANGKAP - 2 - i * 2) / 14), tx = bx + gx, ty = by + gy - 50;
        if (r > 0) C.dottedPath(g, [[sx - 40, sy + 50], [tx, ty]], r, COL.orange, b + 63 + i, { gap: 22, r: 6 });
      });
    }
    // grains -> faces -> chef hats
    GRAINS.forEach(([gx, gy], i) => {
      const p = C.clamp((f - T_ZAT + 2 - i * 3) / 10);
      if (p <= 0) return;
      const x = bx + gx + Math.sin(f * 0.07 + i) * 5, y = by + gy + Math.cos(f * 0.06 + i * 2) * 5;
      const face = C.clamp((f - T_KLOROFIL + 2 - i) / 6), hat = C.clamp((f - T_KOKI + 2 - i * 2) / 10);
      const happy = f >= T_MENANGKAP && f < T_CAHAYA + 30;
      chef(g, C, x, y, i === 0 ? 1.15 : 0.85, f, i, b + 70 + i * 3, { p, face, hat, mouth: happy ? 0.5 + 0.5 * Math.abs(Math.sin(f * 0.3 + i)) : 0 });
    });
    // a tiny frying pan for "dapur"
    if (f >= T_DAPUR - 3) {
      const q = C.clamp((f - T_DAPUR + 3) / 12), px = bx + 95, py = by + 30, s = C.pop((f - T_DAPUR + 3), 12);
      g.save(); g.translate(px, py); g.rotate(-0.3 + Math.sin(f * 0.2) * 0.1); g.scale(s, s);
      C.crayonStroke(g, [[30, 0], [95, 0]], "#6b3e26", q, b + 95, { width: 16 });
      C.crayonFill(g, C.ell(0, 0, 40, 18, 18), "#8b8f99", { progress: q, boilSeed: b + 96, width: 6 });
      g.restore();
    }
    if (f >= T_KOKI + 10 && f < T_MENANGKAP) C.drawSparkle(g, bx + 90, by - 110, (f - T_KOKI - 10) % 32, { s: 0.6, boilSeed: b + 97 });
  }

  // ================= C: white sunlight holds many colours =================
  if (f >= T_CAHAYA - 30 && f < T_WARNA_ITU + 30) {
    const [cx, cy] = CC, [px, py] = PRISM, sx = cx - 290, sy = cy - 390;
    const p = C.clamp((f - T_CAHAYA + 30) / 20);
    g.save(); g.translate(sx, sy); g.scale(p, p); g.translate(-sx, -sy);
    C.drawSun(g, sx, sy, { r: 85, frame: f, boilSeed: b + 100 });
    g.restore();
    // white beam
    const q = C.clamp((f - T_CAHAYA + 2) / 22);
    if (q > 0) {
      const ux = px - sx, uy = py - sy, L = Math.hypot(ux, uy), nx = -uy / L, ny = ux / L, ex = sx + ux * q, ey = sy + uy * q;
      C.crayonFill(g, [[sx + nx * 40, sy + ny * 40], [ex + nx * 34, ey + ny * 34], [ex - nx * 34, ey - ny * 34], [sx - nx * 40, sy - ny * 40]], COL.white, { boilSeed: b + 101, width: 8, gap: 9 });
      if (f >= T_PUTIH - 2) C.drawSparkle(g, px - 120, py - 150, (f - T_PUTIH + 2) % 34, { s: 0.8, color: COL.white, boilSeed: b + 102 });
    }
    // "banyak warna": dotted hint lines, then each coloured stripe on its word
    if (f >= T_BANYAK - 3) FAN.forEach(([col, t0], k) => {
      const [ex, ey] = fanEnd(k), hint = C.clamp((f - T_BANYAK + 3 - k * 3) / 12);
      if (f < t0 - 2) C.dottedPath(g, [[px, py], [ex, ey]], hint, col, b + 105 + k, { gap: 20, r: 5 });
      else {
        const r = C.clamp((f - t0 + 2) / 12), ux = ex - px, uy = ey - py, L = Math.hypot(ux, uy), nx = -uy / L, ny = ux / L;
        const wv = Math.sin(f * 0.15 + k) * 3, w1 = 34 + wv, tx = px + ux * r, ty = py + uy * r;
        C.crayonFill(g, [[px + nx * 6, py + ny * 6], [tx + nx * w1 * r, ty + ny * w1 * r], [tx - nx * w1 * r, ty - ny * w1 * r], [px - nx * 6, py - ny * 6]], col, { boilSeed: b + 110 + k, width: 7, gap: 9 });
        if (r >= 1 && f < t0 + 30) C.drawSparkle(g, ex + 50, ey, f - t0 - 10, { s: 0.6, color: col, boilSeed: b + 115 + k });
      }
    });
    if (f >= T_BANYAK - 3) C.crayonFill(g, C.ell(px, py, 26, 26, 16), COL.white, { boilSeed: b + 119, width: 6 });
    // the klorofil chef loves red + blue
    if (f >= T_KLOROFIL3 - 3) {
      const cp = C.clamp((f - T_KLOROFIL3 + 3) / 10);
      const eatR = f >= T_MERAH3 + 14 && f < T_MERAH3 + 24, eatB = f >= T_BIRU3 + 14 && f < T_BIRU3 + 24;
      const mouth = eatR || eatB ? 1 : (f >= T_MERAH3 + 2 && f < T_BIRU3 + 24 ? 0.6 : 0);
      chef(g, C, CHEF_C[0], CHEF_C[1] + Math.sin(f * 0.12) * 6, 1.7, f, 0, b + 120, { p: cp, face: 1, hat: cp, mouth });
      if (f >= T_SUKA - 2) for (const [dx, d] of [[-120, 0], [120, 12]]) {
        const t = (f - T_SUKA + 2 + d) % 40, k = C.clamp(t / 10) * (1 - C.clamp((t - 28) / 12));
        heart(g, C, CHEF_C[0] + dx, CHEF_C[1] - 130 - t * 2, 0.7 * k, b + 125 + d);
      }
      for (const [k, t0] of [[0, T_MERAH3], [3, T_BIRU3]]) {
        const t = C.clamp((f - t0 + 4) / 20);
        if (t <= 0 || t >= 1) continue;
        const [ex, ey] = fanEnd(k), path = C.bezier([ex, ey], [ex + 60, ey + 120], [CHEF_C[0] + 80, CHEF_C[1] - 220], [CHEF_C[0], CHEF_C[1] + 30]);
        C.dottedPath(g, path, t, FAN[k][0], b + 130 + k, { gap: 22, r: 5 });
        const [x, y] = C.along(path, C.smooth(t));
        lightBall(g, C, x, y, 1.1, FAN[k][0], b + 135 + k);
      }
      if (f >= T_MERAH3 + 16) C.drawSparkle(g, CHEF_C[0] + 110, CHEF_C[1] - 40, f - T_MERAH3 - 16, { s: 0.7, color: COL.red, boilSeed: b + 140 });
      if (f >= T_BIRU3 + 16) C.drawSparkle(g, CHEF_C[0] - 110, CHEF_C[1] - 40, f - T_BIRU3 - 16, { s: 0.7, color: "#3a7bd5", boilSeed: b + 141 });
    }
  }

  // ================= D: cooking the leaf's food =================
  if (f >= T_WARNA_ITU - 20 && f < T_TAPI2 + 30) {
    const [dx, dy] = D, p = C.clamp((f - T_WARNA_ITU + 20) / 24);
    // stem + roots under the pot (drawn on "air dari akar")
    if (f >= T_AIR - 6) {
      const q = C.clamp((f - T_AIR + 6) / 16);
      C.crayonStroke(g, [[dx, dy + 150], [dx + 8, dy + 230], [dx, dy + 300]], LEAF_D, q, b + 200, { width: 20 });
      for (const [rx, ry, k] of [[-110, 370, 0], [-30, 390, 1], [60, 385, 2], [120, 350, 3]]) C.crayonStroke(g, [[dx, dy + 300], [dx + rx * 0.5, dy + ry - 30], [dx + rx, dy + ry]], "#9a6a3f", C.clamp(q * 1.6 - 0.4 - k * 0.1), b + 201 + k, { width: 12 });
      C.crayonStroke(g, [[dx - 230, dy + 300], [dx + 230, dy + 300]], "#9a6a3f", q, b + 206, { width: 10, passes: 2 });
      const t = C.clamp((f - T_AIR - 2) / 46);
      if (t > 0 && t < 1) {
        const path = [[dx - 60, dy + 380], [dx - 5, dy + 330], [dx + 4, dy + 240], [dx, dy + 120]];
        C.dottedPath(g, path, t, "#3a7bd5", b + 207, { gap: 18, r: 4 });
        const [x, y] = C.along(path, C.smooth(t));
        drop(g, C, x, y, 0.55, b + 208);
      }
      if (f >= T_AKAR) C.drawSparkle(g, dx - 120, dy + 380, f - T_AKAR, { s: 0.6, boilSeed: b + 209 });
    }
    // air swirls drift in from the right
    if (f >= T_UDARA - 4) for (let k = 0; k < 3; k++) {
      const t = C.clamp((f - T_UDARA + 4 - k * 6) / 34);
      if (t <= 0 || t >= 1) continue;
      const path = C.bezier([dx + 420, dy - 200 + k * 80], [dx + 300, dy - 300], [dx + 150, dy - 160], [dx + 40, dy - 40]);
      const [x, y] = C.along(path, C.smooth(t));
      swirl(g, C, x, y, 0.9, f * 0.2 + k, b + 215 + k);
    }
    // pot
    C.crayonFill(g, C.rrect(dx - 170, dy - 40, dx + 170, dy + 150, 40), "#8b8f99", { progress: p, boilSeed: b + 220 });
    C.crayonFill(g, C.rrect(dx - 195, dy - 70, dx + 195, dy - 30, 18), "#6f737c", { progress: p, boilSeed: b + 221, width: 7 });
    for (const s of [-1, 1]) C.crayonStroke(g, [[dx + s * 195, dy - 10], [dx + s * 240, dy - 10], [dx + s * 240, dy + 30]], C.CHARCOAL, p, b + 222 + s, { width: 14 });
    C.crayonFill(g, C.ell(dx, dy - 52, 175, 16, 24), "#9be27c", { progress: C.clamp(p * 2 - 1), boilSeed: b + 225, outline: null, gap: 6, width: 5 });
    // red + blue light dropped in
    for (const [k, col, d] of [[0, "#ef4b3f", 0], [1, "#3a7bd5", 8]]) {
      const t = C.clamp((f - T_DIPAKAI + 3 - d) / 16);
      if (t <= 0 || t >= 1) continue;
      lightBall(g, C, dx - 40 + k * 80, dy - 420 + 370 * t * t, 1, col, b + 230 + k);
    }
    // the chef stirring
    const stir = Math.sin(f * 0.25) * 30;
    C.crayonStroke(g, [[dx - 210, dy - 170], [dx - 20 + stir, dy - 40]], "#8a5a3b", p, b + 235, { width: 14 });
    chef(g, C, dx - 230, dy - 190 + Math.sin(f * 0.2) * 5, 1.15, f, 2, b + 240, { p, face: 1, hat: 1, mouth: f >= T_MEMASAK && f < T_MAKANAN + 20 ? 0.8 : 0 });
    // steam + food
    if (f >= T_MEMASAK - 3) for (let k = 0; k < 3; k++) {
      const q = C.clamp((f - T_MEMASAK + 3 - k * 4) / 14), x = dx - 70 + k * 70, w = Math.sin(f * 0.15 + k) * 12;
      C.crayonStroke(g, [[x, dy - 90], [x + 18 + w, dy - 130], [x - 10 - w, dy - 170], [x + 12 + w, dy - 210]], "#c9ccd2", q, b + 250 + k, { width: 12, passes: 2 });
    }
    if (f >= T_MAKANAN - 2) {
      const s = C.pop(f - T_MAKANAN + 2, 14), x = dx + 10, y = dy - 330 + Math.sin(f * 0.1) * 8;
      g.save(); g.translate(x, y); g.rotate(Math.sin(f * 0.08) * 0.1); g.scale(s, s);
      C.crayonFill(g, C.rrect(-70, -55, 70, 55, 26), COL.yellow, { boilSeed: b + 260 });
      C.crayonStroke(g, [[-40, -10], [-15, 15], [40, -25]], COL.orange, 1, b + 261, { width: 10, passes: 2 });
      g.restore();
      C.drawSparkle(g, x + 100, y - 50, (f - T_MAKANAN) % 36, { s: 0.7, boilSeed: b + 262 });
      C.drawSparkle(g, x - 100, y + 30, (f - T_MAKANAN - 16) % 36, { s: 0.5, color: COL.pink, boilSeed: b + 263 });
    }
  }

  // ================= E: green bounces off, like a ball off a wall, into our eyes =================
  if (f >= T_UDARA + 10 && f < T_MAKANYA + 30) {
    const [ex, ey] = E, p = C.clamp((f - T_UDARA - 10) / 24), sx = ex - 330, sy = ey - 400;
    g.save(); g.translate(sx, sy); g.scale(p, p); g.translate(-sx, -sy);
    C.drawSun(g, sx, sy, { r: 65, frame: f, boilSeed: b + 300 });
    g.restore();
    const out = 1 - C.clamp((f - T_CAHAYA3 - 6) / 12);
    g.save(); g.translate(ex + 100, ey + 300); g.rotate(Math.sin(f * 0.05) * 0.04); g.scale(out, out); g.translate(-ex - 100, -ey - 300);
    if (out > 0) leaf(g, C, ex + 100, ey + 300, ex - 260, ey + 120, 180, LEAF, p, b + 301);
    g.restore();
    // red + blue get swallowed by the leaf, green waits on top
    for (const [col, t0, keep] of [["#ef4b3f", T_TAPI2 - 6, 0], ["#3a7bd5", T_TAPI2 + 4, 0], ["#5cb85c", T_HIJAU4 - 4, 1]]) {
      const t = C.clamp((f - t0) / 22);
      if (t <= 0) continue;
      const path = [[sx + 50, sy + 60], [HIT[0], HIT[1] - 40]];
      if (!keep) {
        if (t < 1) { const [x, y] = C.along(path, C.smooth(t)); lightBall(g, C, x, y, 1, col, b + 305); }
        else if (f - t0 - 22 < 12) { lightBall(g, C, HIT[0], HIT[1] - 30, 1 - (f - t0 - 22) / 12, col, b + 306); C.drawSparkle(g, HIT[0], HIT[1] - 50, f - t0 - 22, { s: 0.6, color: col, boilSeed: b + 307 }); }
        continue;
      }
      // the green one: arrives, then bounces off toward the eye
      const bounce = path.concat([]);
      if (f < T_DIPANTULKAN - 2) {
        const [x, y] = t < 1 ? C.along(path, C.smooth(t)) : [HIT[0], HIT[1] - 40 - Math.abs(Math.sin((f - t0) * 0.25)) * 18];
        lightBall(g, C, x, y, 1.2, col, b + 308);
      } else {
        const out = C.bezier([HIT[0], HIT[1] - 40], [HIT[0] + 80, HIT[1] - 360], [EYE[0] - 260, EYE[1] - 40], [EYE[0], EYE[1]]);
        const u = f < T_CAHAYA3 - 3 ? 0.45 * C.smooth(C.clamp((f - T_DIPANTULKAN + 2) / 28)) : 0.45 + 0.55 * C.smooth(C.clamp((f - T_CAHAYA3 + 3) / 38));
        if (f < T_MATA - 2) C.dottedPath(g, out, u, LEAF_D, b + 309, { gap: 24, r: 6 });
        const [x, y] = C.along(out, u), hov = u > 0.44 && u < 0.46 ? Math.sin(f * 0.2) * 8 : 0;
        if (u < 0.99) lightBall(g, C, x, y + hov, 1.2, col, b + 310);
        if (f >= T_DIPANTULKAN - 2 && f < T_DIPANTULKAN + 14) C.drawSparkle(g, HIT[0] + 40, HIT[1] - 60, f - T_DIPANTULKAN + 2, { s: 0.8, color: LEAF, boilSeed: b + 311 });
        void bounce;
      }
    }
    // the wall + bouncing ball analogy
    if (f >= T_BOLA - 10 && f < T_CAHAYA3 + 18) {
      const q = C.clamp((f - T_BOLA + 10) / 16) * (1 - C.clamp((f - T_CAHAYA3 - 6) / 12)), wx = ex + 380, wy = ey + 40;
      C.crayonFill(g, C.rrect(wx, wy, wx + 110, wy + 260, 8), "#d9714a", { progress: q, boilSeed: b + 320, width: 8 });
      if (q >= 1) for (let r = 1; r < 5; r++) { C.crayonStroke(g, [[wx, wy + r * 52], [wx + 110, wy + r * 52]], "#8a3b22", 1, b + 321 + r, { width: 6, passes: 1 }); C.crayonStroke(g, [[wx + 55 + (r % 2 ? 0 : -28), wy + r * 52 - 52], [wx + 55 + (r % 2 ? 0 : -28), wy + r * 52]], "#8a3b22", 1, b + 326 + r, { width: 6, passes: 1 }); }
      const t = C.clamp((f - T_BOLA) / 44);
      const path = [[ex + 60, ey + 120], ...C.bezier([ex + 60, ey + 120], [ex + 160, ey + 20], [ex + 280, ey + 80], [wx - 30, ey + 170], 16).slice(1), ...C.bezier([wx - 30, ey + 170], [ex + 300, ey + 40], [ex + 200, ey - 40], [ex + 90, ey - 10], 16).slice(1)];
      if (t > 0 && q > 0.5) {
        C.dottedPath(g, path, t, C.CHARCOAL, b + 331, { gap: 22, r: 4 });
        const [x, y] = C.along(path, t);
        ball(g, C, x, y, f, b + 332);
        if (f >= T_TEMBOK - 6 && f < T_TEMBOK + 14) C.drawSparkle(g, wx - 20, ey + 170, f - T_TEMBOK + 6, { s: 0.7, boilSeed: b + 333 });
      }
    }
    // the eye that sees the green light
    if (f >= T_CAHAYA3 - 3) eye(g, C, EYE[0], EYE[1], C.clamp((f - T_CAHAYA3 + 3) / 14), f, b + 340, f >= T_MATA + 4);
  }

  // ================= F: the whole green tree =================
  if (f >= T_MAKANYA - 20) {
    const [fx, fy] = F, p = C.clamp((f - T_MAKANYA + 20) / 26);
    C.drawSun(g, fx + 320, fy - 470, { r: 70, frame: f, boilSeed: b + 400 });
    C.crayonStroke(g, [[fx - 380, fy + 300], [fx + 380, fy + 300]], LEAF_D, p, b + 401, { width: 20 });
    C.crayonFill(g, [[fx - 45, fy + 300], [fx - 32, fy + 20], [fx + 32, fy + 20], [fx + 45, fy + 300]], "#9a6a3f", { progress: p, boilSeed: b + 402 });
    const crown = [[0, -120, 230, 190], [-170, -40, 150, 130], [170, -40, 150, 130], [-100, -260, 150, 130], [110, -260, 150, 130]];
    crown.forEach(([cx, cy, rx, ry], k) => C.crayonFill(g, C.ell(fx + cx + Math.sin(f * 0.05 + k) * 5, fy + cy, rx, ry, 28), k % 2 ? LEAF : LEAF_D, { progress: C.clamp(p * 1.5 - k * 0.1), boilSeed: b + 405 + k, width: 9 }));
    if (p >= 1) for (const [lx, ly, k] of [[-180, -150, 0], [60, -330, 1], [190, -150, 2], [-60, 40, 3], [130, 60, 4]]) {
      const a = Math.sin(f * 0.08 + k) * 0.15;
      g.save(); g.translate(fx + lx, fy + ly); g.rotate(a);
      leaf(g, C, 0, 30, 0, -50, 60, "#7ed36a", 1, b + 410 + k, false);
      g.restore();
    }
    // little green light-balls bouncing off the tree
    if (f >= T_HIJAU6 - 3) for (let k = 0; k < 3; k++) {
      const t = ((f - T_HIJAU6 + 3 + k * 14) % 42) / 42, a = -0.9 + k * 0.6;
      lightBall(g, C, fx + Math.cos(a) * (220 + t * 240), fy - 120 + Math.sin(a) * (200 + t * 200), 0.8 * (1 - t * 0.5), LEAF, b + 420 + k);
    }
    if (f >= T_KEREN - 2) for (const [sx, sy, d] of [[-300, -350, 0], [300, -200, 11], [-320, 120, 21], [280, 160, 30]]) C.drawSparkle(g, fx + sx, fy + sy, (f - T_KEREN - d + 40) % 40, { boilSeed: b + 430 + d });
  }

  // ================= screen space: Lala + keyword titles =================
  g.setTransform(1, 0, 0, 1, 0, 0);
  C.crayonFill(g, C.ell(200, 1338, 120, 14, 18), "#d8cdb8", { boilSeed: b + 500, outline: null, gap: 6 });
  const pose = f < T_BUKAN - 3 ? "wave" : f >= T_KEREN - 2 ? "cheer" : "point";
  const expr = f >= T_KEREN - 2 ? "laugh"
    : (f >= T_BOLA - 2 && f < T_CAHAYA3) || (f >= T_SUKA - 2 && f < T_MERAH3) ? "laugh"
    : (f >= T_KOKI - 2 && f < T_TUGAS) || (f >= T_BANYAK - 2 && f < T_ADA()) || (f >= T_DIPANTULKAN - 2 && f < T_BOLA - 2) || (f >= T_MAKANYA - 2 && f < T_KEREN - 2) ? "wow"
    : (f >= T_KENAPA - 2 && f < T_BUKAN) || (f >= T_DISUKAI - 2 && f < T_DIPANTULKAN - 2) ? "think" : "happy";
  C.drawKidHost(g, 200, 1335, { s: 0.72, pose, expr, talk: C.talkAt(f, words), blink: C.blink(f, 7), breathe: C.breathe(f, 7), frame: f });
  for (const [t0, t1, text, color] of TITLES) if (f >= t0 && f < t1) C.drawKeywordTitle(g, text, 560, 300, f - t0, { color, boilSeed: b, size: 100 });
}
function T_ADA() { return at("ada", 1, 751); }

// leaf shape from base (bx, by) to tip (tx, ty), `wid` = bulge
function leaf(g, C, bx, by, tx, ty, wid, col, p, b, vein = true) {
  if (p <= 0) return;
  const dx = tx - bx, dy = ty - by, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  const P = (a, s) => [bx + ux * L * a + nx * wid * s, by + uy * L * a + ny * wid * s];
  const s1 = C.bezier([bx, by], P(0.2, 0.75), P(0.7, 0.7), [tx, ty], 20), s2 = C.bezier([tx, ty], P(0.7, -0.7), P(0.2, -0.75), [bx, by], 20);
  C.crayonFill(g, s1.concat(s2.slice(1, -1)), col, { progress: p, boilSeed: b, width: 8 });
  if (vein && p > 0.5) {
    const q = C.clamp(p * 2 - 1), dk = C.shade(col, 0.72);
    C.crayonStroke(g, [[bx, by], P(0.5, 0.03), [tx - ux * L * 0.08, ty - uy * L * 0.08]], dk, q, b + 1, { width: Math.max(5, wid * 0.05), passes: 2 });
    for (const a of [0.3, 0.5, 0.7]) for (const s of [-1, 1]) C.crayonStroke(g, [P(a, 0), P(a + 0.12, s * 0.38)], dk, q, b + 2 + a * 10 + s, { width: Math.max(4, wid * 0.035), passes: 1 });
  }
}

// a klorofil grain: green blob, optional face, chef hat, open mouth
function chef(g, C, x, y, s, f, i, b, { p = 1, face = 0, hat = 0, mouth = 0 } = {}) {
  if (p <= 0) return;
  const k = C.pop(p * 12, 12);
  g.save(); g.translate(x, y); g.scale(s * k, s * k);
  C.crayonFill(g, C.ell(0, 0, 48, 42, 22), "#3f9b4f", { boilSeed: b, width: 7, gap: 8 });
  if (face > 0) {
    const bl = C.blink(f, i + 3);
    for (const sx of [-1, 1]) { g.fillStyle = C.CHARCOAL; g.beginPath(); g.ellipse(sx * 15, -6, 5, 7 * Math.max(0.15, 1 - bl), 0, 0, 7); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.arc(sx * 15 + 2, -9, 2, 0, 7); g.fill(); }
    if (mouth > 0.05) C.crayonFill(g, C.ell(0, 16, 9 + 3 * mouth, 4 + 9 * mouth, 12), "#b8323f", { boilSeed: b + 1, width: 4, gap: 4, outline: null });
    else C.crayonStroke(g, [[-12, 12], [0, 20], [12, 12]], C.CHARCOAL, 1, b + 1, { width: 5, passes: 2 });
    for (const sx of [-1, 1]) C.crayonFill(g, C.ell(sx * 30, 10, 8, 5, 10), C.COL.pink, { boilSeed: b + 2, outline: null, gap: 4, width: 4 });
  }
  if (hat > 0) {
    const h = C.pop(hat * 12, 12);
    g.save(); g.translate(0, -38); g.scale(h, h);
    C.crayonFill(g, [[-26, 0], [26, 0], [26, -20], [-26, -20]], C.COL.white, { boilSeed: b + 3, width: 5, gap: 6 });
    for (const [cx, cy, r] of [[-18, -32, 18], [18, -32, 18], [0, -44, 20]]) C.crayonFill(g, C.ell(cx, cy, r, r, 14), C.COL.white, { boilSeed: b + 4 + cx, width: 5, gap: 6 });
    g.restore();
  }
  g.restore();
}

function lightBall(g, C, x, y, s, col, b) {
  if (s <= 0) return;
  C.crayonFill(g, C.ell(x, y, 26 * s, 26 * s, 16), col, { boilSeed: b, width: 6, gap: 6 });
  g.fillStyle = "rgba(255,255,255,0.85)"; g.beginPath(); g.arc(x - 8 * s, y - 9 * s, 6 * s, 0, 7); g.fill();
}

function heart(g, C, x, y, s, b) {
  if (s <= 0) return;
  const pts = [[x, y + 30 * s], ...C.bezier([x, y + 30 * s], [x - 50 * s, y - 5 * s], [x - 30 * s, y - 40 * s], [x, y - 15 * s], 10).slice(1), ...C.bezier([x, y - 15 * s], [x + 30 * s, y - 40 * s], [x + 50 * s, y - 5 * s], [x, y + 30 * s], 10).slice(1, -1)];
  C.crayonFill(g, pts, C.COL.pink, { boilSeed: b, width: 5, gap: 6 });
}

function drop(g, C, x, y, s, b) {
  const pts = [[x, y - 60 * s], ...C.bezier([x, y - 60 * s], [x + 45 * s, y - 10 * s], [x + 50 * s, y + 40 * s], [x, y + 40 * s]).slice(1), ...C.bezier([x, y + 40 * s], [x - 50 * s, y + 40 * s], [x - 45 * s, y - 10 * s], [x, y - 60 * s]).slice(1, -1)];
  C.crayonFill(g, pts, "#5aa9e6", { boilSeed: b, width: 6 });
}

function swirl(g, C, x, y, s, rot, b) {
  const pts = [];
  for (let k = 0; k <= 22; k++) { const a = rot + k * 0.55, r = (6 + k * 1.9) * s; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); }
  C.crayonStroke(g, pts, "#9fd3f5", 1, b, { width: 10, passes: 2 });
}

function ball(g, C, x, y, f, b) {
  g.save(); g.translate(x, y); g.rotate(f * 0.3);
  C.crayonFill(g, C.ell(0, 0, 36, 36, 20), C.COL.orange, { boilSeed: b, width: 7 });
  C.crayonStroke(g, [[-36, 0], [36, 0]], C.CHARCOAL, 1, b + 1, { width: 5, passes: 1 });
  C.crayonStroke(g, [[0, -36], [0, 36]], C.CHARCOAL, 1, b + 2, { width: 5, passes: 1 });
  g.restore();
}

function eye(g, C, x, y, p, f, b, glow) {
  if (p <= 0) return;
  const s = C.pop(p * 14, 14), bl = C.blink(f, 5);
  g.save(); g.translate(x, y); g.scale(s, s);
  const almond = [...C.bezier([-150, 0], [-80, -95], [80, -95], [150, 0], 16), ...C.bezier([150, 0], [80, 95], [-80, 95], [-150, 0], 16).slice(1, -1)];
  g.save(); g.scale(1, Math.max(0.12, 1 - bl));
  C.crayonFill(g, almond, C.COL.white, { boilSeed: b, width: 8 });
  C.crayonFill(g, C.ell(0, 0, 50, 50, 22), "#6b3e26", { boilSeed: b + 1, width: 6, gap: 7 });
  C.crayonFill(g, C.ell(0, 0, 22, 22, 14), C.CHARCOAL, { boilSeed: b + 2, outline: null, gap: 4 });
  g.fillStyle = "#fff"; g.beginPath(); g.arc(14, -16, 9, 0, 7); g.fill();
  g.restore();
  for (let k = 0; k < 5; k++) { const a = -2.4 + k * 0.4; C.crayonStroke(g, [[Math.cos(a) * 150, Math.sin(a) * 75], [Math.cos(a) * 185, Math.sin(a) * 105]], C.CHARCOAL, 1, b + 3 + k, { width: 8, passes: 2 }); }
  g.restore();
  if (glow) {
    C.drawSparkle(g, x + 170, y - 90, (f % 34), { s: 0.8, color: "#5cb85c", boilSeed: b + 9 });
    C.drawSparkle(g, x - 170, y + 80, ((f + 17) % 34), { s: 0.6, color: "#5cb85c", boilSeed: b + 10 });
  }
}
