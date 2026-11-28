// cast.js — the original cast of "阿北的牙不痛了": Abei, the Dentist, the Syringe, the bad Molar, small Teeth, a cavity Bug.
// Character-local coordinates: origin = the ground between the feet, y down. Every character takes a breath phase (b, in beats) and squashes on it.
import * as T from './toon.js';
import { P, pieEye, brow, mouth, glove, shoe, hose, union, ribbon } from './chars.js';
import { lerp, TAU } from '/core/lib.js';
const { shape, stroke, ell, arc, spline, noodle, quad, push, pop, translate, rotate, scale, S, rr, rect } = T;
const D2R = Math.PI / 180;

// breathing: stretch on the beat, squash on the off-beat (~6 %)
const breath = (b, amp = .06) => { const c = Math.cos(TAU * b); return [1 - c * amp * .6, 1 + c * amp]; };
const hand = (a, spec, k = 1) => { const ang = Math.atan2(spec.y - a[1], spec.x - a[0]); return () => glove(spec.x, spec.y, spec.rot ?? ang, spec.hand || 'open', k); };
// one rubber-hose arm: shoulder → hand target (with a bend), glove at the end
function arm(sh, tg, w, bend, k = 1) {
  const h = noodle(sh, [tg.x, tg.y], bend, w, w);
  shape(h, { fill: P.white, lw: S.lw * .8 });
  glove(tg.x, tg.y, tg.rot ?? Math.atan2(tg.y - sh[1], tg.x - sh[0]), tg.hand || 'open', k);
}
// one rubber-hose leg + shoe
function leg(hip, foot, w, bend, dir = 1, k = 1, ang = 0) {
  shape(noodle(hip, foot, bend, w, w), { fill: P.dark, lw: S.lw * .8 });
  shoe(foot[0] - 8 * dir, foot[1], dir, k, ang);
}

// ———————————————————— 阿北 (Abei) ————————————————————
// p = {x,y,k,dir,b, walk (0..1 phase or null), arms:{l:{x,y,hand},r:{x,y,hand}}, eyes:{type,lx,ly}, brows, mouth:{type,open}, numb (crooked grin + drool), stretchNeck (extra neck length)}
export function abei(p) {
  const { x = 0, y = 0, k = 1, dir = 1, b = 0, neck = 0, eyes = {}, mouthSpec = { type: 'smile' }, numb = false, tilt = 0, sq = 0 } = p;
  const [sx, sy] = breath(b); push(); translate(x, y); scale(dir * k, k); rotate(tilt); scale(1 + sq, 1 - sq);
  const ph = p.walk == null ? 0 : p.walk * TAU;
  const L = p.legs || { l: [-26 + Math.sin(ph) * 18, -2 - Math.max(0, Math.cos(ph)) * 14], r: [26 - Math.sin(ph) * 18, -2 - Math.max(0, -Math.cos(ph)) * 14] };
  // legs
  leg([-22, -118], [L.l[0] - 14, L.l[1]], 26, -14, 1, 1.15);
  leg([22, -118], [L.r[0] + 14, L.r[1]], 26, 14, 1, 1.15);
  push(); scale(sx, sy);
  // belly + trousers
  shape(spline([[-62, -128], [-72, -190], [-58, -250], [0, -270], [58, -250], [72, -190], [62, -128], [0, -108]], true, 8), { fill: P.white, lw: S.lw });
  shape(spline([[-64, -130], [-70, -160], [-40, -152], [0, -154], [40, -152], [70, -160], [64, -130], [0, -108]], true, 8), { fill: P.dmid, lw: S.lw * .9 });
  // suspenders
  stroke([[-34, -262], [-30, -150]], S.lw * 1.6); stroke([[34, -262], [30, -150]], S.lw * 1.6);
  // shirt buttons
  for (const yy of [-230, -200, -170]) T.dot(0, yy, 3.4);
  pop();
  // arms
  const AL = p.arms?.l || { x: -105, y: -120, hand: 'open' }, AR = p.arms?.r || { x: 105, y: -120, hand: 'open' };
  arm([-52, -236], AL, 22, -18); arm([52, -236], AR, 22, 18);
  // neck (optional stretch) + head
  const ny = -270 - neck;
  if (neck > 4) shape(noodle([0, -262], [0, ny - 6], 14 * Math.sin(neck * .05), 34, 34), { fill: P.white, lw: S.lw * .9 });
  push(); translate(0, ny); scale(sx, sy);
  // ears
  shape(ell(-66, -52, 14, 20), { fill: P.white, lw: S.lw * .9 }); shape(ell(66, -52, 14, 20), { fill: P.white, lw: S.lw * .9 });
  // head
  shape(spline([[-60, -48], [-64, -96], [-30, -126], [0, -130], [30, -126], [64, -96], [60, -48], [34, -4], [0, 6], [-34, -4]], true, 8), { fill: P.white, lw: S.lw, shade: () => { } });
  // flat cap
  shape(spline([[-66, -100], [-54, -128], [0, -148], [56, -128], [68, -100], [20, -108], [-24, -108]], true, 8), { fill: P.dmid, lw: S.lw });
  shape(spline([[10, -106], [60, -104], [92, -96], [60, -92], [10, -96]], true, 6), { fill: P.dark, lw: S.lw * .9 });
  // eyes (big pie eyes) + brows
  const e = { type: 'open', ...eyes };
  pieEye(-26, -70, 17, 22, e); pieEye(26, -70, 17, 22, e);
  if (p.brows) { brow(-26, -102, 30, p.brows, -1); brow(26, -102, 30, p.brows, 1); }
  // big round nose
  shape(ell(0, -44, 17, 14), { fill: P.pale, lw: S.lw * .9 });
  // moustache (two bushy lobes)
  shape(spline([[-46, -26], [-30, -38], [-4, -30], [0, -24], [-6, -16], [-30, -12], [-48, -16]], true, 6), { fill: P.dark, lw: S.lw * .9 });
  shape(spline([[46, -26], [30, -38], [4, -30], [0, -24], [6, -16], [30, -12], [48, -16]], true, 6), { fill: P.dark, lw: S.lw * .9 });
  // mouth (numb = lopsided grin + drool bubble)
  push(); if (numb) { translate(8, 0); rotate(.12); }
  mouth(0, -2, numb ? 40 : 46, mouthSpec.type, { open: mouthSpec.open });
  pop();
  if (numb) { const bub = 5 + 5 * (.5 + .5 * Math.sin((p.t || 0) * 5)); shape(ell(26, 24 + bub * .5, bub, bub), { fill: P.white, lw: S.lw * .6 }); }
  pop();
  pop();
}

