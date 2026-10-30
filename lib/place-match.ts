import type { Destination } from "./types";

export interface PlaceOption {
  id: string;
  label: string;
}

/** The places a traveller can name in "Must include" / "Skip these", one option per distinct name. */
export function placeOptions(d: Destination): PlaceOption[] {
  return [...d.landmarks, ...d.restaurants, ...d.cafes, ...d.experiences, ...d.nightlife, ...d.dayTrips]
    .map((p) => ({ id: p.id, label: p.name }))
    .filter((o, i, all) => all.findIndex((x) => x.label === o.label) === i);
}

/**
 * Turns what was typed into one of the options. An exact label always wins; otherwise case and surrounding
 * spaces are forgiven, but only when that leaves a single option. Two places whose names differ only by case
 * (Sydney has "Bondi to Coogee Coastal Walk" and "Bondi to Coogee coastal walk") are never confused with each other.
 */
export function resolvePlace(options: PlaceOption[], text: string): PlaceOption | undefined {
  const typed = text.trim();
  const exact = options.find((o) => o.label === typed);
  if (exact) return exact;
  const loose = options.filter((o) => o.label.toLowerCase() === typed.toLowerCase());
  return loose.length === 1 ? loose[0] : undefined;
}
