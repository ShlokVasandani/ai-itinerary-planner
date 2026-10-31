"use client";

import { useEffect, useRef, useState } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/**
 * Cycles through destination names, resolving each from scrambled characters
 * (under a second). Pauses off-screen / in hidden tabs; with
 * prefers-reduced-motion the word simply swaps without scrambling.
 * The surrounding heading carries the accessible text, so this is aria-hidden.
 */
export default function DecryptWord({ words, interval = 3400 }: { words: string[]; interval?: number }) {
  const [text, setText] = useState(words[0]);
  const ref = useRef<HTMLSpanElement>(null);
  const index = useRef(0);
  const visible = useRef(true);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = ref.current;
    let scrambleTimer: number | undefined;
    const io = new IntersectionObserver(([e]) => (visible.current = e.isIntersecting), { threshold: 0 });
    if (el) io.observe(el);

    const scrambleTo = (target: string) => {
      if (reduced.current) {
        setText(target);
        return;
      }
      const started = performance.now();
      const duration = 650;
      window.clearInterval(scrambleTimer);
      scrambleTimer = window.setInterval(() => {
        const p = Math.min(1, (performance.now() - started) / duration);
        const resolved = Math.floor(p * target.length);
        let out = "";
        for (let i = 0; i < target.length; i++) {
          if (target[i] === " ") out += " ";
          else if (i < resolved) out += target[i];
          else out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
        setText(out);
        if (p >= 1) {
          window.clearInterval(scrambleTimer);
          setText(target);
        }
      }, 45);
    };

    const tick = window.setInterval(() => {
      if (document.hidden || !visible.current) return;
      index.current = (index.current + 1) % words.length;
      scrambleTo(words[index.current]);
    }, interval);

    return () => {
      window.clearInterval(tick);
      window.clearInterval(scrambleTimer);
      io.disconnect();
    };
  }, [words, interval]);

  const longest = Math.max(...words.map((w) => w.length));
  return (
    <span ref={ref} className="decrypt" aria-hidden="true" style={{ minWidth: `${longest * 0.62}em` }}>
      {text}
    </span>
  );
}
