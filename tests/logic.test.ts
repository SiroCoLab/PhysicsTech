import { beforeEach, describe, expect, it } from 'vitest';
import { GID, MECH_TOPICS } from '../src/content';
import { finishExam, setSelfScore } from '../src/features/exam/exam';
import type { ExamState } from '../src/features/exam/exam';
import { makeG, makeQ, recordAnswer } from '../src/features/practice/items';
import { QS } from '../src/content';
import { achievements, currentStreak, dailyGoal, dayKey, longestStreak, totalXp, xpOnDay } from '../src/features/progress/gamification';
import { recommendedTopic, sectionStates, SECTIONS } from '../src/features/progress/path';
import { defST, progressStore, STORAGE_KEY } from '../src/features/progress/store';
import type { LogEntry, ProgressState } from '../src/features/progress/types';

const DAY = 86400000;
const e = (ts: number, ok: 0 | 1, k: 'q' | 'g' = 'q', t = 'kin', m = 'quiz'): LogEntry => ({ k, id: 1, t, ok, c: '', m, ts });

beforeEach(() => {
  localStorage.clear();
  progressStore.replace(defST());
});

describe('XP, goal and streak', () => {
  it('counts XP only for correct answers: 10 per question, 20 per problem', () => {
    const now = Date.now();
    const st: ProgressState = { ...defST(), log: [e(now, 1), e(now, 0), e(now, 1, 'g'), e(now - 3 * DAY, 1)] };
    expect(totalXp(st)).toBe(40);
    expect(xpOnDay(st, dayKey(now))).toBe(30);
    expect(dailyGoal(st)).toBe(50);
    expect(dailyGoal({ ...st, pt: { goal: 100 } })).toBe(100);
  });

  it('computes current and longest streaks by calendar days', () => {
    const now = new Date(2026, 10, 20, 12).getTime();
    const st: ProgressState = { ...defST(), log: [e(now - 6 * DAY, 1), e(now - 5 * DAY, 0), e(now - 2 * DAY, 1), e(now - DAY, 1)] };
    expect(currentStreak(st, now)).toEqual({ days: 2, today: false }); // yesterday counts until today ends
    expect(currentStreak({ ...st, log: [...st.log, e(now, 1)] }, now)).toEqual({ days: 3, today: true });
    expect(currentStreak(st, now + 2 * DAY).days).toBe(0);
    expect(longestStreak(st)).toBe(2);
  });

  it('unlocks achievements from real data only', () => {
    const empty = achievements(defST());
    expect(empty.every((a) => !a.done)).toBe(true);
    const now = Date.now();
    const st: ProgressState = { ...defST(), log: [e(now, 1)], hist: [{ ts: now, n: 10, ok: 10, pct: 100, score: 13, max: 13, grade: 5, mode: 'exam', v: 2 }] };
    const done = achievements(st).filter((a) => a.done).map((a) => a.id);
    expect(done).toEqual(expect.arrayContaining(['first', 'exam1', 'pass', 'five']));
    expect(done).not.toContain('hundred');
  });
});

describe('learning path (soft unlocking)', () => {
  it('opens the next topic after reading theory or 3 answers in the previous one', () => {
    const mech = SECTIONS[0];
    let s = sectionStates(defST(), mech);
    expect(s[0].status).toBe('available');
    expect(s[1].status).toBe('locked');
    s = sectionStates({ ...defST(), read: { kin: true } }, mech);
    expect(s[0].status).toBe('progress');
    expect(s[1].status).toBe('available');
    const now = Date.now();
    s = sectionStates({ ...defST(), log: [e(now, 1), e(now, 1), e(now, 1), e(now, 1), e(now, 1)] }, mech);
    expect(s[0].status).toBe('done');
    expect(s[1].status).toBe('available');
    expect(SECTIONS[1].topics.length).toBe(3);
    expect(sectionStates(defST(), SECTIONS[1])[0].status).toBe('available');
    expect(recommendedTopic(defST())?.topic.id).toBe(MECH_TOPICS[0].id);
  });
});

describe('recording answers (same storage format as the existing app)', () => {
  it('logs answers, keeps the error list and saves to localStorage', () => {
    const q = makeQ(QS[0], 1);
    recordAnswer(q, false, 'q', 'quiz');
    let st = progressStore.get();
    expect(st.log).toHaveLength(1);
    expect(st.err.map((x) => x.key)).toEqual(['q:0']);
    recordAnswer(q, true, '', 'quiz'); // correct outside error mode: stays in the list
    expect(progressStore.get().err).toHaveLength(1);
    recordAnswer(q, true, '', 'err'); // corrected in error mode: removed
    st = progressStore.get();
    expect(st.err).toHaveLength(0);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}').log).toHaveLength(3);
  });
});

describe('exam scoring by the official rules', () => {
  it('scores 1 point per question and 2 per problem, records history and best result', () => {
    const items = QS.filter((q) => q.k === 's' && MECH_TOPICS.some((t) => t.id === q.t)).slice(0, 7).map((q) => {
      const it = makeQ(q, 1);
      return { ...it, sel: [it.opts.findIndex((o) => o.ok)] };
    });
    const gs = ['atw', 'rodE', 'fall'].map((id) => {
      const it = makeG(GID[id], 1, 1);
      return { ...it, ch: [it.inst.a, it.inst.a * 2], ci: 0, pick: id === 'fall' ? 1 : 0 };
    });
    const E: ExamState = { v: 2, mode: 'exam', items: [...items, ...gs], i: 0, t0: Date.now() - 60000, res: null };
    const done = finishExam(E);
    expect(done.res).toMatchObject({ score: 11, max: 13, sq: 7, sp: 4, official: true, nq: 7, np: 3 });
    const st = progressStore.get();
    expect(st.hist.at(-1)).toMatchObject({ score: 11, max: 13, grade: 4, mode: 'exam', v: 2 });
    expect(st.best).toMatchObject({ score: 11, grade: 4 });
    expect(st.log).toHaveLength(10);
    const self = setSelfScore(done, 9, 1);
    expect(self.res?.self).toBe(1);
    expect(progressStore.get().hist.at(-1)?.self).toBe(1);
    expect(setSelfScore(done, 0, 1)).toBe(done); // not allowed for a theory question
  });

  it('training attempts do not change the best result', () => {
    const it = makeQ(QS[0], 1);
    const E: ExamState = { v: 2, mode: 'train', items: [it], i: 0, t0: Date.now(), res: null };
    finishExam(E);
    expect(progressStore.get().best).toBeNull();
  });
});
