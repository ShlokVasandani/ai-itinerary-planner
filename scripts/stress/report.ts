/** Writes reports/stress-test.md (and the raw JSON) from the collected results. */
import { mkdirSync, writeFileSync } from "node:fs";
import { GROUPS } from "./scenarios";
import type { CityResult, Failure, PlanResult, TileResult } from "./model";
import { INFO_CHECKS } from "./model";

const MEANING: Record<string, string> = {
  "dates.day-count": "day cards differ from the date range / chosen length",
  "dates.date": "a day's date is wrong",
  "dates.weekday": "a day's weekday is wrong",
  "hours.closed-scheduled": "a venue is scheduled on a day it is closed",
  "hours.outside-window": "a visit runs outside the venue's opening window",
  "time.order": "stops are not in chronological order",
  "time.overlap": "a stop starts before the previous one ends",
  "time.late-start": "a stop starts after 00:30",
  "time.meal-window": "a meal lands outside a sensible window",
  "flight.arrival": "a day-1 stop starts before landing + 2h30",
  "flight.departure": "a last-day stop runs past flight - 3h",
  "price.range": "likely price falls outside [min, max]",
  "price.day-sum": "day total differs from the sum of its stops",
  "price.trip-sum": "trip total differs from the sum of its days",
  "price.party-total": "party total differs from per-person x travellers",
  "price.currency": "plan currency differs from the city's",
  "price.mixed-currency": "a stop is priced in a different currency from the plan",
  "price.nan": "NaN / undefined / non-finite price",
  "price.negative": "negative price",
  "price.unknown-count": "'price not listed' count is wrong",
  "diet.mismatch": "a restaurant ruled out for the dietary need was scheduled",
  "skip.present": "a skipped place is in the plan",
  "must.missing": "a must-include place is missing and not explained",
  "map.outlier": "a stop is implausibly far from the city centre",
  "map.container": "map host lost .leaflet-container",
  "map.tiles": "map never loaded a tile",
  "map.attribution": "attribution text larger than 13px",
  "map.markers": "marker count differs from the located stops",
  "map.numbering": "marker numbering / titles differ from stop order",
  "map.marker-outside": "a marker sits outside the map frame",
  "map.missing": "neither a map nor a 'no map' note rendered",
  "robust.console": "console error or uncaught exception",
  "robust.hydration": "hydration warning",
  "robust.request": "failed or 4xx/5xx request",
  "robust.overflow-1440": "page scrolls sideways at 1440px",
  "robust.overflow-390": "page scrolls sideways at 390px",
  "robust.exception": "the harness could not complete the step (see detail)",
};
const meaning = (c: string) => MEANING[c] ?? (c.startsWith("interest.") ? "selected interest has no matching stop" : c.startsWith("render.") ? "page differs from what the engine produced" : c.startsWith("prop.") ? "a single-input change did not propagate correctly" : "");

const isFail = (f: Failure) => !INFO_CHECKS.has(f.check);

