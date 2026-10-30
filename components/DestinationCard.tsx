import Link from "next/link";
import type { CityIndexEntry } from "@/lib/data/catalog";
import Photo from "@/components/Photo";

export default function DestinationCard({ d, priority = false }: { d: Pick<CityIndexEntry, "slug" | "city" | "country" | "tagline">; priority?: boolean }) {
  return (
    <Link href={`/destinations/${d.slug}`} className="dest-card" transitionTypes={["nav-forward"]}>
      <div className="dest-card-photo">
        <Photo slug={d.slug} city={d.city} sizes="(max-width: 460px) 260px, (max-width: 700px) 45vw, 330px" priority={priority} />
      </div>
      <div className="dest-card-caption">
        <h3>{d.city}</h3>
        <p className="dest-card-role">{d.country}</p>
        <p className="dest-card-tagline">{d.tagline}</p>
      </div>
    </Link>
  );
}
