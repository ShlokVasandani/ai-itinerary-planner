/**
 * Builds open-data cities until `--target` total destinations (20 curated + open) are published.
 *
 *   npx tsx scripts/open/pipeline.ts --target 50 [--concurrency 2]
 *
 * For each seed, in order: build from open data -> photo -> link liveness -> all quality
 * checks. Cities that fail are rejected (reason recorded in docs/open-data/rejected.json) and the
 * next seed is tried, so the target is met from the reserve list. Re-running resumes where it stopped.
 */
import fs from "node:fs";
import path from "node:path";
import { SEEDS } from "./seeds";
import { buildCity } from "./build-city";
import { pickPhoto, readPhotos, writePhotos } from "./photos";
import { runAllChecks, type Finding } from "./checks";
import { isAlive, pool } from "./lib/linkcheck";
import { publishIndex } from "./publish";
import type { Destination } from "../../lib/types";

const arg = (name: string, fallback: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
};
const TARGET = Number(arg("target", "50"));
const CONCURRENCY = Number(arg("concurrency", "2"));
const CURATED = 20;

const OPEN_DIR = path.join(process.cwd(), "lib", "data", "open");
const DOCS = path.join(process.cwd(), "docs", "open-data");
const REJECTED = path.join(DOCS, "rejected.json");
fs.mkdirSync(OPEN_DIR, { recursive: true });
fs.mkdirSync(DOCS, { recursive: true });

interface Rejection {
  city: string;
  country: string;
  reason: string;
  findings?: Finding[];
  at: string;
}
const readJson = <T>(p: string, fallback: T): T => {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as T;
  } catch {
    return fallback;
  }
};

const rejected: Record<string, Rejection> = readJson(REJECTED, {});
const publishedSlugs = () => new Set(fs.readdirSync(OPEN_DIR).filter((f) => f.endsWith(".json") && !["index.json", "photos.json"].includes(f)).map((f) => f.replace(/\.json$/, "")));
const log = (...a: unknown[]) => console.log(new Date().toISOString().slice(11, 19), ...a);

async function dropDeadLinks(d: Destination): Promise<string[]> {
  const items = [...d.landmarks, ...d.restaurants, ...d.cafes, ...d.nightlife, ...d.shopping];
  const withUrl = items.filter((x) => x.officialUrl);
  const dropped: string[] = [];
  await pool(withUrl, 12, async (x) => {
    if (!(await isAlive(x.officialUrl!))) {
      dropped.push(`${x.name}: ${x.officialUrl}`);
      delete x.officialUrl;
    }
  });
  return dropped;
}

async function processSeed(seed: (typeof SEEDS)[number]): Promise<{ ok: boolean; slug?: string }> {
  const key = `${seed.city}|${seed.country}`;
  const taken = publishedSlugs();
  try {
    const r = await buildCity(seed, taken);
    if (!r.dest || !r.city) {
      rejected[key] = { city: seed.city, country: seed.country, reason: r.error ?? "build failed", at: new Date().toISOString() };
      log(`✗ ${seed.city}: ${r.error}`);
      return { ok: false };
    }
    const d = r.dest;
    const photos = readPhotos();
    const photo = await pickPhoto(d, r.city, r.landmarkImages ?? []);
    let ph = "error" in photo ? undefined : photo;
    if ("error" in photo) log(`  ${d.slug}: ${photo.error}`);
    const dead = await dropDeadLinks(d);
    const findings = runAllChecks(d, ph);
    const errors = findings.filter((f) => f.level === "error");
    if (errors.length) {
      rejected[key] = { city: seed.city, country: seed.country, reason: `${errors.length} check error(s)`, findings: findings.slice(0, 40), at: new Date().toISOString() };
      log(`✗ ${seed.city}: ${errors.slice(0, 3).map((e) => `[${e.check}] ${e.message}`).join(" | ")}`);
      return { ok: false };
    }
    fs.writeFileSync(path.join(OPEN_DIR, `${d.slug}.json`), JSON.stringify(d, null, 1) + "\n");
    if (ph) {
      photos[d.slug] = ph;
      writePhotos(photos);
    }
    delete rejected[key];
    log(`✓ ${seed.city} (${d.slug}) lm=${d.landmarks.length} r=${d.restaurants.length} c=${d.cafes.length} n=${d.nightlife.length} h=${d.neighborhoods.length} photo=${ph ? "yes" : "no"} deadLinks=${dead.length} warns=${findings.length}`);
    return { ok: true, slug: d.slug };
  } catch (e) {
    rejected[key] = { city: seed.city, country: seed.country, reason: `exception: ${(e as Error).message}`, at: new Date().toISOString() };
    log(`✗ ${seed.city}: exception ${(e as Error).message}`);
    return { ok: false };
  }
}

async function main() {
  const have = () => publishedSlugs().size;
  const need = () => TARGET - CURATED - have();
  log(`target ${TARGET}: ${CURATED} curated + ${have()} open published, ${Math.max(0, need())} to build`);
  const queue = SEEDS.filter((s) => !rejected[`${s.city}|${s.country}`] && !fs.existsSync(path.join(OPEN_DIR, `${s.city.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`)));
  let cursor = 0;
  let inFlight = 0;
  await new Promise<void>((resolve) => {
    const pump = () => {
      // Start another city only while published + in-flight is below the target; failures free a slot, so the reserve list backfills.
      while (inFlight < CONCURRENCY && cursor < queue.length && have() + inFlight < TARGET - CURATED) {
        const seed = queue[cursor++];
        inFlight++;
        processSeed(seed).then(() => {
          inFlight--;
          fs.writeFileSync(REJECTED, JSON.stringify(rejected, null, 1) + "\n");
          pump();
        });
      }
      if (inFlight === 0) resolve();
    };
    pump();
  });
  publishIndex();
  const total = CURATED + have();
  log(`published ${total} destinations (${have()} open). rejected so far: ${Object.keys(rejected).length}`);
  if (total < TARGET) {
    console.error(`target not reached: ${total}/${TARGET}`);
    process.exit(2);
  }
}
main();
