"use client";

import { LayoutGroup, m } from "motion/react";
import { type CSSProperties, type PointerEvent, useMemo, useState } from "react";
import { defaultArt, gameArt } from "@/content/game-art";
import type { Game } from "@/content/personal";
import { spring } from "@/lib/motion";
import { GameMotif } from "./GameMotif";

type Filter = "all" | "favorites" | "most played";

const hours = (game: Game) => (typeof game.playtimeHours === "number" && game.playtimeHours > 0 ? game.playtimeHours : undefined);

/** Pointer position inside a card, for the spotlight and the motif's small parallax. */
function track(event: PointerEvent<HTMLElement>) {
  if (event.pointerType !== "mouse") return;
  const card = event.currentTarget;
  const box = card.getBoundingClientRect();
  card.style.setProperty("--mx", ((event.clientX - box.left) / box.width).toFixed(3));
  card.style.setProperty("--my", ((event.clientY - box.top) / box.height).toFixed(3));
}

/**
 * Games as title cards. Each card has the game's own logo where one is published (typographic
 * otherwise), a small original motif, and the exact hours. "most played" re-sorts with a layout
 * animation and ranks the top three. Filters only appear when there is data to filter by.
 */
export function GameShelf({ games }: { games: Game[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const filters = useMemo(() => {
    const available: Filter[] = ["all"];
    if (games.some((game) => game.favorite)) available.push("favorites");
    if (games.some((game) => hours(game))) available.push("most played");
    return available;
  }, [games]);
  const most = Math.max(...games.map((game) => hours(game) ?? 0), 1);

  const shown = useMemo(() => {
    if (filter === "favorites") return games.filter((game) => game.favorite);
    if (filter === "most played") return games.filter(hours).sort((a, b) => (hours(b) ?? 0) - (hours(a) ?? 0));
    return games;
  }, [filter, games]);
  const ranked = filter === "most played";

  return (
    <div className="game-shelf" data-filter={filter}>
      {filters.length > 1 && (
        <div className="game-filters" role="group" aria-label="Filter games">
          {filters.map((name) => (
            <button key={name} type="button" aria-pressed={filter === name} onClick={() => setFilter(name)}>{name}</button>
          ))}
          {ranked && <span className="game-total mono">{`${games.reduce((sum, game) => sum + (hours(game) ?? 0), 0).toLocaleString("en-US")}h across ${shown.length}`}</span>}
        </div>
      )}
      <LayoutGroup>
        <ul className="game-list">
          {shown.map((game, index) => {
            const played = hours(game);
            const art = gameArt[game.title] ?? defaultArt;
            const rank = ranked && index < 3 ? index + 1 : undefined;
            return (
              <m.li
                key={game.title}
                layout="position"
                transition={spring.soft}
                className="game"
                data-tile={art.tile}
                data-rank={rank}
                style={{ "--hue": art.hue, "--share": played ? played / most : 0 } as CSSProperties}
                onPointerMove={track}
              >
                <div className="game-tile" aria-hidden="true">
                  <GameMotif motif={art.motif} />
                  {art.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="game-logo" src={art.logo.src} width={art.logo.width} height={art.logo.height} alt="" loading="lazy" decoding="async" />
                  ) : (
                    <span className="game-type" data-type={art.type}>
                      {art.kicker && <small>{art.kicker}</small>}
                      {art.kicker ? game.title.split(": ").slice(1).join(": ") : game.title}
                    </span>
                  )}
                  {rank && <span className="game-rank mono">{String(rank).padStart(2, "0")}</span>}
                </div>
                <div className="game-meta">
                  <span className="game-title">{game.title}</span>
                  {played && <span className="game-hours mono">{`${Math.round(played).toLocaleString("en-US")}h`}</span>}
                  {game.favorite && <span className="game-fav mono">fav</span>}
                  {played && <span className="game-bar" aria-hidden="true"><i /></span>}
                </div>
              </m.li>
            );
          })}
        </ul>
      </LayoutGroup>
    </div>
  );
}
