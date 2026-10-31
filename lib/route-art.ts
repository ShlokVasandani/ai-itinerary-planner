// Deterministic geometry for the landing hero: a dotted route line and faint
// map-contour rings. Pure functions so the server-rendered SVG and the client
// canvas animation share exactly the same shapes.

export interface Pt {
  x: number;
  y: number;
}

/** Waypoints of the route in unit space (0..1). */
export const ROUTE_WAYPOINTS: Pt[] = [
  { x: 0.1, y: 0.8 },
  { x: 0.34, y: 0.56 },
  { x: 0.58, y: 0.7 },
  { x: 0.8, y: 0.38 },
  { x: 0.93, y: 0.2 },
];

/** Catmull-Rom spline through the points, sampled with `steps` per segment. */
export function splinePoints(points: Pt[], steps = 24): Pt[] {
  const out: Pt[] = [];
  const p = [points[0], ...points, points[points.length - 1]];
  for (let i = 1; i < p.length - 2; i++) {
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push({ x: f(p[i - 1].x, p[i].x, p[i + 1].x, p[i + 2].x), y: f(p[i - 1].y, p[i].y, p[i + 1].y, p[i + 2].y) });
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

/** Points spaced evenly (by arc length) along a polyline. */
export function evenlySpaced(poly: Pt[], count: number): Pt[] {
  const lens = [0];
  for (let i = 1; i < poly.length; i++) {
    lens.push(lens[i - 1] + Math.hypot(poly[i].x - poly[i - 1].x, poly[i].y - poly[i - 1].y));
  }
  const total = lens[lens.length - 1];
  const out: Pt[] = [];
  let seg = 1;
  for (let k = 0; k < count; k++) {
    const target = (k / Math.max(1, count - 1)) * total;
    while (seg < lens.length - 1 && lens[seg] < target) seg++;
    const span = lens[seg] - lens[seg - 1] || 1;
    const t = (target - lens[seg - 1]) / span;
    out.push({ x: poly[seg - 1].x + (poly[seg].x - poly[seg - 1].x) * t, y: poly[seg - 1].y + (poly[seg].y - poly[seg - 1].y) * t });
  }
  return out;
}

export function routePolyline(): Pt[] {
  return splinePoints(ROUTE_WAYPOINTS, 28);
}

function mulberry(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Closed, smooth, noisy rings that read like topographic contour lines. */
export function contourPaths(width = 1000, height = 600): string[] {
  const rand = mulberry(7);
  const centres = [
    { x: 0.2 * width, y: 0.3 * height, rings: 7, r0: 34, step: 30 },
    { x: 0.82 * width, y: 0.72 * height, rings: 8, r0: 30, step: 32 },
    { x: 0.52 * width, y: 0.1 * height, rings: 4, r0: 28, step: 28 },
  ];
  const paths: string[] = [];
  for (const c of centres) {
    const phases = Array.from({ length: 3 }, () => rand() * Math.PI * 2);
    for (let r = 0; r < c.rings; r++) {
      const radius = c.r0 + r * c.step;
      const n = 28;
      const pts: Pt[] = [];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const wobble = 1 + 0.12 * Math.sin(a * 2 + phases[0]) + 0.08 * Math.sin(a * 3 + phases[1] + r * 0.2) + 0.05 * Math.sin(a * 5 + phases[2]);
        pts.push({ x: c.x + Math.cos(a) * radius * wobble * 1.3, y: c.y + Math.sin(a) * radius * wobble });
      }
      // Closed Catmull-Rom to cubic Bézier.
      let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
      for (let i = 0; i < n; i++) {
        const p0 = pts[(i - 1 + n) % n];
        const p1 = pts[i];
        const p2 = pts[(i + 1) % n];
        const p3 = pts[(i + 2) % n];
        const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
        const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
        d += `C${c1.x.toFixed(1)} ${c1.y.toFixed(1)} ${c2.x.toFixed(1)} ${c2.y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
      }
      paths.push(d + "Z");
    }
  }
  return paths;
}

/** SVG path for the route in a width×height box. */
export function routePathD(width: number, height: number): string {
  return routePolyline()
    .map((p, i) => `${i === 0 ? "M" : "L"}${(p.x * width).toFixed(1)} ${(p.y * height).toFixed(1)}`)
    .join("");
}
