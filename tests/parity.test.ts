// Parity with the existing app: the same inputs must give the same results in the old page and the new web app.
import { describe, expect, it } from 'vitest';
import { FORM, GENS, GID, QS, TOPICS } from '../src/content';
import { __calcSelfTest, __ct } from '../src/legacy/calc.js';
import { buildExam, deserX, gradeOf, mkChoices, serX } from '../src/features/exam/exam';
import { evalG, makeG, parseNum, ser } from '../src/features/practice/items';
import type { GInstance } from '../src/features/practice/items';
import { autoLevel, mastery, overall } from '../src/features/progress/mastery';
import { defST } from '../src/features/progress/store';
import type { ProgressState } from '../src/features/progress/types';
import { legacy } from './legacy';

const L = legacy();

describe('content is the same as in the existing app', () => {
  it('has the same numbers of topics, formulas, questions and generators', () => {
    expect(L.ev<number>('TOPICS.length')).toBe(TOPICS.length);
    expect(L.ev<number>('FORM.length')).toBe(FORM.length);
    expect(L.ev<number>('QS.length')).toBe(QS.length);
    expect(L.ev<number>('GENS.length')).toBe(GENS.length);
    expect(L.ev<string>('JSON.stringify(QS.map(q=>[q.id,q.t,q.k,q.q,q.o.length]))')).toBe(JSON.stringify(QS.map((q) => [q.id, q.t, q.k, q.q, q.o.length])));
    expect(L.ev<string>('JSON.stringify(TOPICS)')).toBe(JSON.stringify(TOPICS));
  });
});

describe('problem generators', () => {
  it('produce identical problems for the same seeds (every generator, 15 seeds)', () => {
    for (const G of GENS) {
      for (let seed = 1; seed <= 15; seed++) {
        const mine = makeG(G, seed * 101, 1).inst;
        const old = L.ev<string>(`JSON.stringify(makeG(GID[${JSON.stringify(G.id)}], ${seed * 101}, 1).inst)`);
        expect(JSON.stringify(mine), `${G.id} seed ${seed}`).toBe(old);
      }
    }
  });

  it('give finite non-zero answers', () => {
    for (const G of GENS) {
      const it = makeG(G, 7, 1);
      expect(Number.isFinite(it.inst.a), G.id).toBe(true);
      expect(Math.abs(it.inst.a) > 1e-9, G.id).toBe(true);
    }
  });
});

describe('answer checking', () => {
  it('parses numbers the same way', () => {
    const cases = ['12,5', '12.5', ' -3 ', '−3', '5,8·10⁻³', '5.8*10^-3', '5.8e-3', '1 000', '2×10³', 'abc', '', '7x10^(2)', '—4,2'];
    for (const s of cases) {
      const old = L.ev<number | null>(`(()=>{const v=parseNum(${JSON.stringify(s)});return Number.isNaN(v)?null:v})()`);
      const v = parseNum(s);
      expect(Number.isNaN(v) ? null : v, s).toBe(old);
    }
  });

  it('evaluates numeric answers and diagnoses typical mistakes identically', () => {
    for (const G of GENS) {
      const inst = makeG(G, 3, 1).inst as GInstance;
      const tries = [inst.a, inst.a * 1.015, inst.a * 1.05, inst.a * 1.1, inst.a * 3, -inst.a, ...inst.w.map((w) => w[0]), ...inst.w.map((w) => w[0] * 1.02)];
      for (const x of tries) {
        const val = String(x).replace('.', ',');
        const old = L.ev<string>(`JSON.stringify(evalG(${JSON.stringify(inst)}, ${JSON.stringify(val)}))`);
        expect(JSON.stringify(evalG(inst, val)), `${G.id} ${val}`).toBe(old);
      }
    }
  });
});

describe('progress statistics', () => {
  const st: ProgressState = defST();
  const now = Date.now();
  TOPICS.forEach((t, i) => {
    for (let k = 0; k < (i % 7) * 2; k++) st.log.push({ k: k % 2 ? 'g' : 'q', id: k, t: t.id, ok: (k * 7 + i) % 3 ? 1 : 0, c: '', m: 'quiz', ts: now - k * 1000 });
  });
  it('mastery, level and overall progress match', () => {
    L.ev(`ST = Object.assign(defST(), ${JSON.stringify(st)})`);
    for (const t of TOPICS) {
      expect(JSON.stringify(mastery(st, t.id)), t.id).toBe(L.ev<string>(`JSON.stringify(mastery(${JSON.stringify(t.id)}))`));
      expect(autoLevel(st, t.id)).toBe(L.ev<number>(`autoLevel(${JSON.stringify(t.id)})`));
    }
    expect(overall(st)).toBe(L.ev<number>('overall()'));
  });
});

