"use client";

import { useSyncExternalStore } from "react";
import { achievements, type AchievementId, secrets, type ToyId, toys } from "@/content/secrets";
import {
  addTo,
  allBolts,
  BOLTS,
  type BoltId,
  bump as bumpCounter,
  emptyState,
  type ListKey,
  parseState,
  type SecretState,
  STORAGE_KEY,
  toyboxOpen,
} from "./secrets-core";

/**
 * Client side of the hidden-feature system. Everything is localStorage; if storage is blocked
 * the state lives in memory for this page view and simply starts again next time.
 */

const CHANGE = "secrets:change";
export const TOAST_EVENT = "secrets:toast";

let memory: SecretState | null = null;

function load(): SecretState {
  if (memory) return memory;
  try {
    memory = parseState(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    memory = emptyState();
  }
  return memory;
}

function save(next: SecretState) {
  memory = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // private mode: keep it in memory
  }
  window.dispatchEvent(new Event(CHANGE));
}

export type Toast = { text: string; kind: "secret" | "achievement" | "bolt" | "toybox" | "plain" };

export function toast(text: string, kind: Toast["kind"] = "plain") {
  window.dispatchEvent(new CustomEvent<Toast>(TOAST_EVENT, { detail: { text, kind } }));
}

function add(key: ListKey, id: string) {
  const before = load();
  const next = addTo(before, key, id);
  if (next === before) return false;
  save(next);
  return true;
}

/** A secret was found. Returns true the first time. Opens the toybox at the third. */
export function discover(id: string) {
  const wasOpen = toyboxOpen(load());
  if (!add("secrets", id)) return false;
  toast(secrets[id] ?? "found something.", "secret");
  if (!wasOpen && toyboxOpen(load())) window.setTimeout(() => toast("toybox unlocked. it is in the footer.", "toybox"), 1600);
  return true;
}

export function achieve(id: AchievementId) {
  if (!add("achievements", id)) return false;
  const state = load();
  toast(`${achievements[id].title} · ${state.achievements.length} / ??`, "achievement");
  return true;
}

export function unlockToy(id: ToyId) {
  return add("toys", id);
}

export function setFlag(id: string) {
  return add("flags", id);
}

export function hasFlag(id: string) {
  return load().flags.includes(id);
}

export function collectBolt(id: BoltId) {
  if (!add("bolts", id)) return false;
  const state = load();
  const found = BOLTS.filter((bolt) => state.bolts.includes(bolt)).length;
  toast(`bolt ${found} / ${BOLTS.length}`, "bolt");
  if (allBolts(state)) {
    achieve("bolt-collector");
    window.setTimeout(() => toast("the build engine has a new trick. scroll back up.", "bolt"), 1400);
  }
  return true;
}

/** Bumps a counter and returns the new value. */
export function bump(counter: string, by = 1) {
  const next = bumpCounter(load(), counter, by);
  save(next);
  return next.counters[counter];
}

export function getSecretState() {
  return load();
}

/** Forget everything (offered inside the toybox). */
export function resetSecrets() {
  save(emptyState());
}

function subscribe(callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    memory = null;
    callback();
  };
  window.addEventListener(CHANGE, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE, callback);
    window.removeEventListener("storage", onStorage);
  };
}

/** The live state; null during server rendering so nothing secret is ever in the HTML. */
export function useSecrets(): SecretState | null {
  return useSyncExternalStore(subscribe, load, () => null);
}

export { toys };
