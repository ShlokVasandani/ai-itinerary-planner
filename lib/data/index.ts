import type { Destination } from "../types";

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

/**
 * The full destination catalog. To add a new city (#21, #22, ...):
 *   1. Create lib/data/<slug>.ts implementing the `Destination` type.
 *   2. Import it above and add it to this array.
 * The UI, search, and itinerary engine all read from this single list —
 * nothing else needs to change.
 */
export const destinations: Destination[] = [
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
