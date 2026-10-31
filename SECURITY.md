# Security policy

## Reporting a vulnerability

Please report security problems privately, not in a public issue.

Use GitHub's private vulnerability reporting: open the repository's **Security** tab and choose
**Report a vulnerability**. Include what you found, how to reproduce it, and the page, URL or file involved.

You can expect an acknowledgement as soon as the maintainer sees the report, and a fix or a decision on a best-effort
basis; this is a small open-source project without a service-level agreement. Please give a reasonable time to fix a
problem before disclosing it publicly.

## Scope

Sekai is a static-first Next.js app with no accounts, no database and no stored user data. Things worth reporting:

- cross-site scripting or HTML injection through anything a visitor can type or put in a URL;
- the price API routes (`/api/prices/*`): validation bypasses, rate-limit bypasses, information leaks, request smuggling;
- outbound links that can be made to point somewhere other than the provider they claim to;
- a secret committed to the repository, or a dependency with a known exploitable vulnerability.

Out of scope: findings that need a modified browser or device, denial of service by raw traffic volume, missing headers
that are already set (see `next.config.mjs` and `lib/security-headers.mjs`), and problems in third-party sites we link to.

## Supported versions

Only the latest commit on `main` is supported.

## For maintainers

- Server-only keys (`TRAVELPAYOUTS_TOKEN`, `VIATOR_API_KEY`) live in environment variables and are never sent to the
  browser. `.env*` files are gitignored; only `.env.example` (with empty values) is tracked.
- If a key is ever committed, treat it as leaked: rotate it with the provider first, then remove it from the code.
