// Contracts of the existing backend (backend/app/api.py). Do not add fields the server does not return.
import type { ProgressState } from '../features/progress/types';

export interface TimeTotals {
  today_seconds: number;
  week_seconds: number;
  total_seconds: number;
}

/** GET /api/me */
export interface Me {
  telegram_id: number;
  first_name: string;
  last_name: string;
  username: string;
  is_admin: boolean;
  time: TimeTotals;
}

/** POST /api/sync */
export interface SyncResponse {
  rev: number;
  merged: boolean;
  state: ProgressState | null;
}

/** POST /api/activity */
export interface ActivityResponse extends TimeTotals {
  credited: number;
}

export interface LastExam {
  ts: number;
  score: number | null;
  max: number | null;
  grade: number | null;
  mode: string;
}

/** GET /api/admin/users → users[] */
export interface AdminUserRow {
  telegram_id: number;
  first_name: string;
  last_name: string;
  username: string;
  created_at: string | null;
  last_seen_at: string | null;
  total_seconds: number;
  week_seconds: number;
  today_seconds: number;
  sessions: number;
  answers: number;
  correct: number;
  accuracy: number | null;
  exams: number;
  best_grade: number | null;
  last_exam: LastExam | null;
}

export interface AdminUsersResponse {
  users: AdminUserRow[];
  summary: { users: number; active_today: number; active_week: number; total_seconds: number };
}

/** GET /api/admin/users/{telegram_id} */
export interface AdminUserDetail extends AdminUserRow {
  daily: { day: string; seconds: number }[];
  topics: { topic: string; answers: number; correct: number }[];
  exam_list: {
    ts: number; mode: string; score: number | null; max: number | null; grade: number | null; self: number;
    items_total: number; items_ok: number; pct: number; duration_ms: number | null; legacy: boolean;
  }[];
  recent_sessions: { started_at: string | null; last_seen_at: string | null; active_seconds: number; platform: string }[];
}

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface ApiClient {
  readonly kind: 'api' | 'mock';
  me(): Promise<Me>;
  sync(state: ProgressState, baseRev: number | null): Promise<SyncResponse>;
  activity(session: string, seconds: number, platform: string, keepalive?: boolean): Promise<ActivityResponse>;
  adminUsers(): Promise<AdminUsersResponse>;
  adminUser(telegramId: number | string): Promise<AdminUserDetail>;
  adminUsersCsv(): Promise<Blob>;
}
