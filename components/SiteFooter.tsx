import Link from "next/link";
import { cityIndex, curatedCount, openCount } from "@/lib/data/catalog";

export default function SiteFooter() {
  const featured = cityIndex.slice(0, 6);
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="brand">
            <span className="brand-mark" aria-hidden="true" />
            Sekai
          </span>
          <p>
            {cityIndex.length} cities, no invented places.{" "}
            {openCount
              ? `${curatedCount} guides are written and checked by hand; the rest are built from Wikidata, Wikipedia and OpenStreetMap and machine-checked.`
              : "Every guide is written and checked by hand."}{" "}
            Distances and opening hours come from OpenStreetMap.
          </p>
        </div>
        <nav className="footer-col" aria-label="Popular cities">
          <h2>Popular cities</h2>
          <ul>
            {featured.map((d) => (
              <li key={d.slug}>
                <Link href={`/destinations/${d.slug}`}>{d.city}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav className="footer-col" aria-label="Plan">
          <h2>Plan</h2>
          <ul>
            <li>
              <Link href="/destinations">All destinations</Link>
            </li>
            <li>
              <Link href="/planner">Build an itinerary</Link>
            </li>
            <li>
              <Link href="/credits">Photo credits</Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="footer-note">
        <p>
          <strong>Affiliate links.</strong> Some booking links (flights, stays, tours) may earn Sekai a small commission
          at no extra cost to you. Official venue links never do. Prices change; always confirm on the provider&apos;s
          site.
        </p>
        <p>
          © {new Date().getFullYear()} Sekai · Map data ©{" "}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
            OpenStreetMap contributors
          </a>{" "}
          · Photography via <Link href="/credits">Wikimedia Commons</Link>
        </p>
      </div>
    </footer>
  );
}
