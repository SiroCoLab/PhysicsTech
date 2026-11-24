// Practice tasks: theory question (choice) and numeric physics problem (input, hints, formula, solution).
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { F, topicName } from '../../content';
import { registerAnswerTarget } from '../../features/calculator/bridge';
import { HINT_TITLES, formsFor, formulaNamesOfQuestion, hintList, unknownQuantity } from '../../features/practice/hints';
import { evalG, evalQ, recordAnswer } from '../../features/practice/items';
import type { GItem, Item, QItem } from '../../features/practice/items';
import { ru } from '../../i18n/ru';
import { Rich } from '../math/Rich';
import { Icon } from '../ui/Icon';
import './task.css';

const T = ru.task;

export function TaskMeta({ it }: { it: Item }) {
  return (
    <div className="task-meta">
      <span className="badge badge-dark">{it.kind === 'q' ? T.theory : T.problem}</span>
      <span className="badge">{topicName(it.t)}</span>
      <span className="badge badge-soft">{ru.common.level[it.l] || ''}</span>
      {it.kind === 'g' && it.g.src && <span className="badge badge-soft">{T.fromMaterials}: {it.g.src}</span>}
    </div>
  );
}

export function RepeatTopic({ topic, names }: { topic: string; names: string[] }) {
  return (
    <div className="repeat">
      <p className="mut">{T.repeat(topicName(topic))}{names.length ? ' — ' + names.join('; ') : ''}.</p>
      <div className="row">
        <Link className="btn btn-sm" to={`/topic/${topic}`}><Icon name="book" />{T.theoryOfTopic}</Link>
        <Link className="btn btn-sm" to={`/formulas?topic=${topic}`}><Icon name="formulas" />{T.formulasOfTopic}</Link>
      </div>
    </div>
  );
}

export function Solution({ it }: { it: GItem }) {
  const x = it.inst;
  return (
    <div className="solution">
      <div><b>{T.given}:</b> <Rich as="span" html={x.d} /></div>
      <b className="sol-title">{T.steps}</b>
      <ol className="list">{x.st.map((s, i) => <Rich key={i} as="li" html={s} />)}</ol>
      <div><b>{T.answerLabel}:</b> {F(x.a)} {x.u}</div>
    </div>
  );
}

