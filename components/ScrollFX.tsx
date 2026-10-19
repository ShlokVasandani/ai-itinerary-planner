"use client";

import { useEffect } from "react";

/** Elements that rise into place the first time they enter the viewport. */
const REVEAL = [
  ".section-title",
  ".stack-intro > *",
  ".stats li",
  ".dest-card",
  ".dark-inner > *",
  ".photo-credit",
  ".footer-col",
  ".planner-empty",
  ".trip-summary",
  ".day-jump",
  ".day-card",
  ".tool-card",
  ".dest-hero > *",
  ".dest-facts div",
].join(",");

/**
 * Page-wide scroll behaviour. Elements matching REVEAL fade and rise once as they
 * scroll into view (staggered among siblings that arrive together), and `.stats`
 * numbers count up. Only opacity/transform are animated, nothing runs for
 * prefers-reduced-motion, and content stays visible if this never mounts
 * (the hidden state is gated on `html.fx`).
 */
export default function ScrollFX() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;

    const io = new IntersectionObserver(
      (entries) => {
        let n = 0;
        for (const e of entries) {
          // Also reveal anything already scrolled past (anchor links, fast jumps), so it is never stuck hidden.
          if (!e.isIntersecting && e.boundingClientRect.top >= 0) continue;
          const el = e.target as HTMLElement;
          el.style.transitionDelay = `${Math.min(n++, 6) * 70}ms`;
          el.setAttribute("data-in", "");
          io.unobserve(el);
          if (el.matches(".stats li")) countUp(el.querySelector("strong"));
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    const tag = (scope: ParentNode) => {
      scope.querySelectorAll<HTMLElement>(REVEAL).forEach((el) => {
        if (el.hasAttribute("data-reveal")) return;
        el.setAttribute("data-reveal", "");
        io.observe(el);
      });
    };

    root.classList.add("fx");
    tag(document);

    // The planner renders its plan after mount, and again on every rebuild.
    const mo = new MutationObserver((records) => {
      for (const r of records)
        r.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (node.matches(REVEAL) && !node.hasAttribute("data-reveal")) {
              node.setAttribute("data-reveal", "");
              io.observe(node);
            }
            tag(node);
          }
        });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      root.classList.remove("fx");
      mo.disconnect();
      io.disconnect();
      // Strict Mode mounts twice: clear our marks so the second pass re-observes everything.
      document.querySelectorAll("[data-reveal]").forEach((el) => {
        el.removeAttribute("data-reveal");
        el.removeAttribute("data-in");
      });
    };
  }, []);

  return null;
}

function countUp(el: Element | null) {
  if (!el) return;
  const text = el.textContent ?? "";
  if (!/^\d+$/.test(text)) return; // leave ranges like "1–14" alone
  const target = Number(text);
  const start = performance.now();
  const tick = (now: number) => {
    const p = Math.min(1, (now - start) / 900);
    el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
    if (p < 1) requestAnimationFrame(tick);
  };
  el.textContent = "0";
  requestAnimationFrame(tick);
}
