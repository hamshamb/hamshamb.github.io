"use client";

import { animate, createTimeline, stagger, type Timeline, utils } from "animejs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parts } from "./envelope-fields";
import { envelopeModel } from "./envelope-model";
import {
  COMPACT_LABELS,
  explodedPose,
  fieldPieces,
  initialView,
  labels as makeLabels,
  type PieceId,
  PIECES,
  rest,
  ROUTE_STOPS,
  SIZE,
  type Stage,
  stageCaption,
  stageEnd,
  STAGES,
  TILES,
} from "./envelope-parts";
import type { Anchor, EnvelopeHandle, Rig } from "./envelope3d";
import { useLazyScene } from "./useScene";

const model = envelopeModel(parts);
const bytesOf = (id: string) => Number.parseInt(parts.find((part) => part.id === id)?.bytes ?? "0", 10);
const LABELS = makeLabels({ header: model.headerBytes, key: bytesOf("eph"), nonce: bytesOf("nonce"), sender: model.sealedFixedBytes });
const PHONE_NAMES = ["sender", "relay a", "relay b", "recipient"];
const PHONE_X = [-4.6, -1.55, 1.55, 4.6];
/** Keyframes from the current value: kf(1.2, 0) overshoots to 1.2 and settles at 0. */
const kf = (total: number, ...values: number[]) => values.map((to) => ({ to, duration: total / values.length }));

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** What the camera frames. The letter out of the envelope needs room above it; relay needs width. */
const VIEWS = {
  closed: { y: -0.05, w: 5.4, h: 3.5 },
  exploded: { y: -0.4, w: 8.2, h: 6.7 },
  letter: { y: 1.7, w: 5.2, h: 7.0 },
  relay: { y: -1.35, w: 11.6, h: 5.6 },
} as const;
const COMPACT_VIEWS = { ...VIEWS, exploded: { y: -0.3, w: 6.6, h: 6.4 }, relay: { y: -1.35, w: 11, h: 7 } };

/** Rough world height of each piece, for nudging the framing toward a selection. */
const pieceY: Partial<Record<PieceId, number>> = {
  header: SIZE.header.y, key: SIZE.key.y, nonce: SIZE.nonce.y, letter: 0, sender: 1.5, message: 0.2, padding: -1.2,
  ...Object.fromEntries(TILES.map((tile) => [tile.id, SIZE.header.y])),
};

/**
 * Rivet's sealed envelope as a physical object that comes apart. three.js (envelope3d.ts) renders
 * it; Anime.js owns every movement here: each piece has its own start, end, delay, duration and
 * easing, so nothing moves as one block. Pack, seal, relay and open are stories told with the same
 * pieces. The field list beside it (EnvelopeExplorer) stays the complete, accessible explanation.
 */
