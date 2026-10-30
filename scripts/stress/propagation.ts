/**
 * Group I: change ONE thing at a time on a live page and check that the right things change and the rest stay
 * consistent. The page is never reloaded between steps; each step is the next input in a chain, rebuilt through the
 * real form. Swap and Shuffle are replayed on the engine (swapStop / regenerateDay) and compared with the page.
 */
import type { Page } from "playwright-core";
import { cityIndex, loadDestination } from "../../lib/data/catalog";
import { regenerateDay, swapStop, type GeneratedItinerary } from "../../lib/itinerary-engine";
import { addDays } from "../../lib/engine/time";
import { money } from "../../lib/format";
import { engineFor, verifyScreen, type Env } from "./flow";
import { flags } from "./driver";
import { rng, with_, type Failure, type PlanResult, type StressInput } from "./model";
import { topActivities } from "./dom";
import { pools } from "./data";

const sig = (it: GeneratedItinerary, day?: number) =>
  JSON.stringify(it.days.filter((d) => day === undefined || d.dayNumber === day).map((d) => d.stops.map((s) => `${s.time}|${s.name}`)));
const otherDays = (it: GeneratedItinerary, skip: number) => JSON.stringify(it.days.filter((d) => d.dayNumber !== skip).map((d) => d.stops.map((s) => `${s.time}|${s.name}`)));

async function setDates(page: Page, start: string, end: string) {
  const trigger = page.locator(".sf-stack .sf-trigger", { hasText: "Dates" });
  await trigger.click();
  const panel = page.locator(flags.legacy ? ".sf-calendar" : '.sf-calendar[data-state="open"]');
  await panel.waitFor();
  const clear = panel.getByRole("button", { name: "Clear dates" });
  if (await clear.count()) await clear.click();
  for (const iso of [start, end]) {
    for (let i = 0; i < 18; i++) {
      const cell = panel.locator(`td[data-day="${iso}"] button`);
      if (await cell.count()) {
        await cell.first().click();
        break;
      }
      await panel.locator("button.rdp-button_next, button[aria-label^='Go to the Next Month']").first().click();
      if (i === 17) throw new Error(`calendar never showed ${iso}`);
    }
  }
  if (!flags.legacy) await page.locator('.sf-panel[data-state="open"]').waitFor({ state: "detached", timeout: 3000 }).catch(() => undefined);
}

async function setCity(page: Page, city: string) {
  await page.locator(".sf-stack .sf-trigger", { hasText: "Where to" }).click();
  const panel = page.locator(flags.legacy ? ".sf-cities" : '.sf-cities[data-state="open"]');
  await panel.getByLabel("Search cities").fill(city);
  await panel.getByRole("option").first().locator("button").click();
}

/** Types an origin and checks that "Check prices" asks the price routes for exactly this trip. */
async function priceComparer(env: Env, it: GeneratedItinerary, input: StressInput, tag: string): Promise<Failure[]> {
  const { page } = env.planner;
  const f: Failure[] = [];
  const before = env.probe.priceRequests.length;
  await page.locator("#price-origin").fill("JFK");
  env.origin = "JFK";
  await page.getByRole("button", { name: "Check prices", exact: true }).click();
  await page.locator(".prices-panel .price-card").first().waitFor({ timeout: 20000 }).catch(() => f.push({ check: "prop.price-comparer", detail: `${tag}: no price cards appeared` }));
  const reqs = env.probe.priceRequests.slice(before);
  const flights = reqs.find((u) => u.pathname.endsWith("/flights"));
  const dest = it.input.destination;
  if (!flights) f.push({ check: "prop.price-comparer", detail: `${tag}: no flight request was sent` });
  else {
    const q = flights.searchParams;
    const want: Record<string, string> = { origin: "JFK", destination: dest.airportCodes[0], adults: String(input.adults), currency: it.currency };
    if (it.startDate) want.departure = it.startDate;
    if (it.endDate) want.return = it.endDate;
    for (const [k, v] of Object.entries(want)) if (q.get(k) !== v) f.push({ check: "prop.price-comparer", detail: `${tag}: flights ${k}=${q.get(k)}, expected ${v}` });
  }
  const acts = reqs.filter((u) => u.pathname.endsWith("/activities"));
  const names = topActivities(it);
  if (acts.length !== names.length) f.push({ check: "prop.price-comparer", detail: `${tag}: ${acts.length} activity requests, expected ${names.length}` });
  for (const u of acts) {
    if (u.searchParams.get("city") !== dest.city || u.searchParams.get("currency") !== it.currency || !names.includes(u.searchParams.get("q") ?? "")) {
      f.push({ check: "prop.price-comparer", detail: `${tag}: activities request ${u.search}` });
    }
  }
  await page.locator('.prices-panel[aria-busy="false"], .prices-panel:not([aria-busy="true"])').first().waitFor({ timeout: 20000 }).catch(() => undefined);
  const errs = await page.locator(".prices-panel .field-error").allInnerTexts();
  for (const e of errs) f.push({ check: "prop.price-comparer", detail: `${tag}: ${e.trim()}` });
  return f;
}

