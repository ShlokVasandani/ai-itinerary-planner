/** Pre-flight: resolves every seed to a Wikidata city and prints the ones that fail, so name/country problems surface before any heavy fetching. */
import { SEEDS } from "./seeds";
import { resolveCity } from "./lib/wikidata";

(async () => {
  const bad: string[] = [];
  for (const s of SEEDS) {
    const r = await resolveCity(s);
    if ("error" in r) bad.push(`${s.city} (${s.country}): ${r.error}`);
    else if (r.population !== undefined && r.population < 30000) bad.push(`${s.city}: tiny population ${r.population} (wrong match?)`);
  }
  console.log(`${SEEDS.length - bad.length}/${SEEDS.length} seeds resolve`);
  bad.forEach((b) => console.log(" -", b));
})();
