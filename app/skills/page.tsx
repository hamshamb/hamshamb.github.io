import type { Metadata } from "next";
import { AppLink as Link } from "@/components/ui/AppLink";
import { TechChip, TechIcon } from "@/components/ui/TechChip";
import { portfolio } from "@/content/portfolio";
import { skillPages } from "@/content/skills";
import { getTech } from "@/content/tech";

const description = "tools change. the kinds of problems i keep choosing are more consistent.";

export const metadata: Metadata = {
  title: "skills",
  description,
  alternates: { canonical: "/skills" },
  openGraph: { title: "skills · hamshamb", description, url: "/skills", images: ["/og.png"] },
};

export default function SkillsIndex() {
  return (
    <main id="main" tabIndex={-1} className="lab-page">
      <div className="container">
        <header className="lab-page-head">
          <p className="section-label mono"><b>~/</b><span>skills</span></p>
          <h1 className="lab-page-title">things i use.</h1>
          <p className="lab-page-intro">{description}</p>
        </header>

        <section className="skill-playgrounds" aria-labelledby="playgrounds-title">
          <h2 id="playgrounds-title" className="mono">playgrounds</h2>
          <ul>
            {skillPages.map((skill) => (
              <li key={skill.slug}>
                <Link className="skill-card" data-tilt="" href={`/skills/${skill.slug}`}>
                  <span className="skill-card-name">
                    <TechIcon iconId={getTech(skill.techId)?.icon} size={22} />
                    {skill.name}
                  </span>
                  <span className="skill-card-line">{skill.line}</span>
                  <span className="skill-card-demo mono">
                    {skill.demo.title} <span className="arrow" aria-hidden="true">→</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <dl className="skill-groups">
          {portfolio.skills.map((set) => {
            const interest = "interest" in set;
            return (
              <div key={set.group} className="skill-group" data-interest={interest || undefined}>
                <dt>
                  <span className="mono">{set.group}</span>
                  <span className="note">{set.note}</span>
                </dt>
                <dd>
                  <ul className="tech-list">
                    {set.items.map((item) => (
                      <li key={item}>{interest ? <span className="tech-chip">{item}</span> : <TechChip label={item} />}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </main>
  );
}
