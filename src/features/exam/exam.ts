// Differentiated exam simulation. Rules from «ИНСТРУКЦИЯ-2-ДИФ-ЗАЧЕТ-МЕХ-ФЭА»:
// 7 theory questions × 1 point + 3 problems × 2 points = 13; 12–13 → 5, 10–11 → 4, 7–9 → 3, < 7 → 2. No time limit.
// Logic and storage format are the same as in the existing app (attempts are resumable in both).
import { F, GENS, MECH_TOPICS, QS } from '../../content';
import type { GInstance, GItem, Item, QItem, SerItem } from '../practice/items';
import { deser, evalQ, isNew, makeG, makeQ, near, nearestLvl, recordAnswer, rnd, ser, shuf, wpick } from '../practice/items';
import { progressStore } from '../progress/store';
import { ru } from '../../i18n/ru';

export const EX = { NQ: 7, NP: 3, PQ: 1, PP: 2, MAX: 13 } as const;
export type ExamMode = 'exam' | 'train';

export interface ExamResult {
  ts: number;
  score: number;
  max: number;
  sq: number;
  sp: number;
  nq: number;
  np: number;
  official: boolean;
  dur: number;
  ok: number;
  n: number;
  pct: number;
  self: number;
}

export interface ExamState {
  v: 2;
  mode: ExamMode;
  legacy?: boolean;
  items: Item[];
  i: number;
  t0: number;
  res: ExamResult | null;
}

export const gradeOf = (s: number): 2 | 3 | 4 | 5 => (s >= 12 ? 5 : s >= 10 ? 4 : s >= 7 ? 3 : 2);
export const points = (it: Item): number => (it.kind === 'q' ? EX.PQ : EX.PP);
export const answered = (x: Item): boolean => (x.kind === 'q' ? x.sel.length > 0 : x.pick != null);
export const isOfficialSample = (it: Item): boolean => it.kind === 'g' && /^№/.test(it.g.src || '');

/** Four answer choices for a problem: the correct value, typical mistakes and plausible distractors. */
export function mkChoices(inst: GInstance): number[] {
  const a = inst.a;
  const out = [a];
  const c: number[] = [];
  (inst.w || []).forEach((w) => c.push(w[0]));
  if (a < 0) c.push(-a);
  [2, 0.5, 1.5, 0.1, 10, 4, 0.25, 3].forEach((k) => c.push(a * k));
  for (const v of c) {
    if (out.length >= 4) break;
    if (!isFinite(v) || Math.abs(v) < 1e-9) continue;
    if (out.some((o) => near(v, o, 0.06) || F(v) === F(o))) continue;
    out.push(v);
  }
  return shuf(out);
}

function pickTheory(t: string, used: Set<string>): QItem | null {
  const c = QS.filter((q) => q.t === t && q.k === 's' && !used.has('q' + q.id));
  if (!c.length) return null;
  const f = c.filter(isNew);
  return makeQ(rnd(nearestLvl(f.length ? f : c, wpick([[1, 0.3], [2, 0.5], [3, 0.2]]))));
}

function pickProblem(t: string, used: Set<string>): GItem | null {
  let c = GENS.filter((g) => g.t === t && g.l <= 2 && !used.has('g' + g.id));
  if (!c.length) c = GENS.filter((g) => g.t === t && !used.has('g' + g.id));
  if (!c.length) return null;
  const off = c.filter((g) => /^№/.test(g.src || ''));
  const it = makeG(rnd(off.length && Math.random() < 0.7 ? off : c));
  it.ch = mkChoices(it.inst);
  it.ci = it.ch.indexOf(it.inst.a);
  it.pick = null;
  return it;
}

/** Builds a variant: 7 single-choice theory questions + 3 problems, mechanics topics only. */
export function buildExam(): Item[] {
  const used = new Set<string>();
  const ord = shuf(MECH_TOPICS.map((t) => t.id));
  const P: GItem[] = [];
  const T: QItem[] = [];
  for (const t of ord) {
    if (P.length >= EX.NP) break;
    const it = pickProblem(t, used);
    if (it) {
      used.add('g' + it.id);
      P.push(it);
    }
  }
  const pt = new Set(P.map((x) => x.t));
  const rest = ord.filter((t) => !pt.has(t)).concat(shuf(ord.filter((t) => pt.has(t))));
  for (let g = 0; T.length < EX.NQ && g < 80; g++) {
    const it = pickTheory(rest[g % rest.length], used);
    if (it) {
      used.add('q' + it.id);
      T.push(it);
    }
  }
  return ([...T, ...P] as Item[]).map((it) => ({ ...it, fl: false }));
}

