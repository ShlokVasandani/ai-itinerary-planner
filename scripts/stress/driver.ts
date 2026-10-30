/**
 * Drives /planner through the real UI in Chromium: sets every input the way a person would, builds the plan, and
 * reads back the page, the maps and the layout. Map tiles never leave the machine (a 1x1 PNG stub answers them).
 */
import type { BrowserContext, Page, Request } from "playwright-core";
import { BUDGET_LABELS, DIETARY_LABELS, INTEREST_LABELS, PACE_LABELS } from "../../lib/format";
import type { Destination, DietaryNeed, Interest } from "../../lib/types";
import type { GeneratedItinerary } from "../../lib/itinerary-engine";
import { locatedStops } from "./checks";
import { placeOptions } from "./data";
import { BASE, type Failure, type StressInput } from "./model";

export const TILE_PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");

/** Collects everything that should never happen while a page is used. */
export class Probe {
  events: Failure[] = [];
  priceRequests: URL[] = [];
  constructor(private base: string) {}
  attach(page: Page) {
    page.on("console", (m) => {
      const text = m.text();
      if (/hydrat|did not match|Minified React error #(418|423|425|299)/i.test(text)) this.events.push({ check: "robust.hydration", detail: text.slice(0, 200) });
      else if (m.type() === "error" && !/Failed to load resource/.test(text)) this.events.push({ check: "robust.console", detail: text.slice(0, 200) });
    });
    page.on("pageerror", (e) => this.events.push({ check: "robust.console", detail: `pageerror: ${e.message.slice(0, 200)}` }));
    page.on("requestfailed", (r) => {
      // Navigating away cancels in-flight image and prefetch loads; that is not a failure.
      if (/ERR_ABORTED|cancelled/i.test(r.failure()?.errorText ?? "")) return;
      this.events.push({ check: "robust.request", detail: `${r.method()} ${r.url().slice(0, 120)}: ${r.failure()?.errorText}` });
    });
    page.on("response", (r) => {
      if (r.status() >= 400) this.events.push({ check: "robust.request", detail: `${r.status()} ${r.url().slice(0, 120)}` });
    });
    page.on("request", (r: Request) => {
      const u = new URL(r.url());
      if (u.pathname.startsWith("/api/prices/")) this.priceRequests.push(u);
    });
  }
  drain(): Failure[] {
    const out = this.events;
    this.events = [];
    return out;
  }
}

export async function newContext(browser: import("playwright-core").Browser, base: string, jobId: number, width = 1440): Promise<BrowserContext> {
  const ctx = await browser.newContext({
    viewport: { width, height: 900 },
    // The price routes rate-limit by client key; give each job its own so the limit is never what fails.
    extraHTTPHeaders: { "x-forwarded-for": `10.77.${jobId >> 8}.${jobId & 255}` },
  });
  // tsx compiles with keepNames, which injects a __name() helper into functions sent to the page.
  await ctx.addInitScript("window.__name = (f) => f;");
  const origin = new URL(base);
  await ctx.route("**/*", (route) => {
    const u = new URL(route.request().url());
    if (u.host === origin.host || u.protocol === "data:" || u.protocol === "blob:") return route.continue();
    if (u.hostname.endsWith("tile.openstreetmap.org")) return route.fulfill({ status: 200, contentType: "image/png", body: TILE_PNG });
    // Anything else leaving the app is a finding, and is answered locally.
    probeThirdParty.push(u.host);
    return route.fulfill({ status: 200, contentType: "text/html", body: "<title>stub</title>" });
  });
  return ctx;
}
export const probeThirdParty: string[] = [];

/**
 * The regression check runs this same harness against an older build (383bdb2) that predates a few hooks the
 * newer markup added: data-ready on the map host and data-state on the floating panels.
 */
export const flags = { legacy: false };

const fieldset = (page: Page, legend: string) => page.locator("fieldset", { has: page.locator("legend", { hasText: new RegExp(`^${legend}$`) }) });

export class Planner {
  constructor(readonly page: Page, readonly base: string) {}

  /**
   * The form keeps interests and dietary needs in the order they were switched on (defaults first), and the engine
   * is given that order. Mirrored here so the expected plan is computed from the same list the page used.
   */
  interests: Interest[] = [...BASE.interests];
  dietary: DietaryNeed[] = [];

  async open(input: StressInput) {
    this.interests = [...BASE.interests];
    this.dietary = [];
    const q = new URLSearchParams({ city: input.slug, adults: String(input.adults) });
    if (input.children) q.set("children", String(input.children));
    if (input.start && input.end) {
      q.set("start", input.start);
      q.set("end", input.end);
    }
    await this.page.goto(`${this.base}/planner?${q}`, { waitUntil: "domcontentloaded" });
    await this.hydrated();
  }

