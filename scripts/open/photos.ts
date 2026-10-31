/**
 * Picks, downloads and optimises one licensed Wikimedia Commons photo per open-data city.
 * Candidates, in order: the city's Wikidata image, its Wikipedia lead image, then the images of
 * its top landmarks. A file is accepted only if it is landscape, large enough and under a
 * redistributable license (CC0, public domain, CC BY, CC BY-SA); NC/ND files are rejected.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { commonsInfo, OK_LICENSE } from "./lib/commons";
import { pageImageFile } from "./lib/wikipedia";
import { UA, sleep } from "./lib/http";
import type { Destination } from "../../lib/types";
import type { CityRecord } from "./lib/wikidata";

export interface OpenPhoto {
  alt: string;
  credit: string;
  license: string;
  sourcePage: string;
  commonsFilename: string;
  width: number;
  height: number;
  widths: number[];
  blur: string;
}

const OUT = path.join(process.cwd(), "public", "images", "destinations");
export const PHOTOS_FILE = path.join(process.cwd(), "lib", "data", "open", "photos.json");
const WIDTHS = [480, 960, 1440];

export function readPhotos(): Record<string, OpenPhoto> {
  try {
    return JSON.parse(fs.readFileSync(PHOTOS_FILE, "utf8"));
  } catch {
    return {};
  }
}
export function writePhotos(p: Record<string, OpenPhoto>) {
  fs.mkdirSync(path.dirname(PHOTOS_FILE), { recursive: true });
  const sorted = Object.fromEntries(Object.entries(p).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(PHOTOS_FILE, JSON.stringify(sorted, null, 1) + "\n");
}

async function download(filename: string): Promise<Buffer> {
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename.replace(/ /g, "_"))}?width=1920`;
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    if (res.status === 429 || res.status >= 500) await sleep(4000 * (attempt + 1));
    else throw new Error(`HTTP ${res.status}`);
  }
  throw new Error("rate limited");
}

const BAD_NAME = /\b(map|flag|coat|logo|seal|locator|location|diagram|plan\b|panorama of|aerial photograph? of the region)\b|\.svg$|\.png$|\.gif$/i;

export async function pickPhoto(d: Destination, city: CityRecord, landmarkImages: { name: string; file: string }[]): Promise<OpenPhoto | { error: string }> {
  const candidates: { file: string; subject: string }[] = [];
  if (city.image) candidates.push({ file: city.image, subject: d.city });
  if (city.enwiki) {
    const lead = await pageImageFile(city.enwiki);
    if (lead) candidates.push({ file: lead, subject: d.city });
  }
  for (const l of landmarkImages.slice(0, 6)) candidates.push({ file: l.file, subject: `${l.name}, ${d.city}` });
  const seen = new Set<string>();
  const tried: string[] = [];
  for (const c of candidates) {
    const key = c.file.replace(/_/g, " ");
    if (seen.has(key) || BAD_NAME.test(key)) continue;
    seen.add(key);
    const info = await commonsInfo(key);
    if (!info) {
      tried.push(`${key}: no info`);
      continue;
    }
    const ratio = info.width / info.height;
    if (!OK_LICENSE.test(info.license)) {
      tried.push(`${key}: license "${info.license}"`);
      continue;
    }
    if (info.width < 1500 || info.height < 900 || ratio < 1.2 || ratio > 2.3) {
      tried.push(`${key}: ${info.width}x${info.height}`);
      continue;
    }
    try {
      const buf = await download(info.filename);
      const base = sharp(buf).rotate();
      const meta = await base.metadata();
      const srcW = meta.width ?? 1920;
      const srcH = meta.height ?? 1280;
      if (srcW < 1200) {
        tried.push(`${key}: delivered ${srcW}px`);
        continue;
      }
      fs.mkdirSync(OUT, { recursive: true });
      const widths = WIDTHS.filter((w) => w <= srcW);
      await sharp(buf).rotate().resize({ width: Math.min(1280, srcW) }).jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(OUT, `${d.slug}.jpg`));
      for (const w of widths) {
        const r = sharp(buf).rotate().resize({ width: w, withoutEnlargement: true });
        await r.clone().webp({ quality: 74 }).toFile(path.join(OUT, `${d.slug}-${w}.webp`));
        await r.clone().avif({ quality: 48, effort: 3 }).toFile(path.join(OUT, `${d.slug}-${w}.avif`));
      }
      const blur = await sharp(buf).rotate().resize({ width: 24 }).blur(1.2).webp({ quality: 50 }).toBuffer();
      const outW = Math.min(1280, srcW);
      return {
        alt: c.subject === d.city ? `${d.city}${info.description ? `: ${info.description.replace(/\.$/, "")}` : ""}`.slice(0, 160) : c.subject,
        credit: info.artist,
        license: info.license,
        sourcePage: info.sourcePage,
        commonsFilename: info.filename,
        width: outW,
        height: Math.round((srcH / srcW) * outW),
        widths,
        blur: `data:image/webp;base64,${blur.toString("base64")}`,
      };
    } catch (e) {
      tried.push(`${key}: ${(e as Error).message}`);
    }
  }
  return { error: `no usable photo (${tried.slice(0, 4).join("; ") || "no candidates"})` };
}
