// Platform layer: theme and viewport. In this phase it targets a regular browser only.
// A future Telegram Mini App adapter can set --app-height / --safe-top / --safe-bottom and the theme here
// (from Telegram viewport and theme parameters) without touching pages or components.
import { useSyncExternalStore } from 'react';

export type ThemePref = 'light' | 'dark' | 'auto';
const THEME_KEY = 'diftren_theme'; // shared with the existing app

export function themePref(): ThemePref {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === 'dark' || v === 'auto' ? v : 'light';
  } catch {
    return 'light';
  }
}

const listeners = new Set<() => void>();
let pref: ThemePref = themePref();

export function applyTheme(): void {
  const dark = pref === 'dark' || (pref === 'auto' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0B1426' : '#101D35');
}

export function setThemePref(p: ThemePref): void {
  pref = p;
  try {
    localStorage.setItem(THEME_KEY, p);
  } catch {
    /* ignore */
  }
  applyTheme();
  listeners.forEach((l) => l());
}

export function useThemePref(): ThemePref {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => pref,
    () => pref,
  );
}

export function initPlatform(): void {
  applyTheme();
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
    if (pref === 'auto') applyTheme();
  });
}
