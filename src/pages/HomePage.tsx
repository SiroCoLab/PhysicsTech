import { Link, useNavigate } from 'react-router';
import { TOPICS, topicName } from '../content';
import { Icon } from '../components/ui/Icon';
import { Skyline } from '../components/ui/Sprite';
import { Bar, ProgressRing, SectionTitle } from '../components/ui/Primitives';
import { useAccount } from '../features/account/account';
import { savedExam, resumeExam } from '../features/exam/exam';
import { setExam } from '../features/exam/examStore';
import { deleteSaved } from '../features/practice/items';
import { resumeSession, startSession } from '../features/practice/session';
import { currentStreak, dailyGoal, dayKey, xpOnDay } from '../features/progress/gamification';
import { mastery, overall, STATUS_COLOR, weakList } from '../features/progress/mastery';
import { recommendedTopic } from '../features/progress/path';
import { useProgress } from '../features/progress/store';
import { dateTime, greeting, plural, score, timeAgo } from '../lib/format';
import { ru } from '../i18n/ru';
import './home.css';

const H = ru.home;

export function HomePage() {
  const st = useProgress();
  const acc = useAccount();
  const nav = useNavigate();
  const total = st.log.length;
  const ok = st.log.filter((x) => x.ok).length;
  const good = TOPICS.filter((t) => mastery(st, t.id).s === 'good').length;
  const goal = dailyGoal(st);
  const today = xpOnDay(st, dayKey(Date.now()));
  const streak = currentStreak(st);
  const rec = recommendedTopic(st);
  const unreadFirst = TOPICS.find((t) => !st.read[t.id]);
  const theoryNext = unreadFirst && st.log.length < 30 ? unreadFirst : null;
  const best = st.best;
  const exam = savedExam();
  const sessions = st.sv.filter((s) => s.type === 'ses');
  const weak = weakList(st).slice(0, 3);
  const recent = [
    ...st.log.slice(-6).map((e) => ({ ts: e.ts, kind: 'a' as const, e })),
    ...st.hist.slice(-3).map((h) => ({ ts: h.ts, kind: 'h' as const, h })),
  ].sort((a, b) => b.ts - a.ts).slice(0, 6);

  const cont = () => {
    if (theoryNext) nav(`/topic/${theoryNext.id}`);
    else {
      startSession({ topic: 'adapt', kinds: 'mix', level: 'auto' }, ru.practice.adaptiveTitle, '/', 'quiz');
      nav('/session');
    }
  };
  const name = acc.me?.first_name;

  return (
    <div className="home">
      <header className="hero">
        <Skyline />
        <div className="hero-top">
          <img className="hero-logo" src="./logo.webp" alt={ru.app.logoAlt} />
          <div>
            <div className="hero-uni">{ru.app.university}</div>
            <div className="hero-yr">{ru.app.founded}</div>
          </div>
        </div>
        <div className="hero-brand">{ru.app.name}</div>
        <div className="hero-greet">{greeting()}{name ? `, ${name}` : ''}!</div>
        <p className="hero-sub">{ru.app.tagline}</p>
      </header>

      <div className="cta">
        <button className="btn btn-primary btn-xl btn-block btn-col" onClick={cont}>
          {H.continue}
          <small>{theoryNext ? H.nextTheory(theoryNext.n) : H.nextAdaptive}</small>
        </button>
      </div>

      <div className="home-grid">
        <section className="card goal-card" aria-label={H.goal}>
          <ProgressRing value={(100 * today) / goal} size={86} color="var(--c-xp)" label={<b className="ring-xp">{today}</b>} />
          <div>
            <h2>{H.goal}</h2>
            <p className="big-line">{today >= goal ? H.goalDone : H.goalOf(today, goal)}</p>
            <p className="mut small">{H.goalHint}</p>
          </div>
        </section>
        <section className="card streak-card" aria-label={H.streak}>
          <span className={'flame' + (streak.days ? ' on' : '')}><Icon name="flame" /></span>
          <div>
            <h2>{H.streak}</h2>
            <p className="big-line">{H.streakDays(streak.days, plural(streak.days, ...ru.days))}</p>
            <p className="mut small">{streak.today ? H.streakToday : streak.days ? H.streakKeep : H.streakNone}</p>
          </div>
        </section>
      </div>

      {(exam || sessions.length > 0) && (
        <section className="card">
          <h2>{H.unfinished}</h2>
          {exam && (
            <div className="resume-row">
              <span><b>{exam.title}</b><br /><span className="mut small">{dateTime(exam.ts)} · {exam.i + 1} / {exam.n}</span></span>
              <button className="btn btn-sm btn-primary" onClick={() => { const E = resumeExam(); if (E) { setExam(E, false); nav('/exam/run'); } }}>{H.resume}</button>
            </div>
          )}
          {sessions.map((s) => (
            <div className="resume-row" key={s.key}>
              <span><b>{s.title}</b><br /><span className="mut small">{dateTime(s.ts)}</span></span>
              <span className="row">
                <button className="btn btn-sm btn-primary" onClick={() => { if (resumeSession(s.key)) nav('/session'); }}>{H.resume}</button>
                <button className="btn btn-sm" onClick={() => deleteSaved(s.key)}>{H.remove}</button>
              </span>
            </div>
          ))}
        </section>
      )}

      <SectionTitle to="/progress">{H.progress}</SectionTitle>
      <section className="card prog-card">
        <ProgressRing value={overall(st)} />
        <div className="prog-stats">
          <div><span>{H.topicsMastered}</span><b>{good} из {TOPICS.length}</b></div>
          <div><span>{H.tasksDone}</span><b>{total}</b></div>
          <div><span>{H.correctShare}</span><b>{total ? Math.round((100 * ok) / total) + '%' : '—'}</b></div>
          <div><span>{H.bestExam}</span><b>{best ? (best.score != null ? `${score(best.score)} из ${best.max}${best.grade ? ` · «${best.grade}»` : ''}` : best.pct + '%') : '—'}</b></div>
        </div>
      </section>

      {rec && (
        <>
          <SectionTitle to="/path" link={ru.nav.path}>{H.recommended}</SectionTitle>
          <Link to={`/topic/${rec.topic.id}`} className="card rec-card">
            <span className="rec-ic"><Icon name="book" /></span>
            <span className="rec-body">
              <b>{rec.topic.n}</b>
              <span className="mut small">{rec.topic.ext ? ru.path.sections.thermo : ru.path.sections.mech} · {ru.path.st[rec.status]}</span>
              <Bar value={rec.m.acc * 100} color={STATUS_COLOR[rec.m.s]} />
            </span>
            <Icon name="chevron" />
          </Link>
        </>
      )}

      <section className="examc">
        <svg className="examc-art" viewBox="0 0 200 200" aria-hidden="true"><use href="#lm-adm" /></svg>
        <span className="phead-tag">{H.simulation}</span>
        <h2>{H.examTitle}</h2>
        <p>{H.examText}</p>
        <div className="facts">{H.examFacts.map(([a, b]) => <div key={b}><b>{a}</b>{b}</div>)}</div>
        <Link to="/exam" className="btn btn-cyan btn-block">{H.examOpen}</Link>
      </section>

      <SectionTitle>{H.quick}</SectionTitle>
      <div className="tiles">
        {[
          ['/path', 'book', ru.nav.theory, '#3478F6'], ['/problems', 'problems', ru.nav.problems, '#6C5CE7'], ['/practice', 'target', ru.practice.quiz, '#16A34A'],
          ['/formulas', 'formulas', ru.nav.formulas, '#F08A24'], ['/errors', 'errors', ru.nav.errors + (st.err.length ? ` · ${st.err.length}` : ''), '#E0527A'], ['/trig', 'wave', ru.nav.trig, '#12A8C9'],
        ].map(([to, ic, label, color]) => (
          <Link key={to} to={to} className="tile"><i style={{ background: color }}><Icon name={ic} /></i>{label}</Link>
        ))}
      </div>

      <SectionTitle>{H.recent}</SectionTitle>
      <section className="card">
        {recent.length ? (
          <ul className="recent">
            {recent.map((r, i) => r.kind === 'a' ? (
              <li key={i}>
                <span className={'dot ' + (r.e.ok ? 'ok' : 'bad')}><Icon name={r.e.ok ? 'check' : 'x'} /></span>
                <span><b>{H.activityAnswer(!!r.e.ok, r.e.k === 'q' ? ru.task.theory.toLowerCase() : ru.task.problem.toLowerCase())}</b><br /><span className="mut small">{topicName(r.e.t)}</span></span>
                <span className="mut small">{timeAgo(r.ts)}</span>
              </li>
            ) : (
              <li key={i}>
                <span className="dot exam"><Icon name="cap" /></span>
                <span><b>{H.activityExam}{r.h.score != null ? ` · ${score(r.h.score)} из ${r.h.max}` : ''}{r.h.grade ? ` · «${r.h.grade}»` : ''}</b><br /><span className="mut small">{r.h.mode === 'train' ? ru.exam.modeShortTrain : ru.exam.modeShortExam}</span></span>
                <span className="mut small">{timeAgo(r.ts)}</span>
              </li>
            ))}
          </ul>
        ) : <p className="mut">{H.recentEmpty}</p>}
      </section>

      <section className="card">
        <h2>{H.weak}</h2>
        {weak.length ? weak.map((x) => (
          <div className="resume-row" key={x.t.id}>
            <span><span className="pill" style={{ background: STATUS_COLOR[x.m.s] }}>{ru.status[x.m.s]}</span> {x.t.n} <span className="mut">({x.m.ok}/{x.m.n})</span></span>
            <button className="btn btn-sm btn-primary" onClick={() => { startSession({ topic: x.t.id, kinds: 'mix', level: 'auto' }, ru.practice.trainTitle(x.t.n), '/', 'quiz'); nav('/session'); }}>{ru.progress.train}</button>
          </div>
        )) : <p className="mut">{H.weakEmpty}</p>}
      </section>
    </div>
  );
}
