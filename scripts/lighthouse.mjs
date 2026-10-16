// Runs Lighthouse (mobile + desktop) on home, a destination and the planner and prints a table.
// Usage: node scripts/lighthouse.mjs [baseUrl] [label]   (app must be running; needs Chrome)
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const base = process.argv[2] ?? "http://localhost:3000";
const label = process.argv[3] ?? "run";
const pages = [["home", "/"], ["destination", "/destinations/lisbon"], ["planner", "/planner?city=lisbon&go=1"]];
process.env.CHROME_PATH ??= "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const rows = [];
for (const [name, path] of pages) {
  for (const form of ["mobile", "desktop"]) {
    const out = `/tmp/lh-${label}-${name}-${form}.json`;
    const args = ["-y", "lighthouse", base + path, "--quiet", "--output=json", `--output-path=${out}`,
      "--only-categories=performance,accessibility,best-practices,seo", "--chrome-flags=--headless=new --no-sandbox"];
    if (form === "desktop") args.push("--preset=desktop");
    try { execFileSync("npx", args, { stdio: "ignore", timeout: 240000 }); } catch {}
    try {
      const r = JSON.parse(fs.readFileSync(out, "utf8"));
      const c = r.categories;
      const failing = Object.values(r.audits).filter((a) => a.score !== null && a.score < 1 && ["accessibility","best-practices","seo"].some((k) => c[k].auditRefs.some((x) => x.id === a.id))).map((a) => a.id);
      rows.push({ page: name, form, perf: Math.round(c.performance.score*100), a11y: Math.round(c.accessibility.score*100), bp: Math.round(c["best-practices"].score*100), seo: Math.round(c.seo.score*100), lcp: r.audits["largest-contentful-paint"].displayValue, cls: r.audits["cumulative-layout-shift"].displayValue, failing: failing.join(",") });
    } catch { rows.push({ page: name, form, error: "failed" }); }
  }
}
console.table(rows);
fs.writeFileSync(`/tmp/lh-summary-${label}.json`, JSON.stringify(rows, null, 2));
