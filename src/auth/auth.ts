// Authentication abstraction. The API client only asks the active provider for request headers.
//
// Providers:
//  - none:     no identity (local mode) — the API is not called;
//  - dev:      local testing against a backend started with DEV_AUTH=true ("X-Dev-User: <id>:<name>");
//  - telegram: FUTURE. A Telegram Mini App provider will send "Authorization: tma <initData>"
//              (the backend already verifies it). Not implemented in this phase by design.
import { DEV_USER } from '../api/config';
import { ru } from '../i18n/ru';

export interface AuthProvider {
  readonly kind: 'none' | 'dev' | 'telegram';
  /** Headers for API requests, or null when there is no identity */
  headers(): Record<string, string> | null;
  /** Short description for the profile screen */
  label(): string;
}

const DEV_KEY = 'pt_dev_user';

function readDevUser(): string {
  let v = '';
  try {
    const m = /[?&]dev_user=([^&#]+)/.exec(window.location.search) || /[?&]dev_user=([^&#]+)/.exec(window.location.hash);
    if (m) {
      v = decodeURIComponent(m[1]);
      sessionStorage.setItem(DEV_KEY, v);
    } else v = sessionStorage.getItem(DEV_KEY) || '';
  } catch {
    /* storage unavailable */
  }
  if (!v) v = DEV_USER;
  return /^-?\d+(:.*)?$/.test(v) ? v : '';
}

export const noAuth: AuthProvider = { kind: 'none', headers: () => null, label: () => ru.auth.none };

export function devAuth(): AuthProvider {
  const user = readDevUser();
  return {
    kind: 'dev',
    headers() {
      if (!user) return null;
      const i = user.indexOf(':');
      return { 'X-Dev-User': i < 0 ? user : user.slice(0, i) + ':' + encodeURIComponent(user.slice(i + 1)) };
    },
    label: () => (user ? ru.auth.dev(user.split(':')[0]) : ru.auth.devMissing),
  };
}

let current: AuthProvider = noAuth;
export const getAuth = (): AuthProvider => current;
export const setAuth = (p: AuthProvider): void => {
  current = p;
};
