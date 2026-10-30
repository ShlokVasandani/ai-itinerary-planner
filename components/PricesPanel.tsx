"use client";

import { useCallback, useState } from "react";
import OutboundLink from "@/components/OutboundLink";
import CountUpNumber from "@/components/CountUpNumber";
import AffiliateNote from "@/components/AffiliateNote";
import type { Offer, TripLinkInput } from "@/lib/providers";

interface PriceResponse {
  offers: Offer[];
  updatedAt: string;
  mode: "live" | "fallback";
  reason?: string;
  disclaimer: string;
}

const NAMES: Record<string, string> = {
  travelpayouts: "Aviasales",
  "google-flights": "Google Flights",
  skyscanner: "Skyscanner",
  viator: "Viator",
  getyourguide: "GetYourGuide",
  klook: "Klook",
};

function Block({ title, data, error }: { title: string; data?: PriceResponse; error?: string }) {
  if (error) return <p className="field-error" role="alert">{title}: {error}</p>;
  if (!data) return null;
  const priced = data.offers.filter((o) => o.price);
  const cheapest = priced.length > 1 ? priced.reduce((a, b) => (a.price!.amount <= b.price!.amount ? a : b)) : undefined;
  const allSample = data.offers.every((o) => o.isSample);
  return (
    <section className="price-block">
      <h3>
        {title} {allSample && <span className="sample-tag">Sample prices</span>}
      </h3>
      {data.mode === "fallback" && data.reason && <p className="muted">{data.reason} Use the links to see real prices.</p>}
      <ul className="price-list">
        {data.offers.slice(0, 3).map((o, i) => (
          <li key={`${o.provider}-${i}`} className={`price-card${o === cheapest ? " is-cheapest" : ""}`} style={{ ["--i" as string]: i }}>
            {o === cheapest && <span className="price-badge">{o.isSample ? "Cheapest (sample)" : "Cheapest"}</span>}
            <span className="price-provider">{NAMES[o.provider] ?? o.provider}</span>
            {o.price ? (
              <span className="price-amount">
                <CountUpNumber amount={o.price.amount} currency={o.price.currency} />
              </span>
            ) : (
              <span className="price-amount price-none">See price</span>
            )}
            {o.isSample && <span className="sample-tag">Sample price</span>}
            <span className="price-title">{o.title}</span>
            <OutboundLink offer={o} className="btn btn-small">
              {o.price && !o.isSample ? "View on " : "Open "}
              {NAMES[o.provider] ?? o.provider}
            </OutboundLink>
          </li>
        ))}
      </ul>
      <p className="price-meta">
        Last updated {new Date(data.updatedAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}. {data.disclaimer}
      </p>
    </section>
  );
}

/** Price comparer: fetched on demand through our server routes (keys never reach the browser). */
export default function PricesPanel({
  trip,
  currency,
  origin,
  onOriginChange,
  topActivities,
}: {
  trip: TripLinkInput;
  currency: string;
  origin: string;
  onOriginChange: (o: string) => void;
  topActivities: string[];
}) {
  const [loading, setLoading] = useState(false);
  const [flights, setFlights] = useState<PriceResponse>();
  const [flightErr, setFlightErr] = useState<string>();
  const [acts, setActs] = useState<{ name: string; data?: PriceResponse; error?: string }[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setFlights(undefined);
    setFlightErr(undefined);
    setActs([]);
    const dest = trip.destination;
    const jobs: Promise<void>[] = [];
    if (/^[A-Za-z]{3}$/.test(origin.trim())) {
      const p = new URLSearchParams({ origin: origin.trim(), destination: dest.airportCodes[0], adults: String(trip.adults ?? 1), currency });
      if (trip.startDate) p.set("departure", trip.startDate);
      if (trip.endDate) p.set("return", trip.endDate);
      jobs.push(
        fetch(`/api/prices/flights?${p}`)
          .then(async (r) => {
            if (!r.ok) throw new Error(r.status === 429 ? "Too many requests, try again in a minute." : "Could not load flight prices.");
            setFlights(await r.json());
          })
          .catch((e: Error) => setFlightErr(e.message))
      );
    }
    topActivities.slice(0, 3).forEach((name) => {
      const p = new URLSearchParams({ q: name, city: dest.city, currency });
      jobs.push(
        fetch(`/api/prices/activities?${p}`)
          .then(async (r) => {
            if (!r.ok) throw new Error("Could not load prices.");
            const data = (await r.json()) as PriceResponse;
            setActs((a) => [...a, { name, data }]);
          })
          .catch((e: Error) => setActs((a) => [...a, { name, error: e.message }]))
      );
    });
    await Promise.all(jobs);
    setLoading(false);
  }, [trip, origin, currency, topActivities]);

  const hasOrigin = /^[A-Za-z]{3}$/.test(origin.trim());
  return (
    <section className="tool-card prices-panel" aria-labelledby="prices-title" aria-busy={loading}>
      <header className="tool-head">
        <p className="eyebrow">Prices</p>
        <h2 id="prices-title">Compare prices</h2>
        <p className="muted">
          Up to three providers per item, cheapest highlighted. Prices change, so confirm on the provider&apos;s site. <AffiliateNote />
        </p>
      </header>
      <div className="tool-form">
        <div className="field field-inline">
          <label htmlFor="price-origin">Flying from (3-letter airport code)</label>
          <input id="price-origin" value={origin} maxLength={3} placeholder="e.g. JFK" onChange={(e) => onOriginChange(e.target.value.toUpperCase())} />
        </div>
        <button type="button" className="btn btn-primary" onClick={load} disabled={loading}>
          {loading ? "Checking…" : "Check prices"}
        </button>
      </div>
      {!hasOrigin && origin.length > 0 && <p className="field-hint">Enter a 3-letter code such as JFK or LHR.</p>}
      {loading && (
        <div role="status" aria-live="polite" className="price-block">
          <p className="sr-only">Loading prices</p>
          <div className="price-list">
            <div className="price-skeleton" />
            <div className="price-skeleton" />
            <div className="price-skeleton" />
          </div>
        </div>
      )}
      {!loading && <Block title="Flights" data={flights} error={flightErr} />}
      {!loading && acts.map((a) => <Block key={a.name} title={a.name} data={a.data} error={a.error} />)}
    </section>
  );
}
