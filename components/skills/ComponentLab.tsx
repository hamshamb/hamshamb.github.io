"use client";

import { AnimatePresence, LayoutGroup, m } from "motion/react";
import { createContext, type Dispatch, type ReactNode, type Ref, useContext, useReducer, useState } from "react";
import {
  type Action,
  childrenOf,
  derive,
  initialLab,
  type Item,
  type Kind,
  kinds,
  type Lab,
  MAX_ITEMS,
  propsFor,
  reduce,
  REDUCER_AFTER,
  setter,
  stateNames,
} from "@/lib/demos/lab";
import { discover } from "@/lib/secrets";

type LabContextValue = { lab: Lab; dispatch: Dispatch<Action>; xray: boolean; target: number | null; setTarget: (id: number | null) => void };
const LabContext = createContext<LabContextValue | null>(null);

function useLab() {
  const value = useContext(LabContext);
  if (!value) throw new Error("useLab outside the lab");
  return value;
}

const names: Record<Kind, string> = { button: "Button", card: "Card", counter: "Counter", toggle: "Toggle", list: "List", panel: "Panel" };
const glyphs: Record<Kind, string> = { button: "[ ]", card: "▭", counter: "+1", toggle: "◐", list: "≡", panel: "▢" };
const spring = { type: "spring", stiffness: 420, damping: 34 } as const;

