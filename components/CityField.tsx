"use client";

import { useMemo, useRef, useState } from "react";
import SearchField from "@/components/SearchField";
import Photo from "@/components/Photo";

export interface CityOption {
  slug: string;
  city: string;
  country: string;
}

/** Searchable destination list with a photo per city. */
export default function CityField({
  cities,
  value,
  onChange,
  onWarm,
  className,
}: {
  cities: CityOption[];
  value: string;
  onChange: (slug: string) => void;
  /** Optional hint that a city is about to be chosen (hover, focus or press). */
  onWarm?: (slug: string) => void;
  className?: string;
}) {
  const [q, setQ] = useState("");
  const hover = useRef<number>(0);
  const current = cities.find((c) => c.slug === value);
  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return n ? cities.filter((c) => `${c.city} ${c.country}`.toLowerCase().includes(n)) : cities;
  }, [q, cities]);

  return (
    <SearchField label="Where to" placeholder="Choose a city" className={className} panelClassName="sf-cities" value={current ? `${current.city}, ${current.country}` : ""}>
      {(close) => (
        <>
          <input
            className="sf-search"
            autoFocus
            type="search"
            placeholder="Search 20 cities"
            aria-label="Search cities"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (list[0]) {
                  onChange(list[0].slug);
                  setQ("");
                  close();
                }
              }
            }}
          />
          <ul className="sf-list" role="listbox" aria-label="Cities">
            {list.map((c) => (
              <li key={c.slug} role="option" aria-selected={c.slug === value}>
                <button
                  type="button"
                  // A sweep across the list shouldn't fetch every city: hover waits 90ms, press and focus don't.
                  onPointerEnter={() => {
                    window.clearTimeout(hover.current);
                    hover.current = window.setTimeout(() => onWarm?.(c.slug), 90);
                  }}
                  onPointerLeave={() => window.clearTimeout(hover.current)}
                  onPointerDown={() => onWarm?.(c.slug)}
                  onFocus={() => onWarm?.(c.slug)}
                  onClick={() => {
                    onChange(c.slug);
                    setQ("");
                    close();
                  }}
                >
                  <span className="sf-thumb">
                    <Photo slug={c.slug} city={c.city} sizes="44px" />
                  </span>
                  <span>
                    <strong>{c.city}</strong>
                    <small>{c.country}</small>
                  </span>
                </button>
              </li>
            ))}
            {list.length === 0 && <li className="sf-none">No match for &ldquo;{q}&rdquo;</li>}
          </ul>
        </>
      )}
    </SearchField>
  );
}
