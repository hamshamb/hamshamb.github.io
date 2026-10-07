import * as THREE from "three";
import { phoneIds, type PhoneId, type Scene, SCENE_HALF, SCENE_RANGE, sceneDistance, sceneInRange, sceneStart } from "@/lib/relay-sim";
import { type AnchorMap, isPortraitStage, type SceneEvents, type SceneHandle, type SceneVariant, type Zone } from "./scene-types";
import { createRenderer, readPalette, rounded, trace } from "./three-kit";

/**
 * The Rivet relay and route scenes, in plain three.js (shared setup in three-kit.ts). It is only
 * ever loaded through a dynamic import, so the renderer never reaches a page that does not show a
 * scene. Everything is procedural: no models, no textures from disk, no environment maps, no
 * shadow maps, no postprocessing. It renders only while something is moving, and stops when the
 * scene is off screen or the tab is hidden.
 *
 * Coordinates: the table is the XZ plane, y is up. Phones lie flat on it. The long edge of a phone
 * runs along z. The envelope floats above whichever phone holds a copy.
 */

const PHONE_W = 1;
const PHONE_L = 1.95;
const PHONE_T = 0.13;
const ENV_W = 0.95;
const ENV_L = 0.64;
const ENV_T = 0.07;
const ENV_Y = 0.95;
const PAD = { x: 0.95, z: 0.85 };
const ELEVATION = 0.95;

const ZONES: Zone[] = ["header", "outer", "sealed"];
const ZONE_W: Record<Zone, number> = { header: 0.22, outer: 0.16, sealed: 0.46 };
const ZONE_X: Record<Zone, number> = { header: -0.33, outer: -0.12, sealed: 0.21 };
const ZONE_LIFT: Record<Zone, number> = { header: 0.62, outer: 0.31, sealed: 0 };

/** The route variant has its own fixed layout: four phones, each just inside range of the next. */
const ROUTE_AT: Record<PhoneId, { x: number; z: number }> = {
  sender: { x: -5.4, z: 0.7 },
  "relay-a": { x: -1.8, z: -0.7 },
  "relay-b": { x: 1.8, z: 0.7 },
  recipient: { x: 5.4, z: -0.7 },
};

const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);
const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const easeBack = (k: number) => {
  const c1 = 1.4;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
};
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/* ---------------------------------------------------------------------- geometry --- */

/** Extruded shapes grow along +z; laid flat they grow upward from the table. */
function slab(shape: THREE.Shape, depth: number) {
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 6 });
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

function buildGeometry() {
  const bodyShape = rounded(PHONE_W, PHONE_L, 0.2);
  const hole = trace(new THREE.Path(), PHONE_W - 0.2, PHONE_L - 0.34, 0.13);
  bodyShape.holes.push(hole);
  const phoneBody = slab(bodyShape, PHONE_T);

  const tableShape = rounded(SCENE_HALF.x * 2 + PAD.x * 2, SCENE_HALF.z * 2 + PAD.z * 2, 0.5);
  const table = slab(tableShape, 0.22);
  table.translate(0, -0.22, 0);

  const haloShape = rounded(PHONE_W + 0.6, PHONE_L + 0.6, 0.38);
  haloShape.holes.push(trace(new THREE.Path(), PHONE_W + 0.5, PHONE_L + 0.5, 0.33));
  const halo = new THREE.ShapeGeometry(haloShape);
  halo.rotateX(-Math.PI / 2);

  const zoneBox = (zone: Zone) => new THREE.BoxGeometry(ZONE_W[zone], 0.05, 0.42);
  const zone = { header: zoneBox("header"), outer: zoneBox("outer"), sealed: zoneBox("sealed") };

  const flap = new THREE.BufferGeometry();
  const apex = ENV_L * 0.72;
  flap.setAttribute("position", new THREE.Float32BufferAttribute([-ENV_W / 2, 0, 0, 0, 0, apex, ENV_W / 2, 0, 0], 3));
  flap.computeVertexNormals();

  const envBody = new THREE.BoxGeometry(ENV_W, ENV_T, ENV_L);

  const grid: number[] = [];
  for (let x = -Math.floor(SCENE_HALF.x); x <= Math.floor(SCENE_HALF.x); x += 1) grid.push(x, 0, -SCENE_HALF.z, x, 0, SCENE_HALF.z);
  for (let z = -Math.floor(SCENE_HALF.z); z <= Math.floor(SCENE_HALF.z); z += 1) grid.push(-SCENE_HALF.x, 0, z, SCENE_HALF.x, 0, z);
  const gridGeo = new THREE.BufferGeometry();
  gridGeo.setAttribute("position", new THREE.Float32BufferAttribute(grid, 3));

  const ring = new THREE.RingGeometry(SCENE_RANGE - 0.03, SCENE_RANGE, 128);
  ring.rotateX(-Math.PI / 2);
  const band = new THREE.PlaneGeometry(1, 0.07);
  band.rotateX(-Math.PI / 2);
  const shadow = new THREE.PlaneGeometry(PHONE_W + 1, PHONE_L + 1);
  shadow.rotateX(-Math.PI / 2);

  return {
    phoneBody,
    phoneBodyEdges: new THREE.EdgesGeometry(phoneBody, 30),
    screen: slab(rounded(PHONE_W - 0.2, PHONE_L - 0.34, 0.12), 0.07),
    line: new THREE.BoxGeometry(1, 0.008, 0.05),
    table,
    tableEdges: new THREE.EdgesGeometry(table, 30),
    grid: gridGeo,
    halo,
    ring,
    band,
    shadow,
    envBody,
    envEdges: new THREE.EdgesGeometry(envBody),
    flap,
    dot: new THREE.CircleGeometry(0.06, 20),
    zone,
    zoneEdges: { header: new THREE.EdgesGeometry(zone.header), outer: new THREE.EdgesGeometry(zone.outer), sealed: new THREE.EdgesGeometry(zone.sealed) },
    tether: new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, PHONE_T, 0), new THREE.Vector3(0, ENV_Y - 0.12, 0)]),
  };
}
type Geometries = ReturnType<typeof buildGeometry>;

