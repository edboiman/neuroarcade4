// Key art for the home-screen cards: one illustrated, lit scene per game, drawn as SVG (no image files).
// Each scene fills a 200 x 280 canvas; the card crops it to fit and lays the title over a dark scrim.
import { s } from './ui.js';

let uid = 0;
const id = (p) => p + uid++;

function lg(gid, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) {
  return s('linearGradient', { id: gid, x1, y1, x2, y2 }, ...stops.map(([o, c, op]) => s('stop', { offset: o, 'stop-color': c, 'stop-opacity': op ?? 1 })));
}
function rg(gid, stops, cx = 0.5, cy = 0.5, r = 0.5) {
  return s('radialGradient', { id: gid, cx, cy, r }, ...stops.map(([o, c, op]) => s('stop', { offset: o, 'stop-color': c, 'stop-opacity': op ?? 1 })));
}
function scene(defs, ...kids) {
  return s('svg', { viewBox: '0 0 200 280', preserveAspectRatio: 'xMidYMid slice', 'aria-hidden': 'true' }, s('defs', null, ...defs), ...kids);
}
const url = (g) => `url(#${g})`;

// a glossy block for Block Fit
function block(x, y, size, c1, c2, gid) {
  return [
    s('rect', { x, y: y + 3, width: size, height: size, rx: size * 0.2, fill: '#000', opacity: 0.3 }),
    s('rect', { x, y, width: size, height: size, rx: size * 0.2, fill: url(gid) }),
    s('rect', { x: x + size * 0.18, y: y + size * 0.18, width: size * 0.64, height: size * 0.64, rx: size * 0.14, fill: '#fff', opacity: 0.14 }),
    s('ellipse', { cx: x + size * 0.34, cy: y + size * 0.26, rx: size * 0.2, ry: size * 0.08, fill: '#fff', opacity: 0.55, transform: `rotate(-25 ${x + size * 0.34} ${y + size * 0.26})` }),
  ];
}

function blockfit(a, b) {
  const bg = id('bfbg');
  const glow = id('bfgl');
  const cols = [['#5ee7ff', '#1aa2d6'], ['#ffd84d', '#f0a400'], ['#c59bff', '#8a52f0'], ['#6dfb9c', '#20c25a'], ['#ff7d8f', '#e0344f'], ['#7aa2ff', '#3c62e6']];
  const grads = cols.map((c) => {
    const g = id('bfc');
    return [g, lg(g, [[0, c[0]], [1, c[1]]])];
  });
  const defs = [lg(bg, [[0, '#2a1d52'], [0.6, '#170f33'], [1, '#0b0820']]), rg(glow, [[0, a, 0.55], [1, a, 0]]), ...grads.map((x) => x[1])];
  const k = [s('rect', { width: 200, height: 280, fill: url(bg) })];
  // stars
  for (let i = 0; i < 26; i++) k.push(s('circle', { cx: (i * 53) % 200, cy: (i * 37) % 170, r: i % 5 ? 0.8 : 1.4, fill: '#fff', opacity: 0.3 + (i % 3) * 0.2 }));
  k.push(s('circle', { cx: 100, cy: 120, r: 110, fill: url(glow) }));
  // the well
  k.push(s('rect', { x: 30, y: 40, width: 140, height: 190, rx: 14, fill: '#0b0d1f', opacity: 0.75 }), s('rect', { x: 30, y: 40, width: 140, height: 190, rx: 14, fill: 'none', stroke: a, 'stroke-opacity': 0.55, 'stroke-width': 2 }));
  const S = 22;
  const stack = [
    [0, 7, 0], [1, 7, 1], [2, 7, 2], [3, 7, 3], [5, 7, 4], [0, 6, 5], [1, 6, 1], [3, 6, 2], [4, 6, 0], [5, 6, 3], [0, 5, 2], [5, 5, 4], [4, 5, 5],
  ];
  for (const [x, y, c] of stack) k.push(...block(34 + x * S, 46 + y * S, S - 2, ...['', ''], grads[c][0]));
  // ghost landing spot
  for (const [x, y] of [[2, 6], [2, 5], [1, 5], [3, 5]]) k.push(s('rect', { x: 35 + x * S, y: 47 + y * S, width: S - 4, height: S - 4, rx: 4, fill: 'none', stroke: '#ffd84d', 'stroke-width': 1.5, 'stroke-dasharray': '3 3', opacity: 0.8 }));
  // falling piece with a motion trail
  for (let t = 1; t <= 3; t++) k.push(s('rect', { x: 34 + 1 * S, y: 46 + 1 * S - t * 8, width: S * 3 - 2, height: S - 2, rx: 5, fill: '#ffd84d', opacity: 0.12 / t }));
  for (const [x, y] of [[2, 0], [1, 1], [2, 1], [3, 1]]) k.push(...block(34 + x * S, 52 + y * S, S - 2, '', '', grads[1][0]));
  // sparkles
  for (const [x, y, r] of [[160, 30, 5], [24, 70, 4], [176, 150, 3.5]]) k.push(s('path', { d: `M${x} ${y - r * 2} L${x + r * 0.5} ${y - r * 0.5} L${x + r * 2} ${y} L${x + r * 0.5} ${y + r * 0.5} L${x} ${y + r * 2} L${x - r * 0.5} ${y + r * 0.5} L${x - r * 2} ${y} L${x - r * 0.5} ${y - r * 0.5} Z`, fill: '#fff', opacity: 0.85 }));
  return scene(defs, ...k);
}

