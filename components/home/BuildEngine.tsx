import { Fragment } from "react";
import {
  CENTER,
  core,
  frameBrackets,
  frameCorners,
  hexBolt,
  layers,
  mountPoint,
  nearArc,
  path,
  PLATE_SCALE,
  plateSides,
  project,
  quad,
  ring,
  RING,
  ringKeys,
  ringTicks,
  segment,
  TAG_X,
  tagY,
  VIEW,
  type EngineLayer,
  type Point,
} from "./engine";

/**
 * The hero's technical drawing, rendered on the server in its finished, assembled state. That is
 * exactly what visitors without JavaScript or with reduced motion see. HeroEngine.tsx takes it
 * apart and builds it again as the page scrolls. It is decorative: everything it says is also
 * said in the page's text.
 *
 * Every part is its own group (data-part), so the opening and the scroll can move each one on
 * its own: frame, storage, protocol plate, protocol ring, core, network, privacy shell,
 * interface, plus the connector rails, their mounts and the annotation tags.
 */

function Plate({ layer }: { layer: EngineLayer }) {
  const { z, size: s, thickness } = layer;
  const sides = thickness ? plateSides(s, z, thickness) : null;

  return (
    <g className="eng-part eng-layer" data-part={layer.id} data-layer={layer.id}>
      {sides && <path className="eng-face" d={sides.face} />}
      <path className={thickness ? "eng-face" : "eng-face eng-face-open"} d={quad(-s, -s, s, s, z)} />
      <path className={layer.id === "privacy" ? "eng-line eng-dashed" : "eng-line"} d={quad(-s, -s, s, s, z)} />
      {sides?.edges.map((d) => <path key={d} className="eng-line" d={d} />)}
      <PlateDetail layer={layer} />
    </g>
  );
}

/** The protocol ring: turns in its own plane during the opening and comes forward when exploded. */
function Ring() {
  return (
    <g className="eng-part eng-ring" data-part="ring">
      <path className="eng-detail" d={ring(RING.outer, RING.z)} />
      <path className="eng-detail" d={ring(RING.inner, RING.z)} />
      <path className="eng-detail eng-fine eng-ring-ticks" d={ringTicks(0)} />
      <path className="eng-detail eng-accent eng-ring-keys" d={ringKeys(0)} />
    </g>
  );
}

/** Corner brackets around the whole assembly, with a bolt at each corner. */
function Frame() {
  return (
    <g className="eng-part eng-frame" data-part="frame">
      <path className="eng-line eng-bracket" d={frameBrackets()} />
      {frameCorners().map(([x, y], index) => (
        <g key={index} className="eng-bolt" data-bolt={index}>
          <path d={hexBolt(x, y)} />
          <circle cx={x} cy={y} r="1.6" />
        </g>
      ))}
    </g>
  );
}

/** Connector rails between the plates' left corners, and the mounts they hang from. */
function Rails() {
  const mounts = layers.map(mountPoint);
  return (
    <g className="eng-rails">
      {layers.slice(0, -1).map((layer, index) => {
        const [x0, y0] = mounts[index];
        const [x1, y1] = mounts[index + 1];
        return <path key={layer.id} className="eng-rail" d={`M${x0} ${y0 + layer.thickness}L${x1} ${y1}`} />;
      })}
      {layers.map((layer, index) => (
        <circle key={layer.id} className="eng-mount" data-layer={layer.id} cx={mounts[index][0]} cy={mounts[index][1]} r="2.6" />
      ))}
    </g>
  );
}

