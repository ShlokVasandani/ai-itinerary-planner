// ============================================================================
// Itinerary engine v2
// ----------------------------------------------------------------------------
// Deterministic and pure: the same input (including `seed`) always produces the
// same itinerary, and nothing here reads the clock, the network or Math.random.
//
//  * any trip length from 1 to 14 days, plus real start/end dates
//  * days are clustered around one area by coordinates, ordered nearest-first
//  * opening hours and closed days are respected for the actual date
//  * pace / group / kids / mobility / dietary / mustInclude / avoid inputs
//  * per-person cost ranges and a budget-fit status
//  * lighter arrival day, departure day that ends 3 h before a flight
//  * regenerateDay() and swapStop() for editing a generated plan
// ============================================================================

import type {
  Coords,
  DayTrip,
  Destination,
  DietaryNeed,
  Experience,
  Interest,
  Neighborhood,
  NightlifeSpot,
  Place,
  Priority,
  Restaurant,
  Cafe,
  SeasonRating,
  ShoppingSpot,
  TravelStyle,
  Verifiable,
  BookingRequirement,
} from "./types";
import { parseCost } from "./cost-text";
import { centroid, defaultLeg, haversineKm, legNote, travelLeg, type Leg } from "./engine/geo";
import { closedDaysLabel } from "./engine/days";
import { combinedDietFit, dietNote, dietRank, type DietFit } from "./engine/dietary";
import { seededRandom } from "./engine/rng";
import {
  addDays,
  diffDays,
  durationLabel,
  fitOpening,
  fromMin,
  isClosedAllDay,
  isIsoDate,
  toMin,
  weekdayOf,
  windowsFor,
} from "./engine/time";

export { haversineKm } from "./engine/geo";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export const MIN_TRIP_DAYS = 1;
export const MAX_TRIP_DAYS = 14;
/** The classic presets from the original planner; any length 1–14 is accepted. */
export const PRESET_DURATIONS = [3, 5, 7] as const;
/** Kept for backwards compatibility: any whole number 1–14. */
export type TripDuration = number;

export type Pace = "relaxed" | "balanced" | "packed";
export type Mobility = "standard" | "limited";
export type BudgetTier = "budget" | "mid-range" | "luxury";

export interface PlannerInput {
  destination: Destination;
  /** Number of days (1–14). Ignored when both startDate and endDate are given. */
  duration?: number;
  /** ISO date YYYY-MM-DD. Enables opening-hours and closed-day checks. */
  startDate?: string;
  endDate?: string;
  budget: BudgetTier;
  travelStyle: TravelStyle;
  interests: Interest[];
  pace?: Pace;
  groupSize?: number;
  hasKids?: boolean;
  mobility?: Mobility;
  dietary?: DietaryNeed[];
  /** Record ids (landmark, restaurant, cafe, experience, shopping, nightlife, day trip) that must appear. */
  mustInclude?: string[];
  /** Record ids that must not appear. */
  avoid?: string[];
  /** "HH:MM" local landing time on day 1. The first day starts 2.5 h later. */
  arrivalFlightTime?: string;
  /** "HH:MM" local departure time on the last day. The day ends 3 h before it. */
  departureFlightTime?: string;
  /** Any string/number. Same input + same seed = same itinerary. */
  seed?: string | number;
}

export type StopKind =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "coffee"
  | "landmark"
  | "experience"
  | "shopping"
  | "nightlife"
  | "transit"
  | "day-trip"
  | "free-time";

export type StopCategory = "landmark" | "restaurant" | "cafe" | "experience" | "shopping" | "nightlife" | "dayTrip";

export interface StopCost {
  /** Per person, in `currency`. */
  min: number;
  max: number;
  likely: number;
  currency: string;
  /** False when the data holds no price for this stop (counted as 0 and flagged). */
  known: boolean;
}

export interface TimelineStop {
  time: string;
  endTime?: string;
  kind: StopKind;
  name: string;
  neighborhood: string;
  description: string;
  whyGo?: string;
  priority?: Priority;
  approxCost?: string;
  durationLabel: string;
  transportNote?: string;
  reservationNote?: string;

  /** Id of the underlying record, when the stop is backed by one. */
  refId?: string;
  category?: StopCategory;
  coords?: Coords;
  /** True when `coords` fell back to the neighborhood centre. */
  coordsApprox?: boolean;
  /** Travel from the previous stop. */
  transport?: { mode: Leg["mode"]; minutes: number; km: number; approximate: boolean };
  cost?: StopCost;
  officialUrl?: string;
  mapsUrl?: string;
  bookingUrl?: string;
  bookingRequired?: BookingRequirement;
  /** Opening hours for the date, e.g. "Open 09:00–18:00" or "Hours not verified". */
  hoursNote?: string;
  /** Extra notes (dietary fit, accessibility, closed-day warnings). */
  notes?: string[];
}

export interface CostRange {
  low: number;
  likely: number;
  high: number;
  currency: string;
  /** Stops that had no price in the data and are counted as zero. */
  unknownItems: number;
}

export type BudgetFitStatus = "under" | "on-target" | "over";

export interface BudgetFit {
  status: BudgetFitStatus;
  tier: BudgetTier;
  /** The tier's published average daily budget, parsed to numbers. */
  tierDailyMin?: number;
  tierDailyMax?: number;
  tierCurrency?: string;
  /** Estimated planned spend per person per day divided by the tier midpoint. */
  ratio?: number;
  /** False when the tier text could not be parsed or is in another currency. */
  comparable: boolean;
}

export interface ItineraryDay {
  dayNumber: number;
  title: string;
  neighborhoodFocus: string;
  stops: TimelineStop[];
  date?: string;
  /** 0 = Sunday. Present when dates are known. */
  weekday?: number;
  centre?: Coords;
  walkingAndTransitMinutes: number;
  distanceKm: number;
  cost: CostRange;
  isArrivalDay: boolean;
  isDepartureDay: boolean;
  isDayTrip: boolean;
  /** Must-include ids that were assigned to this day. */
  mustIds: string[];
  notes: string[];
}

export interface GeneratedItinerary {
  destination: string;
  duration: TripDuration;
  days: ItineraryDay[];
  unusedHighlights: string[];
  startDate?: string;
  endDate?: string;
  currency: string;
  cost: CostRange;
  /** Cost for the whole travelling party (groupSize × per person likely). */
  groupLikely: number;
  budgetFit: BudgetFit;
  season?: SeasonRating & { month: number };
  /** Problems the engine could not resolve (e.g. a must-include that is closed on every date). */
  warnings: string[];
  /** Normalised input used to build this plan; required by regenerateDay / swapStop. */
  input: ResolvedInput;
}

export interface ResolvedInput extends Required<Pick<PlannerInput, "destination" | "budget" | "travelStyle">> {
  interests: Interest[];
  duration: number;
  startDate?: string;
  endDate?: string;
  pace: Pace;
  groupSize: number;
  hasKids: boolean;
  mobility: Mobility;
  dietary: DietaryNeed[];
  mustInclude: string[];
  avoid: string[];
  arrivalFlightTime?: string;
  departureFlightTime?: string;
  seed: string;
}

export interface SwapCandidate {
  id: string;
  name: string;
  category: StopCategory;
  neighborhood: string;
  /** Distance to the previous stop of the day (km), when both are located. */
  distanceKm?: number;
  priority?: Priority;
  reason: string;
}

