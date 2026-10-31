import { withAffiliate } from "./affiliateConfig";
import type { Offer, OfferKind, ProviderAdapter, ProviderId, SearchQuery } from "./types";

// ============================================================================
// Link-only adapters
// ----------------------------------------------------------------------------
// No keys, no scraping. Each builds a deep link from the destination, dates and
// travellers using the provider's public URL parameters. They return offers with
// `price` undefined, so the UI shows "See prices" rather than inventing numbers.
// ============================================================================

const enc = encodeURIComponent;

function ymd(iso: string | undefined): string | undefined {
  return iso && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : undefined;
}

/** Skyscanner path dates are YYMMDD. */
function yymmdd(iso: string | undefined): string | undefined {
  const d = ymd(iso);
  return d ? d.slice(2, 4) + d.slice(5, 7) + d.slice(8, 10) : undefined;
}

const isIata = (s: string | undefined): s is string => !!s && /^[A-Za-z]{3}$/.test(s.trim());

function offer(provider: ProviderId, kind: OfferKind, title: string, rawUrl: string, note?: string): Offer {
  const { url, isAffiliate } = withAffiliate(provider, rawUrl);
  return { provider, kind, title, url, isSample: false, isAffiliate, note };
}

/** Adapter with a synchronous `build` so client components can render links without awaiting. */
export interface SyncAdapter extends Omit<ProviderAdapter, "search"> {
  build(query: SearchQuery): Offer[];
  search?(query: SearchQuery): Promise<Offer[]>;
}

function party(q: SearchQuery) {
  return { adults: Math.max(1, q.adults ?? 1), children: Math.max(0, q.children ?? 0) };
}

function destCode(q: SearchQuery): string {
  return q.airportCodes?.[0] ?? q.city;
}

// -- Flights -----------------------------------------------------------------

export const googleFlights: SyncAdapter = {
  id: "google-flights",
  name: "Google Flights",
  kinds: ["flight"],
  build(q) {
    const from = q.origin ? ` from ${q.origin}` : "";
    const dates = ymd(q.startDate) ? ` on ${ymd(q.startDate)}${ymd(q.endDate) ? ` through ${ymd(q.endDate)}` : ""}` : "";
    const text = `Flights to ${destCode(q)}${from}${dates}`;
    return [offer("google-flights", "flight", `Flights to ${q.city} on Google Flights`, `https://www.google.com/travel/flights?q=${enc(text)}`)];
  },
};

export const skyscanner: SyncAdapter = {
  id: "skyscanner",
  name: "Skyscanner",
  kinds: ["flight"],
  build(q) {
    const { adults, children } = party(q);
    const origin = isIata(q.origin) ? q.origin.toLowerCase() : "";
    const dest = destCode(q).toLowerCase();
    const out = yymmdd(q.startDate);
    const back = yymmdd(q.endDate);
    const path = ["transport", "flights", origin || "anywhere", enc(dest), out, back].filter(Boolean).join("/");
    const params = new URLSearchParams({ adultsv2: String(adults), cabinclass: "economy", rtn: back ? "1" : "0" });
    if (children > 0) params.set("childrenv2", Array(children).fill("8").join("|"));
    return [offer("skyscanner", "flight", `Flights to ${q.city} on Skyscanner`, `https://www.skyscanner.net/${path}/?${params}`)];
  },
};

// -- Stays -------------------------------------------------------------------

export const booking: SyncAdapter = {
  id: "booking",
  name: "Booking.com",
  kinds: ["stay"],
  build(q) {
    const { adults, children } = party(q);
    const params = new URLSearchParams({
      ss: q.country ? `${q.city}, ${q.country}` : q.city,
      group_adults: String(adults),
      group_children: String(children),
      no_rooms: String(Math.max(1, Math.ceil(adults / 2))),
    });
    if (ymd(q.startDate)) params.set("checkin", ymd(q.startDate)!);
    if (ymd(q.endDate)) params.set("checkout", ymd(q.endDate)!);
    if (q.currency) params.set("selected_currency", q.currency);
    return [offer("booking", "stay", `Stays in ${q.city} on Booking.com`, `https://www.booking.com/searchresults.html?${params}`)];
  },
};

