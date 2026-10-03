"use client";

import { m } from "motion/react";
import { useState } from "react";
import { spring } from "@/lib/motion";

const start = ["g", "r", "y", "b", "w", "o", "r", "g", "b"].map((colour, index) => ({ id: index, colour }));

function shuffle<T>(items: T[]) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [next[index], next[swap]] = [next[swap], next[index]];
  }
  return next;
}

/** A 3x3 face whose stickers trade places with a layout animation. Purely for fun. */
export function CubeFace() {
  const [stickers, setStickers] = useState(start);
  const [moves, setMoves] = useState(0);

  return (
    <div className="cube-wrap">
      <div className="cube-face" aria-hidden="true">
        {stickers.map((sticker) => (
          <m.i key={sticker.id} layout transition={spring.soft} className={sticker.colour} />
        ))}
      </div>
      <button
        type="button"
        className="cube-button"
        onClick={() => {
          setStickers((current) => shuffle(current));
          setMoves((count) => count + 1);
        }}
      >
        scramble{moves > 0 ? ` (${moves})` : ""}
      </button>
    </div>
  );
}