export interface SwapResult {
  itinerary: GeneratedItinerary;
  candidates: SwapCandidate[];
  /** Set when an alternativeId was supplied but could not be applied. */
  error?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PRIORITY_WEIGHT: Record<Priority, number> = {
  "must-see": 4,
  "highly-recommended": 3,
  "interest-specific": 2,
  "if-you-have-time": 1,
};

const PRIORITY_TEXT: Record<Priority, string> = {
  "must-see": "Must-see",
  "highly-recommended": "Highly recommended",
  "interest-specific": "Interest pick",
  "if-you-have-time": "If you have time",
};

export function priorityLabel(p: Priority): string {
  return PRIORITY_TEXT[p];
}

const STYLE_INTEREST_BOOST: Partial<Record<TravelStyle, Interest[]>> = {
  foodie: ["food", "cafes"],
  luxury: ["luxury", "shopping"],
  budget: [],
  couple: ["photography", "culture"],
  friends: ["nightlife", "adventure"],
  family: ["nature", "culture"],
  relaxed: ["cafes", "nature"],
  adventure: ["adventure", "nature"],
  shopping: ["shopping"],
  "culture-history": ["history", "culture", "art"],
  nightlife: ["nightlife"],
  "first-time": ["history", "culture", "photography"],
};

interface PaceProfile {
  /** Maximum sightseeing stops (landmarks + experiences) per full day. */
  maxStops: number;
  /** Maximum summed visit minutes per day. */
  maxMinutes: number;
  /** Cluster radius in km. */
  radiusKm: number;
  startMin: number;
}

/** The pace caps are exported so tests and the UI can show them. */
export const PACE_PROFILES: Record<Pace, PaceProfile> = {
  relaxed: { maxStops: 2, maxMinutes: 300, radiusKm: 2.5, startMin: toMin("09:30") },
  balanced: { maxStops: 3, maxMinutes: 420, radiusKm: 3.5, startMin: toMin("08:45") },
  packed: { maxStops: 4, maxMinutes: 540, radiusKm: 5, startMin: toMin("08:00") },
};

const LUNCH_FROM = toMin("12:00");
const COFFEE_FROM = toMin("15:00");
const DINNER_FROM = toMin("19:00");
const ARRIVAL_BUFFER_MIN = 150; // immigration, transfer, check-in
const DEPARTURE_BUFFER_MIN = 180; // "ends 3 hours before the flight"

/** Budget fit: planned spend per person per day / tier midpoint. */
export const BUDGET_UNDER_BELOW = 0.35;
export const BUDGET_OVER_ABOVE = 1.0;

// ---------------------------------------------------------------------------
// Catalog: a uniform view over every kind of record
// ---------------------------------------------------------------------------

type Rec = Place | Restaurant | Cafe | Experience | ShoppingSpot | NightlifeSpot | DayTrip;

interface Entry {
  cat: StopCategory;
  id: string;
  name: string;
  norm: string;
  neighborhood: string;
  coords?: Coords;
  coordsApprox: boolean;
  durationMin: number;
  rec: Rec;
}

interface Catalog {
  byId: Map<string, Entry>;
  landmarks: Entry[];
  restaurants: Entry[];
  cafes: Entry[];
  experiences: Entry[];
  shopping: Entry[];
  nightlife: Entry[];
  dayTrips: Entry[];
  hoods: Neighborhood[];
  cityCentre?: Coords;
}

const normName = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

function parseDurationMinutes(text: string | undefined, fallback: number): number {
  if (!text) return fallback;
  const t = text.toLowerCase();
  if (/half[- ]?day/.test(t)) return 240;
  if (/full[- ]?day/.test(t)) return 480;
  const hr = t.match(/(\d+(?:\.\d+)?)(?:\s?[–-]\s?\d+(?:\.\d+)?)?\s*(?:hr|hour|h\b)/);
  if (hr) return Math.round(parseFloat(hr[1]) * 60);
  const mn = t.match(/(\d+)\s*(?:min)/);
  if (mn) return parseInt(mn[1], 10);
  return fallback;
}

function parseTravelMinutes(text: string | undefined, fallback = 90): number {
  return parseDurationMinutes(text, fallback);
}

function hoodCoords(hoods: Neighborhood[], name: string | undefined): Coords | undefined {
  if (!name) return undefined;
  const n = normName(name);
  const hit = hoods.find((h) => normName(h.name) === n) ?? hoods.find((h) => normName(h.name).includes(n) || n.includes(normName(h.name)));
  return hit?.coords;
}

const catalogCache = new WeakMap<Destination, Catalog>();

function buildCatalog(d: Destination): Catalog {
  const cached = catalogCache.get(d);
  if (cached) return cached;
  const hoods = d.neighborhoods;
  const make = (cat: StopCategory, rec: Rec & { id: string; name: string }, durationMin: number): Entry => {
    const own = (rec as Verifiable).coords;
    const neighborhood = (rec as { neighborhood?: string }).neighborhood ?? "";
    const fallback = own ? undefined : hoodCoords(hoods, neighborhood);
    return {
      cat,
      id: rec.id,
      name: rec.name,
      norm: normName(rec.name),
      neighborhood,
      coords: own ?? fallback,
      coordsApprox: !own && !!fallback,
      durationMin,
      rec,
    };
  };
  const landmarks = d.landmarks.map((r) => make("landmark", r, r.suggestedDurationMin));
  const restaurants = d.restaurants.map((r) => make("restaurant", r, r.suggestedDurationMin || 75));
  const cafes = d.cafes.map((r) => make("cafe", r, 45));
  const experiences = d.experiences.map((r) => make("experience", r, parseDurationMinutes(r.duration, 120)));
  const shopping = d.shopping.map((r) => make("shopping", r, 75));
  const nightlife = d.nightlife.map((r) => make("nightlife", r, 120));
  const dayTrips = d.dayTrips.map((r) =>
    make("dayTrip", r, r.suggestedDuration === "half-day" ? 240 : 480)
  );
  const all = [...landmarks, ...restaurants, ...cafes, ...experiences, ...shopping, ...nightlife, ...dayTrips];
  const byId = new Map(all.map((e) => [e.id, e]));
  const located = hoods.map((h) => h.coords).filter(Boolean) as Coords[];
  const cityCentre = centroid(located);
  const result: Catalog = { byId, landmarks, restaurants, cafes, experiences, shopping, nightlife, dayTrips, hoods, cityCentre };
  catalogCache.set(d, result);
  return result;
}

// ---------------------------------------------------------------------------
// Input resolution
// ---------------------------------------------------------------------------

export function resolveInput(input: PlannerInput): ResolvedInput {
  let duration = input.duration ?? 3;
  let startDate = isIsoDate(input.startDate) ? input.startDate : undefined;
  let endDate = isIsoDate(input.endDate) ? input.endDate : undefined;
  if (startDate && endDate) {
    const span = diffDays(startDate, endDate) + 1;
    if (span >= 1) duration = span;
    else endDate = undefined;
  }
  duration = Math.min(MAX_TRIP_DAYS, Math.max(MIN_TRIP_DAYS, Math.round(duration)));
  if (startDate) endDate = addDays(startDate, duration - 1);
  return {
    destination: input.destination,
    budget: input.budget,
    travelStyle: input.travelStyle,
    interests: input.interests ?? [],
    duration,
    startDate,
    endDate,
    pace: input.pace ?? "balanced",
    groupSize: Math.max(1, Math.round(input.groupSize ?? 1)),
    hasKids: !!input.hasKids,
    mobility: input.mobility ?? "standard",
    dietary: [...new Set(input.dietary ?? [])],
    mustInclude: [...new Set(input.mustInclude ?? [])],
    avoid: [...new Set(input.avoid ?? [])],
    arrivalFlightTime: /^\d{1,2}:\d{2}$/.test(input.arrivalFlightTime ?? "") ? input.arrivalFlightTime : undefined,
    departureFlightTime: /^\d{1,2}:\d{2}$/.test(input.departureFlightTime ?? "") ? input.departureFlightTime : undefined,
    seed: String(input.seed ?? "sekai"),
  };
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function scoreEntry(e: Entry, inp: ResolvedInput): number {
  const rec = e.rec as { priority?: Priority; interestTags?: Interest[] };
  let s = PRIORITY_WEIGHT[rec.priority ?? "if-you-have-time"] * 10;
  const boosted = new Set<Interest>([...inp.interests, ...(STYLE_INTEREST_BOOST[inp.travelStyle] ?? [])]);
  for (const tag of rec.interestTags ?? []) if (boosted.has(tag)) s += 6;
  return s;
}

function budgetLevels(b: BudgetTier): string[] {
  if (b === "budget") return ["$", "$$"];
  if (b === "luxury") return ["$$", "$$$", "$$$$"];
  return ["$", "$$", "$$$"];
}

const MOBILITY_HARD = /\b(hik(e|ing)|trail|climb|trek|steep|summit|scrambl)/i;
function isStrenuous(e: Entry): boolean {
  const rec = e.rec as { name: string; description?: string };
  return MOBILITY_HARD.test(rec.name) || MOBILITY_HARD.test(rec.description ?? "");
}

// ---------------------------------------------------------------------------
// Day context
// ---------------------------------------------------------------------------

interface DayCtx {
  index: number;
  dayNumber: number;
  date?: string;
  weekday?: number;
  isFirst: boolean;
  isLast: boolean;
  startMin: number;
  /** Hard end (e.g. 3 h before a flight) in minutes, if any. */
  endLimit?: number;
  maxStops: number;
  maxMinutes: number;
  radiusKm: number;
}

function dayContext(inp: ResolvedInput, index: number): DayCtx {
  const profile = PACE_PROFILES[inp.pace];
  const isFirst = index === 0;
  const isLast = index === inp.duration - 1;
  let maxStops = profile.maxStops;
  let maxMinutes = profile.maxMinutes;
  let radiusKm = profile.radiusKm;
  let startMin = profile.startMin;
  if (inp.hasKids) {
    maxStops = Math.max(1, maxStops - 1);
    maxMinutes = Math.round(maxMinutes * 0.85);
  }
  if (inp.mobility === "limited") {
    maxStops = Math.max(1, maxStops - 1);
    maxMinutes = Math.round(maxMinutes * 0.85);
    radiusKm *= 0.6;
  }
  let endLimit: number | undefined;
  if (isFirst) {
    maxStops = Math.min(maxStops, inp.pace === "relaxed" ? 1 : 2);
    maxMinutes = Math.min(maxMinutes, 240);
    startMin = inp.arrivalFlightTime ? toMin(inp.arrivalFlightTime) + ARRIVAL_BUFFER_MIN : toMin("11:30");
  }
  if (isLast) {
    maxStops = Math.min(maxStops, 2);
    maxMinutes = Math.min(maxMinutes, 300);
    if (inp.departureFlightTime) endLimit = toMin(inp.departureFlightTime) - DEPARTURE_BUFFER_MIN;
  }
  const date = inp.startDate ? addDays(inp.startDate, index) : undefined;
  return {
    index,
    dayNumber: index + 1,
    date,
    weekday: date ? weekdayOf(date) : undefined,
    isFirst,
    isLast,
    startMin,
    endLimit,
    maxStops,
    maxMinutes,
    radiusKm,
  };
}

// ---------------------------------------------------------------------------
// Costs
// ---------------------------------------------------------------------------

function entryCost(e: Entry, currency: string): StopCost {
  const rec = e.rec as Verifiable;
  const cur = rec.costCurrency ?? currency;
  if (rec.costMin === undefined && rec.costMax === undefined) {
    return { min: 0, max: 0, likely: 0, currency: cur, known: false };
  }
  const min = rec.costMin ?? rec.costMax ?? 0;
  // An open-ended "+" price has no max: assume up to 50% more for the high case.
  const max = rec.costMax ?? Math.round(min * 1.5);
  return { min, max, likely: Math.round((min + max) / 2), currency: cur, known: true };
}

export function sumCosts(stops: { cost?: StopCost }[], currency: string): CostRange {
  let low = 0;
  let likely = 0;
  let high = 0;
  let unknownItems = 0;
  for (const s of stops) {
    if (!s.cost) continue;
    if (!s.cost.known) {
      unknownItems++;
      continue;
    }
    low += s.cost.min;
    likely += s.cost.likely;
    high += s.cost.max;
  }
  return { low, likely, high, currency, unknownItems };
}

function addRanges(ranges: CostRange[], currency: string): CostRange {
  return ranges.reduce<CostRange>(
    (acc, r) => ({
      low: acc.low + r.low,
      likely: acc.likely + r.likely,
      high: acc.high + r.high,
      currency,
      unknownItems: acc.unknownItems + r.unknownItems,
    }),
    { low: 0, likely: 0, high: 0, currency, unknownItems: 0 }
  );
}

const TIER_KEY: Record<BudgetTier, "budget" | "midRange" | "luxury"> = {
  budget: "budget",
  "mid-range": "midRange",
  luxury: "luxury",
};

export function computeBudgetFit(d: Destination, tier: BudgetTier, cost: CostRange, days: number): BudgetFit {
  const text = d.quickFacts.averageDailyBudget[TIER_KEY[tier]];
  const parsed = parseCost(text, d.currency);
  const comparable = parsed.min !== undefined && parsed.currency === d.currency;
  if (!comparable || parsed.min === undefined) {
    return { status: "on-target", tier, comparable: false, tierCurrency: parsed.currency };
  }
  const min = parsed.min;
  const max = parsed.max; // undefined for open-ended "€450+"
  const mid = max !== undefined ? (min + max) / 2 : min * 1.25;
  const perDay = cost.likely / Math.max(1, days);
  const ratio = perDay / mid;
  const status: BudgetFitStatus = ratio < BUDGET_UNDER_BELOW ? "under" : ratio > BUDGET_OVER_ABOVE ? "over" : "on-target";
  return { status, tier, tierDailyMin: min, tierDailyMax: max, tierCurrency: parsed.currency, ratio, comparable: true };
}

// ---------------------------------------------------------------------------
// Day builder
// ---------------------------------------------------------------------------

interface Used {
  ids: Set<string>;
  names: Set<string>;
  /** Normalised names reserved for a must-include id, so a same-named record cannot take the slot. */
  reserved?: Map<string, string>;
}

interface Env {
  inp: ResolvedInput;
  cat: Catalog;
  avoid: Set<string>;
  rng: () => number;
}

function isAvailable(env: Env, used: Used, e: Entry): boolean {
  if (env.avoid.has(e.id) || used.ids.has(e.id) || used.names.has(e.norm)) return false;
  const holder = used.reserved?.get(e.norm);
  return holder === undefined || holder === e.id;
}

function markUsed(used: Used, e: Entry) {
  used.ids.add(e.id);
  used.names.add(e.norm);
}

function distanceKm(a: Entry | undefined, b: Entry | undefined): number | undefined {
  if (!a?.coords || !b?.coords) return undefined;
  return haversineKm(a.coords, b.coords);
}

function legBetween(env: Env, prev: Entry | undefined, next: Entry): Leg | undefined {
  if (!prev) return undefined;
  const km = distanceKm(prev, next);
  const approximate = !!prev.coordsApprox || next.coordsApprox;
  if (km === undefined) return defaultLeg();
  if (prev.id === next.id) return undefined;
  // Two stops that share the same fallback neighborhood centre are effectively in the same place.
  return travelLeg(km, env.inp.mobility, approximate);
}

const KIND_FOR_CAT: Record<StopCategory, StopKind> = {
  landmark: "landmark",
  restaurant: "lunch",
  cafe: "coffee",
  experience: "experience",
  shopping: "shopping",
  nightlife: "nightlife",
  dayTrip: "day-trip",
};

interface BuildState {
  clock: number;
  prev?: Entry;
  stops: TimelineStop[];
  used: Used;
  /** Entries placed in this build, in order. */
  placed: Entry[];
}

function hoursNote(e: Entry, weekday: number | undefined): string | undefined {
  const rec = e.rec as Verifiable;
  const windows = windowsFor(rec, weekday);
  if (windows === null) return rec.openingHours || rec.closedDays ? undefined : "Hours not verified; check the official site";
  if (windows.length === 0) return undefined;
  const text = windows.map(([o, c]) => `${fromMin(o)}–${fromMin(c)}`).join(", ");
  return `Open ${text}`;
}

function entryToStop(
  env: Env,
  e: Entry,
  kind: StopKind,
  start: number,
  duration: number,
  leg: Leg | undefined,
  prev: Entry | undefined,
  weekday: number | undefined,
  fit?: DietFit
): TimelineStop {
  const rec = e.rec as Rec & Verifiable;
  const currency = env.inp.destination.currency;
  const notes: string[] = [];
  let description = (rec as { description: string }).description;
  if (e.cat === "restaurant") {
    const r = e.rec as Restaurant;
    if (r.signatureDishes?.length) description = `${description} Signature: ${r.signatureDishes.slice(0, 2).join(", ")}.`;
    const note = fit ? dietNote(fit, env.inp.dietary) : undefined;
    if (note) notes.push(note);
  }
  if (e.cat === "cafe") {
    const c = e.rec as Cafe;
    description = `${description} Try: ${c.specialty}.`;
  }
  if (env.inp.mobility === "limited" && isStrenuous(e)) {
    notes.push("May involve steps or an uphill walk; check step-free access before you go.");
  }
  const closed = (rec as Verifiable).closedDays;
  if (closed && closed.length > 0 && weekday === undefined) {
    notes.push(`Closed ${closedDaysLabel(closed)}; add trip dates to plan around it.`);
  }
  const reservationNote =
    (rec as { reservationNote?: string }).reservationNote ?? (rec as { bookingNote?: string }).bookingNote;
  const stop: TimelineStop = {
    time: fromMin(start),
    endTime: fromMin(start + duration),
    kind,
    name: e.name,
    neighborhood: e.neighborhood || env.inp.destination.city,
    description,
    whyGo: (rec as { whyGo?: string }).whyGo,
    priority: (rec as { priority?: Priority }).priority,
    approxCost: (rec as { approxCost?: string }).approxCost,
    durationLabel: durationLabel(duration),
    reservationNote,
    refId: e.id,
    category: e.cat,
    coords: e.coords,
    coordsApprox: e.coordsApprox || undefined,
    cost: entryCost(e, currency),
    officialUrl: rec.officialUrl,
    mapsUrl: rec.mapsUrl,
    bookingUrl: rec.bookingUrl,
    bookingRequired: rec.bookingRequired,
    hoursNote: hoursNote(e, weekday),
    notes: notes.length ? notes : undefined,
  };
  if (leg) {
    stop.transport = { mode: leg.mode, minutes: leg.minutes, km: Number(leg.km.toFixed(2)), approximate: leg.approximate };
    stop.transportNote = legNote(leg, prev?.name);
  }
  return stop;
}

/** Tries to place `e` next in the day; returns false (state untouched) if it does not fit. */
function place(
  env: Env,
  ctx: DayCtx,
  st: BuildState,
  e: Entry,
  kind: StopKind,
  opts: { minStart?: number; maxWait?: number; duration?: number; fit?: DietFit } = {}
): boolean {
  const leg = legBetween(env, st.prev, e);
  const arrive = st.clock + (leg?.minutes ?? 0);
  const desired = Math.max(arrive, opts.minStart ?? 0);
  const duration = opts.duration ?? e.durationMin;
  const start = fitOpening(e.rec as Verifiable, ctx.weekday, desired, duration, opts.maxWait ?? 60);
  if (start === null) return false;
  if (ctx.endLimit !== undefined && start + duration > ctx.endLimit) return false;
  // Long unexplained gaps become explicit rest time instead of silent holes.
  if (st.prev && start - arrive >= 45 && opts.minStart !== undefined) {
    st.stops.push({
      time: fromMin(arrive),
      endTime: fromMin(start),
      kind: "free-time",
      name: "Free time to wander or rest",
      neighborhood: e.neighborhood || env.inp.destination.city,
      description: "Unscheduled time to explore nearby, rest, or linger over coffee.",
      durationLabel: durationLabel(start - arrive),
    });
  }
  st.stops.push(entryToStop(env, e, kind, start, duration, leg, st.prev, ctx.weekday, opts.fit));
  st.clock = start + duration;
  st.prev = e;
  st.placed.push(e);
  markUsed(st.used, e);
  return true;
}

function nearestNeighbourOrder(items: Entry[], first?: Entry): Entry[] {
  if (items.length <= 2) return first ? [first, ...items.filter((i) => i !== first)] : [...items];
  const remaining = [...items];
  const start = first && remaining.includes(first) ? first : remaining[0];
  const ordered: Entry[] = [start];
  remaining.splice(remaining.indexOf(start), 1);
  while (remaining.length) {
    const last = ordered[ordered.length - 1];
    let bestIdx = 0;
    let bestKm = Infinity;
    remaining.forEach((r, i) => {
      const km = distanceKm(last, r) ?? 50; // unlocated items sort after located ones
      if (km < bestKm) {
        bestKm = km;
        bestIdx = i;
      }
    });
    ordered.push(remaining.splice(bestIdx, 1)[0]);
  }
  return ordered;
}

type MealKind = "breakfast" | "lunch" | "dinner";

function mealMatches(r: Restaurant, meal: MealKind, strict: boolean): boolean {
  if (r.mealFor.includes(meal) || r.mealFor.includes("any")) return true;
  if (strict) return false;
  // Fallback: any place that is not breakfast-only can serve lunch or dinner.
  return meal !== "breakfast" && !(r.mealFor.length === 1 && r.mealFor[0] === "breakfast");
}

function rankRestaurants(
  env: Env,
  used: Used,
  meal: MealKind,
  near: Entry | Coords | undefined,
  hood: string | undefined,
  strict: boolean
): { entry: Entry; fit: DietFit; score: number }[] {
  const levels = budgetLevels(env.inp.budget);
  const out: { entry: Entry; fit: DietFit; score: number }[] = [];
  for (const e of env.cat.restaurants) {
    if (!isAvailable(env, used, e)) continue;
    const r = e.rec as Restaurant;
    if (!mealMatches(r, meal, strict)) continue;
    const fit = combinedDietFit(r, env.inp.dietary);
    if (fit === "no") continue;
    if (env.inp.hasKids && r.priceLevel === "$$$$") continue;
    let s = scoreEntry(e, env.inp);
    if (r.priceLevel && levels.includes(r.priceLevel)) s += 20;
    if (env.inp.dietary.length > 0) s += dietRank(fit) * 12;
    if (hood && e.neighborhood === hood) s += 10;
    const target = near && "lat" in near ? near : (near as Entry | undefined)?.coords;
    if (target && e.coords) s -= haversineKm(target, e.coords) * 6;
    s += env.rng() * 3;
    out.push({ entry: e, fit, score: s });
  }
  return out.sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id));
}

