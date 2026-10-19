/**
 * Picks and processes a licensed Wikimedia Commons photo for each hand-curated city that has none yet
 * (the original 20 already have photos in lib/city-photo-urls.ts). Results go to lib/data/open/photos.json,
 * which lib/photos.ts merges, so credits, alt text and responsive images work like the original ones.
 *
 * Usage: npx tsx scripts/curated-photos.ts [slug ...]
 */
import { destinations } from "../lib/data";
import { photoManifest } from "../lib/photos";
import { cityPhotos } from "../lib/city-photo-urls";
import { pickPhoto, readPhotos, writePhotos } from "./open/photos";
import { getEntities, resolveCity } from "./open/lib/wikidata";
import { getJson } from "./open/lib/http";

const COUNTRY_FIX: Record<string, string> = { Czechia: "Czechia" };

async function landmarkImages(names: string[]): Promise<{ name: string; file: string }[]> {
  const out: { name: string; file: string }[] = [];
  for (const name of names.slice(0, 8)) {
    const s = await getJson<{ search?: { id: string }[] }>(`https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&type=item&limit=3&search=${encodeURIComponent(name)}`);
    const ids = (s.search ?? []).map((x) => x.id);
    if (!ids.length) continue;
    const ents = await getEntities(ids, "claims|labels");
    for (const e of Object.values(ents)) {
      const f = e.claims?.P18?.[0]?.mainsnak?.datavalue?.value as string | undefined;
      if (f) {
        out.push({ name, file: f });
        break;
      }
    }
  }
  return out;
}

async function main() {
  const only = process.argv.slice(2);
  const photos = readPhotos();
  for (const d of destinations) {
    if (only.length && !only.includes(d.slug)) continue;
    if (photoManifest[d.slug] || cityPhotos[d.slug] || photos[d.slug]) continue;
    process.stdout.write(`${d.slug}: `);
    const city = await resolveCity({ city: d.city, country: COUNTRY_FIX[d.country] ?? d.country, region: "Europe" });
    if ("error" in city) {
      console.log(`no Wikidata match (${city.error})`);
      continue;
    }
    let res = await pickPhoto(d, city, []);
    if ("error" in res) res = await pickPhoto(d, city, await landmarkImages(d.landmarks.map((l) => l.name)));
    if ("error" in res) {
      console.log(res.error);
      continue;
    }
    photos[d.slug] = res;
    writePhotos(photos);
    console.log(`ok (${res.license}, ${res.width}x${res.height}) ${res.commonsFilename}`);
  }
}
main();
