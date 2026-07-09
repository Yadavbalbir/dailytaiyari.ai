import InstituteNav from "@/components/institutes/InstituteNav";
import InstituteFooter from "@/components/institutes/InstituteFooter";
import Hero from "@/components/institutes/Hero";
import FAQ from "@/components/institutes/FAQ";
import ProductTour from "@/components/institutes/ProductTour";
import JsonLd from "@/components/institutes/JsonLd";
import LeadDialogs from "@/components/institutes/LeadDialogs";
import { Audience, Pillars, Hooks, OfflineBatches, Features, HowItWorks, Grow, FinalCTA } from "@/components/institutes/Sections";

export default function Home() {
  return (
    <>
      <JsonLd />
      <InstituteNav />
      <main className="flex-1 flex flex-col">
        <Hero />
        <Hooks />
        <Audience />
        <Pillars />
        <ProductTour />
        <OfflineBatches />
        <Features />
        <HowItWorks />
        <Grow />
        <FAQ />
        <FinalCTA />
      </main>
      <InstituteFooter />
      <LeadDialogs />
    </>
  );
}
