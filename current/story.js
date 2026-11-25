// 1904 St. Louis Olympic marathon: Fred Lorz rides eleven miles in his manager's car and "wins";
// the real winner, Thomas Hicks, is kept going with brandy, egg whites and strychnine.
// World: dusty country road along +x (z in [-2, 2]) that runs through a brick gate (x = 42) into the stadium
// (finish line x = 70, grandstand behind z = -11..-17).
import { keys, shotAt, walkPhase, blink, breathe, shake, creep, lerp, clamp, prog, smooth } from "engine/motion.js";

export const TOTAL = 1371;
const TWIST = 1243;
const SHOTS = [
  { a: 0, b: 44, sky: "day" },        // 0  wide: car rolls along the road
  { a: 44, b: 110, sky: "day" },      // 1  medium tracking: Lorz waving from the back seat
  { a: 110, b: 178, sky: "day" },     // 2  close: Lorz grinning
  { a: 178, b: 263, sky: "day" },     // 3  high: farmland, runners on the road, windmill
  { a: 263, b: 339, sky: "day" },     // 4  low: the one water stop (well)
  { a: 339, b: 426, sky: "day" },     // 5  medium: Lorz gets cramps, runner passes
  { a: 426, b: 495, sky: "golden" },  // 6  over-shoulder: car pulls up, Lorz walks to it
  { a: 495, b: 585, sky: "golden" },  // 7  wide tracking: car passes runners, Lorz waves
  { a: 585, b: 637, sky: "golden" },  // 8  low: car breaks down, steam, Lorz hops out
  { a: 637, b: 693, sky: "golden" },  // 9  high: Lorz jogs through the stadium gate
  { a: 693, b: 765, sky: "golden" },  // 10 low: breaks the tape, crowd roars
  { a: 765, b: 830, sky: "golden" },  // 11 wide: grandstand cheering, flags
  { a: 830, b: 890, sky: "golden" },  // 12 medium: the President's daughter brings the wreath
  { a: 890, b: 975, sky: "dusk" },    // 13 over-shoulder: official points, Lorz busted
  { a: 975, b: 1055, sky: "dusk" },   // 14 low tracking: Hicks staggers on, trainers' car alongside
  { a: 1055, b: 1135, sky: "dusk" },  // 15 medium: trainer runs beside him with a bottle
  { a: 1135, b: 1197, sky: "dusk" },  // 16 close: Hicks drinks
  { a: 1197, b: 1243, sky: "dusk" },  // 17 high: egg, tin, bottle
  { a: 1243, b: 1310, sky: "storm" }, // 18 TWIST low push-in with roll: Hicks carried over the line
  { a: 1310, b: 1371, sky: "storm" }, // 19 wide: Hicks crowned, Lorz sulks
];

let T, carA, carB, windBlades, bucket, tape, wreath, bottle, egg, tin;
const flags = [], puffs = [], posts = [];

function makeCar(K, body, trim) {
  const { THREE } = K, g = new THREE.Group(), wheels = [];
  const put = (m, x, y, z) => { m.position.set(x, y, z); g.add(m); return m; };
  put(K.box({ w: 3.4, h: 0.5, d: 1.7, kind: "metal", color: body }), 0, 0.45, 0);
  put(K.box({ w: 1.1, h: 0.45, d: 1.3, kind: "metal", color: trim }), 1.1, 0.95, 0);
  put(K.box({ w: 0.25, h: 0.6, d: 1.6, kind: "planks", color: "#7a4a2a" }), -1.55, 0.95, 0);
  put(K.box({ w: 0.25, h: 0.35, d: 1.6, kind: "planks", color: "#7a4a2a" }), -0.15, 0.95, 0);
  for (const s of [-1, 1]) put(K.ball({ r: 0.13, kind: "metal", color: "#f2d36a" }), 1.7, 1.05, s * 0.5);
  const col = put(K.cyl({ r: 0.04, h: 0.6, kind: "metal", color: "#3a3433" }), 0.45, 0.95, -0.35);
  col.rotation.z = 0.5;
  for (const [x, z] of [[1.1, 0.9], [-1.1, 0.9], [1.1, -0.9], [-1.1, -0.9]]) {
    const w = K.cyl({ r: 0.45, h: 0.22, kind: "planks", color: "#e8c13a", seg: 14 });
    w.rotation.x = Math.PI / 2; w.position.set(0, 0, z > 0 ? 0.11 : -0.11);
    const piv = new THREE.Group(); piv.add(w); piv.position.set(x, 0.45, z - (z > 0 ? 0.11 : -0.11)); g.add(piv); wheels.push(piv);
  }
  K.add(g, {});
  return { g, wheels };
}
const placeCar = (c, x, z, dist) => { c.g.position.set(x, 0, z); for (const w of c.wheels) w.rotation.z = -dist / 0.45; };

