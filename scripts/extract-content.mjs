// Extracts educational content and engines from the current single-file app (../frontend/index.html)
// into ES modules under src/legacy/. The code is copied VERBATIM (only wrapped into modules),
// so generators, answer keys and the calculator behave exactly as in the existing application.
//
//   npm run extract
//
// Each marker must be found exactly once, otherwise the script stops instead of producing a broken module.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const SRC = path.resolve(root, '..', 'frontend', 'index.html');
const OUT = path.join(root, 'src', 'legacy');
const PUB = path.join(root, 'public');

const t = fs.readFileSync(SRC, 'utf8');
const sha = crypto.createHash('sha256').update(t).digest('hex');

function at(marker, from = 0) {
  const i = t.indexOf(marker, from);
  if (i < 0) throw new Error(`marker not found: ${marker}`);
  if (t.indexOf(marker, i + 1) >= 0 && from === 0) throw new Error(`marker is not unique: ${marker}`);
  return i;
}
const slice = (a, b) => t.slice(at(a), at(b));
const header = (what) =>
  `// СГЕНЕРИРОВАНО scripts/extract-content.mjs — не редактировать вручную.\n// Источник: frontend/index.html (sha256 ${sha.slice(0, 16)}…). ${what}\n/* eslint-disable */\n// @ts-nocheck\n`;

// ---- content: topics, formulas, theory, problem types, questions, generators (+ thermodynamics and textbook extension)
let content = slice("const g=9.8,PI=Math.PI;", "const KEY='phys_trainer_mech_v1';");
content += '\n' + slice('const UNITS=', 'function defST(');
const rngStart = at('const rng=');
content += '\n' + t.slice(rngStart, t.indexOf('\n', rngStart));
const fl = at('const FL_TASKS=[');
content += '\n' + t.slice(fl, t.indexOf('\n];', fl) + 3);
content += '\n' + slice('const DEF={', 'function DEFH(');
content += `\nexport { g, PI, TOPICS, FORM, THEORY, TYPES, STEPS, NOTES, QS, GENS, DEF, FL_TASKS, UNITS, LVN, F, pick, rng };\n`;

// ---- formula rendering: Unicode formula text -> KaTeX (used for theory, questions and solutions)
let tex = slice('const GR={α', "const app=document.getElementById('app')");
tex = tex.replace('window.__texErr=[];', 'const __texErr=[];');
// in the old page KaTeX was a global script; here it is imported
if (!tex.includes('!window.katex')) throw new Error('tex: window.katex check not found');
tex = tex.replace(/window\.katex/g, 'katex');
tex = `import katex from 'katex';\n` + tex + `\nexport { toTex, texAll, conv, good, CAND, __texErr };\n`;

// ---- calculator engine (parser, derivative, antiderivative, numeric integration) and its self-test
let calc = slice('const st={deg:true', '// ---- интерфейс');
for (const [a, b] of [
  ['window.__ct=', 'const __ct='],
  ['window.__calc=', 'const __calc='],
  ['window.__calcSelfTest=function', 'const __calcSelfTest=function'],
  ['console.table(L.map(', '(L.map('],
]) {
  if (calc.split(a).length !== 2) throw new Error(`calc replacement failed: ${a}`);
  calc = calc.replace(a, b);
}
calc = `import katex from 'katex';\n` + calc + `\nexport { st, parse, ev, run, fmt, plain, tx, K, hx, __ct, __calc, __calcSelfTest };\n`;

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'content.js'), header('Учебный контент и генераторы задач.') + content, 'utf8');
fs.writeFileSync(path.join(OUT, 'tex.js'), header('Преобразование формул в KaTeX.') + tex, 'utf8');
fs.writeFileSync(path.join(OUT, 'calc.js'), header('Движок калькулятора.') + calc, 'utf8');

// ---- LETI logo used by the current app
const lg = at("const LOGO='data:image/webp;base64,");
const b64 = t.slice(lg + "const LOGO='data:image/webp;base64,".length, t.indexOf("'", lg + 20));
fs.mkdirSync(PUB, { recursive: true });
fs.writeFileSync(path.join(PUB, 'logo.webp'), Buffer.from(b64, 'base64'));

console.log('extracted: content.js %d KB, tex.js %d KB, calc.js %d KB, logo %d KB',
  Math.round(content.length / 1024), Math.round(tex.length / 1024), Math.round(calc.length / 1024), Math.round(b64.length * 0.75 / 1024));
