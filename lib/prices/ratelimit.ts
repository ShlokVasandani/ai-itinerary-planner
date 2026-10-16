/**
 * Fixed-window rate limiter keyed by client. In-memory, so it is per server
 * instance; put a shared store (Redis/Upstash) behind it for multi-instance
 * production (see docs/PRICES.md).
 */
export class RateLimiter {
  private hits = new Map<string, { count: number; reset: number }>();
  constructor(private limit = 20, private windowMs = 60_000, private now: () => number = Date.now) {}

  check(key: string): { ok: boolean; retryAfterSec: number; remaining: number } {
    const t = this.now();
    const cur = this.hits.get(key);
    if (!cur || cur.reset <= t) {
      this.hits.set(key, { count: 1, reset: t + this.windowMs });
      this.prune(t);
      return { ok: true, retryAfterSec: 0, remaining: this.limit - 1 };
    }
    if (cur.count >= this.limit) {
      return { ok: false, retryAfterSec: Math.max(1, Math.ceil((cur.reset - t) / 1000)), remaining: 0 };
    }
    cur.count++;
    return { ok: true, retryAfterSec: 0, remaining: this.limit - cur.count };
  }

  private prune(t: number) {
    if (this.hits.size < 5000) return;
    for (const [k, v] of this.hits) if (v.reset <= t) this.hits.delete(k);
  }
}

export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local").slice(0, 64);
}
