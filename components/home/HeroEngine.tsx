"use client";

import { animate, createScope, onScroll } from "animejs";
import { useEffect } from "react";
import { heroEngineMotion, INTRO_SEEN_KEY } from "@/lib/anime";
import { BUILT, combine, INTRO, introPose, type IntroPose, parallax, PARTS, type PartId, type Pose, scrollPose, type ScrollPose } from "@/lib/engine-pose";
import { heroStart } from "@/lib/hero-state";
import { CENTER, layers, mountPoint, partCenter, project, RING, ringKeys, ringTicks, TAG_X, type Point } from "./engine";

const FIRST_YEAR = 2021;
const LAST_YEAR = 2026;
const IDLE_AFTER = 60_000;

/** Height each part pivots around, for depth parallax and scaling. */
const partZ: Record<PartId, number> = { frame: 0, local: -76, protocol: -38, ring: RING.z, core: -18, network: 0, privacy: 38, interface: 76 };

const r2 = (n: number) => Math.round(n * 100) / 100;

/** A part's pose applied to one of its points: scale about the part's centre, then move. */
function posePoint([x, y]: Point, pose: Pose, z: number): Point {
  const [cx, cy] = partCenter(z);
  return [cx + (x - cx) * pose.scale + pose.x, cy + (y - cy) * pose.scale + pose.y];
}

