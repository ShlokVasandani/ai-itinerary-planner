import { haversineKm } from "../../../lib/engine/geo";
import type { Coords, DietaryNeed, OpeningHoursRule } from "../../../lib/types";
import { parseClosedDaysOnly, parseOsmHours } from "../../lib/osm-hours";
import { safeHttpUrl } from "../../../lib/safe-url";
import { coordsOf, overpass, type OsmElement } from "./osm";
import { cap, isLatin } from "./util";

export type PoiKind = "restaurant" | "cafe" | "nightlife" | "shopping";

export interface Poi {
  osmId: string;
  name: string;
  coords: Coords;
  kind: PoiKind;
  subtype: string;
  cuisine?: string;
  website?: string;
  wikidata?: string;
  hours?: { rules: OpeningHoursRule[]; closedDays: number[] };
  closedDays?: number[];
  dietary: DietaryNeed[];
  score: number;
  distKm: number;
}

const around = (lat: number, lng: number, r: number) => `(around:${r},${lat},${lng})`;

function englishName(t: Record<string, string>): string | undefined {
  const direct = t["name:en"] || t["int_name"];
  if (direct && isLatin(direct)) return direct.trim();
  const latn = Object.keys(t).find((k) => /^name:.*-Latn/.test(k));
  if (latn && isLatin(t[latn])) return t[latn].trim();
  if (t.name && isLatin(t.name)) return t.name.trim();
  return undefined;
}

function cuisineLabel(raw?: string): string | undefined {
  if (!raw) return undefined;
  const parts = raw
    .split(/[;,]/)
    .map((p) => p.trim().replace(/_/g, " "))
    .filter((p) => p && !/^(regional|restaurant|international|local)$/i.test(p))
    .slice(0, 2);
  return parts.length ? parts.map(cap).join(" / ") : undefined;
}

function toPoi(e: OsmElement, kind: PoiKind, centre: Coords): Poi | undefined {
  const t = e.tags ?? {};
  const name = englishName(t);
  const coords = coordsOf(e);
  if (!name || !coords || name.length < 2 || name.length > 70) return undefined;
  // Chains are not what a trip planner should recommend.
  if (t["brand:wikidata"] || t.brand) return undefined;
  if (/\b(closed|abandoned)\b/i.test(t.disused ?? "") || t["disused:amenity"] || t["abandoned:amenity"]) return undefined;
  const website = safeHttpUrl(t.website || t["contact:website"]);
  const rawHours = t.opening_hours;
  const hours = rawHours ? parseOsmHours(rawHours) ?? undefined : undefined;
  const closedDays = !hours && rawHours ? parseClosedDaysOnly(rawHours) ?? undefined : undefined;
  const dietary: DietaryNeed[] = [];
  const dv = (k: string) => t[k] === "yes" || t[k] === "only";
  if (dv("diet:vegetarian") || dv("diet:vegan")) dietary.push("vegetarian");
  if (dv("diet:vegan")) dietary.push("vegan");
  if (dv("diet:halal")) dietary.push("halal");
  if (dv("diet:gluten_free")) dietary.push("gluten-free");
  const distKm = haversineKm(centre, coords);
  let score = 0;
  if (t.wikidata) score += 6;
  if (t.wikipedia) score += 3;
  if (website) score += 2;
  if (hours) score += 2;
  if (t.cuisine) score += 1;
  if (t.phone || t["contact:phone"]) score += 0.5;
  if (t["addr:street"]) score += 0.5;
  if (t.michelin || t.stars) score += 4;
  score -= distKm * 0.6;
  return {
    osmId: `${e.type}/${e.id}`,
    name,
    coords,
    kind,
    subtype: t.amenity ?? t.shop ?? "",
    cuisine: cuisineLabel(t.cuisine),
    website,
    wikidata: /^Q\d+$/.test(t.wikidata ?? "") ? t.wikidata : undefined,
    hours,
    closedDays,
    dietary,
    score,
    distKm,
  };
}

/** One statement per query keeps the public servers happy; venues with a website are the ones worth recommending. */
const tagged = (filter: string, lat: number, lng: number, r: number) => `nwr${filter}["website"]${around(lat, lng, r)};`;

