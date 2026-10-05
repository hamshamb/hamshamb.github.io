import "@fontsource-variable/schibsted-grotesk";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import "./blog.css";
import "./lab.css";
import "./demo-card.css";
import "./playground.css";
import "./skills-arcade.css";
import "./skills-apps.css";
import "./cube.css";
import "./rivet3d.css";
import "./games.css";
import "./toys.css";
import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { posts } from "@/content/blog";
import { portfolio, siteUrl } from "@/content/portfolio";
import type { PaletteLink } from "@/content/site";
import { skillPages } from "@/content/skills";

const title = "hamshamb · i build things i wish existed";
const description = "hamshamb is a student developer in India, coding since 2021. Software, tools and experiments built from curiosity, irritation, or both.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: "%s · hamshamb" },
  description,
  authors: [{ name: "hamshamb", url: portfolio.owner.github }],
  creator: "hamshamb",
  keywords: [
    "hamshamb", "student developer", "open source", "privacy", "Bluetooth mesh", "local-first",
    "Minecraft", "Python", "Java", "TypeScript", "React", "C#", "developer portfolio",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description: "software, tools and experiments built from curiosity, irritation, or both. coding since 2021.",
    type: "website",
    url: "/",
    siteName: "hamshamb",
    locale: "en_IN",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "hamshamb: i build things i wish existed." }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: "software, tools and experiments built from curiosity, irritation, or both. coding since 2021.",
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: "/favicon-32.png", sizes: "32x32", type: "image/png" }],
    shortcut: "/favicon-32.png",
    apple: "/apple-touch-icon.png",
  },
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
 * `motion-ok` lets the hero hold its opening state until Anime.js takes over; the timeout is a
 * safety net so the hero always appears even if the script bundle never arrives. If the opening
 * already played this session, the hero renders at rest straight away.
 */
const bootScript = `(function(){var d=document.documentElement;try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")d.dataset.theme=t}catch(e){}if(!matchMedia("(prefers-reduced-motion: reduce)").matches){d.classList.add("motion-ok");var s=null;try{s=sessionStorage.getItem("portfolio-intro-seen")}catch(e){}if(s){d.classList.add("hero-ready","intro-done")}else{setTimeout(function(){d.classList.add("hero-ready")},2500)}}})();`;

/** Everything the command palette can open besides home sections and projects. */
const paletteLinks: PaletteLink[] = [
  ...posts.map((post) => ({ href: `/blog/${post.slug}`, group: "read", label: post.title, hint: "blog", keywords: `blog post writing ${post.tags.join(" ")} ${post.dek}` })),
  { href: "/blog", group: "read", label: "all writing", hint: "/blog", keywords: "blog posts writing" },
  ...skillPages.map((skill) => ({ href: `/skills/${skill.slug}`, group: "skills", label: skill.name, hint: skill.demo.title, keywords: `skill playground ${skill.slug} ${skill.demo.title}` })),
  { href: "/skills", group: "skills", label: "all skills", hint: "/skills", keywords: "stack tools languages things i use" },
  { href: "/stuff/cubing", group: "play", label: "cube lab", hint: "scramble + 3d cube", keywords: "rubik cube cubing scramble wca 3x3" },
];

const profileSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "hamshamb",
  url: siteUrl,
  image: `${siteUrl}/icon-512.png`,
  email: `mailto:${portfolio.owner.email}`,
  sameAs: [portfolio.owner.github],
  jobTitle: "Student developer",
  knowsAbout: ["Open-source software", "Privacy", "Local-first software", "Networking", "Python", "Java", "TypeScript", "React", "C#"],
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
            links={paletteLinks}
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
