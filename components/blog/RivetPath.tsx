/**
 * How Rivet moved, in years only. The stages come from the portfolio's own development history;
 * the last two are honestly still open.
 */
const stages = [
  { when: "2022", what: "idea", detail: "can two nearby phones talk privately without the usual infrastructure?", state: "done" },
  { when: "after", what: "early development", detail: "the question slowly turned into Bluetooth discovery, encrypted envelopes and store-and-forward.", state: "done" },
  { when: "2025", what: "protocol + relay", detail: "protocol design, relay behaviour, native radio work.", state: "done" },
  { when: "2025", what: "security model", detail: "threat modelling, and writing down what it cannot do.", state: "done" },
  { when: "2026", what: "v1 freeze", detail: "protocol frozen for version 1, automated suite green.", state: "done" },
  { when: "next", what: "phone testing", detail: "field tests on real devices. planned, not run yet.", state: "open" },
  { when: "next", what: "independent review", detail: "someone whose job is breaking things. not done yet.", state: "open" },
] as const;

export function RivetPath() {
  return (
    <ol className="rivet-path">
      {stages.map((stage) => (
        <li key={stage.what} data-state={stage.state}>
          <span className="rivet-path-when mono">{stage.when}</span>
          <span className="rivet-path-dot" aria-hidden="true" />
          <strong>{stage.what}</strong>
          <span className="rivet-path-detail">{stage.detail}</span>
        </li>
      ))}
    </ol>
  );
}
