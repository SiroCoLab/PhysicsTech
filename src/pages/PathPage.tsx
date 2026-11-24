import { Link } from 'react-router';
import { Icon } from '../components/ui/Icon';
import { Bar, PageHeader } from '../components/ui/Primitives';
import { STATUS_COLOR } from '../features/progress/mastery';
import { SECTIONS, sectionProgress, sectionStates } from '../features/progress/path';
import type { TopicState } from '../features/progress/path';
import { useProgress } from '../features/progress/store';
import { ru } from '../i18n/ru';
import './path.css';

const P = ru.path;
const ICONS: Record<string, string> = { kin: 'path', rot: 'refresh', dyn: 'bolt', inr: 'target', wrk: 'bolt', cons: 'repeat', pot: 'wave', osc: 'wave', dmp: 'wave', frc: 'wave', rel: 'clock', mkt: 'atom', thd: 'flame', ent: 'spark' };
const STATUS_IC: Record<string, string> = { done: 'check', progress: 'pencil', available: 'star', locked: 'lock' };

function Node({ s, offset }: { s: TopicState; offset: number }) {
  return (
    <li className={`pnode st-${s.status}`} style={{ ['--off' as string]: `${offset}px` }}>
      <Link to={`/topic/${s.topic.id}`} className="pnode-link">
        <span className="pnode-ic" aria-hidden="true">
          <Icon name={s.status === 'locked' ? 'lock' : ICONS[s.topic.id] || 'book'} />
          <em>{s.index + 1}</em>
        </span>
        <span className="pnode-body">
          <b>{s.topic.n}</b>
          <span className="mut small">
            <Icon name={STATUS_IC[s.status]} size={14} /> {P.st[s.status]}
            {s.m.n ? ` · ${s.m.ok} из ${s.m.n}` : ''}
          </span>
          {s.status !== 'locked' && <Bar value={s.m.acc * 100} color={STATUS_COLOR[s.m.s]} />}
          {s.status === 'locked' && s.prev && <span className="mut small">{P.lockedHint(s.prev.n)}</span>}
        </span>
      </Link>
    </li>
  );
}

export function PathPage() {
  const st = useProgress();
  const wave = [0, 28, 44, 28, 0, -28, -44, -28];
  return (
    <div>
      <PageHeader title={P.title} subtitle={P.subtitle} art="isaac" />
      {SECTIONS.map((sec) => {
        const states = sectionStates(st, sec);
        const pr = sectionProgress(st, sec);
        return (
          <section key={sec.id} className="psection">
            <div className="psection-head">
              <div>
                <h2>{P.sections[sec.id]}</h2>
                <p className="mut small">{P.sectionNote[sec.id]}</p>
              </div>
              <span className="badge">{P.doneOf(pr.done, pr.total)}</span>
            </div>
            <ol className="ptrack">
              {states.map((s, i) => <Node key={s.topic.id} s={s} offset={wave[i % wave.length]} />)}
            </ol>
          </section>
        );
      })}
      <div className="grid2">
        <Link className="btn" to="/formulas"><Icon name="formulas" />{ru.nav.formulas}</Link>
        <Link className="btn" to="/trig"><Icon name="wave" />{ru.nav.trig}</Link>
        <Link className="btn span2" to="/formulas/lab"><Icon name="pencil" />{ru.nav.formulaLab}</Link>
      </div>
      <p className="note">{P.rule}</p>
    </div>
  );
}