// ———————————————————— 醫師 (the Dentist) ————————————————————
export function dentist(p) {
  const { x = 0, y = 0, k = 1, dir = 1, b = 0, neck = 0, eyes = {}, mouthSpec = { type: 'flat' }, tilt = 0, maskUp = false } = p;
  const [sx, sy] = breath(b, .045); push(); translate(x, y); scale(dir * k, k); rotate(tilt);
  const ph = p.walk == null ? 0 : p.walk * TAU;
  const L = p.legs || { l: [-18 + Math.sin(ph) * 16, -2 - Math.max(0, Math.cos(ph)) * 12], r: [18 - Math.sin(ph) * 16, -2 - Math.max(0, -Math.cos(ph)) * 12] };
  leg([-14, -170], [L.l[0] - 12, L.l[1]], 20, -10, 1, 1);
  leg([14, -170], [L.r[0] + 12, L.r[1]], 20, 10, 1, 1);
  push(); scale(sx, sy);
  // long white coat
  shape(spline([[-52, -168], [-46, -250], [-34, -340], [0, -352], [34, -340], [46, -250], [52, -168], [30, -150], [-30, -150]], true, 8), { fill: P.white, lw: S.lw, shade: () => { } });
  stroke([[0, -340], [0, -158]], S.lw * .8);
  shape(ell(-16, -250, 5, 5), { fill: P.dmid, lw: S.lw * .5 }); shape(ell(-16, -210, 5, 5), { fill: P.dmid, lw: S.lw * .5 });
  // collar + tie
  shape([[-6, -345], [0, -330], [6, -345], [10, -300], [0, -290], [-10, -300]], { fill: P.dark, lw: S.lw * .7 });
  pop();
  const AL = p.arms?.l || { x: -90, y: -170, hand: 'open' }, AR = p.arms?.r || { x: 90, y: -170, hand: 'open' };
  arm([-42, -330], AL, 18, -16); arm([42, -330], AR, 18, 16);
  // neck + head
  const ny = -352 - neck;
  if (neck > 4) shape(noodle([0, -346], [0, ny - 4], 10 * Math.sin(neck * .05), 24, 24), { fill: P.white, lw: S.lw * .9 });
  push(); translate(0, ny); scale(sx, sy);
  shape(spline([[-42, -46], [-46, -92], [-22, -122], [0, -126], [22, -122], [46, -92], [42, -46], [22, -6], [0, 4], [-22, -6]], true, 8), { fill: P.white, lw: S.lw });
  // hair (a neat dark cap)
  shape(spline([[-46, -90], [-34, -120], [0, -134], [34, -120], [46, -90], [24, -102], [-24, -102]], true, 8), { fill: P.dark, lw: S.lw * .9 });
  // head mirror (headband + round mirror)
  stroke([[-44, -96], [0, -108], [44, -96]], S.lw * 1.1);
  shape(ell(0, -108, 22, 22), { fill: P.light, lw: S.lw * .9 }); shape(ell(-6, -114, 6, 5), { fill: P.white, stroke: false, boil: 0 });
  const e = { type: 'open', ...eyes };
  pieEye(-17, -66, 13, 18, e); pieEye(17, -66, 13, 18, e);
  if (p.brows) { brow(-17, -92, 22, p.brows, -1); brow(17, -92, 22, p.brows, 1); }
  shape(ell(0, -42, 8, 6), { fill: P.pale, lw: S.lw * .7 });
  if (maskUp) { shape(spline([[-34, -50], [0, -42], [34, -50], [30, -10], [0, 0], [-30, -10]], true, 6), { fill: P.light, lw: S.lw }); }
  else { mouth(0, -16, 30, mouthSpec.type, { open: mouthSpec.open }); shape(spline([[-30, 2], [0, 12], [30, 2], [26, 22], [0, 30], [-26, 22]], true, 6), { fill: P.light, lw: S.lw * .85 }); }
  pop();
  pop();
}

