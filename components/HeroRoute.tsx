"use client";

import { useEffect, useRef, useState } from "react";
import { ROUTE_WAYPOINTS, contourPaths, evenlySpaced, routePathD, routePolyline, type Pt } from "@/lib/route-art";

const CONTOURS = contourPaths(1000, 600);
const ROUTE_D = routePathD(1000, 600);

/** Phase lengths in seconds. */
const FLY = 2.4;
const BREAK = 0.9;
const FORM = 2.0;
const HOLD = 2.6;
const FADE = 0.7;
const CYCLE = FLY + BREAK + FORM + HOLD + FADE;

const CORAL = "#FF5A36";
const CORAL_DARK = "#E34726";
const INK = "#16130F";

interface Particle {
  sx: number; // start (on the plane) in unit space
  sy: number;
  vx: number; // burst velocity (unit space per second)
  vy: number;
  tx: number; // target on the route
  ty: number;
  size: number;
  delay: number;
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/** Quadratic Bézier flight path in unit space. */
function flightAt(t: number): { x: number; y: number; angle: number } {
  const p0 = { x: -0.06, y: 0.9 };
  const p1 = { x: 0.2, y: 0.18 };
  const p2 = { x: 0.34, y: 0.5 };
  const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
  const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
  const dx = 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
  const dy = 2 * (1 - t) * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
  return { x, y, angle: Math.atan2(dy, dx) };
}

function drawPlane(ctx: CanvasRenderingContext2D, cx: number, cy: number, angle: number, size: number, alpha: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.globalAlpha = alpha;
  // upper wing
  ctx.fillStyle = CORAL;
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(-size * 0.9, -size * 0.55);
  ctx.lineTo(-size * 0.45, 0);
  ctx.closePath();
  ctx.fill();
  // lower wing
  ctx.fillStyle = CORAL_DARK;
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(-size * 0.45, 0);
  ctx.lineTo(-size * 0.9, size * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Local plane coordinates -> unit space at the break position. */
function planeToWorld(lx: number, ly: number, cx: number, cy: number, angle: number, size: number, w: number, h: number): Pt {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const x = cx * w + (lx * cos - ly * sin) * size;
  const y = cy * h + (lx * sin + ly * cos) * size;
  return { x: x / w, y: y / h };
}

function seeded(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Signature effect 1: a coral paper plane flies in, breaks into particles and
 * reforms as a dotted route over faint contour lines.
 * - particle count scales with viewport area (capped), DPR capped at 2
 * - paused when off-screen or the tab is hidden
 * - prefers-reduced-motion and no-canvas users see the static SVG instead
 */
export default function HeroRoute() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setAnimated(true);
    let w = 0;
    let h = 0;
    let dpr = 1;
    let particles: Particle[] = [];
    let route: Pt[] = [];
    let raf = 0;
    let running = false;
    let visible = true;
    let startTs = 0;
    let pausedAt = 0;

    const build = () => {
      const rect = wrap.getBoundingClientRect();
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.round(Math.min(380, Math.max(110, (w * h) / 2600)));
      route = evenlySpaced(routePolyline(), count);
      const rand = seeded(11);
      const end = flightAt(1);
      const size = Math.max(18, Math.min(34, w * 0.022));
      particles = route.map((target) => {
        // random point inside the plane's triangle (local coords)
        const u = rand();
        const v = rand();
        const su = Math.sqrt(u);
        const a = { x: 1, y: 0 };
        const b = { x: -0.9, y: -0.55 };
        const c = { x: -0.9, y: 0.55 };
        const lx = (1 - su) * a.x + su * (1 - v) * b.x + su * v * c.x;
        const ly = (1 - su) * a.y + su * (1 - v) * b.y + su * v * c.y;
        const s = planeToWorld(lx, ly, end.x, end.y, end.angle, size, w, h);
        const ang = rand() * Math.PI * 2;
        const speed = 0.04 + rand() * 0.16;
        return {
          sx: s.x,
          sy: s.y,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed * (w / h),
          tx: target.x,
          ty: target.y,
          size: 1.4 + rand() * 1.6,
          delay: rand() * 0.35,
        };
      });
    };

    const frame = (ts: number) => {
      if (!running) return;
      if (!startTs) startTs = ts;
      const t = ((ts - startTs) / 1000) % CYCLE;
      ctx.clearRect(0, 0, w, h);
      const size = Math.max(18, Math.min(34, w * 0.022));

      // Waypoint rings are drawn once the route has formed.
      const formStart = FLY + BREAK;
      const formProgress = clamp01((t - formStart) / FORM);
      const fadeOut = t > FLY + BREAK + FORM + HOLD ? clamp01((t - (FLY + BREAK + FORM + HOLD)) / FADE) : 0;

      if (t < FLY) {
        const p = ease(t / FLY);
        const pos = flightAt(p);
        // faint trail
        ctx.strokeStyle = "rgba(22,19,15,0.16)";
        ctx.setLineDash([2, 6]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i <= 24; i++) {
          const q = flightAt((p * i) / 24);
          if (i === 0) ctx.moveTo(q.x * w, q.y * h);
          else ctx.lineTo(q.x * w, q.y * h);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        drawPlane(ctx, pos.x * w, pos.y * h, pos.angle, size, 1);
      } else {
        const bt = t - FLY; // seconds since the break
        for (const p of particles) {
          const local = Math.max(0, bt - p.delay);
          let x: number;
          let y: number;
          if (local < BREAK) {
            // burst outwards, slowing down
            const k = 1 - Math.pow(1 - local / BREAK, 2);
            x = p.sx + p.vx * k;
            y = p.sy + p.vy * k;
          } else {
            const bx = p.sx + p.vx;
            const by = p.sy + p.vy;
            const k = ease(clamp01((local - BREAK) / (FORM - 0.35)));
            x = bx + (p.tx - bx) * k;
            y = by + (p.ty - by) * k;
          }
          const settled = bt > BREAK + FORM - 0.2;
          ctx.globalAlpha = (1 - fadeOut) * (settled ? 1 : 0.9);
          ctx.fillStyle = settled ? INK : CORAL;
          ctx.beginPath();
          ctx.arc(x * w, y * h, settled ? p.size * 0.9 : p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        // waypoint rings
        if (formProgress > 0.15) {
          ROUTE_WAYPOINTS.forEach((wp, i) => {
            const appear = clamp01(formProgress * 1.4 - i * 0.12);
            if (appear <= 0) return;
            ctx.globalAlpha = appear * (1 - fadeOut);
            ctx.fillStyle = "#FFD23F";
            ctx.strokeStyle = INK;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(wp.x * w, wp.y * h, 7 * appear + 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          });
          ctx.globalAlpha = 1;
        }
      }
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running || !visible || document.hidden) return;
      running = true;
      // resume from where we paused instead of restarting
      if (pausedAt) startTs = performance.now() - pausedAt;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
      pausedAt = startTs ? performance.now() - startTs : 0;
    };

    build();
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      },
      { threshold: 0.05 }
    );
    io.observe(wrap);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    const ro = new ResizeObserver(() => {
      build();
    });
    ro.observe(wrap);
    start();

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div ref={wrapRef} className="hero-route" aria-hidden="true" data-animated={animated || undefined}>
      <svg className="hero-route-svg" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" focusable="false">
        <g className="contours">
          {CONTOURS.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        <path className="route-static" d={ROUTE_D} />
        {ROUTE_WAYPOINTS.map((p, i) => (
          <circle key={i} className="route-dot" cx={p.x * 1000} cy={p.y * 600} r="7" />
        ))}
        <g className="plane-static" transform="translate(560 120) rotate(-12)">
          <path d="M26 0 L-24 -15 L-12 0 Z" fill={CORAL} />
          <path d="M26 0 L-12 0 L-24 15 Z" fill={CORAL_DARK} />
        </g>
      </svg>
      <canvas ref={canvasRef} className="hero-route-canvas" />
    </div>
  );
}
