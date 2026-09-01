import Link from "next/link";
import { destinations } from "@/lib/data";

export default function SiteFooter() {
  const featured = destinations.slice(0, 6);

  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-brand">
          <span className="logo">Sekai✦</span>
          <p>
            20 cities, zero invented places — every trip built from real,
            hand-verified landmarks, restaurants, and neighborhoods.
          </p>
        </div>
        <div className="footer-col">
          <h4>Popular cities</h4>
          <ul>
            {featured.map((d) => (
              <li key={d.slug}>
                <Link href={`/destinations/${d.slug}`}>{d.city}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="footer-col">
          <h4>Plan</h4>
          <ul>
            <li>
              <Link href="/#destinations">All destinations</Link>
            </li>
            <li>
              <Link href="/planner">Build an itinerary</Link>
            </li>
            <li>
              <Link href="/credits">Photo credits</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Sekai</span>
        <span>
          Photography via{" "}
          <Link href="/credits" style={{ color: "inherit" }}>
            Wikimedia Commons
          </Link>
          . No AI-generated venues. No sponsored placements.
        </span>
      </div>
    </footer>
  );
}
