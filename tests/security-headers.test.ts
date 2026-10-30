import { describe, expect, it } from "vitest";
import { securityHeaders } from "../lib/security-headers.mjs";
import nextConfig from "../next.config.mjs";

const headersFor = (isProd: boolean): Record<string, string> => Object.fromEntries(securityHeaders(isProd).map((h) => [h.key.toLowerCase(), h.value]));

describe("security headers", () => {
  it("sets HSTS only in production", () => {
    expect(headersFor(true)["strict-transport-security"]).toMatch(/max-age=\d{7,}/);
    expect(headersFor(false)["strict-transport-security"]).toBeUndefined();
  });

  it("always sends the basic hardening headers", () => {
    for (const prod of [true, false]) {
      const h = headersFor(prod);
      expect(h["x-content-type-options"]).toBe("nosniff");
      expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
      expect(h["x-frame-options"]).toBe("DENY");
      expect(h["permissions-policy"]).toContain("camera=()");
      expect(h["cross-origin-opener-policy"]).toBe("same-origin");
    }
  });

  it("has a CSP that allows only what the app uses", () => {
    const csp = headersFor(true)["content-security-policy"];
    const dir = Object.fromEntries(csp.split(";").map((d) => d.trim().split(/\s+/)).map(([k, ...v]) => [k, v]));
    expect(dir["default-src"]).toEqual(["'self'"]);
    expect(dir["frame-ancestors"]).toEqual(["'none'"]);
    expect(dir["object-src"]).toEqual(["'none'"]);
    expect(dir["base-uri"]).toEqual(["'self'"]);
    expect(dir["form-action"]).toEqual(["'self'"]);
    expect(dir["connect-src"]).toEqual(["'self'"]);
    // map tiles and nothing else third-party; data: and blob: for the blurred photo placeholders
    expect(dir["img-src"]).toEqual(["'self'", "data:", "blob:", "https://tile.openstreetmap.org"]);
    expect(dir["script-src"]).not.toContain("'unsafe-eval'");
    for (const [k, v] of Object.entries(dir)) {
      expect(v, k).not.toContain("*");
      expect(v, k).not.toContain("http:");
    }
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("allows eval only in development, where Next's tooling needs it", () => {
    expect(headersFor(false)["content-security-policy"]).toContain("'unsafe-eval'");
    expect(headersFor(false)["content-security-policy"]).not.toContain("upgrade-insecure-requests");
  });

  it("is applied to every route by next.config.mjs", async () => {
    const rules = await nextConfig.headers!();
    const all = rules.find((r) => r.source === "/:path*")!;
    expect(all.headers.map((h) => h.key)).toEqual(expect.arrayContaining(["Content-Security-Policy", "X-Content-Type-Options", "Referrer-Policy"]));
  });
});
