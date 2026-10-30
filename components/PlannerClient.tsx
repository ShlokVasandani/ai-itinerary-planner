"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cityIndex, loadDestination } from "@/lib/data/catalog";
import {
  generateItinerary,
  regenerateDay,
  swapStop,
  type GeneratedItinerary,
  type PlannerInput,
} from "@/lib/itinerary-engine";
import { BUDGET_LABELS, INTEREST_LABELS, PACE_LABELS, TRAVEL_STYLE_LABELS, formatDate, money, moneyRange } from "@/lib/format";
import PlannerForm, { type PlannerFormState } from "@/components/PlannerForm";
import DayCard from "@/components/DayCard";
import BookTripPanel from "@/components/BookTripPanel";
import Photo from "@/components/Photo";
import PricesPanel from "@/components/PricesPanel";
import PlanSkeleton from "@/components/PlanSkeleton";
import TightTripNotice from "@/components/TightTripNotice";
import { tripProblem } from "@/lib/trip-problem";
import type { TripLinkInput } from "@/lib/providers";
import type { Destination, DietaryNeed, Interest } from "@/lib/types";

const DEFAULTS: Omit<PlannerFormState, "slug"> = {
  startDate: "",
  endDate: "",
  duration: 5,
  adults: 2,
  children: 0,
  budget: "mid-range",
  travelStyle: "first-time",
  interests: ["food", "history", "photography"],
  pace: "balanced",
  mobility: "standard",
  dietary: [],
  mustInclude: [],
  avoid: [],
  arrivalTime: "",
  departureTime: "",
};

function toInput(f: PlannerFormState, destination: Destination, seed: string): PlannerInput {
  const dated = f.startDate && f.endDate && f.endDate >= f.startDate;
  return {
    destination,
    duration: f.duration,
    startDate: f.startDate || undefined,
    endDate: dated ? f.endDate : undefined,
    budget: f.budget,
    travelStyle: f.travelStyle,
    interests: f.interests,
    pace: f.pace,
    groupSize: f.adults + f.children,
    hasKids: f.children > 0,
    mobility: f.mobility,
    dietary: f.dietary as DietaryNeed[],
    mustInclude: f.mustInclude,
    avoid: f.avoid,
    arrivalFlightTime: f.arrivalTime || undefined,
    departureFlightTime: f.departureTime || undefined,
    seed,
  };
}

/**
 * Generation itself takes a few milliseconds. The skeleton is held for this long anyway: a loading
 * state that flashes for 100ms reads as a glitch, one that settles in 300ms reads as the plan being built.
 */
const MIN_BUSY_MS = 300;

const FIT_TEXT = {
  under: "Under your budget tier",
  "on-target": "On target for your budget tier",
  over: "Over your budget tier",
} as const;

export interface PlannerInitial {
  city?: string;
  start?: string;
  end?: string;
  adults?: string;
  children?: string;
  go?: string;
  origin?: string;
}

