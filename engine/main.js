// Crayon engine: builds the world from <ep>/story.js setup(K), poses it per frame from frame(f, K),
// draws characters from <ep>/cast.js OUTFITS as camera-facing crayon cards, composites paper grain,
// and exposes window.renderFrame(f) -> JPEG data URL for render.mjs.
import * as THREE from "three";
import { surfaceCanvas, paintSky, SKIES } from "./paint.js";
import { drawCharacter, paperGrainOverlay, CHARCOAL } from "./crayon.js";

const q = new URLSearchParams(location.search);
const EP = q.get("ep") || "/current";
const SCALE = Number(q.get("scale") || 1);
const W = Math.round(1080 * SCALE), H = Math.round(1920 * SCALE);

const { OUTFITS } = await import(`${EP}/cast.js`);
const story = await import(`${EP}/story.js`);

const gl = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
gl.setPixelRatio(1); gl.setSize(W, H, false);
gl.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 800);
const hemi = new THREE.HemisphereLight(0xffffff, 0xb9a58a, 1);
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(-30, 50, 25);
scene.add(hemi, sun);
scene.fog = new THREE.Fog(0xefe4cf, 40, 260);

const skyCanvas = new OffscreenCanvas(Math.round(W / 2), Math.round(H / 2));
const skyTex = new THREE.CanvasTexture(skyCanvas);
skyTex.colorSpace = THREE.SRGBColorSpace;
scene.background = skyTex;

// ---------- kit: crayon-textured primitives with thick charcoal hull outlines ----------
const texCache = new Map();
const tex = (kind, color, rep = 1) => {
  const k = `${kind}|${color}|${rep}`;
  if (!texCache.has(k)) {
    const t = new THREE.CanvasTexture(surfaceCanvas(kind, color));
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    texCache.set(k, t);
  }
  return texCache.get(k);
};
const outlineMat = new THREE.MeshBasicMaterial({ color: CHARCOAL, side: THREE.BackSide, fog: false });
const mat = (kind = "plaster", color, rep = 1) => new THREE.MeshLambertMaterial({ map: tex(kind, color, rep) });
/** add a back-face hull `t` metres thicker on every axis = crayon outline */
const outline = (mesh, t = 0.05) => {
  mesh.geometry.computeBoundingBox();
  const s = new THREE.Vector3(), c = new THREE.Vector3();
  mesh.geometry.boundingBox.getSize(s); mesh.geometry.boundingBox.getCenter(c);
  const hull = new THREE.Mesh(mesh.geometry, outlineMat);
  hull.scale.set((s.x + 2 * t) / Math.max(s.x, 1e-3), (s.y + 2 * t) / Math.max(s.y, 1e-3), (s.z + 2 * t) / Math.max(s.z, 1e-3));
  hull.position.set(c.x * (1 - hull.scale.x), c.y * (1 - hull.scale.y), c.z * (1 - hull.scale.z)); // scale about the bbox centre
  mesh.add(hull);
  return mesh;
};
const place = (m, { x = 0, y = 0, z = 0, ry = 0 } = {}) => { m.position.set(x, y, z); m.rotation.y = ry; scene.add(m); return m; };

const K = {
  THREE, scene, mat, tex, outline,
  /** flat ground plane `size` m square */
  ground: (kind = "grass", { size = 400, color, rep } = {}) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat(kind, color, rep ?? size / 6));
    m.rotation.x = -Math.PI / 2; scene.add(m); return m;
  },
  /** box sitting on y (bottom), textured, outlined */
  box: ({ w = 1, h = 1, d = 1, kind = "plaster", color, rep = Math.max(1, Math.round(Math.max(w, d) / 4)), line = 0.05, ...p } = {}) => {
    const geo = new THREE.BoxGeometry(w, h, d); geo.translate(0, h / 2, 0);
    return place(outline(new THREE.Mesh(geo, mat(kind, color, rep)), line), p);
  },
  cyl: ({ r = 0.5, r2, h = 1, kind = "stone", color, seg = 16, line = 0.04, ...p } = {}) => {
    const geo = new THREE.CylinderGeometry(r2 ?? r, r, h, seg); geo.translate(0, h / 2, 0);
    return place(outline(new THREE.Mesh(geo, mat(kind, color)), line), p);
  },
  ball: ({ r = 1, kind = "grass", color, line = 0.05, ...p } = {}) =>
    place(outline(new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), mat(kind, color)), line), p),
  /** storybook house: walls + pitched roof + door + windows */
  house: ({ w = 6, d = 5, h = 5, wall = "#efd9b0", roof = "#c4583f", wallKind = "plaster", ...p } = {}) => {
    const g = new THREE.Group();
    const body = outline(new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), mat(wallKind, wall)), 0.06);
    const rg = new THREE.CylinderGeometry(0.01, w * 0.75, h * 0.55, 4, 1); rg.rotateY(Math.PI / 4); rg.scale(1, 1, d / w);
    const roofM = outline(new THREE.Mesh(rg, mat("roofTiles", roof, 2)), 0.06); roofM.position.y = h + h * 0.275;
    const door = new THREE.Mesh(new THREE.BoxGeometry(w * 0.2, h * 0.45, 0.12).translate(0, h * 0.225, d / 2), mat("planks", "#7a4a2a"));
    g.add(body, roofM, outline(door, 0.04));
    for (const sx of [-0.3, 0.3]) g.add(outline(new THREE.Mesh(new THREE.BoxGeometry(w * 0.16, h * 0.18, 0.1).translate(sx * w, h * 0.68, d / 2), mat("water", "#ffe9a6")), 0.04));
    return place(g, p);
  },
  tree: ({ s = 1, leaf = "#5f9e45", ...p } = {}) => {
    const g = new THREE.Group();
    g.add(outline(new THREE.Mesh(new THREE.CylinderGeometry(0.18 * s, 0.25 * s, 2 * s, 8).translate(0, s, 0), mat("planks", "#8a5a35")), 0.04));
    for (const [x, y, r] of [[0, 2.6, 1.3], [0.7, 2.2, 0.9], [-0.6, 2.3, 0.95]]) {
      const b = outline(new THREE.Mesh(new THREE.IcosahedronGeometry(r * s, 1), mat("grass", leaf)), 0.05); b.position.set(x * s, y * s, 0); g.add(b);
    }
    return place(g, p);
  },
  add: (obj, p) => place(obj, p),
};

