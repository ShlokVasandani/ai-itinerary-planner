# Open-data catalog

Sekai ships 20 hand-curated cities (`lib/data/<slug>.ts`) and, on top of them, up to 180 cities built from open
data (`lib/data/open/<slug>.json`). Both load through `lib/data/catalog.ts`; open-data cities are separate lazy chunks.

## What each source provides

| Field | Source | Notes |
| --- | --- | --- |
| City facts, currency, languages | Wikidata | Matched to the seed's country; ambiguous names are rejected |
| Landmarks and their ranking | Wikidata (`wikibase:around`, sitelink count) | Top 5 = must-see, next 11 = highly recommended |
| Landmark / venue descriptions | Wikipedia intro text (CC BY-SA) | Every place links to its source page in `sources` |
| Restaurants, cafés, bars, malls, neighbourhoods | OpenStreetMap (Overpass) | Chains dropped; venues need a website; ranked by data completeness and distance from the centre |
| Opening hours, fees | OpenStreetMap tags | Only when the tag parses exactly; otherwise left empty |
| Weather rating, best months, timezone | Open-Meteo (2019-2023 daily data) | Computed; crowds and price ratings are not available |
| Photo | Wikimedia Commons | CC0 / public domain / CC BY / CC BY-SA only, landscape, at least 1500 px wide |

Anything a source cannot supply stays empty and the UI hides it. There are no prices, signature dishes, tips,
phrases or local-food write-ups for open-data cities, by design.

## Running it

```bash
npx tsx scripts/open/pipeline.ts --target 50      # build until 50 destinations are published (20 curated + 30 open)
npx tsx scripts/open/verify-stage.ts --target 50  # whole-catalog verification (build, HTTP smoke, real browser)
```

Re-running resumes: finished cities are skipped, results of every HTTP call are cached in `scripts/.cache/open`.
Cities that fail a check are rejected (reasons in `docs/open-data/rejected.json`) and the next seed is tried, so the
target is met from the reserve list in `scripts/open/seeds.ts`.

## Checks

Per city (`scripts/open/checks.ts`, re-run on every `npm test` by `tests/open-catalog.test.ts`):
schema, counts, geography, content, hours and cost, links, photo files and license, and an engine smoke test
(1 to 14 day plans, every pace and style, dated trips starting on a Sunday and a Monday: no crashes, no stops outside
the city, no closed venues, no repeats, ordered times).

Per stage (`scripts/open/verify-stage.ts`): typecheck, unit tests, catalog consistency, production build,
HTTP smoke for every page, sitemap size, and a real Chrome run over every city.