function PlateDetail({ layer }: { layer: EngineLayer }) {
  const z = layer.z;
  switch (layer.id) {
    case "interface":
      return (
        <>
          <path className="eng-detail" d={quad(-82, -82, 82, 82, z)} />
          <path className="eng-detail" d={segment(-82, -66, 82, -66, z)} />
          {[-74, -66, -58].map((x) => <path key={x} className="eng-detail" d={ring(3, z, x, -74)} />)}
          <path className="eng-detail" d={segment(-46, -66, -46, 82, z)} />
          <path className="eng-detail" d={segment(-34, -50, 60, -50, z)} />
          <path className="eng-detail" d={segment(-34, -38, 36, -38, z)} />
          <path className="eng-detail" d={segment(-34, -26, 50, -26, z)} />
          <path className="eng-detail" d={quad(-34, -8, 66, 58, z)} />
          <path className="eng-detail" d={segment(-26, 6, 40, 6, z)} />
          <path className="eng-detail eng-accent" d={quad(30, 38, 60, 50, z)} />
          <path
            className="eng-detail"
            d={path([[14, 20], [14, 40], [19, 35], [23, 44], [26, 42], [22, 33], [29, 33]].map(([x, y]) => project(x, y, z)), true)}
          />
          {[-70, -60, -50, -40, -30].map((y) => <path key={y} className="eng-detail eng-fine" d={segment(-74, y + 10, -56, y + 10, z)} />)}
        </>
      );
    case "privacy": {
      const s = layer.size;
      const b = 22;
      const corners: [number, number][] = [[-s, -s], [s, -s], [s, s], [-s, s]];
      const shackle = Array.from({ length: 9 }, (_, i): Point => {
        const a = Math.PI + (i / 8) * Math.PI;
        return project(-80 + Math.cos(a) * 7, 62 + Math.sin(a) * 7, z);
      });
      return (
        <>
          {corners.map(([x, y]) => (
            <path
              key={`${x}${y}`}
              className="eng-detail"
              d={path([project(x, y - Math.sign(y) * b, z), project(x, y, z), project(x - Math.sign(x) * b, y, z)])}
            />
          ))}
          <path className="eng-detail" d={quad(-90, 62, -70, 82, z)} />
          <path className="eng-detail" d={path(shackle)} />
          <path className="eng-detail eng-dashed" d={quad(-s + 14, -s + 14, s - 14, s - 14, z)} />
        </>
      );
    }
    case "network": {
      const nodes: [number, number][] = [[-72, -46], [-24, -78], [40, -66], [78, -8], [58, 58], [-6, 76], [-66, 34]];
      const links: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0], [1, 6], [2, 4]];
      const route = [6, 0, 1, 2, 3];
      return (
        <>
          {links.map(([a, b]) => (
            <path key={`${a}-${b}`} className="eng-detail" d={segment(nodes[a][0], nodes[a][1], nodes[b][0], nodes[b][1], z)} />
          ))}
          {nodes.map(([x, y]) => <path key={`${x}${y}`} className="eng-detail eng-node" d={ring(5, z, x, y)} />)}
          <path className="eng-hot" d={path(route.map((i) => project(nodes[i][0], nodes[i][1], z)))} />
          <path className="eng-hot eng-hot-node" d={ring(5, z, nodes[3][0], nodes[3][1])} />
          <path className="eng-scan" d={segment(-96, -96, 96, -96, z)} />
        </>
      );
    }
    case "protocol": {
      return (
        <>
          <path className="eng-detail" d={ring(40, z)} />
          <path className="eng-detail" d={ring(26, z)} />
          <path className="eng-detail eng-accent" d={segment(-40, 0, -28, 0, z)} />
          <path className="eng-detail eng-accent" d={segment(28, 0, 40, 0, z)} />
        </>
      );
    }
    case "local": {
      const [cx, cy, r] = [-44, -44, 24];
      const [topX, topY] = project(cx, cy, z + 28);
      const [, baseY] = project(cx, cy, z);
      const rx = r * 1.2247 * PLATE_SCALE;
      return (
        <>
          <path className="eng-face" d={`${ring(r, z + 28, cx, cy)}`} />
          <path className="eng-detail" d={ring(r, z + 28, cx, cy)} />
          <path className="eng-detail" d={nearArc(r, z + 18, cx, cy)} />
          <path className="eng-detail" d={nearArc(r, z + 9, cx, cy)} />
          <path className="eng-detail" d={nearArc(r, z, cx, cy)} />
          <path className="eng-detail" d={path([[topX - rx, topY], [topX - rx, baseY]])} />
          <path className="eng-detail" d={path([[topX + rx, topY], [topX + rx, baseY]])} />
          <path className="eng-detail" d={quad(14, 4, 58, 66, z)} />
          <path className="eng-detail" d={path([project(46, 4, z), project(46, 16, z), project(58, 16, z)])} />
          {[24, 34, 44, 54].map((y) => <path key={y} className="eng-detail" d={segment(22, y, 50, y, z)} />)}
          {[0, 1, 2].flatMap((col) =>
            [0, 1].map((row) => {
              const x = -86 + col * 22;
              const y = 30 + row * 22;
              return <path key={`${col}${row}`} className={col === 2 && row === 1 ? "eng-detail eng-accent" : "eng-detail"} d={quad(x, y, x + 16, y + 16, z)} />;
            }),
          )}
        </>
      );
    }
  }
}

