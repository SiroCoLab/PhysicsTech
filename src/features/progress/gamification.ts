// Learning points (XP), daily goal, streak and achievements.
// Everything is computed from the real answer log and exam history — no stored or invented numbers.
import { MECH_TOPICS, TOPICS } from '../../content';
import { ru } from '../../i18n/ru';
import { mastery } from './mastery';
import type { LogEntry, ProgressState } from './types';

export const XP_RULES = { theory: 10, problem: 20 } as const;
export const GOAL_OPTIONS = [30, 50, 100, 150] as const;
export const DEFAULT_GOAL = 50;
export const XP_PER_LEVEL = 200;

export const xpOf = (e: LogEntry): number => (e.ok ? (e.k === 'g' ? XP_RULES.problem : XP_RULES.theory) : 0);

/** Local calendar day "YYYY-MM-DD" */
export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function shiftDay(key: string, delta: number): string {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d + delta, 12).getTime());
}

export function totalXp(st: ProgressState): number {
  return st.log.reduce((s, e) => s + xpOf(e), 0);
}

export function xpOnDay(st: ProgressState, key: string): number {
  return st.log.reduce((s, e) => s + (dayKey(e.ts) === key ? xpOf(e) : 0), 0);
}

export function dailyGoal(st: ProgressState): number {
  const g = st.pt?.goal;
  return typeof g === 'number' && g > 0 ? g : DEFAULT_GOAL;
}

export function levelOf(xp: number): { level: number; into: number; need: number } {
  return { level: Math.floor(xp / XP_PER_LEVEL) + 1, into: xp % XP_PER_LEVEL, need: XP_PER_LEVEL };
}

function activeDays(st: ProgressState): Set<string> {
  return new Set(st.log.map((e) => dayKey(e.ts)));
}

/** Days in a row with at least one answer. Today without answers does not break the streak yet. */
export function currentStreak(st: ProgressState, now = Date.now()): { days: number; today: boolean } {
  const days = activeDays(st);
  const today = dayKey(now);
  let cur = days.has(today) ? today : shiftDay(today, -1);
  let n = 0;
  while (days.has(cur)) {
    n++;
    cur = shiftDay(cur, -1);
  }
  return { days: n, today: days.has(today) };
}

export function longestStreak(st: ProgressState): number {
  const days = [...activeDays(st)].sort();
  let best = 0;
  let run = 0;
  let prev = '';
  for (const d of days) {
    run = prev && shiftDay(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

/** Last 7 days: XP per day (oldest first) */
export function weekXp(st: ProgressState, now = Date.now()): { day: string; xp: number }[] {
  const today = dayKey(now);
  return Array.from({ length: 7 }, (_, i) => {
    const day = shiftDay(today, i - 6);
    return { day, xp: xpOnDay(st, day) };
  });
}

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: string;
  cur: number;
  target: number;
  done: boolean;
}

export function achievements(st: ProgressState): Achievement[] {
  const correct = st.log.filter((e) => e.ok).length;
  const solved = st.log.filter((e) => e.ok && e.k === 'g').length;
  const readMech = MECH_TOPICS.filter((t) => st.read[t.id]).length;
  const readAll = Object.values(st.read).filter(Boolean).length;
  const v2 = st.hist.filter((h) => h.v === 2);
  const examPass = v2.some((h) => h.mode === 'exam' && (h.grade ?? 0) >= 3);
  const examFive = v2.some((h) => h.mode === 'exam' && h.grade === 5);
  const mastered = TOPICS.filter((t) => mastery(st, t.id).s === 'good').length;
  const fixed = st.log.filter((e) => e.ok && e.m === 'err').length;
  const streak = longestStreak(st);
  const a = (id: string, icon: string, cur: number, target: number): Achievement => {
    const [title, desc] = ru.achievements[id];
    return { id, title, desc, icon, cur: Math.min(cur, target), target, done: cur >= target };
  };
  return [
    a('first', 'spark', correct, 1),
    a('reader', 'book', readAll, 5),
    a('mech', 'atom', readMech, MECH_TOPICS.length),
    a('solver', 'pencil', solved, 10),
    a('hundred', 'target', correct, 100),
    a('streak3', 'flame', streak, 3),
    a('streak7', 'flame', streak, 7),
    a('master', 'medal', mastered, 1),
    a('fixer', 'repeat', fixed, 5),
    a('exam1', 'cap', v2.length, 1),
    a('pass', 'check', examPass ? 1 : 0, 1),
    a('five', 'star', examFive ? 1 : 0, 1),
  ];
}
