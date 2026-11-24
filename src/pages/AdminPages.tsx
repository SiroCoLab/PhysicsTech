import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { topicName } from '../content';
import { Icon } from '../components/ui/Icon';
import { EmptyState, ErrorState, GradeBadge, Loading, PageHeader, Stat } from '../components/ui/Primitives';
import { apiClient, useAccount } from '../features/account/account';
import type { AdminUserDetail, AdminUserRow, AdminUsersResponse } from '../api/types';
import { dateTime, hm, score } from '../lib/format';
import { ru } from '../i18n/ru';
import './progress.css';
import './topic.css';

const A = ru.admin;
type Load<T> = { state: 'loading' } | { state: 'error'; msg: string } | { state: 'ok'; data: T };

function useLoad<T>(fn: () => Promise<T>, deps: unknown[]): [Load<T>, () => void] {
  const [s, setS] = useState<Load<T>>({ state: 'loading' });
  const [n, setN] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps);
  useEffect(() => {
    let alive = true;
    setS({ state: 'loading' });
    run().then((data) => alive && setS({ state: 'ok', data }), (e) => alive && setS({ state: 'error', msg: e instanceof Error ? e.message : String(e) }));
    return () => {
      alive = false;
    };
  }, [run, n]);
  return [s, () => setN((x) => x + 1)];
}

const fullName = (u: { first_name: string; last_name: string }) => `${u.first_name} ${u.last_name}`.trim() || A.noName;
const SORTS: Record<string, (a: AdminUserRow, b: AdminUserRow) => number> = {
  seen: (a, b) => String(b.last_seen_at).localeCompare(String(a.last_seen_at)),
  time: (a, b) => b.total_seconds - a.total_seconds,
  week: (a, b) => b.week_seconds - a.week_seconds,
  acc: (a, b) => (b.accuracy ?? -1) - (a.accuracy ?? -1),
  name: (a, b) => fullName(a).localeCompare(fullName(b), 'ru'),
};

function Guard({ children }: { children: ReactNode }) {
  const acc = useAccount();
  if (acc.mode === 'local') return <EmptyState icon="users" title={A.title} text={A.needServer} />;
  if (acc.status === 'wait' && !acc.me) return <Loading />;
  if (!acc.me?.is_admin) return <EmptyState icon="lock" title={A.title} text={A.only} />;
  return <>{children}</>;
}

export function AdminPage() {
  return <Guard><AdminList /></Guard>;
}

function AdminList() {
  const api = apiClient()!;
  const [res, reload] = useLoad<AdminUsersResponse>(() => api.adminUsers(), [api]);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('seen');
  const [csv, setCsv] = useState('');
  const rows = useMemo(() => {
    if (res.state !== 'ok') return [];
    const s = q.trim().toLowerCase();
    return res.data.users.filter((u) => !s || `${u.first_name} ${u.last_name} ${u.username} ${u.telegram_id}`.toLowerCase().includes(s)).sort(SORTS[sort]);
  }, [res, q, sort]);
  const download = async () => {
    try {
      const blob = await api.adminUsersCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'physicstech-users.csv';
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setCsv(A.csvDone);
    } catch {
      setCsv(A.csvFail);
    }
  };
  if (res.state === 'loading') return <Loading />;
  if (res.state === 'error') return <ErrorState text={res.msg} onRetry={reload} />;
  const s = res.data.summary;
  return (
    <div>
      <PageHeader title={A.title} subtitle={A.timeNote} art="bridge" />
      <section className="card">
        <h2>{A.summary}</h2>
        <div className="stats-grid">
          <Stat icon="users" value={s.users} label={A.users} />
          <Stat icon="check" color="var(--c-ok)" value={s.active_today} label={A.activeToday} />
          <Stat icon="progress" color="#6C5CE7" value={s.active_week} label={A.activeWeek} />
          <Stat icon="clock" color="var(--c-navy-1)" value={hm(s.total_seconds)} label={A.totalTime} />
        </div>
        <div className="grid2" style={{ marginTop: 12 }}>
          <button className="btn" onClick={reload}><Icon name="refresh" />{A.refresh}</button>
          <button className="btn" onClick={download}><Icon name="download" />{A.csv}</button>
        </div>
        {csv && <p className="mut small" role="status">{csv}</p>}
      </section>
      <section className="card">
        <div className="row">
          <input className="input" style={{ flex: 2, minWidth: 180 }} type="search" placeholder={A.search} aria-label={A.search} value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="input" style={{ flex: 1, minWidth: 160 }} value={sort} onChange={(e) => setSort(e.target.value)} aria-label={A.sortLabel}>
            {Object.keys(SORTS).map((k) => <option key={k} value={k}>{A.sorts[k]}</option>)}
          </select>
        </div>
        {rows.length ? rows.map((u) => (
          <Link key={u.telegram_id} to={`/admin/${u.telegram_id}`} className="link-row admin-row">
            <span>
              <b>{fullName(u)}</b>
              <br /><span className="mut small">{u.username ? '@' + u.username + ' · ' : ''}ID {u.telegram_id} · {A.seen(dateTime(u.last_seen_at, true, true))}</span>
              <span className="row" style={{ marginTop: 6 }}>
                <span className="badge">{A.today} {hm(u.today_seconds)}</span>
                <span className="badge">{A.week} {hm(u.week_seconds)}</span>
                <span className="badge badge-dark">{A.total} {hm(u.total_seconds)}</span>
                <span className="badge">{A.answers} {u.answers}{u.accuracy != null ? ` · ${u.accuracy}%` : ''}</span>
                <span className="badge">{A.exams} {u.exams}</span>
              </span>
            </span>
            {u.best_grade ? <GradeBadge grade={u.best_grade} title={A.bestGrade} /> : <Icon name="chevron" />}
          </Link>
        )) : <p className="mut">{ru.common.nothing}</p>}
      </section>
    </div>
  );
}

