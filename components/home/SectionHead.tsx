import type { ReactNode } from "react";
import { Reveal } from "../motion/Reveal";

export function SectionHead({
  index,
  label,
  titleId,
  title,
  intro,
}: {
  index: string;
  label: string;
  titleId: string;
  title: ReactNode;
  intro?: ReactNode;
}) {
  return (
    <Reveal className="section-head">
      <p className="section-label mono"><b>{index}</b><span>{label}</span></p>
      <h2 id={titleId} className="section-title">{title}</h2>
      {intro ? <p className="section-intro">{intro}</p> : null}
    </Reveal>
  );
}