function survivor(a, b) {
  const bg = id('svbg');
  const halo = id('svh');
  const ghost = id('svg');
  const cloak = id('svc');
  const moon = id('svm');
  const defs = [
    lg(bg, [[0, '#2b1650'], [0.55, '#1a0f33'], [1, '#090616']]),
    rg(halo, [[0, '#ffb35c', 0.6], [0.6, '#ff8a1f', 0.12], [1, '#ff8a1f', 0]]),
    lg(ghost, [[0, '#f4f1ff'], [1, '#b7aee6']]),
    lg(cloak, [[0, '#8a52e0'], [1, '#43207e']]),
    rg(moon, [[0, '#fff6d8'], [0.7, '#ffe39a'], [1, '#ffd36b', 0]]),
  ];
  const k = [s('rect', { width: 200, height: 280, fill: url(bg) })];
  k.push(s('circle', { cx: 158, cy: 46, r: 30, fill: url(moon) }), s('circle', { cx: 158, cy: 46, r: 20, fill: '#fff4cf' }));
  for (let i = 0; i < 22; i++) k.push(s('circle', { cx: (i * 71) % 200, cy: (i * 29) % 120, r: 0.9, fill: '#fff', opacity: 0.6 }));
  // hills and graves
  k.push(s('path', { d: 'M0 210 Q50 180 100 200 T200 190 V280 H0 Z', fill: '#140c27' }), s('path', { d: 'M0 236 Q60 214 120 232 T200 228 V280 H0 Z', fill: '#0c0718' }));
  for (const [x, y] of [[24, 200], [176, 196]]) k.push(s('path', { d: `M${x - 8} ${y + 14} v-12 a8 8 0 0 1 16 0 v12 Z`, fill: '#2a2140' }));
  // the hero with a glowing staff
  k.push(s('circle', { cx: 100, cy: 160, r: 74, fill: url(halo) }));
  k.push(s('path', { d: 'M100 118 Q130 136 126 196 H74 Q70 136 100 118 Z', fill: url(cloak) }), s('rect', { x: 76, y: 186, width: 48, height: 6, fill: '#ff8a1f' }));
  k.push(s('circle', { cx: 100, cy: 140, r: 15, fill: '#4b2590' }), s('ellipse', { cx: 101, cy: 143, rx: 10, ry: 9, fill: '#f6d2b5' }), s('circle', { cx: 97, cy: 142, r: 1.6, fill: '#1d1320' }), s('circle', { cx: 105, cy: 142, r: 1.6, fill: '#1d1320' }));
  k.push(s('line', { x1: 134, y1: 196, x2: 134, y2: 128, stroke: '#6b4a2b', 'stroke-width': 4, 'stroke-linecap': 'round' }), s('circle', { cx: 134, cy: 124, r: 9, fill: '#fff3c4' }), s('circle', { cx: 134, cy: 124, r: 16, fill: '#ffb35c', opacity: 0.35 }));
  // bolts flying out
  for (const [x, y, ang] of [[160, 100, -35], [60, 96, 210], [168, 170, 10]]) {
    k.push(s('line', { x1: 134, y1: 124, x2: x, y2: y, stroke: '#ffd27a', 'stroke-width': 2, opacity: 0.35 }), s('circle', { cx: x, cy: y, r: 5, fill: '#fff6d0' }), s('circle', { cx: x, cy: y, r: 10, fill: '#ffb35c', opacity: 0.35 }));
    void ang;
  }
  // ghosts closing in
  for (const [x, y, sc] of [[38, 120, 1], [172, 128, 0.85], [30, 196, 0.9], [176, 220, 1.05], [64, 64, 0.7]]) {
    k.push(s('path', { d: `M${x - 14 * sc} ${y} a${14 * sc} ${14 * sc} 0 0 1 ${28 * sc} 0 v${16 * sc} l-${4.6 * sc} -${4 * sc} l-${4.6 * sc} ${4 * sc} l-${4.6 * sc} -${4 * sc} l-${4.6 * sc} ${4 * sc} l-${4.6 * sc} -${4 * sc} l-${4.6 * sc} ${4 * sc} Z`, fill: url(ghost) }));
    k.push(s('ellipse', { cx: x - 5 * sc, cy: y + 1, rx: 2.6 * sc, ry: 3.4 * sc, fill: '#2a1640' }), s('ellipse', { cx: x + 5 * sc, cy: y + 1, rx: 2.6 * sc, ry: 3.4 * sc, fill: '#2a1640' }));
  }
  return scene(defs, ...k);
}

