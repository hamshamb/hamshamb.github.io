import type { Block, FigureId } from "@/content/blog";
import { EnvelopeExplorer } from "./EnvelopeExplorer";
import { Inline } from "./Inline";
import { RelayPlayground } from "./RelayPlayground";
import { RivetPath } from "./RivetPath";
import { RouteFigure } from "./RouteFigure";
import { ThreatModel } from "./ThreatModel";

/** Figures are the only client islands in a post; the prose around them is static HTML. */
const figures: Record<FigureId, () => React.ReactNode> = {
  "rivet-route": () => <RouteFigure />,
  "relay-playground": () => <RelayPlayground />,
  envelope: () => <EnvelopeExplorer />,
  "threat-model": () => <ThreatModel />,
  "rivet-path": () => <RivetPath />,
};

export function ArticleBody({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "lede":
            return <p key={index} className="post-lede"><Inline text={block.text} /></p>;
          case "p":
            return <p key={index}><Inline text={block.text} /></p>;
          case "h2":
            return (
              <h2 key={index} id={`s${block.index}`} className="post-h2">
                <span className="mono" aria-hidden="true">{block.index}</span>
                {block.text}
              </h2>
            );
          case "lines":
            return (
              <p key={index} className="post-lines">
                {block.lines.map((line, i) => <span key={i}><Inline text={line} /></span>)}
              </p>
            );
          case "list":
            return <ul key={index} className="post-list">{block.items.map((item) => <li key={item}><Inline text={item} /></li>)}</ul>;
          case "aside":
            return (
              <aside key={index} className="post-aside">
                <span className="mono">{block.label}</span>
                <p><Inline text={block.text} /></p>
              </aside>
            );
          case "figure":
            return (
              <figure key={index} className="post-figure" data-figure={block.figure}>
                {figures[block.figure]()}
                <figcaption>{block.caption}</figcaption>
              </figure>
            );
        }
      })}
    </>
  );
}
