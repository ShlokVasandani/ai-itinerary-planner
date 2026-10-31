/**
 * Returns the URL only if it is a plain http(s) URL (optionally restricted to
 * given host suffixes). Used for every URL that comes from outside the repo
 * (price APIs, OpenStreetMap tags) before it can become an href.
 */
export function safeHttpUrl(value: unknown, hostSuffixes?: string[]): string | undefined {
  if (typeof value !== "string") return undefined;
  try {
    const u = new URL(value.trim());
    if (u.protocol !== "https:" && u.protocol !== "http:") return undefined;
    if (u.username || u.password) return undefined;
    if (hostSuffixes && !hostSuffixes.some((s) => u.hostname === s || u.hostname.endsWith(`.${s}`))) return undefined;
    return u.toString();
  } catch {
    return undefined;
  }
}
