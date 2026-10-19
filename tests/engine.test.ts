import { describe, expect, it } from "vitest";
import { destinations } from "../lib/data";
import {
  findClosedStops,
  generateItinerary,
  haversineKm,
  maxStopsForDay,
  regenerateDay,
  sightseeingStops,
  swapStop,
  type PlannerInput,
} from "../lib/itinerary-engine";
import { weekdayOf } from "../lib/engine/time";
import { combinedDietFit } from "../lib/engine/dietary";
import type { Restaurant } from "../lib/types";

const START = "2027-03-02"; // a Tuesday
const base = (slug: string, extra: Partial<PlannerInput> = {}): PlannerInput => ({
  destination: destinations.find((d) => d.slug === slug)!,
  duration: 3,
  budget: "mid-range",
  travelStyle: "first-time",
  interests: ["history", "food"],
  startDate: START,
  ...extra,
});

const nextDate = (iso: string, n: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

describe("data catalog", () => {
  it("has 50 destinations with the new meta", () => {
    expect(destinations).toHaveLength(50);
    for (const d of destinations) {
      expect(d.currency).toMatch(/^[A-Z]{3}$/);
      expect(d.seasons).toHaveLength(12);
      expect(d.localPhrases).toHaveLength(8);
      expect(d.airportCodes.length).toBeGreaterThan(0);
    }
  });
});

describe("geo", () => {
  it("haversine is about right between the Eiffel Tower and the Louvre", () => {
    const km = haversineKm({ lat: 48.8584, lng: 2.2945 }, { lat: 48.8606, lng: 2.3376 });
    expect(km).toBeGreaterThan(3.0);
    expect(km).toBeLessThan(3.5);
  });
});

describe("every city generates a valid 3-day plan", () => {
  for (const d of destinations) {
    it(d.slug, () => {
      const it = generateItinerary(base(d.slug));
      expect(it.days).toHaveLength(3);
      for (const day of it.days) {
        expect(day.stops.length).toBeGreaterThan(0);
        const times = day.stops.map((s) => s.time);
        const mins = times.map((t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3)));
        expect([...mins].sort((a, b) => a - b)).toEqual(mins);
        expect(day.date).toBeDefined();
      }
      const ids = it.days.flatMap((x) => x.stops.filter((s) => s.category !== "dayTrip").map((s) => s.refId).filter(Boolean));
      expect(new Set(ids).size).toBe(ids.length);
      expect(it.days.some((x) => x.stops.some((s) => s.category === "landmark"))).toBe(true);
    });
  }
});

describe("trip length", () => {
  it("supports 1 to 14 days and keeps presets working", () => {
    for (const n of [1, 2, 3, 4, 5, 6, 7, 10, 14]) {
      const it = generateItinerary(base("tokyo", { duration: n }));
      expect(it.days).toHaveLength(n);
    }
    expect(generateItinerary(base("paris", { duration: 99 })).days).toHaveLength(14);
    expect(generateItinerary(base("paris", { duration: 0 })).days).toHaveLength(1);
  });

  it("derives the length from start and end dates", () => {
    const it = generateItinerary(base("rome", { duration: 3, startDate: "2027-05-10", endDate: "2027-05-16" }));
    expect(it.days).toHaveLength(7);
    expect(it.days[0].date).toBe("2027-05-10");
    expect(it.days[6].date).toBe("2027-05-16");
  });
});

describe("opening hours", () => {
  it("never schedules a closed venue, whatever weekday the trip starts", () => {
    for (const d of destinations) {
      for (let offset = 0; offset < 7; offset++) {
        const it = generateItinerary(base(d.slug, { duration: 14, startDate: nextDate(START, offset) }));
        expect(findClosedStops(it), `${d.slug} +${offset}`).toEqual([]);
      }
    }
  });

  it("moves a venue away from its closed weekday", () => {
    const d = destinations.find((x) => x.slug === "tokyo")!;
    const withClosure = d.landmarks.find((l) => l.closedDays && l.closedDays.length > 0);
    if (!withClosure) return; // depends on verified data being present
    const closedWeekday = withClosure.closedDays![0];
    const offset = (closedWeekday - weekdayOf(START) + 7) % 7;
    const it = generateItinerary(base("tokyo", { duration: 4, startDate: nextDate(START, offset), mustInclude: [withClosure.id] }));
    for (const day of it.days) {
      if (day.weekday === closedWeekday) {
        expect(day.stops.some((s) => s.refId === withClosure.id)).toBe(false);
      }
    }
  });
});

