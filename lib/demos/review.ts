// the review desk's model. pure functions, no react. it follows the illustrative C# in
// content/snippets/Review.cs (not CHC Review Studio source): every finding is anchored to exact text.

export const SEVERITIES = ["low", "medium", "high"] as const;
export const STATUSES = ["open", "resolved"] as const;
export type Severity = (typeof SEVERITIES)[number];
export type Status = (typeof STATUSES)[number];

/** an exact span of the source: the proof a finding points at. */
export type Anchor = { start: number; length: number };

export type Finding = { id: number; evidence: Anchor; comment: string; severity: Severity; status: Status };

export type Review = { source: string; findings: Finding[]; nextId: number };

// made up for this page. two of the sentences contradict themselves on purpose.
export const SAMPLE =
  "The ferry left at dawn, carrying nine passengers and a crate of bees. Marta had counted eleven tickets, but she wrote nine in the log anyway. By noon the bees were louder than the engine, and nobody mentioned it. The captain insisted the route was only forty minutes long; it took six hours. Nobody on board was surprised, least of all the bees.";

export const DEFAULT_COMMENT = "needs a second look";

export const quote = (source: string, evidence: Anchor) => source.slice(evidence.start, evidence.start + evidence.length);

export function fits(source: string, evidence: Anchor) {
  return Number.isInteger(evidence.start) && Number.isInteger(evidence.length) && evidence.start >= 0 && evidence.length > 0 && evidence.start + evidence.length <= source.length;
}

export function newReview(source: string): Review {
  return { source, findings: [], nextId: 1 };
}

/** like Review.Add in the C#: evidence must sit inside the source, or it throws. */
export function addFinding(review: Review, evidence: Anchor, comment: string, severity: Severity, status: Status = "open"): Review {
  if (!fits(review.source, evidence)) throw new RangeError("evidence must sit inside the source");
  const finding: Finding = { id: review.nextId, evidence, comment: comment.trim() || DEFAULT_COMMENT, severity, status };
  return { ...review, findings: [...review.findings, finding], nextId: review.nextId + 1 };
}

export function updateFinding(review: Review, id: number, patch: Partial<Pick<Finding, "comment" | "severity" | "status">>): Review {
  return { ...review, findings: review.findings.map((finding) => (finding.id === id ? { ...finding, ...patch } : finding)) };
}

/** Finding.Resolve in the C#. */
export const resolveFinding = (review: Review, id: number) => updateFinding(review, id, { status: "resolved" });

/** Review.OpenCount: open findings at or above a severity. */
export function openCount(review: Review, atLeast: Severity = "low") {
  const floor = SEVERITIES.indexOf(atLeast);
  return review.findings.filter((finding) => finding.status === "open" && SEVERITIES.indexOf(finding.severity) >= floor).length;
}

/** findings whose evidence covers a character offset. */
export const findingsAt = (review: Review, offset: number) =>
  review.findings.filter((finding) => offset >= finding.evidence.start && offset < finding.evidence.start + finding.evidence.length);

/** the clickable phrases: runs of text ending at a comma, semicolon or full stop. whitespace stays out. */
export function chunksOf(source: string): Anchor[] {
  const chunks: Anchor[] = [];
  for (const match of source.matchAll(/[^,.;!?]+[,.;!?]?/g)) {
    const text = match[0];
    const lead = text.length - text.trimStart().length;
    const trimmed = text.trim();
    if (trimmed) chunks.push({ start: (match.index ?? 0) + lead, length: trimmed.length });
  }
  return chunks;
}

/** one anchor covering chunk a through chunk b, in either order. */
export function spanOfChunks(chunks: readonly Anchor[], a: number, b: number): Anchor {
  const first = chunks[Math.min(a, b)];
  const last = chunks[Math.max(a, b)];
  return { start: first.start, length: last.start + last.length - first.start };
}

/** trim whitespace off both ends of a raw text selection, returning null if nothing is left. */
export function trimAnchor(source: string, start: number, end: number): Anchor | null {
  let from = Math.max(0, Math.min(start, end));
  let to = Math.min(source.length, Math.max(start, end));
  while (from < to && /\s/.test(source[from])) from += 1;
  while (to > from && /\s/.test(source[to - 1])) to -= 1;
  return to > from ? { start: from, length: to - from } : null;
}

export type Segment = { start: number; end: number; text: string };

/** cut the source at every boundary so each piece is uniform: one text node, one set of highlights. */
export function segment(source: string, cuts: Iterable<number>): Segment[] {
  const points = [...new Set([0, source.length, ...[...cuts].filter((cut) => cut > 0 && cut < source.length)])].sort((a, b) => a - b);
  const pieces: Segment[] = [];
  for (let i = 0; i < points.length - 1; i += 1) pieces.push({ start: points[i], end: points[i + 1], text: source.slice(points[i], points[i + 1]) });
  return pieces;
}

export const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;

/** two findings already in the desk when it opens, so the list is not empty and the idea is visible. */
export function seeded(): Review {
  let review = newReview(SAMPLE);
  const first = "Marta had counted eleven tickets, but she wrote nine in the log anyway";
  review = addFinding(review, { start: SAMPLE.indexOf(first), length: first.length }, "eleven tickets, nine in the log. which one is true?", "medium");
  const second = "nobody mentioned it";
  review = addFinding(review, { start: SAMPLE.indexOf(second), length: second.length }, "fine as a joke, left alone", "low", "resolved");
  return review;
}
