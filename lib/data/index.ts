import type { Destination, DestinationSource } from "../types";
import { buildDestination, type GeneratedCity } from "./merge";
import { cityMeta } from "./city-meta";
import type { CityMeta } from "../types";

import { tokyo } from "./tokyo";
import { paris } from "./paris";
import { london } from "./london";
import { dubai } from "./dubai";
import { singapore } from "./singapore";
import { bangkok } from "./bangkok";
import { rome } from "./rome";
import { barcelona } from "./barcelona";
import { newYorkCity } from "./new-york-city";
import { istanbul } from "./istanbul";
import { seoul } from "./seoul";
import { amsterdam } from "./amsterdam";
import { copenhagen } from "./copenhagen";
import { hongKong } from "./hong-kong";
import { sydney } from "./sydney";
import { zurich } from "./zurich";
import { losAngeles } from "./los-angeles";
import { kualaLumpur } from "./kuala-lumpur";
import { vienna } from "./vienna";
import { lisbon } from "./lisbon";

import { prague, pragueMeta } from "./prague";
import { berlin, berlinMeta } from "./berlin";
import { madrid, madridMeta } from "./madrid";
import { milan, milanMeta } from "./milan";
import { florence, florenceMeta } from "./florence";
import { venice, veniceMeta } from "./venice";
import { athens, athensMeta } from "./athens";
import { budapest, budapestMeta } from "./budapest";
import { munich, munichMeta } from "./munich";
import { edinburgh, edinburghMeta } from "./edinburgh";
import { dublin, dublinMeta } from "./dublin";
import { brussels, brusselsMeta } from "./brussels";
import { stockholm, stockholmMeta } from "./stockholm";
import { krakow, krakowMeta } from "./krakow";
import { marrakesh, marrakeshMeta } from "./marrakesh";
import { cairo, cairoMeta } from "./cairo";
import { capeTown, capeTownMeta } from "./cape-town";
import { mexicoCity, mexicoCityMeta } from "./mexico-city";
import { buenosAires, buenosAiresMeta } from "./buenos-aires";
import { rioDeJaneiro, rioDeJaneiroMeta } from "./rio-de-janeiro";
import { toronto, torontoMeta } from "./toronto";
import { sanFrancisco, sanFranciscoMeta } from "./san-francisco";
import { chicago, chicagoMeta } from "./chicago";
import { miami, miamiMeta } from "./miami";
import { kyoto, kyotoMeta } from "./kyoto";
import { osaka, osakaMeta } from "./osaka";
import { taipei, taipeiMeta } from "./taipei";
import { hanoi, hanoiMeta } from "./hanoi";
import { mumbai, mumbaiMeta } from "./mumbai";
import { melbourne, melbourneMeta } from "./melbourne";
// [more-imports]
import tokyoGenerated from "./generated/tokyo.json";
import parisGenerated from "./generated/paris.json";
import londonGenerated from "./generated/london.json";
import dubaiGenerated from "./generated/dubai.json";
import singaporeGenerated from "./generated/singapore.json";
import bangkokGenerated from "./generated/bangkok.json";
import romeGenerated from "./generated/rome.json";
import barcelonaGenerated from "./generated/barcelona.json";
import newYorkCityGenerated from "./generated/new-york-city.json";
import istanbulGenerated from "./generated/istanbul.json";
import seoulGenerated from "./generated/seoul.json";
import amsterdamGenerated from "./generated/amsterdam.json";
import copenhagenGenerated from "./generated/copenhagen.json";
import hongKongGenerated from "./generated/hong-kong.json";
import sydneyGenerated from "./generated/sydney.json";
import zurichGenerated from "./generated/zurich.json";
import losAngelesGenerated from "./generated/los-angeles.json";
import kualaLumpurGenerated from "./generated/kuala-lumpur.json";
import viennaGenerated from "./generated/vienna.json";
import lisbonGenerated from "./generated/lisbon.json";

/**
 * The full destination catalog. To add a new city (#21, #22, ...):
 *   1. Create lib/data/<slug>.ts implementing the `Destination` type.
 *   2. Import it above and add it to this array.
 * The UI, search, and itinerary engine all read from this single list —
 * nothing else needs to change.
 */
