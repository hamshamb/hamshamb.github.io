import { portfolio } from "@/content/portfolio";
import { Reveal } from "../motion/Reveal";
import { CopyEmail } from "../ui/CopyEmail";

export function ContactSection() {
  const { owner } = portfolio;

  return (
    <section className="section contact" id="contact" aria-labelledby="contact-title">
      <div className="container">
        <p className="section-label mono"><b>07</b><span>contact</span></p>
        <Reveal>
          <h2 id="contact-title" className="contact-title">say hi.</h2>
          <p className="contact-copy">found something interesting, broken or worth building?</p>
          <p className="contact-copy contact-copy-quiet">email is the easiest way to reach me.</p>
          <div className="contact-actions">
            <CopyEmail email={owner.email} />
            <a className="button" href={owner.github} target="_blank" rel="noopener noreferrer">
              github <span className="arrow" aria-hidden="true">↗</span>
            </a>
          </div>
          <p className="contact-sign mono">built, broken and rebuilt by {owner.name}.</p>
        </Reveal>
      </div>
    </section>
  );
}
