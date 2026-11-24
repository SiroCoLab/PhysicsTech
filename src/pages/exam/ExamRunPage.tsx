import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { F, FK, topicName } from '../../content';
import { Hints, OptionList, Solution } from '../../components/learning/Task';
import { Rich } from '../../components/math/Rich';
import { Icon } from '../../components/ui/Icon';
import { EmptyState } from '../../components/ui/Primitives';
import { answered, checkNow, finishExam, giveUp, isOfficialSample, lostWhy, points } from '../../features/exam/exam';
import { examStore, setExam } from '../../features/exam/examStore';
import type { GItem, Item, QItem } from '../../features/practice/items';
import { stopwatch } from '../../lib/format';
import { ru } from '../../i18n/ru';
import './exam.css';

const X = ru.exam;
const T = ru.task;

function ChoiceList({ it, onPick }: { it: GItem; onPick: (i: number) => void }) {
  const ch = it.ch || [];
  return (
    <div className="opts" role="radiogroup">
      {ch.map((c, i) => {
        const s = it.pick === i;
        let cls = 'opt';
        if (it.done) cls += ' done' + (i === it.ci ? ' ok' : s ? ' bad' : '');
        else if (s) cls += ' sel';
        return (
          <button key={i} className={cls} disabled={it.done} role="radio" aria-checked={s} onClick={() => onPick(i)}>
            <span className="opt-mark">{i + 1}</span>
            <span className="opt-body">{F(c)} {it.inst.u}{it.done && i === it.ci && !s && <span className="why ok">{T.rightAnswer}</span>}</span>
          </button>
        );
      })}
    </div>
  );
}

export function ExamFeedback({ it }: { it: Item }) {
  if (it.kind === 'q') {
    return (
      <div className={'fb ' + (it.ok ? 'fb-ok' : 'fb-bad')}>
        <b>{it.ok ? T.correct : it.sel.length ? T.wrong : T.noAnswer.replace('.', '')}.</b> <Rich as="span" html={it.q.e} />
      </div>
    );
  }
  return (
    <>
      <div className={'fb ' + (it.ok ? 'fb-ok' : 'fb-bad')}>
        <b>{it.ok ? T.correct : it.gave ? T.solution : T.wrong}.</b> {T.correctIs} <b>{F(it.inst.a)} {it.inst.u}</b>
        {!it.ok && <div style={{ marginTop: 4 }}><b>{X.lostWhere}</b> {lostWhy(it)}</div>}
      </div>
      <Solution it={it} />
    </>
  );
}

export function ExamTaskBody({ it, onChange }: { it: Item; onChange?: (it: Item) => void }) {
  return (
    <>
      <Rich className="q" html={it.kind === 'q' ? it.q.q : it.inst.q} />
      {it.kind === 'q' && it.q.fig && <Rich className="fig" html={it.q.fig} />}
      {it.kind === 'q' ? (
        <OptionList it={it} reveal={it.done} onToggle={(i) => {
          if (it.done || !onChange) return;
          const sel = it.q.k === 's' ? (it.sel[0] === i ? [] : [i]) : it.sel.includes(i) ? it.sel.filter((x) => x !== i) : [...it.sel, i];
          onChange({ ...it, sel } as QItem);
        }} />
      ) : (
        <ChoiceList it={it} onPick={(i) => onChange && !it.done && onChange({ ...it, pick: it.pick === i ? null : i } as GItem)} />
      )}
    </>
  );
}

