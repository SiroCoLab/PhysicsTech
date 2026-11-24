import { createStore } from '../../lib/store';
import type { ExamState } from './exam';
import { persistExam } from './exam';

/** Current exam attempt (in memory; unfinished attempts are also saved to progress). */
export const examStore = createStore<ExamState | null>(null);

export function setExam(E: ExamState | null, save = true): void {
  examStore.set(E);
  if (E && save && !E.res) persistExam(E);
}
