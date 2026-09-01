"use client";

import { useState } from "react";
import type { Destination } from "@/lib/types";
import NoteIcon from "@/components/NoteIcon";
import PriorityIcon from "@/components/PriorityIcon";

type TabId =
  | "overview"
  | "landmarks"
  | "food"
  | "neighborhoods"
  | "shopping"
  | "nightlife"
  | "experiences"
  | "day-trips"
  | "transport"
  | "practical";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "landmarks", label: "Places" },
  { id: "food", label: "Food" },
  { id: "neighborhoods", label: "Neighbourhoods" },
  { id: "shopping", label: "Shopping" },
  { id: "nightlife", label: "Nightlife" },
  { id: "experiences", label: "Experiences" },
  { id: "day-trips", label: "Day Trips" },
  { id: "transport", label: "Transport" },
  { id: "practical", label: "Practical" },
];

const num = (i: number) => String(i + 1).padStart(2, "0");

export default function DestinationTabs({ d }: { d: Destination }) {
  const [tab, setTab] = useState<TabId>("overview");

  return (
    <div className="tabs-wrap">
      <div className="tabs-nav" role="tablist" aria-label={`${d.city} information sections`}>
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            className={`tab-btn${tab === t.id ? " active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="tab-panel" role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} tabIndex={0}>
        <h2 className="sr-only">{TABS.find((t) => t.id === tab)?.label}</h2>

        {tab === "overview" && (
          <div className="panel-grid">
            <div className="panel-main">
              <p className="lede">{d.overview}</p>
              <h4>Travel notes</h4>
              <ul className="tip-list">
                {d.travelTips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
            <aside className="panel-aside">
              <h4>At a glance</h4>
              <dl className="fact-list">
                <dt>Country</dt>
                <dd>{d.quickFacts.country}</dd>
                <dt>Timezone</dt>
                <dd>{d.quickFacts.timezone}</dd>
                <dt>Best months</dt>
                <dd>{d.quickFacts.bestMonths.join(", ")}</dd>
                {d.quickFacts.avoidMonths && (
                  <>
                    <dt>Worth avoiding</dt>
                    <dd>{d.quickFacts.avoidMonths}</dd>
                  </>
                )}
                <dt>Airport</dt>
                <dd>{d.quickFacts.airport}</dd>
                <dt>Ideal trip length</dt>
                <dd>{d.quickFacts.idealTripLength}</dd>
              </dl>
              <h4>Daily budget</h4>
              <dl className="fact-list">
                <dt>Budget</dt>
                <dd>{d.quickFacts.averageDailyBudget.budget}</dd>
                <dt>Mid-range</dt>
                <dd>{d.quickFacts.averageDailyBudget.midRange}</dd>
                <dt>Luxury</dt>
                <dd>{d.quickFacts.averageDailyBudget.luxury}</dd>
              </dl>
            </aside>
          </div>
        )}

        {tab === "landmarks" && (
          <div className="edit-list">
            {d.landmarks.map((l, i) => (
              <article key={l.id} className="edit-item">
                <span className="edit-item-index">{num(i)}</span>
                <div className="edit-item-body">
                  <div className="edit-item-head">
                    <h4>{l.name}</h4>
                    <span className={`edit-item-tag priority-${l.priority}`}><PriorityIcon priority={l.priority} /></span>
                  </div>
                  <p className="edit-item-meta">{l.neighborhood}</p>
                  <p className="edit-item-desc">{l.description}</p>
                  <p className="edit-item-note">{l.whyGo}</p>
                  <div className="edit-item-facts">
                    {l.approxCost && <span>{l.approxCost}</span>}
                    <span>~{Math.round(l.suggestedDurationMin / 60 * 10) / 10 >= 1 ? `${Math.round((l.suggestedDurationMin / 60) * 10) / 10} hr` : `${l.suggestedDurationMin} min`}</span>
                  </div>
                  {l.reservationNote && (
                    <p className="reservation-note">
                      <NoteIcon /> {l.reservationNote}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {tab === "food" && (
          <div>
            <p className="edit-section-label">Restaurants</p>
            <div className="edit-list">
              {d.restaurants.map((r, i) => (
                <article key={r.id} className="edit-item">
                  <span className="edit-item-index">{num(i)}</span>
                  <div className="edit-item-body">
                    <div className="edit-item-head">
                      <h4>{r.name}</h4>
                      <span className="edit-item-tag">{r.priceLevel}</span>
                    </div>
                    <p className="edit-item-meta">{r.neighborhood} · {r.cuisine}</p>
                    <p className="edit-item-desc">{r.description}</p>
                    <p className="edit-item-note"><em>Try:</em> {r.signatureDishes.join(", ")}</p>
                    <div className="edit-item-facts">
                      <span>{r.approxCost}</span>
                      <span>{r.mealFor.join(" / ")}</span>
                    </div>
                    {r.reservationNote && (
                      <p className="reservation-note">
                        <NoteIcon /> {r.reservationNote}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>

            <p className="edit-section-label" style={{ marginTop: 52 }}>Cafés &amp; bakeries</p>
            <div className="edit-list">
              {d.cafes.map((c, i) => (
                <article key={c.id} className="edit-item">
                  <span className="edit-item-index">{num(i)}</span>
                  <div className="edit-item-body">
                    <h4>{c.name}</h4>
                    <p className="edit-item-meta">{c.neighborhood}</p>
                    <p className="edit-item-desc">{c.description}</p>
                    <p className="edit-item-note"><em>Specialty:</em> {c.specialty}</p>
                  </div>
                </article>
              ))}
            </div>

            <p className="edit-section-label" style={{ marginTop: 52 }}>Local foods to try</p>
            <div className="edit-list">
              {d.localFoods.map((f, i) => (
                <article key={i} className="edit-item">
                  <span className="edit-item-index">{num(i)}</span>
                  <div className="edit-item-body">
                    <h4>{f.dish} {f.vegetarian && <span className="veg-tag">veg</span>}</h4>
                    <p className="edit-item-desc">{f.description}</p>
                    <p className="edit-item-note"><em>Where:</em> {f.whereToTry.join(", ")}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {tab === "neighborhoods" && (
          <div className="edit-list">
            {d.neighborhoods.map((n, i) => (
              <article key={n.id} className="edit-item">
                <span className="edit-item-index">{num(i)}</span>
                <div className="edit-item-body">
                  <h4>{n.name}</h4>
                  <p className="edit-item-desc">{n.vibe}</p>
                  <p className="edit-item-note"><em>Known for:</em> {n.knownFor.join(", ")}</p>
                  <div className="edit-item-facts"><span>Best time: {n.bestTimeToVisit}</span></div>
                </div>
              </article>
            ))}
          </div>
        )}

        {tab === "shopping" && (
          <div className="edit-list">
            {d.shopping.map((s, i) => (
              <article key={i} className="edit-item">
                <span className="edit-item-index">{num(i)}</span>
                <div className="edit-item-body">
                  <div className="edit-item-head">
                    <h4>{s.name}</h4>
                    <span className="edit-item-tag">{s.type}</span>
                  </div>
                  <p className="edit-item-meta">{s.neighborhood}</p>
                  <p className="edit-item-desc">{s.description}</p>
                </div>
              </article>
            ))}
          </div>
        )}

        {tab === "nightlife" && (
          <div className="edit-list">
            {d.nightlife.map((n, i) => (
              <article key={i} className="edit-item">
                <span className="edit-item-index">{num(i)}</span>
                <div className="edit-item-body">
                  <div className="edit-item-head">
                    <h4>{n.name}</h4>
                    <span className="edit-item-tag">{n.priceLevel}</span>
                  </div>
                  <p className="edit-item-meta">{n.neighborhood} · {n.type}</p>
                  <p className="edit-item-desc">{n.description}</p>
                </div>
              </article>
            ))}
          </div>
        )}

        {tab === "experiences" && (
          <div className="edit-list">
            {d.experiences.map((e, i) => (
              <article key={i} className="edit-item">
                <span className="edit-item-index">{num(i)}</span>
                <div className="edit-item-body">
                  <div className="edit-item-head">
                    <h4>{e.name}</h4>
                    <span className={`edit-item-tag priority-${e.priority}`}><PriorityIcon priority={e.priority} /></span>
                  </div>
                  <p className="edit-item-desc">{e.description}</p>
                  <p className="edit-item-note">{e.whyGo}</p>
                  <div className="edit-item-facts">
                    <span>{e.approxCost}</span>
                    <span>{e.duration}</span>
                  </div>
                  {e.bookingNote && (
                    <p className="reservation-note">
                      <NoteIcon /> {e.bookingNote}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {tab === "day-trips" && (
          <div className="edit-list">
            {d.dayTrips.length === 0 && <p className="empty">No day trips listed for this destination.</p>}
            {d.dayTrips.map((t, i) => (
              <article key={i} className="edit-item">
                <span className="edit-item-index">{num(i)}</span>
                <div className="edit-item-body">
                  <h4>{t.name}</h4>
                  <p className="edit-item-desc">{t.description}</p>
                  <div className="edit-item-facts">
                    <span>{t.distanceFromCity}</span>
                    <span>{t.travelTime}</span>
                    <span>{t.suggestedDuration}</span>
                  </div>
                  <p className="edit-item-note"><em>Getting there:</em> {t.howToGetThere}</p>
                  <p className="edit-item-note"><em>Worth it for:</em> {t.worthItFor.join(", ")}</p>
                </div>
              </article>
            ))}
          </div>
        )}

        {tab === "transport" && (
          <div className="edit-list">
            {d.transportation.map((t, i) => (
              <article key={i} className="edit-item">
                <span className="edit-item-index">{num(i)}</span>
                <div className="edit-item-body">
                  <h4>{t.mode}</h4>
                  <p className="edit-item-desc">{t.description}</p>
                  <div className="edit-item-facts"><span>{t.approxCost}</span></div>
                  <p className="edit-item-note">{t.tips}</p>
                </div>
              </article>
            ))}
          </div>
        )}

        {tab === "practical" && (
          <div className="panel-grid">
            <div className="panel-main">
              <h4>Currency &amp; payments</h4>
              <p>{d.practicalInfo.currency} · {d.practicalInfo.paymentNote}</p>
              <h4>Tipping</h4>
              <p>{d.practicalInfo.tipping}</p>
              <h4>Safety</h4>
              <p>{d.practicalInfo.safety}</p>
              <h4>Tourist traps to know about</h4>
              <ul className="tip-list">
                {d.practicalInfo.touristTraps.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
              <h4>Etiquette</h4>
              <ul className="tip-list">
                {d.practicalInfo.etiquette.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
              <h4>Reservations</h4>
              <p>{d.practicalInfo.reservationAdvice}</p>
              <h4>Weather</h4>
              <p>{d.practicalInfo.weatherNote}</p>
            </div>
            <aside className="panel-aside">
              <h4>Languages</h4>
              <p>{d.practicalInfo.language.join(", ")}</p>
              <h4>Useful apps</h4>
              <ul className="tip-list">
                {d.practicalInfo.usefulApps.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
              <h4>SIM / eSIM</h4>
              <p>{d.practicalInfo.simEsim}</p>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
