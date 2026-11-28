import React from 'react';
import {AbsoluteFill, Easing, useCurrentFrame} from 'remotion';
import {Washer, T, Pop, Cap, Rays, Burst, ease, back, seg, clamp, INK, RED, FONT} from './Bullet';

export const DURATION = 30 * 30;
export const SC = [0, 100, 270, 430, 600, 760, 900];
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const CORE = '#c9a46b', CORE_D = '#8a6a3a';
const PULP = '#f3efe6', PULP_S = '#a9a293';

// ---------------------------------------------------------------- props
// end view of a roll; d = dissolve 0..1 (paper fades, core stays)
const Roll: React.FC<{x: number; y: number; r?: number; a?: number; d?: number}> = ({x, y, r = 44, a = 0, d = 0}) => (
  <g transform={`translate(${x},${y}) rotate(${a})`}>
    <g opacity={1 - d}>
      <circle r={r * (1 + d * 0.3)} fill="#fff" stroke={INK} strokeWidth={5} />
      <circle r={r * 0.72} fill="none" stroke="#dedede" strokeWidth={4} />
      <path d={`M ${r} 0 L ${r + 14} ${r * 0.5}`} stroke={INK} strokeWidth={4} />
    </g>
    <circle r={r * 0.38} fill={CORE} stroke={INK} strokeWidth={4} />
    <circle r={r * 0.25} fill={CORE_D} />
  </g>
);

// side view roll (standing)
const RollSide: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <rect x={-60} y={-70} width={120} height={140} fill="#fff" stroke={INK} strokeWidth={7} />
    <ellipse cx={0} cy={70} rx={60} ry={18} fill="#fff" stroke={INK} strokeWidth={7} />
    <rect x={-56} y={50} width={112} height={18} fill="#fff" />
    <ellipse cx={0} cy={-70} rx={60} ry={18} fill="#fff" stroke={INK} strokeWidth={7} />
    <ellipse cx={0} cy={-70} rx={22} ry={7} fill={CORE} stroke={INK} strokeWidth={4} />
    {[-30, 0, 30].map((v) => <line key={v} x1={-60} y1={v} x2={60} y2={v} stroke="#e6e6e6" strokeWidth={4} />)}
  </g>
);

const SoggyCore: React.FC<{x: number; y: number; a?: number; s?: number}> = ({x, y, a = 0, s = 1}) => (
  <g transform={`translate(${x},${y}) rotate(${a}) scale(${s})`}>
    <path d="M -70 -34 Q 0 -46 70 -30 Q 82 0 70 30 Q 0 44 -70 34 Z" fill={CORE} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    <ellipse cx={-70} cy={0} rx={14} ry={34} fill={CORE_D} stroke={INK} strokeWidth={6} />
    <path d="M -40 -30 Q -20 0 -44 30 M 10 -36 Q 26 0 6 36" stroke="#b08c55" strokeWidth={5} fill="none" />
    <path d="M 30 32 q 4 14 0 22" stroke="#7fd3ff" strokeWidth={8} strokeLinecap="round" />
  </g>
);

// lumpy pulp filling lower part of a circle of radius R (centred coords)
const Pulp: React.FC<{amt: number; top: number; R?: number; n?: number; shift?: number; f?: number}> = ({amt, top, R = 180, n = 46, shift = 0, f = 0}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      if (i >= amt * n) return null;
      const y = top + rnd(i + 50) * (R - top);
      const half = Math.sqrt(Math.max(0, R * R - y * y));
      const x = (rnd(i) * 2 - 1) * half * 0.9 + shift * (1 - (y - top) / (R - top + 1));
      const r = 26 + rnd(i + 9) * 18 + Math.sin(f * 0.2 + i) * 2;
      return <circle key={i} cx={x} cy={y} r={r} fill={PULP} stroke={PULP_S} strokeWidth={4} />;
    })}
  </g>
);

const SLOTS: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let row = -2; row <= 2; row++) for (let col = -2; col <= 2; col++) {
    const x = col * 86 + (row % 2 ? 43 : 0), y = row * 76;
    if (Math.hypot(x, y) < 150) out.push([x, y]);
  }
  return out;
})();

