# Sekai stress test

Phase 1 report. Nothing has been fixed yet.

- Server: `http://localhost:3301` (production build), commit `3ee2df5`
- Run: 2026-10-31T04:58:57.981Z, 48 min, 4 parallel workers, fixed seed `stress-v1`
- Cities: 50. Plans built and checked in the browser: **2900**. Plans with at least one failure: **15**. Distinct failure types: **4**.
- Cities re-run on their own after load-induced timeouts in the parallel run, and merged in: los-angeles, kuala-lumpur, vienna, lisbon.
- Map tiles in this run: a local 1x1 PNG stub for every plan; real OpenStreetMap tiles only in the three-city check below.

## Failures by type

| Type | Failures | Plans | Cities | Meaning | First example |
| --- | ---: | ---: | ---: | --- | --- |
| `interest.photography` | 7 | 7 | 6 | selected interest has no matching stop | dublin F:luxury: "photography" selected and the city has 1 venue(s) for it, but no matching stop in 2 day(s) |
| `interest.history` | 6 | 6 | 6 | selected interest has no matching stop | dubai I:swap: "history" selected and the city has 3 venue(s) for it, but no matching stop in 4 day(s) |
| `interest.culture` | 1 | 1 | 1 | selected interest has no matching stop | sydney D:combo-5: "culture" selected and the city has 1 venue(s) for it, but no matching stop in 3 day(s) |
| `interest.nightlife` | 1 | 1 | 1 | selected interest has no matching stop | cairo I:dietary: "nightlife" selected and the city has 5 venue(s) for it, but no matching stop in 4 day(s) |

## Pass/fail matrix

Each cell counts the plans in that group; a cell shows ✅ when every plan passed, otherwise ❌ with `failing/total`. Group I is the chain of single-input changes.

| City | A length | B dates | C travellers | D interests | E diet and walking | F travel styles | G must include / skip | H flight times | I propagation |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Tokyo | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |
| Paris | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |
| London | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |
| Dubai | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ❌ 1/10 |
| Singapore | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ❌ 1/4 | ✅ 10 |
| Bangkok | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |
| Rome | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |
| Barcelona | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |
| New York City | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |
| Istanbul | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |
| Seoul | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |
| Amsterdam | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |
| Copenhagen | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |
| Hong Kong | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |
| Sydney | ✅ 4 | ✅ 3 | ✅ 3 | ❌ 1/14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |
| Zurich | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |
| Los Angeles | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |
| Kuala Lumpur | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |
| Vienna | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |
| Lisbon | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |
| Prague | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |
| Berlin | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |
| Madrid | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |
| Milan | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |
| Florence | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |
| Venice | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |
| Athens | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |
| Budapest | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |
| Munich | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |
| Edinburgh | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |
| Dublin | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ❌ 2/12 | ✅ 2 | ✅ 4 | ✅ 10 |
| Brussels | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ❌ 1/10 |
| Stockholm | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |
| Krakow | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ❌ 1/10 |
| Marrakesh | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |
| Cairo | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ❌ 1/10 |
| Cape Town | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ❌ 2/4 | ✅ 10 |
| Mexico City | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |
| Buenos Aires | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |
| Rio de Janeiro | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |
| Toronto | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |
| San Francisco | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ❌ 2/4 | ✅ 10 |
| Chicago | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |
| Miami | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ❌ 1/4 | ✅ 10 |
| Kyoto | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |
| Osaka | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ❌ 1/10 |
| Taipei | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |
| Hanoi | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ❌ 1/10 |
| Mumbai | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |
| Melbourne | ✅ 4 | ✅ 3 | ✅ 3 | ✅ 14 | ✅ 6 | ✅ 12 | ✅ 2 | ✅ 4 | ✅ 10 |

## Real map tiles (Tokyo, Lisbon, Rome)

Run one city at a time, one tile request at a time with a 1 s pause, capped at 30 requests per city.

| City | Tiles loaded (naturalWidth > 0) | Tile requests | Attribution | Result |
| --- | ---: | ---: | ---: | --- |
| Tokyo | 3 | 4 | 12px | ✅ |
| Lisbon | 2 | 3 | 12px | ✅ |
| Rome | 3 | 4 | 12px | ✅ |

![Tokyo day 1 with real tiles](screenshots/real-tiles-tokyo.jpg)
![Lisbon day 1 with real tiles](screenshots/real-tiles-lisbon.jpg)
![Rome day 1 with real tiles](screenshots/real-tiles-rome.jpg)

## Failure details

Every failure, grouped by type, with the scenario it came from. The exact inputs of each scenario are in the appendix.

### `interest.photography` (7)

selected interest has no matching stop

