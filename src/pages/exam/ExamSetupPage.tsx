import { useState } from 'react';
import { useNavigate } from 'react-router';
import { GradeBadge, PageHeader } from '../../components/ui/Primitives';
import { dropSavedExam, EX, PREP, resumeExam, RULES, SCHEDULE, savedExam, startExam } from '../../features/exam/exam';
import type { ExamMode } from '../../features/exam/exam';
import { setExam } from '../../features/exam/examStore';
import { useProgress } from '../../features/progress/store';
import type { HistEntry } from '../../features/progress/types';
import { dateTime, score, stopwatch } from '../../lib/format';
import { ru } from '../../i18n/ru';
import './exam.css';

const X = ru.exam;

export function ExamHistory({ hist, limit = 8 }: { hist: HistEntry[]; limit?: number }) {
  if (!hist.length) return <p className="mut">{X.historyEmpty}</p>;
  const v2 = hist.filter((h) => h.v === 2 && h.max === EX.MAX).slice(-14);
  return (
    <>
      {v2.length > 0 && (
        <>
          <div className="hbars" aria-hidden="true">
            <div className="hline" style={{ bottom: `${(100 * 7) / 13}%` }}><span>{X.threshold}</span></div>
            {v2.map((h) => (
              <i key={h.ts} className={`g${h.grade || 0}${h.mode === 'train' ? ' tr' : ''}`} style={{ height: `${Math.max(3, (100 * (h.score || 0)) / (h.max || 13))}%` }} title={`${score(h.score)} из ${h.max}`} />
            ))}
          </div>
          <p className="mut small">{X.chartNote}</p>
        </>
      )}
      <div className="table-wrap">
        <table>
          <thead><tr><th>{X.date}</th><th>{X.score}</th><th>{X.grade}</th></tr></thead>
          <tbody>
            {hist.slice(-limit).reverse().map((h) => (
              <tr key={h.ts}>
                <td>{dateTime(h.ts)}<div className="mut small">{h.v === 2 ? (h.mode === 'train' ? X.modeShortTrain : X.modeShortExam) + (h.dur ? ' · ' + stopwatch(h.dur) : '') : X.legacyFormat}</div></td>
                <td>{h.v === 2 ? <><b>{score(h.score)}</b> {X.of(h.max || 13)}{h.self ? <div className="mut small">{score((h.score || 0) + h.self)}</div> : null}</> : `${h.ok} / ${h.n} (${h.pct}%)`}</td>
                <td><GradeBadge grade={h.grade} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function ExamSetupPage() {
  const st = useProgress();
  const nav = useNavigate();
  const [mode, setMode] = useState<ExamMode>('exam');
  const sv = savedExam();
  const start = () => {
    setExam(startExam(mode));
    nav('/exam/run');
  };
  return (
    <div className="exam">
      <PageHeader title={X.title} subtitle={X.subtitle} tag={X.tag} art="adm" />
      {sv && (
        <section className="card card-accent">
          <b>{X.unfinished}</b>
          <p className="mut">{X.unfinishedInfo(sv.title, sv.i + 1, sv.n, dateTime(sv.ts))}</p>
          <div className="grid2">
            <button className="btn btn-primary" onClick={() => { const E = resumeExam(); if (E) { setExam(E, false); nav('/exam/run'); } }}>{X.resume}</button>
            <button className="btn" onClick={dropSavedExam}>{X.drop}</button>
          </div>
        </section>
      )}
      <section className="card">
        <h2>{X.what}</h2>
        <p>{X.whatText}</p>
        <h3>{X.structure}</h3>
        <div className="struct">{X.struct.map(([a, b, c]) => <div key={b}><b>{a}</b>{b}<br />{c}</div>)}</div>
        <h3>{X.scale}</h3>
        <table className="gtab">
          <thead><tr><th>{X.points}</th><th>{X.grade}</th></tr></thead>
          <tbody>{X.scaleRows.map(([t, g]) => <tr key={g}><td>{t}</td><td><GradeBadge grade={g} /></td></tr>)}</tbody>
        </table>
        <p className="mut">{X.minNote}</p>
        <h3>{X.time}</h3>
        <p>{X.timeText}</p>
        <details><summary>{X.rules}</summary><ul className="list">{RULES.map((r) => <li key={r}>{r}</li>)}</ul></details>
        <details><summary>{X.prep}</summary><ul className="list">{PREP.map((r) => <li key={r}>{r}</li>)}</ul></details>
        <details>
          <summary>{X.schedule}</summary>
          <table><thead><tr><th>{X.group}</th><th>{X.when}</th></tr></thead><tbody>{SCHEDULE.map(([g, w]) => <tr key={g}><td>{g}</td><td>{w}</td></tr>)}</tbody></table>
          <p className="mut small">{X.scheduleNote}</p>
        </details>
      </section>
      <section className="card">
        <h2>{X.mode}</h2>
        <div className="modes" role="radiogroup">
          <button className={'mode' + (mode === 'exam' ? ' on' : '')} role="radio" aria-checked={mode === 'exam'} onClick={() => setMode('exam')}><b>{X.modeExam}</b><span>{X.modeExamText}</span></button>
          <button className={'mode' + (mode === 'train' ? ' on' : '')} role="radio" aria-checked={mode === 'train'} onClick={() => setMode('train')}><b>{X.modeTrain}</b><span>{X.modeTrainText}</span></button>
        </div>
        <p className="note">{X.simNote}</p>
        <button className="btn btn-primary btn-xl btn-block" onClick={start}>{X.start}</button>
        {sv && <p className="mut small center">{X.replaceNote}</p>}
      </section>
      <section className="card">
        <h2>{X.history}</h2>
        <ExamHistory hist={st.hist} />
      </section>
    </div>
  );
}
