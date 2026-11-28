import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Washer, T, Pop, Cap, Burst, ease, back, seg, clamp, INK, RED, FONT} from './Bullet';

export const DURATION = 30 * 30;
// hook | no washer on ISS | water blobs | no tumbling | body counter-spins | spin works + water everywhere | end
export const SC = [0, 90, 220, 360, 500, 650, 790, 900];
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const WATER = '#5fc0f2';

// ---------------------------------------------------------------- backdrop
const SpaceBG: React.FC<{f: number}> = ({f}) => (
  <g>
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0a0f2c" /><stop offset="1" stopColor="#24205a" /></linearGradient>
      <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0.86" stopColor="#7fd3ff" stopOpacity="0.55" /><stop offset="1" stopColor="#7fd3ff" stopOpacity="0" /></radialGradient>
    </defs>
    <rect width={1080} height={1920} fill="url(#sky)" />
    {Array.from({length: 90}, (_, i) => {
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(f * 0.06 + i * 1.7));
      return <circle key={i} cx={rnd(i) * 1080} cy={rnd(i + 200) * 1920} r={1.5 + rnd(i + 400) * 3} fill="#fff" opacity={tw} />;
    })}
    <circle cx={540} cy={2780} r={1260} fill="url(#glow)" />
    <circle cx={540} cy={2780} r={1100} fill="#2f7fd8" stroke={INK} strokeWidth={10} />
    <g opacity={0.95}>
      <path d={`M ${120 + (f * 0.4) % 60} 1760 q 120 -70 260 -20 q 60 40 -40 90 q -150 30 -220 -70 z`} fill="#5cc27a" stroke={INK} strokeWidth={7} />
      <path d={`M ${640 + (f * 0.4) % 60} 1730 q 140 -40 250 20 q -40 70 -150 60 q -120 -10 -100 -80 z`} fill="#5cc27a" stroke={INK} strokeWidth={7} />
    </g>
  </g>
);

const Blob: React.FC<{x: number; y: number; r: number; f: number; i?: number; op?: number}> = ({x, y, r, f, i = 0, op = 1}) => {
  const w = Math.sin(f * 0.25 + i * 1.3) * 0.1;
  return (
    <g transform={`translate(${x},${y})`} opacity={op}>
      <ellipse rx={r * (1 + w)} ry={r * (1 - w)} fill={WATER} stroke={INK} strokeWidth={Math.max(3, r * 0.09)} />
      <ellipse cx={-r * 0.35} cy={-r * 0.35} rx={r * 0.22} ry={r * 0.14} fill="#fff" opacity={0.85} transform={`rotate(-30 ${-r * 0.35} ${-r * 0.35})`} />
    </g>
  );
};

const Float: React.FC<{x: number; y: number; a?: number; s?: number; children: React.ReactNode}> = ({x, y, a = 0, s = 1, children}) => (
  <g transform={`translate(${x},${y}) rotate(${a}) scale(${s})`}>{children}</g>
);

const ISS: React.FC = () => (
  <g>
    {[-310, -200, 200, 310].map((x) => (
      <g key={x}>
        {[-1, 1].map((d) => (
          <g key={d}>
            <rect x={x - 38} y={d < 0 ? -200 : 20} width={76} height={180} fill="#2f4fa8" stroke={INK} strokeWidth={6} />
            {[1, 2, 3].map((k) => <line key={k} x1={x - 38} y1={(d < 0 ? -200 : 20) + k * 45} x2={x + 38} y2={(d < 0 ? -200 : 20) + k * 45} stroke="#7aa0ff" strokeWidth={3} />)}
            <line x1={x} y1={d < 0 ? -200 : 20} x2={x} y2={d < 0 ? -20 : 200} stroke="#7aa0ff" strokeWidth={3} />
          </g>
        ))}
      </g>
    ))}
    <rect x={-380} y={-12} width={760} height={24} rx={6} fill="#b7bfcc" stroke={INK} strokeWidth={6} />
    <rect x={-130} y={-34} width={260} height={68} rx={34} fill="#eef1f6" stroke={INK} strokeWidth={7} />
    <rect x={-30} y={-110} width={60} height={220} rx={30} fill="#eef1f6" stroke={INK} strokeWidth={7} />
    <circle cx={0} cy={0} r={22} fill="#cfd5df" stroke={INK} strokeWidth={6} />
  </g>
);