// isometric house for Tycoon art
function house(x, y, sc, wallL, wallR, roof) {
  return [
    s('path', { d: `M${x} ${y} l${-16 * sc} ${-9 * sc} v${-16 * sc} l${16 * sc} ${9 * sc} Z`, fill: wallL }),
    s('path', { d: `M${x} ${y} l${16 * sc} ${-9 * sc} v${-16 * sc} l${-16 * sc} ${9 * sc} Z`, fill: wallR }),
    s('path', { d: `M${x - 16 * sc} ${y - 25 * sc} l${16 * sc} ${-14 * sc} l${16 * sc} ${14 * sc} l${-16 * sc} ${9 * sc} Z`, fill: roof }),
    s('path', { d: `M${x + 5 * sc} ${y - 6 * sc} l${6 * sc} ${-3.5 * sc} v${-7 * sc} l${-6 * sc} ${3.5 * sc} Z`, fill: '#ffe9a8', opacity: 0.9 }),
  ];
}
function die(x, y, size, pips) {
  const k = [s('rect', { x, y, width: size, height: size, rx: size * 0.22, fill: '#fff' }), s('rect', { x, y: y + size * 0.78, width: size, height: size * 0.22, rx: size * 0.1, fill: '#d6dbe8' })];
  const at = { 1: [[0.5, 0.5]], 3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]], 5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]], 6: [[0.27, 0.22], [0.73, 0.22], [0.27, 0.5], [0.73, 0.5], [0.27, 0.78], [0.73, 0.78]] }[pips];
  for (const [px, py] of at) k.push(s('circle', { cx: x + px * size, cy: y + py * size * 0.92, r: size * 0.085, fill: pips === 1 ? '#e0344f' : '#1d2340' }));
  return k;
}