// ———————————————————— the Syringe (singer) ————————————————————
export function syringe(p) {
  const { x = 0, y = 0, k = 1, dir = 1, b = 0, eyes = {}, mouthSpec = { type: 'open', open: .9 }, tilt = 0, plunge = 0 } = p;
  const [sx, sy] = breath(b, .07); push(); translate(x, y); scale(dir * k, k); rotate(tilt);
  // legs + shoes
  leg([-16, -150], [-28, -2], 18, -8, 1, .95); leg([16, -150], [30, -2], 18, 8, 1, .95);
  push(); scale(sx, sy);
  // needle (up), barrel, flange, plunger (down)
  shape([[-4, -330], [4, -330], [7, -300], [-7, -300]], { fill: P.light, lw: S.lw * .8 });
  shape(rr(-44, -300, 88, 150, 18), { fill: P.white, lw: S.lw, shade: () => { T.shape(rect(-44, -240 + plunge * 40, 88, 100), { fill: P.light, stroke: false, boil: 0 }); } });
  for (let i = 0; i < 4; i++) stroke([[34, -284 + i * 22], [44, -284 + i * 22]], S.lw * .6, { boil: .3 });
  shape(rr(-62, -154, 124, 16, 7), { fill: P.white, lw: S.lw * .9 });
  shape(rr(-8, -140, 16, 40 - plunge * 40, 5), { fill: P.pale, lw: S.lw * .8 });
  // a drop on the needle tip (the mood feature)
  shape(spline([[0, -346], [7, -328], [0, -322], [-7, -328]], true, 5), { fill: P.white, lw: S.lw * .7 });
  const e = { type: 'open', ...eyes };
  pieEye(-17, -254, 14, 19, e); pieEye(17, -254, 14, 19, e);
  mouth(0, -214, 38, mouthSpec.type, { open: mouthSpec.open });
  pop();
  arm([-46, -226], p.arms?.l || { x: -92, y: -190, hand: 'open' }, 17, -12, .9); arm([46, -226], p.arms?.r || { x: 92, y: -190, hand: 'open' }, 17, 12, .9);
  pop();
}

