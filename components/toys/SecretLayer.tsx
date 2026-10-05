"use client";

import { AnimatePresence, m } from "motion/react";
import { type ComponentType, lazy, type LazyExoticComponent, type ReactNode, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { sections } from "@/content/site";
import { toys } from "@/content/secrets";
import { duration, easeOut } from "@/lib/motion";
import { onPanic, panic } from "@/lib/panic";
import { achieve, bump, discover, getSecretState, setFlag, type Toast, TOAST_EVENT, unlockToy, useSecrets } from "@/lib/secrets";
import { allBolts } from "@/lib/secrets-core";
import { GRAVITY_EVENT, type OverlayToy, TOY_EVENT } from "@/lib/toys";

const Reaction = lazy(() => import("./Reaction"));
const Fidget = lazy(() => import("./Fidget"));
const Physics = lazy(() => import("./Physics"));
const TouchGrass = lazy(() => import("./TouchGrass"));
const ProjectMap = lazy(() => import("./ProjectMap"));
const DevPanel = lazy(() => import("./DevPanel"));

const overlay: Record<OverlayToy, LazyExoticComponent<ComponentType>> = {
  reaction: Reaction,
  fidget: Fidget,
  physics: Physics,
  "touch-grass": TouchGrass,
  map: ProjectMap,
};

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
const CHAOS_MS = 12_000;
const GRAVITY_MS = 20_000;
const html = () => document.documentElement;
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

/**
 * Everything hidden, in one place. Nothing here renders on the server, nothing reaches the
 * network, and Escape always puts the page back. Toys load only when opened.
 */
export function SecretLayer({ projectSlugs }: { projectSlugs: string[] }) {
  const [toasts, setToasts] = useState<(Toast & { id: number })[]>([]);
  const [toy, setToy] = useState<OverlayToy | null>(null);
  const [dev, setDev] = useState(false);
  const state = useSecrets();
  const toastId = useRef(0);

  // toasts: small, bottom corner, never more than three
  useEffect(() => {
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<Toast>).detail;
      const id = ++toastId.current;
      setToasts((list) => [...list.slice(-2), { ...detail, id }]);
      window.setTimeout(() => setToasts((list) => list.filter((item) => item.id !== id)), 3600);
    };
    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);

  // the bolt-collector variant of the build engine
  const altEngine = Boolean(state && allBolts(state));
  useEffect(() => {
    html().classList.toggle("engine-alt", altEngine);
  }, [altEngine]);

  const closeToy = useCallback(() => setToy(null), []);

  // toys, gravity and the global Escape
  useEffect(() => {
    let gravityTimer = 0;
    const gravity = (on: boolean) => {
      window.clearTimeout(gravityTimer);
      html().classList.toggle("gravity-off", !on);
      if (!on) {
        unlockToy("gravity");
        gravityTimer = window.setTimeout(() => html().classList.remove("gravity-off"), GRAVITY_MS);
      }
    };
    const onToy = (event: Event) => setToy((event as CustomEvent<OverlayToy>).detail);
    const onGravity = (event: Event) => gravity((event as CustomEvent<boolean>).detail);
    const offPanic = onPanic(() => {
      gravity(true);
      setToy(null);
      setDev(false);
      html().classList.remove("chaos", "chaos-still");
    });
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || isTyping(event.target)) return;
      // dialogs, the palette and form controls handle their own Escape first
      if (document.querySelector('[aria-modal="true"]:not([data-toy])')) return;
      panic();
    };
    window.addEventListener(TOY_EVENT, onToy);
    window.addEventListener(GRAVITY_EVENT, onGravity);
    window.addEventListener("keydown", onKey);
    return () => {
      offPanic();
      window.clearTimeout(gravityTimer);
      window.removeEventListener(TOY_EVENT, onToy);
      window.removeEventListener(GRAVITY_EVENT, onGravity);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  // konami, the dev panel shortcut, logo reactions and source links
  useEffect(() => {
    let progress = 0;
    let chaosTimer = 0;
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.code === "Period") {
        event.preventDefault();
        setDev((open) => !open);
        discover("dev-panel");
        return;
      }
      if (isTyping(event.target)) return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      progress = key === KONAMI[progress] ? progress + 1 : key === KONAMI[0] ? 1 : 0;
      if (progress < KONAMI.length) return;
      progress = 0;
      discover("konami");
      window.clearTimeout(chaosTimer);
      html().classList.add(reducedMotion() ? "chaos-still" : "chaos");
      chaosTimer = window.setTimeout(() => html().classList.remove("chaos", "chaos-still"), CHAOS_MS);
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const icon = target?.closest?.("svg.tech-icon[data-icon]");
      if (icon && icon.closest(".lab-page-title")) {
        icon.classList.remove("logo-react");
        void (icon as SVGElement).getBoundingClientRect();
        icon.classList.add("logo-react");
        discover("tech-logo");
      }
      const link = target?.closest?.("a[href^='https://github.com/']");
      if (link && bump("source-links") >= 3) achieve("source-reader");
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      window.clearTimeout(chaosTimer);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, []);

  // achievements that come from simply looking around
  useEffect(() => {
    const path = window.location.pathname.replace(/\/$/, "");
    const work = path.match(/^\/work\/([\w-]+)/)?.[1];
    if (work && projectSlugs.includes(work)) {
      setFlag(`visited-${work}`);
      if (projectSlugs.every((slug) => getSecretState().flags.includes(`visited-${slug}`))) achieve("completionist");
    }

    // every home section seen at least half-way
    let observer: IntersectionObserver | undefined;
    if (path === "") {
      const seen = new Set<string>();
      observer = new IntersectionObserver((entries) => {
        for (const entry of entries) if (entry.isIntersecting) seen.add(entry.target.id);
        if (seen.size === sections.length) {
          achieve("rabbit-hole");
          observer?.disconnect();
        }
      }, { threshold: 0.2 });
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) observer.observe(el);
      }
    }

    // active time: only counts while the tab is visible and someone touched something recently
    let lastInput = Date.now();
    const touch = () => (lastInput = Date.now());
    const inputs = ["pointermove", "keydown", "scroll", "touchstart"] as const;
    for (const name of inputs) window.addEventListener(name, touch, { passive: true });
    const clock = window.setInterval(() => {
      if (document.visibilityState !== "visible" || Date.now() - lastInput > 30_000) return;
      if (bump("active-seconds", 15) >= 360) achieve("still-here");
    }, 15_000);

    // scrolling absurdly fast, once per session
    let lastY = window.scrollY;
    let lastT = performance.now();
    let fast = 0;
    const onScroll = () => {
      const now = performance.now();
      const speed = Math.abs(window.scrollY - lastY) / Math.max(now - lastT, 1);
      lastY = window.scrollY;
      lastT = now;
      fast = speed > 9 ? fast + 1 : 0;
      if (fast < 4) return;
      try {
        if (window.sessionStorage.getItem("okay-okay")) return;
        window.sessionStorage.setItem("okay-okay", "1");
      } catch {
        // without storage it may say it twice. acceptable.
      }
      discover("scroll-speed");
      window.removeEventListener("scroll", onScroll);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer?.disconnect();
      window.clearInterval(clock);
      for (const name of inputs) window.removeEventListener(name, touch);
      window.removeEventListener("scroll", onScroll);
    };
  }, [projectSlugs]);

  const Toy = toy ? overlay[toy] : null;

  return (
    <>
      <BugHunt />
      <div className="toasts" role="status" aria-live="polite">
        <AnimatePresence initial={false}>
          {toasts.map((item) => (
            <m.p
              key={item.id}
              className="toast mono"
              data-kind={item.kind}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: duration.base, ease: easeOut }}
            >
              {item.text}
            </m.p>
          ))}
        </AnimatePresence>
      </div>
      {Toy && toy && (
        <ToyDialog title={toys[toy].title} note={toys[toy].note} onClose={closeToy}>
          <Suspense fallback={<p className="toy-loading mono">loading…</p>}>
            <Toy />
          </Suspense>
        </ToyDialog>
      )}
      {dev && (
        <Suspense fallback={null}>
          <DevPanel onClose={() => setDev(false)} />
        </Suspense>
      )}
    </>
  );
}

