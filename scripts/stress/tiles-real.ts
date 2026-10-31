/**
 * Real-tile check on three cities only, strictly one request at a time. OpenStreetMap's tile servers are a free
 * community service, so: no parallelism, a pause between requests, an identifying User-Agent, a hard cap per city,
 * and nothing else in the suite ever touches them (everything else is answered by a 1x1 PNG stub).
 */
import type { Browser } from "playwright-core";
import { loadDestination } from "../../lib/data/catalog";
import { addDays } from "../../lib/engine/time";
import { Probe, Planner } from "./driver";
import { with_, type TileResult } from "./model";
import { engineFor } from "./flow";
import { locatedStops } from "./checks";

const CITIES = ["tokyo", "lisbon", "rome"];
const PAUSE_MS = 1000;
const MAX_TILES = 30;

export async function runRealTiles(browser: Browser, base: string, shotDir: string): Promise<TileResult[]> {
  const out: TileResult[] = [];
  for (const slug of CITIES) {
    const dest = (await loadDestination(slug))!;
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addInitScript("window.__name = (f) => f;");
    let requests = 0;
    let chain: Promise<unknown> = Promise.resolve();
    const origin = new URL(base);
    await ctx.route("**/*", (route) => {
      const u = new URL(route.request().url());
      if (u.host === origin.host || u.protocol === "data:" || u.protocol === "blob:") return route.continue();
      if (!u.hostname.endsWith("tile.openstreetmap.org")) return route.abort();
      // One tile at a time: each waits for the previous one, then pauses before the next.
      const run = chain.then(async () => {
        if (requests >= MAX_TILES) return route.abort();
        requests++;
        try {
          const res = await route.fetch({ headers: { ...route.request().headers(), "user-agent": "SekaiStressTest/1.0 (local verification; 3 cities, one tile at a time)" } });
          await route.fulfill({ response: res });
        } catch {
          await route.abort();
        }
        await new Promise((r) => setTimeout(r, PAUSE_MS));
      });
      chain = run.catch(() => undefined);
      return run;
    });
    const page = await ctx.newPage();
    const probe = new Probe(base);
    probe.attach(page);
    const planner = new Planner(page, base);
    const failures: TileResult["failures"] = [];
    let tiles = 0;
    let attr = NaN;
    let screenshot: string | undefined;
    try {
      const input = with_(slug, { start: addDays("2027-03-02", 0), end: addDays("2027-03-02", 2) });
      await planner.open(input);
      await planner.apply(input, dest);
      await planner.build();
      const it = engineFor(input, dest);
      const day1 = page.locator("#day-1 .day-map-canvas");
      await day1.scrollIntoViewIfNeeded();
      await day1.and(page.locator("[data-ready]")).waitFor({ timeout: 20000 });
      await day1.locator(".leaflet-tile-loaded").first().waitFor({ state: "attached", timeout: 60000 });
      await page.waitForTimeout(2500);
      const m = await day1.evaluate((el) => ({
        container: el.classList.contains("leaflet-container"),
        tiles: [...el.querySelectorAll<HTMLImageElement>(".leaflet-tile-loaded")].filter((t) => t.naturalWidth > 0).length,
        attr: parseFloat(getComputedStyle(el.querySelector(".leaflet-control-attribution")!).fontSize),
        markers: el.querySelectorAll(".leaflet-marker-icon").length,
      }));
      tiles = m.tiles;
      attr = m.attr;
      if (!m.container) failures.push({ check: "tiles.container", detail: "no .leaflet-container" });
      if (m.tiles < 1) failures.push({ check: "tiles.loaded", detail: "no real tile with naturalWidth > 0" });
      if (!(m.attr <= 13)) failures.push({ check: "tiles.attribution", detail: `attribution ${m.attr}px` });
      const want = locatedStops(it.days[0]).length;
      if (m.markers !== want) failures.push({ check: "tiles.markers", detail: `${m.markers} markers for ${want} located stops` });
      await page.evaluate(() => document.getElementById("day-1")?.scrollIntoView({ block: "start" }));
      await page.waitForTimeout(600);
      screenshot = `${shotDir}/real-tiles-${slug}.jpg`;
      await page.locator("#day-1").screenshot({ path: screenshot, type: "jpeg", quality: 70 });
    } catch (e) {
      failures.push({ check: "tiles.exception", detail: (e as Error).message.split("\n")[0].slice(0, 200) });
    }
    failures.push(...probe.drain().filter((x) => !/tile\.openstreetmap\.org/.test(x.detail)));
    out.push({ slug, city: dest.city, tilesLoaded: tiles, tileRequests: requests, attributionPx: attr, failures, screenshot });
    await ctx.close();
    console.log(`real tiles ${slug}: ${tiles} tiles loaded from ${requests} requests, attribution ${attr}px${failures.length ? `, ${failures.length} problem(s)` : ""}`);
  }
  return out;
}
