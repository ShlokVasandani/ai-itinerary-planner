/**
 * Reads the planner page into plain data, and compares it with what the engine says it should show.
 * Expected strings are built with the app's own formatters (lib/format), so this checks that the page renders
 * the plan faithfully, not that the formatters are right.
 */
import type { Page } from "playwright-core";
import type { GeneratedItinerary } from "../../lib/itinerary-engine";
import { priorityLabel } from "../../lib/itinerary-engine";
import {
  BUDGET_LABELS,
  INTEREST_LABELS,
  PACE_LABELS,
  STOP_KIND_LABELS,
  TRAVEL_STYLE_LABELS,
  WEEKDAYS,
  formatDate,
  money,
  moneyRange,
} from "../../lib/format";
import { stopOffersSync, tripLinksSync, type TripLinkInput } from "../../lib/providers";
import type { StopCategory } from "../../lib/itinerary-engine";
import type { Failure, StressInput } from "./model";

export interface ScrapedStop {
  time: string;
  end: string;
  kind: string;
  name: string;
  where: string;
  links: string[];
  hasSwap: boolean;
}
export interface ScrapedDay {
  id: string;
  eyebrow: string;
  title: string;
  sub: string;
  cost: string;
  stops: ScrapedStop[];
}
export interface ScrapedPlan {
  title: string;
  meta: string;
  totals: Record<string, { strong: string; span: string }>;
  warnings: string[];
  days: ScrapedDay[];
  tripLinks: string[];
}

const norm = (s: string) => s.replace(/\s+/g, " ").trim();

export async function scrape(page: Page): Promise<ScrapedPlan> {
  return page.evaluate(() => {
    const t = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
    const summary = document.querySelector(".trip-summary");
    const totals: Record<string, { strong: string; span: string }> = {};
    summary?.querySelectorAll(".trip-total > div").forEach((d) => {
      totals[t(d.querySelector("dt"))] = { strong: t(d.querySelector("dd strong")), span: t(d.querySelector("dd span")) };
    });
    const days = [...document.querySelectorAll(".day-card")].map((card) => ({
      id: card.id,
      eyebrow: t(card.querySelector(".day-eyebrow")),
      title: t(card.querySelector(".day-head h3")),
      sub: t(card.querySelector(".day-sub")),
      cost: [...(card.querySelector(".day-cost")?.children ?? [])].map((c) => t(c)).join(" "),
      stops: [...card.querySelectorAll(".stops > .stop")].map((s) => ({
        time: t(s.querySelector(".stop-time > span:first-child")),
        end: t(s.querySelector(".stop-time-end")),
        kind: t(s.querySelector(".stop-kind")),
        name: t(s.querySelector("h4")),
        where: t(s.querySelector(".stop-where")),
        links: [...s.querySelectorAll(".popover-panel a[href]")].map((a) => (a as HTMLAnchorElement).href),
        hasSwap: [...s.querySelectorAll(".popover > button")].some((b) => t(b) === "Swap"),
      })),
    }));
    return {
      title: t(summary?.querySelector("h2")),
      meta: t(summary?.querySelector(".muted")),
      totals,
      warnings: [...document.querySelectorAll(".warn-list li")].map((l) => t(l)),
      days,
      tripLinks: [...document.querySelectorAll(".book-panel a.book-link")].map((a) => (a as HTMLAnchorElement).href),
    };
  });
}

/** Trip-level link input exactly as PlannerClient builds it. */
export function tripInput(it: GeneratedItinerary, input: StressInput, origin = ""): TripLinkInput {
  return { destination: it.input.destination, origin: origin || undefined, startDate: it.startDate, endDate: it.endDate, adults: input.adults, children: input.children };
}

export function topActivities(it: GeneratedItinerary): string[] {
  const names: string[] = [];
  for (const d of it.days)
    for (const s of d.stops)
      if ((s.category === "landmark" || s.category === "experience") && s.priority === "must-see" && !names.includes(s.name)) names.push(s.name);
  return names.slice(0, 3);
}

const href = (u: string) => {
  try {
    return new URL(u).href;
  } catch {
    return u;
  }
};

