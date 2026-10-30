# Sekai stress test

Phase 1 report. Nothing has been fixed yet.

- Server: `http://localhost:3300` (production build), commit `5539b83`
- Run: 2026-10-30T14:29:56.586Z, 29 min, 4 parallel workers, fixed seed `stress-v1`
- Cities: 50. Plans built and checked in the browser: **2900**. Plans with at least one failure: **946**. Distinct failure types: **28**.
- Map tiles in this run: a local 1x1 PNG stub for every plan; real OpenStreetMap tiles only in the three-city check below.

## Failures by type

| Type | Failures | Plans | Cities | Meaning | First example |
| --- | ---: | ---: | ---: | --- | --- |
| `render.stop-links` | 761 | 601 | 50 | page differs from what the engine produced | tokyo A:7d: day 3 stop 1 "Depart for Hakone": page has 0 links, expected 4 |
| `price.range` | 269 | 217 | 9 | likely price falls outside [min, max] | london A:3d: day 2 09:56 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order |
| `flight.arrival` | 50 | 50 | 50 | a day-1 stop starts before landing + 2h30 | tokyo H:arrive-late: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45 |
| `flight.departure` | 50 | 50 | 50 | a last-day stop runs past flight - 3h | tokyo H:depart-only: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30 |
| `prop.city-stuck` | 50 | 50 | 50 | a single-input change did not propagate correctly | tokyo I:city: after choosing Prague in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); |
| `time.meal-window` | 36 | 33 | 9 | a meal lands outside a sensible window | dubai I:swap: day 1 16:45 "Arabian Tea House" is lunch at 16:45, expected 11:30-15:30 |
| `interest.nightlife` | 20 | 20 | 20 | selected interest has no matching stop | tokyo D:nightlife: only "nightlife" selected, but no matching stop in 2 days |
| `interest.nature` | 18 | 18 | 18 | selected interest has no matching stop | london D:nature: only "nature" selected, but no matching stop in 2 days |
| `render.where-and-price` | 11 | 2 | 1 | page differs from what the engine produced | sydney G:undated: day 4 stop 2: page "Eastern Suburbs · 2 hr 30 min · Free" / engine "Watsons Bay · 2 hr 30 min · price not list |
| `interest.art` | 10 | 10 | 10 | selected interest has no matching stop | dubai D:art: only "art" selected, but no matching stop in 2 days |
| `interest.adventure` | 9 | 9 | 9 | selected interest has no matching stop | singapore D:adventure: only "adventure" selected, but no matching stop in 2 days |
| `interest.culture` | 9 | 9 | 9 | selected interest has no matching stop | amsterdam D:culture: only "culture" selected, but no matching stop in 2 days |
| `render.time` | 8 | 2 | 1 | page differs from what the engine produced | sydney G:undated: day 4 stop 2: page "09:50" / engine "10:04" |
| `render.name` | 7 | 2 | 1 | page differs from what the engine produced | sydney G:undated: day 4 stop 2: page "Bondi to Coogee Coastal Walk" / engine "Watsons Bay" |
| `render.kind` | 6 | 2 | 1 | page differs from what the engine produced | sydney G:undated: day 4 stop 2: page "Sight Must-see" / engine "Sight Highly recommended" |
| `map.numbering` | 6 | 2 | 1 | marker numbering / titles differ from stop order | sydney G:undated: day 2: marker 4 reads "4" titled "4. BridgeClimb Sydney", expected "4. Black Star Pastry" |
| `render.sub` | 4 | 2 | 1 | page differs from what the engine produced | sydney G:undated: day 2: page "Around Surry Hills · 92 min between stops (4.9 km)" / engine "Around Surry Hills · 115 min betwee |
| `render.cost` | 4 | 2 | 1 | page differs from what the engine produced | sydney G:undated: day 2: page "A$357–461 per person · likely A$409 2 stop(s) have no listed price" / engine "A$57–61 per person  |
| `render.end-time` | 4 | 2 | 1 | page differs from what the engine produced | sydney G:undated: day 4 stop 2: page "12:20" / engine "12:34" |
| `map.markers` | 4 | 2 | 1 | marker count differs from the located stops | sydney G:undated: day 4: 3 markers for 4 located stops |
| `render.trip-total` | 2 | 2 | 1 | page differs from what the engine produced | sydney G:undated: page "A$482–656" / engine "A$277–396" |
| `render.trip-likely` | 2 | 2 | 1 | page differs from what the engine produced | sydney G:undated: page "likely A$570" / engine "likely A$337" |
| `render.party-total` | 2 | 2 | 1 | page differs from what the engine produced | sydney G:undated: page "A$1,140" / engine "A$674" |
| `render.stop-count` | 2 | 2 | 1 | page differs from what the engine produced | sydney G:undated: day 2: page "7" / engine "9" |
| `render.trip-links` | 2 | 2 | 1 | page differs from what the engine produced | sydney G:undated: book-this-trip has 11 links, expected 11 for Sydney undated 2A+0C |
| `interest.cafes` | 1 | 1 | 1 | selected interest has no matching stop | cape-town D:cafes: only "cafes" selected, but no matching stop in 2 days |
| `prop.travellers` | 1 | 1 | 1 | a single-input change did not propagate correctly | buenos-aires I:travellers: party total did not change |
| `interest.beaches` | 1 | 1 | 1 | selected interest has no matching stop | melbourne D:beaches: only "beaches" selected, but no matching stop in 2 days |

## Pass/fail matrix

Each cell counts the plans in that group; a cell shows ✅ when every plan passed, otherwise ❌ with `failing/total`. Group I is the chain of single-input changes.

| City | A length | B dates | C travellers | D interests | E diet and walking | F travel styles | G must include / skip | H flight times | I propagation |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Tokyo | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ❌ 1/14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Paris | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ❌ 1/14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| London | ❌ 3/4 | ❌ 3/3 | ❌ 3/3 | ❌ 13/14 | ❌ 6/6 | ❌ 10/12 | ❌ 2/2 | ❌ 3/4 | ❌ 10/10 |
| Dubai | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ❌ 1/14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Singapore | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ❌ 2/14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Bangkok | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ❌ 1/14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Rome | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ❌ 1/14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Barcelona | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ❌ 1/14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| New York City | ❌ 4/4 | ❌ 3/3 | ❌ 3/3 | ❌ 14/14 | ❌ 6/6 | ❌ 12/12 | ❌ 2/2 | ❌ 3/4 | ❌ 10/10 |
| Istanbul | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ❌ 1/14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Seoul | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ❌ 1/14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Amsterdam | ❌ 4/4 | ❌ 3/3 | ❌ 3/3 | ❌ 14/14 | ❌ 6/6 | ❌ 12/12 | ❌ 1/2 | ❌ 4/4 | ❌ 10/10 |
| Copenhagen | ❌ 2/4 | ❌ 1/3 | ❌ 1/3 | ❌ 3/14 | ❌ 1/6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Hong Kong | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ❌ 3/14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Sydney | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ❌ 1/14 | ✅ 6 | ✅ 12 | ❌ 2/2 | ❌ 2/4 | ❌ 8/10 |
| Zurich | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ❌ 2/14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Los Angeles | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ❌ 1/14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Kuala Lumpur | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Vienna | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ❌ 2/14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Lisbon | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ❌ 1/14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Prague | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ❌ 2/14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Berlin | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ❌ 2/14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Madrid | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ❌ 1/14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Milan | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ❌ 2/14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Florence | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ❌ 1/14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Venice | ❌ 3/4 | ❌ 3/3 | ❌ 3/3 | ❌ 12/14 | ❌ 6/6 | ❌ 10/12 | ❌ 1/2 | ❌ 3/4 | ❌ 10/10 |
| Athens | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ❌ 1/14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Budapest | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ❌ 4/14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Munich | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ❌ 1/14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Edinburgh | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Dublin | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ❌ 3/14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Brussels | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ❌ 1/14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Stockholm | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ❌ 1/14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Krakow | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ❌ 1/14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Marrakesh | ❌ 3/4 | ❌ 3/3 | ❌ 2/3 | ❌ 3/14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 3/4 | ❌ 10/10 |
| Cairo | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ❌ 1/14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Cape Town | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ❌ 2/14 | ❌ 1/6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Mexico City | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ❌ 1/14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Buenos Aires | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ❌ 1/14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Rio de Janeiro | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ❌ 3/14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Toronto | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ❌ 1/14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| San Francisco | ❌ 3/4 | ❌ 3/3 | ❌ 2/3 | ❌ 2/14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 3/4 | ❌ 9/10 |
| Chicago | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ❌ 2/14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Miami | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Kyoto | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ❌ 1/14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Osaka | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ❌ 2/14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Taipei | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Hanoi | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Mumbai | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ❌ 1/14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |
| Melbourne | ❌ 2/4 | ❌ 1/3 | ✅ 3 | ❌ 2/14 | ✅ 6 | ✅ 12 | ❌ 1/2 | ❌ 2/4 | ❌ 8/10 |

## Real map tiles (Tokyo, Lisbon, Rome)

Run one city at a time, one tile request at a time with a 1 s pause, capped at 30 requests per city.

| City | Tiles loaded (naturalWidth > 0) | Tile requests | Attribution | Result |
| --- | ---: | ---: | ---: | --- |
| Tokyo | 3 | 4 | 12px | ✅ |
| Lisbon | 3 | 4 | 12px | ✅ |
| Rome | 2 | 3 | 12px | ✅ |

![Tokyo day 1 with real tiles](screenshots/real-tiles-tokyo.jpg)
![Lisbon day 1 with real tiles](screenshots/real-tiles-lisbon.jpg)
![Rome day 1 with real tiles](screenshots/real-tiles-rome.jpg)

## Failure details

Every failure, grouped by type, with the scenario it came from. The exact inputs of each scenario are in the appendix.

### `render.stop-links` (761)

page differs from what the engine produced

