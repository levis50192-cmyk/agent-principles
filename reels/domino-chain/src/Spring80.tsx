import React from 'react';
import {AbsoluteFill, Easing, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import '@fontsource/noto-serif-tc/700.css';
import '@fontsource/noto-serif-tc/900.css';

export const FPS = 30;
const S = (sec: number) => Math.round(sec * FPS);
const B = [0, 3.6, 8.6, 12.8, 18, 23, 27.6];
export const DURATION = S(B[B.length - 1]);

const PAPER = '#f1e8d3';
const INK = '#1b1a19';
const VERM = '#c4361f';
const CYAN = '#3d6b7a';
const GREEN = '#5b7d5f';
const GOLD = '#c9973a';
const PINK = '#e9a1a8';
const FONT = '"Noto Serif TC", serif';

const ease = Easing.bezier(0.22, 1, 0.36, 1);
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const seg = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------- persistent background ----------
const Mountains: React.FC<{t: number}> = ({t}) => {
  const drift = Math.sin(t * 0.35) * 18;
  const layer = (base: number, amp: number, seed: number, color: string, op: number, dx: number) => {
    let d = `M -100 1920 L -100 ${base}`;
    for (let x = -100; x <= 1200; x += 60) {
      const y = base - amp * (0.5 + 0.5 * Math.sin(x * 0.006 + seed)) - amp * 0.6 * rnd(x + seed);
      d += ` L ${x} ${y}`;
    }
    d += ' L 1200 1920 Z';
    return <path d={d} fill={color} opacity={op} transform={`translate(${dx},0)`} />;
  };
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      {layer(1500, 260, 1, '#b9bdb6', 0.55, drift * 0.4)}
      {layer(1620, 230, 4, '#8f958f', 0.6, drift * 0.8)}
      {layer(1740, 200, 9, '#5c635f', 0.7, drift * 1.2)}
      {layer(1850, 150, 13, '#2d3230', 0.85, drift * 1.6)}
      <rect x={0} y={1480} width={1080} height={160} fill="url(#mist)" opacity={0.8} />
      <defs>
        <linearGradient id="mist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={PAPER} stopOpacity="0" />
          <stop offset="0.5" stopColor={PAPER} stopOpacity="0.85" />
          <stop offset="1" stopColor={PAPER} stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
};

const Petals: React.FC<{t: number}> = ({t}) => (
  <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
    {Array.from({length: 22}, (_, i) => {
      const sp = 60 + rnd(i) * 70;
      const y = ((t * sp + rnd(i + 50) * 2200) % 2200) - 150;
      const x = rnd(i + 10) * 1080 + Math.sin(t * 0.9 + i) * 60;
      const r = 10 + rnd(i + 20) * 12;
      return <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.62} fill={PINK} opacity={0.75}
        transform={`rotate(${t * 60 + i * 40} ${x} ${y})`} />;
    })}
  </svg>
);

const Bg: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  return (
    <AbsoluteFill style={{background: PAPER}}>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: 0.5, mixBlendMode: 'multiply'}}>
        <filter id="paper"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="3" /><feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 0 0.25  0 0 0 0.5 0" /></filter>
        <rect width={1080} height={1920} filter="url(#paper)" />
      </svg>
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(90,60,30,0.28) 100%)'}} />
      <Mountains t={t} />
      <Petals t={t} />
    </AbsoluteFill>
  );
};

// ---------- ink-blot transitions at each cut ----------
const InkCuts: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = B.slice(1, -1).map(S);
  let k = 0;
  cuts.forEach((c) => {
    const d = Math.abs(f - c);
    if (d < 7) k = Math.max(k, 1 - d / 7);
  });
  if (k <= 0) return null;
  const r = ease(k) * 1500;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      <filter id="rough"><feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="8" /><feDisplacementMap in="SourceGraphic" scale="140" /></filter>
      <circle cx={540} cy={1000} r={r} fill={INK} filter="url(#rough)" />
    </svg>
  );
};

