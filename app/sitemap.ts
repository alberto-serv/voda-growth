import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/business";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: siteUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: siteUrl("/estimate/services"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];
}
