// Account: identity from the backend, progress sync and time-in-app tracking.
// Ported from the sync layer of the existing app (same server contract and local keys), so both apps share progress.
import { useSyncExternalStore } from 'react';
import { DATA_MODE } from '../../api/config';
import { httpClient } from '../../api/http';
import { mockClient } from '../../api/mock/mockClient';
import { ApiError } from '../../api/types';
import type { ApiClient, Me, TimeTotals } from '../../api/types';
import { devAuth, getAuth, setAuth } from '../../auth/auth';
import { defST, progressStore, STORAGE_KEY } from '../progress/store';
import { ru } from '../../i18n/ru';

export type SyncStatus = 'off' | 'wait' | 'ok' | 'err' | 'auth';

export interface AccountState {
  mode: typeof DATA_MODE;
  status: SyncStatus;
  message: string;
  me: Me | null;
  time: TimeTotals | null;
  lastSync: number;
}

const SK = 'pt_sync';
let state: AccountState = { mode: DATA_MODE, status: 'off', message: '', me: null, time: null, lastSync: 0 };
const listeners = new Set<() => void>();
const set = (patch: Partial<AccountState>): void => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};
export const accountStore = {
  get: () => state,
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
export const useAccount = (): AccountState => useSyncExternalStore(accountStore.subscribe, accountStore.get, accountStore.get);

export function apiClient(): ApiClient | null {
  return DATA_MODE === 'api' ? httpClient : DATA_MODE === 'mock' ? mockClient : null;
}

// ---- sync
let rev: number | null = null;
let uid: number | null = null;
let busy = false;
let again = false;
let dirty = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
let started = false;

const readSK = (): { uid?: number; rev?: number } | null => {
  try {
    const o = JSON.parse(localStorage.getItem(SK) || 'null');
    return o && typeof o === 'object' ? o : null;
  } catch {
    return null;
  }
};
const writeSK = (): void => {
  try {
    localStorage.setItem(SK, JSON.stringify({ uid, rev }));
  } catch {
    /* ignore */
  }
};

function fail(e: unknown): void {
  if (e instanceof ApiError && e.status === 401) set({ status: 'auth', message: e.message });
  else set({ status: 'err', message: e instanceof Error ? e.message : ru.auth.network });
}

const authFailed = (): boolean => accountStore.get().status === 'auth';

function schedule(ms: number): void {
  clearTimeout(timer);
  timer = setTimeout(push, ms);
}

async function push(): Promise<void> {
  const api = apiClient();
  if (!api || !uid || state.status === 'auth') return;
  if (busy) {
    again = true;
    return;
  }
  busy = true;
  const mark = dirty;
  try {
    const r = await api.sync(progressStore.get(), rev);
    if (r.merged && r.state) {
      if (dirty === mark) {
        progressStore.replace(r.state);
        rev = r.rev;
      } else again = true; // local changes meanwhile: keep the old revision so the server merges again
    } else rev = r.rev;
    writeSK();
    set({ status: 'ok', message: '', lastSync: Date.now() });
  } catch (e) {
    fail(e);
    if (!authFailed()) schedule(30000);
  } finally {
    busy = false;
    if (again) {
      again = false;
      schedule(1500);
    }
  }
}

/** Starts the account layer: in local mode does nothing (progress stays in this browser). */
export async function startAccount(): Promise<void> {
  if (started || DATA_MODE === 'local') return;
  if (DATA_MODE === 'api') setAuth(devAuth());
  const api = apiClient();
  if (!api) return;
  if (DATA_MODE === 'api' && !getAuth().headers()) {
    set({ status: 'auth', message: ru.auth.devHint });
    return;
  }
  started = true;
  set({ status: 'wait' });
  try {
    const me = await api.me();
    set({ me, time: me.time });
    uid = me.telegram_id;
    const sk = readSK();
    if (sk && sk.uid != null && sk.uid !== me.telegram_id) {
      // another account used this browser before: keep its progress aside, start from this account's server copy
      try {
        localStorage.setItem(STORAGE_KEY + '_backup_' + sk.uid, JSON.stringify(progressStore.get()));
      } catch {
        /* ignore */
      }
      progressStore.replace(defST());
      rev = null;
    } else rev = sk && sk.uid === me.telegram_id && Number.isInteger(sk.rev) ? (sk.rev as number) : null;
    await push();
    startActivity();
  } catch (e) {
    started = false;
    fail(e);
    if (state.status !== 'auth') setTimeout(startAccount, 30000);
  }
}

progressStore.onSave(() => {
  if (!uid) return;
  dirty++;
  schedule(4000);
});

/** Marks a progress reset so that the server drops older data from other devices too. */
export function resetProgress(): void {
  progressStore.update((s) => {
    const prefs = s.pt; // settings (daily goal) are not progress — keep them
    Object.keys(s).forEach((k) => delete (s as Record<string, unknown>)[k]);
    Object.assign(s, defST(), { resetAt: Date.now() }, prefs ? { pt: prefs } : {});
  });
}

// ---- time in app (counted only while the page is visible)
const SID = ((globalThis.crypto && 'randomUUID' in globalThis.crypto) ? globalThis.crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36))
  .replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40);
let acc = 0;
let lastTick = Date.now();
let activityOn = false;

async function sendActivity(keepalive: boolean): Promise<void> {
  const api = apiClient();
  if (!api || !uid || acc < 1) return;
  const sec = Math.min(300, Math.round(acc));
  acc -= sec;
  try {
    const r = await api.activity(SID, sec, 'browser', keepalive);
    set({ time: { today_seconds: r.today_seconds, week_seconds: r.week_seconds, total_seconds: r.total_seconds } });
  } catch (e) {
    acc = Math.min(300, acc + sec);
    if (e instanceof ApiError && e.status === 401) fail(e);
  }
}

function startActivity(): void {
  if (activityOn) return;
  activityOn = true;
  lastTick = Date.now();
  setInterval(() => {
    const now = Date.now();
    if (document.visibilityState === 'visible') acc += Math.min(5, Math.max(0, (now - lastTick) / 1000));
    lastTick = now;
  }, 1000);
  setInterval(() => void sendActivity(false), 30000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      void sendActivity(true);
      if (timer) {
        clearTimeout(timer);
        void push();
      }
    } else lastTick = Date.now();
  });
  window.addEventListener('pagehide', () => void sendActivity(true));
  window.addEventListener('online', () => schedule(500));
}
