/**
 * End-to-end check with Playwright (system Chrome): builds a 5-day plan for every
 * city, opens every Book/Details menu, checks the attributes of every outbound
 * link and clicks each distinct link once. External hosts are stubbed, so no
 * third-party site is actually hit; we verify the click opens a new tab at the
 * expected URL.
 *
 * Usage: npm run build && npm start   (other terminal)
 *        npx tsx scripts/verify-e2e.ts [baseUrl] [slug ...]
 */
import { chromium } from "playwright-core";
import { destinations } from "../lib/data";

const BASE = process.argv[2] ?? "http://localhost:3000";
const only = process.argv.slice(3);
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const base = new URL(BASE);

async function main() {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const problems: string[] = [];
  let totalLinks = 0;
  let totalClicks = 0;
  for (const d of destinations.filter((x) => only.length === 0 || only.includes(x.slug))) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    // Never hit third-party hosts: answer them with a stub page.
    await ctx.route("**/*", (route) => {
      const u = new URL(route.request().url());
      if (u.host === base.host || u.protocol === "data:" || u.protocol === "blob:") return route.continue();
      if (u.hostname.endsWith("tile.openstreetmap.org")) return route.fulfill({ status: 204 });
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
      continue;
    }
    const days = await page.locator(".day-card").count();
    if (days !== 5) problems.push(`${d.slug}: expected 5 days, got ${days}`);
    const stops = await page.locator(".stop").count();
    if (stops < 15) problems.push(`${d.slug}: only ${stops} stops`);

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
  }
  await browser.close();
  console.log(`\n${totalLinks} outbound links checked, ${totalClicks} distinct links clicked.`);
  if (problems.length) {
    console.error(`${problems.length} problem(s):\n` + problems.slice(0, 60).map((p) => " - " + p).join("\n"));
    process.exit(1);
  }
  console.log("All good.");
}
main();
