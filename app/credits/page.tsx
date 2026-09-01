import Link from "next/link";
import { destinations } from "@/lib/data";
import { cityPhotos } from "@/lib/city-photo-urls";

export const metadata = {
  title: "Photo credits — Sekai",
  description: "Attribution for every destination photograph, sourced from Wikimedia Commons.",
};

export default function CreditsPage() {
  return (
    <main>
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "64px clamp(24px,7vw,112px) 40px" }}>
        <Link href="/" className="feature-open-back">
          ← Back home
        </Link>
        <p className="eyebrow" style={{ marginTop: 24 }}>Attribution</p>
        <h1 style={{ font: "600 clamp(2.2rem,5vw,3.4rem)/1.05 'Playfair Display', serif", letterSpacing: "-.03em", margin: "10px 0 20px" }}>
          Photo credits
        </h1>
        <p className="lede" style={{ marginBottom: 40 }}>
          Every destination photograph on Sekai is real, sourced from Wikimedia Commons, and
          individually verified before use. Below is the full attribution for all 20 — photographer
          credit, license, and a link back to the original file.
        </p>
      </section>

      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 clamp(24px,7vw,112px) 100px" }}>
        <div className="edit-list">
          {destinations.map((d, i) => {
            const photo = cityPhotos[d.slug];
            if (!photo) return null;
            return (
              <div className="edit-item" key={d.slug}>
                <span className="edit-item-index">{String(i + 1).padStart(2, "0")}</span>
                <div className="edit-item-body">
                  <div className="edit-item-head">
                    <h4>{d.city}</h4>
                    <span className="edit-item-tag">{photo.license}</span>
                  </div>
                  <p className="edit-item-meta">{photo.commonsFilename}</p>
                  <p className="edit-item-desc">
                    Credit: {photo.credit}.{" "}
                    <a href={photo.sourcePage} target="_blank" rel="noopener noreferrer nofollow" style={{ color: "var(--coral)" }}>
                      View source on Wikimedia Commons ↗
                    </a>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
