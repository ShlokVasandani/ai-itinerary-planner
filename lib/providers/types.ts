// ============================================================================
// Booking / price provider interface
// ----------------------------------------------------------------------------
// Every provider, link-only or API-backed, implements `ProviderAdapter`. A
// link-only adapter never needs a key and never scrapes: it builds a deep link
// from the destination, dates and travellers using the provider's documented
// public URL parameters. API adapters (Phase 5) return the same `Offer` shape
// with a price attached.
// ============================================================================

export type OfferKind = "flight" | "stay" | "activity" | "transfer";

export type ProviderId =
  | "google-flights"
  | "skyscanner"
  | "booking"
  | "airbnb"
  | "viator"
  | "getyourguide"
  | "klook"
  | "12go"
  | "rome2rio"
  | "amadeus"
  | "kiwi"
  | "travelpayouts"
  | "official";

export interface Offer {
  provider: ProviderId;
  kind: OfferKind;
  title: string;
  price?: { amount: number; currency: string };
  url: string;
  /** True for any number that is a placeholder, never real data. */
  isSample: boolean;
  /** True when an affiliate ID was appended to `url`. */
  isAffiliate?: boolean;
  /** Short note such as "Prices shown on the provider's site". */
  note?: string;
}

export interface SearchQuery {
  kind: OfferKind;
  /** Destination city. */
  city: string;
  country?: string;
  /** IATA codes for the destination, main airport first. */
  airportCodes?: string[];
  /** ISO currency the user wants prices in (the destination currency by default). */
  currency?: string;
  /** Where the traveller starts: an IATA code ("JFK") or a place name. */
  origin?: string;
  /** ISO dates YYYY-MM-DD. */
  startDate?: string;
  endDate?: string;
  adults?: number;
  children?: number;
  /** Free text, e.g. the name of an activity or day trip. */
  text?: string;
  /** For transfers: where from / to. */
  from?: string;
  to?: string;
}

export interface ProviderAdapter {
  id: ProviderId;
  name: string;
  kinds: OfferKind[];
  search(query: SearchQuery): Promise<Offer[]>;
}
