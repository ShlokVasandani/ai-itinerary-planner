// ============================================================================
// Sekai destination data model
// ----------------------------------------------------------------------------
// Every city in lib/data/*.ts implements this shape. The UI and the itinerary
// engine consume ONLY this structured data — no city-specific logic lives in
// components. Adding destination #21 means adding one new file that satisfies
// `Destination` and registering it in lib/data/index.ts.
// ============================================================================

export type Priority = "must-see" | "highly-recommended" | "if-you-have-time" | "interest-specific";

export type Interest =
  | "history"
  | "food"
  | "cafes"
  | "shopping"
  | "art"
  | "nightlife"
  | "photography"
  | "beaches"
  | "nature"
  | "adventure"
  | "culture"
  | "luxury";

export type TravelStyle =
  | "first-time"
  | "foodie"
  | "luxury"
  | "budget"
  | "couple"
  | "friends"
  | "family"
  | "relaxed"
  | "adventure"
  | "shopping"
  | "culture-history"
  | "nightlife";

export type PriceLevel = "$" | "$$" | "$$$" | "$$$$";

export interface Coords {
  lat: number;
  lng: number;
}

/** One opening-hours rule. `days` is a compact day list such as "Mo-Fr" or "Sa,Su". */
export interface OpeningHoursRule {
  days: string;
  open: string; // "HH:MM"
  close: string; // "HH:MM" (may be "24:00")
}

export type BookingRequirement = "no" | "recommended" | "required";
export type BookingProvider = "viator" | "getyourguide" | "klook" | "official";

/**
 * Verified facts that can be attached to any venue. Everything here is
 * optional: if a fact could not be confirmed from a primary source (the venue's
 * own site, official tourism board, Wikipedia/Wikidata, OpenStreetMap) it is
 * left undefined and listed in data-gaps.md instead of being guessed.
 */
export interface Verifiable {
  coords?: Coords;
  officialUrl?: string;
  /** Google Maps search URL generated from name + city (not scraped). */
  mapsUrl?: string;
  openingHours?: OpeningHoursRule[];
  /** 0 = Sunday ... 6 = Saturday. */
  closedDays?: number[];
  costMin?: number;
  costMax?: number;
  costCurrency?: string;
  bookingUrl?: string;
  bookingRequired?: BookingRequirement;
  sources?: string[];
  /** ISO date (YYYY-MM-DD) the facts above were last verified. */
  verifiedAt?: string;
}

/** A physical point of interest, tied to a neighborhood for geographic clustering. */
export interface Place extends Verifiable {
  id: string;
  name: string;
  neighborhood: string;
  description: string;
  whyGo: string;
  priority: Priority;
  interestTags: Interest[];
  /** Rough visit length in minutes, used by the itinerary engine to build timing. */
  suggestedDurationMin: number;
  priceLevel?: PriceLevel;
  approxCost?: string;
  bestTime?: string;
  reservationNote?: string;
  tips?: string;
}

export type DietaryNeed = "vegetarian" | "vegan" | "halal" | "gluten-free";

export interface Restaurant extends Place {
  /** Explicit, verified dietary tags. When absent the engine falls back to conservative cuisine/dish heuristics. */
  dietary?: DietaryNeed[];
  cuisine: string;
  signatureDishes: string[];
  mealFor: ("breakfast" | "lunch" | "dinner" | "any")[];
}

export interface Cafe extends Verifiable {
  id: string;
  name: string;
  neighborhood: string;
  description: string;
  specialty?: string;
  priceLevel?: PriceLevel;
  priority: Priority;
  approxCost?: string;
}

export interface Neighborhood {
  id: string;
  name: string;
  /** Centre point of the neighborhood (OpenStreetMap). */
  coords?: Coords;
  /** Rough radius used to cluster stops into one day. */
  radiusKm?: number;
  /** Hand-written for curated cities; omitted for open-data cities rather than invented. */
  vibe?: string;
  knownFor: string[];
  bestFor: Interest[];
  bestTimeToVisit?: string;
  walkable?: boolean;
}

export interface LocalFood {
  dish: string;
  description: string;
  whereToTry: string[];
  vegetarian?: boolean;
}

export interface ShoppingSpot extends Verifiable {
  id: string;
  name: string;
  neighborhood: string;
  type: "street" | "mall" | "market" | "luxury" | "souvenir" | "district";
  description: string;
}

export interface NightlifeSpot extends Verifiable {
  id: string;
  name: string;
  neighborhood: string;
  type: "bar" | "club" | "rooftop" | "night-market" | "performance" | "night-view";
  description: string;
  priceLevel?: PriceLevel;
  approxCost?: string;
}