/** A real dialog: focus moves in, Tab stays in, Escape and the backdrop close it, focus returns. */
export function ToyDialog({ title, note, onClose, children }: { title: string; note: string; onClose: () => void; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    box.current?.querySelector<HTMLElement>("button, [href], input, [tabindex]:not([tabindex='-1'])")?.focus();
    const onKey = (event: KeyboardEvent) => {
      // the palette (or anything else) on top of the toy handles its own Escape first
      if (event.defaultPrevented) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key !== "Tab" || !box.current) return;
      const focusable = [...box.current.querySelectorAll<HTMLElement>("button, [href], input, select, [tabindex]:not([tabindex='-1'])")].filter((el) => !el.hasAttribute("disabled"));
      if (!focusable.length) return;
      const [first, last] = [focusable[0], focusable[focusable.length - 1]];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      // the opener may be gone (the palette closes as a toy opens); fall back to the page
      if (previous?.isConnected) previous.focus({ preventScroll: true });
      else document.getElementById("main")?.focus({ preventScroll: true });
    };
  }, [onClose]);

  return (
    <div className="toy-layer">
      <div className="toy-backdrop" aria-hidden="true" onClick={onClose} />
      <div className="toy-dialog" role="dialog" aria-modal="true" data-toy aria-labelledby="toy-title" ref={box}>
        <header className="toy-head">
          <div>
            <h2 id="toy-title">{title}</h2>
            <p className="mono">{note}</p>
          </div>
          <button type="button" className="tool-button mono" onClick={onClose}>close <span aria-hidden="true">esc</span></button>
        </header>
        {children}
      </div>
    </div>
  );
}

