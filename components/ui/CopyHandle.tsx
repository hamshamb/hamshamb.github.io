"use client";

import { useEffect, useRef, useState } from "react";

/** A handle with no public profile link: shown as text, copyable, never linked to a guessed URL. */
export function CopyHandle({ label, handle }: { label: string; handle: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <span className="copy-handle">
      {label} <span className="mono">{handle}</span>
      <button
        type="button"
        className="copy-handle-button mono"
        aria-label={`Copy ${label} handle ${handle}`}
        onClick={async () => {
          window.clearTimeout(timer.current);
          try {
            await navigator.clipboard.writeText(handle.replace(/^@/, ""));
            setCopied(true);
          } catch {
            setCopied(false);
          }
          timer.current = window.setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? "copied" : "copy"}
      </button>
    </span>
  );
}
