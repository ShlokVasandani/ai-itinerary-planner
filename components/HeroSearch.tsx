"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import CityField, { type CityOption } from "@/components/CityField";
import DateRangeField from "@/components/DateRangeField";
import TravellerField from "@/components/TravellerField";

export type { CityOption };

/** Destination, dates and travellers; hands off to the planner with the values in the URL. */
export default function HeroSearch({ cities }: { cities: CityOption[] }) {
  const router = useRouter();
  const [city, setCity] = useState(cities[0]?.slug ?? "");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  // The planner renders on demand. Pending keeps the button alive while its loading skeleton streams in.
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    const params = new URLSearchParams({ city, go: "1", adults: String(adults) });
    if (children) params.set("children", String(children));
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    startTransition(() => router.push(`/planner?${params}`, { transitionTypes: ["nav-forward"] }));
  }

  return (
    <form className="search-bar" onSubmit={submit} aria-label="Start planning a trip">
      <CityField cities={cities} value={city} onChange={setCity} />
      <DateRangeField start={start} end={end} onChange={(a, b) => (setStart(a), setEnd(b))} />
      <TravellerField adults={adults} kids={children} onChange={(a, c) => (setAdults(a), setChildren(c))} />
      <button type="submit" className="btn btn-primary search-submit" aria-busy={pending}>
        {pending ? <span className="spinner" aria-hidden="true" /> : null}
        <span key={pending ? "p" : "i"} className="btn-label">
          {pending ? "Planning…" : "Plan my trip"}
        </span>
        {pending ? null : <span aria-hidden="true">→</span>}
      </button>
    </form>
  );
}
