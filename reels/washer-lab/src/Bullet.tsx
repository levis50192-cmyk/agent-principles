import React from 'react';
import {AbsoluteFill, Easing, useCurrentFrame} from 'remotion';
import '@fontsource/noto-sans-tc/700.css';
import '@fontsource/noto-sans-tc/900.css';

export const FPS = 30;
export const DURATION = 30 * FPS;
export const FONT = '"Noto Sans TC", sans-serif';
export const ease = Easing.bezier(0.22, 1, 0.36, 1);
export const back = Easing.bezier(0.34, 1.56, 0.64, 1);
export const clamp = (v: number) => Math.max(0, Math.min(1, v));
export const seg = (f: number, a: number, b: number) => clamp((f - a) / (b - a));

export const INK = '#1f2233';
const BRASS = '#E0A526', BRASS_D = '#b07d12', BRASS_L = '#f6d47a';
const COPPER = '#C26A3D', COPPER_D = '#8f4524', COPPER_L = '#e59a72';
const SILVER = '#c3c9d3';
export const RED = '#e5383b';

// scene boundaries (frames)
export const SC = [0, 100, 250, 430, 600, 760, 900];

// ------------------------------------------------------------------ helpers
export const T: React.FC<{x: number; y: number; s: number; c?: string; sw?: number; st?: string; w?: number; a?: 'middle' | 'start' | 'end'; children: React.ReactNode; op?: number}> = ({x, y, s, c = '#fff', sw = 14, st = INK, w = 900, a = 'middle', children, op = 1}) => (
  <text x={x} y={y} fontSize={s} fill={c} stroke={st} strokeWidth={sw} strokeLinejoin="round" paintOrder="stroke" textAnchor={a} fontFamily={FONT} fontWeight={w} opacity={op}>{children}</text>
);

export const Pop: React.FC<{f: number; at: number; x: number; y: number; children: React.ReactNode; dur?: number}> = ({f, at, x, y, children, dur = 12}) => {
  const k = seg(f, at, at + dur);
  if (k <= 0) return null;
  const sc = back(k);
  return <g transform={`translate(${x},${y}) scale(${sc})`} opacity={clamp(k * 3)}>{children}</g>;
};

export const Cap: React.FC<{f: number; at: number; until: number; text: string; y?: number; size?: number}> = ({f, at, until, text, y = 1590, size = 56}) => {
  const k = seg(f, at, at + 8) * (1 - seg(f, until - 6, until));
  if (k <= 0) return null;
  const w = [...text].length * size + 90;
  return (
    <g opacity={k} transform={`translate(540,${y + (1 - ease(seg(f, at, at + 8))) * 30})`}>
      <rect x={-w / 2} y={-size * 0.95} width={w} height={size * 1.55} rx={size * 0.4} fill="rgba(20,24,40,0.88)" />
      <text x={0} y={size * 0.12} fontSize={size} fill="#fff" textAnchor="middle" fontFamily={FONT} fontWeight={900}>{text}</text>
    </g>
  );
};

export const Rays: React.FC<{f: number; c1: string; c2: string; cy?: number}> = ({f, c1, c2, cy = 960}) => (
  <g>
    <rect width={1080} height={1920} fill={c1} />
    <g transform={`translate(540,${cy}) rotate(${f * 0.25})`}>
      {Array.from({length: 18}, (_, i) => {
        const a1 = (i / 18) * Math.PI * 2, a2 = a1 + Math.PI / 18, R = 2400;
        return <polygon key={i} points={`0,0 ${Math.cos(a1) * R},${Math.sin(a1) * R} ${Math.cos(a2) * R},${Math.sin(a2) * R}`} fill={c2} />;
      })}
    </g>
  </g>
);

export const Burst: React.FC<{text: string; fill?: string; r?: number; size?: number; rot?: number}> = ({text, fill = '#fff', r = 110, size = 64, rot = -8}) => {
  const pts = Array.from({length: 24}, (_, i) => { const a = (i / 24) * Math.PI * 2; const rr = i % 2 ? r * 0.72 : r; return `${Math.cos(a) * rr},${Math.sin(a) * rr * 0.8}`; }).join(' ');
  return (
    <g transform={`rotate(${rot})`}>
      <polygon points={pts} fill={fill} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      <text x={0} y={size * 0.36} fontSize={size} fill={INK} textAnchor="middle" fontFamily={FONT} fontWeight={900}>{text}</text>
    </g>
  );
};

