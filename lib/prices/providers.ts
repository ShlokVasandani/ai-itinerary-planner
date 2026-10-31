import type { Offer } from "../providers/types";
import { googleFlights } from "../providers/links";
import { safeHttpUrl } from "../safe-url";
import type { ActivityQuery, FlightQuery } from "./schema";

type Fetch = typeof fetch;

/**
 * Flights: Travelpayouts / Aviasales Data API (free token, cached fares).
 * Docs: https://support.travelpayouts.com/hc/en-us/articles/203956163
 * The data are the cheapest fares other users found in roughly the last 48 hours,
 * not live availability, which is why the UI says "confirm on the provider's site".
 */
export async function travelpayoutsFlights(q: FlightQuery, token: string, f: Fetch = fetch): Promise<Offer[]> {
  const url = new URL("https://api.travelpayouts.com/aviasales/v3/prices_for_dates");
  url.searchParams.set("origin", q.origin);
  url.searchParams.set("destination", q.destination);
  if (q.departure) url.searchParams.set("departure_at", q.departure);
  if (q.return) url.searchParams.set("return_at", q.return);
  url.searchParams.set("currency", q.currency.toLowerCase());
  url.searchParams.set("sorting", "price");
  url.searchParams.set("one_way", q.return ? "false" : "true");
  url.searchParams.set("limit", "3");
  const res = await f(url, { headers: { "X-Access-Token": token, "Accept-Encoding": "gzip, deflate" }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Travelpayouts HTTP ${res.status}`);
  const json = (await res.json()) as { success?: boolean; data?: { price?: number; airline?: string; departure_at?: string; link?: string }[] };
  if (json.success === false || !Array.isArray(json.data)) throw new Error("Travelpayouts returned no data");
  const [fallbackLink] = googleFlights.build({ kind: "flight", city: q.destination, airportCodes: [q.destination], origin: q.origin, startDate: q.departure, endDate: q.return });
  return json.data
    .filter((d) => typeof d.price === "number")
    .map((d) => ({
      provider: "travelpayouts" as const,
      kind: "flight" as const,
      title: `${d.airline ?? "Airline"}${d.departure_at ? `, departs ${d.departure_at.slice(0, 10)}` : ""}`,
      price: { amount: Math.round(d.price as number), currency: q.currency },
      // `link` is a path on aviasales.com; anything else (e.g. "@evil.com/x" or "//evil.com") is ignored.
      url: (d.link && /^\/[^/\\]/.test(d.link) ? safeHttpUrl(`https://www.aviasales.com${d.link}`, ["aviasales.com"]) : undefined) ?? fallbackLink.url,
      isSample: false,
      note: "Cached fare; may have changed",
    }));
}

/**
 * Activities: Viator Partner API (Basic Access is self-service and free).
 * Docs: https://docs.viator.com/partner-api/affiliate/technical
 * Uses the free-text search endpoint; confirm field names against the current spec when you add a key.
 */
export async function viatorActivities(q: ActivityQuery, apiKey: string, f: Fetch = fetch): Promise<Offer[]> {
  const res = await f("https://api.viator.com/partner/search/freetext", {
    method: "POST",
    headers: {
      "exp-api-key": apiKey,
      Accept: "application/json;version=2.0",
      "Accept-Language": "en-US",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      searchTerm: `${q.q} ${q.city}`,
      searchTypes: [{ searchType: "PRODUCTS", pagination: { start: 1, count: 3 } }],
      currency: q.currency,
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Viator HTTP ${res.status}`);
  const json = (await res.json()) as {
    products?: { results?: { title?: string; productUrl?: string; pricing?: { summary?: { fromPrice?: number } } }[] };
  };
  const results = json.products?.results ?? [];
  return results
    .filter((r) => typeof r.pricing?.summary?.fromPrice === "number" && safeHttpUrl(r.productUrl, ["viator.com"]))
    .slice(0, 3)
    .map((r) => ({
      provider: "viator" as const,
      kind: "activity" as const,
      title: r.title ?? q.q,
      price: { amount: Math.round(r.pricing!.summary!.fromPrice as number), currency: q.currency },
      url: safeHttpUrl(r.productUrl, ["viator.com"]) as string,
      isSample: false,
      note: "From price per person",
    }));
}