function placeMeal(env: Env, ctx: DayCtx, st: BuildState, meal: MealKind, forced: Entry | undefined, nearOverride?: Entry): boolean {
  const minStart =
    meal === "breakfast"
      ? undefined
      : meal === "lunch"
        ? env.inp.hasKids
          ? toMin("11:45")
          : LUNCH_FROM
        : env.inp.hasKids
          ? toMin("18:15")
          : DINNER_FROM;
  const kind: StopKind = meal;
  const near = nearOverride ?? st.prev;
  if (forced && isAvailable(env, st.used, forced)) {
    const fit = combinedDietFit(forced.rec as Restaurant, env.inp.dietary);
    if (place(env, ctx, st, forced, kind, { minStart, maxWait: 90, duration: forced.durationMin, fit })) return true;
  }
  for (const strict of [true, false]) {
    const ranked = rankRestaurants(env, st.used, meal, near, near?.neighborhood, strict).slice(0, 8);
    for (const c of ranked) {
      const duration = meal === "breakfast" ? 50 : meal === "lunch" ? 70 : 90;
      if (place(env, ctx, st, c.entry, kind, { minStart, maxWait: 60, duration, fit: c.fit })) return true;
    }
  }
  return false;
}

function placeCoffee(env: Env, ctx: DayCtx, st: BuildState, forced: Entry | undefined): boolean {
  const opts = { minStart: COFFEE_FROM, maxWait: 90, duration: 45 };
  if (forced && isAvailable(env, st.used, forced) && place(env, ctx, st, forced, "coffee", opts)) return true;
  const near = st.prev;
  const ranked = env.cat.cafes
    .filter((c) => isAvailable(env, st.used, c))
    .map((c) => {
      let s = scoreEntry(c, env.inp);
      const km = distanceKm(near, c);
      if (km !== undefined) s -= km * 6;
      if (near && c.neighborhood === near.neighborhood) s += 10;
      return { c, s: s + env.rng() * 3 };
    })
    .sort((a, b) => b.s - a.s || a.c.id.localeCompare(b.c.id))
    .slice(0, 6);
  for (const { c } of ranked) {
    if (place(env, ctx, st, c, "coffee", opts)) return true;
  }
  return false;
}

