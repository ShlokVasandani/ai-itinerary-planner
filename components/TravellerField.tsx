"use client";

import SearchField from "@/components/SearchField";
import PressButton from "@/components/PressButton";

function Row({ title, hint, value, min, max, onChange }: { title: string; hint: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <div className="trav-row">
      <div>
        <strong>{title}</strong>
        <span>{hint}</span>
      </div>
      <div className="stepper" role="group" aria-label={title}>
        <PressButton onPress={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={`Fewer ${title.toLowerCase()}`}>
          −
        </PressButton>
        <output aria-live="polite">{value}</output>
        <PressButton onPress={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={`More ${title.toLowerCase()}`}>
          +
        </PressButton>
      </div>
    </div>
  );
}

export default function TravellerField({
  adults,
  children,
  onChange,
  className,
  align = "end",
}: {
  adults: number;
  children: number;
  onChange: (adults: number, children: number) => void;
  className?: string;
  align?: "start" | "end";
}) {
  const total = adults + children;
  return (
    <SearchField
      label="Travellers"
      placeholder="Add travellers"
      className={className}
      align={align}
      panelClassName="sf-trav"
      value={`${total} ${total === 1 ? "traveller" : "travellers"}${children ? `, ${children} ${children === 1 ? "child" : "children"}` : ""}`}
    >
      {() => (
        <>
          <Row title="Adults" hint="Age 13 or over" value={adults} min={1} max={12} onChange={(n) => onChange(n, children)} />
          <Row title="Children" hint="Age 0 to 12" value={children} min={0} max={8} onChange={(n) => onChange(adults, n)} />
        </>
      )}
    </SearchField>
  );
}
