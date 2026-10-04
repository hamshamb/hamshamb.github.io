/** The site logo: a square crop of hamshamb's profile picture. Decorative next to the name. */
export function BrandMark() {
  // eslint-disable-next-line @next/next/no-img-element -- static export, pre-sized 128px WebP
  return <img className="brand-mark" src="/logo.webp" alt="" width={28} height={28} decoding="async" />;
}
