// Holiday Horde artwork. Every sprite is drawn with canvas paths once per size and theme, then cached,
// so the frame loop only copies small bitmaps. Each enemy role has its own silhouette; themes recolor them.

export const PALETTES = {
  halloween: {
    hero: { cloak: '#6b3fa0', cloak2: '#3d1f63', trim: '#ff8a1f', skin: '#f3d2b4', orb: '#ffb347' },
    grunt: ['#ece8ff', '#b6aee0'],
    swift: ['#4a3563', '#2a1d3a'],
    tank: ['#d8cfbf', '#9c927f'],
    swarm: ['#35263f', '#1d1424'],
    boss: ['#8c1838', '#4e0b1e'],
    eye: '#ffcc33',
    gem: ['#ff9d2e', '#c75a00'],
    shot: '#ffd27a',
    pet: ['#c9a27a', '#7c5a3a'],
    prop: ['#3b2552', '#5b3a2a', '#ff8a1f'],
  },
  harvest: {
    hero: { cloak: '#8a4b24', cloak2: '#53290f', trim: '#ffcf4d', skin: '#f1cfa8', orb: '#ffcf4d' },
    grunt: ['#9a8a7a', '#6b5d50'],
    swift: ['#c06a2b', '#7d3f14'],
    tank: ['#5e4a3a', '#3a2c21'],
    swarm: ['#7fa33a', '#4f6b1f'],
    boss: ['#5a3a22', '#331f10'],
    eye: '#ffe066',
    gem: ['#ffb347', '#c46a12'],
    shot: '#ffe08a',
    pet: ['#d9a35f', '#8b5a2b'],
    prop: ['#4b3418', '#6d5a24', '#e58b2a'],
  },
  winter: {
    hero: { cloak: '#c8283a', cloak2: '#7d1320', trim: '#f4f7ff', skin: '#f6d6bd', orb: '#bfe8ff' },
    grunt: ['#9fd0ff', '#5b93cc'],
    swift: ['#d9f1ff', '#9cc6e6'],
    tank: ['#7fc4e8', '#3f7ea3'],
    swarm: ['#e8f6ff', '#a8cde3'],
    boss: ['#f2f7ff', '#a9bcd6'],
    eye: '#1d3557',
    gem: ['#8fe3ff', '#2f8fc7'],
    shot: '#dff6ff',
    pet: ['#ffffff', '#b9c8db'],
    prop: ['#1d3a5e', '#2c5a3c', '#cfe9ff'],
  },
  valentine: {
    hero: { cloak: '#e0457b', cloak2: '#9c1f4c', trim: '#ffd1e0', skin: '#f6d3c0', orb: '#ff8fb3' },
    grunt: ['#ff9ec0', '#d45f89'],
    swift: ['#ff5f8f', '#b8285a'],
    tank: ['#c9406f', '#86203f'],
    swarm: ['#ffc2d6', '#e083a3'],
    boss: ['#a0174a', '#5c0a28'],
    eye: '#3a0b1c',
    gem: ['#ff6b9a', '#c22a5c'],
    shot: '#ffd6e5',
    pet: ['#ffe0ea', '#e79ab4'],
    prop: ['#4a1530', '#6a2346', '#ff7aa5'],
  },
  spring: {
    hero: { cloak: '#4fae5b', cloak2: '#2d6e35', trim: '#fff3a3', skin: '#f5d4b8', orb: '#fff3a3' },
    grunt: ['#b58ee0', '#7d58a8'],
    swift: ['#7ec8f0', '#3f8bb8'],
    tank: ['#8e7a62', '#5d4e3c'],
    swarm: ['#f2c94c', '#b8902a'],
    boss: ['#6c4aa0', '#3e2766'],
    eye: '#1f2a12',
    gem: ['#9be15d', '#4f9a2a'],
    shot: '#fffbd1',
    pet: ['#fff6c9', '#e0c56b'],
    prop: ['#20452a', '#3c6b33', '#ff9ed1'],
  },
  summer: {
    hero: { cloak: '#ff8a3d', cloak2: '#c45412', trim: '#fff', skin: '#e9b98f', orb: '#ffe066' },
    grunt: ['#3fc1c9', '#1f8a91'],
    swift: ['#f25f5c', '#b32f2c'],
    tank: ['#2b6cb0', '#174a80'],
    swarm: ['#ffd23f', '#c29a12'],
    boss: ['#0f4c75', '#072a42'],
    eye: '#10202b',
    gem: ['#4ee1ff', '#1a95c2'],
    shot: '#fffbe0',
    pet: ['#ffd1a6', '#e0905a'],
    prop: ['#0e3a4a', '#165a5e', '#ffd166'],
  },
};
export const paletteFor = (id) => PALETTES[id] || PALETTES.halloween;

