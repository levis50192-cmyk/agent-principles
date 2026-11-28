import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import '@fontsource/noto-sans-tc/700.css';
import '@fontsource/noto-sans-tc/900.css';
import data from './kin.json';

export const FPS = 30;
export const DURATION = 30 * FPS;
const FONT = '"Noto Sans TC", sans-serif';
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const seg = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

const WOOD = '#c99a62', WOOD_D = '#a87a45', WOOD_L = '#dcb782';
const CANDY = ['#ef5b5b', '#f6a23c', '#f2d24b', '#5bbf7a', '#4fa3e0', '#9a6fd6'];
const FLOOR_Y = 1730;
const {tLamp, meta, T0} = data as any;

type St = {k: string; x1?: number; y1?: number; x2?: number; y2?: number; th?: number; x?: number; y?: number; r?: number};
const statics = data.statics as St[];
const dyn = data.dyn as {k: string; w?: number; h?: number; r?: number}[];

// ------------------------------------------------------------------ scenery
const Wall: React.FC = () => (
  <>
    <rect width={1080} height={1920} fill="#f4e6d1" />
    {Array.from({length: 18}, (_, i) => <rect key={i} x={i * 64} y={0} width={32} height={FLOOR_Y} fill="#efdcc3" />)}
    <rect x={0} y={FLOOR_Y - 26} width={1080} height={26} fill="#e8d2b4" />
    <rect x={0} y={FLOOR_Y} width={1080} height={200} fill="#c98f55" />
    {Array.from({length: 7}, (_, i) => <line key={i} x1={0} y1={FLOOR_Y + 30 + i * 28} x2={1080} y2={FLOOR_Y + 30 + i * 28} stroke="#b97d46" strokeWidth={3} />)}
    {/* wall clock */}
    <circle cx={930} cy={215} r={58} fill="#fff7e8" stroke="#b9855a" strokeWidth={8} />
    <line x1={930} y1={215} x2={930} y2={177} stroke="#5a4636" strokeWidth={6} strokeLinecap="round" />
    <line x1={930} y1={215} x2={960} y2={228} stroke="#5a4636" strokeWidth={6} strokeLinecap="round" />
    {/* picture frame */}
    <rect x={560} y={1520} width={0} height={0} />
  </>
);

const Plank: React.FC<{s: St; bracket?: boolean}> = ({s, bracket}) => {
  const w = (s.x2 as number) - (s.x1 as number), cx = (s.x1 as number), top = (s.y1 as number) - (s.th as number) / 2;
  return (
    <g>
      {bracket && [cx + 36, cx + w - 40].map((bx) => (
        <polygon key={bx} points={`${bx},${top + (s.th as number)} ${bx + 34},${top + (s.th as number)} ${bx},${top + (s.th as number) + 56}`} fill={WOOD_D} />
      ))}
      <rect x={cx} y={top} width={w} height={s.th} rx={6} fill={WOOD} />
      <rect x={cx} y={top} width={w} height={6} rx={3} fill={WOOD_L} />
      <rect x={cx} y={top + (s.th as number) - 5} width={w} height={5} fill={WOOD_D} />
    </g>
  );
};

const Table: React.FC<{s: St}> = ({s}) => {
  const top = (s.y1 as number) - 12;
  return (
    <g>
      <rect x={90} y={top + 24} width={34} height={FLOOR_Y - top - 24} fill={WOOD_D} />
      <rect x={950} y={top + 24} width={34} height={FLOOR_Y - top - 24} fill={WOOD_D} />
      <rect x={90} y={top + 70} width={894} height={18} fill={WOOD_D} />
      <rect x={s.x1} y={top} width={(s.x2 as number) - (s.x1 as number)} height={24} rx={7} fill="#d7a96d" />
      <rect x={s.x1} y={top} width={(s.x2 as number) - (s.x1 as number)} height={6} rx={3} fill="#e8c48f" />
    </g>
  );
};

const Ruler: React.FC<{len: number; th: number; color?: string; light?: string}> = ({len, th, color = '#f2cf4a', light = '#fbe48a'}) => (
  <g transform={`translate(${-len / 2},${-th / 2})`}>
    <rect width={len} height={th} rx={3} fill={color} />
    <rect width={len} height={Math.max(2, th * 0.25)} rx={2} fill={light} />
    {Array.from({length: Math.floor(len / 10)}, (_, i) => (
      <line key={i} x1={i * 10 + 5} y1={th} x2={i * 10 + 5} y2={th - (i % 5 === 0 ? th * 0.6 : th * 0.35)} stroke="#6a5a1f" strokeWidth={1.2} />
    ))}
  </g>
);