// ------------------------------------------------------------------ bullet (side view, tip up, origin = centre)
const Bullet: React.FC<{x: number; y: number; a?: number; s?: number}> = ({x, y, a = 0, s = 1}) => (
  <g transform={`translate(${x},${y}) rotate(${a}) scale(${s})`}>
    <path d="M -24 -38 L -24 -55 Q -22 -100 0 -122 Q 22 -100 24 -55 L 24 -38 Z" fill={COPPER} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M -12 -50 Q -11 -88 -2 -108" stroke={COPPER_L} strokeWidth={7} fill="none" strokeLinecap="round" />
    <rect x={-28} y={-40} width={56} height={140} rx={4} fill={BRASS} stroke={INK} strokeWidth={6} />
    <rect x={-16} y={-30} width={9} height={118} rx={4} fill={BRASS_L} />
    <rect x={14} y={-30} width={8} height={118} rx={4} fill={BRASS_D} opacity={0.5} />
    <rect x={-31} y={98} width={62} height={18} rx={4} fill={BRASS_D} stroke={INK} strokeWidth={6} />
  </g>
);

// ------------------------------------------------------------------ washer character
type Mood = 'ok' | 'worry' | 'shock' | 'happy' | 'wink' | 'dizzy';
export const Washer: React.FC<{id: string; f: number; x: number; y: number; s?: number; drum?: number; shake?: number; look?: [number, number]; mood?: Mood; door?: number; inside?: React.ReactNode; hole?: React.ReactNode; sweat?: number; rpm?: string; water?: boolean; clothes?: boolean; wl?: number; lcd?: string; space?: boolean}> =
({id, f, x, y, s = 1, drum = 0, shake = 0, look = [0, 0], mood = 'ok', door = 0, inside, hole, sweat = 0, rpm = '0', water = true, clothes = true, wl = 150, lcd = '#7CFFB2', space = false}) => {
  const sx = Math.sin(f * 2.1) * shake, sy = Math.cos(f * 2.9) * shake * 0.6;
  const ex = look[0] * 14, ey = look[1] * 14;
  const eye = (cx: number, right: boolean) => {
    if (mood === 'dizzy') {
      const pts = Array.from({length: 40}, (_, i) => { const a = i * 0.45 + f * 0.4 * (right ? 1 : -1); const r = 2 + i * 0.95; return `${cx + Math.cos(a) * r},${-292 + Math.sin(a) * r}`; }).join(' ');
      return <g><ellipse cx={cx} cy={-292} rx={42} ry={48} fill="#fff" stroke={INK} strokeWidth={9} /><polyline points={pts} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" /></g>;
    }
    if (mood === 'happy' || (mood === 'wink' && right)) return <path d={`M ${cx - 34} -282 Q ${cx} -330 ${cx + 34} -282`} stroke={INK} strokeWidth={12} fill="none" strokeLinecap="round" />;
    const big = mood === 'shock' ? 1.18 : 1;
    return (
      <g>
        <ellipse cx={cx} cy={-292} rx={40 * big} ry={48 * big} fill="#fff" stroke={INK} strokeWidth={9} />
        <circle cx={cx + ex} cy={-288 + ey} r={mood === 'shock' ? 12 : 19} fill={INK} />
        <circle cx={cx + ex + 6} cy={-296 + ey} r={5} fill="#fff" />
        {mood === 'worry' && <path d={`M ${cx - 40} ${right ? -362 : -350} L ${cx + 40} ${right ? -350 : -362}`} stroke={INK} strokeWidth={10} strokeLinecap="round" />}
      </g>
    );
  };
  const mouth = mood === 'shock' || mood === 'dizzy' ? <ellipse cx={20} cy={-222} rx={16} ry={14} fill={INK} />
    : mood === 'worry' ? <path d="M -6 -220 Q 8 -232 20 -220 Q 32 -208 46 -220" stroke={INK} strokeWidth={8} fill="none" strokeLinecap="round" />
    : <path d="M -4 -232 Q 20 -206 44 -232" stroke={INK} strokeWidth={9} fill="none" strokeLinecap="round" />;
  const c = Math.cos(door * Math.PI * 0.42);
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      {!space && <ellipse cx={0} cy={430} rx={330} ry={34} fill="rgba(0,0,0,0.16)" />}
      <g transform={`translate(${sx},${sy})`}>
        <rect x={-260} y={360} width={90} height={46} rx={12} fill={INK} />
        <rect x={170} y={360} width={90} height={46} rx={12} fill={INK} />
        <rect x={-320} y={-390} width={640} height={770} rx={80} fill="#f7f8fc" stroke={INK} strokeWidth={12} />
        <rect x={-292} y={-170} width={22} height={420} rx={11} fill="#fff" />
        <rect x={262} y={-170} width={26} height={500} rx={13} fill="#e4e8f0" />
        <line x1={-314} y1={-196} x2={314} y2={-196} stroke={INK} strokeWidth={10} />
        {/* LCD */}
        <rect x={-282} y={-336} width={168} height={84} rx={14} fill="#1e2b38" stroke={INK} strokeWidth={8} />
        <text x={-198} y={-279} fontSize={44} fill={lcd} textAnchor="middle" fontFamily={`monospace, ${FONT}`} fontWeight={700}>{rpm}</text>
        {/* knob */}
        <circle cx={238} cy={-294} r={50} fill="#dfe3ea" stroke={INK} strokeWidth={10} />
        <line x1={238} y1={-294} x2={238 + Math.cos(drum * 0.002 - 1.2) * 34} y2={-294 + Math.sin(drum * 0.002 - 1.2) * 34} stroke={INK} strokeWidth={9} strokeLinecap="round" />
        {/* face */}
        {eye(-40, false)}{eye(80, true)}
        {mouth}
        <ellipse cx={-92} cy={-236} rx={20} ry={11} fill="#ff9aa8" opacity={0.7} />
        <ellipse cx={132} cy={-236} rx={20} ry={11} fill="#ff9aa8" opacity={0.7} />
        {/* door opening + drum */}
        <defs><clipPath id={`gl-${id}`}><circle cx={0} cy={90} r={188} /></clipPath></defs>
        <circle cx={0} cy={90} r={252} fill="#cfd5df" stroke={INK} strokeWidth={12} />
        <circle cx={0} cy={90} r={206} fill="#2b3245" stroke={INK} strokeWidth={8} />
        {hole && <g transform="translate(0,90)">{hole}</g>}
        {door < 0.98 && (
          <g transform={`translate(-252,90) scale(${c},1) translate(252,0)`}>
            
            <g transform="translate(0,-90)">
              <circle cx={0} cy={90} r={206} fill="#aab3c2" stroke={INK} strokeWidth={10} />
              <g clipPath={`url(#gl-${id})`}>
                <circle cx={0} cy={90} r={188} fill="#d6f0ff" />
                <g transform={`translate(0,90) rotate(${drum})`}>
                  {Array.from({length: 14}, (_, i) => { const a = (i / 14) * Math.PI * 2; return <circle key={i} cx={Math.cos(a) * 160} cy={Math.sin(a) * 160} r={9} fill="#a9d3ea" />; })}
                  {clothes && <><path d="M -150 -40 Q -110 -120 -40 -150 Q -80 -60 -150 -40 Z" fill="#ff8fa3" stroke={INK} strokeWidth={6} />
                  <path d="M 60 120 Q 140 80 150 20 Q 160 110 60 120 Z" fill="#8fd694" stroke={INK} strokeWidth={6} /></>}
                </g>
                {water && <path d={`M -200 ${wl + Math.sin(f * 0.2) * 6} Q -100 ${wl - 20 + Math.sin(f * 0.2 + 1) * 10} 0 ${wl} T 200 ${wl + Math.cos(f * 0.2) * 6} L 200 300 L -200 300 Z`} fill="#6cc4f0" opacity={0.55} />}
                {inside && <g transform="translate(0,90)">{inside}</g>}
                <path d="M -120 -10 Q -100 -60 -50 -80" transform="translate(0,90)" stroke="#fff" strokeWidth={18} fill="none" strokeLinecap="round" opacity={0.8} />
              </g>
              <circle cx={0} cy={90} r={188} fill="none" stroke={INK} strokeWidth={8} />
              <rect x={226} y={50} width={34} height={80} rx={14} fill="#cfd5df" stroke={INK} strokeWidth={8} />
            </g>
          </g>
        )}
        {/* sweat */}
        {sweat > 0 && [[-330, -380, 0], [345, -330, 9], [-350, -200, 17]].map(([dx, dy, o], i) => {
          const p = ((f + (o as number)) % 26) / 26;
          return <path key={i} transform={`translate(${dx},${(dy as number) + p * 60}) scale(${sweat})`} opacity={1 - p} d="M 0 -26 Q 18 0 12 12 Q 0 26 -12 12 Q -18 0 0 -26 Z" fill="#7fd3ff" stroke={INK} strokeWidth={6} />;
        })}
      </g>
    </g>
  );
};

