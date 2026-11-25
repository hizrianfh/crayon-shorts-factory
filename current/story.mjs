// Episode: Kenapa perut bunyi kruyuk? — the tummy squeezes like a nearly-empty sauce bottle; when it's empty,
// the squeeze pushes air + a little water around and it goes "kruyuk!"; food muffles it.
import fs from "node:fs";
const PH = JSON.parse(fs.readFileSync(new URL("./work/words.json", import.meta.url), "utf8"));
export const TOTAL = PH.total_frames;

const norm = (s) => s.toLowerCase().replace(/[^a-z]/g, "");
// f0 of the n-th word (0-based) that starts with `w`
const at = (w, n = 0, d = 0) => (PH.words.filter((x) => norm(x.text).startsWith(w))[n]?.f0 ?? d);

const T_KENAPA = at("kenapa", 0, 70), T_KRUYUK1 = at("kruyuk", 0, 111), T_COBA = at("coba", 0, 156), T_PENCET = at("pencet", 0, 169);
const T_PRUT = at("prut", 0, 267), T_PERUT2 = at("perut", 1, 324), T_MEREMAS = at("meremas", 0, 399), T_MENGADUK = at("mengaduk", 0, 439);
const T_SAAT = at("saat", 0, 488), T_ISINYA = at("isinya", 0, 545), T_UDARA = at("udara", 0, 563), T_AIR = at("air", 0, 598);
const T_DIREMAS = at("diremas", 0, 636), T_TERDORONG = at("terdorong", 0, 685), T_KRUYUK2 = at("kruyuk", 1, 757);
const T_KALAU = at("kalau", 0, 800), T_TEREDAM = at("teredam", 0, 859), T_JADI = at("jadi", 1, 918), T_TANDA = at("tanda", 0, 971);
const T_MAKAN = at("makan", 2, 1000), T_KEREN = at("keren", 0, 1031), T_COBA2 = at("coba", 1, 1076);

const TITLES = [[T_KRUYUK1 - 2, T_PRUT - 2, "Kruyuk?", "#ff9f1c"], [T_PRUT - 2, T_MEREMAS - 2, "Prut!", "#ef4b3f"],
  [T_MEREMAS - 2, T_KRUYUK2 - 4, "Meremas!", "#9b6ad6"], [T_MAKAN - 2, 1e9, "Ayo Makan!", "#5cb85c"]];

const ST = [680, 870]; // stomach centre (world)
const FOOD = [["#ffffff", 0], ["#ff9f1c", 1.3], ["#5cb85c", 2.5], ["#ffd23f", 3.6], ["#ef4b3f", 4.7], ["#ffffff", 5.6]];
const BUBBLES = [[-60, -30, 22], [10, -55, 28], [65, -15, 20], [-15, 10, 16], [40, 30, 14]];
const EXIT = C_bez([ST[0] + 30, ST[1] - 10], [ST[0] + 110, ST[1] + 40], [ST[0] + 140, ST[1] + 110], [ST[0] + 210, ST[1] + 190]);
function C_bez(p0, p1, p2, p3, n = 40) {
  return Array.from({ length: n + 1 }, (_, i) => { const t = i / n, s = 1 - t; return [0, 1].map((k) => s * s * s * p0[k] + 3 * s * s * t * p1[k] + 3 * s * t * t * p2[k] + t * t * t * p3[k]); });
}

// bean-shaped stomach outline; sq = squeeze strength 0..1 (a wave travelling round it)
function stomach(f, sq) {
  const pts = [];
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * 2 * Math.PI;
    let r = 1 - sq * 0.13 * (0.5 + 0.5 * Math.sin(3 * a - f * 0.35));
    let x = 178 * Math.cos(a) * r, y = 132 * Math.sin(a) * r;
    if (y < 0 && x > -40) y += 44 * Math.sin(Math.PI * Math.min(1, (x + 40) / 218)) * (-y / 132); // dent on top-right
    const c = Math.cos(0.32), s = Math.sin(0.32);
    pts.push([ST[0] + x * c - y * s, ST[1] + x * s + y * c]);
  }
  return pts;
}