function estate(a, b) {
  const bg = id('esbg');
  const board = id('esb');
  const coin = id('esc');
  const defs = [lg(bg, [[0, '#103a3a'], [1, '#071a1d']]), lg(board, [[0, '#d8f5e6'], [1, '#a9dcc4']]), lg(coin, [[0, '#ffe680'], [1, '#e8a91a']])];
  const k = [s('rect', { width: 200, height: 280, fill: url(bg) })];
  k.push(s('circle', { cx: 100, cy: 140, r: 120, fill: a, opacity: 0.12 }));
  // isometric board corner
  const cx = 100;
  const cy = 150;
  k.push(s('path', { d: `M${cx} ${cy - 70} L${cx + 96} ${cy - 14} L${cx} ${cy + 42} L${cx - 96} ${cy - 14} Z`, fill: url(board) }));
  k.push(s('path', { d: `M${cx - 96} ${cy - 14} L${cx} ${cy + 42} v10 L${cx - 96} ${cy - 4} Z`, fill: '#6fae92' }), s('path', { d: `M${cx + 96} ${cy - 14} L${cx} ${cy + 42} v10 L${cx + 96} ${cy - 4} Z`, fill: '#4d8a70' }));
  // color bands along two edges
  const bands = ['#ef4b55', '#f4d03f', '#3fbf6a', '#4a6cf0', '#e86aa8', '#f39a3d'];
  for (let i = 0; i < 6; i++) {
    const t0 = i / 6;
    const t1 = (i + 0.9) / 6;
    const L = (t) => [cx - 96 + 96 * t, cy - 14 + 56 * t];
    const [x0, y0] = L(t0);
    const [x1, y1] = L(t1);
    k.push(s('path', { d: `M${x0} ${y0} L${x1} ${y1} l6 -3.5 L${x0 + 6} ${y0 - 3.5} Z`, fill: bands[i] }));
    const R = (t) => [cx + 96 - 96 * t, cy - 14 + 56 * t];
    const [u0, v0] = R(t0);
    const [u1, v1] = R(t1);
    k.push(s('path', { d: `M${u0} ${v0} L${u1} ${v1} l-6 -3.5 L${u0 - 6} ${v0 - 3.5} Z`, fill: bands[5 - i] }));
  }
  // houses and a hotel
  k.push(...house(70, 132, 1, '#2fa35a', '#1f7a40', '#4fd27c'));
  k.push(...house(92, 144, 0.9, '#2fa35a', '#1f7a40', '#4fd27c'));
  k.push(...house(138, 128, 1.25, '#d6334a', '#a51f33', '#ff6075'));
  // dice
  k.push(...die(54, 176, 30, 5), ...die(96, 190, 30, 6));
  // coins
  for (let i = 0; i < 4; i++) k.push(s('ellipse', { cx: 160, cy: 214 - i * 6, rx: 16, ry: 6, fill: url(coin), stroke: '#b07a0a', 'stroke-width': 1 }));
  k.push(s('text', { x: 160, y: 198, 'text-anchor': 'middle', 'font-size': 9, 'font-weight': 800, fill: '#7a5205', 'font-family': 'Poppins, sans-serif', text: '$' }));
  // rival tokens
  [['#4db4ff', 40], ['#ff5d73', 62], ['#3ee0a0', 150], ['#ffc83d', 172]].forEach(([c, x], i) => {
    const y = i < 2 ? 70 : 84;
    k.push(s('circle', { cx: x, cy: y, r: 11, fill: c }), s('circle', { cx: x, cy: y, r: 11, fill: 'none', stroke: '#fff', 'stroke-width': 2.5 }), s('circle', { cx: x - 3, cy: y - 3, r: 3, fill: '#fff', opacity: 0.6 }));
  });
  return scene(defs, ...k);
}

const MAKERS = { blockfit, survivor, estate };
export const gameArt = (g) => MAKERS[g.id](g.accent, g.accent2);