// ---------- actors: camera-facing crayon cards ----------
const CARD_W = 300, CARD_H = 500, cards = new Map();
const shadowMat = new THREE.MeshBasicMaterial({ color: 0x3b2f28, transparent: true, opacity: 0.28, depthWrite: false });
const card = (id) => {
  if (cards.has(id)) return cards.get(id);
  const cv = new OffscreenCanvas(CARD_W, CARD_H), t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, CARD_H / CARD_W), new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.3, fog: false }));
  m.geometry.translate(0, ((CARD_H / CARD_W) * 0.95) / 2, 0); // soles (y = 975/1000) at the origin
  const sh = new THREE.Mesh(new THREE.CircleGeometry(0.5, 20), shadowMat); sh.rotation.x = -Math.PI / 2;
  const c = { cv, g: cv.getContext("2d"), t, m, sh };
  scene.add(m, sh); cards.set(id, c);
  return c;
};
const right = new THREE.Vector3(), fwd = new THREE.Vector3();

function applyFrame(f) {
  const st = story.frame(f, K);
  const sky = SKIES[st.sky] ?? SKIES.day;
  // sky boils every 4 frames like the lines
  if (f % 4 === 0 || skyTex.userData.kind !== st.sky || skyTex.userData.f !== f - (f % 4)) {
    paintSky(skyCanvas.getContext("2d"), skyCanvas.width, skyCanvas.height, st.sky, f);
    skyTex.userData = { kind: st.sky, f: f - (f % 4) }; skyTex.needsUpdate = true;
  }
  scene.fog.color.set(sky.fog);
  hemi.intensity = sky.amb; sun.color.setRGB(...sky.sun); sun.intensity = sky.key;

  const c = st.cam;
  camera.position.set(...c.pos); camera.fov = c.fov ?? 40; camera.up.set(0, 1, 0);
  camera.lookAt(...c.look); if (c.roll) camera.rotateZ((c.roll * Math.PI) / 180);
  camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  camera.getWorldDirection(fwd); right.crossVectors(fwd, camera.up).normalize();

  const seen = new Set();
  for (const a of st.actors ?? []) {
    const k = card(a.id), o = OUTFITS[a.outfit ?? a.id];
    if (!o) throw new Error(`cast.js OUTFITS has no "${a.outfit ?? a.id}"`);
    seen.add(a.id);
    // facing: explicit ±1 (screen), or derived from a world-space heading [dx, dz] so characters face where they move
    let face = a.facing ?? 1;
    if (a.heading) face = Math.sign(a.heading[0] * right.x + a.heading[1] * right.z) || 1;
    const g = k.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, CARD_W, CARD_H);
    g.setTransform((face < 0 ? -1 : 1) * (CARD_W / 600), 0, 0, CARD_H / 1000, face < 0 ? CARD_W : 0, 0);
    drawCharacter(g, o, { ...a, frame: f, seed: a.seed ?? [...a.id].reduce((s, ch) => s + ch.charCodeAt(0), 0) });
    k.t.needsUpdate = true;
    const h = a.h ?? 1.7;
    k.m.scale.set(h / 1.58, h / 1.58, 1); // card height 1.667 units, figure ~0.95 of it
    k.m.position.set(a.x, a.y ?? 0, a.z);
    k.m.rotation.set(0, Math.atan2(camera.position.x - a.x, camera.position.z - a.z), 0);
    k.m.visible = k.sh.visible = true;
    k.sh.position.set(a.x, (a.y ?? 0) + 0.02, a.z); k.sh.scale.set(h * 0.45, h * 0.25, 1);
  }
  for (const [id, k] of cards) if (!seen.has(id)) k.m.visible = k.sh.visible = false;
  return st;
}

const out = document.createElement("canvas");
out.width = W; out.height = H;
document.body.appendChild(out);
const og = out.getContext("2d");

window.TOTAL = story.TOTAL;
window.renderFrame = async (f) => {
  const st = applyFrame(f);
  gl.render(scene, camera);
  og.globalAlpha = 1; og.globalCompositeOperation = "source-over";
  og.drawImage(gl.domElement, 0, 0);
  paperGrainOverlay(og, W, H);
  if (st.flash) { og.fillStyle = `rgba(255,250,240,${st.flash})`; og.fillRect(0, 0, W, H); }
  if (st.fade) { og.fillStyle = `rgba(20,16,14,${st.fade})`; og.fillRect(0, 0, W, H); }
  return out.toDataURL("image/jpeg", 0.92);
};
story.setup?.(K);
window.engineReady = true;