export function setup(K) {
  T = K.THREE;
  K.ground("grass", { color: "#8cbf5a" });
  K.box({ w: 260, h: 0.05, d: 4, kind: "dirt", color: "#d8b98a", x: -88, z: 0 });        // country road
  K.box({ w: 58, h: 0.04, d: 18, kind: "dirt", color: "#cf9a6a", x: 70, z: 0 });         // stadium track
  K.box({ w: 0.25, h: 0.06, d: 8, kind: "plaster", color: "#fbf4ea", x: 70, z: 0 });      // finish line
  // fence along the far side of the road, with a gap at the well
  for (let x = -110; x < 38; x += 4) if (Math.abs(x + 40) > 4) K.cyl({ r: 0.09, h: 1.1, kind: "planks", color: "#a0703f", x, z: -4.2, seg: 6 });
  for (let x = -110; x < 38; x += 8) if (Math.abs(x + 40) > 6) K.box({ w: 8, h: 0.12, d: 0.08, kind: "planks", color: "#a0703f", x: x + 2, y: 0.8, z: -4.2, line: 0.03 });
  // farm: houses, trees, windmill (all well behind the fence)
  K.house({ x: -30, z: -24, ry: 0.2, wall: "#f2c48a", roof: "#b5573f", wallKind: "planks" });
  K.house({ x: -66, z: -22, w: 7, h: 6, wall: "#efd9b0", roof: "#5a8fc2", ry: -0.3 });
  K.house({ x: 8, z: -26, wall: "#cfe0c3", roof: "#c4583f", wallKind: "brick", ry: 0.1 });
  for (const [x, z, s] of [[-80, -12, 1.4], [-56, -10, 1.2], [-36, -12, 1.5], [-22, -10, 1.1], [-8, -13, 1.6], [4, -11, 1.2], [22, -12, 1.4], [30, -24, 1.8], [-90, 26, 1.6], [-20, 28, 1.8], [20, 30, 1.5]])
    K.tree({ x, z, s, leaf: s > 1.4 ? "#4f8f3c" : "#6bae4a" });
  K.cyl({ r: 0.75, r2: 0.35, h: 7, kind: "planks", color: "#c98a5a", x: -48, z: -16 });
  windBlades = new T.Group();
  for (const a of [0, Math.PI / 2]) { const b = K.box({ w: 6, h: 0.5, d: 0.08, kind: "planks", color: "#f4f1ea", line: 0.04 }); b.position.y = -0.25; const p = new T.Group(); p.rotation.z = a; p.add(b); windBlades.add(p); }
  K.add(windBlades, { x: -48, y: 7, z: -15.4 });
  // the one water stop: a stone well with a swinging bucket
  K.cyl({ r: 1.0, h: 0.9, kind: "stone", color: "#b9b2c4", x: -40, z: -4.6 });
  for (const s of [-1, 1]) K.cyl({ r: 0.08, h: 2.2, kind: "planks", color: "#8a5a35", x: -40 + s * 0.9, z: -4.6, seg: 6 });
  K.box({ w: 2.4, h: 0.12, d: 0.12, kind: "planks", color: "#8a5a35", x: -40, y: 2.2, z: -4.6, line: 0.03 });
  bucket = new T.Group();
  const bk = K.cyl({ r: 0.22, r2: 0.28, h: 0.35, kind: "planks", color: "#c4583f" }); bk.position.y = -1.1; bucket.add(bk);
  K.add(bucket, { x: -40, y: 2.2, z: -4.6 });
  // stadium: brick gate, grandstand steps, back wall, flag poles, finish posts + tape
  for (const s of [-1, 1]) K.box({ w: 1.2, h: 4.5, d: 1.2, kind: "brick", color: "#c4583f", x: 42, z: s * 5.5 });
  K.box({ w: 1.4, h: 0.9, d: 12.2, kind: "brick", color: "#d9735a", x: 42, y: 4.5, z: 0 });
  [[0.6, -11], [1.2, -13], [1.8, -15]].forEach(([h, z]) => K.box({ w: 36, h, d: 2, kind: "planks", color: "#d9a35a", x: 70, z }));
  K.box({ w: 38, h: 4, d: 1, kind: "brick", color: "#b5573f", x: 70, z: -16.6 });
  const fc = ["#e2453c", "#3f7fc4", "#f2b632", "#f4f1ea", "#6bb36b"];
  for (let i = 0; i < 5; i++) {
    const x = 56 + i * 7;
    K.cyl({ r: 0.07, h: 6.5, kind: "metal", color: "#e8c13a", x, z: -16.6, seg: 6 });
    const fl = K.box({ w: 1.5, h: 0.9, d: 0.05, kind: "plaster", color: fc[i], line: 0.03 }); fl.position.x = 0.78;
    const p = new T.Group(); p.add(fl); K.add(p, { x, y: 5.5, z: -16.6 }); flags.push(p);
  }
  for (const s of [-1, 1]) posts.push(K.cyl({ r: 0.08, h: 1.4, kind: "metal", color: "#f4f1ea", x: 70, z: s * 4, seg: 8 }));
  tape = K.box({ w: 0.05, h: 0.07, d: 8, kind: "plaster", color: "#fbf4ea", x: 70, y: 1.1, z: 0, line: 0.02 });
  // cars and props
  carA = makeCar(K, "#e2453c", "#f2b632");
  carB = makeCar(K, "#2f8f6e", "#e8c13a");
  wreath = new T.Mesh(new T.TorusGeometry(0.26, 0.07, 8, 18), K.mat("grass", "#4f8f3c")); K.outline(wreath, 0.02); K.add(wreath, {});
  bottle = K.cyl({ r: 0.1, h: 0.42, kind: "metal", color: "#8a4a2a", seg: 10 });
  egg = K.ball({ r: 0.12, kind: "plaster", color: "#fbf4ea", line: 0.02 });
  tin = K.cyl({ r: 0.13, h: 0.16, kind: "metal", color: "#6bb36b", seg: 12 });
  for (let i = 0; i < 28; i++) { const b = K.ball({ r: 0.28, kind: "plaster", color: "#f4f1ea", line: 0.03 }); b.visible = false; puffs.push(b); }
}