- **tokyo** `A:7d`: day 3 stop 1 "Depart for Hakone": page has 0 links, expected 4
- **tokyo** `A:7d`: day 5 stop 1 "Depart for Nikko": page has 0 links, expected 4
- **tokyo** `A:14d`: day 4 stop 1 "Depart for Hakone": page has 0 links, expected 4
- **tokyo** `A:14d`: day 8 stop 1 "Depart for Nikko": page has 0 links, expected 4
- **tokyo** `A:14d`: day 11 stop 1 "Depart for Kamakura": page has 0 links, expected 4
- **tokyo** `B:weekday-start`: day 3 stop 1 "Depart for Hakone": page has 0 links, expected 4
- **tokyo** `G:undated`: day 3 stop 1 "Depart for Hakone": page has 0 links, expected 4
- **tokyo** `I:length`: day 3 stop 1 "Depart for Hakone": page has 0 links, expected 4
- **tokyo** `I:travellers`: day 3 stop 1 "Depart for Hakone": page has 0 links, expected 4
- **tokyo** `I:interest`: day 3 stop 1 "Depart for Hakone": page has 0 links, expected 4
- **tokyo** `I:dietary`: day 3 stop 1 "Depart for Hakone": page has 0 links, expected 4
- **tokyo** `I:mobility`: day 3 stop 1 "Depart for Hakone": page has 0 links, expected 4
- **tokyo** `I:swap`: day 3 stop 1 "Depart for Hakone": page has 0 links, expected 4
- **tokyo** `I:shuffle`: day 3 stop 1 "Depart for Hakone": page has 0 links, expected 4
- **tokyo** `I:city`: day 3 stop 1 "Depart for Kutná Hora": page has 0 links, expected 4
- **paris** `A:7d`: day 3 stop 1 "Depart for Palace of Versailles": page has 0 links, expected 4
- **paris** `A:7d`: day 5 stop 1 "Depart for Fontainebleau": page has 0 links, expected 4
- **paris** `A:14d`: day 4 stop 1 "Depart for Palace of Versailles": page has 0 links, expected 4
- **paris** `A:14d`: day 8 stop 1 "Depart for Fontainebleau": page has 0 links, expected 4
- **paris** `A:14d`: day 11 stop 1 "Depart for Giverny (Monet's Garden)": page has 0 links, expected 4
- **paris** `B:weekday-start`: day 3 stop 1 "Depart for Palace of Versailles": page has 0 links, expected 4
- **paris** `G:undated`: day 3 stop 1 "Depart for Palace of Versailles": page has 0 links, expected 4
- **paris** `I:length`: day 3 stop 1 "Depart for Palace of Versailles": page has 0 links, expected 4
- **paris** `I:travellers`: day 3 stop 1 "Depart for Palace of Versailles": page has 0 links, expected 4
- **paris** `I:interest`: day 3 stop 1 "Depart for Palace of Versailles": page has 0 links, expected 4
- **paris** `I:dietary`: day 3 stop 1 "Depart for Palace of Versailles": page has 0 links, expected 4
- **paris** `I:mobility`: day 3 stop 1 "Depart for Palace of Versailles": page has 0 links, expected 4
- **paris** `I:swap`: day 3 stop 1 "Depart for Palace of Versailles": page has 0 links, expected 4
- **paris** `I:shuffle`: day 3 stop 1 "Depart for Palace of Versailles": page has 0 links, expected 4
- **paris** `I:city`: day 3 stop 1 "Depart for Sintra": page has 0 links, expected 4
- **london** `A:7d`: day 3 stop 1 "Depart for Oxford": page has 0 links, expected 4
- **london** `A:7d`: day 5 stop 1 "Depart for Stonehenge & Bath": page has 0 links, expected 4
- **london** `A:14d`: day 4 stop 1 "Depart for Oxford": page has 0 links, expected 4
- **london** `A:14d`: day 8 stop 1 "Depart for Stonehenge & Bath": page has 0 links, expected 4
- **london** `A:14d`: day 11 stop 1 "Depart for Windsor Castle": page has 0 links, expected 4
- **london** `B:weekday-start`: day 3 stop 1 "Depart for Oxford": page has 0 links, expected 4
- **london** `G:undated`: day 3 stop 1 "Depart for Oxford": page has 0 links, expected 4
- **london** `I:length`: day 3 stop 1 "Depart for Oxford": page has 0 links, expected 4
- **london** `I:travellers`: day 3 stop 1 "Depart for Oxford": page has 0 links, expected 4
- **london** `I:interest`: day 3 stop 1 "Depart for Oxford": page has 0 links, expected 4
- **london** `I:dietary`: day 3 stop 1 "Depart for Oxford": page has 0 links, expected 4
- **london** `I:mobility`: day 3 stop 1 "Depart for Oxford": page has 0 links, expected 4
- **london** `I:swap`: day 3 stop 1 "Depart for Oxford": page has 0 links, expected 4
- **london** `I:shuffle`: day 3 stop 1 "Depart for Oxford": page has 0 links, expected 4
- **london** `I:city`: day 3 stop 1 "Depart for Sintra": page has 0 links, expected 4
- **dubai** `A:7d`: day 3 stop 1 "Depart for Abu Dhabi": page has 0 links, expected 4
- **dubai** `A:7d`: day 5 stop 1 "Depart for Hatta": page has 0 links, expected 4
- **dubai** `A:14d`: day 4 stop 1 "Depart for Abu Dhabi": page has 0 links, expected 4
- **dubai** `A:14d`: day 8 stop 1 "Depart for Hatta": page has 0 links, expected 4
- **dubai** `A:14d`: day 11 stop 1 "Depart for Sharjah": page has 0 links, expected 4
- **dubai** `B:weekday-start`: day 3 stop 1 "Depart for Abu Dhabi": page has 0 links, expected 4
- **dubai** `G:undated`: day 3 stop 1 "Depart for Abu Dhabi": page has 0 links, expected 4
- **dubai** `I:length`: day 3 stop 1 "Depart for Abu Dhabi": page has 0 links, expected 4
- **dubai** `I:travellers`: day 3 stop 1 "Depart for Abu Dhabi": page has 0 links, expected 4
- **dubai** `I:interest`: day 3 stop 1 "Depart for Abu Dhabi": page has 0 links, expected 4
- **dubai** `I:dietary`: day 3 stop 1 "Depart for Abu Dhabi": page has 0 links, expected 4
- **dubai** `I:mobility`: day 3 stop 1 "Depart for Abu Dhabi": page has 0 links, expected 4
- **dubai** `I:swap`: day 3 stop 1 "Depart for Abu Dhabi": page has 0 links, expected 4
- **dubai** `I:shuffle`: day 3 stop 1 "Depart for Abu Dhabi": page has 0 links, expected 4
- **dubai** `I:city`: day 3 stop 1 "Depart for Nara": page has 0 links, expected 4
- **singapore** `A:7d`: day 3 stop 1 "Depart for Johor Bahru": page has 0 links, expected 5
- **singapore** `A:7d`: day 5 stop 1 "Depart for Sentosa Island": page has 0 links, expected 5
- **singapore** `A:14d`: day 4 stop 1 "Depart for Johor Bahru": page has 0 links, expected 5
- **singapore** `A:14d`: day 8 stop 1 "Depart for Sentosa Island": page has 0 links, expected 5
- **singapore** `A:14d`: day 11 stop 1 "Depart for Pulau Ubin": page has 0 links, expected 5
- **singapore** `B:weekday-start`: day 3 stop 1 "Depart for Johor Bahru": page has 0 links, expected 5
- **singapore** `G:undated`: day 3 stop 1 "Depart for Johor Bahru": page has 0 links, expected 5
- **singapore** `I:length`: day 3 stop 1 "Depart for Johor Bahru": page has 0 links, expected 5
- **singapore** `I:travellers`: day 3 stop 1 "Depart for Johor Bahru": page has 0 links, expected 5
- **singapore** `I:interest`: day 3 stop 1 "Depart for Johor Bahru": page has 0 links, expected 5
- **singapore** `I:dietary`: day 3 stop 1 "Depart for Johor Bahru": page has 0 links, expected 5
- **singapore** `I:mobility`: day 3 stop 1 "Depart for Johor Bahru": page has 0 links, expected 5
- **singapore** `I:swap`: day 3 stop 1 "Depart for Johor Bahru": page has 0 links, expected 5
- **singapore** `I:shuffle`: day 3 stop 1 "Depart for Johor Bahru": page has 0 links, expected 5
- **singapore** `I:city`: day 3 stop 1 "Depart for Essaouira": page has 0 links, expected 4
- **bangkok** `A:7d`: day 3 stop 1 "Depart for Ayutthaya": page has 0 links, expected 5
- **bangkok** `A:7d`: day 5 stop 1 "Depart for Kanchanaburi": page has 0 links, expected 5
- **bangkok** `A:14d`: day 4 stop 1 "Depart for Ayutthaya": page has 0 links, expected 5
- **bangkok** `A:14d`: day 8 stop 1 "Depart for Kanchanaburi": page has 0 links, expected 5
- **bangkok** `A:14d`: day 11 stop 1 "Depart for Damnoen Saduak Floating Market": page has 0 links, expected 5
- **bangkok** `B:weekday-start`: day 3 stop 1 "Depart for Kanchanaburi": page has 0 links, expected 5
- **bangkok** `G:undated`: day 3 stop 1 "Depart for Ayutthaya": page has 0 links, expected 5
- **bangkok** `I:length`: day 3 stop 1 "Depart for Kanchanaburi": page has 0 links, expected 5
- **bangkok** `I:travellers`: day 3 stop 1 "Depart for Kanchanaburi": page has 0 links, expected 5
- **bangkok** `I:interest`: day 3 stop 1 "Depart for Kanchanaburi": page has 0 links, expected 5
- **bangkok** `I:dietary`: day 3 stop 1 "Depart for Kanchanaburi": page has 0 links, expected 5
- **bangkok** `I:mobility`: day 3 stop 1 "Depart for Kanchanaburi": page has 0 links, expected 5
- **bangkok** `I:swap`: day 3 stop 1 "Depart for Kanchanaburi": page has 0 links, expected 5
- **bangkok** `I:shuffle`: day 3 stop 1 "Depart for Kanchanaburi": page has 0 links, expected 5
- **bangkok** `I:city`: day 3 stop 1 "Depart for Delphi": page has 0 links, expected 4
- **rome** `A:7d`: day 3 stop 1 "Depart for Orvieto": page has 0 links, expected 4
- **rome** `A:7d`: day 5 stop 1 "Depart for Tivoli (Villa d'Este & Hadrian's Villa)": page has 0 links, expected 4
- **rome** `A:14d`: day 4 stop 1 "Depart for Orvieto": page has 0 links, expected 4
- **rome** `A:14d`: day 8 stop 1 "Depart for Tivoli (Villa d'Este & Hadrian's Villa)": page has 0 links, expected 4
- **rome** `A:14d`: day 11 stop 1 "Depart for Ostia Antica": page has 0 links, expected 4
- **rome** `B:weekday-start`: day 3 stop 1 "Depart for Orvieto": page has 0 links, expected 4
- **rome** `G:undated`: day 3 stop 1 "Depart for Orvieto": page has 0 links, expected 4
- **rome** `I:length`: day 3 stop 1 "Depart for Orvieto": page has 0 links, expected 4
- **rome** `I:travellers`: day 3 stop 1 "Depart for Orvieto": page has 0 links, expected 4
- **rome** `I:interest`: day 3 stop 1 "Depart for Orvieto": page has 0 links, expected 4
- **rome** `I:dietary`: day 3 stop 1 "Depart for Orvieto": page has 0 links, expected 4
- **rome** `I:mobility`: day 3 stop 1 "Depart for Orvieto": page has 0 links, expected 4
- **rome** `I:swap`: day 3 stop 1 "Depart for Orvieto": page has 0 links, expected 4
- **rome** `I:shuffle`: day 3 stop 1 "Depart for Orvieto": page has 0 links, expected 4
- **rome** `I:city`: day 3 stop 1 "Depart for Alibaug": page has 0 links, expected 4
- **barcelona** `A:7d`: day 3 stop 1 "Depart for Girona": page has 0 links, expected 4
- **barcelona** `A:7d`: day 5 stop 1 "Depart for Sitges": page has 0 links, expected 4
- **barcelona** `A:14d`: day 4 stop 1 "Depart for Girona": page has 0 links, expected 4
- **barcelona** `A:14d`: day 8 stop 1 "Depart for Sitges": page has 0 links, expected 4
- **barcelona** `A:14d`: day 11 stop 1 "Depart for Montserrat": page has 0 links, expected 4
- **barcelona** `B:weekday-start`: day 3 stop 1 "Depart for Girona": page has 0 links, expected 4
- **barcelona** `G:undated`: day 3 stop 1 "Depart for Girona": page has 0 links, expected 4
- **barcelona** `I:length`: day 3 stop 1 "Depart for Girona": page has 0 links, expected 4
- **barcelona** `I:travellers`: day 3 stop 1 "Depart for Girona": page has 0 links, expected 4
- **barcelona** `I:interest`: day 3 stop 1 "Depart for Girona": page has 0 links, expected 4
- **barcelona** `I:dietary`: day 3 stop 1 "Depart for Girona": page has 0 links, expected 4
- **barcelona** `I:mobility`: day 3 stop 1 "Depart for Girona": page has 0 links, expected 4
- **barcelona** `I:swap`: day 3 stop 1 "Depart for Girona": page has 0 links, expected 4
- **barcelona** `I:shuffle`: day 3 stop 1 "Depart for Girona": page has 0 links, expected 4
- **barcelona** `I:city`: day 3 stop 1 "Depart for Nara": page has 0 links, expected 4
- **new-york-city** `A:7d`: day 3 stop 1 "Depart for The Hamptons": page has 0 links, expected 4
- **new-york-city** `A:7d`: day 5 stop 1 "Depart for Philadelphia": page has 0 links, expected 4
- **new-york-city** `A:14d`: day 4 stop 1 "Depart for The Hamptons": page has 0 links, expected 4
- **new-york-city** `A:14d`: day 8 stop 1 "Depart for Philadelphia": page has 0 links, expected 4
- **new-york-city** `A:14d`: day 11 stop 1 "Depart for Hudson Valley (Sleepy Hollow / Storm King)": page has 0 links, expected 4
- **new-york-city** `B:weekday-start`: day 3 stop 1 "Depart for The Hamptons": page has 0 links, expected 4
- **new-york-city** `G:undated`: day 3 stop 1 "Depart for The Hamptons": page has 0 links, expected 4
- **new-york-city** `I:length`: day 3 stop 1 "Depart for The Hamptons": page has 0 links, expected 4
- **new-york-city** `I:travellers`: day 3 stop 1 "Depart for The Hamptons": page has 0 links, expected 4
- **new-york-city** `I:interest`: day 3 stop 1 "Depart for The Hamptons": page has 0 links, expected 4
- **new-york-city** `I:dietary`: day 3 stop 1 "Depart for The Hamptons": page has 0 links, expected 4
- **new-york-city** `I:mobility`: day 3 stop 1 "Depart for The Hamptons": page has 0 links, expected 4
- **new-york-city** `I:swap`: day 3 stop 1 "Depart for The Hamptons": page has 0 links, expected 4
- **new-york-city** `I:shuffle`: day 3 stop 1 "Depart for The Hamptons": page has 0 links, expected 4
- **new-york-city** `I:city`: day 3 stop 1 "Depart for Hermanus": page has 0 links, expected 4
- **istanbul** `A:7d`: day 3 stop 1 "Depart for Bursa": page has 0 links, expected 4
- **istanbul** `A:7d`: day 5 stop 1 "Depart for Princes' Islands": page has 0 links, expected 4
- **istanbul** `A:14d`: day 4 stop 1 "Depart for Bursa": page has 0 links, expected 4
- **istanbul** `A:14d`: day 8 stop 1 "Depart for Princes' Islands": page has 0 links, expected 4
- **istanbul** `A:14d`: day 11 stop 1 "Depart for Edirne": page has 0 links, expected 4
- **istanbul** `B:weekday-start`: day 3 stop 1 "Depart for Bursa": page has 0 links, expected 4
- **istanbul** `G:undated`: day 3 stop 1 "Depart for Bursa": page has 0 links, expected 4
- **istanbul** `I:length`: day 3 stop 1 "Depart for Bursa": page has 0 links, expected 4
- **istanbul** `I:travellers`: day 3 stop 1 "Depart for Bursa": page has 0 links, expected 4
- **istanbul** `I:interest`: day 3 stop 1 "Depart for Bursa": page has 0 links, expected 4
- **istanbul** `I:dietary`: day 3 stop 1 "Depart for Bursa": page has 0 links, expected 4
- **istanbul** `I:mobility`: day 3 stop 1 "Depart for Bursa": page has 0 links, expected 4
- **istanbul** `I:swap`: day 3 stop 1 "Depart for Bursa": page has 0 links, expected 4
- **istanbul** `I:shuffle`: day 3 stop 1 "Depart for Bursa": page has 0 links, expected 4
- **istanbul** `I:city`: day 3 stop 1 "Depart for Niagara-on-the-Lake": page has 0 links, expected 4
- **seoul** `A:7d`: day 3 stop 1 "Depart for Nami Island & Petite France": page has 0 links, expected 4
- **seoul** `A:7d`: day 5 stop 1 "Depart for Suwon Hwaseong Fortress": page has 0 links, expected 4
- **seoul** `A:14d`: day 4 stop 1 "Depart for Nami Island & Petite France": page has 0 links, expected 4
- **seoul** `A:14d`: day 8 stop 1 "Depart for Suwon Hwaseong Fortress": page has 0 links, expected 4
- **seoul** `A:14d`: day 11 stop 1 "Depart for DMZ & Panmunjom": page has 0 links, expected 4
- **seoul** `B:weekday-start`: day 3 stop 1 "Depart for Nami Island & Petite France": page has 0 links, expected 4
- **seoul** `G:undated`: day 3 stop 1 "Depart for Nami Island & Petite France": page has 0 links, expected 4
- **seoul** `I:length`: day 3 stop 1 "Depart for Nami Island & Petite France": page has 0 links, expected 4
- **seoul** `I:travellers`: day 3 stop 1 "Depart for Nami Island & Petite France": page has 0 links, expected 4
- **seoul** `I:interest`: day 3 stop 1 "Depart for Nami Island & Petite France": page has 0 links, expected 4
- **seoul** `I:dietary`: day 3 stop 1 "Depart for Nami Island & Petite France": page has 0 links, expected 4
- **seoul** `I:mobility`: day 3 stop 1 "Depart for Nami Island & Petite France": page has 0 links, expected 4
- **seoul** `I:swap`: day 3 stop 1 "Depart for Nami Island & Petite France": page has 0 links, expected 4
- **seoul** `I:shuffle`: day 3 stop 1 "Depart for Nami Island & Petite France": page has 0 links, expected 4
- **seoul** `I:city`: day 3 stop 1 "Depart for Girona": page has 0 links, expected 4
- **amsterdam** `A:7d`: day 3 stop 1 "Depart for Utrecht": page has 0 links, expected 4
- **amsterdam** `A:7d`: day 5 stop 1 "Depart for Keukenhof (seasonal, spring only)": page has 0 links, expected 4
- **amsterdam** `A:14d`: day 4 stop 1 "Depart for Utrecht": page has 0 links, expected 4
- **amsterdam** `A:14d`: day 8 stop 1 "Depart for Keukenhof (seasonal, spring only)": page has 0 links, expected 4
- **amsterdam** `A:14d`: day 11 stop 1 "Depart for Zaanse Schans": page has 0 links, expected 4
- **amsterdam** `B:weekday-start`: day 3 stop 1 "Depart for Utrecht": page has 0 links, expected 4
- **amsterdam** `G:undated`: day 3 stop 1 "Depart for Utrecht": page has 0 links, expected 4
- **amsterdam** `I:length`: day 3 stop 1 "Depart for Utrecht": page has 0 links, expected 4
- **amsterdam** `I:travellers`: day 3 stop 1 "Depart for Utrecht": page has 0 links, expected 4
- **amsterdam** `I:interest`: day 3 stop 1 "Depart for Utrecht": page has 0 links, expected 4
- **amsterdam** `I:dietary`: day 3 stop 1 "Depart for Utrecht": page has 0 links, expected 4
- **amsterdam** `I:mobility`: day 3 stop 1 "Depart for Utrecht": page has 0 links, expected 4
- **amsterdam** `I:swap`: day 3 stop 1 "Depart for Utrecht": page has 0 links, expected 4
- **amsterdam** `I:shuffle`: day 3 stop 1 "Depart for Utrecht": page has 0 links, expected 4
- **amsterdam** `I:city`: day 3 stop 1 "Depart for Chianti wine region": page has 0 links, expected 4
- **copenhagen** `A:7d`: day 3 stop 1 "Depart for Malmö, Sweden": page has 0 links, expected 4
- **copenhagen** `A:7d`: day 5 stop 1 "Depart for Kronborg Castle (Helsingør)": page has 0 links, expected 4
- **copenhagen** `A:14d`: day 4 stop 1 "Depart for Malmö, Sweden": page has 0 links, expected 4
- **copenhagen** `A:14d`: day 8 stop 1 "Depart for Kronborg Castle (Helsingør)": page has 0 links, expected 4
- **copenhagen** `A:14d`: day 11 stop 1 "Depart for Louisiana Museum of Modern Art": page has 0 links, expected 4
- **copenhagen** `B:weekday-start`: day 3 stop 1 "Depart for Malmö, Sweden": page has 0 links, expected 4
- **copenhagen** `G:undated`: day 3 stop 1 "Depart for Malmö, Sweden": page has 0 links, expected 4
- **copenhagen** `I:length`: day 3 stop 1 "Depart for Malmö, Sweden": page has 0 links, expected 4
- **copenhagen** `I:travellers`: day 3 stop 1 "Depart for Malmö, Sweden": page has 0 links, expected 4
- **copenhagen** `I:interest`: day 3 stop 1 "Depart for Malmö, Sweden": page has 0 links, expected 4
- **copenhagen** `I:dietary`: day 3 stop 1 "Depart for Malmö, Sweden": page has 0 links, expected 4
- **copenhagen** `I:mobility`: day 3 stop 1 "Depart for Malmö, Sweden": page has 0 links, expected 4
- **copenhagen** `I:swap`: day 3 stop 1 "Depart for Malmö, Sweden": page has 0 links, expected 4
- **copenhagen** `I:shuffle`: day 3 stop 1 "Depart for Malmö, Sweden": page has 0 links, expected 4
- **copenhagen** `I:city`: day 3 stop 1 "Depart for Indiana Dunes National Park": page has 0 links, expected 4
- **hong-kong** `A:7d`: day 3 stop 1 "Depart for Lantau Island (Big Buddha & Tai O)": page has 0 links, expected 4
- **hong-kong** `A:7d`: day 5 stop 1 "Depart for Macau": page has 0 links, expected 4
- **hong-kong** `A:14d`: day 4 stop 1 "Depart for Lantau Island (Big Buddha & Tai O)": page has 0 links, expected 4
- **hong-kong** `A:14d`: day 8 stop 1 "Depart for Macau": page has 0 links, expected 4
- **hong-kong** `A:14d`: day 11 stop 1 "Depart for Cheung Chau": page has 0 links, expected 4
- **hong-kong** `B:weekday-start`: day 3 stop 1 "Depart for Lantau Island (Big Buddha & Tai O)": page has 0 links, expected 4
- **hong-kong** `G:undated`: day 3 stop 1 "Depart for Lantau Island (Big Buddha & Tai O)": page has 0 links, expected 4
- **hong-kong** `I:length`: day 3 stop 1 "Depart for Lantau Island (Big Buddha & Tai O)": page has 0 links, expected 4
- **hong-kong** `I:travellers`: day 3 stop 1 "Depart for Lantau Island (Big Buddha & Tai O)": page has 0 links, expected 4
- **hong-kong** `I:interest`: day 3 stop 1 "Depart for Lantau Island (Big Buddha & Tai O)": page has 0 links, expected 4
- **hong-kong** `I:dietary`: day 3 stop 1 "Depart for Lantau Island (Big Buddha & Tai O)": page has 0 links, expected 4
- **hong-kong** `I:mobility`: day 3 stop 1 "Depart for Lantau Island (Big Buddha & Tai O)": page has 0 links, expected 4
- **hong-kong** `I:swap`: day 3 stop 1 "Depart for Lantau Island (Big Buddha & Tai O)": page has 0 links, expected 4
- **hong-kong** `I:shuffle`: day 3 stop 1 "Depart for Lantau Island (Big Buddha & Tai O)": page has 0 links, expected 4
- **hong-kong** `I:city`: day 3 stop 1 "Depart for Murano, Burano and Torcello": page has 0 links, expected 4
- **sydney** `A:7d`: day 3 stop 1 "Depart for Royal National Park": page has 0 links, expected 4
- **sydney** `A:7d`: day 5 stop 1 "Depart for Blue Mountains": page has 0 links, expected 4
- **sydney** `A:14d`: day 4 stop 1 "Depart for Royal National Park": page has 0 links, expected 4
- **sydney** `A:14d`: day 8 stop 1 "Depart for Blue Mountains": page has 0 links, expected 4
- **sydney** `A:14d`: day 11 stop 1 "Depart for Hunter Valley": page has 0 links, expected 4
- **sydney** `B:weekday-start`: day 3 stop 1 "Depart for Royal National Park": page has 0 links, expected 4
- **sydney** `G:undated`: day 3 stop 1 "Depart for Royal National Park": page has 0 links, expected 4
- **sydney** `G:undated`: day 4 stop 2 "Watsons Bay": page has 4 links, expected 4
- **sydney** `G:undated`: day 4 stop 3 "Icebergs Dining Room": page has 2 links, expected 1
- **sydney** `G:undated`: day 4 stop 5 "Campos Coffee": page has 1 links, expected 1
- **sydney** `G:closed-day`: day 1 stop 4 "Bang Bang Espresso": page has 1 links, expected 1
- **sydney** `G:closed-day`: day 3 stop 2 "Watsons Bay": page has 4 links, expected 4
- **sydney** `G:closed-day`: day 3 stop 3 "Icebergs Dining Room": page has 2 links, expected 1
- **sydney** `G:closed-day`: day 3 stop 5 "Black Star Pastry": page has 1 links, expected 2
- **sydney** `I:length`: day 3 stop 1 "Depart for Royal National Park": page has 0 links, expected 4
- **sydney** `I:travellers`: day 3 stop 1 "Depart for Royal National Park": page has 0 links, expected 4
- **sydney** `I:interest`: day 3 stop 1 "Depart for Royal National Park": page has 0 links, expected 4
- **sydney** `I:dietary`: day 3 stop 1 "Depart for Royal National Park": page has 0 links, expected 4
- **sydney** `I:mobility`: day 3 stop 1 "Depart for Royal National Park": page has 0 links, expected 4
- **sydney** `I:swap`: day 3 stop 1 "Depart for Royal National Park": page has 0 links, expected 4
- **sydney** `I:shuffle`: day 3 stop 1 "Depart for Royal National Park": page has 0 links, expected 4
- **sydney** `I:city`: day 3 stop 1 "Depart for Oxford": page has 0 links, expected 4
- **zurich** `A:7d`: day 3 stop 1 "Depart for Lucerne": page has 0 links, expected 4
- **zurich** `A:7d`: day 5 stop 1 "Depart for Jungfraujoch ('Top of Europe')": page has 0 links, expected 4
- **zurich** `A:14d`: day 4 stop 1 "Depart for Lucerne": page has 0 links, expected 4
- **zurich** `A:14d`: day 8 stop 1 "Depart for Jungfraujoch ('Top of Europe')": page has 0 links, expected 4
- **zurich** `A:14d`: day 11 stop 1 "Depart for Rhine Falls": page has 0 links, expected 4
- **zurich** `B:weekday-start`: day 3 stop 1 "Depart for Lucerne": page has 0 links, expected 4
- **zurich** `G:undated`: day 3 stop 1 "Depart for Lucerne": page has 0 links, expected 4
- **zurich** `I:length`: day 3 stop 1 "Depart for Lucerne": page has 0 links, expected 4
- **zurich** `I:travellers`: day 3 stop 1 "Depart for Lucerne": page has 0 links, expected 4
- **zurich** `I:interest`: day 3 stop 1 "Depart for Lucerne": page has 0 links, expected 4
- **zurich** `I:dietary`: day 3 stop 1 "Depart for Lucerne": page has 0 links, expected 4
- **zurich** `I:mobility`: day 3 stop 1 "Depart for Lucerne": page has 0 links, expected 4
- **zurich** `I:swap`: day 3 stop 1 "Depart for Lucerne": page has 0 links, expected 4
- **zurich** `I:shuffle`: day 3 stop 1 "Depart for Lucerne": page has 0 links, expected 4
- **zurich** `I:city`: day 3 stop 1 "Depart for The Hamptons": page has 0 links, expected 4
- **los-angeles** `A:7d`: day 3 stop 1 "Depart for Joshua Tree National Park": page has 0 links, expected 4
- **los-angeles** `A:7d`: day 5 stop 1 "Depart for Disneyland (Anaheim)": page has 0 links, expected 4
- **los-angeles** `A:14d`: day 4 stop 1 "Depart for Joshua Tree National Park": page has 0 links, expected 4
- **los-angeles** `A:14d`: day 8 stop 1 "Depart for Disneyland (Anaheim)": page has 0 links, expected 4
- **los-angeles** `A:14d`: day 11 stop 1 "Depart for Malibu & Point Dume": page has 0 links, expected 4
- **los-angeles** `B:weekday-start`: day 3 stop 1 "Depart for Joshua Tree National Park": page has 0 links, expected 4
- **los-angeles** `G:undated`: day 3 stop 1 "Depart for Joshua Tree National Park": page has 0 links, expected 4
- **los-angeles** `I:length`: day 3 stop 1 "Depart for Joshua Tree National Park": page has 0 links, expected 4
- **los-angeles** `I:travellers`: day 3 stop 1 "Depart for Joshua Tree National Park": page has 0 links, expected 4
- **los-angeles** `I:interest`: day 3 stop 1 "Depart for Joshua Tree National Park": page has 0 links, expected 4
- **los-angeles** `I:dietary`: day 3 stop 1 "Depart for Joshua Tree National Park": page has 0 links, expected 4
- **los-angeles** `I:mobility`: day 3 stop 1 "Depart for Joshua Tree National Park": page has 0 links, expected 4
- **los-angeles** `I:swap`: day 3 stop 1 "Depart for Joshua Tree National Park": page has 0 links, expected 4
- **los-angeles** `I:shuffle`: day 3 stop 1 "Depart for Joshua Tree National Park": page has 0 links, expected 4
- **los-angeles** `I:city`: day 3 stop 1 "Depart for Bergamo": page has 0 links, expected 4
- **kuala-lumpur** `A:7d`: day 3 stop 1 "Depart for Malacca (Melaka)": page has 0 links, expected 5
- **kuala-lumpur** `A:7d`: day 5 stop 1 "Depart for Batu Caves": page has 0 links, expected 5
- **kuala-lumpur** `A:14d`: day 4 stop 1 "Depart for Malacca (Melaka)": page has 0 links, expected 5
- **kuala-lumpur** `A:14d`: day 8 stop 1 "Depart for Batu Caves": page has 0 links, expected 5
- **kuala-lumpur** `A:14d`: day 11 stop 1 "Depart for Cameron Highlands": page has 0 links, expected 5
- **kuala-lumpur** `B:weekday-start`: day 3 stop 1 "Depart for Malacca (Melaka)": page has 0 links, expected 5
- **kuala-lumpur** `G:undated`: day 3 stop 1 "Depart for Malacca (Melaka)": page has 0 links, expected 5
- **kuala-lumpur** `I:length`: day 3 stop 1 "Depart for Malacca (Melaka)": page has 0 links, expected 5
- **kuala-lumpur** `I:travellers`: day 3 stop 1 "Depart for Malacca (Melaka)": page has 0 links, expected 5
- **kuala-lumpur** `I:interest`: day 3 stop 1 "Depart for Malacca (Melaka)": page has 0 links, expected 5
- **kuala-lumpur** `I:dietary`: day 3 stop 1 "Depart for Malacca (Melaka)": page has 0 links, expected 5
- **kuala-lumpur** `I:mobility`: day 3 stop 1 "Depart for Malacca (Melaka)": page has 0 links, expected 5
- **kuala-lumpur** `I:swap`: day 3 stop 1 "Depart for Malacca (Melaka)": page has 0 links, expected 5
- **kuala-lumpur** `I:shuffle`: day 3 stop 1 "Depart for Malacca (Melaka)": page has 0 links, expected 5
- **kuala-lumpur** `I:city`: day 3 stop 1 "Depart for Palace of Versailles": page has 0 links, expected 4
- **vienna** `A:7d`: day 3 stop 1 "Depart for Bratislava, Slovakia": page has 0 links, expected 4
- **vienna** `A:7d`: day 5 stop 1 "Depart for Wachau Valley": page has 0 links, expected 4
- **vienna** `A:14d`: day 4 stop 1 "Depart for Bratislava, Slovakia": page has 0 links, expected 4
- **vienna** `A:14d`: day 8 stop 1 "Depart for Wachau Valley": page has 0 links, expected 4
- **vienna** `A:14d`: day 11 stop 1 "Depart for Baden bei Wien": page has 0 links, expected 4
- **vienna** `B:weekday-start`: day 3 stop 1 "Depart for Bratislava, Slovakia": page has 0 links, expected 4
- **vienna** `G:undated`: day 3 stop 1 "Depart for Bratislava, Slovakia": page has 0 links, expected 4
- **vienna** `I:length`: day 3 stop 1 "Depart for Bratislava, Slovakia": page has 0 links, expected 4
- **vienna** `I:travellers`: day 3 stop 1 "Depart for Bratislava, Slovakia": page has 0 links, expected 4
- **vienna** `I:interest`: day 3 stop 1 "Depart for Bratislava, Slovakia": page has 0 links, expected 4
- **vienna** `I:dietary`: day 3 stop 1 "Depart for Bratislava, Slovakia": page has 0 links, expected 4
- **vienna** `I:mobility`: day 3 stop 1 "Depart for Bratislava, Slovakia": page has 0 links, expected 4
- **vienna** `I:swap`: day 3 stop 1 "Depart for Bratislava, Slovakia": page has 0 links, expected 4
- **vienna** `I:shuffle`: day 3 stop 1 "Depart for Bratislava, Slovakia": page has 0 links, expected 4
- **vienna** `I:city`: day 3 stop 1 "Depart for Auschwitz-Birkenau": page has 0 links, expected 4
- **lisbon** `A:7d`: day 3 stop 1 "Depart for Sintra": page has 0 links, expected 4
- **lisbon** `A:7d`: day 5 stop 1 "Depart for Cascais & Estoril": page has 0 links, expected 4
- **lisbon** `A:14d`: day 4 stop 1 "Depart for Sintra": page has 0 links, expected 4
- **lisbon** `A:14d`: day 8 stop 1 "Depart for Cascais & Estoril": page has 0 links, expected 4
- **lisbon** `A:14d`: day 11 stop 1 "Depart for Óbidos": page has 0 links, expected 4
- **lisbon** `B:weekday-start`: day 3 stop 1 "Depart for Sintra": page has 0 links, expected 4
- **lisbon** `G:undated`: day 3 stop 1 "Depart for Sintra": page has 0 links, expected 4
- **lisbon** `I:length`: day 3 stop 1 "Depart for Sintra": page has 0 links, expected 4
- **lisbon** `I:travellers`: day 3 stop 1 "Depart for Sintra": page has 0 links, expected 4
- **lisbon** `I:interest`: day 3 stop 1 "Depart for Sintra": page has 0 links, expected 4
- **lisbon** `I:dietary`: day 3 stop 1 "Depart for Sintra": page has 0 links, expected 4
- **lisbon** `I:mobility`: day 3 stop 1 "Depart for Sintra": page has 0 links, expected 4
- **lisbon** `I:swap`: day 3 stop 1 "Depart for Sintra": page has 0 links, expected 4
- **lisbon** `I:shuffle`: day 3 stop 1 "Depart for Sintra": page has 0 links, expected 4
- **lisbon** `I:city`: day 3 stop 1 "Depart for Delphi": page has 0 links, expected 4
- **prague** `A:7d`: day 3 stop 1 "Depart for Kutná Hora": page has 0 links, expected 4
- **prague** `A:7d`: day 5 stop 1 "Depart for Terezín": page has 0 links, expected 4
- **prague** `A:14d`: day 4 stop 1 "Depart for Kutná Hora": page has 0 links, expected 4
- **prague** `A:14d`: day 6 stop 1 "Depart for Terezín": page has 0 links, expected 4
- **prague** `A:14d`: day 9 stop 1 "Depart for Český Krumlov": page has 0 links, expected 4
- **prague** `A:14d`: day 11 stop 1 "Depart for Karlštejn Castle": page has 0 links, expected 4
- **prague** `B:weekday-start`: day 3 stop 1 "Depart for Kutná Hora": page has 0 links, expected 4
- **prague** `G:undated`: day 3 stop 1 "Depart for Kutná Hora": page has 0 links, expected 4
- **prague** `I:length`: day 3 stop 1 "Depart for Kutná Hora": page has 0 links, expected 4
- **prague** `I:travellers`: day 3 stop 1 "Depart for Kutná Hora": page has 0 links, expected 4
- **prague** `I:interest`: day 3 stop 1 "Depart for Kutná Hora": page has 0 links, expected 4
- **prague** `I:dietary`: day 3 stop 1 "Depart for Kutná Hora": page has 0 links, expected 4
- **prague** `I:mobility`: day 3 stop 1 "Depart for Kutná Hora": page has 0 links, expected 4
- **prague** `I:swap`: day 3 stop 1 "Depart for Kutná Hora": page has 0 links, expected 4
- **prague** `I:shuffle`: day 3 stop 1 "Depart for Kutná Hora": page has 0 links, expected 4
- **prague** `I:city`: day 3 stop 1 "Depart for St Andrews": page has 0 links, expected 4
- **berlin** `A:7d`: day 3 stop 1 "Depart for Spreewald": page has 0 links, expected 4
- **berlin** `A:7d`: day 5 stop 1 "Depart for Potsdam": page has 0 links, expected 4
- **berlin** `A:14d`: day 4 stop 1 "Depart for Spreewald": page has 0 links, expected 4
- **berlin** `A:14d`: day 8 stop 1 "Depart for Potsdam": page has 0 links, expected 4
- **berlin** `A:14d`: day 11 stop 1 "Depart for Sachsenhausen Memorial": page has 0 links, expected 4
- **berlin** `B:weekday-start`: day 3 stop 1 "Depart for Spreewald": page has 0 links, expected 4
- **berlin** `G:undated`: day 3 stop 1 "Depart for Spreewald": page has 0 links, expected 4
- **berlin** `I:length`: day 3 stop 1 "Depart for Spreewald": page has 0 links, expected 4
- **berlin** `I:travellers`: day 3 stop 1 "Depart for Spreewald": page has 0 links, expected 4
- **berlin** `I:interest`: day 3 stop 1 "Depart for Spreewald": page has 0 links, expected 4
- **berlin** `I:dietary`: day 3 stop 1 "Depart for Spreewald": page has 0 links, expected 4
- **berlin** `I:mobility`: day 3 stop 1 "Depart for Spreewald": page has 0 links, expected 4
- **berlin** `I:swap`: day 3 stop 1 "Depart for Spreewald": page has 0 links, expected 4
- **berlin** `I:shuffle`: day 3 stop 1 "Depart for Spreewald": page has 0 links, expected 4
- **berlin** `I:city`: day 3 stop 1 "Depart for Yarra Valley": page has 0 links, expected 4
- **madrid** `A:7d`: day 3 stop 1 "Depart for Toledo": page has 0 links, expected 4
- **madrid** `A:7d`: day 5 stop 1 "Depart for Segovia": page has 0 links, expected 4
- **madrid** `A:14d`: day 4 stop 1 "Depart for Toledo": page has 0 links, expected 4
- **madrid** `A:14d`: day 8 stop 1 "Depart for Segovia": page has 0 links, expected 4
- **madrid** `A:14d`: day 11 stop 1 "Depart for El Escorial": page has 0 links, expected 4
- **madrid** `B:weekday-start`: day 3 stop 1 "Depart for Toledo": page has 0 links, expected 4
- **madrid** `G:undated`: day 3 stop 1 "Depart for Toledo": page has 0 links, expected 4
- **madrid** `I:length`: day 3 stop 1 "Depart for Toledo": page has 0 links, expected 4
- **madrid** `I:travellers`: day 3 stop 1 "Depart for Toledo": page has 0 links, expected 4
- **madrid** `I:interest`: day 3 stop 1 "Depart for Toledo": page has 0 links, expected 4
- **madrid** `I:dietary`: day 3 stop 1 "Depart for Toledo": page has 0 links, expected 4
- **madrid** `I:mobility`: day 3 stop 1 "Depart for Toledo": page has 0 links, expected 4
- **madrid** `I:swap`: day 3 stop 1 "Depart for Toledo": page has 0 links, expected 4
- **madrid** `I:shuffle`: day 3 stop 1 "Depart for Toledo": page has 0 links, expected 4
- **madrid** `I:city`: day 3 stop 1 "Depart for Nami Island & Petite France": page has 0 links, expected 4
- **milan** `A:7d`: day 3 stop 1 "Depart for Bergamo": page has 0 links, expected 4
- **milan** `A:7d`: day 5 stop 1 "Depart for Lake Como": page has 0 links, expected 4
- **milan** `A:14d`: day 4 stop 1 "Depart for Bergamo": page has 0 links, expected 4
- **milan** `A:14d`: day 8 stop 1 "Depart for Lake Como": page has 0 links, expected 4
- **milan** `A:14d`: day 11 stop 1 "Depart for Lake Maggiore and the Borromean Islands": page has 0 links, expected 4
- **milan** `B:weekday-start`: day 3 stop 1 "Depart for Bergamo": page has 0 links, expected 4
- **milan** `G:undated`: day 3 stop 1 "Depart for Bergamo": page has 0 links, expected 4
- **milan** `I:length`: day 3 stop 1 "Depart for Bergamo": page has 0 links, expected 4
- **milan** `I:travellers`: day 3 stop 1 "Depart for Bergamo": page has 0 links, expected 4
- **milan** `I:interest`: day 3 stop 1 "Depart for Bergamo": page has 0 links, expected 4
- **milan** `I:dietary`: day 3 stop 1 "Depart for Bergamo": page has 0 links, expected 4
- **milan** `I:mobility`: day 3 stop 1 "Depart for Bergamo": page has 0 links, expected 4
- **milan** `I:swap`: day 3 stop 1 "Depart for Bergamo": page has 0 links, expected 4
- **milan** `I:shuffle`: day 3 stop 1 "Depart for Bergamo": page has 0 links, expected 4
- **milan** `I:city`: day 3 stop 1 "Depart for Biscayne National Park": page has 0 links, expected 4
- **florence** `A:7d`: day 3 stop 1 "Depart for Chianti wine region": page has 0 links, expected 4
- **florence** `A:7d`: day 5 stop 1 "Depart for Siena": page has 0 links, expected 4
- **florence** `A:14d`: day 4 stop 1 "Depart for Chianti wine region": page has 0 links, expected 4
- **florence** `A:14d`: day 8 stop 1 "Depart for Siena": page has 0 links, expected 4
- **florence** `A:14d`: day 11 stop 1 "Depart for Pisa": page has 0 links, expected 4
- **florence** `B:weekday-start`: day 3 stop 1 "Depart for Chianti wine region": page has 0 links, expected 4
- **florence** `G:undated`: day 3 stop 1 "Depart for Chianti wine region": page has 0 links, expected 4
- **florence** `I:length`: day 3 stop 1 "Depart for Chianti wine region": page has 0 links, expected 4
- **florence** `I:travellers`: day 3 stop 1 "Depart for Chianti wine region": page has 0 links, expected 4
- **florence** `I:interest`: day 3 stop 1 "Depart for Chianti wine region": page has 0 links, expected 4
- **florence** `I:dietary`: day 3 stop 1 "Depart for Chianti wine region": page has 0 links, expected 4
- **florence** `I:mobility`: day 3 stop 1 "Depart for Chianti wine region": page has 0 links, expected 4
- **florence** `I:swap`: day 3 stop 1 "Depart for Chianti wine region": page has 0 links, expected 4
- **florence** `I:shuffle`: day 3 stop 1 "Depart for Chianti wine region": page has 0 links, expected 4
- **florence** `I:city`: day 3 stop 1 "Depart for Jiufen and Shifen": page has 0 links, expected 4
- **venice** `A:7d`: day 3 stop 1 "Depart for Murano, Burano and Torcello": page has 0 links, expected 4
- **venice** `A:7d`: day 5 stop 1 "Depart for Verona": page has 0 links, expected 4
- **venice** `A:14d`: day 4 stop 1 "Depart for Murano, Burano and Torcello": page has 0 links, expected 4
- **venice** `A:14d`: day 8 stop 1 "Depart for Verona": page has 0 links, expected 4
- **venice** `A:14d`: day 11 stop 1 "Depart for Padua": page has 0 links, expected 4
- **venice** `B:weekday-start`: day 3 stop 1 "Depart for Murano, Burano and Torcello": page has 0 links, expected 4
- **venice** `G:undated`: day 3 stop 1 "Depart for Murano, Burano and Torcello": page has 0 links, expected 4
- **venice** `I:length`: day 3 stop 1 "Depart for Murano, Burano and Torcello": page has 0 links, expected 4
- **venice** `I:travellers`: day 3 stop 1 "Depart for Murano, Burano and Torcello": page has 0 links, expected 4
- **venice** `I:interest`: day 3 stop 1 "Depart for Murano, Burano and Torcello": page has 0 links, expected 4
- **venice** `I:dietary`: day 3 stop 1 "Depart for Murano, Burano and Torcello": page has 0 links, expected 4
- **venice** `I:mobility`: day 3 stop 1 "Depart for Murano, Burano and Torcello": page has 0 links, expected 4
- **venice** `I:swap`: day 3 stop 1 "Depart for Murano, Burano and Torcello": page has 0 links, expected 4
- **venice** `I:shuffle`: day 3 stop 1 "Depart for Murano, Burano and Torcello": page has 0 links, expected 4
- **venice** `I:city`: day 3 stop 1 "Depart for Hermanus": page has 0 links, expected 4
- **athens** `A:7d`: day 3 stop 1 "Depart for Delphi": page has 0 links, expected 4
- **athens** `A:7d`: day 5 stop 1 "Depart for Aegina": page has 0 links, expected 4
- **athens** `A:14d`: day 4 stop 1 "Depart for Delphi": page has 0 links, expected 4
- **athens** `A:14d`: day 8 stop 1 "Depart for Aegina": page has 0 links, expected 4
- **athens** `A:14d`: day 11 stop 1 "Depart for Cape Sounion": page has 0 links, expected 4
- **athens** `B:weekday-start`: day 3 stop 1 "Depart for Delphi": page has 0 links, expected 4
- **athens** `G:undated`: day 3 stop 1 "Depart for Delphi": page has 0 links, expected 4
- **athens** `I:length`: day 3 stop 1 "Depart for Delphi": page has 0 links, expected 4
- **athens** `I:travellers`: day 3 stop 1 "Depart for Delphi": page has 0 links, expected 4
- **athens** `I:interest`: day 3 stop 1 "Depart for Delphi": page has 0 links, expected 4
- **athens** `I:dietary`: day 3 stop 1 "Depart for Delphi": page has 0 links, expected 4
- **athens** `I:mobility`: day 3 stop 1 "Depart for Delphi": page has 0 links, expected 4
- **athens** `I:swap`: day 3 stop 1 "Depart for Delphi": page has 0 links, expected 4
- **athens** `I:shuffle`: day 3 stop 1 "Depart for Delphi": page has 0 links, expected 4
- **athens** `I:city`: day 3 stop 1 "Depart for Abu Dhabi": page has 0 links, expected 4
- **budapest** `A:7d`: day 3 stop 1 "Depart for Danube Bend (Visegrád)": page has 0 links, expected 4
- **budapest** `A:7d`: day 5 stop 1 "Depart for Eger": page has 0 links, expected 4
- **budapest** `A:14d`: day 4 stop 1 "Depart for Danube Bend (Visegrád)": page has 0 links, expected 4
- **budapest** `A:14d`: day 8 stop 1 "Depart for Eger": page has 0 links, expected 4
- **budapest** `A:14d`: day 11 stop 1 "Depart for Szentendre": page has 0 links, expected 4
- **budapest** `B:weekday-start`: day 3 stop 1 "Depart for Danube Bend (Visegrád)": page has 0 links, expected 4
- **budapest** `G:undated`: day 3 stop 1 "Depart for Danube Bend (Visegrád)": page has 0 links, expected 4
- **budapest** `I:length`: day 3 stop 1 "Depart for Danube Bend (Visegrád)": page has 0 links, expected 4
- **budapest** `I:travellers`: day 3 stop 1 "Depart for Danube Bend (Visegrád)": page has 0 links, expected 4
- **budapest** `I:interest`: day 3 stop 1 "Depart for Danube Bend (Visegrád)": page has 0 links, expected 4
- **budapest** `I:dietary`: day 3 stop 1 "Depart for Danube Bend (Visegrád)": page has 0 links, expected 4
- **budapest** `I:mobility`: day 3 stop 1 "Depart for Danube Bend (Visegrád)": page has 0 links, expected 4
- **budapest** `I:swap`: day 3 stop 1 "Depart for Danube Bend (Visegrád)": page has 0 links, expected 4
- **budapest** `I:shuffle`: day 3 stop 1 "Depart for Danube Bend (Visegrád)": page has 0 links, expected 4
- **budapest** `I:city`: day 3 stop 1 "Depart for Niagara-on-the-Lake": page has 0 links, expected 4
- **munich** `A:7d`: day 3 stop 1 "Depart for Garmisch-Partenkirchen and the Zugspitze": page has 0 links, expected 4
- **munich** `A:7d`: day 5 stop 1 "Depart for Salzburg": page has 0 links, expected 4
- **munich** `A:14d`: day 4 stop 1 "Depart for Garmisch-Partenkirchen and the Zugspitze": page has 0 links, expected 4
- **munich** `A:14d`: day 6 stop 1 "Depart for Salzburg": page has 0 links, expected 4
- **munich** `A:14d`: day 9 stop 1 "Depart for Neuschwanstein Castle": page has 0 links, expected 4
- **munich** `A:14d`: day 11 stop 1 "Depart for Dachau Memorial Site": page has 0 links, expected 4
- **munich** `B:weekday-start`: day 3 stop 1 "Depart for Garmisch-Partenkirchen and the Zugspitze": page has 0 links, expected 4
- **munich** `G:undated`: day 3 stop 1 "Depart for Garmisch-Partenkirchen and the Zugspitze": page has 0 links, expected 4
- **munich** `I:length`: day 3 stop 1 "Depart for Garmisch-Partenkirchen and the Zugspitze": page has 0 links, expected 4
- **munich** `I:travellers`: day 3 stop 1 "Depart for Garmisch-Partenkirchen and the Zugspitze": page has 0 links, expected 4
- **munich** `I:interest`: day 3 stop 1 "Depart for Garmisch-Partenkirchen and the Zugspitze": page has 0 links, expected 4
- **munich** `I:dietary`: day 3 stop 1 "Depart for Garmisch-Partenkirchen and the Zugspitze": page has 0 links, expected 4
- **munich** `I:mobility`: day 3 stop 1 "Depart for Garmisch-Partenkirchen and the Zugspitze": page has 0 links, expected 4
- **munich** `I:swap`: day 3 stop 1 "Depart for Garmisch-Partenkirchen and the Zugspitze": page has 0 links, expected 4
- **munich** `I:shuffle`: day 3 stop 1 "Depart for Garmisch-Partenkirchen and the Zugspitze": page has 0 links, expected 4
- **munich** `I:city`: day 3 stop 1 "Depart for Bergamo": page has 0 links, expected 4
- **edinburgh** `A:7d`: day 3 stop 1 "Depart for St Andrews": page has 0 links, expected 4
- **edinburgh** `A:7d`: day 5 stop 1 "Depart for Loch Lomond and the Trossachs": page has 0 links, expected 4
- **edinburgh** `A:14d`: day 4 stop 1 "Depart for St Andrews": page has 0 links, expected 4
- **edinburgh** `A:14d`: day 8 stop 1 "Depart for Loch Lomond and the Trossachs": page has 0 links, expected 4
- **edinburgh** `A:14d`: day 11 stop 1 "Depart for Stirling": page has 0 links, expected 4
- **edinburgh** `B:weekday-start`: day 3 stop 1 "Depart for St Andrews": page has 0 links, expected 4
- **edinburgh** `G:undated`: day 3 stop 1 "Depart for St Andrews": page has 0 links, expected 4
- **edinburgh** `I:length`: day 3 stop 1 "Depart for St Andrews": page has 0 links, expected 4
- **edinburgh** `I:travellers`: day 3 stop 1 "Depart for St Andrews": page has 0 links, expected 4
- **edinburgh** `I:interest`: day 3 stop 1 "Depart for St Andrews": page has 0 links, expected 4
- **edinburgh** `I:dietary`: day 3 stop 1 "Depart for St Andrews": page has 0 links, expected 4
- **edinburgh** `I:mobility`: day 3 stop 1 "Depart for St Andrews": page has 0 links, expected 4
- **edinburgh** `I:swap`: day 3 stop 1 "Depart for St Andrews": page has 0 links, expected 4
- **edinburgh** `I:shuffle`: day 3 stop 1 "Depart for St Andrews": page has 0 links, expected 4
- **edinburgh** `I:city`: day 3 stop 1 "Depart for Delphi": page has 0 links, expected 4
- **dublin** `A:7d`: day 3 stop 1 "Depart for Newgrange and the Boyne Valley": page has 0 links, expected 4
- **dublin** `A:7d`: day 5 stop 1 "Depart for Glendalough": page has 0 links, expected 4
- **dublin** `A:14d`: day 4 stop 1 "Depart for Newgrange and the Boyne Valley": page has 0 links, expected 4
- **dublin** `A:14d`: day 8 stop 1 "Depart for Glendalough": page has 0 links, expected 4
- **dublin** `A:14d`: day 11 stop 1 "Depart for Howth": page has 0 links, expected 4
- **dublin** `B:weekday-start`: day 3 stop 1 "Depart for Newgrange and the Boyne Valley": page has 0 links, expected 4
- **dublin** `G:undated`: day 3 stop 1 "Depart for Newgrange and the Boyne Valley": page has 0 links, expected 4
- **dublin** `I:length`: day 3 stop 1 "Depart for Newgrange and the Boyne Valley": page has 0 links, expected 4
- **dublin** `I:travellers`: day 3 stop 1 "Depart for Newgrange and the Boyne Valley": page has 0 links, expected 4
- **dublin** `I:interest`: day 3 stop 1 "Depart for Newgrange and the Boyne Valley": page has 0 links, expected 4
- **dublin** `I:dietary`: day 3 stop 1 "Depart for Newgrange and the Boyne Valley": page has 0 links, expected 4
- **dublin** `I:mobility`: day 3 stop 1 "Depart for Newgrange and the Boyne Valley": page has 0 links, expected 4
- **dublin** `I:swap`: day 3 stop 1 "Depart for Newgrange and the Boyne Valley": page has 0 links, expected 4
- **dublin** `I:shuffle`: day 3 stop 1 "Depart for Newgrange and the Boyne Valley": page has 0 links, expected 4
- **dublin** `I:city`: day 3 stop 1 "Depart for Napa and Sonoma": page has 0 links, expected 4
- **brussels** `A:7d`: day 3 stop 1 "Depart for Bruges": page has 0 links, expected 4
- **brussels** `A:7d`: day 5 stop 1 "Depart for Antwerp": page has 0 links, expected 4
- **brussels** `A:14d`: day 4 stop 1 "Depart for Bruges": page has 0 links, expected 4
- **brussels** `A:14d`: day 8 stop 1 "Depart for Antwerp": page has 0 links, expected 4
- **brussels** `A:14d`: day 11 stop 1 "Depart for Ghent": page has 0 links, expected 4
- **brussels** `B:weekday-start`: day 3 stop 1 "Depart for Bruges": page has 0 links, expected 4
- **brussels** `G:undated`: day 3 stop 1 "Depart for Bruges": page has 0 links, expected 4
- **brussels** `I:length`: day 3 stop 1 "Depart for Bruges": page has 0 links, expected 4
- **brussels** `I:travellers`: day 3 stop 1 "Depart for Bruges": page has 0 links, expected 4
- **brussels** `I:interest`: day 3 stop 1 "Depart for Bruges": page has 0 links, expected 4
- **brussels** `I:dietary`: day 3 stop 1 "Depart for Bruges": page has 0 links, expected 4
- **brussels** `I:mobility`: day 3 stop 1 "Depart for Bruges": page has 0 links, expected 4
- **brussels** `I:swap`: day 3 stop 1 "Depart for Bruges": page has 0 links, expected 4
- **brussels** `I:shuffle`: day 3 stop 1 "Depart for Bruges": page has 0 links, expected 4
- **brussels** `I:city`: day 3 stop 1 "Depart for San Antonio de Areco": page has 0 links, expected 4
- **stockholm** `A:7d`: day 3 stop 1 "Depart for Vaxholm and the archipelago": page has 0 links, expected 4
- **stockholm** `A:7d`: day 5 stop 1 "Depart for Uppsala": page has 0 links, expected 4
- **stockholm** `A:14d`: day 4 stop 1 "Depart for Vaxholm and the archipelago": page has 0 links, expected 4
- **stockholm** `A:14d`: day 8 stop 1 "Depart for Uppsala": page has 0 links, expected 4
- **stockholm** `A:14d`: day 11 stop 1 "Depart for Drottningholm Palace": page has 0 links, expected 4
- **stockholm** `B:weekday-start`: day 3 stop 1 "Depart for Vaxholm and the archipelago": page has 0 links, expected 4
- **stockholm** `G:undated`: day 3 stop 1 "Depart for Vaxholm and the archipelago": page has 0 links, expected 4
- **stockholm** `I:length`: day 3 stop 1 "Depart for Vaxholm and the archipelago": page has 0 links, expected 4
- **stockholm** `I:travellers`: day 3 stop 1 "Depart for Vaxholm and the archipelago": page has 0 links, expected 4
- **stockholm** `I:interest`: day 3 stop 1 "Depart for Vaxholm and the archipelago": page has 0 links, expected 4
- **stockholm** `I:dietary`: day 3 stop 1 "Depart for Vaxholm and the archipelago": page has 0 links, expected 4
- **stockholm** `I:mobility`: day 3 stop 1 "Depart for Vaxholm and the archipelago": page has 0 links, expected 4
- **stockholm** `I:swap`: day 3 stop 1 "Depart for Vaxholm and the archipelago": page has 0 links, expected 4
- **stockholm** `I:shuffle`: day 3 stop 1 "Depart for Vaxholm and the archipelago": page has 0 links, expected 4
- **stockholm** `I:city`: day 3 stop 1 "Depart for Hermanus": page has 0 links, expected 4
- **krakow** `A:7d`: day 3 stop 1 "Depart for Auschwitz-Birkenau": page has 0 links, expected 4
- **krakow** `A:7d`: day 5 stop 1 "Depart for Zakopane and the Tatra Mountains": page has 0 links, expected 4
- **krakow** `A:14d`: day 4 stop 1 "Depart for Auschwitz-Birkenau": page has 0 links, expected 4
- **krakow** `A:14d`: day 8 stop 1 "Depart for Zakopane and the Tatra Mountains": page has 0 links, expected 4
- **krakow** `A:14d`: day 11 stop 1 "Depart for Wieliczka Salt Mine": page has 0 links, expected 4
- **krakow** `B:weekday-start`: day 3 stop 1 "Depart for Auschwitz-Birkenau": page has 0 links, expected 4
- **krakow** `G:undated`: day 3 stop 1 "Depart for Auschwitz-Birkenau": page has 0 links, expected 4
- **krakow** `I:length`: day 3 stop 1 "Depart for Auschwitz-Birkenau": page has 0 links, expected 4
- **krakow** `I:travellers`: day 3 stop 1 "Depart for Auschwitz-Birkenau": page has 0 links, expected 4
- **krakow** `I:interest`: day 3 stop 1 "Depart for Auschwitz-Birkenau": page has 0 links, expected 4
- **krakow** `I:dietary`: day 3 stop 1 "Depart for Auschwitz-Birkenau": page has 0 links, expected 4
- **krakow** `I:mobility`: day 3 stop 1 "Depart for Auschwitz-Birkenau": page has 0 links, expected 4
- **krakow** `I:swap`: day 3 stop 1 "Depart for Auschwitz-Birkenau": page has 0 links, expected 4
- **krakow** `I:shuffle`: day 3 stop 1 "Depart for Auschwitz-Birkenau": page has 0 links, expected 4
- **krakow** `I:city`: day 3 stop 1 "Depart for Kutná Hora": page has 0 links, expected 4
- **marrakesh** `A:7d`: day 3 stop 1 "Depart for Essaouira": page has 0 links, expected 4
- **marrakesh** `A:7d`: day 5 stop 1 "Depart for Ouzoud Waterfalls": page has 0 links, expected 4
- **marrakesh** `A:14d`: day 4 stop 1 "Depart for Essaouira": page has 0 links, expected 4
- **marrakesh** `A:14d`: day 6 stop 1 "Depart for Ouzoud Waterfalls": page has 0 links, expected 4
- **marrakesh** `A:14d`: day 9 stop 1 "Depart for Aït Benhaddou and Ouarzazate": page has 0 links, expected 4
- **marrakesh** `A:14d`: day 11 stop 1 "Depart for Ourika Valley and the High Atlas": page has 0 links, expected 4
- **marrakesh** `B:weekday-start`: day 3 stop 1 "Depart for Essaouira": page has 0 links, expected 4
- **marrakesh** `G:undated`: day 3 stop 1 "Depart for Essaouira": page has 0 links, expected 4
- **marrakesh** `I:length`: day 3 stop 1 "Depart for Essaouira": page has 0 links, expected 4
- **marrakesh** `I:travellers`: day 3 stop 1 "Depart for Essaouira": page has 0 links, expected 4
- **marrakesh** `I:interest`: day 3 stop 1 "Depart for Essaouira": page has 0 links, expected 4
- **marrakesh** `I:dietary`: day 3 stop 1 "Depart for Essaouira": page has 0 links, expected 4
- **marrakesh** `I:mobility`: day 3 stop 1 "Depart for Essaouira": page has 0 links, expected 4
- **marrakesh** `I:swap`: day 3 stop 1 "Depart for Essaouira": page has 0 links, expected 4
- **marrakesh** `I:shuffle`: day 3 stop 1 "Depart for Essaouira": page has 0 links, expected 4
- **marrakesh** `I:city`: day 3 stop 1 "Depart for Royal National Park": page has 0 links, expected 4
- **cairo** `A:7d`: day 3 stop 1 "Depart for Alexandria": page has 0 links, expected 4
- **cairo** `A:7d`: day 5 stop 1 "Depart for Saqqara and Dahshur": page has 0 links, expected 4
- **cairo** `A:14d`: day 4 stop 1 "Depart for Alexandria": page has 0 links, expected 4
- **cairo** `A:14d`: day 8 stop 1 "Depart for Saqqara and Dahshur": page has 0 links, expected 4
- **cairo** `A:14d`: day 11 stop 1 "Depart for Fayoum Oasis": page has 0 links, expected 4
- **cairo** `B:weekday-start`: day 3 stop 1 "Depart for Alexandria": page has 0 links, expected 4
- **cairo** `G:undated`: day 3 stop 1 "Depart for Alexandria": page has 0 links, expected 4
- **cairo** `I:length`: day 3 stop 1 "Depart for Alexandria": page has 0 links, expected 4
- **cairo** `I:travellers`: day 3 stop 1 "Depart for Alexandria": page has 0 links, expected 4
- **cairo** `I:interest`: day 3 stop 1 "Depart for Alexandria": page has 0 links, expected 4
- **cairo** `I:dietary`: day 3 stop 1 "Depart for Alexandria": page has 0 links, expected 4
- **cairo** `I:mobility`: day 3 stop 1 "Depart for Alexandria": page has 0 links, expected 4
- **cairo** `I:swap`: day 3 stop 1 "Depart for Alexandria": page has 0 links, expected 4
- **cairo** `I:shuffle`: day 3 stop 1 "Depart for Alexandria": page has 0 links, expected 4
- **cairo** `I:city`: day 3 stop 1 "Depart for Royal National Park": page has 0 links, expected 4
- **cape-town** `A:7d`: day 3 stop 1 "Depart for Hermanus": page has 0 links, expected 4
- **cape-town** `A:7d`: day 5 stop 1 "Depart for Stellenbosch and Franschhoek Winelands": page has 0 links, expected 4
- **cape-town** `A:14d`: day 4 stop 1 "Depart for Hermanus": page has 0 links, expected 4
- **cape-town** `A:14d`: day 8 stop 1 "Depart for Stellenbosch and Franschhoek Winelands": page has 0 links, expected 4
- **cape-town** `A:14d`: day 11 stop 1 "Depart for Cape Peninsula (Cape Point and Boulders Beach)": page has 0 links, expected 4
- **cape-town** `B:weekday-start`: day 3 stop 1 "Depart for Hermanus": page has 0 links, expected 4
- **cape-town** `G:undated`: day 3 stop 1 "Depart for Hermanus": page has 0 links, expected 4
- **cape-town** `I:length`: day 3 stop 1 "Depart for Hermanus": page has 0 links, expected 4
- **cape-town** `I:travellers`: day 3 stop 1 "Depart for Hermanus": page has 0 links, expected 4
- **cape-town** `I:interest`: day 3 stop 1 "Depart for Hermanus": page has 0 links, expected 4
- **cape-town** `I:dietary`: day 3 stop 1 "Depart for Hermanus": page has 0 links, expected 4
- **cape-town** `I:mobility`: day 3 stop 1 "Depart for Hermanus": page has 0 links, expected 4
- **cape-town** `I:swap`: day 3 stop 1 "Depart for Hermanus": page has 0 links, expected 4
- **cape-town** `I:shuffle`: day 3 stop 1 "Depart for Hermanus": page has 0 links, expected 4
- **cape-town** `I:city`: day 3 stop 1 "Depart for Alexandria": page has 0 links, expected 4
- **mexico-city** `A:7d`: day 3 stop 1 "Depart for Puebla and Cholula": page has 0 links, expected 4
- **mexico-city** `A:7d`: day 5 stop 1 "Depart for Tepoztlán": page has 0 links, expected 4
- **mexico-city** `A:14d`: day 4 stop 1 "Depart for Puebla and Cholula": page has 0 links, expected 4
- **mexico-city** `A:14d`: day 8 stop 1 "Depart for Tepoztlán": page has 0 links, expected 4
- **mexico-city** `A:14d`: day 11 stop 1 "Depart for Teotihuacán": page has 0 links, expected 4
- **mexico-city** `B:weekday-start`: day 3 stop 1 "Depart for Puebla and Cholula": page has 0 links, expected 4
- **mexico-city** `G:undated`: day 3 stop 1 "Depart for Puebla and Cholula": page has 0 links, expected 4
- **mexico-city** `I:length`: day 3 stop 1 "Depart for Puebla and Cholula": page has 0 links, expected 4
- **mexico-city** `I:travellers`: day 3 stop 1 "Depart for Puebla and Cholula": page has 0 links, expected 4
- **mexico-city** `I:interest`: day 3 stop 1 "Depart for Puebla and Cholula": page has 0 links, expected 4
- **mexico-city** `I:dietary`: day 3 stop 1 "Depart for Puebla and Cholula": page has 0 links, expected 4
- **mexico-city** `I:mobility`: day 3 stop 1 "Depart for Puebla and Cholula": page has 0 links, expected 4
- **mexico-city** `I:swap`: day 3 stop 1 "Depart for Puebla and Cholula": page has 0 links, expected 4
- **mexico-city** `I:shuffle`: day 3 stop 1 "Depart for Puebla and Cholula": page has 0 links, expected 4
- **mexico-city** `I:city`: day 3 stop 1 "Depart for Kanchanaburi": page has 0 links, expected 5
- **buenos-aires** `A:7d`: day 3 stop 1 "Depart for San Antonio de Areco": page has 0 links, expected 4
- **buenos-aires** `A:7d`: day 5 stop 1 "Depart for Colonia del Sacramento": page has 0 links, expected 4
- **buenos-aires** `A:14d`: day 4 stop 1 "Depart for San Antonio de Areco": page has 0 links, expected 4
- **buenos-aires** `A:14d`: day 8 stop 1 "Depart for Colonia del Sacramento": page has 0 links, expected 4
- **buenos-aires** `A:14d`: day 11 stop 1 "Depart for Tigre and the Paraná Delta": page has 0 links, expected 4
- **buenos-aires** `B:weekday-start`: day 3 stop 1 "Depart for San Antonio de Areco": page has 0 links, expected 4
- **buenos-aires** `G:undated`: day 3 stop 1 "Depart for San Antonio de Areco": page has 0 links, expected 4
- **buenos-aires** `I:length`: day 3 stop 1 "Depart for San Antonio de Areco": page has 0 links, expected 4
- **buenos-aires** `I:travellers`: day 3 stop 1 "Depart for San Antonio de Areco": page has 0 links, expected 4
- **buenos-aires** `I:interest`: day 3 stop 1 "Depart for San Antonio de Areco": page has 0 links, expected 4
- **buenos-aires** `I:dietary`: day 3 stop 1 "Depart for San Antonio de Areco": page has 0 links, expected 4
- **buenos-aires** `I:mobility`: day 3 stop 1 "Depart for San Antonio de Areco": page has 0 links, expected 4
- **buenos-aires** `I:swap`: day 3 stop 1 "Depart for San Antonio de Areco": page has 0 links, expected 4
- **buenos-aires** `I:shuffle`: day 3 stop 1 "Depart for San Antonio de Areco": page has 0 links, expected 4
- **buenos-aires** `I:city`: day 3 stop 1 "Depart for Johor Bahru": page has 0 links, expected 5
- **rio-de-janeiro** `A:7d`: day 3 stop 1 "Depart for Petrópolis": page has 0 links, expected 4
- **rio-de-janeiro** `A:7d`: day 5 stop 1 "Depart for Paraty": page has 0 links, expected 4
- **rio-de-janeiro** `A:14d`: day 4 stop 1 "Depart for Petrópolis": page has 0 links, expected 4
- **rio-de-janeiro** `A:14d`: day 8 stop 1 "Depart for Paraty": page has 0 links, expected 4
- **rio-de-janeiro** `A:14d`: day 11 stop 1 "Depart for Ilha Grande": page has 0 links, expected 4
- **rio-de-janeiro** `B:weekday-start`: day 3 stop 1 "Depart for Petrópolis": page has 0 links, expected 4
- **rio-de-janeiro** `G:undated`: day 3 stop 1 "Depart for Petrópolis": page has 0 links, expected 4
- **rio-de-janeiro** `I:length`: day 3 stop 1 "Depart for Petrópolis": page has 0 links, expected 4
- **rio-de-janeiro** `I:travellers`: day 3 stop 1 "Depart for Petrópolis": page has 0 links, expected 4
- **rio-de-janeiro** `I:interest`: day 3 stop 1 "Depart for Petrópolis": page has 0 links, expected 4
- **rio-de-janeiro** `I:dietary`: day 3 stop 1 "Depart for Petrópolis": page has 0 links, expected 4
- **rio-de-janeiro** `I:mobility`: day 3 stop 1 "Depart for Petrópolis": page has 0 links, expected 4
- **rio-de-janeiro** `I:swap`: day 3 stop 1 "Depart for Petrópolis": page has 0 links, expected 4
- **rio-de-janeiro** `I:shuffle`: day 3 stop 1 "Depart for Petrópolis": page has 0 links, expected 4
- **rio-de-janeiro** `I:city`: day 3 stop 1 "Depart for Danube Bend (Visegrád)": page has 0 links, expected 4
- **toronto** `A:7d`: day 3 stop 1 "Depart for Niagara-on-the-Lake": page has 0 links, expected 4
- **toronto** `A:7d`: day 5 stop 1 "Depart for Niagara Falls": page has 0 links, expected 4
- **toronto** `A:14d`: day 4 stop 1 "Depart for Niagara-on-the-Lake": page has 0 links, expected 4
- **toronto** `A:14d`: day 8 stop 1 "Depart for Niagara Falls": page has 0 links, expected 4
- **toronto** `A:14d`: day 11 stop 1 "Depart for Elora Gorge": page has 0 links, expected 4
- **toronto** `B:weekday-start`: day 3 stop 1 "Depart for Niagara-on-the-Lake": page has 0 links, expected 4
- **toronto** `G:undated`: day 3 stop 1 "Depart for Niagara-on-the-Lake": page has 0 links, expected 4
- **toronto** `I:length`: day 3 stop 1 "Depart for Niagara-on-the-Lake": page has 0 links, expected 4
- **toronto** `I:travellers`: day 3 stop 1 "Depart for Niagara-on-the-Lake": page has 0 links, expected 4
- **toronto** `I:interest`: day 3 stop 1 "Depart for Niagara-on-the-Lake": page has 0 links, expected 4
- **toronto** `I:dietary`: day 3 stop 1 "Depart for Niagara-on-the-Lake": page has 0 links, expected 4
- **toronto** `I:mobility`: day 3 stop 1 "Depart for Niagara-on-the-Lake": page has 0 links, expected 4
- **toronto** `I:swap`: day 3 stop 1 "Depart for Niagara-on-the-Lake": page has 0 links, expected 4
- **toronto** `I:shuffle`: day 3 stop 1 "Depart for Niagara-on-the-Lake": page has 0 links, expected 4
- **toronto** `I:city`: day 3 stop 1 "Depart for Orvieto": page has 0 links, expected 4
- **san-francisco** `A:7d`: day 3 stop 1 "Depart for Napa and Sonoma": page has 0 links, expected 4
- **san-francisco** `A:7d`: day 5 stop 1 "Depart for Muir Woods and Sausalito": page has 0 links, expected 4
- **san-francisco** `A:14d`: day 4 stop 1 "Depart for Napa and Sonoma": page has 0 links, expected 4
- **san-francisco** `A:14d`: day 8 stop 1 "Depart for Muir Woods and Sausalito": page has 0 links, expected 4
- **san-francisco** `A:14d`: day 11 stop 1 "Depart for Monterey and Carmel": page has 0 links, expected 4
- **san-francisco** `B:weekday-start`: day 3 stop 1 "Depart for Napa and Sonoma": page has 0 links, expected 4
- **san-francisco** `G:undated`: day 3 stop 1 "Depart for Napa and Sonoma": page has 0 links, expected 4
- **san-francisco** `I:length`: day 3 stop 1 "Depart for Napa and Sonoma": page has 0 links, expected 4
- **san-francisco** `I:travellers`: day 3 stop 1 "Depart for Napa and Sonoma": page has 0 links, expected 4
- **san-francisco** `I:interest`: day 3 stop 1 "Depart for Napa and Sonoma": page has 0 links, expected 4
- **san-francisco** `I:dietary`: day 3 stop 1 "Depart for Napa and Sonoma": page has 0 links, expected 4
- **san-francisco** `I:mobility`: day 3 stop 1 "Depart for Napa and Sonoma": page has 0 links, expected 4
- **san-francisco** `I:swap`: day 3 stop 1 "Depart for Napa and Sonoma": page has 0 links, expected 4
- **san-francisco** `I:shuffle`: day 3 stop 1 "Depart for Napa and Sonoma": page has 0 links, expected 4
- **san-francisco** `I:city`: day 3 stop 1 "Depart for Danube Bend (Visegrád)": page has 0 links, expected 4
- **chicago** `A:7d`: day 3 stop 1 "Depart for Indiana Dunes National Park": page has 0 links, expected 4
- **chicago** `A:7d`: day 5 stop 1 "Depart for Milwaukee": page has 0 links, expected 4
- **chicago** `A:14d`: day 4 stop 1 "Depart for Indiana Dunes National Park": page has 0 links, expected 4
- **chicago** `A:14d`: day 8 stop 1 "Depart for Milwaukee": page has 0 links, expected 4
- **chicago** `A:14d`: day 11 stop 1 "Depart for Oak Park": page has 0 links, expected 4
- **chicago** `B:weekday-start`: day 3 stop 1 "Depart for Indiana Dunes National Park": page has 0 links, expected 4
- **chicago** `G:undated`: day 3 stop 1 "Depart for Indiana Dunes National Park": page has 0 links, expected 4
- **chicago** `I:length`: day 3 stop 1 "Depart for Indiana Dunes National Park": page has 0 links, expected 4
- **chicago** `I:travellers`: day 3 stop 1 "Depart for Indiana Dunes National Park": page has 0 links, expected 4
- **chicago** `I:interest`: day 3 stop 1 "Depart for Indiana Dunes National Park": page has 0 links, expected 4
- **chicago** `I:dietary`: day 3 stop 1 "Depart for Indiana Dunes National Park": page has 0 links, expected 4
- **chicago** `I:mobility`: day 3 stop 1 "Depart for Indiana Dunes National Park": page has 0 links, expected 4
- **chicago** `I:swap`: day 3 stop 1 "Depart for Indiana Dunes National Park": page has 0 links, expected 4
- **chicago** `I:shuffle`: day 3 stop 1 "Depart for Indiana Dunes National Park": page has 0 links, expected 4
- **chicago** `I:city`: day 3 stop 1 "Depart for Jiufen and Shifen": page has 0 links, expected 4
- **miami** `A:7d`: day 3 stop 1 "Depart for Biscayne National Park": page has 0 links, expected 4
- **miami** `A:7d`: day 5 stop 1 "Depart for Everglades National Park": page has 0 links, expected 4
- **miami** `A:14d`: day 4 stop 1 "Depart for Biscayne National Park": page has 0 links, expected 4
- **miami** `A:14d`: day 8 stop 1 "Depart for Everglades National Park": page has 0 links, expected 4
- **miami** `A:14d`: day 11 stop 1 "Depart for Florida Keys and Key West": page has 0 links, expected 4
- **miami** `B:weekday-start`: day 3 stop 1 "Depart for Biscayne National Park": page has 0 links, expected 4
- **miami** `G:undated`: day 3 stop 1 "Depart for Biscayne National Park": page has 0 links, expected 4
- **miami** `I:length`: day 3 stop 1 "Depart for Biscayne National Park": page has 0 links, expected 4
- **miami** `I:travellers`: day 3 stop 1 "Depart for Biscayne National Park": page has 0 links, expected 4
- **miami** `I:interest`: day 3 stop 1 "Depart for Biscayne National Park": page has 0 links, expected 4
- **miami** `I:dietary`: day 3 stop 1 "Depart for Biscayne National Park": page has 0 links, expected 4
- **miami** `I:mobility`: day 3 stop 1 "Depart for Biscayne National Park": page has 0 links, expected 4
- **miami** `I:swap`: day 3 stop 1 "Depart for Biscayne National Park": page has 0 links, expected 4
- **miami** `I:shuffle`: day 3 stop 1 "Depart for Biscayne National Park": page has 0 links, expected 4
- **miami** `I:city`: day 3 stop 1 "Depart for Alibaug": page has 0 links, expected 4
- **kyoto** `A:7d`: day 3 stop 1 "Depart for Nara": page has 0 links, expected 4
- **kyoto** `A:7d`: day 5 stop 1 "Depart for Himeji Castle": page has 0 links, expected 4
- **kyoto** `A:14d`: day 4 stop 1 "Depart for Nara": page has 0 links, expected 4
- **kyoto** `A:14d`: day 8 stop 1 "Depart for Himeji Castle": page has 0 links, expected 4
- **kyoto** `A:14d`: day 11 stop 1 "Depart for Uji": page has 0 links, expected 4
- **kyoto** `B:weekday-start`: day 3 stop 1 "Depart for Nara": page has 0 links, expected 4
- **kyoto** `G:undated`: day 3 stop 1 "Depart for Nara": page has 0 links, expected 4
- **kyoto** `I:length`: day 3 stop 1 "Depart for Nara": page has 0 links, expected 4
- **kyoto** `I:travellers`: day 3 stop 1 "Depart for Nara": page has 0 links, expected 4
- **kyoto** `I:interest`: day 3 stop 1 "Depart for Nara": page has 0 links, expected 4
- **kyoto** `I:dietary`: day 3 stop 1 "Depart for Nara": page has 0 links, expected 4
- **kyoto** `I:mobility`: day 3 stop 1 "Depart for Nara": page has 0 links, expected 4
- **kyoto** `I:swap`: day 3 stop 1 "Depart for Nara": page has 0 links, expected 4
- **kyoto** `I:shuffle`: day 3 stop 1 "Depart for Nara": page has 0 links, expected 4
- **kyoto** `I:city`: day 3 stop 1 "Depart for Hermanus": page has 0 links, expected 4
- **osaka** `A:7d`: day 3 stop 1 "Depart for Nara": page has 0 links, expected 4
- **osaka** `A:7d`: day 5 stop 1 "Depart for Himeji Castle": page has 0 links, expected 4
- **osaka** `A:14d`: day 4 stop 1 "Depart for Nara": page has 0 links, expected 4
- **osaka** `A:14d`: day 8 stop 1 "Depart for Himeji Castle": page has 0 links, expected 4
- **osaka** `A:14d`: day 11 stop 1 "Depart for Koyasan": page has 0 links, expected 4
- **osaka** `B:weekday-start`: day 3 stop 1 "Depart for Nara": page has 0 links, expected 4
- **osaka** `G:undated`: day 3 stop 1 "Depart for Nara": page has 0 links, expected 4
- **osaka** `I:length`: day 3 stop 1 "Depart for Nara": page has 0 links, expected 4
- **osaka** `I:travellers`: day 3 stop 1 "Depart for Nara": page has 0 links, expected 4
- **osaka** `I:interest`: day 3 stop 1 "Depart for Nara": page has 0 links, expected 4
- **osaka** `I:dietary`: day 3 stop 1 "Depart for Nara": page has 0 links, expected 4
- **osaka** `I:mobility`: day 3 stop 1 "Depart for Nara": page has 0 links, expected 4
- **osaka** `I:swap`: day 3 stop 1 "Depart for Nara": page has 0 links, expected 4
- **osaka** `I:shuffle`: day 3 stop 1 "Depart for Nara": page has 0 links, expected 4
- **osaka** `I:city`: day 3 stop 1 "Depart for Niagara-on-the-Lake": page has 0 links, expected 4
- **taipei** `A:7d`: day 3 stop 1 "Depart for Jiufen and Shifen": page has 0 links, expected 4
- **taipei** `A:7d`: day 5 stop 1 "Depart for Tamsui": page has 0 links, expected 4
- **taipei** `A:14d`: day 4 stop 1 "Depart for Jiufen and Shifen": page has 0 links, expected 4
- **taipei** `A:14d`: day 6 stop 1 "Depart for Tamsui": page has 0 links, expected 4
- **taipei** `A:14d`: day 9 stop 1 "Depart for Yangmingshan National Park": page has 0 links, expected 4
- **taipei** `A:14d`: day 11 stop 1 "Depart for Taroko Gorge": page has 0 links, expected 4
- **taipei** `B:weekday-start`: day 3 stop 1 "Depart for Jiufen and Shifen": page has 0 links, expected 4
- **taipei** `G:undated`: day 3 stop 1 "Depart for Jiufen and Shifen": page has 0 links, expected 4
- **taipei** `I:length`: day 3 stop 1 "Depart for Jiufen and Shifen": page has 0 links, expected 4
- **taipei** `I:travellers`: day 3 stop 1 "Depart for Jiufen and Shifen": page has 0 links, expected 4
- **taipei** `I:interest`: day 3 stop 1 "Depart for Jiufen and Shifen": page has 0 links, expected 4
- **taipei** `I:dietary`: day 3 stop 1 "Depart for Jiufen and Shifen": page has 0 links, expected 4
- **taipei** `I:mobility`: day 3 stop 1 "Depart for Jiufen and Shifen": page has 0 links, expected 4
- **taipei** `I:swap`: day 3 stop 1 "Depart for Jiufen and Shifen": page has 0 links, expected 4
- **taipei** `I:shuffle`: day 3 stop 1 "Depart for Jiufen and Shifen": page has 0 links, expected 4
- **taipei** `I:city`: day 3 stop 1 "Depart for Napa and Sonoma": page has 0 links, expected 4
- **hanoi** `A:7d`: day 3 stop 1 "Depart for Ninh Binh (Trang An and Tam Coc)": page has 0 links, expected 4
- **hanoi** `A:7d`: day 5 stop 1 "Depart for Ha Long Bay and Lan Ha Bay": page has 0 links, expected 4
- **hanoi** `A:14d`: day 4 stop 1 "Depart for Ninh Binh (Trang An and Tam Coc)": page has 0 links, expected 4
- **hanoi** `A:14d`: day 8 stop 1 "Depart for Ha Long Bay and Lan Ha Bay": page has 0 links, expected 4
- **hanoi** `A:14d`: day 11 stop 1 "Depart for Bat Trang Pottery Village": page has 0 links, expected 4
- **hanoi** `B:weekday-start`: day 3 stop 1 "Depart for Ninh Binh (Trang An and Tam Coc)": page has 0 links, expected 4
- **hanoi** `G:undated`: day 3 stop 1 "Depart for Ninh Binh (Trang An and Tam Coc)": page has 0 links, expected 4
- **hanoi** `I:length`: day 3 stop 1 "Depart for Ninh Binh (Trang An and Tam Coc)": page has 0 links, expected 4
- **hanoi** `I:travellers`: day 3 stop 1 "Depart for Ninh Binh (Trang An and Tam Coc)": page has 0 links, expected 4
- **hanoi** `I:interest`: day 3 stop 1 "Depart for Ninh Binh (Trang An and Tam Coc)": page has 0 links, expected 4
- **hanoi** `I:dietary`: day 3 stop 1 "Depart for Ninh Binh (Trang An and Tam Coc)": page has 0 links, expected 4
- **hanoi** `I:mobility`: day 3 stop 1 "Depart for Ninh Binh (Trang An and Tam Coc)": page has 0 links, expected 4
- **hanoi** `I:swap`: day 3 stop 1 "Depart for Ninh Binh (Trang An and Tam Coc)": page has 0 links, expected 4
- **hanoi** `I:shuffle`: day 3 stop 1 "Depart for Ninh Binh (Trang An and Tam Coc)": page has 0 links, expected 4
- **hanoi** `I:city`: day 3 stop 1 "Depart for Indiana Dunes National Park": page has 0 links, expected 4
- **mumbai** `A:7d`: day 3 stop 1 "Depart for Alibaug": page has 0 links, expected 4
- **mumbai** `A:7d`: day 5 stop 1 "Depart for Lonavala and the Karla and Bhaja Caves": page has 0 links, expected 4
- **mumbai** `A:14d`: day 4 stop 1 "Depart for Alibaug": page has 0 links, expected 4
- **mumbai** `A:14d`: day 8 stop 1 "Depart for Lonavala and the Karla and Bhaja Caves": page has 0 links, expected 4
- **mumbai** `A:14d`: day 11 stop 1 "Depart for Elephanta Island": page has 0 links, expected 4
- **mumbai** `B:weekday-start`: day 3 stop 1 "Depart for Alibaug": page has 0 links, expected 4
- **mumbai** `G:undated`: day 3 stop 1 "Depart for Alibaug": page has 0 links, expected 4
- **mumbai** `I:length`: day 3 stop 1 "Depart for Alibaug": page has 0 links, expected 4
- **mumbai** `I:travellers`: day 3 stop 1 "Depart for Alibaug": page has 0 links, expected 4
- **mumbai** `I:interest`: day 3 stop 1 "Depart for Alibaug": page has 0 links, expected 4
- **mumbai** `I:dietary`: day 3 stop 1 "Depart for Alibaug": page has 0 links, expected 4
- **mumbai** `I:mobility`: day 3 stop 1 "Depart for Alibaug": page has 0 links, expected 4
- **mumbai** `I:swap`: day 3 stop 1 "Depart for Alibaug": page has 0 links, expected 4
- **mumbai** `I:shuffle`: day 3 stop 1 "Depart for Alibaug": page has 0 links, expected 4
- **mumbai** `I:city`: day 3 stop 1 "Depart for Malacca (Melaka)": page has 0 links, expected 5
- **melbourne** `A:7d`: day 3 stop 1 "Depart for Yarra Valley": page has 0 links, expected 4
- **melbourne** `A:7d`: day 5 stop 1 "Depart for Phillip Island Penguin Parade": page has 0 links, expected 4
- **melbourne** `A:14d`: day 4 stop 1 "Depart for Yarra Valley": page has 0 links, expected 4
- **melbourne** `A:14d`: day 8 stop 1 "Depart for Phillip Island Penguin Parade": page has 0 links, expected 4
- **melbourne** `A:14d`: day 11 stop 1 "Depart for Great Ocean Road": page has 0 links, expected 4
- **melbourne** `B:weekday-start`: day 3 stop 1 "Depart for Yarra Valley": page has 0 links, expected 4
- **melbourne** `G:undated`: day 3 stop 1 "Depart for Yarra Valley": page has 0 links, expected 4
- **melbourne** `I:length`: day 3 stop 1 "Depart for Yarra Valley": page has 0 links, expected 4
- **melbourne** `I:travellers`: day 3 stop 1 "Depart for Yarra Valley": page has 0 links, expected 4
- **melbourne** `I:interest`: day 3 stop 1 "Depart for Yarra Valley": page has 0 links, expected 4
- **melbourne** `I:dietary`: day 3 stop 1 "Depart for Yarra Valley": page has 0 links, expected 4
- **melbourne** `I:mobility`: day 3 stop 1 "Depart for Yarra Valley": page has 0 links, expected 4
- **melbourne** `I:swap`: day 3 stop 1 "Depart for Yarra Valley": page has 0 links, expected 4
- **melbourne** `I:shuffle`: day 3 stop 1 "Depart for Yarra Valley": page has 0 links, expected 4
- **melbourne** `I:city`: day 3 stop 1 "Depart for Petrópolis": page has 0 links, expected 4

