import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { STEPS, TY, TYPES, topicName, topicsOfType } from '../content';
import { Solution, TaskView } from '../components/learning/Task';
import { Rich } from '../components/math/Rich';
import { Icon } from '../components/ui/Icon';
import { EmptyState, PageHeader } from '../components/ui/Primitives';
import type { GItem, Item } from '../features/practice/items';
import { pickGT, remember } from '../features/practice/items';
import { ru } from '../i18n/ru';

const P = ru.problems;

export function ProblemsPage() {
  return (
    <div>
      <PageHeader title={P.title} subtitle={P.subtitle} art="palace" />
      <section className="card">
        <h2>{P.howTo}</h2>
        <ol className="list">{STEPS.map((s, i) => <li key={i}>{s}</li>)}</ol>
      </section>
      <section className="card">
        {TYPES.map((T) => (
          <Link key={T.id} to={`/problems/${T.id}`} className="link-row">
            <span><b>{T.n}</b><br /><span className="mut small">{topicsOfType(T.id).map(topicName).join(' · ')}</span></span>
            <Icon name="chevron" />
          </Link>
        ))}
      </section>
    </div>
  );
}

type Step = 'w' | 'p' | 'a';

export function ProblemTypePage() {
  const { id = '' } = useParams();
  const T = TY[id];
  const [step, setStep] = useState<Step | null>(null);
  const [item, setItem] = useState<Item | null>(null);
  if (!T) return <EmptyState icon="problems" title={ru.common.notFound} action={<Link className="btn" to="/problems">{P.allTypes}</Link>} />;

  const open = (w: Step) => {
    const it = w === 'w' ? pickGT(T.id, 2, 2024) : pickGT(T.id, w === 'p' ? 2 : 3);
    if (w !== 'w') remember('g' + it.id);
    setStep(w);
    setItem(it);
  };
  const another = () => {
    const it = pickGT(T.id, step === 'a' ? 3 : 2);
    remember('g' + it.id);
    setItem(it);
  };

  return (
    <div>
      <section className="card">
        <Link to="/problems" className="mut small">{P.allTypes}</Link>
        <h1 style={{ marginTop: 6 }}>{T.n}</h1>
        <h3>{P.algorithm}</h3>
        <ol className="list">{T.tips.map((x, i) => <Rich key={i} as="li" html={x} />)}</ol>
        <div className="grid2" style={{ marginTop: 10 }}>
          {(['w', 'p', 'a'] as Step[]).map((w, i) => (
            <button key={w} className={'btn ' + (step === w ? 'btn-primary' : '') + (i === 0 ? ' span2' : '')} onClick={() => open(w)}>{P.tabs[i]}</button>
          ))}
        </div>
      </section>
      {item && step === 'w' && item.kind === 'g' && (
        <section className="card">
          <p className="mut">{P.worked} · {topicName(item.t)}{item.g.src ? ` · ${ru.task.fromMaterials}: ${item.g.src}` : ''}</p>
          <Rich className="q" html={item.inst.q} />
          <Solution it={item as GItem} />
          <p className="mut">{P.workedNote}</p>
          <button className="btn btn-primary btn-block" onClick={() => open('p')}>{P.similar}</button>
        </section>
      )}
      {item && step !== 'w' && (
        <section className="card" key={`${item.kind}${item.id}${(item as GItem).inst?.q}`}>
          <TaskView it={item} mode="type" onChange={setItem} />
          {item.done && (
            <div className="grid2" style={{ marginTop: 12 }}>
              <button className="btn btn-primary" onClick={another}>{P.another}</button>
              {step === 'p' && <button className="btn" onClick={() => open('a')}>{P.harder}</button>}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
