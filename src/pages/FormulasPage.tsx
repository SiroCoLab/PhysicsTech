import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { FL_TASKS, FORM, TID, TOPICS } from '../content';
import { Rich, Tex } from '../components/math/Rich';
import { PageHeader } from '../components/ui/Primitives';
import { RefNav } from '../components/ui/RefNav';
import { progressStore, useProgress } from '../features/progress/store';
import type { FormulaLabState } from '../features/progress/types';
import { ru } from '../i18n/ru';
import { FormulaCard } from './TopicPage';
import './topic.css';

const P = ru.formulas;

export function FormulasPage() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const topic = params.get('topic') || '';
  const list = useMemo(() => {
    const s = q.trim().toLowerCase().replace(/\s+/g, '');
    return FORM.filter((f) => (!topic || f.t === topic) && (!s || (f.n + f.f + f.v + f.w + f.r + (TID[f.t]?.n || '') + f.u).toLowerCase().replace(/\s+/g, '').includes(s)));
  }, [q, topic]);
  return (
    <div>
      <PageHeader title={P.title} subtitle={P.subtitle} art="spas" />
      <RefNav />
      <section className="card">
        <div className="row">
          <input className="input" style={{ flex: 2, minWidth: 200 }} type="search" placeholder={P.search} aria-label={P.search} value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="input" style={{ flex: 1, minWidth: 160 }} aria-label={P.allTopics} value={topic} onChange={(e) => setParams(e.target.value ? { topic: e.target.value } : {})}>
            <option value="">{P.allTopics}</option>
            {TOPICS.map((t) => <option key={t.id} value={t.id}>{t.n}</option>)}
          </select>
        </div>
        <div style={{ marginTop: 8 }}>
          {list.length ? list.map((f) => <FormulaCard key={f.k} f={f} showTopic />) : <p className="mut">{P.empty}</p>}
        </div>
      </section>
    </div>
  );
}

function normFormula(x: string): string {
  // same normalisation as the existing app
  return String(x || '').toLowerCase().replace(/\\(?:mathrm|left|right|cdot|times|vec|,|!)/g, '').replace(/[{}$\\]/g, '').replace(/[₀]/g, '0').replace(/[ₙ]/g, 'n')
    .replace(/[²]/g, '^2').replace(/[·×⋅]/g, '*').replace(/\s+/g, '').replace(/\*/g, '').replace(/\^/g, '');
}

export function FormulaLabPage() {
  const st = useProgress();
  const fl: FormulaLabState = { mode: 'only', idx: 0, answer: '', steps: '', checked: false, ...(st.formulaLab || {}) };
  const set = (patch: Partial<FormulaLabState>) => progressStore.update((s) => { s.formulaLab = { ...fl, ...patch }; });
  const list = FL_TASKS.filter((x) => x.mode === fl.mode);
  const task = list[fl.idx % list.length];
  const derive = fl.mode === 'derive';
  const check = () => {
    const v = normFormula(fl.answer);
    set({ checked: true, ok: task.answers.some((a) => normFormula(a) === v) });
  };
  return (
    <div>
      <PageHeader title={P.labTitle} subtitle={P.labSubtitle} art="spas" />
      <RefNav />
      <div className="chips">
        <button className="chip" aria-pressed={!derive} onClick={() => set({ mode: 'only', idx: 0, answer: '', steps: '', checked: false })}>{P.labOnly}</button>
        <button className="chip" aria-pressed={derive} onClick={() => set({ mode: 'derive', idx: 0, answer: '', steps: '', checked: false })}>{P.labDerive}</button>
      </div>
      <section className="card">
        <p className="mut small">{P.labOf(derive ? P.labDerive : P.labOnly, (fl.idx % list.length) + 1, list.length, TID[task.t]?.n || '')}</p>
        <h2>{task.title}</h2>
        <Rich as="p" html={task.q} />
        {task.given && <div className="soft"><b>{P.given}</b> <Rich as="span" html={task.given} /></div>}
        <p className="mut">{P.hint} <Rich as="span" html={task.hint} /></p>
        {derive && (
          <label className="field">{P.steps}
            <textarea className="input" rows={3} placeholder={P.stepsPh} value={fl.steps} onChange={(e) => set({ steps: e.target.value })} />
          </label>
        )}
        <label className="field" style={{ marginTop: 8 }}>{derive ? P.finalDerive : P.finalOnly}
          <input className="input" type="text" placeholder={P.ph} value={fl.answer} disabled={fl.checked} onChange={(e) => set({ answer: e.target.value })} />
        </label>
        <div className="grid2" style={{ marginTop: 10 }}>
          <button className="btn btn-primary" disabled={fl.checked || !fl.answer.trim()} onClick={check}>{P.check}</button>
          <button className="btn" onClick={() => set({ idx: (fl.idx + 1) % list.length, answer: '', steps: '', checked: false })}>{P.next}</button>
        </div>
        {fl.checked && (
          <div className={'fb ' + (fl.ok ? 'fb-ok' : 'warn')}>
            <b>{fl.ok ? P.ok : P.notYet}</b>
            <p>{P.right} <Rich as="span" html={task.show} /></p>
            <Rich as="p" html={task.why} />
            {derive && <p><b>{P.yourSteps}</b> {fl.steps || P.noSteps}</p>}
          </div>
        )}
      </section>
      <section className="card"><b>{P.howTitle}</b><p className="mut">{P.how}</p></section>
    </div>
  );
}

