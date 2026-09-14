import type { Metadata } from "next";
import { TerminalOS } from "../TerminalOS";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "now — hamshamb",
  description: "What hamshamb is building, learning, and wasting time on right now.",
  alternates: { canonical: "/now/" },
};

export default function NowPage() {
  return <TerminalOS initialView="now" />;
}