export default function PlannerClient({ initial, initialDestination }: { initial: PlannerInitial; initialDestination: Destination }) {
  const initialSlug = initialDestination.slug;

  const [form, setForm] = useState<PlannerFormState>(() => ({
    ...DEFAULTS,
    slug: initialSlug,
    startDate: /^\d{4}-\d{2}-\d{2}$/.test(initial.start ?? "") ? initial.start! : "",
    endDate: /^\d{4}-\d{2}-\d{2}$/.test(initial.end ?? "") ? initial.end! : "",
    adults: Math.min(12, Math.max(1, Number(initial.adults) || DEFAULTS.adults)),
    children: Math.min(8, Math.max(0, Number(initial.children) || 0)),
  }));
  const [itinerary, setItinerary] = useState<GeneratedItinerary | null>(null);
  // Arriving from the landing search (?go=1) builds straight away, so the skeleton is there from the first paint.
  const [busy, setBusy] = useState(!!initial.go);
  const [stale, setStale] = useState(false);
  const [origin, setOrigin] = useState(/^[A-Za-z]{3}$/.test(initial.origin ?? "") ? initial.origin!.toUpperCase() : "");
  const regen = useRef(0);
  const resultsRef = useRef<HTMLDivElement>(null);

  const [destination, setDestination] = useState<Destination>(initialDestination);
  // A load error belongs to the city it happened for; choosing another city clears it without an effect.
  const [loadError, setLoadError] = useState<{ slug: string; message: string } | null>(null);
  const cityError = loadError && loadError.slug === form.slug ? loadError.message : "";
  const cities = useMemo(() => cityIndex.map((c) => ({ slug: c.slug, city: c.city, country: c.country })), []);

  // The picker moved to a city whose data has not arrived yet. Derived, not stored: a "loading" flag that an effect
  // had to reset could be left set forever (its cleanup ran as soon as the new city landed, before it could clear it).
  const loadingCity = form.slug !== destination.slug && !cityError;

  // Open-data cities are separate chunks; fetch the chosen one when the picker changes.
  useEffect(() => {
    if (form.slug === destination.slug) return;
    let live = true;
    const slug = form.slug;
    loadDestination(slug)
      .then((d) => {
        if (!live) return;
        if (d) setDestination(d);
        else setLoadError({ slug, message: "That city could not be loaded." });
      })
      .catch(() => live && setLoadError({ slug, message: "That city could not be loaded. Check your connection and try again." }));
    return () => {
      live = false;
    };
  }, [form.slug, destination.slug]);

  // Start fetching an open-data city's chunk as soon as it is hovered or pressed, so the click lands on a warm cache.
  const warmCity = useCallback((slug: string) => {
    void loadDestination(slug).catch(() => undefined);
  }, []);

  const update = useCallback((patch: Partial<PlannerFormState>) => {
    setForm((f) => ({ ...f, ...patch }));
    setStale(true);
  }, []);

  // Schedules the build. Not cancelled on unmount: Strict Mode's simulated unmount in development would kill this
  // timer, and the auto-build effect below never re-runs, leaving the skeleton up for good. Late updates are harmless.
  const runBuild = useCallback(
    (f: PlannerFormState) => {
      window.setTimeout(() => {
        setItinerary(generateItinerary(toInput(f, destination, "sekai")));
        regen.current = 0;
        setStale(false);
        setBusy(false);
        const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" }), 50);
      }, MIN_BUSY_MS);
    },
    [destination]
  );
  const build = useCallback(
    (f: PlannerFormState) => {
      setBusy(true);
      runBuild(f);
    },
    [runBuild]
  );

  // Arriving from the landing page search (?go=1): build straight away.
  const auto = useRef(false);
  useEffect(() => {
    if (auto.current) return;
    auto.current = true;
    if (initial.go) runBuild(form); // busy is already true (see its initial value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const trip: TripLinkInput = useMemo(
    () => ({
      destination: itinerary?.input.destination ?? destination,
      origin: origin || undefined,
      startDate: itinerary?.startDate,
      endDate: itinerary?.endDate,
      adults: form.adults,
      children: form.children,
    }),
    [destination, itinerary?.input.destination, origin, itinerary?.startDate, itinerary?.endDate, form.adults, form.children]
  );

  const topActivities = useMemo(() => {
    if (!itinerary) return [];
    const names: string[] = [];
    for (const day of itinerary.days)
      for (const s of day.stops)
        if ((s.category === "landmark" || s.category === "experience") && s.priority === "must-see" && !names.includes(s.name)) names.push(s.name);
    return names.slice(0, 3);
  }, [itinerary]);

  const onRegenerate = (dayNumber: number) => {
    if (!itinerary) return;
    regen.current += 1;
    setItinerary(regenerateDay(itinerary, dayNumber, `shuffle-${regen.current}`));
  };
  const onSwap = (dayNumber: number, stopIndex: number, alternativeId: string) => {
    if (!itinerary) return;
    const res = swapStop(itinerary, dayNumber, stopIndex, alternativeId);
    if (!res.error) setItinerary(res.itinerary);
  };

  const problem = itinerary ? tripProblem(itinerary) : undefined;
  const fit = itinerary?.budgetFit;
  const perDayLikely = itinerary ? itinerary.cost.likely / itinerary.duration : 0;

  return (
    <main className="planner-page">
      <header className="planner-hero">
        <div className="planner-hero-photo" aria-hidden="true" key={destination.slug}>
          <Photo slug={destination.slug} city={destination.city} sizes="100vw" priority />
        </div>
        <div className="planner-hero-text">
          <p className="eyebrow">Plan a trip · {destination.country}</p>
          <h1>{destination.city}</h1>
          <p className="lede">{destination.tagline}</p>
        </div>
      </header>

      <div className="planner planner-layout">
        <aside className="planner-side" aria-label="Trip settings">
          <PlannerForm
            state={form}
            onChange={update}
            cities={cities}
            destination={destination}
            onSubmit={() => build(form)}
            onWarmCity={warmCity}
            busy={busy || loadingCity}
          />
        </aside>

        <div className={`planner-main${loadingCity && itinerary ? " is-loading" : ""}`} ref={resultsRef}>
          {cityError && (
            <p className="stale-note" role="alert">
              {cityError}
            </p>
          )}
          {!itinerary && !busy && !loadingCity && (
            // ScrollFX tags this with data-reveal as soon as it mounts, which can land before this subtree hydrates
            // (the route's loading boundary hydrates separately). The attribute is deliberately client-only.
            <div className="planner-empty" suppressHydrationWarning>
              <h2>
                {form.startDate && form.endDate ? "Your dates are set" : `${form.duration} days in ${destination.city}`}, ready when you are
              </h2>
              <p>
                Choose how you travel on the left and build your plan. Stops are grouped by neighborhood, ordered nearest
                first, and checked against opening hours for your dates.
              </p>
            </div>
          )}

          {busy && <PlanSkeleton label={`Building your plan for ${destination.city}`} />}
          {!busy && loadingCity && !itinerary && <PlanSkeleton label="Loading city data" />}

          {itinerary && !busy && problem && (
            <>
              {stale && (
                <p className="stale-note" role="status">
                  Settings changed. Build again to update this plan.
                </p>
              )}
              <TightTripNotice problem={problem} />
            </>
          )}

          {itinerary && !busy && !problem && (
            <>
              {stale && (
                <p className="stale-note" role="status">
                  Settings changed. Build again to update this plan.
                </p>
              )}
              <section className="trip-summary" aria-label="Trip summary">
                <div>
                  <h2>
                    {itinerary.duration} {itinerary.duration === 1 ? "day" : "days"} in {itinerary.destination}
                  </h2>
                  <p className="muted">
                    {TRAVEL_STYLE_LABELS[itinerary.input.travelStyle]} · {BUDGET_LABELS[itinerary.input.budget]} ·{" "}
                    {PACE_LABELS[itinerary.input.pace]}
                    {itinerary.startDate && (
                      <>
                        {" · "}
                        {formatDate(itinerary.startDate)} to {formatDate(itinerary.endDate)}
                      </>
                    )}
                    {itinerary.input.interests.length > 0 && (
                      <> · {itinerary.input.interests.map((i: Interest) => INTEREST_LABELS[i]).join(", ")}</>
                    )}
                  </p>
                </div>
                <dl className="trip-total">
                  <div>
                    <dt>Planned entries and meals, per person</dt>
                    <dd>
                      <strong>{moneyRange(itinerary.cost.low, itinerary.cost.high, itinerary.currency)}</strong>
                      <span>likely {money(itinerary.cost.likely, itinerary.currency)}</span>
                    </dd>
                  </div>
                  {itinerary.input.groupSize > 1 && (
                    <div>
                      <dt>Whole party ({itinerary.input.groupSize})</dt>
                      <dd>
                        <strong>{money(itinerary.groupLikely, itinerary.currency)}</strong>
                        <span>children may pay less</span>
                      </dd>
                    </div>
                  )}
                  {fit && itinerary.input.destination.quickFacts.averageDailyBudget && (
                    <div>
                      <dt>Budget fit</dt>
                      <dd>
                        <strong className={`fit fit-${fit.status}`}>{fit.comparable ? FIT_TEXT[fit.status] : "Not comparable"}</strong>
                        <span>
                          {fit.comparable
                            ? `${money(Math.round(perDayLikely), itinerary.currency)} per day vs ${fit.tierDailyMin !== undefined ? money(fit.tierDailyMin, itinerary.currency) : ""}${fit.tierDailyMax ? `–${money(fit.tierDailyMax, itinerary.currency).replace(/^[^\d]*/, "")}` : "+"} total daily budget`
                            : "Tier budget is in another currency"}
                        </span>
                      </dd>
                    </div>
                  )}
                </dl>
                <p className="muted summary-foot">
                  Excludes lodging and transport. Ranges come from listed prices; {itinerary.cost.unknownItems} stop(s) have none
                  and count as zero.
                </p>
                {itinerary.season && (
                  <p className="muted summary-foot">
                    Month check (1 to 5):{" "}
                    {[
                      itinerary.season.crowds !== undefined && `crowds ${itinerary.season.crowds}`,
                      `weather ${itinerary.season.weather}`,
                      itinerary.season.price !== undefined && `prices ${itinerary.season.price}`,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                    . {itinerary.input.destination.tier === "open" ? "Weather is computed from climate averages." : "Editorial estimate."}
                  </p>
                )}
                {itinerary.warnings.length > 0 && (
                  <ul className="warn-list" role="status">
                    {itinerary.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                )}
              </section>

              <nav className="day-jump" aria-label="Jump to a day">
                {itinerary.days.map((d) => (
                  <a key={d.dayNumber} href={`#day-${d.dayNumber}`}>
                    {d.dayNumber}
                  </a>
                ))}
              </nav>

              {itinerary.days.map((day) => (
                <DayCard key={day.dayNumber} day={day} itinerary={itinerary} trip={trip} onRegenerate={onRegenerate} onSwap={onSwap} />
              ))}

              {itinerary.unusedHighlights.length > 0 && (
                <p className="footnote">
                  <strong>Didn&apos;t make the cut:</strong> {itinerary.unusedHighlights.join(", ")}. Worth a longer visit, or use
                  &ldquo;Must include&rdquo;.
                </p>
              )}

              <div className="tools-grid">
                <PricesPanel trip={trip} currency={itinerary.currency} origin={origin} onOriginChange={setOrigin} topActivities={topActivities} />
                <BookTripPanel trip={trip} topActivities={topActivities} origin={origin} onOriginChange={setOrigin} />
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
