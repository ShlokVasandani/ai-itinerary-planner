import type { Metadata } from "next";
import PlannerClient, { type PlannerInitial } from "@/components/PlannerClient";

export const metadata: Metadata = {
  title: "Plan a trip",
  description: "Build a day-by-day itinerary for any of 20 cities, with real dates, distances and cost ranges.",
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
  };
  return <PlannerClient initial={initial} />;
}