// ---------------------------------------------------------------- scenes
const S1: React.FC<{f: number; l: number}> = ({f, l}) => {
  const WX = 540, WY = 1110, WS = 0.86, HX = WX, HY = WY + 90 * WS;
  const arrive = (i: number) => 8 + i * 4;
  const door = l < 72 ? 1 : 1 - ease(seg(l, 72, 86));
  const landed = SLOTS.filter((_, i) => l >= arrive(i) + 10);
  const rolls = SLOTS.map(([sx, sy], i) => <Roll key={i} x={sx} y={sy} a={i * 40} r={42} />);
  return (
    <g>
      <Rays f={f} c1="#8ED1FC" c2="#9fd9fd" />
      <Washer id="p1" f={f} x={WX} y={WY} s={WS} door={door} clothes={false} water={false} mood={l > 70 ? 'worry' : 'shock'} sweat={l > 70 ? 1 : 0} look={[0, 0.7]}
        hole={door > 0.5 ? <g>{rolls.filter((_, i) => l >= arrive(i) + 10)}</g> : null}
        inside={door < 0.5 ? <g>{rolls}</g> : null} />
      {SLOTS.map(([sx, sy], i) => {
        const k = seg(l, arrive(i), arrive(i) + 10);
        if (k <= 0 || k >= 1) return null;
        const e = ease(k);
        const x0 = 100 + rnd(i) * 880, y0 = 640;
        const x = x0 + (HX + sx * WS - x0) * e, y = y0 + (HY + sy * WS - y0) * e - Math.sin(k * Math.PI) * 120;
        return <Roll key={i} x={x} y={y} r={42 * WS * (1.3 - 0.3 * e)} a={l * 12} />;
      })}
      {l > 8 && l < 90 && (
        <g transform="translate(870,700)">
          <rect x={-120} y={-56} width={240} height={88} rx={44} fill={INK} />
          <text x={0} y={8} fontSize={52} fill="#fff" textAnchor="middle" fontFamily={FONT} fontWeight={900}>× {landed.length * 2} 捲</text>
        </g>
      )}
      {l >= 86 && <Pop f={f} at={86} x={200} y={760} dur={6}><Burst text="砰！" fill="#fff36b" r={95} size={60} /></Pop>}
      <Pop f={f} at={0} x={540} y={290} dur={10}><T x={0} y={0} s={86}>把洗衣機塞滿衛生紙</T></Pop>
      <Pop f={f} at={6} x={540} y={430} dur={12}><T x={0} y={0} s={120} c="#ffe14d">按下開始</T></Pop>
      <Pop f={f} at={14} x={540} y={580} dur={12}><T x={0} y={0} s={128} c={RED} sw={18} st="#fff">會發生什麼事？</T></Pop>
    </g>
  );
};

const S2: React.FC<{f: number; l: number}> = ({f, l}) => {
  const wl = 290 - ease(seg(l, 0, 40)) * 170;
  const ang = l * 4 + Math.sin(l * 0.15) * 20;
  const d = ease(seg(l, 55, 125));
  const pulp = ease(seg(l, 70, 140));
  const streams = seg(l, 40, 70) * (1 - seg(l, 110, 140));
  const head = l < 60 ? '注水，開始翻滾' : l < 125 ? '散開了！' : '整桶變紙漿';
  const hk = l < 60 ? 0 : l < 125 ? 60 : 125;
  return (
    <g>
      <Rays f={f} c1="#8ED1FC" c2="#9fd9fd" />
      <Washer id="p2" f={f} x={540} y={1060} s={0.9} drum={ang} shake={2 + d * 4} clothes={false} wl={wl} mood={d > 0.5 ? 'shock' : 'worry'} sweat={1} rpm="40"
        inside={<g>
          <g transform={`rotate(${ang * 0.5})`} opacity={1 - pulp * 0.2}>
            {SLOTS.map(([sx, sy], i) => <Roll key={i} x={sx * (1 + d * 0.15)} y={sy * (1 + d * 0.15) + d * 30} a={ang + i * 30} r={42} d={d} />)}
          </g>
          {streams > 0 && Array.from({length: 7}, (_, i) => (
            <path key={i} transform={`rotate(${ang * 0.8 + i * 51})`} d={`M 20 0 Q 80 ${-40 + Math.sin(f * 0.3 + i) * 20} 140 ${10 + Math.cos(f * 0.25 + i) * 20} T 175 -20`} stroke="#fff" strokeWidth={22} fill="none" strokeLinecap="round" opacity={streams} />
          ))}
          <Pulp amt={pulp} top={-40 + (1 - pulp) * 120} f={f} />
        </g>} />
      <Pop key={hk} f={f} at={SC[1] + hk} x={540} y={320} dur={10}><T x={0} y={0} s={hk === 60 ? 120 : 96} c={hk === 125 ? '#fff' : '#ffe14d'}>{head}</T></Pop>
      <Cap f={f} at={SC[1] + 60} until={SC[1] + 125} text="衛生紙本來就設計成遇水會散開" size={52} />
      <Cap f={f} at={SC[1] + 125} until={SC[2]} text="才轉沒幾圈，就變成一缸紙漿" size={52} />
    </g>
  );
};