export function ExamRunPage() {
  const E = examStore.use();
  const nav = useNavigate();
  const [now, setNow] = useState(Date.now());
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (E?.res) nav('/exam/result', { replace: true });
  }, [E?.res, nav]);
  if (!E || E.res) return <EmptyState icon="cap" title={X.notFound} action={<Link className="btn btn-primary" to="/exam">{X.toExam}</Link>} />;

  const n = E.items.length;
  const it = E.items[E.i];
  const tr = E.mode === 'train';
  const cnt = E.items.filter(answered).length;
  const un = E.items.map((x, i) => (answered(x) ? 0 : i + 1)).filter(Boolean);
  const fl = E.items.map((x, i) => (x.fl ? i + 1 : 0)).filter(Boolean);
  const setItem = (next: Item) => setExam({ ...E, items: E.items.map((x, i) => (i === E.i ? next : x)) });
  const go = (i: number) => {
    if (i < 0 || i >= n) return;
    setConfirm(false);
    setExam({ ...E, i });
    window.scrollTo(0, 0);
  };
  const qHintFormulas = (q: QItem) => {
    const names = (q.q.fk || []).map((k) => FK[k]?.n).filter(Boolean);
    return names.length ? X.qHintSection(names.join('», «')) : '';
  };

  return (
    <div className="exam">
      <div className="exbar">
        <div className="row nowrap">
          <b>{tr ? X.runTrain : X.runExam} · {X.tag.toLowerCase()}</b>
          <span className="spacer" />
          <span className="mut small">{X.answeredOf(cnt, n)}</span>
          <span className="timer" title={X.elapsed}><Icon name="clock" size={14} /> {stopwatch(now - E.t0)}</span>
        </div>
        <div className="dots">
          {E.items.map((x, i) => (
            <button key={i} onClick={() => go(i)}
              className={'dot' + (x.kind === 'g' ? ' g' : '') + (x.done && tr ? (x.ok ? ' ok' : ' bad') : answered(x) ? ' a' : '') + (x.fl ? ' f' : '') + (i === E.i ? ' c' : '')}
              aria-label={`${i + 1}${answered(x) ? ', ' + X.legendAnswered : ', ' + X.legendEmpty}${x.fl ? ', ' + X.legendFlag : ''}`}>{i + 1}</button>
          ))}
        </div>
        <div className="legend"><span><i className="a" />{X.legendAnswered}</span><span><i />{X.legendEmpty}</span><span><i className="f" />{X.legendFlag}</span><span><i className="g" />{X.legendProblem}</span></div>
      </div>

      <section className="card">
        <div className="row">
          <span className="badge badge-dark">{it.kind === 'q' ? X.question : X.problem} {E.i + 1} / {n}</span>
          <span className="badge">{X.pts(points(it))}</span>
          <span className={'badge' + (isOfficialSample(it) ? ' badge-soft' : '')}>
            {it.kind === 'g' ? (isOfficialSample(it) ? X.srcOfficial(it.g.src.split(',')[0]) : X.srcProblem) : X.srcQuestion}
          </span>
        </div>
        <p className="mut small">{topicName(it.t)}</p>
        <ExamTaskBody it={it} onChange={setItem} />
        {!it.done && it.kind === 'g' && <p className="mut small">{X.paperNote}</p>}
        {!it.done && tr && (
          <>
            {it.kind === 'q' && (it.hn || 0) > 0 && (
              <div className="fb hint"><b>{X.qHintTitle}</b><div>{X.qHint(topicName(it.t), qHintFormulas(it))}</div></div>
            )}
            {it.kind === 'g' && <Hints it={it} />}
            <div className="grid2 acts">
              <button className="btn btn-primary span2" disabled={!answered(it)} onClick={() => setItem(checkNow(it))}>{T.check}</button>
              {it.kind === 'q' ? (
                <button className="btn span2" disabled={(it.hn || 0) > 0} onClick={() => setItem({ ...it, hn: 1 })}><Icon name="bulb" />{T.hint}</button>
              ) : (
                <>
                  <button className="btn" disabled={(it.hn || 0) >= 4} onClick={() => setItem({ ...it, hn: Math.min(4, (it.hn || 0) + 1) })}><Icon name="bulb" />{(it.hn || 0) >= 4 ? T.hintsOver : it.hn ? T.hintN((it.hn || 0) + 1) : T.hint}</button>
                  <button className="btn" onClick={() => setItem({ ...it, sf: !it.sf })}>{it.sf ? T.hideFormula : T.showFormula}</button>
                  <button className="btn span2" onClick={() => setItem(giveUp(it))}>{T.giveUp}</button>
                </>
              )}
            </div>
          </>
        )}
        {it.done && <ExamFeedback it={it} />}
        <div className="row" style={{ marginTop: 12 }}>
          <button className={'btn btn-sm flag' + (it.fl ? ' on' : '')} onClick={() => setItem({ ...it, fl: !it.fl })}><Icon name="flag" />{it.fl ? X.flagged : X.flag}</button>
        </div>
      </section>

      <div className="grid2">
        <button className="btn" disabled={!E.i} onClick={() => go(E.i - 1)}>← {ru.common.prev}</button>
        <button className="btn" disabled={E.i >= n - 1} onClick={() => go(E.i + 1)}>{ru.common.next} →</button>
      </div>

      {confirm ? (
        <section className="card card-accent" role="alertdialog" aria-label={X.confirmTitle}>
          <h2>{X.confirmTitle}</h2>
          <p>{un.length ? X.unanswered(un.length, un.join(', ')) : X.allAnswered}{fl.length ? ' ' + X.flaggedList(fl.join(', ')) : ''}</p>
          <p className="mut">{X.noChange}</p>
          <div className="grid2">
            <button className="btn btn-primary" onClick={() => setExam(finishExam(E), false)}>{X.confirmYes}</button>
            <button className="btn" onClick={() => setConfirm(false)}>{X.confirmNo}</button>
          </div>
        </section>
      ) : (
        <button className="btn btn-primary btn-xl btn-block" style={{ marginTop: 12 }} onClick={() => setConfirm(true)}>{X.finish}</button>
      )}
      <p className="note">{X.runNote}{tr ? '' : ' ' + X.runNoteExam}</p>
    </div>
  );
}
