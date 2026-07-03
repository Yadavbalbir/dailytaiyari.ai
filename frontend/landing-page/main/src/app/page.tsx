import type { Metadata } from "next";
import InstituteNav from "@/components/institutes/InstituteNav";
import InstituteFooter from "@/components/institutes/InstituteFooter";
import Hero from "@/components/institutes/Hero";
import FAQ from "@/components/institutes/FAQ";
import { Audience, Pillars, OfflineBatches, Features, HowItWorks, Grow, FinalCTA } from "@/components/institutes/Sections";

export const metadata: Metadata = {
  title: "DailyTaiyari | EdTech Platform for Institutes, Schools & Colleges",
  description:
    "DailyTaiyari is a white-label EdTech platform. Launch your own branded learning portal on your own domain — conduct tests, assign homework, run quizzes, share notes, and track student performance and skills in real time. Built for coaching institutes, schools and colleges.",
};

export default function Home() {
  return (
    <>
      <InstituteNav />
      <main className="flex-1 flex flex-col">
        <Hero />
        <Audience />
        <Pillars />
        <OfflineBatches />
        <Features />
        <HowItWorks />
        <Grow />
        <FAQ />
        <FinalCTA />
      </main>
      <InstituteFooter />
    </>
  );
}
