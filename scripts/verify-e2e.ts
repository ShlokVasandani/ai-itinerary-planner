/**
 * End-to-end check with Playwright (system Chrome): builds a 5-day plan for every
 * city, opens every Book/Details menu, checks the attributes of every outbound
 * link and clicks each distinct link once. External hosts are stubbed, so no
 * third-party site is actually hit; we verify the click opens a new tab at the
 * expected URL. Every day map is checked too: a .leaflet-container host, a loaded
 * tile, one marker per located stop, and Leaflet's own (small) attribution text.
 *
 * Usage: npm run build && npm start   (other terminal)
 *        npx tsx scripts/verify-e2e.ts [baseUrl] [slug ...]
 */
import { chromium } from "playwright-core";
import { cityIndex } from "../lib/data/catalog";

const BASE = process.argv[2] ?? "http://localhost:3000";
const only = process.argv.slice(3).filter((a) => !a.startsWith("--"));
/** A real 1x1 PNG, served for map tiles so "a tile loaded" can be checked without touching OpenStreetMap. */
const TILE_PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const base = new URL(BASE);

/**
 * Planner interactions that the per-city loop doesn't exercise. Each returns the problems it found.
 *  - Changing the city in the picker must leave "Build my itinerary" enabled and not busy, and the plan must be for
 *    the new city. (A race in the city-loading effect once left it disabled for good.)
 *  - A day trip must get a Book/Details menu even when it has no official or map URL of its own.
 *  - The city-guide tabs follow the ARIA keyboard pattern.
 */
async function checkInteractions(browser: import("playwright-core").Browser): Promise<string[]> {
  const problems: string[] = [];
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route("**/*", (route) => {
    const u = new URL(route.request().url());
    if (u.host === base.host || u.protocol === "data:" || u.protocol === "blob:") return route.continue();
    if (u.hostname.endsWith("tile.openstreetmap.org")) return route.fulfill({ status: 200, contentType: "image/png", body: TILE_PNG });
    return route.fulfill({ status: 200, contentType: "text/html", body: "<title>stub</title>" });
  });
  const page = await ctx.newPage();
  for (const target of ["Lisbon", "Kyoto"]) {
    await page.goto(`${BASE}/planner?city=tokyo`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => {
      const b = document.querySelector(".planner-form button[type=submit]");
      return !!b && Object.keys(b).some((k) => k.startsWith("__reactFiber"));
    });
    await page.locator(".sf-stack .sf-trigger", { hasText: "Where to" }).click();
    const panel = page.locator(".sf-cities");
    await panel.getByLabel("Search cities").fill(target);
    await panel.getByRole("option").first().locator("button").click();
    await page.locator(".planner-hero h1", { hasText: target }).waitFor({ timeout: 15000 });
    const submit = page.locator(".planner-form button[type=submit]");
    try {
      await page.waitForFunction(() => {
        const b = document.querySelector(".planner-form button[type=submit]") as HTMLButtonElement | null;
        return !!b && !b.disabled && b.getAttribute("aria-busy") !== "true";
      }, null, { timeout: 5000 });
      await submit.click();
      await page.waitForSelector(".day-card", { timeout: 15000 });
      const heading = await page.locator(".trip-summary h2").innerText();
      if (!heading.includes(target)) problems.push(`city switch to ${target}: plan heading is "${heading}"`);
    } catch {
      problems.push(`city switch to ${target}: "Build my itinerary" never became enabled and not busy after choosing the city`);
    }
  }

  // Day trips: build 14 days in Tokyo, which includes "Depart for ..." rows.
  await page.goto(`${BASE}/planner?city=tokyo`, { waitUntil: "domcontentloaded" });
  const group = page.getByRole("group", { name: "Days (1–14)", exact: true });
  for (let i = 0; i < 40; i++) {
    const cur = Number((await group.locator("output").innerText()).trim());
    if (cur === 14) break;
    await group.getByRole("button", { name: "More: Days (1–14)", exact: true }).click();
  }
  await page.locator(".planner-form button[type=submit]").click();
  await page.waitForSelector(".day-card", { timeout: 15000 });
  const trips = page.locator(".stops > .stop", { hasText: "Depart for" });
  const n = await trips.count();
  if (n === 0) problems.push("day trips: a 14-day Tokyo plan has no day trip to check");
  for (let i = 0; i < n; i++) {
    const row = trips.nth(i);
    if ((await row.locator(".popover > button").count()) === 0) problems.push(`day trips: "${((await row.locator("h4").textContent()) ?? "").trim()}" has no Book/Details menu`);
  }
  // City-guide tabs: the ARIA keyboard pattern (arrows, Home/End, roving tabindex).
  await page.goto(`${BASE}/destinations/lisbon`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => {
    const b = document.querySelector('[role="tab"]');
    return !!b && Object.keys(b).some((k) => k.startsWith("__reactFiber"));
  });
  const tabs = page.locator('[role="tab"]');
  const count = await tabs.count();
  const selected = async () => page.evaluate(() => [...document.querySelectorAll('[role="tab"]')].findIndex((t) => t.getAttribute("aria-selected") === "true"));
  const focused = async () => page.evaluate(() => [...document.querySelectorAll('[role="tab"]')].findIndex((t) => t === document.activeElement));
  await tabs.first().focus();
  for (const [key, want] of [["ArrowRight", 1], ["ArrowRight", 2], ["ArrowLeft", 1], ["End", count - 1], ["ArrowRight", 0], ["ArrowLeft", count - 1], ["Home", 0]] as const) {
    await page.keyboard.press(key);
    const [sel, foc] = [await selected(), await focused()];
    if (sel !== want || foc !== want) problems.push(`tabs: after ${key} expected tab ${want} selected and focused, got selected ${sel}, focused ${foc}`);
  }
  const inOrder = await page.evaluate(() => [...document.querySelectorAll('[role="tab"]')].filter((t) => (t as HTMLElement).tabIndex === 0).length);
  if (inOrder !== 1) problems.push(`tabs: ${inOrder} tabs are in the Tab order, expected 1`);
  await ctx.close();
  return problems;
}

