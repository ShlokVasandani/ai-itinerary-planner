# Sekai

A trip planner built on hand-verified real places in 20 cities. A deterministic engine turns them into day-by-day
itineraries with real dates, distances, opening hours and cost ranges, and every stop links to the venue's own site,
a map and booking providers. It runs with **zero API keys**.

![Landing page](docs/screenshots/landing-1440.png)

## Features

- **20 cities**, each with at least 12 landmarks, 12 restaurants, 6 cafes, 6 neighborhoods, 5 experiences, 3 day trips
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
npm test             # vitest
npm run validate     # data checks (add --skip-urls via npm run validate:offline)
npm run build
```

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

Photos are licensed Wikimedia Commons images (see [`CREDITS.md`](CREDITS.md) and `/credits`). Map tiles and place data are
© OpenStreetMap contributors.

## License

MIT
