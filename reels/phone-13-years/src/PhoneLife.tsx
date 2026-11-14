import React from 'react';
import {AbsoluteFill, Easing, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import '@fontsource/noto-sans-tc/500.css';
import '@fontsource/noto-sans-tc/700.css';
import '@fontsource/noto-sans-tc/900.css';

export const FPS = 30;
const S = (sec: number) => Math.round(sec * FPS);
// scene boundaries (seconds)
const B = [0, 3.4, 7, 11, 15.4, 19.8, 23.6, 27.6];
export const DURATION = S(B[B.length - 1]);

const LIME = '#c9f33a';
const INK = '#0e0f12';
const PAPER = '#eceff2';
const GREY = '#d5dae1';
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const seg = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
const FONT = '"Noto Sans TC", sans-serif';

const Pop: React.FC<{at: number; children: React.ReactNode; style?: React.CSSProperties}> = ({at, children, style}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: f - at, fps, config: {damping: 11, stiffness: 160, mass: 0.7}});
  return <div style={{transform: `scale(${0.3 + 0.7 * p})`, opacity: clamp(p * 2), ...style}}>{children}</div>;
};

const Hl: React.FC<{children: React.ReactNode; at?: number; size?: number}> = ({children, at = 0, size}) => {
  const f = useCurrentFrame();
  const k = ease(seg(f, at, at + 8));
  return (
    <span style={{display: 'inline-block', background: LIME, border: `4px solid ${INK}`, borderRadius: 18,
      padding: '0 18px', margin: '0 4px', boxShadow: `0 6px 0 ${INK}`, transform: `scale(${0.6 + 0.4 * k})`,
      opacity: k, fontSize: size}}>{children}</span>
  );
};

const Bg: React.FC<{dark?: boolean}> = ({dark}) => {
  const lines: React.ReactNode[] = [];
  for (let i = -8; i <= 8; i++) {
    lines.push(<line key={'v' + i} x1={540 + i * 40} y1={1180} x2={540 + i * 190} y2={1920}
      stroke={dark ? 'rgba(201,243,58,0.55)' : 'rgba(14,15,18,0.07)'} strokeWidth={2} />);
  }
  for (let j = 0; j < 7; j++) {
    const y = 1180 + Math.pow(j / 6, 1.7) * 740;
    lines.push(<line key={'h' + j} x1={0} y1={y} x2={1080} y2={y}
      stroke={dark ? 'rgba(201,243,58,0.45)' : 'rgba(14,15,18,0.06)'} strokeWidth={2} />);
  }
  return (
    <AbsoluteFill style={{background: dark ? '#08090b' : PAPER}}>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>{lines}</svg>
    </AbsoluteFill>
  );
};

const Progress: React.FC = () => {
  const f = useCurrentFrame();
  return <div style={{position: 'absolute', left: 0, top: 0, height: 10, width: `${(f / DURATION) * 100}%`, background: LIME}} />;
};

const Scene: React.FC<{len: number; children: React.ReactNode}> = ({len, children}) => {
  const f = useCurrentFrame();
  const inK = ease(seg(f, 0, 9));
  const outK = seg(f, len - 5, len);
  return (
    <AbsoluteFill style={{opacity: inK * (1 - outK), transform: `translateY(${(1 - inK) * 36}px) scale(${1 - outK * 0.02})`}}>
      {children}
    </AbsoluteFill>
  );
};

const Head: React.FC<{children: React.ReactNode; top?: number}> = ({children, top = 170}) => (
  <div style={{position: 'absolute', top, left: 0, width: 1080, textAlign: 'center', font: `900 92px/1.2 ${FONT}`, color: INK, letterSpacing: 2}}>
    {children}
  </div>
);

