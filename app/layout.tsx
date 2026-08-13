import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://hamshamb.github.io"),
  title: "hamshamb — Software Developer & Toolmaker",
  description:
    "The interactive terminal portfolio of hamshamb — creator of StudyFilter, AreUHuman, and PyForge.",
  authors: [{ name: "hamshamb", url: "https://github.com/hamshamb" }],
  keywords: ["hamshamb", "software developer", "StudyFilter", "AreUHuman", "PyForge", "developer portfolio"],
  openGraph: {
    title: "hamshamb — Software Developer & Toolmaker",
    description: "Three shipped systems inside an interactive portfolio OS, built in phosphor green.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "hamshamb portfolio OS featuring StudyFilter, AreUHuman, and PyForge" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "hamshamb — Software Developer & Toolmaker",
    description: "Three shipped systems inside an interactive portfolio OS, built in phosphor green.",
    images: ["/og.png"],
  },
  icons: { icon: "favicon.svg", shortcut: "favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
