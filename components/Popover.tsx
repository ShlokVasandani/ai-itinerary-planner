"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { usePress } from "@/components/usePress";

interface Props {
  /** Visible label of the trigger button. */
  label: React.ReactNode;
  /** Accessible name for the trigger, if the label alone is not descriptive. */
  ariaLabel?: string;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  className?: string;
  /** Called when the panel opens (e.g. to compute swap candidates lazily). */
  onOpen?: () => void;
  align?: "start" | "end";
}

/** Small accessible popover: opens on click/Enter/Space, closes on Escape, outside click or blur. */
export default function Popover({ label, ariaLabel, children, className = "", onOpen, align = "start" }: Props) {
  const [open, setOpen] = useState(false);
  const [edge, setEdge] = useState<"left" | "right">(align === "end" ? "right" : "left");
  const rootRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const press = usePress(() => {
    if (!open) onOpen?.();
    setOpen((v) => !v);
  });

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        rootRef.current?.querySelector<HTMLButtonElement>("button[aria-haspopup]")?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Edge-aware: flip to the right-aligned variant if the panel would overflow the viewport.
  useLayoutEffect(() => {
    if (!open || !panelRef.current || !rootRef.current) return;
    const trigger = rootRef.current.getBoundingClientRect();
    const width = panelRef.current.offsetWidth;
    const fitsRight = trigger.left + width <= window.innerWidth - 12;
    const fitsLeft = trigger.right - width >= 12;
    setEdge(fitsRight ? (align === "end" && fitsLeft ? "right" : "left") : fitsLeft ? "right" : "left");
  }, [open, align]);

  return (
    <span ref={rootRef} className={`popover ${className}`} data-open={open || undefined}>
      <button
        type="button"
        className="btn btn-small"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={id}
        aria-label={ariaLabel}
        {...press}
      >
        {label}
      </button>
      <div ref={panelRef} id={id} className="popover-panel" data-edge={edge} hidden={!open} role="group">
        {typeof children === "function" ? children(() => setOpen(false)) : children}
      </div>
    </span>
  );
}
