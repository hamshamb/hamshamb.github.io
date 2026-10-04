import { AboutSection } from "@/components/home/AboutSection";
import { ContactSection } from "@/components/home/ClosingSections";
import { HabitBreak, Hero } from "@/components/home/Hero";
import { JourneySection } from "@/components/home/JourneySection";
import { LabSection } from "@/components/home/LabSection";
import { LegacyHashRedirect } from "@/components/home/LegacyHashRedirect";
import { MoreSection } from "@/components/home/MoreSection";
import { StuffSection } from "@/components/home/StuffSection";
import { WorkSection } from "@/components/home/WorkSection";
import { portfolio } from "@/content/portfolio";

/** Writing is intentionally hidden for now. Its ideas live in content/portfolio.ts (futureWriting). */
export default function Home() {
  return (
    <main id="main" tabIndex={-1}>
      <LegacyHashRedirect slugs={portfolio.projects.map((project) => project.slug)} />
      <Hero />
      <HabitBreak />
      <WorkSection />
      <LabSection />
      <MoreSection />
      <JourneySection />
      <AboutSection />
      <StuffSection />
      <ContactSection />
    </main>
  );
}
