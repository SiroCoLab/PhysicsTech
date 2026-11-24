// Types of the educational content (structure matches the existing application data).

export interface Topic {
  id: string;
  /** title */
  n: string;
  /** numbers of the official exam questions, or "расширенный курс" */
  q: string;
  /** 1 for extension topics (thermodynamics) that are not part of the differentiated exam */
  ext?: 1;
}

export interface Formula {
  k: string; // key
  t: string; // topic id
  n: string; // name
  f: string; // formula text (Unicode)
  v: string; // variables
  u: string; // units
  w: string; // when to use
  r: string; // rearranged forms
}

export interface Theory {
  s: string; // in simple words
  m: string[]; // main points
  o: string; // where the formula comes from
  ch: string; // how to choose a formula
  ex: string; // example
  er: string[]; // typical mistakes
}

export interface ProblemType {
  id: string;
  n: string;
  tips: string[];
}

export interface QOption {
  x: string; // text (may contain HTML)
  ok: boolean;
  w: string; // why this option is wrong
}

export interface Question {
  id: number;
  t: string;
  l: number; // level 1..3
  k: 's' | 'm'; // single / multiple choice
  q: string;
  e: string; // explanation
  fk: string[]; // formula keys
  o: QOption[];
  fig?: string; // inline SVG graph
}

/** [wrong value, explanation, category: f — formula, u — units, c — calculation] */
export type WrongAnswer = [number, string, string];
/** [statement, given, solution steps, answer, unit, typical wrong answers] */
export type GenOutput = [string, string, string[], number, string, WrongAnswer[]?];

export interface Generator {
  id: string;
  t: string; // topic id
  ty: string; // problem type id
  l: number; // level
  src: string; // source in the course materials ("" if none)
  fk: string[];
  fn: (r: () => number) => GenOutput;
}

/** [term, definition, section, pages] — I. V. Savelyev, vol. I */
export type DefEntry = [string, string, string, string];

export interface FlTask {
  id: string;
  mode: 'only' | 'derive';
  t: string;
  title: string;
  q: string;
  given?: string;
  hint: string;
  answers: string[];
  show: string;
  why: string;
}
