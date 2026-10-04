"use client";

import { AnimatePresence, m } from "motion/react";
import { usePathname } from "next/navigation";
import { type KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import { owner, type PaletteProject, sections } from "@/content/site";
import { PALETTE_EVENT, setTheme } from "@/lib/client-stores";
import { duration, easeOut, spring } from "@/lib/motion";

type Item = {
  id: string;
  group: string;
  label: string;
  hint?: string;
  keywords?: string;
  run: () => void;
};

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/**
 * The old site was a terminal; this keeps the useful part of that idea: type to jump anywhere.
 * Pattern adapted from Kokonut UI's action search bar (MIT): a combobox input that drives a
 * listbox through aria-activedescendant, so focus never leaves the input.
 */
export function CommandPalette({ projects }: { projects: PaletteProject[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onKey = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      } else if (event.key === "/" && !isTypingTarget(event.target) && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener(PALETTE_EVENT, onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(PALETTE_EVENT, onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return <AnimatePresence>{open && <Palette projects={projects} onClose={() => setOpen(false)} />}</AnimatePresence>;
}

function Palette({ projects, onClose }: { projects: PaletteProject[]; onClose: () => void }) {
  const pathname = usePathname();
  const isHome = pathname === "/" || pathname === "";
  const [query, setQuery] = useState("");
  const [rawIndex, setIndex] = useState(0);
  const listId = useId();
  const returnFocus = useRef<Element | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo<Item[]>(() => {
    const go = (href: string) => () => {
      onClose();
      if (href.startsWith("/#") && isHome) window.location.hash = href.slice(1);
      else window.location.assign(href);
    };
    const external = (href: string) => () => {
      onClose();
      if (href.startsWith("mailto:")) window.location.href = href;
      else window.open(href, "_blank", "noopener,noreferrer");
    };

    return [
      ...sections.map((section) => ({
        id: `go-${section.id}`,
        group: "go to",
        label: section.label,
        hint: `#${section.id}`,
        run: go(`/#${section.id}`),
      })),
      { id: "go-now", group: "go to", label: "now", hint: "#now", keywords: "this month current", run: go("/#now") },
      ...projects.map((project) => ({
        id: `open-${project.slug}`,
        group: "open",
        label: project.name,
        hint: project.hint,
        keywords: project.keywords,
        run: go(`/work/${project.slug}`),
      })),
      {
        id: "copy-email",
        group: "do",
        label: "copy email address",
        hint: owner.email,
        keywords: "contact mail",
        run: () => {
          void navigator.clipboard?.writeText(owner.email).catch(() => undefined);
          onClose();
        },
      },
      { id: "send-email", group: "do", label: "send an email", hint: "mailto", keywords: "contact", run: external(`mailto:${owner.email}`) },
      { id: "github", group: "do", label: "open github", hint: "github.com/hamshamb", keywords: "code source", run: external(owner.github) },
      {
        id: "theme",
        group: "do",
        label: "toggle light / dark",
        hint: "theme",
        keywords: "dark light mode colour color",
        run: () => {
          const dark = document.documentElement.dataset.theme === "dark"
            || (!document.documentElement.dataset.theme && window.matchMedia("(prefers-color-scheme: dark)").matches);
          setTheme(dark ? "light" : "dark");
          onClose();
        },
      },
    ];
  }, [isHome, onClose, projects]);

  const results = useMemo(() => {
    const terms = query.trim().toLowerCase().replace(/^(open|cd|go|goto)\s+/, "").split(/\s+/).filter(Boolean);
    if (!terms.length) return items;
    return items.filter((item) => {
      const haystack = `${item.label} ${item.hint ?? ""} ${item.keywords ?? ""} ${item.group}`.toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }, [items, query]);

  const index = Math.min(rawIndex, Math.max(results.length - 1, 0));
  const activeItem = results[index];

  useEffect(() => {
    returnFocus.current = document.activeElement;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    inputRef.current?.focus();
    return () => {
      root.style.overflow = previousOverflow;
      if (returnFocus.current instanceof HTMLElement) returnFocus.current.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    if (!activeItem) return;
    document.getElementById(`${listId}-${activeItem.id}`)?.scrollIntoView({ block: "nearest" });
  }, [activeItem, listId]);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIndex((index + 1) % Math.max(results.length, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setIndex((index - 1 + results.length) % Math.max(results.length, 1));
    } else if (event.key === "Home") {
      event.preventDefault();
      setIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setIndex(results.length - 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      activeItem?.run();
    } else if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    } else if (event.key === "Tab") {
      // Focus stays in the input; the list is navigated with the arrow keys.
      event.preventDefault();
    }
  };

  let lastGroup = "";

  return (
    <>
      <m.div
        className="palette-backdrop"
        aria-hidden="true"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: duration.fast }}
      />
      <m.div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command menu"
        initial={{ opacity: 0, y: -8, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.985 }}
        transition={{ duration: duration.base, ease: easeOut }}
      >
        <div className="palette-field">
          <span aria-hidden="true">~$</span>
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={activeItem ? `${listId}-${activeItem.id}` : undefined}
            aria-autocomplete="list"
            aria-label="Search sections, projects and actions"
            placeholder="where to? try nexus, about, email…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setIndex(0);
            }}
            onKeyDown={onKeyDown}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd>esc</kbd>
        </div>

        {results.length ? (
          <ul id={listId} className="palette-list" role="listbox" aria-label="Results">
            {results.map((item, itemIndex) => {
              const header = item.group !== lastGroup ? item.group : null;
              lastGroup = item.group;
              const selected = itemIndex === index;
              return (
                <li key={item.id} role="presentation">
                  {header && <div className="palette-group mono" role="presentation">{header}</div>}
                  <div
                    id={`${listId}-${item.id}`}
                    role="option"
                    aria-selected={selected}
                    className="palette-option"
                    tabIndex={-1}
                    onPointerMove={() => !selected && setIndex(itemIndex)}
                    onClick={() => item.run()}
                    onKeyDown={(event) => event.key === "Enter" && item.run()}
                  >
                    {selected && <m.span layoutId="palette-highlight" className="palette-highlight" transition={spring.snappy} />}
                    <span>{item.label}</span>
                    {item.hint && <small>{item.hint}</small>}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="palette-empty" role="status">command not found. try “work” or “email”.</p>
        )}

        <div className="palette-foot" aria-hidden="true">
          <span>↑↓ move</span>
          <span>↵ open</span>
          <span>/ or ctrl+k anywhere</span>
        </div>
      </m.div>
    </>
  );
}