describe("pace caps", () => {
  for (const pace of ["relaxed", "balanced", "packed"] as const) {
    it(`${pace}: no day exceeds its cap`, () => {
      for (const d of destinations) {
        for (const extra of [{}, { hasKids: true }, { mobility: "limited" as const }, { interests: ["shopping" as const], travelStyle: "shopping" as const }]) {
          const it = generateItinerary(base(d.slug, { duration: 7, pace, ...extra }));
          it.days.forEach((day, i) => {
            expect(sightseeingStops(day).length, `${d.slug} day ${i + 1}`).toBeLessThanOrEqual(maxStopsForDay(it.input, i));
          });
        }
      }
    });
  }

  it("relaxed plans fewer sights than packed", () => {
    const count = (pace: "relaxed" | "packed") =>
      generateItinerary(base("paris", { duration: 7, pace })).days.reduce((n, day) => n + sightseeingStops(day).length, 0);
    expect(count("relaxed")).toBeLessThan(count("packed"));
  });
});

describe("mustInclude / avoid", () => {
  it("always includes must-include places and never includes avoided ones", () => {
    for (const d of destinations) {
      const open = (x: { closedDays?: number[] }) => !x.closedDays || x.closedDays.length === 0;
      const landmarks = d.landmarks.filter(open).slice(-3).map((l) => l.id);
      const restaurant = d.restaurants.filter(open).find((r) => r.mealFor.includes("dinner") || r.mealFor.includes("any"))!;
      const cafe = d.cafes.filter(open)[0];
      const avoided = d.landmarks.filter(open)[0].id;
      const must = [...landmarks, restaurant.id, cafe.id];
      const it = generateItinerary(base(d.slug, { duration: 5, mustInclude: must, avoid: [avoided] }));
      const ids = new Set(it.days.flatMap((x) => x.stops.map((s) => s.refId)));
      for (const id of must) expect(ids.has(id), `${d.slug}: ${id}`).toBe(true);
      expect(ids.has(avoided)).toBe(false);
    }
  });

  it("warns instead of silently dropping an unknown id", () => {
    const it = generateItinerary(base("paris", { mustInclude: ["not-a-real-id"] }));
    expect(it.warnings.join(" ")).toMatch(/not-a-real-id/);
  });
});

describe("costs", () => {
  it("day and trip totals add up", () => {
    for (const slug of ["tokyo", "paris", "bangkok", "new-york-city"]) {
      const it = generateItinerary(base(slug, { duration: 5 }));
      let tripLikely = 0;
      let tripLow = 0;
      let tripHigh = 0;
      for (const day of it.days) {
        let likely = 0;
        let low = 0;
        let high = 0;
        for (const s of day.stops) {
          if (s.cost?.known) {
            likely += s.cost.likely;
            low += s.cost.min;
            high += s.cost.max;
          }
        }
        expect(day.cost.likely).toBe(likely);
        expect(day.cost.low).toBe(low);
        expect(day.cost.high).toBe(high);
        expect(day.cost.low).toBeLessThanOrEqual(day.cost.likely);
        expect(day.cost.likely).toBeLessThanOrEqual(day.cost.high);
        tripLikely += likely;
        tripLow += low;
        tripHigh += high;
      }
      expect(it.cost.likely).toBe(tripLikely);
      expect(it.cost.low).toBe(tripLow);
      expect(it.cost.high).toBe(tripHigh);
      expect(it.cost.currency).toBe(it.input.destination.currency);
    }
  });

  it("multiplies by group size for the party total", () => {
    const solo = generateItinerary(base("tokyo", { groupSize: 1 }));
    const four = generateItinerary(base("tokyo", { groupSize: 4 }));
    expect(four.groupLikely).toBe(solo.cost.likely * 4);
  });

  it("reports a budget fit status", () => {
    const it = generateItinerary(base("tokyo"));
    expect(["under", "on-target", "over"]).toContain(it.budgetFit.status);
  });
});