function pickLandmarks(env: Env, ctx: DayCtx, used: Used, forced: Entry[]): Entry[] {
  const open = (e: Entry) => !isClosedAllDay(e.rec as Verifiable, ctx.weekday);
  const pool = env.cat.landmarks.filter(
    (e) => isAvailable(env, used, e) && open(e) && (env.inp.mobility !== "limited" || !isStrenuous(e) || forced.includes(e))
  );
  const chosen: Entry[] = [];
  let minutes = 0;
  const take = (e: Entry) => {
    chosen.push(e);
    minutes += e.durationMin;
  };
  for (const f of forced) {
    if (chosen.length >= ctx.maxStops) break;
    if (chosen.includes(f)) continue;
    take(f);
  }
  const scored = pool
    .filter((e) => !chosen.includes(e))
    .map((e) => ({ e, s: scoreEntry(e, env.inp) + env.rng() * 3 }))
    .sort((a, b) => b.s - a.s || a.e.id.localeCompare(b.e.id));
  if (chosen.length === 0 && scored[0]) take(scored.shift()!.e);
  const anchor = chosen[0];
  if (!anchor) return chosen;
  for (const radius of [ctx.radiusKm, ctx.radiusKm * 2]) {
    if (chosen.length >= ctx.maxStops) break;
    const near = scored
      .filter(({ e }) => !chosen.includes(e))
      .map((c) => {
        const refs = chosen.map((p) => distanceKm(p, c.e)).filter((x): x is number => x !== undefined);
        const km = refs.length ? Math.min(...refs) : anchor.neighborhood === c.e.neighborhood ? 0 : Infinity;
        return { ...c, km, v: c.s - km * 4 };
      })
      .filter((c) => c.km <= radius)
      .sort((a, b) => b.v - a.v || a.e.id.localeCompare(b.e.id));
    for (const c of near) {
      if (chosen.length >= ctx.maxStops) break;
      if (minutes + c.e.durationMin > ctx.maxMinutes) continue;
      take(c.e);
    }
  }
  return chosen;
}

const EVENING_HINT = /night|evening|sunset|show|cabaret|dinner|cruise|jazz|bar hop|market|lights|illuminat|rooftop|concert|opera|theatre|theater/i;

function eveningWanted(inp: ResolvedInput, ctx: DayCtx): boolean {
  if (inp.hasKids) return false;
  const nightlifeLover = inp.interests.includes("nightlife") || inp.travelStyle === "nightlife" || inp.travelStyle === "friends";
  if (ctx.isFirst && inp.pace !== "packed" && !nightlifeLover) return false;
  if (ctx.isLast && ctx.endLimit !== undefined) return false;
  if (nightlifeLover || inp.pace === "packed") return true;
  if (inp.pace === "relaxed") return false;
  return ctx.index % 2 === 1;
}

