"use client";

import { type PointerEvent, useState } from "react";
import { achieve, discover, toast, unlockToy } from "@/lib/secrets";
import { openToy } from "@/lib/toys";

const DODGES = 5;

/**
 * "do not click". A mouse pointer that comes close makes it step aside, a few times, then it
 * gives up. Keyboard and touch users can simply press it: nobody has to chase anything.
 */
export function DoNotClick() {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dodges, setDodges] = useState(0);
  const [won, setWon] = useState(false);

  const flee = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== "mouse" || dodges >= DODGES || won) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = event.currentTarget.getBoundingClientRect();
    const dx = event.clientX - (box.left + box.width / 2);
    setOffset((value) => ({ x: value.x - Math.sign(dx || 1) * 28, y: value.y + (dodges % 2 ? 6 : -6) }));
    setDodges(dodges + 1);
  };

  return (
    <button
      type="button"
      className="do-not-click mono"
      data-won={won || undefined}
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      onPointerEnter={flee}
      onClick={() => {
        if (won) return;
        setWon(true);
        setOffset({ x: 0, y: 0 });
        toast("fine. you win.");
        discover("do-not-click");
        achieve("fine-you-win");
        // clearly a person who needs something to click: here is a panel where that is allowed
        unlockToy("fidget");
        window.setTimeout(() => openToy("fidget"), 900);
      }}
    >
      {won ? "you clicked it" : "do not click"}
    </button>
  );
}