describe('differentiated exam', () => {
  it('uses the same grade scale', () => {
    for (let s = 0; s <= 13; s += 0.5) expect(gradeOf(s)).toBe(L.ev<number>(`gradeOf(${s})`));
    expect([gradeOf(13), gradeOf(12), gradeOf(11), gradeOf(10), gradeOf(9), gradeOf(7), gradeOf(6.5), gradeOf(0)]).toEqual([5, 5, 4, 4, 3, 3, 2, 2]);
  });

  it('builds 7 single-choice theory questions + 3 problems from mechanics topics only', () => {
    const mech = new Set(TOPICS.filter((t) => !t.ext).map((t) => t.id));
    for (let i = 0; i < 60; i++) {
      const items = buildExam();
      expect(items.filter((x) => x.kind === 'q').length).toBe(7);
      expect(items.filter((x) => x.kind === 'g').length).toBe(3);
      expect(items.every((x) => mech.has(x.t))).toBe(true);
      expect(items.every((x) => x.kind !== 'q' || x.q.k === 's')).toBe(true);
      for (const p of items) if (p.kind === 'g') expect(p.ch?.[p.ci as number]).toBe(p.inst.a);
    }
  });

  it('offers the same answer choices for a problem', () => {
    for (const G of GENS) {
      const inst = makeG(G, 11, 1).inst;
      const old = L.ev<number[]>(`mkChoices(${JSON.stringify(inst)})`);
      expect([...mkChoices(inst)].sort((a, b) => a - b)).toEqual([...old].sort((a, b) => a - b));
    }
  });

  it('saved attempts are readable by both apps', () => {
    const items = buildExam();
    items[0] = { ...items[0], fl: true };
    const saved = items.map(serX);
    // new -> old
    const restoredOld = L.ev<{ kind: string; id: unknown; fl: boolean }[]>(`(${JSON.stringify(saved)}).map(deserX).map(x=>({kind:x.kind,id:x.id,fl:x.fl}))`);
    expect(restoredOld.map((x) => [x.kind, x.id, x.fl])).toEqual(items.map((x) => [x.kind, x.id, !!x.fl]));
    // old -> new
    const oldSaved = L.ev<Record<string, unknown>[]>(`JSON.parse(JSON.stringify(buildExam().map(serX)))`);
    const restored = oldSaved.map(deserX);
    expect(restored.every(Boolean)).toBe(true);
    expect(restored.filter((x) => x?.kind === 'g').every((x) => x?.kind === 'g' && x.ch && x.ch.length >= 2)).toBe(true);
  });

  it('practice items serialized by the new app are restored by the old one', () => {
    const it = makeG(GID.atw, 5, 1);
    const s = ser(it);
    const back = L.ev<{ inst: GInstance }>(`deser(${JSON.stringify(s)})`);
    expect(back.inst.a).toBe(it.inst.a);
  });
});

describe('calculator engine', () => {
  it('passes its built-in self-test', () => {
    const r = __calcSelfTest();
    expect(r.ошибки).toEqual([]);
    expect(r.пройдено).toBe(r.всего);
    expect(r.всего).toBeGreaterThanOrEqual(59);
  });

  it('gives the same results as the existing calculator', () => {
    const cases: [string, string, string?, string?, string?][] = [
      ['calc', '2+2*3'], ['calc', 'sin(30)'], ['calc', 'sqrt(2)^2'], ['calc', '1/0'], ['calc', 'ln(e)'],
      ['diff', 'x^3', '', '', '2'], ['diff', 'sin(x)*x'], ['int', 'x^2'], ['int', 'x^2', '0', '3'], ['int', 'sin(x)', '0', 'pi'], ['int', '1/x', '0', '1'],
    ];
    for (const [m, e, a, b, x] of cases) {
      const old = L.ev<string>(`JSON.stringify(window.__ct(${JSON.stringify(m)},${JSON.stringify(e)},${JSON.stringify(a || '')},${JSON.stringify(b || '')},${JSON.stringify(x || '')}))`);
      expect(JSON.stringify(__ct(m as 'calc', e, a, b, x)), `${m} ${e}`).toBe(old);
    }
  });
});
