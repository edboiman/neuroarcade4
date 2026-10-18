// Deep Delve artwork: hero, monsters, loot, stairs and stonework drawn with canvas paths,
// cached per tile size so redraws (which only happen after a move) stay cheap.
const TAU = Math.PI * 2;

function grad(g, x, y, r, a, b) {
  const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.1, x, y, r * 1.1);
  gr.addColorStop(0, a);
  gr.addColorStop(1, b);
  return gr;
}
function ink(g, w) {
  g.lineWidth = w;
  g.strokeStyle = 'rgba(6,8,14,.9)';
  g.stroke();
}

const DRAW = {
  hero(g, s) {
    // cloak
    g.beginPath();
    g.moveTo(s * 0.5, s * 0.2);
    g.quadraticCurveTo(s * 0.8, s * 0.42, s * 0.74, s * 0.9);
    g.lineTo(s * 0.26, s * 0.9);
    g.quadraticCurveTo(s * 0.2, s * 0.42, s * 0.5, s * 0.2);
    g.fillStyle = grad(g, s * 0.5, s * 0.55, s * 0.36, '#3fb27f', '#1d5e45');
    g.fill();
    ink(g, s * 0.04);
    // hood and face
    g.beginPath();
    g.arc(s * 0.5, s * 0.36, s * 0.17, 0, TAU);
    g.fillStyle = '#226b4e';
    g.fill();
    ink(g, s * 0.035);
    g.beginPath();
    g.ellipse(s * 0.5, s * 0.39, s * 0.11, s * 0.1, 0, 0, TAU);
    g.fillStyle = '#f2d0b2';
    g.fill();
    g.fillStyle = '#1b1416';
    g.beginPath();
    g.arc(s * 0.46, s * 0.38, s * 0.017, 0, TAU);
    g.arc(s * 0.54, s * 0.38, s * 0.017, 0, TAU);
    g.fill();
    // belt
    g.fillStyle = '#7a5230';
    g.fillRect(s * 0.3, s * 0.64, s * 0.4, s * 0.05);
    // lantern
    g.strokeStyle = '#3a2a1a';
    g.lineWidth = s * 0.03;
    g.beginPath();
    g.moveTo(s * 0.74, s * 0.52);
    g.lineTo(s * 0.8, s * 0.6);
    g.stroke();
    const lg = g.createRadialGradient(s * 0.82, s * 0.68, 0, s * 0.82, s * 0.68, s * 0.16);
    lg.addColorStop(0, '#fff6c8');
    lg.addColorStop(0.45, '#ffc83d');
    lg.addColorStop(1, 'rgba(255,170,40,0)');
    g.fillStyle = lg;
    g.beginPath();
    g.arc(s * 0.82, s * 0.68, s * 0.16, 0, TAU);
    g.fill();
    g.fillStyle = '#ffe9a0';
    g.fillRect(s * 0.78, s * 0.62, s * 0.08, s * 0.11);
    g.strokeStyle = '#4a3420';
    g.lineWidth = s * 0.018;
    g.strokeRect(s * 0.78, s * 0.62, s * 0.08, s * 0.11);
  },
  skeleton(g, s) {
    const c = s * 0.5;
    // ribs
    g.strokeStyle = '#d9d3c4';
    g.lineWidth = s * 0.05;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(c, s * 0.5);
    g.lineTo(c, s * 0.82);
    for (let k = 0; k < 3; k++) {
      g.moveTo(c - s * 0.14, s * (0.56 + k * 0.08));
      g.lineTo(c + s * 0.14, s * (0.56 + k * 0.08));
    }
    g.moveTo(c - s * 0.12, s * 0.82);
    g.lineTo(c - s * 0.16, s * 0.94);
    g.moveTo(c + s * 0.12, s * 0.82);
    g.lineTo(c + s * 0.16, s * 0.94);
    g.stroke();
    // sword
    g.strokeStyle = '#a9b4c2';
    g.lineWidth = s * 0.04;
    g.beginPath();
    g.moveTo(s * 0.78, s * 0.38);
    g.lineTo(s * 0.7, s * 0.74);
    g.stroke();
    // skull
    g.beginPath();
    g.arc(c, s * 0.33, s * 0.17, 0, TAU);
    g.fillStyle = grad(g, c, s * 0.33, s * 0.17, '#f4efe2', '#b8b0a0');
    g.fill();
    ink(g, s * 0.03);
    g.fillStyle = '#1b0f12';
    g.beginPath();
    g.arc(c - s * 0.065, s * 0.32, s * 0.045, 0, TAU);
    g.arc(c + s * 0.065, s * 0.32, s * 0.045, 0, TAU);
    g.fill();
    g.fillStyle = '#ff4d5e';
    g.beginPath();
    g.arc(c - s * 0.065, s * 0.32, s * 0.016, 0, TAU);
    g.arc(c + s * 0.065, s * 0.32, s * 0.016, 0, TAU);
    g.fill();
  },
  brute(g, s) {
    const c = s * 0.5;
    g.beginPath();
    g.roundRect(s * 0.16, s * 0.3, s * 0.68, s * 0.6, s * 0.16);
    g.fillStyle = grad(g, c, s * 0.55, s * 0.36, '#7fae5a', '#3f6a2a');
    g.fill();
    ink(g, s * 0.04);
    for (const sx of [-1, 1]) {
      g.beginPath();
      g.moveTo(c + sx * s * 0.2, s * 0.32);
      g.lineTo(c + sx * s * 0.3, s * 0.12);
      g.lineTo(c + sx * s * 0.1, s * 0.3);
      g.fillStyle = '#efe4c8';
      g.fill();
    }
    g.fillStyle = '#ffd34d';
    g.beginPath();
    g.arc(c - s * 0.11, s * 0.48, s * 0.05, 0, TAU);
    g.arc(c + s * 0.11, s * 0.48, s * 0.05, 0, TAU);
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,.8)';
    g.lineWidth = s * 0.04;
    g.beginPath();
    g.moveTo(c - s * 0.2, s * 0.39);
    g.lineTo(c - s * 0.04, s * 0.45);
    g.moveTo(c + s * 0.2, s * 0.39);
    g.lineTo(c + s * 0.04, s * 0.45);
    g.stroke();
    g.fillStyle = '#2a1410';
    g.fillRect(c - s * 0.13, s * 0.62, s * 0.26, s * 0.06);
    g.fillStyle = '#fff';
    g.fillRect(c - s * 0.1, s * 0.62, s * 0.04, s * 0.04);
    g.fillRect(c + s * 0.06, s * 0.62, s * 0.04, s * 0.04);
  },
  gem(g, s) {
    const c = s * 0.5;
    g.beginPath();
    g.moveTo(c - s * 0.24, s * 0.4);
    g.lineTo(c - s * 0.12, s * 0.24);
    g.lineTo(c + s * 0.12, s * 0.24);
    g.lineTo(c + s * 0.24, s * 0.4);
    g.lineTo(c, s * 0.78);
    g.closePath();
    g.fillStyle = '#2b9fe0';
    g.fill();
    ink(g, s * 0.03);
    g.beginPath();
    g.moveTo(c - s * 0.24, s * 0.4);
    g.lineTo(c + s * 0.24, s * 0.4);
    g.lineTo(c, s * 0.78);
    g.closePath();
    g.fillStyle = '#5cc8ff';
    g.fill();
    g.fillStyle = 'rgba(255,255,255,.9)';
    g.beginPath();
    g.moveTo(c - s * 0.1, s * 0.27);
    g.lineTo(c - s * 0.02, s * 0.27);
    g.lineTo(c - s * 0.08, s * 0.38);
    g.fill();
  },
  potion(g, s) {
    const c = s * 0.5;
    g.beginPath();
    g.arc(c, s * 0.6, s * 0.22, 0, TAU);
    g.fillStyle = grad(g, c, s * 0.6, s * 0.22, '#ff8fa0', '#c2183a');
    g.fill();
    ink(g, s * 0.03);
    g.fillStyle = '#d8e2ee';
    g.fillRect(c - s * 0.07, s * 0.24, s * 0.14, s * 0.16);
    g.fillStyle = '#8a5a2a';
    g.fillRect(c - s * 0.08, s * 0.2, s * 0.16, s * 0.07);
    g.fillStyle = 'rgba(255,255,255,.7)';
    g.beginPath();
    g.arc(c - s * 0.08, s * 0.54, s * 0.05, 0, TAU);
    g.fill();
  },
  stairs(g, s) {
    for (let k = 0; k < 4; k++) {
      const y = s * (0.18 + k * 0.18);
      const w = s * (0.76 - k * 0.1);
      g.fillStyle = k % 2 ? '#8b7a5e' : '#a8956f';
      g.fillRect((s - w) / 2, y, w, s * 0.15);
      g.fillStyle = 'rgba(0,0,0,.35)';
      g.fillRect((s - w) / 2, y + s * 0.12, w, s * 0.03);
    }
    const gl = g.createRadialGradient(s / 2, s * 0.9, 0, s / 2, s * 0.9, s * 0.5);
    gl.addColorStop(0, 'rgba(255,200,61,.55)');
    gl.addColorStop(1, 'rgba(255,200,61,0)');
    g.fillStyle = gl;
    g.fillRect(0, 0, s, s);
  },
  // floor: flagstones with a few cracks; variant picks the pattern
  floor(g, s, v) {
    g.fillStyle = '#39445e';
    g.fillRect(0, 0, s, s);
    g.fillStyle = v % 2 ? '#3d4964' : '#35405a';
    const h = s / 2;
    g.fillRect(1, 1, h - 2, h - 2);
    g.fillRect(h + 1, h + 1, h - 2, h - 2);
    g.fillStyle = v % 3 ? '#323c55' : '#3a4661';
    g.fillRect(h + 1, 1, h - 2, h - 2);
    g.fillRect(1, h + 1, h - 2, h - 2);
    if (v % 4 === 0) {
      g.strokeStyle = 'rgba(0,0,0,.35)';
      g.lineWidth = Math.max(1, s * 0.03);
      g.beginPath();
      g.moveTo(s * 0.2, s * 0.15);
      g.lineTo(s * 0.32, s * 0.3);
      g.lineTo(s * 0.28, s * 0.42);
      g.stroke();
    }
  },
  // wall: a raised block; variant 1 also shows the front face (open floor below it)
  wall(g, s, v) {
    g.fillStyle = '#1b2232';
    g.fillRect(0, 0, s, s);
    g.fillStyle = '#26304a';
    const rows = 3;
    for (let r = 0; r < rows; r++) {
      const off = r % 2 ? s / 4 : 0;
      for (let x = -off; x < s; x += s / 2) g.fillRect(x + 1, (r * s) / rows + 1, s / 2 - 2, s / rows - 2);
    }
    if (v === 1) {
      g.fillStyle = '#121826';
      g.fillRect(0, s * 0.72, s, s * 0.28);
      g.fillStyle = 'rgba(255,255,255,.06)';
      g.fillRect(0, s * 0.72, s, Math.max(1, s * 0.04));
    }
  },
};

export function createDungeonArt() {
  const cache = new Map();
  return {
    get(kind, px, v = 0) {
      px = Math.max(4, Math.round(px));
      const key = kind + '|' + px + '|' + v;
      let c = cache.get(key);
      if (!c) {
        c = document.createElement('canvas');
        c.width = c.height = px;
        DRAW[kind](c.getContext('2d'), px, v);
        cache.set(key, c);
      }
      return c;
    },
    clear: () => cache.clear(),
  };
}
