// the webgl cube. loaded with a dynamic import from Cube3D, so three.js is its own chunk and
// only the cube lab pays for it.
//
// a cube is 26 rounded cubies (plus a dark core so the gaps never show the page) with a rounded
// sticker on each visible face. a turn re-parents the nine cubies of a layer into a pivot, spins the
// pivot, and leaves it there; the next setState() puts every cubie back home and recolours the
// stickers from the facelet string, so the engine in lib/cube.ts stays the only source of truth.
//
// budget: render on demand (only while animating, dragging or tweening the view), pixel ratio capped
// at 1.5, nothing runs while offscreen or in a hidden tab, no shadow maps, no postprocessing, no
// environment maps. colours come from css custom properties so both themes can be designed in css.

import {
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  Shape,
  ShapeGeometry,
  Vector3,
  WebGLRenderer,
  BoxGeometry,
  Quaternion,
  type BufferGeometry,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { type CubeState, FACES, type Face, type Move, faceNormal, stickers } from "@/lib/cube";

export type ThreeCube = {
  /** show this facelet state, cancelling any turn in flight. */
  setState(state: CubeState): void;
  /** animate one face turn; resolves when it is done (or was cut short). The state is committed by the next setState. */
  turn(move: Move, ms: number): Promise<void>;
  /** move the view by this many degrees (smoothly, or at once with reduced motion). */
  nudge(yawDeg: number, pitchDeg: number): void;
  resetView(): void;
  dispose(): void;
};

const HOME = { yaw: -0.62, pitch: 0.5 };
const MAX_PITCH = 1.35;
const FOV = 28;
const RADIUS = 2.9; // bounding sphere of the cube plus a little air
const CUBIE = 0.96;
const STICKER = 0.74;
const LIFT = 0.0012; // stickers sit this far above the cubie face

type Palette = {
  body: string;
  sky: string;
  ground: string;
  fill: number;
  key: number;
  stickers: Record<Face, string>;
};

const FALLBACK: Palette = {
  body: "#1a1c19",
  sky: "#ffffff",
  ground: "#8a8f84",
  fill: 1.7,
  key: 1.6,
  stickers: { U: "#f2f1ea", D: "#f2cf3b", F: "#3aa45b", B: "#3b6fd8", R: "#d8473c", L: "#f08a2e" },
};

/** colours and light levels come from css so the stylesheet owns both themes. */
function readPalette(host: HTMLElement): Palette {
  const probe = document.createElement("div");
  probe.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none";
  host.appendChild(probe);
  const read = (el: Element, name: string) => getComputedStyle(el).getPropertyValue(name).trim();
  const num = (name: string, fallback: number) => {
    const value = parseFloat(read(probe, name));
    return Number.isFinite(value) ? value : fallback;
  };
  const stickerColours = { ...FALLBACK.stickers };
  for (const face of FACES) {
    const el = document.createElement("i");
    el.setAttribute("data-c", face);
    probe.appendChild(el);
    stickerColours[face] = read(el, "--sticker") || FALLBACK.stickers[face];
  }
  const palette: Palette = {
    body: read(probe, "--cube-body") || FALLBACK.body,
    sky: read(probe, "--cube-sky") || FALLBACK.sky,
    ground: read(probe, "--cube-ground") || FALLBACK.ground,
    fill: num("--cube-fill", FALLBACK.fill),
    key: num("--cube-key", FALLBACK.key),
    stickers: stickerColours,
  };
  probe.remove();
  return palette;
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function roundedSquare(size: number, radius: number): Shape {
  const h = size / 2;
  const shape = new Shape();
  shape.moveTo(-h + radius, -h);
  shape.lineTo(h - radius, -h);
  shape.quadraticCurveTo(h, -h, h, -h + radius);
  shape.lineTo(h, h - radius);
  shape.quadraticCurveTo(h, h, h - radius, h);
  shape.lineTo(-h + radius, h);
  shape.quadraticCurveTo(-h, h, -h, h - radius);
  shape.lineTo(-h, -h + radius);
  shape.quadraticCurveTo(-h, -h, -h + radius, -h);
  return shape;
}

type Turning = {
  axis: Vector3;
  angle: number;
  ms: number;
  start: number;
  done: () => void;
};

type Tween = { yaw: number; pitch: number; ms: number; start: number; fromYaw: number; fromPitch: number };

/** Builds the scene inside `host`. Throws when webgl is not available so the caller can fall back. */
export function createThreeCube(host: HTMLElement): ThreeCube {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  if (!renderer.getContext()) {
    renderer.dispose();
    throw new Error("no webgl context");
  }
  const canvas = renderer.domElement;
  canvas.className = "cube3d-canvas";
  canvas.setAttribute("aria-hidden", "true");
  host.appendChild(canvas);

  const palette = readPalette(host);
  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 4, 26);
  const sky = new HemisphereLight(new Color(palette.sky), new Color(palette.ground), palette.fill);
  const key = new DirectionalLight(0xffffff, palette.key);
  key.position.set(-4, 7, 9);
  scene.add(sky, key);

  // root carries the view rotation; pivot sits inside it, so a layer turn happens in cube space
  const root = new Group();
  const pivot = new Group();
  root.add(pivot);
  scene.add(root);

  // geometry and materials, all shared
  const bodyGeometry = new RoundedBoxGeometry(CUBIE, CUBIE, CUBIE, 3, 0.11);
  const stickerGeometry: BufferGeometry = new ShapeGeometry(roundedSquare(STICKER, 0.14), 6);
  const coreGeometry = new BoxGeometry(2.7, 2.7, 2.7);
  const bodyMaterial = new MeshStandardMaterial({ color: new Color(palette.body), roughness: 0.55, metalness: 0 });
  const stickerMaterials = {} as Record<Face, MeshStandardMaterial>;
  for (const face of FACES) {
    stickerMaterials[face] = new MeshStandardMaterial({
      color: new Color(palette.stickers[face]),
      roughness: 0.38,
      metalness: 0,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
  }

  const core = new Mesh(coreGeometry, bodyMaterial);
  root.add(core);

  // 26 cubies, each keyed by its home cell
  const homes = new Map<string, Vector3>();
  const cubies = new Map<string, Group>();
  const cell = (p: number[]) => p.join(",");
  for (const sticker of stickers()) {
    const id = cell(sticker.position);
    if (cubies.has(id)) continue;
    const cubie = new Group();
    const home = new Vector3(...sticker.position);
    cubie.position.copy(home);
    cubie.add(new Mesh(bodyGeometry, bodyMaterial));
    cubies.set(id, cubie);
    homes.set(id, home);
    root.add(cubie);
  }
  // the centre cell has no stickers and no cubie of its own: the core stands in for it
  const stickerMeshes: Mesh[] = [];
  const forward = new Vector3(0, 0, 1);
  for (const sticker of stickers()) {
    const mesh = new Mesh(stickerGeometry, stickerMaterials[FACES[Math.floor(sticker.index / 9)]]);
    const normal = new Vector3(...sticker.normal);
    mesh.quaternion.copy(new Quaternion().setFromUnitVectors(forward, normal));
    mesh.position.copy(normal).multiplyScalar(CUBIE / 2 + LIFT);
    cubies.get(cell(sticker.position))!.add(mesh);
    stickerMeshes[sticker.index] = mesh;
  }

  // ---- view ----
  let yaw = HOME.yaw;
  let pitch = HOME.pitch;
  let tween: Tween | null = null;
  let turning: Turning | null = null;
  let reduced = false;

  const applyView = () => {
    root.rotation.set(pitch, yaw, 0);
  };

  // ---- render loop (on demand) ----
  let raf = 0;
  let dirty = true;
  let visible = true;
  let disposed = false;
  const canRun = () => !disposed && visible && document.visibilityState === "visible";

  function render() {
    root.updateMatrixWorld(true);
    pivot.updateMatrixWorld(true);
    renderer.render(scene, camera);
    dirty = false;
  }

  function frame(now: number) {
    raf = 0;
    if (!canRun()) return;
    let busy = false;
    if (turning) {
      if (turning.start < 0) turning.start = now;
      const t = Math.min(1, (now - turning.start) / turning.ms);
      if (t >= 1) finishTurn();
      else {
        pivot.quaternion.setFromAxisAngle(turning.axis, turning.angle * ease(t));
        busy = true;
      }
      dirty = true;
    }
    if (tween) {
      if (tween.start < 0) tween.start = now;
      const t = Math.min(1, (now - tween.start) / tween.ms);
      yaw = tween.fromYaw + (tween.yaw - tween.fromYaw) * ease(t);
      pitch = tween.fromPitch + (tween.pitch - tween.fromPitch) * ease(t);
      applyView();
      if (t >= 1) tween = null;
      else busy = true;
      dirty = true;
    }
    if (dirty) render();
    if (busy) raf = requestAnimationFrame(frame);
  }

  function invalidate() {
    dirty = true;
    if (!raf && canRun()) raf = requestAnimationFrame(frame);
  }

  // ---- turns ----
  /** fold the pivot's cubies back into root, keeping where they are. */
  function commitPivot() {
    pivot.updateMatrixWorld(true);
    for (const child of [...pivot.children]) root.attach(child);
    pivot.quaternion.identity();
  }

  /** land the turn in flight on its final angle and release whoever awaits it. */
  function finishTurn() {
    if (!turning) return;
    const t = turning;
    turning = null;
    pivot.quaternion.setFromAxisAngle(t.axis, t.angle);
    t.done();
  }

  const home = () => {
    pivot.quaternion.identity();
    for (const [id, cubie] of cubies) {
      root.add(cubie);
      cubie.position.copy(homes.get(id)!);
      cubie.quaternion.identity();
    }
  };

  function paint(state: CubeState) {
    for (let i = 0; i < 54; i++) {
      stickerMeshes[i].material = stickerMaterials[state[i] as Face];
    }
  }

  function startTurn(move: Move, ms: number): Promise<void> {
    finishTurn();
    commitPivot();
    const normal = new Vector3(...faceNormal(move.face));
    const layer: Group[] = [];
    for (const cubie of cubies.values()) {
      if (cubie.position.dot(normal) > 0.5) layer.push(cubie);
    }
    // quarter turns clockwise seen from outside = negative rotation about the outward normal
    const angle = move.turns === 3 ? Math.PI / 2 : -(move.turns * Math.PI) / 2;
    for (const cubie of layer) pivot.attach(cubie);
    return new Promise<void>((resolve) => {
      turning = { axis: normal, angle, ms: Math.max(1, ms), start: -1, done: resolve };
      if (ms <= 0 || reduced || !canRun()) finishTurn();
      invalidate();
    });
  }

  // ---- drag to orbit ----
  let drag: { x: number; y: number; yaw: number; pitch: number } | null = null;
  const onDown = (event: PointerEvent) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    drag = { x: event.clientX, y: event.clientY, yaw, pitch };
    tween = null;
    canvas.setPointerCapture(event.pointerId);
  };
  const onMove = (event: PointerEvent) => {
    if (!drag) return;
    yaw = drag.yaw + (event.clientX - drag.x) * 0.0105;
    pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, drag.pitch + (event.clientY - drag.y) * 0.0105));
    applyView();
    invalidate();
  };
  const onUp = (event: PointerEvent) => {
    drag = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);

  // ---- sizing, visibility, theme ----
  const resize = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // fit the bounding sphere into whichever side is narrower
    const half = Math.atan(Math.tan((FOV * Math.PI) / 360) * Math.min(1, camera.aspect));
    camera.position.set(0, 0, RADIUS / Math.sin(half));
    camera.updateProjectionMatrix();
    invalidate();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);

  const intersection = new IntersectionObserver((entries) => {
    const entry = entries[entries.length - 1];
    visible = entry.isIntersecting;
    if (visible) invalidate();
    else if (turning) {
      finishTurn(); // nobody is watching: land the turn so the caller is never left waiting
    }
  });
  intersection.observe(host);

  const onVisibility = () => {
    if (document.visibilityState === "visible") invalidate();
    else finishTurn();
  };
  document.addEventListener("visibilitychange", onVisibility);

  const applyPalette = () => {
    const next = readPalette(host);
    bodyMaterial.color.set(next.body);
    for (const face of FACES) stickerMaterials[face].color.set(next.stickers[face]);
    sky.color.set(next.sky);
    sky.groundColor.set(next.ground);
    sky.intensity = next.fill;
    key.intensity = next.key;
    invalidate();
  };
  const themeObserver = new MutationObserver(applyPalette);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const scheme = window.matchMedia("(prefers-color-scheme: dark)");
  scheme.addEventListener("change", applyPalette);

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  reduced = motion.matches;
  const onMotion = () => {
    reduced = motion.matches;
  };
  motion.addEventListener("change", onMotion);

  const onLost = (event: Event) => event.preventDefault();
  const onRestored = () => invalidate();
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  /** glide to a view, or jump there with reduced motion or while nobody is looking. */
  function moveView(toYaw: number, toPitch: number) {
    toPitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, toPitch));
    if (reduced || !canRun()) {
      yaw = toYaw;
      pitch = toPitch;
      tween = null;
      applyView();
    } else {
      tween = { yaw: toYaw, pitch: toPitch, ms: 240, start: -1, fromYaw: yaw, fromPitch: pitch };
    }
    invalidate();
  }

  applyView();
  resize();

  return {
    setState(state) {
      finishTurn();
      home();
      paint(state);
      invalidate();
    },
    turn: startTurn,
    nudge: (yawDeg, pitchDeg) => moveView(yaw + (yawDeg * Math.PI) / 180, pitch + (pitchDeg * Math.PI) / 180),
    resetView: () => moveView(HOME.yaw, HOME.pitch),
    dispose() {
      disposed = true;
      finishTurn();
      if (raf) cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersection.disconnect();
      themeObserver.disconnect();
      scheme.removeEventListener("change", applyPalette);
      motion.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      bodyGeometry.dispose();
      stickerGeometry.dispose();
      coreGeometry.dispose();
      bodyMaterial.dispose();
      for (const face of FACES) stickerMaterials[face].dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