export function compare(scraped: ScrapedPlan, it: GeneratedItinerary, input: StressInput, origin = ""): Failure[] {
  const f: Failure[] = [];
  // Check ids stay stable ("render.stop-name"); where it happened goes in the detail.
  const bad = (check: string, got: string, want: string) => {
    const m = /^(day \d+(?: stop \d+)?) (.+)$/.exec(check);
    f.push({ check: `render.${m ? m[2] : check}`, detail: `${m ? m[1] + ": " : ""}page "${got}" / engine "${want}"` });
  };
  const eq = (check: string, got: string, want: string) => got === norm(want) || bad(check, got, norm(want));
  const cur = it.currency;

  eq("title", scraped.title, `${it.duration} ${it.duration === 1 ? "day" : "days"} in ${it.destination}`);
  const metaWant = [
    `${TRAVEL_STYLE_LABELS[it.input.travelStyle]} · ${BUDGET_LABELS[it.input.budget]} · ${PACE_LABELS[it.input.pace]}`,
    it.startDate ? ` · ${formatDate(it.startDate)} to ${formatDate(it.endDate)}` : "",
    it.input.interests.length ? ` · ${it.input.interests.map((i) => INTEREST_LABELS[i]).join(", ")}` : "",
  ].join("");
  eq("summary-meta", scraped.meta, norm(metaWant));

  const per = scraped.totals["Planned entries and meals, per person"];
  eq("trip-total", per?.strong ?? "", moneyRange(it.cost.low, it.cost.high, cur));
  eq("trip-likely", per?.span ?? "", `likely ${money(it.cost.likely, cur)}`);
  const party = scraped.totals[`Whole party (${it.input.groupSize})`];
  if (it.input.groupSize > 1) eq("party-total", party?.strong ?? "", money(it.groupLikely, cur));
  else if (Object.keys(scraped.totals).some((k) => k.startsWith("Whole party"))) bad("party-total", "shown", "hidden for one traveller");

  if (scraped.days.length !== it.days.length) bad("day-count", String(scraped.days.length), String(it.days.length));
  const trip = tripInput(it, input, origin);
  it.days.forEach((d, i) => {
    const sd = scraped.days[i];
    if (!sd) return;
    const tag = `day ${d.dayNumber}`;
    const eyebrow = `Day ${d.dayNumber}` + (d.date ? ` · ${WEEKDAYS[d.weekday ?? 0]}, ${formatDate(d.date, { day: "numeric", month: "short" })}` : "");
    eq(`${tag} date-label`, sd.eyebrow, eyebrow);
    eq(`${tag} title`, sd.title, d.title);
    eq(`${tag} sub`, sd.sub, norm(`Around ${d.neighborhoodFocus}${d.walkingAndTransitMinutes > 0 ? ` · ${d.walkingAndTransitMinutes} min between stops (${d.distanceKm} km)` : ""}`));
    const hasCost = d.cost.high > 0;
    const costWant = hasCost
      ? `${moneyRange(d.cost.low, d.cost.high, cur)} per person · likely ${money(d.cost.likely, cur)}${d.cost.unknownItems > 0 ? ` ${d.cost.unknownItems} stop(s) have no listed price` : ""}`
      : "No prices listed for this day";
    eq(`${tag} cost`, sd.cost, norm(costWant));
    if (sd.stops.length !== d.stops.length) {
      bad(`${tag} stop-count`, String(sd.stops.length), String(d.stops.length));
      return;
    }
    d.stops.forEach((s, j) => {
      const ss = sd.stops[j];
      const sTag = `${tag} stop ${j + 1}`;
      eq(`${sTag} time`, ss.time, s.time);
      eq(`${sTag} end-time`, ss.end, s.endTime ?? "");
      eq(`${sTag} name`, ss.name, s.name);
      const kindWant = (s.slotLabel ?? STOP_KIND_LABELS[s.kind] ?? s.kind) + (s.priority ? ` ${priorityLabel(s.priority)}` : "");
      eq(`${sTag} kind`, ss.kind, norm(kindWant));
      const c = s.cost;
      let whereWant = `${s.neighborhood} · ${s.durationLabel}`;
      if (c?.known) whereWant += ` · ${c.max === 0 ? "Free" : c.min === c.max ? money(c.min, c.currency) : moneyRange(c.min, c.max, c.currency)}`;
      if (c && !c.known && s.category && s.category !== "dayTrip") whereWant += " · price not listed";
      eq(`${sTag} where-and-price`, ss.where, norm(whereWant));
      // Booking menu: official site, map link, then provider searches for this stop.
      if (s.category && s.kind !== "transit" && s.kind !== "free-time") {
        const offers = stopOffersSync({ name: s.name, officialUrl: s.officialUrl, bookingUrl: s.bookingUrl }, s.category as StopCategory, trip);
        const official = offers.find((o) => o.provider === "official");
        const want = [official?.url, s.mapsUrl, ...offers.filter((o) => o.provider !== "official").map((o) => o.url)].filter(Boolean).map((u) => href(u as string));
        if (JSON.stringify(ss.links.map(href)) !== JSON.stringify(want)) f.push({ check: "render.stop-links", detail: `${sTag} "${s.name}": page has ${ss.links.length} links, expected ${want.length}` });
      }
    });
  });

  const want = tripLinksSync(trip, topActivities(it));
  const wantLinks = [...want.flights, ...want.stays, ...want.activities.slice(0, 6), ...want.transfers].map((o) => href(o.url));
  if (JSON.stringify(scraped.tripLinks.map(href)) !== JSON.stringify(wantLinks)) {
    f.push({ check: "render.trip-links", detail: `book-this-trip has ${scraped.tripLinks.length} links, expected ${wantLinks.length} for ${it.destination} ${it.startDate ?? "undated"} ${input.adults}A+${input.children}C` });
  }
  const warnWant = it.warnings.map(norm);
  if (JSON.stringify(scraped.warnings) !== JSON.stringify(warnWant)) f.push({ check: "render.warnings", detail: `page ${scraped.warnings.length} warnings, engine ${warnWant.length}` });
  return f;
}