// typewriter caption: parts = [text, highlight?]
const Caption: React.FC<{parts: [string, boolean][]; start?: number; top?: number}> = ({parts, start = 10, top = 1330}) => {
  const f = useCurrentFrame();
  const total = parts.reduce((a, [t]) => a + t.length, 0);
  const shown = Math.floor(clamp((f - start) / (total * 1.6)) * total);
  let used = 0;
  const out: React.ReactNode[] = [];
  parts.forEach(([t, hl], i) => {
    const n = Math.max(0, Math.min(t.length, shown - used));
    used += t.length;
    if (n <= 0) return;
    const txt = t.slice(0, n);
    out.push(hl ? <span key={i} style={{background: LIME, border: `3px solid ${INK}`, borderRadius: 12, padding: '0 12px', margin: '0 4px', boxShadow: `0 4px 0 ${INK}`}}>{txt}</span> : <span key={i}>{txt}</span>);
  });
  return <div style={{position: 'absolute', top, left: 60, width: 960, textAlign: 'center', font: `900 60px/1.45 ${FONT}`, color: INK}}>{out}</div>;
};

// ---------- scenes ----------
const Hook: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Scene len={S(B[1] - B[0])}>
      <Bg dark />
      <Pop at={2} style={{position: 'absolute', top: 250, left: 0, width: 1080, display: 'flex', justifyContent: 'center'}}>
        <div style={{font: `700 40px ${FONT}`, color: LIME, border: `3px solid ${LIME}`, borderRadius: 40, padding: '6px 28px'}}>你知道嗎</div>
      </Pop>
      <Pop at={6} style={{position: 'absolute', top: 340, left: 0, width: 1080, textAlign: 'center', font: `900 110px ${FONT}`, color: '#fff'}}>你這輩子</Pop>
      <Pop at={12} style={{position: 'absolute', top: 500, left: 0, width: 1080, textAlign: 'center', font: `900 540px/1 ${FONT}`, color: LIME, letterSpacing: -12}}>
        {fmt(Math.min(13, 1 + ease(seg(f, 12, 40)) * 12))}<span style={{fontSize: 200, letterSpacing: 0, color: '#fff', marginLeft: 10}}>年</span>
      </Pop>
      <Pop at={30} style={{position: 'absolute', top: 1130, left: 0, width: 1080, textAlign: 'center', font: `900 96px ${FONT}`, color: '#fff'}}>都在<span style={{color: LIME}}>滑手機</span></Pop>
    </Scene>
  );
};

const Bar: React.FC<{h: number; hi?: boolean; at: number; label: string}> = ({h, hi, at, label}) => {
  const f = useCurrentFrame();
  const k = ease(seg(f, at, at + 14));
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: 70}}>
      <div style={{height: 260, display: 'flex', alignItems: 'flex-end'}}>
        <div style={{width: 46, height: 260 * h * k, background: hi ? LIME : '#aab2bf', borderRadius: 12, border: hi ? `3px solid ${INK}` : 'none'}} />
      </div>
      <div style={{font: `700 26px ${FONT}`, color: '#5b6472', marginTop: 8}}>{label}</div>
    </div>
  );
};

const PhoneCard: React.FC = () => {
  const f = useCurrentFrame();
  const mins = ease(seg(f, 10, 40)) * 240;
  return (
    <>
      <Head>每天 <Hl at={4}>4 小時</Hl></Head>
      <Pop at={6} style={{position: 'absolute', top: 400, left: 150, width: 780, height: 780, background: '#fff', borderRadius: 56,
        boxShadow: '0 30px 60px rgba(14,15,18,0.18)', border: '3px solid #e3e7ec'}}>
        <div style={{padding: '46px 56px', font: `700 34px ${FONT}`, color: '#5b6472'}}>螢幕使用時間 · 舉例</div>
        <div style={{padding: '0 56px', font: `900 150px/1.1 ${FONT}`, color: INK, letterSpacing: -2}}>
          {Math.floor(mins / 60)}<span style={{fontSize: 56}}> 小時 </span>{String(Math.round(mins % 60)).padStart(2, '0')}<span style={{fontSize: 56}}> 分</span>
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', padding: '40px 56px 0'}}>
          {['一', '二', '三', '四', '五', '六', '日'].map((d, i) => (
            <Bar key={d} label={d} h={[0.95, 1, 0.9, 1.05, 0.98, 1.1, 1][i] * 0.85} hi={i === 6} at={18 + i * 3} />
          ))}
        </div>
      </Pop>
      <Caption start={14} parts={[['每天滑手機 ', false], ['4 小時', true], ['，你呢？', false]]} />
    </>
  );
};

