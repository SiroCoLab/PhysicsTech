// Tasks: choosing, generating, checking and recording answers.
// Ported 1:1 from the existing app (same rules, tolerances and storage format); see tests/parity.test.ts.
import { GENS, GID, QS, TOPICS } from '../../content';
import type { GenOutput, Generator, QOption, Question, WrongAnswer } from '../../content';
import { rng } from '../../legacy/content.js';
import { autoLevel, mastery } from '../progress/mastery';
import { LOG_CAP, progressStore } from '../progress/store';
import type { ProgressState } from '../progress/types';

export interface QItem {
  kind: 'q';
  id: number;
  t: string;
  l: number;
  q: Question;
  opts: QOption[];
  sel: number[];
  done: boolean;
  ok: boolean | null;
  hn?: number;
  fl?: boolean;
  rec?: number;
}

export interface GInstance {
  q: string;
  d: string;
  st: string[];
  a: number;
  u: string;
  w: WrongAnswer[];
}

export interface Diagnosis {
  ok?: boolean;
  cat: string;
  msg: string;
}

export interface GItem {
  kind: 'g';
  id: string;
  t: string;
  l: number;
  g: Generator;
  inst: GInstance;
  val: string;
  done: boolean;
  ok: boolean | null;
  diag?: Diagnosis;
  gave?: boolean;
  hn?: number;
  sf?: boolean;
  // exam: answer choices
  ch?: number[];
  ci?: number;
  pick?: number | null;
  self?: number;
  fl?: boolean;
  rec?: number;
}

export type Item = QItem | GItem;

// ---- helpers (identical to the existing app)
export const shuf = <T,>(a: T[]): T[] => {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
export const rnd = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
export const near = (a: number, b: number, t: number): boolean => Math.abs(a - b) <= t * Math.abs(b) + 1e-12;
const SUPD = '⁰¹²³⁴⁵⁶⁷⁸⁹';

/** Parses a student's numeric answer: comma or dot, minus signs, "5,8·10⁻³", "5.8*10^-3", "5.8e-3". */
export function parseNum(s: string): number {
  s = String(s).trim().replace(/\s+/g, '').replace(/,/g, '.').replace(/[−–—]/g, '-');
  s = s.replace(/[·×x*]10([⁺⁻]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+)/i, (_m, p: string) =>
    'e' + p.replace(/⁻/g, '-').replace(/⁺/g, '').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (d) => String(SUPD.indexOf(d))));
  s = s.replace(/[·×x*]10\^?\(?([+-]?\d+)\)?/i, 'e$1');
  if (s === '') return NaN;
  const v = Number(s);
  return isFinite(v) ? v : NaN;
}

export function wpick<T>(a: [T, number][]): T {
  let s = Math.random() * a.reduce((x, y) => x + y[1], 0);
  for (const [v, w] of a) {
    s -= w;
    if (s <= 0) return v;
  }
  return a[0][0];
}

const hh = (s: string): string => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return 'g' + h;
};
const usedHas = (st: ProgressState, t: string, k: string): boolean => !!(st.used[t] && st.used[t][k]);
const useMark = (t: string, k: string): void =>
  progressStore.update((s) => {
    (s.used[t] = s.used[t] || {})[k] = 1;
  });
export const isNew = (q: Question): boolean => !usedHas(progressStore.get(), q.t, 'q' + q.id);

let recent: string[] = [];
export const remember = (k: string): void => {
  recent.push(k);
  if (recent.length > 10) recent.shift();
};

export function makeQ(q: Question, al?: boolean | number): QItem {
  if (!al) useMark(q.t, 'q' + q.id);
  return { kind: 'q', id: q.id, t: q.t, l: q.l, q, opts: shuf(q.o), sel: [], done: false, ok: null };
}

export function makeG(G: Generator, seed?: number | null, al?: boolean | number): GItem {
  let d!: GenOutput;
  const st = progressStore.get();
  for (let i = 0; i < 40; i++) {
    d = G.fn(seed != null ? rng(seed + i * 7919) : Math.random);
    if ((al || seed != null || !usedHas(st, G.t, hh(d[0]))) && isFinite(d[3]) && Math.abs(d[3]) > 1e-9 && !(d[5] || []).some((x) => near(x[0], d[3], 0.045))) break;
  }
  if (!al && seed == null) useMark(G.t, hh(d[0]));
  return { kind: 'g', id: G.id, t: G.t, l: G.l, g: G, inst: { q: d[0], d: d[1], st: d[2], a: d[3], u: d[4], w: d[5] || [] }, val: '', done: false, ok: null };
}

