import { faqs } from "./faqData";

const SITE_URL = "https://business.dailytaiyari.in";

/** Server-rendered JSON-LD structured data for rich search results. */
export default function JsonLd() {
  const organization = {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "DailyTaiyari",
    url: SITE_URL,
    email: "hello@dailytaiyari.in",
    description:
      "AI-powered white-label EdTech platform that lets coaching institutes, schools, colleges and skill academies launch their own branded, AI-driven learning portal — for exam-prep, coding and skill-development courses — on their own domain.",
    sameAs: [] as string[],
  };

  const website = {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: "DailyTaiyari for Institutes",
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "en-IN",
  };

  const software = {
    "@type": "SoftwareApplication",
    name: "DailyTaiyari",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web, iOS, Android",
    description:
      "An AI-powered white-label learning management system (LMS) and website platform for coaching institutes, schools, colleges and skill academies. Host exam-prep, coding and skill-development courses with a 24/7 AI doubt-solving tutor, live classes, mock tests, coding practice with auto-evaluation, assignments, gamified leaderboards and real-time analytics — all in a modern, beautifully designed UI.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
      description: "Book a personalized demo",
    },
    featureList: [
      "White-label portal on your own domain",
      "AI tutor for instant 24/7 doubt resolution",
      "Live classes and events",
      "Timed mock tests with auto-grading",
      "Coding practice with automatic evaluation",
      "Assignments and homework with grading",
      "Quizzes and daily practice",
      "Gamification — XP, streaks, badges and leaderboards",
      "Course builder with notes, videos and assignments",
      "Reusable question bank",
      "Real-time performance and skill analytics",
      "Student community and discussions",
      "Enrollment management and role-based access",
    ],
  };

  const faqPage = {
    "@type": "FAQPage",
    "@id": `${SITE_URL}/#faq`,
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const graph = {
    "@context": "https://schema.org",
    "@graph": [organization, website, software, faqPage],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
