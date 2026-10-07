import * as THREE from "three";
import { type PieceId, PIECES, type Pose, rest, SIZE, stageEnd, type Scalars, TILES, pieceField } from "./envelope-parts";
import { createRenderer, css, fitCamera, type Palette, readPalette, rounded } from "./three-kit";

/**
 * The exploded envelope, rendered. Every piece is its own group with its own pose, so the figure's
 * Anime.js timelines can move each one independently: the header lifts, its tiles fan out, the
 * key and the nonce leave from opposite corners, the letter folds, encrypts, slides in and out.
 * This module owns no timing at all. It reads `rig` (which Anime.js animates) and renders, only
 * when asked to, only while on screen. Procedural geometry and canvas textures only.
 */

export type Rig = {
  /** every piece's offset from rest, plus how strongly it is singled out */
  pieces: Record<PieceId, Pose & { lit: number }>;
  /** how much everything that is not lit fades back */
  dim: number;
  s: Scalars;
  /** the letter's layers shown standing off the folded letter (exploded view) */
  layersOut: number;
  /** the encryption sweep across the letter, 0 top to 1 bottom; outside that it is hidden */
  wash: number;
  /** the whole envelope: travels and shrinks in relay mode */
  env: { x: number; y: number; z: number; s: number };
  /** framing: what the camera fits (centre y and a size) */
  view: { y: number; w: number; h: number };
  /** drag offsets and the slow idle sway, radians */
  orbit: { yaw: number; pitch: number };
  idle: number;
  /** id cards when two relays meet: shown, duplicates bounced back, the missing one sent */
  meet: { show: number; dup: number; send: number };
  /** which phone is reading the header right now (-1 none) */
  reading: number;
};

export type Anchor = { x: number; y: number; visible: boolean };
export type EnvelopeEvents = {
  hover?(field: string | null): void;
  select?(field: string): void;
  project?(anchors: Record<string, Anchor>): void;
  drag?(active: boolean): void;
  lost?(): void;
};
export type EnvelopeHandle = {
  rig: Rig;
  invalidate(): void;
  setRunning(running: boolean): void;
  setHops(hops: number): void;
  dispose(): void;
};

/** The presentation angle: three quarters, a little from above. Drag adds to it, within limits. */
export const BASE = { yaw: -0.5, pitch: 0.2 };
export const ORBIT_LIMIT = { yaw: (25 * Math.PI) / 180, pitch: (12 * Math.PI) / 180 };

export function initialRig(): Rig {
  const pieces = {} as Rig["pieces"];
  for (const id of PIECES) pieces[id] = { ...rest(), lit: 0 };
  return {
    pieces,
    dim: 0,
    s: stageEnd("seal"),
    layersOut: 0,
    wash: -1,
    env: { x: 0, y: 0, z: 0, s: 1 },
    view: { y: 0, w: 5.6, h: 3.6 },
    orbit: { yaw: 0, pitch: 0 },
    idle: 0,
    meet: { show: 0, dup: 0, send: 0 },
    reading: -1,
  };
}

const PHONE_X = [-4.6, -1.55, 1.55, 4.6];
const PHONE_Y = -2.75;
const LETTER_OUT = new THREE.Vector3(0, 3.05, 0.35);
const LETTER_IN = new THREE.Vector3(0, 0.02, 0);
const FONT = '"JetBrains Mono Variable", ui-monospace, monospace';
const SANS = '"Schibsted Grotesk Variable", ui-sans-serif, system-ui, sans-serif';

/* -------------------------------------------------------------- textures --- */

type Painter = (ctx: CanvasRenderingContext2D, w: number, h: number, p: Palette) => void;

/** The letter is paper in both themes, so what is written on it is always graphite ink. */
const INK = "#22241f";
const INK_SOFT = "#5d6158";

