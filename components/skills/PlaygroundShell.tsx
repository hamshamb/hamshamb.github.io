"use client";

import { type ReactNode, useEffect, useId, useRef, useState } from "react";

type View = "demo" | "code";

/**
 * The frame every skill playground shares: demo and code side by side on wide screens, a
 * demo / code switch on narrow ones, plus reset (remounts the demo), fullscreen where the
 * browser allows it, keyboard hints and an info drawer. The demo inside is different every time;
 * only the frame is shared.
 */
export function PlaygroundShell({
  title,
  kicker,
  note,
  keys = [],
  code,
  children,
}: {
  title: string;
  kicker: string;
  note: string;
  keys?: readonly string[];
  code: ReactNode;
  children: ReactNode;
}) {
  const [run, setRun] = useState(0);
  const [view, setView] = useState<View>("demo");
  const [full, setFull] = useState(false);
  const [canFull, setCanFull] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    const timer = window.setTimeout(() => setCanFull(Boolean(document.fullscreenEnabled)), 0);
    const onChange = () => setFull(document.fullscreenElement === frame.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("fullscreenchange", onChange);
    };
  }, []);

  const toggleFull = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    else void frame.current?.requestFullscreen().catch(() => undefined);
  };

  const tab = (value: View, label: string) => (
    <button
      type="button"
      role="tab"
      id={`${id}-${value}-tab`}
      aria-selected={view === value}
      aria-controls={`${id}-${value}`}
      onClick={() => setView(value)}
    >
      {label}
    </button>
  );

  return (
    <section className="playground" data-view={view} aria-labelledby={`${id}-title`}>
      <div className="playground-switch mono" role="tablist" aria-label="Show">
        {tab("demo", "demo")}
        {tab("code", "code")}
      </div>

      <div className="playground-demo" id={`${id}-demo`} ref={frame} data-full={full || undefined}>
        <div className="playground-head">
          <div>
            <p className="playground-kicker mono">{kicker}</p>
            <h2 id={`${id}-title`}>{title}</h2>
          </div>
          <div className="playground-tools">
            <button type="button" className="tool-button mono" onClick={() => setRun((value) => value + 1)}>
              <span aria-hidden="true">↺</span> reset
            </button>
            {canFull && (
              <button type="button" className="tool-button mono" onClick={toggleFull} aria-pressed={full}>
                <span aria-hidden="true">{full ? "⤡" : "⤢"}</span> {full ? "exit" : "full"}
              </button>
            )}
          </div>
        </div>

        <div className="playground-stage" key={run}>
          {children}
        </div>

        <div className="playground-foot">
          {keys.length > 0 && (
            <p className="playground-keys mono">
              {keys.map((key) => <span key={key}>{key}</span>)}
            </p>
          )}
          <details className="playground-info">
            <summary className="mono">how this works</summary>
            <p>{note}</p>
          </details>
        </div>
      </div>

      <div className="playground-code" id={`${id}-code`}>
        {code}
      </div>
    </section>
  );
}
