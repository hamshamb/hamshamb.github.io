"use client";

import { useState } from "react";

type Severity = "note" | "minor" | "major";
type Finding = { id: number; start: number; length: number; comment: string; severity: Severity; resolved: boolean };

// made-up sample text, written for this demo
const SOURCE =
  "The lighthouse keeper counted the ships every night. On the third night he counted eleven, although only nine had left the harbour. He wrote the number down anyway and went back to sleep.";

const suggestions = [
  { quote: "eleven, although only nine had left the harbour", comment: "the counts contradict each other; is this deliberate?", severity: "major" as const },
  { quote: "every night", comment: "habitual tense sets up the break nicely", severity: "note" as const },
  { quote: "went back to sleep", comment: "flat ending, consider a stronger final beat", severity: "minor" as const },
];

/** A browser version of the illustrative C# model: every finding is anchored to an exact span of text. */
export function ReviewDemo() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [active, setActive] = useState<number | null>(null);

  const add = (index: number) => {
    const suggestion = suggestions[index];
    const start = SOURCE.indexOf(suggestion.quote);
    if (start < 0 || findings.some((finding) => finding.start === start)) return;
    setFindings((list) => [...list, { id: Date.now() + index, start, length: suggestion.quote.length, comment: suggestion.comment, severity: suggestion.severity, resolved: false }]);
  };

  const open = findings.filter((finding) => !finding.resolved);
  const sorted = [...findings].sort((a, b) => a.start - b.start);
  const segments: { text: string; finding?: Finding }[] = [];
  let at = 0;
  for (const finding of sorted) {
    if (finding.start > at) segments.push({ text: SOURCE.slice(at, finding.start) });
    segments.push({ text: SOURCE.slice(finding.start, finding.start + finding.length), finding });
    at = finding.start + finding.length;
  }
  segments.push({ text: SOURCE.slice(at) });

  return (
    <div className="review">
      <p className="review-source">
        {segments.map((segment, index) =>
          segment.finding ? (
            <mark key={index} data-severity={segment.finding.severity} data-resolved={segment.finding.resolved || undefined} data-active={active === segment.finding.id || undefined}>
              {segment.text}
            </mark>
          ) : (
            <span key={index}>{segment.text}</span>
          ),
        )}
      </p>
      <div className="machine-events" role="group" aria-label="Add a finding">
        {suggestions.map((suggestion, index) => (
          <button key={suggestion.quote} type="button" className="button" onClick={() => add(index)} disabled={findings.some((finding) => SOURCE.indexOf(suggestion.quote) === finding.start)}>
            anchor &ldquo;{suggestion.quote.split(" ").slice(0, 3).join(" ")}...&rdquo;
          </button>
        ))}
      </div>
      <p className="review-status mono" aria-live="polite">
        {findings.length} findings · {open.filter((finding) => finding.severity === "major").length} major open
      </p>
      <ul className="review-findings">
        {findings.map((finding) => (
          <li key={finding.id} data-severity={finding.severity} data-resolved={finding.resolved || undefined}>
            <button type="button" className="review-quote" onClick={() => setActive(finding.id)} aria-label={`highlight the evidence for: ${finding.comment}`}>
              <span className="mono">{finding.severity} · chars {finding.start}-{finding.start + finding.length}</span>
              <q>{SOURCE.slice(finding.start, finding.start + finding.length)}</q>
            </button>
            <p>{finding.comment}</p>
            <button type="button" className="review-resolve" onClick={() => setFindings((list) => list.map((item) => (item.id === finding.id ? { ...item, resolved: !item.resolved } : item)))}>
              {finding.resolved ? "reopen" : "resolve"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
