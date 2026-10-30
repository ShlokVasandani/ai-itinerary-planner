"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import PressButton from "@/components/PressButton";

const LINKS = [
  { href: "/#destinations", label: "Destinations" },
  { href: "/#how", label: "How it works" },
  { href: "/credits", label: "Photo credits" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="topbar" data-scrolled={scrolled || undefined} data-open={open || undefined}>
      <div className="topbar-inner">
        <Link href="/" className="brand" aria-label="Sekai, home">
          <span className="brand-mark" aria-hidden="true" />
          Sekai
        </Link>

        <nav className="topbar-nav" aria-label="Primary">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={pathname === l.href ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
        </nav>

        <Link href="/planner" className="btn btn-primary topbar-cta">
          Plan my trip
        </Link>

        <PressButton className="menu-btn" aria-expanded={open} aria-controls="mobile-menu" onPress={() => setOpen((v) => !v)}>
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <span className="menu-bars" aria-hidden="true" />
        </PressButton>
      </div>

      <div id="mobile-menu" className="mobile-menu" hidden={!open}>
        <nav aria-label="Mobile">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
          <Link href="/planner" className="btn btn-primary">
            Plan my trip
          </Link>
        </nav>
      </div>
    </header>
  );
}
