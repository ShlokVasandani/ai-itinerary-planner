"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { destinations, getDestinationBySlug } from "@/lib/data";
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
import type { TripLinkInput } from "@/lib/providers";
import type { DietaryNeed, Interest } from "@/lib/types";

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

function toInput(f: PlannerFormState, seed: string): PlannerInput {
  const destination = getDestinationBySlug(f.slug) ?? destinations[0];
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
  go?: string;
}

export default function PlannerClient({ initial }: { initial: PlannerInitial }) {
  const initialSlug = (() => {
    const c = initial.city;
    return c && getDestinationBySlug(c) ? c : destinations[0].slug;
  })();

  const [form, setForm] = useState<PlannerFormState>(() => ({
    ...DEFAULTS,
    slug: initialSlug,
    startDate: /^\d{4}-\d{2}-\d{2}$/.test(initial.start ?? "") ? initial.start! : "",
    endDate: /^\d{4}-\d{2}-\d{2}$/.test(initial.end ?? "") ? initial.end! : "",
    adults: Math.min(12, Math.max(1, Number(initial.adults) || DEFAULTS.adults)),
  }));
  const [itinerary, setItinerary] = useState<GeneratedItinerary | null>(null);
  const [busy, setBusy] = useState(false);
  const [stale, setStale] = useState(false);
  const [origin, setOrigin] = useState("");
  const regen = useRef(0);
  const resultsRef = useRef<HTMLDivElement>(null);

  const destination = getDestinationBySlug(form.slug) ?? destinations[0];

  const update = useCallback((patch: Partial<PlannerFormState>) => {
    setForm((f) => ({ ...f, ...patch }));
    setStale(true);
  }, []);

  const build = useCallback(
    (f: PlannerFormState) => {
      setBusy(true);
      // Generation is instant; the short pause only lets the busy state register for assistive tech.
      window.setTimeout(() => {
        setItinerary(generateItinerary(toInput(f, "sekai")));
        regen.current = 0;
        setStale(false);
        setBusy(false);
        window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
      }, 120);
    },
    []
  );

  // Arriving from the landing page search (?go=1): build straight away.
  const auto = useRef(false);
  useEffect(() => {
    if (auto.current) return;
    auto.current = true;
    if (initial.go) build(form);
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

  const fit = itinerary?.budgetFit;
  const perDayLikely = itinerary ? itinerary.cost.likely / itinerary.duration : 0;

  return (
    <main className="planner">
      <header className="planner-hero">
        <div className="planner-hero-photo" aria-hidden="true">
          <Photo slug={destination.slug} city={destination.city} sizes="(max-width: 820px) 100vw, 360px" priority />
        </div>
        <div>
          <p className="eyebrow">Plan a trip</p>
          <h1>{destination.city}</h1>
          <p className="lede">{destination.tagline}</p>
        </div>
      </header>

      <div className="planner-layout">
        <aside className="planner-side" aria-label="Trip settings">
          <PlannerForm
            state={form}
            onChange={update}
            destinations={destinations}
            destination={destination}
            onSubmit={() => build(form)}
            busy={busy}
          />
        </aside>

        <div className="planner-main" ref={resultsRef}>
          {!itinerary && !busy && (
            <div className="planner-empty">
              <h2>
                {form.startDate && form.endDate ? "Your dates are set" : `${form.duration} days in ${destination.city}`}, ready when you are
              </h2>
              <p>
                Choose how you travel on the left and build your plan. Stops are grouped by neighborhood, ordered nearest
                first, and checked against opening hours for your dates.
              </p>
            </div>
          )}

          {busy && (
            <div className="planner-empty" role="status" aria-live="polite">
              <p>Building your plan for {destination.city}…</p>
            </div>
          )}

          {itinerary && !busy && (
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
                  {fit && (
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
                    Month check (editorial estimate, 1 to 5): crowds {itinerary.season.crowds}, weather {itinerary.season.weather},
                    prices {itinerary.season.price}.
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

              <PricesPanel trip={trip} currency={itinerary.currency} origin={origin} onOriginChange={setOrigin} topActivities={topActivities} />
              <BookTripPanel trip={trip} topActivities={topActivities} origin={origin} onOriginChange={setOrigin} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
