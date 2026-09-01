import type {
  Destination,
  Interest,
  TravelStyle,
  Place,
  Restaurant,
  Cafe,
  Priority,
  Experience,
  DayTrip,
} from "./types";

export type TripDuration = 3 | 5 | 7;

export interface PlannerInput {
  destination: Destination;
  duration: TripDuration;
  budget: "budget" | "mid-range" | "luxury";
  travelStyle: TravelStyle;
  interests: Interest[];
}

export type StopKind =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "coffee"
  | "landmark"
  | "experience"
  | "shopping"
  | "nightlife"
  | "transit"
  | "day-trip"
  | "free-time";

export interface TimelineStop {
  time: string;
  endTime?: string;
  kind: StopKind;
  name: string;
  neighborhood: string;
  description: string;
  whyGo?: string;
  priority?: Priority;
  approxCost?: string;
  durationLabel: string;
  transportNote?: string;
  reservationNote?: string;
}

export interface ItineraryDay {
  dayNumber: number;
  title: string;
  neighborhoodFocus: string;
  stops: TimelineStop[];
}

export interface GeneratedItinerary {
  destination: string;
  duration: TripDuration;
  days: ItineraryDay[];
  unusedHighlights: string[]; // "if you have time" items that didn't fit
}

const PRIORITY_WEIGHT: Record<Priority, number> = {
  "must-see": 4,
  "highly-recommended": 3,
  "interest-specific": 2,
  "if-you-have-time": 1,
};

const PRIORITY_TEXT: Record<Priority, string> = {
  "must-see": "Must-see",
  "highly-recommended": "Highly recommended",
  "interest-specific": "Interest pick",
  "if-you-have-time": "If you have time",
};

export function priorityLabel(p: Priority): string {
  return PRIORITY_TEXT[p];
}

const STYLE_INTEREST_BOOST: Partial<Record<TravelStyle, Interest[]>> = {
  foodie: ["food", "cafes"],
  luxury: ["luxury", "shopping"],
  budget: [],
  couple: ["photography", "culture"],
  friends: ["nightlife", "adventure"],
  family: ["nature", "culture"],
  relaxed: ["cafes", "nature"],
  adventure: ["adventure", "nature"],
  shopping: ["shopping"],
  "culture-history": ["history", "culture", "art"],
  nightlife: ["nightlife"],
  "first-time": ["history", "culture", "photography"],
};

function score(interestTags: Interest[], priority: Priority, interests: Interest[], style: TravelStyle): number {
  let s = PRIORITY_WEIGHT[priority] * 10;
  const boosted = new Set([...(interests || []), ...(STYLE_INTEREST_BOOST[style] || [])]);
  for (const tag of interestTags) if (boosted.has(tag)) s += 6;
  return s;
}

