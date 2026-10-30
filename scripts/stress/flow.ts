/** One plan end to end: set the inputs, build, then run every check that applies. */
import type { Destination } from "../../lib/types";
import { generateItinerary, type GeneratedItinerary } from "../../lib/itinerary-engine";
import { checkPlan } from "./checks";
import { compare, scrape } from "./dom";
import { Planner, Probe } from "./driver";
import { toEngineInput, type Failure, type PlanResult, type StressInput } from "./model";

export interface Env {
  planner: Planner;
  probe: Probe;
  dest: Destination;
  /** Where to save the per-city screenshot, when this plan is the 3-day one. */
  shotPath?: string;
  /** The "flying from" airport typed into the page, which feeds every booking link. */
  origin?: string;
}

export const engineFor = (input: StressInput, dest: Destination): GeneratedItinerary => generateItinerary(toEngineInput(input, dest));

/** Checks the plan that is on screen against the engine's answer for `input`. */
export async function verifyScreen(env: Env, input: StressInput, it: GeneratedItinerary, origin = ""): Promise<{ failures: Failure[]; notes: string[] }> {
  const { planner, probe, dest } = env;
  const { failures, notes } = checkPlan(input, dest, it);
  failures.push(...compare(await scrape(planner.page), it, input, env.origin ?? origin));
  failures.push(...(await planner.maps(it)).failures);
  if (env.shotPath) await screenshot(planner, env.shotPath);
  failures.push(...(await planner.overflow(1440)), ...(await planner.overflow(390)));
  failures.push(...probe.drain());
  return { failures, notes };
}

export async function runPlan(env: Env, group: string, id: string, label: string, wanted: StressInput): Promise<PlanResult> {
  let input = wanted;
  const t0 = Date.now();
  const failures: Failure[] = [];
  let notes: string[] = [];
  try {
    input = await env.planner.apply(wanted, env.dest);
    await env.planner.build();
    const it = engineFor(input, env.dest);
    const v = await verifyScreen(env, input, it);
    failures.push(...v.failures);
    notes = v.notes;
  } catch (e) {
    failures.push({ check: "robust.exception", detail: (e as Error).message.split("\n").slice(0, 4).join(" | ").slice(0, 400) });
    failures.push(...env.probe.drain());
  }
  return { scenario: id, group, label, input, failures, notes, ms: Date.now() - t0 };
}

/** The 3-day plan with its first day's map, as a picture. Tiles are stubbed, so the map shows markers on a flat tile. */
async function screenshot(planner: Planner, path: string) {
  const page = planner.page;
  await page.evaluate(() => document.getElementById("day-1")?.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(900);
  const clip = await page.evaluate(() => {
    const a = document.querySelector(".trip-summary")!.getBoundingClientRect();
    const b = document.getElementById("day-1")!.getBoundingClientRect();
    return { x: Math.max(0, a.left + scrollX - 12), y: a.top + scrollY - 12, width: a.width + 24, height: b.bottom - a.top + 24 };
  });
  await page.screenshot({ path, type: "jpeg", quality: 62, fullPage: true, clip });
}