/**
 * Sometimes a bug walks across the page. Not on every visit, never in the first twenty seconds,
 * at most one per page. With reduced motion it just sits still in a corner.
 */
function BugHunt() {
  const [bug, setBug] = useState<{ y: number; still: boolean } | null>(null);
  useEffect(() => {
    if (Math.random() > 0.35) return;
    const timer = window.setTimeout(() => {
      if (document.visibilityState !== "visible") return;
      setBug({ y: 20 + Math.random() * 60, still: reducedMotion() });
    }, 20_000 + Math.random() * 40_000);
    const off = onPanic(() => setBug(null));
    return () => {
      window.clearTimeout(timer);
      off();
    };
  }, []);
  if (!bug) return null;
  return (
    <button
      type="button"
      className="bug"
      data-still={bug.still || undefined}
      style={{ top: `${bug.y}vh` }}
      aria-label="a bug. catch it"
      onAnimationEnd={() => setBug(null)}
      onClick={() => {
        setBug(null);
        const caught = bump("bugs");
        if (caught === 1) {
          discover("bug-caught");
          achieve("bug-hunter");
        }
        const message = caught === 5 ? "5 bugs fixed. production immediately created 7 more." : caught === 1 ? "bug fixed." : `${caught} bugs fixed.`;
        window.dispatchEvent(new CustomEvent<Toast>(TOAST_EVENT, { detail: { text: message, kind: "plain" } }));
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <ellipse cx="12" cy="13" rx="5" ry="6.5" />
        <circle cx="12" cy="5.5" r="2.6" />
        <path d="M7 10 3 8M7 14H2.5M7.5 18 4 21M17 10l4-2M17 14h4.5M16.5 18l3.5 3M10.5 3.5 9 1.5M13.5 3.5 15 1.5M12 7v12" />
      </svg>
    </button>
  );
}
