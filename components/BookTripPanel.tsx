"use client";

import { useMemo } from "react";
import OutboundLink from "@/components/OutboundLink";
import AffiliateNote from "@/components/AffiliateNote";
import { tripLinksSync, type Offer, type TripLinkInput } from "@/lib/providers";

const LABEL: Record<string, string> = {
  "google-flights": "Google Flights",
  skyscanner: "Skyscanner",
  booking: "Booking.com",
  airbnb: "Airbnb",
  viator: "Viator",
  getyourguide: "GetYourGuide",
  klook: "Klook",
  rome2rio: "Rome2rio",
  "12go": "12Go",
};

function Group({ title, offers, hint }: { title: string; offers: Offer[]; hint?: string }) {
  if (offers.length === 0) return null;
  return (
    <section className="book-group">
      <h3>{title}</h3>
      {hint && <p className="muted">{hint}</p>}
      <ul>
        {offers.map((o, i) => (
          <li key={`${o.provider}-${i}`}>
            <OutboundLink offer={o} className="book-link">
              <span className="book-link-name">{LABEL[o.provider] ?? o.provider}</span>
              <span className="book-link-title">{o.title}</span>
              <span aria-hidden="true">↗</span>
            </OutboundLink>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Trip-level "Book this trip": flights, stays, top activities and transfers, all prefilled. */
export default function BookTripPanel({
  trip,
  topActivities,
  origin,
  onOriginChange,
}: {
  trip: TripLinkInput;
  topActivities: string[];
  origin: string;
  onOriginChange: (origin: string) => void;
}) {
  const links = useMemo(() => tripLinksSync({ ...trip, origin: origin || undefined }, topActivities), [trip, origin, topActivities]);

  return (
    <section className="book-panel" aria-labelledby="book-trip-title">
      <header>
        <h2 id="book-trip-title">Book this trip</h2>
        <p className="muted">
          Links open the provider with your dates and travellers filled in. Prices change, so confirm on the provider&apos;s
          site. <AffiliateNote />
        </p>
      </header>
      <div className="field field-inline">
        <label htmlFor="book-origin">Flying from (airport code or city)</label>
        <input
          id="book-origin"
          value={origin}
          maxLength={40}
          placeholder="e.g. JFK or London"
          onChange={(e) => onOriginChange(e.target.value)}
        />
      </div>
      <div className="book-grid">
        <Group title="Flights" offers={links.flights} />
        <Group title="Stays" offers={links.stays} />
        <Group title="Top activities" offers={links.activities.slice(0, 6)} hint="Searches for the must-sees in your plan." />
        <Group title="Getting around" offers={links.transfers} />
      </div>
    </section>
  );
}
