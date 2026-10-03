"use client";

import { AnimatePresence, LayoutGroup, m } from "motion/react";
import { AppLink as Link } from "../ui/AppLink";
import { useState } from "react";
import type { Project } from "@/content/portfolio";
import { phaseLabel } from "@/content/site";
import { duration, easeOut, spring } from "@/lib/motion";
import { ProjectMedia } from "../work/ProjectMedia";

/**
 * Editorial project index. On wide screens a sticky preview follows whichever row is hovered or
 * focused, so keyboard users get the same reveal as mouse users. On narrow screens each row carries
 * its own thumbnail instead; nothing depends on hover.
 */
export function WorkIndex({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState<string | null>(null);
  const [previewed, setPreviewed] = useState(projects[0].slug);
  const shown = projects.find((project) => project.slug === previewed) ?? projects[0];
  const select = (slug: string) => {
    setActive(slug);
    setPreviewed(slug);
  };

  return (
    <div className="work-layout">
      <LayoutGroup id="work">
        <ol className="work-list" data-has-active={active !== null} onPointerLeave={() => setActive(null)}>
          {projects.map((project, index) => {
            const isActive = active === project.slug;
            return (
              <li key={project.slug} className="work-item">
                <Link
                  href={`/work/${project.slug}`}
                  className="work-link"
                  data-active={isActive}
                  onPointerEnter={() => select(project.slug)}
                  onFocus={() => select(project.slug)}
                  onBlur={() => setActive(null)}
                >
                  {isActive && (
                    <m.span layoutId="work-highlight" className="work-highlight" aria-hidden="true" transition={spring.snappy} />
                  )}
                  <span className="work-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <span className="work-main">
                    <span className="work-name">{project.name}</span>
                    <span className="work-hook">{project.intro[0]}</span>
                    <span className="work-meta mono">
                      <span className="status" data-phase={project.phase}>{phaseLabel[project.phase]}</span>
                      <span>{project.eyebrow.split(" · ").slice(0, 2).join(" · ")}</span>
                      <time dateTime={project.releasedOn}>{project.releasedOn.slice(0, 4)}</time>
                    </span>
                  </span>
                  <span className="work-arrow" aria-hidden="true">→</span>
                  <span className="work-thumb">
                    <ProjectMedia project={project} variant="thumb" decorative />
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </LayoutGroup>

      <aside className="work-preview" aria-hidden="true">
        <AnimatePresence mode="popLayout" initial={false}>
          <m.div
            key={shown.slug}
            className="preview-card"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: duration.base, ease: easeOut }}
          >
            <ProjectMedia project={shown} variant="preview" decorative />
            <div className="preview-body">
              <p>{shown.description}</p>
              {shown.facts.length > 0 && (
                <dl className="fact-row">
                  {shown.facts.map((fact) => (
                    <div key={fact.label}>
                      <dt>{fact.label}</dt>
                      <dd>{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <ul className="chip-list">
                {shown.stack.slice(0, 5).map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </m.div>
        </AnimatePresence>
      </aside>
    </div>
  );
}
