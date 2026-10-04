"use client";

import { createDrawable, createScope, createTimeline, onScroll, stagger, utils } from "animejs";
import { useEffect } from "react";
import { animeEaseOut, heroEngineMotion, INTRO_SEEN_KEY } from "@/lib/anime";
import { heroStart } from "@/lib/hero-state";
import { layers } from "./engine";

const { intro: t, scroll: s } = heroEngineMotion;
/** Scroll fractions to positions on a 1000ms timeline that scroll position drives. */
const at = (fraction: number) => fraction * 1000;
const span = (from: number, to: number) => (to - from) * 1000;
const FIRST_YEAR = 2021;
const LAST_YEAR = 2026;

/**
 * The hero's choreography, owned entirely by Anime.js. Two independent parts:
 *
 * 1. Ignition (first visit in a session only, ~1.1s): meta, the drawing's construction lines,
 *    the headline words, lede, actions, underline. It sets the scene and never blocks scrolling.
 * 2. The build engine (every visit): scroll position drives one timeline that draws the machine,
 *    assembles it, tilts it, explodes it into labelled layers, connects real projects to those
 *    layers, then reassembles and lets the drawing recede as the hero releases.
 *
 * Each part animates different elements, and Motion never touches any of them. Server-rendered
 * HTML is the finished state, so with no JS or with reduced motion nothing here runs and nothing
 * is hidden. Repeat visits and background tabs skip the ignition but keep the scroll engine.
 */
export function HeroEngine({ rootId }: { rootId: string }) {
  useEffect(() => {
    const html = document.documentElement;
    const root = document.getElementById(rootId);
    const finish = () => html.classList.add("hero-ready", "intro-done");
    const start = heroStart({
      motionOk: html.classList.contains("motion-ok"),
      heroReady: html.classList.contains("hero-ready"),
      hidden: document.visibilityState === "hidden",
    });
    if (!root || start === "static") {
      finish();
      return;
    }

    const engine = buildEngine(root);
    const ignition = start === "ignite" ? ignite(root, html) : null;
    if (!ignition) finish();

    return () => {
      ignition?.revert();
      engine.revert();
      for (const el of root.querySelectorAll<SVGElement>("[pathLength]")) {
        el.removeAttribute("pathLength");
        el.removeAttribute("stroke-dasharray");
        el.removeAttribute("stroke-dashoffset");
        el.style.strokeLinecap = "";
      }
      finish();
    };
  }, [rootId]);

  return null;
}

/** The short timed opening: sets the scene in about a second, then leaves everything to scroll. */
function ignite(root: HTMLElement, html: HTMLElement) {
  try {
    window.sessionStorage.setItem(INTRO_SEEN_KEY, "1");
  } catch {
    // Storage can be unavailable; the ignition simply plays again next time.
  }

  return createScope({ root }).add(() => {
    const meta = root.querySelector<HTMLElement>("[data-hero='meta']");
    const lede = root.querySelector<HTMLElement>("[data-hero='lede']");
    const rail = root.querySelector<HTMLElement>("[data-hero='rail']");
    const words = root.querySelectorAll<HTMLElement>(".word-inner");
    const controls = root.querySelectorAll<HTMLElement>("[data-hero='actions'] > *");
    const [underline] = createDrawable(".hero-underline path");
    // Solid construction lines draw themselves; dashed ones (whose dashes a draw would erase) fade.
    const guideLines = createDrawable(".eng-guide:not(.eng-axis):not([data-dashed])");
    const guideDashes = root.querySelectorAll<SVGElement>(".eng-axis, .eng-guide[data-dashed]");
    const fading = [meta, lede, rail, ...controls, ...guideDashes].filter(Boolean) as Element[];

    // Hold the starting state inline, then drop the CSS holding class in the same frame.
    utils.set(words, { y: "110%" });
    utils.set(fading, { opacity: 0 });
    utils.set(underline, { draw: "0 0" });
    utils.set(guideLines, { draw: "0 0" });
    html.classList.add("hero-ready");

    createTimeline({ defaults: { ease: animeEaseOut }, onComplete: () => html.classList.add("intro-done") })
      .add(meta!, { opacity: [0, 1], y: [t.rise, 0], duration: t.metaDuration }, t.meta)
      .add(guideDashes, { opacity: [0, 1], duration: t.machineDuration }, t.machine)
      .add(guideLines, { draw: ["0 0", "0 1"], duration: t.machineDuration, ease: "inOut(2)", delay: stagger(40) }, t.machine)
      .add(words, { y: ["110%", "0%"], duration: t.wordDuration, ease: "outExpo", delay: stagger(t.wordStagger) }, t.words)
      .add(lede!, { opacity: [0, 1], y: [t.rise, 0], duration: t.ledeDuration }, t.lede)
      .add(controls, { opacity: [0, 1], y: [4, 0], duration: t.actionsDuration, delay: stagger(50) }, t.actions)
      .add(rail!, { opacity: [0, 1], duration: t.actionsDuration }, t.actions)
      .add(underline, { draw: ["0 0", "0 1"], duration: t.underlineDuration, ease: "inOut(2.2)" }, t.underline);
  });
}

