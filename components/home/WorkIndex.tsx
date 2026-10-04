"use client";

import { AnimatePresence, LayoutGroup, m } from "motion/react";
import { useState } from "react";
import type { Project } from "@/content/portfolio";
import { phaseLabel } from "@/content/site";
import { duration, easeOut, spring } from "@/lib/motion";
import { AppLink as Link } from "../ui/AppLink";
import { IdentityArt } from "../work/ProjectMedia";

function yearOf(project: Project) {
  return project.releasedOn ? project.releasedOn.slice(0, 4) : "unreleased";
}

/**
 * Selected work. Each row leads with the idea, not the stack. On wide screens a sticky poster
 * shows the project's identity for whichever row is hovered or focused, so keyboard users get the
 * same reveal. Narrow screens show the identity inside each row instead; nothing needs hover.
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
                    <span className="work-meta mono">
                      <span className="status" data-phase={project.phase}>{project.availability}</span>
                      {project.statusDetail && <span className="status-detail">{project.statusDetail}</span>}
                      {project.releasedOn && <span>{yearOf(project)}</span>}
                    </span>
                    <span className="work-name">{project.name}</span>
                    <span className="work-hook">{project.hook}</span>
                    <span className="work-stack mono">{project.stack.slice(0, 3).join(" · ")}</span>
                  </span>
                  <span className="work-arrow" aria-hidden="true">→</span>
                  <span className="work-thumb">
                    <IdentityArt identity={project.identity} variant="thumb" decorative animated={false} />
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: duration.base, ease: easeOut }}
          >
            <p className="preview-coords mono">
              <span>{yearOf(shown)}</span>
              <span>{phaseLabel[shown.phase]}</span>
              <span>{shown.eyebrow.split(" · ")[0].toLowerCase()}</span>
            </p>
            <m.div className="preview-art" animate={{ y: active ? -6 : 0 }} transition={spring.soft}>
              <IdentityArt identity={shown.identity} variant="preview" decorative />
            </m.div>
            <div className="preview-body">
              <p>{shown.summary}</p>
              {shown.aside && <p className="annotation">{shown.aside}</p>}
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
            </div>
          </m.div>
        </AnimatePresence>
      </aside>
    </div>
  );
}
