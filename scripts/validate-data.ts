/**
 * Validates every city in lib/data.
 *
 * Fails (exit 1) on: duplicate ids, missing required fields, too few records,
 * coordinates outside the city's bounding box, costMin > costMax, malformed
 * opening hours, wrong number of seasons/phrases.
 * Reports (never fails) on: broken URLs (HEAD request), near-duplicate names.
 *
 * Usage: npx tsx scripts/validate-data.ts [--skip-urls] [slug ...]
 */
import { destinations } from "../lib/data";
import type { Destination } from "../lib/types";

const MIN_COUNTS = {
  landmarks: 12,
  restaurants: 12,
  cafes: 6,
  neighborhoods: 6,
  experiences: 5,
  dayTrips: 3,
  nightlife: 5,
} as const;

const errors: string[] = [];
const warnings: string[] = [];
const err = (city: string, msg: string) => errors.push(`[${city}] ${msg}`);
const warn = (city: string, msg: string) => warnings.push(`[${city}] ${msg}`);

const isTime = (t: string) => /^\d{1,2}:\d{2}$/.test(t);
const DAY_LABEL = /^(?:[A-Z][a-z](?:-[A-Z][a-z])?)(?:,[A-Z][a-z](?:-[A-Z][a-z])?)*$/;

type AnyItem = {
  id: string;
  name: string;
  coords?: { lat: number; lng: number };
  costMin?: number;
  costMax?: number;
  costCurrency?: string;
  closedDays?: number[];
  openingHours?: { days: string; open: string; close: string }[];
  officialUrl?: string;
  bookingUrl?: string;
  mapsUrl?: string;
  description?: string;
};

function collections(d: Destination): [string, AnyItem[]][] {
  return [
    ["landmarks", d.landmarks],
    ["restaurants", d.restaurants],
    ["cafes", d.cafes as AnyItem[]],
    ["experiences", d.experiences],
    ["shopping", d.shopping],
    ["nightlife", d.nightlife],
    ["dayTrips", d.dayTrips],
  ] as [string, AnyItem[]][];
}

function validateCity(d: Destination) {
  const city = d.slug;
  for (const [key, min] of Object.entries(MIN_COUNTS)) {
    const n = (d[key as keyof typeof MIN_COUNTS] as unknown[]).length;
    if (n < min) err(city, `${key}: ${n} records, expected at least ${min}`);
  }
  if (d.seasons.length !== 12) err(city, `seasons must have 12 entries, has ${d.seasons.length}`);
  if (d.localPhrases.length !== 8) err(city, `localPhrases must have 8 entries, has ${d.localPhrases.length}`);
  if (!/^[A-Z]{3}$/.test(d.currency)) err(city, `currency "${d.currency}" is not an ISO code`);
  if (d.airportCodes.length === 0 || d.airportCodes.some((c) => !/^[A-Z]{3}$/.test(c))) err(city, "airportCodes invalid");
  if (!d.bbox) warn(city, "no bounding box; coordinate checks skipped (run scripts/enrich-geo.ts)");

  const seen = new Map<string, string>();
  const names = new Map<string, string>();
  const requireFields: Record<string, string[]> = {
    landmarks: ["id", "name", "neighborhood", "description", "whyGo", "priority", "suggestedDurationMin"],
    restaurants: ["id", "name", "neighborhood", "description", "cuisine", "signatureDishes", "mealFor"],
    cafes: ["id", "name", "neighborhood", "description", "specialty", "priceLevel"],
    experiences: ["id", "name", "description", "approxCost", "duration"],
    shopping: ["id", "name", "neighborhood", "description", "type"],
    nightlife: ["id", "name", "neighborhood", "description", "type"],
    dayTrips: ["id", "name", "description", "travelTime", "howToGetThere"],
  };

  for (const [key, items] of collections(d)) {
    for (const item of items) {
      const where = `${key}/${item.id ?? item.name}`;
      for (const f of requireFields[key]) {
        const v = (item as unknown as Record<string, unknown>)[f];
        if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) err(city, `${where}: missing required field "${f}"`);
      }
      if (item.id) {
        if (seen.has(item.id)) err(city, `duplicate id "${item.id}" (${key} and ${seen.get(item.id)})`);
        seen.set(item.id, key);
      }
      const nameKey = item.name.toLowerCase().replace(/[^a-z0-9]+/g, "");
      if (names.has(nameKey) && names.get(nameKey) !== key) warn(city, `"${item.name}" appears in both ${names.get(nameKey)} and ${key}`);
      names.set(nameKey, key);

      if (item.coords) {
        const { lat, lng } = item.coords;
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) err(city, `${where}: invalid coords`);
        else if (d.bbox && key !== "dayTrips") {
          const [s, w, n, e] = d.bbox;
          if (lat < s || lat > n || lng < w || lng > e) err(city, `${where}: coords ${lat},${lng} outside city bounding box`);
        }
      }
      if (item.costMin !== undefined && item.costMax !== undefined && item.costMin > item.costMax) {
        err(city, `${where}: costMin ${item.costMin} > costMax ${item.costMax}`);
      }
      if ((item.costMin !== undefined || item.costMax !== undefined) && !item.costCurrency) err(city, `${where}: cost without costCurrency`);
      for (const day of item.closedDays ?? []) {
        if (!Number.isInteger(day) || day < 0 || day > 6) err(city, `${where}: closedDays contains ${day}`);
      }
      for (const rule of item.openingHours ?? []) {
        if (!DAY_LABEL.test(rule.days) || !isTime(rule.open) || !isTime(rule.close)) err(city, `${where}: malformed opening hours ${JSON.stringify(rule)}`);
      }
      if (!item.mapsUrl) err(city, `${where}: mapsUrl missing`);
    }
  }
  // neighborhoods: ids unique + coords inside box
  const hoodIds = new Set<string>();
  for (const n of d.neighborhoods) {
    if (hoodIds.has(n.id)) err(city, `duplicate neighborhood id "${n.id}"`);
    hoodIds.add(n.id);
    if (n.coords && d.bbox) {
      const [s, w, nn, e] = d.bbox;
      if (n.coords.lat < s || n.coords.lat > nn || n.coords.lng < w || n.coords.lng > e) err(city, `neighborhood ${n.id}: coords outside city bounding box`);
    }
  }
}

