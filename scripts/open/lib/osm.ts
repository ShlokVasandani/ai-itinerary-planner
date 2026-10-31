import { getJson, UA } from "./http";

const ENDPOINTS = [
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

export interface OsmElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

const blockedUntil = new Map<string, number>();
const sleepMs = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Runs an Overpass query across the mirrors. A mirror that fails is skipped for a while
 * (circuit breaker), so a dead server costs one timeout rather than one per query.
 */
export async function overpass(query: string, cacheKey: string): Promise<OsmElement[]> {
  let lastErr: unknown;
  for (let round = 0; round < 5; round++) {
    const live = ENDPOINTS.filter((ep) => (blockedUntil.get(ep) ?? 0) <= Date.now());
    for (const ep of live.length ? live : ENDPOINTS) {
      try {
        const res = await getJson<{ elements: OsmElement[]; remark?: string }>(ep, {
          method: "POST",
          body: `data=${encodeURIComponent(query)}`,
          headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA },
          cacheKey,
          retries: 1,
          timeoutMs: 75_000,
        });
        if (Array.isArray(res.elements) && !/runtime error|out of memory/i.test(res.remark ?? "")) return res.elements;
        lastErr = new Error(`remark: ${res.remark}`);
      } catch (e) {
        lastErr = e;
        blockedUntil.set(ep, Date.now() + 4 * 60_000);
      }
    }
    await sleepMs(10_000 * (round + 1));
  }
  throw new Error(`Overpass failed on all mirrors: ${(lastErr as Error)?.message}`);
}

export const coordsOf = (e: OsmElement): { lat: number; lng: number } | undefined => {
  const lat = e.lat ?? e.center?.lat;
  const lng = e.lon ?? e.center?.lon;
  return lat !== undefined && lng !== undefined ? { lat, lng } : undefined;
};
