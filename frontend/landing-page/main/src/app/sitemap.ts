import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://business.dailytaiyari.in";
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/#audience`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/#tour`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/#features`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/#how`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/#grow`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/#faq`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
}
