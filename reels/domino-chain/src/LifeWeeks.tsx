import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import '@fontsource/noto-sans-tc/500.css';
import '@fontsource/noto-sans-tc/900.css';

export const FPS = 30;
export const DURATION = 20 * FPS; // 20s

const COLS = 52;
const ROWS = 80;
const N = COLS * ROWS; // 4160
const PITCH = 13;
const DOT = 9;
const GX = (1080 - COLS * PITCH) / 2;
const GY = 290;

const BG = '#0a0c11';
const BASE = '#2f3748';
const SLEEP = '#4f7dff';
const PHONE = '#ff4d6d';
const FREE = '#ffd166';
const INK = '#f4f6fb';

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

const SLEEP_COUNT = Array.from({length: N}, (_, i) => i).filter((i) => i % 3 === 0).length; // 1387
const PHONE_COUNT = Array.from({length: N}, (_, i) => i).filter((i) => i % 6 === 1).length; // 694
const FREE_COUNT = N - SLEEP_COUNT - PHONE_COUNT; // 2079

// phase times (seconds)
const T = {
  popEnd: 1.6,
  sleepA: 3.6, sleepB: 6.4,
  phoneA: 7.6, phoneB: 10.4,
  freeA: 11.6,
  ctaA: 15.2,
  outA: 19.2, outB: 19.9,
};