const StaticItem: React.FC<{s: St}> = ({s}) => {
  if (s.k === 'shelf' || s.k === 'desk') return <Plank s={s} bracket />;
  if (s.k === 'table') return <Table s={s} />;
  if (s.k === 'ruler' || s.k === 'board') {
    const dx = (s.x2 as number) - (s.x1 as number), dy = (s.y2 as number) - (s.y1 as number);
    const len = Math.hypot(dx, dy), ang = Math.atan2(dy, dx) * 180 / Math.PI;
    const cx = ((s.x1 as number) + (s.x2 as number)) / 2, cy = ((s.y1 as number) + (s.y2 as number)) / 2;
    if (s.k === 'ruler') {
      return (
        <g>
          {/* books holding the high end */}
          <rect x={960} y={500} width={84} height={26} fill="#4f7dd6" /><rect x={968} y={526} width={90} height={26} fill="#e8793f" /><rect x={955} y={552} width={80} height={26} fill="#4fa87a" />
          <g transform={`translate(${cx},${cy}) rotate(${ang})`}><Ruler len={len} th={(s.th as number) + 6} /></g>
        </g>
      );
    }
    return (
      <g>
        <rect x={470} y={1040} width={110} height={24} fill="#7d5fc4" /><rect x={460} y={1064} width={120} height={26} fill="#d65a7a" />
        <g transform={`translate(${cx},${cy}) rotate(${ang})`}>
          <rect x={-len / 2} y={-(s.th as number) / 2 - 8} width={len} height={(s.th as number) + 16} rx={14} fill="#d9ad72" />
          <rect x={-len / 2} y={-(s.th as number) / 2 - 8} width={len} height={8} rx={4} fill="#ecc690" />
          <ellipse cx={-len / 2 + 26} cy={0} rx={12} ry={7} fill="#a87a45" />
          {[0.2, 0.45, 0.7].map((p) => <line key={p} x1={-len / 2 + len * p} y1={-6} x2={-len / 2 + len * p + 60} y2={6} stroke="#c49458" strokeWidth={2} />)}
        </g>
      </g>
    );
  }
  if (s.k === 'box') {
    const x = s.x1 as number, y = s.y1 as number, w = (s.x2 as number) - x, h = (s.y2 as number) - y;
    return (
      <g>
        <rect x={x} y={y} width={w} height={h} rx={6} fill="#c8935c" />
        <rect x={x - 8} y={y} width={w + 16} height={22} rx={5} fill="#d8a36a" />
        <text x={x + w / 2} y={y + 72} textAnchor="middle" font-size={34} fontFamily={FONT} fontWeight={900} fill="#8a5c33" letterSpacing={4}>SHOES</text>
      </g>
    );
  }
  if (s.k === 'pencil') {
    const r = s.r as number;
    return (
      <g>
        <circle cx={s.x} cy={s.y} r={r} fill="#f5c542" stroke="#b78b1d" strokeWidth={3} />
        <circle cx={s.x} cy={s.y} r={r * 0.55} fill="#f0d3a0" />
        <circle cx={s.x} cy={s.y} r={r * 0.2} fill="#3a3a3a" />
      </g>
    );
  }
  return null;
};

