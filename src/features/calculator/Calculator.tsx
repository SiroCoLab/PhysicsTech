// Scientific calculator (arithmetic, functions, derivative, antiderivative, definite integral).
// The calculation engine is the existing one (src/legacy/calc.js); this file is only the interface.
// Fields are not <input>s, so the phone keyboard does not pop up when the on-screen keypad is used.
import { useEffect, useState } from 'react';
import { K, parse, plain, run, st, tx } from '../../legacy/calc.js';
import type { CalcMode } from '../../legacy/calc.js';
import { Icon } from '../../components/ui/Icon';
import { ru } from '../../i18n/ru';
import { insertIntoAnswer } from './bridge';
import './calculator.css';

type Field = 'e' | 'a' | 'b' | 'x';
const KEYS: [string, string, string][] = [
  ['sin', 'sin(', 'o'], ['cos', 'cos(', 'o'], ['tan', 'tan(', 'o'], ['cot', 'cot(', 'o'], ['x', 'x', 'o'],
  ['asin', 'asin(', 'o'], ['acos', 'acos(', 'o'], ['atan', 'atan(', 'o'], ['√', 'sqrt(', 'o'], ['xʸ', '^', 'o'],
  ['ln', 'ln(', 'o'], ['lg', 'lg(', 'o'], ['(', '(', 'o'], [')', ')', 'o'], ['π', 'pi', 'o'],
  ['7', '7', 'n'], ['8', '8', 'n'], ['9', '9', 'n'], ['÷', '/', 'o'], ['⌫', 'BS', 'o'],
  ['4', '4', 'n'], ['5', '5', 'n'], ['6', '6', 'n'], ['×', '*', 'o'], ['C', 'CL', 'o'],
  ['1', '1', 'n'], ['2', '2', 'n'], ['3', '3', 'n'], ['−', '-', 'o'], ['e', 'e', 'o'],
  ['0', '0', 'n'], [',', ',', 'n'], ['×10ⁿ', 'e', 'o'], ['+', '+', 'o'], ['g', 'g', 'o'],
  ['ANS', 'ans', 'o'], ['c', 'c', 'o'], ['=', 'EQ', 'eq w2'], [ru.calc.toAnswer, 'TO', 'o'],
];

const saveHistory = () => {
  try {
    localStorage.setItem('leti_calc', JSON.stringify(st.h));
  } catch {
    /* ignore */
  }
};

