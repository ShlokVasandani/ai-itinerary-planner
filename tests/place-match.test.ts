import { describe, expect, it } from "vitest";
import { cityIndex, loadDestination } from "../lib/data/catalog";
import { placeOptions, resolvePlace } from "../lib/place-match";

const sydney = [
  { id: "bondi-coogee-walk", label: "Bondi to Coogee Coastal Walk" },
  { id: "x-bondi-to-coogee-coastal-walk", label: "Bondi to Coogee coastal walk" },
  { id: "opera-house", label: "Sydney Opera House" },
];

describe("resolvePlace", () => {
  it("picks the option whose label matches exactly, even when another differs only by case", () => {
    expect(resolvePlace(sydney, "Bondi to Coogee Coastal Walk")?.id).toBe("bondi-coogee-walk");
    expect(resolvePlace(sydney, "Bondi to Coogee coastal walk")?.id).toBe("x-bondi-to-coogee-coastal-walk");
  });

  it("is forgiving about case and spacing when only one option fits", () => {
    expect(resolvePlace(sydney, "  sydney opera house ")?.id).toBe("opera-house");
  });

  it("refuses to guess between two options that differ only by case", () => {
    expect(resolvePlace(sydney, "BONDI TO COOGEE COASTAL WALK")).toBeUndefined();
  });

  it("finds nothing for text that is not a place", () => {
    expect(resolvePlace(sydney, "Bondi")).toBeUndefined();
  });

  it("every place in every city resolves from its own name to itself", async () => {
    const bad: string[] = [];
    for (const c of cityIndex) {
      const options = placeOptions((await loadDestination(c.slug))!);
      for (const o of options) if (resolvePlace(options, o.label)?.id !== o.id) bad.push(`${c.slug}: "${o.label}" -> ${resolvePlace(options, o.label)?.id}`);
    }
    expect(bad).toEqual([]);
  });
});