// ------------------------------------------------------------------ scenes (each gets local frame l)
const S1: React.FC<{f: number; l: number}> = ({f, l}) => {
  const fall = ease(seg(l, 8, 34));
  const doorOpen = l < 40 ? 1 : 1 - ease(seg(l, 40, 56));
  const by = -1150 + fall * 1240;
  const inHole = l >= 34;
  const lookY = l < 34 ? -1 + fall * 1.6 : 0.6;
  return (
    <g>
      <Rays f={f} c1="#8ED1FC" c2="#9fd9fd" />
      <Washer id="s1" f={f} x={540} y={1110} s={0.86} door={doorOpen} mood={l > 56 ? 'shock' : 'worry'} look={[0, lookY]} rpm="0"
        inside={l >= 56 ? <Bullet x={10} y={110} a={84} s={0.62} /> : null}
        hole={inHole && l < 56 ? <Bullet x={0} y={40} a={(l - 34) * 7 + 60} s={0.62} /> : null} />
      {!inHole && <Bullet x={540} y={1110 + by * 0.86} a={l * 9} s={0.62} />}
      {l > 56 && <Pop f={f} at={SC[0] + 58} x={820} y={760}><Burst text="咚！" fill="#fff36b" r={95} size={58} /></Pop>}
      <Pop f={f} at={0} x={540} y={290} dur={10}><T x={0} y={0} s={84}>把一顆子彈丟進洗衣機</T></Pop>
      <Pop f={f} at={6} x={540} y={430} dur={12}><T x={0} y={0} s={120} c="#ffe14d">一直脫水</T></Pop>
      <Pop f={f} at={14} x={540} y={590} dur={12}><T x={0} y={0} s={150} c={RED} sw={18} st="#fff">會爆炸嗎？</T></Pop>
    </g>
  );
};