export function Calculator({ raised }: { raised: boolean }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<CalcMode>('calc');
  const [act, setAct] = useState<Field>('e');
  const [f, setF] = useState({ e: '', a: '', b: '', x: '' });
  const [deg, setDeg] = useState(st.deg);
  const [res, setRes] = useState<{ html: string; err: boolean; num: number | null }>({ html: '0', err: false, num: null });
  const [, force] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && /^[cCсС]$/.test(e.key)) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (!open || (e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))) return;
      if (e.key === 'Escape') setOpen(false);
      else if (e.key === 'Enter') {
        e.preventDefault();
        press('EQ');
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        press('BS');
      } else if (/^[0-9x+\-*/^().,]$/.test(e.key)) {
        e.preventDefault();
        press(e.key === '.' ? ',' : e.key);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  function compute(next = f) {
    try {
      const r = run(mode, next.e, next.a, next.b, next.x);
      let html = r.tex + (r.note ? `<div class="calc-note">${r.note}</div>` : '');
      if (mode === 'int' && r.F && r.num !== null) html += `<div class="calc-note">${K('F(x)=' + tx(r.F as unknown[]) + '+C')}</div>`;
      st.num = r.num;
      setRes({ html, err: false, num: r.num });
      if (mode === 'calc' && r.num !== null) {
        st.ans = r.num;
        st.h.unshift([next.e.trim(), r.txt || '', plain(r.num)]);
        st.h = st.h.slice(0, 12);
        saveHistory();
        force((x) => x + 1);
      }
    } catch (er) {
      const m = er instanceof Error ? er.message : String(er);
      st.num = null;
      const syntax = /символ|выражение|скобк|лишн|нужна|Введите/.test(m) && !/Деление|определ/.test(m);
      setRes({ html: (syntax ? ru.calc.invalid : '') + m, err: true, num: null });
    }
  }

  function press(v: string) {
    if (v === 'EQ') return compute();
    if (v === 'TO') {
      if (res.num === null || !isFinite(res.num)) return setRes({ ...res, html: ru.calc.needNumber, err: true });
      const ok = insertIntoAnswer(plain(res.num));
      if (!ok) setRes({ ...res, html: ru.calc.noField, err: true });
      return;
    }
    setF((cur) => {
      const n = { ...cur };
      if (v === 'BS') n[act] = n[act].slice(0, -1);
      else if (v === 'CL') {
        n[act] = '';
        if (act === 'e') setRes({ html: '0', err: false, num: null });
      } else n[act] = n[act] + v;
      return n;
    });
  }

  function changeMode(m: CalcMode) {
    setMode(m);
    setAct('e');
    setRes({ html: '0', err: false, num: null });
  }

  let preview = '';
  try {
    preview = f.e.trim() ? K(tx(parse(f.e))) : '';
  } catch {
    preview = '';
  }

  const field = (k: Field, label: string, small?: boolean) => (
    <div className={'cf' + (act === k ? ' on' : '') + (small ? ' small' : '')} role="textbox" aria-readonly="true" aria-label={label} tabIndex={0}
      onClick={() => setAct(k)} onKeyDown={(e) => e.key === 'Enter' && setAct(k)}>
      <i>{label}</i><span>{f[k]}</span>
    </div>
  );

  return (
    <>
      <button className={'calc-fab' + (raised ? ' raised' : '')} onClick={() => setOpen((v) => !v)} aria-label={ru.calc.open} title={ru.calc.open + ' (Alt+C)'}>
        <Icon name="calc" /><span>{ru.calc.title}</span>
      </button>
      {open && (
        <div className="calc" role="dialog" aria-label={ru.calc.title}>
          <div className="calc-head">
            <b>{ru.calc.title}</b>
            {mode === 'calc' && (
              <button className="calc-mini" title={ru.calc.degTitle} onClick={() => { st.deg = !st.deg; setDeg(st.deg); }}>{deg ? ru.calc.deg : ru.calc.rad}</button>
            )}
            <button className="calc-mini" aria-label={ru.common.close} onClick={() => setOpen(false)}>×</button>
          </div>
          <div className="calc-tabs">
            {(['calc', 'diff', 'int'] as CalcMode[]).map((m) => (
              <button key={m} className={mode === m ? 'on' : ''} onClick={() => changeMode(m)}>{ru.calc.modes[m]}</button>
            ))}
          </div>
          {field('e', mode === 'calc' ? '=' : 'f(x)')}
          {mode !== 'calc' && (
            <div className="cfr">
              {mode === 'int' && field('a', 'a', true)}
              {mode === 'int' && field('b', 'b', true)}
              {mode === 'diff' && field('x', 'x₀', true)}
            </div>
          )}
          <div className="calc-prev" dangerouslySetInnerHTML={{ __html: preview }} />
          <div className={'calc-res' + (res.err ? ' err' : '')} {...(res.err ? { children: res.html } : { dangerouslySetInnerHTML: { __html: res.html } })} />
          {mode === 'calc' && st.h.length > 0 && (
            <div className="calc-hist">
              {st.h.slice(0, 4).map(([e, r, pl], i) => (
                <button key={i} title={ru.calc.historyTip} onClick={() => { setMode('calc'); setAct('e'); setF((c) => ({ ...c, e: c.e + pl })); }}>{e} = {r}</button>
              ))}
            </div>
          )}
          <div className="calc-keys">
            {KEYS.map(([l, v, c]) => (
              <button key={l + v} className={c} onClick={() => press(v)}>{l}</button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
