import type { ReactNode } from "react";
import type { Motif } from "@/content/game-art";

/**
 * Small original line drawings behind each title card: a hint of what the game feels like, never
 * its artwork. Parts with a `gm-move` class get one tiny hover reaction in games.css.
 */
export function GameMotif({ motif }: { motif: Motif }) {
  return (
    <svg className="gm" data-motif={motif} viewBox="0 0 200 112" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      {art[motif]}
    </svg>
  );
}

const dots = (points: [number, number][], r = 1.2) => points.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />);

const art: Record<Motif, ReactNode> = {
  soul: (
    <>
      <path className="gm-move" d="M100 70 86 56a8 8 0 0 1 14-10 8 8 0 0 1 14 10z" />
      <path d="M20 96h160M20 16h160" strokeDasharray="2 6" />
    </>
  ),
  crumple: (
    <>
      <path d="M10 30c30-4 50 6 80 0s60 8 100 2M10 56c26 6 54-10 84 2s56-6 96 4M10 82c32-8 52 10 82 0s62 4 98-6" />
      <path d="M40 10c-4 30 8 50 0 96M100 10c6 28-6 60 2 96M160 10c-6 34 6 58-2 96" />
      <path className="gm-move" d="M128 58l12-10 10 14-14 8z" />
    </>
  ),
  jump: (
    <>
      <path d="M0 86h200" />
      <path d="M118 86l8-14 8 14zM134 86l8-14 8 14z" />
      <path d="M58 86c18-44 46-44 64-2" strokeDasharray="3 5" />
      <rect className="gm-move" x="44" y="72" width="14" height="14" />
    </>
  ),
  shells: (
    <>
      <rect className="gm-move" x="70" y="40" width="12" height="34" rx="2" />
      <rect x="90" y="40" width="12" height="34" rx="2" />
      <rect x="110" y="40" width="12" height="34" rx="2" strokeDasharray="3 3" />
      <path d="M70 66h12M90 66h12M110 66h12" />
      <path d="M20 96h160" strokeDasharray="1 5" />
    </>
  ),
  stars: (
    <>
      {dots([[24, 22], [52, 14], [150, 18], [176, 34], [130, 30], [80, 26], [168, 70], [34, 58]])}
      <path d="M0 92c40-14 70-8 100 0s70 10 100-4" />
      <path className="gm-move" d="M96 60c-10 8-26 10-38 6M104 60c10 8 26 10 38 6" />
    </>
  ),
  dig: (
    <>
      <path d="M0 64h200M0 78h200M0 94h200" strokeDasharray="6 4" />
      <g className="gm-move">
        <path d="M120 22l26 26M128 18c10-4 22 2 26 10" />
      </g>
      {dots([[40, 72], [62, 86], [90, 70], [150, 88]], 2)}
    </>
  ),
  crosshair: (
    <>
      <circle cx="100" cy="56" r="30" strokeDasharray="2 5" />
      <g className="gm-move">
        <path d="M100 38v10M100 64v10M82 56h10M108 56h10" />
      </g>
      <circle cx="100" cy="56" r="1.6" />
    </>
  ),
  contour: (
    <>
      <path d="M10 70c30-30 60-20 80-8s50 20 100-10M10 86c34-24 66-14 90-4s54 14 100-6M30 50c20-20 50-24 70-10s40 10 60-6" />
      <path className="gm-move" d="M140 30v-8M136 26h8" />
      <path d="M10 20h20M10 20v10" />
    </>
  ),
  radio: (
    <>
      <path d="M100 76v-24" />
      <g className="gm-move">
        <path d="M88 44a17 17 0 0 1 24 0M80 36a28 28 0 0 1 40 0M72 28a39 39 0 0 1 56 0" />
      </g>
      <path d="M20 96h160" strokeDasharray="8 4 1 4" />
    </>
  ),
  props: (
    <>
      <path d="M60 84l18-10 18 10-18 10z M60 84v-18l18-10 18 10v18M78 74V56" />
      <g className="gm-move">
        <path d="M112 50l16-9 16 9-16 9z M112 50v16l16 9 16-9V50M128 59v16" />
      </g>
      <path d="M20 96h160" />
    </>
  ),
  road: (
    <>
      <path d="M70 112 96 20M130 112 104 20" />
      <path className="gm-move" d="M100 104v-12M100 80v-10M100 60v-8M100 44v-6" />
      <path d="M150 70v-24h18v10h-18" />
    </>
  ),
  snow: (
    <>
      <path d="M70 112 96 20M130 112 104 20" />
      <g className="gm-move">{dots([[30, 20], [60, 40], [150, 24], [176, 50], [40, 76], [160, 88], [120, 14], [84, 60]], 1.6)}</g>
    </>
  ),
  orbit: (
    <>
      <circle cx="100" cy="58" r="14" />
      <ellipse cx="100" cy="58" rx="64" ry="24" strokeDasharray="3 4" />
      <circle className="gm-move" cx="164" cy="58" r="3" />
      <path d="M40 58l-6-4m6 4-6 4" />
    </>
  ),
  sand: (
    <>
      <path d="M40 104c20-18 40-26 60-26s40 8 60 26" />
      <g className="gm-move">
        <rect x="96" y="20" width="4" height="4" />
        <rect x="100" y="34" width="4" height="4" />
        <rect x="94" y="48" width="4" height="4" />
      </g>
      <rect x="60" y="94" width="4" height="4" />
      <rect x="132" y="92" width="4" height="4" />
    </>
  ),
  shift: (
    <>
      <path d="M0 40h200M0 56h200M0 72h200" strokeDasharray="20 6" />
      <path className="gm-move" d="M70 56c0-12 12-20 26-20h20c14 0 22 8 22 18" />
    </>
  ),
};