const S2: React.FC<{f: number; l: number}> = ({f, l}) => {
  const ramp = ease(seg(l, 0, 110));
  const rpmN = Math.round(ramp * 1400);
  // drum angle: integrate speed
  const ang = l < 0 ? 0 : Array.from({length: Math.max(0, Math.floor(l))}, (_, i) => 3 + ease(seg(i, 0, 110)) * 42).reduce((a, b) => a + b, 0);
  const pinned = ramp > 0.55;
  const ba = pinned ? ang : Math.sin(l * 0.35) * 70 + 90 + l * 3;
  const r = pinned ? 140 : 120 + Math.sin(l * 0.9) * 20;
  const bx = Math.cos((ba * Math.PI) / 180) * r, byy = Math.sin((ba * Math.PI) / 180) * r;
  const dings = [14, 30, 44, 58, 70, 82, 92];
  const shake = 2 + ramp * 16;
  return (
    <g>
      <Rays f={f} c1="#8ED1FC" c2="#9fd9fd" />
      {ramp > 0.4 && Array.from({length: 6}, (_, i) => (
        <path key={i} d={`M ${120 + (i % 2) * 40} ${800 + i * 110} l -70 0`} stroke="#fff" strokeWidth={12} strokeLinecap="round" opacity={0.6 * Math.abs(Math.sin(f * 0.5 + i))} />
      ))}
      <Washer id="s2" f={f} x={540} y={1060} s={0.9} drum={ang} shake={shake} mood={ramp > 0.6 ? 'shock' : 'worry'} sweat={ramp > 0.3 ? 1 : 0}
        look={[Math.cos((ba * Math.PI) / 180) * 0.8, Math.sin((ba * Math.PI) / 180) * 0.8]} rpm={String(rpmN)}
        inside={<g>{pinned && <circle cx={0} cy={0} r={140} fill="none" stroke="#fff" strokeWidth={14} strokeDasharray="60 40" opacity={0.6} transform={`rotate(${ang})`} />}<Bullet x={bx} y={byy} a={ba + 90 + (pinned ? 0 : l * 13)} s={0.55} /></g>} />
      {dings.map((d, i) => (l >= d && l < d + 16) ? (
        <Pop key={i} f={f} at={SC[1] + d} x={i % 2 ? 860 : 220} y={760 + (i % 3) * 120} dur={6}><Burst text={i % 2 ? '鏗！' : '叮！'} fill={i % 3 === 2 ? '#ffd166' : '#fff'} r={90} size={56} rot={i % 2 ? 10 : -10} /></Pop>
      ) : null)}
      <Pop f={f} at={SC[1] + 2} x={540} y={300} dur={10}>
        <rect x={-330} y={-100} width={660} height={160} rx={40} fill={INK} />
        <text x={0} y={10} fontSize={92} fill="#7CFFB2" textAnchor="middle" fontFamily={FONT} fontWeight={900}>{rpmN} 轉/分</text>
      </Pop>
      <Cap f={f} at={SC[1] + 4} until={SC[1] + 70} text="開啟脫水，轉速一路往上衝" />
      <Cap f={f} at={SC[1] + 70} until={SC[2]} text="子彈在裡面叮叮咚咚亂撞…" />
    </g>
  );
};