function makeCanvas(w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

/** Structured, offset blocks: what encrypted text looks like here. No binary rain. */
function cipherRows(ctx: CanvasRenderingContext2D, w: number, h: number, rows: number, color: string, seed: number) {
  let s = seed;
  const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  ctx.fillStyle = color;
  const lineH = h / rows;
  for (let r = 0; r < rows; r += 1) {
    let x = w * 0.06 + rand() * w * 0.04;
    const y = r * lineH + lineH * 0.34;
    while (x < w * 0.92) {
      const bw = w * (0.03 + rand() * 0.09);
      ctx.globalAlpha = 0.45 + rand() * 0.4;
      ctx.fillRect(x, y + (rand() - 0.5) * lineH * 0.12, Math.min(bw, w * 0.94 - x), lineH * 0.3);
      x += bw + w * (0.012 + rand() * 0.02);
    }
  }
  ctx.globalAlpha = 1;
}

const painters: Record<string, Painter> = {
  senderPlain: (ctx, w, h) => {
    ctx.fillStyle = INK_SOFT;
    ctx.font = `600 ${h * 0.26}px ${FONT}`;
    ctx.fillText("from: sender keys", w * 0.06, h * 0.38);
    ctx.strokeStyle = INK;
    ctx.lineWidth = h * 0.05;
    ctx.beginPath();
    // a signature, drawn once
    ctx.moveTo(w * 0.58, h * 0.72);
    ctx.bezierCurveTo(w * 0.62, h * 0.4, w * 0.66, h * 0.95, w * 0.7, h * 0.62);
    ctx.bezierCurveTo(w * 0.74, h * 0.35, w * 0.77, h * 0.85, w * 0.82, h * 0.6);
    ctx.lineTo(w * 0.93, h * 0.55);
    ctx.stroke();
    ctx.fillStyle = INK_SOFT;
    ctx.font = `500 ${h * 0.2}px ${FONT}`;
    ctx.fillText("signed", w * 0.06, h * 0.78);
  },
  senderCipher: (ctx, w, h, p) => cipherRows(ctx, w, h, 2, css(p.accent), 11),
  messagePlain: (ctx, w, h) => {
    ctx.fillStyle = INK;
    ctx.font = `500 ${h * 0.17}px ${SANS}`;
    const lines = ["meet me by the old", "station at six.", "bring the map."];
    lines.forEach((line, i) => ctx.fillText(line, w * 0.06, h * (0.28 + i * 0.27)));
  },
  messageCipher: (ctx, w, h, p) => cipherRows(ctx, w, h, 3, css(p.accent), 23),
  paddingPlain: (ctx, w, h) => {
    ctx.strokeStyle = INK_SOFT;
    ctx.setLineDash([w * 0.03, w * 0.02]);
    ctx.lineWidth = h * 0.05;
    for (let r = 0; r < 3; r += 1) {
      ctx.beginPath();
      ctx.moveTo(w * 0.06, h * (0.25 + r * 0.25));
      ctx.lineTo(w * 0.94, h * (0.25 + r * 0.25));
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.fillStyle = INK_SOFT;
    ctx.font = `500 ${h * 0.15}px ${FONT}`;
    ctx.fillText("padding", w * 0.06, h * 0.96);
  },
  paddingCipher: (ctx, w, h, p) => cipherRows(ctx, w, h, 3, css(p.accent), 37),
  key: (ctx, w, h, p) => {
    ctx.strokeStyle = css(p.open);
    ctx.lineWidth = h * 0.03;
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.moveTo(w * 0.12, h * (0.3 + i * 0.13));
      ctx.lineTo(w * (0.5 + (i % 2) * 0.3), h * (0.3 + i * 0.13));
      ctx.stroke();
    }
    ctx.fillStyle = css(p.open);
    ctx.font = `700 ${h * 0.2}px ${FONT}`;
    ctx.fillText("KEY", w * 0.12, h * 0.2);
  },
  nonce: (ctx, w, h, p) => {
    ctx.fillStyle = css(p.lab);
    for (let i = 0; i < 18; i += 1) ctx.fillRect(w * (0.08 + (i % 9) * 0.1), h * (0.55 + Math.floor(i / 9) * 0.2), w * 0.05, h * 0.1);
  },
};

/* ------------------------------------------------------------------ build --- */

export function createEnvelopeScene(host: HTMLElement, events: EnvelopeEvents): EnvelopeHandle {
  const renderer = createRenderer(host, "envx-canvas", "pan-y");
  const canvas = renderer.domElement;
  const three = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.5, 80);
  const disposables: { dispose(): void }[] = [renderer];
  const track = <T extends { dispose(): void }>(item: T) => {
    disposables.push(item);
    return item;
  };
  let palette = readPalette();

  three.add(new THREE.HemisphereLight(0xffffff, 0x9a9a9a, 0.62 * Math.PI));
  const key = new THREE.DirectionalLight(0xffffff, 0.55 * Math.PI);
  key.position.set(-3, 5, 7);
  const fill = new THREE.DirectionalLight(0xffffff, 0.18 * Math.PI);
  fill.position.set(5, -2, 4);
  three.add(key, fill);

  /** the presentation group: base angle, drag, idle sway. Everything lives inside it. */
  const stage = new THREE.Group();
  three.add(stage);
  const envRoot = new THREE.Group();
  stage.add(envRoot);

  const rig = initialRig();
  const holders = {} as Record<PieceId, THREE.Group>;
  const poses = {} as Record<PieceId, THREE.Group>;
  const solid = {} as Record<PieceId, THREE.MeshLambertMaterial[]>;
  const lines = {} as Record<PieceId, THREE.LineBasicMaterial[]>;
  const picks: THREE.Object3D[] = [];

  const lineMat = (piece: PieceId) => {
    const material = track(new THREE.LineBasicMaterial({ transparent: true }));
    (lines[piece] ??= []).push(material);
    return material;
  };
  const solidMat = (piece: PieceId, options: THREE.MeshLambertMaterialParameters = {}) => {
    const material = track(new THREE.MeshLambertMaterial({ transparent: true, ...options }));
    (solid[piece] ??= []).push(material);
    return material;
  };

  /** A rounded plate centred on z = 0, with its outline drawn as technical line art. */
  function plate(piece: PieceId, w: number, h: number, t: number, r: number, material?: THREE.Material) {
    const geometry = track(new THREE.ExtrudeGeometry(rounded(w, h, r), { depth: t, bevelEnabled: false, curveSegments: 5 }));
    geometry.translate(0, 0, -t / 2);
    const mesh = new THREE.Mesh(geometry, material ?? solidMat(piece));
    mesh.userData.piece = piece;
    picks.push(mesh);
    const edges = new THREE.LineSegments(track(new THREE.EdgesGeometry(geometry, 30)), lineMat(piece));
    const group = new THREE.Group();
    group.add(mesh, edges);
    return group;
  }

  /** A flat textured layer (text, cipher blocks) that can crossfade. */
  const layers: { plain: THREE.MeshBasicMaterial; cipher: THREE.MeshBasicMaterial; sheet: THREE.MeshLambertMaterial; edge: THREE.LineBasicMaterial; paint: [string, string]; canvas: [HTMLCanvasElement, HTMLCanvasElement]; tex: [THREE.CanvasTexture, THREE.CanvasTexture]; piece: PieceId }[] = [];
  function textLayer(piece: PieceId, w: number, h: number, paint: [string, string]) {
    const px = 512;
    const canvases: [HTMLCanvasElement, HTMLCanvasElement] = [makeCanvas(px, Math.round((px * h) / w)), makeCanvas(px, Math.round((px * h) / w))];
    const tex = canvases.map((c) => {
      const texture = track(new THREE.CanvasTexture(c));
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
      return texture;
    }) as [THREE.CanvasTexture, THREE.CanvasTexture];
    const plain = track(new THREE.MeshBasicMaterial({ map: tex[0], transparent: true, depthWrite: false }));
    const cipher = track(new THREE.MeshBasicMaterial({ map: tex[1], transparent: true, depthWrite: false }));
    const geometry = track(new THREE.PlaneGeometry(w, h));
    const sheetGeo = track(new THREE.PlaneGeometry(w + 0.12, h + 0.1));
    const sheet = track(new THREE.MeshLambertMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    const edge = track(new THREE.LineBasicMaterial({ transparent: true }));
    const back = new THREE.Mesh(sheetGeo, sheet);
    back.position.z = -0.004;
    const outline = new THREE.LineSegments(track(new THREE.EdgesGeometry(sheetGeo)), edge);
    outline.position.z = -0.003;
    const a = new THREE.Mesh(geometry, plain);
    const b = new THREE.Mesh(geometry, cipher);
    b.position.z = 0.001;
    a.userData.piece = b.userData.piece = back.userData.piece = piece;
    picks.push(back, a, b);
    layers.push({ plain, cipher, sheet, edge, paint, canvas: canvases, tex, piece });
    const group = new THREE.Group();
    group.add(back, outline, a, b);
    return group;
  }

  function piece(id: PieceId, parent: THREE.Object3D, at: [number, number, number]) {
    const holder = new THREE.Group();
    holder.position.set(...at);
    const pose = new THREE.Group();
    holder.add(pose);
    parent.add(holder);
    holders[id] = holder;
    poses[id] = pose;
    return pose;
  }

  /* the shell: a back, a front pocket with its fold lines, a flap and a seal */
  const { w: SW, h: SH, t: ST } = SIZE.shell;
  const shell = piece("shell", envRoot, [0, 0, 0]);
  const back = plate("shell", SW, SH, ST * 0.4, 0.08);
  back.position.z = -ST * 0.35;
  const front = plate("shell", SW, SH * 0.98, ST * 0.3, 0.08);
  front.position.set(0, -SH * 0.01, ST * 0.3);
  const folds = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-SW / 2 + 0.06, -SH / 2 + 0.06, 0), new THREE.Vector3(0, -0.12, 0),
    new THREE.Vector3(SW / 2 - 0.06, -SH / 2 + 0.06, 0), new THREE.Vector3(0, -0.12, 0),
  ]);
  const foldLines = new THREE.LineSegments(track(folds), lineMat("shell"));
  foldLines.position.z = ST * 0.46;
  shell.add(back, front, foldLines);

  const flapShape = new THREE.Shape();
  flapShape.moveTo(-SW / 2 + 0.02, 0);
  flapShape.lineTo(SW / 2 - 0.02, 0);
  flapShape.quadraticCurveTo(0.25, -SH * 0.5, 0, -SH * 0.56);
  flapShape.quadraticCurveTo(-0.25, -SH * 0.5, -SW / 2 + 0.02, 0);
  const flapGeo = track(new THREE.ExtrudeGeometry(flapShape, { depth: 0.025, bevelEnabled: false, curveSegments: 8 }));
  const flapPivot = piece("flap", envRoot, [0, SH / 2 - 0.02, ST * 0.48]);
  const flapMesh = new THREE.Mesh(flapGeo, solidMat("flap"));
  flapMesh.userData.piece = "flap";
  flapPivot.add(flapMesh, new THREE.LineSegments(track(new THREE.EdgesGeometry(flapGeo, 30)), lineMat("flap")));

  const sealGeo = track(new THREE.CylinderGeometry(0.17, 0.17, 0.06, 32));
  sealGeo.rotateX(Math.PI / 2);
  const seal = piece("seal", flapPivot, [0, -SH * 0.56 + 0.2, 0.06]);
  const sealMesh = new THREE.Mesh(sealGeo, solidMat("seal"));
  const sealRing = new THREE.LineSegments(track(new THREE.EdgesGeometry(sealGeo, 30)), lineMat("seal"));
  seal.add(sealMesh, sealRing);

  /* the header: an address label on the front, holding five separate tiles */
  const H = SIZE.header;
  const header = piece("header", envRoot, [H.x, H.y, ST * 0.62]);
  header.add(plate("header", H.w, H.h, 0.03, 0.05));
  const tileCanvases: Record<string, { canvas: HTMLCanvasElement; tex: THREE.CanvasTexture; text: string }> = {};
  let x = -H.w / 2 + 0.1;
  for (const tile of TILES) {
    const pose = piece(tile.id, header, [x + tile.w / 2, 0, 0.04]);
    const c = makeCanvas(256, Math.round((256 * 0.42) / tile.w));
    const tex = track(new THREE.CanvasTexture(c));
    tex.colorSpace = THREE.SRGBColorSpace;
    tileCanvases[tile.id] = { canvas: c, tex, text: tile.text };
    pose.add(plate(tile.id, tile.w, 0.42, 0.04, 0.04, solidMat(tile.id, { map: tex })));
    x += tile.w + 0.06;
  }

  /* the ephemeral key (a cool translucent card, like a stamp) and the nonce wafer beneath it */
  const keyCanvas = makeCanvas(256, 186);
  const keyTex = track(new THREE.CanvasTexture(keyCanvas));
  keyTex.colorSpace = THREE.SRGBColorSpace;
  const keyPose = piece("key", envRoot, [SIZE.key.x, SIZE.key.y, ST * 0.74]);
  keyPose.add(plate("key", SIZE.key.w, SIZE.key.h, 0.02, 0.05, solidMat("key", { map: keyTex, opacity: 0.82 })));
  const nonceCanvas = makeCanvas(256, 150);
  const nonceTex = track(new THREE.CanvasTexture(nonceCanvas));
  nonceTex.colorSpace = THREE.SRGBColorSpace;
  const noncePose = piece("nonce", envRoot, [SIZE.nonce.x, SIZE.nonce.y, ST * 0.6]);
  noncePose.add(plate("nonce", SIZE.nonce.w, SIZE.nonce.h, 0.012, 0.03, solidMat("nonce", { map: nonceTex, opacity: 0.7 })));
  noncePose.rotation.z = 0.08;

  /* the letter: three panels that fold, and its three layers */
  const L = SIZE.letter;
  const letter = piece("letter", envRoot, [0, 0, 0]);
  const letterRig = new THREE.Group();
  letter.add(letterRig);
  const panel = () => plate("letter", L.w, L.panel, 0.012, 0.03);
  const panelB = panel();
  const pivotA = new THREE.Group();
  pivotA.position.y = L.panel / 2;
  const panelA = panel();
  panelA.position.set(0, L.panel / 2, 0.012);
  pivotA.add(panelA);
  const pivotC = new THREE.Group();
  pivotC.position.y = -L.panel / 2;
  const panelC = panel();
  panelC.position.set(0, -L.panel / 2, -0.012);
  pivotC.add(panelC);
  letterRig.add(panelB, pivotA, pivotC);
  const layerAt: Record<"sender" | "message" | "padding", [number, number, number, number, number]> = {
    sender: [0, L.panel * 1.2, 0.03, 3.0, 0.5],
    message: [0, L.panel * 0.18, 0.03, 3.0, 1.15],
    padding: [0, -L.panel * 1.0, 0.03, 3.0, 0.9],
  };
  for (const [id, [lx, ly, lz, lw, lh]] of Object.entries(layerAt) as ["sender" | "message" | "padding", (typeof layerAt)["sender"]][]) {
    const pose = piece(id, letterRig, [lx, ly, lz]);
    pose.add(textLayer(id, lw, lh, [`${id}Plain`, `${id}Cipher`]));
  }
  const washMat = track(new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false }));
  const wash = new THREE.Mesh(track(new THREE.PlaneGeometry(L.w * 1.02, 0.05)), washMat);
  wash.position.z = 0.05;
  letterRig.add(wash);

  /* relay mode: four phones, and the id cards two relays trade */
  const phoneGeo = track(new THREE.ExtrudeGeometry(rounded(1.05, 1.95, 0.2), { depth: 0.12, bevelEnabled: false, curveSegments: 6 }));
  const phoneEdges = track(new THREE.EdgesGeometry(phoneGeo, 30));
  const screenGeo = track(new THREE.PlaneGeometry(0.82, 1.55));
  const phoneMat = track(new THREE.MeshLambertMaterial({ transparent: true }));
  const phoneLine = track(new THREE.LineBasicMaterial({ transparent: true }));
  const screens = PHONE_X.map(() => track(new THREE.MeshBasicMaterial({ transparent: true })));
  const phones = PHONE_X.map((px, i) => {
    const group = new THREE.Group();
    group.position.set(px, PHONE_Y, -0.6);
    group.rotation.x = -1.05;
    const screen = new THREE.Mesh(screenGeo, screens[i]);
    screen.position.z = 0.125;
    group.add(new THREE.Mesh(phoneGeo, phoneMat), new THREE.LineSegments(phoneEdges, phoneLine), screen);
    stage.add(group);
    return group;
  });
  const cardGeo = track(new THREE.PlaneGeometry(0.62, 0.34));
  const cards = [0, 1, 2].map(() => {
    const c = makeCanvas(192, 106);
    const tex = track(new THREE.CanvasTexture(c));
    tex.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(cardGeo, track(new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })));
    stage.add(mesh);
    return { mesh, canvas: c, tex };
  });

  /* --------------------------------------------------------------- palette --- */

  const tint = (a: THREE.Color, b: THREE.Color, k: number) => a.clone().lerp(b, k);
  let paper = new THREE.Color();
  let sealed = new THREE.Color();

  function paint(canvasEl: HTMLCanvasElement, painter: Painter) {
    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    painter(ctx, canvasEl.width, canvasEl.height, palette);
  }

  function drawTile(id: string) {
    const { canvas: c, tex, text } = tileCanvases[id];
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = palette.dark ? "#c9d3e4" : "#e4eaf4";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = palette.dark ? "#26406b" : css(palette.open);
    ctx.font = `700 ${c.height * 0.42}px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, c.width / 2, c.height / 2 + 2);
    tex.needsUpdate = true;
  }

  function drawCards() {
    const ids = ["07c9", "9d40", "e5b2"];
    cards.forEach(({ canvas: c, tex }, i) => {
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = css(palette.raised);
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.strokeStyle = css(i === 2 ? palette.accent : palette.open);
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, c.width - 6, c.height - 6);
      ctx.fillStyle = css(palette.fg);
      ctx.font = `700 ${c.height * 0.4}px ${FONT}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ids[i], c.width / 2, c.height / 2);
      tex.needsUpdate = true;
    });
  }

  function applyPalette() {
    palette = readPalette();
    paper = new THREE.Color(palette.dark ? "#e4dfd2" : "#fbf8f0");
    sealed = new THREE.Color(palette.dark ? "#1f2b24" : "#d9e4dc");
    const shellColor = new THREE.Color(palette.dark ? "#3a3c37" : "#ebe5d6");
    const flapColor = new THREE.Color(palette.dark ? "#45473f" : "#e2dbca");
    for (const id of PIECES) {
      for (const material of solid[id] ?? []) {
        if (material.map === keyTex) material.color.set(palette.dark ? "#8fb0e0" : "#c9d9f2");
        else if (material.map === nonceTex) material.color.set(palette.dark ? "#d9a85a" : "#f2d39d");
        else if (material.map) material.color.set(0xffffff);
        else if (id === "seal") material.color.copy(palette.accent);
        else if (id === "header") material.color.copy(new THREE.Color(palette.dark ? "#d5dbe6" : "#f3f5f9"));
        else if (id === "letter") material.color.copy(paper);
        else if (id === "flap") material.color.copy(flapColor);
        else material.color.copy(shellColor);
      }
      for (const material of lines[id] ?? []) material.color.copy(palette.dark ? palette.fg2 : palette.fg2);
    }
    for (const layer of layers) {
      paint(layer.canvas[0], painters[layer.paint[0]]);
      paint(layer.canvas[1], painters[layer.paint[1]]);
      layer.tex[0].needsUpdate = layer.tex[1].needsUpdate = true;
    }
    paint(keyCanvas, painters.key);
    paint(nonceCanvas, painters.nonce);
    keyTex.needsUpdate = nonceTex.needsUpdate = true;
    for (const id of Object.keys(tileCanvases)) drawTile(id);
    drawCards();
    washMat.color.copy(palette.accent);
    for (const layer of layers) layer.edge.color.copy(palette.dark ? palette.fg2 : palette.fg2);
    phoneMat.color.copy(tint(palette.raised, palette.fg, palette.dark ? 0.1 : 0.04));
    phoneLine.color.copy(palette.dark ? palette.fg3 : palette.fg2);
  }
  applyPalette();

  /* ----------------------------------------------------------------- apply --- */

  const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

  function apply() {
    const { s } = rig;
    stage.rotation.set(BASE.pitch + rig.orbit.pitch, BASE.yaw + rig.orbit.yaw + rig.idle * 0.05, 0);
    envRoot.position.set(rig.env.x, rig.env.y, rig.env.z);
    envRoot.scale.setScalar(rig.env.s);

    for (const id of PIECES) {
      const p = rig.pieces[id];
      const pose = poses[id];
      pose.position.set(p.x, p.y, p.z);
      pose.rotation.set(p.rx, p.ry, p.rz);
      pose.scale.setScalar(Math.max(p.s, 0.0001));
      const fade = 1 - rig.dim * (1 - p.lit) * 0.72;
      for (const material of solid[id] ?? []) {
        material.opacity = p.o * fade * (material.map === keyTex ? 0.82 : material.map === nonceTex ? 0.7 : 1);
        material.emissive.copy(palette.accent).multiplyScalar(p.lit * 0.18);
      }
      for (const material of lines[id] ?? []) material.opacity = p.o * fade * (0.8 + p.lit * 0.2);
    }

    // the flap swings on its hinge; the seal grows in (or releases) at its tip
    poses.flap.rotation.x += -s.flap * 2.55;
    poses.seal.scale.multiplyScalar(Math.max(s.seal, 0.0001));
    // the relay reads the header: it lights, and nothing else does
    for (const material of [...(solid.header ?? []), ...TILES.flatMap((tile) => solid[tile.id] ?? [])]) {
      material.emissive.add(palette.open.clone().multiplyScalar(s.read * 0.35));
    }

    // the letter: folds in three, slides in or out, and goes dark as it is encrypted
    pivotA.rotation.x = Math.PI * s.fold;
    pivotC.rotation.x = Math.PI * s.fold;
    letterRig.position.lerpVectors(LETTER_OUT, LETTER_IN, s.inside);
    const sealedness = (s.cipher.sender + s.cipher.message + s.cipher.padding) / 3;
    for (const material of solid.letter ?? []) material.color.copy(paper).lerp(sealed, sealedness * 0.9);
    const shown = Math.max(1 - s.fold, rig.layersOut);
    for (const layer of layers) {
      const p = rig.pieces[layer.piece];
      const k = s.cipher[layer.piece as "sender" | "message" | "padding"];
      const fade = (1 - rig.dim * (1 - p.lit) * 0.72) * p.o * shown;
      const apart = layer.piece === "padding" ? 1 - s.apart * 0.55 : 1;
      layer.plain.opacity = (1 - k) * fade * apart;
      layer.cipher.opacity = k * fade;
      // the sheet itself only shows once the layer stands off the letter
      const off = rig.layersOut * fade;
      layer.sheet.opacity = off;
      layer.sheet.color.copy(paper).lerp(sealed, k * 0.9);
      layer.edge.opacity = off * 0.8;
    }
    if (s.apart > 0) poses.padding.position.y -= s.apart * 0.4;
    wash.visible = rig.wash >= 0 && rig.wash <= 1;
    wash.position.y = lerp(L.panel * 1.5, -L.panel * 1.5, rig.wash);
    washMat.opacity = 0.55;

    // phones and the id cards
    phoneMat.opacity = phoneLine.opacity = s.phones;
    phones.forEach((group, i) => {
      group.visible = s.phones > 0.01;
      screens[i].color.copy(rig.reading === i ? palette.open : palette.dark ? palette.bg : palette.surface);
      screens[i].opacity = s.phones;
    });
    const meetFrom = new THREE.Vector3(PHONE_X[1] + 0.2, PHONE_Y + 1.5, 0.3);
    const meetTo = new THREE.Vector3(PHONE_X[2] - 0.2, PHONE_Y + 1.5, 0.3);
    cards.forEach(({ mesh }, i) => {
      mesh.visible = rig.meet.show > 0.01;
      const travel = i === 2 ? rig.meet.send : rig.meet.dup * 0.55;
      mesh.position.lerpVectors(meetFrom, meetTo, travel);
      mesh.position.y += i * 0.42 - 0.42;
      (mesh.material as THREE.MeshBasicMaterial).opacity = rig.meet.show * (i === 2 ? 1 : 1 - rig.meet.dup * 0.7);
    });
  }

  /* --------------------------------------------------------------- framing --- */

  let width = 1;
  let height = 1;
  const target = new THREE.Vector3();
  const direction = new THREE.Vector3(0, 0.22, 1);
  function frame() {
    const { y, w, h } = rig.view;
    target.set(0, y, 0);
    const pts = [-1, 1].flatMap((sx) => [-1, 1].map((sy) => new THREE.Vector3((sx * w) / 2, y + (sy * h) / 2, 0)));
    fitCamera(camera, target, direction, pts, 0.84);
  }
  function resize() {
    const rect = host.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
  }

  const probe = new THREE.Vector3();
  const toScreen = (object: THREE.Object3D, offset = new THREE.Vector3()) => {
    probe.copy(offset);
    object.localToWorld(probe);
    probe.project(camera);
    return { x: (probe.x * 0.5 + 0.5) * width, y: (-probe.y * 0.5 + 0.5) * height, visible: probe.z < 1 && Math.abs(probe.x) <= 1.1 && Math.abs(probe.y) <= 1.1 };
  };
  function emitProject() {
    if (!events.project) return;
    const anchors: Record<string, Anchor> = {};
    for (const id of PIECES) anchors[id] = toScreen(poses[id]);
    phones.forEach((group, i) => (anchors[`phone:${i}`] = toScreen(group, new THREE.Vector3(0, -1.2, 0))));
    events.project(anchors);
  }

  /* ---------------------------------------------------------------- render --- */

  let running = true;
  let disposed = false;
  let raf = 0;
  let lastFrameKey = "";
  function draw() {
    raf = 0;
    if (disposed || !running) return;
    apply();
    const key = `${rig.view.y}|${rig.view.w}|${rig.view.h}|${width}|${height}`;
    if (key !== lastFrameKey) {
      frame();
      lastFrameKey = key;
    }
    renderer.render(three, camera);
    emitProject();
  }
  function invalidate() {
    if (!raf && running && !disposed) raf = requestAnimationFrame(draw);
  }

  /* ----------------------------------------------------------------- input --- */

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let drag: { id: number; x: number; y: number; yaw: number; pitch: number; moved: boolean } | null = null;
  let hovered: string | null = null;

  function fieldAt(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    for (const hit of raycaster.intersectObjects(picks, false)) {
      const id = hit.object.userData.piece as PieceId | undefined;
      const material = (hit.object as THREE.Mesh).material as THREE.Material & { opacity: number };
      if (!id || material.opacity < 0.2) continue;
      const field = pieceField[id];
      if (field) return field;
    }
    return null;
  }

  const clampTo = (v: number, limit: number) => Math.max(-limit, Math.min(limit, v));
  const onDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, yaw: rig.orbit.yaw, pitch: rig.orbit.pitch, moved: false };
  };
  const onMove = (event: PointerEvent) => {
    if (drag && event.pointerId === drag.id) {
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) > 5) {
        drag.moved = true;
        canvas.setPointerCapture(event.pointerId);
        events.drag?.(true);
      }
      if (drag.moved) {
        rig.orbit.yaw = clampTo(drag.yaw + dx * 0.006, ORBIT_LIMIT.yaw);
        rig.orbit.pitch = clampTo(drag.pitch + dy * 0.004, ORBIT_LIMIT.pitch);
        invalidate();
      }
      return;
    }
    if (event.pointerType !== "mouse") return;
    const field = fieldAt(event.clientX, event.clientY);
    canvas.style.cursor = field ? "pointer" : "grab";
    if (field !== hovered) {
      hovered = field;
      events.hover?.(field);
    }
  };
  const onUp = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.id) return;
    const moved = drag.moved;
    drag = null;
    if (moved) {
      events.drag?.(false);
      return;
    }
    const field = fieldAt(event.clientX, event.clientY);
    if (field) events.select?.(field);
  };
  const onLeave = () => {
    if (hovered !== null) {
      hovered = null;
      events.hover?.(null);
    }
  };
  const onLost = (event: Event) => {
    event.preventDefault();
    events.lost?.();
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("pointerleave", onLeave);
  canvas.addEventListener("webglcontextlost", onLost);

  const resizer = new ResizeObserver(() => {
    resize();
    lastFrameKey = "";
    invalidate();
  });
  resizer.observe(host);
  const theme = new MutationObserver(() => {
    applyPalette();
    invalidate();
  });
  theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const scheme = window.matchMedia("(prefers-color-scheme: dark)");
  const onScheme = () => {
    applyPalette();
    invalidate();
  };
  scheme.addEventListener("change", onScheme);
  document.fonts?.ready.then(() => {
    if (disposed) return;
    applyPalette();
    invalidate();
  });

  resize();
  invalidate();

  return {
    rig,
    invalidate,
    setRunning(next) {
      if (disposed || next === running) return;
      running = next;
      if (!running && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      if (running) invalidate();
    },
    setHops(hops) {
      const tile = tileCanvases["tile-hops"];
      tile.text = `${Math.round(hops)}/6`;
      drawTile("tile-hops");
      invalidate();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      resizer.disconnect();
      theme.disconnect();
      scheme.removeEventListener("change", onScheme);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("webglcontextlost", onLost);
      disposables.forEach((item) => item.dispose());
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