### `price.range` (269)

likely price falls outside [min, max]

- **london** `A:3d`: day 2 09:56 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `A:3d`: day 2 14:08 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `A:7d`: day 2 09:56 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `A:7d`: day 2 14:04 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `A:14d`: day 2 09:56 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `A:14d`: day 2 14:04 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `B:weekday-start`: day 2 09:56 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `B:weekday-start`: day 2 14:04 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `B:weekend-start`: day 2 10:15 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `B:weekend-start`: day 2 14:27 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `B:closed-day`: day 2 10:15 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `B:closed-day`: day 2 14:27 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `C:1-pax`: day 2 09:56 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `C:1-pax`: day 2 14:08 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `C:2-pax`: day 2 09:56 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `C:2-pax`: day 2 14:08 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `C:max-pax`: day 2 09:56 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `D:history`: day 2 09:56 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `D:history`: day 2 14:08 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `D:food`: day 2 09:56 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `D:food`: day 2 14:08 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `D:cafes`: day 2 09:56 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `D:cafes`: day 2 14:08 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `D:art`: day 2 09:56 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `D:art`: day 2 14:08 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `D:nightlife`: day 2 09:56 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `D:nightlife`: day 2 14:08 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `D:photography`: day 2 09:56 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `D:photography`: day 2 14:08 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `D:beaches`: day 2 09:56 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `D:beaches`: day 2 14:08 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `D:nature`: day 2 09:56 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `D:nature`: day 2 14:08 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `D:adventure`: day 2 09:56 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `D:adventure`: day 2 14:08 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `D:culture`: day 2 09:56 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `D:culture`: day 2 14:08 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `D:luxury`: day 2 09:56 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `D:luxury`: day 2 14:08 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `D:combo-3`: day 2 09:56 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `D:combo-3`: day 2 14:08 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `D:combo-5`: day 2 09:56 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `D:combo-5`: day 2 14:08 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `E:vegetarian`: day 2 09:51 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `E:vegetarian`: day 2 14:03 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `E:vegan`: day 2 09:51 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `E:vegan`: day 2 12:26 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `E:halal`: day 2 09:51 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `E:halal`: day 2 14:03 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `E:gluten-free`: day 2 09:51 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `E:gluten-free`: day 2 14:14 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `E:vegan+gluten-free`: day 2 09:51 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `E:vegan+gluten-free`: day 2 12:26 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `E:limited-mobility`: day 3 09:47 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `E:limited-mobility`: day 3 14:01 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `F:first-time`: day 2 09:56 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `F:first-time`: day 2 14:08 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `F:foodie`: day 1 13:24 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `F:foodie`: day 1 15:59 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `F:budget`: day 1 13:24 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `F:budget`: day 1 15:59 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `F:couple`: day 2 09:56 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `F:couple`: day 2 14:08 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `F:friends`: day 1 13:24 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `F:friends`: day 1 15:59 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `F:family`: day 2 09:56 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `F:family`: day 2 14:08 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `F:relaxed`: day 1 13:24 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `F:relaxed`: day 1 15:59 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `F:adventure`: day 1 13:24 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `F:adventure`: day 1 15:59 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `F:culture-history`: day 2 09:56 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `F:culture-history`: day 2 14:08 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `F:nightlife`: day 1 13:24 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `F:nightlife`: day 1 15:59 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `G:undated`: day 1 13:24 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `G:undated`: day 1 15:59 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `G:closed-day`: day 1 13:24 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `G:closed-day`: day 1 15:59 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `H:arrive-only`: day 2 09:56 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `H:arrive-only`: day 2 14:08 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `I:baseline`: day 3 09:51 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `I:baseline`: day 3 14:14 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `I:start-date`: day 3 09:51 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `I:start-date`: day 3 14:14 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `I:length`: day 2 09:56 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `I:length`: day 2 14:04 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `I:travellers`: day 2 09:56 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `I:travellers`: day 2 14:04 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `I:interest`: day 2 09:56 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `I:interest`: day 2 14:04 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `I:dietary`: day 2 09:56 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `I:dietary`: day 2 14:09 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `I:mobility`: day 4 09:47 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `I:mobility`: day 4 12:24 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `I:swap`: day 4 09:47 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `I:swap`: day 4 12:24 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **london** `I:shuffle`: day 4 09:47 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **london** `I:shuffle`: day 4 12:24 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **new-york-city** `A:1d`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `A:3d`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `A:7d`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `A:14d`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `B:weekday-start`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `B:weekend-start`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `B:closed-day`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `C:1-pax`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `C:2-pax`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `C:max-pax`: day 1 13:25 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `D:history`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `D:food`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `D:cafes`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `D:shopping`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `D:art`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `D:nightlife`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `D:photography`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `D:beaches`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `D:nature`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `D:adventure`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `D:culture`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `D:luxury`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `D:combo-3`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `D:combo-5`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `E:vegetarian`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `E:vegan`: day 1 13:34 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `E:halal`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `E:gluten-free`: day 1 13:47 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `E:vegan+gluten-free`: day 1 13:46 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `E:limited-mobility`: day 1 13:34 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `F:first-time`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `F:foodie`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `F:luxury`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `F:budget`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `F:couple`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `F:friends`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `F:family`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `F:relaxed`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `F:adventure`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `F:shopping`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `F:culture-history`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `F:nightlife`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `G:undated`: day 4 13:46 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `G:closed-day`: day 3 13:47 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `H:arrive-only`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `H:arrive-late`: day 2 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `H:depart-only`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `I:baseline`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `I:start-date`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `I:length`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `I:travellers`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `I:interest`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `I:dietary`: day 1 13:40 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `I:mobility`: day 1 13:34 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `I:swap`: day 1 13:34 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **new-york-city** `I:shuffle`: day 1 13:34 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **amsterdam** `A:1d`: day 1 13:23 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `A:3d`: day 1 13:23 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `A:7d`: day 1 14:33 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `A:7d`: day 7 11:54 "Moco Museum" min 21.95 / likely 22 / max 21.95 out of order
- **amsterdam** `A:14d`: day 2 09:42 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `A:14d`: day 6 11:54 "Moco Museum" min 21.95 / likely 22 / max 21.95 out of order
- **amsterdam** `B:weekday-start`: day 2 09:42 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `B:weekend-start`: day 1 13:28 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `B:closed-day`: day 1 13:28 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `C:1-pax`: day 1 13:23 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `C:2-pax`: day 1 13:23 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `C:max-pax`: day 1 13:08 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `D:history`: day 1 13:23 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `D:food`: day 1 13:23 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `D:cafes`: day 1 13:23 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `D:shopping`: day 2 09:42 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `D:art`: day 1 13:23 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `D:nightlife`: day 1 13:23 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `D:photography`: day 1 13:23 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `D:beaches`: day 1 13:23 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `D:nature`: day 1 13:23 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `D:adventure`: day 1 13:23 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `D:culture`: day 1 13:23 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `D:luxury`: day 1 13:23 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `D:combo-3`: day 1 13:26 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `D:combo-5`: day 1 13:23 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `E:vegetarian`: day 1 13:26 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `E:vegan`: day 1 13:23 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `E:halal`: day 1 13:23 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `E:gluten-free`: day 1 13:23 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `E:vegan+gluten-free`: day 1 13:23 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `E:limited-mobility`: day 1 13:19 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `F:first-time`: day 1 13:23 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `F:foodie`: day 1 13:23 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `F:luxury`: day 2 09:42 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `F:budget`: day 1 13:23 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `F:couple`: day 1 13:23 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `F:friends`: day 1 13:23 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `F:family`: day 1 13:23 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `F:relaxed`: day 1 13:23 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `F:adventure`: day 1 13:23 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `F:shopping`: day 2 09:42 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `F:culture-history`: day 1 13:23 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `F:nightlife`: day 1 13:23 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `H:arrive-only`: day 1 13:23 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `H:arrive-late`: day 2 09:51 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `H:depart-only`: day 1 13:23 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `H:both-1day`: day 1 13:53 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `I:baseline`: day 1 13:23 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `I:start-date`: day 1 13:23 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `I:length`: day 2 09:42 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `I:travellers`: day 2 09:42 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `I:interest`: day 2 09:42 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `I:dietary`: day 2 09:42 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `I:mobility`: day 1 14:28 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `I:swap`: day 1 14:29 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **amsterdam** `I:shuffle`: day 1 14:29 "Rijksmuseum" min 22.5 / likely 23 / max 22.5 out of order
- **hong-kong** `I:city`: day 2 08:45 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **sydney** `A:7d`: day 6 13:42 "Manly Ferry & beach" min 9.18 / likely 9 / max 9.18 out of order
- **sydney** `A:14d`: day 5 13:50 "Manly Ferry & beach" min 9.18 / likely 9 / max 9.18 out of order
- **sydney** `D:combo-5`: day 3 08:45 "Manly Ferry & beach" min 9.18 / likely 9 / max 9.18 out of order
- **sydney** `I:city`: day 4 09:47 "Tower of London" min 33.6 / likely 34 / max 33.6 out of order
- **sydney** `I:city`: day 4 12:24 "Tower Bridge" min 12.3 / likely 12 / max 12.3 out of order
- **zurich** `I:city`: day 1 13:34 "Statue of Liberty & Ellis Island" min 24.5 / likely 25 / max 24.5 out of order
- **vienna** `A:7d`: day 7 10:35 "Albertina Museum" min 19.9 / likely 20 / max 19.9 out of order
- **vienna** `A:14d`: day 6 10:35 "Albertina Museum" min 19.9 / likely 20 / max 19.9 out of order
- **lisbon** `A:7d`: day 6 12:04 "Santa Justa Lift" min 5.3 / likely 5 / max 5.3 out of order
- **lisbon** `A:14d`: day 5 09:46 "Santa Justa Lift" min 5.3 / likely 5 / max 5.3 out of order
- **venice** `A:3d`: day 2 10:54 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `A:7d`: day 2 10:23 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `A:14d`: day 2 10:54 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `B:weekday-start`: day 2 10:54 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `B:weekend-start`: day 2 10:54 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `B:closed-day`: day 2 10:54 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `C:1-pax`: day 2 10:54 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `C:2-pax`: day 2 10:54 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `C:max-pax`: day 3 08:45 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `D:history`: day 2 10:54 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `D:food`: day 2 10:54 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `D:cafes`: day 2 10:54 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `D:art`: day 2 09:52 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `D:nightlife`: day 2 10:54 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `D:photography`: day 2 10:54 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `D:beaches`: day 2 10:54 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `D:nature`: day 2 10:54 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `D:adventure`: day 2 10:54 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `D:culture`: day 2 10:54 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `D:luxury`: day 2 10:54 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `D:combo-3`: day 2 10:54 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `E:vegetarian`: day 2 10:54 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `E:vegan`: day 2 10:54 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `E:halal`: day 2 10:54 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `E:gluten-free`: day 2 08:45 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `E:vegan+gluten-free`: day 2 10:54 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `E:limited-mobility`: day 3 08:45 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `F:first-time`: day 2 10:54 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `F:foodie`: day 2 10:54 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `F:budget`: day 2 10:54 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `F:couple`: day 2 10:54 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `F:friends`: day 2 10:54 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `F:family`: day 2 10:54 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `F:relaxed`: day 2 10:54 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `F:adventure`: day 2 10:54 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `F:culture-history`: day 2 09:52 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `F:nightlife`: day 2 10:54 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `H:arrive-only`: day 2 10:54 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `I:baseline`: day 2 10:54 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `I:start-date`: day 2 10:54 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `I:length`: day 2 10:54 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `I:travellers`: day 2 10:54 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `I:interest`: day 2 08:45 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `I:dietary`: day 2 08:45 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `I:mobility`: day 2 08:45 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order
- **venice** `I:swap`: day 2 08:45 "Grand Canal" min 9.5 / likely 10 / max 9.5 out of order