export const airbnb: SyncAdapter = {
  id: "airbnb",
  name: "Airbnb",
  kinds: ["stay"],
  build(q) {
    const { adults, children } = party(q);
    const place = q.country ? `${q.city}--${q.country}` : q.city;
    const params = new URLSearchParams({ adults: String(adults), children: String(children) });
    if (ymd(q.startDate)) params.set("checkin", ymd(q.startDate)!);
    if (ymd(q.endDate)) params.set("checkout", ymd(q.endDate)!);
    const slug = place.replace(/\s+/g, "-");
    return [offer("airbnb", "stay", `Homes in ${q.city} on Airbnb`, `https://www.airbnb.com/s/${enc(slug)}/homes?${params}`)];
  },
};

// -- Activities --------------------------------------------------------------

function activityText(q: SearchQuery): string {
  return q.text ? `${q.text} ${q.city}` : `${q.city} things to do`;
}

export const viator: SyncAdapter = {
  id: "viator",
  name: "Viator",
  kinds: ["activity"],
  build(q) {
    const title = q.text ? `${q.text} on Viator` : `Tours and activities in ${q.city} on Viator`;
    return [offer("viator", "activity", title, `https://www.viator.com/searchResults/all?text=${enc(activityText(q))}`)];
  },
};

export const getYourGuide: SyncAdapter = {
  id: "getyourguide",
  name: "GetYourGuide",
  kinds: ["activity"],
  build(q) {
    const title = q.text ? `${q.text} on GetYourGuide` : `Tours and activities in ${q.city} on GetYourGuide`;
    return [offer("getyourguide", "activity", title, `https://www.getyourguide.com/s/?q=${enc(activityText(q))}`)];
  },
};

export const klook: SyncAdapter = {
  id: "klook",
  name: "Klook",
  kinds: ["activity"],
  build(q) {
    const title = q.text ? `${q.text} on Klook` : `Tours and activities in ${q.city} on Klook`;
    return [offer("klook", "activity", title, `https://www.klook.com/en-US/search/result/?query=${enc(activityText(q))}`)];
  },
};

// -- Transfers ---------------------------------------------------------------

const TWELVEGO_COUNTRIES = new Set(["thailand", "malaysia", "singapore"]);

function slug(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const twelveGo: SyncAdapter = {
  id: "12go",
  name: "12Go",
  kinds: ["transfer"],
  build(q) {
    // 12Go covers buses, trains and ferries in South-East Asia; skip elsewhere rather than send people to an empty page.
    if (!q.country || !TWELVEGO_COUNTRIES.has(q.country.toLowerCase())) return [];
    const from = slug(q.from ?? q.origin ?? q.city);
    const to = slug(q.to ?? q.text ?? q.city);
    if (!from || !to || from === to) return [];
    const params = new URLSearchParams();
    if (ymd(q.startDate)) params.set("date", ymd(q.startDate)!);
    const qs = params.toString();
    return [offer("12go", "transfer", `Trains, buses and ferries: ${q.from ?? q.origin ?? q.city} to ${q.to ?? q.text ?? q.city}`, `https://12go.asia/en/travel/${from}/${to}${qs ? `?${qs}` : ""}`)];
  },
};

export const rome2rio: SyncAdapter = {
  id: "rome2rio",
  name: "Rome2rio",
  kinds: ["transfer"],
  build(q) {
    const from = q.from ?? q.origin;
    const to = q.to ?? q.text ?? q.city;
    if (!from || !to) return [];
    const path = `${enc(from.trim())}/${enc(to.trim())}`;
    return [offer("rome2rio", "transfer", `How to get from ${from} to ${to} on Rome2rio`, `https://www.rome2rio.com/map/${path}`)];
  },
};

const RAW_ADAPTERS: SyncAdapter[] = [
  googleFlights,
  skyscanner,
  booking,
  airbnb,
  viator,
  getYourGuide,
  klook,
  twelveGo,
  rome2rio,
];

/** Link adapters as full `ProviderAdapter`s (async `search`, no key needed). */
export const LINK_ADAPTERS: ProviderAdapter[] = RAW_ADAPTERS.map((a) => ({
  id: a.id,
  name: a.name,
  kinds: a.kinds,
  search: async (q: SearchQuery) => a.build(q),
}));

/** Synchronous variant for client components: every link adapter that supports `query.kind`. */
export function buildLinks(query: SearchQuery): Offer[] {
  return RAW_ADAPTERS.filter((a) => a.kinds.includes(query.kind)).flatMap((a) => a.build(query));
}

/** Runs every link adapter that supports `query.kind`. */
export async function searchLinks(query: SearchQuery): Promise<Offer[]> {
  return buildLinks(query);
}