const Calendar: React.FC = () => {
  const f = useCurrentFrame();
  const lit = Math.floor(ease(seg(f, 14, 50)) * 61);
  const cells: React.ReactNode[] = [];
  for (let i = 0; i < 365; i++) {
    const c = i % 20, r = Math.floor(i / 20);
    const on = i < lit;
    cells.push(<rect key={i} x={c * 36} y={r * 36} width={29} height={29} rx={7} fill={on ? LIME : GREY} stroke={on ? INK : 'none'} strokeWidth={2.5} />);
  }
  return (
    <>
      <Head>乘上 <Hl at={4}>365 天</Hl></Head>
      <div style={{position: 'absolute', top: 360, left: 0, width: 1080, textAlign: 'center', font: `900 240px/1 ${FONT}`, color: INK, letterSpacing: -4}}>
        {lit}<span style={{fontSize: 100}}> 天</span>
      </div>
      <svg width={720} height={684} style={{position: 'absolute', left: 180, top: 640}}>{cells}</svg>
      <Caption top={1390} start={12} parts={[['一年 ', false], ['整整 61 天', true], ['，約 2 個月', false]]} />
    </>
  );
};

const LifeBar: React.FC = () => {
  const f = useCurrentFrame();
  const k = ease(seg(f, 12, 52));
  const years = 13.3 * k;
  return (
    <>
      <Head>乘上<Hl at={4}>一輩子</Hl></Head>
      <div style={{position: 'absolute', top: 400, left: 0, width: 1080, textAlign: 'center', font: `900 330px/1 ${FONT}`, color: INK, letterSpacing: -6}}>
        {Math.round(years)}<span style={{fontSize: 130}}> 年</span>
      </div>
      <div style={{position: 'absolute', top: 860, left: 100, width: 880, height: 130, borderRadius: 30, background: '#fff', border: `4px solid ${INK}`, overflow: 'hidden', boxShadow: `0 8px 0 ${INK}`}}>
        <div style={{width: `${(13.33 / 80) * 100 * k}%`, height: '100%', background: LIME, borderRight: `4px solid ${INK}`}} />
      </div>
      <div style={{position: 'absolute', top: 1020, left: 100, width: 880, display: 'flex', justifyContent: 'space-between', font: `700 34px ${FONT}`, color: '#5b6472'}}>
        <span>0 歲</span><span>40</span><span>80 歲</span>
      </div>
      <div style={{position: 'absolute', top: 1100, left: 0, width: 1080, textAlign: 'center', font: `500 34px ${FONT}`, color: '#5b6472'}}>
        以 80 年、每天 4 小時計算（= 人生的 1/6）
      </div>
      <Caption top={1260} start={14} parts={[['照這速度，一輩子 ', false], ['≈ 13 年', true]]} />
    </>
  );
};

