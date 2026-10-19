import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cityIndex, loadDestination } from "@/lib/data/catalog";
import type { Destination } from "@/lib/types";
import DestinationTabs from "@/components/DestinationTabs";
import Photo from "@/components/Photo";
import { getPhoto, getPhotoCredit } from "@/lib/photos";
import { jsonLd, siteUrl } from "@/lib/site";

export function generateStaticParams() {
  return cityIndex.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const d = await loadDestination(slug);
  if (!d) return {};
  const photo = getPhoto(d.slug);
  const title = `${d.city} travel guide: where to go, eat and stay`;
  const description = `${d.tagline} ${d.landmarks.length} landmarks, ${d.restaurants.length} restaurants, ${d.neighborhoods.length} neighborhoods and a day-by-day ${d.city} itinerary planner.`;
  const image = photo ? { url: `/images/destinations/${d.slug}.jpg`, width: photo.width, height: photo.height, alt: getPhotoCredit(d.slug)?.alt ?? d.city } : undefined;
  return {
    title,
    description,
    alternates: { canonical: `/destinations/${d.slug}` },
    openGraph: { type: "website", title, description, url: `/destinations/${d.slug}`, images: image ? [image] : undefined },
    twitter: { card: "summary_large_image", title, description, images: image ? [image.url] : undefined },
  };
}

function destinationJsonLd(d: Destination) {
  const base = siteUrl();
  const located = d.neighborhoods.map((n) => n.coords).filter(Boolean) as { lat: number; lng: number }[];
  const centre = located.length
    ? { lat: located.reduce((s, c) => s + c.lat, 0) / located.length, lng: located.reduce((s, c) => s + c.lng, 0) / located.length }
    : undefined;
  const attraction = (l: (typeof d.landmarks)[number]) => ({
    "@type": "TouristAttraction",
    name: l.name,
    description: l.description,
    ...(l.coords ? { geo: { "@type": "GeoCoordinates", latitude: l.coords.lat, longitude: l.coords.lng } } : {}),
    ...(l.officialUrl ? { url: l.officialUrl } : {}),
  });
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TouristDestination",
        name: `${d.city}, ${d.country}`,
        description: d.overview,
        url: `${base}/destinations/${d.slug}`,
        image: getPhoto(d.slug) ? `${base}/images/destinations/${d.slug}.jpg` : undefined,
        ...(centre ? { geo: { "@type": "GeoCoordinates", latitude: Number(centre.lat.toFixed(4)), longitude: Number(centre.lng.toFixed(4)) } } : {}),
        containedInPlace: { "@type": "Country", name: d.country },
        includesAttraction: d.landmarks.slice(0, 12).map(attraction),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Sekai", item: base },
          { "@type": "ListItem", position: 2, name: "Destinations", item: `${base}/destinations` },
          { "@type": "ListItem", position: 3, name: d.city, item: `${base}/destinations/${d.slug}` },
        ],
      },
    ],
  };
}

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = await loadDestination(slug);
  if (!d) return notFound();
  const photo = getPhotoCredit(d.slug);

  return (
    <main className="dest-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(destinationJsonLd(d)) }} />
      <section className="dest-hero">
        <Link href="/destinations" className="back-link">
          ← All destinations
        </Link>
        <p className="eyebrow">{d.country}</p>
        <h1>{d.city}</h1>
        <p className="lede">{d.tagline}</p>
        <Link href={`/planner?city=${d.slug}`} className="btn btn-primary">
          Plan a trip to {d.city}
        </Link>
      </section>

      <figure className="dest-figure">
        <Photo slug={d.slug} city={d.city} sizes="(max-width: 1100px) 100vw, 1100px" priority />
        {photo && (
          <figcaption>
            Photo: {photo.credit} ·{" "}
            <a href={photo.sourcePage} target="_blank" rel="noopener noreferrer">
              Wikimedia Commons ({photo.license})
            </a>
          </figcaption>
        )}
      </figure>

      <section className="dest-facts" aria-label="Quick facts">
        <div>
          <span>Best months</span>
          <strong>{d.quickFacts.bestMonths.slice(0, 3).join(", ")}</strong>
        </div>
        <div>
          <span>Currency</span>
          <strong>{d.currency}</strong>
        </div>
        <div>
          <span>{d.quickFacts.averageDailyBudget ? "Mid-range budget" : "Airports"}</span>
          <strong>{d.quickFacts.averageDailyBudget ? `${d.quickFacts.averageDailyBudget.midRange}/day` : d.airportCodes.join(", ") || "n/a"}</strong>
        </div>
        <div>
          <span>{d.transitCardInfo ? "Getting around" : "Landmarks"}</span>
          <strong>{d.transitCardInfo ? d.transitCardInfo.name : d.landmarks.length}</strong>
        </div>
      </section>

      <section className="section dest-tabs">
        <DestinationTabs d={d} />
      </section>
    </main>
  );
}
