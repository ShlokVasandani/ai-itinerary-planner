"use client";

import { useMemo, useState } from "react";
import DestinationCard from "@/components/DestinationCard";
import PressButton from "@/components/PressButton";
import type { CityIndexEntry } from "@/lib/data/catalog";

const REGIONS = ["All", "Europe", "Asia", "Americas", "Middle East", "Africa", "Oceania"] as const;

/** Search and region filter over the full city list. Cards load their photos lazily. */
export default function CityBrowser({ cities }: { cities: CityIndexEntry[] }) {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState<(typeof REGIONS)[number]>("All");
  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return cities.filter((c) => (region === "All" || c.region === region) && (!n || `${c.city} ${c.country}`.toLowerCase().includes(n)));
  }, [cities, q, region]);

  return (
    <>
      <div className="browser-bar">
        <input type="search" className="browser-search" placeholder="Search cities or countries" aria-label="Search cities" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="seg browser-regions" role="group" aria-label="Region">
          {REGIONS.map((r) => (
            <PressButton key={r} className={`seg-btn${region === r ? " is-on" : ""}`} aria-pressed={region === r} onPress={() => setRegion(r)}>
              {r}
            </PressButton>
          ))}
        </div>
      </div>
      <p className="browser-count" role="status">
        {shown.length} {shown.length === 1 ? "city" : "cities"}
      </p>
      <div className="dest-grid">
        {shown.map((d, i) => (
          <DestinationCard key={d.slug} d={d} priority={i < 3} />
        ))}
      </div>
      {shown.length === 0 && <p className="muted">No city matches. Try another spelling or region.</p>}
    </>
  );
}
