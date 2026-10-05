import type { ReactNode } from "react";
import type { BoltId } from "@/lib/secrets-core";
import { Reveal } from "../motion/Reveal";
import { Bolt } from "../toys/Bolt";

export function SectionHead({
  index,
  label,
  titleId,
  title,
  intro,
  bolt,
}: {
  index: string;
  label: string;
  titleId: string;
  title: ReactNode;
  intro?: ReactNode;
  /** One of the five hidden bolts, tucked beside the label. */
  bolt?: BoltId;
}) {
  return (
    <Reveal className="section-head">
      <p className="section-label mono"><b>{index}</b><span>{label}</span>{bolt && <Bolt id={bolt} className="bolt-label" />}</p>
      <h2 id={titleId} className="section-title">{title}</h2>
      {intro ? <p className="section-intro">{intro}</p> : null}
    </Reveal>
  );
}
