import { AppLink as Link } from "../ui/AppLink";
import { phaseLabel, portfolio, releaseLog } from "@/content/portfolio";
import { Reveal } from "../motion/Reveal";
import { type ChartMonth, ReleaseChart } from "./ReleaseChart";
import { SectionHead } from "./SectionHead";

const monthShort = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
const monthLong = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

/** One bucket per month, from the month before the first release to the month after the newest entry. */
function buildMonths(): ChartMonth[] {
  const events = [
    ...portfolio.projects.map((project) => ({ date: project.releasedOn, name: project.name, kind: "released" as const })),
    ...portfolio.smallThings.map((thing) => ({ date: thing.startedOn, name: thing.name, kind: "started" as const })),
  ];
  const dates = events.map((event) => event.date).sort();
  const first = new Date(`${dates[0].slice(0, 7)}-01T00:00:00Z`);
  const last = new Date(`${dates[dates.length - 1].slice(0, 7)}-01T00:00:00Z`);
  const cursor = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() - 1, 1));
  const end = new Date(Date.UTC(last.getUTCFullYear(), last.getUTCMonth() + 1, 1));

  const months: ChartMonth[] = [];
  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 7);
    const inMonth = events.filter((event) => event.date.startsWith(key));
    const short = monthShort.format(cursor).toLowerCase();
    months.push({
      key,
      label: cursor.getUTCMonth() === 0 ? `${short} '${String(cursor.getUTCFullYear()).slice(2)}` : short,
      long: monthLong.format(cursor).toLowerCase(),
      released: inMonth.filter((event) => event.kind === "released").map((event) => event.name),
      started: inMonth.filter((event) => event.kind === "started").map((event) => event.name),
    });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return months;
}

function describe(months: ChartMonth[]) {
  const busy = months.filter((month) => month.released.length || month.started.length);
  const parts = busy.map((month) => {
    const bits = [];
    if (month.released.length) bits.push(`${month.released.join(", ")} released`);
    if (month.started.length) bits.push(`${month.started.join(" and ")} started`);
    return `${month.long}: ${bits.join("; ")}`;
  });
  return `Projects by month from ${months[0].long} to ${months[months.length - 1].long}. ${parts.join(". ")}.`;
}

export function LogSection() {
  const months = buildMonths();
  const years = [...new Set(releaseLog.map((project) => project.releasedOn.slice(0, 4)))];

  return (
    <section className="section" id="log" aria-labelledby="log-title">
      <div className="container">
        <SectionHead
          index="02"
          label="build log"
          titleId="log-title"
          title="build log."
          intro="newest first. unfinished things are allowed to look unfinished."
        />

        <Reveal>
          <ReleaseChart months={months} summary={describe(months)} />
        </Reveal>

        <div className="log-years">
          {years.map((year) => (
            <div className="log-year" key={year}>
              <h3>{year}</h3>
              <ol className="log-entries">
                {releaseLog
                  .filter((project) => project.releasedOn.startsWith(year))
                  .map((project) => (
                    <li key={project.slug}>
                      <article className="log-entry">
                        <time dateTime={project.releasedOn}>{project.releaseLabel}</time>
                        <div>
                          <h4>
                            <Link href={`/work/${project.slug}`}>{project.name}</Link>
                            <span className="status" data-phase={project.phase}>{phaseLabel[project.phase]}</span>
                          </h4>
                          <p>{project.releaseNote}</p>
                        </div>
                      </article>
                    </li>
                  ))}
              </ol>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
