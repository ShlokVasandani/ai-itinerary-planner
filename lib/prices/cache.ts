/** In-memory TTL cache that also de-duplicates concurrent identical requests. */
export const DEFAULT_TTL_MS = 30 * 60 * 1000;

interface Entry<T> {
  expires: number;
  value: Promise<T>;
  at: number;
}

export class TtlCache<T> {
  private store = new Map<string, Entry<T>>();
  constructor(private ttlMs = DEFAULT_TTL_MS, private max = 500, private now: () => number = Date.now) {}

  /** Returns the cached value (and when it was fetched) or runs `load` once. Failed loads are not cached. */
  async get(key: string, load: () => Promise<T>): Promise<{ value: T; cachedAt: number; hit: boolean }> {
    const t = this.now();
    const found = this.store.get(key);
    if (found && found.expires > t) {
      return { value: await found.value, cachedAt: found.at, hit: true };
    }
    const promise = load();
    this.store.set(key, { expires: t + this.ttlMs, value: promise, at: t });
    if (this.store.size > this.max) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
    try {
      return { value: await promise, cachedAt: t, hit: false };
    } catch (e) {
      this.store.delete(key);
      throw e;
    }
  }

  clear() {
    this.store.clear();
  }
}