  /** The submit button carries React's fiber once the page has hydrated. */
  async hydrated() {
    await this.page.waitForFunction(() => {
      const b = document.querySelector(".planner-form button[type=submit]");
      return !!b && Object.keys(b).some((k) => k.startsWith("__reactFiber"));
    }, null, { timeout: 30000 });
  }

  private async segmented(legend: string, label: string) {
    const btn = fieldset(this.page, legend).getByRole("radio", { name: label, exact: true });
    if ((await btn.getAttribute("aria-checked")) !== "true") await btn.click();
  }

  private async toggles<T extends string>(legend: string, want: T[], labels: Record<T, string>, state: T[]): Promise<T[]> {
    const byLabel = new Map((Object.entries(labels) as [T, string][]).map(([id, label]) => [label, id]));
    const buttons = fieldset(this.page, legend).locator("button.seg-btn");
    const n = await buttons.count();
    let now = [...state];
    for (let i = 0; i < n; i++) {
      const b = buttons.nth(i);
      const id = byLabel.get((await b.innerText()).trim())!;
      const on = (await b.getAttribute("aria-pressed")) === "true";
      const should = want.includes(id);
      if (on === should) continue;
      await b.click();
      now = should ? [...now, id] : now.filter((x) => x !== id);
    }
    return now;
  }

  async stepper(label: string, target: number) {
    const group = this.page.getByRole("group", { name: label, exact: true });
    for (let i = 0; i < 40; i++) {
      const cur = Number((await group.locator("output").innerText()).trim());
      if (cur === target) return;
      await group.getByRole("button", { name: `${cur < target ? "More" : "Fewer"}: ${label}`, exact: true }).click();
    }
    throw new Error(`stepper "${label}" would not reach ${target}`);
  }

  private async places(label: string, names: string[]) {
    const chips = this.page.locator(`ul.chips[aria-label="${label}, selected"] button`);
    while ((await chips.count()) > 0) await chips.first().click();
    const field = this.page.locator(".field", { has: this.page.getByLabel(label, { exact: true }) });
    for (const name of names) {
      await field.getByLabel(label, { exact: true }).fill(name);
      await field.getByRole("button", { name: "Add", exact: true }).click();
    }
  }

  /** Brings every control to `input`. Adults, children, dates and the city come from the URL in open(). */
  async apply(input: StressInput, dest: Destination): Promise<StressInput> {
    const dated = !!(input.start && input.end);
    if (!dated) await this.stepper("Days (1–14)", input.duration);
    await this.stepper("Adults", input.adults);
    await this.stepper("Children", input.children);
    await this.segmented("Pace", PACE_LABELS[input.pace]);
    await this.segmented("Budget", BUDGET_LABELS[input.budget]);
    await this.segmented("Getting around", input.mobility === "limited" ? "Limited mobility" : "Happy to walk");
    await this.page.getByLabel("Travel style").selectOption(input.travelStyle);
    this.interests = await this.toggles("Interests", input.interests, INTEREST_LABELS, this.interests);
    this.dietary = await this.toggles("Dietary needs", input.dietary, DIETARY_LABELS, this.dietary);
    const name = (id: string) => placeOptions(dest).find((o) => o.id === id)!.label;
    await this.places("Must include", input.mustInclude.map(name));
    await this.places("Skip these", input.avoid.map(name));
    await this.flights(input.arrivalTime, input.departureTime);
    return { ...input, interests: [...this.interests], dietary: [...this.dietary] };
  }

  async flights(arrival: string, departure: string) {
    const details = this.page.locator("details.field-details");
    if ((await details.getAttribute("open")) === null) await details.locator("summary").click();
    await this.page.getByLabel("Landing on day 1").fill(arrival);
    await this.page.getByLabel("Flight home, last day").fill(departure);
  }

  /** Clicks Build and waits until a fresh plan, not the previous one, is on screen. */
  async build() {
    await this.page.evaluate(() => document.querySelectorAll(".trip-summary").forEach((e) => e.setAttribute("data-old", "1")));
    await this.page.locator(".planner-form button[type=submit]").click();
    await this.page.waitForSelector(".trip-summary:not([data-old])", { timeout: 30000 });
    await this.page.waitForSelector(".day-card", { timeout: 15000 });
  }

