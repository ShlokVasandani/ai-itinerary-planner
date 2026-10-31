import type { OpeningHoursRule } from "../../lib/types";

const DAY_INDEX: Record<string, number> = { Su: 0, Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6 };
const DAY_CODES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export interface ParsedHours {
  rules: OpeningHoursRule[];
  closedDays: number[];
}

function expandDays(spec: string): number[] | null {
  const out = new Set<number>();
  for (const part of spec.split(",")) {
    const range = part.trim().match(/^([A-Z][a-z])(?:-([A-Z][a-z]))?$/);
    if (!range) return null;
    const start = DAY_INDEX[range[1]];
    if (start === undefined) return null;
    if (!range[2]) {
      out.add(start);
      continue;
    }
    const end = DAY_INDEX[range[2]];
    if (end === undefined) return null;
    for (let d = start; ; d = (d + 1) % 7) {
      out.add(d);
      if (d === end) break;
    }
  }
  return [...out];
}

/** Compact day label such as "Mo-Fr" or "Sa,Su" for a set of weekday indexes (Mo-first ordering). */
export function daysLabel(days: number[]): string {
  const order = [1, 2, 3, 4, 5, 6, 0];
  const present = order.filter((d) => days.includes(d));
  if (present.length === 7) return "Mo-Su";
  const runs: number[][] = [];
  for (const d of present) {
    const last = runs[runs.length - 1];
    if (last && order.indexOf(d) === order.indexOf(last[last.length - 1]) + 1) last.push(d);
    else runs.push([d]);
  }
  return runs
    .map((r) => (r.length >= 3 ? `${DAY_CODES[r[0]]}-${DAY_CODES[r[r.length - 1]]}` : r.map((d) => DAY_CODES[d]).join(",")))
    .join(",");
}

/** Expands a rule's `days` label back to weekday indexes. */
export function labelToDays(label: string): number[] {
  return expandDays(label) ?? [];
}

const DAY_LIST = /^((?:[A-Z][a-z](?:-[A-Z][a-z])?)(?:\s*,\s*[A-Z][a-z](?:-[A-Z][a-z])?)*)/;
const TIME_LIST = /^(\d{1,2}:\d{2}\s?-\s?\d{1,2}:\d{2}(?:\s*,\s*\d{1,2}:\d{2}\s?-\s?\d{1,2}:\d{2})*)/;

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const fmt = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

interface RawRule {
  days: number[];
  slots: [string, string][] | "off";
}

function tokenise(text: string): RawRule[] | null {
  const rules: RawRule[] = [];
  let rest = text.trim();
  while (rest) {
    rest = rest.replace(/^[;,]\s*/, "");
    if (!rest) break;
    if (/^PH\s+(off|closed)\s*(?:[;,]|$)/i.test(rest)) {
      rest = rest.replace(/^PH\s+(off|closed)/i, "").trim();
      continue;
    }
    let days = [0, 1, 2, 3, 4, 5, 6];
    const dm = rest.match(DAY_LIST);
    if (dm && /^[A-Z][a-z]/.test(rest) && DAY_INDEX[rest.slice(0, 2)] !== undefined) {
      const expanded = expandDays(dm[1].replace(/\s+/g, ""));
      if (!expanded) return null;
      days = expanded;
      rest = rest.slice(dm[0].length).trim();
    }
    const off = rest.match(/^(off|closed)\b/i);
    if (off) {
      rules.push({ days, slots: "off" });
      rest = rest.slice(off[0].length).trim();
      continue;
    }
    const tm = rest.match(TIME_LIST);
    if (!tm) return null;
    const slots: [string, string][] = tm[1].split(",").map((slot) => {
      const [a, b] = slot.trim().split(/\s?-\s?/);
      return [a, b] as [string, string];
    });
    rules.push({ days, slots });
    rest = rest.slice(tm[0].length).trim();
  }
  return rules;
}

/**
 * Parses the common subset of OSM `opening_hours` syntax. Returns null when
 * any rule cannot be represented faithfully (holidays, seasons, sunrise/sunset,
 * week numbers), so callers leave the hours undefined instead of guessing.
 */
export function parseOsmHours(raw: string): ParsedHours | null {
  const text = raw.trim();
  if (!text) return null;
  if (text === "24/7") return { rules: [{ days: "Mo-Su", open: "00:00", close: "24:00" }], closedDays: [] };
  if (/sunrise|sunset|week|\[|"|easter|\d{4}|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b|SH\b|PH\b(?!\s+(off|closed))/i.test(text)) return null;
  const raws = tokenise(text);
  if (!raws || raws.length === 0) return null;

  const byDay = new Map<number, [string, string][]>();
  const offDays = new Set<number>();
  for (const r of raws) {
    for (const d of r.days) {
      if (r.slots === "off") {
        byDay.delete(d);
        offDays.add(d);
      } else {
        byDay.set(d, r.slots); // later rules replace earlier ones for the same day
        offDays.delete(d);
      }
    }
  }
  if (byDay.size === 0) return null;
  // Group days that share identical slots into compact rules.
  const groups = new Map<string, { days: number[]; slots: [string, string][] }>();
  for (const [d, slots] of byDay) {
    const key = JSON.stringify(slots);
    const g = groups.get(key) ?? { days: [], slots };
    g.days.push(d);
    groups.set(key, g);
  }
  const rules: OpeningHoursRule[] = [];
  for (const g of groups.values()) {
    for (const [open, close] of g.slots) {
      const o = toMinutes(open);
      let c = toMinutes(close);
      if (c <= o) c += 24 * 60; // closes after midnight, e.g. 08:00-01:00 -> 25:00
      rules.push({ days: daysLabel(g.days), open: fmt(o), close: fmt(c) });
    }
  }
  const closedDays = [0, 1, 2, 3, 4, 5, 6].filter((d) => !byDay.has(d));
  return { rules, closedDays };
}

/**
 * When the full hours cannot be modelled (seasonal rules etc.) a plain weekly
 * closure such as "Mo off" is still reliable. Returns weekday indexes or null.
 */
export function parseClosedDaysOnly(raw: string): number[] | null {
  const days = new Set<number>();
  for (const chunk of raw.split(";").map((c) => c.trim())) {
    const m = chunk.match(/^([A-Z][a-z](?:-[A-Z][a-z])?(?:\s*,\s*[A-Z][a-z](?:-[A-Z][a-z])?)*)\s+off$/i);
    if (!m) continue;
    const expanded = expandDays(m[1].replace(/\s+/g, ""));
    expanded?.forEach((d) => days.add(d));
  }
  return days.size ? [...days].sort() : null;
}
