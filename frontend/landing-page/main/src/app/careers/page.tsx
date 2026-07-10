import type { Metadata } from "next";
import InstituteNav from "@/components/institutes/InstituteNav";
import InstituteFooter from "@/components/institutes/InstituteFooter";
import CareersContent from "@/components/institutes/CareersContent";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Join DailyTaiyari. We're hiring Frontend (React / Next.js) and Backend (Django) engineers to build the white-label EdTech platform for institutes across India.",
  alternates: { canonical: "/careers" },
};

export default function CareersPage() {
  return (
    <>
      <InstituteNav />
      <CareersContent />
      <InstituteFooter />
    </>
  );
}
