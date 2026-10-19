import type { Destination } from "../types";
import { destinations, getDestinationBySlug } from "./index";
import openIndex from "./open/index.json";
import { openLoaders } from "./open/loaders";
import { getPhoto } from "../photos";

/** Everything the city pickers, grids and sitemap need, without loading any city's full data. */
export interface CityIndexEntry {
  slug: string;
  city: string;
  country: string;
  region: string;
  tagline: string;
  tier: "curated" | "open";
  landmarks: number;
  places: number;
  hasPhoto: boolean;
}

const CURATED_REGION: Record<string, string> = {
  tokyo: "Asia", paris: "Europe", london: "Europe", dubai: "Middle East", singapore: "Asia", bangkok: "Asia", rome: "Europe",
  barcelona: "Europe", "new-york-city": "Americas", istanbul: "Europe", seoul: "Asia", amsterdam: "Europe", copenhagen: "Europe",
  "hong-kong": "Asia", sydney: "Oceania", zurich: "Europe", "los-angeles": "Americas", "kuala-lumpur": "Asia", vienna: "Europe", lisbon: "Europe",
  prague: "Europe", berlin: "Europe", madrid: "Europe", milan: "Europe", florence: "Europe", venice: "Europe", athens: "Europe", budapest: "Europe",
  munich: "Europe", edinburgh: "Europe", dublin: "Europe", brussels: "Europe", stockholm: "Europe", krakow: "Europe", marrakesh: "Africa", cairo: "Africa",
  "cape-town": "Africa", "mexico-city": "Americas", "buenos-aires": "Americas", "rio-de-janeiro": "Americas", toronto: "Americas", "san-francisco": "Americas",
  chicago: "Americas", miami: "Americas", kyoto: "Asia", osaka: "Asia", taipei: "Asia", hanoi: "Asia", mumbai: "Asia", melbourne: "Oceania",
};

const curated: CityIndexEntry[] = destinations.map((d) => ({
  slug: d.slug,
  city: d.city,
  country: d.country,
  region: CURATED_REGION[d.slug] ?? "",
  tagline: d.tagline,
  tier: "curated",
  landmarks: d.landmarks.length,
  places: d.landmarks.length + d.restaurants.length + d.cafes.length + d.nightlife.length + d.shopping.length,
  hasPhoto: !!getPhoto(d.slug),
}));

const open: CityIndexEntry[] = (openIndex as Omit<CityIndexEntry, "tier">[]).map((e) => ({ ...e, tier: "open" as const }));

/** Curated cities first (in their original order), then open-data cities alphabetically. */
export const cityIndex: CityIndexEntry[] = [...curated, ...open.sort((a, b) => a.city.localeCompare(b.city))];

export const curatedCount = cityIndex.filter((c) => c.tier === "curated").length;
export const openCount = cityIndex.length - curatedCount;

export const REGIONS = ["Europe", "Asia", "Americas", "Middle East", "Africa", "Oceania"] as const;

const indexBySlug = new Map(cityIndex.map((c) => [c.slug, c]));

export const isKnownCity = (slug: string) => indexBySlug.has(slug);
export const getCityEntry = (slug: string) => indexBySlug.get(slug);

/** Loads a city's full data. Curated cities are bundled; open-data cities are fetched as a separate chunk. */
export async function loadDestination(slug: string): Promise<Destination | undefined> {
  const hit = getDestinationBySlug(slug);
  if (hit) return hit;
  const loader = openLoaders[slug];
  return loader ? loader() : undefined;
}

export const totalPlaces = cityIndex.reduce((n, c) => n + c.places, 0);