// deterministic puff emitter: src(birthFrame) -> [x,y,z]; vel per frame; `tint` multiplies the plaster texture
let puffN = 0;
function emit(f, src, { every = 4, life = 24, vel = [0, 0.03, 0], size = 1, tint = "#ffffff", max = 7 } = {}) {
  const base = Math.floor(f / every) * every;
  for (let i = 0; i < max && puffN < puffs.length; i++) {
    const birth = base - i * every, age = f - birth;
    if (age >= life || birth < 0) continue;
    const s = src(birth), b = puffs[puffN++], k = age / life;
    b.visible = true;
    b.position.set(s[0] + vel[0] * age + Math.sin(birth * 1.7) * 0.15, s[1] + vel[1] * age, s[2] + vel[2] * age + Math.cos(birth * 2.3) * 0.15);
    const sc = size * (0.4 + Math.sin(Math.min(1, k * 1.3) * Math.PI * 0.5) * 0.8) * (1 - k * k);
    b.scale.setScalar(Math.max(0.01, sc));
    b.material.color.set(tint);
  }
}
const DUST = "#d8b98a";

// actor helpers
const SEEDS = {};
const seedOf = (id) => (SEEDS[id] ??= [...id].reduce((s, c) => s + c.charCodeAt(0), 0) % 17 + 1);
const idle = (id, x, z, f, o = {}) => ({ id, x, z, pose: "idle", expr: "neutral", facing: 1, breathe: breathe(f, seedOf(id)), blink: blink(f, seedOf(id)), ...o });
const mover = (id, x, z, f, speed, dir, o = {}) => ({ id, x, z, pose: speed > 2.6 ? "run" : "walk", phase: walkPhase(f, speed), heading: dir, expr: "neutral", blink: blink(f, seedOf(id)), ...o });