const Capsule: React.FC<{fire: number; f: number}> = ({fire, f}) => (
  <g>
    {fire > 0 && (
      <g opacity={fire}>
        <path d={`M -70 30 Q -60 ${-160 - Math.sin(f) * 20} 0 ${-260 - Math.cos(f * 1.3) * 30} Q 60 ${-160 - Math.sin(f * 1.1) * 20} 70 30 Z`} fill="#ff7a29" stroke={INK} strokeWidth={6} />
        <path d={`M -40 30 Q -30 -90 0 ${-160 - Math.sin(f * 1.7) * 20} Q 30 -90 40 30 Z`} fill="#ffd23f" />
        <ellipse cx={0} cy={40} rx={95} ry={44} fill="#ff7a29" opacity={0.6} />
      </g>
    )}
    <path d="M -60 40 L -34 -50 L 34 -50 L 60 40 Z" fill="#eef1f6" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    <rect x={-64} y={36} width={128} height={20} rx={8} fill="#8a6a3a" stroke={INK} strokeWidth={6} />
    <circle cx={0} cy={-6} r={14} fill="#7fd3ff" stroke={INK} strokeWidth={5} />
  </g>
);

const LaundryBag: React.FC = () => (
  <g>
    <path d="M -50 -30 Q -60 50 0 54 Q 60 50 50 -30 Q 0 -44 -50 -30 Z" fill="#e8d9b5" stroke={INK} strokeWidth={6} />
    <path d="M -14 -36 q -10 -30 -34 -30 q -8 14 8 22" fill="#ff8fa3" stroke={INK} strokeWidth={5} />
    <path d="M 12 -38 q 6 -30 32 -28 q 4 16 -14 22" fill="#8fd694" stroke={INK} strokeWidth={5} />
    <path d="M -20 -30 q 20 8 40 0" stroke={INK} strokeWidth={5} fill="none" />
    {[0, 1, 2].map((i) => <path key={i} d={`M ${-40 + i * 34} -66 q 6 -14 0 -26`} stroke="#9aa36b" strokeWidth={5} fill="none" strokeLinecap="round" />)}
  </g>
);

const Bubble: React.FC<{x: number; y: number; w: number; text: string; k: number; tail?: 'left' | 'right'}> = ({x, y, w, text, k, tail = 'left'}) => (
  <g transform={`translate(${x},${y}) scale(${back(k)})`} opacity={clamp(k * 3)}>
    <rect x={-w / 2} y={-60} width={w} height={110} rx={40} fill="#fff" stroke={INK} strokeWidth={8} />
    <path d={tail === 'left' ? `M ${-w / 2 + 50} 46 L ${-w / 2 + 30} 100 L ${-w / 2 + 100} 46 Z` : `M ${w / 2 - 50} 46 L ${w / 2 - 30} 100 L ${w / 2 - 100} 46 Z`} fill="#fff" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
    <rect x={tail === 'left' ? -w / 2 + 46 : w / 2 - 104} y={36} width={58} height={14} fill="#fff" />
    <text x={0} y={14} fontSize={52} fill={INK} textAnchor="middle" fontFamily={FONT} fontWeight={900}>{text}</text>
  </g>
);

// ---------------------------------------------------------------- scenes
type P = {f: number; l: number};