// ------------------------------------------------------------------ moving things
const Tile: React.FC<{i: number; w: number; h: number}> = ({i, w, h}) => {
  const c = CANDY[i % CANDY.length];
  return (
    <g>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={3} fill={c} />
      <rect x={-w / 2 + 3} y={-h / 2 + 3} width={w / 2 - 2} height={h - 6} rx={2} fill="rgba(255,255,255,0.35)" />
      <line x1={-w / 2} y1={0} x2={w / 2} y2={0} stroke="rgba(0,0,0,0.28)" strokeWidth={2} />
    </g>
  );
};
const Book: React.FC<{i: number; w: number; h: number}> = ({i, w, h}) => {
  const c = ['#4f7dd6', '#e8793f', '#4fa87a', '#d65a7a'][i % 4];
  return (
    <g>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={3} fill={c} />
      <rect x={-w / 2} y={-h / 2} width={5} height={h} fill="rgba(0,0,0,0.22)" />
      <rect x={-w / 2 + 5} y={-h / 2 + 14} width={w - 10} height={8} fill="rgba(255,255,255,0.7)" />
      <rect x={-w / 2 + 5} y={h / 2 - 26} width={w - 10} height={5} fill="rgba(255,255,255,0.5)" />
    </g>
  );
};
const Marble: React.FC<{r: number}> = ({r}) => (
  <g>
    <circle r={r} fill="#5aa7ff" />
    <path d={`M ${-r * 0.7} ${r * 0.1} Q 0 ${-r * 0.8} ${r * 0.7} ${r * 0.2}`} stroke="#ffffff" strokeWidth={3} fill="none" opacity={0.8} />
    <path d={`M ${-r * 0.5} ${r * 0.5} Q 0 ${r * 0.1} ${r * 0.6} ${r * 0.6}`} stroke="#e8f2ff" strokeWidth={2.5} fill="none" opacity={0.6} />
    <circle cx={-r * 0.35} cy={-r * 0.4} r={r * 0.18} fill="#fff" opacity={0.9} />
  </g>
);
const Tennis: React.FC<{r: number}> = ({r}) => (
  <g>
    <circle r={r} fill="#d6e84a" />
    <path d={`M ${-r * 0.9} ${-r * 0.35} Q 0 ${r * 0.2} ${r * 0.9} ${-r * 0.35}`} stroke="#fff" strokeWidth={3} fill="none" />
    <path d={`M ${-r * 0.9} ${r * 0.35} Q 0 ${-r * 0.2} ${r * 0.9} ${r * 0.35}`} stroke="#fff" strokeWidth={3} fill="none" />
  </g>
);
const Eraser: React.FC<{w: number; h: number}> = ({w, h}) => (
  <g>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={4} fill="#f08aa6" />
    <rect x={-w / 2 + w * 0.62} y={-h / 2} width={w * 0.38} height={h} rx={4} fill="#4d7ad6" />
  </g>
);
const Hand: React.FC = () => (
  <g>
    <rect x={-60} y={-18} width={90} height={36} rx={16} fill="#f0b98d" />
    <rect x={-12} y={-12} width={56} height={24} rx={12} fill="#f0b98d" />
    <circle cx={44} cy={0} r={13} fill="#f0b98d" />
    <rect x={-70} y={-26} width={40} height={52} fill="#4f7dd6" />
  </g>
);

const Obj: React.FC<{k: string; i: number; m: any}> = ({k, i, m}) => {
  switch (k) {
    case 'domino': return <Tile i={i} w={m.w} h={m.h} />;
    case 'book': return <Book i={i} w={m.w} h={m.h} />;
    case 'marble': return <Marble r={m.r} />;
    case 'tennis': return <Tennis r={m.r} />;
    case 'plank': return <Ruler len={m.w} th={m.h + 6} color="#6ab7e8" light="#a9dcf7" />;
    case 'eraser': return <Eraser w={m.w} h={m.h} />;
    case 'hand': return <Hand />;
    default: return null;
  }
};

const Lamp: React.FC<{on: number; t: number}> = ({on, t}) => {
  const flick = on > 0 ? 0.9 + 0.1 * Math.sin(t * 14) : 0;
  return (
    <g>
      {on > 0 && <ellipse cx={90} cy={1330} rx={260 * on} ry={200 * on} fill="url(#glow)" opacity={0.9 * flick} />}
      <rect x={36} y={1380} width={44} height={20} rx={8} fill="#6b5b4a" />
      <rect x={52} y={1290} width={12} height={92} fill="#8a7458" />
      <path d="M 0 1290 L 20 1210 L 100 1210 L 120 1290 Z" fill={on > 0 ? '#ffe28a' : '#e9d9b8'} stroke="#c9b27a" strokeWidth={3} />
      {on > 0 && <rect x={10} y={1285} width={100} height={8} fill="#fff6c8" opacity={on} />}
    </g>
  );
};

// ------------------------------------------------------------------ tags + HUD
const TAGS = [
  {t: T0 - 0.2, n: '骨牌', x: 330, y: 292},
  {t: meta.tHit1, n: '彈珠', x: 740, y: 292},
  {t: meta.tHit1 + 1.1, n: '直尺', x: 780, y: 450},
  {t: meta.tBook1, n: '書本', x: 270, y: 700},
  {t: meta.tPush2, n: '網球', x: 190, y: 780},
  {t: meta.tPush2 + 2.5, n: '砧板', x: 330, y: 930},
  {t: meta.tL, n: '尺＋鉛筆', x: 600, y: 1150},
  {t: meta.tLaunch, n: '橡皮擦', x: 420, y: 1230},
  {t: meta.tEraserLand + 0.6, n: '骨牌', x: 300, y: 1280},
  {t: tLamp, n: '檯燈', x: 230, y: 1190},
];
const Tag: React.FC<{t: number; f: number; n: string; x: number; y: number; idx: number}> = ({t, f, n, x, y, idx}) => {
  const s = f / FPS - t;
  if (s < 0 || s > 2.2) return null;
  const k = ease(clamp(s / 0.25)), o = k * (1 - clamp((s - 1.8) / 0.4));
  return (
    <g transform={`translate(${x},${y - 14 * (1 - k)}) scale(${0.7 + 0.3 * k})`} opacity={o}>
      <rect x={-86} y={-30} width={172} height={60} rx={30} fill="#fff" stroke="#2b2b2b" strokeWidth={4} />
      <circle cx={-56} cy={0} r={18} fill="#ef5b5b" />
      <text x={-56} y={8} textAnchor="middle" fontFamily={FONT} fontWeight={900} font-size={22} fill="#fff">{idx + 1}</text>
      <text x={14} y={11} textAnchor="middle" fontFamily={FONT} fontWeight={900} font-size={32} fill="#2b2b2b">{n}</text>
    </g>
  );
};

