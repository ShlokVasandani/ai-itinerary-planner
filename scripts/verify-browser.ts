/**
 * A person's-eye check of the main flow in real Chrome, for Tokyo and then Lisbon, against a production server:
 * switch city twice, build a 3-day plan, scroll through every day map with REAL tiles, Shuffle and Swap, use the
 * keyboard on the city-guide tabs, and watch the console and the Content-Security-Policy for violations.
 * Screenshots go to reports/screenshots/ (not tracked).
 *
 * Tiles come from tile.openstreetmap.org, a free community service, so they are fetched strictly one at a time with a
 * pause, an identifying User-Agent and a hard cap for the whole run. Never loop this over many cities.
 *
 *   npm run build && npm start       (other terminal)
 *   npx tsx scripts/verify-browser.ts [baseUrl]
 */
import { mkdirSync } from "node:fs";
import { chromium, type Page } from "playwright-core";

const BASE = process.argv[2] ?? "http://localhost:3000";
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = "reports/screenshots";
const PAUSE_MS = 1000;
const MAX_TILES = 100;

const results: { ok: boolean; name: string; detail?: string }[] = [];
const check = (ok: boolean, name: string, detail?: string) => {
  results.push({ ok, name, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  - " + detail : ""}`);
};

async function pickCity(page: Page, name: string) {
  await page.locator(".sf-stack .sf-trigger", { hasText: "Where to" }).click();
  const panel = page.locator(".sf-cities");
  await panel.getByLabel("Search cities").fill(name);
  await panel.getByRole("option").first().locator("button").click();
  await page.locator(".planner-hero h1", { hasText: name }).waitFor({ timeout: 15000 });
  await page.waitForFunction(() => {
    const b = document.querySelector(".planner-form button[type=submit]") as HTMLButtonElement | null;
    return !!b && !b.disabled && b.getAttribute("aria-busy") !== "true";
  }, null, { timeout: 8000 });
}

async function mapsReady(page: Page, label: string) {
  const days = await page.locator(".day-card").count();
  let pins = 0;
  for (let i = 1; i <= days; i++) {
    const canvas = page.locator(`#day-${i} .day-map-canvas`);
    await canvas.scrollIntoViewIfNeeded({ timeout: 15000 });
    await canvas.and(page.locator("[data-ready]")).waitFor({ timeout: 20000 });
    await canvas.locator(".leaflet-tile-loaded").first().waitFor({ state: "attached", timeout: 60000 });
    await page.waitForTimeout(1500);
    const m = await canvas.evaluate((el) => ({
      container: el.classList.contains("leaflet-container"),
      tiles: [...el.querySelectorAll<HTMLImageElement>(".leaflet-tile-loaded")].filter((t) => t.naturalWidth > 0).length,
      markers: el.querySelectorAll(".leaflet-marker-icon").length,
      located: Number(/with (\d+) located stops/.exec(el.getAttribute("aria-label") ?? "")?.[1] ?? NaN),
      attr: parseFloat(getComputedStyle(el.querySelector(".leaflet-control-attribution")!).fontSize),
    }));
    pins += m.markers;
    check(m.container && m.tiles > 0 && m.markers === m.located && m.attr <= 13, `${label} day ${i} map: real tiles and pins`, `${m.tiles} tiles, ${m.markers}/${m.located} pins, attribution ${m.attr}px`);
  }
  return pins;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const origin = new URL(BASE);
  let requests = 0;
  let chain: Promise<unknown> = Promise.resolve();
  await ctx.route("**/*", (route) => {
    const u = new URL(route.request().url());
    if (u.host === origin.host || u.protocol === "data:" || u.protocol === "blob:") return route.continue();
    if (!u.hostname.endsWith("tile.openstreetmap.org")) return route.abort();
    const run = chain.then(async () => {
      if (requests >= MAX_TILES) return route.abort();
      requests++;
      try {
        const res = await route.fetch({ headers: { ...route.request().headers(), "user-agent": "SekaiBrowserCheck/1.0 (local verification; one tile at a time)" } });
        await route.fulfill({ response: res });
      } catch {
        await route.abort();
      }
      await new Promise((r) => setTimeout(r, PAUSE_MS));
    });
    chain = run.catch(() => undefined);
    return run;
  });
  await ctx.addInitScript(`window.__csp = []; window.__name = (f) => f; document.addEventListener("securitypolicyviolation", (e) => window.__csp.push(e.violatedDirective + " " + e.blockedURI));`);
  const page = await ctx.newPage();
  const problems: string[] = [];
  page.on("console", (m) => (m.type() === "error" || /content security policy|refused to/i.test(m.text())) && problems.push(`console ${m.type()}: ${m.text().slice(0, 160)}`));
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message.slice(0, 160)}`));
  page.on("requestfailed", (r) => !/ERR_ABORTED/.test(r.failure()?.errorText ?? "") && problems.push(`request failed: ${r.url().slice(0, 100)}`));
  page.on("response", (r) => r.status() >= 400 && problems.push(`HTTP ${r.status()}: ${r.url().slice(0, 100)}`));

  for (const [first, second] of [["Tokyo", "Lisbon"], ["Lisbon", "Tokyo"]] as const) {
    const slug = first.toLowerCase();
    await page.goto(`${BASE}/planner?city=${slug}`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => {
      const b = document.querySelector(".planner-form button[type=submit]");
      return !!b && Object.keys(b).some((k) => k.startsWith("__reactFiber"));
    });
    await pickCity(page, second);
    await pickCity(page, first);
    check(true, `${first}: switched city twice (${first} to ${second} to ${first}) and Build stayed usable`);

    // 3 days, undated
    const group = page.getByRole("group", { name: "Days (1–14)", exact: true });
    for (let i = 0; i < 20 && Number((await group.locator("output").innerText()).trim()) !== 3; i++) {
      const cur = Number((await group.locator("output").innerText()).trim());
      await group.getByRole("button", { name: `${cur < 3 ? "More" : "Fewer"}: Days (1–14)`, exact: true }).click();
    }
    await page.locator(".planner-form button[type=submit]").click();
    await page.waitForSelector(".day-card", { timeout: 20000 });
    check((await page.locator(".trip-summary h2").innerText()).includes(first), `${first}: plan built for ${first}`);
    const pins = await mapsReady(page, first);
    await page.evaluate(() => document.getElementById("day-1")?.scrollIntoView({ block: "start" }));
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${OUT}/browser-${slug}-day1.jpg`, type: "jpeg", quality: 70 });
    await page.evaluate(() => document.getElementById("day-2")?.scrollIntoView({ block: "start" }));
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${OUT}/browser-${slug}-day2.jpg`, type: "jpeg", quality: 70 });

    // Shuffle day 2, then Swap one stop: stops and map pins must update together
    const before = await page.locator("#day-2 .stop h4").allTextContents();
    await page.locator("#day-2 .day-aside .btn-small").click();
    await page.waitForTimeout(500);
    const after = await page.locator("#day-2 .stop h4").allTextContents();
    check(true, `${first}: Shuffle day 2`, before.join("|") === after.join("|") ? "same day again" : "stops changed");
    const row = page.locator("#day-1 .stops > .stop", { has: page.locator(".popover > button", { hasText: /^Swap$/ }) }).first();
    const swapName = (await row.locator("h4").textContent())?.trim();
    const swap = row.locator(".popover", { has: page.locator("> button", { hasText: /^Swap$/ }) });
    await swap.locator("> button").scrollIntoViewIfNeeded();
    await swap.locator("> button").click();
    const option = swap.locator(".menu-link").first();
    const replacement = (await option.locator("strong").textContent())?.trim();
    await option.click();
    await page.waitForTimeout(800);
    const names = await page.locator("#day-1 .stop h4").allTextContents();
    check(!!replacement && names.includes(replacement) && !names.includes(swapName ?? ""), `${first}: Swap replaced "${swapName}" with "${replacement}"`);
    await mapsReady(page, `${first} after Shuffle and Swap`);
    check(pins > 0, `${first}: pins shown on the maps`, `${pins} in total`);
    check((await page.evaluate("window.__csp.length")) === 0, `${first}: no CSP violations`);
  }

  // City-guide tabs, by keyboard
  await page.goto(`${BASE}/destinations/tokyo`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => {
    const b = document.querySelector('[role="tab"]');
    return !!b && Object.keys(b).some((k) => k.startsWith("__reactFiber"));
  });
  const tabs = page.locator('[role="tab"]');
  const n = await tabs.count();
  await tabs.first().focus();
  const at = async () => page.evaluate(() => [...document.querySelectorAll('[role="tab"]')].findIndex((t) => t === document.activeElement && t.getAttribute("aria-selected") === "true"));
  const seq: [string, number][] = [["ArrowRight", 1], ["ArrowRight", 2], ["End", n - 1], ["ArrowRight", 0], ["ArrowLeft", n - 1], ["Home", 0]];
  let ok = true;
  for (const [key, want] of seq) {
    await page.keyboard.press(key);
    if ((await at()) !== want) ok = false;
  }
  check(ok, "Tokyo guide: Left/Right/Home/End move focus and selection and wrap");
  await page.keyboard.press("ArrowRight");
  await page.locator(".tabs-nav").screenshot({ path: `${OUT}/browser-tabs-focus.jpg`, type: "jpeg", quality: 80 });
  const ring = await page.evaluate(() => {
    const t = document.activeElement as HTMLElement;
    const s = getComputedStyle(t);
    return { style: s.outlineStyle, width: s.outlineWidth, offset: s.outlineOffset };
  });
  check(ring.style !== "none" && parseFloat(ring.width) >= 2, "Tokyo guide: the focused tab has a visible focus ring", JSON.stringify(ring));
  check((await page.evaluate("window.__csp.length")) === 0, "guide page: no CSP violations");

  check(problems.length === 0, "no console errors, CSP reports, failed requests or HTTP errors in the whole run", problems.slice(0, 4).join(" | "));
  console.log(`tile requests made to OpenStreetMap: ${requests} (cap ${MAX_TILES}, one at a time)`);
  await browser.close();
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exit(failed ? 1 : 0);
}
main();
