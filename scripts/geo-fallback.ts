/**
 * Second pass after scripts/enrich-geo.ts: for places that OpenStreetMap free-text search could not place,
 * look the name up on Wikidata and take its coordinates and official website (P625 / P856).
 * A match must have an English Wikipedia article, lie inside the city's box (or within 200 km for day trips)
 * and share enough name tokens. Anything else stays undefined and is listed in data-gaps.md.
 *
 * Usage: npx tsx scripts/geo-fallback.ts slug [slug ...]
 */
import { destinations } from "../lib/data";
import { haversineKm } from "../lib/engine/geo";
import { patchPlace, readOverlay, writeOverlay } from "./lib/overlay";
import { getEntities } from "./open/lib/wikidata";
import { getJson } from "./open/lib/http";

const TODAY = new Date().toISOString().slice(0, 10);
const fold = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
const STOP = new Set(["the", "a", "an", "of", "de", "la", "le", "el", "il", "di", "and", "at", "in", "to", "du", "des", "von", "am", "der", "die", "das", "del", "da", "do"]);
const tokens = (s: string) => fold(s).split(" ").filter((t) => t && !STOP.has(t));

function variants(name: string): string[] {
  const out = new Set<string>();
  const clean = name.replace(/\s*\([^)]*\)/g, "").trim();
  out.add(clean);
  for (const sep of [" and the ", " and ", " & ", " / "]) if (clean.includes(sep)) out.add(clean.split(sep)[0].trim());
  const paren = name.match(/\(([^)]+)\)/)?.[1];
  if (paren && !/seasonal|widespread|only|citywide/i.test(paren)) out.add(paren);
  return [...out].filter((v) => v.length > 2);
}

function score(query: string, labels: string[]): number {
  const q = tokens(query);
  if (!q.length) return 0;
  let best = 0;
  for (const l of labels) {
    const t = new Set(tokens(l));
    if (!t.size) continue;
    const hit = q.filter((x) => t.has(x)).length;
    const recall = hit / q.length;
    const precision = hit / t.size;
    best = Math.max(best, Math.min(recall, recall * 0.5 + precision * 0.5 + 0.25));
  }
  return best;
}

const claimVal = (e: { claims?: Record<string, { mainsnak?: { datavalue?: { value?: unknown } } }[]> }, p: string) => e.claims?.[p]?.[0]?.mainsnak?.datavalue?.value;

async function main() {
  for (const slug of process.argv.slice(2)) {
    const d = destinations.find((x) => x.slug === slug);
    if (!d) throw new Error(`unknown city ${slug}`);
    const overlay = readOverlay(slug);
    const box = overlay.bbox ?? d.bbox;
    const centre = box ? { lat: (box[0] + box[2]) / 2, lng: (box[1] + box[3]) / 2 } : undefined;
    const todo = [
      ...d.landmarks, ...d.restaurants, ...d.cafes, ...d.shopping, ...d.nightlife, ...d.dayTrips,
    ].filter((x) => !x.coords);
    let fixed = 0;
    for (const item of todo) {
      const isTrip = d.dayTrips.some((t) => t.id === item.id);
      let done = false;
      for (const v of variants(item.name)) {
        const search = await getJson<{ search?: { id: string }[] }>(`https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&type=item&limit=6&search=${encodeURIComponent(v)}`);
        const ids = (search.search ?? []).map((s) => s.id);
        if (!ids.length) continue;
        const ents = await getEntities(ids);
        let best: { id: string; s: number; lat: number; lng: number; web?: string } | undefined;
        for (const e of Object.values(ents)) {
          const c = claimVal(e, "P625") as { latitude?: number; longitude?: number } | undefined;
          if (!c?.latitude || !e.sitelinks?.enwiki) continue;
          const here = { lat: c.latitude, lng: c.longitude! };
          if (centre && (isTrip ? haversineKm(centre, here) > 200 : box && (here.lat < box[0] || here.lat > box[2] || here.lng < box[1] || here.lng > box[3]))) continue;
          const labels = [e.labels?.en?.value, ...(e.aliases?.en ?? []).map((a) => a.value)].filter(Boolean) as string[];
          const s = score(v, labels);
          if (s >= 0.6 && (!best || s > best.s)) best = { id: e.id, s, lat: here.lat, lng: here.lng, web: claimVal(e, "P856") as string | undefined };
        }
        if (best) {
          const patch: Record<string, unknown> = {
            coords: { lat: Number(best.lat.toFixed(6)), lng: Number(best.lng.toFixed(6)) },
            sources: [`https://www.wikidata.org/wiki/${best.id}`],
            verifiedAt: TODAY,
          };
          if (best.web && /^https?:\/\//.test(best.web) && !item.officialUrl) patch.officialUrl = best.web;
          patchPlace(overlay, item.id, patch);
          fixed++;
          done = true;
          break;
        }
      }
      void done;
    }
    writeOverlay(slug, overlay);
    console.log(`${slug}: located ${fixed} of ${todo.length} previously unplaced records via Wikidata`);
  }
}
main();
