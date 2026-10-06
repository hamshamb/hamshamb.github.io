import { rivetPost } from "./posts/why-i-made-rivet";

/**
 * The blog. Posts are typed content, not a CMS: metadata plus an ordered list of blocks.
 * Interactive figures are named here and rendered as small client islands; the prose stays static.
 */

export type FigureId = "rivet-route" | "relay-playground" | "envelope" | "threat-model" | "rivet-path" | "courier";

/** Inline text supports `code` and [links](/path). Nothing else, and never raw HTML. */
export type Block =
  | { type: "p"; text: string }
  | { type: "lede"; text: string }
  | { type: "h2"; index: string; text: string }
  | { type: "lines"; lines: string[] }
  | { type: "list"; items: string[] }
  | { type: "aside"; label: string; text: string }
  | { type: "figure"; figure: FigureId; caption: string };

export type BlogPost = {
  slug: string;
  title: string;
  dek: string;
  eyebrow: string;
  description: string;
  publishedOn: string;
  updatedOn?: string;
  tags: string[];
  /** The case study this post tells the story behind. */
  project?: string;
  blocks: Block[];
};

export const posts: BlogPost[] = [rivetPost];

export function getPost(slug: string) {
  return posts.find((post) => post.slug === slug);
}

export function postForProject(projectSlug: string) {
  return posts.find((post) => post.project === projectSlug);
}

const words = (text: string) => text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").split(/\s+/).filter(Boolean).length;

/** Counted from the actual words, at 220 a minute, plus a little for each figure. */
export function readingMinutes(post: BlogPost) {
  let count = 0;
  let figures = 0;
  for (const block of post.blocks) {
    if (block.type === "figure") {
      figures += 1;
      count += words(block.caption);
    } else if (block.type === "lines") count += block.lines.reduce((sum, line) => sum + words(line), 0);
    else if (block.type === "list") count += block.items.reduce((sum, item) => sum + words(item), 0);
    else count += words(block.text);
  }
  return Math.max(1, Math.round(count / 220 + figures * 0.3));
}
