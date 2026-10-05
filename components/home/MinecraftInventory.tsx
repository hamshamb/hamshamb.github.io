"use client";

import { useState } from "react";
import { discover } from "@/lib/secrets";
import { AppLink as Link } from "../ui/AppLink";

/**
 * A pixel inventory hidden behind a tiny chest in the Minecraft card. Original 8x8 drawings,
 * not game textures. Put minecraft, java and the networking docs on the crafting grid and you
 * get roughly how Nexus happened.
 */

type ItemId = "minecraft" | "java" | "docs" | "pickaxe" | "cube" | "laptop" | "packet" | "unfinished" | "cable";

/** Each item is an 8x8 grid: one character per pixel, mapped to a colour class. */
const items: Record<ItemId, { name: string; px: string[] }> = {
  minecraft: { name: "a grass block", px: ["gggggggg", "gGgggGgg", "dgddgdgd", "dddddddd", "ddDdddDd", "dddddddd", "dDddddDd", "dddddddd"] },
  java: { name: "a cup of java", px: ["..s.s...", "...s.s..", "........", "wwwwww..", "wbbbbwww", "wbbbbw.w", "wbbbbwww", "wwwwww.."] },
  docs: { name: "networking documentation", px: ["pppppp..", "pkkkkp..", "pppppp..", "pkkkkpp.", "ppppppp.", "pkkkp.p.", "pppppp..", ".pppp..."] },
  pickaxe: { name: "a pickaxe", px: [".iiiii..", "i....ii.", ".....bi.", "....b..i", "...b....", "..b.....", ".b......", "b......."] },
  cube: { name: "a 3x3 cube", px: ["rrryyybb", "rrryyybb", "rrryyybb", "gggwwwoo", "gggwwwoo", "gggwwwoo", "bbbrrryy", "bbbrrryy"] },
  laptop: { name: "a laptop", px: ["........", ".kkkkkk.", ".kaaaak.", ".kaaaak.", ".kkkkkk.", "kkkkkkkk", "kwwwwwwk", "kkkkkkkk"] },
  packet: { name: "an encrypted packet", px: ["........", "pppppppp", "pp....pp", "p.p..p.p", "p..pp..p", "p......p", "pppppppp", "...aa..."] },
  unfinished: { name: "an unfinished project", px: ["bbbb....", "b..b....", "bbbb.b..", "b....b..", "b...bbb.", "..b.....", ".b.b.b..", "........"] },
  cable: { name: "a network cable", px: ["aa......", "aa......", ".k......", ".kk.....", "...kk...", ".....kk.", "......aa", "......aa"] },
};

const inventory: ItemId[] = ["pickaxe", "cube", "laptop", "packet", "unfinished", "cable", "minecraft", "java", "docs"];
const RECIPE: ItemId[] = ["minecraft", "java", "docs"];

function Pixel({ id }: { id: ItemId }) {
  return (
    <svg viewBox="0 0 8 8" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      {items[id].px.flatMap((row, y) =>
        [...row].map((c, x) => (c === "." ? null : <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" className={`px-${c}`} />)),
      )}
    </svg>
  );
}

export function MinecraftInventory() {
  const [open, setOpen] = useState(false);
  const [held, setHeld] = useState<ItemId | null>(null);
  const [grid, setGrid] = useState<(ItemId | null)[]>(Array(9).fill(null));
  const placed = grid.filter(Boolean) as ItemId[];
  const crafted = placed.length === RECIPE.length && RECIPE.every((id) => placed.includes(id));

  const place = (index: number) => {
    const next = [...grid];
    next[index] = held;
    setHeld(null);
    setGrid(next);
    const items = next.filter(Boolean) as ItemId[];
    if (items.length === RECIPE.length && RECIPE.every((id) => items.includes(id))) discover("minecraft-craft");
  };

  return (
    <div className="mc-inv-wrap">
      <button
        type="button"
        className="mc-chest"
        aria-expanded={open}
        aria-label={open ? "close the inventory" : "open the inventory"}
        onClick={() => {
          setOpen(!open);
          if (!open) discover("minecraft-inventory");
        }}
      >
        <svg viewBox="0 0 8 8" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
          <rect x="0" y="1" width="8" height="7" className="px-w" />
          <rect x="0" y="3" width="8" height="1" className="px-k" />
          <rect x="3" y="3" width="2" height="2" className="px-i" />
        </svg>
      </button>
      {open && (
        <div className="mc-inv" role="group" aria-label="Inventory">
          <div className="mc-craft">
            <div className="mc-grid" role="group" aria-label="Crafting grid">
              {grid.map((cell, index) => (
                <button key={index} type="button" className="mc-slot" onClick={() => place(index)} aria-label={cell ? `slot ${index + 1}: ${items[cell].name}. press to take it out` : `empty slot ${index + 1}${held ? `, place ${items[held].name}` : ""}`}>
                  {cell && <Pixel id={cell} />}
                </button>
              ))}
            </div>
            <span className="mc-arrow" aria-hidden="true">→</span>
            <div className="mc-out" aria-live="polite">
              {crafted ? (
                <Link href="/work/nexus" className="mc-result mono">NEXUS</Link>
              ) : (
                <span className="mc-slot mc-empty" role="img" aria-label="nothing crafted yet" />
              )}
            </div>
          </div>
          <div className="mc-items" role="group" aria-label="Items">
            {inventory.map((id) => (
              <button key={id} type="button" className="mc-slot" aria-pressed={held === id} aria-label={items[id].name} title={items[id].name} onClick={() => setHeld(held === id ? null : id)}>
                <Pixel id={id} />
              </button>
            ))}
          </div>
          <p className="mc-hint mono">{crafted ? "minecraft + java + networking docs. that is roughly how it happened." : held ? `holding ${items[held].name}. pick a crafting slot.` : "pick an item, then a crafting slot."}</p>
        </div>
      )}
    </div>
  );
}
