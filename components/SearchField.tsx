"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePress } from "@/components/usePress";

interface Props {
  label: string;
  /** Text shown in the trigger; falls back to `placeholder` when empty. */
  value?: React.ReactNode;
  placeholder: string;
  children: (close: () => void) => React.ReactNode;
  className?: string;
  panelClassName?: string;
  align?: "start" | "end";
}

/** A labelled field whose value opens a floating panel (calendar, traveller counts, city list). */
export default function SearchField({ label, value, placeholder, children, className = "", panelClassName = "", align = "start" }: Props) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  const press = usePress(() => setOpen((v) => !v));

  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent | TouchEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        root.current?.querySelector<HTMLButtonElement>(".sf-trigger")?.focus();
      }
    };
    document.addEventListener("mousedown", down);
    document.addEventListener("touchstart", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", down);
      document.removeEventListener("touchstart", down);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  return (
    <div ref={root} className={`sf ${className}`} data-open={open || undefined}>
      <button type="button" className="sf-trigger" aria-haspopup="dialog" aria-expanded={open} aria-controls={id} {...press}>
        <span className="sf-label">{label}</span>
        <span className={`sf-value${value ? "" : " is-empty"}`}>{value || placeholder}</span>
      </button>
      {open && (
        <div id={id} className={`sf-panel sf-${align} ${panelClassName}`} role="dialog" aria-label={label}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
