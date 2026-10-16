/**
 * Removes officialUrl values that definitively return 404/410 (dead pages) from
 * the generated overlay, so the UI never offers a dead "Official site" link.
 * Timeouts, 403s and 5xx are left alone: those are usually bot protection or a
 * slow site, not a dead link (validate-data.ts still reports them).
 */
import { destinations } from "../lib/data";
import { readOverlay, writeOverlay } from "./lib/overlay";

const UA = "SekaiItineraryPlanner/1.0 link-check";

async function status(url: string): Promise<number | "error"> {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 12000);
    let res = await fetch(url, { method: "HEAD", redirect: "follow", signal: ctl.signal, headers: { "User-Agent": UA } });
    if (res.status === 405 || res.status === 403 || res.status === 404) res = await fetch(url, { method: "GET", redirect: "follow", signal: ctl.signal, headers: { "User-Agent": UA } });
    clearTimeout(t);
    return res.status;
  } catch {
    return "error";
  }
}

async function main() {
  let removed = 0;
  for (const d of destinations) {
    const overlay = readOverlay(d.slug);
    let changed = false;
    const entries = Object.entries(overlay.places ?? {}).filter(([, v]) => v.officialUrl);
    for (let i = 0; i < entries.length; i += 8) {
      await Promise.all(
        entries.slice(i, i + 8).map(async ([id, v]) => {
          const s = await status(v.officialUrl!);
          if (s === 404 || s === 410) {
            console.log(`${d.slug}/${id}: ${s} ${v.officialUrl} (removed)`);
            delete overlay.places![id].officialUrl;
            removed++;
            changed = true;
          }
        })
      );
    }
    if (changed) writeOverlay(d.slug, overlay);
  }
  console.log(`removed ${removed} dead URLs`);
}
main();
