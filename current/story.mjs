// Episode: Kenapa bentuk bulan berubah-ubah? — the moon has no light of its own; it reflects sunlight.
// The sun always lights half of it (like a ball next to a lamp). As the moon travels around the earth
// (about four weeks per lap) we see its lit half from different directions: sabit, separuh, purnama.
import fs from "node:fs";
const PH = JSON.parse(fs.readFileSync(new URL("./work/words.json", import.meta.url), "utf8"));
export const TOTAL = PH.total_frames;

const norm = (s) => s.toLowerCase().replace(/[^a-z]/g, "");
// f0 of the n-th word (0-based) that equals `w` exactly (after stripping punctuation)
const at = (w, n = 0, d = 0) => (PH.words.filter((x) => norm(x.text) === w)[n]?.f0 ?? d);

const T_KENAPA = at("kenapa", 0, 61), T_BENTUK = at("bentuk", 0, 101), T_KADANG = at("kadang", 0, 164), T_BULAT = at("bulat", 0, 187);
const T_TIPIS = at("tipis", 0, 244), T_PISANG = at("pisang", 0, 274), T_YUK = at("yuk", 0, 312), T_TAHU = at("tahu", 0, 332);
const T_ITU = at("itu", 0, 376), T_SENDIRI = at("sendiri", 0, 419), T_BULAN2 = at("bulan", 2, 464), T_TERANG0 = at("terang", 0, 486);
const T_MEMANTUL = at("memantulkan", 0, 513), T_MATAHARI0 = at("matahari", 0, 548), T_MATAHARI1 = at("matahari", 1, 597);
const T_MENYINARI = at("menyinari", 0, 640), T_SEPARUH0 = at("separuh", 0, 656), T_SEPARUHNYA = at("separuhnya", 0, 698), T_GELAP = at("gelap", 0, 718);
const T_COBA = at("coba", 0, 754), T_BOLA = at("bola", 0, 781), T_LAMPU0 = at("lampu", 0, 803), T_SISI = at("sisi", 0, 832);
const T_TERANG1 = at("terang", 1, 875), T_NAH = at("nah", 0, 884), T_BULAN4 = at("bulan", 4, 931), T_MENGELILINGI = at("mengelilingi", 0, 970);
const T_BUMI = at("bumi", 0, 989), T_SATU = at("satu", 0, 1011), T_EMPAT = at("empat", 0, 1063), T_SAMBIL = at("sambil", 0, 1103);
const T_MELIHAT = at("melihat", 0, 1157), T_ARAH = at("arah", 0, 1195), T_KALAU0 = at("kalau", 0, 1237), T_SEDIKIT = at("sedikit", 0, 1258);
const T_SABIT = at("sabit", 0, 1319), T_KALAU1 = at("kalau", 1, 1352), T_SETENGAH = at("setengah", 0, 1373), T_SEPARUH1 = at("separuh", 1, 1424);
const T_KALAU2 = at("kalau", 2, 1457), T_MENGHADAP1 = at("menghadap", 1, 1505), T_PURNAMA = at("purnama", 0, 1571);
const T_JADI = at("jadi", 2, 1609), T_BERUBAH1 = at("berubah", 1, 1645), T_CARA = at("cara", 0, 1680), T_KEREN = at("keren", 0, 1713);
const T_NANTI = at("nanti", 0, 1774), T_LIHAT = at("lihat", 0, 1805);

const TITLES = [[T_BENTUK - 2, T_ITU - 2, "Bulan Berubah?", "#ffb703"], [T_MEMANTUL - 2, T_COBA - 2, "Memantul", "#ff9f1c"],
  [T_MENGELILINGI - 2, T_KALAU0 - 2, "Keliling Bumi", "#3a7bd5"], [T_PURNAMA - 2, TOTAL + 1, "Purnama!", "#9b6ad6"]];

// world regions (left -> right; the camera pans between them)
const A = [640, 880], B = [2100, 880], CC = [3500, 880], D = [4900, 880], E = [6300, 880], F = [7700, 880], G = [9100, 880];
const NIGHT = "#2b3a67", MOON_D = "#59607a", MOON_L = "#ffe27a";
const MA = [A[0] + 60, A[1] - 90];
const MB = [B[0] + 170, B[1] - 40], SB = [B[0] - 260, B[1] - 300], EB = [B[0] + 120, B[1] + 230];
const MC = [CC[0] + 90, CC[1] - 60];
const LAMP = [D[0] - 300, D[1] - 120], BALL = [D[0] + 190, D[1] + 40];
const EARTH = [E[0] + 90, E[1] - 30], ORB = 255;
const PH3 = [[F[0] - 175, T_SABIT, 0.18], [F[0] + 40, T_SEPARUH1, 0.5], [F[0] + 255, T_PURNAMA, 1]];
const MG = [G[0] + 70, G[1] - 120];