const Section: React.FC<{x0: number; cy: number; L: number}> = ({x0, cy, L}) => {
  // horizontal cut-away, base at left, tip at right. length L.
  const u = L / 760;
  const X = (v: number) => x0 + v * u, H = (v: number) => v * u;
  const grains = Array.from({length: 60}, (_, i) => {
    const gx = 70 + ((i * 53) % 390), gy = -70 + ((i * 37) % 140);
    return <circle key={i} cx={X(gx)} cy={cy + H(gy)} r={H(7 + (i % 3) * 2)} fill={i % 4 ? '#5b4d40' : '#7a6a58'} />;
  });
  return (
    <g>
      {/* rim + case */}
      <rect x={X(0)} y={cy - H(118)} width={H(36)} height={H(236)} rx={H(6)} fill={BRASS_D} stroke={INK} strokeWidth={8} />
      <rect x={X(34)} y={cy - H(106)} width={H(460)} height={H(212)} rx={H(6)} fill={BRASS} stroke={INK} strokeWidth={8} />
      {/* cavity with powder */}
      <rect x={X(56)} y={cy - H(86)} width={H(420)} height={H(172)} fill="#3d342c" />
      {grains}
      {/* primer */}
      <rect x={X(0)} y={cy - H(40)} width={H(40)} height={H(80)} fill={SILVER} stroke={INK} strokeWidth={6} />
      <rect x={X(40)} y={cy - H(10)} width={H(18)} height={H(20)} fill="#3d342c" />
      {/* bullet: jacket + lead core */}
      <path d={`M ${X(420)} ${cy - H(88)} L ${X(560)} ${cy - H(88)} Q ${X(690)} ${cy - H(80)} ${X(760)} ${cy} Q ${X(690)} ${cy + H(80)} ${X(560)} ${cy + H(88)} L ${X(420)} ${cy + H(88)} Z`} fill={COPPER} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      <path d={`M ${X(436)} ${cy - H(66)} L ${X(556)} ${cy - H(66)} Q ${X(660)} ${cy - H(58)} ${X(722)} ${cy} Q ${X(660)} ${cy + H(58)} ${X(556)} ${cy + H(66)} L ${X(436)} ${cy + H(66)} Z`} fill="#8a919c" />
      <line x1={X(34)} y1={cy - H(106)} x2={X(494)} y2={cy - H(106)} stroke={INK} strokeWidth={8} />
      <line x1={X(34)} y1={cy + H(106)} x2={X(494)} y2={cy + H(106)} stroke={INK} strokeWidth={8} />
      <path d={`M ${X(560)} ${cy - H(88)} Q ${X(650)} ${cy - H(84)} ${X(700)} ${cy - H(50)}`} stroke={COPPER_L} strokeWidth={10} fill="none" strokeLinecap="round" />
    </g>
  );
};

