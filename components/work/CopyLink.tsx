"use client";

import { useEffect, useRef, useState } from "react";

export function CopyLink() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button type="button" className="button" onClick={copy}>
      <span aria-live="polite">{copied ? "link copied ✓" : "copy link"}</span>
    </button>
  );
}
