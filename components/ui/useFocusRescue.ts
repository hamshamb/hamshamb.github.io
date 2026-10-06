"use client";

import { type RefObject, useEffect } from "react";

const FOCUSABLE = "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

/**
 * Keeps keyboard focus inside a demo when the control that had it disables or removes itself
 * (a "next" button at the end of a sequence, a deleted row, a one-shot fix). Without this the
 * browser drops focus to the page and a keyboard user has to start over from the top.
 *
 * It remembers the last focused element inside `root`, and after any DOM change it checks: if
 * that element is now disabled or gone and focus has fallen out to the page, focus moves to the
 * nearest enabled control in the same group, or to the root itself.
 */
export function useFocusRescue(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let last: HTMLElement | null = null;
    let group: HTMLElement | null = null;
    let queued = 0;

    const onFocusIn = (event: FocusEvent) => {
      last = event.target instanceof HTMLElement ? event.target : null;
      group = last?.parentElement ?? null;
    };

    const rescue = () => {
      queued = 0;
      // some browsers keep focus on a control after it is disabled; treat that the same way
      const current = document.activeElement;
      if (current instanceof HTMLElement && current !== el && el.contains(current)) {
        last = current;
        group = current.parentElement;
      }
      if (!last) return;
      const lost = !last.isConnected || (last as HTMLButtonElement).disabled === true;
      if (!lost) return;
      const active = document.activeElement;
      // only step in when focus really fell out (to the body), never when the user moved it
      if (active && active !== document.body && active !== last) return;
      const near = group?.isConnected ? group.querySelector<HTMLElement>(FOCUSABLE) : null;
      const target = near ?? el.querySelector<HTMLElement>(FOCUSABLE) ?? el;
      if (target === el && !el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
      last = target;
    };

    const observer = new MutationObserver(() => {
      if (!queued) queued = window.setTimeout(rescue, 0);
    });
    observer.observe(el, { subtree: true, childList: true, attributes: true, attributeFilter: ["disabled"] });
    el.addEventListener("focusin", onFocusIn);
    return () => {
      observer.disconnect();
      el.removeEventListener("focusin", onFocusIn);
      window.clearTimeout(queued);
    };
  }, [root]);
}
