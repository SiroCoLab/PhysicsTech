import { useNavigate } from 'react-router';
import { TOPICS, UNITS } from '../content';
import { Icon } from '../components/ui/Icon';
import { Bar, PageHeader, ProgressRing, Stat } from '../components/ui/Primitives';
import { startSession } from '../features/practice/session';
import { achievements, levelOf, longestStreak, totalXp, weekXp } from '../features/progress/gamification';
import type { Achievement } from '../features/progress/gamification';
import { autoLevel, mastery, overall, recommendations, STATUS_COLOR, weakList } from '../features/progress/mastery';
import { useProgress } from '../features/progress/store';
import { score } from '../lib/format';
import { ru } from '../i18n/ru';
import { ExamHistory } from './exam/ExamSetupPage';
import './progress.css';

const P = ru.progress;

export function AchievementGrid({ list }: { list: Achievement[] }) {
  return (
    <div className="ach-grid">
      {list.map((a) => (
        <div key={a.id} className={'ach' + (a.done ? ' done' : '')} title={a.desc}>
          <span className="ach-ic"><Icon name={a.icon} /></span>
          <b>{a.title}</b>
          <span className="mut small">{a.desc}</span>
          {!a.done && a.target > 1 && <Bar value={(100 * a.cur) / a.target} color="var(--c-xp)" />}
          {!a.done && a.target > 1 && <span className="mut small">{a.cur} / {a.target}</span>}
        </div>
      ))}
    </div>
  );
}

export function ProgressPage() {
  const st = useProgress();
  const nav = useNavigate();
  const total = st.log.length;
  const ok = st.log.filter((x) => x.ok).length;
  const solved = st.log.filter((x) => x.k === 'g' && x.ok).length;
  const xp = totalXp(st);
  const lv = levelOf(xp);
  const week = weekXp(st);
  const maxW = Math.max(10, ...week.map((d) => d.xp));
  const ach = achievements(st);
  const recs = recommendations(st);
  const weak = weakList(st);
  const best = st.best;
  const go = (target: string) => {
    if (target === 'units') {
      startSession({ pool: UNITS }, ru.practice.unitsTitle, '/practice', 'prac');
      nav('/session');
    } else nav(target === 'formulas' ? '/formulas' : target === 'theory' ? '/path' : '/practice');
  };

  return (
    <div>
      <PageHeader title={P.title} subtitle={P.subtitle} art="bridge" />
      <section className="card prog-top">
        <ProgressRing value={overall(st)} label={<b>{overall(st)}<small>%</small></b>} />
        <div className="xp-box">
          <span className="mut small">{P.overall}</span>
          <div className="xp-line"><Icon name="bolt" /> <b>{xp}</b> <span className="mut">{P.xp.toLowerCase()}</span></div>
          <b>{P.level(lv.level)}</b>
          <Bar value={(100 * lv.into) / lv.need} color="var(--c-xp)" />
          <span className="mut small">{P.levelNext(lv.into, lv.need)}</span>
        </div>
      </section>
      <div className="stats-grid">
        <Stat icon="target" value={total} label={P.done} />
        <Stat icon="check" color="var(--c-ok)" value={`${ok}${total ? ' · ' + Math.round((100 * ok) / total) + '%' : ''}`} label={P.correct} />
        <Stat icon="pencil" color="#6C5CE7" value={solved} label={P.solved} />
        <Stat icon="flame" color="var(--c-streak)" value={longestStreak(st)} label={P.streakBest} />
        <Stat icon="cap" color="var(--c-navy-1)" value={best ? (best.score != null ? `${score(best.score)} / ${best.max}` : best.pct + '%') : '—'} label={P.best} />
      </div>

      <section className="card">
        <h2>{P.week}</h2>
        <div className="wbars">
          {week.map((d) => (
            <div key={d.day} className="wbar">
              <i style={{ height: `${Math.max(3, (100 * d.xp) / maxW)}%` }} title={`${d.day}: ${d.xp}`} />
              <span>{d.day.slice(8)}</span>
            </div>
          ))}
        </div>
        <p className="mut small">{P.xpRule}</p>
      </section>

      <section className="card">
        <div className="row"><h2 style={{ margin: 0 }}>{P.achievements}</h2><span className="spacer" /><span className="badge">{P.achDone(ach.filter((a) => a.done).length, ach.length)}</span></div>
        <AchievementGrid list={ach} />
      </section>

      <section className="card">
        <h2>{P.topics}</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>{P.topic}</th><th>{P.right}</th><th>{P.status}</th><th>{P.recLevel}</th></tr></thead>
            <tbody>
              {TOPICS.map((t) => {
                const m = mastery(st, t.id);
                return (
                  <tr key={t.id}>
                    <td>{t.n}</td><td>{m.ok} / {m.n}</td>
                    <td><span className="pill" style={{ background: STATUS_COLOR[m.s] }}>{ru.status[m.s]}</span></td>
                    <td>{m.n < 3 ? '—' : ru.common.level[autoLevel(st, t.id)]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mut small">{P.topicsNote}</p>
      </section>

      <section className="card">
        <h2>{P.weak}</h2>
        {weak.length ? weak.map((x) => (
          <div key={x.t.id} className="resume-row">
            <span><span className="pill" style={{ background: STATUS_COLOR[x.m.s] }}>{ru.status[x.m.s]}</span> {x.t.n} <span className="mut">({x.m.ok}/{x.m.n})</span></span>
            <button className="btn btn-sm btn-primary" onClick={() => { startSession({ topic: x.t.id, kinds: 'mix', level: 'auto' }, ru.practice.trainTitle(x.t.n), '/progress', 'quiz'); nav('/session'); }}>{P.train}</button>
          </div>
        )) : <p className="mut">{ru.home.weakEmpty}</p>}
      </section>

      <section className="card">
        <h2>{P.recs}</h2>
        {recs.length ? recs.map((r) => {
          const [title, text, btn] = P.recText[r.id];
          return <div key={r.id} className="fb"><b>{title}.</b> {text}<div style={{ marginTop: 8 }}><button className="btn btn-sm" onClick={() => go(r.target)}>{btn}</button></div></div>;
        }) : <p className="mut">{P.recsEmpty}</p>}
      </section>

      <section className="card">
        <h2>{P.history}</h2>
        <ExamHistory hist={st.hist} limit={12} />
      </section>
    </div>
  );
}