export function EnvelopeFigure({
  selected,
  hovered,
  engaged,
  onSelect,
  onHover,
}: {
  selected: string;
  hovered: string | null;
  engaged: boolean;
  onSelect: (field: string) => void;
  onHover: (field: string | null) => void;
}) {
  const [stage, setStage] = useState<Stage>("seal");
  const [exploded, setExploded] = useState(false);
  const [compact, setCompact] = useState(false);
  const [busy, setBusy] = useState(false);
  const labelRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const lineRefs = useRef<Record<string, SVGLineElement | null>>({});
  const stageRef = useRef<HTMLDivElement>(null);
  const events = useRef({ onSelect, onHover });
  useEffect(() => {
    events.current = { onSelect, onHover };
  });

  const { hostRef, status, handle } = useLazyScene<EnvelopeHandle>(async (host, lost) => {
    const { createEnvelopeScene } = await import("./envelope3d");
    return createEnvelopeScene(host, {
      hover: (field) => events.current.onHover(field),
      select: (field) => events.current.onSelect(field),
      drag: (active) => dragging.current(active),
      project: (anchors) => place.current(anchors),
      lost,
    });
  });

  /* ------------------------------------------------------------ labels --- */

  const shownLabels = useMemo(() => {
    const focus = new Set(engaged ? fieldPieces[selected] ?? [] : []);
    let ids: PieceId[] = [];
    if (exploded) ids = LABELS.map((label) => label.piece);
    else if (stage === "pack") ids = ["sender", "message", "padding"];
    else if (stage === "seal") ids = ["header", "key", "nonce"];
    else if (stage === "open") ids = ["message", "padding"];
    if (compact) ids = ids.filter((id) => COMPACT_LABELS.includes(id) || focus.has(id));
    for (const id of focus) if (LABELS.some((label) => label.piece === id) && !ids.includes(id)) ids.push(id);
    return LABELS.filter((label) => ids.includes(label.piece));
  }, [compact, engaged, exploded, selected, stage]);

  const place = useRef<(anchors: Record<string, Anchor>) => void>(() => {});
  place.current = (anchors) => {
    const box = stageRef.current?.getBoundingClientRect();
    if (!box) return;
    const reach = compact ? 54 : 92;
    for (const label of LABELS) {
      const el = labelRefs.current[label.piece];
      const line = lineRefs.current[label.piece];
      const anchor = anchors[label.piece];
      if (!el || !line || !anchor) continue;
      const lx = Math.max(8, Math.min(box.width - el.offsetWidth - 8, anchor.x + label.dx * reach - (label.dx < 0 ? el.offsetWidth : 0)));
      const ly = Math.max(8, Math.min(box.height - el.offsetHeight - 8, anchor.y + label.dy * reach * 0.7 - el.offsetHeight / 2));
      el.style.transform = `translate3d(${lx.toFixed(1)}px, ${ly.toFixed(1)}px, 0)`;
      const ex = label.dx < 0 ? lx + el.offsetWidth : lx;
      line.setAttribute("x1", anchor.x.toFixed(1));
      line.setAttribute("y1", anchor.y.toFixed(1));
      line.setAttribute("x2", ex.toFixed(1));
      line.setAttribute("y2", (ly + el.offsetHeight / 2).toFixed(1));
    }
    PHONE_NAMES.forEach((_, i) => {
      const el = labelRefs.current[`phone:${i}`];
      const anchor = anchors[`phone:${i}`];
      if (el && anchor) el.style.transform = `translate3d(${anchor.x.toFixed(1)}px, ${anchor.y.toFixed(1)}px, 0) translate(-50%, 0)`;
    });
  };

  // leader lines draw in whenever the set of labels changes
  useEffect(() => {
    if (status !== "ready") return;
    const lines = shownLabels.map((label) => lineRefs.current[label.piece]).filter(Boolean) as SVGLineElement[];
    if (!lines.length || reducedMotion()) return;
    const anim = animate(lines, { strokeDashoffset: [1, 0], duration: 520, delay: stagger(70, { start: 120 }), ease: "out(3)" });
    return () => {
      anim.pause();
    };
  }, [shownLabels, status]);

  /* ---------------------------------------------------- choreography --- */

  const running = useRef<(Timeline | { pause(): unknown })[]>([]);
  const stop = () => {
    for (const anim of running.current) anim.pause();
    running.current = [];
  };
  const idle = useRef<{ pause(): unknown; resume(): unknown } | null>(null);
  const dragging = useRef<(active: boolean) => void>(() => {});

  /** Every piece back to rest (or exploded), each on its own delay, never as one block. */
  const piecesTo = useCallback((tl: Timeline, rig: Rig, open: boolean, at: number) => {
    const order: PieceId[] = open
      ? ["flap", "seal", "header", "tile-magic", "tile-id", "tile-time", "tile-hops", "tile-length", "key", "nonce", "letter", "sender", "message", "padding"]
      : ["padding", "message", "sender", "letter", "nonce", "key", "tile-length", "tile-hops", "tile-time", "tile-id", "tile-magic", "header", "seal", "flap"];
    order.forEach((id, i) => {
      const goal = open ? explodedPose(id, compact) : rest();
      const tile = id.startsWith("tile-");
      tl.add(rig.pieces[id], { ...goal, duration: tile ? 720 : 980, ease: tile ? "out(4)" : "inOut(3)" }, at + i * (tile ? 55 : 85));
    });
    tl.add(rig, { layersOut: open ? 1 : 0, duration: 700, ease: "inOut(2)" }, at + (open ? 640 : 0));
  }, [compact]);

  const views = compact ? COMPACT_VIEWS : VIEWS;

  /** The finished state of a stage, set at once: reduced motion, and the start point of a rewind. */
  const snap = useCallback((rig: Rig, target: Stage, open: boolean) => {
    const { cipher, ...scalars } = stageEnd(target);
    utils.set(rig.s, scalars);
    utils.set(rig.s.cipher, cipher);
    for (const id of PIECES) utils.set(rig.pieces[id], open && target !== "relay" ? explodedPose(id, compact) : rest());
    rig.layersOut = open ? 1 : 0;
    rig.env = target === "relay" ? { x: PHONE_X[3], y: -1.35, z: 0, s: 0.34 } : { x: 0, y: 0, z: 0, s: 1 };
    rig.reading = -1;
    rig.meet = { show: 0, dup: 0, send: 0 };
    rig.view = { ...(open ? views.exploded : target === "relay" ? views.relay : target === "seal" ? views.closed : views.letter) };
    handle?.setHops(scalars.hops);
    handle?.invalidate();
  }, [compact, handle, views]);

  /** The full opening: build the envelope piece by piece, pack the letter, seal it. */
  const intro = useCallback((rig: Rig) => {
    stop();
    const inv = () => handle?.invalidate();
    // starting positions: everything away from where it belongs, each from its own direction
    const from: Partial<Record<PieceId, Partial<Rig["pieces"][PieceId]>>> = {
      shell: { s: 0.86, o: 0 }, flap: { o: 0 }, seal: { s: 0.2, o: 0 },
      header: { y: 1.3, z: 1.6, rx: -0.4, o: 0 },
      "tile-magic": { x: -0.9, o: 0 }, "tile-id": { x: -1.4, z: 0.3, o: 0 }, "tile-time": { y: 0.8, o: 0 },
      "tile-hops": { z: 0.9, s: 1.35, o: 0 }, "tile-length": { x: 0.9, o: 0 },
      key: { z: 3.2, ry: 0.9, rz: 0.3, o: 0 }, nonce: { x: 1.8, rz: -0.4, o: 0 },
      letter: { o: 0, y: 0.6 }, sender: { y: 1.1, o: 0 }, message: { x: -0.8, o: 0 }, padding: { s: 0.3, o: 0 },
    };
    for (const id of PIECES) utils.set(rig.pieces[id], { ...rest(), lit: 0, ...from[id] });
    utils.set(rig.s, { fold: 0, inside: 0, flap: 1, seal: 0, read: 0, hops: 0, phones: 0, route: 0, apart: 0 });
    utils.set(rig.s.cipher, { sender: 0, message: 0, padding: 0 });
    rig.env = { x: 0, y: 0, z: 0, s: 1 };
    rig.layersOut = 0;
    rig.wash = -1;
    utils.set(rig.view, views.letter);
    utils.set(rig.orbit, { yaw: 0.16, pitch: -0.04 });
    handle?.setHops(0);
    setStage("seal");
    setExploded(false);

    const tl = createTimeline({ defaults: { ease: "out(3)" }, onUpdate: inv, onComplete: () => setBusy(false) });
    setBusy(true);
    const p = rig.pieces;
    tl
      // 1. the empty shell
      .add(p.shell, { s: 1, o: 1, duration: 700, ease: "out(4)" }, 0)
      .add(p.flap, { o: 1, duration: 500 }, 200)
      // 2 to 6. the header and its tiles, one at a time
      .add(p.header, { y: 0, z: 0, rx: 0, o: 1, duration: 760, ease: "inOut(3)" }, 450)
      .add(p["tile-magic"], { x: 0, o: 1, duration: 420 }, 1050)
      .add(p["tile-id"], { x: 0, z: 0, o: 1, duration: 560, ease: "inOut(3)" }, 1180)
      .add(p["tile-time"], { y: 0, o: 1, duration: 460 }, 1380)
      .add(p["tile-hops"], { z: 0, s: 1, o: 1, duration: 380, ease: "out(5)" }, 1540)
      .add(p["tile-length"], { x: 0, o: 1, duration: 420 }, 1660)
      // 7, 8. the key from depth, the nonce sliding beneath it
      .add(p.key, { z: 0, ry: 0, rz: 0, o: 1, duration: 900, ease: "inOut(3)" }, 1700)
      .add(p.nonce, { x: 0, rz: 0, o: 1, duration: 700, ease: "inOut(3)" }, 1950)
      // 9 to 11. the letter: sender block, message, then padding filling the sheet
      .add(p.letter, { o: 1, y: 0, duration: 600 }, 2300)
      .add(p.sender, { y: 0, o: 1, duration: 560 }, 2600)
      .add(p.message, { x: 0, o: 1, duration: 620 }, 2850)
      .add(p.padding, { s: 1, o: 1, duration: 720, ease: "inOut(3)" }, 3150);
    sealSequence(tl, rig, 3900);
    tl.add(rig.orbit, { yaw: 0, pitch: 0, duration: 1100, ease: "inOut(2)" }, 3900 + 4300);
    running.current.push(tl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle, views]);

  /** Encrypt, fold, slide in, close, seal. Shared by the opening and the SEAL tab. */
  function sealSequence(tl: Timeline, rig: Rig, at: number) {
    const s = rig.s;
    tl
      // the encryption sweeps down the sheet, layer by layer
      .add(rig, { wash: [0, 1], duration: 1100, ease: "inOut(2)" }, at)
      .add(s.cipher, { sender: 1, duration: 420 }, at + 120)
      .add(s.cipher, { message: 1, duration: 520 }, at + 380)
      .add(s.cipher, { padding: 1, duration: 420 }, at + 760)
      .call(() => { rig.wash = -1; }, at + 1150)
      // fold in three, then down into the envelope
      .add(s, { fold: 1, duration: 900, ease: "inOut(3)" }, at + 1200)
      .add(s, { inside: 1, duration: 950, ease: "inOut(3)" }, at + 2050)
      .add(rig.view, { ...views.closed, duration: 1200, ease: "inOut(3)" }, at + 2000)
      // close the flap, lock the seal
      .add(s, { flap: 0, duration: 760, ease: "inOut(3)" }, at + 2900)
      .add(rig.pieces.seal, { s: 1, o: 1, duration: 240 }, at + 3560)
      .add(s, { seal: kf(520, 1.14, 1), ease: "out(3)" }, at + 3600);
  }

  /** Back to the sealed envelope at the centre, quickly, from wherever things are. */
  function homeSealed(tl: Timeline, rig: Rig, at: number, pieces = true) {
    tl.add(rig.env, { x: 0, y: 0, z: 0, s: 1, duration: 800, ease: "inOut(3)" }, at)
      .add(rig.s, { phones: 0, read: 0, duration: 400 }, at)
      .add(rig.meet, { show: 0, duration: 200 }, at);
    if (pieces) piecesTo(tl, rig, false, at);
  }

  const play = useCallback((target: Stage, open: boolean) => {
    const rig = handle?.rig;
    if (!rig) return;
    stop();
    setStage(target);
    setExploded(open);
    if (reducedMotion()) {
      snap(rig, target, open);
      return;
    }
    const inv = () => handle?.invalidate();
    const tl = createTimeline({ defaults: { ease: "out(3)" }, onUpdate: inv, onComplete: () => setBusy(false) });
    setBusy(true);
    const s = rig.s;

    if (open) {
      // explode: the sealed envelope taken apart, piece by piece
      homeSealed(tl, rig, 0, false);
      tl.add(s, { fold: 1, inside: 1, flap: 0, seal: 1, apart: 0, duration: 500 }, 0)
        .add(s.cipher, { sender: 1, message: 1, padding: 1, duration: 400 }, 0);
      piecesTo(tl, rig, true, 350);
      tl.add(rig.view, { ...views.exploded, duration: 1300, ease: "inOut(3)" }, 250);
      running.current.push(tl);
      return;
    }

    if (target === "pack") {
      homeSealed(tl, rig, 0);
      tl.add(s, { seal: 0, duration: 300 }, 300)
        .add(s, { flap: 1, duration: 600, ease: "inOut(3)" }, 550)
        .add(s, { inside: 0, duration: 900, ease: "inOut(3)" }, 1050)
        .add(rig.view, { ...views.letter, duration: 1100, ease: "inOut(3)" }, 950)
        .add(s, { fold: 0, duration: 800, ease: "inOut(3)" }, 1900)
        .add(s.cipher, { sender: 0, message: 0, padding: 0, duration: 500 }, 2500)
        // then the layers again, one by one: sender, message, padding filling to the bucket
        .add(rig.pieces.sender, { y: [0.9, 0], o: [0, 1], duration: 560 }, 3100)
        .add(rig.pieces.message, { x: [-0.8, 0], o: [0, 1], duration: 620 }, 3400)
        .add(rig.pieces.padding, { s: [0.3, 1], o: [0, 1], duration: 760, ease: "inOut(3)" }, 3750);
    }

    if (target === "seal") {
      // from wherever we are, back to an open, readable letter first (quickly), then seal it
      homeSealed(tl, rig, 0);
      tl.add(s, { seal: 0, flap: 1, inside: 0, fold: 0, apart: 0, duration: 700, ease: "inOut(2)" }, 0)
        .add(s.cipher, { sender: 0, message: 0, padding: 0, duration: 400 }, 300)
        .add(rig.view, { ...views.letter, duration: 800, ease: "inOut(3)" }, 0)
        // the key and the nonce come off and go back on, from depth
        .add(rig.pieces.key, { z: [2.4, 0], ry: [0.7, 0], duration: 900, ease: "inOut(3)" }, 2300)
        .add(rig.pieces.nonce, { x: [1.6, 0], duration: 700, ease: "inOut(3)" }, 2500)
        .add(rig.pieces.header, { y: [1.1, 0], z: [1.2, 0], duration: 820, ease: "inOut(3)" }, 2700);
      sealSequence(tl, rig, 900);
    }

    if (target === "relay") {
      homeSealed(tl, rig, 0);
      tl.add(s, { fold: 1, inside: 1, flap: 0, seal: 1, apart: 0, duration: 500 }, 0)
        .add(s.cipher, { sender: 1, message: 1, padding: 1, duration: 400 }, 0)
        .add(rig.view, { ...views.relay, duration: 1100, ease: "inOut(3)" }, 300)
        .add(s, { phones: 1, duration: 600 }, 500)
        .add(rig.env, { x: PHONE_X[0], y: -1.35, s: 0.34, duration: 900, ease: "inOut(3)" }, 450)
        .call(() => handle?.setHops(0), 450);
      let t = 1600;
      for (let hop = 1; hop <= ROUTE_STOPS; hop += 1) {
        if (hop === 2) {
          // two relays meet: ids first, duplicates bounce back, only the missing envelope moves
          tl.add(rig.meet, { show: 1, duration: 300 }, t)
            .add(rig.meet, { dup: kf(1100, 1, 0), ease: "inOut(2)" }, t + 200)
            .add(rig.meet, { send: [0, 1], duration: 900, ease: "inOut(3)" }, t + 700)
            .add(rig.meet, { show: 0, duration: 300 }, t + 1700);
          t += 1900;
        }
        const x = PHONE_X[hop];
        tl.add(rig.env, { x, duration: 1000, ease: "inOut(3)" }, t)
          .add(rig.env, { y: kf(1000, -0.7, -1.75, -1.35), ease: "inOut(2)" }, t)
          .call(() => {
            rig.reading = hop;
            handle?.setHops(hop);
          }, t + 760)
          // only the header lights as the phone reads it; the sealed letter stays dark
          .add(s, { read: kf(900, 1, 0.15), ease: "out(2)" }, t + 760)
          .add(rig.pieces["tile-hops"], { z: [0.35, 0], s: [1.25, 1], duration: 420, ease: "out(4)" }, t + 760)
          .call(() => { rig.reading = -1; }, t + 1700);
        t += 1900;
      }
    }

    if (target === "open") {
      homeSealed(tl, rig, 0);
      tl.add(s, { fold: 1, inside: 1, flap: 0, seal: 1, duration: 400 }, 0)
        .add(s.cipher, { sender: 1, message: 1, padding: 1, duration: 300 }, 0)
        .add(rig.view, { ...views.closed, duration: 700, ease: "inOut(3)" }, 0)
        // the recipient: the header still reads, then its key meets the seal
        .add(s, { read: kf(900, 0.8, 0) }, 700)
        .add(rig.pieces.key, { lit: kf(900, 1, 0) }, 1300)
        .add(s, { seal: kf(620, 1.2, 0), ease: "inOut(3)" }, 1900)
        .add(s, { flap: 1, duration: 760, ease: "inOut(3)" }, 2450)
        .add(rig.pieces.key, { x: -1.6, z: 0.6, ry: 0.4, duration: 800, ease: "inOut(3)" }, 2900)
        .add(rig.pieces.nonce, { x: 1.5, z: 0.4, rz: -0.2, duration: 800, ease: "inOut(3)" }, 3000)
        .add(s, { inside: 0, duration: 1000, ease: "inOut(3)" }, 3200)
        .add(rig.view, { ...views.letter, duration: 1200, ease: "inOut(3)" }, 3100)
        .add(s, { fold: 0, duration: 900, ease: "inOut(3)" }, 4200)
        .add(rig, { wash: [1, 0], duration: 1000, ease: "inOut(2)" }, 5000)
        .add(s.cipher, { padding: 0, duration: 380 }, 5150)
        .add(s.cipher, { message: 0, duration: 520 }, 5350)
        .add(s.cipher, { sender: 0, duration: 380 }, 5700)
        .call(() => { rig.wash = -1; }, 6050)
        .add(s, { apart: 1, duration: 900, ease: "inOut(3)" }, 6200);
    }
    running.current.push(tl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle, piecesTo, snap, views]);

  /* ------------------------------------------------- start and idle --- */

  const started = useRef(false);
  useEffect(() => {
    const host = hostRef.current;
    const rig = handle?.rig;
    if (!host || !rig || status !== "ready") return;
    const first = initialView(reducedMotion());
    if (reducedMotion()) {
      // reduced motion: the envelope already taken apart, nothing moves to get there
      snap(rig, first.stage, first.exploded);
      const timer = window.setTimeout(() => setExploded(first.exploded), 0);
      return () => window.clearTimeout(timer);
    }
    snap(rig, "seal", false);
    const seen = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || started.current) return;
      started.current = true;
      intro(rig);
    }, { threshold: 0.35 });
    seen.observe(host);

    // a very slow sway while nothing else is happening; dragging pauses it and springs back after
    const sway = animate(rig, { idle: [-1, 1], duration: 4200, ease: "inOut(2)", loop: true, alternate: true, onUpdate: () => handle.invalidate() });
    idle.current = sway;
    dragging.current = (active) => {
      if (active) {
        sway.pause();
        return;
      }
      animate(rig.orbit, { yaw: 0, pitch: 0, duration: 1100, ease: "out(4)", onUpdate: () => handle.invalidate(), onComplete: () => sway.resume() });
    };
    const visible = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) sway.resume();
      else sway.pause();
    });
    visible.observe(host);
    return () => {
      seen.disconnect();
      visible.disconnect();
      sway.pause();
      stop();
    };
  }, [handle, hostRef, intro, snap, status]);

  // the selected or hovered field: its piece comes forward, the rest step back, the framing leans in
  useEffect(() => {
    const rig = handle?.rig;
    if (!rig) return;
    const focusField = hovered ?? (engaged ? selected : null);
    const focus = new Set(focusField ? fieldPieces[focusField] ?? [] : []);
    const quick = reducedMotion() ? 0 : 420;
    const anims = PIECES.map((id) => animate(rig.pieces[id], { lit: focus.has(id) ? 1 : 0, z: focus.has(id) && exploded ? explodedPose(id, compact).z + 0.3 : rig.pieces[id].z, duration: quick, ease: "out(3)", onUpdate: () => handle.invalidate() }));
    anims.push(animate(rig, { dim: focus.size ? (hovered ? 0.6 : 1) : 0, duration: quick, ease: "out(3)", onUpdate: () => handle.invalidate() }));
    const target = [...focus][0];
    if (target && exploded) {
      const base = (compact ? COMPACT_VIEWS : VIEWS).exploded.y;
      const lean = (pieceY[target] ?? 0) + explodedPose(target, compact).y;
      anims.push(animate(rig.view, { y: base + (lean - base) * 0.15, duration: quick, ease: "out(3)", onUpdate: () => handle.invalidate() }));
    }
    return () => anims.forEach((anim) => anim.pause());
  }, [compact, engaged, exploded, handle, hovered, selected]);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 640px)");
    const sync = () => setCompact(query.matches);
    const timer = window.setTimeout(sync, 0);
    query.addEventListener("change", sync);
    return () => {
      window.clearTimeout(timer);
      query.removeEventListener("change", sync);
    };
  }, []);

  const ready = status === "ready";
  const focusField = hovered ?? (engaged ? selected : null);
  const focusPieces = new Set(focusField ? fieldPieces[focusField] ?? [] : []);

  return (
    <div className="envx" data-status={status} data-stage={stage} data-exploded={exploded || undefined}>
      <div className="envx-top">
        <div className="envx-title">
          <p className="mono envx-kicker">conceptual visualization · fields from the protocol notes</p>
          <p className="envx-stage-name">{exploded ? "taken apart" : stage}</p>
        </div>
        <div className="envx-controls">
          <div className="envx-tabs" role="radiogroup" aria-label="Show the envelope being">
            {STAGES.map((item) => (
              <button key={item} type="button" role="radio" aria-checked={!exploded && stage === item} disabled={!ready} onClick={() => play(item, false)}>
                {item}
              </button>
            ))}
          </div>
          <button type="button" className="envx-explode" aria-pressed={exploded} disabled={!ready} onClick={() => play(exploded ? "seal" : stage, !exploded)}>
            {exploded ? "assemble" : "explode"}
          </button>
        </div>
      </div>

      <div className="envx-stage" ref={stageRef} data-busy={busy || undefined}>
        <div className="rv-host" ref={hostRef} />
        {!ready && <div className="envx-poster"><EnvelopePoster /></div>}
        {ready && (
          <>
            <svg className="envx-leaders" aria-hidden="true">
              {LABELS.map((label) => (
                <line
                  key={label.piece}
                  ref={(el) => { lineRefs.current[label.piece] = el; }}
                  pathLength={1}
                  strokeDasharray="1 1"
                  data-shown={shownLabels.includes(label) || undefined}
                  data-focus={focusPieces.has(label.piece) || undefined}
                />
              ))}
            </svg>
            <div className="envx-labels" aria-hidden="true">
              {LABELS.map((label) => (
                <span
                  key={label.piece}
                  ref={(el) => { labelRefs.current[label.piece] = el; }}
                  className="envx-label"
                  data-shown={shownLabels.includes(label) || undefined}
                  data-focus={focusPieces.has(label.piece) || undefined}
                >
                  <b className="mono">{label.title}</b>
                  <small className="mono">{label.note}</small>
                </span>
              ))}
              {PHONE_NAMES.map((name, i) => (
                <span key={name + i} ref={(el) => { labelRefs.current[`phone:${i}`] = el; }} className="envx-phone mono" data-shown={stage === "relay" && !exploded ? true : undefined}>
                  {name}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      <p className="envx-caption" aria-live="polite">{exploded ? "taken apart: the plaintext header a relay reads, the key and nonce that ride outside, and the sealed letter with its sender block, message and padding." : stageCaption[stage]}</p>
      <p className="envx-facts mono">
        <span>{model.headerBytes} B relay-readable header</span>
        <span>{bytesOf("eph")} B ephemeral key</span>
        <span>{bytesOf("nonce")} B nonce</span>
        <span>{model.sealedFixedBytes} B sealed sender + signature</span>
        <span>6 hops max</span>
        <span>6 h max on any one device</span>
      </p>
    </div>
  );
}

/** The sealed envelope as a still drawing: before the 3D view loads, and for good without WebGL. */
function EnvelopePoster() {
  return (
    <svg viewBox="0 0 480 300" className="envx-poster-svg" role="img" aria-label="A sealed envelope: a plaintext header label on the front, a key card and a nonce in the corner, and a seal on the closed flap.">
      <g transform="translate(240 150) skewY(-6) rotate(-4)">
        <rect x="-170" y="-105" width="340" height="210" rx="8" className="envx-p-shell" />
        <path d="M-166 -101 0 4 166 -101" className="envx-p-line" />
        <path d="M-166 101 0 -6 166 101" className="envx-p-fold" />
        <circle cx="0" cy="0" r="13" className="envx-p-seal" />
        <rect x="-160" y="38" width="200" height="54" rx="5" className="envx-p-header" />
        {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={-152 + i * 38} y="50" width="32" height="30" rx="3" className="envx-p-tile" />)}
        <rect x="90" y="40" width="64" height="48" rx="5" className="envx-p-nonce" />
        <rect x="82" y="34" width="64" height="48" rx="5" className="envx-p-key" />
      </g>
    </svg>
  );
}
