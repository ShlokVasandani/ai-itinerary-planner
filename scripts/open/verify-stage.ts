/**
 * Whole-catalog verification, run after every stage (50 -> 100 -> 200). Exits non-zero on any failure.
 *
 *  A  typecheck + unit tests (including tests/open-catalog.test.ts, which re-runs every per-city check)
 *  B  catalog consistency: index <-> files <-> loaders <-> photos, unique slugs / Wikidata ids, no overlapping cities
 *  C  production build into its own folder, then serve it
 *  D  HTTP smoke: every city page and planner page returns 200 with the right heading and valid JSON-LD; sitemap and robots
 *  E  real browser (system Chrome): destination page and a dated 5-day plan for every city; images load, no console errors,
 *     no horizontal overflow at phone width; the planner's city picker switches to a lazily loaded city
 *
 *   npx tsx scripts/open/verify-stage.ts [--target 50] [--skip-build] [--browser-sample 0]   (0 = every city)
 */
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";
import { haversineKm } from "../../lib/engine/geo";
import type { Destination } from "../../lib/types";

const arg = (n: string, d: string) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const flag = (n: string) => process.argv.includes(`--${n}`);
const TARGET = Number(arg("target", "0"));
const SAMPLE = Number(arg("browser-sample", "0"));
const PORT = 3999;
const BASE = `http://localhost:${PORT}`;
const ROOT = process.cwd();
const OPEN = path.join(ROOT, "lib", "data", "open");
const REPORT_DIR = path.join(ROOT, "docs", "open-data");
fs.mkdirSync(REPORT_DIR, { recursive: true });

const problems: string[] = [];
const notes: string[] = [];
const fail = (area: string, msg: string) => problems.push(`[${area}] ${msg}`);
const log = (...a: unknown[]) => console.log(new Date().toISOString().slice(11, 19), ...a);

function run(label: string, cmd: string, args: string[], env: Record<string, string> = {}): boolean {
  log(`▶ ${label}`);
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, ...env }, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) {
    fail(label, `exit ${r.status}\n${(r.stdout + r.stderr).split("\n").slice(-25).join("\n")}`);
    return false;
  }
  return true;
}

/* ---------------- B. catalog consistency ---------------- */
function catalogChecks(): string[] {
  const index = JSON.parse(fs.readFileSync(path.join(OPEN, "index.json"), "utf8")) as { slug: string; city: string; hasPhoto: boolean }[];
  const photos = JSON.parse(fs.readFileSync(path.join(OPEN, "photos.json"), "utf8")) as Record<string, { widths: number[] }>;
  const loaders = fs.readFileSync(path.join(OPEN, "loaders.ts"), "utf8");
  const files = fs.readdirSync(OPEN).filter((f) => f.endsWith(".json") && !["index.json", "photos.json"].includes(f)).map((f) => f.replace(/\.json$/, ""));
  const slugs = index.map((e) => e.slug);
  if (new Set(slugs).size !== slugs.length) fail("catalog", "duplicate slugs in index");
  for (const s of files) if (!slugs.includes(s)) fail("catalog", `${s}.json is not in the index`);
  for (const s of slugs) {
    if (!files.includes(s)) fail("catalog", `${s} is indexed but has no data file`);
    if (!loaders.includes(`"${s}":`)) fail("catalog", `${s} has no loader`);
  }
  const curated = new Set(["tokyo", "paris", "london", "dubai", "singapore", "bangkok", "rome", "barcelona", "new-york-city", "istanbul", "seoul", "amsterdam", "copenhagen", "hong-kong", "sydney", "zurich", "los-angeles", "kuala-lumpur", "vienna", "lisbon"]);
  for (const s of slugs) if (curated.has(s)) fail("catalog", `${s} collides with a curated city`);
  const ds: Destination[] = files.map((f) => JSON.parse(fs.readFileSync(path.join(OPEN, `${f}.json`), "utf8")));
  const qids = ds.map((d) => d.wikidataId);
  if (new Set(qids).size !== qids.length) fail("catalog", "two cities share a Wikidata id");
  // Two distinct cities should not sit on top of each other.
  const centres = ds.map((d) => ({ d, c: { lat: d.neighborhoods.reduce((s, h) => s + h.coords!.lat, 0) / d.neighborhoods.length, lng: d.neighborhoods.reduce((s, h) => s + h.coords!.lng, 0) / d.neighborhoods.length } }));
  for (let i = 0; i < centres.length; i++)
    for (let j = i + 1; j < centres.length; j++) if (haversineKm(centres[i].c, centres[j].c) < 3) fail("catalog", `${centres[i].d.slug} and ${centres[j].d.slug} are within 3 km`);
  for (const e of index) {
    if (e.hasPhoto !== !!photos[e.slug]) fail("catalog", `${e.slug}: hasPhoto disagrees with photos.json`);
  }
  for (const s of Object.keys(photos)) if (!slugs.includes(s)) fail("catalog", `photo for unpublished city ${s}`);
  const withPhoto = index.filter((e) => e.hasPhoto).length;
  const ratio = index.length ? withPhoto / index.length : 1;
  notes.push(`photos: ${withPhoto}/${index.length} (${Math.round(ratio * 100)}%)`);
  if (ratio < 0.85) fail("catalog", `only ${Math.round(ratio * 100)}% of open cities have a photo (min 85%)`);
  if (TARGET && 20 + slugs.length < TARGET) fail("catalog", `${20 + slugs.length} destinations published, target ${TARGET}`);
  // orphan image files
  const imgDir = path.join(ROOT, "public", "images", "destinations");
  const known = new Set([...slugs, ...curated]);
  for (const f of fs.readdirSync(imgDir)) {
    const base = f.replace(/(-\d+)?\.(jpg|webp|avif)$/, "");
    if (!known.has(base)) fail("catalog", `orphan image ${f}`);
  }
  return slugs;
}

