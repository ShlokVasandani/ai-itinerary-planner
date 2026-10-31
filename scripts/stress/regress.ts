/**
 * Regression check: for every failure type in reports/stress-results.json, replay the same scenarios on the current
 * build and on an older one, and say whether the older build shows the same failure.
 *
 *   npx tsx scripts/stress/regress.ts --current http://localhost:3300 --old http://localhost:3400 [--samples 3]
 *
 * The old build must be started separately (it is a different checkout). A type that reproduces on the current build
 * but on none of the sampled scenarios of the old build is a regression; one that reproduces on both is pre-existing.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium, type Browser } from "playwright-core";
import { loadDestination } from "../../lib/data/catalog";
import { flags, newContext, Planner, Probe } from "./driver";
import { runPlan, type Env } from "./flow";
import { INFO_CHECKS, type CityResult, type PlanResult } from "./model";
import { runPropagation } from "./propagation";
import { buildScenarios } from "./scenarios";

const arg = (n: string, d?: string) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const CURRENT = arg("current", "http://localhost:3300")!;
const OLD = arg("old", "http://localhost:3400")!;
const SAMPLES = Number(arg("samples", "3"));
const RESULTS = arg("results", "reports/stress-results.json")!;
const OUT = arg("out", "reports/regression-check.md")!;
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

interface Sample {
  slug: string;
  scenario: string;
}

/** Up to n distinct cities per failure type, spread across the list rather than the first n. */
function pickSamples(cities: CityResult[]): Map<string, Sample[]> {
  const byType = new Map<string, Sample[]>();
  for (const c of cities)
    for (const p of c.plans)
      for (const f of p.failures) {
        if (INFO_CHECKS.has(f.check) || f.check === "robust.exception") continue;
        const key = p.group === "I" ? "I" : p.scenario;
        const list = byType.get(f.check) ?? [];
        if (!list.some((s) => s.slug === c.slug && (s.scenario === key || (p.group === "I" && s.scenario === "I")))) list.push({ slug: c.slug, scenario: key });
        byType.set(f.check, list);
      }
  const out = new Map<string, Sample[]>();
  for (const [type, list] of byType) {
    const seen = new Set<string>();
    const distinct = list.filter((s) => (seen.has(s.slug) ? false : (seen.add(s.slug), true)));
    const step = Math.max(1, Math.floor(distinct.length / SAMPLES));
    out.set(type, Array.from({ length: Math.min(SAMPLES, distinct.length) }, (_, i) => distinct[i * step]));
  }
  return out;
}

/** Runs the wanted scenarios (and the propagation chain, if asked) for one city on one server. */
async function replay(browser: Browser, base: string, slug: string, ids: Set<string>, chain: boolean, job: number): Promise<PlanResult[]> {
  const dest = (await loadDestination(slug))!;
  const ctx = await newContext(browser, base, job);
  const page = await ctx.newPage();
  const probe = new Probe(base);
  probe.attach(page);
  const env: Env = { planner: new Planner(page, base), probe, dest };
  const out: PlanResult[] = [];
  let lastDates = "";
  for (const sc of buildScenarios(dest).filter((s) => ids.has(s.id))) {
    const dates = `${sc.input.start}|${sc.input.end}`;
    if (!lastDates || dates !== lastDates) {
      await env.planner.open(sc.input);
      lastDates = dates;
    }
    const r = await runPlan(env, sc.group, sc.id, sc.label, sc.input);
    if (r.failures.some((f) => f.check === "robust.exception")) lastDates = "";
    out.push(r);
  }
  if (chain) out.push(...(await runPropagation(env, slug)));
  await ctx.close();
  return out;
}

async function main() {
  const { cities } = JSON.parse(readFileSync(RESULTS, "utf8")) as { cities: CityResult[] };
  const samples = pickSamples(cities);
  // One pass per city covering every scenario any type needs from it.
  const need = new Map<string, { ids: Set<string>; chain: boolean }>();
  for (const list of samples.values())
    for (const s of list) {
      const n = need.get(s.slug) ?? { ids: new Set<string>(), chain: false };
      if (s.scenario === "I") n.chain = true;
      else n.ids.add(s.scenario);
      need.set(s.slug, n);
    }
  console.log(`${samples.size} failure types, ${need.size} cities to replay on each build`);
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const ran: Record<string, Map<string, PlanResult[]>> = { current: new Map(), old: new Map() };
  for (const which of ["current", "old"] as const) {
    flags.legacy = which === "old";
    const base = which === "old" ? OLD : CURRENT;
    const slugs = [...need.keys()];
    let next = 0;
    await Promise.all(
      Array.from({ length: 4 }, async (_, w) => {
        while (next < slugs.length) {
          const slug = slugs[next++];
          const n = need.get(slug)!;
          ran[which].set(slug, await replay(browser, base, slug, n.ids, n.chain, w + 1 + (which === "old" ? 8 : 0)));
          console.log(`${which}: ${slug} done`);
        }
      })
    );
  }
  await browser.close();

  const hit = (which: "current" | "old", s: Sample, type: string) => {
    const plans = ran[which].get(s.slug) ?? [];
    const rel = s.scenario === "I" ? plans.filter((p) => p.group === "I") : plans.filter((p) => p.scenario === s.scenario);
    return rel.some((p) => p.failures.some((f) => f.check === type));
  };
  const rows = [...samples].map(([type, list]) => {
    const cur = list.filter((s) => hit("current", s, type)).length;
    const old = list.filter((s) => hit("old", s, type)).length;
    const verdict = cur === 0 ? "not reproduced on the current build (flaky or harness)" : old > 0 ? "pre-existing" : "regression";
    return { type, n: list.length, cur, old, verdict, list };
  });
  rows.sort((a, b) => a.verdict.localeCompare(b.verdict) || a.type.localeCompare(b.type));
  const L = ["# Regression check against 383bdb2", "", "Same scenarios (same city, same seeded inputs) replayed on the current build and on 383bdb2, the last commit before the motion work.", "", "| Failure type | Samples | Reproduces now | Reproduces on 383bdb2 | Verdict |", "| --- | ---: | ---: | ---: | --- |"];
  for (const r of rows) L.push(`| \`${r.type}\` | ${r.n} | ${r.cur}/${r.n} | ${r.old}/${r.n} | **${r.verdict}** |`);
  L.push("", "## Samples", "");
  for (const r of rows) L.push(`- \`${r.type}\`: ${r.list.map((s) => `${s.slug} ${s.scenario === "I" ? "(propagation chain)" : s.scenario}`).join("; ")}`);
  mkdirSync("reports", { recursive: true });
  writeFileSync(OUT, L.join("\n") + "\n");
  for (const r of rows) console.log(`${r.verdict.padEnd(14).slice(0, 14)} ${r.type.padEnd(24)} now ${r.cur}/${r.n}  old ${r.old}/${r.n}`);
}
main();
