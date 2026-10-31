import type { Coords } from "../types";

const EARTH_RADIUS_KM = 6371.0088;
const rad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance between two points in kilometres. */
export function haversineKm(a: Coords, b: Coords): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function centroid(points: Coords[]): Coords | undefined {
  if (points.length === 0) return undefined;
  const lat = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const lng = points.reduce((s, p) => s + p.lng, 0) / points.length;
  return { lat, lng };
}

export type TravelMode = "walk" | "transit" | "taxi";

export interface Leg {
  mode: TravelMode;
  minutes: number;
  /** Straight-line distance in km. */
  km: number;
  /** True when one end had no verified coordinates and a default was used. */
  approximate: boolean;
}

/** Streets are longer than the crow flies. */
const ROUTE_FACTOR = 1.3;

/**
 * Turns a straight-line distance into a mode and a time estimate.
 *  - walk: 4.8 km/h (3.2 km/h with limited mobility), used while it stays under 20 min (8 min limited)
 *  - transit: 8 min wait/access + 22 km/h
 *  - taxi: 5 min + 35 km/h (25 km/h with limited mobility, who also take taxis instead of long walks)
 */
export function travelLeg(km: number, mobility: "standard" | "limited" = "standard", approximate = false): Leg {
  const routeKm = km * ROUTE_FACTOR;
  const walkSpeed = mobility === "limited" ? 3.2 : 4.8;
  const walkMinutes = (routeKm / walkSpeed) * 60;
  const walkLimit = mobility === "limited" ? 8 : 20;
  if (walkMinutes <= walkLimit) {
    return { mode: "walk", minutes: Math.max(2, Math.round(walkMinutes)), km, approximate };
  }
  if (mobility === "limited" || km > 12) {
    const speed = mobility === "limited" ? 25 : 35;
    return { mode: "taxi", minutes: Math.round(5 + (routeKm / speed) * 60), km, approximate };
  }
  return { mode: "transit", minutes: Math.round(8 + (routeKm / 22) * 60), km, approximate };
}

/** Default hop when neither end can be located: a short local transfer. */
export function defaultLeg(): Leg {
  return { mode: "transit", minutes: 15, km: 0, approximate: true };
}

const MODE_WORD: Record<TravelMode, string> = { walk: "walk", transit: "by transit", taxi: "by taxi" };

export function legNote(leg: Leg, from?: string): string {
  const dist = leg.km > 0 ? ` (~${leg.km < 10 ? leg.km.toFixed(1) : Math.round(leg.km)} km)` : "";
  const origin = from ? ` from ${from}` : "";
  const approx = leg.approximate ? "about " : "";
  return leg.mode === "walk"
    ? `${approx}${leg.minutes} min walk${dist}${origin}`
    : `${approx}${leg.minutes} min ${MODE_WORD[leg.mode]}${dist}${origin}`;
}