export function frame(f) {
  const { i, t } = shotAt(SHOTS, f);
  puffN = 0;
  for (const p of puffs) p.visible = false;
  // world motion that always runs
  windBlades.rotation.z = -f * 0.05;
  bucket.rotation.z = Math.sin(f * 0.11) * 0.18;
  flags.forEach((p, k) => { p.rotation.y = Math.sin(f * (i >= 18 ? 0.45 : 0.18) + k) * (i >= 18 ? 0.6 : 0.35); });
  tape.visible = !(f >= 712 && f < 1243) && f < 1262;
  wreath.visible = bottle.visible = egg.visible = tin.visible = false;
  bottle.scale.setScalar(1);
  carA.g.visible = carB.g.visible = false;
  for (const p of posts) p.visible = true;

  const actors = [];
  let cam;
  const car = (c, x, z, dist) => { c.g.visible = true; placeCar(c, x, z, dist); };
  const crowd = (cheer = true, from = 0) => {
    const ids = ["fanA", "fanB", "fanC", "fanD"];
    let n = 0;
    for (const [y, z] of [[0.6, -11], [1.2, -13], [1.8, -15]])
      for (let x = 58 + (z === -13 ? 2 : 0); x < 84; x += 4.2, n++) {
        const id = `crowd${n}`;
        actors.push({ id, outfit: ids[(n + from) % 4], x, y, z, h: 1.55, pose: cheer && (n + Math.floor(f / 20)) % 3 ? "cheer" : "idle", expr: cheer ? "grin" : "shock", facing: n % 2 ? 1 : -1, breathe: breathe(f, n + 3), blink: blink(f, n + 5) });
      }
  };

  if (i === 0) { // wide: the car rolls along a sunny country road
    const cx = -20 + f * 0.15;
    car(carA, cx, 0.2, f * 0.15);
    actors.push(idle("manager", cx + 0.25, -0.1, f, { y: 0.3, h: 1.5, expr: "happy" }));
    actors.push(idle("lorz", cx - 1.0, 0.4, f, { y: 0.3, h: 1.5, pose: "cheer", expr: "grin" }));
    actors.push(mover("runA", -10 + f * 0.09, 1.2, f, 2.7, [1, 0], { expr: "worried" }));
    emit(f, (b) => [-20 + b * 0.15 - 1.9, 0.35, 0.2], { vel: [-0.02, 0.02, 0], tint: DUST, size: 1.1 });
    cam = { pos: [cx + 3.2 + t * 0.02, 2.2, 11.5 - t * 0.03], look: [cx + 1.2, 1.0, 0], fov: 50 };
  } else if (i === 1) { // medium tracking alongside the car
    const cx = -20 + f * 0.15;
    car(carA, cx, 0.2, f * 0.15);
    actors.push(idle("manager", cx + 0.25, -0.1, f, { y: 0.3, h: 1.5, expr: "happy" }));
    actors.push(idle("lorz", cx - 1.0, 0.4, f, { y: 0.3, h: 1.5, pose: t % 30 < 15 ? "cheer" : "point", expr: "grin" }));
    emit(f, (b) => [-20 + b * 0.15 - 1.9, 0.35, 0.2], { vel: [-0.02, 0.02, 0], tint: DUST, size: 1.1 });
    cam = { pos: [cx + 0.6 + t * 0.008, 1.7, 6.2 - t * 0.012], look: [cx - 0.3, 1.2, 0], fov: 42, roll: -1.5 };
  } else if (i === 2) { // close: Lorz grinning in the back seat
    const cx = -20 + f * 0.15;
    car(carA, cx, 0.2, f * 0.15);
    actors.push(idle("lorz", cx - 1.0, 0.4, f, { y: 0.3, h: 1.5, pose: "point", expr: t > 30 ? "smug" : "grin" }));
    actors.push(idle("manager", cx + 0.25, -0.1, f, { y: 0.3, h: 1.5, expr: "happy", facing: -1 }));
    emit(f, (b) => [-20 + b * 0.15 - 1.9, 0.35, 0.2], { vel: [-0.02, 0.02, 0], tint: DUST, size: 1.1 });
    const look = [cx - 1.0, 1.25, 0.4];
    cam = { pos: [cx - 0.2 - t * 0.004, 1.45, 3.4 - t * 0.006], look, fov: 34 };
  } else if (i === 3) { // high: the course through farmland, runners in the heat
    const rs = [["runA", -50, 0.8, 2.8], ["runB", -47, -0.9, 2.7], ["runC", -53, -0.4, 2.9], ["lorz", -44, 1.0, 3.0]];
    for (const [id, x0, z, sp] of rs) {
      const x = x0 + t * sp / 30;
      actors.push(mover(id, x, z, f, sp, [1, 0], { expr: "worried" }));
      emit(f, (b) => [x0 + (b - SHOTS[3].a) * sp / 30 - 0.4, 0.15, z], { every: 6, life: 18, vel: [0, 0.01, 0], tint: DUST, size: 0.8, max: 3 });
    }
    const pos = [-40.5, 6.2, 8.2], look = [-45, 0.6, -0.6];
    cam = { pos: creep(pos, look, t, 0.0018), look, fov: 46 };
  } else if (i === 4) { // low: the one water stop
    actors.push(idle("runB", -40.2, -2.8, f, { pose: "think", expr: "happy", facing: -1 }));
    const lx = -46 + t * 0.09;
    actors.push(mover("lorz", lx, 0.8, f, 2.8, [1, 0], { expr: "worried" }));
    actors.push(mover("runC", -48 + t * 0.085, -0.6, f, 2.6, [1, 0], { expr: "sad" }));
    emit(f, (b) => [-46 + (b - SHOTS[4].a) * 0.09 - 0.4, 0.15, 0.8], { every: 5, life: 18, tint: DUST, size: 0.8, max: 4 });
    const pos = [-36.5, 0.55, 5.2], look = [-40.5, 1.7, -2.5];
    cam = { pos: creep(pos, look, t), look, fov: 46, roll: 1 };
  } else if (i === 5) { // medium: cramps at mile nine
    const lx = keys(t, [[0, -25.5], [30, -22.5]]);
    const moving = t < 30;
    actors.push(moving ? mover("lorz", lx, 1.0, f, 2.4, [1, 0], { expr: "worried" }) : idle("lorz", lx, 1.0, f, { pose: "think", expr: t > 55 ? "smug" : "sad", facing: 1 }));
    const rx = -27 + t * 0.09;
    actors.push(mover("runC", rx, -0.7, f, 2.7, [1, 0], { expr: "neutral" }));
    emit(f, (b) => [-27 + (b - SHOTS[5].a) * 0.09 - 0.4, 0.15, -0.7], { every: 5, life: 18, tint: DUST, size: 0.8, max: 4 });
    const pos = [-20.5, 1.7, 6.5], look = [-22.5, 1.2, 0];
    cam = { pos: keys(t, [[0, pos], [87, [-21, 1.6, 5.6]]]), look, fov: 40 };
  } else if (i === 6) { // over-shoulder: the manager's car pulls up
    const cx = keys(t, [[0, -36], [45, -25.6]]);
    car(carA, cx, 0.2, cx);
    actors.push(idle("manager", cx + 0.25, -0.1, f, { y: 0.3, h: 1.5, pose: t > 40 ? "point" : "idle", expr: "smug", facing: 1 }));
    const walk = t > 46;
    actors.push(walk ? mover("lorz", -22.5 - (t - 46) * 0.035, 1.4, f, 1.1, [-1, 0], { expr: "grin" }) : idle("lorz", -22.5, 1.4, f, { expr: t > 30 ? "happy" : "neutral", facing: -1 }));
    if (t < 46) emit(f, (b) => [keys(b - SHOTS[6].a, [[0, -36], [45, -25.6]]) - 1.9, 0.35, 0.2], { vel: [-0.02, 0.02, 0], tint: DUST, size: 1.0 });
    emit(f, () => [cx - 1.9, 0.5, -0.5], { every: 7, life: 28, vel: [-0.005, 0.025, 0], size: 0.5, tint: "#d9d2c4", max: 4 });
    cam = { pos: keys(t, [[0, [-19.8, 2.1, 4.6]], [69, [-20.2, 2.0, 4.2]]]), look: [-24.5, 1.2, 0.2], fov: 44, roll: 1.5 };
  } else if (i === 7) { // wide tracking: riding past the runners
    const cx = -20 + t * 0.2;
    car(carA, cx, 0.2, t * 0.2);
    actors.push(idle("manager", cx + 0.25, -0.1, f, { y: 0.3, h: 1.5, expr: "grin" }));
    actors.push(idle("lorz", cx - 1.0, 0.4, f, { y: 0.3, h: 1.5, pose: t % 24 < 12 ? "cheer" : "point", expr: "grin" }));
    actors.push(mover("runA", -11 + t * 0.085, 1.4, f, 2.6, [1, 0], { expr: t > 40 ? "shock" : "worried" }));
    actors.push(mover("runB", -7 + t * 0.08, -1.1, f, 2.5, [1, 0], { expr: t > 60 ? "shock" : "sad" }));
    emit(f, (b) => [-20 + (b - SHOTS[7].a) * 0.2 - 1.9, 0.35, 0.2], { vel: [-0.02, 0.02, 0], tint: DUST, size: 1.2 });
    cam = { pos: [cx - 1.8 + t * 0.01, 1.9, 8.6], look: [cx + 0.8, 1.0, 0], fov: 46 };
  } else if (i === 8) { // low: the car breaks down, Lorz hops out
    car(carA, 20, 0.2, 20);
    actors.push(idle("manager", 20.25, -0.1, f, { y: 0.3, h: 1.5, pose: "shock", expr: "shock", facing: 1 }));
    if (t < 16) actors.push(idle("lorz", 19.0, 0.4, f, { y: 0.3, h: 1.5, expr: "worried", facing: 1 }));
    else actors.push(mover("lorz", 19.0 + (t - 16) * 0.09, 1.4, f, 2.6, [1, 0], { expr: "smug" }));
    emit(f, () => [21.1, 1.4, 0.2], { every: 3, life: 30, vel: [0.004, 0.04, 0.01], size: 1.3, tint: "#ffffff", max: 10 });
    const pos = [25.8, 0.6, 6.8], look = [21.2, 1.3, 0.5];
    cam = { pos: creep(pos, look, t, 0.003), look, fov: 44, roll: -2 };
  } else if (i === 9) { // high: through the stadium gate
    const lx = 37 + t * 0.15;
    actors.push(mover("lorz", lx, 0.6, f, 2.8, [1, 0], { expr: "grin" }));
    crowd(true, 1);
    emit(f, (b) => [37 + (b - SHOTS[9].a) * 0.15 - 0.4, 0.15, 0.6], { every: 5, life: 18, tint: DUST, size: 0.8, max: 4 });
    cam = { pos: keys(t, [[0, [49.5, 3.9, 5.8]], [56, [48.6, 3.6, 5.4]]]), look: [lx, 1.0, 0.3], fov: 42 };
  } else if (i === 10) { // low: breaking the tape
    const lx = keys(t, [[0, 64.5], [24, 70.6]]);
    actors.push(t < 22 ? mover("lorz", lx, 0.4, f, 2.8, [1, 0], { expr: "grin" }) : idle("lorz", lx, 0.4, f, { pose: "cheer", expr: "grin", facing: -1 }));
    actors.push(idle("official", 73.5, -1.6, f, { pose: t > 30 ? "point" : "idle", expr: "happy", facing: -1 }));
    crowd(true, 2);
    cam = { pos: [lx + 3.0 - t * 0.006, 0.5, 5.3 - t * 0.008], look: [lx + 0.8, 1.6, -0.6], fov: 46, roll: -1 };
  } else if (i === 11) { // wide: the crowd roared
    crowd(true, 0);
    actors.push(idle("lorz", 70.6, 0.4, f, { pose: "cheer", expr: "grin", facing: 1 }));
    actors.push(idle("official", 73.5, -1.6, f, { pose: "cheer", expr: "happy", facing: -1 }));
    const pos = [70, 3.2, 11], look = [70, 2.2, -12];
    cam = { pos: keys(t, [[0, [72.6, 3.0, 11]], [65, [71.9, 2.9, 10.4]]]), look: [70.4, 2.0, -10], fov: 54 };
  } else if (i === 12) { // medium: the President's daughter with the wreath
    const ax = keys(t, [[0, 74], [35, 71.9]]);
    actors.push(t < 35 ? mover("alice", ax, 0.6, f, 1.0, [-1, 0], { expr: "happy" }) : idle("alice", ax, 0.6, f, { expr: "happy", facing: -1, h: 1.6 }));
    actors.at(-1).h = 1.6;
    actors.push(idle("lorz", 70.4, 1.0, f, { pose: "cheer", expr: "grin", facing: 1 }));
    actors.push(idle("official", 73.8, -1.8, f, { pose: "idle", expr: "happy", facing: -1 }));
    wreath.visible = true;
    const wp = keys(t, [[0, [ax - 0.45, 1.35, 0.75]], [35, [71.5, 1.35, 0.75]], [58, [70.9, 2.0, 1.0]]]);
    wreath.position.set(...(t < 35 ? [ax - 0.45, 1.35, 0.75] : wp));
    wreath.rotation.set(0.2, 0.3 + Math.sin(f * 0.1) * 0.1, 0);
    crowd(true, 3);
    cam = { pos: keys(t, [[0, [71.6, 1.75, 6.2]], [60, [71.3, 1.7, 5.4]]]), look: [71.2, 1.3, 0.6], fov: 40 };
  } else if (i === 13) { // over-shoulder from behind the official: busted
    actors.push(idle("official", 73.2, 1.4, f, { pose: "point", expr: t > 20 ? "shock" : "worried", facing: -1 }));
    actors.push(idle("lorz", 70.2, 0.4, f, { pose: t < 30 ? "shock" : "idle", expr: t < 69 ? "shock" : "sad", facing: 1 }));
    actors.push(idle("alice", 71.2, -0.8, f, { pose: "idle", expr: "worried", facing: -1, h: 1.6 }));
    wreath.visible = true;
    const fall = clamp((t - 20) / 14);
    wreath.position.set(71.0 - fall * 0.2, lerp(1.35, 0.08, fall * fall), -0.4);
    wreath.rotation.set(lerp(0.2, Math.PI / 2, fall), 0.3, 0);
    crowd(false, 2);
    cam = { pos: keys(t, [[0, [76.4, 2.2, 6.4]], [85, [76.0, 2.1, 5.8]]]), look: [71.4, 1.2, 0.4], fov: 40, roll: 2 };
  } else if (i >= 14 && i <= 17) { // the real winner: Hicks on the road at dusk, trainers' car alongside
    const hx = -8 + (f - 975) * 0.045;
    const hz = 1.1;
    car(carB, hx - 0.6, -1.25, hx);
    actors.push(idle("trainer1", hx - 0.35, -1.55, f, { y: 0.3, h: 1.5, expr: "worried", facing: 1 }));
    const hicks = mover("hicks", hx, hz, f, 1.35, [1, 0], { expr: i === 16 ? "sad" : "worried" });
    emit(f, (b) => [-8 + (b - 975) * 0.045 - 0.4, 0.12, hz], { every: 7, life: 18, tint: DUST, size: 0.7, max: 3 });
    emit(f, (b) => [-8 + (b - 975) * 0.045 - 2.5, 0.45, -1.55], { every: 7, life: 30, vel: [-0.01, 0.02, 0], size: 0.5, tint: "#d9d2c4", max: 4 });
    if (i === 14) {
      actors.push(hicks);
      actors.push(idle("trainer2", hx - 1.6, -0.95, f, { y: 0.3, h: 1.5, expr: "worried", facing: 1 }));
      cam = { pos: [hx + 3.4 - t * 0.006, 0.5, 4.8], look: [hx - 0.3, 1.3, 0], fov: 44, roll: -1.5 };
    } else if (i === 15) {
      actors.push(hicks);
      actors.push(mover("trainer2", hx - 0.6, hz + 1.1, f, 1.35, [1, 0], { pose: "point", expr: "smug" }));
      bottle.visible = true; bottle.position.set(hx - 0.1, 1.15, hz + 0.9);
      bottle.rotation.z = 0.5 + Math.sin(f * 0.2) * 0.1;
      cam = { pos: [hx + 1.0 + t * 0.006, 1.75, 6.4 - t * 0.01], look: [hx - 0.45, 1.15, 0.8], fov: 40 };
    } else if (i === 16) {
      actors.push({ ...idle("hicks", hx, hz, f, { pose: "think", expr: "sad", facing: -1 }) });
      actors.push(idle("trainer2", hx - 0.7, hz + 0.6, f, { pose: "point", expr: "smug", facing: 1 }));
      bottle.visible = true; bottle.scale.setScalar(0.55); bottle.position.set(hx - 0.2, 1.08 + Math.sin(f * 0.15) * 0.02, hz + 0.12); bottle.rotation.z = 1.0;
      cam = { pos: [hx + 0.35 - t * 0.004, 1.3, hz + 2.9 - t * 0.005], look: [hx - 0.15, 1.15, hz], fov: 34, roll: 1.5 };
    } else {
      actors.push(idle("hicks", hx, hz, f, { pose: "idle", expr: "worried", facing: -1 }));
      actors.push(idle("trainer2", hx - 0.8, hz + 0.5, f, { pose: "point", expr: "smug", facing: 1 }));
      egg.visible = tin.visible = bottle.visible = true;
      egg.position.set(hx - 0.35, 1.2 + Math.sin(f * 0.3) * 0.04, hz + 0.55);
      tin.position.set(hx - 0.6, 1.0, hz + 0.75); tin.rotation.z = Math.sin(f * 0.25) * 0.2;
      bottle.position.set(hx - 0.95, 0.95, hz + 0.6); bottle.rotation.z = 0.3;
      cam = { pos: keys(t, [[0, [hx + 1.2, 4.6, 5.4]], [46, [hx + 0.9, 4.3, 5.0]]]), look: [hx - 0.4, 0.9, 0.7], fov: 38 };
    }
  } else if (i === 18) { // TWIST: Hicks is carried over the line in the storm
    const hx = keys(t, [[0, 67.4], [40, 70.5]]);
    for (const p of posts) p.visible = false;
    tape.visible = false;
    const mv = t < 40;
    actors.push(mv ? mover("hicks", hx, 0.6, f, 1.1, [1, 0], { expr: "sad" }) : idle("hicks", hx, 0.6, f, { pose: "idle", expr: "happy", facing: 1 }));
    actors.push(mv ? mover("trainer1", hx - 0.5, -0.3, f, 1.1, [1, 0], { expr: "worried" }) : idle("trainer1", hx - 0.5, -0.3, f, { pose: "cheer", expr: "grin" }));
    actors.push(mv ? mover("trainer2", hx - 0.4, 1.4, f, 1.1, [1, 0], { expr: "smug" }) : idle("trainer2", hx - 0.4, 1.4, f, { pose: "cheer", expr: "grin" }));
    actors.push(idle("official", 73.6, -1.4, f, { pose: "think", expr: "worried", facing: -1 }));
    crowd(false, 1);
    const pos = keys(t, [[0, [hx + 3.2, 0.6, 6.0]], [66, [hx + 1.8, 0.95, 3.9]]]);
    cam = { pos, look: [hx + 0.2, 1.25, 0.4], fov: 42, roll: keys(t, [[0, 0], [22, 4.5]]) };
  } else { // wide: crowned anyway, Lorz sulks
    for (const p of posts) p.visible = false;
    actors.push(idle("hicks", 70.4, 0.8, f, { pose: "cheer", expr: "grin", facing: 1 }));
    actors.push(idle("alice", 71.6, 0.4, f, { pose: "idle", expr: "happy", facing: -1, h: 1.6 }));
    actors.push(idle("trainer1", 71.0, -1.0, f, { pose: "cheer", expr: "grin", facing: 1 }));
    actors.push(idle("trainer2", 72.6, -0.4, f, { pose: "idle", expr: "smug", facing: -1 }));
    actors.push(idle("lorz", 69.75, 3.0, f, { pose: "idle", expr: "sad", facing: 1 }));
    actors.push(idle("official", 73.4, -1.8, f, { pose: "think", expr: "worried", facing: -1 }));
    wreath.visible = true; wreath.position.set(70.4, 1.52 + Math.sin(f * 0.2) * 0.03, 0.9); wreath.rotation.set(Math.PI / 2 - 0.25, 0, 0);
    crowd(true, 0);
    const pos = [70.8, 2.2, 10.5], look = [70.6, 0.85, -1];
    cam = { pos: creep(pos, look, t, 0.002), look, fov: 50 };
  }

  cam.roll = cam.roll ?? 0;
  cam.pos = [cam.pos[0] + shake(f, TWIST, 0.1), cam.pos[1] + shake(f, TWIST, 0.1) * 0.5, cam.pos[2]];
  const flash = f >= TWIST && f < TWIST + 3 ? [0.85, 0.45, 0.15][f - TWIST] : 0;
  return { cam, sky: SHOTS[i].sky, actors, flash };
}