function Core() {
  const { half: h, top, bottom } = core;
  const sides = plateSides(h, top, top - bottom);
  return (
    <g className="eng-part eng-core" data-part="core">
      <path className="eng-face" d={sides.face} />
      <path className="eng-face" d={quad(-h, -h, h, h, top)} />
      <path className="eng-line" d={quad(-h, -h, h, h, top)} />
      {sides.edges.map((d) => <path key={d} className="eng-line" d={d} />)}
      <path className="eng-detail eng-accent" d={quad(-9, -9, 9, 9, top)} />
      {[-5, 0, 5].map((o) => <path key={o} className="eng-detail" d={segment(o, -9, o, -15, top)} />)}
      {[-5, 0, 5].map((o) => <path key={`b${o}`} className="eng-detail" d={segment(9, o, 15, o, top)} />)}
    </g>
  );
}

function Tag({ layer }: { layer: EngineLayer }) {
  const y = tagY(layer);
  const cornerX = project(layer.size, -layer.size, layer.z)[0];
  return (
    <g className="eng-tag" data-layer={layer.id} data-p={layer.priority} data-x={Math.round(cornerX + 8)} data-y={y}>
      <path className="eng-leader" d={`M${Math.round(cornerX + 8)} ${y}H${TAG_X - 10}`} />
      <circle className="eng-pin" cx={Math.round(cornerX + 8)} cy={y} r="2" />
      <text className="eng-label" x={TAG_X} y={y + 4}>
        <tspan className="eng-index">{layer.index}</tspan> {layer.label}
      </text>
      <text className="eng-note" x={TAG_X} y={y + 4}>
        <tspan x={TAG_X} dy="1.55em">{layer.note[0]}</tspan>
        <tspan x={TAG_X} dy="1.25em">{layer.note[1]}</tspan>
      </text>
      <ProjectLine x={TAG_X} y={y + 4} projects={layer.projects} />
    </g>
  );
}

function ProjectLine({ x, y, projects }: { x: number; y: number; projects: readonly { name: string; short: string }[] }) {
  return (
    <text className="eng-projects" x={x} y={y} dy="1.7em">
      <tspan className="eng-full">{projects.map((p) => `+ ${p.name}`).join("  ")}</tspan>
      <tspan className="eng-short">{projects.map((p) => `+ ${p.short}`).join("  ")}</tspan>
    </text>
  );
}

function Guides() {
  const [left, right] = [VIEW.x + 24, VIEW.x + VIEW.width - 24];
  const marks: Point[] = [[left, 24], [right, 24], [left, VIEW.height - 24], [right, VIEW.height - 24]];
  const origin: Point = [VIEW.x + 44, VIEW.height - 64];
  return (
    <g className="eng-guides">
      <path className="eng-guide eng-axis" d={`M${CENTER.x} 96V706`} />
      <path className="eng-guide" data-dashed="" d={quad(-126, -126, 126, 126, 112)} />
      <path className="eng-guide" data-dashed="" d={quad(-126, -126, 126, 126, -112)} />
      {marks.map(([x, y]) => <path key={`${x}${y}`} className="eng-guide" d={`M${x - 7} ${y}H${x + 7}M${x} ${y - 7}V${y + 7}`} />)}
      <path className="eng-guide" d={`M${origin[0]} ${origin[1]}l26 15M${origin[0]} ${origin[1]}l-26 15M${origin[0]} ${origin[1]}v-30`} />
    </g>
  );
}

export function BuildEngine() {
  const painted = [...layers].reverse();
  const coreY = 706;
  return (
    <svg className="eng" viewBox={`${VIEW.x} 0 ${VIEW.width} ${VIEW.height}`} preserveAspectRatio="xMinYMax meet" aria-hidden="true" focusable="false">
      <Guides />
      <g className="eng-cam">
        <Frame />
        <g className="eng-body">
          {painted.map((layer) => (
            <Fragment key={layer.id}>
              <Plate layer={layer} />
              {layer.id === "protocol" && (
                <>
                  <Ring />
                  <Core />
                </>
              )}
            </Fragment>
          ))}
        </g>
        <Rails />
      </g>
      <g className="eng-tags">
        {layers.map((layer) => <Tag key={layer.id} layer={layer} />)}
        <g className="eng-tag eng-tag-core" data-p="2">
          <text className="eng-label" x={CENTER.x + 12} y={coreY + 20}>
            <tspan className="eng-index">{core.index}</tspan> {core.label}
          </text>
          <ProjectLine x={CENTER.x + 12} y={coreY + 20} projects={core.projects} />
        </g>
      </g>
    </svg>
  );
}