/** Component Lab: build a small interface out of parts and watch what is shared, passed and derived. */
export function ComponentLab() {
  const [lab, dispatch] = useReducer(reduce, undefined, initialLab);
  const [xray, setXray] = useState(true);
  const [wanted, setTarget] = useState<number | null>(null);
  // the panel new parts go into, as long as it still exists
  const target = lab.items.some((item) => item.id === wanted && item.kind === "panel") ? wanted : null;
  const numbers = derive(lab);
  const roots = childrenOf(lab, null);
  const full = lab.items.length >= MAX_ITEMS;

  return (
    <LabContext.Provider value={{ lab, dispatch, xray, target, setTarget }}>
      <div className="cl" data-xray={xray || undefined}>
        <div className="cl-palette" role="group" aria-label="Add a component">
          <div className="cl-palette-head">
            <p className="cl-adding mono">
              adding to: <b>{target === null ? "the canvas" : `Panel “${lab.labels[target]}”`}</b>
              {target !== null && <button type="button" className="cl-linkish" onClick={() => setTarget(null)}>back to canvas</button>}
            </p>
            <button type="button" className="cl-xray mono" aria-pressed={xray} onClick={() => setXray((value) => !value)}>
              x-ray {xray ? "on" : "off"}
            </button>
          </div>
          <ul className="cl-kinds">
            {kinds.map((kind) => (
              <li key={kind}>
                <button type="button" className="cl-add" disabled={full} onClick={() => dispatch({ type: "add", kind, parent: target })}>
                  <span className="cl-add-glyph" aria-hidden="true">{glyphs[kind]}</span>
                  <span className="cl-add-name mono" aria-hidden="true">{kind}</span>
                  <span className="sr-only">add a {kind}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <LayoutGroup>
          <div className="cl-canvas" aria-label="Canvas" role="group">
            <AnimatePresence mode="popLayout" initial={false}>
              {roots.map((item) => <Piece key={item.id} item={item} />)}
            </AnimatePresence>
            {roots.length === 0 && <p className="cl-empty">an empty canvas. add something from above.</p>}
          </div>
        </LayoutGroup>

        <p className="sr-only" aria-live="polite">{numbers.components} components on the canvas.</p>
        <dl className="cl-derived" aria-label="Derived numbers">
          <div>
            <dt className="mono">components</dt>
            <dd>{numbers.components}{full && <small className="mono"> max</small>}</dd>
            {xray && <code>items.length</code>}
          </div>
          <div>
            <dt className="mono">shared store</dt>
            <dd>{lab.count}<small className="mono"> × {numbers.sharedCounters}</small></dd>
            {xray && <code>count, read by {numbers.sharedCounters}</code>}
          </div>
          <div>
            <dt className="mono">list items</dt>
            <dd>{numbers.listItems}<small className="mono"> in {numbers.lists}</small></dd>
            {xray && <code>lists.flat().length</code>}
          </div>
        </dl>

        <div className="cl-foot">
          <button type="button" className="cl-text-btn mono" disabled={lab.items.length === 0} onClick={() => dispatch({ type: "clear" })}>clear canvas</button>
          <p className="cl-lesson">everything above is a component. some own their state, some read shared state, some get props, and some numbers are just derived.</p>
        </div>

        <StateTray />
      </div>
    </LabContext.Provider>
  );
}

/** One component on the canvas, with its controls. The body depends on the kind. */
function Piece({ item, ref }: { item: Item; ref?: Ref<HTMLDivElement> }) {
  const { lab, dispatch, xray, target, setTarget } = useLab();
  const passed = propsFor(lab, item);
  const siblings = childrenOf(lab, item.parent);
  const at = siblings.findIndex((sibling) => sibling.id === item.id);
  const name = names[item.kind];
  const tag = item.kind === "panel" ? `<${name} label="${lab.labels[item.id] ?? ""}">` : passed.label ? `<${name} label="${passed.label}" />` : `<${name} />`;

  return (
    <m.div
      ref={ref}
      layout="position"
      className="cl-brick"
      data-kind={item.kind}
      data-nested={item.parent !== null || undefined}
      initial={{ opacity: 0, scale: 0.86, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.86 }}
      transition={spring}
    >
      <div className="cl-brick-head">
        <code className="cl-tag">{tag}</code>
        <span className="cl-tools">
          {item.kind === "panel" && (
            <button type="button" className="cl-tool cl-tool-text mono" aria-pressed={target === item.id} onClick={() => setTarget(target === item.id ? null : item.id)}>
              {target === item.id ? "adding here" : "add here"}
            </button>
          )}
          <button type="button" className="cl-tool" disabled={at <= 0} onClick={() => dispatch({ type: "move", id: item.id, by: -1 })} aria-label={`move this ${item.kind} earlier`}>←</button>
          <button type="button" className="cl-tool" disabled={at >= siblings.length - 1} onClick={() => dispatch({ type: "move", id: item.id, by: 1 })} aria-label={`move this ${item.kind} later`}>→</button>
          <button type="button" className="cl-tool cl-tool-remove" onClick={() => dispatch({ type: "remove", id: item.id })} aria-label={`remove this ${item.kind}`}>×</button>
        </span>
      </div>
      <div className="cl-brick-body">
        {item.kind === "button" && <ButtonBody label={passed.label} />}
        {item.kind === "card" && <CardBody label={passed.label} />}
        {item.kind === "counter" && <CounterBody item={item} />}
        {item.kind === "toggle" && <ToggleBody label={passed.label} />}
        {item.kind === "list" && <ListBody item={item} />}
        {item.kind === "panel" && <PanelBody item={item} />}
      </div>
      {xray && passed.label !== undefined && <p className="cl-flag cl-flag-prop mono">props.label ← “{passed.label}”</p>}
    </m.div>
  );
}

function ButtonBody({ label }: { label?: string }) {
  const [clicks, setClicks] = useState(0);
  const { xray } = useLab();
  return (
    <>
      <button type="button" className="cl-ui-btn" onClick={() => setClicks((value) => value + 1)}>{label ?? "button"}</button>
      <p className="cl-meta mono">clicked {clicks}{xray && <span> · useState</span>}</p>
    </>
  );
}

function CardBody({ label }: { label?: string }) {
  const { lab, xray } = useLab();
  return (
    <div className="cl-ui-card">
      <h4>{label ?? "a card"}</h4>
      <p>{lab.items.length} components on this canvas.</p>
      {xray && <p className="cl-flag cl-flag-derived mono">derived: items.length</p>}
    </div>
  );
}

function CounterBody({ item }: { item: Item }) {
  const { lab, dispatch, xray } = useLab();
  const [own, setOwn] = useState(0);
  const value = item.shared ? lab.count : own;
  const change = (by: number) => (item.shared ? dispatch({ type: "bump", by }) : setOwn((current) => Math.max(0, Math.min(99, current + by))));
  return (
    <>
      <div className="cl-ui-counter">
        <button type="button" onClick={() => change(-1)} aria-label="minus one">−</button>
        <output key={`${item.shared}-${value}`} aria-label="count">{value}</output>
        <button type="button" onClick={() => change(1)} aria-label="plus one">+</button>
      </div>
      <button type="button" className="cl-bind mono" aria-pressed={item.shared} onClick={() => dispatch({ type: "share", id: item.id })}>
        {item.shared ? "shared store" : "own state"}
      </button>
      {xray && <p className={`cl-flag mono ${item.shared ? "cl-flag-shared" : ""}`}>{item.shared ? "reads the shared store" : "useState, just for me"}</p>}
    </>
  );
}

function ToggleBody({ label }: { label?: string }) {
  const [on, setOn] = useState(false);
  const { xray } = useLab();
  return (
    <>
      <button type="button" role="switch" aria-checked={on} className="cl-ui-switch" onClick={() => setOn((value) => !value)}>
        <span className="cl-ui-knob" aria-hidden="true" />
        <span>{label ?? "toggle"} {on ? "on" : "off"}</span>
      </button>
      {xray && <p className="cl-flag mono">useState(false)</p>}
    </>
  );
}

function ListBody({ item }: { item: Item }) {
  const { lab, dispatch, xray } = useLab();
  const list = lab.lists[item.id] ?? [];
  return (
    <>
      <ul className="cl-ui-list">
        {list.map((entry, index) => <li key={`${index}-${entry}`}>{entry}</li>)}
        {list.length === 0 && <li className="cl-ui-empty">nothing yet</li>}
      </ul>
      <div className="cl-row">
        <button type="button" className="cl-mini mono" onClick={() => dispatch({ type: "push", id: item.id })} disabled={list.length >= 6}>add item</button>
        <button type="button" className="cl-mini mono" onClick={() => dispatch({ type: "pop", id: item.id })} disabled={list.length === 0}>remove</button>
        <span className="cl-meta mono">{list.length} item{list.length === 1 ? "" : "s"}</span>
      </div>
      {xray && <p className="cl-flag cl-flag-derived mono">its length feeds “list items” below</p>}
    </>
  );
}

function PanelBody({ item }: { item: Item }) {
  const { lab, dispatch } = useLab();
  const kids = childrenOf(lab, item.id);
  return (
    <>
      <label className="cl-label mono">
        label prop
        <input value={lab.labels[item.id] ?? ""} maxLength={16} onChange={(event) => dispatch({ type: "label", id: item.id, text: event.target.value })} />
      </label>
      <div className="cl-kids">
        <AnimatePresence mode="popLayout" initial={false}>
          {kids.map((kid) => <Piece key={kid.id} item={kid} />)}
        </AnimatePresence>
        {kids.length === 0 && <p className="cl-empty">empty. press “add here”, then add something.</p>}
      </div>
    </>
  );
}

/** The secret: every press adds another state variable until a reducer is the only sensible answer. */
function StateTray() {
  const [count, setCount] = useState(0);
  const [reduced, setReduced] = useState(false);
  const shown = stateNames.slice(0, count);
  const ready = count >= REDUCER_AFTER;

  const consolidate = () => {
    setReduced(true);
    discover("react-reducer");
  };

  return (
    <div className="cl-tray">
      <div className="cl-tray-head">
        <button type="button" className="cl-text-btn mono" disabled={reduced || count >= stateNames.length} onClick={() => setCount((value) => value + 1)}>
          + add state
        </button>
        {count > 0 && <span className="cl-meta mono">{reduced ? "1 reducer" : `${count} useState`}</span>}
        {reduced && <button type="button" className="cl-linkish" onClick={() => { setReduced(false); setCount(0); }}>start over</button>}
      </div>

      <LayoutGroup id="state-tray">
        {!reduced && count > 0 && (
          <ul className="cl-chips" aria-label="State variables">
            <AnimatePresence initial={false}>
              {shown.map((name) => (
                <m.li key={name} layoutId={`chip-${name}`} className="cl-chip" initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} transition={spring}>
                  <code>const [{name}, {setter(name)}] = useState(…);</code>
                </m.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
        {reduced && (
          <m.div className="cl-reducer" initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} transition={spring}>
            <code>const [state, dispatch] = useReducer(reducer, {"{"}</code>
            <span className="cl-fields">
              {shown.map((name) => <m.span key={name} layoutId={`chip-${name}`} className="cl-field" transition={spring}>{name}</m.span>)}
            </span>
            <code>{"}"});</code>
          </m.div>
        )}
      </LayoutGroup>

      <TrayLine ready={ready} reduced={reduced} onReduce={consolidate} />
    </div>
  );
}

function TrayLine({ ready, reduced, onReduce }: { ready: boolean; reduced: boolean; onReduce: () => void }): ReactNode {
  if (reduced) return <p className="cl-tray-line" aria-live="polite">better. one place to look, one way to change it.</p>;
  if (!ready) return null;
  return (
    <div className="cl-tray-line" aria-live="polite">
      <p>you probably wanted a reducer.</p>
      <button type="button" className="cl-mini mono" onClick={onReduce}>use reducer</button>
    </div>
  );
}