// camera key helper: put world point (x, y) at screen x ~640 (right of Lala)
const K = (f, x, y, zoom = 1, rot = 0) => [f, { x: x - 100 / zoom, y, zoom, rot }];

// moon angle on its orbit (top-down view); starts on the right, travels counter-clockwise
const orbitAngle = (f) => -0.15 - 2.2 * Math.PI * Math.max(0, f - T_BULAN4 + 6) / Math.max(1, T_KALAU0 + 30 - T_BULAN4);

export function frame(g, f, { C, words }) {
  const b = C.boil(f), { COL } = C;
  const cam = C.Camera2D.keys(f, [
    K(0, A[0], A[1], 1), K(T_BENTUK - 3, A[0], A[1] - 30, 1.06), K(T_BULAT - 3, MA[0] - 40, MA[1] + 40, 1.14, -1), K(T_TIPIS - 3, MA[0] - 20, MA[1] + 60, 1.1),
    K(T_PISANG + 8, MA[0] + 30, MA[1] + 50, 1.18, 1), K(T_YUK - 3, MA[0] + 10, MA[1] + 40, 1.12), K(T_TAHU + 22, MA[0] - 10, MA[1] + 20, 1.6, 2),
    K(T_ITU + 4, B[0], B[1], 1.0), K(T_SENDIRI, B[0] + 40, B[1] - 20, 1.08, -1), K(T_TERANG0 - 3, B[0] + 20, B[1], 1.04), K(T_MEMANTUL + 10, B[0], B[1] - 30, 1.12),
    K(T_MATAHARI0 + 20, B[0] + 30, B[1] + 20, 1.08, 1),
    K(T_MATAHARI1 + 12, CC[0], CC[1], 1.0), K(T_SEPARUH0 - 3, CC[0] + 10, CC[1] - 30, 1.06), K(T_SEPARUH0 + 20, MC[0] - 60, MC[1] + 30, 1.45, -1), K(T_GELAP - 3, MC[0] - 20, MC[1] + 30, 1.5, -1),
    K(T_GELAP + 22, MC[0] + 30, MC[1] + 30, 1.6, 1),
    K(T_BOLA - 3, D[0], D[1], 1.0), K(T_LAMPU0 + 6, D[0] - 40, D[1] - 20, 1.08), K(T_SISI - 3, D[0], D[1], 1.04), K(T_TERANG1 + 4, BALL[0] - 120, BALL[1] + 20, 1.5, 1),
    K(T_BULAN4 - 3, E[0], E[1], 0.96), K(T_MENGELILINGI, E[0], E[1] - 10, 1.0), K(T_SATU - 3, E[0] + 10, E[1] - 20, 1.04, -1), K(T_EMPAT + 10, E[0] + 30, E[1] - 120, 1.1),
    K(T_SAMBIL - 3, E[0], E[1], 1.0), K(T_ARAH + 6, EARTH[0] - 20, EARTH[1], 1.3, 1), K(T_KALAU0 - 6, EARTH[0] - 10, EARTH[1], 1.34, 1),
    K(T_KALAU0 + 16, F[0], F[1], 1.0), K(T_SABIT + 4, F[0] - 20, F[1] - 40, 1.08), K(T_SEPARUH1 + 4, F[0], F[1] - 60, 1.1, -1), K(T_MENGHADAP1, F[0] + 20, F[1] - 50, 1.04),
    K(T_PURNAMA + 14, PH3[2][0] - 20, F[1] - 190, 1.7, 2), K(T_JADI - 4, PH3[2][0] - 20, F[1] - 190, 1.75, 2),
    K(T_JADI + 18, G[0], G[1], 1.0), K(T_CARA, G[0] + 10, G[1] - 30, 1.08), K(T_KEREN, G[0], G[1] - 20, 1.04), K(T_NANTI + 4, G[0], G[1] - 40, 1.1, -1), K(TOTAL, MG[0] - 30, MG[1] + 40, 1.3, 1)]);
  cam.apply(g);
  C.drawGraphPaper(g, { x0: -1200, y0: -800, x1: 10600, y1: 2800 });

  // ================= A: the hook — the moon keeps changing shape =================
  if (f < T_ITU + 16) {
    const [ax, ay] = A;
    nightPanel(g, C, ax, ay, 430, C.clamp(f / 24), f, b + 1);
    // the moon morphs: crescent-ish while asking, full on "bulat penuh", thin on "tipis"
    const illum = f < T_BULAT - 3 ? 0.35 + 0.25 * Math.sin(f * 0.12)
      : f < T_TIPIS - 3 ? 0.6 + 0.4 * C.smooth((f - T_BULAT + 3) / 12)
      : 1 - 0.85 * C.smooth((f - T_TIPIS + 3) / 14);
    const mp = C.clamp((f - 6) / 22);
    moon(g, C, MA[0], MA[1] + Math.sin(f * 0.07) * 6, 150, illum, 1, b + 10, mp);
    // "?" floats next to the moon while asking
    if (f >= T_KENAPA - 2 && f < T_BULAT) {
      const q = C.pop(f - T_KENAPA + 2, 12) * (1 - C.clamp((f - T_BULAT + 8) / 8));
      question(g, C, MA[0] + 240, MA[1] - 170 + Math.sin(f * 0.15) * 10, q, b + 20);
    }
    if (f >= T_BULAT && f < T_BULAT + 24) C.drawSparkle(g, MA[0] + 170, MA[1] - 140, f - T_BULAT, { boilSeed: b + 21 });
    // a banana appears on "pisang"
    if (f >= T_PISANG - 3) {
      const q = C.clamp((f - T_PISANG + 3) / 14), bx = MA[0] + 200, by = MA[1] + 230 + Math.sin(f * 0.1) * 8;
      banana(g, C, bx, by, 1.05, Math.sin(f * 0.08) * 0.1, q, b + 30);
      if (q >= 1 && f < T_PISANG + 34) C.drawSparkle(g, bx + 110, by - 80, f - T_PISANG - 10, { s: 0.7, boilSeed: b + 34 });
    }
  }

  // ================= B: no light of its own — it reflects sunlight =================
  if (f >= T_ITU - 20 && f < T_MATAHARI1 + 30) {
    const [bx, by] = B;
    nightPanel(g, C, bx, by, 430, C.clamp((f - T_ITU + 20) / 20), f, b + 40);
    const lit = C.smooth((f - T_TERANG0 - 14) / 18);
    // sun slides in on "terang"
    if (f >= T_TERANG0 - 6) {
      const q = C.pop(f - T_TERANG0 + 6, 14);
      g.save(); g.translate(SB[0], SB[1]); g.scale(q, q); g.translate(-SB[0], -SB[1]);
      C.drawSun(g, SB[0], SB[1], { r: 80, frame: f, boilSeed: b + 41 });
      g.restore();
    }
    // a light bulb with an X: "nggak punya cahaya sendiri"
    if (f >= T_ITU + 6 && f < T_TERANG0 + 4) {
      const q = C.clamp((f - T_ITU - 6) / 14) * (1 - C.clamp((f - T_TERANG0 + 6) / 10)), x = MB[0] - 230, y = MB[1] - 260;
      bulb(g, C, x, y, q, b + 45);
      const r = C.clamp((f - T_SENDIRI) / 10) * (q > 0.95 ? 1 : 0);
      C.crayonStroke(g, [[x - 60, y - 70], [x + 60, y + 70]], COL.red, r, b + 46, { width: 16 });
      C.crayonStroke(g, [[x + 60, y - 70], [x - 60, y + 70]], COL.red, C.clamp(r * 2 - 1), b + 47, { width: 16 });
    }
    // sun rays travel to the moon, then bounce down to the earth
    if (f >= T_MEMANTUL - 14) for (let k = 0; k < 3; k++) {
      const t = ((f - T_MEMANTUL + 14 + k * 16) % 48) / 48;
      const path = [[SB[0] + 70, SB[1] + 50], [MB[0] - 110, MB[1] - 40 + k * 30], [EB[0] - 20, EB[1] - 70]];
      const u = C.clamp((f - T_MEMANTUL + 14) / 30);
      C.dottedPath(g, path, u, COL.orange, b + 50 + k, { gap: 26, r: 5 });
      if (u >= 1) { const [x, y] = C.along(path, t); lightDot(g, C, x, y, 1, b + 55 + k); }
    }
    moon(g, C, MB[0], MB[1] + Math.sin(f * 0.06) * 6, 135, 0.82 * lit, -1, b + 60, C.clamp((f - T_ITU + 10) / 20), lit > 0.9);
    if (f >= T_MEMANTUL - 14) earth(g, C, EB[0], EB[1], 70, C.clamp((f - T_MEMANTUL + 14) / 16), f, b + 70);
    if (f >= T_MATAHARI0 && f < T_MATAHARI0 + 24) C.drawSparkle(g, MB[0] + 150, MB[1] - 140, f - T_MATAHARI0, { boilSeed: b + 75 });
  }

  // ================= C: the sun always lights half of the moon =================
  if (f >= T_MATAHARI1 - 10 && f < T_GELAP + 50) {
    const [cx, cy] = CC;
    nightPanel(g, C, cx, cy, 430, C.clamp((f - T_MATAHARI1 + 10) / 20), f, b + 80);
    const sx = cx - 330, sy = cy - 330;
    C.drawSun(g, sx, sy, { r: 75, frame: f, boilSeed: b + 81 });
    // rays from the left
    if (f >= T_MENYINARI - 6) for (let k = 0; k < 4; k++) {
      const y = MC[1] - 180 + k * 120, q = C.clamp((f - T_MENYINARI + 6 - k * 3) / 14), wob = Math.sin(f * 0.2 + k) * 8;
      C.crayonStroke(g, [[cx - 400, y + wob * 0.3], [MC[0] - 300, y]], COL.orange, q, b + 82 + k, { width: 12, passes: 2 });
      C.crayonStroke(g, [[MC[0] - 330, y - 18], [MC[0] - 300, y], [MC[0] - 330, y + 18]], COL.orange, q, b + 86 + k, { width: 10, passes: 2 });
    }
    const half = 0.5 * C.smooth((f - T_SEPARUH0 + 3) / 16);
    moon(g, C, MC[0], MC[1] + Math.sin(f * 0.05) * 5, 230, half, -1, b + 90, C.clamp((f - T_MATAHARI1 + 6) / 18), false);
    if (f >= T_SEPARUH0 + 12 && f < T_SEPARUHNYA) C.drawSparkle(g, MC[0] - 200, MC[1] - 200, (f - T_SEPARUH0 - 12) % 30, { boilSeed: b + 95 });
    // "gelap": sleepy zzz on the dark side
    if (f >= T_GELAP - 3) for (let k = 0; k < 3; k++) {
      const t = ((f - T_GELAP + 3 + k * 12) % 36) / 36, x = MC[0] + 140 + t * 90 + k * 10, y = MC[1] - 120 - t * 150;
      zed(g, C, x, y, (0.6 + 0.3 * k) * Math.sin(Math.PI * t), b + 96 + k);
    }
  }

  // ================= D: a ball next to a lamp =================
  if (f >= T_GELAP + 20 && f < T_NAH + 60) {
    const [dx, dy] = D, p = C.clamp((f - T_COBA + 8) / 20);
    // table
    C.crayonFill(g, C.rrect(dx - 460, dy + 200, dx + 460, dy + 250, 12), "#c98b55", { progress: p, boilSeed: b + 100, width: 8 });
    for (const s of [-1, 1]) C.crayonStroke(g, [[dx + s * 400, dy + 250], [dx + s * 400, dy + 330]], "#8a5a3b", p, b + 101 + s, { width: 22 });
    // lamp draws on "lampu"
    const lp = C.clamp((f - T_LAMPU0 + 10) / 18), on = C.smooth((f - T_LAMPU0 + 2) / 10);
    if (lp > 0) lamp(g, C, LAMP[0], LAMP[1], lp, on, f, b + 105);
    // ball draws on "bola"; the side facing the lamp lights up
    const bp = C.clamp((f - T_BOLA + 3) / 14), bl = C.smooth((f - T_TERANG1 + 30) / 18);
    if (bp > 0) {
      const bob = f < T_TERANG1 ? Math.abs(Math.sin((f - T_BOLA) * 0.18)) * -22 : 0;
      moon(g, C, BALL[0], BALL[1] + bob, 130, 0.5 * bl, -1, b + 120, bp, false, "#e45a8f", "#ffd6e5");
      C.crayonFill(g, C.ell(BALL[0], dy + 196, 110, 12, 18), "#a36a3d", { boilSeed: b + 125, outline: null, gap: 6, width: 5 });
    }
    if (f >= T_TERANG1 - 2 && f < T_TERANG1 + 26) C.drawSparkle(g, BALL[0] - 150, BALL[1] - 130, f - T_TERANG1 + 2, { boilSeed: b + 126 });
  }

  // ================= E: the moon travels around the earth =================
  if (f >= T_NAH + 20 && f < T_KALAU0 + 50) {
    const [ex, ey] = E;
    nightPanel(g, C, ex, ey, 440, C.clamp((f - T_NAH - 20) / 20), f, b + 140);
    // sunlight from the left
    for (let k = 0; k < 3; k++) {
      const y = ey - 330 + k * 100, q = C.clamp((f - T_NAH - 26 - k * 3) / 14), x0 = ex - 330, w = Math.sin(f * 0.15 + k) * 10;
      C.crayonStroke(g, [[x0, y], [x0 + 110 + w, y]], COL.yellow, q, b + 141 + k, { width: 12, passes: 2 });
      C.crayonStroke(g, [[x0 + 85 + w, y - 16], [x0 + 110 + w, y], [x0 + 85 + w, y + 16]], COL.yellow, q, b + 144 + k, { width: 10, passes: 2 });
    }
    // dotted orbit on "mengelilingi"
    const orbit = C.ell(EARTH[0], EARTH[1], ORB, ORB, 64).concat([[EARTH[0] + ORB, EARTH[1]]]);
    C.dottedPath(g, orbit, C.clamp((f - T_MENGELILINGI + 3) / 30), "#c9d3ff", b + 150, { gap: 30, r: 5 });
    earth(g, C, EARTH[0], EARTH[1], 85, C.clamp((f - T_NAH - 20) / 16), f, b + 155);
    // four little calendar pages on "empat minggu"
    if (f >= T_EMPAT - 3) for (let k = 0; k < 4; k++) {
      const q = C.pop(f - T_EMPAT + 3 - k * 4, 12), x = ex - 60 + k * 100, y = ey - 410 + Math.sin(f * 0.1 + k) * 4;
      calendar(g, C, x, y, q, b + 160 + k);
    }
    // the moon on its orbit, lit half always toward the sun
    const a = orbitAngle(f), mx = EARTH[0] + Math.cos(a) * ORB, my = EARTH[1] + Math.sin(a) * ORB;
    // line of sight from the earth on "melihat"
    if (f >= T_MELIHAT - 3) {
      const ux = Math.cos(a), uy = Math.sin(a), q = C.clamp((f - T_MELIHAT + 3) / 12);
      C.dottedPath(g, [[EARTH[0] + ux * 95, EARTH[1] + uy * 95], [mx - ux * 65, my - uy * 65]], q, COL.white, b + 170, { gap: 22, r: 4 });
    }
    moon(g, C, mx, my, 58, 0.5, -1, b + 175, C.clamp((f - T_BULAN4 + 6) / 14), false);
    if (f >= T_ARAH - 2 && f < T_ARAH + 24) C.drawSparkle(g, mx + 70, my - 70, f - T_ARAH + 2, { s: 0.7, boilSeed: b + 180 });
  }

  // ================= F: what we see — sabit, separuh, purnama =================
  if (f >= T_KALAU0 - 6 && f < T_JADI + 40) {
    const [fx, fy] = F;
    nightPanel(g, C, fx, fy, 440, C.clamp((f - T_KALAU0 + 6) / 18), f, b + 200);
    PH3.forEach(([x, t0, il], k) => {
      const y = fy - 190 + Math.sin(f * 0.06 + k) * 6;
      // dotted hint of the whole ball first
      const hint = C.clamp((f - T_KALAU0 - k * 4) / 16);
      if (f < t0 - 3) C.dottedPath(g, C.ell(x, y, 95, 95, 40).concat([[x + 95, y]]), hint, "#dfe4ff", b + 205 + k, { gap: 22, r: 4 });
      else {
        moon(g, C, x, y, 95, il * C.smooth((f - t0 + 3) / 12), 1, b + 210 + k * 3, C.clamp((f - t0 + 3) / 10), il > 0.9 && f >= t0 + 12);
        if (f < t0 + 26) C.drawSparkle(g, x + 110, y - 110, f - t0, { s: 0.7, boilSeed: b + 220 + k });
      }
    });
    // a little kid on the ground looking up
    const gp = C.clamp((f - T_KALAU0) / 20);
    C.crayonStroke(g, [[fx - 420, fy + 220], [fx - 100, fy + 205], [fx + 200, fy + 225], [fx + 420, fy + 212]], COL.green, gp, b + 230, { width: 20 });
    if (f >= T_PURNAMA) for (const [sx, sy, d] of [[160, -260, 0], [330, -40, 9], [120, 40, 18], [360, -250, 27]]) C.drawSparkle(g, fx + sx, fy + sy, (f - T_PURNAMA - d + 36) % 36, { s: 0.6, boilSeed: b + 235 + d });
  }

  // ================= G: the moon never changes — only how we see it =================
  if (f >= T_JADI + 4) {
    const [gx, gy] = G, p = C.clamp((f - T_JADI - 4) / 18);
    nightPanel(g, C, gx, gy, 440, p, f, b + 300);
    // window frame on "nanti malam"
    if (f >= T_NANTI - 3) {
      const q = C.clamp((f - T_NANTI + 3) / 18), x0 = gx - 330, x1 = gx + 470, y0 = gy - 430, y1 = gy + 220;
      C.crayonStroke(g, [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]], "#a36a3d", q, b + 301, { width: 26 });
      C.crayonStroke(g, [[(x0 + x1) / 2, y0], [(x0 + x1) / 2, y1]], "#a36a3d", C.clamp(q * 2 - 1), b + 302, { width: 18 });
      C.crayonStroke(g, [[x0, (y0 + y1) / 2], [x1, (y0 + y1) / 2]], "#a36a3d", C.clamp(q * 2 - 1), b + 303, { width: 18 });
    }
    // dashed outline = the whole ball is always there
    const ring = C.clamp((f - T_BERUBAH1 + 3) / 20);
    // the lit part cycles through phases ("cuma cara kita melihatnya"), then settles on a smiling crescent
    const cyc = f < T_CARA - 3 ? 1 : f < T_KEREN - 2 ? 0.5 + 0.5 * Math.cos((f - T_CARA + 3) * 0.12) : 0.3 + 0.7 * C.smooth((T_KEREN + 10 - f) / 12);
    moon(g, C, MG[0], MG[1] + Math.sin(f * 0.06) * 8, 190, cyc, 1, b + 310, p, f >= T_KEREN - 2);
    if (ring > 0) C.dottedPath(g, C.ell(MG[0], MG[1] + Math.sin(f * 0.06) * 8, 206, 206, 48).concat([[MG[0] + 206, MG[1]]]), ring, COL.white, b + 315, { gap: 24, r: 5 });
    if (f >= T_KEREN - 2) for (const [sx, sy, d] of [[-260, -250, 0], [280, -280, 10], [-280, 140, 20], [300, 160, 30]]) C.drawSparkle(g, MG[0] + sx, MG[1] + sy, (f - T_KEREN - d + 40) % 40, { boilSeed: b + 320 + d });
  }

  // ================= screen space: Lala + keyword titles =================
  g.setTransform(1, 0, 0, 1, 0, 0);
  C.crayonFill(g, C.ell(200, 1338, 120, 14, 18), "#d8cdb8", { boilSeed: b + 500, outline: null, gap: 6 });
  const pose = f < T_KADANG - 3 ? "wave" : f >= T_KEREN - 2 ? "cheer" : "point";
  const expr = f >= T_KEREN - 2 ? "laugh"
    : (f >= T_PISANG - 2 && f < T_YUK) || (f >= T_GELAP - 2 && f < T_COBA) ? "laugh"
    : (f >= T_BULAT - 2 && f < T_TIPIS) || (f >= T_TERANG0 + 10 && f < T_MATAHARI0 + 20) || (f >= T_TERANG1 - 2 && f < T_NAH + 20) || (f >= T_PURNAMA - 2 && f < T_JADI) ? "wow"
    : (f >= T_KENAPA - 2 && f < T_KADANG) || (f >= T_ITU && f < T_SENDIRI + 20) || (f >= T_KALAU0 - 2 && f < T_SEDIKIT + 10) ? "think" : "happy";
  C.drawKidHost(g, 200, 1335, { s: 0.72, pose, expr, talk: C.talkAt(f, words), blink: C.blink(f, 7), breathe: C.breathe(f, 7), frame: f });
  for (const [t0, t1, text, color] of TITLES) if (f >= t0 && f < t1) C.drawKeywordTitle(g, text, 560, 300, f - t0, { color, boilSeed: b, size: 96 });
}

