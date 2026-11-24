// HTTP client for the existing PhysicsTech backend.
import { getAuth } from '../auth/auth';
import type { ProgressState } from '../features/progress/types';
import { ru } from '../i18n/ru';
import { apiUrl } from './config';
import { ApiError } from './types';
import type { ActivityResponse, AdminUserDetail, AdminUsersResponse, ApiClient, Me, SyncResponse } from './types';

async function request<T>(path: string, init: { method?: string; body?: unknown; keepalive?: boolean } = {}): Promise<T> {
  const auth = getAuth().headers();
  if (!auth) throw new ApiError(0, ru.auth.noIdentity);
  let r: Response;
  try {
    r = await fetch(apiUrl(path), {
      method: init.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...auth },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      keepalive: !!init.keepalive,
      credentials: 'omit',
      cache: 'no-store',
    });
  } catch {
    throw new ApiError(0, ru.auth.network);
  }
  let data: unknown = null;
  try {
    data = await r.json();
  } catch {
    /* empty body */
  }
  if (!r.ok) {
    const detail = data && typeof (data as { detail?: unknown }).detail === 'string' ? (data as { detail: string }).detail : ru.auth.server(r.status);
    throw new ApiError(r.status, detail);
  }
  return data as T;
}

export const httpClient: ApiClient = {
  kind: 'api',
  me: () => request<Me>('/api/me'),
  sync: (state: ProgressState, baseRev: number | null) => request<SyncResponse>('/api/sync', { method: 'POST', body: { state, base_rev: baseRev } }),
  activity: (session, seconds, platform, keepalive) =>
    request<ActivityResponse>('/api/activity', { method: 'POST', body: { session, seconds, platform }, keepalive }),
  adminUsers: () => request<AdminUsersResponse>('/api/admin/users'),
  adminUser: (id) => request<AdminUserDetail>('/api/admin/users/' + encodeURIComponent(String(id))),
  async adminUsersCsv() {
    const auth = getAuth().headers();
    if (!auth) throw new ApiError(0, ru.auth.noIdentity);
    const r = await fetch(apiUrl('/api/admin/users.csv'), { headers: auth, credentials: 'omit', cache: 'no-store' });
    if (!r.ok) throw new ApiError(r.status, ru.auth.csv);
    return r.blob();
  },
};
