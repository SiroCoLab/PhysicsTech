// Progress object — the same structure the existing app keeps in localStorage and the server stores.
// Unknown fields are preserved (both apps use Object.assign(defST(), stored)).

export interface LogEntry {
  k: 'q' | 'g';
  id: number | string;
  t: string;
  ok: 0 | 1;
  c: string; // error category: f — formula, u — units, c — calculation, q — theory
  m: string; // mode: quiz, prac, err, type, exam, train
  ts: number;
}

export interface ErrEntry {
  key: string;
  k: 'q' | 'g';
  id: number | string;
  t: string;
  txt: string;
  ts: number;
}

export interface HistEntry {
  ts: number;
  n: number;
  ok: number;
  pct: number;
  score?: number;
  max?: number;
  grade?: number | null;
  mode?: string;
  dur?: number;
  self?: number;
  v?: number;
}

export interface BestEntry {
  pct: number;
  ok: number;
  n: number;
  ts: number;
  score?: number;
  max?: number;
  grade?: number;
}

export interface SavedSession {
  key: string;
  ts: number;
  type: 'ses' | 'exam';
  title: string;
  [k: string]: unknown;
}

export interface FormulaLabState {
  mode: 'only' | 'derive';
  idx: number;
  answer: string;
  steps: string;
  checked: boolean;
  ok?: boolean;
}

/** Settings of the new web app (kept in the same object, ignored by the old one) */
export interface WebAppPrefs {
  goal?: number; // daily XP goal
}

export interface ProgressState {
  log: LogEntry[];
  err: ErrEntry[];
  best: BestEntry | null;
  hist: HistEntry[];
  read: Record<string, boolean>;
  sv: SavedSession[];
  used: Record<string, Record<string, 1>>;
  v: number;
  formulaLab?: FormulaLabState;
  resetAt?: number;
  pt?: WebAppPrefs;
  [k: string]: unknown;
}
