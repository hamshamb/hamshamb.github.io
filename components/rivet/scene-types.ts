import type { PhoneId, Scene } from "@/lib/relay-sim";

/**
 * The contract between the React side and the three.js side of the Rivet scenes. This file has no
 * runtime code and never imports three, so any component can import it without pulling the
 * renderer into its chunk.
 */

/** route: a scroll-driven walk through the mesh. relay: the drag-and-drop table. envelope: one envelope, large. */
export type SceneVariant = "route" | "relay" | "envelope";

/** The three regions of a sealed envelope, as the protocol notes describe them. */
export type Zone = "header" | "outer" | "sealed";

export type Anchor = { x: number; y: number; visible: boolean };
/** Screen positions in CSS pixels, relative to the scene's host element. Keys: a phone id, or `env:<phone id>`. */
export type AnchorMap = Record<string, Anchor>;

export interface SceneEvents {
  /** A phone is being dragged. The scene asks; React clamps and answers with `setScene`. */
  movePhone?(id: PhoneId, x: number, z: number): void;
  /** The envelope was let go. `to` is the phone it was dropped on, or null for anywhere else. Returns whether a copy moved. */
  dropEnvelope?(from: PhoneId, to: PhoneId | null): boolean;
  /** Called after every render, so HTML labels can follow the 3D points they belong to. */
  project?(anchors: AnchorMap): void;
  /** What the visitor is holding right now, if anything. */
  grab?(held: { kind: "phone" | "envelope"; id: PhoneId } | null): void;
  /** The WebGL context was lost. The fallback should take over. */
  lost?(): void;
}

export interface SceneHandle {
  setScene(scene: Scene): void;
  /** Shell turns translucent and the documented fields show inside. */
  setXray(on: boolean): void;
  /** route variant: 0 is the sender, 1 is the recipient. */
  setProgress(progress: number): void;
  /** envelope variant: which region to light up. */
  setZoneFocus(zone: Zone | null): void;
  /** envelope variant: turn the envelope, in radians from its resting angle. */
  setYaw(yaw: number): void;
  setSelected(id: PhoneId | null): void;
  /** Off screen or in a hidden tab, the scene stops rendering entirely. */
  setRunning(running: boolean): void;
  dispose(): void;
}

/** On a tall, narrow stage the table is turned a quarter so its long side runs down the screen. */
export const isPortraitStage = (width: number, height: number) => height > 0 && width / height < 0.95;

/** A screen direction (left, right, away, toward) as a step on the table, for whichever way it is turned. */
export function screenStep(direction: "left" | "right" | "up" | "down", portrait: boolean): { x: number; z: number } {
  if (!portrait) {
    return { left: { x: -1, z: 0 }, right: { x: 1, z: 0 }, up: { x: 0, z: -1 }, down: { x: 0, z: 1 } }[direction];
  }
  return { left: { x: 0, z: 1 }, right: { x: 0, z: -1 }, up: { x: -1, z: 0 }, down: { x: 1, z: 0 } }[direction];
}
