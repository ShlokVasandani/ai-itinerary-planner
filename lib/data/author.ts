import type {
  Cafe, DayTrip, Experience, Interest, LocalFood, Neighborhood, NightlifeSpot, Place, PriceLevel, Priority, Restaurant, ShoppingSpot, TransportOption,
} from "../types";

// ============================================================================
// Compact constructors for hand-authored city files. They only reduce typing:
// every result is a plain record of the types in ../types, and ids are derived
// from the name (landmarks: slug; others: prefix + slug).
// ============================================================================

export const slug = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const PRIORITY: Record<string, Priority> = { M: "must-see", H: "highly-recommended", T: "if-you-have-time", I: "interest-specific" };
const tags = (s: string) => s.split(" ").filter(Boolean) as Interest[];
const meal = (s: string) => s.split(" ").map((m) => ({ b: "breakfast", l: "lunch", d: "dinner", a: "any" })[m]).filter(Boolean) as Restaurant["mealFor"];
const opt = <T extends object>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== "")) as T;

export const hood = (name: string, vibe: string, knownFor: string, bestFor: string, bestTimeToVisit: string, walkable = true, id?: string): Neighborhood => ({
  id: id ?? slug(name), name, vibe, knownFor: knownFor.split("|"), bestFor: tags(bestFor), bestTimeToVisit, walkable,
});

/** priority codes: M must-see, H highly recommended, T if you have time, I interest-specific */
export const lm = (name: string, neighborhood: string, description: string, whyGo: string, pr: keyof typeof PRIORITY, interestTags: string, suggestedDurationMin: number, approxCost?: string, reservationNote?: string, id?: string): Place =>
  opt({ id: id ?? slug(name), name, neighborhood, description, whyGo, priority: PRIORITY[pr], interestTags: tags(interestTags), suggestedDurationMin, approxCost, reservationNote });

export const rs = (name: string, neighborhood: string, cuisine: string, description: string, whyGo: string, pr: keyof typeof PRIORITY, price: PriceLevel, dishes: string, meals: string, suggestedDurationMin: number, approxCost?: string, reservationNote?: string, interestTags = "food"): Restaurant =>
  opt({ id: `r-${slug(name)}`, name, neighborhood, description, whyGo, priority: PRIORITY[pr], interestTags: tags(interestTags), suggestedDurationMin, cuisine, signatureDishes: dishes.split("|"), mealFor: meal(meals), priceLevel: price, approxCost, reservationNote });

export const cf = (name: string, neighborhood: string, description: string, specialty: string, priceLevel: PriceLevel, pr: keyof typeof PRIORITY = "H"): Cafe =>
  ({ id: `c-${slug(name)}`, name, neighborhood, description, specialty, priceLevel, priority: PRIORITY[pr] });

export const food = (dish: string, description: string, whereToTry: string, vegetarian?: boolean): LocalFood => opt({ dish, description, whereToTry: whereToTry.split("|"), vegetarian });

/** `bookingNote` may start with "@day" or "@evening" (optionally followed by "|note") to say when the experience happens. */
export const xp = (name: string, description: string, whyGo: string, approxCost: string, duration: string, pr: keyof typeof PRIORITY, interestTags: string, bookingNote?: string): Experience => {
  const m = bookingNote?.match(/^@(day|evening)(?:\|(.*))?$/);
  const timeOfDay = m ? (m[1] as "day" | "evening") : undefined;
  const note = m ? m[2] : bookingNote;
  return opt({ id: `x-${slug(name)}`, name, description, whyGo, approxCost, duration, priority: PRIORITY[pr], interestTags: tags(interestTags), bookingNote: note, timeOfDay });
};

export const shop = (name: string, neighborhood: string, type: ShoppingSpot["type"], description: string): ShoppingSpot => ({ id: `s-${slug(name)}`, name, neighborhood, type, description });

export const night = (name: string, neighborhood: string, type: NightlifeSpot["type"], description: string, priceLevel?: PriceLevel): NightlifeSpot =>
  opt({ id: `n-${slug(name)}`, name, neighborhood, type, description, priceLevel });

export const trip = (name: string, description: string, distanceFromCity: string, travelTime: string, suggestedDuration: DayTrip["suggestedDuration"], howToGetThere: string, worthItFor: string): DayTrip =>
  ({ id: `t-${slug(name)}`, name, description, distanceFromCity, travelTime, suggestedDuration, howToGetThere, worthItFor: worthItFor.split("|") });

export const move = (mode: string, description: string, approxCost: string, tips: string): TransportOption => ({ mode, description, approxCost, tips });

type Rating = 1 | 2 | 3 | 4 | 5;
/** 12 monthly ratings (January first) from three 12-value rows: crowds, weather, price. Editorial estimates. */
export const seasons = (crowds: Rating[], weather: Rating[], price: Rating[]) => crowds.map((c, i) => ({ crowds: c, weather: weather[i], price: price[i] }));
export const phrase = (english: string, local: string, romanized?: string) => ({ english, local, romanized });
export const ev = (name: string, month: number, note: string) => ({ name, month, note });
