import { getJson } from "./http";
import type { Seed } from "../seeds";

const API = "https://www.wikidata.org/w/api.php";
const SPARQL = "https://query.wikidata.org/sparql";

/* ---------- raw entity access ---------- */

interface Claim {
  mainsnak?: { datavalue?: { value?: unknown }; snaktype?: string };
  rank?: string;
}
export interface Entity {
  id: string;
  labels?: Record<string, { value: string }>;
  aliases?: Record<string, { value: string }[]>;
  descriptions?: Record<string, { value: string }>;
  claims?: Record<string, Claim[]>;
  sitelinks?: Record<string, { title: string }>;
}

export async function getEntities(ids: string[], props = "labels|aliases|descriptions|claims|sitelinks"): Promise<Record<string, Entity>> {
  const out: Record<string, Entity> = {};
  for (let i = 0; i < ids.length; i += 40) {
    const chunk = ids.slice(i, i + 40);
    const url = `${API}?action=wbgetentities&format=json&languages=en&ids=${chunk.join("|")}&props=${encodeURIComponent(props)}&sitefilter=enwiki`;
    const res = await getJson<{ entities?: Record<string, Entity> }>(url);
    Object.assign(out, res.entities ?? {});
  }
  return out;
}

const claimValues = (e: Entity, prop: string): unknown[] =>
  (e.claims?.[prop] ?? [])
    .filter((c) => c.rank !== "deprecated" && c.mainsnak?.snaktype === "value")
    .map((c) => c.mainsnak?.datavalue?.value);

const entityIds = (e: Entity, prop: string): string[] =>
  claimValues(e, prop).map((v) => (v as { id?: string })?.id).filter(Boolean) as string[];

const label = (e?: Entity) => e?.labels?.en?.value;

/* ---------- city resolution ---------- */

/** Accepted spellings of a country, since Wikidata labels differ from everyday names. */
const COUNTRY_ALIASES: Record<string, string[]> = {
  Czechia: ["Czech Republic", "Czechia"],
  "United States": ["United States of America", "United States"],
  "United Kingdom": ["United Kingdom"],
  "Puerto Rico": ["United States of America", "United States", "Puerto Rico"],
  Taiwan: ["Taiwan", "Republic of China"],
  "South Korea": ["South Korea", "Republic of Korea"],
  Mauritius: ["Mauritius"],
  Myanmar: ["Myanmar", "Burma"],
  "Bosnia and Herzegovina": ["Bosnia and Herzegovina"],
  Tanzania: ["Tanzania"],
};

const CITY_TYPE = /city|town|municipality|capital|metropolis|commune|borough|ward|conurbation|settlement|urban|federal district|special administrative|county seat|port|resort|community/i;
const NOT_CITY_TYPE = /prefecture|province|state of|region|department|district of|country|county$|island|archipelago|village$/i;

export interface CityRecord {
  qid: string;
  label: string;
  description?: string;
  lat: number;
  lng: number;
  population?: number;
  enwiki?: string;
  image?: string;
  countryQid: string;
  countryLabel: string;
  sitelinks: number;
}

const parseCoord = (v: unknown): { lat: number; lng: number } | undefined => {
  const c = v as { latitude?: number; longitude?: number } | undefined;
  return c && typeof c.latitude === "number" && typeof c.longitude === "number" ? { lat: c.latitude, lng: c.longitude } : undefined;
};

export async function resolveCity(seed: Seed): Promise<CityRecord | { error: string }> {
  const search = await getJson<{ search?: { id: string }[] }>(
    `${API}?action=wbsearchentities&format=json&language=en&type=item&limit=12&search=${encodeURIComponent(seed.city)}`
  );
  const ids = (search.search ?? []).map((s) => s.id);
  if (!ids.length) return { error: `no Wikidata results for "${seed.city}"` };
  const cands = await getEntities(ids);
  const related = new Set<string>();
  for (const e of Object.values(cands)) {
    entityIds(e, "P17").forEach((i) => related.add(i));
    entityIds(e, "P31").forEach((i) => related.add(i));
  }
  const rel = await getEntities([...related], "labels|aliases");
  const wanted = (COUNTRY_ALIASES[seed.country] ?? [seed.country]).map((x) => x.toLowerCase());
  const matches: CityRecord[] = [];
  for (const e of Object.values(cands)) {
    const coord = parseCoord(claimValues(e, "P625")[0]);
    if (!coord) continue;
    // A city can list several countries over history (Berlin: German Empire, Nazi Germany, Germany); any match counts.
    const countryQ = entityIds(e, "P17").find((q) => {
      const names = [label(rel[q]), ...(rel[q]?.aliases?.en ?? []).map((a) => a.value)].filter(Boolean).map((x) => x!.toLowerCase());
      return wanted.some((w) => names.includes(w));
    });
    if (!countryQ) continue;
    const typeLabels = entityIds(e, "P31").map((q) => label(rel[q]) ?? "");
    if (!typeLabels.some((t) => CITY_TYPE.test(t)) || typeLabels.every((t) => NOT_CITY_TYPE.test(t))) continue;
    const pop = claimValues(e, "P1082")
      .map((v) => Number((v as { amount?: string })?.amount))
      .filter((n) => Number.isFinite(n))
      .pop();
    matches.push({
      qid: e.id,
      label: label(e) ?? seed.city,
      description: e.descriptions?.en?.value,
      ...coord,
      population: pop,
      enwiki: e.sitelinks?.enwiki?.title,
      image: (claimValues(e, "P18")[0] as string | undefined) ?? undefined,
      countryQid: countryQ,
      countryLabel: seed.country,
      sitelinks: Object.keys(e.sitelinks ?? {}).length,
    });
  }
  if (!matches.length) return { error: `no ${seed.country} city match among ${ids.length} candidates for "${seed.city}"` };
  matches.sort((a, b) => b.sitelinks - a.sitelinks);
  return matches[0];
}

