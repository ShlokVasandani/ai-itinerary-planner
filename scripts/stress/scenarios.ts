/**
 * The scenarios run against every city. Groups A-H are independent plans; group I (propagation) is a
 * chain of single-input changes on one page and lives in propagation.ts.
 *
 *  A  length        1, 3, 7 and 14 days, undated
 *  B  dates         weekday start, weekend start, and a range that includes the day most venues close
 *  C  travellers    1, 2 and the maximum (12 adults + 8 children)
 *  D  interests     each of the 12 alone, then two seeded combinations
 *  E  diet/walking  each dietary need, a combination, and limited mobility
 *  F  styles        each of the 12 travel styles
 *  G  must / skip   real places from the city, undated and across the closed day
 *  H  flights       arrival only, departure only, both, and a one-day trip with both
 *
 * Every random choice comes from rng(`stress-v1:${slug}`), so a given city always gets the same scenarios.
 */
import type { Destination, DietaryNeed } from "../../lib/types";
import { ALL_INTERESTS, ALL_TRAVEL_STYLES } from "../../lib/format";
import { addDays, weekdayOf } from "../../lib/engine/time";
import { BASE, rng, with_, type StressInput } from "./model";
import { busiestClosedWeekday, placeOptions, pools } from "./data";

export interface Scenario {
  id: string;
  group: string;
  label: string;
  input: StressInput;
  /** Take the per-city screenshot after this plan. */
  screenshot?: boolean;
}

export const GROUPS: Record<string, string> = {
  A: "length",
  B: "dates",
  C: "travellers",
  D: "interests",
  E: "diet and walking",
  F: "travel styles",
  G: "must include / skip",
  H: "flight times",
};

const DIETS: DietaryNeed[] = ["vegetarian", "vegan", "halal", "gluten-free"];

export function buildScenarios(dest: Destination): Scenario[] {
  const slug = dest.slug;
  const r = rng(`stress-v1:${slug}`);
  const out: Scenario[] = [];
  const add = (group: string, id: string, label: string, patch: Partial<StressInput>, screenshot = false) =>
    out.push({ id: `${group}:${id}`, group, label, input: with_(slug, patch), screenshot });

  // A: length
  for (const n of [1, 3, 7, 14]) add("A", `${n}d`, `${n}-day trip, undated`, { duration: n }, n === 3);

  // B: dates. Tuesdays from March 2027 on, so every range is in the future and the calendar accepts them.
  const tuesday = addDays("2027-03-02", 7 * r.int(0, 30));
  add("B", "weekday-start", `Tue to Fri, from ${tuesday}`, { start: tuesday, end: addDays(tuesday, 3) });
  const saturday = addDays(tuesday, 4);
  add("B", "weekend-start", `Sat to Mon, from ${saturday}`, { start: saturday, end: addDays(saturday, 2) });
  const closed = busiestClosedWeekday(dest);
  let day = tuesday;
  for (let i = 0; i < 7 && weekdayOf(day) !== (closed.weekday + 6) % 7; i++) day = addDays(day, 1);
  add("B", "closed-day", `3 days around the busiest closing day (weekday ${closed.weekday}, ${closed.closed} venues closed), from ${day}`, {
    start: day,
    end: addDays(day, 2),
  });

  // C: travellers (3-day undated so only the party size varies)
  add("C", "1-pax", "1 traveller", { duration: 3, adults: 1 });
  add("C", "2-pax", "2 travellers", { duration: 3, adults: 2 });
  add("C", "max-pax", "12 adults + 8 children", { duration: 3, adults: 12, children: 8 });

  // D: interests (2 days keeps 600 plans affordable and still shows what each interest selects)
  for (const i of ALL_INTERESTS) add("D", i, `interest: ${i} only`, { duration: 2, interests: [i] });
  add("D", "combo-3", "3 interests together", { duration: 3, interests: r.sample(ALL_INTERESTS, 3) });
  add("D", "combo-5", "5 interests together", { duration: 3, interests: r.sample(ALL_INTERESTS, 5) });

  // E: diet and mobility
  for (const d of DIETS) add("E", d, `dietary: ${d}`, { duration: 2, dietary: [d] });
  add("E", "vegan+gluten-free", "dietary: vegan and gluten-free", { duration: 2, dietary: ["vegan", "gluten-free"] });
  add("E", "limited-mobility", "limited mobility", { duration: 3, mobility: "limited" });

  // F: travel styles
  for (const s of ALL_TRAVEL_STYLES) add("F", s, `style: ${s}`, { duration: 2, travelStyle: s });

  // G: must include / skip, with names that are unique in the picker (it de-duplicates by name)
  const opts = placeOptions(dest);
  const unique = (id: string) => opts.filter((o) => o.label === opts.find((x) => x.id === id)?.label).length === 1 && opts.some((o) => o.id === id);
  const p = pools(dest);
  const landmarks = p.landmark.filter((l) => unique(l.id));
  const mustSee = landmarks.filter((l) => l.priority === "must-see");
  const must = [
    ...r.sample(landmarks, 2).map((l) => l.id),
    ...r.sample(p.restaurant.filter((x) => unique(x.id)), 1).map((x) => x.id),
    ...r.sample(p.experience.filter((x) => unique(x.id)), 1).map((x) => x.id),
  ];
  const skip = r.sample(mustSee.filter((l) => !must.includes(l.id)), 3).map((l) => l.id);
  add("G", "undated", "must include 4 places, skip 3 must-sees", { duration: 4, mustInclude: must, avoid: skip });
  add("G", "closed-day", "same, across the closing day", { start: day, end: addDays(day, 2), mustInclude: must, avoid: skip });

  // H: flight times
  add("H", "arrive-only", "landing 09:10 on day 1", { duration: 3, arrivalTime: "09:10" });
  add("H", "arrive-late", "landing 23:15 on day 1", { duration: 2, arrivalTime: "23:15" });
  add("H", "depart-only", "flight home 07:30 on the last day", { duration: 2, departureTime: "07:30" });
  add("H", "both-1day", "1-day trip, landing 10:00 and flight 20:00", { duration: 1, arrivalTime: "10:00", departureTime: "20:00" });

  return out;
}

export { BASE };