const mix = (c1: string, c2: string, k: number) => {
  const p = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const a = p(c1), b = p(c2);
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`;
};

const Cells: React.FC<{t: number}> = ({t}) => {
  const out = seg(t, T.outA, T.outB);
  const rects: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    const row = Math.floor(i / COLS);
    const col = i % COLS;
    // intro pop
    const popStart = row * 0.0115 + col * 0.0006;
    const pop = ease(seg(t, popStart, popStart + 0.28));
    // outro: reverse by row (bottom first)
    const outStart = T.outA + ((ROWS - row) / ROWS) * 0.45;
    const outK = ease(seg(t, outStart, outStart + 0.25));
    const scale = pop * (1 - outK);
    if (scale <= 0.01) continue;

    let color = BASE;
    const isSleep = i % 3 === 0;
    const isPhone = i % 6 === 1;
    // sweeps (row-major, by index)
    const sleepK = ease(seg(t, T.sleepA + (i / N) * (T.sleepB - T.sleepA), T.sleepA + (i / N) * (T.sleepB - T.sleepA) + 0.35));
    const phoneK = ease(seg(t, T.phoneA + (i / N) * (T.phoneB - T.phoneA), T.phoneA + (i / N) * (T.phoneB - T.phoneA) + 0.35));
    if (isSleep) color = mix(BASE, SLEEP, sleepK);
    else if (isPhone) color = mix(BASE, PHONE, phoneK);
    // free phase
    const freeK = ease(seg(t, T.freeA, T.freeA + 0.9));
    if (freeK > 0) {
      if (!isSleep && !isPhone) {
        const pulse = 0.82 + 0.18 * Math.sin((t - T.freeA) * 5 + col * 0.15);
        color = mix(BASE, FREE, freeK * pulse);
      } else {
        color = mix(color, BASE, freeK * 0.7);
      }
    }
    // scan marker (CTA)
    const scanRow = interpolate(t, [T.ctaA, T.outA - 0.4], [0, ROWS], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    const near = t >= T.ctaA && t < T.outA && Math.abs(row - scanRow) < 0.9;
    if (near) color = INK;

    const s = DOT * scale;
    rects.push(
      <rect key={i} x={GX + col * PITCH + (DOT - s) / 2} y={GY + row * PITCH + (DOT - s) / 2}
        width={s} height={s} rx={2.2} fill={color} />,
    );
  }
  void out;
  return <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>{rects}</svg>;
};

const AgeTicks: React.FC<{t: number}> = ({t}) => {
  const k = ease(seg(t, 1.2, 2.0)) * (1 - seg(t, T.outA, T.outA + 0.3));
  const scanRow = interpolate(t, [T.ctaA, T.outA - 0.4], [0, ROWS], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const scanning = t >= T.ctaA && t < T.outA;
  return (
    <>
      {[0, 10, 20, 30, 40, 50, 60, 70, 80].map((a) => (
        <div key={a} style={{position: 'absolute', left: GX - 74, top: GY + a * PITCH - 13, width: 62, textAlign: 'right',
          font: '500 24px "Noto Sans TC"', color: '#6b7488', opacity: k}}>{a}歲</div>
      ))}
      {scanning && (
        <div style={{position: 'absolute', left: GX + COLS * PITCH + 14, top: GY + scanRow * PITCH - 20,
          font: '900 34px "Noto Sans TC"', color: INK}}>{Math.min(80, Math.round(scanRow))}歲</div>
      )}
    </>
  );
};

const Fade: React.FC<{t: number; a: number; b: number; children: React.ReactNode; style?: React.CSSProperties}> = ({t, a, b, children, style}) => {
  const inK = ease(seg(t, a, a + 0.35));
  const outK = seg(t, b - 0.3, b);
  const o = inK * (1 - outK);
  if (o <= 0) return null;
  return <div style={{position: 'absolute', left: 0, width: 1080, textAlign: 'center', opacity: o,
    transform: `translateY(${(1 - inK) * 24}px)`, ...style}}>{children}</div>;
};

const top: React.CSSProperties = {top: 125, font: '900 84px/1.15 "Noto Sans TC"', color: INK, letterSpacing: 2};
const bigNum = (c: string): React.CSSProperties => ({top: 1365, font: '900 170px/1 "Noto Sans TC"', color: c, letterSpacing: 2});
const sub: React.CSSProperties = {top: 1550, font: '500 38px/1.3 "Noto Sans TC"', color: '#aab2c5'};

export const LifeWeeks: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;

  const count0 = N * ease(seg(t, 0.1, T.popEnd + 0.4));
  const sleepN = SLEEP_COUNT * seg(t, T.sleepA, T.sleepB);
  const phoneN = PHONE_COUNT * seg(t, T.phoneA, T.phoneB);
  const freeN = FREE_COUNT * ease(seg(t, T.freeA, T.freeA + 1.2));

  // gentle hook punch on the title
  const punch = 1 + 0.06 * Math.max(0, 1 - seg(t, 0, 0.5));

  return (
    <AbsoluteFill style={{background: BG, fontFamily: '"Noto Sans TC", sans-serif'}}>
      <Cells t={t} />
      <AgeTicks t={t} />

      {/* A: hook */}
      <Fade t={t} a={0.05} b={T.sleepA} style={{...top, transform: `scale(${punch})`}}>
        你的一生，只有這麼多格
      </Fade>
      <Fade t={t} a={0.1} b={T.sleepA} style={bigNum(INK)}>{fmt(count0)}</Fade>
      <Fade t={t} a={0.6} b={T.sleepA} style={sub}>一格 = 一週　（以 80 歲計算）</Fade>

      {/* B: sleep */}
      <Fade t={t} a={T.sleepA} b={T.phoneA} style={top}>先扣掉<span style={{color: SLEEP}}>睡覺</span></Fade>
      <Fade t={t} a={T.sleepA} b={T.phoneA} style={bigNum(SLEEP)}>{fmt(sleepN)}</Fade>
      <Fade t={t} a={T.sleepA} b={T.phoneA} style={sub}>每天睡 8 小時 = 人生的 1/3</Fade>

      {/* C: phone */}
      <Fade t={t} a={T.phoneA} b={T.freeA} style={top}>再扣掉<span style={{color: PHONE}}>滑手機</span></Fade>
      <Fade t={t} a={T.phoneA} b={T.freeA} style={bigNum(PHONE)}>{fmt(phoneN)}</Fade>
      <Fade t={t} a={T.phoneA} b={T.freeA} style={sub}>每天 4 小時 ≈ 整整 13 年</Fade>

      {/* D: free */}
      <Fade t={t} a={T.freeA} b={T.ctaA} style={top}>真正屬於你的，只剩<span style={{color: FREE}}>一半</span></Fade>
      <Fade t={t} a={T.freeA} b={T.ctaA} style={bigNum(FREE)}>{fmt(freeN)}</Fade>
      <Fade t={t} a={T.freeA + 0.2} b={T.ctaA} style={sub}>週　· 還沒被誰安排走的</Fade>

      {/* E: CTA */}
      <Fade t={t} a={T.ctaA} b={T.outA} style={top}>你現在，在第幾格？</Fade>
      <Fade t={t} a={T.ctaA + 0.1} b={T.outA} style={{top: 1400, font: '900 100px/1.1 "Noto Sans TC"', color: INK}}>留言你的歲數</Fade>
      <Fade t={t} a={T.ctaA + 0.5} b={T.outA} style={sub}>存起來　下次滑手機前，看它一眼</Fade>
    </AbsoluteFill>
  );
};
