import { Link, useNavigate, useParams } from 'react-router';
import { DEF, FORM, NOTES, THEORY, TID, TOPICS, typesOfTopic } from '../content';
import type { Formula } from '../content';
import { Rich } from '../components/math/Rich';
import { Icon } from '../components/ui/Icon';
import { EmptyState } from '../components/ui/Primitives';
import { markRead } from '../features/practice/items';
import { startSession } from '../features/practice/session';
import { STATUS_COLOR } from '../features/progress/mastery';
import { topicState } from '../features/progress/path';
import { useProgress } from '../features/progress/store';
import { ru } from '../i18n/ru';
import './topic.css';

const T = ru.topic;

export function FormulaCard({ f, showTopic }: { f: Formula; showTopic?: boolean }) {
  return (
    <div className="fcard">
      <div className="fcard-title"><b>{f.n}</b>{showTopic && <span className="mut"> · {TID[f.t]?.n}</span>}</div>
      <Rich className="formula" html={f.f} />
      <dl>
        {f.v && <><dt>{T.fVars}</dt><dd><Rich as="span" html={f.v} /></dd></>}
        <dt>{T.fUnits}</dt><dd>{f.u || '—'}</dd>
        {f.w && <><dt>{T.fWhen}</dt><dd><Rich as="span" html={f.w} /></dd></>}
        {f.r && <><dt>{T.fExpr}</dt><dd><Rich as="span" html={f.r} /></dd></>}
      </dl>
    </div>
  );
}

export function TopicPage() {
  const { id = '' } = useParams();
  const st = useProgress();
  const nav = useNavigate();
  const topic = TID[id];
  if (!topic) return <EmptyState icon="book" title={ru.common.notFound} text={ru.common.notFoundText} action={<Link className="btn" to="/path">{ru.nav.path}</Link>} />;
  const th = THEORY[id];
  const defs = DEF[id] || [];
  const ts = topicState(st, id);
  const list = TOPICS.filter((t) => !!t.ext === !!topic.ext);
  const i = list.indexOf(topic);
  const prev = list[i - 1];
  const next = list[i + 1];
  const types = typesOfTopic(id);
  const train = (kinds: 'g' | 'q', title: string) => {
    startSession({ topic: id, kinds, level: 'auto' }, title, '/path', kinds === 'g' ? 'prac' : 'quiz');
    nav('/session');
  };

  return (
    <article className="topic">
      <section className="card topic-head">
        <div className="row">
          <span className="badge badge-dark">{T.of(i + 1, list.length)}</span>
          <span className="badge">{topic.ext ? topic.q : T.ofList(topic.q)}</span>
          {ts && <span className="pill" style={{ background: STATUS_COLOR[ts.m.s] }}>{ru.status[ts.m.s]}</span>}
        </div>
        <h1>{topic.n}</h1>
        {ts?.status === 'locked' && ts.prev && (
          <div className="warn"><Icon name="lock" size={16} /> <b>{T.locked}.</b> {ru.path.lockedHint(ts.prev.n)} {ru.path.openEarly}: {T.earlyNote}</div>
        )}
        {id === 'rel' && <div className="warn">{NOTES[4]}</div>}
        {th && (
          <>
            <h3>{T.simple}</h3>
            <Rich as="p" html={th.s} />
            <h3>{T.main}</h3>
            <ul className="list">{th.m.map((x, k) => <Rich key={k} as="li" html={x} />)}</ul>
          </>
        )}
      </section>

      {defs.length > 0 && (
        <section className="card">
          <h3>{T.definitions}</h3>
          {defs.map((d, k) => (
            <div key={k} className="def">
              <b>{d[0]}</b> — <Rich as="span" html={d[1]} /> <span className="mut">(§ {d[2]}, с. {d[3]})</span>
            </div>
          ))}
          <p className="mut small">{T.defsNote}</p>
        </section>
      )}

      <section className="card">
        <h3>{T.formulas}</h3>
        {FORM.filter((f) => f.t === id).map((f) => <FormulaCard key={f.k} f={f} />)}
      </section>

      {th && (
        <section className="card">
          <h3>{T.origin}</h3>
          <Rich as="p" html={th.o} />
          <h3>{T.choose}</h3>
          <Rich as="p" html={th.ch} />
          <h3>{T.example}</h3>
          <Rich as="p" html={th.ex} />
          <h3>{T.mistakes}</h3>
          <ul className="list">{th.er.map((x, k) => <Rich key={k} as="li" html={x} />)}</ul>
        </section>
      )}

      <section className="card">
        <h3>{T.related}</h3>
        <div className="grid2">
          <button className="btn btn-primary span2" onClick={() => train('g', ru.practice.problemsTitle(topic.n))}><Icon name="pencil" />{T.solve}</button>
          <button className="btn" onClick={() => train('q', ru.practice.testTitle(topic.n))}><Icon name="target" />{T.test}</button>
          <Link className="btn" to={`/formulas?topic=${id}`}><Icon name="formulas" />{T.formulasOf}</Link>
        </div>
        {types.length > 0 && (
          <>
            <p className="mut" style={{ marginTop: 12 }}>{T.types}:</p>
            {types.map((ty) => (
              <Link key={ty.id} to={`/problems/${ty.id}`} className="link-row"><span>{ty.n}</span><Icon name="chevron" /></Link>
            ))}
          </>
        )}
        <button className={'btn btn-block ' + (st.read[id] ? '' : 'btn-ok')} style={{ marginTop: 14 }} onClick={() => markRead(id, !st.read[id])}>
          {st.read[id] ? T.unmarkRead : <><Icon name="check" />{T.markRead}</>}
        </button>
        <div className="topic-nav">
          {prev ? <Link className="btn btn-sm" to={`/topic/${prev.id}`}>{T.prev}</Link> : <span />}
          {next ? <Link className="btn btn-sm" to={`/topic/${next.id}`}>{T.next}</Link> : <span />}
        </div>
      </section>
      <p className="note">{T.source}</p>
    </article>
  );
}
