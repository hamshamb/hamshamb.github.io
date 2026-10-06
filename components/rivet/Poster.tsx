/**
 * What a scene looks like before it loads, and what stays if WebGL never does. Plain SVG, no
 * client code, and it already says the whole idea: a sealed envelope, phones that can only pass it
 * along when they are close enough, and one phone that can open it.
 */

type Phone = { x: number; y: number; name: string; holds?: boolean };

const phones: Phone[] = [
  { x: 92, y: 168, name: "sender", holds: true },
  { x: 252, y: 118, name: "relay a" },
  { x: 462, y: 176, name: "relay b" },
  { x: 628, y: 122, name: "recipient" },
];

const tall: Phone[] = [
  { x: 80, y: 70, name: "sender", holds: true },
  { x: 214, y: 168, name: "relay a" },
  { x: 86, y: 296, name: "relay b" },
  { x: 214, y: 392, name: "recipient" },
];

function Slab({ x, y, name, holds }: Phone) {
  return (
    <g transform={`translate(${x} ${y})`} data-holds={holds || undefined} className="rv-poster-phone">
      <rect x="-20" y="-34" width="40" height="68" rx="9" />
      <rect className="rv-poster-screen" x="-14" y="-27" width="28" height="54" rx="4" />
      <text y="58" textAnchor="middle">{name}</text>
    </g>
  );
}

export function Poster({ kind }: { kind: "relay" | "envelope" }) {
  if (kind === "envelope") {
    return (
      <svg className="rv-poster-svg" viewBox="0 0 520 250" role="img" aria-label="A sealed envelope drawn in three layers: a plaintext header, two visible fields, and an encrypted part only the recipient can open." focusable="false">
        <g className="rv-poster-env">
          <rect x="70" y="24" width="380" height="54" rx="8" data-zone="header" />
          <text x="86" y="56">plaintext header. relays read this.</text>
          <rect x="70" y="92" width="380" height="54" rx="8" data-zone="outer" />
          <text x="86" y="124">key and nonce. visible, useless alone.</text>
          <rect x="70" y="160" width="380" height="66" rx="8" data-zone="sealed" />
          <text x="86" y="198">sealed. only the recipient can open it.</text>
        </g>
      </svg>
    );
  }
  const label = "Four phones on a table. The sender holds a sealed envelope and is in range of relay a. Relay a and relay b are too far apart to connect. Relay b is in range of the recipient.";
  return (
    <>
      <svg className="rv-poster-svg rv-poster-wide" viewBox="0 0 720 270" role="img" aria-label={label} focusable="false">
      <rect className="rv-poster-table" x="8" y="14" width="704" height="246" rx="18" />
      <circle className="rv-poster-range" cx="92" cy="168" r="150" />
      <line className="rv-poster-link" data-live x1="112" y1="160" x2="232" y2="126" />
      <line className="rv-poster-link" x1="272" y1="126" x2="442" y2="168" strokeDasharray="3 7" />
      <line className="rv-poster-link" x1="482" y1="168" x2="608" y2="130" />
      <text className="rv-poster-note" x="357" y="140" textAnchor="middle">too far apart</text>
      {phones.map((phone) => <Slab key={phone.name} {...phone} />)}
      <g className="rv-poster-env-small" transform="translate(92 98)">
        <rect x="-16" y="-11" width="32" height="22" rx="3" />
        <path d="M-16 -9 0 3 16 -9" />
      </g>
      </svg>
      <svg className="rv-poster-svg rv-poster-tall" viewBox="0 0 300 460" role="img" aria-label={label} focusable="false">
        <rect className="rv-poster-table" x="8" y="8" width="284" height="444" rx="18" />
        <line className="rv-poster-link" data-live x1="92" y1="112" x2="196" y2="162" />
        <line className="rv-poster-link" x1="204" y1="216" x2="104" y2="290" strokeDasharray="3 7" />
        <text className="rv-poster-note" x="196" y="262" textAnchor="middle">too far apart</text>
        <line className="rv-poster-link" x1="100" y1="344" x2="196" y2="388" />
        {tall.map((phone) => <Slab key={phone.name} {...phone} />)}
        <g className="rv-poster-env-small" transform="translate(80 26)">
          <rect x="-16" y="-11" width="32" height="22" rx="3" />
          <path d="M-16 -9 0 3 16 -9" />
        </g>
      </svg>
    </>
  );
}