const S1: React.FC<P> = ({f, l}) => (
  <g>
    <Float x={540} y={1130 + Math.sin(f * 0.07) * 24} a={Math.sin(f * 0.05) * 10} s={0.8}>
      <Washer id="h" f={f} x={0} y={0} space water={false} mood="happy" rpm="0" look={[0, -0.5]} />
    </Float>
    <Pop f={f} at={0} x={540} y={330} dur={10}><T x={0} y={0} s={96}>在太空用滾筒洗衣機</T></Pop>
    <Pop f={f} at={8} x={540} y={520} dur={12}><T x={0} y={0} s={170} c="#ffe14d" sw={20}>會怎樣？</T></Pop>
  </g>
);

const S2: React.FC<P> = ({f, l}) => {
  const bagK = ease(seg(l, 34, 50));
  const fall = seg(l, 52, 112);
  const cy = 700 + Math.pow(fall, 1.6) * 900;
  const cs = 1 - fall * 0.5;
  const fire = seg(l, 66, 80);
  return (
    <g>
      <g transform={`translate(540,640) scale(${0.9 * back(seg(l, 0, 14))})`}><ISS /></g>
      <Pop f={f} at={SC[1] + 4} x={540} y={300} dur={10}><T x={0} y={0} s={84}>其實太空站上</T></Pop>
      <Pop f={f} at={SC[1] + 12} x={540} y={420} dur={10}><T x={0} y={0} s={104} c="#ffe14d" sw={16}>沒有洗衣機</T></Pop>
      {l >= 30 && l < 54 && <g transform={`translate(${540 + (1 - bagK) * 200},${700 - (1 - bagK) * 60}) scale(${1 - bagK * 0.4})`}><LaundryBag /></g>}
      {l >= 30 && <g transform={`translate(${540 + Math.sin(fall * 6) * 20 * fall},${cy}) scale(${cs}) rotate(${fall * 10})`} opacity={1 - seg(l, 118, 128)}><Capsule fire={fire} f={f} /></g>}
      {l >= 98 && <Pop f={f} at={SC[1] + 98} x={540} y={1200} dur={8}><Burst text="直接燒掉！" fill="#ffd23f" r={230} size={70} /></Pop>}
      <Cap f={f} at={SC[1] + 34} until={SC[1] + 96} text="穿髒的衣服打包上貨運船" size={52} y={1560} />
      <Cap f={f} at={SC[1] + 96} until={SC[2]} text="跟著衝進大氣層一起燒掉" size={52} y={1560} />
    </g>
  );
};

const BLOBS = Array.from({length: 8}, (_, i) => ({x: (rnd(i + 11) * 2 - 1) * 110, y: (rnd(i + 23) * 2 - 1) * 100, r: 26 + rnd(i + 5) * 26}));

const S3: React.FC<P> = ({f, l}) => {
  const enter = ease(seg(l, 0, 22));
  const wx = 1500 - enter * 960;
  const shown = Math.floor(seg(l, 40, 84) * BLOBS.length + 0.001);
  const inside = (
    <g>
      {BLOBS.slice(0, shown).map((b, i) => {
        const age = seg(l, 40 + i * 5.5, 52 + i * 5.5);
        return <Blob key={i} x={-150 + (b.x + 150 + Math.sin(f * 0.04 + i) * 16) * ease(age)} y={-150 + (b.y + 150 + Math.cos(f * 0.05 + i) * 14) * ease(age)} r={b.r * (0.4 + 0.6 * age)} f={f} i={i} />;
      })}
    </g>
  );
  return (
    <g>
      <Float x={wx} y={1100 + Math.sin(f * 0.07) * 18} a={Math.sin(f * 0.05) * 6} s={0.85}>
        <Washer id="w3" f={f} x={0} y={0} space water={false} clothes mood={l > 86 ? 'shock' : 'happy'} rpm="0" look={l > 86 ? [0, 0.6] : [-0.6, -0.4]} inside={inside} />
      </Float>
      {l > 14 && l < 50 && <Bubble x={640} y={660} w={460} text="那我來試試！" k={seg(l, 14, 24) * (1 - seg(l, 44, 50))} tail="left" />}
      {l >= 46 && l < 86 && <Pop f={f} at={SC[2] + 46} x={540} y={360} dur={10}><T x={0} y={0} s={110} c="#fff">加水…</T></Pop>}
      {l >= 86 && <Pop f={f} at={SC[2] + 86} x={540} y={360} dur={10}><T x={0} y={0} s={110} c="#ffe14d" sw={16}>水全變成水球！</T></Pop>}
      <Cap f={f} at={SC[2] + 90} until={SC[3]} text="沒有重力，水不會沉到底" y={1640} />
    </g>
  );
};

