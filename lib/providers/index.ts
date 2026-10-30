import type { Destination, Verifiable } from "../types";
import { withAffiliate } from "./affiliateConfig";
import { buildLinks, searchLinks } from "./links";
import type { Offer, SearchQuery } from "./types";

export * from "./types";
export { withAffiliate, outboundRel, activeAffiliates, AFFILIATE_ENV_VARS } from "./affiliateConfig";
export { LINK_ADAPTERS, searchLinks, buildLinks } from "./links";

type StopCategory = "landmark" | "restaurant" | "cafe" | "experience" | "shopping" | "nightlife" | "dayTrip";

/** Stops of these kinds also get provider searches (tours, transfers) on top of their own official and map links. */
export const hasProviderOffers = (category: StopCategory): boolean =>
  category === "landmark" || category === "experience" || category === "dayTrip" || category === "nightlife";

/** The first thing to show on any venue: its own booking or official page. */
export function officialOffer(item: Verifiable & { name: string }): Offer | undefined {
  const url = item.bookingUrl ?? item.officialUrl;
  if (!url) return undefined;
  return {
    provider: "official",
    kind: "activity",
    title: item.bookingUrl ? "Book official" : "Official site",
    url,
    isSample: false,
    isAffiliate: false,
  };
}

export interface TripLinkInput {
  destination: Destination;
  origin?: string;
  startDate?: string;
  endDate?: string;
  adults?: number;
  children?: number;
}

export function baseQuery(t: TripLinkInput, kind: SearchQuery["kind"]): SearchQuery {
  return {
    kind,
    city: t.destination.city,
    country: t.destination.country,
    airportCodes: t.destination.airportCodes,
    currency: t.destination.currency,
    origin: t.origin,
    startDate: t.startDate,
    endDate: t.endDate,
    adults: t.adults,
    children: t.children,
  };
}

export interface TripLinks {
  flights: Offer[];
  stays: Offer[];
  activities: Offer[];
  transfers: Offer[];
}

/** Everything the trip-level "Book this trip" panel needs, all link-only. */
export async function tripLinks(t: TripLinkInput, topActivities: string[] = []): Promise<TripLinks> {
  const [flights, stays, generic, transfers] = await Promise.all([
    searchLinks(baseQuery(t, "flight")),
    searchLinks(baseQuery(t, "stay")),
    searchLinks(baseQuery(t, "activity")),
    searchLinks({
      ...baseQuery(t, "transfer"),
      from: t.destination.airportCodes[0],
      to: t.destination.city,
    }),
  ]);
  const specific = (
    await Promise.all(topActivities.slice(0, 3).map((text) => searchLinks({ ...baseQuery(t, "activity"), text })))
  ).flat();
  return { flights, stays, activities: [...specific, ...generic], transfers };
}

/** "Details" menu content for one stop: official link first, then relevant providers. */
export async function stopOffers(
  item: Verifiable & { name: string },
  category: "landmark" | "restaurant" | "cafe" | "experience" | "shopping" | "nightlife" | "dayTrip",
  t: TripLinkInput
): Promise<Offer[]> {
  const offers: Offer[] = [];
  const official = officialOffer(item);
  if (official) offers.push(official);
  if (hasProviderOffers(category)) {
    offers.push(...(await searchLinks({ ...baseQuery(t, "activity"), text: item.name })));
  }
  if (category === "dayTrip") {
    offers.push(...(await searchLinks({ ...baseQuery(t, "transfer"), from: t.destination.city, to: item.name })));
  }
  return offers;
}

/** Synchronous version of `tripLinks` for client components. */
export function tripLinksSync(t: TripLinkInput, topActivities: string[] = []): TripLinks {
  const specific = topActivities.slice(0, 3).flatMap((text) => buildLinks({ ...baseQuery(t, "activity"), text }));
  return {
    flights: buildLinks(baseQuery(t, "flight")),
    stays: buildLinks(baseQuery(t, "stay")),
    activities: [...specific, ...buildLinks(baseQuery(t, "activity"))],
    transfers: buildLinks({ ...baseQuery(t, "transfer"), from: t.destination.airportCodes[0], to: t.destination.city }),
  };
}

/** Synchronous version of `stopOffers`. */
export function stopOffersSync(
  item: Verifiable & { name: string },
  category: "landmark" | "restaurant" | "cafe" | "experience" | "shopping" | "nightlife" | "dayTrip",
  t: TripLinkInput
): Offer[] {
  const offers: Offer[] = [];
  const official = officialOffer(item);
  if (official) offers.push(official);
  if (hasProviderOffers(category)) {
    offers.push(...buildLinks({ ...baseQuery(t, "activity"), text: item.name }));
  }
  if (category === "dayTrip") {
    offers.push(...buildLinks({ ...baseQuery(t, "transfer"), from: t.destination.city, to: item.name }));
  }
  return offers;
}
