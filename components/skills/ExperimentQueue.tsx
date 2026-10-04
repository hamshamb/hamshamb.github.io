"use client";

import { type FormEvent, useReducer, useState } from "react";

type Stage = "idea" | "building" | "broken" | "shipped";
type Experiment = { id: number; name: string; stage: Stage };
type Action = { type: "add"; name: string } | { type: "move"; id: number; to: Stage };

const stages: Stage[] = ["idea", "building", "broken", "shipped"];
// where an experiment can honestly go next from each stage
const next: Record<Stage, Stage[]> = {
  idea: ["building"],
  building: ["broken", "shipped"],
  broken: ["building"],
  shipped: ["broken"],
};

const start: Experiment[] = [
  { id: 1, name: "a scrambler for the cube", stage: "shipped" },
  { id: 2, name: "rewrite it in Rust", stage: "idea" },
  { id: 3, name: "mesh chat over Bluetooth", stage: "building" },
  { id: 4, name: "sync, but without a server", stage: "broken" },
];

function reducer(items: Experiment[], action: Action): Experiment[] {
  switch (action.type) {
    case "add":
      return [...items, { id: Math.max(0, ...items.map((item) => item.id)) + 1, name: action.name, stage: "idea" }];
    case "move":
      return items.map((item) => (item.id === action.id ? { ...item, stage: action.to } : item));
  }
}

function Column({ stage, items, dispatch }: { stage: Stage; items: Experiment[]; dispatch: (action: Action) => void }) {
  return (
    <section className="queue-col" aria-label={`${stage}, ${items.length}`}>
      <h3 className="mono">{stage} <span>{items.length}</span></h3>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <span>{item.name}</span>
            {next[item.stage].map((to) => (
              <button key={to} type="button" onClick={() => dispatch({ type: "move", id: item.id, to })}>
                {to === "broken" ? "it broke" : to === "building" ? "build it" : "ship it"}
              </button>
            ))}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ExperimentQueue() {
  const [items, dispatch] = useReducer(reducer, start);
  const [draft, setDraft] = useState("");

  // derived, never stored: counts and the honest warning
  const count = (stage: Stage) => items.filter((item) => item.stage === stage).length;
  const tooBroken = count("broken") > count("building");

  const add = (event: FormEvent) => {
    event.preventDefault();
    if (draft.trim()) dispatch({ type: "add", name: draft.trim().slice(0, 48) });
    setDraft("");
  };

  return (
    <div className="queue">
      <form className="queue-add" onSubmit={add}>
        <label htmlFor="queue-idea" className="mono">new idea</label>
        <input id="queue-idea" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="wouldn't it be cool if..." />
        <button type="submit" className="button">add</button>
      </form>
      <p className="queue-status" aria-live="polite">
        {items.length} experiments, {count("shipped")} shipped.{tooBroken ? " more broken than in progress, which feels about right." : ""}
      </p>
      <div className="queue-board">
        {stages.map((stage) => (
          <Column key={stage} stage={stage} items={items.filter((item) => item.stage === stage)} dispatch={dispatch} />
        ))}
      </div>
    </div>
  );
}
