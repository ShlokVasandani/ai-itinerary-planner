import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { destinations, getDestinationBySlug } from "@/lib/data";
import DestinationTabs from "@/components/DestinationTabs";
import Photo from "@/components/Photo";
import { cityPhotos } from "@/lib/city-photo-urls";

export function generateStaticParams() {
  return destinations.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const d = getDestinationBySlug(slug);
  return d ? { title: `${d.city}, ${d.country}`, description: d.tagline } : {};
}

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = getDestinationBySlug(slug);
  if (!d) return notFound();
  const photo = cityPhotos[d.slug];

  return (
    <main className="dest-page">
      <section className="dest-hero">
        <Link href="/#destinations" className="back-link">
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
        <div>
          <span>Getting around</span>
          <strong>{d.transitCardInfo.name}</strong>
        </div>
      </section>

      <section className="section dest-tabs">
        <DestinationTabs d={d} />
      </section>
    </main>
  );
}
