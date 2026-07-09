import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://business.dailytaiyari.in/sitemap.xml",
    host: "https://business.dailytaiyari.in",
  };
}
