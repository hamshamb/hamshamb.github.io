import { AboutSection } from "@/components/home/AboutSection";
import { ContactSection, WritingSection } from "@/components/home/ClosingSections";
import { Hero } from "@/components/home/Hero";
import { LegacyHashRedirect } from "@/components/home/LegacyHashRedirect";
import { LogSection } from "@/components/home/LogSection";
import { StuffSection } from "@/components/home/StuffSection";
import { WorkSection } from "@/components/home/WorkSection";
import { portfolio } from "@/content/portfolio";

export default function Home() {
  return (
    <main id="main" tabIndex={-1}>
      <LegacyHashRedirect slugs={portfolio.projects.map((project) => project.slug)} />
      <Hero />
      <WorkSection />
      <LogSection />
      <AboutSection />
      <StuffSection />
      <WritingSection />
      <ContactSection />
    </main>
  );
}
