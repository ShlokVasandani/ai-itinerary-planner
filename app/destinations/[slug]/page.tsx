import Link from "next/link";
import { notFound } from "next/navigation";
import { destinations, getDestinationBySlug } from "@/lib/data";
import DestinationTabs from "@/components/DestinationTabs";
import DestinationMedia from "@/components/DestinationMedia";
import { cityPhotos } from "@/lib/city-photo-urls";

export function generateStaticParams() {
  return destinations.map((d) => ({ slug: d.slug }));
}

export default async function DestinationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const d = getDestinationBySlug(slug);
  if (!d) return notFound();
  const photo = cityPhotos[d.slug];

  return (
    <main>
      <section className="feature-open">
        <Link href="/#destinations" className="feature-open-back">
          ← All destinations
        </Link>
        <p className="feature-open-country">{d.country}</p>
        <h1 className="feature-open-city">{d.city}</h1>
        <p className="feature-open-tagline">{d.tagline}</p>
      </section>

      <section className="feature-photo-block">
        <DestinationMedia slug={d.slug} city={d.city} variant="hero" priority />
        {photo && (
          <a href={photo.sourcePage} target="_blank" rel="noopener noreferrer nofollow" className="photo-caption">
            Photo: {photo.credit} · Wikimedia Commons ({photo.license})
          </a>
        )}
      </section>

      <section className="feature-facts">
        <div>
          <span>Ideal trip</span>
          <strong>{d.quickFacts.idealTripLength}</strong>
        </div>
        <div>
          <span>Best months</span>
          <strong>{d.quickFacts.bestMonths.slice(0, 3).join(", ")}</strong>
        </div>
        <div>
          <span>Mid-range budget</span>
          <strong>{d.quickFacts.averageDailyBudget.midRange}/day</strong>
        </div>
        <Link href={`/planner?city=${d.slug}`} className="hero-cta-link feature-facts-cta">
          Plan a trip to {d.city} →
        </Link>
      </section>

      <section style={{ padding: "0 clamp(24px,7vw,112px) 100px" }}>
        <DestinationTabs d={d} />
      </section>
    </main>
  );
}
