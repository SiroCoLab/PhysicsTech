"""Builds frontend/index.html from the original PhysicsTech page.

Source: backup/physicstech demo (оригинал).html — a page saved from the browser ("Save page as"),
so besides the original code it contains markup rendered at runtime. This script:
  1. removes the runtime-rendered markup (the app renders it again on start) and browser-save artefacts;
  2. restricts the differentiated-exam simulation to mechanics topics (the official list, questions 1–37);
  3. adds a hook so extra screens (admin statistics) can be rendered;
  4. appends the textbook-based question bank extension (after all existing questions, ids unchanged);
  5. appends the server-sync layer.
Every replacement is checked to apply exactly once; otherwise the build stops.

Run:  python tools/build_frontend.py
"""
import hashlib
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'backup' / 'physicstech demo (оригинал).html'
OUT = ROOT / 'frontend' / 'index.html'
SRC_SHA256 = '50DE023E67F72D8DE5ADB083646F9D2C501EB211930C5653B4F2CAEF0725ABA3'


def once(text: str, old: str, new: str, what: str) -> str:
    n = text.count(old)
    if n != 1:
        raise SystemExit(f'[{what}] expected exactly 1 occurrence, found {n}')
    return text.replace(old, new)


def main() -> None:
    raw = SRC.read_bytes()
    digest = hashlib.sha256(raw).hexdigest().upper()
    if digest != SRC_SHA256:
        raise SystemExit(f'Source file changed (sha256 {digest}); review the build steps before rebuilding.')
    t = raw.decode('utf-8')

    # 1. browser-save artefacts
    t = re.sub(r'<!-- saved from url=\(\d+\)[^>]*-->\r?\n', '', t, count=1)
    t = once(t, '<html lang="ru" data-theme="light" style="--tg-viewport-height: 100vh; --tg-viewport-stable-height: 100vh; --tgt0: 0px; --tgb0: 0px;"><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8">',
             '<html lang="ru"><head><meta charset="utf-8">\n<meta name="api-base" content="">', 'html/head')
    t = once(t, '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&display=swap" media="all">',
             '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&amp;display=swap" media="print" onload="this.media=\'all\'">', 'font link')
    b = t.index('<body>')
    first_script = t.index('<script>', b)
    rendered = t[b + len('<body>'):first_script]
    if 'id="app"' not in rendered or 'id="lm-isaac"' not in rendered:
        raise SystemExit('unexpected body structure')
    t = t[:b] + '<body><div id="app"></div>' + t[first_script:]
    if t.count('id="app"') != 1 or t.count('<symbol id="lm-isaac"') != 1:
        raise SystemExit('runtime markup not fully removed')

    # 2. exam simulation: only the official mechanics topics (extension topics are marked ext:1)
    t = once(t, 'const used=new Set(),ord=shuf(TOPICS.map(t=>t.id))', 'const used=new Set(),ord=shuf(TOPICS.filter(t=>!t.ext).map(t=>t.id))', 'exam topics')

    # 3. extra views hook
    t = once(t, 'try{h=V[n](view.arg);}', 'try{h=(V[n]||(window.XVIEWS||{})[n])(view.arg);}', 'render hook')

    # 4. question bank extension, appended right before the storage section
    ext = (ROOT / 'frontend' / 'src' / 'bank_ext.js').read_text(encoding='utf-8').rstrip()
    t = once(t, "const KEY='phys_trainer_mech_v1';", ext + "\nconst KEY='phys_trainer_mech_v1';", 'bank extension')

    # 5. sync layer as the last script
    sync = (ROOT / 'frontend' / 'src' / 'sync.js').read_text(encoding='utf-8').rstrip()
    if '</script' in sync or '</script' in ext:
        raise SystemExit('inserted code must not contain </script')
    i = t.rindex('</body>')
    t = t[:i] + '<script>\n' + sync + '\n</script>\n' + t[i:]

    OUT.write_text(t, encoding='utf-8', newline='')
    print(f'written {OUT} ({len(t.encode("utf-8"))} bytes)')


if __name__ == '__main__':
    main()