export async function runPropagation(env: Env, slug: string): Promise<PlanResult[]> {
  const out: PlanResult[] = [];
  const r = rng(`stress-v1:${slug}:propagation`);
  const base = with_(slug, { start: addDays("2027-03-02", 7 * r.int(0, 30)), end: "" });
  base.end = addDays(base.start, 2);
  let input = base;
  let it!: GeneratedItinerary;
  const { planner, probe } = env;

  const step = async (id: string, label: string, change: () => Promise<GeneratedItinerary | void>, expect: (before: GeneratedItinerary, after: GeneratedItinerary) => Failure[], extra?: () => Promise<Failure[]>) => {
    const t0 = Date.now();
    const failures: Failure[] = [];
    let notes: string[] = [];
    try {
      const before = it;
      // A step that edits the plan itself (swap) hands back the plan it expects; the rest are rebuilt from the form.
      it = (await change()) ?? engineFor(input, env.dest);
      if (id !== "baseline") failures.push(...expect(before, it));
      const v = await verifyScreen(env, input, it);
      failures.push(...v.failures);
      notes = v.notes;
      if (extra) failures.push(...(await extra()));
    } catch (e) {
      failures.push({ check: "robust.exception", detail: (e as Error).message.split("\n").slice(0, 4).join(" | ").slice(0, 400) });
      failures.push(...probe.drain());
    }
    out.push({ scenario: `I:${id}`, group: "I", label, input: JSON.parse(JSON.stringify(input)), failures, notes, ms: Date.now() - t0 });
  };
  const same = (check: string, a: unknown, b: unknown, what: string): Failure[] => (JSON.stringify(a) === JSON.stringify(b) ? [] : [{ check, detail: what }]);
  const differs = (check: string, a: unknown, b: unknown, what: string): Failure[] => (JSON.stringify(a) !== JSON.stringify(b) ? [] : [{ check, detail: what }]);

  await step(
    "baseline",
    `3 days from ${base.start}, 2 adults`,
    async () => {
      await planner.open(input);
      input = await planner.apply(input, env.dest);
      await planner.build();
    },
    () => [],
    () => priceComparer(env, it, input, "baseline")
  );

  await step(
    "start-date",
    "move the start date one day later (same length)",
    async () => {
      input = { ...input, start: addDays(input.start, 1), end: addDays(input.end, 1) };
      await setDates(planner.page, input.start, input.end);
      await planner.build();
    },
    (b, a) => [
      ...same("prop.start-date", a.days.length, b.days.length, `day count changed from ${b.days.length} to ${a.days.length}`),
      ...differs("prop.start-date", a.days.map((d) => d.date), b.days.map((d) => d.date), "dates did not move"),
    ]
  );

  await step(
    "length",
    "extend the trip by one day",
    async () => {
      input = { ...input, end: addDays(input.end, 1) };
      await setDates(planner.page, input.start, input.end);
      await planner.build();
    },
    (b, a) => [
      ...(a.days.length === b.days.length + 1 ? [] : [{ check: "prop.length", detail: `expected ${b.days.length + 1} days, got ${a.days.length}` }]),
      ...same("prop.length", a.days.slice(0, b.days.length).map((d) => d.date), b.days.map((d) => d.date), "existing days changed date"),
      ...(a.cost.likely >= b.cost.likely * 0.5 ? [] : [{ check: "prop.length", detail: "trip total shrank sharply after adding a day" }]),
    ]
  );

  await step(
    "travellers",
    "one more adult (2 to 3)",
    async () => {
      input = { ...input, adults: 3 };
      await planner.stepper("Adults", 3);
      await planner.build();
    },
    (b, a) => [
      ...same("prop.travellers", sig(a), sig(b), "stops changed when only the party size changed"),
      ...same("prop.travellers", [a.cost.low, a.cost.likely, a.cost.high], [b.cost.low, b.cost.likely, b.cost.high], "per-person totals changed with party size"),
      ...(a.groupLikely === a.cost.likely * 3 ? [] : [{ check: "prop.travellers", detail: `party total ${a.groupLikely}, expected ${a.cost.likely} x 3` }]),
      // A plan with no priced stops has a party total of 0 whatever the party size.
      ...(b.groupLikely !== a.groupLikely || a.cost.likely === 0 ? [] : [{ check: "prop.travellers", detail: "party total did not change" }]),
    ],
    async () => {
      const text = await planner.page.locator(".trip-total", { hasText: "Whole party (3)" }).innerText().catch(() => "");
      return text.includes(money(it.groupLikely, it.currency)) ? [] : [{ check: "prop.travellers", detail: `party panel shows "${text.replace(/\s+/g, " ")}", expected ${money(it.groupLikely, it.currency)}` }];
    }
  );

  await step(
    "interest",
    "add the Nightlife interest",
    async () => {
      input = await planner.apply({ ...input, interests: [...input.interests, "nightlife"] }, env.dest);
      await planner.build();
    },
    (b, a) => [
      ...same("prop.interest", a.days.map((d) => d.date), b.days.map((d) => d.date), "dates changed when only an interest changed"),
      ...(a.input.interests.includes("nightlife") ? [] : [{ check: "prop.interest", detail: "plan input lost the new interest" }]),
    ]
  );

  await step(
    "dietary",
    "add Vegetarian",
    async () => {
      input = await planner.apply({ ...input, dietary: ["vegetarian"] }, env.dest);
      await planner.build();
    },
    (b, a) => same("prop.dietary", a.days.map((d) => d.date), b.days.map((d) => d.date), "dates changed when only a dietary need changed")
  );

  await step(
    "mobility",
    "limited mobility",
    async () => {
      input = await planner.apply({ ...input, mobility: "limited" }, env.dest);
      await planner.build();
    },
    (b, a) => same("prop.mobility", a.days.length, b.days.length, "day count changed when only mobility changed")
  );

  // Swap: the first swappable stop of the first day that has one.
  await step(
    "swap",
    "swap one stop for the first suggested alternative",
    async () => {
      const ok = (s: GeneratedItinerary["days"][number]["stops"][number]) => s.refId && s.category && s.category !== "dayTrip" && s.kind !== "transit" && s.kind !== "free-time";
      const day = it.days.find((d) => d.stops.some(ok))!;
      const idx = day.stops.findIndex(ok);
      const candidates = swapStop(it, day.dayNumber, idx).candidates;
      const row = planner.page.locator(`#day-${day.dayNumber} .stops > .stop`).nth(idx);
      const swap = row.locator(".popover", { has: planner.page.locator("> button", { hasText: /^Swap$/ }) });
      await swap.locator("> button").scrollIntoViewIfNeeded();
      await swap.locator("> button").click();
      if (candidates.length === 0) return it;
      await swap.locator(".menu-link strong").first().waitFor();
      const names = await swap.locator(".menu-link strong").allInnerTexts();
      if (JSON.stringify(names) !== JSON.stringify(candidates.map((c) => c.name))) throw new Error(`swap menu lists ${names.length} options, engine offers ${candidates.length}`);
      await swap.locator(".menu-link").first().click();
      const res = swapStop(it, day.dayNumber, idx, candidates[0].id);
      if (res.error) throw new Error(`engine refused its own swap: ${res.error}`);
      return res.itinerary;
    },
    (b, a) => {
      const changed = b.days.filter((d, i) => JSON.stringify(d.stops.map((s) => s.name)) !== JSON.stringify(a.days[i].stops.map((s) => s.name))).length;
      return changed <= 1 ? [] : [{ check: "prop.swap", detail: `${changed} days changed after swapping one stop` }];
    }
  );

  // Shuffle day 2 (or day 1 on a one-day plan).
  {
    const t0 = Date.now();
    const failures: Failure[] = [];
    const dayNo = it.days.length >= 2 ? 2 : 1;
    try {
      const before = it;
      await planner.page.locator(`#day-${dayNo} .day-aside .btn-small`).click();
      it = regenerateDay(before, dayNo, "shuffle-1");
      failures.push(...same("prop.shuffle", otherDays(it, dayNo), otherDays(before, dayNo), `days other than ${dayNo} changed when only day ${dayNo} was shuffled`));
      failures.push(...differs("prop.shuffle", sig(it, dayNo), sig(before, dayNo), `shuffling day ${dayNo} left it unchanged (informational: the pool may be exhausted)`).map((x) => ({ ...x, check: "prop.shuffle-noop" })));
      const v = await verifyScreen(env, input, it);
      failures.push(...v.failures);
    } catch (e) {
      failures.push({ check: "robust.exception", detail: (e as Error).message.split("\n").slice(0, 4).join(" | ").slice(0, 400) });
    }
    out.push({ scenario: "I:shuffle", group: "I", label: `shuffle day ${dayNo}`, input: JSON.parse(JSON.stringify(input)), failures, notes: [], ms: Date.now() - t0 });
  }

  // Change the city last: everything must change with it.
  {
    const others = cityIndex.filter((c) => c.slug !== slug);
    const next = r.pick(others);
    const newDest = (await loadDestination(next.slug))!;
    const prevIt = it;
    const savedEnv = { ...env };
    const stuck: Failure[] = [];
    await step(
      "city",
      `switch the city from ${slug} to ${next.slug}`,
      async () => {
        await setCity(planner.page, next.city);
        input = { ...input, slug: next.slug, mustInclude: [], avoid: [] };
        savedEnv.dest = newDest;
        Object.assign(env, { dest: newDest });
        await planner.page.locator(".planner-hero h1", { hasText: next.city }).waitFor({ timeout: 20000 });
        const button = planner.page.locator(".planner-form button[type=submit]");
        const enabled = await button.isEnabled({ timeout: 100 }).catch(() => false) || (await button.waitFor({ state: "visible" }).then(() => planner.page.waitForFunction(() => !(document.querySelector(".planner-form button[type=submit]") as HTMLButtonElement | null)?.disabled, null, { timeout: 8000 }).then(() => true, () => false)));
        if (!enabled) {
          stuck.push({ check: "prop.city-stuck", detail: `after choosing ${next.city} in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows ${next.city}` });
          // Carry on from a fresh load so everything else about the new city is still checked.
          await planner.open(input);
          env.origin = "";
          input = await planner.apply(input, newDest);
        }
        await planner.build();
      },
      (_b, a) => {
        const f: Failure[] = [];
        if (a.destination !== newDest.city) f.push({ check: "prop.city", detail: `plan is for ${a.destination}, expected ${newDest.city}` });
        const own = new Set(Object.values(pools(newDest)).flat().map((x) => x.id));
        for (const s of a.days.flatMap((d) => d.stops)) if (s.refId && !own.has(s.refId)) f.push({ check: "prop.city", detail: `stop "${s.name}" is not in ${newDest.city}'s data` });
        return [...f, ...differs("prop.city", sig(a), sig(prevIt), "plan did not change with the city")];
      },
      async () => [...stuck, ...(await priceComparer(env, it, input, `after switching to ${next.slug}`))]
    );
  }
  return out;
}
