"use client";

import { useId, useMemo } from "react";
import type { Destination, DietaryNeed, Interest, TravelStyle } from "@/lib/types";
import type { BudgetTier, Mobility, Pace } from "@/lib/itinerary-engine";
import { MAX_TRIP_DAYS, PRESET_DURATIONS } from "@/lib/itinerary-engine";
import {
  ALL_INTERESTS,
  ALL_TRAVEL_STYLES,
  BUDGET_LABELS,
  DIETARY_LABELS,
  INTEREST_LABELS,
  PACE_LABELS,
  TRAVEL_STYLE_LABELS,
} from "@/lib/format";
import PlacePicker, { type PickerOption } from "@/components/PlacePicker";

export interface PlannerFormState {
  slug: string;
  startDate: string;
  endDate: string;
  duration: number;
  adults: number;
  children: number;
  budget: BudgetTier;
  travelStyle: TravelStyle;
  interests: Interest[];
  pace: Pace;
  mobility: Mobility;
  dietary: DietaryNeed[];
  mustInclude: string[];
  avoid: string[];
  arrivalTime: string;
  departureTime: string;
}

interface Props {
  state: PlannerFormState;
  onChange: (patch: Partial<PlannerFormState>) => void;
  destinations: Destination[];
  destination: Destination;
  onSubmit: () => void;
  busy: boolean;
}

