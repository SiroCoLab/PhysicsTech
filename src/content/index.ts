// Single entry point to the educational content (extracted verbatim from the existing app).
import { DEF, FL_TASKS, FORM, GENS, LVN, NOTES, QS, STEPS, THEORY, TOPICS, TYPES, UNITS, F } from '../legacy/content.js';
import type { Formula, Generator, ProblemType, Topic } from './types';

export { DEF, FL_TASKS, FORM, GENS, LVN, NOTES, QS, STEPS, THEORY, TOPICS, TYPES, UNITS, F };
export type * from './types';

export const TID: Record<string, Topic> = Object.fromEntries(TOPICS.map((t) => [t.id, t]));
export const TY: Record<string, ProblemType> = Object.fromEntries(TYPES.map((t) => [t.id, t]));
export const GID: Record<string, Generator> = Object.fromEntries(GENS.map((g) => [g.id, g]));
export const FK: Record<string, Formula> = Object.fromEntries(FORM.map((f) => [f.k, f]));

export const MECH_TOPICS = TOPICS.filter((t) => !t.ext);
export const EXT_TOPICS = TOPICS.filter((t) => t.ext);

export function topicName(id: string): string {
  return TID[id]?.n ?? id;
}

/** Unit -> what quantity is asked (used in hints and the "Найти" block). Copied from the existing app. */
export const QTY: Record<string, string> = {
  'кПа': 'давление', 'Дж/К': 'энтропия', '%': 'коэффициент полезного действия (в процентах)', 'кДж': 'энергия, работа или теплота', 'К': 'температура',
  'м/с': 'скорость', 'м/с²': 'ускорение', 'Н': 'сила', 'Дж': 'энергия или работа', 'Вт': 'мощность', 'кг': 'масса', 'м': 'длина, расстояние или высота',
  'см': 'длина', 'с': 'время или период', 'кг·м²': 'момент инерции', 'рад/с': 'угловая скорость', 'рад/с²': 'угловое ускорение', 'Н·м': 'момент силы',
  'кг·м/с': 'импульс', 'Гц': 'частота', 'с⁻¹': 'коэффициент затухания или частота', 'рад': 'угол', '°': 'угол', 'Н/м': 'жёсткость',
  'об/мин': 'частота вращения', 'лет': 'промежуток времени', 'c': 'скорость в долях скорости света', 'л': 'объём', '': 'безразмерная величина (число, отношение)',
};

/** Types of problems that have generators for a topic */
export function typesOfTopic(topicId: string): ProblemType[] {
  return TYPES.filter((T) => GENS.some((g) => g.ty === T.id && g.t === topicId));
}

export function topicsOfType(typeId: string): string[] {
  return [...new Set(GENS.filter((g) => g.ty === typeId).map((g) => g.t))];
}
