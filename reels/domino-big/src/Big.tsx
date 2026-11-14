import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, Easing, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import '@fontsource/noto-sans-tc/700.css';
import '@fontsource/noto-sans-tc/900.css';
import layout from './dominoes.json';
import camData from './cam.json';

export const FPS = 30;
export const DURATION = camData.length;
const FONT = '"Noto Sans TC", sans-serif';
const W = 0.5, H = 1.0, TK = 0.18, FALL = 0.36;
const D = layout.d as number[][];
const N = D.length;
const CAM = camData as number[][];
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const seg = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
const eio = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const STARTS = D.map((d) => d[3]).sort((a, b) => a - b);
const countAt = (t: number) => { let lo = 0, hi = STARTS.length; while (lo < hi) { const m = (lo + hi) >> 1; if (STARTS[m] <= t) lo = m + 1; else hi = m; } return lo; };
const fmt = (n: number) => n.toLocaleString('en-US');

// ---------------------------------------------------------------- 3D
const Rig: React.FC<{frame: number}> = ({frame}) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    const c = CAM[Math.min(frame, CAM.length - 1)];
    camera.position.set(c[0], c[1], c[2]);
    const dx = c[0] - c[3], dy = c[1] - c[4], dz = c[2] - c[5];
    const pitch = Math.atan2(dy, Math.hypot(dx, dz));
    const w = clamp((pitch - 1.0) / 0.5);              // blend up-vector near top-down
    camera.up.set(0, 1 - w, -w).normalize();
    camera.fov = c[6];
    camera.updateProjectionMatrix();
    camera.lookAt(c[3], c[4], c[5]);
  }, [frame, camera]);
  return null;
};

const Floor: React.FC = () => {
  const tex = useMemo(() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 256;
    const g = cv.getContext('2d')!;
    g.fillStyle = '#1b2130'; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = '#2a3347'; g.lineWidth = 3; g.strokeRect(0, 0, 256, 256);
    g.strokeStyle = '#222a3b'; g.lineWidth = 1; g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 256); g.moveTo(0, 128); g.lineTo(256, 128); g.stroke();
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(100, 100); t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace; return t;
  }, []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, -20]}>
      <planeGeometry args={[400, 400]} />
      <meshStandardMaterial map={tex} roughness={0.95} />
    </mesh>
  );
};

const Dominoes: React.FC<{t: number}> = ({t}) => {
  const body = useRef<THREE.InstancedMesh>(null);
  const shadow = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => {
    const g = new THREE.BoxGeometry(W, H, TK);
    const shade = [0.72, 0.72, 0.92, 0.45, 1.0, 1.0];       // +x -x +y -y +z -z
    const col = new Float32Array(24 * 3);
    for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) col.fill(shade[f], (f * 4 + v) * 3, (f * 4 + v) * 3 + 3);
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }, []);
  useLayoutEffect(() => {
    const m = body.current!, c = new THREE.Color();
    for (let i = 0; i < N; i++) m.setColorAt(i, c.setRGB(D[i][5] / 255, D[i][6] / 255, D[i][7] / 255, THREE.SRGBColorSpace));
    m.instanceColor!.needsUpdate = true;
  }, []);
  useLayoutEffect(() => {
    const a = body.current!.instanceMatrix.array as Float32Array, b = shadow.current!.instanceMatrix.array as Float32Array;
    for (let i = 0; i < N; i++) {
      const d = D[i], x = d[0], z = d[1], yaw = d[2], start = d[3], tf = d[4] * Math.PI / 180;
      const u = clamp((t - start) / FALL);
      const th = tf * eio(u), c = Math.cos(th), s = Math.sin(th);
      const sy = Math.sin(yaw), cy = Math.cos(yaw);
      // translation of the box centre: pivot is the front-bottom edge
      const yl = (H / 2) * c + (TK / 2) * s, zl = (H / 2) * s - (TK / 2) * c + TK / 2;
      const o = i * 16;
      a[o] = cy; a[o + 1] = 0; a[o + 2] = -sy; a[o + 3] = 0;
      a[o + 4] = s * sy; a[o + 5] = c; a[o + 6] = s * cy; a[o + 7] = 0;
      a[o + 8] = c * sy; a[o + 9] = -s; a[o + 10] = c * cy; a[o + 11] = 0;
      a[o + 12] = x + zl * sy; a[o + 13] = yl; a[o + 14] = z + zl * cy; a[o + 15] = 1;
      // fake contact shadow
      const sinT = Math.sin(th), sz = 0.30 + 0.9 * sinT, off = 0.10 + 0.5 * sinT, sx = 0.62;
      b[o] = cy * sx; b[o + 1] = 0; b[o + 2] = -sy * sx; b[o + 3] = 0;
      b[o + 4] = 0; b[o + 5] = 1; b[o + 6] = 0; b[o + 7] = 0;
      b[o + 8] = sy * sz; b[o + 9] = 0; b[o + 10] = cy * sz; b[o + 11] = 0;
      b[o + 12] = x + sy * off; b[o + 13] = 0.004; b[o + 14] = z + cy * off; b[o + 15] = 1;
    }
    body.current!.instanceMatrix.needsUpdate = true; shadow.current!.instanceMatrix.needsUpdate = true;
  }, [t]);
  return (
    <>
      <instancedMesh ref={shadow} args={[undefined, undefined, N]} frustumCulled={false} renderOrder={1}>
        <planeGeometry args={[1, 1]} onUpdate={(g) => g.rotateX(-Math.PI / 2)} />
        <meshBasicMaterial color="#000000" transparent opacity={0.38} depthWrite={false} />
      </instancedMesh>
      <instancedMesh ref={body} args={[geo, undefined, N]} frustumCulled={false}>
        <meshLambertMaterial vertexColors />
      </instancedMesh>
    </>
  );
};

