import { journey, milestoneLabel, type Milestone, type MilestoneKind } from "@/content/portfolio";
import { AppLink as Link } from "../ui/AppLink";
import { JourneyMotion } from "./JourneyMotion";
import { SectionHead } from "./SectionHead";

const monthDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

const legend: MilestoneKind[] = ["begins", "early", "prototype", "rewrite", "hardening", "released", "developing", "prerelease"];

function Name({ milestone }: { milestone: Milestone }) {
  const { name, href } = milestone;
  if (!name) return null;
  if (!href) return <h4 className="milestone-name">{name}</h4>;
  const external = href.startsWith("http");
  return (
    <h4 className="milestone-name">
      {external ? (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {name}<span className="sr-only"> (opens GitHub)</span>
        </a>
      ) : (
        <Link href={href}>{name}</Link>
      )}
    </h4>
  );
}

function MilestoneItem({ milestone }: { milestone: Milestone }) {
  const { kind, label, date, copy, points, recent } = milestone;
  // The shape is never the only signal: when the visible label is not the kind itself, say it.
  const spoken = label === milestoneLabel[kind] ? null : `${milestoneLabel[kind]}: `;
  return (
    <li className="milestone" data-kind={kind} data-recent={recent || undefined}>
      <span className="ms" data-kind={kind} aria-hidden="true" />
      <div className="milestone-body">
        <p className="milestone-meta mono">
          {date && <time dateTime={date}>{monthDay.format(new Date(`${date}T00:00:00Z`)).toLowerCase()}</time>}
          <span className="milestone-label">{spoken && <span className="sr-only">{spoken}</span>}{label}</span>
        </p>
        <Name milestone={milestone} />
        {copy?.map((line) => <p key={line} className="milestone-copy">{line}</p>)}
        {points && (
          <ul className="milestone-points">
            {points.map((point) => <li key={point}>{point}</li>)}
          </ul>
        )}
      </div>
    </li>
  );
}

/**
 * Five years of building, told as project development history. Years 2021 to 2025 are private
 * development (year-only milestones, never exact dates). Exact dates appear only for public
 * releases and repositories, and they come straight from the project data. Anime.js draws the
 * rail with the scroll; Motion brings each year's milestones in.
 */
export function JourneySection() {
  return (
    <section className="section section-journey" id="journey" aria-labelledby="journey-title">
      <div className="container">
        <SectionHead
          index="04"
          label="journey"
          titleId="journey-title"
          title="five years of learning by building."
          intro="some projects followed me through years of rewrites. Nexus and StudyFilter are much newer and moved far faster."
        />
        <p className="journey-note mono">development history and public release history are shown separately.</p>

        <ul className="journey-legend mono" aria-label="Legend">
          {legend.map((kind) => (
            <li key={kind}><span className="ms" data-kind={kind} aria-hidden="true" />{milestoneLabel[kind]}</li>
          ))}
        </ul>

        <div className="journey" id="journey-track">
          <span className="journey-rail" aria-hidden="true"><span className="journey-trace" /></span>
          <ol className="journey-years">
            {journey.map((year) => (
              <li key={year.year} className="journey-year" data-density={Math.min(year.milestones.length, 6)}>
                <div className="journey-head">
                  <span className="journey-node" aria-hidden="true" />
                  <p className="journey-numeral">{year.year}</p>
                  <h3>{year.title}</h3>
                  {year.intro && <p className="journey-intro">{year.intro}</p>}
                </div>
                <div className="journey-body">
                  <ol className="milestones" aria-label={`${year.year} milestones`}>
                    {year.milestones.map((milestone) => (
                      <MilestoneItem key={`${milestone.kind}-${milestone.name ?? milestone.label}`} milestone={milestone} />
                    ))}
                  </ol>
                  {year.notes && (
                    <div className="journey-notes">
                      {year.notes.lead && <p>{year.notes.lead}</p>}
                      <ul className="mono">{year.notes.items.map((item) => <li key={item}>{item}</li>)}</ul>
                    </div>
                  )}
                  {year.closing && <p className="journey-closing">{year.closing}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <JourneyMotion rootId="journey-track" />
    </section>
  );
}
