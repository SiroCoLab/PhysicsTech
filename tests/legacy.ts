// Loads the existing single-file app (../frontend/index.html) into jsdom so tests can call its functions directly.
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';

let cached: JSDOM | null = null;

export function legacy(): { ev: <T = unknown>(code: string) => T; window: JSDOM['window'] } {
  if (!cached) {
    const html = fs.readFileSync(path.resolve(__dirname, '..', '..', 'frontend', 'index.html'), 'utf8');
    const vc = new VirtualConsole(); // silence "not implemented" messages (scrollTo etc.)
    cached = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/legacy/', virtualConsole: vc });
  }
  const w = cached.window;
  return { ev: <T,>(code: string) => (w as unknown as { eval: (c: string) => T }).eval(code), window: w };
}
