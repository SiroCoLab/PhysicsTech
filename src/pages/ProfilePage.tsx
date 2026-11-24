import { useState } from 'react';
import { Link } from 'react-router';
import { Icon } from '../components/ui/Icon';
import { Stat } from '../components/ui/Primitives';
import { resetProgress, useAccount } from '../features/account/account';
import { achievements, currentStreak, dailyGoal, GOAL_OPTIONS, levelOf, totalXp } from '../features/progress/gamification';
import { defST, progressStore, useProgress } from '../features/progress/store';
import { setThemePref, useThemePref } from '../platform/platform';
import type { ThemePref } from '../platform/platform';
import { getAuth } from '../auth/auth';
import { dateTime, hm } from '../lib/format';
import { ru } from '../i18n/ru';
import { AchievementGrid } from './ProgressPage';
import './progress.css';

const P = ru.profile;

export function ProfilePage() {
  const st = useProgress();
  const acc = useAccount();
  const theme = useThemePref();
  const [msg, setMsg] = useState('');
  const [imp, setImp] = useState('');
  const [confirm, setConfirm] = useState(false);
  const xp = totalXp(st);
  const ach = achievements(st);
  const goal = dailyGoal(st);
  const me = acc.me;
  const name = me ? `${me.first_name} ${me.last_name}`.trim() || ru.admin.noName : P.localUser;
  const exp = JSON.stringify(st);

  const doImport = (txt: string) => {
    try {
      const o = JSON.parse(txt);
      if (!o || !Array.isArray(o.log)) throw new Error('format');
      progressStore.update((s) => {
        Object.keys(s).forEach((k) => delete (s as Record<string, unknown>)[k]);
        Object.assign(s, defST(), o);
      });
      setMsg(P.imported(o.log.length));
      setImp('');
    } catch {
      setMsg(P.importFail);
    }
  };

  const syncBox = () => {
    if (acc.mode === 'local') return <div className="soft">{P.localText}</div>;
    if (acc.status === 'ok') return <div className="fb fb-ok"><b>{P.syncOk}</b><div className="mut small">{P.syncLast(dateTime(acc.lastSync))}</div></div>;
    if (acc.status === 'wait') return <div className="soft">{P.syncWait}</div>;
    if (acc.status === 'auth') return <div className="warn"><b>{P.syncAuth}</b> {acc.message}</div>;
    if (acc.status === 'err') return <div className="warn"><b>{P.syncErr}</b> {P.syncErrText} <span className="mut">{acc.message}</span></div>;
    return null;
  };

  return (
    <div>
      <section className="card profile-head">
        <span className="avatar">{(me?.first_name || 'P').slice(0, 1).toUpperCase()}</span>
        <div>
          <h1 style={{ margin: 0 }}>{name}</h1>
          <p className="mut small">
            {me ? <>{me.username ? '@' + me.username + ' · ' : ''}{P.id} {me.telegram_id}</> : P.modeLocal}
          </p>
          <span className="badge">{ru.progress.level(levelOf(xp).level)} · {xp} XP</span>
        </div>
      </section>

      <section className="card">
        <h2>{P.account}</h2>
        <p className="mut small">{P.mode}: {acc.mode === 'api' ? P.modeApi : acc.mode === 'mock' ? P.modeMock : P.modeLocal} · {P.signIn}: {getAuth().label()}</p>
        {syncBox()}
        {acc.time && (
          <>
            <h3>{P.time}</h3>
            <div className="stats-grid">
              <Stat icon="clock" value={hm(acc.time.today_seconds)} label={P.today} />
              <Stat icon="clock" value={hm(acc.time.week_seconds)} label={P.week} />
              <Stat icon="clock" value={hm(acc.time.total_seconds)} label={P.total} />
            </div>
          </>
        )}
        {me?.is_admin && <Link className="btn btn-primary btn-block" style={{ marginTop: 12 }} to="/admin"><Icon name="users" />{P.adminBtn}</Link>}
        {acc.mode !== 'local' && <p className="mut small">{P.dataNote}</p>}
      </section>

      <section className="card">
        <h2>{P.stats}</h2>
        <div className="stats-grid">
          <Stat icon="bolt" color="var(--c-xp)" value={xp} label={ru.progress.xp} />
          <Stat icon="flame" color="var(--c-streak)" value={currentStreak(st).days} label={ru.home.streak} />
          <Stat icon="target" value={st.log.length} label={ru.progress.done} />
          <Stat icon="cap" color="var(--c-navy-1)" value={st.hist.length} label={ru.exam.history} />
        </div>
        <Link to="/progress" className="btn btn-block" style={{ marginTop: 12 }}><Icon name="progress" />{ru.nav.progress}</Link>
      </section>

      <section className="card">
        <div className="row"><h2 style={{ margin: 0 }}>{P.achievements}</h2><span className="spacer" /><Link to="/progress" className="small">{P.allAch}</Link></div>
        <AchievementGrid list={ach.filter((a) => a.done).slice(0, 6).concat(ach.filter((a) => !a.done).slice(0, Math.max(0, 3 - ach.filter((a) => a.done).length)))} />
      </section>

      <section className="card">
        <h2>{P.settings}</h2>
        <h3>{P.theme}</h3>
        <div className="chips">
          {(['light', 'dark', 'auto'] as ThemePref[]).map((t) => (
            <button key={t} className="chip" aria-pressed={theme === t} onClick={() => setThemePref(t)}>{P.themes[t]}</button>
          ))}
        </div>
        <h3>{P.goal}</h3>
        <div className="chips">
          {GOAL_OPTIONS.map((g) => (
            <button key={g} className="chip" aria-pressed={goal === g} onClick={() => progressStore.update((s) => { s.pt = { ...(s.pt || {}), goal: g }; })}>{g} {P.goalUnit}</button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>{P.dataTitle}</h2>
        <textarea className="input" readOnly value={exp} aria-label={P.dataTitle} />
        <div className="row" style={{ margin: '6px 0' }}>
          <button className="btn btn-sm" onClick={() => navigator.clipboard?.writeText(exp).then(() => setMsg(P.exported), () => setMsg(P.exportFail))}>{P.export}</button>
        </div>
        <textarea className="input" placeholder={P.importPh} value={imp} onChange={(e) => setImp(e.target.value)} aria-label={P.importPh} />
        <div className="row" style={{ margin: '6px 0' }}>
          <button className="btn btn-sm" disabled={!imp.trim()} onClick={() => doImport(imp)}>{P.import}</button>
          <label className="btn btn-sm">{P.importFile}
            <input type="file" accept=".json,.txt" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) f.text().then(doImport); }} />
          </label>
          <span className="mut small" role="status">{msg}</span>
        </div>
        {confirm ? (
          <div className="warn">
            {P.resetConfirm}
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn btn-sm btn-danger" onClick={() => { resetProgress(); setConfirm(false); }}>{P.resetYes}</button>
              <button className="btn btn-sm" onClick={() => setConfirm(false)}>{ru.common.cancel}</button>
            </div>
          </div>
        ) : <button className="btn btn-sm btn-danger" onClick={() => setConfirm(true)}>{P.reset}</button>}
      </section>
    </div>
  );
}
