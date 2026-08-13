import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "hamshamb — Software Developer & Toolmaker",
  description:
    "The interactive terminal portfolio of hamshamb — software developer, open-source builder, and creator of PyForge.",
  authors: [{ name: "hamshamb", url: "https://github.com/hamshamb" }],
  keywords: ["hamshamb", "software developer", "Python", "PyForge", "developer portfolio"],
  openGraph: {
    title: "hamshamb — Software Developer & Toolmaker",
    description: "An interactive portfolio operating system, built in phosphor green.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "hamshamb — Software Developer & Toolmaker",
    description: "An interactive portfolio operating system, built in phosphor green.",
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
