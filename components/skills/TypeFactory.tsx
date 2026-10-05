"use client";

import { type CSSProperties, useEffect, useId, useRef, useState } from "react";
import { compiled, next as nextStep, type Part, pick, type Progress, puzzles, start, view } from "@/lib/demos/compile";
import {
  connect,
  type Delivery,
  disconnect,
  missing,
  required,
  run,
  type SinkId,
  sinks,
  type SourceId,
  sources,
  type Verdict,
  type Wire,
} from "@/lib/demos/factory";
import { achieve } from "@/lib/secrets";

type Pt = { x: number; y: number };
type Geom = { w: number; h: number; pts: Record<string, Pt> };
type Tab = "wire" | "compile";
type Flash = { sink: SinkId; ok: boolean; n: number };

const portKey = (kind: "source" | "sink", id: string) => `${kind}:${id}`;

/** A horizontal S-curve between two port edges. */
function curve(a: Pt, b: Pt) {
  const dx = Math.max(18, (b.x - a.x) * 0.5);
  return { d: `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`, c1: { x: a.x + dx, y: a.y }, c2: { x: b.x - dx, y: b.y } };
}

function pointAt(a: Pt, b: Pt, t: number): Pt {
  const { c1, c2 } = curve(a, b);
  const u = 1 - t;
  return {
    x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x,
    y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y,
  };
}

const shapeOf = (shape: Readonly<Record<string, string>>) => `{ ${Object.entries(shape).map(([key, type]) => `${key}: ${type}`).join("; ")} }`;

/**
 * Type Factory: a machine with typed ports. Every wire is checked by the very functions in
 * lib/demos/factory.ts, and the puzzle is lib/demos/compile.ts. Nothing about the rules lives in
 * this file; it only draws them.
 */
