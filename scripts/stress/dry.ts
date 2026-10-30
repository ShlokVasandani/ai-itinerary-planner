/**
 * Engine-only pass: runs every scenario through generateItinerary and the invariant checks, no browser.
 * Fast (seconds for all 50 cities), so it is the first thing to run after touching the engine.
 *   npx tsx scripts/stress/dry.ts [slug ...]
 */
import { cityIndex, loadDestination } from "../../lib/data/catalog";
import { generateItinerary } from "../../lib/itinerary-engine";
import { checkPlan } from "./checks";
import { toEngineInput } from "./model";
import { buildScenarios } from "./scenarios";

async function main() {
  const only = process.argv.slice(2);
  const byCheck = new Map<string, { n: number; first: string[] }>();
  let plans = 0;
  for (const c of cityIndex.filter((x) => !only.length || only.includes(x.slug))) {
    const dest = (await loadDestination(c.slug))!;
    for (const sc of buildScenarios(dest)) {
      const it = generateItinerary(toEngineInput(sc.input, dest));
      const { failures } = checkPlan(sc.input, dest, it);
      plans++;
      for (const x of failures) {
        const e = byCheck.get(x.check) ?? { n: 0, first: [] };
        e.n++;
        if (e.first.length < 3) e.first.push(`${c.slug} ${sc.id}: ${x.detail}`);
        byCheck.set(x.check, e);
      }
    }
  }
  console.log(`${plans} plans checked`);
  for (const [check, e] of [...byCheck].sort((a, b) => b[1].n - a[1].n)) {
    console.log(`\n${check}  x${e.n}`);
    for (const l of e.first) console.log("   " + l);
  }
  if (!byCheck.size) console.log("no failures");
}
main();