export function frame(g, f, { C, words }) {
  const b = C.boil(f), { COL } = C;
  const cam = C.Camera2D.keys(f, [
    [0, { x: 540, y: 960, zoom: 1 }], [T_KENAPA - 3, { x: 560, y: 930, zoom: 1.05 }], [T_COBA - 3, { x: 600, y: 940, zoom: 1.1 }],
    [T_PRUT - 3, { x: 660, y: 860, zoom: 1.35, rot: -1.5 }], [T_PRUT + 30, { x: 660, y: 870, zoom: 1.4, rot: -1.5 }], [T_PERUT2 - 3, { x: 600, y: 950, zoom: 1.05 }],
    [T_MEREMAS - 3, { x: 630, y: 930, zoom: 1.2 }], [T_ISINYA, { x: 630, y: 910, zoom: 1.25 }], [T_UDARA - 3, { x: 650, y: 900, zoom: 1.45, rot: 1 }],
    [T_DIREMAS, { x: 660, y: 910, zoom: 1.5, rot: 1 }], [T_KRUYUK2 - 3, { x: 650, y: 930, zoom: 1.3, rot: -2 }], [T_KALAU, { x: 620, y: 950, zoom: 1.12 }],
    [T_JADI, { x: 600, y: 990, zoom: 1.05 }], [T_MAKAN - 3, { x: 620, y: 1000, zoom: 1.12 }], [TOTAL, { x: 615, y: 995, zoom: 1.18 }]]);
  cam.apply(g);
  C.drawGraphPaper(g);

  // drifting background doodles: little clouds + stars so the page is never still
  C.drawCloud(g, 300 + Math.sin(f * 0.013) * 40, 520, { s: 0.55, boilSeed: b + 3 });
  C.drawCloud(g, 930 - Math.sin(f * 0.011) * 30, 610, { s: 0.45, boilSeed: b + 4 });

  // ---- hook: big wobbly question mark + "kruyuk" wiggles
  if (f < T_COBA + 6) {
    const q = C.clamp((f - at("pernah", 0, 0)) / 50), out = 1 - C.clamp((f - T_COBA + 6) / 12);
    g.save(); g.globalAlpha = out; g.translate(680, 820); g.rotate(Math.sin(f * 0.1) * 0.07); g.translate(-680, -820);
    const qa = [...C.bezier([590, 740], [590, 600], [780, 600], [755, 740]), ...C.bezier([755, 740], [735, 810], [680, 790], [680, 890]).slice(1)];
    C.crayonStroke(g, qa, COL.orange, q, b + 5, { width: 34 });
    if (q >= 1) C.crayonFill(g, C.ell(680, 960, 24, 24, 14), COL.orange, { boilSeed: b + 6, width: 7 });
    g.restore();
    if (f >= T_KRUYUK1 - 2) wiggles(g, C, 680, 820, f - T_KRUYUK1 + 2, b, 1, out);
  }

  // ---- analogy: sauce bottle, squeezed on "pencet" and "prut"
  if (f >= T_COBA - 3 && f < T_PERUT2 + 20) {
    const dp = C.clamp((f - T_COBA + 3) / 26), slide = C.smooth(C.clamp((f - T_PERUT2 + 4) / 22)) * 600;
    const squeeze = Math.max(pulse(f - T_PENCET, 20) * 0.5, pulse(f - T_PRUT + 4, 18));
    g.save(); g.translate(720 + slide, 1090); g.scale(1 - squeeze * 0.22, 1 + squeeze * 0.05);
    C.crayonFill(g, C.rrect(-85, -330, 85, 0, 40), COL.red, { progress: dp, boilSeed: b + 10 });
    C.crayonFill(g, C.rrect(-60, -230, 60, -110, 16), COL.cream, { progress: C.clamp(dp * 2 - 1), boilSeed: b + 11, width: 7 });
    C.crayonFill(g, [[-45, -330], [45, -330], [14, -410], [-14, -410]], COL.white, { progress: C.clamp(dp * 2 - 1), boilSeed: b + 12, width: 7 });
    g.restore();
    // squeezing hands on both sides
    if (squeeze > 0.02) for (const sx of [-1, 1]) C.crayonFill(g, C.ell(720 + sx * (95 - squeeze * 22), 940, 30, 40, 14), COL.skin, { boilSeed: b + 13 + sx, width: 7 });
    // "prut!" puff out of the nozzle
    const pt = f - T_PRUT + 2;
    if (pt > 0 && pt < 45) {
      const k = C.clamp(pt / 10), fade = 1 - C.clamp((pt - 25) / 20);
      g.save(); g.globalAlpha = fade;
      for (let i = 0; i < 3; i++) C.crayonFill(g, C.ell(720 + (i - 1) * 46 * k, 640 - 70 * k - i * 25 * k, 30 * k + 6, 26 * k + 6, 14), "#e8f6ff", { boilSeed: b + 20 + i, width: 6, gap: 8 });
      for (const a of [-0.7, 0, 0.7]) C.crayonStroke(g, [[720 + Math.sin(a) * 90, 590 - Math.cos(a) * 90], [720 + Math.sin(a) * (90 + 70 * k), 590 - Math.cos(a) * (90 + 70 * k)]], C.CHARCOAL, 1, b + 24, { width: 10 });
      g.restore();
    }
  }

  // ---- the stomach: draws on at "perut kita", squeezes from "meremas"
  if (f >= T_PERUT2 - 2) {
    const dp = C.clamp((f - T_PERUT2 + 2) / 36);
    const sqBase = f >= T_MEREMAS - 2 ? 0.55 : 0, sqHard = f >= T_DIREMAS - 2 && f < T_KALAU ? 1 : 0;
    const sq = Math.max(sqBase, sqHard) * C.clamp((f - T_MEREMAS + 2) / 10);
    // food pipe in, small tube out
    C.crayonStroke(g, C.bezier([545, 600], [550, 660], [555, 700], [ST[0] - 125, ST[1] - 80]), C.CHARCOAL, dp, b + 30, { width: 46, passes: 2 });
    C.crayonStroke(g, C.bezier([545, 600], [550, 660], [555, 700], [ST[0] - 125, ST[1] - 80]), COL.pink, dp, b + 31, { width: 30, passes: 2 });
    C.crayonStroke(g, EXIT.slice(22), C.CHARCOAL, dp, b + 32, { width: 40, passes: 2 });
    C.crayonStroke(g, EXIT.slice(22), COL.pink, dp, b + 33, { width: 26, passes: 2 });
    const S = stomach(f, sq);
    C.crayonFill(g, S, COL.pink, { progress: dp, boilSeed: b + 34, width: 10, gap: 12 });

    if (dp >= 1) {
      g.save(); g.beginPath(); S.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.clip();
      // what's inside
      const full1 = C.clamp((f - T_MEREMAS + 20) / 14) * (1 - C.clamp((f - T_SAAT) / 20));
      const full2 = C.clamp((f - T_KALAU) / 24);
      const food = Math.max(full1, full2);
      if (food > 0) FOOD.forEach(([c, ph], i) => {
        const a = ph + f * 0.05, rr = 40 + (i % 3) * 18;
        for (let k = 0; k < (full2 > 0 ? 2 : 1); k++) {
          const aa = a + k * 3.1;
          C.crayonFill(g, C.ell(ST[0] + Math.cos(aa) * rr * 1.4, ST[1] + 10 + Math.sin(aa) * rr * 0.75, 20 * food, 15 * food, 12), c, { boilSeed: b + 40 + i + k * 7, width: 5, gap: 6 });
        }
      });
      const empty = C.clamp((f - T_SAAT - 10) / 16) * (1 - C.clamp((f - T_KALAU - 10) / 16));
      if (empty > 0) {
        // a little water at the bottom
        const wp = C.clamp((f - T_AIR + 2) / 20) * empty;
        if (wp > 0) C.crayonFill(g, C.ell(ST[0] - 15, ST[1] + 62, 100, 22 + Math.sin(f * 0.2) * 3, 20), COL.sky, { progress: wp, boilSeed: b + 50, width: 5, gap: 8 });
        // air bubbles: appear on "udara", get pushed out along the tube after "terdorong"
        const bp = C.clamp((f - T_UDARA + 2) / 16) * empty;
        BUBBLES.forEach(([dx, dy, r], i) => {
          const pushT = C.clamp((f - T_TERDORONG + 2 - i * 9) / 40);
          let x = ST[0] + dx + Math.sin(f * 0.12 + i) * 6, y = ST[1] + dy + Math.cos(f * 0.1 + i * 2) * 5;
          if (pushT > 0) { const [px, py] = C.along(EXIT, C.smooth(pushT)); x += (px - x) * C.smooth(Math.min(1, pushT * 1.5)); y += (py - y) * C.smooth(Math.min(1, pushT * 1.5)); }
          if (pushT < 1) C.crayonFill(g, C.ell(x, y, r * bp, r * bp, 14), "#f2fbff", { boilSeed: b + 60 + i, width: 5, gap: 7 });
        });
        if (f >= T_TERDORONG - 2) C.dottedPath(g, EXIT, C.clamp((f - T_TERDORONG + 2) / 30), COL.blue, b + 70, { gap: 22, r: 4 });
      }
      g.restore();
      // cute face on the stomach
      const fx = ST[0] - 30, fy = ST[1] - 40, wow = f >= T_KRUYUK2 - 2 && f < T_KALAU + 10, bl = C.blink(f, 3);
      for (const sx of [-1, 1]) C.crayonFill(g, C.ell(fx + sx * 30, fy, 9 * (wow ? 1.3 : 1), 12 * (wow ? 1.3 : 1) * Math.max(0.15, 1 - bl), 10), C.CHARCOAL, { boilSeed: b + 80 + sx, outline: null, gap: 4 });
      if (wow) C.crayonFill(g, C.ell(fx, fy + 34, 14, 16, 12), "#b8323f", { boilSeed: b + 83, width: 5, gap: 5 });
      else C.crayonStroke(g, [[fx - 22, fy + 26], [fx - 8, fy + 38], [fx + 8, fy + 38], [fx + 22, fy + 26]], C.CHARCOAL, 1, b + 84, { width: 7, passes: 2 });
    }
    // squeeze arrows on "meremas" / "diremas"
    for (const [t0, t1] of [[T_MEREMAS - 2, T_SAAT], [T_DIREMAS - 2, T_KRUYUK2]]) {
      if (f < t0 || f > t1) continue;
      const k = C.clamp((f - t0) / 14), w = Math.sin(f * 0.3) * 10;
      C.crayonStroke(g, [[ST[0] - 260 - w, ST[1]], [ST[0] - 185 - w, ST[1]]], COL.purple, k, b + 90, { width: 14 });
      C.crayonStroke(g, [[ST[0] - 210 - w, ST[1] - 25], [ST[0] - 185 - w, ST[1]], [ST[0] - 210 - w, ST[1] + 25]], COL.purple, k, b + 91, { width: 14 });
      C.crayonStroke(g, [[ST[0] + 260 + w, ST[1] + 60], [ST[0] + 185 + w, ST[1] + 50]], COL.purple, k, b + 92, { width: 14 });
      C.crayonStroke(g, [[ST[0] + 210 + w, ST[1] + 25], [ST[0] + 185 + w, ST[1] + 50], [ST[0] + 208 + w, ST[1] + 77]], COL.purple, k, b + 93, { width: 14 });
    }
    // "kruyuk!" sound wiggles; small and muffled once food is back
    if (f >= T_KRUYUK2 - 2 && f < T_KALAU + 6) wiggles(g, C, ST[0], ST[1], f - T_KRUYUK2 + 2, b, 1.15, 1);
    if (f >= T_TEREDAM - 2 && f < T_JADI) wiggles(g, C, ST[0], ST[1], f - T_TEREDAM + 2, b, 0.55, 0.5);
    if (f >= T_KRUYUK2) C.drawSparkle(g, ST[0] + 190, ST[1] - 150, f - T_KRUYUK2, { boilSeed: b + 95 });
  }

  // ---- "tanda waktunya makan": a plate of rice + egg draws on
  if (f >= T_TANDA - 3) {
    const pp = C.clamp((f - T_TANDA + 3) / 30), x = 720, y = 1210;
    C.crayonFill(g, C.ell(x, y, 150, 48, 30), COL.white, { progress: pp, boilSeed: b + 100, width: 8 });
    C.crayonFill(g, C.ell(x - 30, y - 22, 70, 40, 22), COL.cream, { progress: C.clamp(pp * 2 - 0.6), boilSeed: b + 101, width: 6, gap: 8 });
    C.crayonFill(g, C.ell(x + 60, y - 14, 46, 24, 18), COL.white, { progress: C.clamp(pp * 2 - 1), boilSeed: b + 102, width: 6 });
    C.crayonFill(g, C.ell(x + 60, y - 16, 18, 14, 12), COL.yellow, { progress: C.clamp(pp * 2 - 1), boilSeed: b + 103, width: 5, gap: 5 });
    // steam curls
    if (pp >= 1) for (let i = 0; i < 3; i++) { const ph = (f * 0.04 + i * 0.33) % 1; C.crayonStroke(g, [[x - 60 + i * 50, y - 60 - ph * 60], [x - 70 + i * 50, y - 85 - ph * 60], [x - 55 + i * 50, y - 110 - ph * 60]], "#c9ccd2", 1, b + 104 + i, { width: 8 }); }
  }
  if (f >= T_KEREN) for (const [sx, sy, d] of [[460, 640, 0], [880, 700, 9], [520, 1010, 17], [900, 1060, 26]]) C.drawSparkle(g, sx, sy, (f - T_KEREN - d + 40) % 40, { boilSeed: b + 110 + d });

  // ---- screen space: Lala (always on stage) + keyword titles
  g.setTransform(1, 0, 0, 1, 0, 0);
  C.crayonFill(g, C.ell(215, 1338, 120, 14, 18), "#d8cdb8", { boilSeed: b + 120, outline: null, gap: 6 });
  const pose = f < T_COBA - 3 ? "wave" : f >= T_KEREN - 2 ? "cheer" : "point";
  const expr = f >= T_PRUT - 2 && f < T_PRUT + 30 ? "laugh" : f >= T_KRUYUK2 - 2 && f < T_KALAU ? "wow" : f >= T_SAAT && f < T_UDARA ? "think" : f >= T_KEREN - 2 ? "laugh" : "happy";
  C.drawKidHost(g, 215, 1335, { s: 0.75, pose, expr, talk: C.talkAt(f, words), blink: C.blink(f, 7), breathe: C.breathe(f, 7), frame: f });
  for (const [t0, t1, text, color] of TITLES) if (f >= t0 && f < t1) C.drawKeywordTitle(g, text, 560, 300, f - t0, { color, boilSeed: b, size: 115 });
}

// quick squeeze pulse 0 -> 1 -> 0 over `d` frames
function pulse(t, d) { return t > 0 && t < d ? Math.sin((t / d) * Math.PI) : 0; }

// wobbly sound arcs either side of (x, y)
function wiggles(g, C, x, y, t, b, s, alpha) {
  if (t <= 0) return;
  g.save(); g.globalAlpha = alpha;
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
    const R = (200 + i * 45) * s + Math.sin(t * 0.4 + i) * 6, pts = [];
    for (let k = 0; k <= 10; k++) { const a = -0.55 + (k / 10) * 1.1; pts.push([x + side * Math.cos(a) * R + Math.sin(k * 2 + t * 0.8) * 5, y + Math.sin(a) * R * 0.9]); }
    C.crayonStroke(g, pts, i === 1 ? C.COL.orange : C.CHARCOAL, C.clamp((t - i * 4) / 8), b + 130 + i + side, { width: 11 * Math.min(1, s + 0.2) });
  }
  g.restore();
}
