import type { StopKind } from "../itinerary-engine";

const at = (h: number, m = 0) => h * 60 + m;

/**
 * The words for a meal that did not land in its usual hours. Opening hours decide when a venue can be visited, and
 * that can push "lunch" to 16:20 or "coffee" to 19:08; the stop is then called what it is rather than what the
 * slot was. Returns undefined when the plain label ("Lunch", "Coffee break"...) is accurate.
 */
export function mealSlotLabel(kind: StopKind, startMin: number): string | undefined {
  if (startMin >= 1440) return undefined; // past midnight: not a meal slot worth renaming
  switch (kind) {
    case "breakfast":
      return startMin > at(11) ? "Brunch" : undefined;
    case "lunch":
      return startMin > at(18) ? "Evening meal" : startMin > at(15, 30) ? "Late lunch" : undefined;
    case "coffee":
      return startMin > at(18, 30) ? "Evening drinks" : undefined;
    case "dinner":
      return startMin >= at(12) && startMin < at(18) ? "Early dinner" : undefined;
    default:
      return undefined;
  }
}