function chooseEvening(env: Env, ctx: DayCtx, used: Used, near: Entry | undefined, forced: Entry | undefined): Entry[] {
  if (forced) return [forced];
  const open = (e: Entry) => !isClosedAllDay(e.rec as Verifiable, ctx.weekday);
  const nightlifeLover =
    env.inp.interests.includes("nightlife") || env.inp.travelStyle === "nightlife" || env.inp.travelStyle === "friends";
  const candidates: { e: Entry; s: number }[] = [];
  for (const e of env.cat.nightlife) {
    if (!isAvailable(env, used, e) || !open(e)) continue;
    let s = scoreEntry(e, env.inp) + (nightlifeLover ? 15 : 0);
    const km = distanceKm(near, e);
    if (km !== undefined) s -= km * 4;
    candidates.push({ e, s: s + env.rng() * 3 });
  }
  for (const e of env.cat.experiences) {
    if (!isAvailable(env, used, e) || !open(e)) continue;
    const rec = e.rec as Experience;
    const evening = rec.interestTags.includes("nightlife") || EVENING_HINT.test(`${rec.name} ${rec.description}`);
    if (!evening) continue;
    candidates.push({ e, s: scoreEntry(e, env.inp) + 5 + env.rng() * 3 });
  }
  return candidates.sort((a, b) => b.s - a.s || a.e.id.localeCompare(b.e.id)).map((c) => c.e);
}

function chooseAfternoonExtra(env: Env, ctx: DayCtx, used: Used, forced: Entry[], centre: Coords | undefined): Entry | undefined {
  const wantsShopping = env.inp.interests.includes("shopping") || env.inp.travelStyle === "shopping" || env.inp.travelStyle === "luxury";
  const open = (e: Entry) => !isClosedAllDay(e.rec as Verifiable, ctx.weekday);
  const forcedShop = forced.find((f) => f.cat === "shopping" && isAvailable(env, used, f));
  if (forcedShop) return forcedShop;
  if (!wantsShopping) return undefined;
  return env.cat.shopping
    .filter((e) => isAvailable(env, used, e) && open(e))
    .map((e) => {
      let s = env.rng() * 3;
      if (centre && e.coords) s -= haversineKm(centre, e.coords) * 2;
      return { e, s };
    })
    .sort((a, b) => b.s - a.s || a.e.id.localeCompare(b.e.id))[0]?.e;
}

function chooseDaytimeExperience(env: Env, ctx: DayCtx, used: Used, forced: Entry[]): Entry | undefined {
  const f = forced.find((x) => x.cat === "experience" && isAvailable(env, used, x));
  if (f) return f;
  // Experiences are an optional extra on relaxed-to-balanced days only when interests match.
  const boosted = new Set<Interest>([...env.inp.interests, ...(STYLE_INTEREST_BOOST[env.inp.travelStyle] ?? [])]);
  if (env.inp.pace === "relaxed" || ctx.isFirst || ctx.isLast) return undefined;
  return env.cat.experiences
    .filter(
      (e) =>
        isAvailable(env, used, e) &&
        !isClosedAllDay(e.rec as Verifiable, ctx.weekday) &&
        !EVENING_HINT.test(`${e.name} ${(e.rec as Experience).description}`) &&
        e.durationMin <= 240 &&
        (e.rec as Experience).interestTags.some((t) => boosted.has(t))
    )
    .map((e) => ({ e, s: scoreEntry(e, env.inp) + env.rng() * 3 }))
    .sort((a, b) => b.s - a.s || a.e.id.localeCompare(b.e.id))[0]?.e;
}

const DAY_TITLES = [
  "First impressions",
  "Into the neighborhoods",
  "Culture and landmarks",
  "A different pace",
  "Local flavor day",
  "Further afield",
  "One last look",
];

function focusFor(env: Env, entries: Entry[]): { name: string; centre?: Coords } {
  const centre = centroid(entries.map((e) => e.coords).filter(Boolean) as Coords[]);
  const hoods = env.cat.hoods.filter((h) => h.coords);
  if (centre && hoods.length > 0) {
    const nearest = hoods
      .map((h) => ({ h, km: haversineKm(centre, h.coords!) }))
      .sort((a, b) => a.km - b.km)[0];
    const radius = nearest.h.radiusKm ?? 1.5;
    if (nearest.km <= Math.max(radius * 2, 2.5)) return { name: nearest.h.name, centre };
  }
  const counts = new Map<string, number>();
  for (const e of entries) if (e.neighborhood) counts.set(e.neighborhood, (counts.get(e.neighborhood) ?? 0) + 1);
  const best = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  return { name: best?.[0] ?? env.inp.destination.city, centre };
}

function finishDay(env: Env, ctx: DayCtx, st: BuildState, title: string, mustIds: string[], extra?: Partial<ItineraryDay>): ItineraryDay {
  const focus = focusFor(env, st.placed.filter((e) => e.cat === "landmark" || e.cat === "experience" || e.cat === "dayTrip"));
  const currency = env.inp.destination.currency;
  let minutes = 0;
  let km = 0;
  for (const s of st.stops) {
    if (s.transport) {
      minutes += s.transport.minutes;
      km += s.transport.km;
    }
  }
  const notes: string[] = [];
  if (ctx.isFirst) notes.push(env.inp.arrivalFlightTime ? `Lighter first day: starts about 2.5 hours after your ${env.inp.arrivalFlightTime} landing.` : "Lighter first day to settle in after arriving.");
  if (ctx.isLast && ctx.endLimit !== undefined) notes.push(`Wraps up by ${fromMin(ctx.endLimit)}, three hours before your ${env.inp.departureFlightTime} flight.`);
  else if (ctx.isLast) notes.push("Lighter last day so you can pack and travel without rushing.");
  return {
    dayNumber: ctx.dayNumber,
    title,
    neighborhoodFocus: extra?.neighborhoodFocus ?? focus.name,
    stops: st.stops,
    date: ctx.date,
    weekday: ctx.weekday,
    centre: focus.centre,
    walkingAndTransitMinutes: minutes,
    distanceKm: Number(km.toFixed(1)),
    cost: sumCosts(st.stops, currency),
    isArrivalDay: ctx.isFirst,
    isDepartureDay: ctx.isLast,
    isDayTrip: false,
    mustIds,
    notes,
    ...extra,
  };
}

