import type { CSSProperties } from "react";
import { techIcons } from "@/content/tech-icons";
import { resolveTech } from "@/content/tech";
import { AppLink as Link } from "./AppLink";

/** Brand colours too dark or too light to read on both themes fall back to the text colour. */
function readableHex(hex: string) {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.12 && luminance < 0.82 ? `#${hex}` : undefined;
}

/** A technology's logo, decorative: the name always sits next to it as text. */
export function TechIcon({ iconId, size = 16 }: { iconId?: string; size?: number }) {
  const icon = iconId ? techIcons[iconId] : undefined;
  if (!icon) return null;
  const colour = readableHex(icon.hex);
  return (
    <svg
      className="tech-icon"
      data-icon={iconId}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      style={colour ? ({ "--brand": colour } as CSSProperties) : undefined}
    >
      <path d={icon.path} />
    </svg>
  );
}

/**
 * A stack label. Known technologies get their logo; the ones with a skill page become a link.
 * Anything unknown stays plain text, so nothing looks clickable without somewhere to go.
 */
export function TechChip({ label }: { label: string }) {
  const tech = resolveTech(label);
  const inner = (
    <>
      <TechIcon iconId={tech?.icon} />
      <span>{label}</span>
    </>
  );
  if (tech?.skillSlug) {
    return (
      <Link className="tech-chip tech-chip-link" href={`/skills/${tech.skillSlug}`}>
        {inner}
        <span className="arrow" aria-hidden="true">→</span>
      </Link>
    );
  }
  return <span className="tech-chip">{inner}</span>;
}