const S3: React.FC<{f: number; l: number}> = ({f, l}) => {
  const tilt = back(seg(l, 24, 46)) * 13;
  const cx = 540, cy = 980, L = 380;
  const rad = (tilt * Math.PI) / 180;
  const lx = cx - Math.cos(rad) * L, ly = cy - Math.sin(rad) * L;
  const rx = cx + Math.cos(rad) * L, ry = cy + Math.sin(rad) * L;
  return (
    <g>
      <rect width={1080} height={1920} fill="#FFF4DA" />
      {Array.from({length: 40}, (_, i) => <circle key={i} cx={(i % 8) * 150 + 40} cy={Math.floor(i / 8) * 420 + 120} r={8} fill="#f3e2b8" />)}
      <Pop f={f} at={SC[2]} x={540} y={300} dur={10}><T x={0} y={0} s={96} c="#ffe14d">紙漿吸飽了水</T></Pop>
      <polygon points={`${cx},${cy} ${cx - 90},${cy + 200} ${cx + 90},${cy + 200}`} fill="#9aa3b1" stroke={INK} strokeWidth={10} strokeLinejoin="round" />
      <rect x={cx - 420} y={cy + 196} width={840} height={24} rx={12} fill="#e2cfa3" />
      <g transform={`translate(${cx},${cy}) rotate(${tilt})`}>
        <rect x={-L - 40} y={-18} width={2 * L + 80} height={36} rx={18} fill="#c98f55" stroke={INK} strokeWidth={9} />
      </g>
      <g opacity={ease(seg(l, 0, 10))}>
        <RollSide x={lx} y={ly - 105} s={0.95} />
        <T x={lx + 30} y={ly - 230} s={60} sw={12} c={INK} st="#fff">乾的一捲</T>
      </g>
      <g opacity={ease(seg(l, 10, 20))} transform={`translate(${rx},${ry - 100})`}>
        {Array.from({length: 14}, (_, i) => <circle key={i} cx={(rnd(i) * 2 - 1) * 90} cy={(rnd(i + 30) * 2 - 1) * 60 + 10} r={34 + rnd(i + 7) * 16} fill={PULP} stroke={PULP_S} strokeWidth={5} />)}
        {[0, 1, 2].map((i) => { const p = ((f + i * 9) % 27) / 27; return <path key={i} transform={`translate(${-60 + i * 60},${90 + p * 70})`} opacity={1 - p} d="M 0 -18 Q 13 0 9 9 Q 0 18 -9 9 Q -13 0 0 -18 Z" fill="#7fd3ff" stroke={INK} strokeWidth={4} />; })}
        <T x={-20} y={-130} s={60} sw={12} c={INK} st="#fff">吸飽水</T>
      </g>
      {l > 46 && <Pop f={f} at={SC[2] + 46} x={rx - 130} y={ry + 200} dur={8}><Burst text="好重！" fill="#ffd166" r={110} size={52} /></Pop>}
      <Pop f={f} at={SC[2] + 60} x={540} y={1470} dur={12}><T x={0} y={0} s={100} c={RED} st="#fff" sw={16}>重量變成好幾倍</T></Pop>
      <Cap f={f} at={SC[2] + 80} until={SC[3]} text="塞滿一整桶，很可能超過負荷" y={1600} size={52} />
    </g>
  );
};