export function nearestLvl<T extends { l: number }>(c: T[], l: number): T[] {
  const m = Math.min(...c.map((x) => Math.abs(x.l - l)));
  return c.filter((x) => Math.abs(x.l - l) === m);
}

export function pickQ(t: string, l: number, used?: Set<string>): QItem | null {
  let c = QS.filter((q) => q.t === t && isNew(q) && !(used && used.has('q' + q.id)) && !recent.includes('q' + q.id));
  if (!c.length) c = QS.filter((q) => q.t === t && isNew(q) && !(used && used.has('q' + q.id)));
  if (!c.length) return null;
  return makeQ(rnd(nearestLvl(c, l)));
}

export function pickG(t: string, l: number, used?: Set<string>, ty?: string): GItem | null {
  const ok = (g: Generator) => g.t === t && (!ty || g.ty === ty);
  let c = GENS.filter((g) => ok(g) && !(used && used.has('g' + g.id)) && !recent.includes('g' + g.id));
  if (!c.length) c = GENS.filter((g) => ok(g) && !(used && used.has('g' + g.id)));
  if (!c.length) c = GENS.filter(ok);
  if (!c.length) return null;
  return makeG(rnd(nearestLvl(c, l)));
}

/** Problem of a given type: seed — the worked example (always the same problem). */
export function pickGT(ty: string, l: number, seed?: number): GItem {
  let c = GENS.filter((g) => g.ty === ty);
  const f = c.filter((g) => !recent.includes('g' + g.id));
  if (f.length && seed == null) c = f;
  const n = nearestLvl(c, l);
  return makeG(seed != null ? n[0] : rnd(n), seed);
}

export function weakTopic(st: ProgressState): string {
  const w: [string, number][] = TOPICS.map((t) => {
    const m = mastery(st, t.id);
    return [t.id, 0.25 + (m.n < 3 ? 0.55 : 1 - m.acc)];
  });
  let s = Math.random() * w.reduce((a, x) => a + x[1], 0);
  for (const x of w) {
    s -= x[1];
    if (s <= 0) return x[0];
  }
  return w[0][0];
}

export interface SessionConfig {
  topic?: string; // topic id or "adapt"
  kinds?: 'mix' | 'q' | 'g';
  level?: string; // "auto" | "1" | "2" | "3"
  pool?: string[]; // generator ids (units exercises)
  err?: 1;
}

export function nextErr(): Item | null {
  const st = progressStore.get();
  if (!st.err.length) return null;
  const c = st.err.filter((e) => !recent.includes(e.key));
  const e = rnd(c.length ? c : st.err);
  remember(e.key);
  if (e.k === 'q') {
    const q = QS[e.id as number];
    return q ? makeQ(q, 1) : null;
  }
  const G = GID[e.id as string];
  return G ? makeG(G, null, 1) : null;
}

export function nextItem(cfg: SessionConfig): Item | null {
  if (cfg.pool) {
    const it = makeG(GID[rnd(cfg.pool)]);
    remember('g' + it.id);
    return it;
  }
  if (cfg.err) return nextErr();
  const st = progressStore.get();
  const t = !cfg.topic || cfg.topic === 'adapt' ? weakTopic(st) : cfg.topic;
  const lv = !cfg.level || cfg.level === 'auto' ? autoLevel(st, t) : +cfg.level;
  const kind = cfg.kinds === 'mix' ? (Math.random() < 0.5 ? 'q' : 'g') : cfg.kinds;
  let it: Item | null = kind === 'q' ? pickQ(t, lv) : pickG(t, lv);
  if (!it) it = kind === 'q' ? pickG(t, lv) : pickQ(t, lv);
  if (!it) {
    progressStore.update((s) => {
      delete s.used[t];
    });
    it = pickQ(t, lv) || pickG(t, lv);
  }
  if (it) remember(it.kind + it.id);
  return it;
}

