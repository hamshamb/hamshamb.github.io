import { portfolio } from "@/content/portfolio";
import { SectionHead } from "./SectionHead";
import { WorkIndex } from "./WorkIndex";

export function WorkSection() {
  return (
    <section className="section" id="work" aria-labelledby="work-title">
      <div className="container">
        <SectionHead
          index="01"
          label="selected work"
          titleId="work-title"
          bolt="work"
          title="things i made."
          intro="the simple version first. the technical rabbit hole is inside each one."
        />
        <WorkIndex projects={portfolio.projects} />
      </div>
    </section>
  );
}
