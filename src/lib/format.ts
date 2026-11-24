// Formatting helpers (ru-RU, Moscow time for server timestamps).

export function plural(n: number, one: string, few: string, many: string): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}

/** Duration in seconds → "1 ч 05 мин", "12 мин", "меньше минуты" */
export function hm(sec: number): string {
  const s = Math.max(0, Math.round(+sec || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h) return `${h} ч ${String(m).padStart(2, '0')} мин`;
  if (m) return `${m} мин`;
  return s ? 'меньше минуты' : '0 мин';
}

/** Stopwatch "m:ss" or "h:mm:ss" */
export function stopwatch(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return (h ? h + ':' + String(m).padStart(2, '0') : String(m)) + ':' + String(s % 60).padStart(2, '0');
}

export function dateTime(v: number | string | null | undefined, withTime = true, moscow = false): string {
  if (v == null || v === '') return '—';
  const d = new Date(v);
  if (isNaN(d.getTime())) return '—';
  const o: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
  if (withTime) Object.assign(o, { hour: '2-digit', minute: '2-digit' });
  if (moscow) o.timeZone = 'Europe/Moscow';
  try {
    return d.toLocaleString('ru-RU', o);
  } catch {
    return d.toLocaleString('ru-RU');
  }
}

export function timeAgo(ts: number, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 60) return 'только что';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} ${plural(m, 'минуту', 'минуты', 'минут')} назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ${plural(h, 'час', 'часа', 'часов')} назад`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'вчера';
  if (d < 7) return `${d} ${plural(d, 'день', 'дня', 'дней')} назад`;
  return dateTime(ts, false);
}

export const score = (x: number | null | undefined): string => (x == null ? '—' : String(Math.round(x * 100) / 100).replace('.', ','));

export function greeting(now = new Date()): string {
  const h = now.getHours();
  return h < 5 ? 'Доброй ночи' : h < 12 ? 'Доброе утро' : h < 18 ? 'Добрый день' : 'Добрый вечер';
}
