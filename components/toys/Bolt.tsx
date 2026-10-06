"use client";

import { collectBolt, useSecrets } from "@/lib/secrets";
import type { BoltId } from "@/lib/secrets-core";

/**
 * One of five loose bolts from the build engine, hidden in decorative corners (never inside a
 * real control). Client only: the server HTML never contains a bolt, and a collected bolt is gone.
 */
export function Bolt({ id, className }: { id: BoltId; className?: string }) {
  const state = useSecrets();
  if (!state || state.bolts.includes(id)) return null;
  return (
    <button type="button" className={`bolt ${className ?? ""}`} data-bolt={id} aria-label="a loose bolt" onClick={() => collectBolt(id)}>
      <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
        <path d="M10 2.5 16.5 6.25v7.5L10 17.5 3.5 13.75v-7.5z" />
        <circle cx="10" cy="10" r="2.6" />
      </svg>
    </button>
  );
}
