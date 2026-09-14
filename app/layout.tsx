import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://hamshamb.github.io"),
  title: "hamshamb — student who makes stuff",
  description: "Software, Minecraft experiments, random tools, and whatever else hamshamb is working on.",
  authors: [{ name: "hamshamb", url: "https://github.com/hamshamb" }],
  keywords: [
    "hamshamb", "student developer", "open source", "OSINT", "Minecraft",
    "Python", "Java", "TypeScript", "React", "Rust", "developer portfolio",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "hamshamb — student who makes stuff",
    description: "Mostly software. Occasionally questionable decisions.",
    type: "website",
    url: "/",
    siteName: "hamshamb",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "hamshamb terminal portfolio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "hamshamb — student who makes stuff",
    description: "Mostly software. Occasionally questionable decisions.",
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#030604",
};

const profileSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "hamshamb",
  url: "https://hamshamb.github.io",
  sameAs: ["https://github.com/hamshamb"],
  jobTitle: "Student developer",
  knowsAbout: [
    "Open-source software", "OSINT", "Minecraft modding", "Python", "Java",
    "JavaScript", "TypeScript", "React", "Node.js", "C#", "C++", "Rust",
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(profileSchema) }}
        />
      </body>
    </html>
  );
}
