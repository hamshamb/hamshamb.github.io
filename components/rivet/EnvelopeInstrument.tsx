"use client";

import { animate, createDrawable, createTimeline, stagger, utils } from "animejs";
import { useEffect, useRef, useState } from "react";
import { parts } from "./envelope-fields";
import { arc, bars, CX, envelopeModel, HOP_R, hopDots, MAX_HOPS, MAX_HOURS, meeting, missing, polar, stations } from "./envelope-model";

export type Mode = "seal" | "relay" | "meet" | "open";

const model = envelopeModel(parts);
const { fields, ticks, headerBytes, outerBytes, sealedFixedBytes, fixedBytes, offerBytes, idBytes } = model;

const modes: { id: Mode; label: string }[] = [
  { id: "seal", label: "seal" },
  { id: "relay", label: "relay" },
  { id: "meet", label: "meet" },
  { id: "open", label: "open" },
];

const r1 = (n: number) => Math.round(n * 10) / 10;
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
type Running = { pause: () => unknown };

/**
 * A sealed Rivet envelope as an instrument. The outer ring has one tick per real byte of the
 * documented header, key, nonce and sealed sender block (218 of them), coloured by who can read
 * them. The bars in the middle are the message: noise while sealed, a short message plus
 * padding once opened. The dotted track is a copy's six possible hops.
 *
 * Four modes, all conceptual (sizes come from the protocol notes; nothing here is measured on a
 * radio): seal builds it, relay shows the 34 bytes a relay reads while the rest stays shut, meet
 * shows phones trading ids so duplicates never move, open is the recipient's view.
 */
