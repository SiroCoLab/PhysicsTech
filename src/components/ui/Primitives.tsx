import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ru } from '../../i18n/ru';
import { Icon } from './Icon';

export function ProgressRing({ value, size = 104, label, color }: { value: number; size?: number; label?: ReactNode; color?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      className="ring"
      role="img"
      aria-label={`${Math.round(v)}%`}
      style={{ width: size, height: size, background: `conic-gradient(${color || 'var(--c-primary)'} ${v * 3.6}deg, var(--c-surface-2) 0)` }}
    >
      <span>{label ?? <b>{Math.round(v)}<small>%</small></b>}</span>
    </div>
  );
}

export function Bar({ value, color }: { value: number; color?: string }) {
  return (
    <div className="bar" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color || 'var(--c-primary)' }} />
    </div>
  );
}

export function Loading({ text }: { text?: string }) {
  return (
    <div className="card state" aria-busy="true">
      <span className="spinner" aria-hidden="true" />
      <span>{text || ru.common.loading}</span>
    </div>
  );
}

export function EmptyState({ icon = 'spark', title, text, action }: { icon?: string; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="card state">
      <span className="state-ic"><Icon name={icon} /></span>
      <b>{title}</b>
      {text && <p className="mut">{text}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <div className="card state" role="alert">
      <span className="state-ic bad"><Icon name="errors" /></span>
      <b>{ru.common.errorTitle}</b>
      <p className="mut">{text}</p>
      {onRetry && <button className="btn btn-sm" onClick={onRetry}><Icon name="refresh" />{ru.common.retry}</button>}
    </div>
  );
}

export function PageHeader({ title, subtitle, tag, art = 'isaac' }: { title: string; subtitle?: string; tag?: string; art?: string }) {
  return (
    <header className="phead">
      <svg className="phead-art" viewBox="0 0 200 200" aria-hidden="true"><use href={`#lm-${art}`} /></svg>
      {tag && <span className="phead-tag">{tag}</span>}
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </header>
  );
}

export function SectionTitle({ children, to, link }: { children: ReactNode; to?: string; link?: string }) {
  return (
    <div className="sect">
      <h2>{children}</h2>
      {to && <Link to={to}>{link || ru.common.more}</Link>}
    </div>
  );
}

export function GradeBadge({ grade, title }: { grade: number | null | undefined; title?: string }) {
  if (!grade) return <span>—</span>;
  return <span className={`grade grade-${grade}`} title={title}>{grade}</span>;
}

export function Stat({ value, label, icon, color }: { value: ReactNode; label: string; icon?: string; color?: string }) {
  return (
    <div className="stat-tile">
      {icon && <span className="stat-ic" style={{ background: color || 'var(--c-primary)' }}><Icon name={icon} /></span>}
      <span><b>{value}</b><small>{label}</small></span>
    </div>
  );
}