export function OptionList({ it, onToggle, reveal }: { it: QItem; onToggle?: (i: number) => void; reveal: boolean }) {
  const multi = it.q.k === 'm';
  return (
    <div className="opts" role={multi ? 'group' : 'radiogroup'}>
      {it.opts.map((o, i) => {
        const s = it.sel.includes(i);
        let cls = 'opt';
        if (reveal) cls += ' done' + (o.ok ? ' ok' : s ? ' bad' : '');
        else if (s) cls += ' sel';
        return (
          <button key={i} className={cls} disabled={reveal} onClick={() => onToggle?.(i)} role={multi ? 'checkbox' : 'radio'} aria-checked={s}>
            <span className="opt-mark">{i + 1}</span>
            <span className="opt-body">
              <Rich as="span" html={o.x} />
              {reveal && s && !o.ok && o.w && <span className="why"><b>{T.whyNot}</b> {o.w}</span>}
              {reveal && !s && o.ok && <span className="why ok">{multi ? T.missed : T.rightAnswer}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function QuestionTask({ it, onChange, mode, onAnswered }: { it: QItem; onChange: (it: Item) => void; mode: string; onAnswered?: (ok: boolean) => void }) {
  const toggle = (i: number) => {
    if (it.done) return;
    const sel = it.q.k === 's' ? [i] : it.sel.includes(i) ? it.sel.filter((x) => x !== i) : [...it.sel, i];
    onChange({ ...it, sel });
  };
  const submit = () => {
    if (it.done || !it.sel.length) return;
    const ok = evalQ(it);
    recordAnswer(it, ok, ok ? '' : 'q', mode);
    onChange({ ...it, done: true, ok });
    onAnswered?.(ok);
  };
  return (
    <div className="task">
      <TaskMeta it={it} />
      <Rich className="q" html={it.q.q} />
      {it.q.fig && <Rich className="fig" html={it.q.fig} />}
      {it.q.k === 'm' && <p className="mut">{T.multi}</p>}
      <OptionList it={it} onToggle={toggle} reveal={it.done} />
      {!it.done && <button className="btn btn-primary btn-block" disabled={!it.sel.length} onClick={submit}>{T.answer}</button>}
      {it.done && (
        <div className={'fb ' + (it.ok ? 'fb-ok' : 'fb-bad')} role="status">
          <b>{it.ok ? T.correct : T.wrong}.</b> <Rich as="span" html={it.q.e} />
          {!it.ok && <RepeatTopic topic={it.t} names={formulaNamesOfQuestion(it)} />}
        </div>
      )}
    </div>
  );
}

export function Hints({ it }: { it: GItem }) {
  const hs = hintList(it);
  const n = it.hn || 0;
  return (
    <>
      {hs.slice(0, n).map((h, i) => (
        <div key={i} className="fb hint"><b>{T.hintTitle(i + 1, HINT_TITLES[i])}</b><div>{h}</div></div>
      ))}
      {it.sf && <FormulaHint it={it} />}
    </>
  );
}

export function FormulaHint({ it }: { it: GItem }) {
  const fs = formsFor(it);
  return (
    <div className="fb hint">
      <b>{T.formula}</b>
      {fs.length ? fs.map((f) => (
        <div key={f.k} className="hint-f">
          <i>{f.n}:</i>
          <Rich className="formula" html={f.f} />
          {f.v && <div className="mut">{f.v}</div>}
        </div>
      )) : <div>{T.noFormula(topicName(it.t))}</div>}
      <div className="mut">{T.formulaHint}</div>
    </div>
  );
}

export function NumericAnswer({ value, unit, onChange, onEnter, disabled }: { value: string; unit: string; onChange: (v: string) => void; onEnter?: () => void; disabled?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  // no focus() here: focusing would open the phone keyboard while the student uses the calculator keypad
  useEffect(() => (disabled ? undefined : registerAnswerTarget(onChange)), [disabled, onChange]);
  const sign = () => {
    const v = value.trim();
    onChange(/^[-−]/.test(v) ? v.slice(1) : '-' + v);
  };
  return (
    <div className="ansrow">
      <input ref={ref} className="input ans" type="text" inputMode="decimal" autoComplete="off" placeholder={T.answerPh} aria-label={T.answerLabel}
        value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onEnter?.()} />
      {unit && <span className="unit">{unit}</span>}
      <button className="btn btn-sm" onClick={sign} disabled={disabled} aria-label={T.sign} title={T.sign}>±</button>
    </div>
  );
}

export function ProblemTask({ it, onChange, mode, onAnswered }: { it: GItem; onChange: (it: Item) => void; mode: string; onAnswered?: (ok: boolean) => void }) {
  const [msg, setMsg] = useState('');
  const x = it.inst;
  const setVal = (val: string) => onChange({ ...it, val });
  const check = () => {
    if (it.done) return;
    const r = evalG(x, it.val);
    if (!r) {
      setMsg(T.enterNumber);
      return;
    }
    setMsg('');
    recordAnswer(it, r.ok, r.cat, mode);
    onChange({ ...it, done: true, ok: r.ok, diag: r });
    onAnswered?.(r.ok);
  };
  const giveUp = () => {
    if (it.done) return;
    recordAnswer(it, false, 'f', mode);
    onChange({ ...it, done: true, ok: false, gave: true, diag: { cat: 'f', msg: T.gaveUpMsg } });
    onAnswered?.(false);
  };
  const hn = it.hn || 0;
  return (
    <div className="task">
      <TaskMeta it={it} />
      <Rich className="q" html={x.q} />
      <div className="given">
        <div><b>{T.given}:</b> <Rich as="span" html={x.d} /></div>
        <div><b>{T.find}:</b> {T.findText(unknownQuantity(it), x.u)}</div>
      </div>
      {!it.done ? (
        <>
          <NumericAnswer value={it.val} unit={x.u} onChange={setVal} onEnter={check} />
          <p className="mut small">{T.answerHelp} {msg && <b className="err-text">{msg}</b>}</p>
          <Hints it={it} />
          <div className="grid2 acts">
            <button className="btn btn-primary span2" onClick={check}>{T.check}</button>
            <button className="btn" disabled={hn >= 4} onClick={() => onChange({ ...it, hn: Math.min(4, hn + 1) })}>
              <Icon name="bulb" />{hn >= 4 ? T.hintsOver : hn ? T.hintN(hn + 1) : T.hint}
            </button>
            <button className="btn" onClick={() => onChange({ ...it, sf: !it.sf })}>{it.sf ? T.hideFormula : T.showFormula}</button>
            <button className="btn span2" onClick={giveUp}>{T.giveUp}</button>
          </div>
        </>
      ) : (
        <>
          <div className={'fb ' + (it.ok ? 'fb-ok' : 'fb-bad')} role="status">
            <b>{it.ok ? T.correct : it.gave ? T.solution : T.wrong}.</b>{' '}
            {!it.gave && (it.val ? T.yourAnswer(it.val, x.u) + ' ' : T.noAnswer + ' ')}
            {T.correctIs} <b>{F(x.a)} {x.u}</b>
          </div>
          {!it.ok && (
            <div className="fb">
              <b>{T.whereError}</b> {it.diag?.msg || '—'}
              <RepeatTopic topic={it.t} names={formsFor(it).map((f) => f.n)} />
            </div>
          )}
          <Solution it={it} />
        </>
      )}
    </div>
  );
}

export function TaskView(props: { it: Item; onChange: (it: Item) => void; mode: string; onAnswered?: (ok: boolean) => void }) {
  return props.it.kind === 'q'
    ? <QuestionTask {...props} it={props.it} />
    : <ProblemTask {...props} it={props.it} />;
}
