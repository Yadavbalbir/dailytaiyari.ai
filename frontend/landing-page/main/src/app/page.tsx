import CreatorNav from "@/components/creators/CreatorNav";
import CreatorHero from "@/components/creators/CreatorHero";
import {
  PlatformsMarquee,
  ImpactStats,
  StudentExperience,
  CreatorConsole,
  HowItWorks,
  CourseShowcase,
  TestimonialsMarquee,
  Audience,
  FinalCTA,
} from "@/components/creators/CreatorSections";
import Pricing from "@/components/institutes/Pricing";
import FAQ from "@/components/institutes/FAQ";
import InstituteFooter from "@/components/institutes/InstituteFooter";
import JsonLd from "@/components/institutes/JsonLd";
import LeadDialogs from "@/components/institutes/LeadDialogs";

export default function Home() {
  return (
    <>
      <JsonLd />
      <CreatorNav />
      <main className="flex-1 flex flex-col">
        <CreatorHero />
        <PlatformsMarquee />
        <ImpactStats />
        <StudentExperience />
        <CreatorConsole />
        <CourseShowcase />
        <HowItWorks />
        <TestimonialsMarquee />
        <Audience />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <InstituteFooter />
      <LeadDialogs />
    </>
  );
}
