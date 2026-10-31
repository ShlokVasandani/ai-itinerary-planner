import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import TightTripNotice from "@/components/TightTripNotice";
import { loadDestination } from "@/lib/data/catalog";
import { generateItinerary, type PlannerInput } from "@/lib/itinerary-engine";
import { tripProblem } from "@/lib/trip-problem";

async function plan(extra: Partial<PlannerInput>) {
  const destination = (await loadDestination("lisbon"))!;
  return generateItinerary({ destination, duration: 1, budget: "mid-range", travelStyle: "first-time", interests: ["history"], ...extra });
}

describe("tripProblem", () => {
  it("is quiet for a plan that has sightseeing", async () => {
    expect(tripProblem(await plan({}))).toBeUndefined();
    expect(tripProblem(await plan({ arrivalFlightTime: "10:00", departureFlightTime: "20:00" }))).toBeUndefined();
    expect(tripProblem(await plan({ duration: 2, arrivalFlightTime: "23:15" }))).toBeUndefined();
  });

  it("explains a one-day trip squeezed between a landing and a flight, and says what to change", async () => {
    const p = tripProblem(await plan({ arrivalFlightTime: "14:00", departureFlightTime: "18:00" }))!;
    expect(p.title).toMatch(/too tight/i);
    expect(p.message).toContain("14:00");
    expect(p.message).toContain("18:00");
    expect(p.change).toEqual(["Trip length", "Landing on day 1", "Flight home, last day"]);
  });

  it("explains a landing that leaves no time on a one-day trip", async () => {
    const p = tripProblem(await plan({ arrivalFlightTime: "22:00" }))!;
    expect(p.message).toContain("22:00");
    expect(p.change).toEqual(["Trip length", "Landing on day 1"]);
  });

  it("explains a flight home too early for any sightseeing", async () => {
    const p = tripProblem(await plan({ departureFlightTime: "07:30" }))!;
    expect(p.message).toContain("07:30");
    expect(p.change).toEqual(["Trip length", "Flight home, last day"]);
  });

  it("covers a longer trip where both ends are squeezed", async () => {
    const p = tripProblem(await plan({ duration: 2, arrivalFlightTime: "23:15", departureFlightTime: "07:30" }))!;
    expect(p.change).toContain("Trip length");
  });
});

describe("TightTripNotice", () => {
  it("shows a friendly message instead of an empty plan", async () => {
    const problem = tripProblem(await plan({ arrivalFlightTime: "14:00", departureFlightTime: "18:00" }))!;
    const html = renderToStaticMarkup(<TightTripNotice problem={problem} />);
    expect(html).toContain('role="status"');
    expect(html).toContain("too tight for your flight times");
    for (const input of problem.change) expect(html).toContain(input);
    expect(html).not.toMatch(/day-card|stops/);
  });
});