export function writeReport(
  dir: string,
  meta: { base: string; commit: string; started: string; ms: number; jobs: number },
  cities: CityResult[],
  tiles: TileResult[]
) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/stress-results.json`, JSON.stringify({ meta, cities, tiles }, null, 1));
  const L: string[] = [];
  const all = cities.flatMap((c) => c.plans.map((p) => ({ c, p })));
  const failing = all.filter(({ p }) => p.failures.some(isFail));
  const byCheck = new Map<string, { entries: { c: CityResult; p: PlanResult; f: Failure }[]; cities: Set<string>; plans: Set<PlanResult> }>();
  for (const { c, p } of all)
    for (const f of p.failures.filter(isFail)) {
      const e = byCheck.get(f.check) ?? { entries: [], cities: new Set(), plans: new Set() };
      e.entries.push({ c, p, f });
      e.cities.add(c.slug);
      e.plans.add(p);
      byCheck.set(f.check, e);
    }

  L.push("# Sekai stress test", "");
  L.push(`Phase 1 report. Nothing has been fixed yet.`, "");
  L.push(`- Server: \`${meta.base}\` (production build), commit \`${meta.commit}\``);
  L.push(`- Run: ${meta.started}, ${Math.round(meta.ms / 60000)} min, ${meta.jobs} parallel workers, fixed seed \`stress-v1\``);
  L.push(`- Cities: ${cities.length}. Plans built and checked in the browser: **${all.length}**. Plans with at least one failure: **${failing.length}**. Distinct failure types: **${byCheck.size}**.`);
  L.push(`- Map tiles in this run: a local 1x1 PNG stub for every plan; real OpenStreetMap tiles only in the three-city check below.`, "");

  L.push("## Failures by type", "");
  if (!byCheck.size) L.push("No failures.", "");
  else {
    L.push("| Type | Failures | Plans | Cities | Meaning | First example |", "| --- | ---: | ---: | ---: | --- | --- |");
    for (const [check, e] of [...byCheck].sort((a, b) => b[1].entries.length - a[1].entries.length)) {
      const x = e.entries[0];
      L.push(`| \`${check}\` | ${e.entries.length} | ${e.plans.size} | ${e.cities.size} | ${meaning(check)} | ${x.c.slug} ${x.p.scenario}: ${x.f.detail.replace(/\|/g, "/").slice(0, 110)} |`);
    }
    L.push("");
  }

  L.push("## Pass/fail matrix", "", "Each cell counts the plans in that group; a cell shows ✅ when every plan passed, otherwise ❌ with `failing/total`. Group I is the chain of single-input changes.", "");
  const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
  L.push(`| City | ${groups.map((g) => `${g} ${g === "I" ? "propagation" : GROUPS[g]}`).join(" | ")} |`, `| --- | ${groups.map(() => ":---:").join(" | ")} |`);
  for (const c of cities) {
    const cells = groups.map((g) => {
      const ps = c.plans.filter((p) => p.group === g);
      if (!ps.length) return "·";
      const bad = ps.filter((p) => p.failures.some(isFail)).length;
      return bad ? `❌ ${bad}/${ps.length}` : `✅ ${ps.length}`;
    });
    L.push(`| ${c.city} | ${cells.join(" | ")} |`);
  }
  L.push("");

  L.push("## Real map tiles (Tokyo, Lisbon, Rome)", "");
  if (!tiles.length) L.push("Not run.", "");
  else {
    L.push("Run one city at a time, one tile request at a time with a 1 s pause, capped at 30 requests per city.", "", "| City | Tiles loaded (naturalWidth > 0) | Tile requests | Attribution | Result |", "| --- | ---: | ---: | ---: | --- |");
    for (const t of tiles) L.push(`| ${t.city} | ${t.tilesLoaded} | ${t.tileRequests} | ${t.attributionPx}px | ${t.failures.length ? "❌ " + t.failures.map((f) => f.detail).join("; ") : "✅"} |`);
    L.push("", ...tiles.filter((t) => t.screenshot).map((t) => `![${t.city} day 1 with real tiles](screenshots/real-tiles-${t.slug}.jpg)`), "");
  }

  L.push("## Failure details", "", "Every failure, grouped by type, with the scenario it came from. The exact inputs of each scenario are in the appendix.", "");
  for (const [check, e] of [...byCheck].sort((a, b) => b[1].entries.length - a[1].entries.length)) {
    L.push(`### \`${check}\` (${e.entries.length})`, "", meaning(check), "");
    const seen = new Set<string>();
    for (const { c, p, f } of e.entries) {
      const line = `- **${c.slug}** \`${p.scenario}\`: ${f.detail}`;
      if (seen.has(line)) continue;
      seen.add(line);
      L.push(line);
    }
    L.push("");
  }

  const notes = new Map<string, number>();
  for (const { p } of all) {
    for (const f of p.failures.filter((x) => !isFail(x))) notes.set(f.check, (notes.get(f.check) ?? 0) + 1);
  }
  if (notes.size) {
    L.push("## Informational (not counted as failures)", "");
    for (const [k, n] of notes) L.push(`- \`${k}\` x${n}: ${k === "must.missing-with-warning" ? "a must-include place could not be scheduled and the plan says so" : "shuffling a day gave the same day"}`);
    L.push("");
  }

  L.push("## Appendix: exact inputs of every failing scenario", "", "`slug/scenario`: inputs as set in the form (dates empty means undated; `mustInclude`/`avoid` are record ids).", "");
  for (const { c, p } of failing) L.push(`- \`${c.slug}/${p.scenario}\` ${p.label}: \`${JSON.stringify(p.input)}\``);
  L.push("");
  L.push("## Screenshots", "", "Each city's 3-day plan with its day 1 map is in `reports/screenshots/<city>.jpg` (tiles are the 1x1 stub in these, so the map shows markers on a flat tile).", "");
  writeFileSync(`${dir}/stress-test.md`, L.join("\n"));
}
