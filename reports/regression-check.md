# Regression check against 383bdb2

Same scenarios (same city, same seeded inputs) replayed on the current build and on 383bdb2, the last commit before the motion work.

| Failure type | Samples | Reproduces now | Reproduces on 383bdb2 | Verdict |
| --- | ---: | ---: | ---: | --- |
| `prop.travellers` | 1 | 0/1 | 0/1 | **not reproduced on the current build (flaky or harness)** |
| `flight.arrival` | 3 | 3/3 | 3/3 | **pre-existing** |
| `flight.departure` | 3 | 3/3 | 3/3 | **pre-existing** |
| `interest.adventure` | 3 | 3/3 | 3/3 | **pre-existing** |
| `interest.art` | 3 | 3/3 | 3/3 | **pre-existing** |
| `interest.beaches` | 1 | 1/1 | 1/1 | **pre-existing** |
| `interest.cafes` | 1 | 1/1 | 1/1 | **pre-existing** |
| `interest.culture` | 3 | 3/3 | 3/3 | **pre-existing** |
| `interest.nature` | 3 | 3/3 | 3/3 | **pre-existing** |
| `interest.nightlife` | 3 | 3/3 | 3/3 | **pre-existing** |
| `map.markers` | 1 | 1/1 | 1/1 | **pre-existing** |
| `map.numbering` | 1 | 1/1 | 1/1 | **pre-existing** |
| `price.range` | 3 | 3/3 | 3/3 | **pre-existing** |
| `prop.city-stuck` | 3 | 3/3 | 3/3 | **pre-existing** |
| `render.cost` | 1 | 1/1 | 1/1 | **pre-existing** |
| `render.end-time` | 1 | 1/1 | 1/1 | **pre-existing** |
| `render.kind` | 1 | 1/1 | 1/1 | **pre-existing** |
| `render.name` | 1 | 1/1 | 1/1 | **pre-existing** |
| `render.party-total` | 1 | 1/1 | 1/1 | **pre-existing** |
| `render.stop-count` | 1 | 1/1 | 1/1 | **pre-existing** |
| `render.stop-links` | 3 | 3/3 | 3/3 | **pre-existing** |
| `render.sub` | 1 | 1/1 | 1/1 | **pre-existing** |
| `render.time` | 1 | 1/1 | 1/1 | **pre-existing** |
| `render.trip-likely` | 1 | 1/1 | 1/1 | **pre-existing** |
| `render.trip-links` | 1 | 1/1 | 1/1 | **pre-existing** |
| `render.trip-total` | 1 | 1/1 | 1/1 | **pre-existing** |
| `render.where-and-price` | 1 | 1/1 | 1/1 | **pre-existing** |
| `time.meal-window` | 3 | 3/3 | 3/3 | **pre-existing** |

## Samples

- `prop.travellers`: buenos-aires (propagation chain)
- `flight.arrival`: tokyo H:arrive-late; los-angeles H:arrive-late; stockholm H:arrive-late
- `flight.departure`: tokyo H:depart-only; los-angeles H:depart-only; stockholm H:depart-only
- `interest.adventure`: singapore D:adventure; munich D:adventure; rio-de-janeiro D:adventure
- `interest.art`: dubai D:art; hong-kong D:art; budapest D:art
- `interest.beaches`: melbourne D:beaches
- `interest.cafes`: cape-town D:cafes
- `interest.culture`: amsterdam D:culture; venice D:culture; cape-town D:culture
- `interest.nature`: london D:nature; prague D:nature; buenos-aires D:nature
- `interest.nightlife`: tokyo D:nightlife; istanbul D:nightlife; madrid D:nightlife
- `map.markers`: sydney G:undated
- `map.numbering`: sydney G:undated
- `price.range`: london A:3d; hong-kong (propagation chain); vienna A:7d
- `prop.city-stuck`: tokyo (propagation chain); los-angeles (propagation chain); stockholm (propagation chain)
- `render.cost`: sydney G:undated
- `render.end-time`: sydney G:undated
- `render.kind`: sydney G:undated
- `render.name`: sydney G:undated
- `render.party-total`: sydney G:undated
- `render.stop-count`: sydney G:undated
- `render.stop-links`: tokyo A:7d; los-angeles A:7d; stockholm A:7d
- `render.sub`: sydney G:undated
- `render.time`: sydney G:undated
- `render.trip-likely`: sydney G:undated
- `render.trip-links`: sydney G:undated
- `render.trip-total`: sydney G:undated
- `render.where-and-price`: sydney G:undated
- `time.meal-window`: dubai (propagation chain); hong-kong (propagation chain); marrakesh A:3d
