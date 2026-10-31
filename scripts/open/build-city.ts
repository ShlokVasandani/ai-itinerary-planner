/**
 * Assembles one open-data Destination from Wikidata (landmarks, city facts),
 * Wikipedia (summaries), OpenStreetMap (venues, hours, neighbourhoods) and
 * Open-Meteo (climate). Nothing is invented: any field the sources cannot
 * supply is left empty and the UI hides it.
 */
import { haversineKm } from "../../lib/engine/geo";
import { buildMapsUrl } from "../../lib/data/merge";
import type {
  Cafe,
  Coords,
  Destination,
  Interest,
  Neighborhood,
  NightlifeSpot,
  Place,
  Priority,
  Restaurant,
  SeasonRating,
  ShoppingSpot,
} from "../../lib/types";
import type { Seed } from "./seeds";
import { airportsNear, attractionsNear, countryFacts, resolveCity, type CityRecord } from "./lib/wikidata";
import { extracts } from "./lib/wikipedia";
import { climateFor, weatherRating } from "./lib/climate";
import { fetchOsm, type Poi } from "./lib/osm-places";
import { classify } from "./lib/classify";
import { MONTHS, cap, slugify, today, trimSentences } from "./lib/util";
import { safeHttpUrl } from "../../lib/safe-url";

export interface BuildResult {
  slug: string;
  region: Seed["region"];
  dest?: Destination;
  city?: CityRecord;
  /** Commons filenames of the city's landmarks, used as photo fallbacks. */
  landmarkImages?: { name: string; file: string }[];
  error?: string;
  notes: string[];
}

const radiusFor = (pop?: number) => (!pop ? 5 : pop > 5e6 ? 13 : pop > 1.5e6 ? 10 : pop > 4e5 ? 7 : 5);
const poiRadiusM = (pop?: number) => (!pop ? 4000 : pop > 5e6 ? 7000 : pop > 1.5e6 ? 6000 : pop > 4e5 ? 5000 : 4000);

function mealsFor(p: Poi): Restaurant["mealFor"] {
  const rules = p.hours?.rules;
  if (!rules?.length) return ["any"];
  const covers = (min: number) =>
    rules.some((r) => {
      const [oh, om] = r.open.split(":").map(Number);
      const [ch, cm] = r.close.split(":").map(Number);
      return oh * 60 + om <= min && ch * 60 + cm >= min;
    });
  const out: Restaurant["mealFor"] = [];
  if (covers(8 * 60 + 30)) out.push("breakfast");
  if (covers(12 * 60 + 30)) out.push("lunch");
  if (covers(19 * 60 + 30)) out.push("dinner");
  return out.length ? out : ["any"];
}

