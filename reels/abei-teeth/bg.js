// bg.js — painted sets (greyscale, never boil): the dental clinic, the inside of Abei's mouth, the town street.
import * as T from './toon.js';
import { P } from './chars.js';
import { hash, vnoise, TAU } from '/core/lib.js';
const { shape, stroke, ell, arc, spline, rr, rect, S } = T;

// soft blotches + inner darkening on a flat wash, drawn straight to the 2D context in screen space
function wash(g, x, y, w, h, base, seed = 1) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = base; g.fillRect(x, y, w, h);
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  for (let i = 0; i < 46; i++) {
    const bx = x + hash(i * 3.1 + seed) * w, by = y + hash(i * 5.7 + seed) * h, br = 60 + hash(i + seed * 2) * 160;
    const dark = hash(i * 9.1 + seed) > .5;
    const gr = g.createRadialGradient(bx, by, 0, bx, by, br);
    gr.addColorStop(0, dark ? 'rgba(20,19,17,.07)' : 'rgba(255,253,245,.07)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(bx - br, by - br, br * 2, br * 2);
  }
  g.restore();
}

export function paintClinic(g, t = 0) {
  const X = 0, Y = 240, W = 1080, H = 1440;
  wash(g, X, Y, W, H, P.mid, 3);
  // wall panelling
  const o = { boil: 0 };
  for (let i = 0; i < 6; i++) T.fillOnly(rect(i * 190 - 10, Y, 100, 900), i % 2 ? P.light : '#B1AEA5', o);
  stroke([[0, Y + 900], [1080, Y + 900]], 5, o);
  // floor
  T.fillOnly(rect(0, Y + 900, 1080, 540), P.dmid, o);
  for (let i = 0; i < 9; i++) stroke([[i * 140 - 40, Y + 1440], [540 + (i - 4) * 36, Y + 900]], 3, { boil: .3, line: P.dark });
  // window with blinds
  shape(rr(700, Y + 120, 280, 360, 12), { fill: P.pale, lw: S.lw });
  for (let i = 0; i < 9; i++) T.fillOnly(rect(712, Y + 134 + i * 38, 256, 22), P.light, o);
  stroke([[840, Y + 120], [840, Y + 480]], 4);
  // poster: a smiling tooth
  shape(rr(90, Y + 150, 200, 270, 10), { fill: P.pale, lw: S.lw });
  shape(spline([[190, Y + 250], [150, Y + 228], [128, Y + 260], [140, Y + 330], [170, Y + 365], [190, Y + 345], [210, Y + 365], [240, Y + 330], [252, Y + 260], [230, Y + 228]], true, 6), { fill: P.white, lw: S.lw * .8 });
  T.text('刷牙', 190, Y + 395, { font: '900 40px "Noto Serif TC"', fill: P.ink });
  // instrument tray (right) with a lamp arm above
  stroke([[900, Y + 560], [840, Y + 620], [760, Y + 600]], 9);
  shape(ell(740, Y + 596, 64, 30), { fill: P.light, lw: S.lw });
  stroke([[740, Y + 626], [740, Y + 700]], 6);
  shape(rr(850, Y + 700, 190, 26, 8), { fill: P.light, lw: S.lw });
  for (let i = 0; i < 3; i++) stroke([[880 + i * 46, Y + 700], [880 + i * 46, Y + 650 - i * 10]], 7);
}

export function paintChair(g, { x = 400, y = 1300, back = 1, k = 1 } = {}) {
  // the dental chair (profile, facing right): seat, back, headrest, arm, pedestal; `back` = 1 reclined, 0 upright
  T.push(); T.translate(x, y); T.scale(k);
  shape(rr(-40, -120, 120, 120, 16), { fill: P.dmid, lw: S.lw });          // pedestal
  shape(rr(-110, -150, 70, 48, 14), { fill: P.dark, lw: S.lw });            // base foot
  shape(rr(-30, -190, 250, 70, 30), { fill: P.light, lw: S.lw });           // seat
  T.push(); T.translate(-10, -170); T.rotate(-(1.15 - back * .55)); shape(rr(-210, -34, 240, 68, 30), { fill: P.light, lw: S.lw }); shape(rr(-250, -26, 70, 52, 18), { fill: P.pale, lw: S.lw }); T.pop(); // back + headrest
  shape(rr(120, -240, 110, 30, 14), { fill: P.pale, lw: S.lw });            // arm
  T.pop();
}

export function paintMouth(g, t = 0, b = 0) {
  // inside the mouth, a proscenium: dark cavity, upper and lower gums with a row of static teeth, tongue stage, a dangling uvula
  const X = 0, Y = 240, W = 1080, H = 1440;
  wash(g, X, Y, W, H, P.dark, 8);
  const o = { boil: 0 };
  T.fillOnly(rect(0, Y, 1080, 1440), '#2E2D2A', o);
  // throat glow (back wall)
  const gr = g.createRadialGradient(540, Y + 640, 40, 540, Y + 640, 520);
  gr.addColorStop(0, 'rgba(120,118,110,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = gr; g.fillRect(0, Y, 1080, 1440);
  // uvula
  shape(spline([[520, Y + 300], [560, Y + 300], [572, Y + 380], [540, Y + 440], [508, Y + 380]], true, 6), { fill: P.dmid, lw: S.lw });
  // upper gum + teeth
  shape(spline([[-40, Y - 20], [1120, Y - 20], [1120, Y + 150], [900, Y + 190], [540, Y + 170], [180, Y + 190], [-40, Y + 150]], true, 8), { fill: P.dmid, lw: S.lw });
  for (let i = 0; i < 7; i++) { const cx = 90 + i * 150, h = 120 + (i % 2) * 16; shape(rr(cx - 56, Y + 130, 112, h, 34), { fill: P.white, lw: S.lw * .9 }); }
  // lower gum + teeth
  shape(spline([[-40, Y + 1460], [1120, Y + 1460], [1120, Y + 1260], [900, Y + 1230], [540, Y + 1250], [180, Y + 1230], [-40, Y + 1260]], true, 8), { fill: P.dmid, lw: S.lw });
  for (let i = 0; i < 7; i++) { const cx = 90 + i * 150, h = 120 + (i % 2) * 16; shape(rr(cx - 56, Y + 1262 - h, 112, h, 34), { fill: P.white, lw: S.lw * .9 }); }
  // tongue = the stage floor
  shape(spline([[-60, Y + 1260], [-20, Y + 1020], [300, Y + 980], [540, Y + 1000], [800, Y + 980], [1100, Y + 1020], [1140, Y + 1260]], true, 8), { fill: P.mid, lw: S.lw, shade: () => { T.shape(rect(0, Y + 1140, 1080, 200), { fill: P.light, stroke: false, boil: 0 }); } });
  stroke([[540, Y + 1020], [540, Y + 1200]], 5, { boil: .5 });
}
