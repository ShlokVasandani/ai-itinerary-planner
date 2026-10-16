# Real prices

Prices are fetched **server-side only**, through two Next route handlers:

| Route | Provider | Key (server env) |
|---|---|---|
| `GET /api/prices/flights?origin=JFK&destination=CDG&departure=2027-05-01&return=2027-05-08&adults=2&currency=USD` | Travelpayouts / Aviasales Data API | `TRAVELPAYOUTS_TOKEN` |
| `GET /api/prices/activities?q=Louvre&city=Paris&currency=USD` | Viator Partner API (Basic Access) | `VIATOR_API_KEY` |

Both routes validate query params with zod, rate-limit per client (20 requests per minute, in memory), and cache
responses for 30 minutes (in memory, identical concurrent requests are merged). The browser never sees a key: the
components call these routes, and the routes read `process.env`.

## What happens without a key (or when an API fails)

The routes fall back to the link-only adapters from Phase 3 (Google Flights, Skyscanner, Viator, GetYourGuide, Klook)
and attach a **placeholder number** to each, with `isSample: true`. The UI labels every such number **"Sample price"**
and the block **"Sample prices"**, and the "Cheapest" badge becomes "Cheapest (sample)". The placeholder amounts are
deterministic and have no relationship to real fares. They exist so the comparer works with zero keys; never treat
them as quotes.

## Why these providers (checked 16 Oct 2026)

- **Amadeus Self-Service** was the obvious choice, but Amadeus paused new registrations and decommissioned the
  Self-Service portal in July 2026 (existing keys disabled, `amadeus4dev` GitHub org archived). There is no open sign-up,
  so it is not used.
- **Kiwi.com Tequila** is partner-gated, so it is not used.
- **Travelpayouts (Aviasales Data API)** has open sign-up and a free token. Trade-off: it returns *cached* cheapest
  fares that other users found in roughly the last 48 hours (kept up to 7 days), not live availability. That is why the
  UI says prices change and links out to confirm.
- **Viator Partner API, Basic Access** is self-service, free and needs no prior approval. Basic Access can search and
  link to viator.com; booking on your own site needs a higher, certified tier.
- **GetYourGuide Partner API** requires partner approval; it stays link-only.
- **Stays:** no open-sign-up price API was verified, so stays remain link-only (Booking.com, Airbnb) until one is.

## Getting the keys

### Travelpayouts (flights)
1. Create a free account at <https://www.travelpayouts.com>.
2. Developers > API (or Profile > API token). Copy your token.
3. Put it in `.env.local` as `TRAVELPAYOUTS_TOKEN=...`.
- Free. Docs: <https://support.travelpayouts.com/hc/en-us/articles/203956163>.
- Rate limits are per token and documented in your dashboard; our route allows 20 requests per minute per client and
  caches for 30 minutes, which keeps usage low. Results default to RUB unless a currency is passed (we always pass one).
- Production: fine to use as is for "from" prices. For true live fares you need a provider with live search (for example
  an enterprise Amadeus or Kiwi agreement).

### Viator (activities)
1. Sign up for the Viator affiliate programme at <https://partnerresources.viator.com/travel-commerce/affiliate/>.
2. Basic Access is the default tier: instant, free, no approval. Find your API key in the partner dashboard.
3. Put it in `.env.local` as `VIATOR_API_KEY=...`.
- Docs: <https://docs.viator.com/partner-api/affiliate/technical>. The adapter uses the free-text search endpoint;
  I could not reach the full OpenAPI spec while writing it, so **confirm the request and response field names in
  `lib/prices/providers.ts` against the current spec the first time you add a key** (the adapter has unit tests against
  a mocked response of that shape, not against the live API).
- Basic Access has request-rate limits set by Viator; ask `affiliateapi@tripadvisor.com` for higher tiers.
- Production: to take bookings on your site you need Full + Booking Access and API certification. For a link-out model,
  Basic Access plus affiliate links (`NEXT_PUBLIC_AFFILIATE_VIATOR_PID`) is enough.

### Affiliate IDs (optional, public)
`NEXT_PUBLIC_AFFILIATE_*` variables append each provider's tracking parameter (`aid`, `pid`, `partner_id`,
`associateid`, ...). See `.env.example` and `lib/providers/affiliateConfig.ts`. Check each programme's current parameter
name before launch (12Go's in particular).

## Production notes
- The rate limiter and cache are per server instance. On serverless or several instances, back both with a shared store
  (Upstash Redis or Vercel KV via the Marketplace) so limits and cache hits are global.
- Keep keys in your host's environment settings, never in the repo. `.env*.local` is gitignored; `.env.example` is committed.
- Show the "Prices change, confirm on the provider's site" note wherever a price appears (the comparer already does).