function Segmented<T extends string>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="field">
      <legend>{legend}</legend>
      <div className="seg" role="radiogroup" aria-label={legend}>
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={value === o.id}
            className={`seg-btn${value === o.id ? " is-on" : ""}`}
            onClick={() => onChange(o.id)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Toggles<T extends string>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: { id: T; label: string }[];
  value: T[];
  onChange: (v: T[]) => void;
}) {
  return (
    <fieldset className="field">
      <legend>{legend}</legend>
      <div className="seg seg-wrap">
        {options.map((o) => {
          const on = value.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={on}
              className={`seg-btn${on ? " is-on" : ""}`}
              onClick={() => onChange(on ? value.filter((v) => v !== o.id) : [...value, o.id])}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  const id = useId();
  return (
    <div className="field">
      <span className="field-label" id={id}>
        {label}
      </span>
      <div className="stepper" role="group" aria-labelledby={id}>
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} aria-label={`Fewer: ${label}`}>
          −
        </button>
        <output aria-live="polite">{value}</output>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} aria-label={`More: ${label}`}>
          +
        </button>
      </div>
    </div>
  );
}

export default function PlannerForm({ state, onChange, destinations, destination, onSubmit, busy }: Props) {
  const id = useId();
  const dateError = state.startDate && state.endDate && state.endDate < state.startDate ? "End date must be on or after the start date." : "";
  const datedLength = state.startDate && state.endDate && !dateError;

  const placeOptions: PickerOption[] = useMemo(() => {
    const d = destination;
    return [
      ...d.landmarks.map((p) => ({ id: p.id, label: p.name })),
      ...d.restaurants.map((p) => ({ id: p.id, label: p.name })),
      ...d.cafes.map((p) => ({ id: p.id, label: p.name })),
      ...d.experiences.map((p) => ({ id: p.id, label: p.name })),
      ...d.nightlife.map((p) => ({ id: p.id, label: p.name })),
      ...d.dayTrips.map((p) => ({ id: p.id, label: p.name })),
    ].filter((o, i, all) => all.findIndex((x) => x.label === o.label) === i);
  }, [destination]);

  return (
    <form
      className="planner-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!dateError) onSubmit();
      }}
    >
      <div className="field">
        <label htmlFor={`${id}-city`}>Destination</label>
        <select id={`${id}-city`} value={state.slug} onChange={(e) => onChange({ slug: e.target.value, mustInclude: [], avoid: [] })}>
          {destinations.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.city}, {d.country}
            </option>
          ))}
        </select>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor={`${id}-start`}>Start date</label>
          <input id={`${id}-start`} type="date" value={state.startDate} onChange={(e) => onChange({ startDate: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor={`${id}-end`}>End date</label>
          <input
            id={`${id}-end`}
            type="date"
            value={state.endDate}
            min={state.startDate || undefined}
            onChange={(e) => onChange({ endDate: e.target.value })}
            aria-describedby={dateError ? `${id}-date-err` : undefined}
          />
        </div>
      </div>
      {dateError && (
        <p className="field-error" id={`${id}-date-err`} role="alert">
          {dateError}
        </p>
      )}
      <p className="field-hint">With dates, the plan avoids closed days and shows the weekday for each day.</p>

      {!datedLength && (
        <fieldset className="field">
          <legend>Trip length</legend>
          <div className="seg seg-wrap" role="group" aria-label="Trip length presets">
            {PRESET_DURATIONS.map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={state.duration === n}
                className={`seg-btn${state.duration === n ? " is-on" : ""}`}
                onClick={() => onChange({ duration: n })}
              >
                {n} days
              </button>
            ))}
          </div>
          <Stepper label="Days (1–14)" value={state.duration} min={1} max={MAX_TRIP_DAYS} onChange={(n) => onChange({ duration: n })} />
        </fieldset>
      )}

      <div className="field-row">
        <Stepper label="Adults" value={state.adults} min={1} max={12} onChange={(n) => onChange({ adults: n })} />
        <Stepper label="Children" value={state.children} min={0} max={8} onChange={(n) => onChange({ children: n })} />
      </div>

      <Segmented<Pace>
        legend="Pace"
        value={state.pace}
        onChange={(pace) => onChange({ pace })}
        options={(Object.keys(PACE_LABELS) as Pace[]).map((p) => ({ id: p, label: PACE_LABELS[p] }))}
      />
      <Segmented<BudgetTier>
        legend="Budget"
        value={state.budget}
        onChange={(budget) => onChange({ budget })}
        options={(Object.keys(BUDGET_LABELS) as BudgetTier[]).map((b) => ({ id: b, label: BUDGET_LABELS[b] }))}
      />
      <Segmented<Mobility>
        legend="Getting around"
        value={state.mobility}
        onChange={(mobility) => onChange({ mobility })}
        options={[
          { id: "standard", label: "Happy to walk" },
          { id: "limited", label: "Limited mobility" },
        ]}
      />

      <div className="field">
        <label htmlFor={`${id}-style`}>Travel style</label>
        <select id={`${id}-style`} value={state.travelStyle} onChange={(e) => onChange({ travelStyle: e.target.value as TravelStyle })}>
          {ALL_TRAVEL_STYLES.map((s) => (
            <option key={s} value={s}>
              {TRAVEL_STYLE_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <Toggles<Interest>
        legend="Interests"
        value={state.interests}
        onChange={(interests) => onChange({ interests })}
        options={ALL_INTERESTS.map((i) => ({ id: i, label: INTEREST_LABELS[i] }))}
      />
      <Toggles<DietaryNeed>
        legend="Dietary needs"
        value={state.dietary}
        onChange={(dietary) => onChange({ dietary })}
        options={(Object.keys(DIETARY_LABELS) as DietaryNeed[]).map((d) => ({ id: d, label: DIETARY_LABELS[d] }))}
      />
      {state.dietary.length > 0 && (
        <p className="field-hint">
          Restaurant matching uses cuisine and signature dishes. It is a filter, not a guarantee, so confirm with the venue.
        </p>
      )}

      <PlacePicker
        label="Must include"
        hint="Places that have to be in the plan."
        options={placeOptions}
        value={state.mustInclude}
        onChange={(mustInclude) => onChange({ mustInclude, avoid: state.avoid.filter((a) => !mustInclude.includes(a)) })}
      />
      <PlacePicker
        label="Skip these"
        hint="Places to leave out."
        options={placeOptions}
        value={state.avoid}
        onChange={(avoid) => onChange({ avoid, mustInclude: state.mustInclude.filter((m) => !avoid.includes(m)) })}
      />

      <details className="field-details">
        <summary>Flight times (optional)</summary>
        <div className="field-row">
          <div className="field">
            <label htmlFor={`${id}-arr`}>Landing on day 1</label>
            <input id={`${id}-arr`} type="time" value={state.arrivalTime} onChange={(e) => onChange({ arrivalTime: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor={`${id}-dep`}>Flight home, last day</label>
            <input id={`${id}-dep`} type="time" value={state.departureTime} onChange={(e) => onChange({ departureTime: e.target.value })} />
          </div>
        </div>
        <p className="field-hint">The last day ends three hours before your flight; the first starts about 2.5 hours after landing.</p>
      </details>

      <button type="submit" className="btn btn-primary btn-block" disabled={busy || !!dateError} aria-busy={busy}>
        {busy ? "Building your plan…" : "Build my itinerary"}
      </button>
    </form>
  );
}
