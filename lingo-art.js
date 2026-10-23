// Lingo artwork, drawn as small SVG: people (customers, passengers, guests, family) and a backdrop per scenario.
// Built with the s() helper, so no markup strings are ever parsed.
import { s } from '../ui.js';

const SKIN = ['#f6d7c3', '#eac09e', '#d9a47a', '#b97c50', '#8d5a3b', '#5e3a26'];
const HAIR = ['#2b1d16', '#4a2f1f', '#7a4a28', '#c48a3a', '#e3c27a', '#9a9a9a', '#1f2430', '#a6322b'];
const SHIRT = ['#4db4ff', '#ff6b8b', '#35c48a', '#ffb347', '#8c7cff', '#e2e8f0', '#334155', '#f97316', '#14b8a6'];

function mulberry(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

// A friendly bust portrait. The wrapper gets class "av"; CSS shows the smile or the frown
// depending on the card's mood class, so the drawing never has to be rebuilt.
export function avatar(seed, { vip = false, uniform = null } = {}) {
  const r = mulberry(seed);
  const skin = pick(r, SKIN);
  const hair = pick(r, HAIR);
  const shirt = uniform || pick(r, SHIRT);
  const style = Math.floor(r() * 6);
  const glasses = r() < 0.22;
  const beard = style !== 1 && style !== 5 && r() < 0.18;
  const kids = [];
  // hair behind the head (long styles)
  if (style === 1) kids.push(s('path', { d: 'M17 30 Q17 12 32 12 Q47 12 47 30 L49 50 L15 50 Z', fill: hair }));
  if (style === 5) kids.push(s('path', { d: 'M44 22 Q56 26 52 44 Q48 36 44 32 Z', fill: hair }));
  // shoulders and neck
  kids.push(s('path', { d: 'M8 64 Q10 46 32 46 Q54 46 56 64 Z', fill: shirt }));
  kids.push(s('path', { d: 'M24 47 L32 54 L40 47', fill: 'none', stroke: 'rgba(0,0,0,.18)', 'stroke-width': 2 }));
  kids.push(s('rect', { x: 27.5, y: 38, width: 9, height: 10, rx: 3, fill: skin }));
  if (vip) kids.push(s('path', { d: 'M27 50 L32 53 L37 50 L37 55 L32 53 L27 55 Z', fill: '#ffd34d' }));
  // head and ears
  kids.push(s('circle', { cx: 18.5, cy: 30, r: 3.2, fill: skin }), s('circle', { cx: 45.5, cy: 30, r: 3.2, fill: skin }));
  kids.push(s('ellipse', { cx: 32, cy: 28, rx: 13.5, ry: 15, fill: skin }));
  // hair on top
  const top = {
    0: 'M18.5 26 Q19 13 32 13 Q45 13 45.5 26 Q40 19 32 19.5 Q24 19 18.5 26 Z',
    1: 'M18 30 Q17 12 32 12 Q47 12 46 30 Q44 18 32 18 Q21 18 18 30 Z',
    2: 'M18.5 25 Q20 13 32 13 Q44 13 45.5 25 Q38 18.5 32 19 Q26 18.5 18.5 25 Z',
    3: 'M18.6 29 Q18 22 21 20 L22 27 Z M45.4 29 Q46 22 43 20 L42 27 Z',
    4: '',
    5: 'M18.5 27 Q18 13 32 13 Q46 13 45.5 27 Q42 18 32 18 Q22 18 18.5 27 Z',
  }[style];
  if (top) kids.push(s('path', { d: top, fill: hair }));
  if (style === 2) kids.push(s('circle', { cx: 32, cy: 10, r: 5.5, fill: hair }));
  if (style === 4) for (const [x, y] of [[20, 22], [25, 16], [32, 14], [39, 16], [44, 22], [22.5, 18.5], [41.5, 18.5]]) kids.push(s('circle', { cx: x, cy: y, r: 5, fill: hair }));
  if (beard) kids.push(s('path', { d: 'M20 31 Q21 44 32 45 Q43 44 44 31 Q40 39 32 39 Q24 39 20 31 Z', fill: hair }));
  // face
  kids.push(s('circle', { cx: 26.5, cy: 29, r: 1.8, fill: '#1d1720' }), s('circle', { cx: 37.5, cy: 29, r: 1.8, fill: '#1d1720' }));
  kids.push(s('path', { d: 'M23.5 25 Q26.5 23.5 29 25 M35 25 Q37.5 23.5 40.5 25', stroke: 'rgba(0,0,0,.45)', 'stroke-width': 1.3, fill: 'none', 'stroke-linecap': 'round' }));
  if (glasses) kids.push(s('path', { d: 'M22.5 29 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M33.5 29 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M30.5 29 L33.5 29', stroke: '#2b2f3a', 'stroke-width': 1.3, fill: 'rgba(255,255,255,.12)' }));
  kids.push(s('circle', { cx: 23.5, cy: 34, r: 2.2, fill: 'rgba(255,120,120,.25)' }), s('circle', { cx: 40.5, cy: 34, r: 2.2, fill: 'rgba(255,120,120,.25)' }));
  kids.push(s('path', { class: 'av-smile', d: 'M27 35 Q32 39.5 37 35', stroke: '#6b2b2b', 'stroke-width': 1.8, fill: 'none', 'stroke-linecap': 'round' }));
  kids.push(s('path', { class: 'av-frown', d: 'M27.5 38 Q32 34.5 36.5 38', stroke: '#6b2b2b', 'stroke-width': 1.8, fill: 'none', 'stroke-linecap': 'round' }));
  return s('svg', { class: 'av', viewBox: '0 0 64 64', 'aria-hidden': 'true' }, ...kids);
}

// ----- scenario backdrops: a strip of scenery above the floor, 400 x 84 units -----
function rects(list, attrs) {
  return list.map(([x, y, w, h]) => s('rect', { x, y, width: w, height: h, ...attrs }));
}

const BACKDROPS = {
  cafe() {
    const k = [];
    k.push(s('rect', { x: 0, y: 0, width: 400, height: 84, fill: '#2a1e2e' }));
    for (let i = 0; i < 20; i++) k.push(s('path', { d: `M${i * 20} 0 h20 v18 q-10 10 -20 0 Z`, fill: i % 2 ? '#f4efe6' : '#b4475d' }));
    for (const x of [70, 200, 330]) {
      k.push(s('line', { x1: x, y1: 18, x2: x, y2: 40, stroke: '#7a6a5a', 'stroke-width': 1.5 }));
      k.push(s('path', { d: `M${x - 12} 52 Q${x} 34 ${x + 12} 52 Z`, fill: '#e8b04a' }));
      k.push(s('ellipse', { cx: x, cy: 56, rx: 16, ry: 5, fill: 'rgba(255,214,120,.25)' }));
    }
    k.push(s('rect', { x: 120, y: 28, width: 46, height: 40, rx: 3, fill: '#1c2a22', stroke: '#6b4f2e', 'stroke-width': 3 }));
    k.push(...rects([[127, 36, 30, 2], [127, 43, 24, 2], [127, 50, 28, 2], [127, 57, 20, 2]], { fill: 'rgba(255,255,255,.55)' }));
    k.push(s('rect', { x: 0, y: 76, width: 400, height: 8, fill: '#5a3d2b' }));
    return k;
  },
  shop() {
    const k = [s('rect', { x: 0, y: 0, width: 400, height: 84, fill: '#2b1d2c' })];
    k.push(s('rect', { x: 0, y: 14, width: 400, height: 3, fill: '#b9b2c4' }));
    const cols = ['#ff6b8b', '#4db4ff', '#ffd36b', '#35c48a', '#c58bff', '#f97316'];
    for (let i = 0; i < 13; i++) {
      const x = 14 + i * 30;
      const c = cols[i % cols.length];
      k.push(s('path', { d: `M${x + 8} 15 q0 -4 3 -4 M${x + 11} 15 L${x} 22 L${x + 22} 22 Z`, stroke: '#cfd3dc', 'stroke-width': 1.2, fill: 'none' }));
      if (i % 3 === 1) k.push(s('path', { d: `M${x} 22 L${x + 22} 22 L${x + 20} 58 L${x + 2} 58 Z`, fill: c }));
      else k.push(s('path', { d: `M${x - 3} 26 L${x + 4} 21 L${x + 18} 21 L${x + 25} 26 L${x + 21} 31 L${x + 19} 29 L${x + 19} 50 L${x + 3} 50 L${x + 3} 29 L${x + 1} 31 Z`, fill: c }));
    }
    k.push(s('rect', { x: 0, y: 68, width: 400, height: 16, fill: '#3d2a3e' }), s('rect', { x: 0, y: 66, width: 400, height: 3, fill: '#ff8fb3' }));
    return k;
  },
  home() {
    const k = [s('rect', { x: 0, y: 0, width: 400, height: 84, fill: '#3a2f22' })];
    for (let x = 0; x < 400; x += 16) k.push(s('rect', { x, y: 0, width: 8, height: 70, fill: 'rgba(255,220,150,.05)' }));
    k.push(s('rect', { x: 40, y: 10, width: 70, height: 50, rx: 3, fill: '#8fc8ff', stroke: '#f0e6d2', 'stroke-width': 4 }));
    k.push(s('path', { d: 'M75 10 V60 M40 35 H110', stroke: '#f0e6d2', 'stroke-width': 3 }));
    k.push(s('path', { d: 'M34 8 Q48 34 40 62 L34 62 Z M116 8 Q102 34 110 62 L116 62 Z', fill: '#c9533e' }));
    k.push(s('rect', { x: 180, y: 16, width: 54, height: 38, fill: '#2d4a3e', stroke: '#c9a24a', 'stroke-width': 3 }));
    k.push(s('path', { d: 'M184 50 L200 32 L212 44 L220 36 L230 50 Z', fill: '#6fbf73' }), s('circle', { cx: 222, cy: 25, r: 4, fill: '#ffd36b' }));
    k.push(s('path', { d: 'M300 70 L304 40 L326 40 L330 70 Z', fill: '#b86a3c' }));
    for (const [dx, dy] of [[-10, -6], [0, -14], [10, -6], [-4, -20], [6, -20]]) k.push(s('ellipse', { cx: 315 + dx, cy: 36 + dy, rx: 8, ry: 4, fill: '#3fa34d', transform: `rotate(${dx * 3} ${315 + dx} ${36 + dy})` }));
    k.push(s('rect', { x: 0, y: 70, width: 400, height: 14, fill: '#6b4a2e' }));
    return k;
  },
  travel() {
    const k = [s('rect', { x: 0, y: 0, width: 400, height: 84, fill: '#16242c' })];
    k.push(s('rect', { x: 14, y: 8, width: 250, height: 62, rx: 4, fill: '#0b0f14', stroke: '#2f3d48', 'stroke-width': 2 }));
    const rows = [['MADRID', '10:45', '2'], ['PARIS', '11:10', '5'], ['BERLIN', '11:32', '3'], ['ROMA', '12:05', '7']];
    rows.forEach(([city, time, plat], i) => {
      const y = 22 + i * 13;
      k.push(s('text', { x: 24, y, fill: '#ffd34d', 'font-size': 10, 'font-family': 'monospace', text: city }));
      k.push(s('text', { x: 150, y, fill: '#ffd34d', 'font-size': 10, 'font-family': 'monospace', text: time }));
      k.push(s('text', { x: 230, y, fill: '#7ee0b0', 'font-size': 10, 'font-family': 'monospace', text: plat }));
    });
    k.push(s('circle', { cx: 330, cy: 34, r: 24, fill: '#f4f1e8', stroke: '#2f3d48', 'stroke-width': 4 }));
    k.push(s('path', { d: 'M330 34 L330 18 M330 34 L342 40', stroke: '#16242c', 'stroke-width': 3, 'stroke-linecap': 'round' }));
    k.push(s('rect', { x: 0, y: 74, width: 400, height: 10, fill: '#35e6a0', opacity: 0.35 }));
    return k;
  },
  flight() {
    const k = [s('rect', { x: 0, y: 0, width: 400, height: 84, fill: '#dfe6ef' })];
    // overhead bins
    for (let i = 0; i < 5; i++) {
      const x = 6 + i * 79;
      k.push(s('rect', { x, y: 2, width: 74, height: 30, rx: 8, fill: '#f6f8fb', stroke: '#b8c3d1', 'stroke-width': 1.5 }));
      k.push(s('rect', { x: x + 30, y: 24, width: 14, height: 4, rx: 2, fill: '#8a97a8' }));
    }
    // call lights and vents
    for (let i = 0; i < 5; i++) {
      const x = 22 + i * 79;
      k.push(s('circle', { cx: x, cy: 38, r: 3, fill: '#c3ccd8' }), s('circle', { cx: x + 12, cy: 38, r: 3, fill: i === 2 ? '#ffb02e' : '#c3ccd8' }));
    }
    // windows
    k.push(s('rect', { x: 0, y: 46, width: 400, height: 38, fill: '#cfd8e3' }));
    for (let i = 0; i < 8; i++) {
      const x = 14 + i * 50;
      k.push(s('rect', { x, y: 52, width: 24, height: 28, rx: 11, fill: '#7cc4ff', stroke: '#9aa6b5', 'stroke-width': 3 }));
      k.push(s('path', { d: `M${x + 3} 70 Q${x + 12} 62 ${x + 21} 68 L${x + 21} 76 L${x + 3} 76 Z`, fill: '#ffffff', opacity: 0.8 }));
    }
    return k;
  },
  hotel() {
    const k = [s('rect', { x: 0, y: 0, width: 400, height: 84, fill: '#2a2018' })];
    for (let x = 0; x < 400; x += 25) k.push(s('rect', { x, y: 0, width: 1.5, height: 66, fill: 'rgba(255,215,140,.12)' }));
    k.push(s('rect', { x: 200, y: 8, width: 150, height: 50, rx: 4, fill: '#4a3424', stroke: '#c9962b', 'stroke-width': 2 }));
    for (let r = 0; r < 2; r++)
      for (let c = 0; c < 6; c++) {
        const x = 214 + c * 22;
        const y = 20 + r * 22;
        k.push(s('circle', { cx: x, cy: y, r: 2, fill: '#c9962b' }));
        if ((r * 6 + c) % 3 !== 1) k.push(s('path', { d: `M${x} ${y + 1} v8 h4 M${x} ${y + 6} h3`, stroke: '#ffd36b', 'stroke-width': 2, fill: 'none' }), s('rect', { x: x - 3, y: y + 9, width: 7, height: 5, rx: 1, fill: '#b23a3a' }));
      }
    k.push(s('text', { x: 40, y: 40, fill: '#ffd36b', 'font-size': 18, 'font-weight': 700, 'letter-spacing': 3, text: 'HOTEL' }));
    k.push(s('rect', { x: 0, y: 64, width: 400, height: 20, fill: '#5a3a24' }), s('rect', { x: 0, y: 62, width: 400, height: 3, fill: '#c9962b' }));
    k.push(s('path', { d: 'M150 62 a9 9 0 0 1 18 0 Z', fill: '#ffd36b' }), s('rect', { x: 147, y: 61, width: 24, height: 3, fill: '#c9962b' }));
    return k;
  },
};

export function backdrop(sceneId) {
  const draw = BACKDROPS[sceneId] || BACKDROPS.cafe;
  return s('svg', { class: 'cf-backdrop', viewBox: '0 0 400 84', preserveAspectRatio: 'xMidYMid slice', 'aria-hidden': 'true' }, ...draw());
}