const Mini: React.FC<{cx: number; cy: number; f: number; earth: boolean}> = ({cx, cy, f, earth}) => {
  const R = 110, p = (f % 44) / 44;
  let x: number, y: number;
  if (earth) {
    if (p < 0.6) { const a = Math.PI / 2 + (p / 0.6) * Math.PI * 0.85; x = Math.cos(a) * (R - 26); y = Math.sin(a) * (R - 26); }
    else { const a = Math.PI / 2 + Math.PI * 0.85; const x0 = Math.cos(a) * (R - 26), y0 = Math.sin(a) * (R - 26); const q = (p - 0.6) / 0.4; x = x0 * (1 - q) + 10 * q; y = y0 + (R - 26 - y0) * q * q; }
  } else { const a = f * 0.09; x = Math.cos(a) * (R - 26); y = Math.sin(a) * (R - 26); }
  return (
    <g transform={`translate(${cx},${cy})`}>
      <circle r={R} fill="#d6f0ff" stroke={INK} strokeWidth={8} />
      <g transform={`rotate(${f * 5.2})`}>{[0, 1, 2].map((k) => <rect key={k} x={-8} y={-R + 2} width={16} height={22} fill="#9aa4b4" transform={`rotate(${k * 120})`} />)}</g>
      {earth && p >= 0.6 && <path d={`M ${x} ${y - 30} l 0 -26`} stroke={INK} strokeWidth={5} strokeLinecap="round" opacity={0.6} />}
      <path transform={`translate(${x},${y})`} d="M -22 -14 L 22 -14 L 26 14 L -26 14 Z" fill="#ff8fa3" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    </g>
  );
};

const S4: React.FC<P> = ({f, l}) => {
  const drum = l * 5.2;
  const insetK = ease(seg(l, 20, 32));
  return (
    <g>
      <Float x={540} y={1260 + Math.sin(f * 0.07) * 14} s={0.74}>
        <Washer id="w4" f={f} x={0} y={0} space water={false} drum={drum} mood="worry" rpm="40" look={[0.6, 0.4]}
          inside={<g>{BLOBS.map((b, i) => <Blob key={i} x={b.x + Math.sin(f * 0.04 + i) * 18} y={b.y + Math.cos(f * 0.05 + i) * 16} r={b.r} f={f} i={i} />)}</g>} />
      </Float>
      <Pop f={f} at={SC[3]} x={540} y={300} dur={10}><T x={0} y={0} s={104} c="#ffe14d" sw={16}>衣服不會掉下來</T></Pop>
      <g opacity={insetK} transform={`translate(0,${(1 - insetK) * 40})`}>
        <Mini cx={290} cy={560} f={f} earth />
        <Mini cx={790} cy={560} f={f} earth={false} />
        <T x={290} y={740} s={46} sw={10}>地球：摔下來拍打</T>
        <T x={790} y={740} s={46} sw={10}>太空：黏著一起轉</T>
      </g>
      <Cap f={f} at={SC[3] + 30} until={SC[3] + 88} text="滾筒洗衣機靠衣服摔落來洗" y={1700} size={52} />
      <Cap f={f} at={SC[3] + 88} until={SC[4]} text="在太空，等於根本沒在洗" y={1700} size={52} />
    </g>
  );
};