import pragueGenerated from "./generated/prague.json";
import berlinGenerated from "./generated/berlin.json";
import madridGenerated from "./generated/madrid.json";
import milanGenerated from "./generated/milan.json";
import florenceGenerated from "./generated/florence.json";
import veniceGenerated from "./generated/venice.json";
import athensGenerated from "./generated/athens.json";
import budapestGenerated from "./generated/budapest.json";
import munichGenerated from "./generated/munich.json";
import edinburghGenerated from "./generated/edinburgh.json";
import dublinGenerated from "./generated/dublin.json";
import brusselsGenerated from "./generated/brussels.json";
import stockholmGenerated from "./generated/stockholm.json";
import krakowGenerated from "./generated/krakow.json";
import marrakeshGenerated from "./generated/marrakesh.json";
import cairoGenerated from "./generated/cairo.json";
import capeTownGenerated from "./generated/cape-town.json";
import mexicoCityGenerated from "./generated/mexico-city.json";
import buenosAiresGenerated from "./generated/buenos-aires.json";
import rioDeJaneiroGenerated from "./generated/rio-de-janeiro.json";
import torontoGenerated from "./generated/toronto.json";
import sanFranciscoGenerated from "./generated/san-francisco.json";
import chicagoGenerated from "./generated/chicago.json";
import miamiGenerated from "./generated/miami.json";
import kyotoGenerated from "./generated/kyoto.json";
import osakaGenerated from "./generated/osaka.json";
import taipeiGenerated from "./generated/taipei.json";
import hanoiGenerated from "./generated/hanoi.json";
import mumbaiGenerated from "./generated/mumbai.json";
import melbourneGenerated from "./generated/melbourne.json";
// [more-generated-imports]
const sources: DestinationSource[] = [
  tokyo,
  paris,
  london,
  dubai,
  singapore,
  bangkok,
  rome,
  barcelona,
  newYorkCity,
  istanbul,
  seoul,
  amsterdam,
  copenhagen,
  hongKong,
  sydney,
  zurich,
  losAngeles,
  kualaLumpur,
  vienna,
  lisbon,
  prague,
  berlin,
  madrid,
  milan,
  florence,
  venice,
  athens,
  budapest,
  munich,
  edinburgh,
  dublin,
  brussels,
  stockholm,
  krakow,
  marrakesh,
  cairo,
  capeTown,
  mexicoCity,
  buenosAires,
  rioDeJaneiro,
  toronto,
  sanFrancisco,
  chicago,
  miami,
  kyoto,
  osaka,
  taipei,
  hanoi,
  mumbai,
  melbourne,
  // [more-sources]
];

const moreMeta: Record<string, CityMeta> = {
  "prague": pragueMeta,
  "berlin": berlinMeta,
  "madrid": madridMeta,
  "milan": milanMeta,
  "florence": florenceMeta,
  "venice": veniceMeta,
  "athens": athensMeta,
  "budapest": budapestMeta,
  "munich": munichMeta,
  "edinburgh": edinburghMeta,
  "dublin": dublinMeta,
  "brussels": brusselsMeta,
  "stockholm": stockholmMeta,
  "krakow": krakowMeta,
  "marrakesh": marrakeshMeta,
  "cairo": cairoMeta,
  "cape-town": capeTownMeta,
  "mexico-city": mexicoCityMeta,
  "buenos-aires": buenosAiresMeta,
  "rio-de-janeiro": rioDeJaneiroMeta,
  "toronto": torontoMeta,
  "san-francisco": sanFranciscoMeta,
  "chicago": chicagoMeta,
  "miami": miamiMeta,
  "kyoto": kyotoMeta,
  "osaka": osakaMeta,
  "taipei": taipeiMeta,
  "hanoi": hanoiMeta,
  "mumbai": mumbaiMeta,
  "melbourne": melbourneMeta,
  // [more-meta]
};

