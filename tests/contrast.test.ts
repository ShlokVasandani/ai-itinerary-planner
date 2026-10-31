import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const css = fs.readFileSync(path.join(process.cwd(), "app", "globals.css"), "utf8");
const token = (name: string) => css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`))![1];

function lum(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const ratio = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// Every text/background pair the design uses for small text must reach 4.5:1.
const PAIRS: [string, string, string][] = [
  ["text", "bg", "body text"],
  ["muted", "bg", "secondary text"],
  ["muted", "surface", "secondary text on cards"],
  ["muted", "soft", "secondary text on soft fills"],
  ["accent", "bg", "accent text"],
  ["accent", "surface", "accent text on cards"],
  ["text", "coral", "primary button"],
  ["text", "coral-deep", "primary button hover"],
  ["text", "yellow", "chips, badges, highlights"],
  ["bg", "teal", "text on dark section"],
  ["accent-on-dark", "teal", "accent on dark section"],
  ["bg", "teal-soft", "text on dark inputs"],
  ["accent-on-dark", "teal-soft", "accent on dark hover"],
  ["text", "soft", "text on soft fills"],
];

describe("palette contrast", () => {
  for (const [fg, bg, label] of PAIRS) {
    it(`${label}: ${fg} on ${bg} >= 4.5:1`, () => {
      expect(ratio(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5);
    });
  }
  it("coral is never used for small text on the page background", () => {
    expect(ratio(token("coral"), token("bg"))).toBeLessThan(4.5); // documents why coral is fill-only
  });
});
