import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import DayCard from "@/components/DayCard";
import { loadDestination } from "@/lib/data/catalog";
import { generateItinerary } from "@/lib/itinerary-engine";

const noop = () => undefined;

/** Markup of one stop row, found by its heading. */
function stopRow(markup: string, name: string): string {
  const rows = markup.split('<li class="stop ').slice(1);
  const row = rows.find((r) => r.includes(`<h4>${name}</h4>`));
  if (!row) throw new Error(`no stop called "${name}" in the markup`);
  return row;
}

describe("day card stop actions", () => {
  it("gives every day trip a Book or Details menu, even when it has no official or map link of its own", async () => {
    const tokyo = (await loadDestination("tokyo"))!;
    const itinerary = generateItinerary({ destination: tokyo, duration: 14, budget: "mid-range", travelStyle: "first-time", interests: ["food", "history"], seed: "sekai" });
    const trips = itinerary.days.flatMap((d) => d.stops.filter((s) => s.kind === "day-trip" && s.category === "dayTrip").map((s) => ({ day: d, stop: s })));
    expect(trips.length).toBeGreaterThan(0);
    const bare = trips.filter(({ stop }) => !stop.officialUrl && !stop.mapsUrl);
    expect(bare.length, "this city should have at least one day trip without its own links").toBeGreaterThan(0);
    for (const { day, stop } of bare) {
      const trip = { destination: tokyo, adults: 2, children: 0 };
      const markup = renderToStaticMarkup(<DayCard day={day} itinerary={itinerary} trip={trip} onRegenerate={noop} onSwap={noop} />);
      expect(stopRow(markup, stop.name), `"${stop.name}" should offer a Book or Details menu`).toContain("aria-haspopup");
    }
  });
});
