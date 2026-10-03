"use client";

import { useEffect } from "react";

/** Links shared from the old terminal site used hash routes. Send them to where that content lives now. */
const sectionAliases: Record<string, string> = {
  home: "intro",
  projects: "work",
  stack: "about",
};

export function LegacyHashRedirect({ slugs }: { slugs: string[] }) {
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash.startsWith("project-")) {
      const slug = hash.slice("project-".length);
      if (slugs.includes(slug)) {
        window.location.replace(`/work/${slug}`);
      }
      return;
    }
    const alias = sectionAliases[hash];
    if (alias) {
      window.history.replaceState(null, "", `#${alias}`);
      document.getElementById(alias)?.scrollIntoView();
    }
  }, [slugs]);

  return null;
}
