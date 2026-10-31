"use client";

import { useId, useRef, useState } from "react";
import { nextTabIndex } from "@/lib/tab-keys";
import type { Destination, Verifiable } from "@/lib/types";
import NoteIcon from "@/components/NoteIcon";
import PriorityIcon from "@/components/PriorityIcon";
import OutboundLink from "@/components/OutboundLink";
import PressButton from "@/components/PressButton";
import { MONTH_NAMES, hoursSummary } from "@/lib/format";
import { buildLinks } from "@/lib/providers";

type TabId =
  | "overview"
  | "when"
  | "landmarks"
  | "food"
  | "neighborhoods"
  | "shopping"
  | "nightlife"
  | "experiences"
  | "day-trips"
  | "transport"
  | "practical";

const ALL_TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "when", label: "When to go" },
  { id: "landmarks", label: "Places" },
  { id: "food", label: "Food" },
  { id: "neighborhoods", label: "Neighborhoods" },
  { id: "shopping", label: "Shopping" },
  { id: "nightlife", label: "Nightlife" },
  { id: "experiences", label: "Experiences" },
  { id: "day-trips", label: "Day trips" },
  { id: "transport", label: "Transport" },
  { id: "practical", label: "Practical" },
];

const num = (i: number) => String(i + 1).padStart(2, "0");

/** Links and verified facts shared by every place-like record. */
function Facts({ item, name }: { item: Verifiable; name: string }) {
  const hours = hoursSummary(item);
  return (
    <>
      {hours && <p className="edit-item-note">Hours: {hours}</p>}
      <p className="edit-item-links">
        {item.officialUrl && (
          <OutboundLink offer={{ url: item.officialUrl, title: "Official site", isAffiliate: false }}>
            Official site
          </OutboundLink>
        )}
        {item.mapsUrl && (
          <OutboundLink offer={{ url: item.mapsUrl, title: `${name} on Google Maps`, isAffiliate: false }}>
            Google Maps
          </OutboundLink>
        )}
      </p>
    </>
  );
}

function SeasonBars({ d }: { d: Destination }) {
  const rows: { key: "weather" | "crowds" | "price"; label: string; hint: string }[] = [
    { key: "weather", label: "Weather", hint: "5 = ideal for sightseeing" },
    { key: "crowds", label: "Crowds", hint: "5 = busiest" },
    { key: "price", label: "Prices", hint: "5 = most expensive" },
  ];
  const shown = rows.filter((r) => d.seasons?.some((s) => s[r.key] !== undefined));
  const computed = d.tier === "open";
  return (
    <div className="seasons">
      {shown.map((r) => (
        <div key={r.key} className="season-row">
          <p className="season-label">
            {r.label} <span>{r.hint}</span>
          </p>
          <ol className="season-bars" aria-label={`${r.label} by month`}>
            {d.seasons.map((s, i) => (
              <li key={i} style={{ ["--v" as string]: (s[r.key] ?? 0) / 5 }}>
                <span className="season-bar" aria-hidden="true" />
                <span className="season-m">{MONTH_NAMES[i]}</span>
                <span className="sr-only">
                  {MONTH_NAMES[i]}: {s[r.key] ?? 0} of 5
                </span>
              </li>
            ))}
          </ol>
        </div>
      ))}
      <p className="muted">
        {computed
          ? "Weather ratings are computed from 2019–2023 daily temperature and rainfall (Open-Meteo): mild, dry months score highest. Crowd and price data are not available for this city."
          : "Monthly ratings are editorial estimates from published climate and tourism seasonality, not live data."}
      </p>
    </div>
  );
}

