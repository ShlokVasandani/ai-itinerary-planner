/**
 * Automated quality gates for open-data cities. A city is published only if every
 * `error` check passes; `warn` results are recorded in the report.
 *
 *  1 schema        zod shape, valid ISO currency / IATA / IANA timezone, 12 monthly ratings
 *  2 counts        enough landmarks, restaurants, cafés, neighbourhoods
 *  3 geography     every coordinate near the city centre, no null island, no stacked duplicates
 *  4 content       no markup / URLs / placeholders in text, sane lengths, Latin display names
 *  5 hours & cost  opening hours parse, close > open, min <= max
 *  6 links         URLs are http(s) (liveness is checked separately and dead links are dropped)
 *  7 photo         files exist, manifest complete, license on the allow-list
 *  8 engine        itinerary generation across durations, paces, styles, dates: no crashes,
 *                  no stops outside the city, no closed venues, no repeats, ordered times
 */
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { haversineKm } from "../../lib/engine/geo";
import {
  findClosedStops,
  generateItinerary,
  regenerateDay,
  swapStop,
  type PlannerInput,
} from "../../lib/itinerary-engine";
import type { Destination } from "../../lib/types";
import { OK_LICENSE } from "./lib/commons";
import { isLatin } from "./lib/util";
import type { OpenPhoto } from "./photos";

export interface Finding {
  level: "error" | "warn";
  check: string;
  message: string;
}

const coords = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) });
const hours = z.object({ days: z.string().regex(/^[A-Z][a-z](-[A-Z][a-z])?(,[A-Z][a-z](-[A-Z][a-z])?)*$/), open: z.string().regex(/^\d{1,2}:\d{2}$/), close: z.string().regex(/^\d{1,2}:\d{2}$/) });
const verifiable = {
  coords: coords.optional(),
  officialUrl: z.string().url().optional(),
  mapsUrl: z.string().url().optional(),
  openingHours: z.array(hours).optional(),
  closedDays: z.array(z.number().int().min(0).max(6)).optional(),
  costMin: z.number().min(0).optional(),
  costMax: z.number().min(0).optional(),
  costCurrency: z.string().regex(/^[A-Z]{3}$/).optional(),
  sources: z.array(z.string().url()).optional(),
  verifiedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
};
const priority = z.enum(["must-see", "highly-recommended", "if-you-have-time", "interest-specific"]);
const interest = z.enum(["history", "food", "cafes", "shopping", "art", "nightlife", "photography", "beaches", "nature", "adventure", "culture", "luxury"]);
const base = { id: z.string().min(2), name: z.string().min(2).max(80), neighborhood: z.string().min(1), description: z.string().min(1).max(420) };

const schema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  tier: z.literal("open"),
  city: z.string().min(2),
  country: z.string().min(2),
  currency: z.string().regex(/^[A-Z]{3}$/),
  airportCodes: z.array(z.string().regex(/^[A-Z]{3}$/)).min(1).max(3),
  ianaTimezone: z.string().min(3),
  seasons: z.array(z.object({ weather: z.number().int().min(1).max(5) })).length(12),
  tagline: z.string().min(5).max(200),
  overview: z.string().min(40).max(700),
  quickFacts: z.object({ country: z.string(), timezone: z.string(), bestMonths: z.array(z.string()).length(3), airport: z.string() }),
  neighborhoods: z.array(z.object({ id: z.string().min(1), name: z.string().min(2), coords: coords, knownFor: z.array(z.string()), bestFor: z.array(interest) })).min(1),
  landmarks: z.array(z.object({ ...base, ...verifiable, whyGo: z.string(), priority, interestTags: z.array(interest).min(1), suggestedDurationMin: z.number().int().min(10).max(480) })),
  restaurants: z.array(z.object({ ...base, ...verifiable, whyGo: z.string(), priority, interestTags: z.array(interest), suggestedDurationMin: z.number(), cuisine: z.string(), signatureDishes: z.array(z.string()), mealFor: z.array(z.enum(["breakfast", "lunch", "dinner", "any"])).min(1) })),
  cafes: z.array(z.object({ ...base, ...verifiable, priority })),
  nightlife: z.array(z.object({ ...base, ...verifiable, type: z.enum(["bar", "club", "rooftop", "night-market", "performance", "night-view"]) })),
  shopping: z.array(z.object({ ...base, ...verifiable, type: z.enum(["street", "mall", "market", "luxury", "souvenir", "district"]) })),
});

