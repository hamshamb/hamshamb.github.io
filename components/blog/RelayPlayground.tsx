"use client";

import { RelayLine } from "@/components/rivet/RelayLine";
import { RelayStage } from "@/components/rivet/RelayStage";

/**
 * The post's interactive relay scene. The 3D table loads when it nears the viewport; until then a
 * static drawing explains it, and if WebGL is missing the flat line version of the same idea takes
 * its place. Either way it is a conceptual simulation, not Bluetooth.
 */
export function RelayPlayground() {
  return <RelayStage fallback={<RelayLine />} />;
}
