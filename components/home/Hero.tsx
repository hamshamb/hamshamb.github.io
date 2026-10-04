import { latestProject, phaseLabel, portfolio } from "@/content/portfolio";
import { AppLink as Link } from "../ui/AppLink";
import { CopyEmail } from "../ui/CopyEmail";
import { LocalTime } from "../ui/LocalTime";
import { HeroIntro } from "./HeroIntro";

function Words({ text }: { text: string }) {
  return (
    <>
      {text.split(" ").map((word, index) => (
        <span key={`${word}-${index}`}>
          <span className="word"><span className="word-inner">{word}</span></span>{" "}
        </span>
      ))}
    </>
  );
}

export function Hero() {
  const { owner } = portfolio;
  const [firstLine, secondLine] = owner.headline;
  const lastSpace = secondLine.lastIndexOf(" ");
  const lead = secondLine.slice(0, lastSpace);
  const accent = secondLine.slice(lastSpace + 1);

  return (
    <section className="hero" id="intro" aria-labelledby="hero-title">
      <div className="container">
        <div className="hero-kicker mono" data-hero="meta">
          <p className="hero-id">
            <b>{owner.name}</b>
            <span>{owner.role} / {owner.location.toLowerCase()} / coding since {owner.since}</span>
          </p>
          <p className="hero-kicker-side">
            <span className="pulse-status">
              <span className="pulse-dot" aria-hidden="true" />
              {owner.status}
            </span>
            <LocalTime />
          </p>
        </div>

        <h1 id="hero-title" className="hero-title" data-hero="title">
          <span className="sr-only">{owner.name}: </span>
          <span className="hero-line"><Words text={firstLine} /></span>
          <span className="hero-line">
            <Words text={lead} />
            <span className="hero-accent">
              <span className="word"><span className="word-inner">{accent}</span></span>
              <svg className="hero-underline" viewBox="0 0 300 24" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                <path d="M4 15.5C48 9 92 6.5 140 8.5c38 1.6 70 5.4 98 6.6 22 1 42-1.6 58-6.1" />
              </svg>
            </span>
          </span>
        </h1>

        <div className="hero-copy" data-hero="lede">
          <p className="hero-lede">{owner.statement}</p>
          <p className="hero-range">{owner.range}</p>
        </div>

        <div className="hero-actions" data-hero="actions">
          <a className="button button-primary" href="#work">
            explore the work <span className="arrow" aria-hidden="true">↓</span>
          </a>
          <CopyEmail email={owner.email} />
        </div>

        <div className="hero-foot" data-hero="foot">
          <div>
            <h2 className="mono">currently</h2>
            <dl className="currently">
              {owner.currently.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.href ? <Link className="text-link" href={item.href}>{item.value}</Link> : item.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <h2 className="mono">latest release</h2>
            <Link className="latest-card" href={`/work/${latestProject.slug}`}>
              <strong>{latestProject.name} <span className="arrow" aria-hidden="true">→</span></strong>
              <p>{latestProject.hook}</p>
              <span className="meta-row">
                <span className="status" data-phase={latestProject.phase}>{phaseLabel[latestProject.phase]}</span>
                <time dateTime={latestProject.releasedOn}>{latestProject.releaseLabel}</time>
              </span>
            </Link>
          </div>

          <div>
            <h2 className="mono">elsewhere</h2>
            <ul className="elsewhere">
              <li><a href={owner.github} target="_blank" rel="noopener noreferrer">github <span aria-hidden="true">↗</span></a></li>
              <li><a href={`mailto:${owner.email}`}>email</a></li>
              <li><Link href="/#now">/now</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <HeroIntro rootId="intro" />
    </section>
  );
}

/** A small editorial break between the hero and the work. Not another hero. */
export function HabitBreak() {
  const { owner } = portfolio;
  return (
    <aside className="habit" aria-label="How projects start">
      <div className="container habit-inner">
        <p className="habit-line">{owner.habit}</p>
        <p className="habit-aside">{owner.habitAside}</p>
      </div>
    </aside>
  );
}
