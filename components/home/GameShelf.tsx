"use client";

import { type CSSProperties, useMemo, useState } from "react";
import type { Game } from "@/content/personal";

type Filter = "all" | "favorites" | "most played";

const minor = new Set(["of", "the", "a", "an", "and"]);

/** First and last meaningful word, so two Call of Duty games still get different marks. */
function initials(title: string) {
  const words = title.replace(/[^\w\s]/g, " ").split(/\s+/).filter((word) => word && !minor.has(word.toLowerCase()));
  return (words.length > 1 ? words[0][0] + words[words.length - 1][0] : words[0].slice(0, 2)).toUpperCase();
}

/** A stable hue per title, so each game gets its own small mark without borrowing any artwork. */
function hue(title: string) {
  let h = 0;
  for (const char of title) h = (h * 31 + char.charCodeAt(0)) % 360;
  return h;
}

const hours = (game: Game) => (typeof game.playtimeHours === "number" && game.playtimeHours > 0 ? game.playtimeHours : undefined);

/**
 * Games, as a shelf of small typographic marks. Filters only appear once there is real data to
 * filter by: no favourites or hours yet means no buttons that would do nothing.
 */
export function GameShelf({ games }: { games: Game[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const filters = useMemo(() => {
    const available: Filter[] = ["all"];
    if (games.some((game) => game.favorite)) available.push("favorites");
    if (games.some((game) => hours(game))) available.push("most played");
    return available;
  }, [games]);

  const shown = useMemo(() => {
    if (filter === "favorites") return games.filter((game) => game.favorite);
    if (filter === "most played") return games.filter(hours).sort((a, b) => (hours(b) ?? 0) - (hours(a) ?? 0));
    return games;
  }, [filter, games]);

  return (
    <div className="game-shelf">
      {filters.length > 1 && (
        <div className="game-filters" role="group" aria-label="Filter games">
          {filters.map((name) => (
            <button key={name} type="button" aria-pressed={filter === name} onClick={() => setFilter(name)}>{name}</button>
          ))}
        </div>
      )}
      <ul className="game-list">
        {shown.map((game) => {
          const played = hours(game);
          return (
            <li key={game.title} className="game" style={{ "--hue": hue(game.title) } as CSSProperties}>
              <span className="game-mark mono" aria-hidden="true">{initials(game.title)}</span>
              <span className="game-title">{game.title}</span>
              {played && <span className="game-hours mono">{`${Math.round(played).toLocaleString("en-US")}h`}</span>}
              {game.favorite && <span className="game-fav mono">fav</span>}
              {game.note && <span className="game-note">{game.note}</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