async function checkUrls(list: { city: string; label: string; url: string }[]) {
  const unique = new Map<string, { city: string; label: string }[]>();
  for (const u of list) unique.set(u.url, [...(unique.get(u.url) ?? []), { city: u.city, label: u.label }]);
  const urls = [...unique.keys()];
  let idx = 0;
  const worker = async () => {
    while (idx < urls.length) {
      const url = urls[idx++];
      try {
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), 10000);
        let res = await fetch(url, { method: "HEAD", redirect: "follow", signal: ctl.signal, headers: { "User-Agent": "SekaiItineraryPlanner/1.0 link-check" } });
        if (res.status === 405 || res.status === 403) res = await fetch(url, { method: "GET", redirect: "follow", signal: ctl.signal, headers: { "User-Agent": "SekaiItineraryPlanner/1.0 link-check" } });
        clearTimeout(timer);
        if (res.status >= 400 && res.status !== 403 && res.status !== 429) {
          for (const u of unique.get(url)!) warn(u.city, `broken URL (${res.status}) for ${u.label}: ${url}`);
        }
      } catch (e) {
        for (const u of unique.get(url)!) warn(u.city, `unreachable URL for ${u.label}: ${url} (${(e as Error).name})`);
      }
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));
}

async function main() {
  const args = process.argv.slice(2);
  const skipUrls = args.includes("--skip-urls");
  const only = args.filter((a) => !a.startsWith("--"));
  const list = destinations.filter((d) => only.length === 0 || only.includes(d.slug));
  const urls: { city: string; label: string; url: string }[] = [];
  const stats: string[] = [];
  for (const d of list) {
    validateCity(d);
    let withCoords = 0;
    let total = 0;
    for (const [, items] of collections(d)) {
      for (const it of items) {
        total++;
        if (it.coords) withCoords++;
        if (it.officialUrl) urls.push({ city: d.slug, label: it.name, url: it.officialUrl });
        if (it.bookingUrl) urls.push({ city: d.slug, label: `${it.name} (booking)`, url: it.bookingUrl });
      }
    }
    stats.push(`${d.slug.padEnd(15)} ${String(total).padStart(3)} records, ${String(withCoords).padStart(3)} with coords`);
  }
  if (!skipUrls) await checkUrls(urls);
  console.log(stats.join("\n"));
  if (warnings.length) console.log(`\n${warnings.length} warning(s):\n` + warnings.map((w) => "  - " + w).join("\n"));
  if (errors.length) {
    console.error(`\n${errors.length} error(s):\n` + errors.map((e) => "  x " + e).join("\n"));
    process.exit(1);
  }
  console.log(`\nOK: ${list.length} cities valid.`);
}

main();
