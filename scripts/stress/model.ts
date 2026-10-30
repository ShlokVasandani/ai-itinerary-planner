/**
 * Shared model for the stress test: the inputs a traveller can set, how they map onto the engine
 * (mirroring PlannerClient's toInput, seed included), and a seeded random source so every run is identical.
 */
import type { Destination, DietaryNeed, Interest, TravelStyle } from "../../lib/types";
import type { BudgetTier, Mobility, Pace, PlannerInput } from "../../lib/itinerary-engine";

export interface StressInput {
  slug: string;
  /** Both set, or both empty (then `duration` applies). */
  start: string;
  end: string;
  duration: number;
  adults: number;
  children: number;
  pace: Pace;
  budget: BudgetTier;
  mobility: Mobility;
  travelStyle: TravelStyle;
  interests: Interest[];
  dietary: DietaryNeed[];
  /** Record ids. The browser is driven with the matching place names. */
  mustInclude: string[];
  avoid: string[];
  arrivalTime: string;
  departureTime: string;
}

/** The planner's own defaults (components/PlannerClient.tsx DEFAULTS). */
export const BASE: Omit<StressInput, "slug"> = {
  start: "",
  end: "",
  duration: 5,
  adults: 2,
  children: 0,
  pace: "balanced",
  budget: "mid-range",
  mobility: "standard",
  travelStyle: "first-time",
  interests: ["food", "history", "photography"],
  dietary: [],
  mustInclude: [],
  avoid: [],
  arrivalTime: "",
  departureTime: "",
};

export const with_ = (slug: string, patch: Partial<StressInput>): StressInput => ({ ...BASE, slug, ...patch });

/** Same mapping as PlannerClient.toInput, with the planner's fixed seed. */
export function toEngineInput(f: StressInput, destination: Destination): PlannerInput {
  const dated = !!(f.start && f.end && f.end >= f.start);
  return {
    destination,
    duration: f.duration,
    startDate: f.start || undefined,
    endDate: dated ? f.end : undefined,
    budget: f.budget,
    travelStyle: f.travelStyle,
    interests: f.interests,
    pace: f.pace,
    groupSize: f.adults + f.children,
    hasKids: f.children > 0,
    mobility: f.mobility,
    dietary: f.dietary,
    mustInclude: f.mustInclude,
    avoid: f.avoid,
    arrivalFlightTime: f.arrivalTime || undefined,
    departureFlightTime: f.departureTime || undefined,
    seed: "sekai",
  };
}

/** Seeded PRNG (xmur3 string hash into mulberry32). */
export function rng(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = (Math.imul(h ^ (h >>> 16), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (lo: number, hi: number) => lo + Math.floor(next() * (hi - lo + 1)),
    pick: <T>(xs: readonly T[]): T => xs[Math.floor(next() * xs.length)],
    sample: <T>(xs: readonly T[], n: number): T[] => {
      const pool = [...xs];
      const out: T[] = [];
      while (out.length < n && pool.length) out.push(pool.splice(Math.floor(next() * pool.length), 1)[0]);
      return out;
    },
  };
}

export interface Failure {
  /** Dotted check id, e.g. "price.day-sum". Failures are grouped by this. */
  check: string;
  detail: string;
}

export interface PlanResult {
  scenario: string;
  group: string;
  label: string;
  input: StressInput;
  failures: Failure[];
  notes: string[];
  ms: number;
}

/** Findings that are correct behaviour worth recording, not defects: they go to notes, not to the failure count. */
export const INFO_CHECKS = new Set(["must.missing-with-warning", "prop.shuffle-noop"]);

export interface CityResult {
  slug: string;
  city: string;
  plans: PlanResult[];
  ms: number;
}

export interface TileResult {
  slug: string;
  city: string;
  tilesLoaded: number;
  tileRequests: number;
  attributionPx: number;
  failures: Failure[];
  screenshot?: string;
}