### `flight.arrival` (50)

a day-1 stop starts before landing + 2h30

- **tokyo** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **paris** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **london** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **dubai** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **singapore** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **bangkok** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **rome** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **barcelona** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **new-york-city** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **istanbul** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **seoul** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **amsterdam** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **copenhagen** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **hong-kong** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **sydney** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **zurich** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **los-angeles** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **kuala-lumpur** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **vienna** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **lisbon** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **prague** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **berlin** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **madrid** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **milan** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **florence** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **venice** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **athens** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **budapest** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **munich** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **edinburgh** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **dublin** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **brussels** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **stockholm** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **krakow** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **marrakesh** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **cairo** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **cape-town** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **mexico-city** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **buenos-aires** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **rio-de-janeiro** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **toronto** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **san-francisco** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **chicago** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **miami** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **kyoto** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **osaka** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **taipei** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **hanoi** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **mumbai** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45
- **melbourne** `H:arrive-late`: day 1 23:00 "Arrive, check in and rest" starts 23:00, before landing 23:15 + 2h30 = 01:45

### `flight.departure` (50)

a last-day stop runs past flight - 3h

- **tokyo** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **paris** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **london** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **dubai** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **singapore** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **bangkok** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **rome** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **barcelona** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **new-york-city** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **istanbul** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **seoul** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **amsterdam** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **copenhagen** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **hong-kong** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **sydney** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **zurich** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **los-angeles** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **kuala-lumpur** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **vienna** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **lisbon** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **prague** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **berlin** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **madrid** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **milan** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **florence** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **venice** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **athens** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **budapest** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **munich** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **edinburgh** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **dublin** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **brussels** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **stockholm** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **krakow** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **marrakesh** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **cairo** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **cape-town** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **mexico-city** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **buenos-aires** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **rio-de-janeiro** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **toronto** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **san-francisco** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **chicago** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **miami** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **kyoto** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **osaka** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **taipei** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **hanoi** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **mumbai** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30
- **melbourne** `H:depart-only`: day 2 08:45 "Relaxed day" ends 08:45, after flight 07:30 - 3h = 04:30

### `prop.city-stuck` (50)

a single-input change did not propagate correctly

- **tokyo** `I:city`: after choosing Prague in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Prague
- **paris** `I:city`: after choosing Lisbon in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Lisbon
- **london** `I:city`: after choosing Lisbon in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Lisbon
- **dubai** `I:city`: after choosing Kyoto in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Kyoto
- **singapore** `I:city`: after choosing Marrakesh in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Marrakesh
- **bangkok** `I:city`: after choosing Athens in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Athens
- **rome** `I:city`: after choosing Mumbai in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Mumbai
- **barcelona** `I:city`: after choosing Osaka in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Osaka
- **new-york-city** `I:city`: after choosing Cape Town in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Cape Town
- **istanbul** `I:city`: after choosing Toronto in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Toronto
- **seoul** `I:city`: after choosing Barcelona in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Barcelona
- **amsterdam** `I:city`: after choosing Florence in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Florence
- **copenhagen** `I:city`: after choosing Chicago in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Chicago
- **hong-kong** `I:city`: after choosing Venice in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Venice
- **sydney** `I:city`: after choosing London in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows London
- **zurich** `I:city`: after choosing New York City in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows New York City
- **los-angeles** `I:city`: after choosing Milan in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Milan
- **kuala-lumpur** `I:city`: after choosing Paris in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Paris
- **vienna** `I:city`: after choosing Krakow in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Krakow
- **lisbon** `I:city`: after choosing Athens in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Athens
- **prague** `I:city`: after choosing Edinburgh in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Edinburgh
- **berlin** `I:city`: after choosing Melbourne in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Melbourne
- **madrid** `I:city`: after choosing Seoul in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Seoul
- **milan** `I:city`: after choosing Miami in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Miami
- **florence** `I:city`: after choosing Taipei in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Taipei
- **venice** `I:city`: after choosing Cape Town in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Cape Town
- **athens** `I:city`: after choosing Dubai in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Dubai
- **budapest** `I:city`: after choosing Toronto in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Toronto
- **munich** `I:city`: after choosing Milan in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Milan
- **edinburgh** `I:city`: after choosing Athens in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Athens
- **dublin** `I:city`: after choosing San Francisco in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows San Francisco
- **brussels** `I:city`: after choosing Buenos Aires in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Buenos Aires
- **stockholm** `I:city`: after choosing Cape Town in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Cape Town
- **krakow** `I:city`: after choosing Prague in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Prague
- **marrakesh** `I:city`: after choosing Sydney in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Sydney
- **cairo** `I:city`: after choosing Sydney in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Sydney
- **cape-town** `I:city`: after choosing Cairo in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Cairo
- **mexico-city** `I:city`: after choosing Bangkok in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Bangkok
- **buenos-aires** `I:city`: after choosing Singapore in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Singapore
- **rio-de-janeiro** `I:city`: after choosing Budapest in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Budapest
- **toronto** `I:city`: after choosing Rome in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Rome
- **san-francisco** `I:city`: after choosing Budapest in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Budapest
- **chicago** `I:city`: after choosing Taipei in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Taipei
- **miami** `I:city`: after choosing Mumbai in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Mumbai
- **kyoto** `I:city`: after choosing Cape Town in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Cape Town
- **osaka** `I:city`: after choosing Toronto in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Toronto
- **taipei** `I:city`: after choosing San Francisco in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows San Francisco
- **hanoi** `I:city`: after choosing Chicago in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Chicago
- **mumbai** `I:city`: after choosing Kuala Lumpur in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Kuala Lumpur
- **melbourne** `I:city`: after choosing Rio de Janeiro in the city picker the "Build my itinerary" button stays disabled and busy (waited 8 s); hero already shows Rio de Janeiro

### `time.meal-window` (36)

a meal lands outside a sensible window

