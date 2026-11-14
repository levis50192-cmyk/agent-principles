// Kinematic Rube Goldberg chain: deterministic, hand-authored timeline with simple physics integrators.
import fs from 'fs';
const FPS = 30, DUR = 30;
let G = +(process.env.G || 1250);
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const eio = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const eout = (u) => 1 - Math.pow(1 - u, 3);
const events = [], rolls = [];
const ev = (t, kind, x, y, v = 1) => events.push({t: +t.toFixed(3), kind, x: Math.round(x), y: Math.round(y), v: +v.toFixed(2)});

// ---------------- static scenery (centre-line segments; flat planks: centre = top surface + th/2) ----------------
const SEG = {
  shelf: {x1: 40, y1: 412, x2: 830, y2: 412, th: 24},
  ruler: {x1: 1010, y1: 480, x2: 560, y2: 740, th: 14},
  desk: {x1: 70, y1: 902, x2: 700, y2: 902, th: 24},
  board: {x1: 20, y1: 1000, x2: 560, y2: 1050, th: 16},
  table: {x1: 30, y1: 1412, x2: 1060, y2: 1412, th: 24},
};
const BOX = {x1: 540, y1: 1300, x2: 880, y2: 1400};            // shoe box under the seesaw
const PIV = {x: 710, y: 1282, r: 18};                           // pencil used as fulcrum
const PLANK = {cx: 710, cy: 1258, len: 300, th: 12, a0: -13 * Math.PI / 180, a1: 13 * Math.PI / 180};
const plankSeg = (a) => ({x1: PLANK.cx - 150 * Math.cos(a), y1: PLANK.cy - 150 * Math.sin(a), x2: PLANK.cx + 150 * Math.cos(a), y2: PLANK.cy + 150 * Math.sin(a), th: PLANK.th});

// ---------------- helpers ----------------
function dominoPose(x, base, w, h, start, D, dir, thetaF, t) {
  const th = thetaF * eio(clamp((t - start) / D)) * dir;
  const px = x + dir * w / 2, py = base, rx = -dir * w / 2, ry = -h / 2, c = Math.cos(th), s = Math.sin(th);
  return [px + rx * c - ry * s, py + rx * s + ry * c, th];
}
function simBall(p0, v0, r, segs, tStart, tEnd, opts = {}) {
  const out = []; let x = p0.x, y = p0.y, vx = v0.x, vy = v0.y, ang = opts.ang || 0, mode = 'fly', seg = null, s = 0, vs = 0, rollStart = 0;
  const dt = 1 / 480, info = {landings: [], leaves: []};
  for (let t = tStart; t < tEnd; t += dt) {
    if (mode === 'fly') {
      vy += G * dt; x += vx * dt; y += vy * dt; ang += (vx / r) * dt;
      for (const sg of segs) {
        const dx = sg.x2 - sg.x1, dy = sg.y2 - sg.y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
        let nx = uy, ny = -ux; if (ny > 0) { nx = -nx; ny = -ny; }
        const along = (x - sg.x1) * ux + (y - sg.y1) * uy, dist = (x - sg.x1) * nx + (y - sg.y1) * ny - sg.th / 2;
        if (along > -r * 0.2 && along < L + r * 0.2 && dist < r && dist > -(r + 8) && vx * nx + vy * ny < 0) {
          info.landings.push({t, x, y, v: Math.abs(vx * nx + vy * ny), seg: sg});
          mode = 'roll'; seg = sg; s = along; vs = vx * ux + vy * uy; if (opts.landVs !== undefined && info.landings.length === 1) vs = opts.landVs; rollStart = t; break;
        }
      }
    } else if (mode === 'roll') {
      const dx = seg.x2 - seg.x1, dy = seg.y2 - seg.y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
      let nx = uy, ny = -ux; if (ny > 0) { nx = -nx; ny = -ny; }
      vs += ((5 / 7) * G * uy - (opts.drag || 0) * Math.sign(vs)) * dt; s += vs * dt;
      x = seg.x1 + ux * s + nx * (seg.th / 2 + r); y = seg.y1 + uy * s + ny * (seg.th / 2 + r); ang += (vs / r) * dt;
      if (opts.stopAt && opts.stopAt(x, y, t)) { out.push({t, x, y, a: ang}); rolls.push({t0: rollStart, t1: t, k: opts.rollKind || 'roll', v: Math.abs(vs)}); info.stopT = t; break; }
      if (s < -r * 0.3 || s > L + r * 0.3) { rolls.push({t0: rollStart, t1: t, k: opts.rollKind || 'roll', v: Math.abs(vs)}); mode = 'fly'; vx = ux * vs; vy = uy * vs; info.leaves.push({t, x, y, vx, vy}); }
    }
    out.push({t, x, y, a: ang});
  }
  out.info = info; out.final = out[out.length - 1];
  return out;
}
const sample = (track, t) => {
  if (t <= track[0].t) return track[0];
  if (t >= track[track.length - 1].t) return track[track.length - 1];
  return track[Math.min(track.length - 1, Math.floor((t - track[0].t) * 480))];
};
const hold = (x, y, t0, t1, a = 0) => { const o = []; for (let t = t0; t < t1; t += 1 / 480) o.push({t, x, y, a}); return o; };