export function AdminUserPage() {
  return <Guard><AdminUser /></Guard>;
}

function AdminUser() {
  const { id = '' } = useParams();
  const api = apiClient()!;
  const [res, reload] = useLoad<AdminUserDetail>(() => api.adminUser(id), [api, id]);
  if (res.state === 'loading') return <Loading />;
  if (res.state === 'error') return <ErrorState text={res.msg} onRetry={reload} />;
  const d = res.data;
  const mx = Math.max(60, ...d.daily.map((x) => x.seconds));
  return (
    <div>
      <section className="card">
        <h1 style={{ margin: 0 }}>{fullName(d)}</h1>
        <p className="mut small">{d.username ? '@' + d.username + ' · ' : ''}Telegram ID {d.telegram_id}<br />{A.first}: {dateTime(d.created_at, true, true)} · {A.last}: {dateTime(d.last_seen_at, true, true)}</p>
        <div className="stats-grid">
          <Stat icon="clock" value={hm(d.today_seconds)} label={A.today} />
          <Stat icon="clock" value={hm(d.week_seconds)} label={A.week} />
          <Stat icon="clock" color="var(--c-navy-1)" value={hm(d.total_seconds)} label={A.total} />
          <Stat icon="repeat" value={d.sessions} label={A.sessions} />
          <Stat icon="check" color="var(--c-ok)" value={`${d.answers}${d.accuracy != null ? ' · ' + d.accuracy + '%' : ''}`} label={A.answers} />
          <Stat icon="cap" color="#6C5CE7" value={d.exams} label={A.exams} />
        </div>
      </section>
      <section className="card">
        <h2>{A.daily}</h2>
        <div className="wbars" style={{ gap: 3 }}>
          {d.daily.map((x) => <div key={x.day} className="wbar"><i style={{ height: `${Math.max(2, (100 * x.seconds) / mx)}%`, background: 'var(--c-primary)' }} title={`${dateTime(x.day, false)}: ${hm(x.seconds)}`} /></div>)}
        </div>
        <p className="mut small">{A.dailyNote(dateTime(d.daily[0]?.day, false), hm(Math.max(0, ...d.daily.map((x) => x.seconds))))}</p>
      </section>
      <section className="card">
        <h2>{A.topics}</h2>
        {d.topics.length ? (
          <div className="table-wrap"><table>
            <thead><tr><th>{ru.progress.topic}</th><th>{A.answers}</th><th>{ru.progress.right}</th></tr></thead>
            <tbody>{d.topics.map((t) => <tr key={t.topic}><td>{topicName(t.topic)}</td><td>{t.answers}</td><td>{t.correct} ({Math.round((100 * t.correct) / t.answers)}%)</td></tr>)}</tbody>
          </table></div>
        ) : <p className="mut">{A.noAnswers}</p>}
      </section>
      <section className="card">
        <h2>{A.exam}</h2>
        {d.exam_list.length ? (
          <div className="table-wrap"><table>
            <thead><tr><th>{ru.exam.date}</th><th>{ru.exam.mode}</th><th>{ru.exam.score}</th><th>{ru.exam.grade}</th></tr></thead>
            <tbody>{d.exam_list.map((e) => (
              <tr key={e.ts}>
                <td>{dateTime(e.ts, true, true)}</td>
                <td>{e.legacy ? ru.exam.legacyFormat : e.mode === 'train' ? ru.exam.modeShortTrain : ru.exam.modeShortExam}</td>
                <td>{e.legacy ? `${e.items_ok} / ${e.items_total}` : `${score(e.score)} ${ru.exam.of(e.max || 13)}`}{e.self ? <span className="mut"> {ru.exam.selfShort(score(e.self))}</span> : null}</td>
                <td><GradeBadge grade={e.grade} /></td>
              </tr>
            ))}</tbody>
          </table></div>
        ) : <p className="mut">{A.noExams}</p>}
      </section>
      <section className="card">
        <h2>{A.recent}</h2>
        {d.recent_sessions.length ? (
          <table>
            <thead><tr><th>{A.start}</th><th>{A.time}</th><th>{A.platform}</th></tr></thead>
            <tbody>{d.recent_sessions.map((s, i) => <tr key={i}><td>{dateTime(s.started_at, true, true)}</td><td>{hm(s.active_seconds)}</td><td>{s.platform || '—'}</td></tr>)}</tbody>
          </table>
        ) : <p className="mut">{A.noSessions}</p>}
      </section>
    </div>
  );
}
