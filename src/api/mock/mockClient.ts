// DEMO DATA for developing screens without a backend (VITE_DATA_MODE=mock).
// Everything here is fictional; the interface shows a "Демо-данные" banner in this mode.
// Replace with the real client by setting VITE_DATA_MODE=api — the contract (ApiClient) is the same.
import type { ProgressState } from '../../features/progress/types';
import type { ActivityResponse, AdminUserDetail, AdminUserRow, AdminUsersResponse, ApiClient, Me, SyncResponse } from '../types';

const delay = <T,>(v: T, ms = 250): Promise<T> => new Promise((res) => setTimeout(() => res(structuredClone(v)), ms));

let rev = 0;
let stored: ProgressState | null = null;
let seconds = 0;

const me = (): Me => ({
  telegram_id: 1, first_name: 'Демо-пользователь', last_name: '', username: 'demo', is_admin: true,
  time: { today_seconds: seconds, week_seconds: seconds, total_seconds: seconds },
});

const iso = (minutesAgo: number) => new Date(Date.now() - minutesAgo * 60000).toISOString();
const demoUsers: AdminUserRow[] = [
  { telegram_id: 1001, first_name: 'Демо', last_name: 'Студент 1', username: 'demo1', created_at: iso(9000), last_seen_at: iso(5), total_seconds: 15400, week_seconds: 5400, today_seconds: 1200, sessions: 21, answers: 240, correct: 190, accuracy: 79, exams: 3, best_grade: 4, last_exam: { ts: Date.now() - 86400000, score: 11, max: 13, grade: 4, mode: 'exam' } },
  { telegram_id: 1002, first_name: 'Демо', last_name: 'Студент 2', username: '', created_at: iso(3000), last_seen_at: iso(1500), total_seconds: 3600, week_seconds: 600, today_seconds: 0, sessions: 6, answers: 40, correct: 22, accuracy: 55, exams: 1, best_grade: 2, last_exam: { ts: Date.now() - 3 * 86400000, score: 5, max: 13, grade: 2, mode: 'exam' } },
];

export const mockClient: ApiClient = {
  kind: 'mock',
  me: () => delay(me()),
  sync(state: ProgressState, baseRev: number | null): Promise<SyncResponse> {
    if (stored === null || baseRev === rev) {
      stored = structuredClone(state);
      rev++;
    }
    return delay({ rev, merged: false, state: null });
  },
  activity(_session, s): Promise<ActivityResponse> {
    const credited = Math.min(s, 120);
    seconds += credited;
    return delay({ credited, today_seconds: seconds, week_seconds: seconds, total_seconds: seconds }, 50);
  },
  adminUsers(): Promise<AdminUsersResponse> {
    return delay({ users: demoUsers, summary: { users: demoUsers.length, active_today: 1, active_week: 2, total_seconds: demoUsers.reduce((s, u) => s + u.total_seconds, 0) } });
  },
  adminUser(id): Promise<AdminUserDetail> {
    const u = demoUsers.find((x) => String(x.telegram_id) === String(id));
    if (!u) return Promise.reject(Object.assign(new Error('Пользователь не найден'), { status: 404 }));
    const daily = Array.from({ length: 30 }, (_, i) => ({ day: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10), seconds: (i * 137) % 1500 }));
    return delay({ ...u, daily, topics: [{ topic: 'kin', answers: 30, correct: 24 }, { topic: 'dyn', answers: 18, correct: 11 }], exam_list: [], recent_sessions: [] });
  },
  adminUsersCsv: () => delay(new Blob(['﻿Демо-данные\n'], { type: 'text/csv' })),
};
