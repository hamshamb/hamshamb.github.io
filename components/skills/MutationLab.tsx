"use client";

import { AnimatePresence, m } from "motion/react";
import { type CSSProperties, useEffect, useId, useRef, useState } from "react";
import {
  ALIGNS,
  type Controls,
  defaults,
  DENSITIES,
  makeItWorse,
  RANGES,
  SHADOWS,
  THEMES,
  toVars,
  type Worse,
} from "@/lib/demos/mutation";
import { discover } from "@/lib/secrets";
import { Segmented } from "./apps/Segmented";

/**
 * A live card with nine controls. The number controls write CSS custom properties, the named
 * ones write data attributes, and app/demo-card.css (the file shown beside this) does the rest.
 * The card is the markup from content/snippets/card.html.
 */

type NumberKey = "width" | "spacing" | "radius" | "border" | "typeScale";

function Slider({ label, unit = "", digits = 0, value, range, onChange }: { label: string; unit?: string; digits?: number; value: number; range: { min: number; max: number; step: number }; onChange: (value: number) => void }) {
  const id = useId();
  return (
    <div className="mlab-slider">
      <label htmlFor={id} className="mono">{label}</label>
      <output htmlFor={id} className="mono">{value.toFixed(digits)}{unit}</output>
      <input id={id} type="range" min={range.min} max={range.max} step={range.step} value={value} onChange={(event) => onChange(Math.round(Number(event.target.value) * 100) / 100)} />
    </div>
  );
}

const WIDTH_PRESETS = [
  { label: "phone", width: 320 },
  { label: "tablet", width: 480 },
  { label: "desktop", width: 720 },
];

export function MutationLab() {
  const [controls, setControls] = useState<Controls>(defaults);
  const [worse, setWorse] = useState<Worse | null>(null);
  const [measured, setMeasured] = useState<{ width: number; wide: boolean } | null>(null);
  const frame = useRef<HTMLDivElement>(null);
  const set = <K extends keyof Controls>(key: K, value: Controls[K]) => setControls((current) => ({ ...current, [key]: value }));
  const setNumber = (key: NumberKey) => (value: number) => set(key, value);

  // read back what the browser actually did: the card's real width, and whether the container query fired
  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const read = () => {
      const card = element.firstElementChild;
      const columns = card ? window.getComputedStyle(card).gridTemplateColumns.trim().split(/\s+/).length : 1;
      setMeasured({ width: Math.round(element.getBoundingClientRect().width), wide: columns > 1 });
    };
    const observer = new ResizeObserver(read);
    observer.observe(element);
    read();
    return () => observer.disconnect();
  }, []);

  const vars = { ...toVars(controls), ...(worse?.vars ?? {}) };
  const style = vars as CSSProperties;

  const worsen = () => {
    setWorse(makeItWorse(worse));
    discover("css-worse");
  };

  return (
    <div className="mlab">
      <div className="mlab-stage">
        <div className="mlab-canvas" style={{ "--frame-w": vars["--frame-w"] } as CSSProperties}>
          <div className="mlab-ruler mono" aria-hidden="true">
            <span>{measured ? `${measured.width}px` : `${controls.width}px`}</span>
          </div>
          <div className="demo-frame" ref={frame} data-theme={controls.theme} data-density={controls.density} data-align={controls.align} data-shadow={controls.shadow} style={style}>
            <article className="demo-card" aria-labelledby="demo-card-title">
              <div className="demo-card-art" aria-hidden="true" />
              <div className="demo-card-body">
                <p className="demo-card-kicker">build log</p>
                <h3 id="demo-card-title">one card, every width</h3>
                <p>no media queries here: the card asks its container how much room it has, and the theme and density are just variables.</p>
                <ul className="demo-card-tags">
                  <li>semantic</li>
                  <li>container queries</li>
                  <li>custom properties</li>
                </ul>
                <a className="demo-card-link" href="#demo-card-title" onClick={(event) => event.preventDefault()}>read more</a>
              </div>
            </article>
          </div>
        </div>
        <p className="sr-only" aria-live="polite">{measured ? (measured.wide ? "container query on: art beside text" : "container query off: stacked") : ""}</p>
        <p className="mlab-readout mono" aria-hidden="true">
          {measured ? `card ${measured.width}px · container query: ${measured.wide ? "art beside text" : "stacked"}` : "measuring..."}
        </p>
      </div>

      <AnimatePresence initial={false}>
        {worse && (
          <m.div key="worse" className="mlab-worse" role="status" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <ul>
              {worse.captions.map((caption) => (
                <li key={caption} className="mono">{caption}</li>
              ))}
            </ul>
            <button type="button" className="button mlab-undo" onClick={() => setWorse(null)}>
              undo that immediately
            </button>
          </m.div>
        )}
      </AnimatePresence>

      <div className="mlab-panel">
        <fieldset className="mlab-group">
          <legend className="mono">layout</legend>
          <Slider label="viewport width" unit="px" value={controls.width} range={RANGES.width} onChange={setNumber("width")} />
          <div className="mlab-presets" role="group" aria-label="Width presets">
            {WIDTH_PRESETS.map((preset) => (
              <button key={preset.label} type="button" className="mlab-chip mono" aria-pressed={controls.width === preset.width} onClick={() => set("width", preset.width)}>
                {preset.label} {preset.width}
              </button>
            ))}
          </div>
          <Slider label="spacing" unit="x" digits={1} value={controls.spacing} range={RANGES.spacing} onChange={setNumber("spacing")} />
          <Segmented legend="density" value={controls.density} options={DENSITIES} onChange={(value) => set("density", value)} />
          <Segmented legend="alignment" value={controls.align} options={ALIGNS} onChange={(value) => set("align", value)} />
        </fieldset>

        <fieldset className="mlab-group">
          <legend className="mono">shape</legend>
          <Slider label="radius" unit="px" value={controls.radius} range={RANGES.radius} onChange={setNumber("radius")} />
          <Slider label="border" unit="px" value={controls.border} range={RANGES.border} onChange={setNumber("border")} />
          <Segmented legend="shadow" value={controls.shadow} options={SHADOWS} onChange={(value) => set("shadow", value)} />
        </fieldset>

        <fieldset className="mlab-group">
          <legend className="mono">type and colour</legend>
          <Slider label="type scale" unit="x" digits={2} value={controls.typeScale} range={RANGES.typeScale} onChange={setNumber("typeScale")} />
          <Segmented legend="theme" value={controls.theme} options={THEMES} onChange={(value) => set("theme", value)} />
        </fieldset>
      </div>

      <div className="mlab-actions">
        <button type="button" className="button" onClick={() => { setControls(defaults); setWorse(null); }}>
          tidy up
        </button>
        <button type="button" className="button mlab-worse-btn" onClick={worsen}>
          make it worse
        </button>
      </div>

      <details className="mlab-vars">
        <summary className="mono">what the page actually set</summary>
        <pre><code>{`.demo-frame[style] {\n${Object.entries(vars).map(([key, value]) => `  ${key}: ${value};`).join("\n")}\n}\ndata-theme="${controls.theme}" data-density="${controls.density}"\ndata-align="${controls.align}" data-shadow="${controls.shadow}"`}</code></pre>
      </details>
    </div>
  );
}
