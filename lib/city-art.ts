// ============================================================================
// Deterministic, generative visual identity for each destination.
// No external images or APIs: every city gets a unique but on-brand abstract
// "travel poster" treatment derived purely from its slug, so it's stable
// across server and client renders and never needs fetching.
// ============================================================================

/** A tiny seeded PRNG (mulberry32) so the same slug always produces the same art. */
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface CityPalette {
  name: string;
  from: string;
  to: string;
  line: string;
  glow: string;
  warm: boolean;
}

/** A family of moody, editorial dark tones that all sit comfortably next to
 * the existing ink/cream/sun/coral brand palette — variations on one poster
 * series, not an arbitrary rainbow. */
export const CITY_PALETTES: CityPalette[] = [
  { name: "dusk", from: "#15261e", to: "#1c3327", line: "#e4ae51", glow: "#e4ae51", warm: true },
  { name: "harbor", from: "#0f2e2d", to: "#154240", line: "#e8c674", glow: "#e8c674", warm: true },
  { name: "aubergine", from: "#2c1728", to: "#3d2035", line: "#df7959", glow: "#df7959", warm: true },
  { name: "terracotta", from: "#3f2015", to: "#54301f", line: "#f0b569", glow: "#f0b569", warm: true },
  { name: "indigo", from: "#161b30", to: "#212a49", line: "#df7959", glow: "#df7959", warm: false },
  { name: "olive", from: "#242a17", to: "#333b20", line: "#e4ae51", glow: "#e4ae51", warm: true },
  { name: "slate", from: "#16232c", to: "#1f3441", line: "#df7959", glow: "#df7959", warm: false },
  { name: "burgundy", from: "#2c121b", to: "#3d1a26", line: "#e4ae51", glow: "#e4ae51", warm: true },
];

export interface CityArtSpec {
  palette: CityPalette;
  bars: number[]; // relative heights 0..1
  glowX: number; // 0..1
  glowY: number; // 0..1
  arcSeed: number;
}

export function getCityArtSpec(slug: string, barCount: number): CityArtSpec {
  const seed = hashString(slug);
  const rand = mulberry32(seed);
  const palette = CITY_PALETTES[seed % CITY_PALETTES.length];

  const bars: number[] = [];
  for (let i = 0; i < barCount; i++) {
    // Bias toward a gentle skyline silhouette: taller in the middle third,
    // shorter at the edges, with per-bar jitter so it never looks uniform.
    const center = barCount / 2;
    const distFromCenter = Math.abs(i - center) / center;
    const base = 0.35 + (1 - distFromCenter) * 0.45;
    const jitter = (rand() - 0.5) * 0.3;
    bars.push(Math.min(0.95, Math.max(0.12, base + jitter)));
  }

  return {
    palette,
    bars,
    glowX: 0.15 + rand() * 0.7,
    glowY: 0.1 + rand() * 0.25,
    arcSeed: rand(),
  };
}
