"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { destinations, getDestinationBySlug } from "@/lib/data";
import ClientDestinationMedia from "@/components/ClientDestinationMedia";
import StopIcon from "@/components/StopIcon";
import NoteIcon from "@/components/NoteIcon";
import PriorityIcon from "@/components/PriorityIcon";
import { generateItinerary, priorityLabel, type TripDuration } from "@/lib/itinerary-engine";
import type { Interest, TravelStyle } from "@/lib/types";
import { ALL_INTERESTS, ALL_TRAVEL_STYLES, INTEREST_LABELS, TRAVEL_STYLE_LABELS, STOP_KIND_LABELS, stopDotCategory } from "@/lib/format";

const BUDGETS: { id: "budget" | "mid-range" | "luxury"; label: string }[] = [
  { id: "budget", label: "Budget" },
  { id: "mid-range", label: "Mid-range" },
  { id: "luxury", label: "Luxury" },
];

const DURATIONS: TripDuration[] = [3, 5, 7];

export default function PlannerClient() {
  const searchParams = useSearchParams();
  const preselected = searchParams.get("city");

  const [slug, setSlug] = useState(preselected && getDestinationBySlug(preselected) ? preselected : destinations[0].slug);
  const [duration, setDuration] = useState<TripDuration>(5);
  const [budget, setBudget] = useState<"budget" | "mid-range" | "luxury">("mid-range");
  const [travelStyle, setTravelStyle] = useState<TravelStyle>("first-time");
  const [interests, setInterests] = useState<Interest[]>(["food", "history", "photography"]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeDay, setActiveDay] = useState(1);

  const destination = getDestinationBySlug(slug) ?? destinations[0];

  const itinerary = useMemo(() => {
    if (!hasGenerated) return null;
    return generateItinerary({ destination, duration, budget, travelStyle, interests });
  }, [hasGenerated, destination, duration, budget, travelStyle, interests]);

  function toggleInterest(i: Interest) {
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  }

  /** Any control change invalidates the current result and resets the view
   * back to day one, so the next generation always starts from a clean slate. */
  function resetResult() {
    setHasGenerated(false);
    setActiveDay(1);
  }

  return (
    <main className="journal">
      <p className="journal-eyebrow">Curated Itineraries</p>

      <section className="journal-spread">
        {/* ============== LEFT: destination feature ============== */}
        <div className="feature">
          <div className="feature-photo" key={slug}>
            <ClientDestinationMedia slug={destination.slug} city={destination.city} variant="hero" />
          </div>

          <div className="feature-heading">
            <p className="feature-country">{destination.country}</p>
            <h1 className="feature-city">{destination.city}</h1>
            <p className="feature-tagline">{destination.tagline}</p>

            <label htmlFor="city-select" className="sr-only">Choose a destination</label>
            <div className="feature-switcher">
              <span>Now touring</span>
              <select id="city-select" value={slug} onChange={(e) => { setSlug(e.target.value); resetResult(); }}>
                {destinations.map((d) => (
                  <option key={d.slug} value={d.slug}>
                    {d.city}, {d.country}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <form
            className="prefs"
            onSubmit={(e) => {
              e.preventDefault();
              setActiveDay(1);
              setIsGenerating(true);
              // A short, honest pause — long enough for the transition to read
              // as intentional, short enough to never feel like a real wait.
              // No fake progress claims: this is instant deterministic work.
              window.setTimeout(() => {
                setHasGenerated(true);
                setIsGenerating(false);
              }, 380);
            }}
          >
            <div className="pref-row">
              <span className="pref-label">Trip length</span>
              <div className="pref-options" role="group" aria-label="Trip length">
                {DURATIONS.map((d) => (
                  <button
                    type="button"
                    key={d}
                    className={`pref-option${duration === d ? " active" : ""}`}
                    aria-pressed={duration === d}
                    onClick={() => { setDuration(d); resetResult(); }}
                  >
                    {d} days
                  </button>
                ))}
              </div>
            </div>

            <div className="pref-row">
              <span className="pref-label">Budget</span>
              <div className="pref-options" role="group" aria-label="Budget">
                {BUDGETS.map((b) => (
                  <button
                    type="button"
                    key={b.id}
                    className={`pref-option${budget === b.id ? " active" : ""}`}
                    aria-pressed={budget === b.id}
                    onClick={() => { setBudget(b.id); resetResult(); }}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pref-row">
              <span className="pref-label">Travel style</span>
              <div className="pref-options" role="group" aria-label="Travel style">
                {ALL_TRAVEL_STYLES.map((s) => (
                  <button
                    type="button"
                    key={s}
                    className={`pref-option${travelStyle === s ? " active" : ""}`}
                    aria-pressed={travelStyle === s}
                    onClick={() => { setTravelStyle(s); resetResult(); }}
                  >
                    {TRAVEL_STYLE_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            <div className="pref-row">
              <span className="pref-label">Interests</span>
              <div className="pref-options" role="group" aria-label="Interests">
                {ALL_INTERESTS.map((i) => (
                  <button
                    type="button"
                    key={i}
                    className={`pref-option${interests.includes(i) ? " active" : ""}`}
                    aria-pressed={interests.includes(i)}
                    onClick={() => { toggleInterest(i); resetResult(); }}
                  >
                    {INTEREST_LABELS[i]}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="feature-cta" disabled={isGenerating} aria-busy={isGenerating}>
              {isGenerating ? "Building itinerary…" : "Build my itinerary →"}
            </button>
          </form>
        </div>

        {/* ============== RIGHT: the itinerary, as a journal page ============== */}
        <div className="journal-page">
          {!itinerary && !isGenerating && (
            <div className="journal-empty">
              <p className="journal-empty-lead">
                {duration} days in {destination.city}, arranged for you.
              </p>
              <p className="muted-small">
                Real neighborhoods, real timing, no backtracking across town for a view.
                Adjust anything at left — the plan updates the moment you build it.
              </p>
            </div>
          )}

          {isGenerating && (
            <div className="journal-loading" role="status" aria-live="polite">
              <span className="journal-loading-mark" aria-hidden="true" />
              <p>Building your {duration}-day itinerary for {destination.city}…</p>
            </div>
          )}

          {itinerary && !isGenerating && (
            <div className="journal-result">
              <h2 className="journal-title">
                {duration} days in {destination.city}
              </h2>
              <p className="journal-subtitle">
                {TRAVEL_STYLE_LABELS[travelStyle]} · {BUDGETS.find((b) => b.id === budget)?.label} ·{" "}
                {interests.map((i) => INTEREST_LABELS[i]).join(", ") || "no interests selected"}
              </p>

              {itinerary.days.length > 1 && (
                <nav className="journal-days" role="tablist" aria-label="Itinerary days">
                  {itinerary.days.map((day) => (
                    <button
                      key={day.dayNumber}
                      type="button"
                      role="tab"
                      id={`daytab-${day.dayNumber}`}
                      aria-selected={activeDay === day.dayNumber}
                      aria-controls={`daypanel-${day.dayNumber}`}
                      className={`journal-day-btn${activeDay === day.dayNumber ? " active" : ""}`}
                      onClick={() => setActiveDay(day.dayNumber)}
                    >
                      {String(day.dayNumber).padStart(2, "0")}
                    </button>
                  ))}
                </nav>
              )}

              {itinerary.days
                .filter((day) => day.dayNumber === activeDay)
                .map((day) => (
                <article
                  className="journal-day"
                  role="tabpanel"
                  id={`daypanel-${day.dayNumber}`}
                  aria-labelledby={`daytab-${day.dayNumber}`}
                  tabIndex={0}
                  key={day.dayNumber}
                >
                  <header className="journal-day-head">
                    <h3>{day.title}</h3>
                    <p>Day {day.dayNumber} · Focus on {day.neighborhoodFocus}</p>
                  </header>

                  <div className="journal-stops">
                    {day.stops.map((stop, i) => (
                      <div className="journal-stop" style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }} key={i}>
                        <div className="journal-stop-time">
                          <span>{stop.time}</span>
                          {stop.endTime && <span className="journal-stop-time-end">–{stop.endTime}</span>}
                        </div>
                        <div className="journal-stop-rule" aria-hidden="true" />
                        <div className="journal-stop-body">
                          <div className="journal-stop-meta">
                            <StopIcon kind={stop.kind} className={`dot-${stopDotCategory(stop.kind)}`} />
                            <span>{STOP_KIND_LABELS[stop.kind] ?? stop.kind}</span>
                            {stop.priority && (
                              <span className="journal-stop-priority">
                                <PriorityIcon priority={stop.priority} /> {priorityLabel(stop.priority)}
                              </span>
                            )}
                          </div>
                          <h4>{stop.name}</h4>
                          <p className="journal-stop-location">{stop.neighborhood} · {stop.durationLabel}</p>
                          <p className="journal-stop-desc">{stop.description}</p>
                          {stop.whyGo && <p className="journal-stop-why">{stop.whyGo}</p>}
                          <div className="journal-stop-facts">
                            {stop.approxCost && <span>{stop.approxCost}</span>}
                            {stop.transportNote && <span>{stop.transportNote}</span>}
                          </div>
                          {stop.reservationNote && (
                            <p className="reservation-note">
                              <NoteIcon /> {stop.reservationNote}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}

              {itinerary.unusedHighlights.length > 0 && (
                <div className="journal-footnote">
                  <p className="pref-label">Didn't make the cut this trip</p>
                  <p className="muted-small">
                    Worth considering on a longer visit or a return trip: {itinerary.unusedHighlights.join(", ")}.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
