import type { CSSProperties } from "react";
import type { ProjectIdentity, ProjectMedia as Media } from "@/content/portfolio";
import { RivetMark } from "./Marks";

type Variant = "thumb" | "preview" | "feature";

const sizes: Record<Variant, string> = {
  thumb: "(min-width: 1000px) 1px, 360px",
  preview: "(min-width: 1280px) 460px, 38vw",
  feature: "(min-width: 1280px) 1184px, calc(100vw - 2rem)",
};

/**
 * One picture, pre-sized in /public/work with an explicit srcset. A plain <img> on purpose: the
 * site is a static export, so next/image optimisation is not available. Theme-specific artwork
 * renders both versions and lets CSS show the right one, so there is no flash on load.
 */
function Picture({ media, variant, decorative, eager }: { media: Media; variant: Variant; decorative: boolean; eager: boolean }) {
  const common = {
    width: media.width,
    height: media.height,
    loading: eager ? ("eager" as const) : ("lazy" as const),
    fetchPriority: eager ? ("high" as const) : undefined,
    decoding: "async" as const,
    className: media.pixelated ? "pixelated" : undefined,
  };
  const srcSet = media.small ? `${media.small.src} ${media.small.width}w, ${media.src} ${media.width}w` : undefined;

  if (media.darkSrc) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element -- static export, see Picture */}
        <img {...common} src={media.src} alt={decorative ? "" : media.alt} data-theme-art="light" />
        {/* eslint-disable-next-line @next/next/no-img-element -- static export, see Picture */}
        <img {...common} src={media.darkSrc} alt="" aria-hidden="true" data-theme-art="dark" />
      </>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- static export, see Picture
    <img {...common} src={media.src} srcSet={srcSet} sizes={srcSet ? sizes[variant] : undefined} alt={decorative ? "" : media.alt} />
  );
}

/** A framed photo, screenshot or poster. Feature frames keep the source proportions. */
export function MediaFrame({
  media,
  variant,
  decorative = false,
  eager = false,
  className,
}: {
  media: Media;
  variant: Variant;
  decorative?: boolean;
  eager?: boolean;
  className?: string;
}) {
  const nativeRatio = variant === "feature" && media.fit !== "contain" ? `${media.width} / ${media.height}` : undefined;
  const style = { "--media-bg": media.background, aspectRatio: nativeRatio } as CSSProperties;
  return (
    <div
      className={["media", variant === "feature" ? "media-lg" : "", className ?? ""].join(" ").trim()}
      data-fit={media.fit}
      data-surface={media.surface}
      style={style}
    >
      <Picture media={media} variant={variant} decorative={decorative} eager={eager} />
    </div>
  );
}

/** The project's identity: its real logo on its own field, or a typographic mark. */
export function IdentityArt({
  identity,
  variant,
  decorative = false,
  eager = false,
  animated = true,
  label,
}: {
  identity: ProjectIdentity;
  variant: Variant;
  decorative?: boolean;
  eager?: boolean;
  animated?: boolean;
  /** Accessible name for typographic marks when they are not decorative. */
  label?: string;
}) {
  if (identity.kind === "mark") {
    return (
      <div
        className={variant === "feature" ? "media media-lg identity identity-mark" : "media identity identity-mark"}
        role={decorative ? undefined : "img"}
        aria-label={decorative ? undefined : label}
      >
        {identity.mark === "rivet" ? <RivetMark animated={animated} size={variant === "feature" ? "lg" : "md"} /> : null}
      </div>
    );
  }
  return <MediaFrame media={identity} variant={variant} decorative={decorative} eager={eager} className="identity" />;
}