/* ---------------- D. HTTP smoke ---------------- */
async function httpSmoke(slugs: string[]) {
  const get = async (p: string) => {
    const res = await fetch(`${BASE}${p}`, { redirect: "manual" });
    return { status: res.status, text: await res.text() };
  };
  const all = ["tokyo", "lisbon", ...slugs];
  let n = 0;
  for (const slug of all) {
    const dest = await get(`/destinations/${slug}`);
    if (dest.status !== 200) {
      fail("http", `/destinations/${slug} -> ${dest.status}`);
      continue;
    }
    if (!/<h1[^>]*>[^<]+<\/h1>/.test(dest.text)) fail("http", `/destinations/${slug}: no h1`);
    const ld = /<script type="application\/ld\+json">([^<]+)<\/script>/.exec(dest.text);
    try {
      if (!ld) throw new Error("missing");
      JSON.parse(ld[1].replace(/\\u003c/g, "<").replace(/\\u003e/g, ">").replace(/\\u0026/g, "&"));
    } catch {
      fail("http", `/destinations/${slug}: invalid JSON-LD`);
    }
    if (/undefined|\[object Object\]|NaN/.test(dest.text.replace(/<script[\s\S]*?<\/script>/g, ""))) fail("http", `/destinations/${slug}: leaked undefined/NaN text`);
    const plan = await get(`/planner?city=${slug}&go=1`);
    if (plan.status !== 200) fail("http", `/planner?city=${slug} -> ${plan.status}`);
    n++;
  }
  for (const p of ["/", "/destinations", "/planner", "/credits", "/robots.txt"]) {
    const r = await get(p);
    if (r.status !== 200) fail("http", `${p} -> ${r.status}`);
  }
  const sm = await get("/sitemap.xml");
  const urls = (sm.text.match(/<loc>/g) ?? []).length;
  const expected = 20 + slugs.length + 4;
  if (urls !== expected) fail("http", `sitemap has ${urls} URLs, expected ${expected}`);
  const missing = await get("/destinations/not-a-real-city");
  if (missing.status !== 404) fail("http", `unknown city returned ${missing.status}, expected 404`);
  notes.push(`HTTP smoke: ${n} cities, sitemap ${urls} URLs`);
}

