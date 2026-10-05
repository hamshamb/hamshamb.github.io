"use client";

import { type KeyboardEvent, type ReactNode, useEffect, useId, useRef, useState } from "react";
import {
  type Anchor,
  addFinding,
  chunksOf,
  type Finding,
  findingsAt,
  openCount,
  quote,
  SAMPLE,
  seeded,
  segment,
  type Severity,
  SEVERITIES,
  spanOfChunks,
  type Status,
  STATUSES,
  trimAnchor,
  updateFinding,
  wordCount,
} from "@/lib/demos/review";
import { Segmented } from "./apps/Segmented";

/**
 * A small desktop-style review window: pick evidence in a paragraph, attach a finding to it,
 * and watch the inspector follow whatever you touch. The model is lib/demos/review.ts, which
 * follows the illustrative C# beside it. Every finding keeps the exact span that caused it.
 */

type Inspect = { kind: "document" } | { kind: "span" } | { kind: "finding"; id: number };
type Tab = "doc" | "findings" | "inspector";
type Sel = { anchor: Anchor; from: "chunks" | "text" };

const CHUNKS = chunksOf(SAMPLE);
const rank = (severity: Severity) => SEVERITIES.indexOf(severity);
const end = (anchor: Anchor) => anchor.start + anchor.length;
const same = (a: Anchor, b: Anchor) => a.start === b.start && a.length === b.length;

/** map a point inside the paragraph back to a character offset in SAMPLE. */
function offsetOf(root: HTMLElement, node: Node | null, offset: number): number | null {
  if (!node || !root.contains(node)) return null;
  const element = node instanceof Element ? node : node.parentElement;
  const piece = element?.closest<HTMLElement>("[data-start]");
  if (piece && root.contains(piece)) {
    const start = Number(piece.dataset.start);
    if (node.nodeType === Node.TEXT_NODE) return start + offset;
    return offset > 0 ? start + (piece.textContent?.length ?? 0) : start;
  }
  const child = node.childNodes[offset];
  const target = child instanceof HTMLElement ? (child.matches("[data-start]") ? child : child.querySelector<HTMLElement>("[data-start]")) : null;
  if (target) return Number(target.dataset.start);
  const all = root.querySelectorAll<HTMLElement>("[data-start]");
  const last = all[all.length - 1];
  return last && offset > 0 ? Number(last.dataset.start) + (last.textContent?.length ?? 0) : null;
}

