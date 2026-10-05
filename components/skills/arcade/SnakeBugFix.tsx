"use client";

import { useState } from "react";
import { BUG_LINE, BUG_LINES, type BugAnswer, checkBug } from "@/lib/snake";

/**
 * The small secret next to the game: six lines of the terminal version with one broken. Pick the
 * broken line and the game gets a second skin. Collapsed by default and nothing here nags.
 */
export function SnakeBugFix({ solved, onSolved }: { solved: boolean; onSolved: () => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [answer, setAnswer] = useState<BugAnswer | null>(null);

  const pick = (index: number) => {
    const result = checkBug(index);
    setPicked(index);
    setAnswer(result);
    if (result.correct) onSolved();
  };

  const fixed = solved || answer?.correct;

  return (
    <details className="sg-bug">
      <summary className="mono">{fixed ? "snake.py, fixed" : "snake.py has a bug"}</summary>
      <div className="sg-bug-body">
        <p className="sg-bug-lede">
          {fixed
            ? "fixed. the python skin is now under the board, if you want it."
            : "this version never grows, no matter how much it eats. pick the line that is wrong."}
        </p>
        <ol className="sg-bug-code" aria-label="snake.py excerpt">
          {BUG_LINES.map((code, index) => {
            const broken = index === BUG_LINE;
            const text = fixed && broken ? "else:\n    snake.pop()" : code;
            return (
              <li key={code}>
                <button
                  type="button"
                  className="sg-bug-line"
                  data-state={fixed && broken ? "fixed" : picked === index ? "wrong" : undefined}
                  disabled={Boolean(fixed)}
                  aria-label={`line ${index + 1}: ${code.trim()}`}
                  onClick={() => pick(index)}
                >
                  <span className="sg-bug-no" aria-hidden="true">{index + 1}</span>
                  <code>{text}</code>
                </button>
              </li>
            );
          })}
        </ol>
        <p className="sg-bug-note" aria-live="polite" data-ok={answer?.correct || undefined}>
          {answer ? answer.message : fixed ? "" : "tap a line."}
        </p>
      </div>
    </details>
  );
}
