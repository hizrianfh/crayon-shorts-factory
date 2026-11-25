// Episode: Kenapa langit warnanya biru? — sunlight is a box of crayon colours; tiny air bits bounce blue all over the sky.
import fs from "node:fs";
const PH = JSON.parse(fs.readFileSync(new URL("./work/phrases.json", import.meta.url), "utf8"));
export const TOTAL = PH.total_frames;

const norm = (s) => s.toLowerCase().replace(/[^a-z]/g, "");
// f0 of the n-th word (0-based) starting with `w`
const at = (w, n = 0, d = 0) => (PH.words.filter((x) => norm(x.text).startsWith(w))[n]?.f0 ?? d);

const T_LANGIT = at("langit", 0, 84), T_RAHASIA = at("rahasia", 0, 153), T_SINAR = at("sinar", 0, 199);
const T_KOTAK = at("kotak", 0, 256), T_KRAYON = at("krayon", 0, 266), T_PELANGI = at("pelangi", 0, 372);
const T_MERAH = at("merah", 0, 406), T_KUNING = at("kuning", 0, 438), T_HIJAU = at("hijau", 0, 466), T_BIRU2 = at("biru", 1, 495);
const T_NAH = at("nah", 0, 542), T_UDARA = at("udara", 0, 568), T_BUTIRAN = at("butiran", 0, 603);
const T_SINAR2 = at("sinar", 1, 692), T_NABRAK = at("menabrak", 0, 704), T_MANTUL = at("memantul", 0, 814);
const T_TERPENTAL = at("terpental", 0, 877), T_BOLA = at("bola", 0, 957), T_JADI = at("jadi", 0, 1012);
const T_MENYEBAR = at("menyebar", 0, 1038), T_KEREN = at("keren", 0, 1116);

const TITLES = [[T_LANGIT - 2, "Langit Biru?", "#3a7bd5", 110], [T_KRAYON - 2, "Krayon!", "#ff9f1c", 120], [T_MANTUL - 2, "Mantul!", "#9b6ad6", 120], [T_KEREN - 2, "Keren!", "#5cb85c", 120]];

// air bits (world space). index 9 = D, the bit the blue ray hits
const DOTS = [[200, 540], [330, 620], [470, 520], [620, 600], [760, 480], [960, 720], [180, 760], [300, 860], [440, 700], [560, 740],
  [700, 820], [840, 780], [960, 900], [220, 940], [380, 960], [520, 900], [660, 940], [800, 920], [400, 800], [760, 680], [600, 480], [980, 520]];
const D = DOTS[9];
const SUN = [860, 560];
const SKY = [80, 450, 1000, 1010];
const ZIG = [D, [440, 700], [330, 620], [470, 520], [620, 600], [760, 680], [700, 820], [520, 900], [380, 960], [300, 860], [180, 760]];
const SPREAD = [[D, [200, 540]], [D, [960, 900]], [D, [980, 520]], [D, [220, 940]]];
const CRAYONS = [["#ef4b3f", T_MERAH], ["#ff9f1c", T_MERAH + 14], ["#ffd23f", T_KUNING], ["#5cb85c", T_HIJAU], ["#3a7bd5", T_BIRU2], ["#9b6ad6", T_BIRU2 + 12]];

// rays: direction from the sun down-left toward D
const dir = [D[0] - (SUN[0] - 30), D[1] - (SUN[1] + 50)], dl = Math.hypot(...dir), ux = dir[0] / dl, uy = dir[1] / dl, px = -uy, py = ux;
const rayPts = (off, len) => { const s = [SUN[0] - 30 + px * off, SUN[1] + 50 + py * off]; return [s, [s[0] + ux * len, s[1] + uy * len]]; };

