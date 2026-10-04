"use client";

import { useId, useState } from "react";

type Theme = "light" | "dark";
type Density = "compact" | "normal" | "roomy";

/**
 * Controls around the card from content/snippets/card.html, styled only by app/demo-card.css.
 * The JavaScript moves the frame's width and two data attributes; the CSS does everything else.
 */
export function ResponsiveDemo() {
  const [width, setWidth] = useState(100);
  const [theme, setTheme] = useState<Theme>("light");
  const [density, setDensity] = useState<Density>("normal");
  const id = useId();

  return (
    <div className="responsive-demo">
      <div className="responsive-controls">
        <label htmlFor={`${id}-w`} className="mono">width {width}%</label>
        <input id={`${id}-w`} type="range" min={38} max={100} value={width} onChange={(event) => setWidth(Number(event.target.value))} />
        <fieldset>
          <legend className="mono">theme</legend>
          {(["light", "dark"] as Theme[]).map((value) => (
            <label key={value}><input type="radio" name={`${id}-t`} checked={theme === value} onChange={() => setTheme(value)} /> {value}</label>
          ))}
        </fieldset>
        <fieldset>
          <legend className="mono">density</legend>
          {(["compact", "normal", "roomy"] as Density[]).map((value) => (
            <label key={value}><input type="radio" name={`${id}-d`} checked={density === value} onChange={() => setDensity(value)} /> {value}</label>
          ))}
        </fieldset>
      </div>

      <div className="responsive-stage">
        <div className="demo-frame" data-theme={theme} data-density={density} style={{ width: `${width}%` }}>
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
              <a className="demo-card-link" href="#demo-card-title">read more</a>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
