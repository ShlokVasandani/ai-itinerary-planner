/**
 * Replaces a city's photo with the best licensed Commons match for a search query.
 * Usage: npx tsx scripts/photo-search.ts <slug> "<commons search>" "<alt subject>"
 */
import { destinations } from "../lib/data";
import { getJson } from "./open/lib/http";
import { pickPhoto, readPhotos, writePhotos } from "./open/photos";

async function main() {
  const [slug, query, subject] = process.argv.slice(2);
  const d = destinations.find((x) => x.slug === slug);
  if (!d) throw new Error(`unknown ${slug}`);
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srnamespace=6&srlimit=25&srsearch=${encodeURIComponent(query + " filetype:bitmap")}`;
  const res = await getJson<{ query: { search: { title: string }[] } }>(url);
  const files = res.query.search.map((s) => s.title.replace(/^File:/, ""));
  const city = { qid: "", label: d.city, lat: 0, lng: 0, countryQid: "", countryLabel: d.country, sitelinks: 0 };
  const photo = await pickPhoto(d, city, files.map((f) => ({ name: subject, file: f })));
  if ("error" in photo) {
    console.log(slug, photo.error);
    return;
  }
  const all = readPhotos();
  all[slug] = photo;
  writePhotos(all);
  console.log(`${slug}: ${photo.commonsFilename} (${photo.license}) ${photo.width}x${photo.height}`);
}
main();