const TAU = Math.PI * 2;

function shade(g, cx, cy, r, c1, c2) {
  const gr = g.createRadialGradient(cx - r * 0.35, cy - r * 0.45, r * 0.1, cx, cy, r * 1.15);
  gr.addColorStop(0, c1);
  gr.addColorStop(1, c2);
  return gr;
}
function eyes(g, cx, cy, gap, r, color, angry) {
  for (const sx of [-1, 1]) {
    g.fillStyle = '#fff';
    g.beginPath();
    g.ellipse(cx + sx * gap, cy, r, r * 1.15, 0, 0, TAU);
    g.fill();
    g.fillStyle = color;
    g.beginPath();
    g.arc(cx + sx * gap + r * 0.15, cy + r * 0.2, r * 0.55, 0, TAU);
    g.fill();
    if (angry) {
      g.strokeStyle = 'rgba(0,0,0,.75)';
      g.lineWidth = Math.max(1, r * 0.45);
      g.beginPath();
      g.moveTo(cx + sx * (gap + r * 1.1), cy - r * 1.5);
      g.lineTo(cx + sx * (gap - r * 0.9), cy - r * 0.9);
      g.stroke();
    }
  }
}
function outline(g, w) {
  g.lineWidth = w;
  g.strokeStyle = 'rgba(8,6,16,.85)';
  g.stroke();
}