// dark-blue crayon night sky with twinkling stars; (x, y) = centre, w = half width
function nightPanel(g, C, x, y, w, p, f, b) {
  if (p <= 0) return;
  C.crayonFill(g, C.rrect(x - w, y - 480, x + w, y + 300, 46), "#2b3a67", { progress: p, boilSeed: b, gap: 13, width: 10 });
  if (p < 1) return;
  const stars = [[-330, -420], [-150, -330], [260, -430], [360, -230], [-370, -120], [330, 120], [-250, 200], [120, 250], [-60, -440], [390, 250]];
  stars.forEach(([sx, sy], k) => {
    const tw = 0.6 + 0.4 * Math.sin(f * 0.12 + k * 1.7), r = 7 * tw;
    C.crayonFill(g, C.ell(x + sx, y + sy, r, r, 10), "#fff3b0", { boilSeed: b + 1 + k, outline: null, gap: 4, width: 4 });
  });
}

// moon (or ball) seen with fraction `illum` lit; side = +1 lit on the right, -1 lit on the left
function moon(g, C, x, y, r, illum, side, b, p = 1, face = false, dark = "#59607a", light = "#ffe27a") {
  if (p <= 0) return;
  C.crayonFill(g, C.ell(x, y, r, r, 40), dark, { progress: p, boilSeed: b, width: 9 });
  if (p < 1) return;
  const il = C.clamp(illum);
  if (il > 0.02) {
    const k = 1 - 2 * il, pts = [];
    for (let i = 0; i <= 24; i++) { const a = -Math.PI / 2 + (i / 24) * Math.PI; pts.push([x + side * r * Math.cos(a), y + r * Math.sin(a)]); }
    for (let i = 23; i >= 1; i--) { const a = -Math.PI / 2 + (i / 24) * Math.PI; pts.push([x + side * k * r * Math.cos(a), y + r * Math.sin(a)]); }
    C.crayonFill(g, pts, light, { boilSeed: b + 1, width: 8, outline: null, gap: 9 });
    C.crayonStroke(g, C.ell(x, y, r, r, 40), C.CHARCOAL, 1, b + 2, { width: 9, close: true, passes: 2 });
  }
  // craters
  if (light === "#ffe27a") for (const [cx, cy, cr] of [[-0.35, -0.3, 0.16], [0.3, 0.25, 0.2], [0.05, 0.55, 0.11]]) C.crayonStroke(g, C.ell(x + cx * r, y + cy * r, cr * r, cr * r, 14), "rgba(120,110,90,0.55)", 1, b + 3 + cx * 10, { width: Math.max(4, r * 0.04), close: true, passes: 1 });
  if (face) {
    const s = r / 100;
    for (const sx of [-1, 1]) { g.fillStyle = C.CHARCOAL; g.beginPath(); g.ellipse(x + sx * 32 * s, y - 10 * s, 7 * s, 10 * s, 0, 0, 7); g.fill(); }
    C.crayonStroke(g, [[x - 30 * s, y + 25 * s], [x, y + 45 * s], [x + 30 * s, y + 25 * s]], C.CHARCOAL, 1, b + 8, { width: 7 * s, passes: 2 });
    for (const sx of [-1, 1]) C.crayonFill(g, C.ell(x + sx * 58 * s, y + 18 * s, 14 * s, 9 * s, 10), C.COL.pink, { boilSeed: b + 9, outline: null, gap: 4, width: 4 });
  }
}