/* ----------------------------------------------------------------------- envelope --- */

type ZoneView = { mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; edgeMat: THREE.LineBasicMaterial };
type EnvView = {
  group: THREE.Group;
  inner: THREE.Group;
  bodyMat: THREE.MeshLambertMaterial;
  edgeMat: THREE.LineBasicMaterial;
  flapPivot: THREE.Group;
  flapMat: THREE.MeshLambertMaterial;
  dotMat: THREE.MeshBasicMaterial;
  sealedMat: THREE.MeshLambertMaterial;
  openMat: THREE.MeshLambertMaterial;
  zones: Record<Zone, ZoneView>;
  /** 0 hidden, 1 resting size. Overshoots a little while popping in. */
  pop: number;
  /** 0 sealed, 1 opened by the recipient. */
  open: number;
};

function makeEnvelope(geo: Geometries, hatch: THREE.Texture): EnvView {
  const group = new THREE.Group();
  const inner = new THREE.Group();
  group.add(inner);

  const bodyMat = new THREE.MeshLambertMaterial();
  const edgeMat = new THREE.LineBasicMaterial({ transparent: true });
  inner.add(new THREE.Mesh(geo.envBody, bodyMat), new THREE.LineSegments(geo.envEdges, edgeMat));

  const flapPivot = new THREE.Group();
  flapPivot.position.set(0, ENV_T / 2 + 0.004, -ENV_L / 2);
  const flapMat = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide });
  flapPivot.add(new THREE.Mesh(geo.flap, flapMat));
  const dotMat = new THREE.MeshBasicMaterial({ transparent: true });
  const dot = new THREE.Mesh(geo.dot, dotMat);
  dot.rotation.x = -Math.PI / 2;
  dot.position.set(0, 0.006, ENV_L * 0.56);
  flapPivot.add(dot);
  inner.add(flapPivot);

  const sealedMat = new THREE.MeshLambertMaterial({ map: hatch, transparent: true });
  const openMat = new THREE.MeshLambertMaterial({ transparent: true });
  const zones = {} as Record<Zone, ZoneView>;
  for (const zone of ZONES) {
    const mat = zone === "sealed" ? sealedMat : new THREE.MeshLambertMaterial({ transparent: true });
    const mesh = new THREE.Mesh(geo.zone[zone], mat);
    const edgeMat2 = new THREE.LineBasicMaterial({ transparent: true });
    const edges = new THREE.LineSegments(geo.zoneEdges[zone], edgeMat2);
    mesh.add(edges);
    mesh.position.x = ZONE_X[zone];
    mesh.visible = false;
    inner.add(mesh);
    zones[zone] = { mesh, mat, edgeMat: edgeMat2 };
  }
  group.visible = false;
  return { group, inner, bodyMat, edgeMat, flapPivot, flapMat, dotMat, sealedMat, openMat, zones, pop: 1, open: 0 };
}

/* ------------------------------------------------------------------------- phones --- */

type PhoneView = {
  id: PhoneId;
  group: THREE.Group;
  ring: THREE.Mesh;
  display: { x: number; z: number };
  target: { x: number; z: number };
  bodyMat: THREE.MeshLambertMaterial;
  edgeMat: THREE.LineBasicMaterial;
  screenMat: THREE.MeshLambertMaterial;
  lineMat: THREE.MeshBasicMaterial;
  ringMat: THREE.MeshBasicMaterial;
  haloMat: THREE.MeshBasicMaterial;
  halo: THREE.Mesh;
  tether: THREE.Line;
  tetherMat: THREE.LineBasicMaterial;
  env: EnvView;
};

type Tween = { start: number; duration: number; update: (k: number) => void; done?: () => void; ease: (k: number) => number };

/* ---------------------------------------------------------------------- the scene --- */

