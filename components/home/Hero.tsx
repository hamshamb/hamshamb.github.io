import { AppLink as Link } from "../ui/AppLink";
import { latestProject, phaseLabel, portfolio } from "@/content/portfolio";
import { CopyEmail } from "../ui/CopyEmail";
import { LocalTime } from "../ui/LocalTime";
import { HeroIntro } from "./HeroIntro";

const headline = ["student", "who", "makes"];

export function Hero() {
  const { owner } = portfolio;

  return (
    <section className="hero" id="intro" aria-labelledby="hero-title">
      <div className="container">
        <div className="hero-kicker mono" data-hero="meta">
          <ul aria-label="About hamshamb">
            <li>{owner.name}</li>
            <li>student</li>
            <li>
              {owner.location}, <LocalTime />
            </li>
          </ul>
          <span className="pulse-status">
            <span className="pulse-dot" aria-hidden="true" />
            {owner.status}
          </span>
        </div>

        <h1 id="hero-title" className="hero-title" data-hero="title">
          <span className="sr-only">{owner.name}, a </span>
          {headline.map((word) => (
            <span key={word}>
              <span className="word"><span className="word-inner">{word}</span></span>{" "}
            </span>
          ))}
          <span className="hero-stuff">
            <span className="word"><span className="word-inner">stuff.</span></span>
            <svg className="hero-underline" viewBox="0 0 300 24" preserveAspectRatio="none" aria-hidden="true" focusable="false">
              <path d="M4 15.5C48 9 92 6.5 140 8.5c38 1.6 70 5.4 98 6.6 22 1 42-1.6 58-6.1" />
            </svg>
          </span>
        </h1>

        <p className="hero-lede" data-hero="lede">{owner.statement}</p>

        <div className="hero-actions" data-hero="actions">
          <a className="button button-primary" href="#work">
            see what i made <span className="arrow" aria-hidden="true">↓</span>
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
            <h2 className="mono">latest thing i made</h2>
            <Link className="latest-card" href={`/work/${latestProject.slug}`}>
              <strong>{latestProject.name} <span className="arrow" aria-hidden="true">→</span></strong>
              <p>{latestProject.intro[0]} {latestProject.intro[1]}</p>
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
