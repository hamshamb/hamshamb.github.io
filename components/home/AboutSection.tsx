import { portfolio } from "@/content/portfolio";
import { Reveal } from "../motion/Reveal";
import { SectionHead } from "./SectionHead";

export function AboutSection() {
  const { owner, skills } = portfolio;
  const [hello, ...bio] = owner.bio;

  return (
    <section className="section" id="about" aria-labelledby="about-title">
      <div className="container">
        <SectionHead index="03" label="about" titleId="about-title" title={hello} />

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

        <Reveal className="stack">
          <h3>stuff i use.</h3>
          <p>not claiming mastery. these have appeared in things i&rsquo;ve actually tried to make.</p>
          <dl className="stack-grid">
            {skills.map((set) => (
              <div className="stack-group" key={set.group}>
                <dt>{set.group}</dt>
                <dd>
                  <p className="note">{set.note}</p>
                  <ul>{set.items.map((item) => <li key={item}>{item}</li>)}</ul>
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
