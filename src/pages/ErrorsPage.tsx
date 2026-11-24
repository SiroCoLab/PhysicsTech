import { useNavigate } from 'react-router';
import { topicName } from '../content';
import { Rich } from '../components/math/Rich';
import { PageHeader } from '../components/ui/Primitives';
import { startSession } from '../features/practice/session';
import { useProgress } from '../features/progress/store';
import { timeAgo } from '../lib/format';
import { ru } from '../i18n/ru';

const E = ru.errors;

export function ErrorsPage() {
  const st = useProgress();
  const nav = useNavigate();
  const list = st.err.slice().reverse();
  return (
    <div>
      <PageHeader title={E.title} subtitle={E.subtitle} art="ppk" />
      <section className="card">
        <p className="mut">{E.text}</p>
        <button className="btn btn-primary btn-block" disabled={!list.length} onClick={() => { startSession({ err: 1 }, E.title, '/errors', 'err'); nav('/session'); }}>{E.start}</button>
      </section>
      <section className="card">
        {list.length ? list.map((e) => (
          <div key={e.key} className="link-row" style={{ cursor: 'default' }}>
            <span>
              <Rich as="span" html={e.txt + '…'} />
              <br /><span className="mut small">{topicName(e.t)} · {e.k === 'q' ? E.kindQ : E.kindG} · {timeAgo(e.ts)}</span>
            </span>
          </div>
        )) : <p className="mut">{E.empty}</p>}
      </section>
    </div>
  );
}