export const Domino: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const row = (data.frames as number[][][])[Math.min(f, data.frames.length - 1)];
  const on = ease(seg(t, tLamp, tLamp + 0.5));
  const count = TAGS.filter((g) => t >= g.t).length;
  const intro = 1 - seg(t, 1.6, 2.2);
  const outro = ease(seg(t, tLamp + 0.8, tLamp + 1.5));
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <radialGradient id="glow">
            <stop offset="0" stopColor="#fff3b0" stopOpacity="0.95" />
            <stop offset="1" stopColor="#ffd966" stopOpacity="0" />
          </radialGradient>
        </defs>
        <Wall />
        {statics.map((s, i) => <StaticItem key={i} s={s} />)}
        <Lamp on={on} t={t} />
        {dyn.map((m, i) => {
          const [x, y, a] = row[i];
          // domino index for colour = order within its kind group
          const gi = dyn.slice(0, i).filter((d) => d.k === m.k).length;
          return <g key={i} transform={`translate(${x},${y}) rotate(${a * 180 / Math.PI})`}><Obj k={m.k} i={gi} m={m} /></g>;
        })}
        {TAGS.map((g, i) => <Tag key={i} f={f} idx={i} {...g} />)}
        {/* confetti */}
        {t >= tLamp && Array.from({length: 70}, (_, i) => {
          const s0 = t - tLamp - rnd(i) * 0.6;
          if (s0 < 0) return null;
          const x = rnd(i + 5) * 1080 + Math.sin(s0 * 3 + i) * 30, y = -40 + s0 * (260 + rnd(i + 9) * 260);
          return <rect key={i} x={x} y={y} width={14} height={22} rx={2} fill={CANDY[i % 6]} transform={`rotate(${s0 * 220 + i * 30} ${x} ${y})`} />;
        })}
      </svg>
      {/* header */}
      <div style={{position: 'absolute', top: 120, left: 0, width: 1080, textAlign: 'center', opacity: 1, transform: `scale(${1 + 0.4 * intro}) translateY(${intro * 160}px)`}}>
        <div style={{font: `900 ${intro > 0.05 ? 104 : 62}px/1.1 ${FONT}`, color: '#2b2b2b', letterSpacing: 4, textShadow: '0 4px 0 rgba(255,255,255,0.8)'}}>30 秒骨牌連鎖</div>
        <div style={{font: `700 40px ${FONT}`, color: '#7a5a3a', marginTop: 8, opacity: 1 - seg(t, 2.0, 2.5)}}>只用家裡的東西，能撐多遠？</div>
      </div>
      {/* counter */}
      <div style={{position: 'absolute', top: 215, left: 0, width: 1080, display: 'flex', justifyContent: 'center', opacity: seg(t, 2.4, 3.0) * (1 - outro)}}>
        <div style={{background: '#2b2b2b', color: '#fff', borderRadius: 40, padding: '6px 30px', font: `900 40px ${FONT}`}}>已連鎖 <span style={{color: '#ffd966'}}>{count}</span> / 10 件</div>
      </div>
      {/* finale */}
      <div style={{position: 'absolute', top: 760, left: 0, width: 1080, textAlign: 'center', opacity: outro, transform: `scale(${0.7 + 0.3 * outro})`}}>
        <div style={{display: 'inline-block', background: '#fff', border: '6px solid #2b2b2b', borderRadius: 40, padding: '20px 50px', boxShadow: '0 12px 0 #2b2b2b'}}>
          <div style={{font: `900 120px ${FONT}`, color: '#ef5b5b'}}>成功！</div>
          <div style={{font: `900 46px ${FONT}`, color: '#2b2b2b'}}>10 樣家裡的東西，一路連到燈亮</div>
        </div>
        <div style={{font: `900 52px ${FONT}`, color: '#2b2b2b', marginTop: 40, textShadow: '0 3px 0 #fff'}}>留言：下一條路線想用什麼？</div>
      </div>
    </AbsoluteFill>
  );
};