- **dubai** `I:swap`: day 1 16:45 "Arabian Tea House" is lunch at 16:45, expected 11:30-15:30
- **dubai** `I:swap`: day 1 19:08 "Arabian Tea House courtyard" is coffee at 19:08, expected 14:00-18:30
- **dubai** `I:shuffle`: day 1 16:45 "Arabian Tea House" is lunch at 16:45, expected 11:30-15:30
- **dubai** `I:shuffle`: day 1 19:08 "Arabian Tea House courtyard" is coffee at 19:08, expected 14:00-18:30
- **istanbul** `A:7d`: day 6 16:20 "Cibalikapı Balıkçısı" is lunch at 16:20, expected 11:30-15:30
- **copenhagen** `C:max-pax`: day 2 15:50 "Restaurant Schønnemann" is lunch at 15:50, expected 11:30-15:30
- **copenhagen** `D:combo-5`: day 2 15:50 "Restaurant Schønnemann" is lunch at 15:50, expected 11:30-15:30
- **copenhagen** `E:limited-mobility`: day 2 15:50 "Restaurant Schønnemann" is lunch at 15:50, expected 11:30-15:30
- **copenhagen** `I:dietary`: day 2 15:58 "Manfreds" is lunch at 15:58, expected 11:30-15:30
- **hong-kong** `I:swap`: day 1 16:55 "Lin Heung Tea House" is lunch at 16:55, expected 11:30-15:30
- **hong-kong** `I:shuffle`: day 1 16:55 "Lin Heung Tea House" is lunch at 16:55, expected 11:30-15:30
- **sydney** `A:7d`: day 4 15:42 "Mr. Crackles" is lunch at 15:42, expected 11:30-15:30
- **sydney** `A:14d`: day 3 15:42 "Mr. Crackles" is lunch at 15:42, expected 11:30-15:30
- **athens** `A:14d`: day 3 15:56 "Karamanlidika tou Fani" is lunch at 15:56, expected 11:30-15:30
- **marrakesh** `A:3d`: day 2 16:07 "Al Fassia" is lunch at 16:07, expected 11:30-15:30
- **marrakesh** `A:7d`: day 2 15:47 "Al Fassia" is lunch at 15:47, expected 11:30-15:30
- **marrakesh** `B:weekend-start`: day 2 16:22 "Al Fassia" is lunch at 16:22, expected 11:30-15:30
- **marrakesh** `B:closed-day`: day 2 16:22 "Al Fassia" is lunch at 16:22, expected 11:30-15:30
- **marrakesh** `C:1-pax`: day 2 16:07 "Al Fassia" is lunch at 16:07, expected 11:30-15:30
- **marrakesh** `C:2-pax`: day 2 16:07 "Al Fassia" is lunch at 16:07, expected 11:30-15:30
- **marrakesh** `D:combo-3`: day 2 15:45 "Nomad" is lunch at 15:45, expected 11:30-15:30
- **marrakesh** `D:combo-5`: day 2 15:47 "Al Fassia" is lunch at 15:47, expected 11:30-15:30
- **marrakesh** `H:arrive-only`: day 2 16:07 "Al Fassia" is lunch at 16:07, expected 11:30-15:30
- **marrakesh** `I:baseline`: day 2 16:02 "Al Fassia" is lunch at 16:02, expected 11:30-15:30
- **marrakesh** `I:start-date`: day 2 16:02 "Al Fassia" is lunch at 16:02, expected 11:30-15:30
- **cape-town** `E:limited-mobility`: day 2 15:42 "Kalky's Fish & Chips" is lunch at 15:42, expected 11:30-15:30
- **cape-town** `E:limited-mobility`: day 2 19:00 "Truth Coffee" is coffee at 19:00, expected 14:00-18:30
- **san-francisco** `A:3d`: day 2 15:34 "Swan Oyster Depot" is lunch at 15:34, expected 11:30-15:30
- **san-francisco** `A:7d`: day 4 16:28 "Swan Oyster Depot" is lunch at 16:28, expected 11:30-15:30
- **san-francisco** `A:14d`: day 3 15:58 "Swan Oyster Depot" is lunch at 15:58, expected 11:30-15:30
- **san-francisco** `B:weekend-start`: day 2 15:34 "La Taqueria" is lunch at 15:34, expected 11:30-15:30
- **san-francisco** `B:closed-day`: day 2 15:34 "La Taqueria" is lunch at 15:34, expected 11:30-15:30
- **san-francisco** `C:1-pax`: day 2 15:34 "Swan Oyster Depot" is lunch at 15:34, expected 11:30-15:30
- **san-francisco** `C:2-pax`: day 2 15:34 "Swan Oyster Depot" is lunch at 15:34, expected 11:30-15:30
- **san-francisco** `H:arrive-only`: day 2 15:34 "Swan Oyster Depot" is lunch at 15:34, expected 11:30-15:30
- **san-francisco** `I:start-date`: day 2 15:34 "The Slanted Door" is lunch at 15:34, expected 11:30-15:30

### `interest.nightlife` (20)

selected interest has no matching stop

- **tokyo** `D:nightlife`: only "nightlife" selected, but no matching stop in 2 days
- **paris** `D:nightlife`: only "nightlife" selected, but no matching stop in 2 days
- **london** `D:nightlife`: only "nightlife" selected, but no matching stop in 2 days
- **bangkok** `D:nightlife`: only "nightlife" selected, but no matching stop in 2 days
- **barcelona** `D:nightlife`: only "nightlife" selected, but no matching stop in 2 days
- **new-york-city** `D:nightlife`: only "nightlife" selected, but no matching stop in 2 days
- **istanbul** `D:nightlife`: only "nightlife" selected, but no matching stop in 2 days
- **amsterdam** `D:nightlife`: only "nightlife" selected, but no matching stop in 2 days
- **copenhagen** `D:nightlife`: only "nightlife" selected, but no matching stop in 2 days
- **zurich** `D:nightlife`: only "nightlife" selected, but no matching stop in 2 days
- **lisbon** `D:nightlife`: only "nightlife" selected, but no matching stop in 2 days
- **berlin** `D:nightlife`: only "nightlife" selected, but no matching stop in 2 days
- **madrid** `D:nightlife`: only "nightlife" selected, but no matching stop in 2 days
- **milan** `D:nightlife`: only "nightlife" selected, but no matching stop in 2 days
- **athens** `D:nightlife`: only "nightlife" selected, but no matching stop in 2 days
- **budapest** `D:nightlife`: only "nightlife" selected, but no matching stop in 2 days
- **dublin** `D:nightlife`: only "nightlife" selected, but no matching stop in 2 days
- **cairo** `D:nightlife`: only "nightlife" selected, but no matching stop in 2 days
- **rio-de-janeiro** `D:nightlife`: only "nightlife" selected, but no matching stop in 2 days
- **chicago** `D:nightlife`: only "nightlife" selected, but no matching stop in 2 days

### `interest.nature` (18)

selected interest has no matching stop

- **london** `D:nature`: only "nature" selected, but no matching stop in 2 days
- **rome** `D:nature`: only "nature" selected, but no matching stop in 2 days
- **seoul** `D:nature`: only "nature" selected, but no matching stop in 2 days
- **amsterdam** `D:nature`: only "nature" selected, but no matching stop in 2 days
- **hong-kong** `D:nature`: only "nature" selected, but no matching stop in 2 days
- **vienna** `D:nature`: only "nature" selected, but no matching stop in 2 days
- **prague** `D:nature`: only "nature" selected, but no matching stop in 2 days
- **berlin** `D:nature`: only "nature" selected, but no matching stop in 2 days
- **florence** `D:nature`: only "nature" selected, but no matching stop in 2 days
- **budapest** `D:nature`: only "nature" selected, but no matching stop in 2 days
- **dublin** `D:nature`: only "nature" selected, but no matching stop in 2 days
- **krakow** `D:nature`: only "nature" selected, but no matching stop in 2 days
- **buenos-aires** `D:nature`: only "nature" selected, but no matching stop in 2 days
- **toronto** `D:nature`: only "nature" selected, but no matching stop in 2 days
- **san-francisco** `D:nature`: only "nature" selected, but no matching stop in 2 days
- **chicago** `D:nature`: only "nature" selected, but no matching stop in 2 days
- **kyoto** `D:nature`: only "nature" selected, but no matching stop in 2 days
- **melbourne** `D:nature`: only "nature" selected, but no matching stop in 2 days

### `render.where-and-price` (11)

page differs from what the engine produced

- **sydney** `G:undated`: day 4 stop 2: page "Eastern Suburbs · 2 hr 30 min · Free" / engine "Watsons Bay · 2 hr 30 min · price not listed"
- **sydney** `G:undated`: day 4 stop 3: page "Haymarket (Chinatown) · 1 hr 10 min · A$25–40" / engine "Bondi · 1 hr 10 min · A$120–180"
- **sydney** `G:undated`: day 4 stop 4: page "Multiple locations · 1 hr" / engine "Newtown · 46 min"
- **sydney** `G:undated`: day 4 stop 5: page "Multiple locations · 45 min · price not listed" / engine "Newtown · 45 min · price not listed"
- **sydney** `G:undated`: day 4 stop 6: page "Coogee · 3 hr" / engine "Coogee · 2 hr 51 min"
- **sydney** `G:closed-day`: day 1 stop 4: page "Multiple locations · 45 min · price not listed" / engine "Redfern · 45 min · price not listed"
- **sydney** `G:closed-day`: day 3 stop 2: page "Eastern Suburbs · 2 hr 30 min · Free" / engine "Watsons Bay · 2 hr 30 min · price not listed"
- **sydney** `G:closed-day`: day 3 stop 3: page "Haymarket (Chinatown) · 1 hr 10 min · A$25–40" / engine "Bondi · 1 hr 10 min · A$120–180"
- **sydney** `G:closed-day`: day 3 stop 4: page "Redfern · 1 hr" / engine "Newtown · 46 min"
- **sydney** `G:closed-day`: day 3 stop 5: page "Redfern · 45 min · price not listed" / engine "Newtown · 45 min · price not listed"
- **sydney** `G:closed-day`: day 3 stop 6: page "Haymarket · 3 hr" / engine "Haymarket · 2 hr 51 min"

### `interest.art` (10)

selected interest has no matching stop

- **dubai** `D:art`: only "art" selected, but no matching stop in 2 days
- **singapore** `D:art`: only "art" selected, but no matching stop in 2 days
- **copenhagen** `D:art`: only "art" selected, but no matching stop in 2 days
- **hong-kong** `D:art`: only "art" selected, but no matching stop in 2 days
- **los-angeles** `D:art`: only "art" selected, but no matching stop in 2 days
- **prague** `D:art`: only "art" selected, but no matching stop in 2 days
- **budapest** `D:art`: only "art" selected, but no matching stop in 2 days
- **dublin** `D:art`: only "art" selected, but no matching stop in 2 days
- **brussels** `D:art`: only "art" selected, but no matching stop in 2 days
- **san-francisco** `D:art`: only "art" selected, but no matching stop in 2 days

### `interest.adventure` (9)

selected interest has no matching stop

- **singapore** `D:adventure`: only "adventure" selected, but no matching stop in 2 days
- **hong-kong** `D:adventure`: only "adventure" selected, but no matching stop in 2 days
- **vienna** `D:adventure`: only "adventure" selected, but no matching stop in 2 days
- **munich** `D:adventure`: only "adventure" selected, but no matching stop in 2 days
- **marrakesh** `D:adventure`: only "adventure" selected, but no matching stop in 2 days
- **mexico-city** `D:adventure`: only "adventure" selected, but no matching stop in 2 days
- **rio-de-janeiro** `D:adventure`: only "adventure" selected, but no matching stop in 2 days
- **osaka** `D:adventure`: only "adventure" selected, but no matching stop in 2 days
- **mumbai** `D:adventure`: only "adventure" selected, but no matching stop in 2 days

### `interest.culture` (9)

selected interest has no matching stop

- **amsterdam** `D:culture`: only "culture" selected, but no matching stop in 2 days
- **zurich** `D:culture`: only "culture" selected, but no matching stop in 2 days
- **milan** `D:culture`: only "culture" selected, but no matching stop in 2 days
- **venice** `D:culture`: only "culture" selected, but no matching stop in 2 days
- **budapest** `D:culture`: only "culture" selected, but no matching stop in 2 days
- **stockholm** `D:culture`: only "culture" selected, but no matching stop in 2 days
- **cape-town** `D:culture`: only "culture" selected, but no matching stop in 2 days
- **rio-de-janeiro** `D:culture`: only "culture" selected, but no matching stop in 2 days
- **osaka** `D:culture`: only "culture" selected, but no matching stop in 2 days

### `render.time` (8)

page differs from what the engine produced

- **sydney** `G:undated`: day 4 stop 2: page "09:50" / engine "10:04"
- **sydney** `G:undated`: day 4 stop 3: page "12:35" / engine "12:49"
- **sydney** `G:undated`: day 4 stop 4: page "14:00" / engine "14:14"
- **sydney** `G:undated`: day 4 stop 6: page "16:00" / engine "16:09"
- **sydney** `G:closed-day`: day 3 stop 2: page "09:50" / engine "10:04"
- **sydney** `G:closed-day`: day 3 stop 3: page "12:35" / engine "12:49"
- **sydney** `G:closed-day`: day 3 stop 4: page "14:00" / engine "14:14"
- **sydney** `G:closed-day`: day 3 stop 6: page "16:00" / engine "16:09"

### `render.name` (7)

page differs from what the engine produced

- **sydney** `G:undated`: day 4 stop 2: page "Bondi to Coogee Coastal Walk" / engine "Watsons Bay"
- **sydney** `G:undated`: day 4 stop 3: page "Chat Thai" / engine "Icebergs Dining Room"
- **sydney** `G:undated`: day 4 stop 5: page "Gelato Messina" / engine "Campos Coffee"
- **sydney** `G:closed-day`: day 1 stop 4: page "Gelato Messina" / engine "Bang Bang Espresso"
- **sydney** `G:closed-day`: day 3 stop 2: page "Bondi to Coogee Coastal Walk" / engine "Watsons Bay"
- **sydney** `G:closed-day`: day 3 stop 3: page "Chat Thai" / engine "Icebergs Dining Room"
- **sydney** `G:closed-day`: day 3 stop 5: page "Bang Bang Espresso" / engine "Black Star Pastry"

### `render.kind` (6)

page differs from what the engine produced

- **sydney** `G:undated`: day 4 stop 2: page "Sight Must-see" / engine "Sight Highly recommended"
- **sydney** `G:undated`: day 4 stop 3: page "Lunch Highly recommended" / engine "Lunch If you have time"
- **sydney** `G:undated`: day 4 stop 5: page "Coffee break If you have time" / engine "Coffee break Interest pick"
- **sydney** `G:closed-day`: day 3 stop 2: page "Sight Must-see" / engine "Sight Highly recommended"
- **sydney** `G:closed-day`: day 3 stop 3: page "Lunch Highly recommended" / engine "Lunch If you have time"
- **sydney** `G:closed-day`: day 3 stop 5: page "Coffee break If you have time" / engine "Coffee break Highly recommended"

### `map.numbering` (6)

marker numbering / titles differ from stop order

- **sydney** `G:undated`: day 2: marker 4 reads "4" titled "4. BridgeClimb Sydney", expected "4. Black Star Pastry"
- **sydney** `G:undated`: day 4: marker 2 reads "2" titled "2. Chat Thai", expected "2. Watsons Bay"
- **sydney** `G:undated`: day 4: marker 3 reads "3" titled "3. Mimi's", expected "3. Campos Coffee"
- **sydney** `G:closed-day`: day 2: marker 4 reads "4" titled "4. BridgeClimb Sydney", expected "4. Campos Coffee"
- **sydney** `G:closed-day`: day 3: marker 2 reads "2" titled "2. Chat Thai", expected "2. Watsons Bay"
- **sydney** `G:closed-day`: day 3: marker 3 reads "3" titled "3. Mamak", expected "3. Black Star Pastry"

### `render.sub` (4)

page differs from what the engine produced

- **sydney** `G:undated`: day 2: page "Around Surry Hills · 92 min between stops (4.9 km)" / engine "Around Surry Hills · 115 min between stops (7.1 km)"
- **sydney** `G:undated`: day 4: page "Around Eastern Suburbs · 75 min between stops (0 km)" / engine "Around Watsons Bay · 98 min between stops (10.4 km)"
- **sydney** `G:closed-day`: day 2: page "Around Surry Hills · 92 min between stops (6.3 km)" / engine "Around Surry Hills · 118 min between stops (7.4 km)"
- **sydney** `G:closed-day`: day 3: page "Around Eastern Suburbs · 60 min between stops (0 km)" / engine "Around Watsons Bay · 83 min between stops (10.3 km)"

### `render.cost` (4)

page differs from what the engine produced

- **sydney** `G:undated`: day 2: page "A$357–461 per person · likely A$409 2 stop(s) have no listed price" / engine "A$57–61 per person · likely A$59 3 stop(s) have no listed price"
- **sydney** `G:undated`: day 4: page "A$113–175 per person · likely A$145 2 stop(s) have no listed price" / engine "A$208–315 per person · likely A$262 3 stop(s) have no listed price"
- **sydney** `G:closed-day`: day 2: page "A$369–481 per person · likely A$425 1 stop(s) have no listed price" / engine "A$69–81 per person · likely A$75 2 stop(s) have no listed price"
- **sydney** `G:closed-day`: day 3: page "A$33–55 per person · likely A$45 2 stop(s) have no listed price" / engine "A$128–195 per person · likely A$162 3 stop(s) have no listed price"

### `render.end-time` (4)

page differs from what the engine produced

- **sydney** `G:undated`: day 4 stop 2: page "12:20" / engine "12:34"
- **sydney** `G:undated`: day 4 stop 3: page "13:45" / engine "13:59"
- **sydney** `G:closed-day`: day 3 stop 2: page "12:20" / engine "12:34"
- **sydney** `G:closed-day`: day 3 stop 3: page "13:45" / engine "13:59"

### `map.markers` (4)

marker count differs from the located stops

- **sydney** `G:undated`: day 4: 3 markers for 4 located stops
- **sydney** `G:undated`: day 4: map labelled 3 located stops, engine has 4
- **sydney** `G:closed-day`: day 3: 3 markers for 4 located stops
- **sydney** `G:closed-day`: day 3: map labelled 3 located stops, engine has 4

### `render.trip-total` (2)

page differs from what the engine produced

- **sydney** `G:undated`: page "A$482–656" / engine "A$277–396"
- **sydney** `G:closed-day`: page "A$402–536" / engine "A$197–276"

### `render.trip-likely` (2)

page differs from what the engine produced

- **sydney** `G:undated`: page "likely A$570" / engine "likely A$337"
- **sydney** `G:closed-day`: page "likely A$470" / engine "likely A$237"

### `render.party-total` (2)

page differs from what the engine produced

- **sydney** `G:undated`: page "A$1,140" / engine "A$674"
- **sydney** `G:closed-day`: page "A$940" / engine "A$474"

### `render.stop-count` (2)

page differs from what the engine produced

- **sydney** `G:undated`: day 2: page "7" / engine "9"
- **sydney** `G:closed-day`: day 2: page "7" / engine "9"

### `render.trip-links` (2)

page differs from what the engine produced

- **sydney** `G:undated`: book-this-trip has 11 links, expected 11 for Sydney undated 2A+0C
- **sydney** `G:closed-day`: book-this-trip has 11 links, expected 11 for Sydney 2027-07-31 2A+0C

### `interest.cafes` (1)

selected interest has no matching stop

- **cape-town** `D:cafes`: only "cafes" selected, but no matching stop in 2 days

### `prop.travellers` (1)

a single-input change did not propagate correctly

- **buenos-aires** `I:travellers`: party total did not change

### `interest.beaches` (1)

selected interest has no matching stop

- **melbourne** `D:beaches`: only "beaches" selected, but no matching stop in 2 days

## Informational (not counted as failures)

- `prop.shuffle-noop` x8: shuffling a day gave the same day
- `must.missing-with-warning` x2: a must-include place could not be scheduled and the plan says so

## Appendix: exact inputs of every failing scenario

`slug/scenario`: inputs as set in the form (dates empty means undated; `mustInclude`/`avoid` are record ids).

