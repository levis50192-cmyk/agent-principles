// Camera path: per-frame [px,py,pz, tx,ty,tz, fov]. Shots follow the wave front with smoothing.
import fs from 'fs';
const L = JSON.parse(fs.readFileSync('dominoes.json'));
const FPS = 30, DUR = 29;
const d = L.d, nSnake = L.nSnake;
const T0 = L.T0, tSnakeEnd = L.tSnakeEnd;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const sm = (u) => u * u * (3 - 2 * u);
const lerp = (a, b, u) => a + (b - a) * u;
const v3 = (a, b, u) => a.map((x, i) => lerp(x, b[i], u));
// front of the wave inside the snake: the last snake domino whose start <= t
const frontIdx = (t) => { let i = 0; while (i < nSnake - 1 && d[i + 1][3] <= t) i++; return i; };
const pos = (i) => [d[i][0], 0, d[i][1]];
const dirAt = (i) => { const j = Math.min(nSnake - 1, i + 6), k = Math.max(0, i - 2); const dx = d[j][0] - d[k][0], dz = d[j][1] - d[k][1], l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l]; };

// raw (unsmoothed) shot definitions per time
const MOS_CX = 0, MOS_CZ = -30 - 40 * 0.6 + 0.3;      // mosaic centre in z (rows 0..79 => z -30 ... -77.4)
function raw(t) {
  if (t < T0 - 0.3) {   // establishing: low, close, slightly from the side, slow dolly in
    const u = clamp(t / (T0 - 0.3));
    const p = pos(0), dd = dirAt(0);
    const side = [-dd[1], dd[0]];
    return {cam: [p[0] - dd[0] * (6.5 - 1.5 * u) + side[0] * 2.6, 1.5 + 0.2 * u, p[2] - dd[1] * (6.5 - 1.5 * u) + side[1] * 2.6], tgt: [p[0] + dd[0] * 3, 0.35, p[2] + dd[1] * 3], fov: 50};
  }
  if (t < tSnakeEnd + 0.4) {     // chase shots on the snake: alternate behind / side / high
    const i = frontIdx(t), p = pos(i), dd = dirAt(i), side = [-dd[1], dd[0]];
    const u = (t - T0) / (tSnakeEnd - T0);
    let off, h, ahead = 2.8;
    if (u < 0.30) { off = [-5.2, 2.3, 1.6]; h = 2.3; }                 // behind, low, slightly right
    else if (u < 0.62) { off = [-2.5, 2.2, -5.0]; h = 2.2; ahead = 1.0; }  // side view
    else { off = [-9, 7.5, 0.5]; h = 7.5; ahead = 4; }                  // high pull-back
    const cam = [p[0] + dd[0] * off[0] + side[0] * off[2], off[1], p[2] + dd[1] * off[0] + side[1] * off[2]];
    return {cam, tgt: [p[0] + dd[0] * ahead, 0.3, p[2] + dd[1] * ahead], fov: 50};
  }
  if (t < L.leafMin + 0.6) {     // tree: rise to an oblique overview centred on the tree
    const u = sm(clamp((t - (tSnakeEnd + 0.4)) / 2.6));
    const a = {cam: [0, 9, 20], tgt: [0, 0, 6]}, b = {cam: [0, 40, -2], tgt: [0, 0, -14]};
    return {cam: v3(a.cam, b.cam, u), tgt: v3(a.tgt, b.tgt, u), fov: 50};
  }
  // mosaic: glide up to a top-down view of the whole picture
  const u = sm(clamp((t - (L.leafMin + 0.6)) / 3.2));
  const a = {cam: [0, 40, -2], tgt: [0, 0, -14]};
  const b = {cam: [0, 81, MOS_CZ - 5.4 + 0.01], tgt: [0, 0, MOS_CZ - 5.4]};
  const z = sm(clamp((t - 24) / 5));   // tiny slow push-in during the outro
  const c = v3(a.cam, b.cam, u), g = v3(a.tgt, b.tgt, u);
  return {cam: [c[0], c[1] - 4 * z, c[2]], tgt: g, fov: 45};
}
// exponential smoothing for chase shots only
const frames = [];
let sc = null, st = null;
const tau = 0.35;
for (let f = 0; f < DUR * FPS; f++) {
  const t = f / FPS, r = raw(t);
  if (sc === null) { sc = r.cam.slice(); st = r.tgt.slice(); }
  const chase = t >= T0 - 0.3 && t < tSnakeEnd + 0.4;
  const k = chase ? 1 - Math.exp(-(1 / FPS) / tau) : (t < T0 - 0.3 ? 1 : 1);
  sc = sc.map((v, i) => lerp(v, r.cam[i], chase ? k : 1)); st = st.map((v, i) => lerp(v, r.tgt[i], chase ? k : 1));
  frames.push([...sc.map((v) => +v.toFixed(3)), ...st.map((v) => +v.toFixed(3)), r.fov]);
}
fs.writeFileSync('cam.json', JSON.stringify(frames));
console.log('cam frames', frames.length);
