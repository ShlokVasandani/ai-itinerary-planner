/**
 * Sekai stress test, phase 1: run every scenario on every city in a real browser against a production server and
 * write reports/stress-test.md. Nothing is fixed here.
 *
 *   npm run build && npm start            (other terminal, any port)
 *   npx tsx scripts/stress/run.ts [--base http://localhost:3000] [--cities tokyo,lisbon] [--groups A,B,I] [--jobs 4] [--no-tiles]
 */
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright-core";
import { cityIndex, loadDestination } from "../../lib/data/catalog";
import { newContext, Planner, Probe } from "./driver";
import { runPlan, type Env } from "./flow";
import { INFO_CHECKS, type CityResult, type PlanResult, type TileResult } from "./model";
import { runPropagation } from "./propagation";
import { writeReport } from "./report";
import { buildScenarios } from "./scenarios";
import { runRealTiles } from "./tiles-real";

const arg = (name: string, fallback?: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
};
const BASE = arg("base", "http://localhost:3000")!;
const JOBS = Math.min(4, Number(arg("jobs", "4")));
const ONLY = arg("cities")?.split(",");
const GROUPS = (arg("groups", "A,B,C,D,E,F,G,H,I") as string).split(",");
const OUT = arg("out", "reports")!;
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function cityJob(browser: import("playwright-core").Browser, slug: string, jobId: number): Promise<CityResult> {
  const t0 = Date.now();
  const dest = (await loadDestination(slug))!;
  const ctx = await newContext(browser, BASE, jobId);
  const page = await ctx.newPage();
  const probe = new Probe(BASE);
  probe.attach(page);
  const env: Env = { planner: new Planner(page, BASE), probe, dest };
  const plans: PlanResult[] = [];
  let lastDates = "";
  for (const sc of buildScenarios(dest).filter((s) => GROUPS.includes(s.group))) {
    const dates = `${sc.input.start}|${sc.input.end}`;
    if (!lastDates || dates !== lastDates) {
      try {
        await env.planner.open(sc.input);
        lastDates = dates;
      } catch (e) {
        plans.push({ scenario: sc.id, group: sc.group, label: sc.label, input: sc.input, failures: [{ check: "robust.exception", detail: `open: ${(e as Error).message.split("\n")[0]}` }], notes: [], ms: 0 });
        continue;
      }
    }
    env.shotPath = sc.screenshot ? `${OUT}/screenshots/${slug}.jpg` : undefined;
    const res = await runPlan(env, sc.group, sc.id, sc.label, sc.input);
    if (res.failures.some((f) => f.check === "robust.exception")) lastDates = ""; // reload before the next plan
    plans.push(res);
  }
  if (GROUPS.includes("I")) {
    try {
      plans.push(...(await runPropagation(env, slug)));
    } catch (e) {
      plans.push({ scenario: "I:chain", group: "I", label: "propagation chain", input: {} as never, failures: [{ check: "robust.exception", detail: (e as Error).message.split("\n")[0] }], notes: [], ms: 0 });
    }
  }
  await ctx.close();
  return { slug, city: dest.city, plans, ms: Date.now() - t0 };
}

async function main() {
  const started = new Date();
  mkdirSync(`${OUT}/screenshots`, { recursive: true });
  const slugs = cityIndex.map((c) => c.slug).filter((s) => !ONLY || ONLY.includes(s));
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const results: CityResult[] = [];
  let next = 0;
  let done = 0;
  await Promise.all(
    Array.from({ length: JOBS }, async (_, w) => {
      while (next < slugs.length) {
        const slug = slugs[next++];
        const r = await cityJob(browser, slug, w + 1);
        results.push(r);
        done++;
        const bad = r.plans.filter((p) => p.failures.some((f) => !INFO_CHECKS.has(f.check))).length;
        console.log(`[${done}/${slugs.length}] ${slug.padEnd(15)} ${r.plans.length} plans, ${bad} with failures, ${Math.round(r.ms / 1000)}s`);
      }
    })
  );
  let tiles: TileResult[] = [];
  if (!process.argv.includes("--no-tiles")) tiles = await runRealTiles(browser, BASE, `${OUT}/screenshots`);
  await browser.close();
  const order = new Map(cityIndex.map((c, i) => [c.slug, i]));
  results.sort((a, b) => order.get(a.slug)! - order.get(b.slug)!);
  const commit = execSync("git rev-parse --short HEAD").toString().trim();
  writeReport(OUT, { base: BASE, commit, started: started.toISOString(), ms: Date.now() - started.getTime(), jobs: JOBS }, results, tiles);
  console.log(`report: ${OUT}/stress-test.md`);
}
main();