export function startExam(mode: ExamMode): ExamState {
  return { v: 2, mode, items: buildExam(), i: 0, t0: Date.now(), res: null };
}

// ---- persistence (key "exam" in the saved sessions list, same format as before)
export function serX(it: Item): SerItem {
  const o = ser(it);
  o.fl = !!it.fl;
  o.rec = it.rec || 0;
  o.hn = it.hn || 0;
  if (it.kind === 'g') {
    o.sf = !!it.sf;
    o.ch = it.ch;
    o.pick = it.pick;
    o.self = it.self;
  } else o.sf = false;
  return o;
}

export function deserX(o: SerItem): Item | null {
  const it = deser(o);
  if (!it) return null;
  it.fl = !!o.fl;
  it.rec = (o.rec as number) || 0;
  it.hn = (o.hn as number) || 0;
  if (it.kind === 'g') {
    it.sf = !!o.sf;
    it.ch = Array.isArray(o.ch) && (o.ch as number[]).length ? (o.ch as number[]) : mkChoices(it.inst);
    it.ci = it.ch.indexOf(it.inst.a);
    it.pick = o.pick == null ? null : (o.pick as number);
    it.self = o.self as number | undefined;
  }
  return it;
}

export function persistExam(E: ExamState): void {
  if (E.res) return;
  progressStore.update((st) => {
    const rec = {
      key: 'exam', ts: Date.now(), type: 'exam' as const,
      title: E.mode === 'train' ? ru.examSaved.train : ru.examSaved.exam,
      exam: { v: 2, mode: E.mode, legacy: !!E.legacy, items: E.items.map(serX), i: E.i, el: Date.now() - E.t0 },
    };
    const i = st.sv.findIndex((s) => s.key === 'exam');
    if (i >= 0) st.sv[i] = rec;
    else st.sv.push(rec);
  });
}

export function savedExam(): { title: string; ts: number; i: number; n: number } | null {
  const s = progressStore.get().sv.find((x) => x.key === 'exam');
  const e = s?.exam as { items?: unknown[]; i?: number } | undefined;
  if (!s || !e || !Array.isArray(e.items)) return null;
  return { title: s.title, ts: s.ts, i: e.i || 0, n: e.items.length };
}

export function resumeExam(): ExamState | null {
  const s = progressStore.get().sv.find((x) => x.key === 'exam');
  const e = s?.exam as { v?: number; mode?: string; items?: SerItem[]; i?: number; el?: number } | undefined;
  if (!e || !Array.isArray(e.items)) return null;
  const items = e.items.map(deserX).filter((x): x is Item => !!x);
  if (!items.length) return null;
  return { v: 2, mode: e.mode === 'train' ? 'train' : 'exam', legacy: !e.v, items, i: Math.min(e.i || 0, items.length - 1), t0: Date.now() - (e.el || 0), res: null };
}

export function dropSavedExam(): void {
  progressStore.update((st) => {
    st.sv = st.sv.filter((s) => s.key !== 'exam');
  });
}

// ---- answering
function wrongCategory(it: GItem): string {
  const w = it.inst.w.find((w) => near((it.ch as number[])[it.pick as number], w[0], 1e-9));
  return w ? w[2] : 'f';
}

/** Training mode: check one task right away. Returns the updated item. */
export function checkNow(it: Item): Item {
  if (it.done || !answered(it)) return it;
  let ok: boolean;
  let cat = '';
  if (it.kind === 'q') {
    ok = evalQ(it);
    cat = ok ? '' : 'q';
  } else {
    ok = it.pick === it.ci;
    if (!ok) cat = wrongCategory(it);
  }
  const next = { ...it, done: true, ok, rec: 1 } as Item;
  recordAnswer(next, ok, cat, 'train');
  return next;
}

/** Training mode: show the solution of a problem (counts as not solved). */
export function giveUp(it: GItem): GItem {
  if (it.done) return it;
  const next = { ...it, done: true, ok: false, gave: true, rec: 1 };
  recordAnswer(next, false, 'f', 'train');
  return next;
}