const S4: React.FC<{f: number; l: number}> = ({f, l}) => {
  const stop = l >= 78;
  const ramp = stop ? 0 : ease(seg(l, 8, 76));
  const rpm = Math.round(ramp * 400);
  const ang = Array.from({length: Math.min(78, Math.max(0, Math.floor(l)))}, (_, i) => 2 + ease(seg(i, 8, 76)) * 14).reduce((a, b) => a + b, 0);
  const shake = stop ? (l < 84 ? (84 - l) * 3 : 0) : 3 + ramp * 26;
  const side = Math.sin((ang * Math.PI) / 180) * 70 * ramp;
  return (
    <g>
      <Rays f={f} c1={stop ? '#ffb4a8' : '#8ED1FC'} c2={stop ? '#ffc6bd' : '#9fd9fd'} />
      <Washer id="p4" f={f} x={540} y={1060} s={0.9} drum={ang} shake={shake} clothes={false} wl={200} mood={stop ? 'shock' : 'worry'} sweat={1}
        rpm={stop ? (Math.floor(l / 8) % 2 ? 'ERR' : '') : String(rpm)} lcd={stop ? '#ff6b6b' : '#7CFFB2'}
        look={stop ? [0, 0] : [Math.sin(l * 0.4), 0.3]}
        inside={<g transform={`rotate(${ang * 0.3})`}><Pulp amt={1} top={-30} f={f} shift={side} /></g>} />
      <Pop f={f} at={SC[3] + 2} x={540} y={300} dur={10}>
        <rect x={-330} y={-100} width={660} height={160} rx={40} fill={INK} />
        <text x={0} y={10} fontSize={88} fill={stop ? '#ff6b6b' : '#7CFFB2'} textAnchor="middle" fontFamily={FONT} fontWeight={900}>{stop ? '脫水停止' : `脫水 ${rpm} 轉`}</text>
      </Pop>
      {stop && <Pop f={f} at={SC[3] + 80} x={540} y={565} dur={8}><Burst text="脫水失敗！" fill="#fff" r={240} size={64} rot={-6} /></Pop>}
      <Cap f={f} at={SC[3] + 6} until={SC[3] + 80} text="紙漿擠到同一邊，越轉越抖" size={52} />
      <Cap f={f} at={SC[3] + 84} until={SC[4]} text="很多洗衣機偵測到不平衡就會停下來" size={48} />
    </g>
  );
};

const S5: React.FC<{f: number; l: number}> = ({f, l}) => {
  const WX = 540, WY = 1020, WS = 0.86;
  const twist = ease(seg(l, 92, 104));
  const lab = (at: number, tx: number, ty: number, px: number, py: number, text: string) => {
    const k = ease(seg(l, at, at + 10));
    if (k <= 0) return null;
    return (
      <g opacity={k * (1 - twist * 0.85)}>
        <line x1={tx} y1={ty} x2={tx + (px - tx) * k} y2={ty + (py - ty) * k} stroke={INK} strokeWidth={7} />
        <circle cx={px} cy={py} r={12 * k} fill={RED} stroke={INK} strokeWidth={4} />
        <g transform={`translate(${tx},${ty}) scale(${back(k)})`}>
          <rect x={-150} y={-52} width={300} height={90} rx={26} fill={RED} stroke={INK} strokeWidth={7} />
          <text x={0} y={12} fontSize={50} fill="#fff" textAnchor="middle" fontFamily={FONT} fontWeight={900}>{text}</text>
        </g>
      </g>
    );
  };
  const ooze = ease(seg(l, 4, 40));
  return (
    <g>
      <rect width={1080} height={1920} fill="#E9E6FF" />
      <g opacity={1 - twist * 0.85}>
        <Pop f={f} at={SC[4]} x={540} y={300} dur={10}><T x={0} y={0} s={96} c="#ffe14d">打開門的瞬間…</T></Pop>
        <Washer id="p5" f={f} x={WX} y={WY} s={WS} door={1} clothes={false} water={false} mood="shock" look={[0, 0.8]}
          hole={<Pulp amt={1} top={-150} R={200} n={60} f={f} />} />
        {/* filter hatch */}
        <rect x={WX - 255 * WS} y={WY + 290 * WS} width={90 * WS} height={60 * WS} rx={10} fill="#dfe3ea" stroke={INK} strokeWidth={6} />
        {/* ooze */}
        <g opacity={ooze}>
          {Array.from({length: 9}, (_, i) => <circle key={i} cx={WX - 120 + i * 30 + Math.sin(i) * 10} cy={WY + 300 * WS + ooze * (120 + rnd(i) * 140)} r={28 + rnd(i + 3) * 14} fill={PULP} stroke={PULP_S} strokeWidth={4} />)}
          <path d={`M ${WX - 110} ${WY + 290 * WS} Q ${WX} ${WY + 300 * WS + ooze * 160} ${WX + 120} ${WY + 290 * WS}`} fill={PULP} stroke={PULP_S} strokeWidth={4} />
        </g>
        {lab(30, 230, 610, WX - 210 * WS, WY + 0, '門邊膠圈')}
        {lab(42, 850, 610, WX + 120 * WS, WY + 60 * WS, '滾筒小洞')}
        {lab(54, 230, 1520, WX - 210 * WS, WY + 320 * WS, '排水濾網')}
        <Cap f={f} at={SC[4] + 30} until={SC[4] + 92} text="紙漿塞進每一個縫" y={1680} />
      </g>
      {twist > 0 && (
        <g opacity={twist}>
          <Rays f={f} c1="#FFD95A" c2="#ffe27f" cy={900} />
          <T x={540} y={640} s={80} c="#fff">最撐得住的反而是…</T>
          <Pop f={f} at={SC[4] + 110} x={540} y={860} dur={12}><T x={0} y={0} s={150} c="#ffe14d" sw={18}>紙捲芯！</T></Pop>
          {l > 118 && [[-200, 1180, -12], [0, 1120, 8], [210, 1190, 18], [-90, 1290, 4], [120, 1300, -10]].map(([dx, y, a], i) => (
            <Pop key={i} f={f} at={SC[4] + 118 + i * 3} x={540 + dx} y={y} dur={8}><SoggyCore x={0} y={0} a={a} s={1.2} /></Pop>
          ))}
        </g>
      )}
    </g>
  );
};