export interface Experience extends Verifiable {
  id: string;
  provider?: BookingProvider;
  /** Neighborhood the experience takes place in, if it has a fixed location. */
  neighborhood?: string;
  name: string;
  description: string;
  whyGo: string;
  approxCost: string;
  duration: string;
  priority: Priority;
  interestTags: Interest[];
  bookingNote?: string;
  /** When it happens. Absent = the planner guesses from the text (older cities). */
  timeOfDay?: "day" | "evening";
}

export interface DayTrip extends Verifiable {
  id: string;
  provider?: BookingProvider;
  /** Typical all-in cost per person, if verifiable. */
  approxCost?: string;
  name: string;
  description: string;
  distanceFromCity: string;
  travelTime: string;
  suggestedDuration: "half-day" | "full-day" | "overnight";
  howToGetThere: string;
  worthItFor: string[];
}

export interface TransportOption {
  mode: string;
  description: string;
  approxCost: string;
  tips: string;
}

export interface PracticalInfo {
  currency: string;
  language: string[];
  paymentNote: string;
  tipping: string;
  usefulApps: string[];
  simEsim: string;
  safety: string;
  touristTraps: string[];
  etiquette: string[];
  reservationAdvice: string;
  weatherNote: string;
}

export interface QuickFacts {
  country: string;
  timezone: string;
  bestMonths: string[];
  avoidMonths?: string;
  airport: string;
  /** Not available for open-data cities, so the planner skips the budget-fit check. */
  averageDailyBudget?: { budget: string; midRange: string; luxury: string };
  idealTripLength?: string;
}

export interface SeasonRating {
  /** 1 (low) – 5 (high). Editorial estimates; absent for open-data cities. */
  crowds?: 1 | 2 | 3 | 4 | 5;
  /** 1 (poor) – 5 (ideal) for typical sightseeing weather. Computed from climate averages for open-data cities. */
  weather: 1 | 2 | 3 | 4 | 5;
  /** 1 (cheap) – 5 (expensive) relative to the city's own year. Absent for open-data cities. */
  price?: 1 | 2 | 3 | 4 | 5;
}

export interface CityEvent {
  name: string;
  /** 1–12 */
  month: number;
  note: string;
}

export interface LocalPhrase {
  english: string;
  local: string;
  /** Latin-script pronunciation for non-Latin languages. */
  romanized?: string;
}

export interface TransitCardInfo {
  name: string;
  description: string;
  where: string;
}

/**
 * "curated": hand-written and individually verified (the original 20 cities).
 * "open": assembled by scripts/open from Wikidata, Wikipedia and OpenStreetMap, then machine-checked.
 */
export type DataTier = "curated" | "open";

export interface Destination {
  slug: string;
  tier?: DataTier;
  region?: string;
  /** Languages spoken in the country (Wikidata); open-data cities only. */
  languages?: string[];
  population?: number;
  wikidataId?: string;
  /** ISO 4217 currency code, e.g. "EUR". */
  currency: string;
  /** IATA codes of the main international airports. */
  airportCodes: string[];
  transitCardInfo?: TransitCardInfo;
  /** Exactly 12 entries, January first. */
  seasons: SeasonRating[];
  events?: CityEvent[];
  /** Eight useful phrases. */
  localPhrases: LocalPhrase[];
  /** City-wide bounding box [south, west, north, east], used by the data validator. */
  bbox?: [number, number, number, number];
  /** IANA timezone, e.g. "Europe/Paris". */
  ianaTimezone: string;
  city: string;
  country: string;
  aliases?: string[];
  tagline: string;
  overview: string;
  heroImageQuery: string;
  quickFacts: QuickFacts;
  neighborhoods: Neighborhood[];
  landmarks: Place[];
  restaurants: Restaurant[];
  cafes: Cafe[];
  localFoods: LocalFood[];
  experiences: Experience[];
  shopping: ShoppingSpot[];
  nightlife: NightlifeSpot[];
  dayTrips: DayTrip[];
  transportation: TransportOption[];
  travelTips: string[];
  practicalInfo?: PracticalInfo;
}

/** Fields supplied per city by lib/data/city-meta.ts rather than the city's own data file. */
export type CityMeta = Pick<
  Destination,
  "currency" | "airportCodes" | "transitCardInfo" | "seasons" | "events" | "localPhrases" | "ianaTimezone"
>;

/** The hand-authored shape of lib/data/<slug>.ts, before city meta and verified geo data are merged in. */
export type DestinationSource = Omit<Destination, keyof CityMeta>;
