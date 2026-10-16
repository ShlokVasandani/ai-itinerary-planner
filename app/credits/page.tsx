import Link from "next/link";
import { destinations } from "@/lib/data";
import { cityPhotos } from "@/lib/city-photo-urls";

export const metadata = {
  title: "Photo credits and data sources",
  description: "Photographer credit and license for every destination photo (Wikimedia Commons), plus OpenStreetMap data attribution.",
  alternates: { canonical: "/credits" },
};

export default function CreditsPage() {
  return (
    <main className="prose-page">
      <section className="section narrow">
        <Link href="/" className="back-link">
          ← Back home
        </Link>
        <p className="eyebrow">Attribution</p>
        <h1>Photo credits</h1>
        <p className="lede">
          Every destination photograph is sourced from Wikimedia Commons under the license shown, resized into WebP and
          AVIF for fast loading. Map tiles and place data come from{" "}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
            OpenStreetMap contributors
          </a>
          .
        </p>
      </section>
      <section className="section narrow">
        <ol className="credit-list">
          {destinations.map((d) => {
            const photo = cityPhotos[d.slug];
            if (!photo) return null;
            return (
              <li key={d.slug}>
                <div>
                  <h2>{d.city}</h2>
                  <p className="muted">{photo.commonsFilename}</p>
                </div>
                <div>
                  <p>
                    {photo.credit} · <strong>{photo.license}</strong>
                  </p>
                  <a href={photo.sourcePage} target="_blank" rel="noopener noreferrer">
                    View on Wikimedia Commons
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}
