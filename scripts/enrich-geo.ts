/**
 * Fills coords / officialUrl / openingHours / closedDays / sources / verifiedAt
 * from OpenStreetMap (Nominatim) and Wikidata, and writes them to the
 * generated overlay (lib/data/generated/<slug>.json).
 *
 * Rules:
 *  - Nominatim usage policy: max 1 request/second, identifying User-Agent,
 *    results cached on disk (scripts/.cache) so re-runs do not hit the API.
 *  - A match is only applied when it lies inside the city bounding box AND its
 *    name matches the venue name. Anything else is written to
 *    data-gaps.md instead of being guessed.
 *  - officialUrl comes only from the OSM `website` tag or the Wikidata
 *    official-website property (P856), i.e. the venue's own site.
 *
 * Usage: npx tsx scripts/enrich-geo.ts [slug ...]
 */
import fs from "node:fs";
import path from "node:path";
import { destinations } from "../lib/data";
import type { Destination } from "../lib/types";
import { patchPlace, readOverlay, writeOverlay } from "./lib/overlay";
import { parseClosedDaysOnly, parseOsmHours } from "./lib/osm-hours";

const UA = "SekaiItineraryPlanner/1.0 (+https://github.com/ShlokVasandani/ai-itinerary-planner)";
const TODAY = new Date().toISOString().slice(0, 10);
const CACHE_DIR = path.join(process.cwd(), "scripts", ".cache");
const CACHE_FILE = path.join(CACHE_DIR, "geo-cache.json");

let cache: Record<string, unknown> = {};
try {
  cache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
} catch {
  cache = {};
}
function saveCache() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
}

let lastNominatim = 0;
async function nominatim(params: Record<string, string>): Promise<NominatimResult[]> {
  const qs = new URLSearchParams({
    format: "jsonv2",
    limit: "5",
    addressdetails: "0",
    extratags: "1",
    namedetails: "1",
    "accept-language": "en",
    ...params,
  });
  const url = `https://nominatim.openstreetmap.org/search?${qs}`;
  if (cache[url]) return cache[url] as NominatimResult[];
  const wait = 1100 - (Date.now() - lastNominatim);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastNominatim = Date.now();
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
      if (res.status === 429 || res.status >= 500) {
        await new Promise((r) => setTimeout(r, 5000 * (attempt + 1)));
        continue;
      }
      const json = (await res.json()) as NominatimResult[];
      cache[url] = json;
      return json;
    } catch {
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  return [];
}

interface NominatimResult {
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
  category?: string;
  type?: string;
  importance?: number;
  boundingbox?: [string, string, string, string]; // south, north, west, east
  extratags?: Record<string, string>;
  namedetails?: Record<string, string>;
}

