// Big domino layout: snake -> binary tree -> 56x80 pixel-art mosaic. Computes start time of every domino.
import fs from 'fs';
const S = 0.6;                       // spacing
const dom = [];                      // {x,z,yaw,parent,dt,kind,idx,color}
const add = (o) => { dom.push(o); return dom.length - 1; };
const hsl = (h, s, l) => { h = ((h % 1) + 1) % 1; const a = s * Math.min(l, 1 - l); const f = (n) => { const k = (n + h * 12) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }; return [f(0), f(8), f(4)]; };
const hex = (c) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };

// ---------------- snake ----------------
let tx = -14, tz = 38, ta = 0;       // heading angle: direction = (cos a, sin a) in (x,z)
let acc = S;                         // so the first domino is placed immediately
let prev = -1, snakeCount = 0;
const SNAKE_SPEED = 13.5;
function emit(parentKind = 'snake') {
  const id = add({x: tx, z: tz, yaw: Math.atan2(Math.cos(ta), Math.sin(ta)), parent: prev, kind: parentKind});
  prev = id; return id;
}
function step(ds) { tx += Math.cos(ta) * ds; tz += Math.sin(ta) * ds; acc += ds; if (acc >= S - 1e-9) { acc -= S; emit(); } }
function straight(len) { const n = Math.round(len / 0.02); for (let i = 0; i < n; i++) step(len / n); }
function arc(R, sweep) { // sweep>0 turns toward +angle
  const n = Math.round(Math.abs(sweep) * R / 0.02), da = sweep / n, ds = Math.abs(sweep) * R / n;
  for (let i = 0; i < n; i++) { ta += da / 2; step(ds); ta += da / 2; }
}
emit(); acc = 0;
// rows alternate east/west with U-turns toward -z
// heading east (a=0): turning toward -z means angle decreasing (direction (cos a, sin a): z = sin a, so toward -z => a negative) => sweep -pi
straight(28); arc(4, -Math.PI);        // now heading west at z=30
straight(28); arc(4, Math.PI);         // heading west -> turn toward -z: a=pi, to go toward -z need sin a <0 => a -> pi+...; +pi sweep => a=2pi => heading east at z=22
straight(28); arc(4, -Math.PI);        // heading west at z=14
straight(10); arc(4, Math.PI / 2 * 1); // heading west (a=-pi) ... adjusted below

const nSnake = dom.length;
// snake colours (rainbow) and dt (ramp-up like a real cascade)
dom.forEach((d, i) => { d.color = hsl(i / nSnake * 1.6 + 0.02, 0.78, 0.55); d.dt = i === 0 ? 0 : S / (SNAKE_SPEED * (1 - 0.72 * Math.exp(-i / 7))); });
dom[0].parent = -1;

// ---------------- mosaic image (56 x 80) ----------------
const COLS = 56, ROWS = 80, TOP_Z = -30, TREE_H = 6;
const img = Array.from({length: ROWS}, () => Array(COLS).fill(null));
const seeded = (i) => { const x = Math.sin(i * 91.7 + 13.3) * 43758.5453; return x - Math.floor(x); };
for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
  const t = j / (ROWS - 1);
  let c = [0.10 + 0.17 * t, 0.16 - 0.05 * t, 0.31 + 0.02 * t];       // deep navy -> plum
  if (seeded(j * COLS + i) > 0.985) c = [1, 0.93, 0.6];             // stars
  // rainbow arcs at the bottom
  const rr = Math.hypot(i - 27.5, j - 96);
  const band = Math.floor((rr - 22) / 2.2);
  if (band >= 0 && band < 7 && j > 58) c = hsl(0.0 + band * 0.12, 0.85, 0.58);
  // heart
  const X = (i - 27.5) / 20 * 1.15, Y = (30 - j) / 20 * 1.15;
  const inside = (X * X + Y * Y - 1) ** 3 - X * X * Y ** 3 <= 0;
  if (inside) { const u = (j - 8) / 48; c = [1 - 0.18 * u, 0.30 - 0.12 * u, 0.43 - 0.1 * u]; }
  img[j][i] = c;
}
// heart outline + highlight
const isHeart = (i, j) => { const X = (i - 27.5) / 20 * 1.15, Y = (30 - j) / 20 * 1.15; return (X * X + Y * Y - 1) ** 3 - X * X * Y ** 3 <= 0; };
for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
  if (isHeart(i, j) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => !isHeart(i + a, j + b))) img[j][i] = [0.55, 0.05, 0.2];
  const hx = (i - 17) / 5, hy = (j - 17) / 3.2;
  if (hx * hx + hy * hy < 1 && isHeart(i, j)) img[j][i] = [1, 0.85, 0.88];
}
for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) if (i < 2 || i >= COLS - 2 || j < 2 || j >= ROWS - 2) img[j][i] = [1, 0.82, 0.4];   // golden frame

