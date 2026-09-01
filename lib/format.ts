import type { Interest, TravelStyle } from "./types";

export const INTEREST_LABELS: Record<Interest, string> = {
  history: "History",
  food: "Food",
  cafes: "Cafés",
  shopping: "Shopping",
  art: "Art",
  nightlife: "Nightlife",
  photography: "Photography",
  beaches: "Beaches",
  nature: "Nature",
  adventure: "Adventure",
  culture: "Culture",
  luxury: "Luxury",
};

export const ALL_INTERESTS = Object.keys(INTEREST_LABELS) as Interest[];

export const TRAVEL_STYLE_LABELS: Record<TravelStyle, string> = {
  "first-time": "First-time visitor",
  foodie: "Foodie",
  luxury: "Luxury",
  budget: "Budget-conscious",
  couple: "Couple's trip",
  friends: "Friends trip",
  family: "Family trip",
  relaxed: "Relaxed pace",
  adventure: "Adventure-focused",
  shopping: "Shopping-focused",
  "culture-history": "Culture & history",
  nightlife: "Nightlife-focused",
};

export const ALL_TRAVEL_STYLES = Object.keys(TRAVEL_STYLE_LABELS) as TravelStyle[];

export const BUDGET_LABELS: Record<"budget" | "mid-range" | "luxury", string> = {
  budget: "Budget",
  "mid-range": "Mid-range",
  luxury: "Luxury",
};

export const STOP_KIND_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  coffee: "Coffee break",
  landmark: "Sight",
  experience: "Experience",
  shopping: "Shopping",
  nightlife: "Nightlife",
  transit: "Transit",
  "day-trip": "Day trip",
  "free-time": "Free time",
};

/** Groups stop kinds into 3 visual categories so the itinerary timeline reads
 * at a glance: warm dots for meals, gold dots for sights/experiences, muted
 * dots for transit/free-time. */
export function stopDotCategory(kind: string): "meal" | "sight" | "move" {
  if (["breakfast", "lunch", "dinner", "coffee"].includes(kind)) return "meal";
  if (["transit", "free-time"].includes(kind)) return "move";
  return "sight";
}
