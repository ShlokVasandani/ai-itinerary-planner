const DAY_INDEX: Record<string, number> = { Su: 0, Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6 };
const CODES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
export const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Expands a rule label such as "Mo-Fr", "Sa,Su" or "Mo,We-Th" into weekday indexes (0 = Sunday). */
export function labelToDaysFromRule(label: string): number[] {
  const out = new Set<number>();
  for (const part of label.split(",")) {
    const m = part.trim().match(/^([A-Z][a-z])(?:-([A-Z][a-z]))?$/);
    if (!m) continue;
    const start = DAY_INDEX[m[1]];
    if (start === undefined) continue;
    if (!m[2]) {
      out.add(start);
      continue;
    }
    const end = DAY_INDEX[m[2]];
    if (end === undefined) continue;
    for (let d = start; ; d = (d + 1) % 7) {
      out.add(d);
      if (d === end) break;
    }
  }
  return [...out];
}

export const dayCode = (weekday: number) => CODES[weekday];

export function closedDaysLabel(days: number[]): string {
  return days.map((d) => WEEKDAY_NAMES[d]).join(" and ");
}