const Ball: React.FC<{t: number}> = ({t}) => {
  const d0 = D[0], dirx = Math.sin(d0[2]), dirz = Math.cos(d0[2]);
  const back = 0.34;                                        // distance behind the first domino at contact
  const dist = t < layout.T0 ? back + 7 * (layout.T0 - t) : back;
  const x = d0[0] - dirx * dist, z = d0[1] - dirz * dist;
  return (
    <mesh position={[x, 0.24, z]} rotation={[0, 0, -dist * 3]}>
      <sphereGeometry args={[0.24, 24, 16]} />
      <meshStandardMaterial color="#d9dde6" metalness={0.85} roughness={0.2} />
    </mesh>
  );
};

// ---------------------------------------------------------------- HUD
const T_END = layout.tLast + 0.9;
export const Big: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const t = frame / FPS;
  const count = countAt(t);
  const intro = 1 - seg(t, 2.7, 3.3);
  const stage = t < layout.tSnakeEnd ? '蛇形長路' : t < layout.leafMax + 0.4 ? '一路分成 56 條' : '4,480 張同時倒下';
  const fin = ease(seg(t, T_END, T_END + 0.8));
  return (
    <AbsoluteFill style={{background: '#10131c', fontFamily: FONT}}>
      <ThreeCanvas width={width} height={height} camera={{fov: 50, position: [0, 3, 10], near: 0.1, far: 400}} gl={{antialias: false}}>
        <color attach="background" args={['#10131c']} />
        <fog attach="fog" args={['#10131c', 55, 190]} />
        <Rig frame={frame} />
        <hemisphereLight args={['#bcd0ff', '#2a2230', 0.75]} />
        <directionalLight position={[-14, 28, 18]} intensity={1.7} />
        <directionalLight position={[16, 10, -12]} intensity={0.5} color="#ffd9b0" />
        <Floor />
        <Dominoes t={t} />
        <Ball t={t} />
      </ThreeCanvas>
      {/* intro title */}
      {intro > 0 && (
        <div style={{position: 'absolute', top: 330, left: 0, width: 1080, textAlign: 'center', opacity: intro, transform: `translateY(${(1 - intro) * -40}px)`}}>
          <div style={{font: `900 74px/1.2 ${FONT}`, color: '#fff', textShadow: '0 4px 18px rgba(0,0,0,0.7)'}}>我用程式寫了</div>
          <div style={{font: `900 230px/1.05 ${FONT}`, color: '#ffd24a', textShadow: '0 8px 30px rgba(0,0,0,0.75)', letterSpacing: -4}}>{fmt(N)}</div>
          <div style={{font: `900 74px/1.2 ${FONT}`, color: '#fff', textShadow: '0 4px 18px rgba(0,0,0,0.7)'}}>張骨牌的連鎖</div>
        </div>
      )}
      {/* counter + stage */}
      <div style={{position: 'absolute', top: 150, left: 0, width: 1080, textAlign: 'center', opacity: seg(t, 3.0, 3.6) * (1 - fin)}}>
        <div style={{font: `700 40px ${FONT}`, color: '#cdd6ee', letterSpacing: 6}}>已倒下</div>
        <div style={{font: `900 128px/1 ${FONT}`, color: '#fff', textShadow: '0 6px 22px rgba(0,0,0,0.8)', fontVariantNumeric: 'tabular-nums'}}>{fmt(count)}</div>
        <div style={{display: 'inline-block', marginTop: 10, background: 'rgba(255,210,74,0.95)', color: '#1b1b1b', borderRadius: 30, padding: '4px 26px', font: `900 38px ${FONT}`}}>{stage}</div>
      </div>
      {t > T_END && (
        <div style={{position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none'}}>
          {[0, 1].map((k) => {
            const u = seg(t, T_END + 0.4 + k * 3.2, T_END + 2.4 + k * 3.2);
            return u > 0 && u < 1 ? <div key={k} style={{position: 'absolute', top: 380, left: -400 + u * 1900, width: 140, height: 1500, background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.35), rgba(255,255,255,0))', transform: 'skewX(-18deg)'}} /> : null;
          })}
        </div>
      )}
      {/* finale */}
      {fin > 0 && (
        <div style={{position: 'absolute', top: 120, left: 0, width: 1080, textAlign: 'center', opacity: fin, transform: `translateY(${(1 - fin) * -40}px)`}}>
          <div style={{font: `900 88px ${FONT}`, color: '#fff', textShadow: '0 5px 20px rgba(0,0,0,0.85)'}}>全部倒下，拼成一顆愛心</div>
          <div style={{display: 'inline-block', marginTop: 18, background: '#ffd24a', color: '#1b1b1b', borderRadius: 40, padding: '6px 40px', font: `900 52px ${FONT}`}}>留言：下一幅想看什麼圖案？</div>
        </div>
      )}
    </AbsoluteFill>
  );
};