function fold(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOP = new Set(["the", "a", "an", "of", "de", "la", "le", "el", "il", "di", "and", "at", "in", "to", "du", "des", "von", "am"]);
function tokens(s: string): string[] {
  return fold(s)
    .split(" ")
    .filter((t) => t && !STOP.has(t));
}

/** Variants of a venue name worth searching for, most specific first. */
function nameVariants(name: string): string[] {
  const variants = new Set<string>();
  const clean = name.replace(/\s*\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
  variants.add(clean);
  const parenthetical = name.match(/\(([^)]+)\)/)?.[1];
  if (parenthetical && !/seasonal|widespread|spring|only|citywide/i.test(parenthetical)) variants.add(parenthetical);
  for (const sep of [" & ", " / "]) {
    if (clean.includes(sep)) {
      const [a, b] = clean.split(sep);
      variants.add(a.trim());
      if (b.trim().split(" ").length > 1) variants.add(b.trim());
    }
  }
  return [...variants].filter((v) => v.length > 2);
}

function nameScore(query: string, r: NominatimResult, ignore: Set<string> = new Set()): number {
  const all = tokens(query);
  const filtered = all.filter((t) => !ignore.has(t));
  const q = filtered.length > 0 ? filtered : all;
  if (q.length === 0) return 0;
  const candidates = [r.name, ...Object.values(r.namedetails ?? {}), r.display_name.split(",")[0]].filter(Boolean) as string[];
  let best = 0;
  for (const c of candidates) {
    const ct = new Set(tokens(c));
    if (ct.size === 0) continue;
    const hit = q.filter((t) => ct.has(t) || [...ct].some((x) => x.length > 4 && (x.startsWith(t) || t.startsWith(x)))).length;
    const recall = hit / q.length;
    const precision = hit / ct.size;
    best = Math.max(best, Math.min(recall, recall * 0.5 + precision * 0.5 + 0.25));
  }
  return best;
}

function inBox(lat: number, lng: number, bbox: [number, number, number, number]): boolean {
  return lat >= bbox[0] && lat <= bbox[2] && lng >= bbox[1] && lng <= bbox[3];
}

function normaliseUrl(u: string | undefined): string | undefined {
  if (!u) return undefined;
  let url = u.trim().split(";")[0].trim();
  if (!url) return undefined;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  try {
    const parsed = new URL(url);
    // Social, video and aggregator links are not the venue's own site.
    if (/(^|\.)(youtube\.com|youtu\.be|facebook\.com|instagram\.com|twitter\.com|x\.com|tiktok\.com|tripadvisor\.[a-z.]+|yelp\.[a-z.]+|google\.[a-z.]+|goo\.gl|wikipedia\.org|wikimedia\.org|booking\.com|maps\.app\.goo\.gl|linktr\.ee)$/i.test(parsed.hostname)) return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

async function wikidataWebsites(ids: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const todo = [...new Set(ids)].filter(Boolean);
  for (let i = 0; i < todo.length; i += 40) {
    const batch = todo.slice(i, i + 40);
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims&ids=${batch.join("|")}`;
    let data = cache[url] as { entities?: Record<string, { claims?: Record<string, { rank: string; mainsnak: { datavalue?: { value: string } } }[]> }> } | undefined;
    if (!data) {
      try {
        const res = await fetch(url, { headers: { "User-Agent": UA } });
        data = await res.json();
        cache[url] = data;
      } catch {
        continue;
      }
    }
    for (const [qid, ent] of Object.entries(data?.entities ?? {})) {
      const claims = ent.claims?.P856 ?? [];
      const preferred = claims.find((c) => c.rank === "preferred") ?? claims.find((c) => c.rank === "normal");
      const value = preferred?.mainsnak.datavalue?.value;
      if (value) out[qid] = value;
    }
  }
  return out;
}

/**
 * Matches that passed the name check but were wrong on manual review (a street
 * matched to a pharmacy on it, a venue matched to the street of the same name).
 * Keyed `<slug>:<id>`; these are never applied.
 */
const REJECTED_MATCHES = new Set<string>([
  "copenhagen:s-strget", // Strøget
  "paris:s-marche-aux-puces-de-saint-ouen", // Marché aux Puces de Saint-Ouen
  "vienna:s-mariahilfer-strae", // Mariahilfer Straße
  "zurich:n-zukunft", // Zukunft
  "dubai:r-gold-souk-cafeteria", // Al Ahmadiya Cafeteria (Deira)
  "zurich:r-confiserie-sprungli", // matched the Dietikon production site, not the shop
  "zurich:s-confiserie-sprungli",
]);

const GAP_LINES: Record<string, string[]> = {};
function gap(city: string, line: string) {
  (GAP_LINES[city] ??= []).push(line);
}

function ignoreFor(item: { neighborhood?: string }, d: Destination): Set<string> {
  return new Set([...tokens(d.city), ...tokens(item.neighborhood ?? "")]);
}

type Item = { id: string; name: string; kind: string; neighborhood?: string; dayTrip?: boolean; strict?: boolean };

function itemsOf(d: Destination): Item[] {
  return [
    ...d.landmarks.map((x) => ({ id: x.id, name: x.name, kind: "landmark", neighborhood: x.neighborhood })),
    ...d.restaurants.map((x) => ({ id: x.id, name: x.name, kind: "restaurant", neighborhood: x.neighborhood })),
    ...d.cafes.map((x) => ({ id: x.id, name: x.name, kind: "cafe", neighborhood: x.neighborhood })),
    ...d.shopping.map((x) => ({ id: x.id, name: x.name, kind: "shopping", neighborhood: x.neighborhood })),
    ...d.nightlife.map((x) => ({ id: x.id, name: x.name, kind: "nightlife", neighborhood: x.neighborhood })),
    ...d.experiences.map((x) => ({ id: x.id, name: x.name, kind: "experience", neighborhood: x.neighborhood, strict: true })),
    ...d.dayTrips.map((x) => ({ id: x.id, name: x.name, kind: "day trip", dayTrip: true })),
  ];
}

/** Nominatim's free-text "City, Country" lookup picks the wrong place for a few names. */
const CITY_CENTRE_OVERRIDE: Record<string, { lat: number; lng: number }> = {
  "hong-kong": { lat: 22.2818, lng: 114.1583 }, // OSM relation "香港 Hong Kong"
};

async function cityBox(d: Destination): Promise<[number, number, number, number] | undefined> {
  const forced = CITY_CENTRE_OVERRIDE[d.slug];
  if (forced) {
    const dLng = 0.3 / Math.cos((forced.lat * Math.PI) / 180);
    return [forced.lat - 0.3, forced.lng - dLng, forced.lat + 0.3, forced.lng + dLng].map((n) => Number(n.toFixed(4))) as [number, number, number, number];
  }
  const res = await nominatim({ q: `${d.city}, ${d.country}`, limit: "1", extratags: "0", namedetails: "0" });
  const r = res[0];
  if (!r) return undefined;
  const lat = Number(r.lat);
  const lng = Number(r.lon);
  const dLat = 0.3;
  const dLng = 0.3 / Math.max(0.2, Math.cos((lat * Math.PI) / 180));
  return [lat - dLat, lng - dLng, lat + dLat, lng + dLng].map((n) => Number(n.toFixed(4))) as [number, number, number, number];
}

async function enrichCity(d: Destination) {
  const overlay = readOverlay(d.slug);
  const box = overlay.bbox ?? (await cityBox(d));
  if (!box) {
    gap(d.city, `- **City bounding box** could not be resolved; coordinate checks skipped.`);
    return;
  }
  overlay.bbox = box;
  const viewbox = `${box[1]},${box[2]},${box[3]},${box[0]}`; // left,top,right,bottom
  const wikidataNeeded: { id: string; qid: string }[] = [];
  const matched: Record<string, { r: NominatimResult; hours?: string; website?: string }> = {};

  for (const item of itemsOf(d)) {
    let hit: { r: NominatimResult; score: number } | undefined;
    for (const variant of nameVariants(item.name)) {
      const params: Record<string, string> = { q: item.dayTrip ? `${variant}` : `${variant}, ${d.city}` };
      if (!item.dayTrip) {
        params.viewbox = viewbox;
        params.bounded = "1";
      } else {
        params.q = `${variant}`;
      }
      const results = await nominatim(params);
      for (const r of results) {
        const lat = Number(r.lat);
        const lng = Number(r.lon);
        if (!item.dayTrip && !inBox(lat, lng, box)) continue;
        const score = nameScore(variant, r, ignoreFor(item, d));
        if (!hit || score > hit.score) hit = { r, score };
      }
      const threshold = item.strict ? 0.8 : 0.6;
      if (hit && hit.score >= threshold) break;
    }
    const threshold = item.strict ? 0.8 : 0.6;
    if (!hit || hit.score < threshold) {
      gap(d.city, `- **${item.name}** (${item.kind}): no confident OpenStreetMap match, so coordinates and URL are left undefined.${hit ? ` Best candidate "${hit.r.display_name.split(",")[0]}" scored ${hit.score.toFixed(2)} and was not applied.` : ""}`);
      continue;
    }
    if (REJECTED_MATCHES.has(`${d.slug}:${item.id}`)) {
      gap(d.city, `- **${item.name}** (${item.kind}): the closest OpenStreetMap match ("${hit.r.display_name.split(",")[0]}") was rejected on manual review.`);
      continue;
    }
    const r = hit.r;
    const tags = r.extratags ?? {};
    const website = normaliseUrl(tags.website ?? tags["contact:website"] ?? tags.url);
    const patch: Record<string, unknown> = {
      coords: { lat: Number(Number(r.lat).toFixed(6)), lng: Number(Number(r.lon).toFixed(6)) },
      verifiedAt: TODAY,
    };
    const sources = [`https://www.openstreetmap.org/${r.osm_type}/${r.osm_id}`];
    if (website) patch.officialUrl = website;
    if (tags.wikidata && /^Q\d+$/.test(tags.wikidata)) {
      sources.push(`https://www.wikidata.org/wiki/${tags.wikidata}`);
      if (!website) wikidataNeeded.push({ id: item.id, qid: tags.wikidata });
    }
    patch.sources = sources;
    if (tags.opening_hours) {
      const parsed = parseOsmHours(tags.opening_hours);
      if (parsed) {
        patch.openingHours = parsed.rules;
        patch.closedDays = parsed.closedDays;
      } else {
        const closed = parseClosedDaysOnly(tags.opening_hours);
        if (closed) patch.closedDays = closed;
        gap(d.city, `- **${item.name}** (${item.kind}): OSM opening_hours \`${tags.opening_hours}\` uses syntax we do not model (holidays, seasons or sunrise/sunset); hours left undefined.${parseClosedDaysOnly(tags.opening_hours) ? " The weekly closed day(s) are still recorded." : ""}`);
      }
    }
    patchPlace(overlay, item.id, patch);
    matched[item.id] = { r };
  }

  if (wikidataNeeded.length > 0) {
    const sites = await wikidataWebsites(wikidataNeeded.map((w) => w.qid));
    for (const w of wikidataNeeded) {
      const url = normaliseUrl(sites[w.qid]);
      if (url) patchPlace(overlay, w.id, { officialUrl: url });
    }
  }

  // Neighborhood centres: OSM first, then centroid of verified member places.
  overlay.neighborhoods ??= {};
  for (const n of d.neighborhoods) {
    const res = await nominatim({
      q: `${n.name.replace(/\s*\([^)]*\)/g, "")}, ${d.city}`,
      viewbox,
      bounded: "1",
      extratags: "0",
      namedetails: "1",
    });
    const cand = res
      .map((r) => ({ r, score: nameScore(n.name.replace(/\s*\([^)]*\)/g, ""), r) }))
      .filter((c) => inBox(Number(c.r.lat), Number(c.r.lon), box))
      .sort((a, b) => b.score - a.score)[0];
    if (cand && cand.score >= 0.6) {
      let radius = 0.8;
      if (cand.r.boundingbox) {
        const [s, nn, w, e] = cand.r.boundingbox.map(Number);
        const dy = (nn - s) * 111;
        const dx = (e - w) * 111 * Math.cos((Number(cand.r.lat) * Math.PI) / 180);
        radius = Math.min(3, Math.max(0.4, Math.hypot(dx, dy) / 2));
      }
      overlay.neighborhoods[n.id] = {
        coords: { lat: Number(Number(cand.r.lat).toFixed(6)), lng: Number(Number(cand.r.lon).toFixed(6)) },
        radiusKm: Number(radius.toFixed(2)),
      };
    } else {
      const members = [...d.landmarks, ...d.restaurants, ...d.cafes, ...d.shopping, ...d.nightlife]
        .filter((p) => p.neighborhood === n.name)
        .map((p) => overlay.places?.[p.id]?.coords)
        .filter(Boolean) as { lat: number; lng: number }[];
      if (members.length > 0) {
        const lat = members.reduce((a, c) => a + c.lat, 0) / members.length;
        const lng = members.reduce((a, c) => a + c.lng, 0) / members.length;
        overlay.neighborhoods[n.id] = { coords: { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) }, radiusKm: 0.8 };
        gap(d.city, `- **Neighborhood ${n.name}**: no OSM area match; centre is the centroid of ${members.length} verified venue(s) and radius is a 0.8 km default.`);
      } else {
        gap(d.city, `- **Neighborhood ${n.name}**: no confident OSM match and no verified venues inside it; centre left undefined.`);
      }
    }
  }
  writeOverlay(d.slug, overlay);
  saveCache();
}

async function main() {
  const only = process.argv.slice(2);
  const list = destinations.filter((d) => only.length === 0 || only.includes(d.slug));
  fs.mkdirSync(path.join(process.cwd(), "scripts", ".cache"), { recursive: true });
  for (const d of list) {
    const t0 = Date.now();
    await enrichCity(d);
    // Write per-city gap fragment so batches can be run independently.
    fs.writeFileSync(path.join(CACHE_DIR, `gaps-${d.slug}.md`), (GAP_LINES[d.city] ?? []).join("\n") + "\n");
    console.log(`${d.slug}: done in ${Math.round((Date.now() - t0) / 1000)}s, ${(GAP_LINES[d.city] ?? []).length} gap(s)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
