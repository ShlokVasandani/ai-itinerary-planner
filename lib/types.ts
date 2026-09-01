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

/** A physical point of interest, tied to a neighborhood for geographic clustering. */
export interface Place {
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

export interface Restaurant extends Place {
  cuisine: string;
  signatureDishes: string[];
  mealFor: ("breakfast" | "lunch" | "dinner" | "any")[];
}

export interface Cafe {
  id: string;
  name: string;
  neighborhood: string;
  description: string;
  specialty: string;
  priceLevel: PriceLevel;
  priority: Priority;
}

export interface Neighborhood {
  id: string;
  name: string;
  vibe: string;
  knownFor: string[];
  bestFor: Interest[];
  bestTimeToVisit: string;
  walkable: boolean;
}

export interface LocalFood {
  dish: string;
  description: string;
  whereToTry: string[];
  vegetarian?: boolean;
}

export interface ShoppingSpot {
  name: string;
  neighborhood: string;
  type: "street" | "mall" | "market" | "luxury" | "souvenir" | "district";
  description: string;
}

export interface NightlifeSpot {
  name: string;
  neighborhood: string;
  type: "bar" | "club" | "rooftop" | "night-market" | "performance" | "night-view";
  description: string;
  priceLevel?: PriceLevel;
}

export interface Experience {
  name: string;
  description: string;
  whyGo: string;
  approxCost: string;
  duration: string;
  priority: Priority;
  interestTags: Interest[];
  bookingNote?: string;
}

export interface DayTrip {
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
  averageDailyBudget: { budget: string; midRange: string; luxury: string };
  idealTripLength: string;
}

export interface Destination {
  slug: string;
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
  practicalInfo: PracticalInfo;
}
