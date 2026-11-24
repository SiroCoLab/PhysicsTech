import type { DefEntry, FlTask, Formula, Generator, ProblemType, Question, Theory, Topic } from '../content/types';

export const g: number;
export const PI: number;
export const TOPICS: Topic[];
export const FORM: Formula[];
export const THEORY: Record<string, Theory>;
export const TYPES: ProblemType[];
export const STEPS: string[];
export const NOTES: string[];
export const QS: Question[];
export const GENS: Generator[];
export const DEF: Record<string, DefEntry[]>;
export const FL_TASKS: FlTask[];
export const UNITS: string[];
export const LVN: string[];
/** Number formatting used in all generated problems: 3 significant digits, comma, ·10ⁿ */
export function F(x: number, p?: number): string;
export function pick<T>(r: () => number, a: T[]): T;
/** Seeded PRNG (mulberry32) — same seeds give the same problems as in the existing app */
export function rng(seed: number): () => number;
