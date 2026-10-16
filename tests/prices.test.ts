import { beforeEach, describe, expect, it } from "vitest";
import { TtlCache } from "../lib/prices/cache";
import { RateLimiter } from "../lib/prices/ratelimit";
import { activityQuery, flightQuery } from "../lib/prices/schema";
import { getActivityPrices, getFlightPrices, priceCache } from "../lib/prices/service";
import { travelpayoutsFlights, viatorActivities } from "../lib/prices/providers";
import { handlePrices } from "../lib/prices/route-helpers";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const q = { origin: "JFK", destination: "CDG", departure: "2027-05-01", return: "2027-05-08", adults: 2, currency: "USD" };

beforeEach(() => priceCache.clear());

describe("schema", () => {
  it("normalises and validates", () => {
    const ok = flightQuery.parse({ origin: "jfk", destination: "cdg", adults: "2", currency: "eur" });
    expect(ok).toMatchObject({ origin: "JFK", destination: "CDG", adults: 2, currency: "EUR" });
    expect(flightQuery.safeParse({ origin: "JFKX", destination: "CDG" }).success).toBe(false);
    expect(flightQuery.safeParse({ origin: "JFK", destination: "CDG", departure: "tomorrow" }).success).toBe(false);
    expect(flightQuery.safeParse({ origin: "JFK", destination: "CDG", adults: "40" }).success).toBe(false);
    expect(activityQuery.safeParse({ q: "x", city: "Paris" }).success).toBe(false);
  });
});

describe("cache", () => {
  it("serves from cache within the TTL, reloads after, and de-duplicates concurrent loads", async () => {
    let t = 0;
    const cache = new TtlCache<number>(1000, 10, () => t);
    let loads = 0;
    const load = async () => ++loads;
    const [a, b] = await Promise.all([cache.get("k", load), cache.get("k", load)]);
    expect(a.value).toBe(1);
    expect(b.value).toBe(1);
    expect(loads).toBe(1);
    t = 999;
    expect((await cache.get("k", load)).hit).toBe(true);
    t = 1001;
    expect((await cache.get("k", load)).value).toBe(2);
  });
  it("does not cache failures", async () => {
    const cache = new TtlCache<number>(1000);
    await expect(cache.get("k", async () => { throw new Error("x"); })).rejects.toThrow();
    expect((await cache.get("k", async () => 5)).value).toBe(5);
  });
});

describe("rate limit", () => {
  it("blocks after the limit and recovers after the window", () => {
    let t = 0;
    const rl = new RateLimiter(2, 1000, () => t);
    expect(rl.check("a").ok).toBe(true);
    expect(rl.check("a").ok).toBe(true);
    const blocked = rl.check("a");
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
    expect(rl.check("b").ok).toBe(true);
    t = 1001;
    expect(rl.check("a").ok).toBe(true);
  });
});

describe("providers", () => {
  it("parses Travelpayouts fares and sends the token as a header, not in the URL", async () => {
    let seen: { url: string; headers: HeadersInit | undefined } | undefined;
    const f = (async (url: URL, init?: RequestInit) => {
      seen = { url: String(url), headers: init?.headers };
      return json({ success: true, data: [{ price: 412.4, airline: "AF", departure_at: "2027-05-01T10:00:00+02:00", link: "/search/JFK0105CDG0805" }, { airline: "bad" }] });
    }) as unknown as typeof fetch;
    const offers = await travelpayoutsFlights(flightQuery.parse(q), "SECRET", f);
    expect(offers).toHaveLength(1);
    expect(offers[0]).toMatchObject({ provider: "travelpayouts", isSample: false, price: { amount: 412, currency: "USD" } });
    expect(offers[0].url).toBe("https://www.aviasales.com/search/JFK0105CDG0805");
    expect(seen!.url).not.toContain("SECRET");
    expect((seen!.headers as Record<string, string>)["X-Access-Token"]).toBe("SECRET");
  });

  it("parses Viator products", async () => {
    const f = (async () => json({ products: { results: [{ title: "Louvre tour", productUrl: "https://www.viator.com/tours/Paris/x/d479-1", pricing: { summary: { fromPrice: 59.9 } } }] } })) as unknown as typeof fetch;
    const offers = await viatorActivities(activityQuery.parse({ q: "Louvre", city: "Paris", currency: "usd" }), "KEY", f);
    expect(offers[0]).toMatchObject({ provider: "viator", price: { amount: 60 }, isSample: false });
  });
});

