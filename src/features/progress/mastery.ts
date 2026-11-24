// Mastery and recommendations — same rules as the existing app.
import { TOPICS } from '../../content';
import type { ProgressState } from './types';

export type MasteryStatus = 'new' | 'good' | 'mid' | 'bad';
export interface Mastery {
  n: number;
  ok: number;
  acc: number;
  s: MasteryStatus;
}

/** Last 12 tasks of the topic: "good" — at least 5 and 80%; "mid" — 60%+; "bad" — less (from 3 tasks). */
export function mastery(st: ProgressState, t: string): Mastery {
  const L = st.log.filter((x) => x.t === t).slice(-12);
  const n = L.length;
  const ok = L.filter((x) => x.ok).length;
  const acc = n ? ok / n : 0;
  let s: MasteryStatus = 'new';
  if (n >= 3) s = acc >= 0.8 && n >= 5 ? 'good' : acc >= 0.6 ? 'mid' : 'bad';
  return { n, ok, acc, s };
}

export const STATUS_COLOR: Record<MasteryStatus, string> = {
  new: 'var(--c-muted-strong)',
  good: 'var(--c-ok)',
  mid: 'var(--c-warn)',
  bad: 'var(--c-bad)',
};

export function autoLevel(st: ProgressState, t: string): number {
  const m = mastery(st, t);
  return m.n < 3 ? 1 : m.acc < 0.5 ? 1 : m.acc < 0.8 ? 2 : 3;
}

export function overall(st: ProgressState): number {
  return Math.round(
    (100 * TOPICS.reduce((s, t) => {
      const m = mastery(st, t.id);
      return s + (m.n ? m.acc * Math.min(1, m.n / 6) : 0);
    }, 0)) / TOPICS.length,
  );
}

export function weakList(st: ProgressState) {
  return TOPICS.map((t) => ({ t, m: mastery(st, t.id) }))
    .filter((x) => x.m.s === 'bad' || x.m.s === 'mid')
    .sort((a, b) => a.m.acc - b.m.acc);
}

export type RecTarget = 'formulas' | 'units' | 'practice' | 'theory';
export interface Recommendation {
  id: 'f' | 'u' | 'c' | 'q';
  target: RecTarget;
}

/** Error-type recommendations from the last 80 answers (same thresholds as before). */
export function recommendations(st: ProgressState): Recommendation[] {
  const c: Record<string, number> = { f: 0, u: 0, c: 0, q: 0 };
  st.log.slice(-80).filter((x) => !x.ok).forEach((x) => {
    if (c[x.c] != null) c[x.c]++;
  });
  const o: Recommendation[] = [];
  if (c.f >= 3) o.push({ id: 'f', target: 'formulas' });
  if (c.u >= 2) o.push({ id: 'u', target: 'units' });
  if (c.c >= 3) o.push({ id: 'c', target: 'practice' });
  if (c.q >= 3) o.push({ id: 'q', target: 'theory' });
  return o;
}

export function topicAnswerCount(st: ProgressState, t: string): number {
  let n = 0;
  for (const e of st.log) if (e.t === t) n++;
  return n;
}
