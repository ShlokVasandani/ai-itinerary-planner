import type { Metadata } from "next";
import Link from "next/link";
import { cityIndex, curatedCount, openCount } from "@/lib/data/catalog";
import CityBrowser from "@/components/CityBrowser";
import PageTransition from "@/components/PageTransition";

export const metadata: Metadata = {
  title: `All ${cityIndex.length} destinations`,
  description: `Browse ${cityIndex.length} cities by region and plan a day-by-day trip to any of them.`,
  alternates: { canonical: "/destinations" },
};

export default function DestinationsPage() {
  return (
    <PageTransition>
    <main className="dest-index">
      <section className="section narrow">
        <Link href="/" className="back-link" transitionTypes={["nav-back"]}>
          ← Back home
        </Link>
        <p className="eyebrow">Destinations</p>
        <h1>{cityIndex.length} cities to plan a trip to</h1>
        <p className="lede">
          {openCount
            ? `${curatedCount} guides are written and checked by hand. The rest are built from Wikidata, Wikipedia and OpenStreetMap, ranked by public data and checked automatically before they are published.`
            : "Every guide is written and checked by hand: real landmarks, restaurants and neighbourhoods, with coordinates and opening hours from OpenStreetMap and Wikidata."}
        </p>
      </section>
      <section className="section">
        <CityBrowser cities={cityIndex} />
      </section>
    </main>
    </PageTransition>
  );
}