function budgetToPriceLevels(budget: PlannerInput["budget"]): string[] {
  if (budget === "budget") return ["$", "$$"];
  if (budget === "luxury") return ["$$", "$$$", "$$$$"];
  return ["$", "$$", "$$$"];
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor((total % (24 * 60)) / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function durationLabel(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

/**
 * Groups landmarks/experiences by neighborhood and ranks each neighborhood by
 * the combined score of its contents, so each day of the trip stays
 * geographically coherent instead of zig-zagging across the city.
 */
function rankNeighborhoods(destination: Destination, interests: Interest[], style: TravelStyle) {
  const byNeighborhood = new Map<string, { items: Place[]; total: number }>();
  for (const landmark of destination.landmarks) {
    const entry = byNeighborhood.get(landmark.neighborhood) || { items: [], total: 0 };
    entry.items.push(landmark);
    entry.total += score(landmark.interestTags, landmark.priority, interests, style);
    byNeighborhood.set(landmark.neighborhood, entry);
  }
  return [...byNeighborhood.entries()]
    .map(([neighborhood, data]) => ({
      neighborhood,
      items: data.items.sort(
        (a, b) => score(b.interestTags, b.priority, interests, style) - score(a.interestTags, a.priority, interests, style)
      ),
      total: data.total,
    }))
    .sort((a, b) => b.total - a.total);
}

function pickRestaurant(
  destination: Destination,
  neighborhood: string,
  meal: "breakfast" | "lunch" | "dinner",
  used: Set<string>,
  budget: PlannerInput["budget"],
  interests: Interest[],
  style: TravelStyle
): Restaurant | undefined {
  const levels = budgetToPriceLevels(budget);
  const candidates = destination.restaurants
    .filter((r) => !used.has(r.id) && (r.mealFor.includes(meal) || r.mealFor.includes("any")))
    .sort((a, b) => {
      const aSameHood = a.neighborhood === neighborhood ? 50 : 0;
      const bSameHood = b.neighborhood === neighborhood ? 50 : 0;
      const aBudget = a.priceLevel && levels.includes(a.priceLevel) ? 20 : 0;
      const bBudget = b.priceLevel && levels.includes(b.priceLevel) ? 20 : 0;
      return (
        bSameHood + bBudget + score(b.interestTags, b.priority, interests, style) -
        (aSameHood + aBudget + score(a.interestTags, a.priority, interests, style))
      );
    });
  return candidates[0] || destination.restaurants.find((r) => r.mealFor.includes(meal) && !used.has(r.id));
}

function pickCafe(destination: Destination, neighborhood: string, used: Set<string>): Cafe | undefined {
  const candidates = destination.cafes
    .filter((c) => !used.has(c.id))
    .sort((a, b) => (a.neighborhood === neighborhood ? -1 : 1));
  return candidates[0];
}

function pickExperience(
  destination: Destination,
  used: Set<string>,
  interests: Interest[],
  style: TravelStyle,
  eveningOnly = false
): Experience | undefined {
  const wantsNightlife = interests.includes("nightlife") || style === "nightlife" || style === "friends";
  const pool = destination.experiences
    .filter((e) => !used.has(e.name))
    .filter((e) => (eveningOnly ? true : true))
    .sort((a, b) => score(b.interestTags, b.priority, interests, style) - score(a.interestTags, a.priority, interests, style));
  if (eveningOnly && wantsNightlife) {
    const nightlifeFirst = pool.find((e) => e.interestTags.includes("nightlife"));
    if (nightlifeFirst) return nightlifeFirst;
  }
  return pool[0];
}

const DAY_TITLES = [
  "First impressions",
  "Into the neighborhoods",
  "Culture and landmarks",
  "A different pace",
  "Local flavor day",
  "Further afield",
  "One last look",
];

export function generateItinerary(input: PlannerInput): GeneratedItinerary {
  const { destination, duration, budget, travelStyle, interests } = input;
  const rankedHoods = rankNeighborhoods(destination, interests, travelStyle);
  const usedLandmarks = new Set<string>();
  const usedRestaurants = new Set<string>();
  const usedCafes = new Set<string>();
  const usedExperiences = new Set<string>();

  const includeDayTrip = duration >= 5 && destination.dayTrips.length > 0;
  const dayTripDayIndex = includeDayTrip ? duration - 1 : -1; // last day, if applicable
  const coreDays = includeDayTrip ? duration - 1 : duration;

  const days: ItineraryDay[] = [];

  for (let d = 0; d < coreDays; d++) {
    const hoodBlock = rankedHoods[d % rankedHoods.length];
    const neighborhood = hoodBlock?.neighborhood || destination.neighborhoods[0]?.name || destination.city;
    const available = (hoodBlock?.items || destination.landmarks).filter((l) => !usedLandmarks.has(l.id));
    const fallbackPool = destination.landmarks.filter((l) => !usedLandmarks.has(l.id));
    const pool = available.length > 0 ? available : fallbackPool;

    // Pick up to 2 landmarks for the morning/early-afternoon block, avoiding
    // an unrealistic day by capping total sightseeing time.
    const chosen: Place[] = [];
    let totalMinutes = 0;
    for (const item of pool) {
      if (chosen.length >= 2) break;
      if (totalMinutes + item.suggestedDurationMin > 300) continue;
      chosen.push(item);
      totalMinutes += item.suggestedDurationMin;
      usedLandmarks.add(item.id);
    }
    if (chosen.length === 0 && pool[0]) {
      chosen.push(pool[0]);
      usedLandmarks.add(pool[0].id);
    }

    const stops: TimelineStop[] = [];
    let clock = "08:30";

    const breakfast = pickRestaurant(destination, neighborhood, "breakfast", usedRestaurants, budget, interests, travelStyle);
    if (breakfast) {
      usedRestaurants.add(breakfast.id);
      stops.push({
        time: clock,
        endTime: addMinutes(clock, 60),
        kind: "breakfast",
        name: breakfast.name,
        neighborhood: breakfast.neighborhood,
        description: `${breakfast.description} Signature: ${breakfast.signatureDishes.slice(0, 2).join(", ")}.`,
        priority: breakfast.priority,
        approxCost: breakfast.approxCost,
        durationLabel: "45–60 min",
        reservationNote: breakfast.reservationNote,
      });
      clock = addMinutes(clock, 65);
    }

    chosen.forEach((landmark, idx) => {
      if (idx > 0) {
        stops.push({
          time: clock,
          kind: "transit",
          name: `Walk / short ride to ${landmark.name}`,
          neighborhood,
          description: "Short local transfer — check the transport section for the best option.",
          durationLabel: "15–20 min",
        });
        clock = addMinutes(clock, 20);
      }
      stops.push({
        time: clock,
        endTime: addMinutes(clock, landmark.suggestedDurationMin),
        kind: "landmark",
        name: landmark.name,
        neighborhood: landmark.neighborhood,
        description: landmark.description,
        whyGo: landmark.whyGo,
        priority: landmark.priority,
        approxCost: landmark.approxCost,
        durationLabel: durationLabel(landmark.suggestedDurationMin),
        reservationNote: landmark.reservationNote,
      });
      clock = addMinutes(clock, landmark.suggestedDurationMin);
    });

    // Lunch
    clock = clock < "12:00" ? "12:15" : addMinutes(clock, 10);
    const lunch = pickRestaurant(destination, neighborhood, "lunch", usedRestaurants, budget, interests, travelStyle);
    if (lunch) {
      usedRestaurants.add(lunch.id);
      stops.push({
        time: clock,
        endTime: addMinutes(clock, 75),
        kind: "lunch",
        name: lunch.name,
        neighborhood: lunch.neighborhood,
        description: `${lunch.description} Signature: ${lunch.signatureDishes.slice(0, 2).join(", ")}.`,
        priority: lunch.priority,
        approxCost: lunch.approxCost,
        durationLabel: "1–1.25 hr",
        reservationNote: lunch.reservationNote,
      });
      clock = addMinutes(clock, 80);
    }

    // Afternoon: one more landmark/experience if the day has room, else shopping/cafe
    const afternoonPool = pool.filter((l) => !usedLandmarks.has(l.id));
    const wantsShopping = interests.includes("shopping") || travelStyle === "shopping";
    if (afternoonPool[0] && chosen.length < 2 && totalMinutes < 240) {
      const item = afternoonPool[0];
      usedLandmarks.add(item.id);
      stops.push({
        time: clock,
        endTime: addMinutes(clock, item.suggestedDurationMin),
        kind: "landmark",
        name: item.name,
        neighborhood: item.neighborhood,
        description: item.description,
        whyGo: item.whyGo,
        priority: item.priority,
        approxCost: item.approxCost,
        durationLabel: durationLabel(item.suggestedDurationMin),
        reservationNote: item.reservationNote,
      });
      clock = addMinutes(clock, item.suggestedDurationMin + 15);
    } else if (wantsShopping && destination.shopping.length > 0) {
      const spot = destination.shopping[d % destination.shopping.length];
      stops.push({
        time: clock,
        kind: "shopping",
        name: spot.name,
        neighborhood: spot.neighborhood,
        description: spot.description,
        durationLabel: "1–1.5 hr",
      });
      clock = addMinutes(clock, 90);
    }

    // Coffee / free-time break
    const cafe = pickCafe(destination, neighborhood, usedCafes);
    clock = clock < "15:00" ? "15:30" : addMinutes(clock, 10);
    if (cafe) {
      usedCafes.add(cafe.id);
      stops.push({
        time: clock,
        endTime: addMinutes(clock, 45),
        kind: "coffee",
        name: cafe.name,
        neighborhood: cafe.neighborhood,
        description: `${cafe.description} Try: ${cafe.specialty}.`,
        priority: cafe.priority,
        durationLabel: "30–45 min",
      });
      clock = addMinutes(clock, 50);
    } else {
      stops.push({
        time: clock,
        kind: "free-time",
        name: "Free time to wander",
        neighborhood,
        description: "Unscheduled time to explore side streets, rest, or revisit a favorite spot.",
        durationLabel: "45–60 min",
      });
      clock = addMinutes(clock, 60);
    }

    // Dinner
    clock = clock < "19:00" ? "19:30" : addMinutes(clock, 10);
    const dinnerHood = rankedHoods[(d + 1) % rankedHoods.length]?.neighborhood || neighborhood;
    const dinner =
      pickRestaurant(destination, neighborhood, "dinner", usedRestaurants, budget, interests, travelStyle) ||
      pickRestaurant(destination, dinnerHood, "dinner", usedRestaurants, budget, interests, travelStyle);
    if (dinner) {
      usedRestaurants.add(dinner.id);
      stops.push({
        time: clock,
        endTime: addMinutes(clock, 90),
        kind: "dinner",
        name: dinner.name,
        neighborhood: dinner.neighborhood,
        description: `${dinner.description} Signature: ${dinner.signatureDishes.slice(0, 2).join(", ")}.`,
        priority: dinner.priority,
        approxCost: dinner.approxCost,
        durationLabel: "1.5 hr",
        reservationNote: dinner.reservationNote,
      });
      clock = addMinutes(clock, 100);
    }

    // Evening activity
    const evening = pickExperience(destination, usedExperiences, interests, travelStyle, true);
    const wantsNightOut = interests.includes("nightlife") || travelStyle === "nightlife" || travelStyle === "friends";
    if (evening && (wantsNightOut || d === 0 || d === coreDays - 1)) {
      usedExperiences.add(evening.name);
      stops.push({
        time: clock,
        kind: evening.interestTags.includes("nightlife") ? "nightlife" : "experience",
        name: evening.name,
        neighborhood,
        description: evening.description,
        whyGo: evening.whyGo,
        priority: evening.priority,
        approxCost: evening.approxCost,
        durationLabel: evening.duration,
        reservationNote: evening.bookingNote,
      });
    } else if (destination.nightlife[0] && wantsNightOut) {
      const spot = destination.nightlife[d % destination.nightlife.length];
      stops.push({
        time: clock,
        kind: "nightlife",
        name: spot.name,
        neighborhood: spot.neighborhood,
        description: spot.description,
        durationLabel: "1.5–2 hr",
        approxCost: spot.priceLevel,
      });
    } else {
      stops.push({
        time: clock,
        kind: "free-time",
        name: "Relaxed evening",
        neighborhood,
        description: "No fixed plans — a good night for an early rest or a quiet walk back to your stay.",
        durationLabel: "open",
      });
    }

    days.push({
      dayNumber: d + 1,
      title: DAY_TITLES[d % DAY_TITLES.length],
      neighborhoodFocus: neighborhood,
      stops,
    });
  }

  // Day-trip day, if applicable
  if (includeDayTrip) {
    const trip: DayTrip =
      destination.dayTrips.sort((a, b) => (a.suggestedDuration === "full-day" ? -1 : 1))[0] || destination.dayTrips[0];
    const stops: TimelineStop[] = [
      {
        time: "07:30",
        kind: "day-trip",
        name: `Depart for ${trip.name}`,
        neighborhood: "Day trip",
        description: trip.howToGetThere,
        durationLabel: trip.travelTime,
        transportNote: trip.travelTime,
      },
      {
        time: "09:00",
        kind: "day-trip",
        name: trip.name,
        neighborhood: "Day trip",
        description: trip.description,
        whyGo: trip.worthItFor.join("; "),
        durationLabel: trip.suggestedDuration === "full-day" ? "Full day" : "Half day",
      },
      {
        time: "18:00",
        kind: "transit",
        name: `Return to ${destination.city}`,
        neighborhood: "Day trip",
        description: "Head back into the city — a light dinner near your hotel is an easy way to close the day.",
        durationLabel: trip.travelTime,
      },
    ];
    days.push({
      dayNumber: dayTripDayIndex + 1,
      title: `Day trip: ${trip.name}`,
      neighborhoodFocus: trip.name,
      stops,
    });
  }

  const unusedHighlights = destination.landmarks
    .filter((l) => !usedLandmarks.has(l.id) && (l.priority === "must-see" || l.priority === "highly-recommended"))
    .map((l) => l.name);

  return { destination: destination.city, duration, days, unusedHighlights };
}
