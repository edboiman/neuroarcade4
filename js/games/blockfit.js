// Block Fit: touch UI for the rules engine in blockfit-core.js.
import * as core from './blockfit-core.js';
import { restore, saveRun } from '../checkpoint.js';
import { validBlocks } from '../game-validation.js';
import { h, icon, haptic } from '../ui.js';
import { createLoop } from '../loop.js';
import { gameTop, hud, overlay, mmss } from './common.js';

const COLORS = [null, '#38e1ff', '#ffd23f', '#b388ff', '#5af78e', '#ff5d73', '#5b8cff', '#ff9f43'];

export function mount(root, ctx) {
  const old=ctx.resume?restore(ctx.store.loadGame('blockfit'),validBlocks):null;
  const g = old ? old.state : core.createGame(ctx.seed ?? (Date.now() & 0x7fffffff));
  const save=()=>saveRun(ctx.store,'blockfit',g,{mode:ctx.mode});
  let lastSavePiece=-1;
  let state = 'ready'; // ready | play | paused | over
  let dirty = true;
  let lastSig = '';
  let cell = 20;
  let pad = 4;
  let cssW = 300;
  let cssH = 500;
  let dpr = 1;
  let bannerTimer = 0;
  let pauseOv = null;

  const score = hud('Score');
  const level = hud('Level', '1');
  const time = hud('Left', mmss(core.TIME_LIMIT_MS));
  const top = gameTop({
    title: 'Block Fit',
    onMenu: () => openPause(),
    right: h('div', { class: 'hud-row' }, score.el, level.el, time.el),
  });

  const canvas = h('canvas', { class: 'bf-canvas', 'aria-label': 'Block Fit board' });
  const c2 = canvas.getContext('2d');
  const banner = h('div', { class: 'bf-banner', role: 'status', 'aria-live': 'polite' });
  const wrap = h('div', { class: 'bf-wrap' }, canvas, banner);

  const btn = (name, label, extra = {}) => h('button', { class: 'ctl', type: 'button', 'aria-label': label, ...extra }, icon(name, 28));
  const bHold = btn('hold', 'Hold shape');
  const bLeft = btn('left', 'Move left');
  const bRot = btn('rotate', 'Rotate');
  const bRight = btn('right', 'Move right');
  const bDrop = btn('down', 'Drop');
  const controls = h('div', { class: 'bf-controls' }, bHold, bLeft, bRot, bRight, bDrop);

  const el = h('div', { class: 'bf' }, top, wrap, controls);
  root.append(el);

  // ----- layout -----
  function layout() {
    const W = wrap.clientWidth || 320;
    const H = wrap.clientHeight || 520;
    cell = Math.max(10, Math.floor(Math.min(W / 10.4, H / 21.9)));
    pad = Math.max(3, Math.round(cell * 0.2));
    cssW = cell * core.COLS + pad * 2;
    cssH = Math.round(cell * 1.5) + pad * 2 + cell * core.ROWS;
    dpr = ctx.dpr();
    canvas.style.setProperty('width', cssW + 'px');
    canvas.style.setProperty('height', cssH + 'px');
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    blockCache.clear();
    dirty = true;
  }

  // ----- drawing -----
  // blocks: a bevelled, glossy tile drawn once per color and size, then copied
  const blockCache = new Map();
  function blockSprite(color, size) {
    const px = Math.max(4, Math.round(size * dpr));
    const key = color + '|' + px;
    let c = blockCache.get(key);
    if (c) return c;
    c = document.createElement('canvas');
    c.width = c.height = px;
    const g2 = c.getContext('2d');
    const r = px * 0.18;
    const inset = Math.max(1, px * 0.04);
    g2.beginPath();
    g2.roundRect(inset, inset, px - inset * 2, px - inset * 2, r);
    const body = g2.createLinearGradient(0, 0, px, px);
    body.addColorStop(0, color);
    body.addColorStop(1, color);
    g2.fillStyle = body;
    g2.fill();
    // light from the top left, shade to the bottom right
    const sh = g2.createLinearGradient(0, 0, px, px);
    sh.addColorStop(0, 'rgba(255,255,255,.38)');
    sh.addColorStop(0.45, 'rgba(255,255,255,0)');
    sh.addColorStop(1, 'rgba(0,0,0,.32)');
    g2.fillStyle = sh;
    g2.fill();
    // inner face
    g2.beginPath();
    g2.roundRect(px * 0.22, px * 0.22, px * 0.56, px * 0.56, r * 0.6);
    g2.fillStyle = 'rgba(255,255,255,.12)';
    g2.fill();
    // gloss
    g2.beginPath();
    g2.ellipse(px * 0.36, px * 0.27, px * 0.18, px * 0.08, -0.5, 0, Math.PI * 2);
    g2.fillStyle = 'rgba(255,255,255,.45)';
    g2.fill();
    g2.lineWidth = Math.max(1, px * 0.05);
    g2.strokeStyle = 'rgba(0,0,0,.35)';
    g2.beginPath();
    g2.roundRect(inset, inset, px - inset * 2, px - inset * 2, r);
    g2.stroke();
    blockCache.set(key, c);
    return c;
  }
  function drawCell(x, y, size, color, alpha = 1) {
    c2.globalAlpha = alpha;
    c2.drawImage(blockSprite(color, size), x, y, size, size);
    c2.globalAlpha = 1;
  }
  // short-lived effects: row flashes, lock glows and floating points. Purely visual, outside the rules.
  const fxList = [];
  function drawMini(type, bx, by, bw, bh, dim) {
    const { cells, size } = core.pieceShape(type);
    const m = cell * 0.36;
    const xs = cells.map((c) => c[0]);
    const ys = cells.map((c) => c[1]);
    const w = (Math.max(...xs) - Math.min(...xs) + 1) * m;
    const hgt = (Math.max(...ys) - Math.min(...ys) + 1) * m;
    const ox = bx + (bw - w) / 2 - Math.min(...xs) * m;
    const oy = by + (bh - hgt) / 2 - Math.min(...ys) * m;
    for (const [cx, cy] of cells) drawCell(ox + cx * m, oy + cy * m, m, COLORS[core.COLOR_INDEX[type]], dim ? 0.35 : 1);
    void size;
  }
  function draw() {
    c2.setTransform(dpr, 0, 0, dpr, 0, 0);
    c2.clearRect(0, 0, cssW, cssH);
    const stripH = Math.round(cell * 1.5);
    const boardTop = stripH + pad;
    // strip: hold on the left, next three on the right
    const boxH = stripH - 2;
    c2.fillStyle = 'rgba(255,255,255,0.06)';
    const holdW = cell * 2.4;
    c2.fillRect(pad, 1, holdW, boxH);
    if (g.hold) drawMini(g.hold, pad, 1, holdW, boxH, !g.canHold);
    else {
      c2.fillStyle = 'rgba(255,255,255,0.35)';
      c2.font = `600 ${Math.round(cell * 0.4)}px system-ui, sans-serif`;
      c2.textAlign = 'center';
      c2.fillText('Hold', pad + holdW / 2, 1 + boxH / 2 + cell * 0.14);
    }
    const nextW = cell * 2.1;
    const hideNext = g.twist && g.twist.kind === 'nonext';
    for (let i = 0; i < 3; i++) {
      const bx = pad + cell * core.COLS - (3 - i) * (nextW + 4) + 4;
      c2.fillStyle = 'rgba(255,255,255,0.06)';
      c2.fillRect(bx, 1, nextW, boxH);
      if (hideNext) {
        c2.fillStyle = 'rgba(255,255,255,0.4)';
        c2.font = `700 ${Math.round(cell * 0.7)}px system-ui, sans-serif`;
        c2.textAlign = 'center';
        c2.fillText('?', bx + nextW / 2, 1 + boxH / 2 + cell * 0.25);
      } else drawMini(g.queue[i], bx, 1, nextW, boxH, false);
    }
    // board
    const bx0 = pad;
    const well = c2.createLinearGradient(0, boardTop, 0, boardTop + cell * core.ROWS);
    well.addColorStop(0, '#0d1220');
    well.addColorStop(1, '#151b2e');
    c2.fillStyle = well;
    c2.fillRect(bx0, boardTop, cell * core.COLS, cell * core.ROWS);
    c2.fillStyle = 'rgba(255,255,255,0.05)';
    for (let x = 1; x < core.COLS; x++) c2.fillRect(bx0 + x * cell, boardTop, 1, cell * core.ROWS);
    for (let y = 1; y < core.ROWS; y++) c2.fillRect(bx0, boardTop + y * cell, cell * core.COLS, 1);
    for (let y = 0; y < core.ROWS; y++) {
      for (let x = 0; x < core.COLS; x++) {
        const v = g.board[y][x];
        if (v) drawCell(bx0 + x * cell, boardTop + y * cell, cell, COLORS[v]);
      }
    }
    if (!g.over) {
      const col = COLORS[core.COLOR_INDEX[g.cur.t]];
      if (!(g.twist && g.twist.kind === 'noghost')) {
        const gy = core.ghostY(g);
        // landing guide: a soft band down the columns the piece covers
        const xs = g.cur.cells.map(([cx]) => g.cur.x + cx);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        c2.fillStyle = 'rgba(255,255,255,.035)';
        c2.fillRect(bx0 + minX * cell, boardTop, (maxX - minX + 1) * cell, cell * core.ROWS);
        // ghost: tinted fill plus a bright outline, easy to read on any color
        for (const [cx, cy] of g.cur.cells) {
          const yy = gy + cy;
          if (yy < 0) continue;
          const gx = bx0 + (g.cur.x + cx) * cell;
          const gyy = boardTop + yy * cell;
          c2.globalAlpha = 0.18;
          c2.fillStyle = col;
          c2.fillRect(gx + 2, gyy + 2, cell - 4, cell - 4);
          c2.globalAlpha = 0.85;
          c2.strokeStyle = col;
          c2.lineWidth = 2;
          c2.setLineDash([4, 3]);
          c2.strokeRect(gx + 2.5, gyy + 2.5, cell - 5, cell - 5);
          c2.setLineDash([]);
        }
        c2.globalAlpha = 1;
      }
      for (const [x, y] of core.absCells(g.cur)) if (y >= 0) drawCell(bx0 + x * cell, boardTop + y * cell, cell, col);
    }
    // effects
    const now = performance.now();
    for (let i = fxList.length - 1; i >= 0; i--) {
      const f = fxList[i];
      const p = (now - f.t0) / f.life;
      if (p >= 1) {
        fxList.splice(i, 1);
        continue;
      }
      if (f.kind === 'row') {
        const y = boardTop + f.row * cell;
        c2.globalAlpha = (1 - p) * 0.85;
        c2.fillStyle = '#fff';
        c2.fillRect(bx0, y + cell * 0.5 * p, cell * core.COLS, cell * (1 - p));
        for (let k = 0; k < 6; k++) {
          const sx = bx0 + ((k * 37 + f.row * 11) % core.COLS) * cell + cell / 2;
          c2.fillStyle = f.color;
          c2.fillRect(sx + (k % 2 ? 1 : -1) * p * cell * 1.5, y + cell / 2 - p * cell * (1 + (k % 3)), 4, 4);
        }
      } else if (f.kind === 'lock') {
        c2.globalAlpha = (1 - p) * 0.6;
        c2.strokeStyle = '#fff';
        c2.lineWidth = 2;
        for (const [x, y] of f.cells) c2.strokeRect(bx0 + x * cell + 1, boardTop + y * cell + 1, cell - 2, cell - 2);
      } else if (f.kind === 'text') {
        c2.globalAlpha = p < 0.7 ? 1 : (1 - p) / 0.3;
        c2.font = `800 ${Math.round(cell * (f.big ? 0.95 : 0.75))}px system-ui, sans-serif`;
        c2.textAlign = 'center';
        c2.lineWidth = 4;
        c2.strokeStyle = 'rgba(0,0,0,.6)';
        const ty = boardTop + f.row * cell - p * cell * 1.6;
        c2.strokeText(f.text, bx0 + (cell * core.COLS) / 2, ty);
        c2.fillStyle = f.color;
        c2.fillText(f.text, bx0 + (cell * core.COLS) / 2, ty);
      }
      c2.globalAlpha = 1;
    }
    // twist frame
    if (g.twist) {
      c2.strokeStyle = '#ff5878';
      c2.lineWidth = 3;
      c2.strokeRect(bx0 + 1.5, boardTop + 1.5, cell * core.COLS - 3, cell * core.ROWS - 3);
    }
  }

  // ----- feedback -----
  function say(text, ms = 2200, kind = '') {
    banner.textContent = text;
    banner.className = 'bf-banner show ' + kind;
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => banner.classList.remove('show'), ms);
  }
  function handleEvents() {
    while (g.events.length) {
      const e = g.events.shift();
      if (e.type === 'lock') {
        fxList.push({ kind: 'lock', cells: e.cells, t0: performance.now(), life: 260 });
      } else if (e.type === 'clear') {
        const t0 = performance.now();
        for (const r of e.rows || []) fxList.push({ kind: 'row', row: r, color: COLORS[1 + (r % (COLORS.length - 1))] || '#fff', t0, life: 420 });
        const mid = (e.rows && e.rows.length ? e.rows.reduce((a, b) => a + b, 0) / e.rows.length : core.ROWS / 2) + 0.5;
        fxList.push({ kind: 'text', text: '+' + (e.pts || 0).toLocaleString(), row: mid, color: '#ffe27a', t0, life: 900, big: e.n >= 3 });
        if (e.combo > 1) fxList.push({ kind: 'text', text: `Combo ×${e.combo}`, row: mid - 1.1, color: '#7ee0ff', t0: t0 + 80, life: 900 });
        say(['', 'Single', 'Double', 'Triple', 'Four rows'][e.n] + (e.combo > 1 ? `  ·  combo ×${e.combo}` : ''), 900);
        ctx.audio.good();
        haptic(e.n * 12);
      } else if (e.type === 'twist') {
        say(core.TWIST_TEXT[e.kind], 3200, 'twist');
        ctx.audio.beep(300, 160, 0.1, 'sawtooth');
        haptic([30]);
      } else if (e.type === 'twistEnd') {
        say('Back to normal', 1400);
      }
    }
  }

  // ----- game state -----
  function frame(dt) {
    if (state !== 'play') return;
    core.tick(g, dt * 1000);
    handleEvents();
    const sig = g.cur.x + ',' + g.cur.y + ',' + g.pieces + ',' + g.cur.cells.join(';') + ',' + (g.hold || '') + g.twist?.kind;
    if (dirty || sig !== lastSig || fxList.length) {
      lastSig = sig;
      dirty = false;
      draw();
    }
    score.set(g.score.toLocaleString());
    level.set(g.level);
    time.set(mmss(core.TIME_LIMIT_MS - g.elapsed));
    if(g.pieces!==lastSavePiece){lastSavePiece=g.pieces;save();}
    if (g.over) end();
  }
  const loop = createLoop(frame, ctx.fps);

  function start() {
    state = 'play'; ctx.playing(true);
    loop.start();
    dirty = true; save();
  }
  function end() {
    if (state === 'over') return;
    state = 'over'; ctx.playing(false);
    loop.stop();
    draw();
    ctx.store.clearGame('blockfit');
    ctx.finish({
      score: g.score,
      level: g.level,
      completed: g.reason === 'time' || g.pieces >= 25,
      extra: [`Rows cleared: ${g.lines}`, `Best combo: ×${g.bestCombo || 0}`, `Twists handled: ${g.twistsSeen}`, g.reason === 'topout' ? 'The stack reached the top' : 'Time ran out'],
    });
  }
  function openPause() {
    if (state !== 'play' || pauseOv) return;
    state = 'paused'; ctx.playing(false);
    g.soft=false;save();
    loop.stop();
    pauseOv = overlay(el, {
      title: 'Paused',
      body: h('p', null, 'The clock is stopped.'),
      buttons: [
        { label: 'Save & leave', onclick: () => {save();ctx.exit();} },
        {
          label: 'Resume',
          kind: 'primary',
          onclick: () => {
            pauseOv = null;
            state = 'play'; ctx.playing(true);
            loop.start();
          },
        },
      ],
    });
  }

  // ----- input -----
  const act = (fn) => (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (state !== 'play') return;
    fn();
    dirty = true;
  };
  function repeat(button, fn) {
    let t1 = 0;
    let t2 = 0;
    const stop = () => {
      clearTimeout(t1);
      clearInterval(t2);
    };
    button.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (state !== 'play') return;
      fn();
      dirty = true;
      stop();
      t1 = setTimeout(() => {
        t2 = setInterval(() => {
          if (state === 'play') {
            fn();
            dirty = true;
          }
        }, 55);
      }, 170);
    });
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) button.addEventListener(ev, stop);
    return stop;
  }
  const stopL = repeat(bLeft, () => core.move(g, -1));
  const stopR = repeat(bRight, () => core.move(g, 1));
  bRot.addEventListener('pointerdown', act(() => core.rotate(g, 1)));
  bHold.addEventListener('pointerdown', act(() => core.holdPiece(g)));
  bDrop.addEventListener('pointerdown', act(() => { core.hardDrop(g); haptic(14); }));

  let gp = null;
  canvas.addEventListener('pointerdown', (e) => {
    if (state !== 'play') return;
    canvas.setPointerCapture(e.pointerId);
    gp = { x: e.clientX, y: e.clientY, lx: e.clientX, t: performance.now(), moved: false, acc: 0 };
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!gp || state !== 'play') return;
    gp.acc += e.clientX - gp.lx;
    gp.lx = e.clientX;
    const step = cell * 0.85;
    while (gp.acc >= step) {
      core.move(g, 1);
      gp.acc -= step;
      gp.moved = true;
      dirty = true;
    }
    while (gp.acc <= -step) {
      core.move(g, -1);
      gp.acc += step;
      gp.moved = true;
      dirty = true;
    }
    core.setSoft(g, e.clientY - gp.y > cell * 1.6);
  });
  const release = (e) => {
    if (!gp) return;
    core.setSoft(g, false);
    const dt = performance.now() - gp.t;
    const dx = e.clientX - gp.x;
    const dy = e.clientY - gp.y;
    if (state === 'play') {
      if (!gp.moved && Math.hypot(dx, dy) < 12 && dt < 280) core.rotate(g, 1);
      else if (dy > cell * 2.2 && dt < 300 && Math.abs(dx) < cell * 2) {
        core.hardDrop(g);
        haptic(14);
      }
    }
    dirty = true;
    gp = null;
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', () => {
    core.setSoft(g, false);
    gp = null;
  });

  function onKey(e) {
    if (state !== 'play') return;
    const k = e.key;
    if (k === 'ArrowLeft') core.move(g, -1);
    else if (k === 'ArrowRight') core.move(g, 1);
    else if (k === 'ArrowUp' || k === 'x') core.rotate(g, 1);
    else if (k === 'z') core.rotate(g, -1);
    else if (k === 'ArrowDown') core.setSoft(g, true);
    else if (k === ' ') core.hardDrop(g);
    else if (k === 'c') core.holdPiece(g);
    else return;
    e.preventDefault();
    dirty = true;
  }
  function onKeyUp(e) {
    if (e.key === 'ArrowDown') core.setSoft(g, false);
  }
  document.addEventListener('keydown', onKey);
  document.addEventListener('keyup', onKeyUp);

  const ro = new ResizeObserver(layout);
  ro.observe(wrap);
  layout();
  draw();

  overlay(el, {
    title: 'Block Fit',
    body: h(
      'div',
      { class: 'howto' },
      h('p', null, 'Fit the falling shapes into complete rows. You have three minutes.'),
      h('ul', null, h('li', null, 'Drag sideways to move, tap to rotate.'), h('li', null, 'Flick down to drop. Hold a finger low to fall faster.'), h('li', null, 'The buttons below do the same things.'), h('li', null, 'From level 2, a red frame means a twist is active. Watch the banner and adapt.')),
    ),
    buttons: [{ label: old ? 'Continue game' : 'Start', kind: 'primary', onclick: start }],
  });

  return {
    destroy() {
      if(state!=='ready'&&state!=='over')save();
      loop.destroy();
      ro.disconnect();
      stopL();
      stopR();
      clearTimeout(bannerTimer);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('keyup', onKeyUp);
    },
    pause: openPause,
    onBack() {
      if (state === 'play') {
        openPause();
        return true;
      }
      if (state === 'paused' && pauseOv) return true; // stay on the pause menu
      return false;
    },
  };
}