function earth(g, C, x, y, r, p, f, b) {
  if (p <= 0) return;
  const k = C.pop(p * 12, 12);
  g.save(); g.translate(x, y); g.scale(k, k); g.rotate(f * 0.01);
  C.crayonFill(g, C.ell(0, 0, r, r, 30), "#3a7bd5", { boilSeed: b, width: 8 });
  for (const [cx, cy, rx, ry] of [[-0.3, -0.25, 0.35, 0.25], [0.35, 0.2, 0.3, 0.35], [-0.2, 0.45, 0.22, 0.15]]) C.crayonFill(g, C.ell(cx * r, cy * r, rx * r, ry * r, 16), "#5cb85c", { boilSeed: b + 1 + cx * 10, outline: null, gap: 6, width: 5 });
  g.restore();
}

function banana(g, C, x, y, s, rot, p, b) {
  if (p <= 0) return;
  g.save(); g.translate(x, y); g.rotate(rot - 0.3); g.scale(s, s);
  const outer = C.bezier([-110, -30], [-70, 70], [70, 70], [110, -30], 18), inner = C.bezier([110, -30], [50, 25], [-50, 25], [-110, -30], 18);
  C.crayonFill(g, outer.concat(inner.slice(1, -1)), "#ffd23f", { progress: p, boilSeed: b, width: 7 });
  C.crayonStroke(g, [[-110, -30], [-125, -45]], "#6b3e26", p, b + 1, { width: 12 });
  g.restore();
}