function kindOf(t: Record<string, string>): PoiKind | undefined {
  if (t.amenity === "restaurant") return "restaurant";
  if (t.amenity === "cafe") return "cafe";
  if (/^(bar|pub|nightclub|biergarten)$/.test(t.amenity ?? "")) return "nightlife";
  if (/^(mall|department_store)$/.test(t.shop ?? "") || t.amenity === "marketplace") return "shopping";
  return undefined;
}

function sortPois(pois: Poi[]): Poi[] {
  const out: Poi[] = [];
  for (const p of pois.sort((a, b) => b.score - a.score)) {
    if (!out.some((o) => o.name.toLowerCase() === p.name.toLowerCase() && haversineKm(o.coords, p.coords) < 0.15)) out.push(p);
  }
  return out;
}

export interface OsmBundle {
  pois: Record<PoiKind, Poi[]>;
  hoods: OsmHood[];
  landmarks: Record<string, LandmarkOsm>;
}

/**
 * One Overpass request per city (venues, neighbourhood nodes and Wikidata-linked landmark tags together),
 * which is far kinder to the public servers. Falls back to separate requests if the combined one fails.
 */
export async function fetchOsm(slug: string, centre: Coords, radiusM: number, qids: string[], landmarkRadiusM: number): Promise<OsmBundle> {
  const { lat, lng } = centre;
  const a = around(lat, lng, radiusM);
  const body = [
    `nwr["amenity"="restaurant"]["name"]["website"]${a};`,
    `nwr["amenity"="cafe"]["name"]["website"]${a};`,
    `nwr["amenity"~"^(bar|pub|nightclub|biergarten)$"]["name"]["website"]${a};`,
    `nwr["shop"~"^(mall|department_store)$"]["name"]${a};`,
    `nwr["amenity"="marketplace"]["name"]${a};`,
    `node["place"~"^(suburb|neighbourhood|quarter|city_district|borough)$"]["name"]${around(lat, lng, radiusM + 1500)};`,
    qids.length ? `nwr["wikidata"~"^(${qids.join("|")})$"]${around(lat, lng, landmarkRadiusM)};` : "",
  ].join("");
  try {
    const els = await overpass(`[out:json][timeout:110];(${body});out center tags 9000;`, `osm4:${slug}:${radiusM}:${qids.length}`);
    const buckets: Record<PoiKind, Poi[]> = { restaurant: [], cafe: [], nightlife: [], shopping: [] };
    const hoods: OsmHood[] = [];
    const landmarks = landmarkTagsFrom(els.filter((e) => e.tags?.wikidata && qids.includes(e.tags.wikidata)));
    const seen = new Set<string>();
    for (const e of els) {
      const t = e.tags ?? {};
      const key = `${e.type}/${e.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (t.place) {
        const name = englishName(t);
        const c = coordsOf(e);
        if (name && c) hoods.push({ name, coords: c, wikidata: !!t.wikidata });
        continue;
      }
      const kind = kindOf(t);
      if (!kind) continue;
      const p = toPoi(e, kind, centre);
      if (p) buckets[kind].push(p);
    }
    return { pois: { restaurant: sortPois(buckets.restaurant), cafe: sortPois(buckets.cafe), nightlife: sortPois(buckets.nightlife), shopping: sortPois(buckets.shopping) }, hoods, landmarks };
  } catch {
    const pois = await fetchPois(slug, centre, radiusM);
    const hoods = await fetchHoods(slug, centre, radiusM + 1500);
    const landmarks = await fetchLandmarkTags(slug, qids, centre, landmarkRadiusM);
    return { pois, hoods, landmarks };
  }
}

export async function fetchPois(slug: string, centre: Coords, radiusM: number): Promise<Record<PoiKind, Poi[]>> {
  const { lat, lng } = centre;
  const run = async (kind: PoiKind, body: string) => {
    const q = `[out:json][timeout:60];(${body});out center tags 1800;`;
    const els = await overpass(q, `osm2:${slug}:${kind}:${radiusM}`);
    const seen = new Set<string>();
    const pois: Poi[] = [];
    for (const e of els) {
      const key = `${e.type}/${e.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const p = toPoi(e, kind, centre);
      if (p) pois.push(p);
    }
    // Drop exact duplicates by name + ~100 m.
    const out: Poi[] = [];
    for (const p of pois.sort((a, b) => b.score - a.score)) {
      if (!out.some((o) => o.name.toLowerCase() === p.name.toLowerCase() && haversineKm(o.coords, p.coords) < 0.15)) out.push(p);
    }
    return out;
  };
  const restaurants = await run("restaurant", tagged('["amenity"="restaurant"]["name"]', lat, lng, radiusM));
  const cafes = await run("cafe", tagged('["amenity"="cafe"]["name"]', lat, lng, radiusM));
  const nightlife = await run("nightlife", tagged('["amenity"~"^(bar|pub|nightclub|biergarten)$"]["name"]', lat, lng, radiusM));
  const shopping = await run(
    "shopping",
    `nwr["shop"~"^(mall|department_store)$"]["name"]${around(lat, lng, radiusM)};nwr["amenity"="marketplace"]["name"]${around(lat, lng, radiusM)};`
  );
  return { restaurant: restaurants, cafe: cafes, nightlife, shopping };
}

export interface OsmHood {
  name: string;
  coords: Coords;
  wikidata?: boolean;
}

export async function fetchHoods(slug: string, centre: Coords, radiusM: number): Promise<OsmHood[]> {
  const q = `[out:json][timeout:60];(node["place"~"^(suburb|neighbourhood|quarter|city_district|borough)$"]["name"]${around(centre.lat, centre.lng, radiusM)};);out center tags 600;`;
  const els = await overpass(q, `osm3:${slug}:hoods:${radiusM}`);
  const out: OsmHood[] = [];
  for (const e of els) {
    const name = englishName(e.tags ?? {});
    const c = coordsOf(e);
    if (!name || !c) continue;
    out.push({ name, coords: c, wikidata: !!e.tags?.wikidata });
  }
  return out;
}

export interface LandmarkOsm {
  hours?: { rules: OpeningHoursRule[]; closedDays: number[] };
  closedDays?: number[];
  website?: string;
  fee?: "no" | "yes";
  charge?: { amount: number; currency: string };
  osmId: string;
}

function landmarkTagsFrom(els: OsmElement[]): Record<string, LandmarkOsm> {
  const out: Record<string, LandmarkOsm> = {};
  for (const e of els) {
    const t = e.tags ?? {};
    const q1 = t.wikidata;
    if (!q1 || out[q1]) continue;
    const raw = t.opening_hours;
    const hours = raw ? parseOsmHours(raw) ?? undefined : undefined;
    const closedDays = !hours && raw ? parseClosedDaysOnly(raw) ?? undefined : undefined;
    const m = /^(\d+(?:[.,]\d+)?)\s*([A-Z]{3})$/.exec((t.charge ?? "").trim());
    out[q1] = {
      hours,
      closedDays,
      website: safeHttpUrl(t.website || t["contact:website"]),
      fee: t.fee === "no" ? "no" : t.fee === "yes" ? "yes" : undefined,
      charge: m ? { amount: Number(m[1].replace(",", ".")), currency: m[2] } : undefined,
      osmId: `${e.type}/${e.id}`,
    };
  }
  return out;
}

/** Hours, website and fee for Wikidata-linked landmarks, matched by their `wikidata` tag. */
export async function fetchLandmarkTags(slug: string, qids: string[], centre: Coords, radiusM: number): Promise<Record<string, LandmarkOsm>> {
  const out: Record<string, LandmarkOsm> = {};
  for (let i = 0; i < qids.length; i += 50) {
    const chunk = qids.slice(i, i + 50);
    const q = `[out:json][timeout:60];nwr["wikidata"~"^(${chunk.join("|")})$"](around:${radiusM},${centre.lat},${centre.lng});out center tags 600;`;
    const els = await overpass(q, `osm2:${slug}:lm:${i}:${chunk.length}:${chunk[0]}`);
    Object.assign(out, landmarkTagsFrom(els));
  }
  return out;
}
