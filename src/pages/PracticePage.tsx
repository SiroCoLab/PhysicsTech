import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { TOPICS, UNITS } from '../content';
import { Icon } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/Primitives';
import type { SessionConfig } from '../features/practice/items';
import { startSession } from '../features/practice/session';
import { useProgress } from '../features/progress/store';
import { ru } from '../i18n/ru';

const P = ru.practice;

export function PracticePage() {
  const nav = useNavigate();
  const st = useProgress();
  const [kind, setKind] = useState<'quiz' | 'prac'>('quiz');
  const [topic, setTopic] = useState('adapt');
  const [format, setFormat] = useState<'mix' | 'q' | 'g'>('mix');
  const [level, setLevel] = useState('auto');

  const start = () => {
    const cfg: SessionConfig = kind === 'quiz' ? { topic, kinds: format, level } : { topic, kinds: 'g', level };
    startSession(cfg, kind === 'quiz' ? P.quiz : P.prac, '/practice', kind === 'quiz' ? 'quiz' : 'prac');
    nav('/session');
  };

  return (
    <div>
      <PageHeader title={P.title} subtitle={P.subtitle} art="ppk" />
      <div className="chips" role="tablist">
        <button className="chip" aria-pressed={kind === 'quiz'} onClick={() => setKind('quiz')}>{P.quiz}</button>
        <button className="chip" aria-pressed={kind === 'prac'} onClick={() => setKind('prac')}>{P.prac}</button>
      </div>
      <section className="card">
        <h2>{kind === 'quiz' ? P.quiz : P.prac}</h2>
        <p className="mut">{kind === 'quiz' ? P.quizText : P.pracText}</p>
        <div className="row" style={{ marginTop: 10 }}>
          <label className="field">{P.topic}
            <select className="input" value={topic} onChange={(e) => setTopic(e.target.value)}>
              <option value="adapt">{P.adapt}</option>
              {TOPICS.map((t) => <option key={t.id} value={t.id}>{t.n}</option>)}
            </select>
          </label>
          {kind === 'quiz' && (
            <label className="field">{P.format}
              <select className="input" value={format} onChange={(e) => setFormat(e.target.value as 'mix' | 'q' | 'g')}>
                {(['mix', 'q', 'g'] as const).map((k) => <option key={k} value={k}>{P.formats[k]}</option>)}
              </select>
            </label>
          )}
          <label className="field">{P.level}
            <select className="input" value={level} onChange={(e) => setLevel(e.target.value)}>
              {(['auto', '1', '2', '3'] as const).map((k) => <option key={k} value={k}>{P.levels[k]}</option>)}
            </select>
          </label>
        </div>
        <button className="btn btn-primary btn-block" style={{ marginTop: 14 }} onClick={start}>{P.start}</button>
      </section>
      <div className="grid2">
        <button className="btn" onClick={() => { startSession({ pool: UNITS }, P.unitsTitle, '/practice', 'prac'); nav('/session'); }}><Icon name="repeat" />{P.units}</button>
        <Link className="btn" to="/problems"><Icon name="problems" />{P.types}</Link>
        <Link className="btn span2" to="/errors"><Icon name="errors" />{P.errors}{st.err.length ? ` · ${st.err.length}` : ''}</Link>
      </div>
    </div>
  );
}
