import { SEEDS } from "./seeds";
import { buildCity } from "./build-city";

const name = process.argv[2];
const seed = SEEDS.find((s) => s.city.toLowerCase() === name.toLowerCase());
if (!seed) throw new Error("unknown seed " + name);
buildCity(seed, new Set()).then((r) => {
  if (!r.dest) return console.log("ERROR", r.error);
  const d = r.dest;
  console.log(JSON.stringify({ slug: d.slug, tagline: d.tagline, overview: d.overview, airports: d.airportCodes, tz: d.ianaTimezone, cur: d.currency, langs: d.languages, best: d.quickFacts.bestMonths }, null, 1));
  console.log("counts", { lm: d.landmarks.length, r: d.restaurants.length, c: d.cafes.length, n: d.nightlife.length, s: d.shopping.length, h: d.neighborhoods.length });
  console.log(d.landmarks.slice(0, 8).map((l) => `${l.priority} | ${l.name} | ${l.neighborhood} | ${l.interestTags} | ${l.suggestedDurationMin} | ${l.description.slice(0, 80)}`).join("\n"));
  console.log(d.restaurants.slice(0, 6).map((l) => `${l.name} | ${l.cuisine} | ${l.neighborhood} | ${l.mealFor}`).join("\n"));
  console.log(d.neighborhoods.map((h) => `${h.name} ${h.knownFor}`).join("\n"));
  console.log(r.notes);
});