// ---------------- STAGE 1: dominoes -> marble ----------------
const GAP1 = +(process.env.GAP1 || 0.30), D1 = 0.62, T0 = 1.55;
const dom1 = Array.from({length: 14}, (_, i) => ({x: 110 + i * 46, s: T0 + i * GAP1}));
const tHit1 = dom1[13].s + 0.30;
dom1.forEach((d, i) => { if (i > 0) ev(d.s, 'dom', d.x, 360, 1); });
ev(tHit1, 'tick', 742, 380, 1.1);
const m1 = hold(742, 385, 0, tHit1);
{ let x = 742, t = tHit1; while (x < 836) { x = 742 + 170 * (t - tHit1); m1.push({t, x, y: 385, a: (x - 742) / 15}); t += 1 / 480; } }
const mFly = simBall({x: m1[m1.length - 1].x, y: 385}, {x: 170, y: 0}, 15, [SEG.ruler, SEG.desk], m1[m1.length - 1].t, 20, {stopAt: (x, y) => y > 800 && x < 351 + 16, drag: 6, ang: m1[m1.length - 1].a, rollKind: 'marble'});
const marble = [...m1, ...mFly];
const tBook1 = mFly.final.t;
mFly.info.landings.forEach((l) => ev(l.t, 'thud', l.x, l.y, clamp(l.v / 500, 0.3, 1)));

// ---------------- STAGE 3: books (fall LEFT) -> tennis ball ----------------
const GAPB = +(process.env.GAPB || 0.28), DB = 0.62;
const books = Array.from({length: 4}, (_, i) => ({x: 338 - i * 56, s: tBook1 + i * GAPB}));
books.forEach((b, i) => ev(b.s, 'book', b.x, 840, 1));
const tPush2 = books[3].s + 0.32;
ev(tPush2, 'tick', 130, 868, 1.0);
const ball2 = hold(112, 868, 0, tPush2);
{ let x = 112, t = tPush2; while (x > 66) { x -= 45 / 480; ball2.push({t, x, y: 868, a: (x - 112) / 22}); t += 1 / 480; }
  const last = ball2[ball2.length - 1];
  // board then seesaw (initial tilt)
  var toSee = simBall({x: last.x, y: 868}, {x: -45, y: 0}, 22, [SEG.board, plankSeg(PLANK.a0)], last.t, 40, {ang: last.a, rollKind: 'ball', landVs: 25});
  var tL = toSee.info.landings.find((l) => l.seg.x1 !== SEG.board.x1)?.t;
  if (tL === undefined) { console.log('FAIL: ball2 did not land on seesaw', toSee.info.landings.map((l) => [l.t.toFixed(2), Math.round(l.x), Math.round(l.y)])); process.exit(1); }
}
console.log('LAND', toSee.info.landings.map(l=>[l.t.toFixed(2),Math.round(l.x),Math.round(l.y), l.seg.x1]), 'LEAVE', toSee.info.leaves.map(l=>[l.t.toFixed(2),Math.round(l.x),Math.round(l.y),Math.round(l.vx),Math.round(l.vy)]));
const landing = toSee.info.landings.find((l) => l.seg.x1 !== SEG.board.x1);
toSee.info.landings.forEach((l) => ev(l.t, 'thud', l.x, l.y, clamp(l.v / 500, 0.3, 1)));
// ball rides the seesaw (now tilted the other way) and rolls off to the table wall
const rest2 = toSee.filter((p) => p.t <= tL);
const after = simBall({x: landing.x, y: landing.y}, {x: 60, y: 0}, 22, [plankSeg(PLANK.a1), SEG.table], tL, 60, {stopAt: (x) => x > 1030, ang: rest2.at(-1).a, rollKind: 'ball'});
const ball2All = [...ball2, ...rest2, ...after];
console.log('ball2 push', tPush2.toFixed(2), 'lands on seesaw', tL.toFixed(2), 'landing x', Math.round(landing.x));