// ---------- small pieces ----------
const Pop: React.FC<{at: number; children: React.ReactNode; style?: React.CSSProperties; from?: number}> = ({at, children, style, from = 0.3}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: f - at, fps, config: {damping: 12, stiffness: 150, mass: 0.8}});
  return <div style={{transform: `scale(${from + (1 - from) * p})`, opacity: clamp(p * 2), ...style}}>{children}</div>;
};

const Seal: React.FC<{ch: string; size: number; style?: React.CSSProperties}> = ({ch, size, style}) => (
  <div style={{width: size, height: size, background: VERM, borderRadius: size * 0.08, color: PAPER,
    font: `900 ${size * 0.62}px/${size}px ${FONT}`, textAlign: 'center', boxShadow: 'inset 0 0 0 4px rgba(241,232,211,0.35)', ...style}}>{ch}</div>
);

const Mark: React.FC<{children: React.ReactNode; at?: number}> = ({children, at = 0}) => {
  const f = useCurrentFrame();
  const k = ease(seg(f, at, at + 10));
  return <span style={{display: 'inline-block', background: VERM, color: PAPER, padding: '0 16px', margin: '0 4px', borderRadius: 6,
    transform: `rotate(-1.2deg) scale(${0.6 + 0.4 * k})`, opacity: k}}>{children}</span>;
};

const Caption: React.FC<{parts: [string, boolean][]; start?: number; top?: number}> = ({parts, start = 10, top = 1250}) => {
  const f = useCurrentFrame();
  const total = parts.reduce((a, [t]) => a + t.length, 0);
  const shown = Math.floor(clamp((f - start) / (total * 1.7)) * total);
  let used = 0;
  const out: React.ReactNode[] = [];
  parts.forEach(([t, hl], i) => {
    const n = Math.max(0, Math.min(t.length, shown - used));
    used += t.length;
    if (n <= 0) return;
    const txt = t.slice(0, n);
    out.push(hl
      ? <span key={i} style={{background: VERM, color: PAPER, padding: '0 12px', margin: '0 4px', borderRadius: 6}}>{txt}</span>
      : <span key={i}>{txt}</span>);
  });
  return <div style={{position: 'absolute', top, left: 60, width: 960, textAlign: 'center', font: `900 62px/1.5 ${FONT}`, color: INK}}>{out}</div>;
};

const Head: React.FC<{children: React.ReactNode; top?: number}> = ({children, top = 170}) => (
  <div style={{position: 'absolute', top, left: 0, width: 1080, textAlign: 'center', font: `900 92px/1.25 ${FONT}`, color: INK, letterSpacing: 6}}>{children}</div>
);

const Scene: React.FC<{len: number; children: React.ReactNode}> = ({len, children}) => {
  const f = useCurrentFrame();
  const inK = ease(seg(f, 4, 16));
  const outK = seg(f, len - 6, len);
  return <AbsoluteFill style={{opacity: inK * (1 - outK), transform: `translateY(${(1 - inK) * 30}px)`}}>{children}</AbsoluteFill>;
};

// ---------- scenes ----------
const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const n = Math.round(1 + ease(seg(f, 14, 46)) * 79);
  return (
    <Scene len={S(B[1] - B[0])}>
      <Pop at={0} from={0.2} style={{position: 'absolute', left: 90, top: 330, width: 900, height: 900, borderRadius: 450, background: VERM, opacity: 0.92}}><div /></Pop>
      <Pop at={4} style={{position: 'absolute', top: 160, left: 0, width: 1080, textAlign: 'center', font: `900 84px ${FONT}`, color: INK, letterSpacing: 8}}>你這輩子，只能看</Pop>
      <Pop at={12} style={{position: 'absolute', top: 400, left: 0, width: 1080, textAlign: 'center', font: `900 560px/1 ${FONT}`, color: PAPER}}>{n}</Pop>
      <Pop at={30} style={{position: 'absolute', top: 1290, left: 0, width: 1080, textAlign: 'center', font: `900 150px ${FONT}`, color: INK, letterSpacing: 10}}>次花開</Pop>
      <Pop at={40} style={{position: 'absolute', right: 70, top: 1130}}><Seal ch="春" size={110} style={{transform: 'rotate(6deg)'}} /></Pop>
    </Scene>
  );
};

