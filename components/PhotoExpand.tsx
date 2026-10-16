"use client";

import { useEffect, useRef } from "react";

/**
 * Signature effect 2: the photo scales from about 60% width to full-bleed as it
 * crosses the viewport, with a caption that fades in at full size, then eases back.
 * Uses a CSS view() timeline where supported, otherwise a passive scroll
 * listener that only writes `transform`/`opacity` (never touches scrolling).
 */
export default function PhotoExpand({ children, caption }: { children: React.ReactNode; caption: React.ReactNode }) {
  const frame = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = frame.current;
    const cap = text.current;
    if (!el || !cap) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof CSS !== "undefined" && CSS.supports("animation-timeline: view()")) return; // CSS handles it

    el.dataset.js = "true";
    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the frame's top enters the bottom of the viewport, 1 when its bottom leaves the top.
      const p = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
      // scale: .6 -> 1 over the first 45%, hold to 55%, back to .6
      let s = 1;
      if (p < 0.45) s = 0.6 + 0.4 * (p / 0.45);
      else if (p > 0.55) s = 1 - 0.4 * ((p - 0.55) / 0.45);
      el.style.transform = `scale(${s.toFixed(3)})`;
      const o = p < 0.4 ? 0 : p < 0.5 ? (p - 0.4) / 0.1 : p < 0.6 ? 1 : Math.max(0, 1 - (p - 0.6) / 0.1);
      cap.style.opacity = o.toFixed(3);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="expand">
      <div ref={frame} className="expand-frame">
        {children}
        <div className="expand-scrim" aria-hidden="true" />
        <div ref={text} className="expand-caption">
          {caption}
        </div>
      </div>
    </div>
  );
}
