"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { computeStats, formatMs, formatSolve, formatStat, type Penalty } from "@/lib/cube-stats";
import { clearSession, removeSolve, setPenalty, useSession } from "./session-store";

const penalties: Penalty[] = ["ok", "+2", "DNF"];

/** Current, best, ao3, ao5, mean and count for this browser's session. These are the visitor's numbers, never mine. */
export function SessionStats() {
  const solves = useSession();
  const stats = useMemo(() => computeStats(solves), [solves]);
  const tiles: [string, string][] = [
    ["current", formatStat(stats.current)],
    ["best", formatStat(stats.best)],
    ["ao3", formatStat(stats.ao3)],
    ["ao5", formatStat(stats.ao5)],
    ["mean", formatStat(stats.mean)],
    ["solves", String(stats.count)],
  ];
  return (
    <dl className="session-stats" aria-label="Your session statistics">
      {tiles.map(([label, value]) => (
        <div key={label}>
          <dt className="mono">{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Newest first. Change a penalty, delete a solve, or clear the session behind an inline confirm. */
export function SessionHistory() {
  const solves = useSession();
  const [confirming, setConfirming] = useState(false);
  const keep = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!confirming) return;
    keep.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setConfirming(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirming]);

  // a cleared or emptied session never leaves the confirm step hanging
  const asking = confirming && solves.length > 0;
  const rows = useMemo(() => solves.map((solve, index) => ({ solve, number: index + 1 })).reverse(), [solves]);

  return (
    <div className="session-history">
      <div className="session-head">
        <h3 className="mono">your session</h3>
        <p className="session-where">saved in this browser only. these are your times, not mine.</p>
      </div>

      {rows.length === 0 ? (
        <p className="session-empty">no solves yet. the first one will show up here.</p>
      ) : (
        <ol className="session-list" reversed>
          {rows.map(({ solve, number }) => (
            <li key={solve.id} className="session-row" data-penalty={solve.penalty}>
              <span className="session-num mono">{number}</span>
              <span className="session-time">
                {formatSolve(solve)}
                {solve.penalty === "DNF" && <small>{formatMs(solve.ms)}</small>}
              </span>
              <span className="session-scramble mono" title={solve.scramble}>{solve.scramble}</span>
              <span className="session-actions">
                <span className="session-pen" role="group" aria-label={`Penalty for solve ${number}`}>
                  {penalties.map((penalty) => (
                    <button
                      key={penalty}
                      type="button"
                      aria-pressed={solve.penalty === penalty}
                      onClick={() => setPenalty(solve.id, penalty)}
                    >
                      {penalty === "ok" ? "ok" : penalty}
                    </button>
                  ))}
                </span>
                <button type="button" className="session-delete" onClick={() => removeSolve(solve.id)} aria-label={`Delete solve ${number}`}>
                  delete
                </button>
              </span>
            </li>
          ))}
        </ol>
      )}

      {rows.length > 0 && (
        <div className="session-clear">
          {asking ? (
            <div role="alertdialog" aria-label="Clear the session" className="session-confirm">
              <span>clear {solves.length} {solves.length === 1 ? "solve" : "solves"}? this cannot be undone.</span>
              <button type="button" className="button" onClick={() => setConfirming(false)} ref={keep}>keep them</button>
              <button
                type="button"
                className="button button-primary"
                onClick={() => {
                  clearSession();
                  setConfirming(false);
                }}
              >
                clear session
              </button>
            </div>
          ) : (
            <button type="button" className="button" onClick={() => setConfirming(true)}>clear session</button>
          )}
        </div>
      )}
    </div>
  );
}
