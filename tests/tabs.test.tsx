import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import DestinationTabs from "@/components/DestinationTabs";
import { loadDestination } from "@/lib/data/catalog";
import { nextTabIndex } from "@/lib/tab-keys";

describe("nextTabIndex", () => {
  it("moves with the arrows and wraps at both ends", () => {
    expect(nextTabIndex("ArrowRight", 0, 5)).toBe(1);
    expect(nextTabIndex("ArrowRight", 4, 5)).toBe(0);
    expect(nextTabIndex("ArrowLeft", 2, 5)).toBe(1);
    expect(nextTabIndex("ArrowLeft", 0, 5)).toBe(4);
  });
  it("jumps to the ends with Home and End", () => {
    expect(nextTabIndex("Home", 3, 5)).toBe(0);
    expect(nextTabIndex("End", 1, 5)).toBe(4);
  });
  it("ignores every other key", () => {
    for (const k of ["Enter", " ", "Tab", "a", "ArrowDown", "ArrowUp"]) expect(nextTabIndex(k, 1, 5)).toBeUndefined();
    expect(nextTabIndex("ArrowRight", 0, 0)).toBeUndefined();
  });
});

describe("city-guide tabs markup", () => {
  it("has roving tabindex, aria-selected and aria-controls that point at a real panel", async () => {
    const html = renderToStaticMarkup(<DestinationTabs d={(await loadDestination("lisbon"))!} />);
    const tabs = [...html.matchAll(/<button[^>]*role="tab"[^>]*>/g)].map((m) => m[0]);
    expect(tabs.length).toBeGreaterThan(5);
    // exactly one tab is in the tab order, and it is the selected one
    const inOrder = tabs.filter((t) => t.includes('tabindex="0"'));
    expect(inOrder).toHaveLength(1);
    expect(inOrder[0]).toContain('aria-selected="true"');
    for (const t of tabs.filter((t) => !t.includes('tabindex="0"'))) {
      expect(t).toContain('tabindex="-1"');
      expect(t).toContain('aria-selected="false"');
    }
    // every tab controls the one panel that exists, and that panel is labelled by the selected tab
    const controls = new Set(tabs.map((t) => /aria-controls="([^"]+)"/.exec(t)![1]));
    expect(controls.size).toBe(1);
    const panelId = [...controls][0];
    expect(html).toContain(`role="tabpanel" id="${panelId}"`);
    const selectedId = /id="([^"]+)"/.exec(inOrder[0])![1];
    expect(html).toContain(`aria-labelledby="${selectedId}"`);
  });
});
