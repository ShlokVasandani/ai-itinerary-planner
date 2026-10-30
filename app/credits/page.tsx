import Link from "next/link";
import { cityIndex } from "@/lib/data/catalog";
import { getPhotoCredit } from "@/lib/photos";
import PageTransition from "@/components/PageTransition";

export const metadata = {
  title: "Photo credits and data sources",
  description: "Photographer credit and license for every destination photo (Wikimedia Commons), plus OpenStreetMap data attribution.",
  alternates: { canonical: "/credits" },
};

export default function CreditsPage() {
  return (
    <PageTransition>
    <main className="prose-page">
      <section className="section narrow">
        <Link href="/" className="back-link" transitionTypes={["nav-back"]}>
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
          . Open-data city guides also use text summaries from{" "}
          <a href="https://en.wikipedia.org/" target="_blank" rel="noopener noreferrer">
            Wikipedia
          </a>{" "}
          (CC BY-SA 4.0), facts from{" "}
          <a href="https://www.wikidata.org/" target="_blank" rel="noopener noreferrer">
            Wikidata
          </a>{" "}
          (CC0) and climate averages from{" "}
          <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">
            Open-Meteo
          </a>{" "}
          (CC BY 4.0). Each place links to its source page.
        </p>
      </section>
      <section className="section narrow">
        <ol className="credit-list">
          {cityIndex.map((d) => {
            const photo = getPhotoCredit(d.slug);
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
    </PageTransition>
  );
}