const Compare: React.FC = () => {
  const f = useCurrentFrame();
  const a = ease(seg(f, 10, 36)), b = ease(seg(f, 30, 60));
  const W = 840;
  return (
    <>
      <Head><Hl at={4}>13 年</Hl>有多久？</Head>
      <div style={{position: 'absolute', top: 460, left: 120, width: W}}>
        <div style={{font: `700 42px ${FONT}`, color: INK, marginBottom: 14}}>小學入學 → 高中畢業</div>
        <div style={{width: W * (12 / 13.5) * a, height: 120, background: '#aab2bf', borderRadius: 26, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 28, font: `900 64px ${FONT}`, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden'}}>{a > 0.9 ? '12 年' : ''}</div>
      </div>
      <div style={{position: 'absolute', top: 760, left: 120, width: W}}>
        <div style={{font: `700 42px ${FONT}`, color: INK, marginBottom: 14}}>你的手機</div>
        <div style={{width: W * (13.3 / 13.5) * b, height: 120, background: LIME, border: `4px solid ${INK}`, borderRadius: 26, boxShadow: `0 8px 0 ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 28, font: `900 64px ${FONT}`, color: INK, whiteSpace: 'nowrap', overflow: 'hidden'}}>{b > 0.9 ? '13 年' : ''}</div>
      </div>
      <Caption top={1130} start={30} parts={[['比你從小學念到高中畢業，', false], ['還久', true]]} />
    </>
  );
};

const Tip: React.FC = () => {
  const f = useCurrentFrame();
  const steps = ['打開「螢幕使用時間」', '看昨天的數字', '明天少 1 小時'];
  return (
    <>
      <Head>不是叫你戒<br /><Hl at={6}>是先看見</Hl></Head>
      {steps.map((s, i) => {
        const k = ease(seg(f, 12 + i * 12, 24 + i * 12));
        return (
          <div key={s} style={{position: 'absolute', top: 560 + i * 170, left: 110, width: 860, height: 140, background: '#fff', borderRadius: 40,
            border: `3px solid ${INK}`, boxShadow: `0 8px 0 ${INK}`, display: 'flex', alignItems: 'center', padding: '0 40px',
            transform: `translateX(${(1 - k) * 700}px)`, opacity: k}}>
            <div style={{width: 76, height: 76, borderRadius: 38, background: LIME, border: `3px solid ${INK}`, font: `900 46px/70px ${FONT}`, textAlign: 'center', marginRight: 30}}>{i + 1}</div>
            <div style={{font: `900 52px ${FONT}`, color: INK}}>{s}</div>
          </div>
        );
      })}
      <Caption top={1130} start={44} parts={[['每天少 1 小時 ＝ 人生多出 ', false], ['3 年', true]]} />
    </>
  );
};

const Cta: React.FC = () => {
  const f = useCurrentFrame();
  const typed = '5 小時'.slice(0, Math.floor(clamp((f - 36) / 14) * 4));
  return (
    <>
      <Head top={250}>留言</Head>
      <Pop at={6} style={{position: 'absolute', top: 400, left: 0, width: 1080, display: 'flex', justifyContent: 'center'}}>
        <div style={{background: LIME, border: `6px solid ${INK}`, borderRadius: 90, boxShadow: `0 14px 0 ${INK}`, padding: '10px 70px', font: `900 150px/1.2 ${FONT}`, color: INK}}>「幾小時」</div>
      </Pop>
      <div style={{position: 'absolute', top: 760, left: 0, width: 1080, textAlign: 'center', font: `900 60px ${FONT}`, color: INK}}>你每天滑幾小時？</div>
      <div style={{position: 'absolute', top: 880, left: 0, width: 1080, textAlign: 'center', font: `500 40px ${FONT}`, color: '#5b6472'}}>看看你比大家多，還是少</div>
      <Pop at={26} style={{position: 'absolute', top: 1010, left: 110, width: 860, height: 110, background: '#fff', borderRadius: 55, border: `3px solid ${INK}`, boxShadow: '0 10px 30px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', padding: '0 36px', font: `500 44px ${FONT}`, color: typed ? INK : '#9aa3b2'}}>
        {typed || '新增留言⋯'}
        <div style={{marginLeft: 'auto', width: 70, height: 70, borderRadius: 35, background: INK, color: LIME, font: `900 40px/70px ${FONT}`, textAlign: 'center'}}>➤</div>
      </Pop>
      <Caption top={1230} start={52} parts={[['存起來，', false], ['滑手機前看一眼', true]]} />
    </>
  );
};

export const PhoneLife: React.FC = () => {
  const dark = [true, false, false, false, false, false, false];
  const comps = [Hook, PhoneCard, Calendar, LifeBar, Compare, Tip, Cta];
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      {comps.map((C, i) => {
        const from = S(B[i]);
        const len = S(B[i + 1]) - from;
        return (
          <Sequence key={i} from={from} durationInFrames={len}>
            {i === 0 ? <C /> : (
              <Scene len={len}>
                <Bg dark={dark[i]} />
                <C />
              </Scene>
            )}
          </Sequence>
        );
      })}
      <Progress />
    </AbsoluteFill>
  );
};
