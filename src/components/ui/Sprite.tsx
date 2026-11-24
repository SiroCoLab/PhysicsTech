// Original vector silhouettes of Saint Petersburg landmarks (same as in the existing app), used as decoration.
const onion = (x: number, y: number, r: number) =>
  `M${x - r * 0.7} ${y}C${x - r * 1.35} ${y - r * 0.9} ${x - r * 0.3} ${y - r * 1.3} ${x} ${y - r * 2.3}C${x + r * 0.3} ${y - r * 1.3} ${x + r * 1.35} ${y - r * 0.9} ${x + r * 0.7} ${y}zM${x - 0.9} ${y - r * 2.3 - 9}h1.8v9h-1.8zM${x - 3.5} ${y - r * 2.3 - 6}h7v1.6h-7z`;

const SYMBOLS = `
<symbol id="lm-isaac" viewBox="0 0 200 200"><path d="M14 200v-54h172v54zM50 146l50-25 50 25zM70 124v-26h60v26zM68 82c0-48 64-48 64 0v18H68zM94 48V31h12v17zM92 32c0-12 16-12 16 0zM99 23V8h2v15zM96 12h8v2h-8zM27 146v-22h22v22zM25 126c0-17 26-17 26 0zM37 111v-9h2v9zM151 146v-22h22v22zM149 126c0-17 26-17 26 0zM161 111v-9h2v9z"/></symbol>
<symbol id="lm-ppk" viewBox="0 0 200 200"><path d="M0 200v-16l14-7h172l14 7v16zM44 180v-22l8-8h92l8 8v22zM62 180v-68h28v68zM66 112V86h20v26zM69 86V71h14v15zM68 73c0-13 16-13 16 0zM73.3 64 76 8l2.7 56zM74 9a2 2.3 0 1 0 4 0a2 2.3 0 1 0-4 0zM75.3 0h1.4v7h-1.4zM123 152v-11h16v11zM121 142c0-12 20-12 20 0zM130.2 133v-9h1.6v9z"/></symbol>
<symbol id="lm-adm" viewBox="0 0 200 200"><path d="M0 200v-28l6-5h188l6 5v28zM72 200v-62h56v62zM67 139h66v-6H67zM80 133v-26h40v26zM76 108h48v-5H76zM84 104c0-19 32-19 32 0zM94 91V77h12v14zM97.4 78 100 14l2.6 64zM94 16h12l-6-9z"/></symbol>
<symbol id="lm-spas" viewBox="0 0 200 200"><path d="M40 200v-60h120v60zM84 142v-38l16-46 16 46v38zM54 142v-32h20v32zM126 142v-32h20v32zM14 200V98h26v102zM160 200v-42h22v42z${onion(100, 60, 8)}${onion(64, 111, 11)}${onion(136, 111, 11)}${onion(27, 99, 13)}${onion(171, 159, 8)}"/></symbol>
<symbol id="lm-palace" viewBox="0 0 200 200"><path d="M0 200v-50h200v50zM0 150v-5h200v5zM8 145v-9h3v9zM30 145v-9h3v9zM52 145v-9h3v9zM74 145v-9h3v9zM123 145v-9h3v9zM145 145v-9h3v9zM167 145v-9h3v9zM189 145v-9h3v9zM97 146V60h6v86zM88 150v-12h24v12zM93 60h14v-5H93zM97 55a3 3.5 0 1 0 6 0a3 3.5 0 1 0-6 0zM99 30h2v20h-2zM95.5 35h9v2h-9z"/></symbol>
<symbol id="lm-bridge" viewBox="0 0 400 200"><path d="M0 150h152v9H0zM248 150h152v9H248zM138 150h18v50h-18zM244 150h18v50h-18zM40 159h12v41H40zM348 159h12v41h-12zM146 150l42-72 9 5-40 70zM254 150l-42-72-9 5 40 70zM90 150v-24h2v24zM88 124a3 3 0 1 0 6 0a3 3 0 1 0-6 0zM308 150v-24h2v24zM306 124a3 3 0 1 0 6 0a3 3 0 1 0-6 0z"/></symbol>`;

export function Sprite() {
  return <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" dangerouslySetInnerHTML={{ __html: `<defs>${SYMBOLS}</defs>` }} />;
}

export function Skyline() {
  const H = 168;
  const u = (id: string, x: number, w: number) => <use href={`#lm-${id}`} x={x} y={H - w} width={w} height={w} />;
  return (
    <svg className="skyline" viewBox="0 0 800 200" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <radialGradient id="skg" cx="50%" cy="100%" r="70%">
          <stop offset="0" stopColor="#53C7E8" stopOpacity=".5" />
          <stop offset=".6" stopColor="#3478F6" stopOpacity=".12" />
          <stop offset="1" stopColor="#3478F6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="skw" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1A5A9C" />
          <stop offset="1" stopColor="#0E2F63" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="800" height={H} fill="url(#skg)" />
      <g fill="#3F82C4" opacity=".5">{u('palace', -10, 170)}{u('palace', 640, 170)}{u('palace', 218, 96)}</g>
      <g fill="#0C2B5E">{u('spas', 150, 112)}{u('isaac', 296, 150)}{u('adm', 452, 118)}{u('ppk', 560, 128)}{u('palace', 20, 128)}{u('palace', 690, 120)}</g>
      <rect x="0" y={H} width="800" height={200 - H} fill="url(#skw)" />
      <g stroke="#53C7E8" strokeWidth="1.6" strokeLinecap="round" opacity=".55">
        <path d="M318 176h96M352 184h60M470 177h70M588 176h40M186 177h44M600 186h30M150 188h80M440 190h90" />
      </g>
      <g fill="#071D42"><use href="#lm-bridge" x="150" y={H - 112} width="170" height="85" /></g>
    </svg>
  );
}
