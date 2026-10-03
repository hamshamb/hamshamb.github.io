import type { Metadata } from "next";
import { AppLink as Link } from "@/components/ui/AppLink";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/motion/Reveal";
import { CopyLink } from "@/components/work/CopyLink";
import { ProjectMedia } from "@/components/work/ProjectMedia";
import { getNeighbours, getProject, phaseLabel, portfolio } from "@/content/portfolio";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return portfolio.projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  const description = `${project.intro.join(" ")} ${project.description}`;
  const image = project.media ? project.media.src : "/og.png";
  return {
    title: project.name,
    description,
    alternates: { canonical: `/work/${project.slug}` },
    openGraph: {
      title: `${project.name} · hamshamb`,
      description,
      type: "article",
      url: `/work/${project.slug}`,
      images: [{ url: image, alt: project.media?.alt ?? "hamshamb: student who makes stuff" }],
    },
    twitter: { card: "summary_large_image", title: `${project.name} · hamshamb`, description, images: [image] },
  };
}

export default async function ProjectPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  const { previous, next } = getNeighbours(project.slug);

  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: project.name,
    description: project.description,
    codeRepository: project.source,
    programmingLanguage: project.stack[0],
    author: { "@type": "Person", name: "hamshamb", url: portfolio.owner.github },
    dateCreated: project.releasedOn,
    ...(project.live ? { url: project.live } : {}),
  };

  return (
    <main id="main" tabIndex={-1} className="case">
      <article className="container" aria-labelledby="case-title">
        <Link className="case-back" href="/#work">
          <span className="arrow" aria-hidden="true">←</span> all work
        </Link>

        <header className="case-head">
          <p className="eyebrow mono">{project.eyebrow}</p>
          <h1 id="case-title" className="case-title">{project.name}</h1>
          <div className="case-intro">
            {project.intro.map((line) => <p key={line}>{line}</p>)}
          </div>
        </header>

        <ProjectMedia project={project} variant="feature" eager />

        <dl className="case-meta">
          <div>
            <dt className="mono">released</dt>
            <dd><time dateTime={project.releasedOn}>{project.releaseLabel.toLowerCase()}</time></dd>
          </div>
          <div>
            <dt className="mono">status</dt>
            <dd><span className="status" data-phase={project.phase}>{phaseLabel[project.phase]}</span></dd>
          </div>
          <div>
            <dt className="mono">what i did</dt>
            <dd>{project.role}</dd>
          </div>
          <div>
            <dt className="mono">links</dt>
            <dd className="links">
              {project.live && (
                <a className="text-link" href={project.live} target="_blank" rel="noopener noreferrer">try it <span aria-hidden="true">↗</span></a>
              )}
              <a className="text-link" href={project.source} target="_blank" rel="noopener noreferrer">code <span aria-hidden="true">↗</span></a>
            </dd>
          </div>
        </dl>

        <div className="case-body">
          <Reveal>
            <p className="case-summary">{project.description}</p>
          </Reveal>

          <Reveal className="case-story">
            <article>
              <span className="mono">why this exists</span>
              <h2>the annoying bit.</h2>
              <p>{project.problem}</p>
            </article>
            <article>
              <span className="mono">under the hood</span>
              <h2>what i actually built.</h2>
              <p>{project.built}</p>
            </article>
            <article>
              <span className="mono">where it is now</span>
              <h2>no fake launch language.</h2>
              <p>{project.result}</p>
            </article>
          </Reveal>

          <Reveal className="case-split">
            <h2><span className="mono">details</span>the technical bits.</h2>
            <ol className="highlight-list">
              {project.highlights.map((item) => <li key={item}>{item}</li>)}
            </ol>
          </Reveal>

          {project.facts.length > 0 && (
            <Reveal className="case-split">
              <h2><span className="mono">counted</span>actual numbers.</h2>
              <dl className="case-facts">
                {project.facts.map((fact) => (
                  <div key={fact.label}>
                    <dt className="mono">{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          )}

          <Reveal className="case-split">
            <h2><span className="mono">stack</span>built with.</h2>
            <ul className="chip-list">
              {project.stack.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </Reveal>

          {project.note && (
            <Reveal>
              <p className="honest-note"><span className="mono">honest bit</span>{project.note}</p>
            </Reveal>
          )}

          <div className="case-actions">
            {project.live && (
              <a className="button button-primary" href={project.live} target="_blank" rel="noopener noreferrer">
                try {project.name} <span className="arrow" aria-hidden="true">↗</span>
              </a>
            )}
            <a className={project.live ? "button" : "button button-primary"} href={project.source} target="_blank" rel="noopener noreferrer">
              read the code <span className="arrow" aria-hidden="true">↗</span>
            </a>
            <CopyLink />
          </div>
        </div>

        <nav className="case-pager" aria-label="More projects">
          <Link href={`/work/${previous.slug}`}>
            <span className="mono">← previous</span>
            <strong>{previous.name}</strong>
          </Link>
          <Link href={`/work/${next.slug}`}>
            <span className="mono">next →</span>
            <strong>{next.name}</strong>
          </Link>
        </nav>
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </main>
  );
}