/* ---------- country facts ---------- */

export interface CountryFacts {
  currency?: string;
  languages: string[];
}

export async function countryFacts(countryQid: string): Promise<CountryFacts> {
  const [country] = Object.values(await getEntities([countryQid], "claims|labels"));
  const curQ = entityIds(country, "P38");
  const langQ = entityIds(country, "P37");
  const rel = await getEntities([...curQ, ...langQ], "claims|labels");
  let currency: string | undefined;
  for (const q of curQ) {
    const code = claimValues(rel[q], "P498")[0] as string | undefined;
    if (code && /^[A-Z]{3}$/.test(code)) {
      currency = code;
      break;
    }
  }
  const languages = [...new Set(langQ.map((q) => label(rel[q])).filter(Boolean) as string[])].slice(0, 3);
  return { currency, languages };
}

/* ---------- SPARQL ---------- */

interface SparqlRow {
  [k: string]: { value: string } | undefined;
}

export async function sparql(query: string): Promise<SparqlRow[]> {
  const url = `${SPARQL}?format=json&query=${encodeURIComponent(query)}`;
  const res = await getJson<{ results: { bindings: SparqlRow[] } }>(url, { headers: { Accept: "application/sparql-results+json" }, timeoutMs: 80_000 });
  return res.results.bindings;
}

const point = (lat: number, lng: number) => `"Point(${lng} ${lat})"^^geo:wktLiteral`;
const qidOf = (uri?: string) => uri?.split("/").pop() ?? "";

export interface RawAttraction {
  qid: string;
  name: string;
  description?: string;
  lat: number;
  lng: number;
  sitelinks: number;
  enwiki: string;
  image?: string;
  website?: string;
  types: string[];
}

export async function attractionsNear(lat: number, lng: number, radiusKm: number): Promise<RawAttraction[]> {
  const q = `SELECT ?item ?itemLabel ?itemDescription (SAMPLE(?c) AS ?coord) ?sl (SAMPLE(?a) AS ?art) (SAMPLE(?i) AS ?img) (SAMPLE(?w) AS ?web) (GROUP_CONCAT(DISTINCT ?tl;separator="|") AS ?types) WHERE {
  SERVICE wikibase:around { ?item wdt:P625 ?c . bd:serviceParam wikibase:center ${point(lat, lng)} . bd:serviceParam wikibase:radius "${radiusKm}" . }
  ?item wikibase:sitelinks ?sl . FILTER(?sl >= 8)
  ?a schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> .
  OPTIONAL { ?item wdt:P18 ?i } OPTIONAL { ?item wdt:P856 ?w }
  OPTIONAL { ?item wdt:P31 ?t . ?t rdfs:label ?tl . FILTER(LANG(?tl)="en") }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
} GROUP BY ?item ?itemLabel ?itemDescription ?sl ORDER BY DESC(?sl) LIMIT 200`;
  const rows = await sparql(q);
  const out: RawAttraction[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    const qid = qidOf(r.item?.value);
    if (!qid || seen.has(qid)) continue;
    seen.add(qid);
    const m = /Point\(([-\d.eE]+) ([-\d.eE]+)\)/.exec(r.coord?.value ?? "");
    const art = r.art?.value;
    if (!m || !art) continue;
    out.push({
      qid,
      name: r.itemLabel?.value ?? "",
      description: r.itemDescription?.value,
      lng: Number(m[1]),
      lat: Number(m[2]),
      sitelinks: Number(r.sl?.value ?? 0),
      enwiki: decodeURIComponent(art.split("/wiki/")[1] ?? "").replace(/_/g, " "),
      image: r.img?.value ? decodeURIComponent(r.img.value.split("/Special:FilePath/")[1] ?? "") : undefined,
      website: r.web?.value,
      types: (r.types?.value ?? "").split("|").filter(Boolean),
    });
  }
  return out;
}

export async function airportsNear(lat: number, lng: number): Promise<{ iata: string; name: string; sitelinks: number }[]> {
  for (const radius of [60, 120]) {
    const q = `SELECT ?a ?aLabel ?iata ?sl WHERE {
  SERVICE wikibase:around { ?a wdt:P625 ?c . bd:serviceParam wikibase:center ${point(lat, lng)} . bd:serviceParam wikibase:radius "${radius}" . }
  ?a wdt:P238 ?iata . ?a wdt:P31/wdt:P279* wd:Q1248784 . ?a wikibase:sitelinks ?sl .
  FILTER NOT EXISTS { ?a wdt:P576 ?end }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
} ORDER BY DESC(?sl) LIMIT 6`;
    const rows = await sparql(q);
    const list = rows
      .map((r) => ({ iata: r.iata?.value ?? "", name: r.aLabel?.value ?? "", sitelinks: Number(r.sl?.value ?? 0) }))
      .filter((a) => /^[A-Z]{3}$/.test(a.iata));
    if (list.length) return list;
  }
  return [];
}
