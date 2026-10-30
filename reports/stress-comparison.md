# Stress test: before and after the fixes

Same 50 cities, same seeded scenarios, same harness, each on a fresh production build (before: the unfixed build; after: all six fixes plus the harness tolerance change noted below).

| | Before | After |
| --- | ---: | ---: |
| Plans checked | 2900 | 2900 |
| Plans with at least one failure | 946 | 52 |
| Total failures | 1349 | 56 |
| Distinct failure types | 28 | 6 |

## Failures by type

| Type | Before | After | Note |
| --- | ---: | ---: | --- |
| `render.stop-links` (day trips without a Book menu) | 761 | 0 | fix 3 |
| `price.range` (likely above maximum) | 269 | 0 | fix 4 |
| `flight.arrival` | 50 | 0 | fix 2 |
| `flight.departure` | 50 | 0 | fix 2 |
| `prop.city-stuck` (Build button stuck after a city change) | 50 | 0 | fix 1 |
| Sydney name-collision cluster (14 `render.*` / `map.*` types) | 64 | 0 | fix 5 |
| `interest.*` (selected interest with no matching stop) | 68 | 15 | fix 6; the rest is capacity-bound, see below. The "after" count uses the stricter rule (any city with at least one venue for the interest); the "before" count used the earlier check (two or more venues, single interests), so the real improvement is larger than the table shows (engine-only: 88 misses for single interests alone before, 0 after) |
| `time.meal-window` | 36 | 37 | deliberately not changed: tuning candidates, listed below |
| `prop.travellers` | 1 | 4 | harness only: a rounded party total was compared with exact equality. The check now allows 1 unit of rounding; the four affected cities re-ran clean |

## What is left

### Interest selection, residual

Plans with no room for the extra stop, or plans the traveller edited after generation:

- `I:swap` (4): dubai history, brussels history, krakow photography, hanoi photography
- `H:both-1day` (4): singapore history, cape-town photography, san-francisco history, miami photography
- `D:combo-5` (1): sydney culture
- `F:luxury` (1): dublin photography
- `F:shopping` (1): dublin photography
- `I:dietary` (1): cairo nightlife
- `H:arrive-late` (2): cape-town history, san-francisco photography
- `I:shuffle` (1): osaka history

Swap and Shuffle can remove the stop that served an interest: the guarantee applies when a plan is generated, not to later edits.

### Meal-window findings: tuning candidates (37 failures, 10 cities)

Left unchanged as requested. A meal lands outside lunch 11:30–15:30, dinner 18:00–23:00, breakfast 06:00–11:00 or coffee 14:00–18:30, in most cases where the restaurant's opening hours force a late or early slot:

- dubai `I:swap`: day 1 16:45 "Arabian Tea House" is lunch at 16:45, expected 11:30-15:30
- dubai `I:swap`: day 1 19:08 "Arabian Tea House courtyard" is coffee at 19:08, expected 14:00-18:30
- singapore `D:combo-3`: day 2 20:24 "Tian Tian Hainanese Chicken Rice (Maxwell)" is lunch at 20:24, expected 11:30-15:30
- istanbul `A:7d`: day 6 16:20 "Cibalikapı Balıkçısı" is lunch at 16:20, expected 11:30-15:30
- istanbul `D:combo-5`: day 3 15:50 "Develi" is lunch at 15:50, expected 11:30-15:30
- copenhagen `C:max-pax`: day 2 15:50 "Restaurant Schønnemann" is lunch at 15:50, expected 11:30-15:30
- copenhagen `I:dietary`: day 2 15:58 "Manfreds" is lunch at 15:58, expected 11:30-15:30
- hong-kong `I:swap`: day 1 16:55 "Lin Heung Tea House" is lunch at 16:55, expected 11:30-15:30
- sydney `A:7d`: day 4 15:42 "Mr. Crackles" is lunch at 15:42, expected 11:30-15:30
- sydney `A:14d`: day 3 15:42 "Mr. Crackles" is lunch at 15:42, expected 11:30-15:30
- athens `A:14d`: day 3 15:56 "Karamanlidika tou Fani" is lunch at 15:56, expected 11:30-15:30
- marrakesh `A:3d`: day 2 16:07 "Al Fassia" is lunch at 16:07, expected 11:30-15:30
- marrakesh `A:7d`: day 2 15:47 "Al Fassia" is lunch at 15:47, expected 11:30-15:30
- marrakesh `B:weekend-start`: day 2 16:22 "Al Fassia" is lunch at 16:22, expected 11:30-15:30
- marrakesh `I:baseline`: day 2 16:02 "Al Fassia" is lunch at 16:02, expected 11:30-15:30
- cape-town `D:cafes`: day 1 19:08 "Origin Coffee Roasting" is coffee at 19:08, expected 14:00-18:30
- cape-town `E:limited-mobility`: day 2 15:42 "Kalky's Fish & Chips" is lunch at 15:42, expected 11:30-15:30
- cape-town `E:limited-mobility`: day 2 19:00 "Truth Coffee" is coffee at 19:00, expected 14:00-18:30
- san-francisco `A:3d`: day 2 15:34 "Swan Oyster Depot" is lunch at 15:34, expected 11:30-15:30
- san-francisco `A:7d`: day 4 16:28 "Swan Oyster Depot" is lunch at 16:28, expected 11:30-15:30
- san-francisco `A:14d`: day 3 15:58 "Swan Oyster Depot" is lunch at 15:58, expected 11:30-15:30
- san-francisco `B:weekend-start`: day 2 15:34 "La Taqueria" is lunch at 15:34, expected 11:30-15:30
- san-francisco `I:start-date`: day 2 15:34 "The Slanted Door" is lunch at 15:34, expected 11:30-15:30
