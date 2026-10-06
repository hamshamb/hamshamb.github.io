"use client";

import { useState } from "react";
import { formatHours, personal } from "@/content/personal";

/** Real, self-reported hours only. The chart is the joke; the numbers are not. */
export default function TouchGrass() {
  const [asked, setAsked] = useState(false);
  const rows = [
    { title: "Minecraft", hours: personal.minecraft.playtimeHours ?? 0 },
    ...personal.games.map((game) => ({ title: game.title, hours: game.playtimeHours ?? 0 })),
  ]
    .filter((row) => row.hours > 0)
    .sort((a, b) => b.hours - a.hours);
  const max = rows[0]?.hours ?? 1;
  const total = rows.reduce((sum, row) => sum + row.hours, 0);

  return (
    <div className="grass">
      <ol className="grass-bars">
        {rows.map((row) => (
          <li key={row.title}>
            <span className="grass-name">{row.title}</span>
            <span className="grass-bar" aria-hidden="true"><i style={{ width: `${(row.hours / max) * 100}%` }} /></span>
            <span className="grass-hours mono">{formatHours(row.hours)}</span>
          </li>
        ))}
      </ol>
      <p className="grass-total mono">total: {formatHours(total)}. grass: not measured.</p>
      <div className="toy-controls">
        <button type="button" className="button button-primary" onClick={() => setAsked(true)} aria-describedby="grass-answer">
          touch grass
        </button>
        <p id="grass-answer" className="grass-answer mono" aria-live="polite">{asked ? "request denied. try again after one more game." : ""}</p>
      </div>
    </div>
  );
}
