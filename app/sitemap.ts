import type { MetadataRoute } from "next";
import { destinations } from "@/lib/data";
import { siteUrl } from "@/lib/site";

/** Latest verifiedAt of a city's records, so lastmod reflects real data changes rather than the build time. */
function lastVerified(d: (typeof destinations)[number]): Date | undefined {
  const dates = [...d.landmarks, ...d.restaurants, ...d.cafes, ...d.shopping, ...d.nightlife, ...d.experiences, ...d.dayTrips]
    .map((x) => x.verifiedAt)
    .filter(Boolean) as string[];
  return dates.length ? new Date(dates.sort().at(-1)!) : undefined;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/planner`, changeFrequency: "monthly", priority: 0.8 },
    ...destinations.map((d) => ({
      url: `${base}/destinations/${d.slug}`,
      lastModified: lastVerified(d),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    { url: `${base}/credits`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