/**
 * The hero's choreography. The drawing (BuildEngine.tsx) is server rendered assembled; this
 * takes it apart and puts it back, and nothing else:
 *
 * 1. Opening (first visit in a session, ~2.8s): guides, frame, core, protocol ring, storage,
 *    network, interface, privacy shell, connectors, labels, then the headline's underline. The
 *    text is readable from the first frame; only the machine is built.
 * 2. Scroll (every visit): an engineering-manual exploded view with labels that stay attached,
 *    then the real projects, then reassembly as the hero hands over to the work.
 *
 * Both are pure poses (lib/engine-pose.ts) combined in one render function, so they never fight
 * over the same transform. With no JS or reduced motion nothing here runs and nothing is hidden.
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
    const svg = root?.querySelector<SVGSVGElement>(".eng");
    if (!root || !svg || start === "static") {
      finish();
      return;
    }

    const rig = createRig(root, svg);
    const engine = buildEngine(root, rig);
    const ignition = start === "ignite" ? ignite(rig, html) : null;
    if (!ignition) finish();
    const stopIdle = watchIdle(root, svg);

    return () => {
      ignition?.revert();
      engine.revert();
      stopIdle();
      rig.restore();
      for (const el of root.querySelectorAll<SVGElement>("[pathLength]")) {
        el.removeAttribute("pathLength");
        el.removeAttribute("stroke-dasharray");
        el.removeAttribute("stroke-dashoffset");
      }
      finish();
    };
  }, [rootId]);

  return null;
}

type Rig = ReturnType<typeof createRig>;

/** Finds every moving piece once and owns the only function that writes to them. */
function createRig(root: HTMLElement, svg: SVGSVGElement) {
  const q = <T extends Element>(selector: string) => [...svg.querySelectorAll<T>(selector)];
  const one = <T extends Element>(selector: string) => svg.querySelector<T>(selector);
  const machine = root.querySelector<HTMLElement>(".hero-machine");
  const underline = root.querySelector<SVGPathElement>(".hero-underline path");
  const cam = one<SVGGElement>(".eng-cam");
  const parts = Object.fromEntries(PARTS.map((id) => [id, one<SVGGElement>(`[data-part="${id}"]`)])) as Record<PartId, SVGGElement | null>;
  const ticks = one<SVGPathElement>(".eng-ring-ticks");
  const keys = one<SVGPathElement>(".eng-ring-keys");
  const rails = q<SVGPathElement>(".eng-rail");
  const mounts = q<SVGCircleElement>(".eng-mount");
  const bolts = q<SVGGElement>(".eng-bolt");
  const guideLines = q<SVGPathElement>(".eng-guide:not(.eng-axis):not([data-dashed])");
  const guideDashes = q<SVGPathElement>(".eng-axis, .eng-guide[data-dashed]");
  const tags = layers.map((layer) => {
    const el = one<SVGGElement>(`.eng-tag[data-layer="${layer.id}"]`);
    return {
      layer,
      el,
      leader: el?.querySelector<SVGPathElement>(".eng-leader") ?? null,
      pin: el?.querySelector<SVGCircleElement>(".eng-pin") ?? null,
      corner: project(layer.size, -layer.size, layer.z),
    };
  });
  const coreTag = one<SVGGElement>(".eng-tag-core");
  const notes = q<SVGTextElement>(".eng-note");
  const projects = q<SVGTextElement>(".eng-projects");
  const hot = q<SVGPathElement>(".eng-hot");

  // stroke drawing: a normalised length lets one number say how much of a line is drawn
  const drawn = [...guideLines, ...rails, ...tags.map((tag) => tag.leader).filter(Boolean), underline].filter(Boolean) as SVGPathElement[];
  for (const el of drawn) {
    el.setAttribute("pathLength", "1");
    el.setAttribute("stroke-dasharray", "1 1");
  }
  const draw = (el: SVGPathElement | null, amount: number) => el?.setAttribute("stroke-dashoffset", String(r2(1 - amount)));

  const written = new WeakMap<Element, string>();
  const write = (el: Element | null, attr: string, value: string) => {
    if (!el) return;
    const key = `${attr}=${value}`;
    if (written.get(el) === key) return;
    written.set(el, key);
    el.setAttribute(attr, value);
  };
  const opacity = (el: SVGElement | HTMLElement | null, value: number) => {
    if (el) el.style.opacity = value >= 0.999 ? "" : String(r2(value));
  };
  /** For elements that are hidden by default in CSS (notes, project lines, the routed path). */
  const reveal = (el: SVGElement | null, value: number) => {
    if (el) el.style.opacity = String(r2(value));
  };

  const state = {
    intro: BUILT as IntroPose,
    scroll: scrollPose(0) as ScrollPose,
    travel: 1,
    drawIntro: false,
  };

  function render() {
    const { intro, scroll, travel } = state;
    const alt = document.documentElement.classList.contains("engine-alt");
    const { camera } = scroll;

    // framing: a few degrees, a few percent, never a flight
    const camT = `translate(${r2(CENTER.x + camera.x)} ${CENTER.y}) rotate(${r2(camera.rotate)}) scale(${r2(camera.scale)}) translate(${-CENTER.x} ${-CENTER.y})`;
    write(cam, "transform", camT);
    const rad = (camera.rotate * Math.PI) / 180;
    const [cos, sin] = [Math.cos(rad), Math.sin(rad)];
    const viaCamera = ([x, y]: Point): Point => {
      const dx = x - CENTER.x;
      const dy = y - CENTER.y;
      return [CENTER.x + camera.x + camera.scale * (dx * cos - dy * sin), CENTER.y + camera.scale * (dx * sin + dy * cos)];
    };

    const poses = {} as Record<PartId, Pose>;
    for (const id of PARTS) {
      const pose = combine(intro.parts[id], id, scroll.explode, travel, alt);
      pose.x += parallax(camera.x, partZ[id]);
      poses[id] = pose;
      const el = parts[id];
      if (!el) continue;
      const [cx, cy] = partCenter(partZ[id]);
      const scale = r2(pose.scale) === 1 ? "" : ` translate(${cx} ${cy}) scale(${r2(pose.scale)}) translate(${-cx} ${-cy})`;
      write(el, "transform", `translate(${r2(pose.x)} ${r2(pose.y)})${scale}`);
      opacity(el, pose.opacity);
      el.style.setProperty("--flash", String(r2(pose.flash)));
    }
    write(ticks, "d", ringTicks(poses.ring.rotate));
    write(keys, "d", ringKeys(poses.ring.rotate));

    // rails stretch between the plates' moving mounts
    const mountAt = layers.map((layer) => viaCamera(posePoint(mountPoint(layer), poses[layer.id], layer.z)));
    mounts.forEach((mount, index) => {
      write(mount, "cx", String(r2(mountAt[index][0])));
      write(mount, "cy", String(r2(mountAt[index][1])));
      opacity(mount, poses[layers[index].id].opacity);
    });
    rails.forEach((rail, index) => {
      const [x0, y0] = mountAt[index];
      const [x1, y1] = mountAt[index + 1];
      write(rail, "d", `M${r2(x0)} ${r2(y0 + layers[index].thickness)}L${r2(x1)} ${r2(y1)}`);
      draw(rail, intro.rails);
    });

    // tags follow their plate up and down; the leader stretches to keep them attached
    tags.forEach(({ layer, el, leader, pin, corner }, index) => {
      if (!el) return;
      const [x, y] = viaCamera(posePoint(corner, poses[layer.id], layer.z));
      write(el, "transform", `translate(0 ${r2(y - corner[1])})`);
      write(leader, "d", `M${r2(x + 8)} ${corner[1]}H${TAG_X - 10}`);
      write(pin, "cx", String(r2(x + 8)));
      draw(leader, intro.tags[index]);
      opacity(el, intro.tags[index] * scroll.labels);
    });
    opacity(coreTag, intro.tags[layers.length] * scroll.labels);
    notes.forEach((note) => reveal(note, scroll.notes));
    projects.forEach((line) => reveal(line, scroll.projects));
    hot.forEach((line) => reveal(line, scroll.projects));

    // the bolt-collector variant: the frame's bolts back themselves out as the view explodes
    bolts.forEach((bolt, index) => {
      if (!alt || scroll.explode < 0.001) {
        write(bolt, "transform", "");
        return;
      }
      const [x, y] = [index === 1 || index === 2 ? 1 : -1, index > 1 ? 1 : -1];
      const box = bolt.querySelector("circle");
      const [bx, by] = [Number(box?.getAttribute("cx")), Number(box?.getAttribute("cy"))];
      const e = scroll.explode;
      write(bolt, "transform", `translate(${r2(x * 16 * e)} ${r2(y * 12 * e)}) rotate(${r2(e * 150)} ${bx} ${by})`);
    });

    guideLines.forEach((line) => draw(line, intro.guides));
    guideDashes.forEach((line) => opacity(line, intro.guides));
    if (state.drawIntro) draw(underline, intro.underline);

    if (machine) {
      const { scale, opacity: alpha, y } = scroll.machine;
      machine.style.transform = scale === 1 && y === 0 ? "" : `translateY(${r2(y)}%) scale(${r2(scale)})`;
      opacity(machine, alpha);
    }
  }

  /** Puts every attribute back exactly as the server rendered it. */
  function restore() {
    state.intro = BUILT;
    state.scroll = scrollPose(0);
    state.drawIntro = false;
    render();
    for (const el of [cam, ...Object.values(parts), ...tags.map((tag) => tag.el), ...bolts]) el?.removeAttribute("transform");
    for (const el of svg.querySelectorAll<SVGElement>("[style]")) el.removeAttribute("style");
    machine?.style.removeProperty("transform");
    machine?.style.removeProperty("opacity");
  }

  return { state, render, restore };
}