export function createScene(host: HTMLElement, variant: SceneVariant, events: SceneEvents): SceneHandle {
  const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = reducedQuery.matches;
  const onReduced = () => { reduced = reducedQuery.matches; };
  reducedQuery.addEventListener("change", onReduced);

  const renderer = createRenderer(host, "rv-canvas", variant === "route" ? "auto" : "pan-y");
  const canvas = renderer.domElement;

  const three = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 1, 1, 100);
  const geo = buildGeometry();
  const disposables: { dispose(): void }[] = [renderer];
  const track = <T extends { dispose(): void }>(item: T) => {
    disposables.push(item);
    return item;
  };
  Object.values(geo).forEach((item) => {
    if (item instanceof THREE.BufferGeometry) track(item);
    else Object.values(item as Record<string, THREE.BufferGeometry>).forEach((inner) => track(inner));
  });

  let palette = readPalette();
  const hatchCanvas = document.createElement("canvas");
  hatchCanvas.width = hatchCanvas.height = 96;
  const hatch = track(new THREE.CanvasTexture(hatchCanvas));
  hatch.colorSpace = THREE.SRGBColorSpace;
  const shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = shadowCanvas.height = 96;
  const shadowCtx = shadowCanvas.getContext("2d");
  if (shadowCtx) {
    const g = shadowCtx.createRadialGradient(48, 48, 6, 48, 48, 46);
    g.addColorStop(0, "rgba(0,0,0,0.5)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    shadowCtx.fillStyle = g;
    shadowCtx.fillRect(0, 0, 96, 96);
  }
  const shadowTex = track(new THREE.CanvasTexture(shadowCanvas));

  const hemi = new THREE.HemisphereLight(0xffffff, 0xbbbbbb, 0.58 * Math.PI);
  const sun = new THREE.DirectionalLight(0xffffff, 0.5 * Math.PI);
  sun.position.set(-4, 8, 5);
  three.add(hemi, sun);

  const root = new THREE.Group();
  three.add(root);

  /* the table */
  const tableMat = track(new THREE.MeshLambertMaterial());
  const tableEdgeMat = track(new THREE.LineBasicMaterial({ transparent: true, opacity: 0.55 }));
  const gridMat = track(new THREE.LineBasicMaterial({ transparent: true, opacity: 0.16 }));
  const linkMat = track(new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.5, depthWrite: false }));
  const linkLiveMat = track(new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.95, depthWrite: false }));
  const shadowMat = track(new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.5 }));
  const hasTable = variant !== "envelope";
  if (hasTable) {
    root.add(new THREE.Mesh(geo.table, tableMat), new THREE.LineSegments(geo.tableEdges, tableEdgeMat));
    const grid = new THREE.LineSegments(geo.grid, gridMat);
    grid.position.y = 0.004;
    root.add(grid);
  }

  /* phones, with the envelope that floats above each */
  const phones: PhoneView[] = [];
  const base: Scene = variant === "route" ? routeScene() : sceneStart();
  let current: Scene = base;
  if (hasTable) {
    for (const spec of base.phones) {
      const group = new THREE.Group();
      const bodyMat = track(new THREE.MeshLambertMaterial());
      const edgeMat = track(new THREE.LineBasicMaterial({ transparent: true, opacity: 0.9 }));
      const screenMat = track(new THREE.MeshLambertMaterial());
      const lineMat = track(new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.8 }));
      const ringMat = track(new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.1, depthWrite: false }));
      const haloMat = track(new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.9, depthWrite: false }));
      const tetherMat = track(new THREE.LineBasicMaterial({ transparent: true, opacity: 0.55 }));

      const shadow = new THREE.Mesh(geo.shadow, shadowMat);
      shadow.position.set(0.14, 0.006, 0.2);
      const body = new THREE.Mesh(geo.phoneBody, bodyMat);
      const edges = new THREE.LineSegments(geo.phoneBodyEdges, edgeMat);
      const screen = new THREE.Mesh(geo.screen, screenMat);
      const lines = new THREE.Group();
      [
        { x: -0.06, z: -0.5, w: 0.5 },
        { x: 0.09, z: -0.3, w: 0.36 },
        { x: -0.1, z: -0.1, w: 0.42 },
      ].forEach((item) => {
        const line = new THREE.Mesh(geo.line, lineMat);
        line.scale.x = item.w;
        line.position.set(item.x, 0.075, item.z);
        lines.add(line);
      });
      const ring = new THREE.Mesh(geo.ring, ringMat);
      ring.position.y = 0.012;
      const halo = new THREE.Mesh(geo.halo, haloMat);
      halo.position.y = 0.016;
      halo.visible = false;
      const tether = new THREE.Line(geo.tether, tetherMat);
      group.add(shadow, body, edges, screen, lines);
      root.add(group, ring, halo, tether);
      // ring, halo and tether follow the phone but live on the root, so they stay flat and unscaled
      const env = makeEnvelope(geo, hatch);
      root.add(env.group);
      phones.push({
        id: spec.id,
        group,
        ring,
        display: { x: spec.x, z: spec.z },
        target: { x: spec.x, z: spec.z },
        bodyMat,
        edgeMat,
        screenMat,
        lineMat,
        ringMat,
        haloMat,
        halo,
        tether,
        tetherMat,
        env,
      });
    }
  }
  const carrier = makeEnvelope(geo, hatch);
  root.add(carrier.group);
  const big = variant === "envelope" ? makeEnvelope(geo, hatch) : null;
  if (big) {
    big.group.visible = true;
    big.group.scale.setScalar(3.4);
    big.group.position.y = 0.6;
    root.add(big.group);
  }
  const envelopes = [...phones.map((view) => view.env), carrier, ...(big ? [big] : [])];
  for (const env of envelopes) {
    track(env.bodyMat);
    track(env.edgeMat);
    track(env.flapMat);
    track(env.dotMat);
    track(env.sealedMat);
    track(env.openMat);
    ZONES.forEach((zone) => {
      track(env.zones[zone].mat);
      track(env.zones[zone].edgeMat);
    });
  }

  const links: THREE.Mesh[] = [];
  if (hasTable) {
    for (let i = 0; i < 6; i += 1) {
      const band = new THREE.Mesh(geo.band, linkMat);
      band.position.y = 0.02;
      band.visible = false;
      root.add(band);
      links.push(band);
    }
  }

  /* ---------------------------------------------------------------- look --- */

  const derived = {
    body: new THREE.Color(),
    screen: new THREE.Color(),
    sealedFill: new THREE.Color(),
    opened: new THREE.Color(),
    flap: new THREE.Color(),
    header: new THREE.Color(),
    outer: new THREE.Color(),
  };

  function applyPalette() {
    palette = readPalette();
    const p = palette;
    derived.body.copy(p.dark ? p.surface.clone().lerp(p.fg, 0.1) : p.raised);
    derived.screen.copy(p.dark ? p.bg : p.surface.clone().lerp(p.fg, 0.1));
    derived.sealedFill.copy(p.accent).lerp(p.dark ? p.bg : p.fg, 0.64);
    derived.opened.copy(p.accent).lerp(p.raised, p.dark ? 0.1 : 0.45);
    derived.flap.copy(p.accent).lerp(p.dark ? p.bg : p.fg, 0.22);
    derived.header.copy(p.fg2);
    derived.outer.copy(p.fg3);
    hemi.groundColor.copy(p.plate).lerp(p.fg3, 0.25);
    hemi.color.setScalar(1);
    const ctx = hatchCanvas.getContext("2d");
    if (ctx) {
      const s = hatchCanvas.width;
      ctx.fillStyle = `#${derived.sealedFill.getHexString(THREE.SRGBColorSpace)}`;
      ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = `#${p.accent.getHexString(THREE.SRGBColorSpace)}`;
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = s / 20;
      for (let i = -s; i <= s * 2; i += s / 3) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + s, s);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      hatch.needsUpdate = true;
    }
    tableMat.color.copy(p.plate);
    if (p.dark) tableMat.color.lerp(p.fg, 0.04);
    tableEdgeMat.color.copy(p.fg3);
    gridMat.color.copy(p.fg3);
    linkMat.color.copy(p.fg3);
    linkLiveMat.color.copy(p.accent);
    for (const env of envelopes) env.openMat.color.copy(derived.opened);
  }
  applyPalette();

  /* -------------------------------------------------------- continuous state --- */

  const pending = new Set<PhoneId>();
  const hold = (id: PhoneId) => (variant === "route" ? routeHolds(id, progressNow) : current.copies[id] !== undefined);
  let selected: PhoneId | null = null;
  let zoneFocus: Zone | null = null;
  let xrayTarget = 0;
  let xray = 0;
  let progressTarget = 0;
  let progressNow = 0;
  let yawTarget = 0;
  let yawNow = 0;
  let drag: { kind: "phone" | "envelope"; id: PhoneId; pointerId: number; ox: number; oz: number; hover: PhoneId | null } | null = null;
  let hover: { id: PhoneId; valid: boolean } | null = null;
  let portrait = false;
  let width = 1;
  let height = 1;
  let disposed = false;
  let running = true;
  let raf = 0;
  let last = performance.now();
  let first = true;
  let routeOpened = false;
  const tweens: Tween[] = [];

  function tween(duration: number, update: (k: number) => void, done?: () => void, ease = easeOut) {
    if (reduced || duration <= 0) {
      update(1);
      done?.();
      invalidate();
      return;
    }
    tweens.push({ start: performance.now(), duration, update, done, ease });
    invalidate();
  }

  function invalidate() {
    if (disposed || !running || raf) return;
    raf = requestAnimationFrame(frame);
  }

  const phone = (id: PhoneId) => phones.find((view) => view.id === id)!;
  const slot = (view: PhoneView, into = new THREE.Vector3()) => into.set(view.display.x, ENV_Y, view.display.z);

  function popIn(env: EnvView) {
    env.pop = 0;
    tween(380, (k) => { env.pop = easeBack(k); }, () => { env.pop = 1; }, (k) => k);
  }

  function startOpen(env: EnvView) {
    tween(900, (k) => { env.open = easeInOut(k); }, () => { env.open = 1; }, (k) => k);
  }

  function flyCarrier(from: THREE.Vector3, to: THREE.Vector3, duration: number, done: () => void) {
    carrier.group.visible = true;
    carrier.pop = 1;
    carrier.open = 0;
    tween(
      duration,
      (k) => {
        carrier.group.position.lerpVectors(from, to, k);
        carrier.group.position.y += Math.sin(k * Math.PI) * 0.45;
      },
      () => {
        carrier.group.visible = false;
        done();
      },
      easeInOut,
    );
  }

  /* ------------------------------------------------------------------ sizing --- */

  const target = new THREE.Vector3(0, variant === "envelope" ? 0.9 : 0, 0);
  const probe = new THREE.Vector3();

  function fitPoints(): THREE.Vector3[] {
    if (variant === "envelope") {
      const pts: THREE.Vector3[] = [];
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const y of [-0.1, 3.3]) pts.push(new THREE.Vector3(sx * 1.8, y, sz * 1.3));
      return pts;
    }
    const pts: THREE.Vector3[] = [];
    const ex = SCENE_HALF.x + 0.6;
    const ez = SCENE_HALF.z + 0.55;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const y of [0, 1.7]) pts.push(new THREE.Vector3(sx * ex, y, sz * ez));
    return pts;
  }

  function place(distance: number) {
    const yaw = portrait ? Math.PI / 2 : 0;
    const elevation = variant === "envelope" ? 0.55 : ELEVATION;
    camera.position.set(
      target.x + distance * Math.sin(yaw) * Math.cos(elevation),
      target.y + distance * Math.sin(elevation),
      target.z + distance * Math.cos(yaw) * Math.cos(elevation),
    );
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }

  function fit() {
    const rect = host.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    portrait = variant !== "envelope" && isPortraitStage(width, height);
    const points = fitPoints();
    let distance = 30;
    for (let i = 0; i < 10; i += 1) {
      place(distance);
      let widest = 0;
      for (const point of points) {
        probe.copy(point).project(camera);
        widest = Math.max(widest, Math.abs(probe.x), Math.abs(probe.y));
      }
      distance *= Math.max(0.3, widest / 0.94);
    }
    place(distance);
  }

  const toScreen = (point: THREE.Vector3) => {
    probe.copy(point).project(camera);
    return { x: (probe.x * 0.5 + 0.5) * width, y: (-probe.y * 0.5 + 0.5) * height, visible: probe.z < 1 && Math.abs(probe.x) <= 1.05 && Math.abs(probe.y) <= 1.05 };
  };

  function pixelsPerUnit() {
    const a = toScreen(new THREE.Vector3(0, 0, 0));
    const b = toScreen(new THREE.Vector3(1, 0, 0));
    const c = toScreen(new THREE.Vector3(0, 0, 1));
    return (Math.hypot(a.x - b.x, a.y - b.y) + Math.hypot(a.x - c.x, a.y - c.y)) / 2;
  }

  function emitProject() {
    if (!events.project) return;
    const anchors: AnchorMap = {};
    const unit = pixelsPerUnit();
    for (const view of phones) {
      const at = toScreen(new THREE.Vector3(view.display.x, 0.1, view.display.z));
      anchors[view.id] = { x: at.x, y: at.y + unit * (portrait ? 0.78 : 1.02), visible: at.visible };
      const up = toScreen(new THREE.Vector3(view.display.x, ENV_Y + 0.15, view.display.z));
      anchors[`env:${view.id}`] = { x: up.x, y: up.y - unit * 0.34, visible: up.visible && view.env.group.visible };
    }
    events.project(anchors);
  }

  /* ------------------------------------------------------------------- frame --- */

  function runTweens(now: number) {
    for (let i = tweens.length - 1; i >= 0; i -= 1) {
      const item = tweens[i];
      const k = clamp01((now - item.start) / item.duration);
      item.update(item.ease(k));
      if (k >= 1) {
        tweens.splice(i, 1);
        item.done?.();
      }
    }
    return tweens.length > 0;
  }

  function approach(now: number, goal: number, rate: number, dt: number) {
    if (reduced) return goal;
    const next = now + (goal - now) * (1 - Math.exp(-dt * rate));
    return Math.abs(goal - next) < 0.0008 ? goal : next;
  }

  function stepValues(dt: number) {
    let busy = false;
    for (const view of phones) {
      const nx = approach(view.display.x, view.target.x, 18, dt);
      const nz = approach(view.display.z, view.target.z, 18, dt);
      if (nx !== view.target.x || nz !== view.target.z) busy = true;
      view.display.x = nx;
      view.display.z = nz;
    }
    const nextX = approach(xray, xrayTarget, 9, dt);
    if (nextX !== xrayTarget) busy = true;
    xray = nextX;
    const nextP = approach(progressNow, progressTarget, 4.5, dt);
    if (nextP !== progressTarget) busy = true;
    progressNow = nextP;
    const nextYaw = approach(yawNow, yawTarget, 10, dt);
    if (nextYaw !== yawTarget) busy = true;
    yawNow = nextYaw;
    return busy;
  }

  const along = new THREE.Vector3();
  const aim = new THREE.Vector3();

  /** route variant: where the envelope is on its way through the four phones. */
  function routeStep() {
    if (variant !== "route") return;
    const order = phoneIds.map((id) => phone(id));
    const t = clamp01(progressNow) * (order.length - 1);
    const index = Math.min(order.length - 2, Math.floor(t));
    const f = easeInOut(t - index);
    const showing = progressNow > 0.002 && progressNow < 0.998;
    carrier.group.visible = showing;
    if (showing) {
      along.set(order[index].display.x, ENV_Y, order[index].display.z);
      aim.set(order[index + 1].display.x, ENV_Y, order[index + 1].display.z);
      carrier.group.position.lerpVectors(along, aim, f);
      carrier.group.position.y += Math.sin(f * Math.PI) * 0.45;
    }
    for (const view of phones) {
      const holds = hold(view.id);
      if (holds && !view.env.group.visible) popIn(view.env);
      view.env.group.visible = holds;
    }
    const arrived = progressNow >= 0.985;
    if (arrived && !routeOpened) {
      routeOpened = true;
      startOpen(phone("recipient").env);
    } else if (!arrived && routeOpened) {
      routeOpened = false;
      phone("recipient").env.open = 0;
    }
  }

  function look(env: EnvView, o: { xray: number; focus: Zone | null; explode: number }) {
    const p = palette;
    const x = o.xray;
    const see = x > 0.02;
    env.bodyMat.color.copy(p.accent);
    env.bodyMat.transparent = see;
    env.bodyMat.opacity = 1 - 0.9 * x;
    env.bodyMat.depthWrite = x < 0.5;
    env.flapMat.color.copy(derived.flap);
    env.flapMat.transparent = see;
    env.flapMat.opacity = 1 - 0.85 * x;
    env.flapMat.depthWrite = x < 0.5;
    env.dotMat.color.copy(p.accentInk);
    env.dotMat.opacity = (1 - env.open) * (1 - x);
    env.edgeMat.color.copy(p.accentInk).lerp(p.accent, x);
    env.edgeMat.opacity = 0.5 + 0.5 * x;
    env.flapPivot.rotation.x = -env.open * 2.3;
    for (const zone of ZONES) {
      const view = env.zones[zone];
      view.mesh.visible = see;
      view.mat.opacity = x;
      view.edgeMat.opacity = 0.35 + 0.65 * x;
      const focused = o.focus === zone;
      view.edgeMat.color.copy(focused ? p.accent : p.fg);
      view.mesh.position.y = ZONE_LIFT[zone] * o.explode;
      view.mesh.scale.set(1, 1, 1);
      if (zone === "sealed") {
        view.mesh.material = env.open > 0.5 ? env.openMat : env.sealedMat;
        env.openMat.opacity = x;
        view.mesh.scale.y = 1 + 0.6 * Math.sin(env.open * Math.PI);
      } else {
        view.mat.color.copy(zone === "header" ? derived.header : derived.outer);
      }
      if (focused) {
        view.mesh.scale.set(1.05, 1.5, 1.08);
        if (zone !== "sealed") view.mat.color.lerp(p.accent, 0.5);
      }
    }
  }

  function updateLook() {
    const p = palette;
    for (const view of phones) {
      const holds = hold(view.id);
      const grabbed = drag !== null && drag.id === view.id;
      const lit = holds || grabbed;
      view.group.position.set(view.display.x, 0, view.display.z);
      view.bodyMat.color.copy(derived.body);
      view.screenMat.color.copy(derived.screen).lerp(p.accent, holds ? 0.22 : 0);
      view.lineMat.color.copy(holds ? p.accent : p.fg3);
      view.edgeMat.color.copy(selected === view.id || grabbed ? p.fg : p.fg3);
      view.ringMat.color.copy(lit ? p.accent : p.fg3);
      view.ringMat.opacity = grabbed ? 0.6 : holds ? 0.34 : selected === view.id ? 0.4 : 0.1;
      view.ring.position.set(view.display.x, 0.012, view.display.z);
      const active = hover && hover.id === view.id;
      view.halo.visible = Boolean(active);
      view.halo.position.set(view.display.x, 0.016, view.display.z);
      if (active && hover) view.haloMat.color.copy(hover.valid ? p.accent : p.fg3);
      view.tetherMat.color.copy(p.accent);
      const showEnv = holds && !pending.has(view.id);
      view.tether.visible = showEnv;
      view.tether.position.set(view.display.x, 0, view.display.z);
      view.env.group.visible = showEnv;
      view.env.group.position.set(view.display.x, ENV_Y + (xray * 0.5), view.display.z);
      const size = view.env.pop * (1 + xray * (variant === "relay" ? 0.55 : 0));
      view.env.group.scale.setScalar(Math.max(0.0001, size));
    }
    const explode = variant === "envelope" ? xray : 0;
    for (const env of envelopes) look(env, { xray, focus: env === big ? zoneFocus : null, explode: env === big ? explode : 0 });
    if (big) big.inner.rotation.y = yawNow;
    carrier.group.scale.setScalar(1.12 * (1 + xray * (variant === "relay" ? 0.55 : 0)));

    // links between phones that are close enough
    let used = 0;
    for (let i = 0; i < phones.length; i += 1) {
      for (let j = i + 1; j < phones.length; j += 1) {
        const a = phones[i];
        const b = phones[j];
        const dx = b.display.x - a.display.x;
        const dz = b.display.z - a.display.z;
        const length = Math.hypot(dx, dz);
        if (length > SCENE_RANGE || used >= links.length) continue;
        const band = links[used];
        used += 1;
        band.visible = true;
        const gap = PHONE_L * 0.55;
        const shown = Math.max(0.1, length - gap);
        band.scale.x = shown;
        band.position.set((a.display.x + b.display.x) / 2, 0.02, (a.display.z + b.display.z) / 2);
        band.rotation.y = -Math.atan2(dz, dx);
        band.material = hold(a.id) !== hold(b.id) ? linkLiveMat : linkMat;
      }
    }
    for (let i = used; i < links.length; i += 1) links[i].visible = false;
  }

  function frame(now: number) {
    raf = 0;
    if (disposed) return;
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    let busy = runTweens(now);
    busy = stepValues(dt) || busy;
    routeStep();
    updateLook();
    renderer.render(three, camera);
    emitProject();
    if (busy || drag) invalidate();
  }

  /* ------------------------------------------------------------- interaction --- */

  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();
  const ndc = new THREE.Vector2();

  function ground(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.ray.intersectPlane(plane, hit) ? { x: hit.x, z: hit.z } : null;
  }

  /** What is under this point: an envelope floating over a phone wins over the phone itself. */
  function pick(clientX: number, clientY: number, touch: boolean): { kind: "phone" | "envelope"; id: PhoneId; ox: number; oz: number } | null {
    if (variant !== "relay") return null;
    const rect = canvas.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const unit = pixelsPerUnit();
    const reach = Math.max(touch ? 36 : 26, unit * (touch ? 0.62 : 0.5));
    let best: { id: PhoneId; d: number } | null = null;
    for (const view of phones) {
      if (!view.env.group.visible || view.env.pop < 0.5 || pending.has(view.id)) continue;
      const at = toScreen(view.env.group.position);
      const d = Math.hypot(at.x - px, at.y - py);
      if (d <= reach && (!best || d < best.d)) best = { id: view.id, d };
    }
    if (best) return { kind: "envelope", id: best.id, ox: 0, oz: 0 };
    const g = ground(clientX, clientY);
    if (!g) return null;
    const rx = touch ? 1.15 : 0.85;
    const rz = touch ? 1.55 : 1.25;
    let nearest: { id: PhoneId; d: number; ox: number; oz: number } | null = null;
    for (const view of phones) {
      const dx = (g.x - view.display.x) / rx;
      const dz = (g.z - view.display.z) / rz;
      const d = Math.hypot(dx, dz);
      if (d <= 1 && (!nearest || d < nearest.d)) nearest = { id: view.id, d, ox: view.display.x - g.x, oz: view.display.z - g.z };
    }
    return nearest ? { kind: "phone", id: nearest.id, ox: nearest.ox, oz: nearest.oz } : null;
  }

  /** Which phone is the carried envelope hovering over, and could a copy actually move there? */
  function dropTarget(from: PhoneId) {
    const at = carrier.group.position;
    let best: { id: PhoneId; d: number } | null = null;
    for (const view of phones) {
      if (view.id === from) continue;
      const dx = (at.x - view.display.x) / 1.15;
      const dz = (at.z - view.display.z) / 1.5;
      const d = Math.hypot(dx, dz);
      if (d <= 1 && (!best || d < best.d)) best = { id: view.id, d };
    }
    if (!best) return null;
    const source = current.phones.find((item) => item.id === from)!;
    const receiver = current.phones.find((item) => item.id === best.id)!;
    return { id: best.id, valid: current.copies[best.id] === undefined && sceneInRange(source, receiver) };
  }

  let envDrag: { dx: number; dz: number } | null = null;

  function onDown(event: PointerEvent) {
    if (disposed || (event.pointerType === "mouse" && event.button !== 0)) return;
    if (variant === "envelope") {
      drag = { kind: "phone", id: "sender", pointerId: event.pointerId, ox: event.clientX, oz: yawTarget, hover: null };
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = "grabbing";
      return;
    }
    const found = pick(event.clientX, event.clientY, event.pointerType !== "mouse");
    if (!found) return;
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    drag = { kind: found.kind, id: found.id, pointerId: event.pointerId, ox: found.ox, oz: found.oz, hover: null };
    events.grab?.({ kind: found.kind, id: found.id });
    if (found.kind === "envelope") {
      const view = phone(found.id);
      const g = ground(event.clientX, event.clientY);
      envDrag = g ? { dx: view.display.x - g.x, dz: view.display.z - g.z } : { dx: 0, dz: 0 };
      carrier.group.visible = true;
      carrier.pop = 1;
      carrier.open = 0;
      slot(view, carrier.group.position);
      canvas.style.cursor = "grabbing";
    }
    invalidate();
  }

  function onMove(event: PointerEvent) {
    if (disposed) return;
    if (!drag) {
      if (event.pointerType === "mouse" && variant === "relay") canvas.style.cursor = pick(event.clientX, event.clientY, false) ? "grab" : "";
      return;
    }
    if (event.pointerId !== drag.pointerId) return;
    if (variant === "envelope") {
      yawTarget = Math.max(-1.1, Math.min(1.1, drag.oz + (event.clientX - drag.ox) * 0.008));
      invalidate();
      return;
    }
    const g = ground(event.clientX, event.clientY);
    if (!g) return;
    if (drag.kind === "phone") {
      events.movePhone?.(drag.id, g.x + drag.ox, g.z + drag.oz);
    } else if (envDrag) {
      carrier.group.position.set(g.x + envDrag.dx, ENV_Y + 0.3, g.z + envDrag.dz);
      hover = dropTarget(drag.id);
    }
    invalidate();
  }

  function release(event: PointerEvent, cancelled: boolean) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const held = drag;
    drag = null;
    canvas.style.cursor = "";
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (variant === "envelope") return;
    events.grab?.(null);
    if (held.kind === "envelope") {
      const aimed = cancelled ? null : dropTarget(held.id);
      hover = null;
      const from = carrier.group.position.clone();
      const accepted = events.dropEnvelope?.(held.id, aimed ? aimed.id : null) ?? false;
      const home = slot(phone(held.id));
      if (accepted && aimed) {
        const into = aimed.id;
        pending.add(into);
        flyCarrier(from, slot(phone(into)), 260, () => {
          pending.delete(into);
          const env = phone(into).env;
          env.group.visible = true;
          popIn(env);
          if (current.phones.find((item) => item.id === into)?.role === "recipient" && current.copies[into] !== undefined) startOpen(env);
        });
      } else {
        flyCarrier(from, home, 300, () => {});
      }
    }
    envDrag = null;
    invalidate();
  }

  const onUp = (event: PointerEvent) => release(event, false);
  const onCancel = (event: PointerEvent) => release(event, true);
  const onTouchStart = (event: TouchEvent) => {
    // only claim the touch when it lands on something draggable; everywhere else the page scrolls
    const touch = event.touches[0];
    if (!touch || event.touches.length > 1) return;
    if (variant === "envelope" || pick(touch.clientX, touch.clientY, true)) event.preventDefault();
  };

  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onCancel);
  canvas.addEventListener("touchstart", onTouchStart, { passive: false });
  const onLost = (event: Event) => {
    event.preventDefault();
    events.lost?.();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  /* --------------------------------------------------------------- observers --- */

  const resizer = new ResizeObserver(() => {
    if (disposed || !running) return;
    fit();
    invalidate();
  });
  resizer.observe(host);
  const themeWatch = new MutationObserver(() => {
    applyPalette();
    invalidate();
  });
  themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class", "style"] });
  const schemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const onScheme = () => {
    applyPalette();
    invalidate();
  };
  schemeQuery.addEventListener("change", onScheme);

  fit();
  if (variant === "route") {
    progressTarget = progressNow = 0;
  }
  invalidate();

  /* ------------------------------------------------------------------ handle --- */

  return {
    setScene(next) {
      if (!hasTable) return;
      const previous = current;
      current = next;
      for (const spec of next.phones) {
        const view = phone(spec.id);
        view.target.x = spec.x;
        view.target.z = spec.z;
        if (reduced || first) {
          view.display.x = spec.x;
          view.display.z = spec.z;
        }
      }
      for (const spec of next.phones) {
        const had = previous.copies[spec.id] !== undefined;
        const has = next.copies[spec.id] !== undefined;
        const view = phone(spec.id);
        if (first && has) view.env.pop = 1;
        if (!first && !had && has && !pending.has(spec.id) && !drag) {
          // arrived by a button press: show the envelope travelling from the nearest phone that had one
          const holders = previous.phones.filter((item) => previous.copies[item.id] !== undefined);
          const from = holders.sort((a, b) => sceneDistance(a, spec) - sceneDistance(b, spec))[0];
          pending.add(spec.id);
          const origin = from ? slot(phone(from.id)) : slot(view);
          flyCarrier(origin, slot(view), 380, () => {
            pending.delete(spec.id);
            view.env.group.visible = true;
            popIn(view.env);
            if (spec.role === "recipient" && next.copies[spec.id] !== undefined) startOpen(view.env);
          });
        }
        if (had && !has) {
          pending.delete(spec.id);
          view.env.open = 0;
          view.env.pop = 1;
        }
      }
      if (first && next.delivered) phone("recipient").env.open = 1;
      first = false;
      invalidate();
    },
    setXray(on) {
      xrayTarget = on ? 1 : 0;
      invalidate();
    },
    setProgress(value, jump = false) {
      progressTarget = clamp01(value);
      // a jump skips the smoothing, so a looping scene can start over without travelling backwards
      if (jump) progressNow = progressTarget;
      invalidate();
    },
    setZoneFocus(zone) {
      zoneFocus = zone;
      invalidate();
    },
    setYaw(yaw) {
      yawTarget = Math.max(-1.1, Math.min(1.1, yaw));
      invalidate();
    },
    setSelected(id) {
      selected = id;
      invalidate();
    },
    setRunning(value) {
      if (disposed || value === running) return;
      running = value;
      if (!running) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      } else {
        last = performance.now();
        fit();
        invalidate();
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      tweens.length = 0;
      resizer.disconnect();
      themeWatch.disconnect();
      schemeQuery.removeEventListener("change", onScheme);
      reducedQuery.removeEventListener("change", onReduced);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onCancel);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("webglcontextlost", onLost);
      disposables.forEach((item) => item.dispose());
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}

/* ------------------------------------------------------------------ route helpers --- */

function routeScene(): Scene {
  const scene = sceneStart();
  return { ...scene, phones: scene.phones.map((item) => ({ ...item, ...ROUTE_AT[item.id] })), copies: {} };
}

/** A phone holds a copy once the envelope has arrived at it. Relays keep theirs: that is the point. */
function routeHolds(id: PhoneId, progress: number) {
  const index = phoneIds.indexOf(id);
  return index === 0 || progress >= index / (phoneIds.length - 1) - 0.02;
}
