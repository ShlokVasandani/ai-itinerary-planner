import { sightseeingStops, type GeneratedItinerary } from "./itinerary-engine";

export interface TripProblem {
  title: string;
  message: string;
  /** The form fields to change, by their on-screen names. */
  change: string[];
}

const TRIP = "Trip length";
const LAND = "Landing on day 1";
const HOME = "Flight home, last day";

/**
 * A plan can be "valid" and still empty: with a flight cutoff or a late landing there may be no room for any
 * sightseeing at all, and the only stop is a placeholder ("Head to the airport", "Arrive, check in and rest").
 * That is not a plan, so say why and which inputs to change. Returns undefined for any plan with sightseeing.
 */
export function tripProblem(it: GeneratedItinerary): TripProblem | undefined {
  if (it.days.reduce((n, d) => n + sightseeingStops(d).length, 0) > 0) return undefined;
  const { duration, arrivalFlightTime: arrive, departureFlightTime: leave } = it.input;
  const title = "This trip is too tight for your flight times";
  if (arrive && leave) {
    return {
      title,
      message: `You land at ${arrive} and your flight home leaves at ${leave}. Allowing about 2½ hours after landing and a 3-hour cutoff before departure, there is no time left to see anything. Try more days, a later flight home, or an earlier landing.`,
      change: [TRIP, LAND, HOME],
    };
  }
  if (arrive) {
    return {
      title,
      message: `You land at ${arrive}, too late for sightseeing${duration === 1 ? " on a one-day trip" : ""}. Try more days or an earlier landing.`,
      change: [TRIP, LAND],
    };
  }
  if (leave) {
    return {
      title,
      message: `Your flight home leaves at ${leave}, so the day has to end 3 hours earlier, before there is time for anything. Try more days or a later flight home.`,
      change: [TRIP, HOME],
    };
  }
  return {
    title: "We could not fit any sightseeing into this trip",
    message: "Nothing matched your settings. Try more days, or remove some of the places you chose to skip.",
    change: [TRIP, "Skip these"],
  };
}