function question(g, C, x, y, s, b) {
  if (s <= 0) return;
  g.save(); g.translate(x, y); g.scale(s, s);
  C.crayonStroke(g, [[-40, -40], [-30, -80], [10, -95], [45, -70], [40, -30], [5, -5], [0, 30]], C.COL.white, 1, b, { width: 22 });
  C.crayonFill(g, C.ell(0, 75, 14, 14, 12), C.COL.white, { boilSeed: b + 1, outline: null, gap: 5 });
  g.restore();
}

function bulb(g, C, x, y, s, b) {
  if (s <= 0) return;
  g.save(); g.translate(x, y); g.scale(s, s);
  C.crayonFill(g, C.ell(0, -15, 50, 55, 22), "#fff3b0", { boilSeed: b, width: 7 });
  C.crayonFill(g, C.rrect(-24, 38, 24, 75, 6), "#9aa0ad", { boilSeed: b + 1, width: 6 });
  g.restore();
}

function lightDot(g, C, x, y, s, b) {
  C.crayonFill(g, C.ell(x, y, 15 * s, 15 * s, 12), "#ffd23f", { boilSeed: b, width: 5, gap: 5 });
}

function zed(g, C, x, y, s, b) {
  if (s <= 0.05) return;
  g.save(); g.translate(x, y); g.scale(s, s);
  C.crayonStroke(g, [[-20, -20], [20, -20], [-20, 20], [20, 20]], "#c9d3ff", 1, b, { width: 9, passes: 2 });
  g.restore();
}

