// main.js — ?mode=sheet (model sheet) | lookA | lookB (style frames) | film
import * as T from './toon.js';
import { P } from './chars.js';
import * as C from './cast.js';
import { paintClinic, paintChair, paintMouth } from './bg.js';
import { makeFilm, post } from './film.js';
import { subPlate } from './ui.js';
const Q = new URLSearchParams(location.search), MODE = Q.get('mode') || 'film';
const cv = document.getElementById('c');
const CW = +(Q.get('w') || 1080), CH = +(Q.get('h') || 1920);
cv.width = CW; cv.height = CH; cv.style.width = CW + 'px'; cv.style.height = CH + 'px';
T.init(cv);
const TEXT = '刷牙三小時後阿北的牙不痛了不弄了麻藥不是治好只是暫時再打一次哎唷歡迎回來留言你拖過看牙嗎拖了幾年全部倒下';
await document.fonts.ready;
for (const f of ['46px Limelight', '20px "IM Fell English SC"', '40px Shrikhand']) await document.fonts.load(f);
for (const w of [700, 900]) await document.fonts.load(`${w} 40px "Noto Serif TC"`, TEXT);

let draw = null;
const beats = t => t * 2;       // 120 bpm
if (MODE === 'sheet') {
  draw = t => {
    const g = T.g; g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = P.paper; g.fillRect(0, 0, CW, CH);
    T.frame(t, { amp: 1.0 });
    const b = beats(t);
    // row 1: Abei x3, Dentist x2
    C.abei({ x: 260, y: 640, k: 1.15, b, eyes: { type: 'open', lx: .3 }, mouthSpec: { type: 'smile' }, arms: { l: { x: -110, y: -150, hand: 'open' }, r: { x: 120, y: -230, hand: 'wave' } } });
    C.abei({ x: 640, y: 640, k: 1.15, b, numb: true, t, walk: .25, eyes: { type: 'open' }, mouthSpec: { type: 'beam' }, arms: { l: { x: -120, y: -130, hand: 'open' }, r: { x: 120, y: -130, hand: 'open' } } });
    C.abei({ x: 1020, y: 640, k: 1.15, b, eyes: { type: 'wide' }, brows: 'up', mouthSpec: { type: 'wavy' }, arms: { l: { x: -100, y: -310, hand: 'open' }, r: { x: 100, y: -310, hand: 'open' } } });
    C.dentist({ x: 1480, y: 640, k: 1.0, b, eyes: { type: 'open' }, arms: { l: { x: -100, y: -240, hand: 'point' }, r: { x: 100, y: -170, hand: 'open' } }, mouthSpec: { type: 'flat' } });
    C.dentist({ x: 1860, y: 640, k: 1.0, b, eyes: { type: 'wide' }, brows: 'up', maskUp: true, arms: { l: { x: -120, y: -140, hand: 'fist' }, r: { x: 120, y: -300, hand: 'grab' } } });
    C.syringe({ x: 2300, y: 640, k: 1.15, b, eyes: { type: 'open' }, mouthSpec: { type: 'open', open: .9 }, arms: { l: { x: -100, y: -240, hand: 'open' }, r: { x: 100, y: -250, hand: 'wave' } } });
    // row 2: molar (conductor), small teeth, bugs
    C.tooth({ x: 330, y: 1340, k: 1.0, b, big: true, hole: true, bow: true, baton: { ang: -1.1 }, arms: { l: { x: -90, y: -170, hand: 'open' }, r: { x: 100, y: -250, hand: 'fist' } } });
    C.tooth({ x: 760, y: 1340, k: 1.0, b, hat: true, eyes: { type: 'open' }, mouthSpec: { type: 'beam' } });
    C.tooth({ x: 1040, y: 1340, k: 1.0, b: b + .25, hat: true, eyes: { type: 'happy' }, mouthSpec: { type: 'open', open: .8 } });
    C.tooth({ x: 1320, y: 1340, k: 1.0, b, eyes: { type: 'wide' }, mouthSpec: { type: 'wavy' } });
    C.bug({ x: 1760, y: 1340, k: 1.1, b, inst: 'trumpet' });
    C.bug({ x: 2380, y: 1340, k: 1.1, b: b + .2, inst: 'washboard', mouthSpec: { type: 'open', open: .6 } });
    T.text('阿北 · 醫師 · 針筒 · 蛀牙 · 小牙 · 蛀蟲', 1440, 900, { font: '900 44px "Noto Serif TC"', fill: P.ink });
  };
} else if (MODE === 'lookA' || MODE === 'lookB') {
  const F = makeFilm(cv); T.init(F.scene);
  draw = t => {
    const sg = F.sg; sg.setTransform(1, 0, 0, 1, 0, 0); sg.fillStyle = '#000'; sg.fillRect(0, 0, 1080, 1920);
    T.init(F.scene); T.frame(t); const b = beats(t);
    if (MODE === 'lookA') {
      paintClinic(sg, t); paintChair(sg, { x: 520, y: 1440, back: .35 });
      C.abei({ x: 560, y: 1296, k: .9, b, tilt: -.1, numb: true, t, eyes: { type: 'open', lx: .4 }, mouthSpec: { type: 'beam' }, brows: 'up', arms: { l: { x: -100, y: -300, hand: 'open' }, r: { x: 110, y: -310, hand: 'open' } }, legs: { l: [-70, -20], r: [90, -10] } });
      C.dentist({ x: 190, y: 1500, k: .95, b, eyes: { type: 'wide' }, brows: 'up', mouthSpec: { type: 'o' }, arms: { l: { x: -90, y: -230, hand: 'open' }, r: { x: 100, y: -260, hand: 'open' } } });
      sg.setTransform(1, 0, 0, 1, 0, 0); subPlate(sg, '牙不痛了，不弄了', 540, 1560, { size: 46, font: '700 "Noto Serif TC"' });
    } else {
      paintMouth(sg, t, b);
      const hop = i => -Math.abs(Math.sin(TAUish(b + i * .25))) * 28;
      C.tooth({ x: 540, y: 1240, k: 1.25, b, big: true, hole: true, bow: true, baton: { ang: -1.2 + Math.sin(b * Math.PI) * .3 }, eyes: { type: 'happy' }, mouthSpec: { type: 'beam' }, arms: { l: { x: -100, y: -230, hand: 'open' }, r: { x: 110, y: -330, hand: 'fist' } } });
      C.tooth({ x: 230, y: 1250 + hop(0), k: 1.0, b, hat: true, eyes: { type: 'happy' }, mouthSpec: { type: 'beam' }, arms: { l: { x: -90, y: -190, hand: 'open' }, r: { x: 90, y: -140, hand: 'open' } } });
      C.tooth({ x: 860, y: 1250 + hop(1), k: 1.0, b, hat: true, dir: -1, eyes: { type: 'happy' }, mouthSpec: { type: 'beam' }, arms: { l: { x: -90, y: -190, hand: 'open' }, r: { x: 90, y: -140, hand: 'open' } } });
      C.bug({ x: 360, y: 1120, k: .9, b, inst: 'trumpet', dir: 1 });
      C.bug({ x: 790, y: 1120, k: .9, b: b + .3, inst: 'washboard', dir: -1, mouthSpec: { type: 'open', open: .6 } });
    }
    post(F, t, { jump: 0 });
  };
}
function TAUish(x) { return x * Math.PI; }
window.DUR = 30;
window.render = t => draw(t);
window.READY = true;
