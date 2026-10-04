import type { Metadata } from "next";
import { CubeLab } from "@/components/cube/CubeLab";
import { AppLink as Link } from "@/components/ui/AppLink";
import { personal } from "@/content/personal";

const description = "a WCA-style 3x3 scrambler with a cube net and a 3D cube that plays the scramble, and plays it back.";

export const metadata: Metadata = {
  title: "cube lab",
  description,
  alternates: { canonical: "/stuff/cubing" },
  openGraph: { title: "cube lab · hamshamb", description, url: "/stuff/cubing", images: ["/og.png"] },
};

export default function CubingPage() {
  const { cubing } = personal;
  const facts = (
    [
      ["pb", cubing.pb && `${cubing.pb}s`],
      ["avg", cubing.average && `${cubing.average}s`],
      ["cubes", cubing.cubes?.join(" · ")],
    ] as const
  ).filter(([, value]) => value);
  return (
    <main id="main" tabIndex={-1} className="lab-page">
      <div className="container">
        <Link className="case-back" href="/#stuff">
          <span className="arrow" aria-hidden="true">←</span> back to stuff
        </Link>
        <header className="lab-page-head">
          <p className="section-label mono"><b>~/stuff/</b><span>cubing</span></p>
          <h1 className="lab-page-title">cube lab.</h1>
          <p className="lab-page-intro">
            a scrambler, a net and a cube you can spin. press play to watch the scramble happen one move at a time, then
            undo it the lazy way: backwards.
          </p>
          {facts.length > 0 && (
            <dl className="stuff-facts">
              {facts.map(([label, value]) => (
                <div key={label}>
                  <dt className="mono">{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </header>
        <CubeLab />
      </div>
    </main>
  );
}
