"use client";

import { useRef, type PointerEvent } from "react";

/**
 * Click handlers that respond on pointer-down for a mouse. The browser's `click` only fires on
 * release, which is 80-100ms after the press the user is already watching. Touch, pen and keyboard
 * keep plain `click`: a touch pointer-down can't tell a tap from the start of a scroll, and a
 * keyboard never sends one. The click that follows a handled pointer-down is swallowed.
 */
export function usePress(action: () => void) {
  const handledAt = useRef(-Infinity);
  return {
    onPointerDown(e: PointerEvent) {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      handledAt.current = performance.now();
      action();
    },
    onClick() {
      if (performance.now() - handledAt.current < 600) return;
      action();
    },
  };
}
