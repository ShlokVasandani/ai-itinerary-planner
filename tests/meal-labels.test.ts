import { describe, expect, it } from "vitest";
import { mealSlotLabel } from "../lib/engine/meals";

const at = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3));

describe("mealSlotLabel", () => {
  it("returns nothing for a meal at a normal time", () => {
    expect(mealSlotLabel("breakfast", at("08:30"))).toBeUndefined();
    expect(mealSlotLabel("lunch", at("13:00"))).toBeUndefined();
    expect(mealSlotLabel("lunch", at("15:30"))).toBeUndefined();
    expect(mealSlotLabel("coffee", at("16:00"))).toBeUndefined();
    expect(mealSlotLabel("dinner", at("19:30"))).toBeUndefined();
  });
  it("calls a lunch after 15:30 a late lunch, and one after 18:00 an evening meal", () => {
    expect(mealSlotLabel("lunch", at("16:20"))).toBe("Late lunch");
    expect(mealSlotLabel("lunch", at("20:24"))).toBe("Evening meal");
  });
  it("calls a coffee after 18:30 evening drinks", () => {
    expect(mealSlotLabel("coffee", at("19:08"))).toBe("Evening drinks");
  });
  it("calls a breakfast after 11:00 brunch and a dinner before 18:00 an early dinner", () => {
    expect(mealSlotLabel("breakfast", at("11:40"))).toBe("Brunch");
    expect(mealSlotLabel("dinner", at("17:15"))).toBe("Early dinner");
  });
  it("ignores kinds that are not meals and times after midnight", () => {
    expect(mealSlotLabel("landmark", at("20:00"))).toBeUndefined();
    expect(mealSlotLabel("dinner", at("00:10") + 1440)).toBeUndefined();
  });
});
