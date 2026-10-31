# Sekai

A trip planner built on hand-verified real places in 50 cities. A pipeline for adding further cities from open data lives in `scripts/open` (see `docs/OPEN-DATA.md`); none are published today. A deterministic engine turns them into day-by-day
itineraries with real dates, distances, opening hours and cost ranges, and every stop links to the venue's own site,
a map and booking providers. It runs with **zero API keys**.

![Landing page](docs/screenshots/landing-1440.png)

## Features

- **50 hand-curated cities**, each with at least 12 landmarks, 12 restaurants, 6 cafes, 6 neighborhoods, 5 experiences, 3 day trips
  and 5 nightlife spots. No invented venues: coordinates, official URLs and opening hours come from OpenStreetMap and
  Wikidata, and anything unconfirmed is left empty and listed in [`data-gaps.md`](data-gaps.md).
- **Itinerary engine v2** (`lib/itinerary-engine.ts`, pure and seeded): 1 to 14 days with real dates; days clustered by
  coordinates and ordered nearest-first; walking/transit/taxi time per hop; never schedules a closed venue; pace
  (relaxed / balanced / packed), group size, kids, limited mobility, dietary filters, must-include and skip lists;
  per-person cost ranges and a budget-fit status; lighter arrival day; departure day that ends 3 hours before a flight;
  `regenerateDay()` and `swapStop()`.
- **Booking links** (`lib/providers`): official site first, then deep links to Google Flights, Skyscanner, Booking.com,
  Airbnb, Viator, GetYourGuide, Klook, 12Go and Rome2rio with your dates filled in. Optional affiliate IDs.
- **Planner UI**: per-day timeline, cost range, lazy-loaded Leaflet/OpenStreetMap map, swap and shuffle, running trip
  total, "Book this trip" panel, and a price comparer.
