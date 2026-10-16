import type { Metadata } from "next";
import PlannerClient, { type PlannerInitial } from "@/components/PlannerClient";

export const metadata: Metadata = {
  title: "Plan a trip: day-by-day itinerary builder",
  description:
    "Choose a city, dates, pace and budget and get a day-by-day plan that respects opening hours, with walking times, cost ranges and booking links.",
  alternates: { canonical: "/planner" },
  openGraph: { title: "Plan a trip with Sekai", description: "Day-by-day itineraries that respect opening hours, with cost ranges and booking links.", url: "/planner" },
};

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function PlannerPage({ searchParams }: { searchParams: Promise<Params> }) {
  const p = await searchParams;
  // Read on the server so the page is rendered as HTML instead of waiting for client JavaScript.
  const initial: PlannerInitial = {
    city: one(p.city),
    start: one(p.start),
    end: one(p.end),
    adults: one(p.adults),
    go: one(p.go),
    origin: one(p.origin),
  };
  return <PlannerClient initial={initial} />;
}