// cumulative drum angle & body angle for spin scenes (deterministic integration)
const spinState = (l: number) => {
  let drum = 0, body = 0;
  for (let i = 0; i < l; i++) {
    const w = 4 + ease(seg(i, 0, 100)) * 40;
    drum += w; body -= w * 0.16 * ease(seg(i, 10, 60));
  }
  return {drum, body, w: 4 + ease(seg(l, 0, 100)) * 40};
};

const S5: React.FC<P> = ({f, l}) => {
  const {drum, body, w} = spinState(l);
  const rpm = Math.round((w / 44) * 1000);
  const spinK = seg(l, 20, 70);
  return (
    <g>
      {spinK > 0 && Array.from({length: 4}, (_, i) => (
        <path key={i} transform={`translate(540,1060) rotate(${body * 1.0 + i * 90})`} d="M 0 -470 A 470 470 0 0 0 -330 -330" stroke="#fff" strokeWidth={14} fill="none" strokeLinecap="round" opacity={0.5 * spinK} />
      ))}
      <Float x={540} y={1060} a={body} s={0.78}>
        <Washer id="w5" f={f} x={0} y={0} space water={false} drum={drum} mood={l > 70 ? 'dizzy' : 'shock'} rpm={String(rpm)} sweat={1}
          inside={<g>{BLOBS.map((b, i) => { const a = ((drum * 0.8 + i * 45) * Math.PI) / 180; return <Blob key={i} x={b.x * (1 - spinK) + Math.cos(a) * 160 * spinK} y={b.y * (1 - spinK) + Math.sin(a) * 160 * spinK} r={b.r * (1 - 0.35 * spinK)} f={f} i={i} />; })}</g>} />
      </Float>
      <Pop f={f} at={SC[4]} x={540} y={300} dur={10}><T x={0} y={0} s={96} c="#fff">開始脫水…</T></Pop>
      {l >= 52 && <Pop f={f} at={SC[4] + 52} x={540} y={300} dur={10}><rect x={-520} y={-100} width={1040} height={150} fill="transparent" /><T x={0} y={0} s={104} c="#ffe14d" sw={16}>整台洗衣機反著轉！</T></Pop>}
      <Cap f={f} at={SC[4] + 56} until={SC[5]} text="沒固定住的話，機身會往反方向轉" y={1680} size={50} />
    </g>
  );
};

const S6: React.FC<P> = ({f, l}) => {
  const base = spinState(SC[5] - SC[4] + l);
  const body = base.body;
  const open = ease(seg(l, 40, 50));
  const burst = seg(l, 42, 120);
  const s = 0.78, wx = 540, wy = 1060;
  const rad = (body * Math.PI) / 180;
  const dx = wx + (-Math.sin(rad) * 90) * s, dy = wy + (Math.cos(rad) * 90) * s;
  const drops = l < 44 ? Array.from({length: 16}, (_, i) => {
    const a = (i / 16) * Math.PI * 2 + base.drum * 0.01; const p = ((l * 2 + i * 7) % 30) / 30;
    return <circle key={i} cx={Math.cos(a) * (150 + p * 220)} cy={Math.sin(a) * (150 + p * 220)} r={10 * (1 - p) + 4} fill={WATER} stroke={INK} strokeWidth={3} opacity={1 - p} />;
  }) : null;
  return (
    <g>
      <Float x={wx} y={wy} a={body} s={s}>
        <Washer id="w6" f={f} x={0} y={0} space water={false} drum={base.drum} door={open} mood={l > 40 ? 'shock' : 'happy'} rpm={l > 40 ? '0' : '1000'}
          inside={<g>{l < 40 && BLOBS.map((b, i) => { const a = base.drum * 0.8 + i * 45; return <Blob key={i} x={Math.cos((a * Math.PI) / 180) * 160} y={Math.sin((a * Math.PI) / 180) * 160} r={b.r * 0.55} f={f} i={i} />; })}</g>} />
      </Float>
      {drops && <g transform={`translate(${wx},${wy + 90 * s})`}>{drops}</g>}
      {burst > 0 && Array.from({length: 18}, (_, i) => {
        const a = rnd(i + 70) * Math.PI * 2, sp = 500 + rnd(i + 90) * 700, e = ease(burst);
        return <Blob key={i} x={dx + Math.cos(a) * sp * e} y={dy + Math.sin(a) * sp * e} r={(20 + rnd(i + 30) * 50) * (0.4 + e)} f={f} i={i} />;
      })}
      <Pop f={f} at={SC[5]} x={540} y={300} dur={10}><T x={0} y={0} s={104} c="#ffe14d" sw={16}>但脫水居然有效！</T></Pop>
      <Cap f={f} at={SC[5] + 4} until={SC[5] + 44} text="旋轉本身就能把水甩出去" y={1680} size={52} />
      {l >= 44 && <Pop f={f} at={SC[5] + 44} x={540} y={470} dur={8}><Burst text="嘩！" fill="#fff" r={120} size={70} rot={8} /></Pop>}
      <Cap f={f} at={SC[5] + 50} until={SC[6]} text="只是一開門，水球飄滿整個艙" y={1680} size={52} />
    </g>
  );
};

