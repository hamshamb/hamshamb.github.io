import "@fontsource-variable/schibsted-grotesk";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { portfolio, siteUrl } from "@/content/portfolio";

const title = "hamshamb · student who makes stuff";
const description = "Software, Minecraft experiments, random tools, and whatever else hamshamb is working on.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: "%s · hamshamb" },
  description,
  authors: [{ name: "hamshamb", url: portfolio.owner.github }],
  creator: "hamshamb",
  keywords: [
    "hamshamb", "student developer", "open source", "Minecraft", "Fabric mod",
    "Python", "Java", "TypeScript", "React", "C#", "developer portfolio",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description: "mostly software. occasionally questionable decisions.",
    type: "website",
    url: "/",
    siteName: "hamshamb",
    locale: "en_IN",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "hamshamb: student who makes stuff" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: "mostly software. occasionally questionable decisions.",
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f4ef" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0e0c" },
  ],
};

/**
 * Runs before first paint: applies a saved theme (no flash), and marks whether motion is welcome.
 * `motion-ok` lets the hero hide its words until Anime.js takes over; the timeout is a safety net
 * so the hero always becomes visible even if the script bundle never arrives.
 */
const bootScript = `(function(){var d=document.documentElement;try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")d.dataset.theme=t}catch(e){}if(!matchMedia("(prefers-reduced-motion: reduce)").matches){d.classList.add("motion-ok");setTimeout(function(){d.classList.add("hero-ready")},2500)}})();`;

const profileSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "hamshamb",
  url: siteUrl,
  email: `mailto:${portfolio.owner.email}`,
  sameAs: [portfolio.owner.github],
  jobTitle: "Student developer",
  knowsAbout: ["Open-source software", "Minecraft modding", "Python", "Java", "TypeScript", "React", "C#", "Desktop applications"],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>
        <span id="top" />
        <a className="skip-link" href="#main">skip to content</a>
        <MotionProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
          <CommandPalette
            projects={portfolio.projects.map((project) => ({
              slug: project.slug,
              name: project.name,
              hint: project.availability,
              keywords: `${project.slug} ${project.eyebrow} ${project.stack.join(" ")}`,
            }))}
          />
        </MotionProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profileSchema) }} />
      </body>
    </html>
  );
}