// desk lamp at (x, y) = shade centre, pointing right; `on` 0..1 lights the cone
function lamp(g, C, x, y, p, on, f, b) {
  const base = [x - 60, y + 320];
  C.crayonFill(g, C.rrect(base[0] - 90, base[1] - 10, base[0] + 90, base[1] + 30, 14), "#3a7bd5", { progress: p, boilSeed: b, width: 8 });
  C.crayonStroke(g, [[base[0], base[1] - 10], [x - 120, y + 120], [x - 30, y + 10]], C.CHARCOAL, p, b + 1, { width: 18 });
  if (on > 0) {
    const g0 = 0.25 + 0.75 * on, w = Math.sin(f * 0.1) * 6;
    C.crayonFill(g, [[x + 70, y - 50], [x + 600, y - 230 - w], [x + 600, y + 330 + w], [x + 70, y + 80]], "#fff3b0", { boilSeed: b + 2, outline: null, gap: 16 - 6 * g0, width: 7 });
  }
  g.save(); g.translate(x, y); g.rotate(0.12);
  C.crayonFill(g, [[-70, -70], [30, -80], [100, -10], [100, 50], [30, 110], [-70, 70]], "#ef4b3f", { progress: p, boilSeed: b + 3 });
  if (on > 0) C.crayonFill(g, C.ell(100, 20, 22, 40, 16), "#ffd23f", { boilSeed: b + 4, width: 6, gap: 6 });
  g.restore();
}

function calendar(g, C, x, y, s, b) {
  if (s <= 0) return;
  g.save(); g.translate(x, y); g.scale(s, s);
  C.crayonFill(g, C.rrect(-40, -35, 40, 40, 8), C.COL.white, { boilSeed: b, width: 6, gap: 7 });
  C.crayonFill(g, C.rrect(-40, -35, 40, -12, 6), C.COL.red, { boilSeed: b + 1, width: 5, gap: 5 });
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) C.crayonFill(g, C.ell(-22 + i * 22, 4 + j * 18, 4, 4, 8), "#9aa0ad", { boilSeed: b + 2 + i + j, outline: null, gap: 3, width: 3 });
  g.restore();
}
