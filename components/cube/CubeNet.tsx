import { type CubeState, FACE_COLOURS, type Face, netLayout } from "@/lib/cube";

const layout = netLayout();

/** The unfolded cube. Each sticker is a cell coloured by the face whose colour it shows. */
export function CubeNet({ state, label = "Cube net" }: { state: CubeState; label?: string }) {
  return (
    <div className="cube-net" role="img" aria-label={label}>
      {layout.map(({ face, col, row }) => {
        const offset = "URFDLB".indexOf(face) * 9;
        return (
          <div key={face} className="cube-net-face" style={{ gridColumn: col + 1, gridRow: row + 1 }} data-face={face}>
            {Array.from({ length: 9 }, (_, i) => {
              const colour = state[offset + i] as Face;
              return <i key={i} data-c={colour} title={FACE_COLOURS[colour]} />;
            })}
          </div>
        );
      })}
    </div>
  );
}
