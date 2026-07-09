import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://business.dailytaiyari.in";
const OG_TITLE =
  "DailyTaiyari — AI-Powered LMS for Coaching, Coding & Skill-Development Courses";
const OG_DESC =
  "Launch your own AI-powered LMS and website on your own domain — for coaching, exam-prep, coding and skill-development courses. 24/7 AI doubt tutor, live classes, mock tests, coding labs, assignments, gamified leaderboards and analytics — all in a modern, beautifully designed UI. No coding, no tech team.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "DailyTaiyari | AI-Powered LMS & Website for Coaching, Coding & Skill Courses",
    template: "%s | DailyTaiyari",
  },
  description: OG_DESC,
  applicationName: "DailyTaiyari for Institutes",
  keywords: [
    "AI powered LMS",
    "AI LMS for coaching institutes",
    "AI doubt solving app",
    "AI tutor for students",
    "LMS for coaching institutes",
    "LMS to sell online courses",
    "platform to host coding courses",
    "skill development course platform",
    "online course platform",
    "coding bootcamp platform",
    "coding institute software",
    "coaching institute website",
    "coaching institute software",
    "coaching class management software",
    "school website",
    "school management portal",
    "college LMS",
    "learning management system",
    "LMS solution",
    "online exam software",
    "online test portal",
    "mock test platform",
    "coding practice platform",
    "online coding judge for students",
    "gamified learning platform",
    "leaderboard learning app",
    "white label LMS",
    "white label learning platform",
    "student portal",
    "online coaching platform",
    "e-learning platform for institutes",
    "test series software",
    "JEE NEET test platform",
    "live class software",
    "student performance tracking",
  ],
  authors: [{ name: "DailyTaiyari" }],
  creator: "DailyTaiyari",
  publisher: "DailyTaiyari",
  category: "education",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "DailyTaiyari for Institutes",
    title: OG_TITLE,
    description: OG_DESC,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: OG_TITLE,
    description: OG_DESC,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
