import { futureWriting, portfolio } from "@/content/portfolio";
import { Reveal } from "../motion/Reveal";
import { CopyEmail } from "../ui/CopyEmail";
import { SectionHead } from "./SectionHead";

export function WritingSection() {
  return (
    <section className="section" id="writing" aria-labelledby="writing-title">
      <div className="container">
        <SectionHead index="05" label="writing" titleId="writing-title" title="writing." />
        <Reveal className="writing-grid">
          <p>nothing here yet. things i might genuinely write:</p>
          <ol className="future-list">
            {futureWriting.map((title) => <li key={title}>{title}</li>)}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}

export function ContactSection() {
  const { owner } = portfolio;

  return (
    <section className="section contact" id="contact" aria-labelledby="contact-title">
      <div className="container">
        <p className="section-label mono"><b>06</b><span>contact</span></p>
        <Reveal>
          <h2 id="contact-title" className="contact-title">want to build something?</h2>
          <p className="contact-copy">
            send me weird stuff. project ideas, questions about something i made, open-source work, or a rabbit hole worth falling into.
          </p>
          <div className="contact-actions">
            <CopyEmail email={owner.email} />
            <a className="button" href={owner.github} target="_blank" rel="noopener noreferrer">
              github.com/hamshamb <span className="arrow" aria-hidden="true">↗</span>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