const DRAW = {
  // round ghostly body with a wavy hem
  grunt(g, s, P) {
    const [a, b] = P.grunt;
    const cx = s / 2;
    const r = s * 0.36;
    g.beginPath();
    g.arc(cx, s * 0.44, r, Math.PI, 0);
    const bot = s * 0.86;
    g.lineTo(cx + r, bot);
    for (let i = 0; i < 4; i++) {
      const x0 = cx + r - (i * 2 * r) / 4;
      g.quadraticCurveTo(x0 - r / 4, bot - s * 0.1 * (i % 2 ? -0.2 : 1), x0 - r / 2, bot);
    }
    g.closePath();
    g.fillStyle = shade(g, cx, s * 0.5, r, a, b);
    g.fill();
    outline(g, s * 0.04);
    eyes(g, cx, s * 0.45, r * 0.38, r * 0.2, P.eye, true);
  },
  // small body, wide wings
  swift(g, s, P) {
    const [a, b] = P.swift;
    const cx = s / 2;
    const cy = s * 0.5;
    g.beginPath();
    g.moveTo(cx - s * 0.1, cy);
    g.quadraticCurveTo(cx - s * 0.35, cy - s * 0.32, cx - s * 0.48, cy - s * 0.05);
    g.quadraticCurveTo(cx - s * 0.36, cy - s * 0.02, cx - s * 0.32, cy + s * 0.12);
    g.quadraticCurveTo(cx - s * 0.24, cy + s * 0.02, cx - s * 0.1, cy + s * 0.12);
    g.closePath();
    g.moveTo(cx + s * 0.1, cy);
    g.quadraticCurveTo(cx + s * 0.35, cy - s * 0.32, cx + s * 0.48, cy - s * 0.05);
    g.quadraticCurveTo(cx + s * 0.36, cy - s * 0.02, cx + s * 0.32, cy + s * 0.12);
    g.quadraticCurveTo(cx + s * 0.24, cy + s * 0.02, cx + s * 0.1, cy + s * 0.12);
    g.closePath();
    g.fillStyle = b;
    g.fill();
    outline(g, s * 0.035);
    g.beginPath();
    g.arc(cx, cy, s * 0.19, 0, TAU);
    g.fillStyle = shade(g, cx, cy, s * 0.19, a, b);
    g.fill();
    outline(g, s * 0.04);
    eyes(g, cx, cy - s * 0.02, s * 0.075, s * 0.05, P.eye, true);
  },
  // heavy block with brows and fists
  tank(g, s, P) {
    const [a, b] = P.tank;
    const x = s * 0.18;
    const y = s * 0.2;
    const w = s * 0.64;
    const hh = s * 0.62;
    g.beginPath();
    g.roundRect(x, y, w, hh, s * 0.12);
    g.fillStyle = shade(g, s / 2, s / 2, s * 0.36, a, b);
    g.fill();
    outline(g, s * 0.04);
    for (const sx of [0.08, 0.92]) {
      g.beginPath();
      g.arc(s * sx, s * 0.62, s * 0.09, 0, TAU);
      g.fillStyle = b;
      g.fill();
      outline(g, s * 0.03);
    }
    g.strokeStyle = 'rgba(0,0,0,.28)';
    g.lineWidth = s * 0.025;
    g.beginPath();
    g.moveTo(s * 0.3, s * 0.7);
    g.lineTo(s * 0.4, s * 0.6);
    g.lineTo(s * 0.37, s * 0.52);
    g.stroke();
    eyes(g, s / 2, s * 0.42, s * 0.12, s * 0.065, P.eye, true);
    g.fillStyle = 'rgba(0,0,0,.55)';
    g.fillRect(s * 0.38, s * 0.6, s * 0.24, s * 0.05);
  },
  // spiky little swarmer
  swarm(g, s, P) {
    const [a, b] = P.swarm;
    const cx = s / 2;
    const cy = s / 2;
    g.beginPath();
    for (let i = 0; i < 16; i++) {
      const ang = (i / 16) * TAU;
      const rr = i % 2 ? s * 0.25 : s * 0.44;
      g.lineTo(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr);
    }
    g.closePath();
    g.fillStyle = b;
    g.fill();
    outline(g, s * 0.035);
    g.beginPath();
    g.arc(cx, cy, s * 0.24, 0, TAU);
    g.fillStyle = shade(g, cx, cy, s * 0.24, a, b);
    g.fill();
    eyes(g, cx, cy, s * 0.08, s * 0.055, '#e8213b', false);
  },
  // big horned blob with a crown and fangs
  boss(g, s, P) {
    const [a, b] = P.boss;
    const cx = s / 2;
    const cy = s * 0.56;
    const r = s * 0.34;
    for (const sx of [-1, 1]) {
      g.beginPath();
      g.moveTo(cx + sx * r * 0.55, cy - r * 0.7);
      g.quadraticCurveTo(cx + sx * r * 1.2, cy - r * 1.1, cx + sx * r * 1.05, cy - r * 1.55);
      g.quadraticCurveTo(cx + sx * r * 0.95, cy - r * 1.05, cx + sx * r * 0.25, cy - r * 0.85);
      g.closePath();
      g.fillStyle = '#efe6d2';
      g.fill();
      outline(g, s * 0.02);
    }
    g.beginPath();
    g.ellipse(cx, cy, r * 1.08, r, 0, 0, TAU);
    g.fillStyle = shade(g, cx, cy, r, a, b);
    g.fill();
    outline(g, s * 0.03);
    // crown
    g.beginPath();
    const cw = r * 0.9;
    const top = cy - r * 1.02;
    g.moveTo(cx - cw / 2, top + r * 0.2);
    g.lineTo(cx - cw / 2, top - r * 0.12);
    g.lineTo(cx - cw / 4, top + r * 0.06);
    g.lineTo(cx, top - r * 0.22);
    g.lineTo(cx + cw / 4, top + r * 0.06);
    g.lineTo(cx + cw / 2, top - r * 0.12);
    g.lineTo(cx + cw / 2, top + r * 0.2);
    g.closePath();
    g.fillStyle = '#ffd34d';
    g.fill();
    outline(g, s * 0.018);
    eyes(g, cx, cy - r * 0.15, r * 0.35, r * 0.17, P.eye, true);
    // mouth and fangs
    g.beginPath();
    g.ellipse(cx, cy + r * 0.38, r * 0.42, r * 0.16, 0, 0, Math.PI);
    g.fillStyle = '#1a0710';
    g.fill();
    g.fillStyle = '#fff';
    for (const sx of [-1, 1]) {
      g.beginPath();
      g.moveTo(cx + sx * r * 0.2, cy + r * 0.38);
      g.lineTo(cx + sx * r * 0.12, cy + r * 0.56);
      g.lineTo(cx + sx * r * 0.04, cy + r * 0.38);
      g.fill();
    }
  },
  // hooded hero with a glowing staff
  hero(g, s, P) {
    const H = P.hero;
    const cx = s * 0.46;
    // staff
    g.strokeStyle = '#6b4a2b';
    g.lineWidth = s * 0.05;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(s * 0.8, s * 0.9);
    g.lineTo(s * 0.8, s * 0.22);
    g.stroke();
    const og = g.createRadialGradient(s * 0.8, s * 0.17, 0, s * 0.8, s * 0.17, s * 0.14);
    og.addColorStop(0, '#fff');
    og.addColorStop(0.4, H.orb);
    og.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = og;
    g.beginPath();
    g.arc(s * 0.8, s * 0.17, s * 0.14, 0, TAU);
    g.fill();
    // cloak
    g.beginPath();
    g.moveTo(cx, s * 0.12);
    g.quadraticCurveTo(cx + s * 0.34, s * 0.3, cx + s * 0.3, s * 0.9);
    g.lineTo(cx - s * 0.3, s * 0.9);
    g.quadraticCurveTo(cx - s * 0.34, s * 0.3, cx, s * 0.12);
    g.fillStyle = shade(g, cx, s * 0.5, s * 0.36, H.cloak, H.cloak2);
    g.fill();
    outline(g, s * 0.035);
    // trim
    g.fillStyle = H.trim;
    g.fillRect(cx - s * 0.27, s * 0.8, s * 0.54, s * 0.06);
    // face in the hood
    g.beginPath();
    g.ellipse(cx, s * 0.36, s * 0.15, s * 0.14, 0, 0, TAU);
    g.fillStyle = '#1a1024';
    g.fill();
    g.beginPath();
    g.ellipse(cx + s * 0.02, s * 0.38, s * 0.11, s * 0.1, 0, 0, TAU);
    g.fillStyle = H.skin;
    g.fill();
    g.fillStyle = '#1d1320';
    for (const sx of [-1, 1]) {
      g.beginPath();
      g.arc(cx + s * 0.02 + sx * s * 0.045, s * 0.375, s * 0.018, 0, TAU);
      g.fill();
    }
  },
  // the companion: a small round owl-spirit
  pet(g, s, P) {
    const [a, b] = P.pet;
    const cx = s / 2;
    const cy = s * 0.54;
    for (const sx of [-1, 1]) {
      g.beginPath();
      g.ellipse(cx + sx * s * 0.3, cy, s * 0.16, s * 0.08, sx * 0.5, 0, TAU);
      g.fillStyle = b;
      g.fill();
      outline(g, s * 0.03);
    }
    g.beginPath();
    g.arc(cx, cy, s * 0.28, 0, TAU);
    g.fillStyle = shade(g, cx, cy, s * 0.28, a, b);
    g.fill();
    outline(g, s * 0.04);
    for (const sx of [-1, 1]) {
      g.beginPath();
      g.arc(cx + sx * s * 0.11, cy - s * 0.04, s * 0.1, 0, TAU);
      g.fillStyle = '#fff';
      g.fill();
      g.beginPath();
      g.arc(cx + sx * s * 0.11, cy - s * 0.03, s * 0.055, 0, TAU);
      g.fillStyle = '#111';
      g.fill();
    }
    g.beginPath();
    g.moveTo(cx - s * 0.04, cy + s * 0.06);
    g.lineTo(cx + s * 0.04, cy + s * 0.06);
    g.lineTo(cx, cy + s * 0.13);
    g.fillStyle = '#ffb02e';
    g.fill();
  },
  gem(g, s, P) {
    const [a, b] = P.gem;
    const cx = s / 2;
    const cy = s / 2;
    g.beginPath();
    g.moveTo(cx, s * 0.1);
    g.lineTo(cx + s * 0.32, cy);
    g.lineTo(cx, s * 0.9);
    g.lineTo(cx - s * 0.32, cy);
    g.closePath();
    g.fillStyle = b;
    g.fill();
    g.beginPath();
    g.moveTo(cx, s * 0.1);
    g.lineTo(cx + s * 0.32, cy);
    g.lineTo(cx, cy + s * 0.05);
    g.lineTo(cx - s * 0.32, cy);
    g.closePath();
    g.fillStyle = a;
    g.fill();
    g.fillStyle = 'rgba(255,255,255,.85)';
    g.beginPath();
    g.arc(cx - s * 0.08, s * 0.32, s * 0.06, 0, TAU);
    g.fill();
  },
  shot(g, s, P, pet) {
    const cx = s / 2;
    const gr = g.createRadialGradient(cx, cx, 0, cx, cx, s / 2);
    gr.addColorStop(0, '#fff');
    gr.addColorStop(0.3, pet ? '#9ff1ff' : P.shot);
    gr.addColorStop(0.62, pet ? 'rgba(80,200,255,.45)' : P.hero.orb + '88');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, s, s);
  },
  // scenery: grass tuft, pebble, or a small glowing flower in the theme accent
  prop(g, s, P, v) {
    const [dark, mid, accent] = P.prop;
    if (v === 0) {
      g.strokeStyle = mid;
      g.lineWidth = s * 0.07;
      g.lineCap = 'round';
      for (const k of [-0.18, 0, 0.18]) {
        g.beginPath();
        g.moveTo(s / 2 + k * s * 0.5, s * 0.85);
        g.quadraticCurveTo(s / 2 + k * s, s * 0.5, s / 2 + k * s * 1.5, s * 0.25);
        g.stroke();
      }
    } else if (v === 1) {
      g.fillStyle = dark;
      g.beginPath();
      g.ellipse(s / 2, s * 0.6, s * 0.3, s * 0.2, 0.2, 0, TAU);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,.08)';
      g.beginPath();
      g.ellipse(s * 0.44, s * 0.53, s * 0.14, s * 0.07, 0.2, 0, TAU);
      g.fill();
    } else {
      g.fillStyle = accent;
      for (let i = 0; i < 5; i++) {
        const ang = (i / 5) * TAU;
        g.beginPath();
        g.arc(s / 2 + Math.cos(ang) * s * 0.14, s / 2 + Math.sin(ang) * s * 0.14, s * 0.1, 0, TAU);
        g.fill();
      }
      g.fillStyle = '#fff6c0';
      g.beginPath();
      g.arc(s / 2, s / 2, s * 0.07, 0, TAU);
      g.fill();
    }
  },
};
export const SPRITE_KINDS = Object.keys(DRAW);

// Cached sprite factory. px is the bitmap size in device pixels.
export function createArt() {
  const cache = new Map();
  return {
    get(kind, themeId, px, variant = 0) {
      px = Math.max(4, Math.round(px));
      const key = kind + '|' + themeId + '|' + px + '|' + variant;
      let c = cache.get(key);
      if (!c) {
        c = document.createElement('canvas');
        c.width = c.height = px;
        const g = c.getContext('2d');
        DRAW[kind](g, px, paletteFor(themeId), variant);
        cache.set(key, c);
      }
      return c;
    },
    clear() {
      cache.clear();
    },
    get size() {
      return cache.size;
    },
  };
}
