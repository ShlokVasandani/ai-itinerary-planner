import { buildLinks } from "../providers/links";
import type { Offer } from "../providers/types";
import { hashSeed } from "../engine/rng";
import { TtlCache } from "./cache";
import { travelpayoutsFlights, viatorActivities } from "./providers";
import type { ActivityQuery, FlightQuery } from "./schema";

export interface PriceResponse {
  /** Up to three providers; live prices first, cheapest first. */
  offers: Offer[];
  /** ISO timestamp of when the data was fetched (not when it was served). */
  updatedAt: string;
  /** "live": at least one real price. "fallback": link-only plus clearly labelled sample numbers. */
  mode: "live" | "fallback";
  /** Why we are in fallback mode, safe to show to users. */
  reason?: string;
  disclaimer: string;
}

export const DISCLAIMER = "Prices change. Confirm on the provider's site before you book.";

const cache = new TtlCache<PriceResponse>();
export const priceCache = cache;

/** Placeholder number for fallback mode. Deterministic and always marked isSample. */
export function sampleAmount(kind: "flight" | "activity", seed: string): number {
  const h = hashSeed(seed);
  return kind === "flight" ? 180 + (h % 720) : 18 + (h % 95);
}

function cheapestFirst(offers: Offer[]): Offer[] {
  return [...offers].sort((a, b) => (a.price?.amount ?? Infinity) - (b.price?.amount ?? Infinity));
}

function withSamples(links: Offer[], kind: "flight" | "activity", seedBase: string, currency: string): Offer[] {
  return links.slice(0, 3).map((o) => ({
    ...o,
    price: { amount: sampleAmount(kind, `${seedBase}|${o.provider}`), currency },
    isSample: true,
    note: "Sample price, not a real quote",
  }));
}

export interface Env {
  TRAVELPAYOUTS_TOKEN?: string;
  VIATOR_API_KEY?: string;
}

export async function getFlightPrices(q: FlightQuery, env: Env, f: typeof fetch = fetch): Promise<PriceResponse> {
  const key = `flight|${q.origin}|${q.destination}|${q.departure ?? ""}|${q.return ?? ""}|${q.adults}|${q.currency}|${env.TRAVELPAYOUTS_TOKEN ? "k" : "n"}`;
  const { value, cachedAt } = await cache.get(key, async () => {
    const links = buildLinks({ kind: "flight", city: q.destination, airportCodes: [q.destination], origin: q.origin, startDate: q.departure, endDate: q.return, adults: q.adults });
    let reason = "No flight price API key is configured, so these are sample numbers.";
    if (env.TRAVELPAYOUTS_TOKEN) {
      try {
        const live = await travelpayoutsFlights(q, env.TRAVELPAYOUTS_TOKEN, f);
        if (live.length > 0) {
          const offers = [...cheapestFirst(live).slice(0, 2), ...links.slice(0, 3 - Math.min(2, live.length))];
          return { offers, updatedAt: new Date().toISOString(), mode: "live" as const, disclaimer: DISCLAIMER };
        }
        reason = "No cached fares were found for this route and date, so these are sample numbers.";
      } catch {
        reason = "The flight price service is unavailable right now, so these are sample numbers.";
      }
    }
    return {
      offers: withSamples(links, "flight", key, q.currency),
      updatedAt: new Date().toISOString(),
      mode: "fallback" as const,
      reason,
      disclaimer: DISCLAIMER,
    };
  });
  return { ...value, updatedAt: new Date(cachedAt).toISOString() };
}

export async function getActivityPrices(q: ActivityQuery, env: Env, f: typeof fetch = fetch): Promise<PriceResponse> {
  const key = `activity|${q.q.toLowerCase()}|${q.city.toLowerCase()}|${q.currency}|${env.VIATOR_API_KEY ? "k" : "n"}`;
  const { value, cachedAt } = await cache.get(key, async () => {
    const links = buildLinks({ kind: "activity", city: q.city, text: q.q });
    let reason = "No activity price API key is configured, so these are sample numbers.";
    if (env.VIATOR_API_KEY) {
      try {
        const live = await viatorActivities(q, env.VIATOR_API_KEY, f);
        if (live.length > 0) {
          const others = links.filter((l) => l.provider !== "viator");
          const offers = [...cheapestFirst(live).slice(0, 1), ...others].slice(0, 3);
          return { offers, updatedAt: new Date().toISOString(), mode: "live" as const, disclaimer: DISCLAIMER };
        }
        reason = "No matching tours were found, so these are sample numbers.";
      } catch {
        reason = "The activity price service is unavailable right now, so these are sample numbers.";
      }
    }
    return {
      offers: withSamples(links, "activity", key, q.currency),
      updatedAt: new Date().toISOString(),
      mode: "fallback" as const,
      reason,
      disclaimer: DISCLAIMER,
    };
  });
  return { ...value, updatedAt: new Date(cachedAt).toISOString() };
}
