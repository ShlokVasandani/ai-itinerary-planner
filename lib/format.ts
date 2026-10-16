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

/** Locale-aware money, no decimals for round amounts or zero-decimal currencies. */
export function money(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: Number.isInteger(amount) || amount >= 100 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString("en")}`;
  }
}

export function moneyRange(low: number, high: number, currency: string): string {
  if (Math.round(low) === Math.round(high)) return money(low, currency);
  return `${money(low, currency)}–${money(high, currency).replace(/^[^\d]*/, "")}`;
}

export const PACE_LABELS = {
  relaxed: "Relaxed",
  balanced: "Balanced",
  packed: "Packed",
} as const;

export const DIETARY_LABELS = {
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  halal: "Halal",
  "gluten-free": "Gluten-free",
} as const;

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function formatDate(iso: string | undefined, opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en", { ...opts, timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
}

const DAY_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** "Mo-Fr 09:00–18:00, Sa 10:00–16:00" plus "Closed Monday" for a verified record. */
export function hoursSummary(item: {
  openingHours?: { days: string; open: string; close: string }[];
  closedDays?: number[];
}): string | undefined {
  const parts: string[] = [];
  if (item.openingHours && item.openingHours.length > 0) {
    const by = new Map<string, string[]>();
    for (const r of item.openingHours) {
      const slot = `${r.open}–${r.close}`;
      by.set(r.days, [...(by.get(r.days) ?? []), slot]);
    }
    parts.push([...by.entries()].map(([days, slots]) => `${days} ${slots.join(", ")}`).join("; "));
  }
  if (item.closedDays && item.closedDays.length > 0) {
    parts.push(`Closed ${item.closedDays.map((d) => DAY_FULL[d]).join(" and ")}`);
  }
  return parts.length ? parts.join(". ") : undefined;
}

export const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
