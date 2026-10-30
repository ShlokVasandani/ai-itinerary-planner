import { ViewTransition } from "react";

/**
 * Wraps a page's content so navigations animate by type: `nav-forward` slides in from the right,
 * `nav-back` from the left, `nav-fade` crossfades. Anything without a type (browser back/forward,
 * refresh) swaps instantly. Lives in each page.tsx, not the layout: a layout persists across
 * navigations, so its enter and exit never fire. The CSS is in globals.css.
 */
const types = { "nav-forward": "nav-forward", "nav-back": "nav-back", "nav-fade": "nav-fade", default: "none" } as const;

export default function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter={types} exit={types} default="none">
      {children}
    </ViewTransition>
  );
}