// ---------------- tree: root = last snake domino, leaves = first domino of each column ----------------
const root = dom.length - 1;
const rootPos = {x: dom[root].x, z: dom[root].z};
const leafX = (j) => (j - (COLS - 1) / 2) * S;
const TREE_SPEED = 15.5;
const treeStart = dom.length;
const leafIds = new Array(COLS);
function build(a, b) {   // returns node {x,z,h,leaves:[a,b)}
  if (b - a === 1) return {a, b, x: leafX(a), z: TOP_Z, h: 0};
  const m = Math.floor((a + b) / 2), L = build(a, m), R = build(m, b);
  const h = 1 + Math.max(L.h, R.h);
  return {a, b, x: (L.x + R.x) / 2, z: TOP_Z + h * (rootPos.z - TOP_Z) / TREE_H, h, kids: [L, R]};
}
const tree = build(0, COLS);
tree.x = rootPos.x; tree.z = rootPos.z;
const hueOf = (x) => (x + 17) / 34;
function grow(node, parentId) {
  if (!node.kids) return;
  for (const k of node.kids) {
    const dx = k.x - node.x, dz = k.z - node.z, len = Math.hypot(dx, dz), ux = dx / len, uz = dz / len, yaw = Math.atan2(ux, uz);
    const n = Math.max(1, Math.round(len / S) - 1), sp = len / (n + 1);
    let p = parentId;
    for (let q = 1; q <= n; q++) p = add({x: node.x + ux * sp * q, z: node.z + uz * sp * q, yaw, parent: p, dt: sp / TREE_SPEED, kind: 'tree', color: hsl(hueOf(node.x + dx * q / (n + 1)) * 0.85 + 0.05, 0.8, 0.58)});
    // child node domino (leaf = column row 0)
    const id = add({x: k.x, z: k.z, yaw: k.kids ? yaw : Math.PI, parent: p, dt: sp / TREE_SPEED, kind: k.kids ? 'tree' : 'col', color: k.kids ? hsl(hueOf(k.x) * 0.85 + 0.05, 0.8, 0.58) : img[ROWS - 1][k.a]});
    if (!k.kids) leafIds[k.a] = id;
    grow(k, id);
  }
}
grow(tree, root);
console.log('tree dominoes', dom.length - treeStart);

// ---------------- mosaic columns ----------------
const COL_SPEED = 13;
for (let j = 0; j < COLS; j++) {
  let p = leafIds[j];
  for (let r = 1; r < ROWS; r++) p = add({x: leafX(j), z: TOP_Z - r * S, yaw: Math.PI, parent: p, dt: S / COL_SPEED, kind: 'col', color: img[ROWS - 1 - r][j], last: r === ROWS - 1});
}

// ---------------- timeline ----------------
const T0 = 3.4;
dom.forEach((d, i) => { d.start = i === 0 ? T0 : dom[d.parent].start + d.dt; });
// real positions of leaves etc.
const N = dom.length;
const tSnakeEnd = dom[nSnake - 1].start;
const leafStarts = leafIds.map((id) => dom[id].start);
const tLast = Math.max(...dom.map((d) => d.start));
console.log('N', N, 'T0', T0, 'snake end', tSnakeEnd.toFixed(2), 'leaves', Math.min(...leafStarts).toFixed(2), '-', Math.max(...leafStarts).toFixed(2), 'last start', tLast.toFixed(2));
const out = {
  N, T0, nSnake, tSnakeEnd, leafMin: Math.min(...leafStarts), leafMax: Math.max(...leafStarts), tLast, S,
  d: dom.map((d) => [+d.x.toFixed(3), +d.z.toFixed(3), +d.yaw.toFixed(4), +d.start.toFixed(3), d.kind === 'col' && d.last ? 88 : 66, ...d.color.map((v) => Math.round(v * 255))]),
};
fs.writeFileSync('dominoes.json', JSON.stringify(out));
fs.writeFileSync('layout_dbg.json', JSON.stringify(dom.map((d) => [d.x, d.z, d.start])));
console.log('size', (fs.statSync('dominoes.json').size / 1024).toFixed(0), 'KB');
