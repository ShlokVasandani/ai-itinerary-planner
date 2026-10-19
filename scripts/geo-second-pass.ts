/**
 * Third-chance lookup for venues still without coordinates: free-text Nominatim search for
 * "<name> <city>" without the strict viewbox, accepted only if the result sits inside the city's box and
 * its name shares enough tokens with ours. Applies coords, website, opening hours and the OSM source link.
 *
 * Usage: npx tsx scripts/geo-second-pass.ts slug [slug ...]
 */
import { destinations } from "../lib/data";
import { patchPlace, readOverlay, writeOverlay } from "./lib/overlay";
import { parseClosedDaysOnly, parseOsmHours } from "./lib/osm-hours";
import { getJson } from "./open/lib/http";
import { safeHttpUrl } from "../lib/safe-url";

const TODAY = new Date().toISOString().slice(0, 10);
const fold = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
const STOP = new Set(["the", "a", "an", "of", "de", "la", "le", "el", "il", "di", "and", "at", "in", "to", "du", "des", "von", "am", "der", "die", "das", "del", "da", "do", "restaurant", "cafe", "bar", "co", "inc"]);
const tokens = (s: string) => fold(s).split(" ").filter((t) => t && !STOP.has(t));

interface R {
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
  category?: string;
  extratags?: Record<string, string>;
  namedetails?: Record<string, string>;
}

function score(query: string, r: R): number {
  const q = tokens(query);
  if (!q.length) return 0;
  let best = 0;
  for (const c of [r.name, ...Object.values(r.namedetails ?? {}), r.display_name.split(",")[0]].filter(Boolean) as string[]) {
    const t = new Set(tokens(c));
    if (!t.size) continue;
    const hit = q.filter((x) => t.has(x)).length;
    const recall = hit / q.length;
    const precision = hit / t.size;
    best = Math.max(best, Math.min(recall, recall * 0.5 + precision * 0.5 + 0.25));
  }
  return best;
}

async function main() {
  for (const slug of process.argv.slice(2)) {
    const d = destinations.find((x) => x.slug === slug);
    if (!d) throw new Error(`unknown ${slug}`);
    const overlay = readOverlay(slug);
    const box = overlay.bbox ?? d.bbox;
    if (!box) continue;
    const todo = [...d.restaurants, ...d.cafes, ...d.nightlife, ...d.shopping, ...d.landmarks].filter((x) => !x.coords);
    let fixed = 0;
    for (const item of todo) {
      const names = [item.name, item.name.replace(/\s*\([^)]*\)/g, "").trim()].filter((v, i, a) => a.indexOf(v) === i);
      let best: { r: R; s: number } | undefined;
      for (const n of names) {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&addressdetails=0&extratags=1&namedetails=1&accept-language=en&q=${encodeURIComponent(`${n}, ${d.city}`)}`;
        let res: R[] = [];
        try {
          res = await getJson<R[]>(url, { retries: 3 });
        } catch {
          continue;
        }
        for (const r of res) {
          const lat = Number(r.lat);
          const lng = Number(r.lon);
          if (lat < box[0] || lat > box[2] || lng < box[1] || lng > box[3]) continue;
          if (/^(highway|boundary|place|waterway|natural)$/.test(r.category ?? "")) continue;
          const s = score(n, r);
          if (s >= 0.6 && (!best || s > best.s)) best = { r, s };
        }
        if (best) break;
      }
      if (!best) continue;
      const t = best.r.extratags ?? {};
      const patch: Record<string, unknown> = {
        coords: { lat: Number(Number(best.r.lat).toFixed(6)), lng: Number(Number(best.r.lon).toFixed(6)) },
        sources: [`https://www.openstreetmap.org/${best.r.osm_type}/${best.r.osm_id}`],
        verifiedAt: TODAY,
      };
      const web = safeHttpUrl(t.website ?? t["contact:website"]);
      if (web && !item.officialUrl && !/(facebook|instagram|tripadvisor|yelp|google|booking)\./i.test(web)) patch.officialUrl = web;
      if (t.opening_hours) {
        const p = parseOsmHours(t.opening_hours);
        if (p) {
          patch.openingHours = p.rules;
          patch.closedDays = p.closedDays;
        } else {
          const c = parseClosedDaysOnly(t.opening_hours);
          if (c) patch.closedDays = c;
        }
      }
      patchPlace(overlay, item.id, patch);
      fixed++;
    }
    writeOverlay(slug, overlay);
    console.log(`${slug}: ${fixed}/${todo.length} more located`);
  }
}
main();