const S3: React.FC<{f: number; l: number}> = ({f, l}) => {
  const x0 = 250, cy = 760, L = 760;
  const lab = (at: number, tx: number, ty: number, px: number, py: number, text: string, col: string) => {
    const k = ease(seg(l, at, at + 10));
    if (k <= 0) return null;
    return (
      <g opacity={k}>
        <line x1={tx} y1={ty + (ty < cy ? 22 : -60)} x2={tx + (px - tx) * k} y2={ty + (ty < cy ? 22 : -60) + (py - ty - (ty < cy ? 22 : -60)) * k} stroke={INK} strokeWidth={6} />
        <circle cx={px} cy={py} r={11 * k} fill={INK} />
        <g transform={`translate(${tx},${ty}) scale(${back(k)})`}>
          <rect x={-90} y={-62} width={180} height={84} rx={24} fill={col} stroke={INK} strokeWidth={7} />
          <text x={0} y={2} fontSize={50} fill="#fff" textAnchor="middle" fontFamily={FONT} fontWeight={900} stroke={INK} strokeWidth={6} paintOrder="stroke">{text}</text>
        </g>
      </g>
    );
  };
  const u = L / 760;
  const pinIn = ease(seg(l, 70, 80));
  const hit = l >= 80;
  const pinX = -260 + pinIn * 250 - (hit ? Math.max(0, (l - 80) * 0) : 0);
  const cards = seg(l, 112, 124);
  return (
    <g>
      <rect width={1080} height={1920} fill="#FFF4DA" />
      {Array.from({length: 40}, (_, i) => <circle key={i} cx={(i % 8) * 150 + 40} cy={Math.floor(i / 8) * 420 + 120} r={8} fill="#f3e2b8" />)}
      <Pop f={f} at={SC[2]} x={540} y={300} dur={10}><T x={0} y={0} s={92} c="#ffe14d">子彈要怎樣才會擊發？</T></Pop>
      <g transform={`translate(0,${(1 - ease(seg(l, 0, 12))) * 80})`} opacity={ease(seg(l, 0, 10))}>
        <Section x0={x0} cy={cy} L={L} />
      </g>
      {lab(14, 860, 520, x0 + 640 * u, cy - 50, '彈頭', COPPER)}
      {lab(24, 520, 520, x0 + 300 * u, cy - 100 * u, '彈殼', BRASS_D)}
      {lab(34, 520, 1060, x0 + 260 * u, cy + 40, '火藥', '#5b4d40')}
      {lab(44, 200, 1060, x0 + 18 * u, cy + 20, '底火', '#7d8896')}
      {/* firing pin */}
      {l >= 66 && (
        <g transform={`translate(${pinX},0)`}>
          <rect x={-200} y={cy - 22} width={420} height={44} rx={10} fill="#9aa3b1" stroke={INK} strokeWidth={7} />
          <path d={`M 220 ${cy - 22} L 246 ${cy - 10} L 246 ${cy + 10} L 220 ${cy + 22} Z`} fill="#9aa3b1" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
          <text x={130} y={cy - 44} fontSize={42} fill={INK} textAnchor="middle" fontFamily={FONT} fontWeight={900}>撞針</text>
        </g>
      )}
      {hit && l < 112 && <Pop f={f} at={SC[2] + 80} x={x0 - 60} y={cy + 190} dur={6}><Burst text="用力敲！" fill="#ffd166" r={130} size={46} /></Pop>}
      <Cap f={f} at={SC[2] + 56} until={SC[2] + 112} text="要靠撞針「用力」敲中底火才會擊發" size={50} />
      {cards > 0 && (
        <g opacity={cards} transform={`translate(0,${(1 - ease(cards)) * 40})`}>
          <rect x={70} y={1200} width={440} height={300} rx={36} fill="#fff" stroke={INK} strokeWidth={8} />
          <text x={290} y={1290} fontSize={50} fill={INK} textAnchor="middle" fontFamily={FONT} fontWeight={900}>開槍</text>
          <text x={290} y={1370} fontSize={40} fill="#444" textAnchor="middle" fontFamily={FONT} fontWeight={700}>撞針猛力、精準</text>
          <text x={290} y={1445} fontSize={40} fill="#444" textAnchor="middle" fontFamily={FONT} fontWeight={700}>敲在底火正中央</text>
          <rect x={570} y={1200} width={440} height={300} rx={36} fill="#fff" stroke={INK} strokeWidth={8} />
          <text x={790} y={1290} fontSize={50} fill={INK} textAnchor="middle" fontFamily={FONT} fontWeight={900}>洗衣機</text>
          <text x={790} y={1370} fontSize={40} fill="#444" textAnchor="middle" fontFamily={FONT} fontWeight={700}>隔著水和衣服</text>
          <text x={790} y={1445} fontSize={40} fill="#444" textAnchor="middle" fontFamily={FONT} fontWeight={700}>只是輕輕碰撞</text>
        </g>
      )}
      <Cap f={f} at={SC[2] + 126} until={SC[3]} text="力道和位置都差太多了" />
    </g>
  );
};

