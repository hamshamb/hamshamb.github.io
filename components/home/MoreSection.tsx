import { portfolio } from "@/content/portfolio";
import { Reveal } from "../motion/Reveal";
import { MediaFrame } from "../work/ProjectMedia";
import { SectionHead } from "./SectionHead";

/** A repository fork: one upstream line, branching into a copy. Drawn here, not borrowed. */
function ForkIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" focusable="false">
      <circle cx="4" cy="3" r="1.9" />
      <circle cx="12" cy="3" r="1.9" />
      <circle cx="8" cy="13" r="1.9" />
      <path d="M4 4.9v1.6c0 1.4 1 2.2 2.4 2.2h3.2c1.4 0 2.4-.8 2.4-2.2V4.9M8 8.7v2.4" />
    </svg>
  );
}

/** Smaller original work, then forks kept visibly separate so nobody mistakes them for mine. */
export function MoreSection() {
  const { smallThings, forks } = portfolio;

  return (
    <section className="section" id="more" aria-labelledby="more-title">
      <div className="container">
        <SectionHead
          index="03"
          label="more things"
          titleId="more-title"
          title="more things."
          intro="smaller builds, experiments and repositories that never needed a full cinematic case study."
        />

        <ul className="more-list">
          {smallThings.map((thing) => (
            <li key={thing.name}>
              <Reveal className="more-row">
                <article aria-labelledby={`more-${thing.name}`}>
                  <div className="more-art">
                    {thing.identity ? (
                      <MediaFrame media={thing.identity} variant="thumb" decorative />
                    ) : (
                      <div className="media more-initial" aria-hidden="true"><span>{thing.name.slice(0, 2)}</span></div>
                    )}
                  </div>
                  <div className="more-body">
                    <p className="work-meta mono">
                      {thing.eyebrow.toLowerCase().includes(thing.availability) ? (
                        <span className="status" data-phase={thing.phase}>{thing.eyebrow}</span>
                      ) : (
                        <>
                          <span className="status" data-phase={thing.phase}>{thing.availability}</span>
                          <span>{thing.eyebrow}</span>
                        </>
                      )}
                    </p>
                    <h3 id={`more-${thing.name}`}>{thing.name}</h3>
                    <p className="more-hook">{thing.hook}</p>
                    <p>{thing.summary}</p>
                    <p className="more-technical">{thing.technical}</p>
                    <p className="annotation">{thing.aside}</p>
                  </div>
                  <div className="more-side">
                    <p className="work-stack mono">{thing.stack.join(" · ")}</p>
                    <div className="small-links">
                      {thing.live && (
                        <a className="text-link" href={thing.live} target="_blank" rel="noopener noreferrer">
                          open it<span className="sr-only"> ({thing.name})</span> <span aria-hidden="true">↗</span>
                        </a>
                      )}
                      <a className="text-link" href={thing.source} target="_blank" rel="noopener noreferrer">
                        read the code<span className="sr-only"> for {thing.name}</span> <span aria-hidden="true">↗</span>
                      </a>
                    </div>
                  </div>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>

        <Reveal className="forks">
          <div className="forks-head">
            <h3>forks / things i&rsquo;ve explored.</h3>
            <p>repositories i forked to inspect, experiment with or learn from. original authorship belongs upstream.</p>
          </div>
          <ul className="forks-list">
            {forks.map((fork) => (
              <li key={fork.name}>
                <span className="fork-badge mono" title="fork">
                  <ForkIcon />
                  <span className="sr-only">fork</span>
                </span>
                <span className="fork-name">{fork.name}</span>
                <span className="fork-about">
                  {fork.about} <span className="fork-by">by {fork.upstreamOwner}</span>
                </span>
                <span className="fork-links mono">
                  <a href={fork.upstream} target="_blank" rel="noopener noreferrer">
                    upstream<span className="sr-only"> {fork.name} by {fork.upstreamOwner}</span> <span aria-hidden="true">↗</span>
                  </a>
                  <a href={fork.fork} target="_blank" rel="noopener noreferrer">
                    my fork<span className="sr-only"> of {fork.name}</span> <span aria-hidden="true">↗</span>
                  </a>
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
