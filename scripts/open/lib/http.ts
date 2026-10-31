/**
 * Polite HTTP for the open-data pipeline: identifying User-Agent, per-host
 * spacing, retry with exponential backoff, and an on-disk cache so re-runs
 * never repeat a request that already succeeded.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const UA = "SekaiItineraryPlanner/1.0 (open-data catalog build; contact shlokvasandani0407@gmail.com)";
const CACHE_DIR = path.join(process.cwd(), "scripts", ".cache", "open");
fs.mkdirSync(CACHE_DIR, { recursive: true });

const lastHit = new Map<string, number>();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Minimum gap between requests to one host, in ms. */
const SPACING: Record<string, number> = {
  "query.wikidata.org": 1200,
  "www.wikidata.org": 400,
  "en.wikipedia.org": 250,
  "commons.wikimedia.org": 600,
  "upload.wikimedia.org": 600,
  "archive-api.open-meteo.com": 1500,
  "api.open-meteo.com": 1500,
  default: 1500,
};

async function spaced(host: string) {
  const gap = SPACING[host] ?? SPACING.default;
  const wait = gap - (Date.now() - (lastHit.get(host) ?? 0));
  if (wait > 0) await sleep(wait);
  lastHit.set(host, Date.now());
}

const keyOf = (s: string) => crypto.createHash("sha1").update(s).digest("hex");

export function readCache<T>(key: string): T | undefined {
  try {
    return JSON.parse(fs.readFileSync(path.join(CACHE_DIR, `${keyOf(key)}.json`), "utf8")) as T;
  } catch {
    return undefined;
  }
}
export function writeCache(key: string, value: unknown) {
  fs.writeFileSync(path.join(CACHE_DIR, `${keyOf(key)}.json`), JSON.stringify(value));
}

export interface FetchOpts {
  method?: "GET" | "POST";
  body?: string;
  headers?: Record<string, string>;
  /** Cache key; defaults to method + url + body. Pass `false` to skip the cache. */
  cacheKey?: string | false;
  retries?: number;
  timeoutMs?: number;
}

/** Fetches JSON with spacing, retries and caching. Throws after all retries fail. */
export async function getJson<T>(url: string, opts: FetchOpts = {}): Promise<T> {
  const key = opts.cacheKey === false ? undefined : (opts.cacheKey ?? `${opts.method ?? "GET"} ${url} ${opts.body ?? ""}`);
  if (key) {
    const hit = readCache<T>(key);
    if (hit !== undefined) return hit;
  }
  const host = new URL(url).host;
  const retries = opts.retries ?? 5;
  let lastErr: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    await spaced(host);
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), opts.timeoutMs ?? 90_000);
      const res = await fetch(url, {
        method: opts.method ?? "GET",
        body: opts.body,
        headers: { "User-Agent": UA, Accept: "application/json", ...(opts.headers ?? {}) },
        signal: ctl.signal,
      });
      clearTimeout(timer);
      if (res.status === 429 || res.status >= 500) {
        lastErr = new Error(`HTTP ${res.status} from ${host}`);
        await sleep(3000 * 2 ** attempt);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} from ${host}`);
      const json = (await res.json()) as T;
      if (key) writeCache(key, json);
      return json;
    } catch (e) {
      lastErr = e;
      await sleep(2000 * 2 ** attempt);
    }
  }
  throw new Error(`${url.slice(0, 120)} failed: ${(lastErr as Error)?.message ?? lastErr}`);
}

export { sleep };