/* ---------------- E. real browser ---------------- */
async function browserChecks(slugs: string[]) {
  const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const list = SAMPLE > 0 ? slugs.filter((_, i) => i % Math.ceil(slugs.length / SAMPLE) === 0) : slugs;
  let done = 0;
  for (const slug of list) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx.route("**/*", (route) => {
      const u = new URL(route.request().url());
      if (u.host === `localhost:${PORT}` || u.protocol === "data:" || u.protocol === "blob:") return route.continue();
      if (u.hostname.endsWith("tile.openstreetmap.org")) return route.fulfill({ status: 204 });
      return route.fulfill({ status: 200, contentType: "text/html", body: "<title>stub</title>" });
    });
    const page = await ctx.newPage();
    const errs: string[] = [];
    page.on("pageerror", (e) => errs.push(`pageerror ${e.message}`));
    page.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errs.push(`console ${m.text()}`));
    try {
      await page.goto(`${BASE}/destinations/${slug}`, { waitUntil: "load" });
      const h1 = await page.locator("h1").first().innerText();
      if (!h1.trim()) fail("browser", `${slug}: empty h1`);
      const imgOk = await page.evaluate(() => {
        const img = document.querySelector<HTMLImageElement>(".dest-figure img");
        return img ? img.complete && img.naturalWidth > 0 : null;
      });
      if (imgOk === false) fail("browser", `${slug}: hero photo failed to load`);
      for (const tab of ["Places", "Food", "Neighborhoods"]) {
        const btn = page.getByRole("tab", { name: tab });
        if (await btn.count()) {
          await btn.click();
          const items = await page.locator(".edit-item").count();
          if (items === 0) fail("browser", `${slug}: ${tab} tab is empty`);
        }
      }
      await page.goto(`${BASE}/planner?city=${slug}&go=1&start=2027-03-02&end=2027-03-06&adults=2`, { waitUntil: "load" });
      await page.waitForSelector(".day-card", { timeout: 25000 });
      const days = await page.locator(".day-card").count();
      if (days !== 5) fail("browser", `${slug}: expected 5 days, got ${days}`);
      const stops = await page.locator(".stop").count();
      if (stops < 10) fail("browser", `${slug}: only ${stops} stops in a 5-day plan`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (overflow > 2) fail("browser", `${slug}: horizontal overflow ${overflow}px at desktop width`);
      await page.setViewportSize({ width: 390, height: 844 });
      const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (mobileOverflow > 2) fail("browser", `${slug}: horizontal overflow ${mobileOverflow}px at phone width`);
    } catch (e) {
      fail("browser", `${slug}: ${(e as Error).message.split("\n")[0]}`);
    }
    for (const e of errs.slice(0, 3)) fail("browser", `${slug}: ${e}`);
    await ctx.close();
    if (++done % 10 === 0) log(`  browser ${done}/${list.length}`);
  }
  // City picker switches to a lazily loaded open-data city.
  if (slugs.length) {
    const target = slugs[Math.floor(slugs.length / 2)];
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    try {
      await page.goto(`${BASE}/planner?city=tokyo`, { waitUntil: "load" });
      await page.locator(".sf-trigger").first().click();
      await page.locator(".sf-search").fill(target.replace(/-/g, " "));
      await page.locator(".sf-list button").first().click();
      await page.waitForFunction((t) => document.querySelector(".planner-hero h1")?.textContent?.toLowerCase().includes(t.split("-")[0]), target, { timeout: 15000 });
      await page.getByRole("button", { name: /Build|Plan my trip/i }).last().click();
      await page.waitForSelector(".day-card", { timeout: 15000 });
    } catch (e) {
      fail("browser", `city picker switch to ${target}: ${(e as Error).message.split("\n")[0]}`);
    }
    await ctx.close();
  }
  await browser.close();
  notes.push(`browser: ${list.length} cities (destination page + dated 5-day plan + phone width)`);
}

/* ---------------- main ---------------- */
async function main() {
  let server: ChildProcess | undefined;
  try {
    const slugs = catalogChecks();
    log(`catalog consistent: ${slugs.length} open cities`);
    run("typecheck", "npx", ["tsc", "--noEmit"]);
    run("unit tests", "npx", ["vitest", "run"]);
    if (problems.length === 0) {
      if (!flag("skip-build")) {
        fs.rmSync(path.join(ROOT, ".next-verify"), { recursive: true, force: true });
        run("production build", "npx", ["next", "build"], { NEXT_DIST_DIR: ".next-verify", NEXT_PUBLIC_SITE_URL: "https://example.test" });
      }
      if (problems.length === 0) {
        server = spawn("npx", ["next", "start", "-p", String(PORT)], { cwd: ROOT, env: { ...process.env, NEXT_DIST_DIR: ".next-verify", NEXT_PUBLIC_SITE_URL: "https://example.test" }, stdio: "ignore", detached: true });
        for (let i = 0; i < 60; i++) {
          try {
            if ((await fetch(`${BASE}/robots.txt`)).ok) break;
          } catch {
            /* not up yet */
          }
          await new Promise((r) => setTimeout(r, 1000));
        }
        await httpSmoke(slugs);
        await browserChecks(slugs);
      }
    }
  } finally {
    if (server?.pid) {
      try {
        process.kill(-server.pid);
      } catch {
        /* already gone */
      }
    }
  }
  const stamp = new Date().toISOString();
  const md = [`# Open-data verification`, ``, `Run: ${stamp}`, ``, `Result: **${problems.length ? "FAILED" : "PASSED"}**`, ``, ...notes.map((n) => `- ${n}`), ``, ...(problems.length ? [`## Problems`, ``, ...problems.map((p) => `- ${p}`)] : [])].join("\n");
  fs.writeFileSync(path.join(REPORT_DIR, "verification.md"), md + "\n");
  if (problems.length) {
    console.error(`\n${problems.length} problem(s):\n` + problems.slice(0, 40).map((p) => " - " + p).join("\n"));
    process.exit(1);
  }
  log("ALL CHECKS PASSED", notes.join(" | "));
}
main();
