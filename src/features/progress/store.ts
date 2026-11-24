// Progress store. Uses the same localStorage key and format as the existing app,
// so progress is shared between the old page and this web app.
import { useSyncExternalStore } from 'react';
import type { ProgressState } from './types';

export const STORAGE_KEY = 'phys_trainer_mech_v1';
export const LOG_CAP = 1500;

export function defST(): ProgressState {
  return { log: [], err: [], best: null, hist: [], read: {}, sv: [], used: {}, v: 1 };
}

function load(): ProgressState {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) {
      const o = JSON.parse(s);
      if (o && Array.isArray(o.log)) return Object.assign(defST(), o);
    }
  } catch {
    /* storage unavailable or damaged: start empty, never overwrite on read */
  }
  return defST();
}

let state: ProgressState = load();
const listeners = new Set<() => void>();
const saveListeners = new Set<(s: ProgressState) => void>();

function writeLocal(s: ProgressState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* private mode / quota: keep working in memory */
  }
}

function emit(): void {
  listeners.forEach((l) => l());
}

export const progressStore = {
  get: (): ProgressState => state,
  subscribe(fn: () => void): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  /** Changes progress: the mutator works on a copy; result is saved locally and reported to sync. */
  update(mutator: (s: ProgressState) => void): void {
    const next = structuredClone(state);
    mutator(next);
    state = next;
    writeLocal(state);
    emit();
    saveListeners.forEach((l) => l(state));
  },
  /** Replaces progress with a copy received from the server (does not trigger a new sync). */
  replace(s: ProgressState): void {
    state = Object.assign(defST(), s);
    writeLocal(state);
    emit();
  },
  onSave(fn: (s: ProgressState) => void): () => void {
    saveListeners.add(fn);
    return () => saveListeners.delete(fn);
  },
  /** Re-reads localStorage (another tab or the old page changed it) */
  reload(): void {
    state = load();
    emit();
  },
};

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) progressStore.reload();
  });
}

export function useProgress(): ProgressState {
  return useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.get);
}