const generatedBySlug: Record<string, GeneratedCity> = {
  "prague": pragueGenerated as unknown as GeneratedCity,
  "berlin": berlinGenerated as unknown as GeneratedCity,
  "madrid": madridGenerated as unknown as GeneratedCity,
  "milan": milanGenerated as unknown as GeneratedCity,
  "florence": florenceGenerated as unknown as GeneratedCity,
  "venice": veniceGenerated as unknown as GeneratedCity,
  "athens": athensGenerated as unknown as GeneratedCity,
  "budapest": budapestGenerated as unknown as GeneratedCity,
  "munich": munichGenerated as unknown as GeneratedCity,
  "edinburgh": edinburghGenerated as unknown as GeneratedCity,
  "dublin": dublinGenerated as unknown as GeneratedCity,
  "brussels": brusselsGenerated as unknown as GeneratedCity,
  "stockholm": stockholmGenerated as unknown as GeneratedCity,
  "krakow": krakowGenerated as unknown as GeneratedCity,
  "marrakesh": marrakeshGenerated as unknown as GeneratedCity,
  "cairo": cairoGenerated as unknown as GeneratedCity,
  "cape-town": capeTownGenerated as unknown as GeneratedCity,
  "mexico-city": mexicoCityGenerated as unknown as GeneratedCity,
  "buenos-aires": buenosAiresGenerated as unknown as GeneratedCity,
  "rio-de-janeiro": rioDeJaneiroGenerated as unknown as GeneratedCity,
  "toronto": torontoGenerated as unknown as GeneratedCity,
  "san-francisco": sanFranciscoGenerated as unknown as GeneratedCity,
  "chicago": chicagoGenerated as unknown as GeneratedCity,
  "miami": miamiGenerated as unknown as GeneratedCity,
  "kyoto": kyotoGenerated as unknown as GeneratedCity,
  "osaka": osakaGenerated as unknown as GeneratedCity,
  "taipei": taipeiGenerated as unknown as GeneratedCity,
  "hanoi": hanoiGenerated as unknown as GeneratedCity,
  "mumbai": mumbaiGenerated as unknown as GeneratedCity,
  "melbourne": melbourneGenerated as unknown as GeneratedCity,
  // [more-generated]
  "tokyo": tokyoGenerated as unknown as GeneratedCity,
  "paris": parisGenerated as unknown as GeneratedCity,
  "london": londonGenerated as unknown as GeneratedCity,
  "dubai": dubaiGenerated as unknown as GeneratedCity,
  "singapore": singaporeGenerated as unknown as GeneratedCity,
  "bangkok": bangkokGenerated as unknown as GeneratedCity,
  "rome": romeGenerated as unknown as GeneratedCity,
  "barcelona": barcelonaGenerated as unknown as GeneratedCity,
  "new-york-city": newYorkCityGenerated as unknown as GeneratedCity,
  "istanbul": istanbulGenerated as unknown as GeneratedCity,
  "seoul": seoulGenerated as unknown as GeneratedCity,
  "amsterdam": amsterdamGenerated as unknown as GeneratedCity,
  "copenhagen": copenhagenGenerated as unknown as GeneratedCity,
  "hong-kong": hongKongGenerated as unknown as GeneratedCity,
  "sydney": sydneyGenerated as unknown as GeneratedCity,
  "zurich": zurichGenerated as unknown as GeneratedCity,
  "los-angeles": losAngelesGenerated as unknown as GeneratedCity,
  "kuala-lumpur": kualaLumpurGenerated as unknown as GeneratedCity,
  "vienna": viennaGenerated as unknown as GeneratedCity,
  "lisbon": lisbonGenerated as unknown as GeneratedCity,
};

/** Final catalog: hand-authored source + city meta + verified geo overlay. */
export const destinations: Destination[] = sources.map((source) =>
  buildDestination(source, cityMeta[source.slug] ?? moreMeta[source.slug], generatedBySlug[source.slug] ?? {})
);

const bySlug = new Map(destinations.map((d) => [d.slug, d]));

const normalize = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ");

/** Looks up a destination by slug, exact city name, or a known alias. */
export function getDestinationBySlug(slug: string): Destination | undefined {
  return bySlug.get(slug);
}

export function findDestination(query: string): Destination | undefined {
  const needle = normalize(query).split(",")[0].trim();
  if (!needle) return undefined;
  return destinations.find((d) => {
    const names = [d.city, d.slug.replace(/-/g, " "), ...(d.aliases || [])];
    return names.some((name) => normalize(name) === needle);
  });
}

/** Fuzzy search across city/country/tagline, for the destination picker's search box. */
export function searchDestinations(query: string): Destination[] {
  const needle = normalize(query);
  if (!needle) return destinations;
  return destinations.filter((d) => {
    const haystack = normalize(
      [d.city, d.country, d.tagline, ...(d.aliases || [])].join(" ")
    );
    return haystack.includes(needle);
  });
}