describe("service", () => {
  it("without keys: link-only offers with clearly marked sample numbers, up to 3 providers", async () => {
    const res = await getFlightPrices(flightQuery.parse(q), {});
    expect(res.mode).toBe("fallback");
    expect(res.offers.length).toBeLessThanOrEqual(3);
    expect(res.offers.length).toBeGreaterThan(0);
    expect(res.offers.every((o) => o.isSample && o.price)).toBe(true);
    expect(res.reason).toMatch(/sample/i);
    expect(res.disclaimer).toMatch(/confirm/i);
    const again = await getFlightPrices(flightQuery.parse(q), {});
    expect(again.offers.map((o) => o.price)).toEqual(res.offers.map((o) => o.price)); // deterministic
  });

  it("with a key: live prices are not marked as samples", async () => {
    const f = (async () => json({ success: true, data: [{ price: 300, airline: "DL", link: "/x" }, { price: 250, airline: "AF", link: "/y" }] })) as unknown as typeof fetch;
    const res = await getFlightPrices(flightQuery.parse(q), { TRAVELPAYOUTS_TOKEN: "k" }, f);
    expect(res.mode).toBe("live");
    expect(res.offers[0].price?.amount).toBe(250);
    expect(res.offers[0].isSample).toBe(false);
    expect(res.offers.length).toBeLessThanOrEqual(3);
  });

  it("falls back, with sample labels, when the API fails", async () => {
    const f = (async () => json({}, 500)) as unknown as typeof fetch;
    const res = await getActivityPrices(activityQuery.parse({ q: "Louvre", city: "Paris" }), { VIATOR_API_KEY: "k" }, f);
    expect(res.mode).toBe("fallback");
    expect(res.offers.every((o) => o.isSample)).toBe(true);
  });
});

describe("route helper", () => {
  const req = (qs: string) => new Request(`http://x/api/prices/flights?${qs}`, { headers: { "x-forwarded-for": "9.9.9.9" } });
  it("returns 400 for invalid params and 429 when rate limited", async () => {
    const limiter = new RateLimiter(2, 60000);
    const run = async () => ({ ok: true });
    expect((await handlePrices(req("origin=zz"), flightQuery, run, limiter)).status).toBe(400);
    expect((await handlePrices(req("origin=JFK&destination=CDG"), flightQuery, run, limiter)).status).toBe(200);
    const blocked = await handlePrices(req("origin=JFK&destination=CDG"), flightQuery, run, limiter);
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
  });
});

describe("untrusted upstream URLs", () => {
  it("ignores hostile Travelpayouts links and non-Viator product URLs", async () => {
    const f = (async () => json({ success: true, data: [
      { price: 100, airline: "A", link: "@evil.example/x" },
      { price: 101, airline: "B", link: "//evil.example/x" },
      { price: 102, airline: "C", link: "/ok/path" },
    ] })) as unknown as typeof fetch;
    const offers = await travelpayoutsFlights(flightQuery.parse(q), "k", f);
    for (const o of offers) expect(new URL(o.url).hostname).toMatch(/aviasales\.com$|google\.com$/);
    expect(offers[2].url).toBe("https://www.aviasales.com/ok/path");
    const g = (async () => json({ products: { results: [
      { title: "x", productUrl: "javascript:alert(1)", pricing: { summary: { fromPrice: 5 } } },
      { title: "y", productUrl: "https://evil.example/", pricing: { summary: { fromPrice: 5 } } },
      { title: "z", productUrl: "https://www.viator.com/tours/x", pricing: { summary: { fromPrice: 5 } } },
    ] } })) as unknown as typeof fetch;
    const acts = await viatorActivities(activityQuery.parse({ q: "ab", city: "Paris" }), "k", g);
    expect(acts.map((a) => a.title)).toEqual(["z"]);
  });
});
