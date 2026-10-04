"use client";

import { AnimatePresence, m, useMotionValueEvent, useScroll } from "motion/react";
import { AppLink as Link } from "../ui/AppLink";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { owner, pages, sections } from "@/content/site";
import { openPalette } from "@/lib/client-stores";
import { duration, easeOut, spring } from "@/lib/motion";
import { BrandMark } from "../ui/BrandMark";
import { CloseIcon, MenuIcon } from "../ui/icons";
import { ThemeToggle } from "../ui/ThemeToggle";

type SectionId = (typeof sections)[number]["id"];

function useActiveSection(enabled: boolean) {
  const [active, setActive] = useState<SectionId | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const targets = sections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => element !== null);
    const visible = new Map<string, number>();

    // A section counts as current while it crosses a band 30-45% down the viewport.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.boundingClientRect.top);
          else visible.delete(entry.target.id);
        }
        const current = [...visible.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] as SectionId | undefined;
        setActive(current ?? null);
      },
      { rootMargin: "-30% 0px -55% 0px" },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [enabled]);

  return enabled ? active : null;
}

export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/" || pathname === "";
  const active = useActiveSection(isHome);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pendingSection = useRef<string | null>(null);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (value) => setScrolled(value > 12));

  const sectionHref = (id: string) => (isHome ? `#${id}` : `/#${id}`);

  // The menu locks page scroll while open, so in-page jumps wait until it has fully closed.
  const navigateFromMenu = (id: string) => {
    if (!isHome) return false;
    pendingSection.current = id;
    setMenuOpen(false);
    return true;
  };
  const flushPendingSection = () => {
    const id = pendingSection.current;
    pendingSection.current = null;
    if (!id) return;
    window.history.pushState(null, "", `#${id}`);
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(id)?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  return (
    <>
      <header className="site-header" data-scrolled={scrolled || !isHome}>
        <div className="container header-inner">
          <Link href="/" className="brand" aria-label="hamshamb, home">
            <BrandMark />
            <span>{owner.name}</span>
          </Link>

          <nav className="site-nav" aria-label="Sections">
            <ul>
              {sections.map((section) => {
                const current = active === section.id;
                return (
                  <li key={section.id}>
                    <a href={sectionHref(section.id)} aria-current={current ? "location" : undefined}>
                      {current && (
                        <m.span layoutId="nav-indicator" className="nav-indicator" transition={spring.snappy} />
                      )}
                      {section.label}
                    </a>
                  </li>
                );
              })}
              {pages.map((page) => {
                const current = pathname.startsWith(page.href);
                return (
                  <li key={page.href}>
                    <a href={page.href} aria-current={current ? "page" : undefined}>
                      {current && <m.span layoutId="nav-indicator" className="nav-indicator" transition={spring.snappy} />}
                      {page.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="header-actions">
            <button type="button" className="command-trigger" onClick={openPalette} aria-label="Open command menu">
              <span>~$ jump to…</span>
              <kbd>/</kbd>
            </button>
            <ThemeToggle />
            <button
              type="button"
              className="icon-button menu-button"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen(true)}
            >
              <MenuIcon />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence onExitComplete={flushPendingSection}>
        {menuOpen && (
          <MobileMenu sectionHref={sectionHref} onNavigate={navigateFromMenu} onClose={() => setMenuOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

function MobileMenu({
  sectionHref,
  onNavigate,
  onClose,
}: {
  sectionHref: (id: string) => string;
  onNavigate: (id: string) => boolean;
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<Element | null>(null);

  const close = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    returnFocus.current = document.activeElement;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("a, button")?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab" || !panel.current) return;
      const focusable = [...panel.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const onResize = () => {
      if (window.matchMedia("(min-width: 820px)").matches) close();
    };

    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      root.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      if (returnFocus.current instanceof HTMLElement) returnFocus.current.focus();
    };
  }, [close]);

  return (
    <m.div
      ref={panel}
      id="mobile-menu"
      className="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: duration.fast }}
    >
      <div className="mobile-menu-top">
        <Link href="/" className="brand" onClick={close}>
          <BrandMark />
          <span>{owner.name}</span>
        </Link>
        <button type="button" className="icon-button" aria-label="Close menu" onClick={close}>
          <CloseIcon />
        </button>
      </div>
      <nav aria-label="Sections">
        <ol>
          {sections.map((section, index) => (
            <m.li
              key={section.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: duration.slow, ease: easeOut, delay: 0.04 + index * 0.04 }}
            >
              <a
                href={sectionHref(section.id)}
                onClick={(event) => {
                  if (onNavigate(section.id)) event.preventDefault();
                  else close();
                }}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                {section.label}
              </a>
            </m.li>
          ))}
          {pages.map((page, index) => (
            <m.li
              key={page.href}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: duration.slow, ease: easeOut, delay: 0.04 + (sections.length + index) * 0.04 }}
            >
              <a href={page.href} onClick={close}>
                <span>{String(sections.length + index + 1).padStart(2, "0")}</span>
                {page.label}
              </a>
            </m.li>
          ))}
        </ol>
      </nav>
      <div className="mobile-menu-foot">
        <button
          type="button"
          className="button"
          onClick={() => {
            close();
            window.setTimeout(openPalette, 50);
          }}
        >
          ~$ jump to…
        </button>
        <a className="button" href={`mailto:${owner.email}`}>email me</a>
        <a className="button" href={owner.github} target="_blank" rel="noopener noreferrer">
          github <span aria-hidden="true">↗</span>
        </a>
      </div>
    </m.div>
  );
}