const S6: React.FC<{f: number; l: number}> = ({f, l}) => {
  const tips = ['先把紙漿撈出來', '清乾淨排水濾網', '再空洗一次'];
  return (
    <g>
      <Rays f={f} c1="#8ED1FC" c2="#9fd9fd" cy={420} />
      <Pop f={f} at={SC[5]} x={540} y={300} dur={10}><T x={0} y={0} s={92}>不會爆炸也不會冒煙</T></Pop>
      <Pop f={f} at={SC[5] + 10} x={540} y={460} dur={12}><T x={0} y={0} s={112} c="#ffe14d" sw={16}>但會清到懷疑人生</T></Pop>
      <g opacity={ease(seg(l, 26, 38))} transform={`translate(0,${(1 - ease(seg(l, 26, 38))) * 40})`}>
        <rect x={90} y={580} width={900} height={500} rx={44} fill="#fff" stroke={INK} strokeWidth={10} />
        <text x={540} y={680} fontSize={58} fill={INK} textAnchor="middle" fontFamily={FONT} fontWeight={900}>萬一真的發生</text>
        {tips.map((t, i) => (
          <g key={i} opacity={ease(seg(l, 34 + i * 8, 42 + i * 8))}>
            <circle cx={200} cy={790 + i * 100} r={34} fill="#2f80ed" stroke={INK} strokeWidth={5} />
            <text x={200} y={807 + i * 100} fontSize={44} fill="#fff" textAnchor="middle" fontFamily={FONT} fontWeight={900}>{i + 1}</text>
            <text x={260} y={808 + i * 100} fontSize={54} fill={INK} fontFamily={FONT} fontWeight={900}>{t}</text>
          </g>
        ))}
      </g>
      <Washer id="p6" f={f} x={290} y={1440} s={0.4} mood="wink" rpm="0" clothes={false} />
      {l > 66 && (
        <g opacity={ease(seg(l, 66, 76))} transform={`translate(0,${(1 - ease(seg(l, 66, 76))) * 30})`}>
          <path d="M 470 1180 L 1010 1180 Q 1040 1180 1040 1210 L 1040 1410 Q 1040 1440 1010 1440 L 520 1440 L 450 1480 L 470 1420 Q 450 1420 450 1400 L 450 1210 Q 450 1180 470 1180 Z" fill="#fff" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
          <text x={745} y={1280} fontSize={48} fill={INK} textAnchor="middle" fontFamily={FONT} fontWeight={900}>你洗衣服出過什麼包？</text>
          <text x={745} y={1370} fontSize={58} fill={RED} textAnchor="middle" fontFamily={FONT} fontWeight={900}>留言告訴我 👇</text>
        </g>
      )}
    </g>
  );
};

const SCENES = [S1, S2, S3, S4, S5, S6];

export const PaperWasher: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#8ED1FC'}}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        {SCENES.map((S, i) => {
          const a = SC[i], b = SC[i + 1];
          if (f < a || f >= b + 6) return null;
          const fadeOut = i < SCENES.length - 1 ? 1 - seg(f, b, b + 6) : 1;
          return <g key={i} opacity={fadeOut}><S f={f} l={f - a} /></g>;
        }).reverse()}
        <g transform="translate(60,96)">
          <rect x={0} y={-46} width={250} height={64} rx={32} fill={INK} />
          <text x={125} y={0} fontSize={34} fill="#fff" textAnchor="middle" fontFamily={FONT} fontWeight={900}>洗衣機實驗室</text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};