export function ReviewDesk() {
  const [review, setReview] = useState(seeded);
  const [sel, setSel] = useState<Sel | null>(null);
  const [inspect, setInspect] = useState<Inspect>({ kind: "document" });
  const [tab, setTab] = useState<Tab>("doc");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [status, setStatus] = useState<Status>("open");
  const [comment, setComment] = useState("");
  const [note, setNote] = useState("pick some text, then create a finding.");
  const [rove, setRove] = useState(0);
  const [anchorChunk, setAnchorChunk] = useState<number | null>(null);
  const docRef = useRef<HTMLParagraphElement>(null);
  const id = useId();

  // real text selection (mouse drag, or touch handles) becomes the evidence span
  useEffect(() => {
    const onChange = () => {
      const root = docRef.current;
      const selection = window.getSelection();
      if (!root || !selection || selection.rangeCount === 0 || selection.isCollapsed) return;
      const a = offsetOf(root, selection.anchorNode, selection.anchorOffset);
      const b = offsetOf(root, selection.focusNode, selection.focusOffset);
      if (a === null || b === null) return;
      const anchor = trimAnchor(SAMPLE, a, b);
      if (!anchor) return;
      setSel((prev) => (prev && prev.from === "text" && same(prev.anchor, anchor) ? prev : { anchor, from: "text" }));
      setInspect((prev) => (prev.kind === "span" ? prev : { kind: "span" }));
    };
    document.addEventListener("selectionchange", onChange);
    return () => document.removeEventListener("selectionchange", onChange);
  }, []);

  const findings = [...review.findings].sort((a, b) => a.evidence.start - b.evidence.start || a.id - b.id);
  const open = openCount(review);
  const highOpen = openCount(review, "high");
  const active = inspect.kind === "finding" ? review.findings.find((finding) => finding.id === inspect.id) : undefined;

  const pickChunk = (index: number, extend: boolean, from: number | null = anchorChunk) => {
    let next: Anchor;
    if (extend && from !== null) {
      next = spanOfChunks(CHUNKS, from, index);
      setAnchorChunk(from);
    } else {
      next = CHUNKS[index];
      if (sel?.from === "chunks" && same(sel.anchor, next)) {
        dropSelection();
        setNote("selection cleared.");
        return;
      }
      setAnchorChunk(index);
    }
    window.getSelection()?.removeAllRanges();
    setSel({ anchor: next, from: "chunks" });
    setInspect({ kind: "span" });
    setNote(`selected characters ${next.start} to ${end(next)}.`);
  };

  const dropSelection = () => {
    window.getSelection()?.removeAllRanges();
    setAnchorChunk(null);
    setSel(null);
  };
  const clearSelection = () => {
    dropSelection();
    setNote("selection cleared.");
  };

  const create = () => {
    if (!sel) return;
    try {
      const next = addFinding(review, sel.anchor, comment, severity, status);
      const created = next.findings[next.findings.length - 1];
      setReview(next);
      setComment("");
      setInspect({ kind: "finding", id: created.id });
      setNote(`finding #${created.id} created on "${quote(SAMPLE, created.evidence)}".`);
      dropSelection();
    } catch {
      setNote("that span does not fit the text. pick again.");
    }
  };

  const openFinding = (target: number) => {
    setInspect({ kind: "finding", id: target });
    if (tab === "findings") setTab("inspector");
  };
  const patch = (target: number, change: Partial<Pick<Finding, "comment" | "severity" | "status">>) => setReview((current) => updateFinding(current, target, change));

  const onChunkKey = (event: KeyboardEvent<HTMLSpanElement>, index: number) => {
    const goto = (to: number) => {
      const j = Math.max(0, Math.min(CHUNKS.length - 1, to));
      event.preventDefault();
      document.getElementById(`${id}-chunk-${j}`)?.focus();
      if (event.shiftKey) pickChunk(j, true, anchorChunk ?? index);
    };
    if (event.key === "ArrowRight" || event.key === "ArrowDown") goto(index + 1);
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") goto(index - 1);
    else if (event.key === "Home") goto(0);
    else if (event.key === "End") goto(CHUNKS.length - 1);
    else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      pickChunk(index, event.shiftKey);
    } else if (event.key === "Escape") clearSelection();
    else if (event.key.toLowerCase() === "c" && !event.ctrlKey && !event.metaKey && sel) {
      event.preventDefault();
      create();
    }
  };

  // paint the paragraph: cut at every phrase and finding edge so each piece is uniform
  const cuts = new Set<number>();
  for (const chunk of CHUNKS) {
    cuts.add(chunk.start);
    cuts.add(end(chunk));
  }
  for (const finding of review.findings) {
    cuts.add(finding.evidence.start);
    cuts.add(end(finding.evidence));
  }
  const pieces: ReactNode[] = [];
  let group: { chunk: number; items: ReactNode[] } | null = null;
  const flush = () => {
    if (!group) return;
    const index = group.chunk;
    const chunk = CHUNKS[index];
    const selected = sel?.from === "chunks" && chunk.start >= sel.anchor.start && end(chunk) <= end(sel.anchor);
    pieces.push(
      <span
        key={`chunk-${index}`}
        id={`${id}-chunk-${index}`}
        className="desk-chunk"
        role="button"
        tabIndex={rove === index ? 0 : -1}
        aria-pressed={selected}
        data-selected={selected || undefined}
        onFocus={() => setRove(index)}
        onClick={(event) => {
          if (window.getSelection()?.toString()) return;
          pickChunk(index, event.shiftKey);
        }}
        onKeyDown={(event) => onChunkKey(event, index)}
      >
        {group.items}
      </span>,
    );
    group = null;
  };
  for (const piece of segment(SAMPLE, cuts)) {
    const chunkIndex = CHUNKS.findIndex((chunk) => piece.start >= chunk.start && piece.end <= end(chunk));
    const covering = findingsAt(review, piece.start);
    const top = covering.reduce<Severity | undefined>((best, finding) => (best === undefined || rank(finding.severity) > rank(best) ? finding.severity : best), undefined);
    const ends = review.findings.filter((finding) => end(finding.evidence) === piece.end).map((finding) => finding.id);
    const element = (
      <span
        key={piece.start}
        className="desk-seg"
        data-start={piece.start}
        data-sev={top}
        data-resolved={(covering.length > 0 && covering.every((finding) => finding.status === "resolved")) || undefined}
        data-active={(active && covering.some((finding) => finding.id === active.id)) || undefined}
        data-ends={ends.length ? ends.map((value) => `#${value}`).join(" ") : undefined}
      >
        {piece.text}
      </span>
    );
    if (chunkIndex >= 0) {
      if (group && group.chunk === chunkIndex) group.items.push(element);
      else {
        flush();
        group = { chunk: chunkIndex, items: [element] };
      }
    } else {
      flush();
      pieces.push(element);
    }
  }
  flush();

  const here = sel ? review.findings.filter((finding) => finding.evidence.start < end(sel.anchor) && end(finding.evidence) > sel.anchor.start) : [];

  const inspector =
    inspect.kind === "finding" && active ? (
      <dl className="desk-props">
        <div><dt>finding</dt><dd>#{active.id}</dd></div>
        <div className="desk-prop-wide">
          <dt>evidence</dt>
          <dd>
            <q>{quote(SAMPLE, active.evidence)}</q>
            <span className="desk-prop-sub mono">characters {active.evidence.start} to {end(active.evidence)} ({active.evidence.length})</span>
          </dd>
        </div>
        <div className="desk-prop-wide">
          <dt><label htmlFor={`${id}-comment`}>comment</label></dt>
          <dd>
            <input id={`${id}-comment`} className="desk-input" value={active.comment} onChange={(event) => patch(active.id, { comment: event.target.value })} />
          </dd>
        </div>
        <div className="desk-prop-wide">
          <dt>severity</dt>
          <dd><Segmented legend="severity" value={active.severity} options={SEVERITIES} onChange={(value) => patch(active.id, { severity: value })} className="seg-compact" /></dd>
        </div>
        <div className="desk-prop-wide">
          <dt>status</dt>
          <dd><Segmented legend="status" value={active.status} options={STATUSES} onChange={(value) => patch(active.id, { status: value })} className="seg-compact" /></dd>
        </div>
      </dl>
    ) : inspect.kind === "span" && sel ? (
      <dl className="desk-props">
        <div><dt>selection</dt><dd>{sel.from === "text" ? "typed by dragging" : "phrases"}</dd></div>
        <div className="desk-prop-wide">
          <dt>text</dt>
          <dd>
            <q>{quote(SAMPLE, sel.anchor)}</q>
            <span className="desk-prop-sub mono">characters {sel.anchor.start} to {end(sel.anchor)} ({sel.anchor.length})</span>
          </dd>
        </div>
        <div className="desk-prop-wide">
          <dt>findings here</dt>
          <dd>
            {here.length ? (
              <span className="desk-links">
                {here.map((finding) => (
                  <button key={finding.id} type="button" className="desk-link" onClick={() => openFinding(finding.id)}>#{finding.id} {finding.severity}</button>
                ))}
              </span>
            ) : (
              "none yet"
            )}
          </dd>
        </div>
        <div className="desk-prop-wide"><dd><button type="button" className="desk-btn desk-btn-primary" onClick={create}>create finding from this</button></dd></div>
      </dl>
    ) : (
      <dl className="desk-props">
        <div><dt>document</dt><dd>ferry.txt (made up)</dd></div>
        <div><dt>characters</dt><dd>{SAMPLE.length}</dd></div>
        <div><dt>words</dt><dd>{wordCount(SAMPLE)}</dd></div>
        <div><dt>phrases</dt><dd>{CHUNKS.length}</dd></div>
        <div><dt>findings</dt><dd>{review.findings.length} ({open} open)</dd></div>
        <div><dt>high, open</dt><dd>{highOpen}</dd></div>
        <div className="desk-prop-wide"><dd className="desk-prop-sub">click a phrase, a finding or this panel&apos;s title to see its properties.</dd></div>
      </dl>
    );

  return (
    <div className="desk-wrap">
      <div className="desk" data-tab={tab}>
        <div className="desk-titlebar">
          <span className="desk-appicon" aria-hidden="true" />
          <span className="desk-title">Review Desk <span className="desk-title-sub">ferry.txt</span></span>
          <span className="desk-caption" aria-hidden="true"><i>&minus;</i><i>&#9633;</i><i>&times;</i></span>
        </div>

        <div className="desk-toolbar" role="toolbar" aria-label="Finding">
          <button type="button" className="desk-btn desk-btn-primary" disabled={!sel} onClick={create}>
            create finding
          </button>
          <Segmented legend="severity" value={severity} options={SEVERITIES} onChange={setSeverity} className="seg-compact" />
          <Segmented legend="status" value={status} options={STATUSES} onChange={setStatus} className="seg-compact" />
          <label className="desk-note">
            <span className="mono">note</span>
            <input className="desk-input" value={comment} placeholder="why is this a problem?" onChange={(event) => setComment(event.target.value)} />
          </label>
        </div>

        <div className="desk-tabs mono" role="tablist" aria-label="Pane">
          {(
            [
              ["doc", "document"],
              ["findings", `findings ${review.findings.length}`],
              ["inspector", "inspector"],
            ] as const
          ).map(([value, label]) => (
            <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => setTab(value)}>
              {label}
            </button>
          ))}
        </div>

        <div className="desk-panes">
          <section className="desk-pane desk-pane-findings" aria-label="Findings">
            <h3 className="desk-pane-head mono">findings <span>{review.findings.length}</span></h3>
            <ul className="desk-list">
              {findings.length === 0 && <li className="desk-empty">no findings yet. select text and create one.</li>}
              {findings.map((finding) => (
                <li key={finding.id} data-sev={finding.severity} data-status={finding.status} data-active={active?.id === finding.id || undefined}>
                  <button type="button" className="desk-find" aria-pressed={active?.id === finding.id} onClick={() => openFinding(finding.id)}>
                    <span className="desk-find-meta mono"><b>#{finding.id}</b> {finding.severity} &middot; {finding.status}</span>
                    <q>{quote(SAMPLE, finding.evidence)}</q>
                    <span className="desk-find-comment">{finding.comment}</span>
                  </button>
                  <button type="button" className="desk-tick" onClick={() => patch(finding.id, { status: finding.status === "open" ? "resolved" : "open" })} aria-label={`${finding.status === "open" ? "resolve" : "reopen"} finding ${finding.id}`}>
                    {finding.status === "open" ? "resolve" : "reopen"}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="desk-pane desk-pane-doc" aria-label="Document">
            <h3 className="desk-pane-head mono">
              <button type="button" className="desk-docname" onClick={() => { setInspect({ kind: "document" }); dropSelection(); }}>ferry.txt</button>
              <span>{sel ? `${sel.anchor.length} chars selected` : "nothing selected"}</span>
            </h3>
            <p className="desk-text" ref={docRef} aria-describedby={`${id}-help`}>{pieces}</p>
            <p className="desk-help" id={`${id}-help`}>
              <span className="desk-help-kb">drag across text, or tab to a phrase: arrows move, space selects, shift extends, c creates a finding.</span>
              <span className="desk-help-touch">tap a phrase to select it, or press and hold to pick your own words.</span>
            </p>
          </section>

          <section className="desk-pane desk-pane-inspector" aria-label="Inspector">
            <h3 className="desk-pane-head mono">inspector <span>{inspect.kind === "finding" ? "finding" : inspect.kind === "span" && sel ? "selection" : "document"}</span></h3>
            {inspector}
          </section>
        </div>

        <p className="desk-status mono" role="status">
          <span>{note}</span>
          <span>{review.findings.length} findings &middot; {open} open &middot; {highOpen} high</span>
        </p>
      </div>
    </div>
  );
}