export async function buildCity(seed: Seed, taken: Set<string>): Promise<BuildResult> {
  const notes: string[] = [];
  const base: BuildResult = { slug: slugify(seed.city), region: seed.region, notes };
  const resolved = await resolveCity(seed);
  if ("error" in resolved) return { ...base, error: resolved.error };
  const city = resolved;
  let slug = slugify(seed.city);
  if (taken.has(slug)) slug = `${slug}-${slugify(seed.country)}`;
  base.slug = slug;
  const centre: Coords = { lat: city.lat, lng: city.lng };

  const [facts, climate, airports, attractions] = await Promise.all([
    countryFacts(city.countryQid),
    climateFor(city.lat, city.lng),
    airportsNear(city.lat, city.lng),
    attractionsNear(city.lat, city.lng, radiusFor(city.population)),
  ]);
  if (!facts.currency) return { ...base, city, error: "no currency found for country" };

  /* ---- landmarks ---- */
  const accepted = attractions
    .map((a) => ({ a, c: classify(a.types) }))
    .filter((x) => x.c.keep && x.a.name && x.a.name !== city.label && !/^Q\d+$/.test(x.a.name))
    .slice(0, 48);
  const wiki = await extracts(
    [city.enwiki ?? city.label, ...accepted.map((x) => x.a.enwiki)],
    2
  );
  const cityExtract = wiki[city.enwiki ?? city.label];
  const osm = await fetchOsm(slug, centre, poiRadiusM(city.population), accepted.map((x) => x.a.qid), radiusFor(city.population) * 1000 + 3000);
  const lmTags = osm.landmarks;

  const ids = new Set<string>();
  const uid = (prefix: string, name: string) => {
    let id = `${prefix}-${slugify(name).slice(0, 40)}`;
    let n = 2;
    while (ids.has(id)) id = `${prefix}-${slugify(name).slice(0, 36)}-${n++}`;
    ids.add(id);
    return id;
  };

  const landmarks: Place[] = [];
  accepted.forEach(({ a, c }) => {
    const desc = wiki[a.enwiki] ?? (a.description ? `${cap(a.description)}.` : "");
    if (!desc) return;
    const osm = lmTags[a.qid];
    const priority: Priority = landmarks.length < 5 ? "must-see" : landmarks.length < 16 ? "highly-recommended" : c.interests.some((x) => x === "art" || x === "nature") ? "interest-specific" : "if-you-have-time";
    const sources = [`https://en.wikipedia.org/wiki/${encodeURIComponent(a.enwiki.replace(/ /g, "_"))}`, `https://www.wikidata.org/wiki/${a.qid}`];
    if (osm) sources.push(`https://www.openstreetmap.org/${osm.osmId}`);
    const place: Place = {
      id: uid("l", a.name),
      name: a.name,
      neighborhood: "",
      description: trimSentences(desc, 300),
      whyGo: "",
      priority,
      interestTags: c.interests,
      suggestedDurationMin: c.minutes,
      coords: { lat: Number(a.lat.toFixed(6)), lng: Number(a.lng.toFixed(6)) },
      officialUrl: safeHttpUrl(a.website) ?? osm?.website,
      sources,
      verifiedAt: today(),
    };
    if (osm?.hours) {
      place.openingHours = osm.hours.rules;
      place.closedDays = osm.hours.closedDays;
    } else if (osm?.closedDays) place.closedDays = osm.closedDays;
    if (osm?.fee === "no") {
      place.costMin = 0;
      place.costMax = 0;
      place.costCurrency = facts.currency;
    } else if (osm?.charge) {
      place.costMin = osm.charge.amount;
      place.costMax = osm.charge.amount;
      place.costCurrency = osm.charge.currency;
    }
    landmarks.push(place);
  });

  /* ---- venues ---- */
  const pois = osm.pois;
  const pick = <T extends Poi>(list: T[], n: number) => list.slice().sort((x, y) => y.score - x.score).slice(0, n);

  const restaurants: Restaurant[] = pick(pois.restaurant, 18).map((p) => ({
    id: uid("r", p.name),
    name: p.name,
    neighborhood: "",
    description: `${p.cuisine ? `${p.cuisine} restaurant` : "Restaurant"}${p.dietary.length ? `; tagged ${p.dietary.join(", ")}-friendly on OpenStreetMap` : ""}.`,
    whyGo: "",
    priority: p.wikidata ? "highly-recommended" : "if-you-have-time",
    interestTags: ["food"],
    suggestedDurationMin: 75,
    cuisine: p.cuisine ?? "Restaurant",
    signatureDishes: [],
    mealFor: mealsFor(p),
    ...(p.dietary.length ? { dietary: p.dietary } : {}),
    coords: { lat: Number(p.coords.lat.toFixed(6)), lng: Number(p.coords.lng.toFixed(6)) },
    officialUrl: p.website,
    ...(p.hours ? { openingHours: p.hours.rules, closedDays: p.hours.closedDays } : p.closedDays ? { closedDays: p.closedDays } : {}),
    sources: [`https://www.openstreetmap.org/${p.osmId}`],
    verifiedAt: today(),
  }));

  const cafes: Cafe[] = pick(pois.cafe, 10).map((p) => ({
    id: uid("c", p.name),
    name: p.name,
    neighborhood: "",
    description: `Café${p.cuisine ? ` serving ${p.cuisine.toLowerCase()}` : ""}.`,
    priority: p.wikidata ? "highly-recommended" : "if-you-have-time",
    coords: { lat: Number(p.coords.lat.toFixed(6)), lng: Number(p.coords.lng.toFixed(6)) },
    officialUrl: p.website,
    ...(p.hours ? { openingHours: p.hours.rules, closedDays: p.hours.closedDays } : p.closedDays ? { closedDays: p.closedDays } : {}),
    sources: [`https://www.openstreetmap.org/${p.osmId}`],
    verifiedAt: today(),
  }));

  const nightlife: NightlifeSpot[] = pick(pois.nightlife, 8).map((p) => ({
    id: uid("n", p.name),
    name: p.name,
    neighborhood: "",
    type: p.subtype === "nightclub" ? "club" : "bar",
    description: `${cap(p.subtype === "biergarten" ? "beer garden" : p.subtype || "bar")}${p.cuisine ? ` (${p.cuisine.toLowerCase()})` : ""}.`,
    coords: { lat: Number(p.coords.lat.toFixed(6)), lng: Number(p.coords.lng.toFixed(6)) },
    officialUrl: p.website,
    ...(p.hours ? { openingHours: p.hours.rules, closedDays: p.hours.closedDays } : p.closedDays ? { closedDays: p.closedDays } : {}),
    sources: [`https://www.openstreetmap.org/${p.osmId}`],
    verifiedAt: today(),
  }));

  const shopping: ShoppingSpot[] = pick(pois.shopping, 6).map((p) => ({
    id: uid("s", p.name),
    name: p.name,
    neighborhood: "",
    type: p.subtype === "marketplace" ? "market" : "mall",
    description: p.subtype === "marketplace" ? "Market." : p.subtype === "department_store" ? "Department store." : "Shopping centre.",
    coords: { lat: Number(p.coords.lat.toFixed(6)), lng: Number(p.coords.lng.toFixed(6)) },
    officialUrl: p.website,
    ...(p.hours ? { openingHours: p.hours.rules, closedDays: p.hours.closedDays } : p.closedDays ? { closedDays: p.closedDays } : {}),
    sources: [`https://www.openstreetmap.org/${p.osmId}`],
    verifiedAt: today(),
  }));

  /* ---- neighbourhoods: OSM place nodes that actually have venues nearby, else clusters around top landmarks ---- */
  const everything: { coords?: Coords; neighborhood: string; name: string }[] = [...landmarks, ...restaurants, ...cafes, ...nightlife, ...shopping];
  const osmHoods = osm.hoods;
  const ranked = osmHoods
    .map((h) => ({ h, n: everything.filter((x) => x.coords && haversineKm(h.coords, x.coords) < 0.9).length + (h.wikidata ? 3 : 0) }))
    .filter((x) => x.n >= 3)
    .sort((a, b) => b.n - a.n);
  const hoods: Neighborhood[] = [];
  for (const { h } of ranked) {
    if (hoods.length >= 8) break;
    if (hoods.some((x) => x.coords && haversineKm(x.coords, h.coords) < 0.7)) continue;
    if (hoods.some((x) => x.name.toLowerCase() === h.name.toLowerCase())) continue;
    hoods.push({ id: slugify(h.name), name: h.name, coords: { lat: Number(h.coords.lat.toFixed(6)), lng: Number(h.coords.lng.toFixed(6)) }, radiusKm: 0.9, knownFor: [], bestFor: [] });
  }
  if (hoods.length < 4) {
    notes.push(`only ${hoods.length} OSM neighbourhoods; adding clusters around top landmarks`);
    for (const l of landmarks) {
      if (hoods.length >= 6) break;
      if (!l.coords || hoods.some((x) => x.coords && haversineKm(x.coords, l.coords!) < 1.2)) continue;
      hoods.push({ id: slugify(`around ${l.name}`), name: `Around ${l.name}`, coords: l.coords, radiusKm: 1, knownFor: [], bestFor: [] });
    }
  }
  const hoodIds = new Set<string>();
  for (const h of hoods) {
    let id = h.id || "area";
    let n = 2;
    while (hoodIds.has(id)) id = `${h.id}-${n++}`;
    h.id = id;
    hoodIds.add(id);
  }
  for (const x of everything) {
    if (!x.coords || hoods.length === 0) {
      x.neighborhood = x.neighborhood || "City centre";
      continue;
    }
    let best = hoods[0];
    let bestD = Infinity;
    for (const h of hoods) {
      const d = haversineKm(h.coords!, x.coords);
      if (d < bestD) {
        best = h;
        bestD = d;
      }
    }
    x.neighborhood = bestD <= 2.5 ? best.name : "City centre";
  }
  for (const h of hoods) {
    const here = landmarks.filter((l) => l.neighborhood === h.name);
    h.knownFor = here.slice(0, 3).map((l) => l.name);
    const tally = new Map<Interest, number>();
    here.forEach((l) => l.interestTags.forEach((t) => tally.set(t, (tally.get(t) ?? 0) + 1)));
    h.bestFor = [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t);
  }
  const used = new Set(everything.map((x) => x.neighborhood));
  const finalHoods = hoods.filter((h) => used.has(h.name));

  /* ---- climate ---- */
  const seasons: SeasonRating[] = climate.tmax.map((t, i) => ({ weather: weatherRating(Number.isFinite(t) ? t : 15, climate.rainDays[i]) }));
  const score = (i: number) => seasons[i].weather * 10 - Math.abs((climate.tmax[i] || 15) - 22) / 10;
  const bestMonths = [...Array(12).keys()].sort((a, b) => score(b) - score(a)).slice(0, 3).sort((a, b) => a - b).map((i) => MONTHS[i]);

  const airport = airports[0];
  const dest: Destination = {
    slug,
    tier: "open",
    region: seed.region,
    wikidataId: city.qid,
    population: city.population,
    languages: facts.languages,
    currency: facts.currency,
    airportCodes: airports.filter((a) => a.sitelinks >= 4).slice(0, 2).map((a) => a.iata).concat(airports.length && airports.every((a) => a.sitelinks < 4) ? [airports[0].iata] : []),
    ianaTimezone: climate.timezone,
    seasons,
    localPhrases: [],
    city: seed.city,
    country: seed.country,
    tagline: city.description ? `${cap(city.description)}.` : `${seed.city}, ${seed.country}.`,
    overview: cityExtract ? trimSentences(cityExtract, 520) : `${seed.city} is a city in ${seed.country}.`,
    heroImageQuery: `${seed.city} skyline`,
    quickFacts: {
      country: seed.country,
      timezone: climate.timezone,
      bestMonths,
      airport: airport ? `${airport.name} (${airport.iata})` : "",
    },
    neighborhoods: finalHoods,
    landmarks: landmarks.map((l) => ({ ...l, mapsUrl: buildMapsUrl(l.name, seed.city) })),
    restaurants: restaurants.map((l) => ({ ...l, mapsUrl: buildMapsUrl(l.name, seed.city) })),
    cafes: cafes.map((l) => ({ ...l, mapsUrl: buildMapsUrl(l.name, seed.city) })),
    localFoods: [],
    experiences: [],
    shopping: shopping.map((l) => ({ ...l, mapsUrl: buildMapsUrl(l.name, seed.city) })),
    nightlife: nightlife.map((l) => ({ ...l, mapsUrl: buildMapsUrl(l.name, seed.city) })),
    dayTrips: [],
    transportation: [],
    travelTips: [],
  };
  // bbox around the venue spread, used by the geographic check.
  const lat = (c: Coords) => c.lat;
  const pts = [...dest.landmarks, ...dest.restaurants, ...dest.cafes, ...dest.nightlife, ...dest.shopping].map((x) => x.coords!).filter(Boolean);
  if (pts.length) {
    const pad = 0.05;
    dest.bbox = [Math.min(...pts.map(lat)) - pad, Math.min(...pts.map((p) => p.lng)) - pad, Math.max(...pts.map(lat)) + pad, Math.max(...pts.map((p) => p.lng)) + pad].map((n) => Number(n.toFixed(4))) as [number, number, number, number];
  }
  const landmarkImages = accepted.filter((x) => x.a.image).map((x) => ({ name: x.a.name, file: x.a.image! }));
  return { ...base, dest, city, landmarkImages, notes };
}
