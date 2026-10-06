"use client";

import { type ComponentType, useState } from "react";

/**
 * The 404 page's optional game, loaded only when asked for. The framework preloads the 404's
 * client code on every page, so this stays a button until someone actually wants to play.
 */
export function PacketGame() {
  const [Game, setGame] = useState<ComponentType | null>(null);
  const [loading, setLoading] = useState(false);
  if (Game) return <Game />;
  return (
    <button
      type="button"
      className="button packet-start"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        const { PacketLost } = await import("./PacketLost");
        setGame(() => PacketLost);
      }}
    >
      {loading ? "finding the packet…" : "route the packet home"}
    </button>
  );
}
