import type { Destination, DestinationSource } from "../types";
import { buildDestination, type GeneratedCity } from "./merge";
import { cityMeta } from "./city-meta";

import { tokyo } from "./tokyo";
import { paris } from "./paris";
import { london } from "./london";
import { dubai } from "./dubai";
import { singapore } from "./singapore";
import { bangkok } from "./bangkok";
import { rome } from "./rome";
import { barcelona } from "./barcelona";
import { newYorkCity } from "./new-york-city";
import { istanbul } from "./istanbul";
import { seoul } from "./seoul";
import { amsterdam } from "./amsterdam";
import { copenhagen } from "./copenhagen";
import { hongKong } from "./hong-kong";
import { sydney } from "./sydney";
import { zurich } from "./zurich";
import { losAngeles } from "./los-angeles";
import { kualaLumpur } from "./kuala-lumpur";
import { vienna } from "./vienna";
import { lisbon } from "./lisbon";

import tokyoGenerated from "./generated/tokyo.json";
import parisGenerated from "./generated/paris.json";
import londonGenerated from "./generated/london.json";
import dubaiGenerated from "./generated/dubai.json";
import singaporeGenerated from "./generated/singapore.json";
import bangkokGenerated from "./generated/bangkok.json";
import romeGenerated from "./generated/rome.json";
import barcelonaGenerated from "./generated/barcelona.json";
import newYorkCityGenerated from "./generated/new-york-city.json";
import istanbulGenerated from "./generated/istanbul.json";
import seoulGenerated from "./generated/seoul.json";
import amsterdamGenerated from "./generated/amsterdam.json";
import copenhagenGenerated from "./generated/copenhagen.json";
import hongKongGenerated from "./generated/hong-kong.json";
import sydneyGenerated from "./generated/sydney.json";
import zurichGenerated from "./generated/zurich.json";
import losAngelesGenerated from "./generated/los-angeles.json";
import kualaLumpurGenerated from "./generated/kuala-lumpur.json";
import viennaGenerated from "./generated/vienna.json";
import lisbonGenerated from "./generated/lisbon.json";

/**
 * The full destination catalog. To add a new city (#21, #22, ...):
 *   1. Create lib/data/<slug>.ts implementing the `Destination` type.
 *   2. Import it above and add it to this array.
 * The UI, search, and itinerary engine all read from this single list —
 * nothing else needs to change.
 */
const sources: DestinationSource[] = [
  tokyo,
  paris,
  london,
  dubai,
  singapore,
  bangkok,
  rome,
  barcelona,
  newYorkCity,
  istanbul,
  seoul,
  amsterdam,
  copenhagen,
  hongKong,
  sydney,
  zurich,
  losAngeles,
  kualaLumpur,
  vienna,
  lisbon,
];

const generatedBySlug: Record<string, GeneratedCity> = {
  "tokyo": tokyoGenerated as unknown as GeneratedCity,
  "paris": parisGenerated as unknown as GeneratedCity,
  "london": londonGenerated as unknown as GeneratedCity,
  "dubai": dubaiGenerated as unknown as GeneratedCity,
  "singapore": singaporeGenerated as unknown as GeneratedCity,
  "bangkok": bangkokGenerated as unknown as GeneratedCity,
  "rome": romeGenerated as unknown as GeneratedCity,
  "barcelona": barcelonaGenerated as unknown as GeneratedCity,
  "new-york-city": newYorkCityGenerated as unknown as GeneratedCity,
  "istanbul": istanbulGenerated as unknown as GeneratedCity,
  "seoul": seoulGenerated as unknown as GeneratedCity,
  "amsterdam": amsterdamGenerated as unknown as GeneratedCity,
  "copenhagen": copenhagenGenerated as unknown as GeneratedCity,
  "hong-kong": hongKongGenerated as unknown as GeneratedCity,
  "sydney": sydneyGenerated as unknown as GeneratedCity,
  "zurich": zurichGenerated as unknown as GeneratedCity,
  "los-angeles": losAngelesGenerated as unknown as GeneratedCity,
  "kuala-lumpur": kualaLumpurGenerated as unknown as GeneratedCity,
  "vienna": viennaGenerated as unknown as GeneratedCity,
  "lisbon": lisbonGenerated as unknown as GeneratedCity,
};

/** Final catalog: hand-authored source + city meta + verified geo overlay. */
export const destinations: Destination[] = sources.map((source) =>
  buildDestination(source, cityMeta[source.slug], generatedBySlug[source.slug] ?? {})
);

const bySlug = new Map(destinations.map((d) => [d.slug, d]));

const normalize = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ");

/** Looks up a destination by slug, exact city name, or a known alias. */
export function getDestinationBySlug(slug: string): Destination | undefined {
  return bySlug.get(slug);
}

export function findDestination(query: string): Destination | undefined {
  const needle = normalize(query).split(",")[0].trim();
  if (!needle) return undefined;
  return destinations.find((d) => {
    const names = [d.city, d.slug.replace(/-/g, " "), ...(d.aliases || [])];
    return names.some((name) => normalize(name) === needle);
  });
}

/** Fuzzy search across city/country/tagline, for the destination picker's search box. */
export function searchDestinations(query: string): Destination[] {
  const needle = normalize(query);
  if (!needle) return destinations;
  return destinations.filter((d) => {
    const haystack = normalize(
      [d.city, d.country, d.tagline, ...(d.aliases || [])].join(" ")
    );
    return haystack.includes(needle);
  });
}
