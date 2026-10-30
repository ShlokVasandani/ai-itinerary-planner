"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/components/usePrefersReducedMotion";
import { money } from "@/lib/format";

/** Counts a price up from zero (about 420 ms). Instant with prefers-reduced-motion. */
export default function CountUpNumber({ amount, currency }: { amount: number; currency: string }) {
  const [shown, setShown] = useState(amount);
  const raf = useRef(0);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (reduced) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 420);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(amount * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [amount, reduced]);
  return <span aria-label={money(amount, currency)}>{money(reduced ? amount : shown, currency)}</span>;
}