export default function DestinationTabs({ d }: { d: Destination }) {
  const [tab, setTab] = useState<TabId>("overview");
  const present: Record<TabId, boolean> = {
    overview: true,
    when: !!d.seasons?.length,
    landmarks: d.landmarks.length > 0,
    food: d.restaurants.length + d.cafes.length + d.localFoods.length > 0,
    neighborhoods: d.neighborhoods.length > 0,
    shopping: d.shopping.length > 0,
    nightlife: d.nightlife.length > 0,
    experiences: d.experiences.length > 0,
    "day-trips": d.dayTrips.length > 0,
    transport: !!d.transitCardInfo || d.transportation.length > 0,
    practical: true,
  };
  const TABS = ALL_TABS.filter((t) => present[t.id]);
  const base = useId();
  const panelId = `${base}-panel`;
  const tabId = (id: TabId) => `${base}-tab-${id}`;
  const nav = useRef<HTMLDivElement>(null);

  // ARIA tabs with automatic activation: arrows and Home/End move focus and select; only the selected tab is in the Tab order.
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const i = TABS.findIndex((t) => t.id === tab);
    const next = nextTabIndex(e.key, i, TABS.length);
    if (next === undefined) return;
    e.preventDefault();
    setTab(TABS[next].id);
    nav.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  }

  return (
    <div className="tabs-wrap">
      <div ref={nav} className="tabs-nav" role="tablist" aria-label={`${d.city} information sections`} onKeyDown={onKeyDown}>
        {TABS.map((t) => (
          <PressButton
            key={t.id}
            id={tabId(t.id)}
            role="tab"
            tabIndex={tab === t.id ? 0 : -1}
            aria-selected={tab === t.id}
            aria-controls={panelId}
            className={`tab-btn${tab === t.id ? " active" : ""}`}
            onPress={() => setTab(t.id)}
          >
            {t.label}
          </PressButton>
        ))}
      </div>

      <div key={tab} className="tab-panel" role="tabpanel" id={panelId} aria-labelledby={tabId(tab)} tabIndex={0}>
        <h2 className="sr-only">{TABS.find((t) => t.id === tab)?.label}</h2>
        {tab === "overview" && (
          <div className="panel-grid">
            <div className="panel-main">
              <p className="lede">{d.overview}</p>
              {d.travelTips.length > 0 && (
                <>
                  <h3>Travel notes</h3>
                  <ul className="tip-list">
                    {d.travelTips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </>
              )}
              {d.tier === "open" && (
                <p className="muted source-note">
                  This guide is assembled from open data: place facts from Wikidata and OpenStreetMap, summaries from Wikipedia (CC BY-SA), climate from
                  Open-Meteo. Venues are ranked by public data, not reviewed by us, so confirm hours and prices with the venue.
                </p>
              )}
            </div>
            <aside className="panel-aside">
              <h3>At a glance</h3>
              <dl className="fact-list">
                <dt>Country</dt>
                <dd>{d.quickFacts.country}</dd>
                <dt>Currency</dt>
                <dd>{d.currency}</dd>
                <dt>Airports</dt>
                <dd>{d.airportCodes.join(", ")}</dd>
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
                {d.quickFacts.idealTripLength && (
                  <>
                    <dt>Ideal trip length</dt>
                    <dd>{d.quickFacts.idealTripLength}</dd>
                  </>
                )}
              </dl>
              {d.quickFacts.averageDailyBudget && (
                <>
                  <h3>Daily budget</h3>
                  <dl className="fact-list">
                    <dt>Budget</dt>
                    <dd>{d.quickFacts.averageDailyBudget.budget}</dd>
                    <dt>Mid-range</dt>
                    <dd>{d.quickFacts.averageDailyBudget.midRange}</dd>
                    <dt>Luxury</dt>
                    <dd>{d.quickFacts.averageDailyBudget.luxury}</dd>
                  </dl>
                </>
              )}
            </aside>
          </div>
        )}

        {tab === "when" && (
          <div className="panel-grid">
            <div className="panel-main">
              <h3>Month by month</h3>
              <SeasonBars d={d} />
            </div>
            <aside className="panel-aside">
              <h3>Events worth planning around</h3>
              {d.events && d.events.length > 0 ? (
                <ul className="event-list">
                  {d.events.map((e) => (
                    <li key={e.name}>
                      <strong>{e.name}</strong>
                      <span>{MONTH_NAMES[e.month - 1]}</span>
                      <p>{e.note}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No events listed.</p>
              )}
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
                    <span className={`edit-item-tag priority-${l.priority}`}>
                      <PriorityIcon priority={l.priority} />
                    </span>
                  </div>
                  <p className="edit-item-meta">{l.neighborhood}</p>
                  <p className="edit-item-desc">{l.description}</p>
                  {l.whyGo && <p className="edit-item-note">{l.whyGo}</p>}
                  <div className="edit-item-facts">
                    {l.approxCost && <span>{l.approxCost}</span>}
                    <span>
                      About {l.suggestedDurationMin >= 60 ? `${Math.round((l.suggestedDurationMin / 60) * 10) / 10} hr` : `${l.suggestedDurationMin} min`}
                    </span>
                  </div>
                  <Facts item={l} name={l.name} />
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
            <h3 className="edit-section-label">Restaurants</h3>
            <div className="edit-list">
              {d.restaurants.map((r, i) => (
                <article key={r.id} className="edit-item">
                  <span className="edit-item-index">{num(i)}</span>
                  <div className="edit-item-body">
                    <div className="edit-item-head">
                      <h4>{r.name}</h4>
                      {r.priceLevel && <span className="edit-item-tag">{r.priceLevel}</span>}
                    </div>
                    <p className="edit-item-meta">
                      {r.neighborhood} · {r.cuisine}
                    </p>
                    <p className="edit-item-desc">{r.description}</p>
                    {r.signatureDishes.length > 0 && (
                      <p className="edit-item-note">
                        <em>Try:</em> {r.signatureDishes.join(", ")}
                      </p>
                    )}
                    <div className="edit-item-facts">
                      {r.approxCost && <span>{r.approxCost}</span>}
                      <span>{r.mealFor.join(" / ")}</span>
                    </div>
                    <Facts item={r} name={r.name} />
                    {r.reservationNote && (
                      <p className="reservation-note">
                        <NoteIcon /> {r.reservationNote}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>

            <h3 className="edit-section-label">Cafés &amp; bakeries</h3>
            <div className="edit-list">
              {d.cafes.map((c, i) => (
                <article key={c.id} className="edit-item">
                  <span className="edit-item-index">{num(i)}</span>
                  <div className="edit-item-body">
                    <h4>{c.name}</h4>
                    <p className="edit-item-meta">{c.neighborhood}</p>
                    <p className="edit-item-desc">{c.description}</p>
                    {c.specialty && (
                      <p className="edit-item-note">
                        <em>Specialty:</em> {c.specialty}
                      </p>
                    )}
                    <Facts item={c} name={c.name} />
                  </div>
                </article>
              ))}
            </div>

            {d.localFoods.length > 0 && <h3 className="edit-section-label">Local foods to try</h3>}
            <div className="edit-list">
              {d.localFoods.map((f, i) => (
                <article key={i} className="edit-item">
                  <span className="edit-item-index">{num(i)}</span>
                  <div className="edit-item-body">
                    <h4>
                      {f.dish} {f.vegetarian && <span className="veg-tag">veg</span>}
                    </h4>
                    <p className="edit-item-desc">{f.description}</p>
                    <p className="edit-item-note">
                      <em>Where:</em> {f.whereToTry.join(", ")}
                    </p>
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
                  {n.vibe && <p className="edit-item-desc">{n.vibe}</p>}
                  {n.knownFor.length > 0 && (
                    <p className="edit-item-note">
                      <em>Known for:</em> {n.knownFor.join(", ")}
                    </p>
                  )}
                  {n.bestTimeToVisit && (
                    <div className="edit-item-facts">
                      <span>Best time: {n.bestTimeToVisit}</span>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {tab === "shopping" && (
          <div className="edit-list">
            {d.shopping.map((s, i) => (
              <article key={s.id} className="edit-item">
                <span className="edit-item-index">{num(i)}</span>
                <div className="edit-item-body">
                  <div className="edit-item-head">
                    <h4>{s.name}</h4>
                    <span className="edit-item-tag">{s.type}</span>
                  </div>
                  <p className="edit-item-meta">{s.neighborhood}</p>
                  <p className="edit-item-desc">{s.description}</p>
                  <Facts item={s} name={s.name} />
                </div>
              </article>
            ))}
          </div>
        )}

        {tab === "nightlife" && (
          <div className="edit-list">
            {d.nightlife.map((n, i) => (
              <article key={n.id} className="edit-item">
                <span className="edit-item-index">{num(i)}</span>
                <div className="edit-item-body">
                  <div className="edit-item-head">
                    <h4>{n.name}</h4>
                    {n.priceLevel && <span className="edit-item-tag">{n.priceLevel}</span>}
                  </div>
                  <p className="edit-item-meta">
                    {n.neighborhood} · {n.type}
                  </p>
                  <p className="edit-item-desc">{n.description}</p>
                  <Facts item={n} name={n.name} />
                </div>
              </article>
            ))}
          </div>
        )}

        {tab === "experiences" && (
          <div className="edit-list">
            {d.experiences.map((e, i) => {
              const links = buildLinks({ kind: "activity", city: d.city, country: d.country, text: e.name });
              return (
                <article key={e.id} className="edit-item">
                  <span className="edit-item-index">{num(i)}</span>
                  <div className="edit-item-body">
                    <div className="edit-item-head">
                      <h4>{e.name}</h4>
                      <span className={`edit-item-tag priority-${e.priority}`}>
                        <PriorityIcon priority={e.priority} />
                      </span>
                    </div>
                    <p className="edit-item-desc">{e.description}</p>
                    <p className="edit-item-note">{e.whyGo}</p>
                    <div className="edit-item-facts">
                      <span>{e.approxCost}</span>
                      <span>{e.duration}</span>
                    </div>
                    <Facts item={e} name={e.name} />
                    <p className="edit-item-links">
                      {links.map((o) => (
                        <OutboundLink key={o.provider} offer={o}>
                          {o.title.replace(`${e.name} on `, "Find on ")}
                        </OutboundLink>
                      ))}
                    </p>
                    {e.bookingNote && (
                      <p className="reservation-note">
                        <NoteIcon /> {e.bookingNote}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {tab === "day-trips" && (
          <div className="edit-list">
            {d.dayTrips.map((t, i) => (
              <article key={t.id} className="edit-item">
                <span className="edit-item-index">{num(i)}</span>
                <div className="edit-item-body">
                  <h4>{t.name}</h4>
                  <p className="edit-item-desc">{t.description}</p>
                  <div className="edit-item-facts">
                    <span>{t.distanceFromCity}</span>
                    <span>{t.travelTime}</span>
                    <span>{t.suggestedDuration}</span>
                  </div>
                  <p className="edit-item-note">
                    <em>Getting there:</em> {t.howToGetThere}
                  </p>
                  <p className="edit-item-note">
                    <em>Worth it for:</em> {t.worthItFor.join(", ")}
                  </p>
                  <Facts item={t} name={t.name} />
                </div>
              </article>
            ))}
          </div>
        )}

        {tab === "transport" && (
          <div>
            {d.transitCardInfo && (
              <article className="callout">
                <h3>{d.transitCardInfo.name}</h3>
                <p>{d.transitCardInfo.description}</p>
                <p className="muted">{d.transitCardInfo.where}</p>
              </article>
            )}
            <div className="edit-list">
              {d.transportation.map((t, i) => (
                <article key={i} className="edit-item">
                  <span className="edit-item-index">{num(i)}</span>
                  <div className="edit-item-body">
                    <h4>{t.mode}</h4>
                    <p className="edit-item-desc">{t.description}</p>
                    <div className="edit-item-facts">
                      <span>{t.approxCost}</span>
                    </div>
                    <p className="edit-item-note">{t.tips}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {tab === "practical" && !d.practicalInfo && (
          <div className="panel-grid">
            <div className="panel-main">
              <h3>Currency</h3>
              <p>{d.currency}</p>
              {d.languages && d.languages.length > 0 && (
                <>
                  <h3>Languages</h3>
                  <p>{d.languages.join(", ")}</p>
                </>
              )}
              <h3>Timezone</h3>
              <p>{d.quickFacts.timezone}</p>
              <h3>Airports</h3>
              <p>{d.airportCodes.length ? d.airportCodes.join(", ") : "See the city's main airport on your booking site."}</p>
              <p className="muted">
                Tipping, safety and etiquette notes are written by hand for our curated cities and are not generated here. Check your government&apos;s
                travel advice before you go.
              </p>
            </div>
          </div>
        )}

        {tab === "practical" && d.practicalInfo && (
          <div className="panel-grid">
            <div className="panel-main">
              <h3>Currency &amp; payments</h3>
              <p>
                {d.practicalInfo!.currency} · {d.practicalInfo!.paymentNote}
              </p>
              <h3>Tipping</h3>
              <p>{d.practicalInfo!.tipping}</p>
              <h3>Safety</h3>
              <p>{d.practicalInfo!.safety}</p>
              <h3>Tourist traps to know about</h3>
              <ul className="tip-list">
                {d.practicalInfo!.touristTraps.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
              <h3>Etiquette</h3>
              <ul className="tip-list">
                {d.practicalInfo!.etiquette.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
              <h3>Reservations</h3>
              <p>{d.practicalInfo!.reservationAdvice}</p>
              <h3>Weather</h3>
              <p>{d.practicalInfo!.weatherNote}</p>
              <h3>Eight useful phrases</h3>
              <ul className="phrase-list">
                {d.localPhrases.map((p) => (
                  <li key={p.english}>
                    <span>{p.english}</span>
                    <strong lang={undefined}>{p.local}</strong>
                    {p.romanized && <em>{p.romanized}</em>}
                  </li>
                ))}
              </ul>
            </div>
            <aside className="panel-aside">
              <h3>Languages</h3>
              <p>{d.practicalInfo!.language.join(", ")}</p>
              <h3>Useful apps</h3>
              <ul className="tip-list">
                {d.practicalInfo!.usefulApps.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
              <h3>SIM / eSIM</h3>
              <p>{d.practicalInfo!.simEsim}</p>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