const TERMS = ['立春', '雨水', '驚蟄', '春分', '清明', '穀雨', '立夏', '小滿', '芒種', '夏至', '小暑', '大暑',
  '立秋', '處暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至', '小寒', '大寒'];
const seasonColor = (i: number) => [GREEN, VERM, GOLD, CYAN][Math.floor(i / 6)];

const Ring: React.FC<{stage: 'all' | 'spring'}> = ({stage}) => {
  const f = useCurrentFrame();
  const R = 385, CX = 540, CY = 760;
  return (
    <>
      {TERMS.map((tm, i) => {
        const a = (-90 + i * 15) * (Math.PI / 180);
        const x = CX + R * Math.cos(a), y = CY + R * Math.sin(a);
        const lit = stage === 'all' ? ease(seg(f, 14 + i * 2.2, 22 + i * 2.2)) : (i < 6 ? 1 : 0);
        const dim = stage === 'spring' && i >= 6 ? ease(seg(f, 6, 18)) : 0;
        const pulse = stage === 'spring' && i < 6 ? 1 + 0.06 * Math.sin(f * 0.3 + i) : 1;
        const c = lit > 0.05 ? seasonColor(i) : '#9b9484';
        return (
          <div key={tm} style={{position: 'absolute', left: x - 56, top: y - 30, width: 112, height: 60, textAlign: 'center',
            font: `900 42px/60px ${FONT}`, color: c, opacity: 1 - dim * 0.75, transform: `scale(${pulse})`,
            textShadow: lit > 0.05 ? '0 0 0 transparent' : 'none'}}>{tm}</div>
        );
      })}
      <div style={{position: 'absolute', left: 0, top: CY - 150, width: 1080, textAlign: 'center', font: `900 260px/1 ${FONT}`, color: INK}}>
        {stage === 'all' ? Math.min(24, Math.round(24 * ease(seg(f, 10, 40)))) : <span style={{color: GREEN}}>6</span>}
      </div>
      <div style={{position: 'absolute', left: 0, top: CY + 110, width: 1080, textAlign: 'center', font: `700 60px ${FONT}`, color: INK, letterSpacing: 10}}>
        {stage === 'all' ? '個節氣' : '／ 24 個節氣'}
      </div>
    </>
  );
};

const Terms: React.FC = () => (
  <Scene len={S(B[2] - B[1])}>
    <Head>一年<Mark at={4}>24 個</Mark>節氣</Head>
    <Ring stage="all" />
    <Caption top={1260} start={16} parts={[['春夏秋冬，各 ', false], ['6 個', true]]} />
  </Scene>
);

const SpringOnly: React.FC = () => (
  <Scene len={S(B[3] - B[2])}>
    <Head>春天，只佔<Mark at={4}>四分之一</Mark></Head>
    <Ring stage="spring" />
    <Caption top={1260} start={16} parts={[['立春到穀雨，', false], ['6 個節氣', true]]} />
  </Scene>
);

const Blossom: React.FC<{x: number; y: number; c: string; s: number; o: number}> = ({x, y, c, s, o}) => (
  <g transform={`translate(${x},${y}) scale(${s})`} opacity={o}>
    {[0, 72, 144, 216, 288].map((a) => (
      <circle key={a} cx={Math.cos((a - 90) * Math.PI / 180) * 17} cy={Math.sin((a - 90) * Math.PI / 180) * 17} r={15} fill={c} />
    ))}
    <circle r={7} fill={GOLD} />
  </g>
);

const Count80: React.FC = () => {
  const f = useCurrentFrame();
  const cells: React.ReactNode[] = [];
  const greyK = ease(seg(f, 62, 86));
  for (let i = 0; i < 80; i++) {
    const c = i % 10, r = Math.floor(i / 10);
    const pop = ease(seg(f, 8 + i * 0.4, 18 + i * 0.4));
    const grey = i < 30 ? greyK : 0;
    cells.push(<Blossom key={i} x={135 + c * 90} y={560 + r * 90} c={grey > 0.5 ? '#b9b2a2' : PINK} s={pop * (1 - grey * 0.15)} o={1 - grey * 0.35} />);
  }
  const left = 80 - Math.round(30 * greyK);
  return (
    <Scene len={S(B[4] - B[3])}>
      <Head>80 歲，<Mark at={4}>80 個</Mark>春天</Head>
      <svg width={1080} height={1400} style={{position: 'absolute', left: 0, top: 0}}>{cells}</svg>
      <div style={{position: 'absolute', top: 1310, left: 0, width: 1080, textAlign: 'center', font: `700 44px ${FONT}`, color: '#5c5648', opacity: ease(seg(f, 60, 74))}}>
        以 30 歲為例：已看過 30 個 ＋ 還剩 {left} 個
      </div>
      <Caption top={1390} start={64} parts={[['30 歲，只剩 ', false], ['50 個春天', true]]} />
    </Scene>
  );
};

