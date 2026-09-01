import Link from "next/link";
import type { Destination } from "@/lib/types";
import DestinationMedia from "@/components/DestinationMedia";

export default function DestinationCard({
  d,
  index = 0,
  featured = false,
  secondary = false,
}: {
  d: Destination;
  index?: number;
  featured?: boolean;
  secondary?: boolean;
}) {
  const weightClass = featured ? " dest-card-featured" : secondary ? " dest-card-secondary" : "";
  return (
    <Link
      href={`/destinations/${d.slug}`}
      className={`dest-card${weightClass}`}
      style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
    >
      <div className="dest-card-art">
        <DestinationMedia slug={d.slug} city={d.city} variant="card" />
        <span className="dest-card-country">{d.country}</span>
      </div>
      <div className="dest-card-body">
        <div className="dest-card-title-row">
          <h3>{d.city}</h3>
          <span className="dest-card-arrow">↗</span>
        </div>
        <p>{d.tagline}</p>
        <div className="dest-card-meta">
          <span>{d.quickFacts.idealTripLength}</span>
          <span>·</span>
          <span>{d.quickFacts.bestMonths.slice(0, 2).join(" – ")}</span>
        </div>
      </div>
    </Link>
  );
}
