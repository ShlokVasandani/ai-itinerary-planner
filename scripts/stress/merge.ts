/**
 * Replaces some cities in a stress-test result with a re-run of those cities, then rewrites the report. Use it when a
 * busy machine made a few Playwright steps time out in a parallel run: re-run just those cities with --jobs 1, merge,
 * and the report says which cities were replaced.
 *
 *   npx tsx scripts/stress/merge.ts <full-results.json> <rerun-results.json> [outDir=reports]
 */
import { readFileSync } from "node:fs";
import { writeReport } from "./report";
import type { CityResult, TileResult } from "./model";

const [fullPath, rerunPath, out = "reports"] = process.argv.slice(2);
const full = JSON.parse(readFileSync(fullPath, "utf8")) as { meta: Parameters<typeof writeReport>[1]; cities: CityResult[]; tiles: TileResult[] };
const rerun = JSON.parse(readFileSync(rerunPath, "utf8")) as { cities: CityResult[] };
const replaced = rerun.cities.map((c) => c.slug);
const cities = full.cities.map((c) => rerun.cities.find((r) => r.slug === c.slug) ?? c);
writeReport(out, full.meta, cities, full.tiles, `Cities re-run on their own after load-induced timeouts in the parallel run, and merged in: ${replaced.join(", ")}.`);
console.log(`merged ${replaced.length} cities into ${cities.length}; report: ${out}/stress-test.md`);