const TRIG: { f: string; cells: (null | [string, string, string?] | string)[] }[] = [
  { f: 'α, рад', cells: ['0', ['\\frac{\\pi}{6}', 'π/6', '0,524'], ['\\frac{\\pi}{4}', 'π/4', '0,785'], ['\\frac{\\pi}{3}', 'π/3', '1,047'], ['\\frac{\\pi}{2}', 'π/2', '1,571']] },
  { f: 'sin α', cells: ['0', ['\\frac{1}{2}', '1/2', '0,5'], ['\\frac{\\sqrt{2}}{2}', '√2/2', '0,707'], ['\\frac{\\sqrt{3}}{2}', '√3/2', '0,866'], '1'] },
  { f: 'cos α', cells: ['1', ['\\frac{\\sqrt{3}}{2}', '√3/2', '0,866'], ['\\frac{\\sqrt{2}}{2}', '√2/2', '0,707'], ['\\frac{1}{2}', '1/2', '0,5'], '0'] },
  { f: 'tg α', cells: ['0', ['\\frac{\\sqrt{3}}{3}', '√3/3', '0,577'], '1', ['\\sqrt{3}', '√3', '1,732'], null] },
  { f: 'ctg α', cells: [null, ['\\sqrt{3}', '√3', '1,732'], '1', ['\\frac{\\sqrt{3}}{3}', '√3/3', '0,577'], '0'] },
];
const UNDEF_WHY: Record<string, string> = { 'tg α': 'cos 90° = 0', 'ctg α': 'sin 0° = 0' };

export function TrigPage() {
  return (
    <div>
      <PageHeader title={P.trigTitle} subtitle={P.trigSubtitle} art="isaac" />
      <RefNav />
      <section className="card">
        <p className="mut">{P.trigHelp}</p>
        <div className="table-wrap">
          <table className="trig">
            <thead><tr><th>α</th>{['0°', '30°', '45°', '60°', '90°'].map((a) => <th key={a}>{a}</th>)}</tr></thead>
            <tbody>
              {TRIG.map((r) => (
                <tr key={r.f}>
                  <th>{r.f}</th>
                  {r.cells.map((c, i) => c === null
                    ? <td key={i} className="nd">{P.undefined}<small>{UNDEF_WHY[r.f]}</small></td>
                    : typeof c === 'string' ? <td key={i}>{c}</td>
                    : <td key={i}><Tex tex={c[0]} />{c[2] && <small>≈ {c[2]}</small>}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="card"><h2>{P.memo}</h2><ul className="list">{P.memoItems.map((x) => <li key={x}>{x}</li>)}</ul></section>
    </div>
  );
}
