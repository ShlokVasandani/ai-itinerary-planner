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
  // The menu is open only for the path it was opened on, so navigating closes it without an effect.
  const [openFor, setOpenFor] = useState<string | null>(null);
  const open = openFor === pathname;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenFor(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="topbar" data-scrolled={scrolled || undefined} data-open={open || undefined} style={{ viewTransitionName: "site-header" }}>
      <div className="topbar-inner">
        <Link href="/" className="brand" aria-label="Sekai, home" transitionTypes={["nav-fade"]}>
          <span className="brand-mark" aria-hidden="true" />
          Sekai
        </Link>

        <nav className="topbar-nav" aria-label="Primary">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={pathname === l.href ? "page" : undefined} transitionTypes={["nav-fade"]}>
              {l.label}
            </Link>
          ))}
        </nav>

        <Link href="/planner" className="btn btn-primary topbar-cta" transitionTypes={["nav-fade"]}>
          Plan my trip
        </Link>

        <PressButton className="menu-btn" aria-expanded={open} aria-controls="mobile-menu" onPress={() => setOpenFor(open ? null : pathname)}>
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <span className="menu-bars" aria-hidden="true" />
        </PressButton>
      </div>

      <div id="mobile-menu" className="mobile-menu" hidden={!open}>
        <nav aria-label="Mobile">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} transitionTypes={["nav-fade"]}>
              {l.label}
            </Link>
          ))}
          <Link href="/planner" className="btn btn-primary" transitionTypes={["nav-fade"]}>
            Plan my trip
          </Link>
        </nav>
      </div>
    </header>
  );
}
