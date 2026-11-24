/** Unicode formula text -> TeX */
export function toTex(s: string): string;
/** Renders formulas inside an element in place (text nodes -> KaTeX), like the existing app */
export function texAll(root: Element): void;
export function conv(node: Text): void;
export function good(candidate: string): boolean;
export const CAND: RegExp;
export const __texErr: string[];