/** Finishes the attempt: scores by the official rules, records answers and history. */
export function finishExam(E: ExamState): ExamState {
  if (E.res) return E;
  const dur = Date.now() - E.t0;
  const md: ExamMode = E.mode === 'train' ? 'train' : 'exam';
  const items = E.items.map((it) => {
    if (it.rec) return it;
    let ok: boolean;
    let cat = '';
    if (it.kind === 'q') {
      ok = evalQ(it);
      cat = ok || !it.sel.length ? '' : 'q';
    } else {
      ok = it.pick != null && it.pick === it.ci;
      if (!ok && it.pick != null) cat = wrongCategory(it);
    }
    const next = { ...it, done: true, ok, rec: 1 } as Item;
    recordAnswer(next, ok, cat, md);
    return next;
  });
  const q = items.filter((x) => x.kind === 'q');
  const p = items.filter((x) => x.kind === 'g');
  const sq = q.filter((x) => x.ok).length * EX.PQ;
  const sp = p.filter((x) => x.ok).length * EX.PP;
  const max = q.length * EX.PQ + p.length * EX.PP;
  const score = sq + sp;
  const official = q.length === EX.NQ && p.length === EX.NP;
  const n = items.length;
  const ok = items.filter((x) => x.ok).length;
  const pct = max ? Math.round((100 * score) / max) : 0;
  const ts = Date.now();
  const res: ExamResult = { ts, score, max, sq, sp, nq: q.length, np: p.length, official, dur, ok, n, pct, self: 0 };
  progressStore.update((st) => {
    st.hist.push({ ts, n, ok, pct, score, max, grade: official ? gradeOf(score) : null, mode: md, dur, self: 0, v: 2 });
    if (st.hist.length > 60) st.hist.shift();
    if (md === 'exam' && official && (!st.best || pct >= st.best.pct)) st.best = { pct, ok, n, ts, score, max, grade: gradeOf(score) };
    st.sv = st.sv.filter((s) => s.key !== 'exam');
  });
  return { ...E, items, res };
}

/** Self-assessment of a written solution (0, 0.5 or 1 point) — allowed by the instruction, shown separately. */
export function setSelfScore(E: ExamState, index: number, v: number): ExamState {
  if (!E.res || ![0, 0.5, 1].includes(v)) return E;
  const it = E.items[index];
  if (!it || it.kind !== 'g' || it.ok) return E;
  const items = E.items.map((x, i) => (i === index ? ({ ...x, self: v } as Item) : x));
  const self = items.reduce((s, x) => s + ((x.kind === 'g' && x.self) || 0), 0);
  progressStore.update((st) => {
    const h = st.hist.find((h) => h.ts === E.res!.ts);
    if (h) h.self = self;
  });
  return { ...E, items, res: { ...E.res, self } };
}

/** Why points were lost for a task */
export function lostWhy(it: Item): string {
  if (it.kind === 'q') return it.sel.length ? ru.lostWhy.wrongOption : ru.lostWhy.noAnswer;
  if (it.gave) return ru.lostWhy.gaveUp;
  if (it.pick == null) return ru.lostWhy.noPick;
  const w = it.inst.w.find((w) => near((it.ch as number[])[it.pick as number], w[0], 1e-9));
  return w ? w[1] + '.' : ru.lostWhy.unknown;
}

export const RULES = [
  'Тест состоит из семи теоретических вопросов и трёх задач.',
  'За правильный теоретический ответ — 1 балл; за правильно решённую задачу — 2 балла.',
  'Максимальное количество баллов — 13.',
  'На зачёте нужны чистые листы бумаги, ручка и калькулятор. Бланк теста не заполняется: на своих листах пишут фамилию, номер группы, вариант и ответы в виде «номер вопроса — номер ответа».',
  'Решение задачи записывается обязательно. Если аналитическое решение верное, но из-за ошибки в вычислениях выбран неверный числовой ответ, преподаватель в зависимости от ситуации может засчитать за задачу 1 или 0,5 балла вместо 0.',
  'Векторы в тексте теста записаны жирным шрифтом, без стрелки над величиной.',
  'Задачи в тесте короткие — на одну-две формулы; задача может быть частью более крупной задачи из примеров.',
  'Переписывание теста — при оценке «2» или при пропуске по уважительной причине.',
];

export const PREP = [
  'По списку вопросов учить формулы-определения, законы и словесные формулировки.',
  'Знать, как определяются направления векторов для векторных величин.',
  'Выводы формул в общем случае не понадобятся.',
  'Разобраться в примерах задач; дополнительно — сборник задач по курсу физики с решениями Т. И. Трофимовой и З. Г. Павловой, задачи по темам вопросов.',
];

export const SCHEDULE: [string, string][] = [
  ['6486', '17.11, 15:30 (практика)'], ['6487', '17.11, 17:20, ауд. 3107'], ['6488', '17.11, 15:30 (практика)'],
  ['6491', '17.11, 10:30, ауд. 3137'], ['6492', '17.11, 15:30 (практика)'], ['6493', '17.11, 17:20, ауд. 3107'], ['6495', '18.11, 13:40 (практика)'],
];