export function TypeFactory() {
  const [tab, setTab] = useState<Tab>("wire");
  const [wires, setWires] = useState<Wire[]>([]);
  const [selected, setSelected] = useState<SourceId | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);
  const [reject, setReject] = useState<{ from: SourceId; to: SinkId; n: number } | null>(null);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [look, setLook] = useState<string>("");
  const [ran, setRan] = useState<{ n: number; deliveries: Delivery[] } | null>(null);
  const [progress, setProgress] = useState(start);
  const [geom, setGeom] = useState<Geom | null>(null);
  const board = useRef<HTMLDivElement>(null);
  const ports = useRef<Record<string, HTMLElement | null>>({});
  const attempts = useRef(0);
  const id = useId();

  const broken = (["onConnect", "onMessage", "retry"] as Part[]).filter((part) => !progress.fixed.includes(part));
  const todo = missing(wires);
  const done = compiled(progress);

  // measure where every port sits so the wires can be drawn between them
  useEffect(() => {
    const el = board.current;
    if (!el || tab !== "wire") return;
    const measure = () => {
      const box = el.getBoundingClientRect();
      const pts: Record<string, Pt> = {};
      for (const [key, port] of Object.entries(ports.current)) {
        if (!port) continue;
        const r = port.getBoundingClientRect();
        pts[key] = { x: (key.startsWith("source") ? r.right : r.left) - box.left, y: r.top + r.height / 2 - box.top };
      }
      setGeom({ w: box.width, h: box.height, pts });
    };
    const watcher = new ResizeObserver(measure);
    watcher.observe(el);
    return () => watcher.disconnect();
  }, [tab]);

  const attempt = (to: SinkId) => {
    if (!selected) {
      setVerdict(null);
      setLook(`pick a source first. ${to} is waiting.`);
      return;
    }
    const result = connect(wires, selected, to);
    attempts.current += 1;
    setVerdict(result.verdict);
    setRan(null);
    setFlash({ sink: to, ok: result.verdict.ok, n: attempts.current });
    if (!result.verdict.ok) {
      setReject({ from: selected, to, n: attempts.current });
      return;
    }
    setReject(null);
    if (result.added) {
      setWires(result.wires);
      setFresh(`${selected}>${to}`);
    }
    setSelected(null);
  };

  const pickSource = (source: SourceId) => {
    setSelected((current) => (current === source ? null : source));
    setReject(null);
  };

  const unwire = (wire: Wire) => {
    setWires((list) => disconnect(list, wire));
    setRan(null);
    setFresh(null);
    setVerdict(null);
  };

  const go = () => setRan({ n: (ran?.n ?? 0) + 1, deliveries: run(wires, broken) });

  const chooseFix = (index: number) => setProgress((state) => pick(state, index));
  const advance = () => {
    const after = nextStep(progress);
    setProgress(after);
    if (compiled(after)) achieve("compiled");
  };

  const sourceOf = (wire: Wire) => geom?.pts[portKey("source", wire.from)];
  const sinkOf = (wire: Wire) => geom?.pts[portKey("sink", wire.to)];
  const hint = selected
    ? `${selected} sends ${sources.find((source) => source.id === selected)?.type.name}. pick a sink.`
    : look || "pick a source, then a sink. keyboard works: tab to a port and press enter.";

  return (
    <div className="tf" data-compiled={done || undefined}>
      <div className="tf-tabs mono" role="tablist" aria-label="Type factory">
        <button type="button" role="tab" id={`${id}-wire-tab`} aria-selected={tab === "wire"} aria-controls={`${id}-wire`} onClick={() => setTab("wire")}>
          wire it
        </button>
        <button type="button" role="tab" id={`${id}-compile-tab`} aria-selected={tab === "compile"} aria-controls={`${id}-compile`} onClick={() => setTab("compile")}>
          make it compile <span className="tf-count">{done ? "done" : `${progress.fixed.length}/${puzzles.length}`}</span>
        </button>
      </div>

      {tab === "wire" && (
        <div className="tf-panel" role="tabpanel" id={`${id}-wire`} aria-labelledby={`${id}-wire-tab`}>
          {broken.length > 0 && (
            <p className="tf-note">
              {broken.length} of 4 handlers have type errors, so they cannot run yet.{" "}
              <button type="button" className="tf-linkish" onClick={() => setTab("compile")}>fix them</button>
            </p>
          )}

          {/* Escape is handled for the ports inside; this div itself is not interactive */}
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
          <div
            className="tf-board"
            data-armed={selected !== null || undefined}
            ref={board}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setSelected(null);
                setReject(null);
              }
            }}
          >
            <ul className="tf-col" aria-label="Sources">
              {sources.map((source) => (
                <li key={source.id}>
                  <button
                    type="button"
                    className="tf-port"
                    data-kind="source"
                    data-armed={selected === source.id || undefined}
                    aria-pressed={selected === source.id}
                    ref={(el) => { ports.current[portKey("source", source.id)] = el; }}
                    onClick={() => pickSource(source.id)}
                    onFocus={() => setLook(`${source.id} sends ${source.type.name} ${shapeOf(source.type.shape)}`)}
                    onMouseEnter={() => setLook(`${source.id} sends ${source.type.name} ${shapeOf(source.type.shape)}`)}
                  >
                    <span className="tf-port-name">{source.id}</span>
                    <span className="tf-port-type">{source.type.name}</span>
                    <span className="tf-nub" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="tf-gap" aria-hidden="true" />
            <ul className="tf-col" aria-label="Sinks">
              {sinks.map((sink) => (
                <li key={sink.id}>
                  <button
                    type="button"
                    className="tf-port"
                    data-kind="sink"
                    data-broken={broken.includes(sink.id as Part) || undefined}
                    aria-label={`${sink.id} ${sink.signature}${broken.includes(sink.id as Part) ? ", does not compile yet" : ""}`}
                    ref={(el) => { ports.current[portKey("sink", sink.id)] = el; }}
                    onClick={() => attempt(sink.id)}
                    onFocus={() => setLook(`${sink.id} wants ${sink.accepts.name} ${shapeOf(sink.accepts.shape)}`)}
                    onMouseEnter={() => setLook(`${sink.id} wants ${sink.accepts.name} ${shapeOf(sink.accepts.shape)}`)}
                  >
                    <span className="tf-nub" aria-hidden="true" />
                    <span className="tf-port-name">{sink.id}</span>
                    <span className="tf-port-type">{sink.accepts.name}</span>
                    <span className="tf-port-sig">{sink.signature}</span>
                    {broken.includes(sink.id as Part) && <span className="tf-bug" aria-hidden="true">ts</span>}
                    {flash?.sink === sink.id && <span key={flash.n} className="tf-flash" data-ok={flash.ok} aria-hidden="true" />}
                  </button>
                </li>
              ))}
            </ul>

            {geom && (
              <svg className="tf-wires" width={geom.w} height={geom.h} viewBox={`0 0 ${geom.w} ${geom.h}`} aria-hidden="true">
                {wires.map((wire) => {
                  const a = sourceOf(wire);
                  const b = sinkOf(wire);
                  if (!a || !b) return null;
                  const key = `${wire.from}>${wire.to}`;
                  return (
                    <g key={key}>
                      <path d={curve(a, b).d} className="tf-wire" pathLength={1} data-fresh={fresh === key || undefined} />
                      {fresh === key && <circle className="tf-lock" cx={b.x} cy={b.y} r={9} />}
                    </g>
                  );
                })}
                {reject && sourceOf(reject) && sinkOf(reject) && (() => {
                  const a = sourceOf(reject)!;
                  const b = sinkOf(reject)!;
                  const cut = pointAt(a, b, 0.55);
                  return (
                    <g key={reject.n} className="tf-reject">
                      <path d={curve(a, b).d} className="tf-wire-bad" pathLength={1} />
                      <g transform={`translate(${cut.x} ${cut.y})`}>
                        <g className="tf-cross">
                          <circle r={9} />
                          <path d="M -3.5 -3.5 L 3.5 3.5 M 3.5 -3.5 L -3.5 3.5" />
                        </g>
                      </g>
                    </g>
                  );
                })()}
              </svg>
            )}

            {ran && geom && ran.deliveries.map((delivery, index) => {
              const a = sourceOf(delivery.wire);
              const b = sinkOf(delivery.wire);
              if (!a || !b) return null;
              const style = { offsetPath: `path("${curve(a, b).d}")`, animationDelay: `${index * 380}ms` } as CSSProperties;
              return <span key={`${ran.n}-${index}`} className="tf-packet" data-ok={delivery.ok} style={style} aria-hidden="true" />;
            })}
          </div>

          <p className="tf-look mono">{hint}</p>

          <div className="tf-diag" data-ok={verdict ? verdict.ok : undefined} role="status" aria-live="polite">
            {verdict ? (
              <>
                <p className="tf-diag-head mono">{verdict.ok ? "ok" : "error ts2345"}</p>
                <p className="tf-diag-main">{verdict.reason}</p>
                <p className="tf-diag-detail">{verdict.detail}</p>
              </>
            ) : (
              <p className="tf-diag-detail">type checker idle. wire something.</p>
            )}
          </div>

          <div className="tf-actions">
            <button type="button" className="tf-btn tf-btn-primary" disabled={wires.length === 0} onClick={go}>run machine</button>
            <button type="button" className="tf-btn" disabled={wires.length === 0} onClick={() => { setWires([]); setRan(null); setFresh(null); }}>clear wires</button>
            <span className="tf-progress mono">{required.length - todo.length} / {required.length} needed</span>
          </div>

          {wires.length > 0 && (
            <ul className="tf-wirelist" aria-label="Connections">
              {wires.map((wire) => (
                <li key={`${wire.from}>${wire.to}`}>
                  <span className="mono">{wire.from} <span aria-hidden="true">→</span><span className="sr-only">to</span> {wire.to}</span>
                  <button type="button" onClick={() => unwire(wire)} aria-label={`remove ${wire.from} to ${wire.to}`}>remove</button>
                </li>
              ))}
            </ul>
          )}

          {ran && (
            <ol className="tf-log mono" aria-label="What the machine did">
              {ran.deliveries.map((delivery, index) => (
                <li key={`${ran.n}-${index}`} data-ok={delivery.ok} style={{ animationDelay: `${index * 380 + 500}ms` }}>
                  {delivery.line}
                </li>
              ))}
              <li className="tf-log-end" style={{ animationDelay: `${ran.deliveries.length * 380 + 500}ms` }}>
                {ran.deliveries.every((delivery) => delivery.ok) && todo.length === 0 ? "every needed wire ran. the types held." : todo.length ? `${todo.length} needed wire${todo.length > 1 ? "s" : ""} still missing.` : "some handlers did not compile."}
              </li>
            </ol>
          )}
        </div>
      )}

      {tab === "compile" && (
        <div className="tf-panel" role="tabpanel" id={`${id}-compile`} aria-labelledby={`${id}-compile-tab`}>
          <ol className="tf-parts mono" aria-label="Handlers">
            {(["onConnect", "onMessage", "retry"] as Part[]).map((part) => (
              <li key={part} data-fixed={progress.fixed.includes(part) || undefined}>
                <span className="tf-light" aria-hidden="true" />
                {part} <span className="tf-part-state">{progress.fixed.includes(part) ? "repaired" : "broken"}</span>
              </li>
            ))}
          </ol>

          {done ? (
            <div className="tf-done">
              <p className="tf-done-word">compiled.</p>
              <p className="tf-done-sub">three errors, three repairs. the machine is whole, and onConnect, onMessage and retry will run.</p>
              <div className="tf-actions">
                <button type="button" className="tf-btn tf-btn-primary" onClick={() => setTab("wire")}>back to the machine</button>
                <button type="button" className="tf-btn" onClick={() => setProgress(start())}>again</button>
              </div>
            </div>
          ) : (
            <Puzzle progress={progress} onPick={chooseFix} onNext={advance} />
          )}
        </div>
      )}
    </div>
  );
}

