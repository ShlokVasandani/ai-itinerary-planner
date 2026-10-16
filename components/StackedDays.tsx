import type { GeneratedItinerary } from "@/lib/itinerary-engine";
import { moneyRange } from "@/lib/format";

/**
 * Pinned, stacked day cards. Pure CSS `position: sticky`: each card sticks a
 * little lower than the previous one, so later days slide over earlier ones as
 * the page scrolls. Nothing hijacks scrolling and no JavaScript is needed.
 */
export default function StackedDays({ itinerary }: { itinerary: GeneratedItinerary }) {
  return (
    <ol className="stack">
      {itinerary.days.map((day, i) => {
        const sights = day.stops.filter((s) => s.kind !== "transit" && s.kind !== "free-time").slice(0, 6);
        return (
          <li key={day.dayNumber} className="stack-card" style={{ ["--i" as string]: i }}>
            <div className="stack-card-head">
              <span className="stack-day">Day {day.dayNumber}</span>
              <h3>{day.title}</h3>
              <p>
                Around {day.neighborhoodFocus} · {day.walkingAndTransitMinutes} min moving between stops
              </p>
            </div>
            <ul className="stack-stops">
              {sights.map((s, j) => (
                <li key={j}>
                  <time>{s.time}</time>
                  <div>
                    <strong>{s.name}</strong>
                    {s.transportNote && <span>{s.transportNote}</span>}
                  </div>
                </li>
              ))}
            </ul>
            {day.cost.high > 0 && (
              <p className="stack-cost">
                About {moneyRange(day.cost.low, day.cost.high, day.cost.currency)} per person for planned entries and meals
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