describe("determinism", () => {
  it("same input gives identical output", () => {
    for (const slug of ["tokyo", "lisbon", "dubai"]) {
      const a = generateItinerary(base(slug, { duration: 7, seed: "abc", pace: "packed" }));
      const b = generateItinerary(base(slug, { duration: 7, seed: "abc", pace: "packed" }));
      expect(JSON.stringify(a.days)).toBe(JSON.stringify(b.days));
      expect(JSON.stringify(a.cost)).toBe(JSON.stringify(b.cost));
    }
  });

  it("different seeds can give different plans", () => {
    const a = generateItinerary(base("london", { duration: 7, seed: "one" }));
    const b = generateItinerary(base("london", { duration: 7, seed: "two" }));
    expect(JSON.stringify(a.days)).not.toBe(JSON.stringify(b.days));
  });
});

describe("arrival and departure", () => {
  it("keeps day 1 light and ends the last day 3 h before the flight", () => {
    const it = generateItinerary(
      base("paris", { duration: 4, pace: "packed", arrivalFlightTime: "09:00", departureFlightTime: "18:00" })
    );
    expect(it.days[0].isArrivalDay).toBe(true);
    expect(sightseeingStops(it.days[0]).length).toBeLessThanOrEqual(2);
    const first = it.days[0].stops[0];
    expect(Number(first.time.slice(0, 2)) * 60 + Number(first.time.slice(3))).toBeGreaterThanOrEqual(11 * 60 + 30);
    const last = it.days[3];
    for (const s of last.stops) {
      const end = s.endTime ?? s.time;
      expect(Number(end.slice(0, 2)) * 60 + Number(end.slice(3))).toBeLessThanOrEqual(15 * 60);
    }
  });
});

describe("editing", () => {
  it("regenerateDay changes only that day, deterministically", () => {
    const it = generateItinerary(base("barcelona", { duration: 5 }));
    const a = regenerateDay(it, 2, "x");
    const b = regenerateDay(it, 2, "x");
    expect(JSON.stringify(a.days)).toBe(JSON.stringify(b.days));
    for (const n of [1, 3, 4, 5]) {
      expect(JSON.stringify(a.days[n - 1])).toBe(JSON.stringify(it.days[n - 1]));
    }
    const ids = a.days.flatMap((d) => d.stops.filter((s) => s.category !== "dayTrip").map((s) => s.refId).filter(Boolean));
    expect(new Set(ids).size).toBe(ids.length);
    expect(findClosedStops(a)).toEqual([]);
  });

  it("swapStop lists candidates and applies a swap", () => {
    const it = generateItinerary(base("rome", { duration: 3 }));
    const day = it.days[1];
    const idx = day.stops.findIndex((s) => s.category === "landmark");
    expect(idx).toBeGreaterThanOrEqual(0);
    const { candidates } = swapStop(it, day.dayNumber, idx);
    expect(candidates.length).toBeGreaterThan(0);
    const chosen = candidates[0];
    const swapped = swapStop(it, day.dayNumber, idx, chosen.id);
    expect(swapped.error).toBeUndefined();
    const ids = swapped.itinerary.days[1].stops.map((s) => s.refId);
    expect(ids).toContain(chosen.id);
    expect(findClosedStops(swapped.itinerary)).toEqual([]);
  });
});

describe("dietary", () => {
  it("never picks a restaurant that rules out the need", () => {
    for (const need of ["vegetarian", "vegan", "halal", "gluten-free"] as const) {
      const it = generateItinerary(base("tokyo", { duration: 5, dietary: [need] }));
      const d = it.input.destination;
      for (const day of it.days) {
        for (const s of day.stops) {
          if (s.category !== "restaurant") continue;
          const r = d.restaurants.find((x) => x.id === s.refId) as Restaurant;
          expect(combinedDietFit(r, [need])).not.toBe("no");
        }
      }
    }
  });
});

describe("late arrival", () => {
  it("never wraps past midnight", () => {
    const it = generateItinerary(base("new-york-city", { duration: 3, arrivalFlightTime: "22:30" }));
    expect(it.days[0].stops).toHaveLength(1);
    expect(it.days[0].stops[0].name).toMatch(/rest/i);
    expect(findClosedStops(it)).toEqual([]);
  });
});
