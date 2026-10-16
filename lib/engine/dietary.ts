import type { DietaryNeed, Restaurant } from "../types";

/**
 * How well a restaurant matches a dietary need.
 *  - "yes":     explicitly tagged (`dietary`) or the name/cuisine says so
 *  - "likely":  cuisine or signature dishes usually accommodate it
 *  - "unknown": nothing in the data either way
 *  - "no":      the cuisine/dishes are centred on something that rules it out
 *
 * These are conservative heuristics over curated text, NOT verified menus; the
 * UI always tells people to confirm with the venue.
 */
export type DietFit = "yes" | "likely" | "unknown" | "no";

const RANK: Record<DietFit, number> = { no: 0, unknown: 1, likely: 2, yes: 3 };

function haystack(r: Restaurant): string {
  return [r.name, r.cuisine, ...r.signatureDishes, r.description].join(" ").toLowerCase();
}
function cuisineAndDishes(r: Restaurant): string {
  return [r.cuisine, ...r.signatureDishes].join(" ").toLowerCase();
}

const MEAT_FISH =
  /steak|beef|pork|bacon|ham\b|sausage|wurst|würstel|chicken|duck|goose|lamb|kebab|kabab|bbq|barbecue|grill|burger|roast|meat|bak kut|tonkotsu|ramen|sashimi|sushi|seafood|fish|oyster|shrimp|crab|lobster|prawn|herring|anago|eel|tuna|salmon|cod|bacalhau|gyukatsu|tonkatsu|katsu|schnitzel|tartare|foie|gopchang|samgyeop|galbi|bulgogi|hot dog|pie\b|carnitas|taco|pastrami|brisket|nose-to-tail|smørrebrød/;
const VEG_POSITIVE =
  /vegetarian|vegan|plant-based|falafel|hummus|tofu|dosa|banana leaf|paneer|margherita|cacio e pepe|raclette|fondue|temple food|temple cuisine|salad|mezze|bagel|pancake|crêpe|crepe|galette|pizza|pasta|bakery|pastr|cafe|café|coffee|ice cream|gelato/;
const PORK_ALCOHOL =
  /pork|bacon|ham\b|prosciutto|sausage|wurst|würstel|lard|char siu|bak kut|tonkotsu|samgyeop|gopchang|chorizo|pancetta|guanciale|carbonara|amatriciana|gammon/;
const HALAL_CUISINE = /turkish|lebanese|middle eastern|emirati|arab|persian|iranian|syrian|palestinian|egyptian|malay|indian|pakistani|halal|gulf|levantine|afghan|moroccan/;
const GLUTEN_HEAVY = /pizza|pasta|bakery|bread|noodle|ramen|udon|soba|dumpling|pancake|crêpe|crepe|galette|sandwich|bagel|pastr|pie\b|schnitzel|tempura|dim sum|bao|bun|croissant|baklava|strudel|cake|toast/;

export function dietFit(r: Restaurant, need: DietaryNeed): DietFit {
  if (r.dietary?.includes(need)) return "yes";
  const all = haystack(r);
  const core = cuisineAndDishes(r);
  switch (need) {
    case "vegetarian":
      if (r.dietary && r.dietary.includes("vegan")) return "yes";
      if (/vegetarian|vegan|plant-based/.test(core + " " + r.name.toLowerCase())) return "yes";
      if (/falafel|hummus|dosa|banana leaf|temple (food|cuisine)|mezze|margherita|cacio e pepe|raclette|fondue/.test(core)) return "likely";
      if (MEAT_FISH.test(core) && !VEG_POSITIVE.test(core)) return "no";
      return VEG_POSITIVE.test(core) ? "likely" : "unknown";
    case "vegan":
      if (/vegan|plant-based/.test(core + " " + r.name.toLowerCase())) return "yes";
      if (/falafel|hummus|temple (food|cuisine)|banana leaf|dosa/.test(core)) return "likely";
      if (MEAT_FISH.test(core) || /cheese|raclette|fondue|cream|bagel|pancake|pastr|egg|dairy/.test(core)) return "no";
      return "unknown";
    case "halal":
      if (/halal/.test(all)) return "yes";
      if (PORK_ALCOHOL.test(core)) return "no";
      if (HALAL_CUISINE.test(r.cuisine.toLowerCase())) return "likely";
      return "unknown";
    case "gluten-free":
      if (/gluten[- ]free/.test(all)) return "yes";
      if (GLUTEN_HEAVY.test(core)) return "no";
      return "unknown";
  }
}

/** The weakest fit across every need the traveller listed. */
export function combinedDietFit(r: Restaurant, needs: DietaryNeed[]): DietFit {
  if (needs.length === 0) return "yes";
  let worst: DietFit = "yes";
  for (const need of needs) {
    const f = dietFit(r, need);
    if (RANK[f] < RANK[worst]) worst = f;
  }
  return worst;
}

export const dietRank = (f: DietFit) => RANK[f];

export function dietNote(fit: DietFit, needs: DietaryNeed[]): string | undefined {
  if (needs.length === 0) return undefined;
  const list = needs.join(", ");
  if (fit === "yes") return `Tagged as suitable for: ${list}. Still confirm with the venue.`;
  if (fit === "likely") return `Cuisine usually has ${list} options; confirm with the venue.`;
  if (fit === "unknown") return `Dietary fit (${list}) isn't verified for this place. Check the menu before you go.`;
  return undefined;
}