- `tokyo/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"tokyo"}`
- `tokyo/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"tokyo"}`
- `tokyo/B:weekday-start` Tue to Fri, from 2027-07-13: `{"start":"2027-07-13","end":"2027-07-16","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"tokyo"}`
- `tokyo/D:nightlife` interest: nightlife only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"tokyo"}`
- `tokyo/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["photography","history","food"],"dietary":[],"mustInclude":["hamarikyu-gardens","tsukiji-outer","r-uobei-shibuya-dogenzaka","x-robot-restaurant-style-neon-show"],"avoid":["senso-ji","meiji-jingu","shibuya-crossing"],"arrivalTime":"","departureTime":"","slug":"tokyo"}`
- `tokyo/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"tokyo"}`
- `tokyo/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"tokyo"}`
- `tokyo/I:length` extend the trip by one day: `{"start":"2027-03-17","end":"2027-03-20","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"tokyo"}`
- `tokyo/I:travellers` one more adult (2 to 3): `{"start":"2027-03-17","end":"2027-03-20","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"tokyo"}`
- `tokyo/I:interest` add the Nightlife interest: `{"start":"2027-03-17","end":"2027-03-20","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"tokyo"}`
- `tokyo/I:dietary` add Vegetarian: `{"start":"2027-03-17","end":"2027-03-20","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"tokyo"}`
- `tokyo/I:mobility` limited mobility: `{"start":"2027-03-17","end":"2027-03-20","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"tokyo"}`
- `tokyo/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-03-17","end":"2027-03-20","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"tokyo"}`
- `tokyo/I:shuffle` shuffle day 2: `{"start":"2027-03-17","end":"2027-03-20","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"tokyo"}`
- `tokyo/I:city` switch the city from tokyo to prague: `{"start":"2027-03-17","end":"2027-03-20","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"prague"}`
- `paris/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"paris"}`
- `paris/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"paris"}`
- `paris/B:weekday-start` Tue to Fri, from 2027-09-28: `{"start":"2027-09-28","end":"2027-10-01","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"paris"}`
- `paris/D:nightlife` interest: nightlife only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"paris"}`
- `paris/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":[],"mustInclude":["luxembourg-gardens","musee-de-l-orangerie","r-bouillon-pigalle","x-seine-river-cruise-at-sunset"],"avoid":["louvre","eiffel-tower","notre-dame"],"arrivalTime":"","departureTime":"","slug":"paris"}`
- `paris/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"paris"}`
- `paris/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"paris"}`
- `paris/I:length` extend the trip by one day: `{"start":"2027-08-04","end":"2027-08-07","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"paris"}`
- `paris/I:travellers` one more adult (2 to 3): `{"start":"2027-08-04","end":"2027-08-07","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"paris"}`
- `paris/I:interest` add the Nightlife interest: `{"start":"2027-08-04","end":"2027-08-07","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"paris"}`
- `paris/I:dietary` add Vegetarian: `{"start":"2027-08-04","end":"2027-08-07","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"paris"}`
- `paris/I:mobility` limited mobility: `{"start":"2027-08-04","end":"2027-08-07","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"paris"}`
- `paris/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-08-04","end":"2027-08-07","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"paris"}`
- `paris/I:shuffle` shuffle day 2: `{"start":"2027-08-04","end":"2027-08-07","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"paris"}`
- `paris/I:city` switch the city from paris to lisbon: `{"start":"2027-08-04","end":"2027-08-07","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"lisbon"}`
- `london/A:3d` 3-day trip, undated: `{"start":"","end":"","duration":3,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/B:weekday-start` Tue to Fri, from 2027-03-23: `{"start":"2027-03-23","end":"2027-03-26","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/B:weekend-start` Sat to Mon, from 2027-03-27: `{"start":"2027-03-27","end":"2027-03-29","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/B:closed-day` 3 days around the busiest closing day (weekday 0, 5 venues closed), from 2027-03-27: `{"start":"2027-03-27","end":"2027-03-29","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/C:1-pax` 1 traveller: `{"start":"","end":"","duration":3,"adults":1,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/C:2-pax` 2 travellers: `{"start":"","end":"","duration":3,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/C:max-pax` 12 adults + 8 children: `{"start":"","end":"","duration":3,"adults":12,"children":8,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/D:history` interest: history only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/D:food` interest: food only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/D:cafes` interest: cafes only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["cafes"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/D:art` interest: art only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["art"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/D:nightlife` interest: nightlife only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/D:photography` interest: photography only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/D:beaches` interest: beaches only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["beaches"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/D:nature` interest: nature only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nature"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/D:adventure` interest: adventure only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["adventure"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/D:culture` interest: culture only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["culture"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/D:luxury` interest: luxury only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["luxury"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/D:combo-3` 3 interests together: `{"start":"","end":"","duration":3,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["photography","nature","culture"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/D:combo-5` 5 interests together: `{"start":"","end":"","duration":3,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["photography","art","beaches","adventure","luxury"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/E:vegetarian` dietary: vegetarian: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["photography","history","food"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/E:vegan` dietary: vegan: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["photography","history","food"],"dietary":["vegan"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/E:halal` dietary: halal: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["photography","history","food"],"dietary":["halal"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/E:gluten-free` dietary: gluten-free: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["photography","history","food"],"dietary":["gluten-free"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/E:vegan+gluten-free` dietary: vegan and gluten-free: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["photography","history","food"],"dietary":["gluten-free","vegan"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/E:limited-mobility` limited mobility: `{"start":"","end":"","duration":3,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["photography","history","food"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/F:first-time` style: first-time: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["photography","history","food"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/F:foodie` style: foodie: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"foodie","interests":["photography","history","food"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/F:budget` style: budget: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"budget","interests":["photography","history","food"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/F:couple` style: couple: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"couple","interests":["photography","history","food"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/F:friends` style: friends: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"friends","interests":["photography","history","food"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/F:family` style: family: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"family","interests":["photography","history","food"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/F:relaxed` style: relaxed: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"relaxed","interests":["photography","history","food"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/F:adventure` style: adventure: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"adventure","interests":["photography","history","food"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/F:culture-history` style: culture-history: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"culture-history","interests":["photography","history","food"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/F:nightlife` style: nightlife: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"nightlife","interests":["photography","history","food"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["photography","history","food"],"dietary":[],"mustInclude":["london-eye","tower-of-london","r-rules","x-camden-market-wander"],"avoid":["british-museum","westminster-abbey"],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/G:closed-day` same, across the closing day: `{"start":"2027-03-27","end":"2027-03-29","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":["london-eye","tower-of-london","r-rules","x-camden-market-wander"],"avoid":["british-museum","westminster-abbey"],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/H:arrive-only` landing 09:10 on day 1: `{"start":"","end":"","duration":3,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"09:10","departureTime":"","slug":"london"}`
- `london/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"london"}`
- `london/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"london"}`
- `london/I:baseline` 3 days from 2027-06-01, 2 adults: `{"start":"2027-06-01","end":"2027-06-03","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/I:start-date` move the start date one day later (same length): `{"start":"2027-06-02","end":"2027-06-04","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/I:length` extend the trip by one day: `{"start":"2027-06-02","end":"2027-06-05","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/I:travellers` one more adult (2 to 3): `{"start":"2027-06-02","end":"2027-06-05","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/I:interest` add the Nightlife interest: `{"start":"2027-06-02","end":"2027-06-05","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/I:dietary` add Vegetarian: `{"start":"2027-06-02","end":"2027-06-05","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/I:mobility` limited mobility: `{"start":"2027-06-02","end":"2027-06-05","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-06-02","end":"2027-06-05","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/I:shuffle` shuffle day 2: `{"start":"2027-06-02","end":"2027-06-05","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `london/I:city` switch the city from london to lisbon: `{"start":"2027-06-02","end":"2027-06-05","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"lisbon"}`
- `dubai/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"dubai"}`
- `dubai/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"dubai"}`
- `dubai/B:weekday-start` Tue to Fri, from 2027-03-16: `{"start":"2027-03-16","end":"2027-03-19","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"dubai"}`
- `dubai/D:art` interest: art only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["art"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"dubai"}`
- `dubai/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","photography","history"],"dietary":[],"mustInclude":["museum-of-the-future","dubai-fountain","r-al-mallah","x-desert-safari-and-bedouin-camp-dinner"],"avoid":["desert-safari","al-fahidi-neighbourhood","burj-khalifa"],"arrivalTime":"","departureTime":"","slug":"dubai"}`
- `dubai/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"dubai"}`
- `dubai/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"dubai"}`
- `dubai/I:length` extend the trip by one day: `{"start":"2027-05-05","end":"2027-05-08","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"dubai"}`
- `dubai/I:travellers` one more adult (2 to 3): `{"start":"2027-05-05","end":"2027-05-08","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"dubai"}`
- `dubai/I:interest` add the Nightlife interest: `{"start":"2027-05-05","end":"2027-05-08","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"dubai"}`
- `dubai/I:dietary` add Vegetarian: `{"start":"2027-05-05","end":"2027-05-08","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"dubai"}`
- `dubai/I:mobility` limited mobility: `{"start":"2027-05-05","end":"2027-05-08","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"dubai"}`
- `dubai/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-05-05","end":"2027-05-08","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"dubai"}`
- `dubai/I:shuffle` shuffle day 2: `{"start":"2027-05-05","end":"2027-05-08","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"dubai"}`
- `dubai/I:city` switch the city from dubai to kyoto: `{"start":"2027-05-05","end":"2027-05-08","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"kyoto"}`
- `singapore/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"singapore"}`
- `singapore/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"singapore"}`
- `singapore/B:weekday-start` Tue to Fri, from 2027-04-06: `{"start":"2027-04-06","end":"2027-04-09","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"singapore"}`
- `singapore/D:art` interest: art only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["art"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"singapore"}`
- `singapore/D:adventure` interest: adventure only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["adventure"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"singapore"}`
- `singapore/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":[],"mustInclude":["singapore-botanic-gardens","merlion-park","r-old-airport-road-food-centre","x-gardens-by-the-bay-garden-rhapsody-light-show"],"avoid":["gardens-by-the-bay"],"arrivalTime":"","departureTime":"","slug":"singapore"}`
- `singapore/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"singapore"}`
- `singapore/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"singapore"}`
- `singapore/I:length` extend the trip by one day: `{"start":"2027-03-17","end":"2027-03-20","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"singapore"}`
- `singapore/I:travellers` one more adult (2 to 3): `{"start":"2027-03-17","end":"2027-03-20","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"singapore"}`
- `singapore/I:interest` add the Nightlife interest: `{"start":"2027-03-17","end":"2027-03-20","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"singapore"}`
- `singapore/I:dietary` add Vegetarian: `{"start":"2027-03-17","end":"2027-03-20","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"singapore"}`
- `singapore/I:mobility` limited mobility: `{"start":"2027-03-17","end":"2027-03-20","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"singapore"}`
- `singapore/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-03-17","end":"2027-03-20","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"singapore"}`
- `singapore/I:shuffle` shuffle day 2: `{"start":"2027-03-17","end":"2027-03-20","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"singapore"}`
- `singapore/I:city` switch the city from singapore to marrakesh: `{"start":"2027-03-17","end":"2027-03-20","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"marrakesh"}`
- `bangkok/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"bangkok"}`
- `bangkok/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"bangkok"}`
- `bangkok/B:weekday-start` Tue to Fri, from 2027-03-02: `{"start":"2027-03-02","end":"2027-03-05","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"bangkok"}`
- `bangkok/D:nightlife` interest: nightlife only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"bangkok"}`
- `bangkok/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":["wat-traimit","erawan-shrine","r-wattana-panich","x-traditional-thai-massage"],"avoid":["wat-pho","grand-palace","wat-arun"],"arrivalTime":"","departureTime":"","slug":"bangkok"}`
- `bangkok/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"bangkok"}`
- `bangkok/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"bangkok"}`
- `bangkok/I:length` extend the trip by one day: `{"start":"2027-04-14","end":"2027-04-17","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"bangkok"}`
- `bangkok/I:travellers` one more adult (2 to 3): `{"start":"2027-04-14","end":"2027-04-17","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"bangkok"}`
- `bangkok/I:interest` add the Nightlife interest: `{"start":"2027-04-14","end":"2027-04-17","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"bangkok"}`
- `bangkok/I:dietary` add Vegetarian: `{"start":"2027-04-14","end":"2027-04-17","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"bangkok"}`
- `bangkok/I:mobility` limited mobility: `{"start":"2027-04-14","end":"2027-04-17","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"bangkok"}`
- `bangkok/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-04-14","end":"2027-04-17","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"bangkok"}`
- `bangkok/I:shuffle` shuffle day 2: `{"start":"2027-04-14","end":"2027-04-17","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"bangkok"}`
- `bangkok/I:city` switch the city from bangkok to athens: `{"start":"2027-04-14","end":"2027-04-17","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"athens"}`
- `rome/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"rome"}`
- `rome/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"rome"}`
- `rome/B:weekday-start` Tue to Fri, from 2027-06-01: `{"start":"2027-06-01","end":"2027-06-04","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"rome"}`
- `rome/D:nature` interest: nature only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nature"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"rome"}`
- `rome/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","photography","history"],"dietary":[],"mustInclude":["spanish-steps","capitoline-museums","r-supplizio","x-appian-way-bike-ride"],"avoid":["pantheon","vatican-museums","st-peters-basilica"],"arrivalTime":"","departureTime":"","slug":"rome"}`
- `rome/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"rome"}`
- `rome/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"rome"}`
- `rome/I:length` extend the trip by one day: `{"start":"2027-03-03","end":"2027-03-06","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"rome"}`
- `rome/I:travellers` one more adult (2 to 3): `{"start":"2027-03-03","end":"2027-03-06","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"rome"}`
- `rome/I:interest` add the Nightlife interest: `{"start":"2027-03-03","end":"2027-03-06","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"rome"}`
- `rome/I:dietary` add Vegetarian: `{"start":"2027-03-03","end":"2027-03-06","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"rome"}`
- `rome/I:mobility` limited mobility: `{"start":"2027-03-03","end":"2027-03-06","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"rome"}`
- `rome/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-03-03","end":"2027-03-06","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"rome"}`
- `rome/I:shuffle` shuffle day 2: `{"start":"2027-03-03","end":"2027-03-06","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"rome"}`
- `rome/I:city` switch the city from rome to mumbai: `{"start":"2027-03-03","end":"2027-03-06","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"mumbai"}`
- `barcelona/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"barcelona"}`
- `barcelona/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"barcelona"}`
- `barcelona/B:weekday-start` Tue to Fri, from 2027-07-13: `{"start":"2027-07-13","end":"2027-07-16","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"barcelona"}`
- `barcelona/D:nightlife` interest: nightlife only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"barcelona"}`
- `barcelona/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":["sagrada-familia","bunkers-del-carmel","r-bar-del-pla","x-montjuic-cable-car-and-castle"],"avoid":["park-guell"],"arrivalTime":"","departureTime":"","slug":"barcelona"}`
- `barcelona/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"barcelona"}`
- `barcelona/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"barcelona"}`
- `barcelona/I:length` extend the trip by one day: `{"start":"2027-03-24","end":"2027-03-27","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"barcelona"}`
- `barcelona/I:travellers` one more adult (2 to 3): `{"start":"2027-03-24","end":"2027-03-27","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"barcelona"}`
- `barcelona/I:interest` add the Nightlife interest: `{"start":"2027-03-24","end":"2027-03-27","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"barcelona"}`
- `barcelona/I:dietary` add Vegetarian: `{"start":"2027-03-24","end":"2027-03-27","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"barcelona"}`
- `barcelona/I:mobility` limited mobility: `{"start":"2027-03-24","end":"2027-03-27","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"barcelona"}`
- `barcelona/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-03-24","end":"2027-03-27","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"barcelona"}`
- `barcelona/I:shuffle` shuffle day 2: `{"start":"2027-03-24","end":"2027-03-27","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"barcelona"}`
- `barcelona/I:city` switch the city from barcelona to osaka: `{"start":"2027-03-24","end":"2027-03-27","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"osaka"}`
- `new-york-city/A:1d` 1-day trip, undated: `{"start":"","end":"","duration":1,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/A:3d` 3-day trip, undated: `{"start":"","end":"","duration":3,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/B:weekday-start` Tue to Fri, from 2027-09-28: `{"start":"2027-09-28","end":"2027-10-01","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/B:weekend-start` Sat to Mon, from 2027-10-02: `{"start":"2027-10-02","end":"2027-10-04","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/B:closed-day` 3 days around the busiest closing day (weekday 0, 3 venues closed), from 2027-10-02: `{"start":"2027-10-02","end":"2027-10-04","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/C:1-pax` 1 traveller: `{"start":"","end":"","duration":3,"adults":1,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/C:2-pax` 2 travellers: `{"start":"","end":"","duration":3,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/C:max-pax` 12 adults + 8 children: `{"start":"","end":"","duration":3,"adults":12,"children":8,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/D:history` interest: history only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/D:food` interest: food only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/D:cafes` interest: cafes only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["cafes"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/D:shopping` interest: shopping only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["shopping"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/D:art` interest: art only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["art"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/D:nightlife` interest: nightlife only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/D:photography` interest: photography only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/D:beaches` interest: beaches only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["beaches"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/D:nature` interest: nature only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nature"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/D:adventure` interest: adventure only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["adventure"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/D:culture` interest: culture only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["culture"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/D:luxury` interest: luxury only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["luxury"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/D:combo-3` 3 interests together: `{"start":"","end":"","duration":3,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","art","beaches"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/D:combo-5` 5 interests together: `{"start":"","end":"","duration":3,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["art","beaches","nightlife","culture","luxury"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/E:vegetarian` dietary: vegetarian: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/E:vegan` dietary: vegan: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":["vegan"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/E:halal` dietary: halal: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":["halal"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/E:gluten-free` dietary: gluten-free: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":["gluten-free"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/E:vegan+gluten-free` dietary: vegan and gluten-free: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":["gluten-free","vegan"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/E:limited-mobility` limited mobility: `{"start":"","end":"","duration":3,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/F:first-time` style: first-time: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/F:foodie` style: foodie: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"foodie","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/F:luxury` style: luxury: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"luxury","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/F:budget` style: budget: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"budget","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/F:couple` style: couple: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"couple","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/F:friends` style: friends: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"friends","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/F:family` style: family: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"family","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/F:relaxed` style: relaxed: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"relaxed","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/F:adventure` style: adventure: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"adventure","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/F:shopping` style: shopping: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"shopping","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/F:culture-history` style: culture-history: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"culture-history","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/F:nightlife` style: nightlife: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"nightlife","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":[],"mustInclude":["times-square","american-museum-of-natural-history","r-le-bernardin","x-top-of-the-rock-at-sunset"],"avoid":["brooklyn-bridge","central-park","met-museum"],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/G:closed-day` same, across the closing day: `{"start":"2027-10-02","end":"2027-10-04","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":["times-square","american-museum-of-natural-history","r-le-bernardin","x-top-of-the-rock-at-sunset"],"avoid":["brooklyn-bridge","central-park","met-museum"],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/H:arrive-only` landing 09:10 on day 1: `{"start":"","end":"","duration":3,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"09:10","departureTime":"","slug":"new-york-city"}`
- `new-york-city/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"new-york-city"}`
- `new-york-city/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"new-york-city"}`
- `new-york-city/I:baseline` 3 days from 2027-09-07, 2 adults: `{"start":"2027-09-07","end":"2027-09-09","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/I:start-date` move the start date one day later (same length): `{"start":"2027-09-08","end":"2027-09-10","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/I:length` extend the trip by one day: `{"start":"2027-09-08","end":"2027-09-11","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/I:travellers` one more adult (2 to 3): `{"start":"2027-09-08","end":"2027-09-11","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/I:interest` add the Nightlife interest: `{"start":"2027-09-08","end":"2027-09-11","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/I:dietary` add Vegetarian: `{"start":"2027-09-08","end":"2027-09-11","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/I:mobility` limited mobility: `{"start":"2027-09-08","end":"2027-09-11","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-09-08","end":"2027-09-11","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/I:shuffle` shuffle day 2: `{"start":"2027-09-08","end":"2027-09-11","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `new-york-city/I:city` switch the city from new-york-city to cape-town: `{"start":"2027-09-08","end":"2027-09-11","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"cape-town"}`
- `istanbul/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"istanbul"}`
- `istanbul/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"istanbul"}`
- `istanbul/B:weekday-start` Tue to Fri, from 2027-07-06: `{"start":"2027-07-06","end":"2027-07-09","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"istanbul"}`
- `istanbul/D:nightlife` interest: nightlife only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"istanbul"}`
- `istanbul/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":[],"mustInclude":["topkapi-palace","hagia-sophia","r-mikla","x-whirling-dervish-ceremony"],"avoid":["grand-bazaar","blue-mosque","bosphorus-cruise"],"arrivalTime":"","departureTime":"","slug":"istanbul"}`
- `istanbul/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"istanbul"}`
- `istanbul/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"istanbul"}`
- `istanbul/I:length` extend the trip by one day: `{"start":"2027-09-29","end":"2027-10-02","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"istanbul"}`
- `istanbul/I:travellers` one more adult (2 to 3): `{"start":"2027-09-29","end":"2027-10-02","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"istanbul"}`
- `istanbul/I:interest` add the Nightlife interest: `{"start":"2027-09-29","end":"2027-10-02","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"istanbul"}`
- `istanbul/I:dietary` add Vegetarian: `{"start":"2027-09-29","end":"2027-10-02","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"istanbul"}`
- `istanbul/I:mobility` limited mobility: `{"start":"2027-09-29","end":"2027-10-02","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"istanbul"}`
- `istanbul/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-09-29","end":"2027-10-02","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"istanbul"}`
- `istanbul/I:shuffle` shuffle day 2: `{"start":"2027-09-29","end":"2027-10-02","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"istanbul"}`
- `istanbul/I:city` switch the city from istanbul to toronto: `{"start":"2027-09-29","end":"2027-10-02","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"toronto"}`
- `seoul/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"seoul"}`
- `seoul/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"seoul"}`
- `seoul/B:weekday-start` Tue to Fri, from 2027-03-23: `{"start":"2027-03-23","end":"2027-03-26","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"seoul"}`
- `seoul/D:nature` interest: nature only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nature"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"seoul"}`
- `seoul/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":["n-seoul-tower","gyeongbokgung","r-wooraeoak","x-korean-cooking-class"],"avoid":["bukchon-village"],"arrivalTime":"","departureTime":"","slug":"seoul"}`
- `seoul/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"seoul"}`
- `seoul/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"seoul"}`
- `seoul/I:length` extend the trip by one day: `{"start":"2027-08-25","end":"2027-08-28","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"seoul"}`
- `seoul/I:travellers` one more adult (2 to 3): `{"start":"2027-08-25","end":"2027-08-28","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"seoul"}`
- `seoul/I:interest` add the Nightlife interest: `{"start":"2027-08-25","end":"2027-08-28","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"seoul"}`
- `seoul/I:dietary` add Vegetarian: `{"start":"2027-08-25","end":"2027-08-28","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"seoul"}`
- `seoul/I:mobility` limited mobility: `{"start":"2027-08-25","end":"2027-08-28","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"seoul"}`
- `seoul/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-08-25","end":"2027-08-28","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"seoul"}`
- `seoul/I:shuffle` shuffle day 2: `{"start":"2027-08-25","end":"2027-08-28","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"seoul"}`
- `seoul/I:city` switch the city from seoul to barcelona: `{"start":"2027-08-25","end":"2027-08-28","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"barcelona"}`
- `amsterdam/A:1d` 1-day trip, undated: `{"start":"","end":"","duration":1,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/A:3d` 3-day trip, undated: `{"start":"","end":"","duration":3,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/B:weekday-start` Tue to Fri, from 2027-09-21: `{"start":"2027-09-21","end":"2027-09-24","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/B:weekend-start` Sat to Mon, from 2027-09-25: `{"start":"2027-09-25","end":"2027-09-27","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/B:closed-day` 3 days around the busiest closing day (weekday 0, 5 venues closed), from 2027-09-25: `{"start":"2027-09-25","end":"2027-09-27","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/C:1-pax` 1 traveller: `{"start":"","end":"","duration":3,"adults":1,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/C:2-pax` 2 travellers: `{"start":"","end":"","duration":3,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/C:max-pax` 12 adults + 8 children: `{"start":"","end":"","duration":3,"adults":12,"children":8,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/D:history` interest: history only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/D:food` interest: food only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/D:cafes` interest: cafes only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["cafes"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/D:shopping` interest: shopping only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["shopping"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/D:art` interest: art only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["art"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/D:nightlife` interest: nightlife only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/D:photography` interest: photography only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/D:beaches` interest: beaches only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["beaches"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/D:nature` interest: nature only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nature"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/D:adventure` interest: adventure only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["adventure"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/D:culture` interest: culture only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["culture"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/D:luxury` interest: luxury only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["luxury"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/D:combo-3` 3 interests together: `{"start":"","end":"","duration":3,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["shopping","art","culture"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/D:combo-5` 5 interests together: `{"start":"","end":"","duration":3,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["art","cafes","nightlife","nature","luxury"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/E:vegetarian` dietary: vegetarian: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/E:vegan` dietary: vegan: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":["vegan"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/E:halal` dietary: halal: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":["halal"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/E:gluten-free` dietary: gluten-free: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":["gluten-free"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/E:vegan+gluten-free` dietary: vegan and gluten-free: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":["gluten-free","vegan"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/E:limited-mobility` limited mobility: `{"start":"","end":"","duration":3,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/F:first-time` style: first-time: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/F:foodie` style: foodie: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"foodie","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/F:luxury` style: luxury: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"luxury","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/F:budget` style: budget: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"budget","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/F:couple` style: couple: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"couple","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/F:friends` style: friends: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"friends","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/F:family` style: family: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"family","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/F:relaxed` style: relaxed: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"relaxed","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/F:adventure` style: adventure: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"adventure","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/F:shopping` style: shopping: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"shopping","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/F:culture-history` style: culture-history: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"culture-history","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/F:nightlife` style: nightlife: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"nightlife","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":[],"mustInclude":["dam-square","vondelpark","r-albert-cuyp-stalls","x-heineken-experience"],"avoid":["rijksmuseum","van-gogh-museum","anne-frank-house"],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/H:arrive-only` landing 09:10 on day 1: `{"start":"","end":"","duration":3,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"09:10","departureTime":"","slug":"amsterdam"}`
- `amsterdam/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"amsterdam"}`
- `amsterdam/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"amsterdam"}`
- `amsterdam/H:both-1day` 1-day trip, landing 10:00 and flight 20:00: `{"start":"","end":"","duration":1,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"10:00","departureTime":"20:00","slug":"amsterdam"}`
- `amsterdam/I:baseline` 3 days from 2027-03-23, 2 adults: `{"start":"2027-03-23","end":"2027-03-25","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/I:start-date` move the start date one day later (same length): `{"start":"2027-03-24","end":"2027-03-26","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/I:length` extend the trip by one day: `{"start":"2027-03-24","end":"2027-03-27","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/I:travellers` one more adult (2 to 3): `{"start":"2027-03-24","end":"2027-03-27","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/I:interest` add the Nightlife interest: `{"start":"2027-03-24","end":"2027-03-27","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/I:dietary` add Vegetarian: `{"start":"2027-03-24","end":"2027-03-27","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/I:mobility` limited mobility: `{"start":"2027-03-24","end":"2027-03-27","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-03-24","end":"2027-03-27","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/I:shuffle` shuffle day 2: `{"start":"2027-03-24","end":"2027-03-27","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"amsterdam"}`
- `amsterdam/I:city` switch the city from amsterdam to florence: `{"start":"2027-03-24","end":"2027-03-27","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"florence"}`
- `copenhagen/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"copenhagen"}`
- `copenhagen/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"copenhagen"}`
- `copenhagen/B:weekday-start` Tue to Fri, from 2027-07-06: `{"start":"2027-07-06","end":"2027-07-09","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"copenhagen"}`
- `copenhagen/C:max-pax` 12 adults + 8 children: `{"start":"","end":"","duration":3,"adults":12,"children":8,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"copenhagen"}`
- `copenhagen/D:art` interest: art only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["art"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"copenhagen"}`
- `copenhagen/D:nightlife` interest: nightlife only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"copenhagen"}`
- `copenhagen/D:combo-5` 5 interests together: `{"start":"","end":"","duration":3,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","shopping","nightlife","photography","nature"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"copenhagen"}`
- `copenhagen/E:limited-mobility` limited mobility: `{"start":"","end":"","duration":3,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","photography","history"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"copenhagen"}`
- `copenhagen/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","photography","history"],"dietary":[],"mustInclude":["amalienborg","christiania","r-restaurant-schnnemann","x-tivoli-gardens-at-night"],"avoid":["nyhavn"],"arrivalTime":"","departureTime":"","slug":"copenhagen"}`
- `copenhagen/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"copenhagen"}`
- `copenhagen/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"copenhagen"}`
- `copenhagen/I:length` extend the trip by one day: `{"start":"2027-07-28","end":"2027-07-31","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"copenhagen"}`
- `copenhagen/I:travellers` one more adult (2 to 3): `{"start":"2027-07-28","end":"2027-07-31","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"copenhagen"}`
- `copenhagen/I:interest` add the Nightlife interest: `{"start":"2027-07-28","end":"2027-07-31","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"copenhagen"}`
- `copenhagen/I:dietary` add Vegetarian: `{"start":"2027-07-28","end":"2027-07-31","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"copenhagen"}`
- `copenhagen/I:mobility` limited mobility: `{"start":"2027-07-28","end":"2027-07-31","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"copenhagen"}`
- `copenhagen/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-07-28","end":"2027-07-31","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"copenhagen"}`
- `copenhagen/I:shuffle` shuffle day 2: `{"start":"2027-07-28","end":"2027-07-31","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"copenhagen"}`
- `copenhagen/I:city` switch the city from copenhagen to chicago: `{"start":"2027-07-28","end":"2027-07-31","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"chicago"}`
- `hong-kong/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"hong-kong"}`
- `hong-kong/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"hong-kong"}`
- `hong-kong/B:weekday-start` Tue to Fri, from 2027-09-21: `{"start":"2027-09-21","end":"2027-09-24","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"hong-kong"}`
- `hong-kong/D:art` interest: art only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["art"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"hong-kong"}`
- `hong-kong/D:nature` interest: nature only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nature"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"hong-kong"}`
- `hong-kong/D:adventure` interest: adventure only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["adventure"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"hong-kong"}`
- `hong-kong/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":[],"mustInclude":["chi-lin-nunnery-nan-lian-garden","symphony-of-lights","r-temple-street-stalls","x-tram-ride-ding-ding-across-hong-kong-island"],"avoid":["star-ferry","victoria-peak"],"arrivalTime":"","departureTime":"","slug":"hong-kong"}`
- `hong-kong/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"hong-kong"}`
- `hong-kong/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"hong-kong"}`
- `hong-kong/I:length` extend the trip by one day: `{"start":"2027-03-10","end":"2027-03-13","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"hong-kong"}`
- `hong-kong/I:travellers` one more adult (2 to 3): `{"start":"2027-03-10","end":"2027-03-13","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"hong-kong"}`
- `hong-kong/I:interest` add the Nightlife interest: `{"start":"2027-03-10","end":"2027-03-13","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"hong-kong"}`
- `hong-kong/I:dietary` add Vegetarian: `{"start":"2027-03-10","end":"2027-03-13","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"hong-kong"}`
- `hong-kong/I:mobility` limited mobility: `{"start":"2027-03-10","end":"2027-03-13","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"hong-kong"}`
- `hong-kong/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-03-10","end":"2027-03-13","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"hong-kong"}`
- `hong-kong/I:shuffle` shuffle day 2: `{"start":"2027-03-10","end":"2027-03-13","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"hong-kong"}`
- `hong-kong/I:city` switch the city from hong-kong to venice: `{"start":"2027-03-10","end":"2027-03-13","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `sydney/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"sydney"}`
- `sydney/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"sydney"}`
- `sydney/B:weekday-start` Tue to Fri, from 2027-07-27: `{"start":"2027-07-27","end":"2027-07-30","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"sydney"}`
- `sydney/D:combo-5` 5 interests together: `{"start":"","end":"","duration":3,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["cafes","beaches","adventure","culture","luxury"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"sydney"}`
- `sydney/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":[],"mustInclude":["art-gallery-nsw","royal-botanic-garden","r-mamak","x-bondi-to-coogee-coastal-walk"],"avoid":["bondi-coogee-walk","opera-house","harbour-bridge"],"arrivalTime":"","departureTime":"","slug":"sydney"}`
- `sydney/G:closed-day` same, across the closing day: `{"start":"2027-07-31","end":"2027-08-02","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":["art-gallery-nsw","royal-botanic-garden","r-mamak","x-bondi-to-coogee-coastal-walk"],"avoid":["bondi-coogee-walk","opera-house","harbour-bridge"],"arrivalTime":"","departureTime":"","slug":"sydney"}`
- `sydney/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"sydney"}`
- `sydney/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"sydney"}`
- `sydney/I:length` extend the trip by one day: `{"start":"2027-09-22","end":"2027-09-25","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"sydney"}`
- `sydney/I:travellers` one more adult (2 to 3): `{"start":"2027-09-22","end":"2027-09-25","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"sydney"}`
- `sydney/I:interest` add the Nightlife interest: `{"start":"2027-09-22","end":"2027-09-25","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"sydney"}`
- `sydney/I:dietary` add Vegetarian: `{"start":"2027-09-22","end":"2027-09-25","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"sydney"}`
- `sydney/I:mobility` limited mobility: `{"start":"2027-09-22","end":"2027-09-25","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"sydney"}`
- `sydney/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-09-22","end":"2027-09-25","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"sydney"}`
- `sydney/I:shuffle` shuffle day 2: `{"start":"2027-09-22","end":"2027-09-25","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"sydney"}`
- `sydney/I:city` switch the city from sydney to london: `{"start":"2027-09-22","end":"2027-09-25","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"london"}`
- `zurich/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"zurich"}`
- `zurich/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"zurich"}`
- `zurich/B:weekday-start` Tue to Fri, from 2027-08-10: `{"start":"2027-08-10","end":"2027-08-13","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"zurich"}`
- `zurich/D:nightlife` interest: nightlife only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"zurich"}`
- `zurich/D:culture` interest: culture only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["culture"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"zurich"}`
- `zurich/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["photography","history","food"],"dietary":[],"mustInclude":["freitag-tower","fraumunster","r-raclette-stube","x-old-town-self-guided-walking-tour"],"avoid":["grossmunster"],"arrivalTime":"","departureTime":"","slug":"zurich"}`
- `zurich/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"zurich"}`
- `zurich/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"zurich"}`
- `zurich/I:length` extend the trip by one day: `{"start":"2027-07-07","end":"2027-07-10","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"zurich"}`
- `zurich/I:travellers` one more adult (2 to 3): `{"start":"2027-07-07","end":"2027-07-10","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"zurich"}`
- `zurich/I:interest` add the Nightlife interest: `{"start":"2027-07-07","end":"2027-07-10","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"zurich"}`
- `zurich/I:dietary` add Vegetarian: `{"start":"2027-07-07","end":"2027-07-10","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"zurich"}`
- `zurich/I:mobility` limited mobility: `{"start":"2027-07-07","end":"2027-07-10","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"zurich"}`
- `zurich/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-07-07","end":"2027-07-10","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"zurich"}`
- `zurich/I:shuffle` shuffle day 2: `{"start":"2027-07-07","end":"2027-07-10","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"zurich"}`
- `zurich/I:city` switch the city from zurich to new-york-city: `{"start":"2027-07-07","end":"2027-07-10","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"new-york-city"}`
- `los-angeles/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"los-angeles"}`
- `los-angeles/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"los-angeles"}`
- `los-angeles/B:weekday-start` Tue to Fri, from 2027-04-20: `{"start":"2027-04-20","end":"2027-04-23","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"los-angeles"}`
- `los-angeles/D:art` interest: art only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["art"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"los-angeles"}`
- `los-angeles/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["photography","food","history"],"dietary":[],"mustInclude":["santa-monica-pier","hollywood-walk-of-fame","r-musso-frank-grill","x-getty-center-architecture-and-garden-walk"],"avoid":["griffith-observatory"],"arrivalTime":"","departureTime":"","slug":"los-angeles"}`
- `los-angeles/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"los-angeles"}`
- `los-angeles/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"los-angeles"}`
- `los-angeles/I:length` extend the trip by one day: `{"start":"2027-09-22","end":"2027-09-25","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"los-angeles"}`
- `los-angeles/I:travellers` one more adult (2 to 3): `{"start":"2027-09-22","end":"2027-09-25","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"los-angeles"}`
- `los-angeles/I:interest` add the Nightlife interest: `{"start":"2027-09-22","end":"2027-09-25","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"los-angeles"}`
- `los-angeles/I:dietary` add Vegetarian: `{"start":"2027-09-22","end":"2027-09-25","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"los-angeles"}`
- `los-angeles/I:mobility` limited mobility: `{"start":"2027-09-22","end":"2027-09-25","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"los-angeles"}`
- `los-angeles/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-09-22","end":"2027-09-25","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"los-angeles"}`
- `los-angeles/I:shuffle` shuffle day 2: `{"start":"2027-09-22","end":"2027-09-25","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"los-angeles"}`
- `los-angeles/I:city` switch the city from los-angeles to milan: `{"start":"2027-09-22","end":"2027-09-25","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"milan"}`
- `kuala-lumpur/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"kuala-lumpur"}`
- `kuala-lumpur/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"kuala-lumpur"}`
- `kuala-lumpur/B:weekday-start` Tue to Fri, from 2027-07-20: `{"start":"2027-07-20","end":"2027-07-23","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"kuala-lumpur"}`
- `kuala-lumpur/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":["jalan-alor","merdeka-square-dataran-merdeka","r-lot-10-hutong","x-petronas-towers-skybridge-and-observation-deck"],"avoid":["batu-caves","petronas-towers"],"arrivalTime":"","departureTime":"","slug":"kuala-lumpur"}`
- `kuala-lumpur/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"kuala-lumpur"}`
- `kuala-lumpur/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"kuala-lumpur"}`
- `kuala-lumpur/I:length` extend the trip by one day: `{"start":"2027-09-15","end":"2027-09-18","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"kuala-lumpur"}`
- `kuala-lumpur/I:travellers` one more adult (2 to 3): `{"start":"2027-09-15","end":"2027-09-18","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"kuala-lumpur"}`
- `kuala-lumpur/I:interest` add the Nightlife interest: `{"start":"2027-09-15","end":"2027-09-18","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"kuala-lumpur"}`
- `kuala-lumpur/I:dietary` add Vegetarian: `{"start":"2027-09-15","end":"2027-09-18","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"kuala-lumpur"}`
- `kuala-lumpur/I:mobility` limited mobility: `{"start":"2027-09-15","end":"2027-09-18","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"kuala-lumpur"}`
- `kuala-lumpur/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-09-15","end":"2027-09-18","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"kuala-lumpur"}`
- `kuala-lumpur/I:shuffle` shuffle day 2: `{"start":"2027-09-15","end":"2027-09-18","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"kuala-lumpur"}`
- `kuala-lumpur/I:city` switch the city from kuala-lumpur to paris: `{"start":"2027-09-15","end":"2027-09-18","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"paris"}`
- `vienna/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"vienna"}`
- `vienna/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"vienna"}`
- `vienna/B:weekday-start` Tue to Fri, from 2027-06-22: `{"start":"2027-06-22","end":"2027-06-25","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"vienna"}`
- `vienna/D:nature` interest: nature only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nature"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"vienna"}`
- `vienna/D:adventure` interest: adventure only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["adventure"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"vienna"}`
- `vienna/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":["karlskirche","hofburg-palace","r-naschmarkt-stalls","x-schonbrunn-gardens-and-gloriette-walk"],"avoid":["st-stephens-cathedral","belvedere","schonbrunn-palace"],"arrivalTime":"","departureTime":"","slug":"vienna"}`
- `vienna/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"vienna"}`
- `vienna/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"vienna"}`
- `vienna/I:length` extend the trip by one day: `{"start":"2027-03-31","end":"2027-04-03","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"vienna"}`
- `vienna/I:travellers` one more adult (2 to 3): `{"start":"2027-03-31","end":"2027-04-03","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"vienna"}`
- `vienna/I:interest` add the Nightlife interest: `{"start":"2027-03-31","end":"2027-04-03","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"vienna"}`
- `vienna/I:dietary` add Vegetarian: `{"start":"2027-03-31","end":"2027-04-03","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"vienna"}`
- `vienna/I:mobility` limited mobility: `{"start":"2027-03-31","end":"2027-04-03","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"vienna"}`
- `vienna/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-03-31","end":"2027-04-03","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"vienna"}`
- `vienna/I:shuffle` shuffle day 2: `{"start":"2027-03-31","end":"2027-04-03","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"vienna"}`
- `vienna/I:city` switch the city from vienna to krakow: `{"start":"2027-03-31","end":"2027-04-03","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"krakow"}`
- `lisbon/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"lisbon"}`
- `lisbon/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"lisbon"}`
- `lisbon/B:weekday-start` Tue to Fri, from 2027-09-07: `{"start":"2027-09-07","end":"2027-09-10","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"lisbon"}`
- `lisbon/D:nightlife` interest: nightlife only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"lisbon"}`
- `lisbon/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":["tram-28","museu-nacional-do-azulejo","r-cervejaria-ramiro","x-portuguese-wine-tasting"],"avoid":["sao-jorge-castle","belem-tower"],"arrivalTime":"","departureTime":"","slug":"lisbon"}`
- `lisbon/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"lisbon"}`
- `lisbon/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"lisbon"}`
- `lisbon/I:length` extend the trip by one day: `{"start":"2027-04-28","end":"2027-05-01","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"lisbon"}`
- `lisbon/I:travellers` one more adult (2 to 3): `{"start":"2027-04-28","end":"2027-05-01","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"lisbon"}`
- `lisbon/I:interest` add the Nightlife interest: `{"start":"2027-04-28","end":"2027-05-01","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"lisbon"}`
- `lisbon/I:dietary` add Vegetarian: `{"start":"2027-04-28","end":"2027-05-01","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"lisbon"}`
- `lisbon/I:mobility` limited mobility: `{"start":"2027-04-28","end":"2027-05-01","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"lisbon"}`
- `lisbon/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-04-28","end":"2027-05-01","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"lisbon"}`
- `lisbon/I:shuffle` shuffle day 2: `{"start":"2027-04-28","end":"2027-05-01","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"lisbon"}`
- `lisbon/I:city` switch the city from lisbon to athens: `{"start":"2027-04-28","end":"2027-05-01","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"athens"}`
- `prague/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"prague"}`
- `prague/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"prague"}`
- `prague/B:weekday-start` Tue to Fri, from 2027-03-16: `{"start":"2027-03-16","end":"2027-03-19","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"prague"}`
- `prague/D:art` interest: art only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["art"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"prague"}`
- `prague/D:nature` interest: nature only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nature"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"prague"}`
- `prague/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["photography","history","food"],"dietary":[],"mustInclude":["prague-castle","vysehrad","r-maitrea","x-classical-concert"],"avoid":["charles-bridge","st-vitus-cathedral","old-town-square-and-the-astronomical-clock"],"arrivalTime":"","departureTime":"","slug":"prague"}`
- `prague/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"prague"}`
- `prague/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"prague"}`
- `prague/I:length` extend the trip by one day: `{"start":"2027-05-26","end":"2027-05-29","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"prague"}`
- `prague/I:travellers` one more adult (2 to 3): `{"start":"2027-05-26","end":"2027-05-29","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"prague"}`
- `prague/I:interest` add the Nightlife interest: `{"start":"2027-05-26","end":"2027-05-29","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"prague"}`
- `prague/I:dietary` add Vegetarian: `{"start":"2027-05-26","end":"2027-05-29","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"prague"}`
- `prague/I:mobility` limited mobility: `{"start":"2027-05-26","end":"2027-05-29","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"prague"}`
- `prague/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-05-26","end":"2027-05-29","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"prague"}`
- `prague/I:shuffle` shuffle day 2: `{"start":"2027-05-26","end":"2027-05-29","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"prague"}`
- `prague/I:city` switch the city from prague to edinburgh: `{"start":"2027-05-26","end":"2027-05-29","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"edinburgh"}`
- `berlin/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"berlin"}`
- `berlin/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"berlin"}`
- `berlin/B:weekday-start` Tue to Fri, from 2027-08-10: `{"start":"2027-08-10","end":"2027-08-13","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"berlin"}`
- `berlin/D:nightlife` interest: nightlife only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"berlin"}`
- `berlin/D:nature` interest: nature only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nature"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"berlin"}`
- `berlin/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["photography","history","food"],"dietary":[],"mustInclude":["checkpoint-charlie","berlin-wall-memorial","r-clarchens-ballhaus","x-spree-river-cruise"],"avoid":["reichstag-building-and-dome","memorial-to-the-murdered-jews-of-europe","museum-island"],"arrivalTime":"","departureTime":"","slug":"berlin"}`
- `berlin/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"berlin"}`
- `berlin/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"berlin"}`
- `berlin/I:length` extend the trip by one day: `{"start":"2027-08-18","end":"2027-08-21","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"berlin"}`
- `berlin/I:travellers` one more adult (2 to 3): `{"start":"2027-08-18","end":"2027-08-21","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"berlin"}`
- `berlin/I:interest` add the Nightlife interest: `{"start":"2027-08-18","end":"2027-08-21","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"berlin"}`
- `berlin/I:dietary` add Vegetarian: `{"start":"2027-08-18","end":"2027-08-21","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"berlin"}`
- `berlin/I:mobility` limited mobility: `{"start":"2027-08-18","end":"2027-08-21","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"berlin"}`
- `berlin/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-08-18","end":"2027-08-21","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"berlin"}`
- `berlin/I:shuffle` shuffle day 2: `{"start":"2027-08-18","end":"2027-08-21","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"berlin"}`
- `berlin/I:city` switch the city from berlin to melbourne: `{"start":"2027-08-18","end":"2027-08-21","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"melbourne"}`
- `madrid/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"madrid"}`
- `madrid/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"madrid"}`
- `madrid/B:weekday-start` Tue to Fri, from 2027-03-02: `{"start":"2027-03-02","end":"2027-03-05","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"madrid"}`
- `madrid/D:nightlife` interest: nightlife only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"madrid"}`
- `madrid/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":["santiago-bernabeu-stadium","thyssen-bornemisza-museum","r-taberna-la-bola","x-rowing-boat-on-the-retiro-lake"],"avoid":["prado-museum","royal-palace-of-madrid","reina-sofia-museum"],"arrivalTime":"","departureTime":"","slug":"madrid"}`
- `madrid/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"madrid"}`
- `madrid/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"madrid"}`
- `madrid/I:length` extend the trip by one day: `{"start":"2027-05-12","end":"2027-05-15","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"madrid"}`
- `madrid/I:travellers` one more adult (2 to 3): `{"start":"2027-05-12","end":"2027-05-15","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"madrid"}`
- `madrid/I:interest` add the Nightlife interest: `{"start":"2027-05-12","end":"2027-05-15","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"madrid"}`
- `madrid/I:dietary` add Vegetarian: `{"start":"2027-05-12","end":"2027-05-15","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"madrid"}`
- `madrid/I:mobility` limited mobility: `{"start":"2027-05-12","end":"2027-05-15","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"madrid"}`
- `madrid/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-05-12","end":"2027-05-15","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"madrid"}`
- `madrid/I:shuffle` shuffle day 2: `{"start":"2027-05-12","end":"2027-05-15","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"madrid"}`
- `madrid/I:city` switch the city from madrid to seoul: `{"start":"2027-05-12","end":"2027-05-15","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"seoul"}`
- `milan/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"milan"}`
- `milan/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"milan"}`
- `milan/B:weekday-start` Tue to Fri, from 2027-03-02: `{"start":"2027-03-02","end":"2027-03-05","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"milan"}`
- `milan/D:nightlife` interest: nightlife only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"milan"}`
- `milan/D:culture` interest: culture only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["culture"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"milan"}`
- `milan/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":[],"mustInclude":["milan-cathedral-duomo-di-milano","navigli-canals","r-ratana","x-duomo-rooftop-walk"],"avoid":["the-last-supper-cenacolo-vinciano","galleria-vittorio-emanuele-ii"],"arrivalTime":"","departureTime":"","slug":"milan"}`
- `milan/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"milan"}`
- `milan/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"milan"}`
- `milan/I:length` extend the trip by one day: `{"start":"2027-06-09","end":"2027-06-12","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"milan"}`
- `milan/I:travellers` one more adult (2 to 3): `{"start":"2027-06-09","end":"2027-06-12","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"milan"}`
- `milan/I:interest` add the Nightlife interest: `{"start":"2027-06-09","end":"2027-06-12","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"milan"}`
- `milan/I:dietary` add Vegetarian: `{"start":"2027-06-09","end":"2027-06-12","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"milan"}`
- `milan/I:mobility` limited mobility: `{"start":"2027-06-09","end":"2027-06-12","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"milan"}`
- `milan/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-06-09","end":"2027-06-12","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"milan"}`
- `milan/I:shuffle` shuffle day 2: `{"start":"2027-06-09","end":"2027-06-12","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"milan"}`
- `milan/I:city` switch the city from milan to miami: `{"start":"2027-06-09","end":"2027-06-12","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"miami"}`
- `florence/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"florence"}`
- `florence/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"florence"}`
- `florence/B:weekday-start` Tue to Fri, from 2027-06-29: `{"start":"2027-06-29","end":"2027-07-02","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"florence"}`
- `florence/D:nature` interest: nature only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nature"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"florence"}`
- `florence/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":[],"mustInclude":["uffizi-gallery","mercato-centrale","r-trattoria-za-za","x-tuscan-cooking-class"],"avoid":["accademia-gallery-michelangelo-s-david","florence-cathedral-and-brunelleschi-s-dome"],"arrivalTime":"","departureTime":"","slug":"florence"}`
- `florence/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"florence"}`
- `florence/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"florence"}`
- `florence/I:length` extend the trip by one day: `{"start":"2027-06-02","end":"2027-06-05","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"florence"}`
- `florence/I:travellers` one more adult (2 to 3): `{"start":"2027-06-02","end":"2027-06-05","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"florence"}`
- `florence/I:interest` add the Nightlife interest: `{"start":"2027-06-02","end":"2027-06-05","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"florence"}`
- `florence/I:dietary` add Vegetarian: `{"start":"2027-06-02","end":"2027-06-05","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"florence"}`
- `florence/I:mobility` limited mobility: `{"start":"2027-06-02","end":"2027-06-05","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"florence"}`
- `florence/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-06-02","end":"2027-06-05","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"florence"}`
- `florence/I:shuffle` shuffle day 2: `{"start":"2027-06-02","end":"2027-06-05","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"florence"}`
- `florence/I:city` switch the city from florence to taipei: `{"start":"2027-06-02","end":"2027-06-05","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"taipei"}`
- `venice/A:3d` 3-day trip, undated: `{"start":"","end":"","duration":3,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/B:weekday-start` Tue to Fri, from 2027-03-16: `{"start":"2027-03-16","end":"2027-03-19","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/B:weekend-start` Sat to Mon, from 2027-03-20: `{"start":"2027-03-20","end":"2027-03-22","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/B:closed-day` 3 days around the busiest closing day (weekday 0, 7 venues closed), from 2027-03-20: `{"start":"2027-03-20","end":"2027-03-22","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/C:1-pax` 1 traveller: `{"start":"","end":"","duration":3,"adults":1,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/C:2-pax` 2 travellers: `{"start":"","end":"","duration":3,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/C:max-pax` 12 adults + 8 children: `{"start":"","end":"","duration":3,"adults":12,"children":8,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/D:history` interest: history only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/D:food` interest: food only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/D:cafes` interest: cafes only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["cafes"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/D:art` interest: art only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["art"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/D:nightlife` interest: nightlife only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/D:photography` interest: photography only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/D:beaches` interest: beaches only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["beaches"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/D:nature` interest: nature only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nature"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/D:adventure` interest: adventure only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["adventure"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/D:culture` interest: culture only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["culture"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/D:luxury` interest: luxury only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["luxury"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/D:combo-3` 3 interests together: `{"start":"","end":"","duration":3,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["luxury","photography","culture"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/E:vegetarian` dietary: vegetarian: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/E:vegan` dietary: vegan: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":["vegan"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/E:halal` dietary: halal: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":["halal"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/E:gluten-free` dietary: gluten-free: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":["gluten-free"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/E:vegan+gluten-free` dietary: vegan and gluten-free: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":["gluten-free","vegan"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/E:limited-mobility` limited mobility: `{"start":"","end":"","duration":3,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/F:first-time` style: first-time: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/F:foodie` style: foodie: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"foodie","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/F:budget` style: budget: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"budget","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/F:couple` style: couple: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"couple","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/F:friends` style: friends: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"friends","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/F:family` style: family: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"family","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/F:relaxed` style: relaxed: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"relaxed","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/F:adventure` style: adventure: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"adventure","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/F:culture-history` style: culture-history: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"culture-history","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/F:nightlife` style: nightlife: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"nightlife","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":[],"mustInclude":["rialto-market","piazza-san-marco-and-the-campanile","r-anice-stellato","x-vaporetto-along-the-grand-canal"],"avoid":["grand-canal","doge-s-palace","st-mark-s-basilica"],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/H:arrive-only` landing 09:10 on day 1: `{"start":"","end":"","duration":3,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"09:10","departureTime":"","slug":"venice"}`
- `venice/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"venice"}`
- `venice/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"venice"}`
- `venice/I:baseline` 3 days from 2027-09-07, 2 adults: `{"start":"2027-09-07","end":"2027-09-09","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/I:start-date` move the start date one day later (same length): `{"start":"2027-09-08","end":"2027-09-10","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/I:length` extend the trip by one day: `{"start":"2027-09-08","end":"2027-09-11","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/I:travellers` one more adult (2 to 3): `{"start":"2027-09-08","end":"2027-09-11","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/I:interest` add the Nightlife interest: `{"start":"2027-09-08","end":"2027-09-11","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/I:dietary` add Vegetarian: `{"start":"2027-09-08","end":"2027-09-11","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/I:mobility` limited mobility: `{"start":"2027-09-08","end":"2027-09-11","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-09-08","end":"2027-09-11","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/I:shuffle` shuffle day 2: `{"start":"2027-09-08","end":"2027-09-11","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"venice"}`
- `venice/I:city` switch the city from venice to cape-town: `{"start":"2027-09-08","end":"2027-09-11","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"cape-town"}`
- `athens/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"athens"}`
- `athens/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"athens"}`
- `athens/B:weekday-start` Tue to Fri, from 2027-03-09: `{"start":"2027-03-09","end":"2027-03-12","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"athens"}`
- `athens/D:nightlife` interest: nightlife only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"athens"}`
- `athens/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","photography","history"],"dietary":[],"mustInclude":["hadrian-s-library","benaki-museum-of-greek-culture","r-diporto-agoras","x-athens-street-food-tour"],"avoid":["acropolis-and-the-parthenon","acropolis-museum"],"arrivalTime":"","departureTime":"","slug":"athens"}`
- `athens/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"athens"}`
- `athens/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"athens"}`
- `athens/I:length` extend the trip by one day: `{"start":"2027-08-18","end":"2027-08-21","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"athens"}`
- `athens/I:travellers` one more adult (2 to 3): `{"start":"2027-08-18","end":"2027-08-21","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"athens"}`
- `athens/I:interest` add the Nightlife interest: `{"start":"2027-08-18","end":"2027-08-21","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"athens"}`
- `athens/I:dietary` add Vegetarian: `{"start":"2027-08-18","end":"2027-08-21","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"athens"}`
- `athens/I:mobility` limited mobility: `{"start":"2027-08-18","end":"2027-08-21","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"athens"}`
- `athens/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-08-18","end":"2027-08-21","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"athens"}`
- `athens/I:shuffle` shuffle day 2: `{"start":"2027-08-18","end":"2027-08-21","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"athens"}`
- `athens/I:city` switch the city from athens to dubai: `{"start":"2027-08-18","end":"2027-08-21","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"dubai"}`
- `budapest/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"budapest"}`
- `budapest/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"budapest"}`
- `budapest/B:weekday-start` Tue to Fri, from 2027-09-28: `{"start":"2027-09-28","end":"2027-10-01","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"budapest"}`
- `budapest/D:art` interest: art only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["art"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"budapest"}`
- `budapest/D:nightlife` interest: nightlife only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"budapest"}`
- `budapest/D:nature` interest: nature only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nature"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"budapest"}`
- `budapest/D:culture` interest: culture only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["culture"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"budapest"}`
- `budapest/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":[],"mustInclude":["heroes-square","margaret-island","r-pest-buda-bistro","x-thermal-bath-day"],"avoid":["buda-castle-and-castle-hill","fisherman-s-bastion-and-matthias-church","hungarian-parliament-building"],"arrivalTime":"","departureTime":"","slug":"budapest"}`
- `budapest/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"budapest"}`
- `budapest/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"budapest"}`
- `budapest/I:length` extend the trip by one day: `{"start":"2027-06-16","end":"2027-06-19","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"budapest"}`
- `budapest/I:travellers` one more adult (2 to 3): `{"start":"2027-06-16","end":"2027-06-19","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"budapest"}`
- `budapest/I:interest` add the Nightlife interest: `{"start":"2027-06-16","end":"2027-06-19","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"budapest"}`
- `budapest/I:dietary` add Vegetarian: `{"start":"2027-06-16","end":"2027-06-19","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"budapest"}`
- `budapest/I:mobility` limited mobility: `{"start":"2027-06-16","end":"2027-06-19","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"budapest"}`
- `budapest/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-06-16","end":"2027-06-19","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"budapest"}`
- `budapest/I:shuffle` shuffle day 2: `{"start":"2027-06-16","end":"2027-06-19","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"budapest"}`
- `budapest/I:city` switch the city from budapest to toronto: `{"start":"2027-06-16","end":"2027-06-19","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"toronto"}`
- `munich/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"munich"}`
- `munich/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"munich"}`
- `munich/B:weekday-start` Tue to Fri, from 2027-04-06: `{"start":"2027-04-06","end":"2027-04-09","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"munich"}`
- `munich/D:adventure` interest: adventure only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["adventure"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"munich"}`
- `munich/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":[],"mustInclude":["st-peter-s-church-alter-peter","englischer-garten","r-weisses-brauhaus","x-viktualienmarkt-tasting-walk"],"avoid":["marienplatz-and-the-neues-rathaus"],"arrivalTime":"","departureTime":"","slug":"munich"}`
- `munich/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"munich"}`
- `munich/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"munich"}`
- `munich/I:length` extend the trip by one day: `{"start":"2027-04-14","end":"2027-04-17","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"munich"}`
- `munich/I:travellers` one more adult (2 to 3): `{"start":"2027-04-14","end":"2027-04-17","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"munich"}`
- `munich/I:interest` add the Nightlife interest: `{"start":"2027-04-14","end":"2027-04-17","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"munich"}`
- `munich/I:dietary` add Vegetarian: `{"start":"2027-04-14","end":"2027-04-17","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"munich"}`
- `munich/I:mobility` limited mobility: `{"start":"2027-04-14","end":"2027-04-17","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"munich"}`
- `munich/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-04-14","end":"2027-04-17","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"munich"}`
- `munich/I:shuffle` shuffle day 2: `{"start":"2027-04-14","end":"2027-04-17","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"munich"}`
- `munich/I:city` switch the city from munich to milan: `{"start":"2027-04-14","end":"2027-04-17","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"milan"}`
- `edinburgh/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"edinburgh"}`
- `edinburgh/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"edinburgh"}`
- `edinburgh/B:weekday-start` Tue to Fri, from 2027-04-20: `{"start":"2027-04-20","end":"2027-04-23","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"edinburgh"}`
- `edinburgh/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":[],"mustInclude":["princes-street-gardens","scottish-national-gallery","r-the-kitchin","x-underground-vaults-ghost-tour"],"avoid":["the-royal-mile","arthur-s-seat-and-holyrood-park","edinburgh-castle"],"arrivalTime":"","departureTime":"","slug":"edinburgh"}`
- `edinburgh/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"edinburgh"}`
- `edinburgh/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"edinburgh"}`
- `edinburgh/I:length` extend the trip by one day: `{"start":"2027-03-31","end":"2027-04-03","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"edinburgh"}`
- `edinburgh/I:travellers` one more adult (2 to 3): `{"start":"2027-03-31","end":"2027-04-03","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"edinburgh"}`
- `edinburgh/I:interest` add the Nightlife interest: `{"start":"2027-03-31","end":"2027-04-03","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"edinburgh"}`
- `edinburgh/I:dietary` add Vegetarian: `{"start":"2027-03-31","end":"2027-04-03","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"edinburgh"}`
- `edinburgh/I:mobility` limited mobility: `{"start":"2027-03-31","end":"2027-04-03","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"edinburgh"}`
- `edinburgh/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-03-31","end":"2027-04-03","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"edinburgh"}`
- `edinburgh/I:shuffle` shuffle day 2: `{"start":"2027-03-31","end":"2027-04-03","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"edinburgh"}`
- `edinburgh/I:city` switch the city from edinburgh to athens: `{"start":"2027-03-31","end":"2027-04-03","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"athens"}`
- `dublin/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"dublin"}`
- `dublin/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"dublin"}`
- `dublin/B:weekday-start` Tue to Fri, from 2027-06-29: `{"start":"2027-06-29","end":"2027-07-02","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"dublin"}`
- `dublin/D:art` interest: art only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["art"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"dublin"}`
- `dublin/D:nightlife` interest: nightlife only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"dublin"}`
- `dublin/D:nature` interest: nature only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nature"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"dublin"}`
- `dublin/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":[],"mustInclude":["guinness-storehouse","st-patrick-s-cathedral","r-bunsen","x-traditional-music-session"],"avoid":["trinity-college-and-the-book-of-kells"],"arrivalTime":"","departureTime":"","slug":"dublin"}`
- `dublin/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"dublin"}`
- `dublin/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"dublin"}`
- `dublin/I:length` extend the trip by one day: `{"start":"2027-04-14","end":"2027-04-17","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"dublin"}`
- `dublin/I:travellers` one more adult (2 to 3): `{"start":"2027-04-14","end":"2027-04-17","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"dublin"}`
- `dublin/I:interest` add the Nightlife interest: `{"start":"2027-04-14","end":"2027-04-17","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"dublin"}`
- `dublin/I:dietary` add Vegetarian: `{"start":"2027-04-14","end":"2027-04-17","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"dublin"}`
- `dublin/I:mobility` limited mobility: `{"start":"2027-04-14","end":"2027-04-17","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"dublin"}`
- `dublin/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-04-14","end":"2027-04-17","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"dublin"}`
- `dublin/I:shuffle` shuffle day 2: `{"start":"2027-04-14","end":"2027-04-17","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"dublin"}`
- `dublin/I:city` switch the city from dublin to san-francisco: `{"start":"2027-04-14","end":"2027-04-17","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"san-francisco"}`
- `brussels/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"brussels"}`
- `brussels/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"brussels"}`
- `brussels/B:weekday-start` Tue to Fri, from 2027-04-13: `{"start":"2027-04-13","end":"2027-04-16","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"brussels"}`
- `brussels/D:art` interest: art only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["art"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"brussels"}`
- `brussels/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":[],"mustInclude":["atomium","museum-of-musical-instruments-mim","r-fritland","x-grand-place-at-night"],"avoid":["grand-place"],"arrivalTime":"","departureTime":"","slug":"brussels"}`
- `brussels/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"brussels"}`
- `brussels/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"brussels"}`
- `brussels/I:length` extend the trip by one day: `{"start":"2027-06-09","end":"2027-06-12","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"brussels"}`
- `brussels/I:travellers` one more adult (2 to 3): `{"start":"2027-06-09","end":"2027-06-12","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"brussels"}`
- `brussels/I:interest` add the Nightlife interest: `{"start":"2027-06-09","end":"2027-06-12","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"brussels"}`
- `brussels/I:dietary` add Vegetarian: `{"start":"2027-06-09","end":"2027-06-12","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"brussels"}`
- `brussels/I:mobility` limited mobility: `{"start":"2027-06-09","end":"2027-06-12","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"brussels"}`
- `brussels/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-06-09","end":"2027-06-12","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"brussels"}`
- `brussels/I:shuffle` shuffle day 2: `{"start":"2027-06-09","end":"2027-06-12","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"brussels"}`
- `brussels/I:city` switch the city from brussels to buenos-aires: `{"start":"2027-06-09","end":"2027-06-12","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"buenos-aires"}`
- `stockholm/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"stockholm"}`
- `stockholm/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"stockholm"}`
- `stockholm/B:weekday-start` Tue to Fri, from 2027-09-21: `{"start":"2027-09-21","end":"2027-09-24","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"stockholm"}`
- `stockholm/D:culture` interest: culture only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["culture"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"stockholm"}`
- `stockholm/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":[],"mustInclude":["skansen","nobel-prize-museum","r-hotorgshallen","x-gamla-stan-walking-tour"],"avoid":["gamla-stan","vasa-museum"],"arrivalTime":"","departureTime":"","slug":"stockholm"}`
- `stockholm/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"stockholm"}`
- `stockholm/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"stockholm"}`
- `stockholm/I:length` extend the trip by one day: `{"start":"2027-07-21","end":"2027-07-24","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"stockholm"}`
- `stockholm/I:travellers` one more adult (2 to 3): `{"start":"2027-07-21","end":"2027-07-24","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"stockholm"}`
- `stockholm/I:interest` add the Nightlife interest: `{"start":"2027-07-21","end":"2027-07-24","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"stockholm"}`
- `stockholm/I:dietary` add Vegetarian: `{"start":"2027-07-21","end":"2027-07-24","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"stockholm"}`
- `stockholm/I:mobility` limited mobility: `{"start":"2027-07-21","end":"2027-07-24","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"stockholm"}`
- `stockholm/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-07-21","end":"2027-07-24","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"stockholm"}`
- `stockholm/I:shuffle` shuffle day 2: `{"start":"2027-07-21","end":"2027-07-24","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"stockholm"}`
- `stockholm/I:city` switch the city from stockholm to cape-town: `{"start":"2027-07-21","end":"2027-07-24","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"cape-town"}`
- `krakow/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"krakow"}`
- `krakow/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"krakow"}`
- `krakow/B:weekday-start` Tue to Fri, from 2027-08-03: `{"start":"2027-08-03","end":"2027-08-06","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"krakow"}`
- `krakow/D:nature` interest: nature only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nature"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"krakow"}`
- `krakow/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":[],"mustInclude":["oskar-schindler-s-enamel-factory","vistula-boulevards","r-zazie-bistro","x-auschwitz-birkenau-guided-visit"],"avoid":["main-market-square-rynek-g-owny","wawel-royal-castle-and-cathedral"],"arrivalTime":"","departureTime":"","slug":"krakow"}`
- `krakow/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"krakow"}`
- `krakow/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"krakow"}`
- `krakow/I:length` extend the trip by one day: `{"start":"2027-05-26","end":"2027-05-29","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"krakow"}`
- `krakow/I:travellers` one more adult (2 to 3): `{"start":"2027-05-26","end":"2027-05-29","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"krakow"}`
- `krakow/I:interest` add the Nightlife interest: `{"start":"2027-05-26","end":"2027-05-29","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"krakow"}`
- `krakow/I:dietary` add Vegetarian: `{"start":"2027-05-26","end":"2027-05-29","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"krakow"}`
- `krakow/I:mobility` limited mobility: `{"start":"2027-05-26","end":"2027-05-29","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"krakow"}`
- `krakow/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-05-26","end":"2027-05-29","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"krakow"}`
- `krakow/I:shuffle` shuffle day 2: `{"start":"2027-05-26","end":"2027-05-29","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"krakow"}`
- `krakow/I:city` switch the city from krakow to prague: `{"start":"2027-05-26","end":"2027-05-29","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"prague"}`
- `marrakesh/A:3d` 3-day trip, undated: `{"start":"","end":"","duration":3,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"marrakesh"}`
- `marrakesh/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"marrakesh"}`
- `marrakesh/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"marrakesh"}`
- `marrakesh/B:weekday-start` Tue to Fri, from 2027-06-15: `{"start":"2027-06-15","end":"2027-06-18","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"marrakesh"}`
- `marrakesh/B:weekend-start` Sat to Mon, from 2027-06-19: `{"start":"2027-06-19","end":"2027-06-21","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"marrakesh"}`
- `marrakesh/B:closed-day` 3 days around the busiest closing day (weekday 0, 1 venues closed), from 2027-06-19: `{"start":"2027-06-19","end":"2027-06-21","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"marrakesh"}`
- `marrakesh/C:1-pax` 1 traveller: `{"start":"","end":"","duration":3,"adults":1,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"marrakesh"}`
- `marrakesh/C:2-pax` 2 travellers: `{"start":"","end":"","duration":3,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"marrakesh"}`
- `marrakesh/D:adventure` interest: adventure only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["adventure"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"marrakesh"}`
- `marrakesh/D:combo-3` 3 interests together: `{"start":"","end":"","duration":3,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["luxury","shopping","nature"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"marrakesh"}`
- `marrakesh/D:combo-5` 5 interests together: `{"start":"","end":"","duration":3,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","nightlife","beaches","adventure"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"marrakesh"}`
- `marrakesh/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":[],"mustInclude":["saadian-tombs","le-jardin-secret","r-cafe-clock","x-hammam-and-spa"],"avoid":["jemaa-el-fnaa","souk-semmarine-and-the-medina-souks"],"arrivalTime":"","departureTime":"","slug":"marrakesh"}`
- `marrakesh/H:arrive-only` landing 09:10 on day 1: `{"start":"","end":"","duration":3,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"09:10","departureTime":"","slug":"marrakesh"}`
- `marrakesh/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"marrakesh"}`
- `marrakesh/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"marrakesh"}`
- `marrakesh/I:baseline` 3 days from 2027-06-15, 2 adults: `{"start":"2027-06-15","end":"2027-06-17","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"marrakesh"}`
- `marrakesh/I:start-date` move the start date one day later (same length): `{"start":"2027-06-16","end":"2027-06-18","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"marrakesh"}`
- `marrakesh/I:length` extend the trip by one day: `{"start":"2027-06-16","end":"2027-06-19","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"marrakesh"}`
- `marrakesh/I:travellers` one more adult (2 to 3): `{"start":"2027-06-16","end":"2027-06-19","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"marrakesh"}`
- `marrakesh/I:interest` add the Nightlife interest: `{"start":"2027-06-16","end":"2027-06-19","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"marrakesh"}`
- `marrakesh/I:dietary` add Vegetarian: `{"start":"2027-06-16","end":"2027-06-19","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"marrakesh"}`
- `marrakesh/I:mobility` limited mobility: `{"start":"2027-06-16","end":"2027-06-19","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"marrakesh"}`
- `marrakesh/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-06-16","end":"2027-06-19","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"marrakesh"}`
- `marrakesh/I:shuffle` shuffle day 2: `{"start":"2027-06-16","end":"2027-06-19","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"marrakesh"}`
- `marrakesh/I:city` switch the city from marrakesh to sydney: `{"start":"2027-06-16","end":"2027-06-19","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"sydney"}`
- `cairo/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"cairo"}`
- `cairo/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"cairo"}`
- `cairo/B:weekday-start` Tue to Fri, from 2027-07-20: `{"start":"2027-07-20","end":"2027-07-23","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"cairo"}`
- `cairo/D:nightlife` interest: nightlife only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"cairo"}`
- `cairo/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["photography","food","history"],"dietary":[],"mustInclude":["al-azhar-mosque","citadel-of-saladin-and-the-muhammad-ali-mosque","r-zooba","x-sunset-felucca-on-the-nile"],"avoid":["pyramids-of-giza-and-the-sphinx","grand-egyptian-museum","khan-el-khalili"],"arrivalTime":"","departureTime":"","slug":"cairo"}`
- `cairo/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"cairo"}`
- `cairo/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"cairo"}`
- `cairo/I:length` extend the trip by one day: `{"start":"2027-07-14","end":"2027-07-17","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"cairo"}`
- `cairo/I:travellers` one more adult (2 to 3): `{"start":"2027-07-14","end":"2027-07-17","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"cairo"}`
- `cairo/I:interest` add the Nightlife interest: `{"start":"2027-07-14","end":"2027-07-17","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"cairo"}`
- `cairo/I:dietary` add Vegetarian: `{"start":"2027-07-14","end":"2027-07-17","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"cairo"}`
- `cairo/I:mobility` limited mobility: `{"start":"2027-07-14","end":"2027-07-17","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"cairo"}`
- `cairo/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-07-14","end":"2027-07-17","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"cairo"}`
- `cairo/I:shuffle` shuffle day 2: `{"start":"2027-07-14","end":"2027-07-17","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"cairo"}`
- `cairo/I:city` switch the city from cairo to sydney: `{"start":"2027-07-14","end":"2027-07-17","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"sydney"}`
- `cape-town/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"cape-town"}`
- `cape-town/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"cape-town"}`
- `cape-town/B:weekday-start` Tue to Fri, from 2027-08-24: `{"start":"2027-08-24","end":"2027-08-27","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"cape-town"}`
- `cape-town/D:cafes` interest: cafes only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["cafes"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"cape-town"}`
- `cape-town/D:culture` interest: culture only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["culture"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"cape-town"}`
- `cape-town/E:limited-mobility` limited mobility: `{"start":"","end":"","duration":3,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","photography","history"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"cape-town"}`
- `cape-town/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","photography","history"],"dietary":[],"mustInclude":["castle-of-good-hope","district-six-museum","r-hemelhuijs","x-winelands-tasting-day"],"avoid":["table-mountain","robben-island"],"arrivalTime":"","departureTime":"","slug":"cape-town"}`
- `cape-town/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"cape-town"}`
- `cape-town/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"cape-town"}`
- `cape-town/I:length` extend the trip by one day: `{"start":"2027-06-02","end":"2027-06-05","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"cape-town"}`
- `cape-town/I:travellers` one more adult (2 to 3): `{"start":"2027-06-02","end":"2027-06-05","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"cape-town"}`
- `cape-town/I:interest` add the Nightlife interest: `{"start":"2027-06-02","end":"2027-06-05","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"cape-town"}`
- `cape-town/I:dietary` add Vegetarian: `{"start":"2027-06-02","end":"2027-06-05","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"cape-town"}`
- `cape-town/I:mobility` limited mobility: `{"start":"2027-06-02","end":"2027-06-05","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"cape-town"}`
- `cape-town/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-06-02","end":"2027-06-05","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"cape-town"}`
- `cape-town/I:shuffle` shuffle day 2: `{"start":"2027-06-02","end":"2027-06-05","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"cape-town"}`
- `cape-town/I:city` switch the city from cape-town to cairo: `{"start":"2027-06-02","end":"2027-06-05","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"cairo"}`
- `mexico-city/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"mexico-city"}`
- `mexico-city/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"mexico-city"}`
- `mexico-city/B:weekday-start` Tue to Fri, from 2027-04-06: `{"start":"2027-04-06","end":"2027-04-09","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"mexico-city"}`
- `mexico-city/D:adventure` interest: adventure only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["adventure"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"mexico-city"}`
- `mexico-city/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["photography","history","food"],"dietary":[],"mustInclude":["palacio-de-bellas-artes","coyoacan-historic-centre","r-quintonil","x-sunday-cycling-on-reforma"],"avoid":["national-museum-of-anthropology","zocalo-and-the-metropolitan-cathedral","frida-kahlo-museum-casa-azul"],"arrivalTime":"","departureTime":"","slug":"mexico-city"}`
- `mexico-city/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"mexico-city"}`
- `mexico-city/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"mexico-city"}`
- `mexico-city/I:length` extend the trip by one day: `{"start":"2027-07-21","end":"2027-07-24","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"mexico-city"}`
- `mexico-city/I:travellers` one more adult (2 to 3): `{"start":"2027-07-21","end":"2027-07-24","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"mexico-city"}`
- `mexico-city/I:interest` add the Nightlife interest: `{"start":"2027-07-21","end":"2027-07-24","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"mexico-city"}`
- `mexico-city/I:dietary` add Vegetarian: `{"start":"2027-07-21","end":"2027-07-24","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"mexico-city"}`
- `mexico-city/I:mobility` limited mobility: `{"start":"2027-07-21","end":"2027-07-24","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"mexico-city"}`
- `mexico-city/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-07-21","end":"2027-07-24","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"mexico-city"}`
- `mexico-city/I:shuffle` shuffle day 2: `{"start":"2027-07-21","end":"2027-07-24","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"mexico-city"}`
- `mexico-city/I:city` switch the city from mexico-city to bangkok: `{"start":"2027-07-21","end":"2027-07-24","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"bangkok"}`
- `buenos-aires/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"buenos-aires"}`
- `buenos-aires/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"buenos-aires"}`
- `buenos-aires/B:weekday-start` Tue to Fri, from 2027-05-04: `{"start":"2027-05-04","end":"2027-05-07","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"buenos-aires"}`
- `buenos-aires/D:nature` interest: nature only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nature"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"buenos-aires"}`
- `buenos-aires/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":[],"mustInclude":["plaza-de-mayo-and-casa-rosada","san-telmo-market-and-plaza-dorrego","r-sudestada","x-steak-and-wine-class"],"avoid":["recoleta-cemetery"],"arrivalTime":"","departureTime":"","slug":"buenos-aires"}`
- `buenos-aires/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"buenos-aires"}`
- `buenos-aires/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"buenos-aires"}`
- `buenos-aires/I:length` extend the trip by one day: `{"start":"2027-05-26","end":"2027-05-29","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"buenos-aires"}`
- `buenos-aires/I:travellers` one more adult (2 to 3): `{"start":"2027-05-26","end":"2027-05-29","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"buenos-aires"}`
- `buenos-aires/I:interest` add the Nightlife interest: `{"start":"2027-05-26","end":"2027-05-29","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"buenos-aires"}`
- `buenos-aires/I:dietary` add Vegetarian: `{"start":"2027-05-26","end":"2027-05-29","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"buenos-aires"}`
- `buenos-aires/I:mobility` limited mobility: `{"start":"2027-05-26","end":"2027-05-29","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"buenos-aires"}`
- `buenos-aires/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-05-26","end":"2027-05-29","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"buenos-aires"}`
- `buenos-aires/I:shuffle` shuffle day 2: `{"start":"2027-05-26","end":"2027-05-29","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"buenos-aires"}`
- `buenos-aires/I:city` switch the city from buenos-aires to singapore: `{"start":"2027-05-26","end":"2027-05-29","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"singapore"}`
- `rio-de-janeiro/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"rio-de-janeiro"}`
- `rio-de-janeiro/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"rio-de-janeiro"}`
- `rio-de-janeiro/B:weekday-start` Tue to Fri, from 2027-05-04: `{"start":"2027-05-04","end":"2027-05-07","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"rio-de-janeiro"}`
- `rio-de-janeiro/D:nightlife` interest: nightlife only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"rio-de-janeiro"}`
- `rio-de-janeiro/D:adventure` interest: adventure only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["adventure"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"rio-de-janeiro"}`
- `rio-de-janeiro/D:culture` interest: culture only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["culture"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"rio-de-janeiro"}`
- `rio-de-janeiro/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["photography","history","food"],"dietary":[],"mustInclude":["sugarloaf-mountain-pao-de-acucar","parque-lage","r-bar-luiz","x-football-at-the-maracana"],"avoid":["christ-the-redeemer-cristo-redentor","ipanema-beach-and-arpoador"],"arrivalTime":"","departureTime":"","slug":"rio-de-janeiro"}`
- `rio-de-janeiro/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"rio-de-janeiro"}`
- `rio-de-janeiro/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"rio-de-janeiro"}`
- `rio-de-janeiro/I:length` extend the trip by one day: `{"start":"2027-07-28","end":"2027-07-31","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"rio-de-janeiro"}`
- `rio-de-janeiro/I:travellers` one more adult (2 to 3): `{"start":"2027-07-28","end":"2027-07-31","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"rio-de-janeiro"}`
- `rio-de-janeiro/I:interest` add the Nightlife interest: `{"start":"2027-07-28","end":"2027-07-31","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"rio-de-janeiro"}`
- `rio-de-janeiro/I:dietary` add Vegetarian: `{"start":"2027-07-28","end":"2027-07-31","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"rio-de-janeiro"}`
- `rio-de-janeiro/I:mobility` limited mobility: `{"start":"2027-07-28","end":"2027-07-31","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"rio-de-janeiro"}`
- `rio-de-janeiro/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-07-28","end":"2027-07-31","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"rio-de-janeiro"}`
- `rio-de-janeiro/I:shuffle` shuffle day 2: `{"start":"2027-07-28","end":"2027-07-31","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"rio-de-janeiro"}`
- `rio-de-janeiro/I:city` switch the city from rio-de-janeiro to budapest: `{"start":"2027-07-28","end":"2027-07-31","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"budapest"}`
- `toronto/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"toronto"}`
- `toronto/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"toronto"}`
- `toronto/B:weekday-start` Tue to Fri, from 2027-06-15: `{"start":"2027-06-15","end":"2027-06-18","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"toronto"}`
- `toronto/D:nature` interest: nature only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nature"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"toronto"}`
- `toronto/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["photography","history","food"],"dietary":[],"mustInclude":["nathan-phillips-square-and-city-hall","high-park","r-banh-mi-boys","x-kensington-market-food-tour"],"avoid":["cn-tower"],"arrivalTime":"","departureTime":"","slug":"toronto"}`
- `toronto/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"toronto"}`
- `toronto/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"toronto"}`
- `toronto/I:length` extend the trip by one day: `{"start":"2027-06-09","end":"2027-06-12","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"toronto"}`
- `toronto/I:travellers` one more adult (2 to 3): `{"start":"2027-06-09","end":"2027-06-12","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"toronto"}`
- `toronto/I:interest` add the Nightlife interest: `{"start":"2027-06-09","end":"2027-06-12","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"toronto"}`
- `toronto/I:dietary` add Vegetarian: `{"start":"2027-06-09","end":"2027-06-12","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"toronto"}`
- `toronto/I:mobility` limited mobility: `{"start":"2027-06-09","end":"2027-06-12","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"toronto"}`
- `toronto/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-06-09","end":"2027-06-12","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"toronto"}`
- `toronto/I:shuffle` shuffle day 2: `{"start":"2027-06-09","end":"2027-06-12","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"toronto"}`
- `toronto/I:city` switch the city from toronto to rome: `{"start":"2027-06-09","end":"2027-06-12","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"rome"}`
- `san-francisco/A:3d` 3-day trip, undated: `{"start":"","end":"","duration":3,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"san-francisco"}`
- `san-francisco/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"san-francisco"}`
- `san-francisco/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"san-francisco"}`
- `san-francisco/B:weekday-start` Tue to Fri, from 2027-06-29: `{"start":"2027-06-29","end":"2027-07-02","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"san-francisco"}`
- `san-francisco/B:weekend-start` Sat to Mon, from 2027-07-03: `{"start":"2027-07-03","end":"2027-07-05","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"san-francisco"}`
- `san-francisco/B:closed-day` 3 days around the busiest closing day (weekday 0, 3 venues closed), from 2027-07-03: `{"start":"2027-07-03","end":"2027-07-05","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"san-francisco"}`
- `san-francisco/C:1-pax` 1 traveller: `{"start":"","end":"","duration":3,"adults":1,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"san-francisco"}`
- `san-francisco/C:2-pax` 2 travellers: `{"start":"","end":"","duration":3,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"san-francisco"}`
- `san-francisco/D:art` interest: art only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["art"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"san-francisco"}`
- `san-francisco/D:nature` interest: nature only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nature"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"san-francisco"}`
- `san-francisco/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":[],"mustInclude":["fisherman-s-wharf-and-pier-39","exploratorium","r-foreign-cinema","x-alcatraz-evening-tour"],"avoid":["golden-gate-bridge","alcatraz-island"],"arrivalTime":"","departureTime":"","slug":"san-francisco"}`
- `san-francisco/H:arrive-only` landing 09:10 on day 1: `{"start":"","end":"","duration":3,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"09:10","departureTime":"","slug":"san-francisco"}`
- `san-francisco/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"san-francisco"}`
- `san-francisco/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"san-francisco"}`
- `san-francisco/I:start-date` move the start date one day later (same length): `{"start":"2027-07-07","end":"2027-07-09","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"san-francisco"}`
- `san-francisco/I:length` extend the trip by one day: `{"start":"2027-07-07","end":"2027-07-10","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"san-francisco"}`
- `san-francisco/I:travellers` one more adult (2 to 3): `{"start":"2027-07-07","end":"2027-07-10","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"san-francisco"}`
- `san-francisco/I:interest` add the Nightlife interest: `{"start":"2027-07-07","end":"2027-07-10","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"san-francisco"}`
- `san-francisco/I:dietary` add Vegetarian: `{"start":"2027-07-07","end":"2027-07-10","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"san-francisco"}`
- `san-francisco/I:mobility` limited mobility: `{"start":"2027-07-07","end":"2027-07-10","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"san-francisco"}`
- `san-francisco/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-07-07","end":"2027-07-10","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"san-francisco"}`
- `san-francisco/I:shuffle` shuffle day 2: `{"start":"2027-07-07","end":"2027-07-10","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"san-francisco"}`
- `san-francisco/I:city` switch the city from san-francisco to budapest: `{"start":"2027-07-07","end":"2027-07-10","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"budapest"}`
- `chicago/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"chicago"}`
- `chicago/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"chicago"}`
- `chicago/B:weekday-start` Tue to Fri, from 2027-08-10: `{"start":"2027-08-10","end":"2027-08-13","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"chicago"}`
- `chicago/D:nightlife` interest: nightlife only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"chicago"}`
- `chicago/D:nature` interest: nature only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nature"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"chicago"}`
- `chicago/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":[],"mustInclude":["art-institute-of-chicago","chicago-riverwalk-and-architecture-cruise","r-portillo-s","x-blues-or-jazz-night"],"avoid":["millennium-park-and-cloud-gate"],"arrivalTime":"","departureTime":"","slug":"chicago"}`
- `chicago/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"chicago"}`
- `chicago/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"chicago"}`
- `chicago/I:length` extend the trip by one day: `{"start":"2027-06-02","end":"2027-06-05","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"chicago"}`
- `chicago/I:travellers` one more adult (2 to 3): `{"start":"2027-06-02","end":"2027-06-05","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"chicago"}`
- `chicago/I:interest` add the Nightlife interest: `{"start":"2027-06-02","end":"2027-06-05","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"chicago"}`
- `chicago/I:dietary` add Vegetarian: `{"start":"2027-06-02","end":"2027-06-05","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"chicago"}`
- `chicago/I:mobility` limited mobility: `{"start":"2027-06-02","end":"2027-06-05","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"chicago"}`
- `chicago/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-06-02","end":"2027-06-05","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"chicago"}`
- `chicago/I:shuffle` shuffle day 2: `{"start":"2027-06-02","end":"2027-06-05","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"chicago"}`
- `chicago/I:city` switch the city from chicago to taipei: `{"start":"2027-06-02","end":"2027-06-05","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"taipei"}`
- `miami/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"miami"}`
- `miami/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"miami"}`
- `miami/B:weekday-start` Tue to Fri, from 2027-05-04: `{"start":"2027-05-04","end":"2027-05-07","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"miami"}`
- `miami/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["photography","history","food"],"dietary":[],"mustInclude":["perez-art-museum-miami-pamm","espanola-way","r-joe-s-stone-crab","x-wynwood-street-art-tour"],"avoid":["south-beach-and-the-art-deco-historic-district"],"arrivalTime":"","departureTime":"","slug":"miami"}`
- `miami/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"miami"}`
- `miami/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"miami"}`
- `miami/I:length` extend the trip by one day: `{"start":"2027-04-07","end":"2027-04-10","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"miami"}`
- `miami/I:travellers` one more adult (2 to 3): `{"start":"2027-04-07","end":"2027-04-10","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"miami"}`
- `miami/I:interest` add the Nightlife interest: `{"start":"2027-04-07","end":"2027-04-10","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"miami"}`
- `miami/I:dietary` add Vegetarian: `{"start":"2027-04-07","end":"2027-04-10","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"miami"}`
- `miami/I:mobility` limited mobility: `{"start":"2027-04-07","end":"2027-04-10","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"miami"}`
- `miami/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-04-07","end":"2027-04-10","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"miami"}`
- `miami/I:shuffle` shuffle day 2: `{"start":"2027-04-07","end":"2027-04-10","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"miami"}`
- `miami/I:city` switch the city from miami to mumbai: `{"start":"2027-04-07","end":"2027-04-10","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"mumbai"}`
- `kyoto/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"kyoto"}`
- `kyoto/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"kyoto"}`
- `kyoto/B:weekday-start` Tue to Fri, from 2027-03-09: `{"start":"2027-03-09","end":"2027-03-12","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"kyoto"}`
- `kyoto/D:nature` interest: nature only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nature"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"kyoto"}`
- `kyoto/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":[],"mustInclude":["kinkaku-ji-golden-pavilion","nijo-castle","r-pontocho-yakitori-izakaya","x-kaiseki-dinner"],"avoid":["kiyomizu-dera","fushimi-inari-taisha"],"arrivalTime":"","departureTime":"","slug":"kyoto"}`
- `kyoto/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"kyoto"}`
- `kyoto/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"kyoto"}`
- `kyoto/I:length` extend the trip by one day: `{"start":"2027-08-18","end":"2027-08-21","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"kyoto"}`
- `kyoto/I:travellers` one more adult (2 to 3): `{"start":"2027-08-18","end":"2027-08-21","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"kyoto"}`
- `kyoto/I:interest` add the Nightlife interest: `{"start":"2027-08-18","end":"2027-08-21","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"kyoto"}`
- `kyoto/I:dietary` add Vegetarian: `{"start":"2027-08-18","end":"2027-08-21","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"kyoto"}`
- `kyoto/I:mobility` limited mobility: `{"start":"2027-08-18","end":"2027-08-21","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"kyoto"}`
- `kyoto/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-08-18","end":"2027-08-21","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"kyoto"}`
- `kyoto/I:shuffle` shuffle day 2: `{"start":"2027-08-18","end":"2027-08-21","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"kyoto"}`
- `kyoto/I:city` switch the city from kyoto to cape-town: `{"start":"2027-08-18","end":"2027-08-21","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"cape-town"}`
- `osaka/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"osaka"}`
- `osaka/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"osaka"}`
- `osaka/B:weekday-start` Tue to Fri, from 2027-06-29: `{"start":"2027-06-29","end":"2027-07-02","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"osaka"}`
- `osaka/D:adventure` interest: adventure only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["adventure"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"osaka"}`
- `osaka/D:culture` interest: culture only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["culture"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"osaka"}`
- `osaka/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["photography","history","food"],"dietary":[],"mustInclude":["dotonbori","osaka-castle","r-okonomiyaki-kiji","x-osaka-castle-cruise"],"avoid":[],"arrivalTime":"","departureTime":"","slug":"osaka"}`
- `osaka/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"osaka"}`
- `osaka/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"osaka"}`
- `osaka/I:length` extend the trip by one day: `{"start":"2027-09-01","end":"2027-09-04","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"osaka"}`
- `osaka/I:travellers` one more adult (2 to 3): `{"start":"2027-09-01","end":"2027-09-04","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"osaka"}`
- `osaka/I:interest` add the Nightlife interest: `{"start":"2027-09-01","end":"2027-09-04","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"osaka"}`
- `osaka/I:dietary` add Vegetarian: `{"start":"2027-09-01","end":"2027-09-04","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"osaka"}`
- `osaka/I:mobility` limited mobility: `{"start":"2027-09-01","end":"2027-09-04","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"osaka"}`
- `osaka/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-09-01","end":"2027-09-04","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"osaka"}`
- `osaka/I:shuffle` shuffle day 2: `{"start":"2027-09-01","end":"2027-09-04","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"osaka"}`
- `osaka/I:city` switch the city from osaka to toronto: `{"start":"2027-09-01","end":"2027-09-04","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"toronto"}`
- `taipei/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"taipei"}`
- `taipei/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"taipei"}`
- `taipei/B:weekday-start` Tue to Fri, from 2027-06-15: `{"start":"2027-06-15","end":"2027-06-18","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"taipei"}`
- `taipei/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["history","food","photography"],"dietary":[],"mustInclude":["taipei-101","bopiliao-old-street","r-fuhang-soy-milk","x-taiwanese-cooking-class"],"avoid":["shilin-night-market","national-palace-museum"],"arrivalTime":"","departureTime":"","slug":"taipei"}`
- `taipei/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"taipei"}`
- `taipei/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"taipei"}`
- `taipei/I:length` extend the trip by one day: `{"start":"2027-09-22","end":"2027-09-25","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"taipei"}`
- `taipei/I:travellers` one more adult (2 to 3): `{"start":"2027-09-22","end":"2027-09-25","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"taipei"}`
- `taipei/I:interest` add the Nightlife interest: `{"start":"2027-09-22","end":"2027-09-25","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"taipei"}`
- `taipei/I:dietary` add Vegetarian: `{"start":"2027-09-22","end":"2027-09-25","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"taipei"}`
- `taipei/I:mobility` limited mobility: `{"start":"2027-09-22","end":"2027-09-25","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"taipei"}`
- `taipei/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-09-22","end":"2027-09-25","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"taipei"}`
- `taipei/I:shuffle` shuffle day 2: `{"start":"2027-09-22","end":"2027-09-25","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"taipei"}`
- `taipei/I:city` switch the city from taipei to san-francisco: `{"start":"2027-09-22","end":"2027-09-25","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"san-francisco"}`
- `hanoi/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"hanoi"}`
- `hanoi/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"hanoi"}`
- `hanoi/B:weekday-start` Tue to Fri, from 2027-09-07: `{"start":"2027-09-07","end":"2027-09-10","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"hanoi"}`
- `hanoi/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":["dong-xuan-market","old-quarter","r-xoi-yen","x-dawn-at-hoan-kiem-lake"],"avoid":["hoan-kiem-lake-and-ngoc-son-temple"],"arrivalTime":"","departureTime":"","slug":"hanoi"}`
- `hanoi/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"hanoi"}`
- `hanoi/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"hanoi"}`
- `hanoi/I:length` extend the trip by one day: `{"start":"2027-08-04","end":"2027-08-07","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"hanoi"}`
- `hanoi/I:travellers` one more adult (2 to 3): `{"start":"2027-08-04","end":"2027-08-07","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"hanoi"}`
- `hanoi/I:interest` add the Nightlife interest: `{"start":"2027-08-04","end":"2027-08-07","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"hanoi"}`
- `hanoi/I:dietary` add Vegetarian: `{"start":"2027-08-04","end":"2027-08-07","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"hanoi"}`
- `hanoi/I:mobility` limited mobility: `{"start":"2027-08-04","end":"2027-08-07","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"hanoi"}`
- `hanoi/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-08-04","end":"2027-08-07","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"hanoi"}`
- `hanoi/I:shuffle` shuffle day 2: `{"start":"2027-08-04","end":"2027-08-07","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"hanoi"}`
- `hanoi/I:city` switch the city from hanoi to chicago: `{"start":"2027-08-04","end":"2027-08-07","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"chicago"}`
- `mumbai/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"mumbai"}`
- `mumbai/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"mumbai"}`
- `mumbai/B:weekday-start` Tue to Fri, from 2027-08-03: `{"start":"2027-08-03","end":"2027-08-06","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"mumbai"}`
- `mumbai/D:adventure` interest: adventure only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["adventure"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"mumbai"}`
- `mumbai/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","photography","history"],"dietary":[],"mustInclude":["colaba-causeway","chhatrapati-shivaji-maharaj-vastu-sangrahalaya-csmvs","r-cafe-madras","x-sunset-on-marine-drive"],"avoid":["marine-drive","gateway-of-india"],"arrivalTime":"","departureTime":"","slug":"mumbai"}`
- `mumbai/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"mumbai"}`
- `mumbai/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"mumbai"}`
- `mumbai/I:length` extend the trip by one day: `{"start":"2027-06-16","end":"2027-06-19","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"mumbai"}`
- `mumbai/I:travellers` one more adult (2 to 3): `{"start":"2027-06-16","end":"2027-06-19","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"mumbai"}`
- `mumbai/I:interest` add the Nightlife interest: `{"start":"2027-06-16","end":"2027-06-19","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"mumbai"}`
- `mumbai/I:dietary` add Vegetarian: `{"start":"2027-06-16","end":"2027-06-19","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"mumbai"}`
- `mumbai/I:mobility` limited mobility: `{"start":"2027-06-16","end":"2027-06-19","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"mumbai"}`
- `mumbai/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-06-16","end":"2027-06-19","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"mumbai"}`
- `mumbai/I:shuffle` shuffle day 2: `{"start":"2027-06-16","end":"2027-06-19","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"mumbai"}`
- `mumbai/I:city` switch the city from mumbai to kuala-lumpur: `{"start":"2027-06-16","end":"2027-06-19","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"kuala-lumpur"}`
- `melbourne/A:7d` 7-day trip, undated: `{"start":"","end":"","duration":7,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"melbourne"}`
- `melbourne/A:14d` 14-day trip, undated: `{"start":"","end":"","duration":14,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"melbourne"}`
- `melbourne/B:weekday-start` Tue to Fri, from 2027-07-06: `{"start":"2027-07-06","end":"2027-07-09","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"melbourne"}`
- `melbourne/D:beaches` interest: beaches only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["beaches"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"melbourne"}`
- `melbourne/D:nature` interest: nature only: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["nature"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"melbourne"}`
- `melbourne/G:undated` must include 4 places, skip 3 must-sees: `{"start":"","end":"","duration":4,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["photography","history","food"],"dietary":[],"mustInclude":["old-melbourne-gaol","eureka-skydeck","r-chin-chin","x-city-circle-tram"],"avoid":["hosier-lane-and-the-laneways"],"arrivalTime":"","departureTime":"","slug":"melbourne"}`
- `melbourne/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"melbourne"}`
- `melbourne/H:depart-only` flight home 07:30 on the last day: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"07:30","slug":"melbourne"}`
- `melbourne/I:length` extend the trip by one day: `{"start":"2027-06-23","end":"2027-06-26","duration":5,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"melbourne"}`
- `melbourne/I:travellers` one more adult (2 to 3): `{"start":"2027-06-23","end":"2027-06-26","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"melbourne"}`
- `melbourne/I:interest` add the Nightlife interest: `{"start":"2027-06-23","end":"2027-06-26","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"melbourne"}`
- `melbourne/I:dietary` add Vegetarian: `{"start":"2027-06-23","end":"2027-06-26","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"melbourne"}`
- `melbourne/I:mobility` limited mobility: `{"start":"2027-06-23","end":"2027-06-26","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"melbourne"}`
- `melbourne/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-06-23","end":"2027-06-26","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"melbourne"}`
- `melbourne/I:shuffle` shuffle day 2: `{"start":"2027-06-23","end":"2027-06-26","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"melbourne"}`
- `melbourne/I:city` switch the city from melbourne to rio-de-janeiro: `{"start":"2027-06-23","end":"2027-06-26","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"rio-de-janeiro"}`

## Screenshots

Each city's 3-day plan with its day 1 map is in `reports/screenshots/<city>.jpg` (tiles are the 1x1 stub in these, so the map shows markers on a flat tile).

## Addendum: reading the numbers

- **Regression status.** `reports/regression-check.md` replays the same scenarios on 383bdb2 (the last commit before the motion work). Every real failure type reproduces there, so none is a regression from the motion work. The engine, data and providers (`lib/`) are byte-identical between 383bdb2 and now.
- **Sydney cluster (16 types, 64 failures, 2 plans).** Sydney has two different places named "Bondi to Coogee Coastal Walk" (a landmark) and "Bondi to Coogee coastal walk" (an experience). The place picker looks names up case-insensitively, so choosing one selects the other, and the page ends up with different must-include / skip lists from the ones the scenario intended. Everything in the cluster (`render.*`, `map.markers`, `map.numbering` for `sydney G:undated` and `G:closed-day`) follows from that one collision.
- **`prop.travellers` (1).** A harness false positive: that plan has no priced stops, so the party total is 0 before and after adding a traveller. The check is fixed; the count above predates the fix.
- **`robust.*`.** No console errors, hydration warnings, failed requests or sideways overflow (at 1440 or 390px) in any of the 2,900 plans.
