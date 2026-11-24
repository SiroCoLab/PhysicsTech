// Learning path: sections, topic statuses and soft unlocking.
// A topic opens after the previous one in its section was studied (theory read) or practised (3+ answers).
// Locked topics can still be opened early — nothing is hidden from the student.
import { EXT_TOPICS, MECH_TOPICS } from '../../content';
import type { Topic } from '../../content';
import { mastery, topicAnswerCount } from './mastery';
import type { Mastery } from './mastery';
import type { ProgressState } from './types';

export type TopicStatus = 'done' | 'progress' | 'available' | 'locked';

export interface PathSection {
  id: 'mech' | 'thermo';
  topics: Topic[];
}

export const SECTIONS: PathSection[] = [
  { id: 'mech', topics: MECH_TOPICS },
  { id: 'thermo', topics: EXT_TOPICS },
];

export const UNLOCK_ANSWERS = 3;

export function touched(st: ProgressState, id: string): boolean {
  return !!st.read[id] || topicAnswerCount(st, id) >= UNLOCK_ANSWERS;
}

export interface TopicState {
  topic: Topic;
  index: number; // index within the section
  status: TopicStatus;
  m: Mastery;
  prev?: Topic;
}

export function sectionStates(st: ProgressState, s: PathSection): TopicState[] {
  return s.topics.map((topic, index) => {
    const m = mastery(st, topic.id);
    const prev = index > 0 ? s.topics[index - 1] : undefined;
    let status: TopicStatus;
    if (m.s === 'good') status = 'done';
    else if (st.read[topic.id] || topicAnswerCount(st, topic.id) > 0) status = 'progress';
    else if (!prev || touched(st, prev.id)) status = 'available';
    else status = 'locked';
    return { topic, index, status, m, prev };
  });
}

export function topicState(st: ProgressState, id: string): TopicState | null {
  for (const s of SECTIONS) {
    const x = sectionStates(st, s).find((t) => t.topic.id === id);
    if (x) return x;
  }
  return null;
}

/** Next topic to study: first in-progress topic that is not mastered, else first available one. */
export function recommendedTopic(st: ProgressState): TopicState | null {
  const all = SECTIONS.flatMap((s) => sectionStates(st, s));
  return all.find((t) => t.status === 'available' && !st.read[t.topic.id])
    ?? all.find((t) => t.status === 'progress')
    ?? all.find((t) => t.status === 'available')
    ?? null;
}

export function sectionProgress(st: ProgressState, s: PathSection): { done: number; total: number } {
  const states = sectionStates(st, s);
  return { done: states.filter((t) => t.status === 'done').length, total: states.length };
}
