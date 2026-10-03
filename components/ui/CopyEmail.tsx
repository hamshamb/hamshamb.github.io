"use client";

import { AnimatePresence, m } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { duration, easeOut } from "@/lib/motion";
import { CheckIcon, CopyIcon } from "./icons";

/** Email link with a copy button. The mailto link works without JavaScript; copying is an enhancement. */
export function CopyEmail({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    window.clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(email);
      setState("copied");
    } catch {
      setState("failed");
    }
    timer.current = window.setTimeout(() => setState("idle"), 2000);
  };

  const label = state === "copied" ? "copied" : state === "failed" ? "press ctrl+c" : "copy";

  return (
    <div className="email-box">
      <a href={`mailto:${email}`}>{email}</a>
      <button type="button" className="copy-button" onClick={copy} aria-label={`Copy ${email}`}>
        <AnimatePresence mode="popLayout" initial={false}>
          <m.span
            key={state}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: duration.fast, ease: easeOut }}
          >
            {state === "copied" ? <CheckIcon /> : <CopyIcon />}
            {label}
          </m.span>
        </AnimatePresence>
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {state === "copied" ? "Email address copied" : state === "failed" ? "Copy failed. Select the address to copy it." : ""}
      </span>
    </div>
  );
}