function Puzzle({ progress, onPick, onNext }: { progress: Progress; onPick: (index: number) => void; onNext: () => void }) {
  const puzzle = puzzles[progress.step];
  const lines = view(progress);
  const chosen = progress.chosen === null ? null : puzzle.fixes[progress.chosen];
  const last = progress.step === puzzles.length - 1;
  return (
    <div className="tf-puzzle">
      <p className="tf-step mono">error {progress.step + 1} of {puzzles.length} · {puzzle.title}</p>
      <ol className="tf-code" aria-label="TypeScript with an error">
        {lines.map((line, index) => {
          const patched = chosen ? index >= chosen.edit.at && index < chosen.edit.at + chosen.edit.insert.length : false;
          const bad = progress.verdict !== "fixed" && index === puzzle.line;
          return (
            <li key={`${index}-${line}`} data-bad={bad || undefined} data-fixed={patched || undefined}>
              <span className="tf-code-no" aria-hidden="true">{index + 1}</span>
              <code>{line}</code>
            </li>
          );
        })}
      </ol>
      {progress.verdict !== "fixed" && (
        <p className="tf-diag-line mono"><b>error</b> {puzzle.error}</p>
      )}

      <ul className="tf-fixes" aria-label="Candidate fixes">
        {puzzle.fixes.map((fix, index) => (
          <li key={fix.code}>
            <button
              type="button"
              className="tf-fix"
              disabled={progress.verdict === "fixed" || progress.tried.includes(index)}
              data-state={progress.tried.includes(index) ? "wrong" : progress.chosen === index ? "right" : undefined}
              onClick={() => onPick(index)}
            >
              <span className="tf-fix-key mono" aria-hidden="true">{"abc"[index]}</span>
              <code>{fix.code}</code>
            </button>
          </li>
        ))}
      </ul>

      <div className="tf-feedback" role="status" aria-live="polite" data-verdict={progress.verdict}>
        {progress.verdict === "wrong" && (
          <>
            <p className="tf-feedback-head">the type checker remains unconvinced.</p>
            <p className="tf-feedback-why">{progress.message}</p>
          </>
        )}
        {progress.verdict === "fixed" && (
          <>
            <p className="tf-feedback-head">ok. that error is gone.</p>
            <p className="tf-feedback-why">{progress.message}</p>
            <button type="button" className="tf-btn tf-btn-primary" onClick={onNext}>{last ? "compile" : "next error"}</button>
          </>
        )}
        {progress.verdict === "open" && <p className="tf-feedback-why">pick the fix the checker will accept. there is one.</p>}
      </div>
    </div>
  );
}