function buildCityDay(env: Env, ctx: DayCtx, used: Used, forced: Entry[], titleIdx: number): ItineraryDay {
  const st: BuildState = { clock: ctx.startMin, stops: [], used, placed: [] };
  const forcedLandmarks = forced.filter((f) => f.cat === "landmark");
  // Daytime experiences and shopping count against the same pace cap as landmarks.
  // At least one landmark always stays; extras are dropped (shopping first) when the cap is tight.
  let dayExp = chooseDaytimeExperience(env, ctx, used, forced);
  let wantsExtra = chooseAfternoonExtra(env, ctx, used, forced, undefined) !== undefined;
  const room = Math.max(0, ctx.maxStops - 1);
  if ((dayExp ? 1 : 0) + (wantsExtra ? 1 : 0) > room) {
    if (wantsExtra && !forced.some((f) => f.cat === "shopping")) wantsExtra = false;
    if ((dayExp ? 1 : 0) + (wantsExtra ? 1 : 0) > room && dayExp && !forced.some((f) => f === dayExp)) dayExp = undefined;
    if ((dayExp ? 1 : 0) + (wantsExtra ? 1 : 0) > room && wantsExtra) wantsExtra = false;
    if ((dayExp ? 1 : 0) + (wantsExtra ? 1 : 0) > room) dayExp = undefined;
  }
  const reserve = (dayExp ? 1 : 0) + (wantsExtra ? 1 : 0);
  const landmarks = pickLandmarks(env, { ...ctx, maxStops: Math.max(1, ctx.maxStops - reserve) }, used, forcedLandmarks);
  const orderedAll = nearestNeighbourOrder(landmarks, landmarks[0]);
  const centre = centroid(landmarks.map((l) => l.coords).filter(Boolean) as Coords[]);
  const extra = wantsExtra ? chooseAfternoonExtra(env, ctx, used, forced, centre) : undefined;

  // Choose the meal slot in which each forced restaurant is actually open.
  const forcedMeals: Partial<Record<MealKind, Entry>> = {};
  for (const f of forced.filter((x) => x.cat === "restaurant")) {
    const r = f.rec as Restaurant;
    const order: MealKind[] = r.mealFor.includes("dinner") ? ["dinner", "lunch", "breakfast"] : r.mealFor.includes("lunch") ? ["lunch", "dinner", "breakfast"] : r.mealFor.includes("breakfast") ? ["breakfast", "lunch", "dinner"] : ["dinner", "lunch", "breakfast"];
    for (const meal of order) {
      if (forcedMeals[meal]) continue;
      if (meal === "breakfast" && (ctx.isFirst || ctx.startMin >= toMin("10:00"))) continue;
      const from = meal === "breakfast" ? ctx.startMin : meal === "lunch" ? LUNCH_FROM : DINNER_FROM;
      const dur = meal === "breakfast" ? 50 : meal === "lunch" ? 70 : 90;
      if (fitOpening(f.rec as Verifiable, ctx.weekday, from, dur, 150) !== null) {
        forcedMeals[meal] = f;
        break;
      }
    }
  }
  const forcedDinner = forcedMeals.dinner;
  const forcedLunch = forcedMeals.lunch;
  // A forced café goes into the afternoon coffee slot if it is open then, otherwise mid-morning.
  let forcedCafe: Entry | undefined = forced.find((f) => f.cat === "cafe");
  let midCafe: Entry | undefined;
  if (forcedCafe && fitOpening(forcedCafe.rec as Verifiable, ctx.weekday, COFFEE_FROM, 45, 150) === null) {
    midCafe = fitOpening(forcedCafe.rec as Verifiable, ctx.weekday, toMin("10:15"), 45, 90) !== null ? forcedCafe : undefined;
    forcedCafe = undefined;
  }

  // Breakfast near the first stop (skipped on a mid-morning arrival).
  if (!ctx.isFirst && ctx.startMin < toMin("10:00")) {
    placeMeal(env, ctx, st, "breakfast", forcedMeals.breakfast, orderedAll[0]);
  }

  const pending: Entry[] = [...orderedAll];
  const afternoonExtras: Entry[] = [];
  if (dayExp) afternoonExtras.push(dayExp);
  if (extra) afternoonExtras.push(extra);

  const deferrals = new Map<string, number>();
  let lunchDone = false;
  let coffeeDone = false;
  let guard = 0;
  while (guard++ < 40) {
    const next = pending[0];
    if (midCafe && st.clock >= toMin("10:15") && st.clock < toMin("12:30")) {
      const c = midCafe;
      midCafe = undefined;
      place(env, ctx, st, c, "coffee", { maxWait: 90, duration: 45 });
      continue;
    }
    const lunchDue =
      !lunchDone &&
      ctx.startMin < toMin("14:00") &&
      (st.clock >= LUNCH_FROM || (next !== undefined && st.clock + next.durationMin + 15 > toMin("13:45")) || (!next && afternoonExtras.length === 0));
    if (lunchDue) {
      lunchDone = true;
      placeMeal(env, ctx, st, "lunch", forcedLunch);
      continue;
    }
    if (next) {
      pending.shift();
      const isForced = forced.includes(next);
      const placed = place(env, ctx, st, next, "landmark", { maxWait: isForced ? 150 : 60 });
      // Not open yet (or no longer): try it again after the other sights, once or twice.
      if (!placed && pending.length > 0 && (deferrals.get(next.id) ?? 0) < 2) {
        deferrals.set(next.id, (deferrals.get(next.id) ?? 0) + 1);
        pending.push(next);
      }
      continue;
    }
    const extraNext = afternoonExtras.shift();
    if (extraNext) {
      const kind: StopKind = extraNext.cat === "shopping" ? "shopping" : "experience";
      place(env, ctx, st, extraNext, kind, { maxWait: 60 });
      continue;
    }
    break;
  }
  if (!lunchDone && ctx.startMin < toMin("14:00")) placeMeal(env, ctx, st, "lunch", forcedLunch);

  // Coffee break in the afternoon, if there is still daylight in the day.
  if (!coffeeDone && (ctx.endLimit === undefined || st.clock + 45 < ctx.endLimit) && (st.clock < toMin("17:30") || forcedCafe)) {
    coffeeDone = true;
    placeCoffee(env, ctx, st, forcedCafe);
  }

  // Dinner
  if (ctx.endLimit === undefined || toMin("18:00") + 60 < ctx.endLimit) {
    placeMeal(env, ctx, st, "dinner", forcedDinner);
  }

  // Evening
  if (eveningWanted(env.inp, ctx) || forced.some((f) => f.cat === "nightlife")) {
    const forcedEvening = forced.find((f) => f.cat === "nightlife" || (f.cat === "experience" && f !== dayExp));
    const options = chooseEvening(env, ctx, used, st.prev, forcedEvening);
    for (const e of options.slice(0, 6)) {
      const kind: StopKind = e.cat === "nightlife" || (e.rec as Experience).interestTags?.includes("nightlife") ? "nightlife" : "experience";
      if (place(env, ctx, st, e, kind, { minStart: st.clock + 10, maxWait: 60 })) break;
    }
  }

  if (st.stops.length === 0) {
    st.stops.push({
      time: fromMin(ctx.startMin),
      kind: "free-time",
      name: "Relaxed day",
      neighborhood: env.inp.destination.city,
      description: "Nothing fits comfortably today, so keep it open for rest or a favourite revisit.",
      durationLabel: "open",
    });
  }
  const title = ctx.isFirst ? "Arrival and first impressions" : ctx.isLast ? "One last look" : DAY_TITLES[(titleIdx + 1) % (DAY_TITLES.length - 1)];
  return finishDay(env, ctx, st, title, forced.map((f) => f.id));
}

function buildTripDay(env: Env, ctx: DayCtx, used: Used, trip: Entry, forced: Entry[]): ItineraryDay {
  const rec = trip.rec as DayTrip;
  const fullDay = rec.suggestedDuration !== "half-day";
  const travel = parseTravelMinutes(rec.travelTime, 90);
  const st: BuildState = { clock: ctx.startMin, stops: [], used, placed: [] };
  const departAt = fullDay ? toMin("08:00") : toMin("09:00");
  const centre = env.cat.cityCentre;
  const currency = env.inp.destination.currency;
  markUsed(used, trip);

  st.stops.push({
    time: fromMin(departAt),
    endTime: fromMin(departAt + travel),
    kind: "day-trip",
    name: `Depart for ${rec.name}`,
    neighborhood: "Day trip",
    description: rec.howToGetThere,
    durationLabel: rec.travelTime,
    transportNote: rec.travelTime,
    refId: trip.id,
    category: "dayTrip",
  });
  const arrive = departAt + travel;
  const stay = fullDay ? Math.max(180, toMin("16:30") - arrive) : Math.max(120, toMin("13:30") - arrive);
  const fitted = fitOpening(rec as Verifiable, ctx.weekday, arrive, Math.min(stay, 120), 60);
  const activityStart = fitted ?? arrive;
  const tripCost = entryCost(trip, currency);
  const activity: TimelineStop = {
    time: fromMin(activityStart),
    endTime: fromMin(activityStart + stay),
    kind: "day-trip",
    name: rec.name,
    neighborhood: "Day trip",
    description: rec.description,
    whyGo: rec.worthItFor.join("; "),
    durationLabel: durationLabel(stay),
    refId: trip.id,
    category: "dayTrip",
    coords: trip.coords,
    cost: tripCost,
    officialUrl: (rec as Verifiable).officialUrl,
    mapsUrl: (rec as Verifiable).mapsUrl,
    bookingUrl: (rec as Verifiable).bookingUrl,
    bookingRequired: (rec as Verifiable).bookingRequired,
    hoursNote: hoursNote(trip, ctx.weekday),
    notes: rec.suggestedDuration === "overnight" ? ["Often done overnight; this plan assumes you return the same day."] : undefined,
  };
  st.stops.push(activity);
  const back = activityStart + stay;
  st.stops.push({
    time: fromMin(back),
    endTime: fromMin(back + travel),
    kind: "transit",
    name: `Return to ${env.inp.destination.city}`,
    neighborhood: "Day trip",
    description: "Head back into the city; a relaxed dinner near your stay is an easy way to close the day.",
    durationLabel: rec.travelTime,
    transportNote: rec.travelTime,
  });
  st.clock = back + travel;
  st.prev = undefined;
  if (centre) {
    st.prev = {
      cat: "landmark",
      id: "__city_centre",
      name: env.inp.destination.city,
      norm: "citycentre",
      neighborhood: "",
      coords: centre,
      coordsApprox: true,
      durationMin: 0,
      rec: {} as Rec,
    };
  }
  if (!fullDay && ctx.maxStops >= 2 && st.clock < toMin("17:00")) {
    const pool = pickLandmarks(env, { ...ctx, maxStops: 1, maxMinutes: 150 }, used, forced.filter((f) => f.cat === "landmark"));
    for (const e of pool.slice(0, 1)) place(env, { ...ctx, startMin: st.clock }, st, e, "landmark", { maxWait: 30 });
  }
  const forcedRestaurant = forced.find((f) => f.cat === "restaurant");
  placeMeal(env, ctx, st, "dinner", forcedRestaurant);
  st.stops.sort((a, b) => toMin(a.time) - toMin(b.time));
  const day = finishDay(env, ctx, st, `Day trip: ${rec.name}`, forced.map((f) => f.id), {
    neighborhoodFocus: rec.name,
    isDayTrip: true,
  });
  day.centre = trip.coords;
  return day;
}

// ---------------------------------------------------------------------------
// Trip assembly
// ---------------------------------------------------------------------------

function tripDayIndexes(duration: number, available: number): number[] {
  if (duration < 4 || available === 0) return [];
  const count = Math.min(available, Math.floor((duration - 1) / 3));
  const out: number[] = [];
  for (let k = 0; k < count; k++) {
    let idx = Math.round(((k + 1) * (duration - 1)) / (count + 1));
    idx = Math.min(duration - 2, Math.max(1, idx));
    while (out.includes(idx) && idx < duration - 2) idx++;
    if (!out.includes(idx)) out.push(idx);
  }
  return out.sort((a, b) => a - b);
}

