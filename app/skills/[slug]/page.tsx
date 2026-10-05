import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import { CodePanel } from "@/components/skills/CodePanel";
import { ComponentLab } from "@/components/skills/ComponentLab";
import { MutationLab } from "@/components/skills/MutationLab";
import { PlaygroundShell } from "@/components/skills/PlaygroundShell";
import { ReviewDesk } from "@/components/skills/ReviewDesk";
import { SessionLobby } from "@/components/skills/SessionLobby";
import { SignalSnake } from "@/components/skills/SignalSnake";
import { TypeFactory } from "@/components/skills/TypeFactory";
import { AppLink as Link } from "@/components/ui/AppLink";
import { TechIcon } from "@/components/ui/TechChip";
import { portfolio } from "@/content/portfolio";
import { getSkill, skillPages } from "@/content/skills";
import { getTech, resolveTech, type SkillSlug } from "@/content/tech";
import { highlightLines } from "@/lib/highlight";

type Params = { slug: string };

/** Each demo is its own client island, so a page only loads the one it shows. */
const demos: Record<SkillSlug, ComponentType> = {
  python: SignalSnake,
  typescript: TypeFactory,
  react: ComponentLab,
  java: SessionLobby,
  csharp: ReviewDesk,
  "html-css": MutationLab,
};

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return skillPages.map((skill) => ({ slug: skill.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const skill = getSkill(slug);
  if (!skill) return {};
  return {
    title: skill.name,
    description: `${skill.line} ${skill.demo.title}, with the code beside it.`,
    alternates: { canonical: `/skills/${skill.slug}` },
    openGraph: { title: `${skill.name} · hamshamb`, description: skill.line, url: `/skills/${skill.slug}`, images: ["/og.png"] },
  };
}

/** Projects whose stack really includes this technology. */
function usedIn(techId: string) {
  const uses = (stack: string[]) => stack.some((label) => resolveTech(label)?.id === techId);
  const projects = portfolio.projects.filter((project) => uses(project.stack)).map((project) => ({ name: project.name, href: `/work/${project.slug}` }));
  const lab = uses(portfolio.mx.stack) ? [{ name: portfolio.mx.name, href: "/#lab" }] : [];
  const small = portfolio.smallThings.filter((thing) => uses(thing.stack)).map((thing) => ({ name: thing.name, href: thing.source }));
  return [...projects, ...lab, ...small];
}

export default async function SkillPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const skill = getSkill(slug);
  if (!skill) notFound();
  const Demo = demos[skill.slug];
  const tech = getTech(skill.techId);
  const files = skill.files.map((file) => {
    const code = readFileSync(join(process.cwd(), file.path), "utf8").replace(/\r\n/g, "\n");
    return { name: file.name, code, lines: highlightLines(code, file.lang) };
  });
  const places = usedIn(skill.techId);
  const index = skillPages.findIndex((item) => item.slug === skill.slug);
  const nextSkill = skillPages[(index + 1) % skillPages.length];

  return (
    <main id="main" tabIndex={-1} className="lab-page skill-page" data-skill={skill.slug}>
      <div className="container">
        <Link className="case-back" href="/skills">
          <span className="arrow" aria-hidden="true">←</span> all skills
        </Link>
        <header className="lab-page-head">
          <p className="section-label mono"><b>~/skills/</b><span>{skill.slug}</span></p>
          <h1 className="lab-page-title">
            <TechIcon iconId={tech?.icon} size={48} />
            {skill.name}
          </h1>
          <p className="lab-page-intro">{skill.line}</p>
          <p className="skill-intro">{skill.intro}</p>
          {places.length > 0 && (
            <p className="skill-used mono">
              used in{" "}
              {places.map((place, i) => (
                <span key={place.name}>
                  {i > 0 && " · "}
                  {place.href.startsWith("http") ? (
                    <a className="text-link" href={place.href} target="_blank" rel="noopener noreferrer">{place.name}</a>
                  ) : (
                    <Link className="text-link" href={place.href}>{place.name}</Link>
                  )}
                </span>
              ))}
            </p>
          )}
        </header>

        <PlaygroundShell
          title={skill.demo.title}
          kicker={skill.demo.kicker}
          note={skill.demo.note}
          keys={skill.demo.keys}
          code={<CodePanel files={files} />}
        >
          <Demo />
        </PlaygroundShell>

        <nav className="skill-foot" aria-label="More">
          <a className="text-link" href={skill.docs.href} target="_blank" rel="noopener noreferrer">
            official docs: {skill.docs.label} <span aria-hidden="true">↗</span>
          </a>
          <Link className="skill-next" href={`/skills/${nextSkill.slug}`}>
            <span className="mono">next playground</span> {nextSkill.name} <span className="arrow" aria-hidden="true">→</span>
          </Link>
        </nav>
      </div>
    </main>
  );
}
