"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SiteHeader() {
  const pathname = usePathname();
  const isPlanner = pathname?.startsWith("/planner");
  const isDestinations = pathname === "/" || pathname?.startsWith("/destinations");

  return (
    <header className="site-header">
      <nav>
        <Link href="/" className="logo">
          Sekai<span>✦</span>
        </Link>
        <div className="nav">
          <Link href="/#destinations" className={isDestinations ? "nav-active" : ""}>
            Destinations
          </Link>
          <Link href="/planner" className={isPlanner ? "nav-active" : ""}>
            Plan a trip
          </Link>
        </div>
      </nav>
    </header>
  );
}
