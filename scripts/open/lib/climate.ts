import { getJson } from "./http";

export interface Climate {
  timezone: string;
  /** Mean daily maximum temperature per month, °C (index 0 = January). */
  tmax: number[];
  /** Mean number of days with at least 1 mm of rain per month. */
  rainDays: number[];
}

export async function climateFor(lat: number, lng: number): Promise<Climate> {
  const url =
    `https://archive-api.open-meteo.com/v1/archive?latitude=${lat.toFixed(3)}&longitude=${lng.toFixed(3)}` +
    `&start_date=2019-01-01&end_date=2023-12-31&daily=temperature_2m_max,precipitation_sum&timezone=auto`;
  const res = await getJson<{ timezone: string; daily: { time: string[]; temperature_2m_max: (number | null)[]; precipitation_sum: (number | null)[] } }>(url, { timeoutMs: 120_000 });
  const sum = Array(12).fill(0);
  const cnt = Array(12).fill(0);
  const rain = Array(12).fill(0);
  const years = new Set<string>();
  res.daily.time.forEach((t, i) => {
    const m = Number(t.slice(5, 7)) - 1;
    years.add(t.slice(0, 4));
    const tm = res.daily.temperature_2m_max[i];
    if (tm !== null && tm !== undefined) {
      sum[m] += tm;
      cnt[m]++;
    }
    if ((res.daily.precipitation_sum[i] ?? 0) >= 1) rain[m]++;
  });
  const n = Math.max(1, years.size);
  return {
    timezone: res.timezone,
    tmax: sum.map((s, i) => (cnt[i] ? Math.round((s / cnt[i]) * 10) / 10 : NaN)),
    rainDays: rain.map((r) => Math.round((r / n) * 10) / 10),
  };
}

/** 1 (poor) to 5 (ideal) sightseeing weather from temperature comfort and rain frequency. */
export function weatherRating(tmax: number, rainDays: number): 1 | 2 | 3 | 4 | 5 {
  const comfort = Math.max(0, 5 - Math.abs(tmax - 22) / 4);
  const dry = 5 - Math.min(5, rainDays / 3);
  const score = comfort * 0.7 + dry * 0.3;
  return Math.max(1, Math.min(5, Math.round(score))) as 1 | 2 | 3 | 4 | 5;
}
