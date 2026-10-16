"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

export interface CityOption {
  slug: string;
  label: string;
}

/** Destination, dates and travellers; hands off to the planner with the values in the URL. */
export default function HeroSearch({ cities }: { cities: CityOption[] }) {
  const router = useRouter();
  const id = useId();
  const [city, setCity] = useState(cities[0]?.slug ?? "");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [adults, setAdults] = useState(2);

  const dateError = start && end && end < start ? "Return date must be after the start date." : "";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (dateError) return;
    const params = new URLSearchParams({ city, go: "1", adults: String(adults) });
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    router.push(`/planner?${params}`);
  }

  return (
    <form className="search-card" onSubmit={submit} aria-label="Start planning a trip">
      <div className="field">
        <label htmlFor={`${id}-city`}>Where to</label>
        <select id={`${id}-city`} value={city} onChange={(e) => setCity(e.target.value)}>
          {cities.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor={`${id}-start`}>From</label>
        <input id={`${id}-start`} type="date" value={start} onChange={(e) => setStart(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor={`${id}-end`}>To</label>
        <input id={`${id}-end`} type="date" value={end} min={start || undefined} onChange={(e) => setEnd(e.target.value)} />
      </div>
      <div className="field">
        <span className="field-label" id={`${id}-trav`}>
          Travellers
        </span>
        <div className="stepper" role="group" aria-labelledby={`${id}-trav`}>
          <button type="button" onClick={() => setAdults((n) => Math.max(1, n - 1))} aria-label="Fewer travellers">
            −
          </button>
          <output aria-live="polite">{adults}</output>
          <button type="button" onClick={() => setAdults((n) => Math.min(12, n + 1))} aria-label="More travellers">
            +
          </button>
        </div>
      </div>
      <button type="submit" className="btn btn-primary search-submit">
        Plan my trip
      </button>
      {dateError && (
        <p className="field-error" role="alert">
          {dateError}
        </p>
      )}
    </form>
  );
}