const S7: React.FC<P> = ({f, l}) => (
  <g>
    {Array.from({length: 14}, (_, i) => <Blob key={i} x={rnd(i + 70) * 1000 + 40 + Math.sin(f * 0.03 + i) * 30} y={300 + rnd(i + 120) * 1300 + Math.cos(f * 0.025 + i) * 30} r={20 + rnd(i + 30) * 40} f={f} i={i} op={0.85} />)}
    <Float x={290} y={1330 + Math.sin(f * 0.07) * 16} a={-20 + Math.sin(f * 0.04) * 20 - l * 0.6} s={0.42}>
      <Washer id="w7" f={f} x={0} y={0} space water={false} mood={l > 60 ? 'wink' : 'dizzy'} rpm="0" />
    </Float>
    <Pop f={f} at={SC[6]} x={540} y={420} dur={10}><T x={0} y={0} s={96}>難怪太空站上</T></Pop>
    <Pop f={f} at={SC[6] + 8} x={540} y={570} dur={12}><T x={0} y={0} s={120} c="#ffe14d" sw={16}>不放洗衣機</T></Pop>
    {l > 40 && (
      <g opacity={ease(seg(l, 40, 50))} transform={`translate(0,${(1 - ease(seg(l, 40, 50))) * 30})`}>
        <path d="M 470 1060 L 1010 1060 Q 1040 1060 1040 1090 L 1040 1290 Q 1040 1320 1010 1320 L 520 1320 L 450 1360 L 470 1300 Q 450 1300 450 1280 L 450 1090 Q 450 1060 470 1060 Z" fill="#fff" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
        <text x={745} y={1160} fontSize={46} fill={INK} textAnchor="middle" fontFamily={FONT} fontWeight={900}>下一集把我帶去哪？</text>
        <text x={745} y={1250} fontSize={58} fill={RED} textAnchor="middle" fontFamily={FONT} fontWeight={900}>留言告訴我 👇</text>
      </g>
    )}
  </g>
);

const SCENES = [S1, S2, S3, S4, S5, S6, S7];

export const SpaceWasher: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#0a0f2c'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <SpaceBG f={f} />
        {SCENES.map((S, i) => {
          const a = SC[i], b = SC[i + 1];
          if (f < a || f >= b + 6) return null;
          const fadeOut = i < SCENES.length - 1 ? 1 - seg(f, b, b + 6) : 1;
          const fadeIn = i > 0 ? seg(f, a, a + 6) : 1;
          return <g key={i} opacity={Math.min(fadeOut, fadeIn)}><S f={f} l={f - a} /></g>;
        })}
        <g transform="translate(60,96)">
          <rect x={0} y={-46} width={250} height={64} rx={32} fill="#fff" />
          <text x={125} y={0} fontSize={34} fill={INK} textAnchor="middle" fontFamily={FONT} fontWeight={900}>洗衣機實驗室</text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};