/** Checks a numeric answer: 2% tolerance; recognises typical mistakes of the problem. */
export function evalG(inst: GInstance, val: string): Diagnosis & { ok: boolean } | null {
  const x = parseNum(val);
  if (isNaN(x)) return null;
  const ok = near(x, inst.a, 0.02);
  let cat = '';
  let msg = '';
  if (!ok) {
    const w = inst.w.find((w) => near(x, w[0], 0.03));
    if (w) {
      cat = w[2];
      msg = w[1];
    } else if (near(x, inst.a, 0.12)) {
      cat = 'c';
      msg = 'Ответ близок к правильному: проверьте арифметику и округление промежуточных результатов.';
    } else {
      cat = 'f';
      msg = 'Ответ не совпал ни с одним типичным вариантом ошибки: перепроверьте выбор формулы и подстановку (см. решение ниже).';
    }
  }
  return { ok, cat, msg };
}

export const evalQ = (it: QItem): boolean => it.opts.every((o, i) => o.ok === it.sel.includes(i));

/** Records an answer in the log and the list of mistakes (same rules as before). */
export function recordAnswer(it: Item, ok: boolean, cat: string, mode: string): void {
  progressStore.update((st) => {
    const now = Date.now();
    st.log.push({ k: it.kind, id: it.id, t: it.t, ok: ok ? 1 : 0, c: cat || '', m: mode, ts: now });
    if (st.log.length > LOG_CAP) st.log.splice(0, st.log.length - LOG_CAP);
    const key = it.kind + ':' + it.id;
    const i = st.err.findIndex((e) => e.key === key);
    if (!ok) {
      const e = { key, k: it.kind, id: it.id, t: it.t, txt: (it.kind === 'q' ? it.q.q : it.inst.q).slice(0, 100), ts: Date.now() };
      if (i >= 0) st.err[i] = e;
      else st.err.push(e);
    } else if (i >= 0 && mode === 'err') st.err.splice(i, 1);
  });
}

// ---- serialization for unfinished sessions (same format as the existing app → resumable in both)
export type SerItem = Record<string, unknown>;

export function ser(it: Item): SerItem {
  if (it.kind === 'q') return { kind: 'q', id: it.id, t: it.t, l: it.l, ord: it.opts.map((o) => it.q.o.indexOf(o)), sel: it.sel, done: it.done, ok: it.ok };
  return { kind: 'g', id: it.id, t: it.t, l: it.l, inst: it.inst, val: it.val, done: it.done, ok: it.ok, diag: it.diag, gave: it.gave, hn: it.hn, sf: it.sf };
}

export function deser(o: SerItem | null | undefined): Item | null {
  if (!o) return null;
  if (o.kind === 'q') {
    const q = QS[o.id as number];
    if (!q) return null;
    const ord = (o.ord as number[]) || [];
    return { kind: 'q', id: o.id as number, t: o.t as string, l: o.l as number, q, opts: ord.map((i) => q.o[i]).filter(Boolean), sel: (o.sel as number[]) || [], done: !!o.done, ok: (o.ok as boolean | null) ?? null };
  }
  const G = GID[o.id as string];
  if (!G || !o.inst) return null;
  return { kind: 'g', id: o.id as string, t: o.t as string, l: o.l as number, g: G, inst: o.inst as GInstance, val: (o.val as string) || '', done: !!o.done, ok: (o.ok as boolean | null) ?? null, diag: o.diag as Diagnosis | undefined, gave: o.gave as boolean | undefined, hn: (o.hn as number) || 0, sf: o.sf as boolean | undefined };
}

export function putSaved(key: string, o: Record<string, unknown>): void {
  progressStore.update((st) => {
    const rec = { ...o, key, ts: Date.now() } as ProgressState['sv'][number];
    const i = st.sv.findIndex((s) => s.key === key);
    if (i >= 0) st.sv[i] = rec;
    else st.sv.push(rec);
  });
}

export function deleteSaved(key: string): void {
  progressStore.update((st) => {
    st.sv = st.sv.filter((s) => s.key !== key);
  });
}

export function markRead(topicId: string, value: boolean): void {
  progressStore.update((st) => {
    st.read[topicId] = value;
  });
}
