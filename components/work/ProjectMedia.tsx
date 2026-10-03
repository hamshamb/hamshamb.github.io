import type { CSSProperties } from "react";
import type { Project } from "@/content/portfolio";

type Variant = "thumb" | "preview" | "feature";

const sizes: Record<Variant, string> = {
  thumb: "(min-width: 1000px) 1px, calc(100vw - 6rem)",
  preview: "(min-width: 1280px) 460px, 38vw",
  feature: "(min-width: 1280px) 1184px, calc(100vw - 2rem)",
};

/**
 * Real project media when it exists, otherwise a typographic plate. No stock imagery or mock screens.
 * Images are pre-sized WebP files in /public/work with an explicit srcset, which is why this uses a plain
 * <img>: the site is a static export, so next/image optimisation is not available.
 */
export function ProjectMedia({
  project,
  variant,
  decorative = false,
  eager = false,
}: {
  project: Project;
  variant: Variant;
  decorative?: boolean;
  eager?: boolean;
}) {
  const media = project.media;
  // Feature media keeps the source's own proportions so artwork is never cropped. Logos stay in the default frame.
  const nativeRatio = variant === "feature" && media && media.fit !== "contain" ? `${media.width} / ${media.height}` : undefined;
  const style = { "--media-bg": media?.background, aspectRatio: nativeRatio } as CSSProperties;

  return (
    <div className={variant === "feature" ? "media media-lg" : "media"} data-fit={media?.fit} style={style}>
      {media ? (
        // eslint-disable-next-line @next/next/no-img-element -- static export: pre-optimised WebP with srcset, see comment above
        <img
          src={media.src}
          srcSet={media.small ? `${media.small.src} ${media.small.width}w, ${media.src} ${media.width}w` : undefined}
          sizes={media.small ? sizes[variant] : undefined}
          width={media.width}
          height={media.height}
          alt={decorative ? "" : media.alt}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : undefined}
          decoding="async"
        />
      ) : (
        <div className="plate" data-phase={project.phase} aria-hidden={decorative || undefined} role={decorative ? undefined : "img"} aria-label={decorative ? undefined : `${project.name} title plate`}>
          <div className="plate-top mono">
            <span>{project.eyebrow.split(" · ")[0]}</span>
            <span>{project.releasedOn.slice(0, 4)}</span>
          </div>
          <span className="plate-sigil">{project.sigil}</span>
          <span className="plate-name">{project.name}</span>
        </div>
      )}
    </div>
  );
}
