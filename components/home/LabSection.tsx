import { getProject, portfolio } from "@/content/portfolio";
import { Reveal } from "../motion/Reveal";
import { AppLink as Link } from "../ui/AppLink";
import { MxMark, RivetMark } from "../work/Marks";
import { SectionHead } from "./SectionHead";

/** Current experiments. Rivet and MX dominate; neither is released, and the copy says so. */
export function LabSection() {
  const rivet = getProject("rivet");
  const { mx } = portfolio;
  if (!rivet) return null;

  return (
    <section className="section section-lab" id="lab" aria-labelledby="lab-title">
      <div className="container">
        <SectionHead
          index="02"
          label="in the lab"
          titleId="lab-title"
          title="in the lab."
          intro={
            <>
              the unfinished things are usually the most interesting ones.
              <span className="section-intro-aside">current experiments, protocol work and projects that are still earning the right to be called finished.</span>
            </>
          }
        />

        <div className="lab-grid">
          <Reveal className="lab-card lab-card-main">
            <article aria-labelledby="lab-rivet">
              <div className="lab-art"><RivetMark /></div>
              <div className="lab-body">
                <p className="lab-status mono">
                  <span className="status" data-phase={rivet.phase}>{rivet.availability}</span>
                  <span className="status-detail">{rivet.statusDetail}</span>
                </p>
                <p className="eyebrow mono">{rivet.eyebrow}</p>
                <h3 id="lab-rivet">{rivet.name}</h3>
                <p className="lab-hook">{rivet.hook}</p>
                <p>{rivet.summary}</p>
                {rivet.architecture && <p className="lab-note">{rivet.architecture}</p>}
                <ul className="lab-features" aria-label="Rivet highlights">
                  {rivet.highlights.slice(0, 6).map((item) => <li key={item}>{item}</li>)}
                </ul>
                <Link className="button" href="/work/rivet">
                  see how it works <span className="arrow" aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          </Reveal>

          <Reveal className="lab-card lab-card-side" delay={0.08}>
            <article aria-labelledby="lab-mx">
              <div className="lab-art lab-art-mx"><MxMark pipeline={mx.pipeline} /></div>
              <div className="lab-body">
                <p className="lab-status mono">
                  <span className="status" data-phase="wip">{mx.availability}</span>
                  <span className="status-detail">{mx.statusDetail}</span>
                </p>
                <p className="eyebrow mono">{mx.eyebrow}</p>
                <h3 id="lab-mx">{mx.name}</h3>
                <p className="lab-hook">{mx.hook}</p>
                <p>{mx.description}</p>
                {mx.story.map((line) => <p key={line} className="lab-note">{line}</p>)}
                <p className="work-stack mono">{mx.stack.join(" · ")}</p>
                <p className="lab-private mono">source not public yet</p>
              </div>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