export function frame(g, f, { C, words }) {
  const b = C.boil(f), { COL } = C;
  const cam = C.Camera2D.keys(f, [
    [0, { x: 540, y: 960, zoom: 1 }], [T_RAHASIA - 10, { x: 560, y: 900, zoom: 1.08 }], [T_KOTAK - 6, { x: 660, y: 1000, zoom: 1.15 }],
    [T_KRAYON + 30, { x: 680, y: 980, zoom: 1.32, rot: 1 }], [T_NAH - 30, { x: 680, y: 960, zoom: 1.42, rot: 1 }], [T_UDARA - 10, { x: 600, y: 880, zoom: 1.08 }],
    [T_BUTIRAN - 4, { x: 600, y: 770, zoom: 1.15 }], [T_BUTIRAN + 24, { x: 600, y: 720, zoom: 1.7, rot: -1.5 }], [T_SINAR2 - 14, { x: 620, y: 730, zoom: 1.75, rot: -1.5 }],
    [T_NABRAK, { x: 640, y: 760, zoom: 1.2 }], [T_MANTUL - 20, { x: 620, y: 760, zoom: 1.3 }], [T_MANTUL + 6, { x: 560, y: 740, zoom: 1.65, rot: 1.5 }],
    [T_TERPENTAL - 10, { x: 565, y: 740, zoom: 1.7, rot: 1.5 }], [T_TERPENTAL + 30, { x: 560, y: 800, zoom: 1.15 }], [T_JADI, { x: 550, y: 820, zoom: 1.1 }],
    [T_MENYEBAR + 6, { x: 540, y: 880, zoom: 1.0 }], [TOTAL, { x: 540, y: 900, zoom: 1.07 }]]);
  cam.apply(g);
  C.drawGraphPaper(g);

  // the sky turns blue on "menyebar"
  const skyP = C.smooth(C.clamp((f - T_MENYEBAR + 3) / 45));
  if (skyP > 0) C.crayonFill(g, C.rrect(...SKY, 50), COL.sky, { progress: skyP, boilSeed: b + 70, width: 10, gap: 13 });

  // drifting clouds
  C.drawCloud(g, 250 + Math.sin(f * 0.012) * 40 + f * 0.04, 520, { s: 0.7, boilSeed: b + 3 });
  if (f > T_MENYEBAR + 20) C.drawCloud(g, 720 - (f - T_MENYEBAR) * 0.25, 930, { s: 0.55, boilSeed: b + 4 });

  // ground + sun
  C.crayonStroke(g, [[60, 1180], [400, 1170], [760, 1188], [1040, 1175]], COL.green, C.clamp(f / 20), b, { width: 22 });
  C.drawSun(g, ...SUN, { r: 78, frame: f, boilSeed: b + 1 });

  // hook: big wobbly question mark in the empty sky
  if (f < T_RAHASIA) {
    const q = C.clamp((f - T_LANGIT + 2) / 34);
    g.save(); g.translate(540, 720); g.rotate(Math.sin(f * 0.1) * 0.06); g.translate(-540, -720);
    const qa = [...C.bezier([460, 650], [460, 530], [650, 530], [625, 650]), ...C.bezier([625, 650], [605, 720], [545, 700], [545, 800]).slice(1)];
    C.crayonStroke(g, qa, COL.blue, q, b + 5, { width: 30 });
    if (q >= 1) C.crayonFill(g, C.ell(545, 865, 22, 22, 14), COL.blue, { boilSeed: b + 6, width: 7 });
    g.restore();
  }

  // white sunlight beam toward the crayon box
  if (f >= T_SINAR - 2 && f < T_PELANGI) {
    const ray = [[800, 640], [700, 1000]], rp = C.clamp((f - T_SINAR + 2) / 30);
    C.crayonStroke(g, ray, C.CHARCOAL, rp, b + 8, { width: 40, passes: 2 });
    C.crayonStroke(g, ray, COL.white, rp, b + 9, { width: 28, passes: 2 });
  }

  // rainbow arcs over the box on "pelangi"
  if (f >= T_PELANGI - 2 && f < T_NAH + 20) {
    const rp = C.clamp((f - T_PELANGI + 2) / 34);
    ["#ef4b3f", "#ff9f1c", "#ffd23f", "#5cb85c", "#3a7bd5", "#9b6ad6"].forEach((c, i) => {
      const R = 330 - i * 22, arc = Array.from({ length: 31 }, (_, k) => { const a = Math.PI + (k / 30) * Math.PI; return [680 + Math.cos(a) * R, 1020 + Math.sin(a) * R * 0.85]; });
      C.crayonStroke(g, arc, c, rp, b + 40 + i, { width: 20 });
    });
  }

  // crayons pop up out of the box, one per colour word
  // the box hides while we look at the sky, then pops back for the finale
  const boxS = f < T_NAH ? 1 : f < T_JADI ? 1 - C.smooth(C.clamp((f - T_NAH) / 12)) : C.pop(f - T_JADI, 14);
  if (f >= T_KOTAK - 2 && boxS > 0.01) {
    g.save(); g.translate(680, 1170); g.scale(boxS, boxS); g.translate(-680, -1170);
    CRAYONS.forEach(([c, t0], i) => {
      const t = f - t0 + 2;
      if (t <= 0) return;
      const rise = 150 * C.smooth(C.clamp(t / 12)) + Math.sin(f * 0.15 + i) * 6, x = 590 + i * 36, y = 1040 - rise;
      g.save(); g.translate(x, y); g.rotate(Math.sin(f * 0.08 + i * 1.3) * 0.05);
      C.crayonFill(g, C.rrect(-15, 0, 15, 150, 6), c, { boilSeed: b + 50 + i, width: 6, gap: 7 });
      C.crayonFill(g, [[-15, 2], [0, -36], [15, 2]], c, { boilSeed: b + 56 + i, width: 6, gap: 6 });
      C.crayonStroke(g, [[-15, 40], [15, 40]], C.CHARCOAL, 1, b + 62 + i, { width: 5, passes: 1 });
      g.restore();
    });
    const bp = C.clamp((f - T_KOTAK + 2) / 26);
    C.crayonFill(g, C.rrect(560, 1020, 800, 1170, 16), COL.yellow, { progress: bp, boilSeed: b + 30 });
    C.crayonFill(g, C.rrect(560, 1060, 800, 1110, 4), COL.green, { progress: C.clamp(bp * 2 - 1), boilSeed: b + 31, width: 6 });
    g.restore();
  }

  // tiny air bits pop in on "udara" and drift
  if (f >= T_UDARA - 3) {
    DOTS.forEach(([x, y], i) => {
      const t = f - T_UDARA + 3 - i * 1.4, s = C.pop(t, 10);
      if (s <= 0) return;
      const dx = Math.sin(f * 0.05 + i * 2.1) * 8, dy = Math.cos(f * 0.04 + i * 1.7) * 8;
      const hit = i === 9 && f >= T_NABRAK + 28 && f < T_NABRAK + 40 ? 1.3 : 1;
      C.crayonFill(g, C.ell(x + dx, y + dy, 16 * s * hit, 16 * s * hit, 14), "#e8f6ff", { boilSeed: b + 80 + i, width: 5, gap: 6 });
    });
  }

  // coloured rays: red, yellow, green zip straight through; blue hits a bit and bounces
  if (f >= T_SINAR2 - 2 && f < T_JADI) {
    [["#ef4b3f", 120], ["#ffd23f", 80], ["#5cb85c", 40]].forEach(([c, off], i) => {
      C.crayonStroke(g, rayPts(off, 500), c, C.clamp((f - T_SINAR2 + 2 - i * 4) / 50), b + 90 + i, { width: 16 });
    });
    const bp = C.clamp((f - T_SINAR2 + 2 - 12) / 26);
    C.crayonStroke(g, rayPts(0, dl - 18), "#3a7bd5", bp, b + 94, { width: 18 });
  }
  if (f >= T_NABRAK + 28) C.drawSparkle(g, D[0], D[1] - 40, f - T_NABRAK - 28, { color: COL.sky, boilSeed: b + 95 });
  // bounce burst on "memantul"
  if (f >= T_MANTUL - 2 && f < T_JADI) {
    const bp = C.clamp((f - T_MANTUL + 2) / 14);
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * 2 * Math.PI + 0.3, r0 = 28, r1 = 28 + 80 * bp;
      C.crayonStroke(g, [[D[0] + Math.cos(a) * r0, D[1] + Math.sin(a) * r0], [D[0] + Math.cos(a) * r1, D[1] + Math.sin(a) * r1]], "#3a7bd5", 1, b + 100 + k, { width: 12 });
    }
  }
  // blue bounces around like a bouncy ball
  const blueBall = (x, y, k) => {
    C.crayonFill(g, C.ell(x, y, 26, 26, 16), "#3a7bd5", { boilSeed: b + k, width: 6, gap: 6 });
    g.fillStyle = "#fff"; g.beginPath(); g.arc(x - 8, y - 9, 6, 0, 7); g.fill();
  };
  if (f >= T_TERPENTAL - 3) {
    const zp = C.clamp((f - T_TERPENTAL + 3) / 120);
    C.dottedPath(g, ZIG, zp, "#3a7bd5", b + 110, { gap: 24, r: 6 });
    if (zp < 1) { const [x, y] = C.along(ZIG, C.smooth(zp)); blueBall(x, y - Math.abs(Math.sin(f * 0.35)) * 18, 111); }
  }
  if (f >= T_JADI - 2) {
    SPREAD.forEach((p, i) => {
      const sp = C.clamp((f - T_JADI + 2 - i * 5) / 40);
      C.dottedPath(g, p, sp, "#3a7bd5", b + 120 + i, { gap: 24, r: 6 });
      if (sp > 0 && sp < 1) { const [x, y] = C.along(p, sp); blueBall(x, y, 125 + i); }
    });
  }
  // happy sparkles across the blue sky
  if (f >= T_KEREN) for (let i = 0; i < 5; i++) {
    const t = (f - T_KEREN - i * 8) % 36, sp = [[220, 620], [780, 760], [480, 560], [900, 880], [340, 900]][i];
    if (f - T_KEREN - i * 8 >= 0) C.drawSparkle(g, ...sp, t, { color: i % 2 ? COL.yellow : COL.white, boilSeed: b + 130 + i });
  }

  // screen space: Lala always in the bottom-left corner, then the keyword title
  g.setTransform(1, 0, 0, 1, 0, 0);
  const pose = f < T_RAHASIA ? "wave" : f >= T_KEREN ? "cheer" : "point";
  const expr = f >= T_KEREN ? "laugh" : (f >= T_MANTUL - 2 && f < T_TERPENTAL + 20) || (f >= T_MENYEBAR && f < T_KEREN) ? "wow"
    : f >= T_LANGIT + 20 && f < T_RAHASIA ? "think" : "happy";
  C.drawKidHost(g, 190, 1335, { s: 0.6, pose, expr, talk: C.talkAt(f, words), blink: C.blink(f, 7), breathe: C.breathe(f, 7), frame: f });
  const cur = TITLES.filter(([t]) => f >= t).pop();
  if (cur) C.drawKeywordTitle(g, cur[1], 540, 300, f - cur[0], { color: cur[2], size: cur[3], boilSeed: b });
}
