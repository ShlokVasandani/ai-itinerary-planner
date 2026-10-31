import { UA } from "./http";

const verdicts = new Map<string, Promise<boolean>>();

/** Statuses that mean "the site exists but blocks bots or wants a login": treat as alive. */
const ALIVE = new Set([401, 403, 405, 406, 408, 409, 418, 429, 451, 999]);

async function probe(url: string): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 9000);
      const res = await fetch(url, { method: "GET", redirect: "follow", headers: { "User-Agent": UA, Accept: "text/html,*/*" }, signal: ctl.signal });
      clearTimeout(timer);
      res.body?.cancel().catch(() => undefined);
      if (res.ok || ALIVE.has(res.status)) return true;
      if (res.status === 404 || res.status === 410 || res.status >= 500) {
        if (attempt === 1) return false;
        continue;
      }
      return true;
    } catch (e) {
      const msg = String((e as { cause?: { code?: string } })?.cause?.code ?? (e as Error).message);
      // DNS failure or refused connection is definitive; timeouts get one retry and then count as dead.
      if (/ENOTFOUND|ECONNREFUSED|EAI_AGAIN/.test(msg) && attempt === 1) return false;
      if (attempt === 1) return false;
    }
  }
  return false;
}

/** Cached per URL for the whole run. */
export function isAlive(url: string): Promise<boolean> {
  let p = verdicts.get(url);
  if (!p) {
    p = probe(url);
    verdicts.set(url, p);
  }
  return p;
}

/** Runs `fn` over items with bounded concurrency. */
export async function pool<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    })
  );
  return out;
}
