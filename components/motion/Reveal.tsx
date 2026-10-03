"use client";

import { useAnimate } from "motion/react-mini";
import { type ReactNode, useEffect } from "react";
import { duration, easeOut } from "@/lib/motion";

/**
 * Scroll reveal that never hides server-rendered content up front.
 * Content is visible in the static HTML. After hydration, only blocks that are still below the
 * fold are lowered and faded, then settle in when they enter the viewport. Uses Motion's WAAPI
 * `useAnimate` (react-mini) so the animation runs off the main thread.
 */
export function Reveal({
  children,
  className,
  id,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  delay?: number;
}) {
  const [scope, animate] = useAnimate<HTMLDivElement>();

  useEffect(() => {
    const element = scope.current;
    if (!element) return;
    if (!document.documentElement.classList.contains("motion-ok")) return;
    if (element.getBoundingClientRect().top < window.innerHeight * 0.92) return;

    animate(element, { opacity: 0, transform: "translateY(14px)" }, { duration: 0 });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        animate(
          element,
          { opacity: 1, transform: "translateY(0px)" },
          { duration: duration.slow, ease: [...easeOut], delay },
        );
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [animate, scope, delay]);

  return (
    <div ref={scope} id={id} className={className}>
      {children}
    </div>
  );
}
