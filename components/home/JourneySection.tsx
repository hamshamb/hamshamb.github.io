import { journey, journeyEvents, type JourneyEvent } from "@/content/portfolio";
import { AppLink as Link } from "../ui/AppLink";
import { JourneyMotion } from "./JourneyMotion";
import { SectionHead } from "./SectionHead";

const monthDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

const kindLabel: Record<JourneyEvent["kind"], string> = {
  released: "released",
  started: "repo started",
  developing: "in development",
};

function EventRow({ event }: { event: JourneyEvent }) {
  const external = event.href.startsWith("http");
  const when = event.date ? monthDay.format(new Date(`${event.date}T00:00:00Z`)).toLowerCase() : "no date";
  const inner = (
    <>
      <span className="event-mark" aria-hidden="true" />
      <span className="event-when mono">
        {event.date ? <time dateTime={event.date}>{when}</time> : when}
      </span>
      <span className="event-name">{event.name}</span>
      <span className="event-kind mono">{kindLabel[event.kind]}</span>
    </>
  );
  return (
    <li className="journey-event" data-kind={event.kind}>
      {external ? (
        <a href={event.href} target="_blank" rel="noopener noreferrer">{inner}<span className="sr-only"> (opens GitHub)</span></a>
      ) : (
        <Link href={event.href}>{inner}</Link>
      )}
    </li>
  );
}

/**
 * Coding since 2021. Years are learning stages (hollow markers, no dates). Releases, repository
 * starts and in-development work are real events with their own markers, attached to their year.
 * The two are never mixed: a stage cannot be read as a release.
 */
export function JourneySection() {
  return (
    <section className="section section-journey" id="journey" aria-labelledby="journey-title">
      <div className="container">
        <SectionHead
          index="04"
          label="journey"
          titleId="journey-title"
          title="coding since 2021."
          intro="shipping history shown separately from the years spent learning."
        />

        <ul className="journey-legend mono" aria-label="Legend">
          <li data-kind="stage"><span className="event-mark" aria-hidden="true" />learning stage, a year not a release</li>
          <li data-kind="released"><span className="event-mark" aria-hidden="true" />released, real date</li>
          <li data-kind="started"><span className="event-mark" aria-hidden="true" />repository started</li>
          <li data-kind="developing"><span className="event-mark" aria-hidden="true" />in development, no release date</li>
        </ul>

        <div className="journey" id="journey-track">
          <span className="journey-rail" aria-hidden="true"><span className="journey-trace" /></span>
          <ol className="journey-years">
            {journey.map((stage) => {
              const events = journeyEvents.filter((event) => event.year === stage.year);
              return (
                <li key={stage.year} className="journey-year" data-busy={events.length > 0}>
                  <span className="journey-node" aria-hidden="true" />
                  <p className="journey-numeral">{stage.year}</p>
                  <h3>{stage.title}</h3>
                  <p className="journey-copy">{stage.copy}</p>
                  {events.length > 0 && (
                    <ol className="journey-events" aria-label={`${stage.year}: releases and projects`}>
                      {events.map((event) => <EventRow key={`${event.kind}-${event.name}`} event={event} />)}
                    </ol>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
      <JourneyMotion rootId="journey-track" />
    </section>
  );
}
