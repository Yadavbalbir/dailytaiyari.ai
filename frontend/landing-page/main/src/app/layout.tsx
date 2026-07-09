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
  "DailyTaiyari — LMS & Website Builder for Coaching Institutes, Schools & Colleges";
const OG_DESC =
  "Launch your own coaching institute website, school portal or online LMS on your own domain. Run live classes, mock tests, quizzes and homework, build courses, and track student performance in real time. No coding, no tech team.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "DailyTaiyari | LMS & Website for Coaching Institutes, Schools & Colleges",
    template: "%s | DailyTaiyari",
  },
  description: OG_DESC,
  applicationName: "DailyTaiyari for Institutes",
  keywords: [
    "LMS for coaching institutes",
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