const MIN = { landmarks: 8, restaurants: 6, cafes: 3, neighborhoods: 3 };
const BAD_TEXT = /<[a-z!\/][^>]*>|https?:\/\/|\bTODO\b|\bundefined\b|\bnull\b|\[\[|\]\]|lorem ipsum|&[a-z]+;|\{\{/i;

type Item = { id: string; name: string; description?: string; coords?: { lat: number; lng: number }; neighborhood?: string; openingHours?: { days: string; open: string; close: string }[]; costMin?: number; costMax?: number; officialUrl?: string };

export function staticChecks(d: Destination, photo: OpenPhoto | undefined, publicDir = path.join(process.cwd(), "public", "images", "destinations")): Finding[] {
  const f: Finding[] = [];
  const err = (check: string, message: string) => f.push({ level: "error", check, message });
  const warn = (check: string, message: string) => f.push({ level: "warn", check, message });

  // 1 schema
  const parsed = schema.safeParse(d);
  if (!parsed.success) for (const i of parsed.error.issues.slice(0, 8)) err("schema", `${i.path.join(".")}: ${i.message}`);
  try {
    new Intl.DateTimeFormat("en", { timeZone: d.ianaTimezone });
  } catch {
    err("schema", `invalid IANA timezone ${d.ianaTimezone}`);
  }
  try {
    new Intl.NumberFormat("en", { style: "currency", currency: d.currency });
  } catch {
    err("schema", `invalid currency ${d.currency}`);
  }

  const groups: [string, Item[]][] = [
    ["landmarks", d.landmarks],
    ["restaurants", d.restaurants],
    ["cafes", d.cafes],
    ["nightlife", d.nightlife],
    ["shopping", d.shopping],
  ];
  const all = groups.flatMap(([, items]) => items);

  // 2 counts
  if (d.landmarks.length < MIN.landmarks) err("counts", `only ${d.landmarks.length} landmarks (min ${MIN.landmarks})`);
  if (d.restaurants.length < MIN.restaurants) err("counts", `only ${d.restaurants.length} restaurants (min ${MIN.restaurants})`);
  if (d.cafes.length < MIN.cafes) warn("counts", `only ${d.cafes.length} cafés`);
  if (d.neighborhoods.length < MIN.neighborhoods) err("counts", `only ${d.neighborhoods.length} neighbourhoods (min ${MIN.neighborhoods})`);
  const ids = all.map((x) => x.id);
  if (new Set(ids).size !== ids.length) err("counts", "duplicate ids");

  // 3 geography
  const centre = d.neighborhoods.length
    ? { lat: d.neighborhoods.reduce((s, h) => s + (h.coords?.lat ?? 0), 0) / d.neighborhoods.length, lng: d.neighborhoods.reduce((s, h) => s + (h.coords?.lng ?? 0), 0) / d.neighborhoods.length }
    : undefined;
  for (const x of all) {
    if (!x.coords) {
      err("geography", `${x.name}: no coordinates`);
      continue;
    }
    if (Math.abs(x.coords.lat) < 0.01 && Math.abs(x.coords.lng) < 0.01) err("geography", `${x.name}: null island`);
    if (centre) {
      const km = haversineKm(centre, x.coords);
      if (km > 30) err("geography", `${x.name} is ${km.toFixed(0)} km from the city centre`);
    }
  }
  const seenCoord = new Map<string, string>();
  for (const x of all) {
    if (!x.coords) continue;
    const k = `${x.coords.lat.toFixed(4)},${x.coords.lng.toFixed(4)}`;
    const other = seenCoord.get(k);
    if (other && other !== x.name) warn("geography", `${x.name} and ${other} share coordinates`);
    seenCoord.set(k, x.name);
  }

  // 4 content
  for (const [g, items] of groups) {
    const names = new Set<string>();
    for (const x of items) {
      if (BAD_TEXT.test(x.name) || BAD_TEXT.test(x.description ?? "")) err("content", `${g}/${x.name}: markup or placeholder text`);
      const n = x.name.toLowerCase();
      if (names.has(n)) warn("content", `${g}: duplicate name ${x.name}`);
      names.add(n);
      if (!isLatin(x.name)) err("content", `${g}/${x.name}: non-Latin display name`);
      if (!x.neighborhood) err("content", `${x.name}: no neighbourhood`);
    }
  }
  for (const [k, v] of Object.entries({ tagline: d.tagline, overview: d.overview })) if (BAD_TEXT.test(v)) err("content", `${k}: markup or placeholder text`);
  if (/ is a city in /.test(d.overview) && d.overview.length < 80) warn("content", "overview is the generic fallback");
  const withDesc = d.landmarks.filter((l) => l.description.length >= 40).length;
  if (withDesc < Math.min(8, d.landmarks.length)) err("content", `only ${withDesc} landmarks have a real description`);

  // 5 hours and cost
  for (const x of all) {
    for (const r of x.openingHours ?? []) {
      const [oh, om] = r.open.split(":").map(Number);
      const [ch, cm] = r.close.split(":").map(Number);
      if (oh > 23 || om > 59 || ch > 48 || cm > 59 || oh * 60 + om >= ch * 60 + cm) err("hours", `${x.name}: bad rule ${r.days} ${r.open}-${r.close}`);
    }
    if (x.costMin !== undefined && x.costMax !== undefined && x.costMin > x.costMax) err("hours", `${x.name}: costMin > costMax`);
  }

  // 6 links
  for (const x of all) if (x.officialUrl && !/^https?:\/\//.test(x.officialUrl)) err("links", `${x.name}: non-http URL`);

  // 7 photo
  if (!photo) warn("photo", "no photo; the generated artwork will be shown");
  else {
    if (!OK_LICENSE.test(photo.license)) err("photo", `license not allowed: ${photo.license}`);
    if (!photo.credit || !photo.sourcePage) err("photo", "missing credit");
    for (const w of photo.widths) for (const ext of ["webp", "avif"]) if (!fs.existsSync(path.join(publicDir, `${d.slug}-${w}.${ext}`))) err("photo", `missing ${d.slug}-${w}.${ext}`);
    if (!fs.existsSync(path.join(publicDir, `${d.slug}.jpg`))) err("photo", "missing fallback jpg");
  }
  return f;
}

/* ---------- engine smoke test ---------- */

const addDays = (iso: string, n: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};
const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export function engineChecks(d: Destination): Finding[] {
  const f: Finding[] = [];
  const err = (message: string) => f.push({ level: "error", check: "engine", message });
  const warn = (message: string) => f.push({ level: "warn", check: "engine", message });
  const bbox = d.bbox;
  const inBox = (c?: { lat: number; lng: number }) => !c || !bbox || (c.lat >= bbox[0] - 0.01 && c.lat <= bbox[2] + 0.01 && c.lng >= bbox[1] - 0.01 && c.lng <= bbox[3] + 0.01);

  const matrix: Partial<PlannerInput>[] = [];
  for (const duration of [1, 2, 3, 5, 7, 10, 14]) matrix.push({ duration, startDate: "2027-03-01", pace: "balanced" }); // Monday start
  for (const pace of ["relaxed", "packed"] as const) matrix.push({ duration: 4, pace, startDate: "2027-03-07" }); // Sunday start
  for (const travelStyle of ["foodie", "luxury", "budget", "family", "nightlife", "culture-history"] as const) matrix.push({ duration: 3, travelStyle });
  matrix.push({ duration: 5, interests: ["nature", "beaches", "photography"], mobility: "limited", groupSize: 4, hasKids: true });
  matrix.push({ duration: 3, dietary: ["vegetarian"] });
  matrix.push({ duration: 3, dietary: ["halal", "vegan"], budget: "luxury" });

  let ran = 0;
  for (const m of matrix) {
    const label = JSON.stringify({ ...m, startDate: m.startDate ? "dated" : undefined });
    try {
      const input: PlannerInput = { destination: d, duration: 3, budget: "mid-range", travelStyle: "first-time", interests: ["history", "food"], seed: "check", ...m };
      const it = generateItinerary(input);
      ran++;
      if (it.days.length !== (m.duration ?? 3)) err(`${label}: expected ${m.duration ?? 3} days, got ${it.days.length}`);
      const seenSights = new Set<string>();
      for (const day of it.days) {
        const times = day.stops.map((s) => s.time);
        const sorted = [...times].sort((a, b) => toMin(a) - toMin(b));
        if (JSON.stringify(times) !== JSON.stringify(sorted)) err(`${label}: day ${day.dayNumber} times out of order (${times.join(",")})`);
        const sights = day.stops.filter((s) => s.kind !== "transit" && s.kind !== "free-time");
        if (sights.length === 0 && (m.duration ?? 3) <= 7) err(`${label}: day ${day.dayNumber} has no stops`);
        for (const s of sights) {
          const rec = [...d.landmarks, ...d.restaurants, ...d.cafes, ...d.nightlife, ...d.shopping].find((x) => x.id === s.refId);
          if (!inBox(rec?.coords)) err(`${label}: ${s.name} is outside the city box`);
          if (s.refId && (s.category === "landmark" || s.category === "restaurant")) {
            if (seenSights.has(s.refId)) err(`${label}: ${s.name} repeated`);
            seenSights.add(s.refId);
          }
          if (/undefined|NaN|\[object/.test(`${s.name} ${s.description} ${s.transportNote ?? ""}`)) err(`${label}: bad text in ${s.name}`);
        }
        if (day.walkingAndTransitMinutes > 600) warn(`${label}: day ${day.dayNumber} spends ${day.walkingAndTransitMinutes} min between stops`);
      }
      if (m.startDate) {
        const closed = findClosedStops(it);
        if (closed.length) err(`${label}: closed venue scheduled: ${closed[0].stop} (${closed[0].reason})`);
      }
      if (!Number.isFinite(it.cost.likely)) err(`${label}: non-finite cost`);
      if (it.days.length >= 2) {
        const r = regenerateDay(it, 1, "shuffle-1");
        if (r.days.length !== it.days.length) err(`${label}: regenerateDay changed the day count`);
      }
      const day1 = it.days[0];
      const idx = day1.stops.findIndex((s) => s.refId && s.category && s.category !== "dayTrip" && s.kind !== "transit");
      if (idx >= 0) {
        const res = swapStop(it, 1, idx, "__missing__");
        if (!res.error) err(`${label}: swapStop accepted an unknown id`);
      }
    } catch (e) {
      err(`${label}: threw ${(e as Error).message}`);
    }
  }
  if (ran === 0) err("engine produced no itineraries");
  void addDays;
  return f;
}

export function runAllChecks(d: Destination, photo: OpenPhoto | undefined): Finding[] {
  return [...staticChecks(d, photo), ...engineChecks(d)];
}
