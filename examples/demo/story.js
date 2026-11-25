// Demo episode (template for the daily routine). Contract with engine/main.js:
//   export const TOTAL               -> total frames (= meta.json total_frames)
//   export function setup(K)         -> build the world once with K.ground/box/cyl/ball/house/tree/add (crayon textures:
//                                       planks stone grass dirt plaster roofTiles marble water brick metal)
//   export function frame(f, K)      -> { cam: {pos, look, fov, roll}, sky: day|golden|dusk|night|storm,
//                                         actors: [{id, outfit?, x, z, y?, h?, pose, expr, phase, blink, breathe, heading:[dx,dz] | facing:±1}],
//                                         flash?: 0..1, fade?: 0..1 }
// Rules: shots <= 90 frames, never the same angle twice in a row, every hold creeps, walkers use pose "walk" + walkPhase,
// heading = movement direction, idle actors breathe + blink, something in the world always moves.
import { keys, shotAt, walkPhase, blink, breathe, shake, creep, lerp } from "engine/motion.js";

export const TOTAL = 240;
const TWIST = 180;
const SHOTS = [
  { a: 0, b: 80, sky: "day" },      // wide establishing, low angle
  { a: 80, b: 170, sky: "golden" }, // over-shoulder medium, walking
  { a: 170, b: 240, sky: "dusk" },  // twist: push-in with roll
];

let wheel;
export function setup(K) {
  K.ground("grass");
  K.box({ w: 4, h: 0.06, d: 60, kind: "dirt", z: -10 });
  K.house({ x: -6, z: -8, ry: 0.3 });
  K.house({ x: 7, z: -14, w: 7, h: 6, wall: "#f2c48a", roof: "#5a8fc2", ry: -0.4 });
  K.house({ x: -9, z: -24, wall: "#cfe0c3", roof: "#b5573f", wallKind: "brick" });
  for (const [x, z, s] of [[-4, -3, 1], [-3, -18, 1.3], [10, -26, 1.5], [-12, -6, 1.1]]) K.tree({ x, z, s });
  K.cyl({ r: 1.4, h: 0.8, kind: "stone", x: 2.5, z: -2 });           // well
  wheel = K.cyl({ r: 0.9, h: 0.15, kind: "planks", x: 2.5, y: 1.6, z: -2 }); wheel.rotation.x = Math.PI / 2;
}

export function frame(f) {
  const { i, t } = shotAt(SHOTS, f);
  wheel.rotation.y = f * 0.04; // secondary environmental motion
  const walkX = lerp(-4, 3, Math.min(1, f / 200));
  const actors = [
    { id: "worker", x: walkX, z: -1, pose: "walk", phase: walkPhase(f), heading: [1, 0], expr: f > TWIST ? "shock" : "happy", blink: blink(f, 1) },
    { id: "baker", x: 4.5, z: -3, pose: f > TWIST ? "shock" : i === 1 ? "point" : "idle", expr: f > TWIST ? "shock" : "grin", facing: -1, breathe: breathe(f, 2), blink: blink(f, 2) },
    { id: "kid", x: -1.5, z: -5, pose: f > TWIST ? "cheer" : "idle", expr: "smug", facing: 1, breathe: breathe(f, 3), blink: blink(f, 3) },
  ];
  let cam;
  if (i === 0) { const pos = [0, 1.2, 10], look = [0, 2.2, -6]; cam = { pos: creep(pos, look, t), look, fov: 50, roll: 0 }; }
  else if (i === 1) cam = { pos: keys(t, [[0, [-6, 2.4, 4]], [90, [-3.5, 2.2, 3]]]), look: [walkX + 1, 1.3, -2], fov: 40, roll: -2 };
  else { const pos = [5, 1.6, 2], look = [4.5, 1.2, -3]; cam = { pos: creep(pos, look, t, 0.006), look, fov: 34, roll: keys(t, [[0, 0], [20, 4.5]]) }; }
  cam.pos = [cam.pos[0] + shake(f, TWIST), cam.pos[1] + shake(f, TWIST) * 0.5, cam.pos[2]];
  return { cam, sky: SHOTS[i].sky, actors, flash: f >= TWIST && f < TWIST + 3 ? [0.8, 0.4, 0.15][f - TWIST] : 0 };
}
