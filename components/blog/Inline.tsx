import type { ReactNode } from "react";
import { AppLink as Link } from "../ui/AppLink";

/**
 * Inline text for posts: `code` and [links](/path), nothing else. Everything renders as text
 * nodes, so post content can never inject markup.
 */
export function Inline({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  const pattern = /`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const at = match.index ?? 0;
    if (at > last) parts.push(text.slice(last, at));
    if (match[1]) {
      parts.push(<code key={at}>{match[1]}</code>);
    } else {
      const href = match[3];
      parts.push(
        href.startsWith("/") ? (
          <Link key={at} className="text-link" href={href}>{match[2]}</Link>
        ) : (
          <a key={at} className="text-link" href={href} target="_blank" rel="noopener noreferrer">{match[2]}</a>
        ),
      );
    }
    last = at + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}
