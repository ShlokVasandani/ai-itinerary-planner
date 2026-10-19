import type { MetadataRoute } from "next";
import { cityIndex } from "@/lib/data/catalog";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/destinations`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/planner`, changeFrequency: "monthly", priority: 0.8 },
    ...cityIndex.map((c) => ({
      url: `${base}/destinations/${c.slug}`,
      changeFrequency: "monthly" as const,
      // Hand-curated guides are our strongest pages; open-data guides are still useful but thinner.
      priority: c.tier === "curated" ? 0.9 : 0.6,
    })),
    { url: `${base}/credits`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
