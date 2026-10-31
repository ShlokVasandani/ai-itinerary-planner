/** Canonical origin of the site. Set NEXT_PUBLIC_SITE_URL in production (for example https://sekai.travel). */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (!explicit && !vercel && process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
    console.warn("NEXT_PUBLIC_SITE_URL is not set: canonical URLs and the sitemap will point at localhost.");
  }
  const raw = explicit || (vercel ? `https://${vercel}` : "http://localhost:3000");
  return raw.replace(/\/+$/, "");
}

export const SITE_NAME = "Sekai";

/** JSON for a <script type="application/ld+json"> tag; "<" is escaped so data can never close the tag. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}
