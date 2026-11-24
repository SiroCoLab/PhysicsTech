import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { TID } from '../../content';
import { EmptyState, GradeBadge } from '../../components/ui/Primitives';
import { EX, gradeOf, lostWhy, points, setSelfScore, startExam } from '../../features/exam/exam';
import { examStore, setExam } from '../../features/exam/examStore';
import { startSession } from '../../features/practice/session';
import { score, stopwatch } from '../../lib/format';
import { ru } from '../../i18n/ru';
import { ExamFeedback, ExamTaskBody } from './ExamRunPage';
import './exam.css';

const X = ru.exam;

export function ExamResultPage() {
  const E = examStore.use();
  const nav = useNavigate();
  const [errorsOnly, setErrorsOnly] = useState(false);
  if (!E || !E.res) return <EmptyState icon="cap" title={X.notFound} action={<Link className="btn btn-primary" to="/exam">{X.toExam}</Link>} />;
  const r = E.res;
  const g = r.official ? gradeOf(r.score) : null;
  const tot = r.score + (r.self || 0);
  const g2 = r.official ? gradeOf(tot) : null;
  const tr = E.mode === 'train';
  const lost = E.items.filter((x) => !x.ok);
  const lostTopics = [...new Set(lost.map((x) => x.t))].map((t) => TID[t]).filter(Boolean);
  const pt = (i: (typeof E.items)[number]) => (i.ok ? points(i) : 0);
  const review = (only: boolean) => {
    setErrorsOnly(only);
    setTimeout(() => document.getElementById('review')?.scrollIntoView({ block: 'start' }), 0);
  };

  return (
    <div className="exam">
      <section className="card result">
        <div className="center"><span className="badge badge-dark">{X.tag} · {tr ? X.modeTrain.toLowerCase() : X.modeExam.toLowerCase()}</span></div>
        <div className="score-block">
          <div className="mut">{X.total}</div>
          <div className="score-big">{score(r.score)}<small> {X.of(r.max)}</small></div>
          {g ? (
            <>
              <span className={`grade grade-${g} grade-big`}>{g}</span>
              <div className="mut">{X.gradeLabel}</div>
              <div className={'verdict ' + (g >= 3 ? 'pass' : 'fail')}>{g >= 3 ? X.passed(g) : X.failed}</div>
            </>
          ) : <div className="warn">{X.nonOfficial}</div>}
        </div>
        {r.self > 0 && (
          <div className="soft">
            <b>{X.withSelf(score(tot), r.max, g2 ? ` → «${g2}»` : '')}</b>
            <div className="mut small">{X.selfNote(score(r.self))}</div>
          </div>
        )}
        <div className="stats-grid">
          {[X.theoryPts(r.sq, r.nq * EX.PQ, r.nq), X.problemPts(r.sp, r.np * EX.PP, r.np), [stopwatch(r.dur), X.elapsed]].map(([a, b]) => (
            <div key={b} className="stat-tile"><span><b>{a}</b><small>{b}</small></span></div>
          ))}
        </div>
        {tr && <p className="mut small">{X.trainNote}</p>}
        <div className="grid2" style={{ marginTop: 12 }}>
          <button className="btn btn-primary" disabled={!lost.length} onClick={() => review(true)}>{lost.length ? X.review : X.noErrors}</button>
          <button className="btn" onClick={() => { setExam(startExam(E.mode)); nav('/exam/run'); }}>{X.again}</button>
        </div>
        <p className="note">{X.scaleNote}</p>
      </section>

      <section className="card">
        <h2>{X.breakdown}</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>№</th><th>{X.task}</th><th>{X.score}</th></tr></thead>
            <tbody>
              {E.items.map((it, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{it.kind === 'q' ? X.question : X.problem} · {TID[it.t]?.n}{!it.ok && <div className="mut small">{lostWhy(it)}</div>}</td>
                  <td className="nowrap"><b style={{ color: it.ok ? 'var(--c-ok)' : 'var(--c-bad)' }}>{pt(it)}</b> {X.of(points(it))}{it.kind === 'g' && it.self ? <div className="mut small">{X.selfShort(score(it.self))}</div> : null}</td>
                </tr>
              ))}
              <tr><td /><td><b>{X.totalRow}</b></td><td><b>{score(r.score)}</b> {X.of(r.max)}</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>{X.improve}</h2>
        {lostTopics.length ? lostTopics.map((t) => (
          <div key={t.id} className="improve-row">
            <span><b>{t.n}</b><br /><span className="mut small">{X.lost(lost.filter((x) => x.t === t.id).reduce((s, x) => s + points(x), 0))}</span></span>
            <span className="row">
              <Link className="btn btn-sm" to={`/topic/${t.id}`}>{ru.nav.theory}</Link>
              <button className="btn btn-sm btn-primary" onClick={() => { startSession({ topic: t.id, kinds: 'mix', level: 'auto' }, ru.practice.trainTitle(t.n), '/exam', 'quiz'); nav('/session'); }}>{ru.progress.train}</button>
            </span>
          </div>
        )) : <p>{X.noLoss}</p>}
      </section>

      <section className="card" id="review">
        <div className="row">
          <h2 style={{ margin: 0 }}>{X.reviewTitle}</h2>
          <span className="spacer" />
          <button className="chip" aria-pressed={!errorsOnly} onClick={() => setErrorsOnly(false)}>{ru.common.all}</button>
          <button className="chip" aria-pressed={errorsOnly} disabled={!lost.length} onClick={() => setErrorsOnly(true)}>{X.reviewErrors(lost.length)}</button>
        </div>
        {E.items.map((it, i) => (errorsOnly && it.ok ? null : (
          <details key={i} open={!it.ok} className="review-item">
            <summary>{i + 1}. <b style={{ color: it.ok ? 'var(--c-ok)' : 'var(--c-bad)' }}>{it.ok ? X.ok : X.bad}</b> · {it.kind === 'q' ? X.question.toLowerCase() : X.problem.toLowerCase()} · {TID[it.t]?.n}</summary>
            <ExamTaskBody it={it} />
            <ExamFeedback it={it} />
            {it.kind === 'g' && !it.ok && (
              <div className="soft">
                <b>{X.selfTitle}</b>
                <p className="mut small">{X.selfText}</p>
                <div className="row">
                  {X.selfOpts.map(([v, label]) => (
                    <button key={v} className={'btn btn-sm' + ((it.self || 0) === v ? ' btn-primary' : '')} onClick={() => setExam(setSelfScore(E, i, v), false)}>{label}</button>
                  ))}
                </div>
              </div>
            )}
          </details>
        )))}
      </section>
      <GradeHint />
    </div>
  );
}

function GradeHint() {
  return (
    <p className="mut small center">
      {X.scaleRows.map(([t, g]) => <span key={g} style={{ marginRight: 10 }}>{t} — <GradeBadge grade={g} /></span>)}
    </p>
  );
}