function makeEnv(inp: ResolvedInput, seedSuffix = ""): Env {
  return {
    inp,
    cat: buildCatalog(inp.destination),
    avoid: new Set(inp.avoid),
    rng: seededRandom(`${inp.destination.slug}|${inp.seed}${seedSuffix}`),
  };
}

function assignForced(env: Env, ctxs: DayCtx[], tripDays: Set<number>): { byDay: Map<number, Entry[]>; warnings: string[]; tripPicks: Map<number, Entry> } {
  const byDay = new Map<number, Entry[]>();
  const warnings: string[] = [];
  const tripPicks = new Map<number, Entry>();
  const load = (i: number) => (byDay.get(i)?.length ?? 0) + (ctxs[i].isFirst || ctxs[i].isLast ? 0.75 : 0);
  const cityDays = ctxs.filter((c) => !tripDays.has(c.index));
  const tripIdxs = [...tripDays];

  for (const id of env.inp.mustInclude) {
    if (env.avoid.has(id)) continue;
    const e = env.cat.byId.get(id);
    if (!e) {
      warnings.push(`Unknown must-include id "${id}" was ignored.`);
      continue;
    }
    if (e.cat === "dayTrip") {
      const day = tripIdxs.find((i) => !tripPicks.has(i) && !isClosedAllDay(e.rec as Verifiable, ctxs[i].weekday));
      if (day !== undefined) tripPicks.set(day, e);
      else warnings.push(`${e.name} could not be scheduled as a day trip (trip too short or closed on the available days).`);
      continue;
    }
    const eligible = cityDays.filter((c) => !isClosedAllDay(e.rec as Verifiable, c.weekday));
    if (eligible.length === 0) {
      warnings.push(`${e.name} is closed on every day of this trip, so it was not scheduled.`);
      continue;
    }
    const best = eligible
      .map((c) => ({ c, l: load(c.index) }))
      .sort((a, b) => a.l - b.l || a.c.index - b.c.index)[0].c;
    byDay.set(best.index, [...(byDay.get(best.index) ?? []), e]);
  }
  return { byDay, warnings, tripPicks };
}

function pickTrips(env: Env, ctxs: DayCtx[], idxs: number[], forcedPicks: Map<number, Entry>, used: Used): Map<number, Entry> {
  const out = new Map<number, Entry>(forcedPicks);
  const boosted = new Set<Interest>([...env.inp.interests, ...(STYLE_INTEREST_BOOST[env.inp.travelStyle] ?? [])]);
  const taken = new Set([...out.values()].map((e) => e.id));
  for (const idx of idxs) {
    if (out.has(idx)) continue;
    const ranked = env.cat.dayTrips
      .filter((t) => !taken.has(t.id) && !env.avoid.has(t.id) && !used.names.has(t.norm) && !isClosedAllDay(t.rec as Verifiable, ctxs[idx].weekday))
      .map((t) => {
        const rec = t.rec as DayTrip;
        let s = rec.suggestedDuration === "full-day" ? 5 : 0;
        s += rec.worthItFor.length;
        if (env.inp.interests.length) s += rec.worthItFor.filter((w) => [...boosted].some((b) => w.toLowerCase().includes(b))).length * 3;
        return { t, s: s + env.rng() };
      })
      .sort((a, b) => b.s - a.s || a.t.id.localeCompare(b.t.id));
    if (ranked[0]) {
      out.set(idx, ranked[0].t);
      taken.add(ranked[0].t.id);
    }
  }
  return out;
}

function assemble(
  inp: ResolvedInput,
  days: ItineraryDay[],
  warnings: string[],
  usedLandmarkIds: Set<string>
): GeneratedItinerary {
  const d = inp.destination;
  const cost = addRanges(days.map((x) => x.cost), d.currency);
  const month = inp.startDate ? Number(inp.startDate.slice(5, 7)) : undefined;
  const unusedHighlights = d.landmarks
    .filter((l) => !usedLandmarkIds.has(l.id) && !inp.avoid.includes(l.id) && (l.priority === "must-see" || l.priority === "highly-recommended"))
    .map((l) => l.name);
  return {
    destination: d.city,
    duration: inp.duration,
    days,
    unusedHighlights,
    startDate: inp.startDate,
    endDate: inp.endDate,
    currency: d.currency,
    cost,
    groupLikely: Math.round(cost.likely * inp.groupSize),
    budgetFit: computeBudgetFit(d, inp.budget, cost, inp.duration),
    season: month ? { ...d.seasons[month - 1], month } : undefined,
    warnings,
    input: inp,
  };
}

function collectUsedLandmarks(days: ItineraryDay[]): Set<string> {
  const s = new Set<string>();
  for (const day of days) for (const stop of day.stops) if (stop.refId && stop.category === "landmark") s.add(stop.refId);
  return s;
}

export function generateItinerary(input: PlannerInput): GeneratedItinerary {
  const inp = resolveInput(input);
  const env = makeEnv(inp);
  const ctxs = Array.from({ length: inp.duration }, (_, i) => dayContext(inp, i));
  const used: Used = { ids: new Set(), names: new Set() };

  const tripIdxs = tripDayIndexes(inp.duration, env.cat.dayTrips.filter((t) => !env.avoid.has(t.id)).length);
  const mustTripCount = inp.mustInclude.filter((id) => env.cat.byId.get(id)?.cat === "dayTrip").length;
  // Honour must-include day trips even on shorter trips (any trip of 3+ days has a middle day).
  const extraIdx: number[] = [];
  for (let i = 1; i < inp.duration - 1 && tripIdxs.length + extraIdx.length < mustTripCount; i++) {
    if (!tripIdxs.includes(i)) extraIdx.push(i);
  }
  const tripDays = new Set([...tripIdxs, ...extraIdx]);

  const { byDay, warnings, tripPicks } = assignForced(env, ctxs, tripDays);
  used.reserved = new Map();
  for (const list of byDay.values()) for (const e of list) used.reserved.set(e.norm, e.id);
  const picks = pickTrips(env, ctxs, [...tripDays].sort((a, b) => a - b), tripPicks, used);

  const days: ItineraryDay[] = [];
  let titleIdx = 0;
  for (const ctx of ctxs) {
    const forced = byDay.get(ctx.index) ?? [];
    const trip = picks.get(ctx.index);
    if (tripDays.has(ctx.index) && trip) {
      days.push(buildTripDay(env, ctx, used, trip, forced));
    } else {
      days.push(buildCityDay(env, ctx, used, forced, titleIdx++));
    }
  }

  // Report must-includes that could not be placed.
  const placedIds = new Set<string>();
  for (const day of days) for (const s of day.stops) if (s.refId) placedIds.add(s.refId);
  for (const id of inp.mustInclude) {
    const e = env.cat.byId.get(id);
    if (e && !env.avoid.has(id) && !placedIds.has(id) && !warnings.some((w) => w.startsWith(e.name))) {
      warnings.push(`${e.name} could not be scheduled within the pace limits or opening hours.`);
    }
  }
  return assemble(inp, days, warnings, collectUsedLandmarks(days));
}

// ---------------------------------------------------------------------------
// Editing: regenerateDay and swapStop
// ---------------------------------------------------------------------------

function usedOutside(days: ItineraryDay[], dayNumber: number, env: Env): Used {
  const used: Used = { ids: new Set(), names: new Set() };
  for (const day of days) {
    if (day.dayNumber === dayNumber) continue;
    for (const s of day.stops) {
      if (!s.refId) continue;
      used.ids.add(s.refId);
      const e = env.cat.byId.get(s.refId);
      if (e) used.names.add(e.norm);
    }
  }
  return used;
}

function replaceDay(it: GeneratedItinerary, day: ItineraryDay): GeneratedItinerary {
  const days = it.days.map((d) => (d.dayNumber === day.dayNumber ? day : d));
  const next = assemble(it.input, days, it.warnings, collectUsedLandmarks(days));
  return next;
}

/**
 * Rebuilds one day with a different seed while keeping every other day intact.
 * Places already used elsewhere in the trip are never repeated. Deterministic:
 * the same (itinerary, dayNumber, seed) always gives the same day.
 */
export function regenerateDay(itinerary: GeneratedItinerary, dayNumber: number, seed: string | number): GeneratedItinerary {
  const current = itinerary.days.find((d) => d.dayNumber === dayNumber);
  if (!current) return itinerary;
  const inp = itinerary.input;
  const env = makeEnv(inp, `|regen|${dayNumber}|${seed}`);
  const ctx = dayContext(inp, dayNumber - 1);
  const used = usedOutside(itinerary.days, dayNumber, env);
  const forced = current.mustIds.map((id) => env.cat.byId.get(id)).filter(Boolean) as Entry[];
  used.reserved = new Map(forced.map((e) => [e.norm, e.id]));

  let rebuilt: ItineraryDay;
  if (current.isDayTrip) {
    const currentTripId = current.stops.find((s) => s.category === "dayTrip")?.refId;
    const forcedTrip = forced.find((f) => f.cat === "dayTrip");
    const alternatives = env.cat.dayTrips.filter(
      (t) => !used.ids.has(t.id) && !env.avoid.has(t.id) && !isClosedAllDay(t.rec as Verifiable, ctx.weekday)
    );
    const others = alternatives.filter((t) => t.id !== currentTripId);
    const pick = forcedTrip ?? (others.length > 0 ? others[Math.floor(env.rng() * others.length)] : alternatives[0]);
    if (!pick) return itinerary;
    rebuilt = buildTripDay(env, ctx, used, pick, forced.filter((f) => f.cat !== "dayTrip"));
  } else {
    rebuilt = buildCityDay(env, ctx, used, forced, dayNumber - 1);
  }
  return replaceDay(itinerary, rebuilt);
}

