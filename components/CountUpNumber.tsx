"use client";

import { useEffect, useRef, useState } from "react";
import { money } from "@/lib/format";

/** Counts a price up from zero (about 420 ms). Instant with prefers-reduced-motion. */
export default function CountUpNumber({ amount, currency }: { amount: number; currency: string }) {
  const [shown, setShown] = useState(amount);
  const raf = useRef(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(amount);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 420);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(amount * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [amount]);
  return <span aria-label={money(amount, currency)}>{money(shown, currency)}</span>;
}
