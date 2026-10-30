/** Lookups over a Destination, shared by the scenario builder and the checks. */
import type { Coords, Destination, Verifiable } from "../../lib/types";
import type { StopCategory } from "../../lib/itinerary-engine";
import { windowsFor } from "../../lib/engine/time";
import { haversineKm } from "../../lib/engine/geo";

export type AnyRec = Verifiable & { id: string; name: string; interestTags?: string[]; priority?: string; cuisine?: string };

export function pools(d: Destination): Record<StopCategory, AnyRec[]> {
  return {
    landmark: d.landmarks as AnyRec[],
    restaurant: d.restaurants as AnyRec[],
    cafe: d.cafes as AnyRec[],
    experience: d.experiences as AnyRec[],
    shopping: d.shopping as AnyRec[],
    nightlife: d.nightlife as AnyRec[],
    dayTrip: d.dayTrips as AnyRec[],
  };
}

export function recordFor(d: Destination, category: StopCategory | undefined, id: string | undefined): AnyRec | undefined {
  if (!category || !id) return undefined;
  return pools(d)[category].find((r) => r.id === id);
}

/** The picker's options, in the exact order and with the same de-duplication as PlannerForm. */
export function placeOptions(d: Destination): { id: string; label: string }[] {
  return [
    ...d.landmarks,
    ...d.restaurants,
    ...d.cafes,
    ...d.experiences,
    ...d.nightlife,
    ...d.dayTrips,
  ]
    .map((p) => ({ id: p.id, label: p.name }))
    .filter((o, i, all) => all.findIndex((x) => x.label === o.label) === i);
}

/** Weekday on which the most records are closed all day (0 = Sunday), and how many. */
export function busiestClosedWeekday(d: Destination): { weekday: number; closed: number } {
  const all = Object.values(pools(d)).flat();
  let best = { weekday: 1, closed: -1 };
  for (let w = 0; w < 7; w++) {
    const closed = all.filter((r) => windowsFor(r, w)?.length === 0).length;
    if (closed > best.closed) best = { weekday: w, closed };
  }
  return best;
}

/** Median of every located landmark/restaurant/cafe: robust to a few far-away day-trip points. */
export function cityCentre(d: Destination): Coords | undefined {
  const pts = [...d.landmarks, ...d.restaurants, ...d.cafes, ...d.neighborhoods].map((p) => p.coords).filter(Boolean) as Coords[];
  if (!pts.length) return undefined;
  const med = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
  return { lat: med(pts.map((p) => p.lat)), lng: med(pts.map((p) => p.lng)) };
}

export const km = (a: Coords, b: Coords) => haversineKm(a, b);
