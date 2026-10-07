import * as THREE from "three";

/**
 * What every Rivet scene shares: the renderer (one per scene, pixel ratio clamped), the site's
 * colours read from CSS, rounded procedural shapes, and the camera fit. Loaded only through the
 * scene modules' dynamic imports, so three never reaches a page without a scene.
 */

export type Palette = {
  dark: boolean;
  plate: THREE.Color;
  raised: THREE.Color;
  surface: THREE.Color;
  bg: THREE.Color;
  fg: THREE.Color;
  fg2: THREE.Color;
  fg3: THREE.Color;
  accent: THREE.Color;
  accentInk: THREE.Color;
  /** blue: what relays read */
  open: THREE.Color;
  /** amber: visible, opens nothing */
  lab: THREE.Color;
};

let swatch: CanvasRenderingContext2D | null = null;

/** Resolves any CSS colour (hex, rgb, oklch, ...) to sRGB through a one pixel canvas. */
export function resolve(value: string, fallback: string): THREE.Color {
  swatch ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  const color = new THREE.Color();
  if (!swatch) return color.set(fallback);
  swatch.clearRect(0, 0, 1, 1);
  swatch.fillStyle = fallback;
  swatch.fillStyle = value;
  swatch.fillRect(0, 0, 1, 1);
  const [r, g, b] = swatch.getImageData(0, 0, 1, 1).data;
  return color.setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);
}

export function readPalette(): Palette {
  const style = getComputedStyle(document.documentElement);
  const pick = (name: string, fallback: string) => resolve(style.getPropertyValue(name).trim() || fallback, fallback);
  const bg = pick("--bg", "#f5f4ef");
  return {
    dark: bg.r + bg.g + bg.b < 0.9,
    plate: pick("--plate", "#e6e5dd"),
    raised: pick("--bg-raised", "#fbfaf6"),
    surface: pick("--surface", "#ecebe4"),
    bg,
    fg: pick("--fg", "#141613"),
    fg2: pick("--fg-2", "#464941"),
    fg3: pick("--fg-3", "#686b62"),
    accent: pick("--accent", "#1c7341"),
    accentInk: pick("--accent-ink", "#f5f4ef"),
    open: pick("--open", "#3c5a8a"),
    lab: pick("--lab", "#95580a"),
  };
}

/** Same hex the palette resolved, for drawing into canvases. */
export const css = (color: THREE.Color) => `#${color.getHexString(THREE.SRGBColorSpace)}`;

export function trace(path: THREE.Path, w: number, h: number, r: number) {
  const x = -w / 2;
  const y = -h / 2;
  path.moveTo(x + r, y);
  path.lineTo(x + w - r, y);
  path.quadraticCurveTo(x + w, y, x + w, y + r);
  path.lineTo(x + w, y + h - r);
  path.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  path.lineTo(x + r, y + h);
  path.quadraticCurveTo(x, y + h, x, y + h - r);
  path.lineTo(x, y + r);
  path.quadraticCurveTo(x, y, x + r, y);
  return path;
}

export const rounded = (w: number, h: number, r: number) => trace(new THREE.Shape(), w, h, r) as THREE.Shape;

/** One WebGL renderer for one scene: transparent, antialiased, pixel ratio capped at 1.5. */
export function createRenderer(host: HTMLElement, className: string, touchAction = "pan-y") {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.className = className;
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.touchAction = touchAction;
  host.appendChild(canvas);
  return renderer;
}

const probe = new THREE.Vector3();

/**
 * Moves the camera back along `direction` until every point fits inside `margin` of the frame.
 * A few passes are enough: each one corrects the distance by how far off the widest point is.
 */
export function fitCamera(camera: THREE.PerspectiveCamera, target: THREE.Vector3, direction: THREE.Vector3, points: THREE.Vector3[], margin = 0.92) {
  let distance = 20;
  const place = () => {
    camera.position.copy(direction).normalize().multiplyScalar(distance).add(target);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  };
  for (let i = 0; i < 8; i += 1) {
    place();
    let widest = 0;
    for (const point of points) {
      probe.copy(point).project(camera);
      widest = Math.max(widest, Math.abs(probe.x), Math.abs(probe.y));
    }
    distance *= Math.max(0.3, widest / margin);
  }
  place();
  return distance;
}
