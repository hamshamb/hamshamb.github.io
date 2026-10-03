import type { AnchorHTMLAttributes } from "react";

/**
 * Internal link. This is a plain anchor on purpose: vinext 1.0.0-beta.2's client router throws inside
 * startTransition on a static export ("e is not a function"), so next/link clicks silently do nothing.
 * Every page here is a small prerendered file, so a normal document navigation is fast and reliable.
 * Swap back to next/link once vinext fixes client navigation for `output: "export"`.
 */
export function AppLink({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}
