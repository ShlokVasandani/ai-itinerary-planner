import type { CityMeta, Coords, Destination, DestinationSource, Verifiable } from "../types";

/**
 * Shape of lib/data/generated/<slug>.json, written by scripts/parse-costs.ts
 * and scripts/enrich-geo.ts. Keys of `places` are record ids (landmark,
 * restaurant, cafe, experience, shopping, nightlife and day-trip ids).
 */
export interface GeneratedCity {
  bbox?: [number, number, number, number];
  places?: Record<string, Partial<Verifiable>>;
  neighborhoods?: Record<string, { coords?: Coords; radiusKm?: number }>;
}

/** Google Maps search URL built from the venue name and city (not scraped). */
export function buildMapsUrl(name: string, city: string): string {
  const query = encodeURIComponent(`${name}, ${city}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function withOverlay<T extends { id: string; name: string }>(
  items: T[],
  overlay: GeneratedCity["places"],
  city: string
): T[] {
  return items.map((item) => ({
    ...item,
    ...(overlay?.[item.id] ?? {}),
    mapsUrl: buildMapsUrl(item.name, city),
  }));
}

/** Combines a city's hand-authored source with its meta and verified geo overlay. */
export function buildDestination(
  source: DestinationSource,
  meta: CityMeta,
  generated: GeneratedCity
): Destination {
  const places = generated.places;
  const city = source.city;
  return {
    ...source,
    ...meta,
    bbox: generated.bbox ?? source.bbox,
    neighborhoods: source.neighborhoods.map((n) => ({ ...n, ...(generated.neighborhoods?.[n.id] ?? {}) })),
    landmarks: withOverlay(source.landmarks, places, city),
    restaurants: withOverlay(source.restaurants, places, city),
    cafes: withOverlay(source.cafes, places, city),
    experiences: withOverlay(source.experiences, places, city),
    shopping: withOverlay(source.shopping, places, city),
    nightlife: withOverlay(source.nightlife, places, city),
    dayTrips: withOverlay(source.dayTrips, places, city),
  };
}