const Thermo: React.FC<{cx: number; level: number; col: string; over?: boolean; f: number}> = ({cx, level, col, over, f}) => {
  const top = 560, bot = 1330, h = bot - top;
  const y = bot - h * level;
  return (
    <g>
      <rect x={cx - 52} y={top - 20} width={104} height={h + 60} rx={52} fill="#fff" stroke={INK} strokeWidth={12} />
      <rect x={cx - 28} y={y} width={56} height={bot - y + 40} rx={28} fill={col} />
      <circle cx={cx} cy={bot + 90} r={96} fill={col} stroke={INK} strokeWidth={12} />
      <rect x={cx - 28} y={bot - 30} width={56} height={60} fill={col} />
      <path d={`M ${cx - 46} ${bot + 4} L ${cx - 46} ${top - 10}`} stroke="none" />
      {Array.from({length: 9}, (_, i) => <line key={i} x1={cx + 52} y1={top + 40 + i * 85} x2={cx + 78} y2={top + 40 + i * 85} stroke={INK} strokeWidth={6} />)}
      {over && level > 0.95 && (
        <g transform={`translate(${cx},${top - 90 - Math.abs(Math.sin(f * 0.25)) * 20})`}>
          <path d="M 0 -60 L 40 0 L 14 0 L 14 50 L -14 50 L -14 0 L -40 0 Z" fill={RED} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        </g>
      )}
    </g>
  );
};

const S4: React.FC<{f: number; l: number}> = ({f, l}) => {
  const a = ease(seg(l, 14, 40)), b = ease(seg(l, 50, 86));
  return (
    <g>
      <rect width={1080} height={1920} fill="#E9E6FF" />
      <Pop f={f} at={SC[3]} x={540} y={300} dur={10}><T x={0} y={0} s={96} c="#ffe14d">那高溫會引爆嗎？</T></Pop>
      <Thermo cx={300} level={0.22 * a} col="#4fa3e0" f={f} />
      <Thermo cx={780} level={b} col={RED} over f={f} />
      {a > 0.5 && <Pop f={f} at={SC[3] + 30} x={300} y={1330 - 770 * 0.22 - 60} dur={8}>
        <rect x={-120} y={-56} width={240} height={84} rx={22} fill={INK} /><text x={0} y={2} fontSize={52} fill="#fff" textAnchor="middle" fontFamily={FONT} fontWeight={900}>約 90°C</text>
      </Pop>}
      <g opacity={ease(seg(l, 20, 30))}>
        <text x={300} y={1600} fontSize={52} fill={INK} textAnchor="middle" fontFamily={FONT} fontWeight={900}>洗衣機最熱</text>
      </g>
      <g opacity={ease(seg(l, 56, 66))}>
        <text x={780} y={1600} fontSize={52} fill={INK} textAnchor="middle" fontFamily={FONT} fontWeight={900}>火藥被引燃</text>
        <text x={780} y={1668} fontSize={40} fill="#555" textAnchor="middle" fontFamily={FONT} fontWeight={700}>需要高得多的溫度</text>
      </g>
      {l > 92 && <Pop f={f} at={SC[3] + 92} x={540} y={900} dur={10}><Burst text="差很遠" fill="#ffd166" r={130} size={54} rot={-6} /></Pop>}
      <Cap f={f} at={SC[3] + 100} until={SC[4]} text="熱水洗也點不燃火藥" y={1790} size={52} />
    </g>
  );
};

const S5: React.FC<{f: number; l: number}> = ({f, l}) => {
  const k = seg(l, 6, 16);
  const sc = 2.4 - 1.4 * Easing.bezier(0.5, 0, 0.75, 0)(k);
  const shake = l > 16 && l < 26 ? Math.sin(l * 3) * (26 - l) * 2 : 0;
  const card = ease(seg(l, 40, 54));
  return (
    <g transform={`translate(${shake},${shake * 0.5})`}>
      <Rays f={f} c1="#FFD95A" c2="#ffe27f" cy={480} />
      {k > 0 && (
        <g transform={`translate(540,470) rotate(-7) scale(${sc})`} opacity={clamp(k * 2)}>
          <rect x={-400} y={-130} width={800} height={240} rx={34} fill="#fff" stroke={RED} strokeWidth={16} />
          <rect x={-372} y={-104} width={744} height={188} rx={22} fill="none" stroke={RED} strokeWidth={6} />
          <text x={0} y={42} fontSize={128} fill={RED} textAnchor="middle" fontFamily={FONT} fontWeight={900}>幾乎不會爆炸</text>
        </g>
      )}
      {card > 0 && (
        <g opacity={card} transform={`translate(0,${(1 - card) * 60})`}>
          <rect x={70} y={760} width={940} height={760} rx={44} fill="#fff" stroke={INK} strokeWidth={10} />
          <g transform="translate(200,880)">
            <path d="M 0 -62 L 66 52 L -66 52 Z" fill="#ffcc00" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
            <rect x={-7} y={-26} width={14} height={46} rx={6} fill={INK} /><circle cx={0} cy={36} r={8} fill={INK} />
          </g>
          <text x={300} y={905} fontSize={70} fill={INK} fontFamily={FONT} fontWeight={900}>但不代表安全</text>
          {[
            ['萬一底火真的被撞到', 60, '#222'],
            ['彈頭不會像開槍那樣射出', 76, '#222'],
            ['但彈殼會破裂', 92, RED],
            ['碎片一樣會傷人', 100, RED],
          ].map(([t, at, col], i) => (
            <text key={i} x={130} y={1040 + i * 92} fontSize={54} fill={col as string} fontFamily={FONT} fontWeight={900} opacity={ease(seg(l, at as number, (at as number) + 8))}>{i < 2 ? '・' : ''}{t}</text>
          ))}
          <line x1={130} y1={1400} x2={950} y2={1400} stroke="#e1e1e1" strokeWidth={4} opacity={ease(seg(l, 112, 120))} />
          <text x={130} y={1470} fontSize={46} fill="#555" fontFamily={FONT} fontWeight={700} opacity={ease(seg(l, 112, 120))}>還可能刮傷滾筒、卡住排水</text>
        </g>
      )}
    </g>
  );
};

