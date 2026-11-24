export type CalcMode = 'calc' | 'diff' | 'int';
export interface CalcState {
  deg: boolean;
  ans: number;
  /** history: [expression, result text, plain result] */
  h: [string, string, string][];
  mode: CalcMode;
  act: 'e' | 'a' | 'b' | 'x';
  f: { e: string; a: string; b: string; x: string };
  num: number | null;
}
export interface CalcResult {
  tex: string; // HTML (KaTeX) of the result
  num: number | null;
  note: string;
  txt?: string;
  F?: unknown;
}
export type Ast = unknown[];
export const st: CalcState;
export function parse(src: string): Ast;
export function ev(n: Ast, x?: number, deg?: boolean): number;
/** Main calculation: throws Error with a Russian message on invalid input */
export function run(mode: CalcMode, e: string, a: string, b: string, x0: string): CalcResult;
export function fmt(x: number): string;
export function plain(x: number): string;
export function tx(n: Ast, min?: number): string;
export function K(tex: string, display?: boolean): string;
export function hx(n: Ast): boolean;
export function __ct(m: CalcMode, e: string, a?: string, b?: string, x?: string): { txt?: string; num?: number | null; note?: string; err?: string };
export function __calc(e: string): number;
export function __calcSelfTest(): { всего: number; пройдено: number; ошибки: { n: string; ok: boolean; d: unknown }[] };
