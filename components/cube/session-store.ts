"use client";

import { useSyncExternalStore } from "react";
import { MAX_SOLVES, type Penalty, parseSession, type Solve } from "@/lib/cube-stats";

/**
 * The visitor's own solve history, kept in localStorage under one key. It is a tiny external store:
 * a cached array that only changes identity when the history does. If storage is blocked or full the
 * session still works in memory for as long as the page lives.
 */
const KEY = "hamshamb-cube-session";
const EMPTY: Solve[] = [];

let cache: Solve[] | null = null;
const listeners = new Set<() => void>();
let listening = false;

function load(): Solve[] {
  if (cache) return cache;
  try {
    cache = parseSession(window.localStorage.getItem(KEY));
  } catch {
    cache = [];
  }
  return cache;
}

function commit(next: Solve[]) {
  cache = next.slice(-MAX_SOLVES);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // storage is blocked or full: keep the in-memory copy
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!listening) {
    listening = true;
    // another tab changed the history
    window.addEventListener("storage", (event) => {
      if (event.key !== KEY && event.key !== null) return;
      cache = null;
      for (const l of listeners) l();
    });
  }
  return () => {
    listeners.delete(listener);
  };
}

export function useSession(): Solve[] {
  return useSyncExternalStore(subscribe, load, () => EMPTY);
}

function newId() {
  try {
    return crypto.randomUUID();
  } catch {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }
}

export function addSolve(input: { ms: number; scramble: string; penalty: Penalty }) {
  const solve: Solve = {
    id: newId(),
    ms: Math.max(0, Math.round(input.ms)),
    scramble: input.scramble,
    at: new Date().toISOString(),
    penalty: input.penalty,
  };
  commit([...load(), solve]);
}

export function setPenalty(id: string, penalty: Penalty) {
  commit(load().map((solve) => (solve.id === id ? { ...solve, penalty } : solve)));
}

export function removeSolve(id: string) {
  commit(load().filter((solve) => solve.id !== id));
}

export function clearSession() {
  commit([]);
}
