import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/motion/Reveal";
import { AppLink as Link } from "@/components/ui/AppLink";
import { CopyLink } from "@/components/work/CopyLink";
import { IdentityArt, MediaFrame } from "@/components/work/ProjectMedia";
import { getNeighbours, getProject, portfolio } from "@/content/portfolio";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return portfolio.projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  const description = `${project.hook} ${project.summary}`;
  const visual = project.media ?? (project.identity.kind === "image" ? project.identity : undefined);
  const image = visual && !visual.src.endsWith(".svg") ? visual.src : "/og.png";
  return {
    title: project.name,
    description,
    alternates: { canonical: `/work/${project.slug}` },
    openGraph: {
      title: `${project.name} · hamshamb`,
      description,
      type: "article",
      url: `/work/${project.slug}`,
      images: [{ url: image, alt: visual?.alt ?? "hamshamb: i build things i wish existed." }],
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
    programmingLanguage: project.stack[0],
    author: { "@type": "Person", name: "hamshamb", url: portfolio.owner.github },
    ...(project.source ? { codeRepository: project.source } : {}),
    ...(project.releasedOn ? { dateCreated: project.releasedOn } : {}),
    ...(project.live ? { url: project.live } : {}),
  };

  const story = [
    project.intro && { label: "why i made it", title: "the annoying bit.", body: project.intro },
    { label: "the problem", title: "what was actually wrong.", body: [project.problem] },
    { label: "under the hood", title: "what i actually built.", body: [project.built] },
  ].filter(Boolean) as { label: string; title: string; body: string[] }[];

  return (
    <main id="main" tabIndex={-1} className="case">
      <article className="container" aria-labelledby="case-title">
        <Link className="case-back" href="/#work">
          <span className="arrow" aria-hidden="true">←</span> all work
        </Link>

        <header className="case-head">
          <p className="case-status mono">
            <span className="status" data-phase={project.phase}>{project.availability}</span>
            {project.statusDetail && <span className="status-detail">{project.statusDetail}</span>}
            <span>{project.eyebrow}</span>
          </p>
          <h1 id="case-title" className="case-title">{project.name}</h1>
          <div className="case-intro">
            <p>{project.hook}</p>
            <p>{project.summary}</p>
          </div>
          {project.aside && <p className="annotation case-aside">{project.aside}</p>}
        </header>

        <div className="case-visual">
          {project.media ? (
            <MediaFrame media={project.media} variant="feature" eager />
          ) : (
            <IdentityArt identity={project.identity} variant="feature" eager />
          )}
        </div>

        <dl className="case-meta">
          <div>
            <dt className="mono">released</dt>
            <dd>{project.releasedOn ? <time dateTime={project.releasedOn}>{project.releaseLabel?.toLowerCase()}</time> : "not yet"}</dd>
          </div>
          <div>
            <dt className="mono">status</dt>
            <dd>
              <span className="status" data-phase={project.phase}>{project.availability}</span>
              {project.statusDetail && <span className="case-meta-detail">{project.statusDetail}</span>}
            </dd>
          </div>
          <div>
            <dt className="mono">what i did</dt>
            <dd>{project.role}</dd>
          </div>
          <div>
            <dt className="mono">links</dt>
            <dd className="links">
              {project.live && (
                <a className="text-link" href={project.live} target="_blank" rel="noopener noreferrer">open it <span aria-hidden="true">↗</span></a>
              )}
              {project.source ? (
                <a className="text-link" href={project.source} target="_blank" rel="noopener noreferrer">read the code <span aria-hidden="true">↗</span></a>
              ) : (
                <span className="case-meta-detail">source not public yet</span>
              )}
            </dd>
          </div>
        </dl>

        <div className="case-body">
          <Reveal className="case-what">
            <p className="mono case-label">what it is</p>
            <p className="case-summary">{project.description}</p>
            {project.releaseNote && <p className="case-release mono">{project.releaseLabel?.toLowerCase()}: {project.releaseNote}</p>}
          </Reveal>

          <Reveal className="case-story">
            {story.map((part) => (
              <article key={part.label}>
                <span className="mono">{part.label}</span>
                <h2>{part.title}</h2>
                {part.body.map((line) => <p key={line}>{line}</p>)}
              </article>
            ))}
          </Reveal>

          {project.architecture && (
            <Reveal className="case-callout">
              <p className="mono case-label">how it works</p>
              <p>{project.architecture}</p>
            </Reveal>
          )}

          <Reveal className="case-split">
            <h2><span className="mono">important details</span>the technical bits.</h2>
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

          {project.screenshots?.map((shot) => (
            <Reveal key={shot.src} className="case-shot">
              <figure>
                <MediaFrame media={shot} variant="feature" />
                <figcaption className="mono">inside the app</figcaption>
              </figure>
            </Reveal>
          ))}

          {project.result && (
            <Reveal className="case-split">
              <h2><span className="mono">what worked</span>where it is now.</h2>
              <p className="case-result">{project.result}</p>
            </Reveal>
          )}

          {(project.note || project.limits) && (
            <Reveal className="case-split">
              <h2><span className="mono">what is still not done</span>{project.limits ? project.limits.title + "." : "the honest bit."}</h2>
              <div className="honest-stack">
                {project.note && <p className="honest-note"><span className="mono">status</span>{project.note}</p>}
                {project.limits?.paragraphs.map((line) => <p key={line} className="limits-line">{line}</p>)}
              </div>
            </Reveal>
          )}

          <Reveal className="case-split">
            <h2><span className="mono">stack</span>built with.</h2>
            <ul className="chip-list">
              {project.stack.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </Reveal>

          <div className="case-actions">
            {project.live && (
              <a className="button button-primary" href={project.live} target="_blank" rel="noopener noreferrer">
                open {project.name} <span className="arrow" aria-hidden="true">↗</span>
              </a>
            )}
            {project.source && (
              <a className={project.live ? "button" : "button button-primary"} href={project.source} target="_blank" rel="noopener noreferrer">
                inspect the source <span className="arrow" aria-hidden="true">↗</span>
              </a>
            )}
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
