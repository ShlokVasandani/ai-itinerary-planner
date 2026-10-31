/**
 * Takes full-page screenshots of the landing page, a destination page and the
 * planner at 375, 820 and 1440 px using the locally installed Chrome.
 *
 * Usage: npm run build && npm start   (in another terminal)
 *        npx tsx scripts/screenshots.ts [baseUrl]
 */
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const BASE = process.argv[2] ?? "http://localhost:3000";
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = path.join(process.cwd(), "docs", "screenshots");
const WIDTHS = [375, 820, 1440];
const PAGES: { name: string; url: string; wait?: string }[] = [
  { name: "landing", url: "/" },
  { name: "destination", url: "/destinations/lisbon" },
  { name: "planner", url: "/planner?city=lisbon&go=1&start=2027-03-02&end=2027-03-05&adults=2", wait: ".day-card" },
];

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
  for (const w of WIDTHS) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: w < 600 ? 812 : 900, deviceScaleFactor: 1 });
    for (const p of PAGES) {
      await page.goto(BASE + p.url, { waitUntil: "networkidle2", timeout: 60000 });
      if (p.wait) await page.waitForSelector(p.wait, { timeout: 20000 }).catch(() => undefined);
      // let reveal/expand effects settle and trigger lazy content by scrolling through the page
      // (a string, so tsx does not inject helpers that do not exist in the page)
      await page.evaluate(`new Promise((resolve) => {
        let y = 0;
        const step = () => {
          window.scrollTo(0, y);
          y += 600;
          if (y < document.body.scrollHeight) setTimeout(step, 60);
          else { window.scrollTo(0, 0); setTimeout(resolve, 400); }
        };
        step();
      })`);
      const overflow = Number(await page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth"));
      const file = path.join(OUT, `${p.name}-${w}.png`);
      await page.screenshot({ path: file, fullPage: true });
      console.log(`${p.name} @${w}: ${file}${overflow > 0 ? `  (horizontal overflow ${overflow}px)` : ""}`);
    }
    await page.close();
  }
  await browser.close();
}

main();
