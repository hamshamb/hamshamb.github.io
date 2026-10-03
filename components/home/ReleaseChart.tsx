"use client";

import { animate, stagger, utils } from "animejs";
import { AnimatePresence, m } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { animeEaseOut } from "@/lib/anime";
import { duration, easeOut } from "@/lib/motion";

export type ChartMonth = {
  key: string;
  label: string;
  long: string;
  released: string[];
  started: string[];
};

/**
 * Releases per month, from real project dates only. Visual language borrowed from Bklit UI's open
 * source charts (MIT): HTML axis labels, dashed gridlines that fade at the edges, a compact tooltip
 * with tabular numbers. Implemented by hand to avoid pulling visx into a static portfolio.
 *
 * Anime.js grows the bars once when the chart enters the viewport. Motion only handles the tooltip.
 */
export function ReleaseChart({ months, summary }: { months: ChartMonth[]; summary: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const max = Math.max(4, ...months.map((month) => month.released.length + month.started.length));
  const gridlines = Array.from({ length: max }, (_, index) => index + 1);

  useEffect(() => {
    const element = root.current;
    if (!element || !document.documentElement.classList.contains("motion-ok")) return;
    const bars = element.querySelectorAll<HTMLElement>(".bar-stack");
    utils.set(bars, { scaleY: 0 });

    let animation: ReturnType<typeof animate> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        animation = animate(bars, {
          scaleY: [0, 1],
          duration: 760,
          ease: animeEaseOut,
          delay: stagger(45),
        });
      },
      { threshold: 0.4 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      animation?.revert();
      utils.set(bars, { scaleY: 1 });
    };
  }, []);

  return (
    <figure className="release-chart" ref={root}>
      <div className="chart-plot" role="img" aria-label={summary}>
        <div className="chart-grid" aria-hidden="true">
          {gridlines.map((line) => (
            <span key={line} style={{ bottom: `${(line / max) * 100}%` }}>
              <b />
              <i>{line}</i>
            </span>
          ))}
        </div>
        <div className="chart-bars" aria-hidden="true" onPointerLeave={() => setHovered(null)}>
          {months.map((month) => {
            const total = month.released.length + month.started.length;
            return (
              <div
                key={month.key}
                className="chart-column"
                data-empty={total === 0}
                data-hovered={hovered === month.key}
                onPointerEnter={() => setHovered(total ? month.key : null)}
              >
                <div className="bar-stack" style={{ height: `${(total / max) * 100}%` }}>
                  {month.started.length > 0 && <span className="bar bar-started" style={{ flexGrow: month.started.length }} />}
                  {month.released.length > 0 && <span className="bar bar-released" style={{ flexGrow: month.released.length }} />}
                </div>
                <AnimatePresence>
                  {hovered === month.key && (
                    <m.div
                      className="chart-tooltip"
                      style={{ bottom: `calc(${(total / max) * 100}% + 10px)` }}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: duration.fast, ease: easeOut }}
                    >
                      <strong>{month.long}</strong>
                      {month.released.length > 0 && (
                        <span><i className="dot released" />released <b>{month.released.length}</b></span>
                      )}
                      {month.released.map((name) => <em key={name}>{name}</em>)}
                      {month.started.length > 0 && (
                        <span><i className="dot started" />started <b>{month.started.length}</b></span>
                      )}
                      {month.started.map((name) => <em key={name}>{name}</em>)}
                    </m.div>
                  )}
                </AnimatePresence>
                <span className="chart-label" data-major={month.label.includes("'") || undefined}>{month.label}</span>
              </div>
            );
          })}
        </div>
      </div>
      <figcaption className="chart-legend mono">
        <span><i className="dot released" />case studies released</span>
        <span><i className="dot started" />smaller repos started</span>
      </figcaption>
    </figure>
  );
}
