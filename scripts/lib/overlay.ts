import fs from "node:fs";
import path from "node:path";
import type { GeneratedCity } from "../../lib/data/merge";

const DIR = path.join(process.cwd(), "lib", "data", "generated");

export function overlayPath(slug: string): string {
  return path.join(DIR, `${slug}.json`);
}

export function readOverlay(slug: string): GeneratedCity {
  try {
    return JSON.parse(fs.readFileSync(overlayPath(slug), "utf8")) as GeneratedCity;
  } catch {
    return {};
  }
}

function sortKeys<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b))) as T;
}

/** Writes an overlay with stable key ordering so diffs stay small. */
export function writeOverlay(slug: string, overlay: GeneratedCity): void {
  const out: GeneratedCity = {};
  if (overlay.bbox) out.bbox = overlay.bbox;
  if (overlay.places) {
    out.places = sortKeys(
      Object.fromEntries(Object.entries(overlay.places).map(([id, v]) => [id, sortKeys(v as Record<string, unknown>)]))
    ) as GeneratedCity["places"];
  }
  if (overlay.neighborhoods) out.neighborhoods = sortKeys(overlay.neighborhoods);
  fs.writeFileSync(overlayPath(slug), JSON.stringify(out, null, 2) + "\n");
}

export function patchPlace(overlay: GeneratedCity, id: string, patch: Record<string, unknown>): void {
  overlay.places ??= {};
  overlay.places[id] = { ...(overlay.places[id] ?? {}), ...patch };
}
