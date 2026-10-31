/**
 * Response security headers, built for a given environment. Used by next.config.mjs and by tests/security-headers.test.ts.
 *
 * Content-Security-Policy
 *  - script-src needs 'unsafe-inline' because Next injects inline bootstrap scripts into statically prerendered
 *    pages (a per-request nonce is not possible for static HTML). 'unsafe-eval' is development only.
 *  - style-src needs 'unsafe-inline' for Leaflet's inline positioning and the blurred photo placeholders.
 *  - img-src: the app's own images, data: and blob: (photo placeholders), and the OpenStreetMap tile server used by the maps.
 *  - Everything else is locked down: no remote scripts, fonts or connections, no plugins, no framing, no foreign form targets.
 * HSTS is production only: sending it from http://localhost would be ignored at best and pin a dev host at worst.
 *
 * @param {boolean} isProd
 * @returns {{ key: string, value: string }[]}
 */
export function securityHeaders(isProd) {
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://tile.openstreetmap.org",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isProd ? ["upgrade-insecure-requests"] : []),
  ].join("; ");

  return [
    { key: "Content-Security-Policy", value: csp },
    ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=63072000" }] : []),
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ];
}
