// Renders trusted educational content (HTML from src/legacy/content.js) and converts formulas to KaTeX
// with the same rules as the existing app. Never pass user input here — use plain React text for it.
import { createElement, useLayoutEffect, useRef } from 'react';
import katex from 'katex';
import { texAll } from '../../legacy/tex.js';

export function Rich({ html, as = 'div', className }: { html: string; as?: 'div' | 'span' | 'p' | 'li'; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = html;
    try {
      texAll(el);
    } catch {
      /* formula rendering is an enhancement: keep the plain text if it fails */
    }
  }, [html]);
  return createElement(as, { ref, className: 'rich' + (className ? ' ' + className : '') });
}

/** A TeX formula (e.g. in the trigonometric table) */
export function Tex({ tex, display }: { tex: string; display?: boolean }) {
  const html = katex.renderToString(tex, { throwOnError: false, displayMode: !!display });
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
