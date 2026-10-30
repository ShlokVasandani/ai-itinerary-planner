import type { Verifiable } from "../types";
import { labelToDaysFromRule } from "./days";

export const toMin = (t: string): number => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

/** "HH:MM" for minutes since midnight; values past 24h wrap (the day label is handled elsewhere). */
export function fromMin(total: number): string {
  const t = ((Math.round(total) % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

export function durationLabel(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

/** Weekday (0 = Sunday) of an ISO date, independent of the machine's time zone. */
export function weekdayOf(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export function diffDays(a: string, b: string): number {
  const [y1, m1, d1] = a.split("-").map(Number);
  const [y2, m2, d2] = b.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

/** A real calendar date in YYYY-MM-DD form, within 1900-2200 (so 2027-02-31 and 9999-12-31 are not dates). */
export function isIsoDate(s: string | undefined): s is string {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  if (y < 1900 || y > 2200) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** "H:MM" or "HH:MM" on a 24-hour clock. */
export function isClockTime(s: string | undefined): s is string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s ?? "");
  return !!m && Number(m[1]) < 24 && Number(m[2]) < 60;
}

type Hours = Pick<Verifiable, "openingHours" | "closedDays">;

/**
 * Opening windows (minutes since midnight) for a weekday.
 *  - `null`  -> hours unknown (treated as open)
 *  - `[]`    -> closed that day
 */
export function windowsFor(item: Hours, weekday: number | undefined): [number, number][] | null {
  if (weekday === undefined) return null;
  if (item.closedDays?.includes(weekday)) return [];
  if (!item.openingHours || item.openingHours.length === 0) return null;
  const windows: [number, number][] = [];
  for (const rule of item.openingHours) {
    if (labelToDaysFromRule(rule.days).includes(weekday)) windows.push([toMin(rule.open), toMin(rule.close)]);
  }
  return windows;
}

/**
 * Earliest start >= `desiredStart` at which a visit of `durationMin` fits inside
 * an opening window, waiting at most `maxWait` minutes. Returns null if closed.
 */
export function fitOpening(
  item: Hours,
  weekday: number | undefined,
  desiredStart: number,
  durationMin: number,
  maxWait = 60
): number | null {
  const windows = windowsFor(item, weekday);
  if (windows === null) return desiredStart;
  let best: number | null = null;
  for (const [open, close] of windows) {
    const start = Math.max(desiredStart, open);
    if (start - desiredStart > maxWait) continue;
    if (start + durationMin > close) continue;
    if (best === null || start < best) best = start;
  }
  return best;
}

/** True when the item is not known to be closed at any point of [start, end] that day. */
export function isOpenDuring(item: Hours, weekday: number | undefined, start: number, end: number): boolean {
  const windows = windowsFor(item, weekday);
  if (windows === null) return true;
  return windows.some(([open, close]) => start >= open && end <= close);
}

export function isClosedAllDay(item: Hours, weekday: number | undefined): boolean {
  const windows = windowsFor(item, weekday);
  return windows !== null && windows.length === 0;
}