/** The timed opening: about 2.8s, once per session. Scrolling during it just works. */
function ignite(rig: Rig, html: HTMLElement) {
  try {
    window.sessionStorage.setItem(INTRO_SEEN_KEY, "1");
  } catch {
    // storage can be unavailable; the opening simply plays again next time
  }
  const clock = { t: 0 };
  return createScope().add(() => {
    rig.state.drawIntro = true;
    rig.state.intro = introPose(0, layers.length + 1);
    rig.render();
    html.classList.add("hero-ready");
    animate(clock, {
      t: [0, INTRO.total],
      duration: INTRO.total,
      ease: "linear",
      onUpdate: () => {
        rig.state.intro = introPose(clock.t, layers.length + 1);
        rig.render();
      },
      onComplete: () => {
        rig.state.intro = BUILT;
        rig.render();
        html.classList.add("intro-done");
      },
    });
    return () => {
      rig.state.intro = BUILT;
      rig.state.drawIntro = false;
    };
  });
}

/** Scroll position drives the exploded view. Rebuilt (not replayed) when the layout mode changes. */
function buildEngine(root: HTMLElement, rig: Rig) {
  return createScope({
    root,
    mediaQueries: {
      sticky: "(min-width: 1000px) and (min-height: 640px)",
      compact: "(max-width: 767px)",
    },
  }).add((scope) => {
    const sticky = Boolean(scope?.matches.sticky);
    rig.state.travel = scope?.matches.compact ? 0.6 : 1;
    const machine = root.querySelector<HTMLElement>(".hero-machine");
    const sequence = root.querySelector<HTMLElement>(".hero-sequence");
    const rail = root.querySelector<HTMLElement>(".hero-rail");
    const dot = root.querySelector<HTMLElement>(".rail-dot");
    if (!machine || !sequence) return;

    rail?.style.setProperty("--progress", "0");
    if (dot) dot.dataset.year = String(FIRST_YEAR);
    let year = FIRST_YEAR;
    const clock = { p: 0 };
    animate(clock, {
      p: [0, 1],
      duration: 1000,
      ease: "linear",
      autoplay: onScroll(
        sticky
          ? { target: sequence, enter: "top top", leave: "bottom bottom", sync: heroEngineMotion.scroll.smooth }
          : { target: machine, enter: "bottom top", leave: "top bottom", sync: heroEngineMotion.scroll.smooth },
      ),
      onUpdate: () => {
        rig.state.scroll = scrollPose(clock.p);
        rig.render();
        rail?.style.setProperty("--progress", String(r2(clock.p)));
        const current = FIRST_YEAR + Math.round(clock.p * (LAST_YEAR - FIRST_YEAR));
        if (dot && current !== year) {
          year = current;
          dot.dataset.year = String(current);
        }
      },
    });

    return () => {
      rig.state.scroll = scrollPose(0);
      rig.render();
      rail?.style.removeProperty("--progress");
      if (dot) dot.dataset.year = String(LAST_YEAR);
    };
  });
}

/**
 * After a minute without input, while the hero is on screen, one diagnostic line sweeps the
 * network plate and the core blinks. Any input stops it at once. CSS skips it for reduced motion.
 */
function watchIdle(root: HTMLElement, svg: SVGSVGElement) {
  let last = Date.now();
  let visible = true;
  const wake = () => {
    last = Date.now();
    if (svg.dataset.idle) delete svg.dataset.idle;
  };
  const events = ["pointermove", "pointerdown", "keydown", "scroll", "touchstart"] as const;
  for (const name of events) window.addEventListener(name, wake, { passive: true });
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible) wake();
  });
  observer.observe(root);
  const timer = window.setInterval(() => {
    if (visible && document.visibilityState === "visible" && Date.now() - last > IDLE_AFTER) svg.dataset.idle = "on";
  }, 5000);
  return () => {
    for (const name of events) window.removeEventListener(name, wake);
    observer.disconnect();
    window.clearInterval(timer);
    delete svg.dataset.idle;
  };
}
