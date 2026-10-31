"use client";

import { useMemo } from "react";
import Popover from "@/components/Popover";
import OutboundLink from "@/components/OutboundLink";
import AffiliateNote from "@/components/AffiliateNote";
import { stopOffersSync, type TripLinkInput } from "@/lib/providers";
import type { StopCategory, TimelineStop } from "@/lib/itinerary-engine";

const PROVIDER_LABEL: Record<string, string> = {
  viator: "Viator",
  getyourguide: "GetYourGuide",
  klook: "Klook",
  rome2rio: "Rome2rio",
  "12go": "12Go",
};

/**
 * "Book" or "Details" menu on a stop: the venue's official site first, then a
 * map link, then providers relevant to that kind of stop.
 */
export default function BookMenu({ stop, trip }: { stop: TimelineStop; trip: TripLinkInput }) {
  const category = (stop.category ?? "landmark") as StopCategory;
  const offers = useMemo(
    () => stopOffersSync({ name: stop.name, officialUrl: stop.officialUrl, bookingUrl: stop.bookingUrl }, category, trip),
    [stop.name, stop.officialUrl, stop.bookingUrl, category, trip]
  );
  const hasBooking = !!stop.bookingUrl || category === "experience" || category === "dayTrip";
  const providerOffers = offers.filter((o) => o.provider !== "official");
  const official = offers.find((o) => o.provider === "official");
  if (!official && !stop.mapsUrl && providerOffers.length === 0) return null;

  return (
    <Popover label={hasBooking ? "Book" : "Details"} ariaLabel={`${hasBooking ? "Book" : "Details"} for ${stop.name}`}>
      <ul className="menu-list">
        {official && (
          <li>
            <OutboundLink offer={{ ...official, isAffiliate: false }} className="menu-link menu-link-strong">
              {official.title}
            </OutboundLink>
          </li>
        )}
        {stop.mapsUrl && (
          <li>
            <OutboundLink offer={{ url: stop.mapsUrl, title: "Open in Google Maps", isAffiliate: false }} className="menu-link">
              Open in Google Maps
            </OutboundLink>
          </li>
        )}
        {providerOffers.map((o, i) => (
          <li key={`${o.provider}-${i}`}>
            <OutboundLink offer={o} className="menu-link">
              {o.kind === "transfer"
                ? `Getting there on ${PROVIDER_LABEL[o.provider] ?? o.provider}`
                : `Find tours on ${PROVIDER_LABEL[o.provider] ?? o.provider}`}
            </OutboundLink>
          </li>
        ))}
      </ul>
      {providerOffers.length > 0 && (
        <p className="menu-foot">
          <AffiliateNote /> · prices change; confirm on the provider&apos;s site
        </p>
      )}
    </Popover>
  );
}
