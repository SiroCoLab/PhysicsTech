import { Link, useNavigate } from 'react-router';
import { TaskView } from '../components/learning/Task';
import { Bar, EmptyState } from '../components/ui/Primitives';
import { countAnswer, nextTask, sessionStore, updateItem } from '../features/practice/session';
import { ru } from '../i18n/ru';

const P = ru.practice;

export function SessionPage() {
  const s = sessionStore.use();
  const nav = useNavigate();
  if (!s) return <EmptyState icon="target" title={P.empty} action={<Link className="btn btn-primary" to="/practice">{P.title}</Link>} />;
  if (!s.item) {
    return (
      <EmptyState icon="check" title={s.cfg.err ? P.emptyErrors : P.empty}
        action={<button className="btn" onClick={() => { sessionStore.set(null); nav(s.back); }}>{ru.common.close}</button>} />
    );
  }
  const it = s.item;
  return (
    <div>
      <section className="card session-bar">
        <div className="row">
          <b>{s.title}</b>
          <span className="spacer" />
          <span className="mut small">{P.session(s.n, s.ok)}</span>
          <button className="btn btn-sm" onClick={() => { sessionStore.set(null); nav(s.back); }}>{P.exit}</button>
        </div>
        <div aria-label={ru.task.progress} style={{ marginTop: 8 }}><Bar value={s.n ? (100 * s.ok) / s.n : 0} color="var(--c-ok)" /></div>
      </section>
      <section className="card" key={`${it.kind}${it.id}${s.n}`}>
        <TaskView it={it} mode={s.mode} onChange={updateItem} onAnswered={countAnswer} />
        {it.done && <button className="btn btn-primary btn-block" style={{ marginTop: 14 }} onClick={() => { nextTask(); window.scrollTo(0, 0); }}>{P.next}</button>}
      </section>
    </div>
  );
}