const Tip: React.FC = () => {
  const f = useCurrentFrame();
  const items = ['看一次花開', '見一位老友', '走一條沒走過的路'];
  return (
    <Scene len={S(B[5] - B[4])}>
      <Pop at={2} style={{position: 'absolute', left: 130, top: 190, width: 230, height: 780, background: '#fffaf0', border: `4px solid ${INK}`, borderRadius: 14,
        boxShadow: `10px 10px 0 ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{writingMode: 'vertical-rl', font: `900 88px/1.15 ${FONT}`, color: INK, letterSpacing: 12}}>一年之計在於春</div>
      </Pop>
      {items.map((s, i) => {
        const k = ease(seg(f, 14 + i * 12, 28 + i * 12));
        return (
          <div key={s} style={{position: 'absolute', left: 400, top: 210 + i * 210, width: 580, height: 170, background: '#fffaf0', border: `4px solid ${INK}`, borderRadius: 14,
            boxShadow: `8px 8px 0 ${INK}`, display: 'flex', alignItems: 'center', padding: '0 30px', opacity: k, transform: `translateX(${(1 - k) * 500}px)`}}>
            <Seal ch={String(i + 1)} size={80} style={{marginRight: 26, fontSize: 56}} />
            <div style={{font: `900 48px/1.2 ${FONT}`, color: INK}}>{s}</div>
          </div>
        );
      })}
      <Caption top={1040} start={36} parts={[['別等，', false], ['今年春天', true], ['就去做一件', false]]} />
    </Scene>
  );
};

const Cta: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const stamp = spring({frame: f - 6, fps, config: {damping: 9, stiffness: 180, mass: 0.9}});
  const typed = '28 歲'.slice(0, Math.floor(clamp((f - 46) / 14) * 4));
  return (
    <Scene len={S(B[6] - B[5])}>
      <div style={{position: 'absolute', left: 340, top: 190, transform: `scale(${2.4 - 1.4 * stamp}) rotate(${(1 - stamp) * -14 + 4}deg)`, opacity: clamp(stamp * 3)}}>
        <Seal ch="春" size={400} />
      </div>
      <div style={{position: 'absolute', top: 640, left: 0, width: 1080, textAlign: 'center', font: `900 120px ${FONT}`, color: INK, letterSpacing: 8}}>留言你的<Mark at={14}>歲數</Mark></div>
      <div style={{position: 'absolute', top: 830, left: 0, width: 1080, textAlign: 'center', font: `700 52px ${FONT}`, color: '#4a4538'}}>算算你還有幾個春天</div>
      <Pop at={36} style={{position: 'absolute', top: 960, left: 110, width: 860, height: 110, background: '#fffaf0', borderRadius: 14, border: `4px solid ${INK}`, boxShadow: `8px 8px 0 ${INK}`,
        display: 'flex', alignItems: 'center', padding: '0 36px', font: `700 46px ${FONT}`, color: typed ? INK : '#a49d8c'}}>
        {typed || '新增留言⋯'}
      </Pop>
      <Caption top={1130} start={58} parts={[['存起來，', false], ['春天別錯過', true]]} />
    </Scene>
  );
};

export const Spring80: React.FC = () => {
  const comps = [Hook, Terms, SpringOnly, Count80, Tip, Cta];
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <Bg />
      {comps.map((C, i) => (
        <Sequence key={i} from={S(B[i])} durationInFrames={S(B[i + 1]) - S(B[i])}><C /></Sequence>
      ))}
      <InkCuts />
    </AbsoluteFill>
  );
};