// ———————————————————— the Molar (the bad tooth, conductor) + small Teeth ————————————————————
// tooth body: crown (two bumps on top) + two roots; hole = dark cavity on the side
export function tooth(p) {
  const { x = 0, y = 0, k = 1, dir = 1, b = 0, eyes = {}, mouthSpec = { type: 'grin' }, tilt = 0, big = false, hat = false, hole = false, bow = false, baton = null, sq = 0 } = p;
  const [sx, sy] = breath(b, .08); push(); translate(x, y); scale(dir * k, k); rotate(tilt); scale(1 + sq, 1 - sq);
  const hh = big ? 1 : .72;
  leg([-16, -80 * hh], [-26, -2], 17, -8, 1, .9); leg([16, -80 * hh], [28, -2], 17, 8, 1, .9);
  push(); scale(sx, sy);
  shape(spline([[-62, -150 * hh - 40], [-44, -228 * hh - 30], [-16, -214 * hh - 22], [0, -196 * hh - 22], [16, -214 * hh - 22], [44, -228 * hh - 30], [62, -150 * hh - 40], [54, -86 * hh], [30, -64 * hh], [0, -80 * hh], [-30, -64 * hh], [-54, -86 * hh]], true, 8), { fill: P.white, lw: S.lw, shade: () => { T.shape(rect(30, -420, 80, 460), { fill: P.pale, stroke: false, boil: 0 }); } });
  if (hole) shape(spline([[-62, -150 * hh - 30], [-40, -156 * hh - 14], [-34, -130 * hh], [-52, -118 * hh]], true, 6), { fill: P.ink, lw: S.lw * .8 });
  const e = { type: 'open', ...eyes };
  const ey = -150 * hh - 40;
  pieEye(-17, ey, 14, 19, e); pieEye(17, ey, 14, 19, e);
  mouth(0, ey + 40, 36, mouthSpec.type, { open: mouthSpec.open });
  if (bow) { shape([[-4, -88 * hh - 22], [-30, -100 * hh - 28], [-30, -76 * hh - 12]], { fill: P.dark, lw: S.lw * .8 }); shape([[4, -88 * hh - 22], [30, -100 * hh - 28], [30, -76 * hh - 12]], { fill: P.dark, lw: S.lw * .8 }); }
  if (hat) { shape(rr(-34, -222 * hh - 44, 68, 44, 6), { fill: P.dark, lw: S.lw * .9 }); shape(rr(-50, -222 * hh - 4, 100, 12, 5), { fill: P.dark, lw: S.lw * .9 }); }
  pop();
  arm([-48, -150 * hh - 6], p.arms?.l || { x: -86, y: -128 * hh, hand: 'open' }, 16, -10, .85);
  const AR = p.arms?.r || { x: 86, y: -128 * hh, hand: 'open' };
  arm([48, -150 * hh - 6], AR, 16, 10, .85);
  if (baton) { push(); translate(AR.x, AR.y); rotate(baton.ang || -1.1); stroke([[0, 0], [60, 0]], S.lw * 1.2); pop(); }
  pop();
}

// ———————————————————— a cavity Bug (caterpillar) with an optional instrument ————————————————————
export function bug(p) {
  const { x = 0, y = 0, k = 1, dir = 1, b = 0, eyes = {}, mouthSpec = { type: 'grin' }, inst = null, segs = 4 } = p;
  push(); translate(x, y); scale(dir * k, k);
  for (let i = segs - 1; i >= 0; i--) {
    const [sx, sy] = breath(b + i * .12, .08);
    push(); translate(-i * 44, -34 + Math.sin(TAU * (b + i * .12)) * 5); scale(sx, sy);
    shape(ell(0, 0, 30, 30), { fill: i % 2 ? P.light : P.pale, lw: S.lw * .9 });
    pop();
    leg([-i * 44 - 6, -10], [-i * 44 - 4, -2], 8, 0, 1, .4);
  }
  const [hx, hy] = breath(b, .08);
  push(); translate(4, -44); scale(hx, hy);
  shape(ell(0, 0, 38, 36), { fill: P.white, lw: S.lw });
  const e = { type: 'open', ...eyes };
  pieEye(-8, -8, 11, 15, e); pieEye(18, -8, 11, 15, e);
  mouth(8, 18, 22, mouthSpec.type, { open: mouthSpec.open });
  // antennae
  stroke([[-14, -32], [-22, -58]], S.lw * .9); T.dot(-22, -60, 5); stroke([[8, -35], [14, -60]], S.lw * .9); T.dot(14, -62, 5);
  pop();
  if (inst === 'trumpet') { push(); translate(44, -42); rotate(-.15); shape([[0, -5], [66, -12], [92, -30], [92, 30], [66, 12], [0, 5]], { fill: P.light, lw: S.lw * .8 }); pop(); }
  if (inst === 'washboard') { push(); translate(22, -26); shape(rr(0, -30, 40, 60, 5), { fill: P.light, lw: S.lw * .8 }); for (let i = 0; i < 5; i++) stroke([[6, -22 + i * 10], [34, -22 + i * 10]], S.lw * .5, { boil: .2 }); pop(); }
  pop();
}