// ---------------- STAGE 4: seesaw flick -> eraser -> final dominoes -> lamp ----------------
const ROT = 0.26, tLaunch = tL + ROT;
const plankAngle = (t) => PLANK.a0 + (PLANK.a1 - PLANK.a0) * eout(clamp((t - tL) / ROT));
ev(tL, 'seesaw', 710, 1258, 1);
const eraserLocal = {dx: -110, dy: -(PLANK.th / 2 + 10)};
const eraserOnPlank = (t) => { const a = plankAngle(t), c = Math.cos(a), s = Math.sin(a); return [PLANK.cx + eraserLocal.dx * c - eraserLocal.dy * s, PLANK.cy + eraserLocal.dx * s + eraserLocal.dy * c, a]; };
const [xs, ys, aL] = eraserOnPlank(tLaunch);
const TF = 0.55, tx = 500, ty = 1400 - 84 - 10;
const evx = (tx - xs) / TF, evy = (ty - ys - 0.5 * G * TF * TF) / TF;
const spin = (-2 * Math.PI - aL) / TF;
const tEraserLand = tLaunch + TF;
ev(tLaunch, 'launch', xs, ys, 1); ev(tEraserLand, 'tick', tx, ty, 1.2);
const GAP2 = +(process.env.GAP2 || 0.30);
const dom2 = Array.from({length: 10}, (_, i) => ({x: 500 - i * 46, s: tEraserLand + 0.05 + i * GAP2}));
dom2.forEach((d, i) => { if (i > 0) ev(d.s, 'dom', d.x, 1360, 1); });
const tLamp = dom2[9].s + 0.32;
ev(tLamp, 'lamp', 50, 1300, 1);
console.log('launch', tLaunch.toFixed(2), 'eraser lands', tEraserLand.toFixed(2), 'lamp', tLamp.toFixed(2));

// ---------------- assemble frames ----------------
const dyn = [];
const D = (k, o) => { dyn.push({k, ...o}); return dyn.length - 1; };
const iHand = D('hand', {w: 110, h: 54});
const iD1 = dom1.map(() => D('domino', {w: 16, h: 84}));
const iMarble = D('marble', {r: 15});
const iBooks = books.map(() => D('book', {w: 26, h: 120}));
const iBall = D('tennis', {r: 22});
const iPlank = D('plank', {w: PLANK.len, h: PLANK.th});
const iEraser = D('eraser', {w: 44, h: 20});
const iD2 = dom2.map(() => D('domino', {w: 16, h: 84}));
const frames = [];
const total = Math.floor(DUR * FPS);
for (let f = 0; f < total; f++) {
  const t = f / FPS, row = new Array(dyn.length);
  // hand pokes first domino
  const hx = t < T0 - 0.9 ? -90 : t < T0 - 0.05 ? -90 + (92 + 90) * eio(clamp((t - (T0 - 0.9)) / 0.85)) : 92 - 190 * eio(clamp((t - (T0 - 0.05)) / 0.7));
  row[iHand] = [hx - 55, 340, 0];
  dom1.forEach((d, i) => { row[iD1[i]] = dominoPose(d.x, 400, 16, 84, d.s, D1, 1, 66 * Math.PI / 180, t); });
  const m = sample(marble, t); row[iMarble] = [m.x, m.y, m.a];
  books.forEach((b, i) => { row[iBooks[i]] = dominoPose(b.x, 890, 26, 120, b.s, DB, -1, 68 * Math.PI / 180, t); });
  const b = sample(ball2All, t); row[iBall] = [b.x, b.y, b.a];
  row[iPlank] = [PLANK.cx, PLANK.cy, plankAngle(t)];
  if (t < tLaunch) row[iEraser] = eraserOnPlank(t);
  else if (t < tEraserLand) { const u = t - tLaunch; row[iEraser] = [xs + evx * u, ys + evy * u + 0.5 * G * u * u, aL + spin * u]; }
  else { const u = eout(clamp((t - tEraserLand) / 0.45)); row[iEraser] = [tx + 40 * u, ty + (1388 - ty) * u, -2 * Math.PI + 0.25 * u]; }
  dom2.forEach((d, i) => { row[iD2[i]] = dominoPose(d.x, 1400, 16, 84, d.s, D1, -1, (i === 9 ? 78 : 66) * Math.PI / 180, t); });
  frames.push(row.map((p) => p.map((v) => +v.toFixed(2))));
}
const statics = [
  ...Object.entries(SEG).map(([k, s]) => ({k, ...s})),
  {k: 'box', ...BOX}, {k: 'pencil', x: PIV.x, y: PIV.y, r: PIV.r},
];
const out = {fps: FPS, statics, dyn, events, rolls, frames, tLamp, T0, meta: {tHit1, tBook1, tPush2, tL, tLaunch, tEraserLand}};
fs.writeFileSync('kin.json', JSON.stringify(out));
console.log('frames', frames.length, 'events', events.length, 'rolls', rolls.length);