function swapPool(env: Env, e: Entry, kind: StopKind): Entry[] {
  switch (e.cat) {
    case "landmark":
      return env.cat.landmarks;
    case "restaurant":
      return env.cat.restaurants;
    case "cafe":
      return env.cat.cafes;
    case "experience":
      return kind === "nightlife" ? [...env.cat.nightlife, ...env.cat.experiences] : env.cat.experiences;
    case "shopping":
      return env.cat.shopping;
    case "nightlife":
      return [...env.cat.nightlife, ...env.cat.experiences];
    default:
      return [];
  }
}

/**
 * Lists replacement candidates for a stop and, when `alternativeId` is given,
 * applies the swap and re-times the rest of the day. Candidates are only those
 * that are open at the right time, are not used elsewhere in the trip and still
 * fit before any flight cut-off.
 */
export function swapStop(
  itinerary: GeneratedItinerary,
  dayNumber: number,
  stopIndex: number,
  alternativeId?: string
): SwapResult {
  const day = itinerary.days.find((d) => d.dayNumber === dayNumber);
  const stop = day?.stops[stopIndex];
  if (!day || !stop || !stop.refId || !stop.category || stop.category === "dayTrip") {
    return { itinerary, candidates: [], error: "That stop cannot be swapped." };
  }
  const inp = itinerary.input;
  const env = makeEnv(inp, `|swap|${dayNumber}|${stopIndex}`);
  const ctx = dayContext(inp, dayNumber - 1);
  const current = env.cat.byId.get(stop.refId);
  if (!current) return { itinerary, candidates: [], error: "That stop's record was not found." };

  const used = usedOutside(itinerary.days, dayNumber, env);
  for (const s of day.stops) {
    if (!s.refId || s === stop) continue;
    used.ids.add(s.refId);
    const e = env.cat.byId.get(s.refId);
    if (e) used.names.add(e.norm);
  }

  const prevStop = day.stops.slice(0, stopIndex).reverse().find((s) => s.coords);
  const prevEntry = prevStop?.refId ? env.cat.byId.get(prevStop.refId) : undefined;

  // Day-trip days keep their travel blocks verbatim; only stops after the return can change.
  let prefixCount = 0;
  if (day.isDayTrip) {
    day.stops.forEach((s, i) => {
      if (s.category === "dayTrip" || s.kind === "transit") prefixCount = i + 1;
    });
  }
  if (stopIndex < prefixCount) {
    return { itinerary, candidates: [], error: "Travel blocks of a day trip cannot be swapped." };
  }

  const trial = (candidate: Entry): ItineraryDay | null => {
    const st: BuildState = {
      clock: ctx.startMin,
      stops: day.stops.slice(0, prefixCount).map((s) => ({ ...s })),
      used: { ids: new Set(), names: new Set() },
      placed: [],
    };
    if (prefixCount > 0) {
      const last = day.stops[prefixCount - 1];
      st.clock = toMin(last.endTime ?? last.time);
      if (env.cat.cityCentre) {
        st.prev = { cat: "landmark", id: "__city_centre", name: inp.destination.city, norm: "citycentre", neighborhood: "", coords: env.cat.cityCentre, coordsApprox: true, durationMin: 0, rec: {} as Rec };
      }
    }
    for (let i = prefixCount; i < day.stops.length; i++) {
      const s = day.stops[i];
      if (!s.refId || s.kind === "free-time") continue;
      const e = i === stopIndex ? candidate : env.cat.byId.get(s.refId);
      if (!e) return null;
      const minStart =
        s.kind === "lunch" ? (inp.hasKids ? toMin("11:45") : LUNCH_FROM)
        : s.kind === "dinner" ? (inp.hasKids ? toMin("18:15") : DINNER_FROM)
        : s.kind === "coffee" ? COFFEE_FROM
        : undefined;
      const duration =
        s.kind === "breakfast" ? 50 : s.kind === "lunch" ? 70 : s.kind === "dinner" ? 90 : s.kind === "coffee" ? 45 : e.durationMin;
      const fit = e.cat === "restaurant" ? combinedDietFit(e.rec as Restaurant, inp.dietary) : undefined;
      if (!place(env, ctx, st, e, s.kind, { minStart, maxWait: 60, duration, fit })) return null;
    }
    if (st.stops.length === 0) return null;
    return finishDay(env, ctx, st, day.title, day.mustIds, {
      neighborhoodFocus: day.neighborhoodFocus,
      isDayTrip: day.isDayTrip,
      centre: day.centre,
    });
  };

  const candidates: SwapCandidate[] = [];
  const pool = swapPool(env, current, stop.kind);
  const ranked = pool
    .filter((e) => e.id !== current.id && isAvailable(env, used, e))
    .filter((e) => {
      if (e.cat !== "restaurant") return true;
      return combinedDietFit(e.rec as Restaurant, inp.dietary) !== "no";
    })
    .map((e) => {
      const km = distanceKm(prevEntry, e);
      let s = scoreEntry(e, inp);
      if (km !== undefined) s -= km * 5;
      return { e, s, km };
    })
    .sort((a, b) => b.s - a.s || a.e.id.localeCompare(b.e.id));

  let applied: ItineraryDay | null = null;
  for (const c of ranked) {
    if (candidates.length >= 5 && alternativeId === undefined) break;
    const isTarget = alternativeId === c.e.id;
    if (candidates.length >= 5 && !isTarget) continue;
    const rendered = trial(c.e);
    if (!rendered) continue;
    candidates.push({
      id: c.e.id,
      name: c.e.name,
      category: c.e.cat,
      neighborhood: c.e.neighborhood,
      distanceKm: c.km !== undefined ? Number(c.km.toFixed(1)) : undefined,
      priority: (c.e.rec as { priority?: Priority }).priority,
      reason:
        c.km !== undefined
          ? `${c.km < 1 ? "Under 1" : c.km.toFixed(1)} km from the previous stop`
          : c.e.neighborhood
            ? `In ${c.e.neighborhood}`
            : "Open at that time",
    });
    if (isTarget) applied = rendered;
  }
  if (alternativeId === undefined) return { itinerary, candidates };
  if (!applied) return { itinerary, candidates, error: "That alternative isn't open or doesn't fit at that time." };
  return { itinerary: replaceDay(itinerary, applied), candidates };
}

// ---------------------------------------------------------------------------
// Validation helpers (used by tests and the UI)
// ---------------------------------------------------------------------------

/** True when every dated, hour-backed stop of the plan falls inside its opening window. */
export function findClosedStops(it: GeneratedItinerary): { day: number; stop: string; reason: string }[] {
  const out: { day: number; stop: string; reason: string }[] = [];
  const cat = buildCatalog(it.input.destination);
  for (const day of it.days) {
    if (day.weekday === undefined) continue;
    for (const s of day.stops) {
      if (!s.refId || s.kind === "transit" || s.kind === "free-time") continue;
      const e = cat.byId.get(s.refId);
      if (!e) continue;
      const rec = e.rec as Verifiable;
      const windows = windowsFor(rec, day.weekday);
      if (windows === null) continue;
      if (windows.length === 0) {
        out.push({ day: day.dayNumber, stop: s.name, reason: "closed that weekday" });
        continue;
      }
      const start = toMin(s.time);
      let end = s.endTime ? toMin(s.endTime) : start;
      if (end < start) end += 1440;
      if (!windows.some(([o, c]) => start >= o && end <= c)) {
        out.push({ day: day.dayNumber, stop: s.name, reason: `${s.time}–${s.endTime ?? s.time} is outside opening hours` });
      }
    }
  }
  return out;
}

export { combinedDietFit } from "./engine/dietary";
export type { DietFit } from "./engine/dietary";

/** Maximum number of daytime sights (landmarks, daytime experiences, shopping) for a day of this input. */
export function maxStopsForDay(input: ResolvedInput, dayIndex: number): number {
  return dayContext(input, dayIndex).maxStops;
}

/** Sights that count against the pace cap: everything except meals, coffee and evening plans. */
export function sightseeingStops(day: ItineraryDay): TimelineStop[] {
  return day.stops.filter((s) => {
    if (s.category === "landmark" || s.category === "shopping") return true;
    if (s.category === "experience" && s.kind === "experience") return toMin(s.time) < toMin("18:00");
    if (s.category === "dayTrip" && s.kind === "day-trip" && s.refId && !s.name.startsWith("Depart")) return true;
    return false;
  });
}