const S6: React.FC<{f: number; l: number}> = ({f, l}) => {
  const b = back(seg(l, 0, 14));
  return (
    <g>
      <Rays f={f} c1="#8ED1FC" c2="#9fd9fd" cy={560} />
      <g transform={`translate(540,540) scale(${b})`}>
        <path d="M 0 -200 L 170 -140 Q 170 60 0 200 Q -170 60 -170 -140 Z" fill="#2f5fd0" stroke={INK} strokeWidth={12} strokeLinejoin="round" />
        <path d="M 0 -170 L 140 -120 Q 140 45 0 165 Q -140 45 -140 -120 Z" fill="none" stroke="#ffd54a" strokeWidth={8} />
        <polygon points={Array.from({length: 10}, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5; const r = i % 2 ? 36 : 84; return `${Math.cos(a) * r},${Math.sin(a) * r}`; }).join(' ')} fill="#ffd54a" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      </g>
      <Pop f={f} at={SC[5] + 8} x={540} y={880} dur={10}><T x={0} y={0} s={86}>撿到子彈別自己處理</T></Pop>
      <Pop f={f} at={SC[5] + 16} x={540} y={1040} dur={12}><T x={0} y={0} s={132} c="#ffe14d">交給警察</T></Pop>
      <g opacity={ease(seg(l, 26, 36))}><T x={540} y={1140} s={44} sw={10}>台灣未經許可持有子彈是違法的</T></g>
      <Washer id="s6" f={f} x={300} y={1560} s={0.4} mood="wink" rpm="0" />
      {l > 56 && (
        <g opacity={ease(seg(l, 56, 66))} transform={`translate(0,${(1 - ease(seg(l, 56, 66))) * 30})`}>
          <path d="M 470 1300 L 1010 1300 Q 1040 1300 1040 1330 L 1040 1530 Q 1040 1560 1010 1560 L 520 1560 L 450 1600 L 470 1540 Q 450 1540 450 1520 L 450 1330 Q 450 1300 470 1300 Z" fill="#fff" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
          <text x={745} y={1400} fontSize={50} fill={INK} textAnchor="middle" fontFamily={FONT} fontWeight={900}>下一集丟什麼進去？</text>
          <text x={745} y={1490} fontSize={58} fill={RED} textAnchor="middle" fontFamily={FONT} fontWeight={900}>留言告訴我 👇</text>
        </g>
      )}
    </g>
  );
};

const SCENES = [S1, S2, S3, S4, S5, S6];


export const BulletWasher: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#8ED1FC'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        {SCENES.map((S, i) => {
          const a = SC[i], b = SC[i + 1];
          if (f < a - 0 || f >= b + 6) return null;
          const fadeOut = i < SCENES.length - 1 ? 1 - seg(f, b, b + 6) : 1;
          return <g key={i} opacity={fadeOut}><S f={f} l={f - a} /></g>;
        }).reverse()}
        <g transform="translate(60,96)">
          <rect x={0} y={-46} width={330} height={64} rx={32} fill={INK} />
          <text x={165} y={0} fontSize={34} fill="#fff" textAnchor="middle" fontFamily={FONT} fontWeight={900}>洗衣機實驗室 EP.1</text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};