  /** The Leaflet host for each day, scrolled into view (maps load lazily) and read back. */
  async maps(it: GeneratedItinerary): Promise<{ failures: Failure[]; shots: number }> {
    const failures: Failure[] = [];
    for (const d of it.days) {
      const where = `day ${d.dayNumber}`;
      const day = this.page.locator(`#day-${d.dayNumber}`);
      const want = locatedStops(d);
      const slot = day.locator(".day-map-canvas, .day-map-empty").first();
      try {
        await slot.scrollIntoViewIfNeeded({ timeout: 15000 });
        await slot.waitFor({ timeout: 15000 });
      } catch {
        failures.push({ check: "map.missing", detail: `${where}: neither a map nor a "no map" note appeared` });
        continue;
      }
      const isEmpty = (await day.locator(".day-map-empty").count()) > 0;
      if (want.length === 0) {
        if (!isEmpty) failures.push({ check: "map.markers", detail: `${where}: no located stops but a map is shown` });
        continue;
      }
      if (isEmpty) {
        failures.push({ check: "map.markers", detail: `${where}: ${want.length} located stops but the page says there is no map` });
        continue;
      }
      const canvas = day.locator(".day-map-canvas");
      try {
        if (!flags.legacy) await canvas.and(this.page.locator("[data-ready]")).waitFor({ timeout: 15000 });
        await canvas.locator(".leaflet-tile-loaded").first().waitFor({ state: "attached", timeout: 15000 });
        await this.page.waitForFunction(
          ([id, n]) => document.querySelectorAll(`#${id} .leaflet-marker-icon`).length === n,
          [`day-${d.dayNumber}`, want.length] as [string, number],
          { timeout: 6000 }
        ).catch(() => undefined);
      } catch {
        failures.push({ check: "map.tiles", detail: `${where}: map never became ready with a loaded tile` });
      }
      const m = await canvas.evaluate((el) => {
        const box = el.getBoundingClientRect();
        const attr = el.querySelector(".leaflet-control-attribution");
        const icons = [...el.querySelectorAll<HTMLElement>(".leaflet-marker-icon")];
        return {
          container: el.classList.contains("leaflet-container"),
          label: el.getAttribute("aria-label") ?? "",
          tiles: [...el.querySelectorAll<HTMLImageElement>(".leaflet-tile-loaded")].filter((t) => t.naturalWidth > 0).length,
          attrFont: attr ? parseFloat(getComputedStyle(attr).fontSize) : NaN,
          markers: icons.map((i) => {
            const r = i.getBoundingClientRect();
            const cx = r.left + r.width / 2;
            const cy = r.top + r.height / 2;
            return { title: i.title, text: (i.textContent ?? "").trim(), inside: cx >= box.left - 2 && cx <= box.right + 2 && cy >= box.top - 2 && cy <= box.bottom + 2 };
          }),
        };
      });
      if (!m.container) failures.push({ check: "map.container", detail: `${where}: host lost .leaflet-container` });
      if (m.tiles < 1) failures.push({ check: "map.tiles", detail: `${where}: no loaded tile with naturalWidth > 0` });
      if (!(m.attrFont <= 13)) failures.push({ check: "map.attribution", detail: `${where}: attribution font-size ${m.attrFont}px` });
      if (m.markers.length !== want.length) failures.push({ check: "map.markers", detail: `${where}: ${m.markers.length} markers for ${want.length} located stops` });
      m.markers.forEach((mk, i) => {
        const expect = `${i + 1}. ${want[i]?.name}`;
        if (mk.text !== String(i + 1) || (want[i] && mk.title !== expect)) failures.push({ check: "map.numbering", detail: `${where}: marker ${i + 1} reads "${mk.text}" titled "${mk.title}", expected "${expect}"` });
        if (!mk.inside) failures.push({ check: "map.marker-outside", detail: `${where}: marker ${i + 1} ("${want[i]?.name}") sits outside the map frame` });
      });
      const claimed = Number(/with (\d+) located stops/.exec(m.label)?.[1] ?? NaN);
      if (claimed !== want.length) failures.push({ check: "map.markers", detail: `${where}: map labelled ${claimed} located stops, engine has ${want.length}` });
    }
    return { failures, shots: it.days.length };
  }

  /** Horizontal overflow of the whole page at a given width. */
  async overflow(width: number): Promise<Failure[]> {
    const prev = this.page.viewportSize() ?? { width: 1440, height: 900 };
    await this.page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
    await this.page.waitForTimeout(120);
    const r = await this.page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const sw = document.documentElement.scrollWidth;
      const offenders: string[] = [];
      if (sw > vw + 1) {
        for (const el of document.querySelectorAll<HTMLElement>("body *")) {
          if (el.closest(".sr-only")) continue;
          const b = el.getBoundingClientRect();
          if (b.width > 0 && b.right > vw + 1) {
            offenders.push(`${el.tagName.toLowerCase()}${el.className && typeof el.className === "string" ? "." + el.className.split(" ")[0] : ""} right=${Math.round(b.right)}`);
            if (offenders.length >= 4) break;
          }
        }
      }
      return { vw, sw, offenders };
    });
    await this.page.setViewportSize(prev);
    await this.page.waitForTimeout(80);
    return r.sw > r.vw + 1 ? [{ check: `robust.overflow-${width}`, detail: `page scrolls sideways at ${width}px: scrollWidth ${r.sw} > ${r.vw}; wide: ${r.offenders.join("; ")}` }] : [];
  }
}