- **Prices** (optional keys): see [How prices work](#how-prices-work).

| Planner | Destination |
|---|---|
| ![Planner](docs/screenshots/planner-1440.png) | ![Destination](docs/screenshots/destination-1440.png) |

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start   # production build and server
npm test             # vitest
npm run typecheck
npm run lint
npm run validate     # data checks (add --skip-urls via npm run validate:offline)
```

Read [`AGENTS.md`](AGENTS.md) before changing framework code: this Next.js version differs from older ones, and its
guides are in `node_modules/next/dist/docs/`.

## Testing

| What | Command | Needs |
|---|---|---|
| Unit and render tests (engine, tabs, day card, place matching, trip problems, meal labels) | `npm test` | nothing |
| End-to-end: every city's 5-day plan, every Book menu, every outbound link, every day map, city switching, day-trip menus, tab keyboard | `npx tsx scripts/verify-e2e.ts http://localhost:3000` (add city slugs to limit it, or `--ui-only` for just the interaction checks) | a running production server and Chrome |
| Stress test: ~58 plans per city across all 50 cities in a real browser, checked against the raw data | `npm run stress -- --base http://localhost:3000` (`--cities a,b`, `--groups A,B,I`, `--no-tiles`); `npm run stress:dry` is the engine-only pass, no browser | a running production server and Chrome |

The stress test writes `reports/stress-test.md`; its screenshots and raw JSON are generated, not committed.
`scripts/stress/regress.ts` replays the failing scenarios on an older build to tell regressions from old bugs. If a busy machine makes a few steps time out in a parallel run (a timeout throws a city's chain out of step and inflates the counts), re-run just those cities with `--jobs 1` and combine with `npx tsx scripts/stress/merge.ts <full.json> <rerun.json>`. `scripts/verify-browser.ts` is a person's-eye check of the main flow with real tiles (one at a time, hard-capped) for Tokyo and Lisbon.
Map tiles are answered with a 1x1 PNG in every bulk run: **never point a bulk run at `tile.openstreetmap.org`**, it is a
free community service. The real-tile check covers three cities, one request at a time. Run it against a production
build (`npm run build && npm start`); `next dev` cannot download Google Fonts offline.

## Motion

All motion lives in `app/globals.css` and is driven by tokens in `:root`:

- Easing: `--ease-out` (everything that enters or responds), `--ease-in-out` (on-screen movement), `--ease-drawer`.
  `--ease` is an alias for `--ease-out`. **No `ease-in` anywhere.**
- `--press` (0.97) is the press scale; `--rise`, `--pop-y`, `--pop-scale` and `--banner-scale` are travel distances.
  `prefers-reduced-motion` zeroes the travel tokens, so entrances become fades; press dims instead of shrinking.
- Rules: UI transitions stay at or under 300 ms (exits faster than enters); only `transform` and `opacity` animate,
  except short (at most 160 ms) `color` / `background` / `border-color` changes on controls; hover styles live behind
  `(hover: hover) and (pointer: fine)`; every pressable element answers on `:active`, and a mouse commits toggles on
  pointer-down (`components/usePress.ts`); popovers scale from the arrow or trigger edge and are transitions, not
  keyframes, so they can be interrupted; nothing animates from `scale(0)`.
- Page transitions use React's `<ViewTransition>` (`components/PageTransition.tsx`, one per page): links carry a
  `transitionTypes` of `nav-forward`, `nav-back` or `nav-fade`.
- **A library-owned element must never have a dynamic `className`.** Leaflet adds `leaflet-container` and friends to
  the host div; if React rewrites `className` it wipes them and the map renders as a blank grey box with tiles
  loading unseen. `components/DayMap.tsx` keeps `className="day-map-canvas"` static and signals readiness with
  `data-ready`. The same applies to anything else a library decorates.

## Known limitations

- **Browser back and forward have no page transition.** Next does not run popstate navigations through a view
  transition, so they swap instantly (tried: a crossfade default for untyped navigations did not start one).
  Clicking a link or button always transitions.
- **Swap and Shuffle can remove the stop that served a selected interest.** The guarantee "if the city has venues
  for a selected interest, the plan contains one" applies when a plan is generated, not to later edits. Build again
  to restore it.
- **Some trips cannot be planned.** A late landing or an early flight can leave no time for sightseeing (for example a
  one-day trip with both flight times close together). The planner says so and names the field to change instead of
  showing an empty plan.
- **Meals follow opening hours, not the clock.** A venue that opens late can put lunch at 16:20; such a meal is
  labelled "Late lunch" (or "Evening meal", "Evening drinks", "Brunch", "Early dinner") rather than moved.
- Day-trip stops and some venues have no coordinates, so a day's map can show fewer pins than stops.
- Opening hours, prices and dietary matches come from public data and heuristics; the UI asks people to confirm with
  the venue.

## Data model

Types live in `lib/types.ts`.

- Hand-written content stays in `lib/data/<slug>.ts` (`DestinationSource`).
- Per-city meta is in `lib/data/city-meta.ts`: ISO `currency`, `airportCodes`, `transitCardInfo`, 12-month `seasons`
  (crowds / weather / price, 1 to 5, **editorial estimates**), `events`, eight `localPhrases`, `ianaTimezone`.
- Verified facts are generated into `lib/data/generated/<slug>.json` and merged at load by `lib/data/merge.ts`:
  `coords`, `officialUrl`, `openingHours`, `closedDays` (0 = Sunday), `costMin` / `costMax` / `costCurrency`,
  `sources`, `verifiedAt`, plus neighborhood `coords` and `radiusKm` and a city bounding box. `mapsUrl` is generated from
  the name and city. The original text is kept as `approxCost`.
- Every record (landmark, restaurant, cafe, experience, shopping, nightlife, day trip) has a unique `id`.

### Scripts

| Command | What it does |
|---|---|
| `npx tsx scripts/parse-costs.ts` | Parses `approxCost` text to numbers; writes `docs/cost-parse-report.md` for review |
| `npm run enrich -- <slug>` | Looks up coordinates, URLs and opening hours (Nominatim at 1 request/second, Wikidata); cached in `scripts/.cache` |
| `npx tsx scripts/prune-dead-urls.ts` | Removes official URLs that return 404/410 |
| `npx tsx scripts/build-gaps.ts` | Regenerates `data-gaps.md` |
| `npm run validate` | Duplicate ids, required fields, coordinates inside the city box, `costMin <= costMax`, URL HEAD checks (report only) |
| `npx tsx scripts/fetch-photos.ts` | Downloads the Wikimedia photos and builds AVIF/WebP + blur placeholders |
| `npx tsx scripts/screenshots.ts` | Screenshots at 375, 820 and 1440 px (needs the app running and Chrome) |

### Add a city

1. Create `lib/data/<slug>.ts` exporting a `DestinationSource` (copy `lib/data/paris.ts`). Meet the minimum counts and
   give every record a unique `id`.
2. Add its meta (currency, airports, seasons, events, 8 phrases) to `lib/data/city-meta.ts`.
3. Create `lib/data/generated/<slug>.json` containing `{}`, import it and the city in `lib/data/index.ts`.
4. Add a photo entry in `lib/city-photo-urls.ts`, then run `npx tsx scripts/fetch-photos.ts <slug>`.
5. Run `npm run enrich -- <slug>`, `npx tsx scripts/parse-costs.ts`, `npx tsx scripts/build-gaps.ts`, then
   `npm run validate` and `npm test`.

## Environment variables

Copy `.env.example` to `.env.local`. Everything is optional.

| Variable | Scope | Purpose |
|---|---|---|
| `TRAVELPAYOUTS_TOKEN` | server only | Flight prices (Travelpayouts / Aviasales Data API) |
| `VIATOR_API_KEY` | server only | Activity prices (Viator Partner API, Basic Access) |
| `NEXT_PUBLIC_AFFILIATE_BOOKING_AID`, `_SKYSCANNER_ID`, `_VIATOR_PID`, `_GETYOURGUIDE_PARTNER_ID`, `_KLOOK_AID`, `_12GO_ID` | public | Appended to outbound links as each provider's tracking parameter. Affiliate links get `rel="noopener noreferrer sponsored"` and an "Affiliate links" disclosure |

## How prices work

`/api/prices/flights` and `/api/prices/activities` run on the server, validate params with zod, rate-limit (20/min per
client) and cache for 30 minutes. With a key they return real prices (flights are cached fares, not live availability).
Without a key, or if an API fails, they return link-only offers with placeholder numbers marked **"Sample prices"**
(`isSample: true`); sample numbers are never presented as real. Every price block shows when it was last updated and
"Prices change, confirm on the provider's site". Provider choice, signup steps, limits and production notes are in
[`docs/PRICES.md`](docs/PRICES.md).

## Photos and credits

Photos are licensed Wikimedia Commons images. **Policy:** an image is only added if its author, licence and source page
are recorded (`lib/photo-manifest.json`, or `lib/data/open/photos.json` for open-data cities) and shown on `/credits` (see [`CREDITS.md`](CREDITS.md)); no image is committed
without that record, and photo archives (zips) are never committed. Run `npx tsx scripts/fetch-photos.ts <slug>` to add
one. Map tiles and place data are © OpenStreetMap contributors; the attribution stays visible on every map.

## Continuous integration

`.github/workflows/ci.yml` runs install, lint, typecheck, vitest and a production build on every pull request;
Dependabot (`.github/dependabot.yml`) proposes npm and GitHub Actions updates weekly. `tests/photo-credits.test.ts`
and `tests/security-headers.test.ts` keep the credits and header policies true.

## Security

See [`SECURITY.md`](SECURITY.md) for how to report a vulnerability. Security headers (CSP, HSTS in production,
frame and referrer policies) are set in `next.config.mjs`; the price API routes validate input and rate-limit.

## License

MIT
