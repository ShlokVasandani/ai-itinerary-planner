"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { GeneratedItinerary, ItineraryDay, SwapCandidate, TimelineStop } from "@/lib/itinerary-engine";
import { priorityLabel, swapStop } from "@/lib/itinerary-engine";
import { STOP_KIND_LABELS, WEEKDAYS, formatDate, money, moneyRange, stopDotCategory } from "@/lib/format";
import type { TripLinkInput } from "@/lib/providers";
import StopIcon from "@/components/StopIcon";
import PriorityIcon from "@/components/PriorityIcon";
import NoteIcon from "@/components/NoteIcon";
import BookMenu from "@/components/BookMenu";
import Popover from "@/components/Popover";

const DayMap = dynamic(() => import("@/components/DayMap"), {
  ssr: false,
  loading: () => <div className="day-map is-loading"><p className="day-map-placeholder">Map loads as you scroll…</p></div>,
});

interface Props {
  day: ItineraryDay;
  itinerary: GeneratedItinerary;
  trip: TripLinkInput;
  onRegenerate: (dayNumber: number) => void;
  onSwap: (dayNumber: number, stopIndex: number, alternativeId: string) => void;
}

function SwapMenu({ itinerary, day, index, onSwap }: { itinerary: GeneratedItinerary; day: ItineraryDay; index: number; onSwap: Props["onSwap"] }) {
  const [candidates, setCandidates] = useState<SwapCandidate[] | null>(null);
  return (
    <Popover
      label="Swap"
      ariaLabel={`Swap ${day.stops[index].name}`}
      onOpen={() => setCandidates(swapStop(itinerary, day.dayNumber, index).candidates)}
    >
      {(close) => (
        <>
          <p className="menu-title">Replace with</p>
          {candidates === null ? (
            <p className="menu-foot">Finding options…</p>
          ) : candidates.length === 0 ? (
            <p className="menu-foot">No open alternatives fit at this time.</p>
          ) : (
            <ul className="menu-list">
              {candidates.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="menu-link"
                    onClick={() => {
                      onSwap(day.dayNumber, index, c.id);
                      close();
                    }}
                  >
                    <strong>{c.name}</strong>
                    <span>{c.reason}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Popover>
  );
}

function StopRow({ stop, index, day, itinerary, trip, onSwap }: { stop: TimelineStop; index: number; day: ItineraryDay; itinerary: GeneratedItinerary; trip: TripLinkInput; onSwap: Props["onSwap"] }) {
  const swappable = !!stop.refId && !!stop.category && stop.category !== "dayTrip" && stop.kind !== "transit" && stop.kind !== "free-time";
  const cost = stop.cost;
  return (
    <li className={`stop stop-${stopDotCategory(stop.kind)}`}>
      <div className="stop-time">
        <span>{stop.time}</span>
        {stop.endTime && <span className="stop-time-end">{stop.endTime}</span>}
      </div>
      <div className="stop-rail" aria-hidden="true">
        <StopIcon kind={stop.kind} className={`dot-${stopDotCategory(stop.kind)}`} />
      </div>
      <div className="stop-body">
        {stop.transportNote && stop.kind !== "day-trip" && <p className="stop-transport">{stop.transportNote}</p>}
        <p className="stop-kind">
          {STOP_KIND_LABELS[stop.kind] ?? stop.kind}
          {stop.priority && (
            <span className="stop-priority">
              <PriorityIcon priority={stop.priority} /> {priorityLabel(stop.priority)}
            </span>
          )}
        </p>
        <h4>{stop.name}</h4>
        <p className="stop-where">
          {stop.neighborhood} · {stop.durationLabel}
          {cost?.known && (
            <>
              {" · "}
              <span className="stop-cost">
                {cost.max === 0 ? "Free" : cost.min === cost.max ? money(cost.min, cost.currency) : moneyRange(cost.min, cost.max, cost.currency)}
              </span>
            </>
          )}
          {cost && !cost.known && stop.category && stop.category !== "dayTrip" && (
            <>
              {" · "}
              <span className="muted">price not listed</span>
            </>
          )}
        </p>
        <p className="stop-desc">{stop.description}</p>
        {stop.whyGo && <p className="stop-why">{stop.whyGo}</p>}
        {stop.hoursNote && <p className="stop-hours">{stop.hoursNote}</p>}
        {stop.reservationNote && (
          <p className="reservation-note">
            <NoteIcon /> {stop.reservationNote}
          </p>
        )}
        {stop.notes?.map((n, i) => (
          <p key={i} className="stop-note">
            {n}
          </p>
        ))}
        {(swappable || stop.officialUrl || stop.mapsUrl) && (
          <div className="stop-actions">
            {stop.category && stop.kind !== "transit" && stop.kind !== "free-time" && <BookMenu stop={stop} trip={trip} />}
            {swappable && <SwapMenu itinerary={itinerary} day={day} index={index} onSwap={onSwap} />}
          </div>
        )}
      </div>
    </li>
  );
}

export default function DayCard({ day, itinerary, trip, onRegenerate, onSwap }: Props) {
  const currency = itinerary.currency;
  const hasCost = day.cost.high > 0;
  return (
    <article className="day-card" id={`day-${day.dayNumber}`} aria-labelledby={`day-${day.dayNumber}-title`}>
      <header className="day-head">
        <div>
          <p className="day-eyebrow">
            Day {day.dayNumber}
            {day.date && (
              <>
                {" · "}
                {WEEKDAYS[day.weekday ?? 0]}, {formatDate(day.date, { day: "numeric", month: "short" })}
              </>
            )}
          </p>
          <h3 id={`day-${day.dayNumber}-title`}>{day.title}</h3>
          <p className="day-sub">
            Around {day.neighborhoodFocus}
            {day.walkingAndTransitMinutes > 0 && <> · {day.walkingAndTransitMinutes} min between stops ({day.distanceKm} km)</>}
          </p>
        </div>
        <div className="day-cost" aria-label="Estimated cost per person">
          {hasCost ? (
            <>
              <strong>{moneyRange(day.cost.low, day.cost.high, currency)}</strong>
              <span>per person · likely {money(day.cost.likely, currency)}</span>
            </>
          ) : (
            <span>No prices listed for this day</span>
          )}
          {day.cost.unknownItems > 0 && hasCost && <span className="muted">{day.cost.unknownItems} stop(s) have no listed price</span>}
        </div>
      </header>

      {day.notes.length > 0 && (
        <ul className="day-notes">
          {day.notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      )}

      <div className="day-body">
        <ol className="stops">
          {day.stops.map((s, i) => (
            <StopRow key={`${s.time}-${s.name}-${i}`} stop={s} index={i} day={day} itinerary={itinerary} trip={trip} onSwap={onSwap} />
          ))}
        </ol>
        <aside className="day-aside" aria-label={`Map and tools for day ${day.dayNumber}`}>
          <DayMap stops={day.stops} dayNumber={day.dayNumber} city={itinerary.destination} />
          <button type="button" className="btn btn-small" onClick={() => onRegenerate(day.dayNumber)}>
            Shuffle this day
          </button>
        </aside>
      </div>
    </article>
  );
}