async function main() {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const problems: string[] = await checkInteractions(browser);
  if (process.argv.includes("--ui-only")) {
    await browser.close();
    if (problems.length) {
      console.error(`${problems.length} problem(s):\n` + problems.map((p) => " - " + p).join("\n"));
      process.exit(1);
    }
    console.log("Interactions OK.");
    return;
  }
  let totalLinks = 0;
  let totalClicks = 0;
  let mapsChecked = 0;
  cities: for (const d of cityIndex.filter((x) => only.length === 0 || only.includes(x.slug))) {
    // A timeout from a busy machine should cost one retry of this city, not the whole run.
    for (let attempt = 1; attempt <= 2; attempt++) {
      const saved = { problems: problems.length, totalLinks, totalClicks, mapsChecked };
      try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    // Never hit third-party hosts: answer them with a stub page.
    await ctx.route("**/*", (route) => {
      const u = new URL(route.request().url());
      if (u.host === base.host || u.protocol === "data:" || u.protocol === "blob:") return route.continue();
      if (u.hostname.endsWith("tile.openstreetmap.org")) return route.fulfill({ status: 200, contentType: "image/png", body: TILE_PNG });
      return route.fulfill({ status: 200, contentType: "text/html", body: "<title>stub</title>" });
    });
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    page.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errors.push(`console: ${m.text()}`));
    await page.goto(`${BASE}/planner?city=${d.slug}&go=1&start=2027-03-02&end=2027-03-06&adults=2&origin=JFK`, { waitUntil: "networkidle" });
    try {
      await page.waitForSelector(".day-card", { timeout: 20000 });
    } catch {
      problems.push(`${d.slug}: no plan rendered`);
      await ctx.close();
      continue cities;
    }
    const days = await page.locator(".day-card").count();
    if (days !== 5) problems.push(`${d.slug}: expected 5 days, got ${days}`);
    const stops = await page.locator(".stop").count();
    if (stops < 15) problems.push(`${d.slug}: only ${stops} stops`);

    // Every day map must really render. Regression guard: a re-rendered className once wiped Leaflet's own
    // classes, leaving markers on a blank grey box (no .leaflet-container, so no pane CSS, clipping or tile layout).
    const mapsBefore = mapsChecked;
    for (let i = 0; i < days; i++) {
      const day = page.locator(".day-card").nth(i);
      const where = `${d.slug} day ${i + 1}`;
      // The map component is a lazy chunk: wait for it (or for the "no coordinates" note) before deciding.
      const slot = day.locator(".day-map-canvas, .day-map-empty").first();
      await slot.scrollIntoViewIfNeeded();
      try {
        await slot.waitFor({ timeout: 10000 });
      } catch {
        problems.push(`${where}: neither a map nor a "no map" note appeared`);
        continue;
      }
      const canvas = day.locator(".day-map-canvas");
      if ((await canvas.count()) === 0) continue; // a day with no located stops shows a note instead of a map
      try {
        await day.locator('.day-map-canvas[data-ready]').waitFor({ timeout: 10000 });
        await day.locator(".leaflet-tile-loaded").first().waitFor({ state: "attached", timeout: 10000 });
      } catch {
        problems.push(`${where}: map never became ready with a loaded tile`);
      }
      const m = await canvas.evaluate((el) => {
        const label = el.getAttribute("aria-label") ?? "";
        const attr = el.querySelector(".leaflet-control-attribution");
        return {
          located: Number(/with (\d+) located stops/.exec(label)?.[1] ?? NaN),
          container: el.classList.contains("leaflet-container"),
          tiles: [...el.querySelectorAll<HTMLImageElement>(".leaflet-tile-loaded")].filter((t) => t.naturalWidth > 0).length,
          markers: el.querySelectorAll(".leaflet-marker-icon").length,
          attrFont: attr ? parseFloat(getComputedStyle(attr).fontSize) : NaN,
        };
      });
      if (!m.container) problems.push(`${where}: map host lost its .leaflet-container class`);
      if (m.tiles < 1) problems.push(`${where}: no loaded tile with naturalWidth > 0`);
      if (m.markers !== m.located) problems.push(`${where}: ${m.markers} markers for ${m.located} located stops`);
      if (!(m.attrFont <= 13)) problems.push(`${where}: attribution font-size ${m.attrFont}px (expected 13px or less)`);
      mapsChecked++;
    }

    if (mapsChecked === mapsBefore) problems.push(`${d.slug}: no day map was checked`);

    // Open every Book/Details menu so its links are in the DOM.
    const triggers = page.locator(".stop-actions .popover > button[aria-haspopup]");
    const n = await triggers.count();
    for (let i = 0; i < n; i++) {
      const t = triggers.nth(i);
      const label = (await t.innerText()).trim();
      if (label === "Swap") continue;
      await t.click();
      await page.keyboard.press("Escape");
    }
    // Links are rendered (hidden) inside closed popovers, so read them straight from the DOM.
    const anchors = await page.$$eval('a[target="_blank"]', (as) =>
      as.map((a) => ({ href: a.getAttribute("href") ?? "", rel: a.getAttribute("rel") ?? "" }))
    );
    totalLinks += anchors.length;
    for (const a of anchors) {
      if (!/^https?:\/\//.test(a.href)) problems.push(`${d.slug}: non-http(s) outbound link ${a.href}`);
      if (!/noopener/.test(a.rel) || !/noreferrer/.test(a.rel)) problems.push(`${d.slug}: missing noopener/noreferrer on ${a.href}`);
    }
    // Click each distinct link once (open its menu first when it lives in a popover).
    const distinct = [...new Set(anchors.map((a) => a.href))];
    for (const href of distinct) {
      const loc = page.locator("a[target=_blank]").filter({ has: page.locator(":scope") }).and(page.locator(`[href="${href.replace(/"/g, '\\"')}"]`)).first();
      const inPopover = await loc.evaluate((el) => !!el.closest(".popover-panel"), undefined, { timeout: 5000 }).catch(() => false);
      if (inPopover) {
        await loc.evaluate((el) => {
          const pop = el.closest(".popover") as HTMLElement;
          (pop.querySelector("button[aria-haspopup]") as HTMLButtonElement).click();
        });
      } else {
        await loc.scrollIntoViewIfNeeded();
      }
      try {
        const [popup] = await Promise.all([ctx.waitForEvent("page", { timeout: 5000 }), loc.evaluate((el) => (el as HTMLElement).click())]);
        await popup.waitForLoadState("domcontentloaded").catch(() => undefined);
        const opened = popup.url();
        if (new URL(opened).href !== new URL(href).href && !opened.startsWith("about:")) problems.push(`${d.slug}: clicked ${href} but opened ${opened}`);
        totalClicks++;
        await popup.close();
      } catch (e) {
        problems.push(`${d.slug}: click failed for ${href}: ${(e as Error).message.split("\n")[0]}`);
      }
      if (inPopover) await page.keyboard.press("Escape");
    }
    for (const e of errors) problems.push(`${d.slug}: ${e}`);
    console.log(`${d.slug.padEnd(15)} days ${days}, stops ${stops}, links ${anchors.length}, clicked ${distinct.length}${errors.length ? `, errors ${errors.length}` : ""}`);
    await ctx.close();
        break;
      } catch (e) {
        problems.length = saved.problems;
        ({ totalLinks, totalClicks, mapsChecked } = saved);
        const why = (e as Error).message.split("\n")[0];
        if (attempt === 2) problems.push(`${d.slug}: the check could not complete twice: ${why}`);
        else console.log(`${d.slug}: retrying once after: ${why}`);
      }
    }
  }
  await browser.close();
  console.log(`\n${totalLinks} outbound links checked, ${totalClicks} distinct links clicked, ${mapsChecked} day maps checked.`);
  if (problems.length) {
    console.error(`${problems.length} problem(s):\n` + problems.slice(0, 60).map((p) => " - " + p).join("\n"));
    process.exit(1);
  }
  console.log("All good.");
}
main();