- **dublin** `F:luxury`: "photography" selected and the city has 1 venue(s) for it, but no matching stop in 2 day(s)
- **dublin** `F:shopping`: "photography" selected and the city has 1 venue(s) for it, but no matching stop in 2 day(s)
- **krakow** `I:swap`: "photography" selected and the city has 4 venue(s) for it, but no matching stop in 4 day(s)
- **cape-town** `H:both-1day`: "photography" selected and the city has 9 venue(s) for it, but no matching stop in 1 day(s)
- **san-francisco** `H:arrive-late`: "photography" selected and the city has 9 venue(s) for it, but no matching stop in 2 day(s)
- **miami** `H:both-1day`: "photography" selected and the city has 7 venue(s) for it, but no matching stop in 1 day(s)
- **hanoi** `I:swap`: "photography" selected and the city has 5 venue(s) for it, but no matching stop in 4 day(s)

### `interest.history` (6)

selected interest has no matching stop

- **dubai** `I:swap`: "history" selected and the city has 3 venue(s) for it, but no matching stop in 4 day(s)
- **singapore** `H:both-1day`: "history" selected and the city has 5 venue(s) for it, but no matching stop in 1 day(s)
- **brussels** `I:swap`: "history" selected and the city has 5 venue(s) for it, but no matching stop in 4 day(s)
- **cape-town** `H:arrive-late`: "history" selected and the city has 7 venue(s) for it, but no matching stop in 2 day(s)
- **san-francisco** `H:both-1day`: "history" selected and the city has 5 venue(s) for it, but no matching stop in 1 day(s)
- **osaka** `I:shuffle`: "history" selected and the city has 4 venue(s) for it, but no matching stop in 4 day(s)

### `interest.culture` (1)

selected interest has no matching stop

- **sydney** `D:combo-5`: "culture" selected and the city has 1 venue(s) for it, but no matching stop in 3 day(s)

### `interest.nightlife` (1)

selected interest has no matching stop

- **cairo** `I:dietary`: "nightlife" selected and the city has 5 venue(s) for it, but no matching stop in 4 day(s)

## Informational (not counted as failures)

- `prop.shuffle-noop` x9: shuffling a day gave the same day
- `must.missing-with-warning` x2: a must-include place could not be scheduled and the plan says so

## Appendix: exact inputs of every failing scenario

`slug/scenario`: inputs as set in the form (dates empty means undated; `mustInclude`/`avoid` are record ids).

- `dubai/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-05-05","end":"2027-05-08","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"dubai"}`
- `singapore/H:both-1day` 1-day trip, landing 10:00 and flight 20:00: `{"start":"","end":"","duration":1,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"10:00","departureTime":"20:00","slug":"singapore"}`
- `sydney/D:combo-5` 5 interests together: `{"start":"","end":"","duration":3,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["cafes","beaches","adventure","culture","luxury"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"sydney"}`
- `dublin/F:luxury` style: luxury: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"luxury","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"dublin"}`
- `dublin/F:shopping` style: shopping: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"shopping","interests":["history","food","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"dublin"}`
- `brussels/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-06-09","end":"2027-06-12","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"brussels"}`
- `krakow/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-05-26","end":"2027-05-29","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"krakow"}`
- `cairo/I:dietary` add Vegetarian: `{"start":"2027-07-14","end":"2027-07-17","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"cairo"}`
- `cape-town/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"cape-town"}`
- `cape-town/H:both-1day` 1-day trip, landing 10:00 and flight 20:00: `{"start":"","end":"","duration":1,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"10:00","departureTime":"20:00","slug":"cape-town"}`
- `san-francisco/H:arrive-late` landing 23:15 on day 1: `{"start":"","end":"","duration":2,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"23:15","departureTime":"","slug":"san-francisco"}`
- `san-francisco/H:both-1day` 1-day trip, landing 10:00 and flight 20:00: `{"start":"","end":"","duration":1,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"10:00","departureTime":"20:00","slug":"san-francisco"}`
- `miami/H:both-1day` 1-day trip, landing 10:00 and flight 20:00: `{"start":"","end":"","duration":1,"adults":2,"children":0,"pace":"balanced","budget":"mid-range","mobility":"standard","travelStyle":"first-time","interests":["food","history","photography"],"dietary":[],"mustInclude":[],"avoid":[],"arrivalTime":"10:00","departureTime":"20:00","slug":"miami"}`
- `osaka/I:shuffle` shuffle day 2: `{"start":"2027-09-01","end":"2027-09-04","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"osaka"}`
- `hanoi/I:swap` swap one stop for the first suggested alternative: `{"start":"2027-08-04","end":"2027-08-07","duration":5,"adults":3,"children":0,"pace":"balanced","budget":"mid-range","mobility":"limited","travelStyle":"first-time","interests":["food","history","photography","nightlife"],"dietary":["vegetarian"],"mustInclude":[],"avoid":[],"arrivalTime":"","departureTime":"","slug":"hanoi"}`

## Screenshots

Each city's 3-day plan with its day 1 map is in `reports/screenshots/<city>.jpg` (tiles are the 1x1 stub in these, so the map shows markers on a flat tile).
