"use client";

import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import SearchField from "@/components/SearchField";

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parse = (s: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : undefined;
};
const fmt = (d: Date) => d.toLocaleDateString("en", { day: "numeric", month: "short" });

/** Two-month range calendar. Values are ISO yyyy-mm-dd strings, "" when unset. */
export default function DateRangeField({
  start,
  end,
  onChange,
  className,
  align,
}: {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
  className?: string;
  align?: "start" | "end";
}) {
  const from = parse(start);
  const to = parse(end);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selected: DateRange | undefined = from ? { from, to } : undefined;
  const nights = from && to ? Math.round((to.getTime() - from.getTime()) / 864e5) + 1 : 0;

  return (
    <SearchField
      label="Dates"
      placeholder="Add dates"
      className={className}
      align={align}
      panelClassName="sf-calendar"
      value={from ? `${fmt(from)}${to ? ` – ${fmt(to)}` : ""}` : ""}
    >
      {(close) => (
        <>
          <DayPicker
            mode="range"
            numberOfMonths={2}
            min={1}
            selected={selected}
            disabled={{ before: today }}
            defaultMonth={from ?? today}
            weekStartsOn={1}
            onSelect={(r) => {
              const a = r?.from ? iso(r.from) : "";
              const b = r?.to ? iso(r.to) : "";
              onChange(a, b);
              if (r?.from && r?.to) close();
            }}
          />
          <div className="sf-foot">
            <span>{nights ? `${nights} ${nights === 1 ? "day" : "days"}` : "Pick a start and end date"}</span>
            {(start || end) && (
              <button type="button" className="sf-link" onClick={() => onChange("", "")}>
                Clear dates
              </button>
            )}
          </div>
        </>
      )}
    </SearchField>
  );
}
