// Progressive hints for numeric problems (same texts and rules as the existing app).
import { FORM, FK, QTY, topicName } from '../../content';
import type { Formula } from '../../content';
import type { GItem, QItem } from './items';

export const HINT_TITLES = ['Что нужно найти?', 'Вспомни закон', 'Подумай о формуле', 'Проверь единицы'] as const;

export function formsFor(it: GItem): Formula[] {
  const u = (it.inst.u || '').trim();
  let fs = (it.g.fk || []).map((k) => FK[k]).filter(Boolean);
  if (!fs.length) fs = FORM.filter((f) => f.t === it.t && f.u === u).slice(0, 2);
  return fs;
}

export function formulaNamesOfQuestion(it: QItem): string[] {
  return (it.q.fk || []).map((k) => FK[k]?.n).filter((x): x is string => !!x);
}

/** What is asked, derived from the unit of the answer */
export function unknownQuantity(it: GItem): string {
  const u = (it.inst.u || '').trim();
  return QTY[u] || 'искомая величина';
}

export function hintList(it: GItem): string[] {
  const x = it.inst;
  const u = (x.u || '').trim();
  const fs = formsFor(it);
  const syms = [...new Set(String(x.d || '').split(/[;\n]/).map((s) => s.split('=')[0].trim()).filter((s) => s && s.length < 14))].slice(0, 6);
  const bad: string[] = [];
  const re = /\d\s?(см|мм|мкм|км\/ч|км|мг|г|об\/мин|мин|кН|кДж|мс|ч|°)(?![А-Яа-яA-Za-z])/g;
  const src = String(x.q || '') + ' ' + String(x.d || '');
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) if (!bad.includes(m[1])) bad.push(m[1]);
  return [
    'Ответ нужен в единицах «' + (u || '—') + '» — это ' + (QTY[u] || 'искомая величина') + '. ' + (syms.length ? 'Выпишите, что дано: ' + syms.join(', ') + '. ' : '') + 'Перечитайте вопрос и обозначьте искомую величину буквой.',
    fs.length
      ? 'Тема задачи — «' + topicName(it.t) + '». Здесь работает: ' + fs.slice(0, 2).map((f) => '«' + f.n + '»').join(' и ') + '. Вспомните формулировку, не заглядывая в справочник.'
      : 'Тема задачи — «' + topicName(it.t) + '». Вспомните определение искомой величины и закон, который связывает её с данными.',
    (fs.length && fs[0].w ? fs[0].w + ' ' : '') + 'Запишите формулу сами и выразите из неё искомую величину в общем виде — числа подставляйте только в конце.',
    bad.length
      ? 'В условии есть величины не в СИ (' + bad.join(', ') + '): переведите их в основные единицы до подстановки. Проверьте, что результат получается в «' + (u || '—') + '».'
      : 'Все данные уже в СИ. Проверьте размерность: после подстановки должно получиться «' + (u || '—') + '». Оцените порядок величины — правдоподобен ли он?',
  ];
}