/** The scroll-driven drawing. Rebuilt (not replayed) when the layout switches between modes. */
function buildEngine(root: HTMLElement) {
  return createScope({
    root,
    mediaQueries: {
      sticky: "(min-width: 1000px) and (min-height: 640px)",
      compact: "(max-width: 767px)",
    },
  }).add((scope) => {
    const sticky = Boolean(scope?.matches.sticky);
    const compact = Boolean(scope?.matches.compact);
    const svg = root.querySelector<SVGSVGElement>(".eng");
    const machine = root.querySelector<HTMLElement>(".hero-machine");
    const sequence = root.querySelector<HTMLElement>(".hero-sequence");
    const rail = root.querySelector<HTMLElement>(".hero-rail");
    const dot = root.querySelector<HTMLElement>(".rail-dot");
    if (!svg || !machine || !sequence) return;

    const q = <T extends Element = SVGElement>(selector: string) => [...svg.querySelectorAll<T>(selector)];
    const lines = createDrawable(q(".eng-body .eng-line:not(.eng-dashed)"));
    const details = createDrawable(q(".eng-body .eng-detail:not(.eng-dashed)"));
    const leaders = createDrawable(q(".eng-leader"));
    const dashed = q(".eng-body .eng-dashed");
    const faces = q(".eng-face");
    const labels = q(".eng-label");
    const pins = q(".eng-pin");
    const notes = q(".eng-note");
    const projects = q(".eng-projects");
    const hot = q(".eng-hot");
    const guides = svg.querySelector(".eng-guides")!;
    const body = svg.querySelector(".eng-body")!;
    const travel = compact ? 0.6 : 1;

    const parts = layers.map((layer) => ({
      layer,
      group: svg.querySelector(`.eng-layer[data-layer="${layer.id}"]`)!,
      plate: svg.querySelector(`.eng-layer[data-layer="${layer.id}"] .eng-plate`)!,
      tag: svg.querySelector(`.eng-tag[data-layer="${layer.id}"]`)!,
    }));

    // Progress 0: faint construction lines only. The machine is not drawn yet.
    utils.set([...lines, ...details, ...leaders], { draw: "0 0" });
    utils.set([...dashed, ...faces, ...labels, ...pins, ...notes, ...projects, ...hot], { opacity: 0 });
    utils.set(guides, { opacity: 0.55 });
    for (const { layer, group, plate, tag } of parts) {
      const from = { translateX: layer.from.x * travel, translateY: -layer.from.z * travel };
      utils.set([group, tag], from);
      if (layer.from.rotate) utils.set(plate, { rotate: layer.from.rotate });
    }

    rail?.style.setProperty("--progress", "0");
    if (dot) dot.dataset.year = String(FIRST_YEAR);
    let year = FIRST_YEAR;
    const tl = createTimeline({
      defaults: { ease: "inOut(2)" },
      autoplay: onScroll(
        sticky
          ? { target: sequence, enter: "top top", leave: "bottom bottom", sync: s.smooth }
          : { target: machine, enter: "bottom top", leave: "top bottom", sync: s.smooth },
      ),
      onUpdate: (self) => {
        rail?.style.setProperty("--progress", String(self.progress));
        const current = FIRST_YEAR + Math.round(self.progress * (LAST_YEAR - FIRST_YEAR));
        if (dot && current !== year) {
          year = current;
          dot.dataset.year = String(current);
        }
      },
    });

    // 1. The outline constructs itself, then the detail; layer names arrive one by one.
    tl.add(lines, { draw: ["0 0", "0 1"], duration: span(s.drawStart, s.drawEnd), ease: "linear", delay: stagger(3) }, at(s.drawStart))
      .add(details, { draw: ["0 0", "0 1"], duration: span(s.drawStart + 0.06, s.detailEnd) - 120, ease: "linear", delay: stagger(1.5) }, at(s.drawStart + 0.06))
      .add(faces, { opacity: [0, 1], duration: span(0.2, 0.32), ease: "linear" }, at(0.2))
      .add([...labels, ...pins], { opacity: [0, 1], duration: 60, ease: "linear", delay: stagger(18) }, at(s.drawStart + 0.02))
      .add(leaders, { draw: ["0 0", "0 1"], duration: 60, ease: "linear", delay: stagger(18) }, at(s.drawStart + 0.02));

    // 2. Layers slide into the assembly; privacy closes over it as a thin shell.
    for (const { layer, group, plate, tag } of parts) {
      tl.add([group, tag], {
        translateX: [layer.from.x * travel, 0],
        translateY: [-layer.from.z * travel, 0],
        duration: span(s.assemblyStart, s.assemblyEnd),
      }, at(s.assemblyStart));
      if (layer.from.rotate) {
        tl.add(plate, { rotate: [layer.from.rotate, 0], duration: span(s.assemblyStart, s.assemblyEnd) }, at(s.assemblyStart));
      }
    }
    tl.add(dashed, { opacity: [0, 1], duration: span(s.assemblyStart, s.assemblyEnd), ease: "linear" }, at(s.assemblyStart))
      .add(guides, { opacity: [0.55, 0.3], duration: span(s.assemblyStart, s.assemblyEnd), ease: "linear" }, at(s.assemblyStart));

    // 3. The headline's moment: the drawing tilts a few degrees and its labels step back.
    tl.add(body, { rotate: [0, compact ? 0 : s.tilt], duration: span(s.assemblyEnd, s.emphasisEnd) }, at(s.assemblyEnd))
      .add(labels, { opacity: [1, 0.55], duration: span(s.assemblyEnd, s.emphasisEnd), ease: "linear" }, at(s.assemblyEnd));

    // 4. Exploded view: layers separate around the core, short annotations appear.
    for (const { layer, group, tag } of parts) {
      tl.add([group, tag], {
        translateX: [0, layer.explode.x * travel],
        translateY: [0, -layer.explode.z * travel],
        duration: span(s.explodeStart, s.explodeEnd),
      }, at(s.explodeStart));
    }
    tl.add(body, { rotate: [compact ? 0 : s.tilt, 0], duration: span(s.explodeStart, s.explodeStart + 0.08) }, at(s.explodeStart))
      .add(labels, { opacity: [0.55, 1], duration: span(s.explodeStart, s.explodeStart + 0.06), ease: "linear" }, at(s.explodeStart))
      .add(notes, { opacity: [0, 1], duration: 60, ease: "linear", delay: stagger(12) }, at(s.explodeStart + 0.02));

    // 5. The real projects attach to the layers they lean on. Metaphor, not architecture.
    tl.add(notes, { opacity: [1, 0], duration: 40, ease: "linear" }, at(s.projectsStart))
      .add(projects, { opacity: [0, 1], duration: 50, ease: "linear", delay: stagger(10) }, at(s.projectsStart + 0.03))
      .add(hot, { opacity: [0, 1], duration: 70, ease: "linear" }, at(s.projectsStart + 0.03));

    // 6. Reassemble and recede: the drawing becomes background as the work takes over.
    tl.add([...projects, ...hot], { opacity: [1, 0], duration: 60, ease: "linear" }, at(s.exitStart + 0.01));
    for (const { layer, group, tag } of parts) {
      tl.add([group, tag], {
        translateX: [layer.explode.x * travel, 0],
        translateY: [-layer.explode.z * travel, 0],
        duration: span(s.exitStart, 0.96),
      }, at(s.exitStart));
    }
    tl.add([...labels, ...pins], { opacity: [1, 0], duration: 80, ease: "linear" }, at(s.exitStart + 0.02))
      .add(leaders, { draw: ["0 1", "1 1"], duration: 80, ease: "linear" }, at(s.exitStart + 0.02))
      .add(machine, {
        scale: [1, s.exitScale],
        translateY: ["0%", "-4%"],
        opacity: [1, s.exitOpacity],
        duration: span(s.exitStart + 0.03, 1),
        ease: "linear",
      }, at(s.exitStart + 0.03));

    return () => {
      rail?.style.removeProperty("--progress");
      if (dot) dot.dataset.year = String(LAST_YEAR);
    };
  });
}
