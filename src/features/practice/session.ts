// Practice session (test, problems, units, work on mistakes). Saved in the same format as the existing app,
// so an unfinished session can be resumed in either app.
import { createStore } from '../../lib/store';
import { progressStore } from '../progress/store';
import type { Item, SessionConfig } from './items';
import { deser, nextItem, putSaved, ser } from './items';

export interface Session {
  cfg: SessionConfig;
  title: string;
  back: string; // route to return to
  n: number;
  ok: number;
  mode: string; // quiz | prac | err | type
  item: Item | null;
}

// back targets are stored as view names of the existing app
const TO_LEGACY: Record<string, string> = { '/': 'home', '/practice': 'pracSetup', '/errors': 'errors', '/path': 'theory', '/problems': 'solve' };
const FROM_LEGACY: Record<string, string> = { home: '/', pracSetup: '/practice', quizSetup: '/practice', errors: '/errors', theory: '/path', solve: '/problems' };

export const sessionStore = createStore<Session | null>(null);

const keyOf = (s: Session) => 'ses:' + s.title + JSON.stringify(s.cfg);

function persist(s: Session): void {
  if (!s.item) return;
  putSaved(keyOf(s), {
    type: 'ses', title: s.title, mode: s.mode, item: ser(s.item),
    ses: { cfg: s.cfg, title: s.title, back: TO_LEGACY[s.back] || 'home', n: s.n, ok: s.ok },
  });
}

export function startSession(cfg: SessionConfig, title: string, back: string, mode: string): void {
  const s: Session = { cfg, title, back, n: 0, ok: 0, mode, item: nextItem(cfg) };
  sessionStore.set(s);
  persist(s);
}

export function updateItem(item: Item): void {
  const s = sessionStore.get();
  if (!s) return;
  const next = { ...s, item };
  sessionStore.set(next);
  persist(next);
}

export function countAnswer(ok: boolean): void {
  const s = sessionStore.get();
  if (!s) return;
  const next = { ...s, n: s.n + 1, ok: s.ok + (ok ? 1 : 0) };
  sessionStore.set(next);
  persist(next);
}

export function nextTask(): void {
  const s = sessionStore.get();
  if (!s) return;
  const next = { ...s, item: nextItem(s.cfg) };
  sessionStore.set(next);
  persist(next);
}

/** Resumes a saved session by its key; returns false if it cannot be restored. */
export function resumeSession(key: string): boolean {
  const sv = progressStore.get().sv.find((x) => x.key === key);
  if (!sv || sv.type !== 'ses') return false;
  const ses = sv.ses as { cfg?: SessionConfig; title?: string; back?: string; n?: number; ok?: number } | undefined;
  if (!ses?.cfg) return false;
  const item = deser(sv.item as Record<string, unknown>);
  sessionStore.set({
    cfg: ses.cfg, title: ses.title || sv.title, back: FROM_LEGACY[ses.back || ''] || '/practice',
    n: ses.n || 0, ok: ses.ok || 0, mode: (sv.mode as string) || 'quiz', item: item ?? nextItem(ses.cfg),
  });
  return true;
}
