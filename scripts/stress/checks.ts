/**
 * Invariants over a generated plan, checked against the raw city data rather than against the engine's own
 * bookkeeping: dates, opening hours, times, interests, dietary fit, skip/must, prices and map coordinates.
 * Pure functions: no browser involved. DOM-versus-engine comparison lives in dom.ts.
 */
import type { Destination, Interest } from "../../lib/types";
import type { GeneratedItinerary, ItineraryDay, TimelineStop } from "../../lib/itinerary-engine";
import { addDays, diffDays, windowsFor, weekdayOf } from "../../lib/engine/time";
import { combinedDietFit } from "../../lib/engine/dietary";
import type { Restaurant } from "../../lib/types";
import { cityCentre, km, pools, recordFor, type AnyRec } from "./data";
import type { Failure, StressInput } from "./model";

const mins = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const hm = (n: number) => `${String(Math.floor((n % 1440) / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;

interface Timed {
  stop: TimelineStop;
  start: number;
  end?: number;
}

/** Stops on a linear clock: times that wrap past midnight keep counting up. */
export function timeline(day: ItineraryDay): Timed[] {
  const out: Timed[] = [];
  let offset = 0;
  let prev = -1;
  for (const stop of day.stops) {
    let start = mins(stop.time) + offset;
    if (prev >= 0 && start < prev && prev - start > 720) {
      offset += 1440;
      start += 1440;
    }
    let end = stop.endTime ? mins(stop.endTime) + offset : undefined;
    if (end !== undefined && end < start) end += 1440;
    out.push({ stop, start, end });
    prev = start;
  }
  return out;
}

const located = (s: TimelineStop) => !!s.coords && s.kind !== "free-time";
export const locatedStops = (day: ItineraryDay) => day.stops.filter(located);

const MEAL_WINDOWS: Record<string, [number, number]> = {
  breakfast: [6 * 60, 11 * 60],
  lunch: [11 * 60 + 30, 15 * 60 + 30],
  coffee: [14 * 60, 18 * 60 + 30],
  dinner: [18 * 60, 23 * 60],
};

const where = (d: ItineraryDay, s?: TimelineStop) => `day ${d.dayNumber}${s ? ` ${s.time} "${s.name}"` : ""}`;

export function checkPlan(input: StressInput, dest: Destination, it: GeneratedItinerary): { failures: Failure[]; notes: string[] } {
  const f: Failure[] = [];
  const notes: string[] = [];
  const fail = (check: string, detail: string) => f.push({ check, detail });
  const dated = !!(input.start && input.end && input.end >= input.start);
  const expectedDays = dated ? diffDays(input.start, input.end) + 1 : input.duration;
  const groupSize = input.adults + input.children;

  // 1. Dates and days
  if (it.days.length !== expectedDays) fail("dates.day-count", `expected ${expectedDays} days, plan has ${it.days.length}`);
  it.days.forEach((d, i) => {
    if (d.dayNumber !== i + 1) fail("dates.day-number", `day at index ${i} is numbered ${d.dayNumber}`);
    if (dated) {
      const date = addDays(input.start, i);
      if (d.date !== date) fail("dates.date", `day ${i + 1} dated ${d.date}, expected ${date}`);
      if (d.weekday !== weekdayOf(date)) fail("dates.weekday", `day ${i + 1} weekday ${d.weekday}, expected ${weekdayOf(date)} for ${date}`);
    } else if (d.date) fail("dates.date", `undated trip but day ${i + 1} has date ${d.date}`);
  });

  for (const d of it.days) {
    const tl = timeline(d);
    const real = d.stops.filter((s) => s.kind !== "transit" && s.kind !== "free-time");
    if (real.length === 0) notes.push(`day ${d.dayNumber} has no stops`);

    // 1b. Closed venues are not scheduled on their closed days, and visits fit the opening window.
    if (dated && d.weekday !== undefined) {
      for (const t of tl) {
        const rec = recordFor(dest, t.stop.category, t.stop.refId);
        if (!rec) continue;
        const windows = windowsFor(rec, d.weekday);
        if (windows === null) continue;
        if (windows.length === 0) {
          fail("hours.closed-scheduled", `${where(d, t.stop)} is closed all day ${d.date} (weekday ${d.weekday})`);
          continue;
        }
        const startClock = t.start % 1440;
        const endClock = t.end !== undefined ? t.start + (t.end - t.start) : startClock;
        const ok = windows.some(([open, close]) => startClock >= open && startClock + (endClock - t.start) <= close);
        if (!ok) {
          const w = windows.map(([a, b]) => `${hm(a)}-${b === 1440 ? "24:00" : hm(b)}`).join(", ");
          fail("hours.outside-window", `${where(d, t.stop)} runs ${t.stop.time}-${t.stop.endTime ?? "?"}, open ${w} on ${d.date}`);
        }
      }
    }

    // 2. Times
    let prevEnd: number | undefined;
    let prev: Timed | undefined;
    for (const t of tl) {
      if (prev && t.start < prev.start) fail("time.order", `${where(d, t.stop)} starts before ${prev.stop.time} "${prev.stop.name}"`);
      if (prevEnd !== undefined && t.start < prevEnd) {
        fail("time.overlap", `${where(d, t.stop)} starts before "${prev!.stop.name}" ends at ${hm(prevEnd)}`);
      }
      const clock = t.start % 1440;
      // The landing and the trip to the airport mark flights; they are not activities the 00:30 rule is about.
      const landing = t.stop.kind === "free-time" && /^(arrive|head to the airport)/i.test(t.stop.name);
      if (!landing && ((clock > 30 && clock < 5 * 60) || t.start > 1440 + 30)) fail("time.late-start", `${where(d, t.stop)} starts at ${t.stop.time} (after 00:30)`);
      const win = MEAL_WINDOWS[t.stop.kind];
      if (win && (clock < win[0] || clock > win[1])) fail("time.meal-window", `${where(d, t.stop)} is ${t.stop.kind} at ${t.stop.time}, expected ${hm(win[0])}-${hm(win[1])}`);
      prevEnd = t.end ?? t.start;
      prev = t;
    }
    if (input.arrivalTime && d.dayNumber === 1) {
      const earliest = mins(input.arrivalTime) + 150;
      for (const t of tl) {
        // The arrival-and-rest stop marks the landing itself; everything else waits 2h30 for immigration and the transfer.
        const landing = t.stop.kind === "free-time" && /^arrive/i.test(t.stop.name);
        const min = landing ? mins(input.arrivalTime) : earliest;
        if (t.start < min) fail("flight.arrival", `${where(d, t.stop)} starts ${t.stop.time}, before ${landing ? "landing" : "landing + 2h30"} ${hm(min)}`);
      }
    }
    if (input.departureTime && d.dayNumber === it.days.length) {
      const latest = mins(input.departureTime) - 180;
      for (const t of tl) {
        const end = t.end ?? t.start;
        if (end > latest) fail("flight.departure", `${where(d, t.stop)} ends ${hm(end)}, after flight ${input.departureTime} - 3h = ${hm(latest)}`);
      }
    }

    // 4. Prices, per day
    const sum = { min: 0, likely: 0, max: 0, unknown: 0 };
    for (const s of d.stops) {
      if (!s.cost) continue;
      for (const k of ["min", "max", "likely"] as const) {
        const v = s.cost[k];
        if (typeof v !== "number" || !Number.isFinite(v)) fail("price.nan", `${where(d, s)} cost.${k} = ${String(v)}`);
        else if (v < 0) fail("price.negative", `${where(d, s)} cost.${k} = ${v}`);
      }
      if (s.cost.known && !(s.cost.min <= s.cost.likely && s.cost.likely <= s.cost.max)) fail("price.range", `${where(d, s)} min ${s.cost.min} / likely ${s.cost.likely} / max ${s.cost.max} out of order`);
      if (s.cost.currency !== it.currency) fail("price.mixed-currency", `${where(d, s)} priced in ${s.cost.currency}, trip currency ${it.currency}`);
      if (s.cost.known) {
        sum.min += s.cost.min;
        sum.likely += s.cost.likely;
        sum.max += s.cost.max;
      } else sum.unknown++;
    }
    if (d.cost.low !== sum.min || d.cost.likely !== sum.likely || d.cost.high !== sum.max) {
      fail("price.day-sum", `day ${d.dayNumber} total ${d.cost.low}/${d.cost.likely}/${d.cost.high}, stops sum to ${sum.min}/${sum.likely}/${sum.max}`);
    }
    if (d.cost.unknownItems !== sum.unknown) fail("price.unknown-count", `day ${d.dayNumber} says ${d.cost.unknownItems} unpriced stops, counted ${sum.unknown}`);
    for (const k of ["low", "likely", "high"] as const) if (!Number.isFinite(d.cost[k]) || d.cost[k] < 0) fail("price.nan", `day ${d.dayNumber} cost.${k} = ${d.cost[k]}`);
  }

  // 4b. Prices, whole trip
  const tot = it.days.reduce((a, d) => ({ low: a.low + d.cost.low, likely: a.likely + d.cost.likely, high: a.high + d.cost.high, unknown: a.unknown + d.cost.unknownItems }), { low: 0, likely: 0, high: 0, unknown: 0 });
  if (it.cost.low !== tot.low || it.cost.likely !== tot.likely || it.cost.high !== tot.high) fail("price.trip-sum", `trip ${it.cost.low}/${it.cost.likely}/${it.cost.high}, days sum to ${tot.low}/${tot.likely}/${tot.high}`);
  if (it.cost.unknownItems !== tot.unknown) fail("price.unknown-count", `trip says ${it.cost.unknownItems} unpriced stops, days sum to ${tot.unknown}`);
  if (Math.abs(it.groupLikely - it.cost.likely * groupSize) > 1) fail("price.party-total", `party of ${groupSize}: ${it.groupLikely}, expected ${it.cost.likely} x ${groupSize} = ${it.cost.likely * groupSize}`);
  if (it.currency !== dest.currency) fail("price.currency", `plan currency ${it.currency}, city currency ${dest.currency}`);
  if (it.cost.currency !== it.currency) fail("price.currency", `trip cost currency ${it.cost.currency}, plan currency ${it.currency}`);

  // 3. Interests, dietary, skip and must
  const all = it.days.flatMap((d) => d.stops.filter((s) => s.refId));
  const present = (id: string) => all.some((s) => s.refId === id);
  for (const id of input.avoid) if (present(id)) fail("skip.present", `skipped place ${id} appears in the plan`);
  for (const id of input.mustInclude) {
    if (present(id)) continue;
    const rec = Object.values(pools(dest)).flat().find((r) => r.id === id);
    const explained = it.warnings.some((w) => rec && w.toLowerCase().includes(rec.name.toLowerCase().slice(0, 12)));
    fail(explained ? "must.missing-with-warning" : "must.missing", `must-include ${id} (${rec?.name}) is not in the plan${explained ? " (the plan warns about it)" : ""}`);
  }
  if (input.dietary.length) {
    for (const s of all) {
      if (s.category !== "restaurant") continue;
      const rec = recordFor(dest, "restaurant", s.refId) as unknown as Restaurant | undefined;
      if (rec && combinedDietFit(rec, input.dietary) === "no") fail("diet.mismatch", `"${s.name}" (${rec.cuisine}) is ruled out for ${input.dietary.join(" + ")}`);
    }
  }
  if (input.interests.length > 0 && it.days.length >= 2) {
    const sightseeing = all.filter((s) => ["landmark", "experience", "shopping", "nightlife"].includes(s.category ?? ""));
    const served = (i: Interest): { wanted: boolean; got: boolean } => {
      const p = pools(dest);
      if (i === "cafes") return { wanted: p.cafe.length > 0, got: all.some((s) => s.category === "cafe") };
      if (i === "food") return { wanted: p.restaurant.length > 0, got: all.some((s) => s.category === "restaurant") };
      if (i === "shopping") return { wanted: p.shopping.length > 0, got: all.some((s) => s.category === "shopping") };
      if (i === "nightlife") return { wanted: p.nightlife.length > 0, got: all.some((s) => s.category === "nightlife") };
      const tagged = (r: AnyRec) => r.interestTags?.includes(i);
      const pool = [...p.landmark, ...p.experience].filter(tagged);
      return { wanted: pool.length >= 2, got: sightseeing.some((s) => tagged(recordFor(dest, s.category, s.refId) ?? ({} as AnyRec))) };
    };
    const results = input.interests.map((i) => ({ i, ...served(i) })).filter((r) => r.wanted);
    if (input.interests.length === 1 && results[0] && !results[0].got) fail(`interest.${input.interests[0]}`, `only "${input.interests[0]}" selected, but no matching stop in ${it.days.length} days`);
    if (input.interests.length > 1 && results.length && !results.some((r) => r.got)) fail("interest.combo", `none of ${input.interests.join(", ")} is represented`);
    for (const r of results) if (!r.got && input.interests.length > 1) notes.push(`interest ${r.i} not represented`);
  }

  // 5. Map data: every stop near the city, numbering follows stop order
  const centre = cityCentre(dest);
  if (centre) {
    for (const d of it.days) {
      for (const s of locatedStops(d)) {
        const dist = km(centre, s.coords!);
        const limit = s.kind === "day-trip" ? 250 : 60;
        if (dist > limit) fail("map.outlier", `${where(d, s)} is ${Math.round(dist)} km from the city centre (limit ${limit})`);
      }
    }
  }
  return { failures: f, notes };
}
