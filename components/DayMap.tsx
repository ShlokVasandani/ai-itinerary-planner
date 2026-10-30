"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { TimelineStop } from "@/lib/itinerary-engine";

interface Props {
  stops: TimelineStop[];
  dayNumber: number;
  city: string;
}

/**
 * One map per day: numbered markers and a dashed route over OpenStreetMap
 * tiles. Leaflet is imported lazily, and only once the card scrolls into view.
 */
export default function DayMap({ stops, dayNumber, city }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mapEl = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  const located = stops.filter((s) => s.coords && s.kind !== "free-time");

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !mapEl.current || located.length === 0) return;
    let map: import("leaflet").Map | undefined;
    let cancelled = false;
    (async () => {
      try {
        const L = await import("leaflet");
        if (cancelled || !mapEl.current) return;
        map = L.map(mapEl.current, { scrollWheelZoom: false, zoomControl: true, attributionControl: true });
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          detectRetina: true,
          attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        }).addTo(map);
        const pts: [number, number][] = [];
        located.forEach((s, i) => {
          const ll: [number, number] = [s.coords!.lat, s.coords!.lng];
          pts.push(ll);
          const icon = L.divIcon({
            className: "map-pin",
            html: `<span class="map-pin-dot${s.coordsApprox ? " is-approx" : ""}">${i + 1}</span>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });
          L.marker(ll, { icon, title: `${i + 1}. ${s.name}`, keyboard: false }).addTo(map!).bindPopup(`<strong>${s.time}</strong> ${escapeHtml(s.name)}`);
        });
        if (pts.length > 1) L.polyline(pts, { color: "#C2371A", weight: 3, opacity: 0.8, dashArray: "2 8" }).addTo(map);
        if (pts.length === 1) map.setView(pts[0], 15);
        else map.fitBounds(L.latLngBounds(pts), { padding: [28, 28], maxZoom: 16 });
        // Reveal the map once it has a view, so the shimmer hands off to the tiles rather than to a grey box.
        requestAnimationFrame(() => !cancelled && setReady(true));
      } catch {
        setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      map?.remove();
    };
    // located derives from stops; re-create the map when the day's stops change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, stops]);

  if (located.length === 0) {
    return (
      <div className="day-map day-map-empty">
        <p>No verified coordinates for this day yet, so there is no map.</p>
      </div>
    );
  }
  return (
    <div ref={wrapRef} className={`day-map${ready || failed ? "" : " is-loading"}`}>
      <div
        ref={mapEl}
        role="img"
        aria-label={`Map of day ${dayNumber} in ${city} with ${located.length} located stops`}
        className={`day-map-canvas${ready ? " is-ready" : ""}`}
      />
      {!visible && <p className="day-map-placeholder">Map loads as you scroll…</p>}
      {failed && <p className="day-map-placeholder">The map could not load. The stops still have Google Maps links.</p>}
    </div>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}
