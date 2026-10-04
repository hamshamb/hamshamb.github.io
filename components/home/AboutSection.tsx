import { portfolio } from "@/content/portfolio";
import { Reveal } from "../motion/Reveal";
import { AppLink as Link } from "../ui/AppLink";
import { TechChip } from "../ui/TechChip";
import { SectionHead } from "./SectionHead";

export function AboutSection() {
  const { owner, skills, themes } = portfolio;
  const [hello, ...bio] = owner.bio;

  return (
    <section className="section" id="about" aria-labelledby="about-title">
      <div className="container">
        <SectionHead index="05" label="about" titleId="about-title" title={hello} />

        <div className="about-grid">
          <div className="about-copy">
            {bio.map((line) => <p key={line}>{line}</p>)}
          </div>

          <Reveal className="now-card" id="now">
            <header>
              <h3>now</h3>
              <span className="mono">{owner.now.month}</span>
            </header>
            <ul className="now-list">
              {owner.now.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <footer>
              <span>updated <time dateTime={owner.now.updated}>{owner.now.updatedLabel}</time></span>
              <span>tab count: i stopped counting</span>
            </footer>
          </Reveal>
        </div>

        <Reveal className="themes">
          <h3 className="themes-title">things i keep falling into.</h3>
          <ol className="themes-list">
            {themes.map((theme, index) => (
              <li key={theme.name}>
                <span className="theme-index mono" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <h4>{theme.name}</h4>
                <p>{theme.copy}</p>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal className="stack" id="skills">
          <div className="stack-head">
            <h3>stuff i use.</h3>
            <p>tools change. the kinds of problems i keep choosing are more consistent.</p>
            <p className="stack-since mono">coding since {owner.since}</p>
            <Link className="stuff-link" href="/skills">playgrounds for six of these <span className="arrow" aria-hidden="true">→</span></Link>
          </div>
          <dl className="stack-grid">
            {skills.map((set) => (
              <div className="stack-group" key={set.group} data-interest={"interest" in set ? true : undefined}>
                <dt>{set.group}</dt>
                <dd>
                  <p className="note">{set.note}</p>
                  <ul className="tech-list">
                    {set.items.map((item) => <li key={item}>{"interest" in set ? <span className="tech-chip">{item}</span> : <TechChip label={item} />}</li>)}
                  </ul>
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