export function EnvelopeInstrument({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("seal");
  const [hop, setHop] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const running = useRef<Running[]>([]);
  const built = useRef(false);
  const timer = useRef(0);

  const q = <T extends Element>(selector: string) => [...(root.current?.querySelectorAll<T>(selector) ?? [])];
  const stop = () => {
    for (const anim of running.current) anim.pause();
    running.current = [];
    window.clearTimeout(timer.current);
  };
  const run = <T extends Running>(anim: T) => {
    running.current.push(anim);
    return anim;
  };
  const d = (ms: number) => (reduced() ? 0 : ms);

  /** Bars to a shape, staggered: from the centre out, or top to bottom. */
  const barsTo = (shape: "sealed" | "open" | "none", opts: { duration: number; step: number; from?: "center" | "top"; opacity?: number }) => {
    q<SVGRectElement>(".env-bar").forEach((el, i) => {
      const scaleX = shape === "none" ? 0 : bars[i][shape];
      const order = opts.from === "top" ? i : Math.abs(i - (bars.length - 1) / 2);
      run(animate(el, { scaleX, opacity: opts.opacity ?? 1, duration: d(opts.duration), delay: d(order * opts.step), ease: "outExpo" }));
    });
  };
  /** Ticks in one group to one opacity, the rest to another. */
  const ticksTo = (match: (el: SVGLineElement) => boolean, on: number, off: number, step = 1.5) => {
    const all = q<SVGLineElement>(".env-tick");
    const hit = all.filter(match);
    const miss = all.filter((el) => !match(el));
    if (hit.length) run(animate(hit, { opacity: on, duration: d(450), delay: stagger(d(step)), ease: "out(3)" }));
    if (miss.length) run(animate(miss, { opacity: off, duration: d(450), delay: stagger(d(step)), ease: "out(3)" }));
  };

  /** Moves the packet marker to a point on the hop track (degrees). */
  const placePacket = (angle: number) => {
    const packet = root.current?.querySelector<SVGGElement>(".env-packet");
    if (!packet) return;
    const [x, y] = polar(HOP_R, angle);
    packet.setAttribute("transform", `translate(${r1(x)} ${r1(y)}) rotate(${r1(angle + 90)})`);
  };

  // the opening: rings, field arcs, every byte, then the sealed body
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const start = () => {
      if (built.current) return;
      built.current = true;
      if (reduced()) return;
      const arcs = createDrawable(q<SVGPathElement>(".env-arc"));
      utils.set(q(".env-tick"), { opacity: 0 });
      utils.set(q(".env-bar"), { scaleX: 0 });
      utils.set(q(".env-dot, .env-station"), { opacity: 0 });
      utils.set(arcs, { draw: "0 0" });
      run(
        createTimeline({ defaults: { ease: "out(3)" } })
          .add(q(".env-guide"), { opacity: [0, 1], duration: 500, delay: stagger(80) }, 0)
          .add(arcs, { draw: ["0 0", "0 1"], duration: 700, ease: "inOut(2)", delay: stagger(70) }, 150)
          .add(q(".env-tick"), { opacity: [0, 1], duration: 260, delay: stagger(4) }, 260)
          .add(q(".env-dot"), { opacity: [0, 0.5], duration: 200, delay: stagger(8) }, 1300)
          .add(q(".env-station"), { opacity: [0, 1], scale: [0.4, 1], duration: 420, delay: stagger(60) }, 1500),
      );
      q<SVGRectElement>(".env-bar").forEach((el, i) => {
        run(animate(el, { scaleX: [0, bars[i].sealed], duration: 620, ease: "outExpo", delay: 900 + Math.abs(i - (bars.length - 1) / 2) * 26 }));
      });
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      start();
    }, { threshold: 0.35 });
    observer.observe(el);
    return () => {
      observer.disconnect();
      stop();
    };
    // q, run and stop only read refs
     
  }, []);

  // every mode change animates from wherever things are now
  useEffect(() => {
    if (!built.current && mode === "seal") return;
    built.current = true;
    stop();
    const ease = "out(3)";

    if (mode === "seal") {
      ticksTo(() => true, 1, 1, 2);
      barsTo("sealed", { duration: 600, step: 18 });
      run(animate(q(".env-meet"), { opacity: 0, duration: d(200) }));
      placePacket(stations[0]);
    }

    if (mode === "relay") {
      // a relay reads the header and nothing else: everything past it goes dark
      ticksTo((el) => el.dataset.zone === "header", 1, 0.14);
      barsTo("sealed", { duration: 500, step: 0, opacity: 0.3 });
      run(animate(q(".env-meet"), { opacity: 0, duration: d(200) }));
      let at = 0;
      placePacket(stations[0]);
      const step = () => {
        if (at >= MAX_HOPS) return;
        const from = stations[at];
        const to = stations[at + 1];
        at += 1;
        const travel = { a: from };
        run(animate(travel, { a: to, duration: d(820), ease: "inOut(3)", onUpdate: () => placePacket(travel.a), onComplete: () => {
          setHop(at);
          // the relay checks id, age and hop count: the header bytes flash, nothing else does
          run(animate(q('.env-tick[data-zone="header"]'), { opacity: [0.35, 1], duration: d(480), delay: stagger(d(6)), ease }));
          run(animate(q(`.env-station[data-hop="${at}"]`), { scale: [1.6, 1], duration: d(500), ease: "outElastic(1, .6)" }));
          if (at < MAX_HOPS) timer.current = window.setTimeout(step, d(520));
        } }));
      };
      timer.current = window.setTimeout(() => {
        setHop(0);
        step();
      }, d(500));
    }

    if (mode === "meet") {
      barsTo("none", { duration: 420, step: 10 });
      ticksTo((el) => el.dataset.field === "id", 1, 0.18);
      const ghosts = q<SVGRectElement>(".env-ghost");
      const sends = q<SVGGElement>(".env-send");
      const checks = q<SVGGElement>(".env-check");
      utils.set(ghosts, { translateX: 0, opacity: 0 });
      utils.set(sends, { translateX: 0, opacity: 0 });
      utils.set(checks, { opacity: 0 });
      run(
        createTimeline({ defaults: { ease } })
          .add(q(".env-meet"), { opacity: [0, 1], duration: d(300) }, d(250))
          // offers: one small id per envelope crosses first
          .add(ghosts, { opacity: [0, 1, 1, 0], translateX: [0, 112], duration: d(760), ease: "inOut(2)", delay: stagger(d(110)) }, d(600))
          .add(checks, { opacity: [0, 1], scale: [0.6, 1], duration: d(300), delay: stagger(d(110)) }, d(1150))
          // only the missing envelopes follow
          .add(sends, { opacity: [0, 1, 1], translateX: [0, 112], duration: d(900), ease: "inOut(3)", delay: stagger(d(220)) }, d(1900)),
      );
    }

    if (mode === "open") {
      run(animate(q(".env-meet"), { opacity: 0, duration: d(200) }));
      // decryption sweeps the sealed bytes, then the message resolves out of the noise
      ticksTo(() => true, 1, 1, 3);
      barsTo("open", { duration: 760, step: 34, from: "top" });
      placePacket(stations[MAX_HOPS]);
    }
    // q, run, stop and d only read refs and media queries
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // pointer over the ring: which field is under it
  const onMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width) * 600 - CX;
    const y = ((event.clientY - box.top) / box.height) * 600 - CX;
    const r = Math.hypot(x, y);
    if (r < 226 || r > 290) return setHovered(null);
    let a = (Math.atan2(y, x) * 180) / Math.PI;
    if (a < -90) a += 360;
    setHovered(fields.find((field) => a >= field.start - 0.7 && a <= field.end + 0.7)?.id ?? null);
  };

  const focus = hovered ?? selected;
  const focusField = fields.find((field) => field.id === focus);
  const readout = {
    seal: `${fixedBytes} bytes ride with every message before the text itself: ${headerBytes} of header, ${outerBytes} of key and nonce, ${sealedFixedBytes} of sealed sender and signature. the body is padded to a fixed bucket.`,
    relay: hop >= MAX_HOPS
      ? `hop ${MAX_HOPS} of ${MAX_HOPS}. this copy stops here. it read ${headerBytes} bytes at every stop and never the rest.`
      : `a relay reads ${headerBytes} bytes: enough to check the id, the age and the hop count. the other ${fixedBytes - headerBytes} bytes and the message stay shut. hop ${hop} of ${MAX_HOPS}.`,
    meet: `phones offer ids, not envelopes: ${meeting.offered.length} ids are ${offerBytes} bytes. ${meeting.held.length} are already held, so only ${missing.length} envelopes move. duplicates never cross the air.`,
    open: "only the recipient can open the sealed part. the message is short and the rest of the bucket is padding, so its length says little.",
  }[mode];

  return (
    <div className="env" ref={root} data-mode={mode}>
      <div className="env-top">
        <p className="mono env-label">conceptual visualization · sizes from the protocol notes</p>
        <div className="env-modes" role="radiogroup" aria-label="What to show">
          {modes.map((item) => (
            <button key={item.id} type="button" role="radio" aria-checked={mode === item.id} onClick={() => { setHop(0); setMode(item.id); }}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="env-stage">
        <svg
          className="env-svg"
          viewBox="0 0 600 600"
          aria-hidden="true"
          focusable="false"
          onPointerMove={onMove}
          onPointerLeave={() => setHovered(null)}
          onClick={() => hovered && onSelect(hovered)}
        >
          <defs>
            <pattern id="env-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="5" className="env-hatch-line" />
            </pattern>
          </defs>

          <circle className="env-guide" cx={CX} cy={CX} r="286" />
          <circle className="env-guide env-guide-dash" cx={CX} cy={CX} r="224" />
          <circle className="env-guide" cx={CX} cy={CX} r="170" />

          <g className="env-arcs">
            {fields.map((field) => (
              <path key={field.id} className="env-arc" data-zone={field.zone} data-on={focus === field.id || undefined} d={arc(268, field.start, field.end)} />
            ))}
          </g>

          <g className="env-ticks">
            {ticks.map((tick) => {
              const [x0, y0] = polar(tick.first ? 230 : 236, tick.angle);
              const [x1, y1] = polar(tick.first ? 256 : 250, tick.angle);
              return (
                <line
                  key={tick.i}
                  className="env-tick"
                  data-zone={tick.zone}
                  data-field={tick.field}
                  data-on={focus === tick.field || undefined}
                  x1={r1(x0)}
                  y1={r1(y0)}
                  x2={r1(x1)}
                  y2={r1(y1)}
                />
              );
            })}
          </g>

          <g className="env-hops">
            {hopDots.map((angle, i) => {
              const [x, y] = polar(HOP_R, angle);
              return <circle key={i} className="env-dot" data-done={mode === "relay" && angle <= stations[hop] ? true : undefined} cx={r1(x)} cy={r1(y)} r="1.5" />;
            })}
            {stations.map((angle, i) => {
              const [x, y] = polar(HOP_R, angle);
              return <circle key={i} className="env-station" data-hop={i} data-done={mode === "relay" && i <= hop ? true : undefined} cx={r1(x)} cy={r1(y)} r="4.5" />;
            })}
            <g className="env-packet" transform={`translate(${r1(polar(HOP_R, stations[0])[0])} ${r1(polar(HOP_R, stations[0])[1])}) rotate(${stations[0] + 90})`}>
              <rect x="-8" y="-5.5" width="16" height="11" rx="2" />
              <path d="M-8 -4.5 0 1 8 -4.5" />
            </g>
          </g>

          <g className="env-bars">
            {bars.map((bar, i) => (
              <rect key={i} className="env-bar" data-pad={bar.padding || undefined} x={bar.x} y={bar.y} width={bar.width} height="3.4" rx="1.7" style={{ transform: `scaleX(${bar.sealed})` }} />
            ))}
          </g>

          <g className="env-meet" style={{ opacity: 0 }}>
            <text className="env-meet-head" x="236" y="214" textAnchor="middle">phone a offers</text>
            <text className="env-meet-head" x="364" y="214" textAnchor="middle">phone b has</text>
            {meeting.offered.map((id, i) => {
              const y = 232 + i * 30;
              const held = meeting.held.includes(id);
              return (
                <g key={id}>
                  <rect className="env-chip" x="206" y={y} width="60" height="18" rx="3" />
                  <text className="env-chip-id" x="236" y={y + 12.5} textAnchor="middle">{id}</text>
                  <rect className={held ? "env-chip" : "env-chip env-chip-empty"} x="334" y={y} width="60" height="18" rx="3" />
                  {held && <text className="env-chip-id" x="364" y={y + 12.5} textAnchor="middle">{id}</text>}
                  <rect className="env-ghost" x="258" y={y + 6} width="16" height="6" rx="1.5" />
                  <g className="env-check" style={{ transformOrigin: `${398 + 8}px ${y + 9}px` }}>
                    <path d={held ? `M400 ${y + 9}l4 4 7-8` : `M400 ${y + 5}l9 8M409 ${y + 5}l-9 8`} />
                  </g>
                  {!held && (
                    <g className="env-send">
                      <rect x="210" y={y + 1} width="52" height="16" rx="3" />
                      <path d={`M210 ${y + 2}l26 8 26-8`} />
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          <text className="env-focus" x={CX} y="186" textAnchor="middle">
            {focusField ? `${focusField.name} · ${focusField.n} bytes` : ""}
          </text>
          <text className="env-hop-count" x={CX} y="478" textAnchor="middle">
            {mode === "relay" ? `hop ${hop} / ${MAX_HOPS}` : mode === "open" ? "recipient" : "sender"}
          </text>
        </svg>
      </div>

      <dl className="env-stats">
        <div><dt className="mono">a relay reads</dt><dd>{headerBytes} B</dd></div>
        <div><dt className="mono">fixed cost per message</dt><dd>{fixedBytes} B</dd></div>
        <div><dt className="mono">a meeting offers</dt><dd>{idBytes} B per id</dd></div>
        <div><dt className="mono">a copy lives</dt><dd>{MAX_HOPS} hops · {MAX_HOURS} h max</dd></div>
      </dl>

      <p className="env-readout" aria-live="polite">{readout}</p>
      <p className="env-note mono">the trade, stated in the post: copies cost more bandwidth than a clever route would. this is what keeps each copy small and bounded.</p>
    </div>
  );
}
