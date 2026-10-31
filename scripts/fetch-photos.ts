/**
 * Downloads the licensed Wikimedia Commons photos listed in
 * lib/city-photo-urls.ts into public/images/destinations/<slug>.jpg and
 * generates responsive AVIF/WebP variants plus a tiny blurred placeholder.
 * Writes lib/photo-manifest.json, which the UI reads for srcset/width/height.
 *
 * Usage: npx tsx scripts/fetch-photos.ts [slug ...]
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { cityPhotos } from "../lib/city-photo-urls";

const UA = "SekaiItineraryPlanner/1.0 (+https://github.com/ShlokVasandani/ai-itinerary-planner)";
const OUT = path.join(process.cwd(), "public", "images", "destinations");
const MANIFEST = path.join(process.cwd(), "lib", "photo-manifest.json");
const WIDTHS = [480, 960, 1440, 1920];

interface Entry {
  width: number;
  height: number;
  widths: number[];
  blur: string;
}

async function download(filename: string): Promise<Buffer> {
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename.replace(/ /g, "_"))}?width=1920`;
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    if (res.status === 429) await new Promise((r) => setTimeout(r, 4000 * (attempt + 1)));
    else throw new Error(`${filename}: HTTP ${res.status}`);
  }
  throw new Error(`${filename}: rate limited`);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  let manifest: Record<string, Entry> = {};
  try {
    manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  } catch {
    manifest = {};
  }
  const only = process.argv.slice(2);
  for (const [slug, photo] of Object.entries(cityPhotos)) {
    if (only.length && !only.includes(slug)) continue;
    process.stdout.write(`${slug}: `);
    try {
      const input = await download(photo.commonsFilename);
      const base = sharp(input).rotate();
      const meta = await base.metadata();
      const srcW = meta.width ?? 1920;
      const srcH = meta.height ?? 1280;
      const widths = WIDTHS.filter((w) => w <= srcW);
      if (widths.length === 0) widths.push(srcW);
      // Canonical JPEG named after the slug.
      await sharp(input).rotate().resize({ width: Math.min(1920, srcW) }).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(OUT, `${slug}.jpg`));
      for (const w of widths) {
        const resized = sharp(input).rotate().resize({ width: w, withoutEnlargement: true });
        await resized.clone().webp({ quality: 76 }).toFile(path.join(OUT, `${slug}-${w}.webp`));
        await resized.clone().avif({ quality: 52, effort: 4 }).toFile(path.join(OUT, `${slug}-${w}.avif`));
      }
      const blurBuf = await sharp(input).rotate().resize({ width: 24 }).blur(1.2).webp({ quality: 50 }).toBuffer();
      const outW = Math.min(1920, srcW);
      manifest[slug] = {
        width: outW,
        height: Math.round((srcH / srcW) * outW),
        widths,
        blur: `data:image/webp;base64,${blurBuf.toString("base64")}`,
      };
      console.log(`ok (${srcW}x${srcH}, ${widths.join("/")})`);
    } catch (e) {
      console.log(`FAILED ${(e as Error).message}`);
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
}

main();
