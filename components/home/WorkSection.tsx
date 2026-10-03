import { portfolio } from "@/content/portfolio";
import { Reveal } from "../motion/Reveal";
import { SectionHead } from "./SectionHead";
import { WorkIndex } from "./WorkIndex";

export function WorkSection() {
  const { projects, smallThings } = portfolio;

  return (
    <section className="section" id="work" aria-labelledby="work-title">
      <div className="container">
        <SectionHead
          index="01"
          label="work"
          titleId="work-title"
          title="things i made."
          intro="the simple version first. the technical rabbit hole is inside each one."
        />

        <WorkIndex projects={projects} />

        <Reveal className="small-things">
          <h3 className="mono">smaller and newer things</h3>
          <ul className="small-grid">
            {smallThings.map((thing) => (
              <li key={thing.name}>
                <article className="small-card">
                  <header>
                    <h4>{thing.name}</h4>
                    <time className="mono" dateTime={thing.startedOn}>{thing.startedOn.slice(0, 7).replace("-", ".")}</time>
                  </header>
                  <p>{thing.summary}</p>
                  <ul className="chip-list">
                    {thing.stack.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                  <div className="small-links">
                    <a className="text-link" href={thing.source} target="_blank" rel="noopener noreferrer">
                      code<span className="sr-only"> for {thing.name}</span> <span aria-hidden="true">↗</span>
                    </a>
                    {thing.live && (
                      <a className="text-link" href={thing.live} target="_blank" rel="noopener noreferrer">
                        try it<span className="sr-only"> ({thing.name})</span> <span aria-hidden="true">↗</span>
                      </a>
                    )}
                  </div>
                </article>
              </li>
            ))}
          </ul>
          <p className="forks-note">
            {String(projects.length + smallThings.length).padStart(2, "0")} things i actually made. forks don&rsquo;t count, so they&rsquo;re not here.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
