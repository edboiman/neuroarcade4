// Holiday Horde: canvas UI for the engine in survivor-core.js.
import * as core from './survivor-core.js';
import { restore, saveRun } from '../checkpoint.js';
import { validHorde } from '../game-validation.js';
import { THEMES, themeForDate } from './survivor-themes.js';
import { h, haptic, fill } from '../ui.js';
import { createLoop } from '../loop.js';
import * as input from './survivor-input.js';
import { createArt, paletteFor } from './survivor-art.js';
import { gameTop, hud, overlay, mmss } from './common.js';

export function mount(root, ctx) {
  const store = ctx.store;
  let themeIdx = (() => {
    const saved = store.pref('survivor', 'theme', -1);
    return saved >= 0 && saved < THEMES.length ? saved : -1;
  })();
  const activeTheme = () => (themeIdx >= 0 ? THEMES[themeIdx] : themeForDate(new Date()));
  let theme = activeTheme();
  let manual = store.pref('survivor', 'aim', 0) === 1;
  const old=ctx.resume?restore(store.loadGame('survivor'),validHorde):null;
  let run = old ? old.state : core.createRun(ctx.seed ?? ((Date.now() ^ 0x5bd1e995) & 0x7fffffff));
  let classIdx=old?.meta?.heroClass??Math.max(0,Math.min(2,Math.round(store.pref('survivor','heroClass',0))));
  if(![0,1,2].includes(classIdx))classIdx=0;
  if(old && Number.isInteger(old.meta.theme) && old.meta.theme>=-1 && old.meta.theme<THEMES.length){themeIdx=old.meta.theme;theme=activeTheme();}
  const save=()=>saveRun(store,'survivor',run,{heroClass:classIdx,theme:themeIdx,mode:ctx.mode});
  let savedAt=0;
  let state = 'ready'; // ready | play | choose | paused | over
  let pauseOv = null;
  let cssW = 360;
  let cssH = 640;
  let dpr = 1;
  let scale = 1;
  let bannerTimer = 0;
  let hurtTimer = 0;
  let lastKillSound = 0;
  const fx = [];
  let vignette = null;
  let walkT = 0;

  const time = hud('Time', mmss(core.RUN_SECONDS * 1000));
  const level = hud('Level', '1');
  const kills = hud('Defeated', '0');
  const top = gameTop({ title: 'Holiday Horde', onMenu: () => openPause(), right: h('div', { class: 'hud-row' }, time.el, level.el, kills.el) });
  const hpFill = h('i', { class: 'sv-fill hp' });
  const xpFill = h('i', { class: 'sv-fill xp' });
  const bars = h('div', { class: 'sv-bars' }, h('div', { class: 'sv-bar', role: 'img', 'aria-label': 'Health' }, hpFill), h('div', { class: 'sv-bar thin', role: 'img', 'aria-label': 'Experience' }, xpFill));
  const canvas = h('canvas', { class: 'sv-canvas', 'aria-label': 'Arena' });
  const c2 = canvas.getContext('2d');
  const banner = h('div', { class: 'sv-banner', role: 'status', 'aria-live': 'polite' });
  const wrap = h('div', { class: 'sv-wrap' }, canvas, banner);
  const el = h('div', { class: 'sv' }, top, bars, wrap);
  root.append(el);

  // ----- sprites: drawn with canvas paths once per size and theme (survivor-art.js), then copied each frame -----
  const art = createArt();
  const sprites = { clear: () => art.clear() };
  function paint(kind, size, x, y, flip = false, alpha = 1, variant = 0) {
    const sp = art.get(kind, theme.id, size * scale * dpr, variant);
    const w = size;
    c2.globalAlpha = alpha;
    if (flip) {
      c2.save();
      c2.translate(x, y);
      c2.scale(-1, 1);
      c2.drawImage(sp, -w / 2, -w / 2, w, w);
      c2.restore();
    } else c2.drawImage(sp, x - w / 2, y - w / 2, w, w);
    c2.globalAlpha = 1;
  }
  // a faint world-anchored ground texture (speckles and soft patches), built once per theme and scale
  let ground = null;
  function groundTexture(sx, sy) {
    const key = theme.id + '|' + scale + '|' + dpr;
    if (!ground || ground.key !== key) {
      const size = 256;
      const px = Math.round(size * scale * dpr);
      const cv = document.createElement('canvas');
      cv.width = cv.height = px;
      const g = cv.getContext('2d');
      const pal = paletteFor(theme.id).prop;
      let seed = 7;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < 9; i++) {
        const x = rnd() * px;
        const y = rnd() * px;
        const r = (30 + rnd() * 60) * scale * dpr;
        for (const [ox, oy] of [[0, 0], [px, 0], [-px, 0], [0, px], [0, -px]]) {
          const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
          gr.addColorStop(0, pal[1] + '22');
          gr.addColorStop(1, pal[1] + '00');
          g.fillStyle = gr;
          g.fillRect(0, 0, px, px);
        }
      }
      g.fillStyle = 'rgba(255,255,255,.05)';
      for (let i = 0; i < 140; i++) g.fillRect(rnd() * px, rnd() * px, 1.5 * dpr, 1.5 * dpr);
      g.fillStyle = 'rgba(0,0,0,.12)';
      for (let i = 0; i < 90; i++) g.fillRect(rnd() * px, rnd() * px, 2 * dpr, 2 * dpr);
      ground = { key, pattern: c2.createPattern(cv, 'repeat'), size: size * scale };
    }
    const offX = ((-run.hero.x * scale + cssW / 2 + sx) % ground.size) - ground.size;
    const offY = ((-run.hero.y * scale + cssH / 2 + sy) % ground.size) - ground.size;
    c2.save();
    c2.translate(offX, offY);
    c2.scale(1 / dpr, 1 / dpr);
    c2.fillStyle = ground.pattern;
    c2.fillRect(0, 0, (cssW + ground.size * 2) * dpr, (cssH + ground.size * 2) * dpr);
    c2.restore();
  }
  // soft pool of light under the hero instead of a flat disc
  let heroGlow = null;
  function shadow(x, y, rx) {
    c2.beginPath();
    c2.ellipse(x, y, rx, rx * 0.38, 0, 0, 7);
    c2.fill();
  }

  // ----- layout -----
  function layout() {
    cssW = wrap.clientWidth || 360;
    cssH = wrap.clientHeight || 600;
    dpr = ctx.dpr();
    // zoom is set by the shorter side, so wide screens and landscape show more arena instead of zooming in
    scale = Math.max(0.65, Math.min(1.3, Math.min(cssW, cssH) / 400));
    canvas.style.setProperty('width', cssW + 'px');
    canvas.style.setProperty('height', cssH + 'px');
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    sprites.clear();
    updateView();
    draw();
  }
  function updateView() {
    run.view.hw = cssW / scale / 2;
    run.view.hh = cssH / scale / 2;
  }

  // ----- drawing -----
  const hash = (a, b) => {
    let x = (Math.imul(a, 374761393) + Math.imul(b, 668265263)) | 0;
    x = Math.imul(x ^ (x >>> 13), 1274126177);
    return (x ^ (x >>> 16)) >>> 0;
  };
  function draw() {
    const hero = run.hero;
    let sx = 0;
    let sy = 0;
    if (hurtTimer > 0) {
      sx = (Math.random() - 0.5) * 4;
      sy = (Math.random() - 0.5) * 4;
    }
    c2.setTransform(dpr, 0, 0, dpr, 0, 0);
    const bg = c2.createLinearGradient(0, 0, 0, cssH);
    bg.addColorStop(0, theme.bg[0]);
    bg.addColorStop(1, theme.bg[1]);
    c2.fillStyle = bg;
    c2.fillRect(0, 0, cssW, cssH);
    groundTexture(sx, sy);
    const ox = cssW / 2 - hero.x * scale + sx;
    const oy = cssH / 2 - hero.y * scale + sy;
    c2.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * ox, dpr * oy);
    // scenery
    const cell = 110;
    const x0 = Math.floor((hero.x - run.view.hw - 30) / cell);
    const x1 = Math.floor((hero.x + run.view.hw + 30) / cell);
    const y0 = Math.floor((hero.y - run.view.hh - 30) / cell);
    const y1 = Math.floor((hero.y + run.view.hh + 30) / cell);
    for (let gx = x0; gx <= x1; gx++) {
      for (let gy = y0; gy <= y1; gy++) {
        const v = hash(gx, gy);
        if (v % 100 < 55) paint('prop', 14 + ((v >>> 4) % 12), gx * cell + ((v >>> 12) % cell), gy * cell + ((v >>> 20) % cell), false, 0.55, (v >>> 8) % 3);
      }
    }
    const now = ctx.settings.reduce ? 0 : performance.now() / 1000;
    for(const z of run.hazards||[]){
      const active=z.t>=z.windup;
      c2.beginPath();c2.arc(z.x,z.y,z.r,0,Math.PI*2);
      c2.fillStyle=active?'rgba(238,157,103,.35)':'rgba(238,184,116,.09)';c2.fill();
      c2.strokeStyle=active?'#ffe2ac':'#dfbb86';c2.lineWidth=active?3:1.5;c2.setLineDash(active?[]:[6,5]);c2.stroke();c2.setLineDash([]);
      c2.beginPath();c2.arc(z.x,z.y,z.r*Math.min(1,z.t/z.windup),0,Math.PI*2);c2.strokeStyle='#dfbb8670';c2.stroke();
    }
    // gems: a slow bob so they read as pickups
    for (const g of run.gems) paint('gem', g.v > 3 ? 20 : 14, g.x, g.y + Math.sin(now * 5 + g.x) * 1.5);
    // guardians
    const orbs = core.orbCount(run);
    for (let i = 0; i < orbs; i++) {
      const a = run.orbAngle + (i / orbs) * Math.PI * 2;
      const gx = hero.x + Math.cos(a) * 52;
      const gy = hero.y + Math.sin(a) * 52;
      c2.fillStyle = theme.glow;
      c2.globalAlpha = 0.25;
      c2.beginPath();
      c2.arc(gx, gy, 13, 0, 7);
      c2.fill();
      c2.globalAlpha = 1;
      c2.beginPath();
      c2.arc(gx, gy, 7, 0, 7);
      c2.fill();
    }
    // enemy shadows in one pass
    c2.fillStyle = 'rgba(0,0,0,.32)';
    for (const e of run.enemies) shadow(e.x, e.y + core.ENEMY[e.kind].size * 0.42, core.ENEMY[e.kind].size * (e.elite ? 0.42 : 0.34));
    shadow(hero.x, hero.y + 15, 12);
    // enemies
    for (const e of run.enemies) {
      const d = core.ENEMY[e.kind];
      const size = d.size * 1.22 * (e.elite ? 1.3 : 1) * (e.hit > 0 ? 1.12 : 1);
      const bob = Math.sin(now * 7 + e.id) * 1.6;
      if (e.elite) {
        c2.strokeStyle = '#ffd34d';
        c2.globalAlpha = 0.7 + Math.sin(now * 6 + e.id) * 0.25;
        c2.lineWidth = 2.5;
        c2.beginPath();
        c2.arc(e.x, e.y + bob, size * 0.5, 0, 7);
        c2.stroke();
        c2.globalAlpha = 1;
      }
      paint(e.kind, size, e.x, e.y + bob, hero.x > e.x);
      if (e.hit > 0) {
        c2.globalCompositeOperation = 'lighter';
        paint(e.kind, size, e.x, e.y + bob, hero.x > e.x, 0.55);
        c2.globalCompositeOperation = 'source-over';
      }
      if (e.kind === 'boss' || e.elite) {
        const bw = e.kind === 'boss' ? 52 : 30;
        c2.fillStyle = 'rgba(0,0,0,.6)';
        c2.fillRect(e.x - bw / 2, e.y - size * 0.62, bw, 5);
        c2.fillStyle = e.kind === 'boss' ? '#ff5878' : '#ffd34d';
        c2.fillRect(e.x - bw / 2, e.y - size * 0.62, bw * Math.max(0, e.hp / e.maxHp), 5);
      }
    }
    // shots: additive glow with a short streak behind
    c2.globalCompositeOperation = 'lighter';
    const pal = paletteFor(theme.id);
    for (const sh of run.shots) {
      const sp = Math.hypot(sh.vx, sh.vy) || 1;
      c2.strokeStyle = sh.pet ? 'rgba(120,220,255,.55)' : pal.shot;
      c2.globalAlpha = 0.45;
      c2.lineWidth = 4;
      c2.beginPath();
      c2.moveTo(sh.x, sh.y);
      c2.lineTo(sh.x - (sh.vx / sp) * 16, sh.y - (sh.vy / sp) * 16);
      c2.stroke();
      c2.globalAlpha = 1;
      paint('shot', sh.pet ? 15 : 18, sh.x, sh.y, false, 1, sh.pet ? 1 : 0);
    }
    c2.globalCompositeOperation = 'source-over';
    // companion
    if (run.pet) {
      const pp = run.pet;
      c2.fillStyle = theme.glow;
      c2.globalAlpha = 0.22;
      c2.beginPath();
      c2.arc(pp.x, pp.y, 15, 0, 7);
      c2.fill();
      c2.globalAlpha = 1;
      paint('pet', 30, pp.x, pp.y + Math.sin(now * 4) * 2, run.hero.x < pp.x);
    }
    // barrier
    if (run.shieldCharges > 0) {
      c2.strokeStyle = '#8fe3ff';
      c2.globalAlpha = 0.55;
      c2.lineWidth = 2 + run.shieldCharges;
      c2.beginPath();
      c2.arc(hero.x, hero.y, 25, 0, 7);
      c2.stroke();
      c2.globalAlpha = 1;
    }
    // hero
    const blink = hero.iframe > 0 && Math.floor(hero.iframe * 20) % 2 === 0;
    if (!heroGlow || heroGlow.c !== theme.glow) {
      const gr = c2.createRadialGradient(0, 0, 0, 0, 0, 60);
      gr.addColorStop(0, theme.glow + '40');
      gr.addColorStop(1, theme.glow + '00');
      heroGlow = { c: theme.glow, gr };
    }
    c2.save();
    c2.translate(hero.x, hero.y + 6);
    c2.fillStyle = heroGlow.gr;
    c2.fillRect(-60, -60, 120, 120);
    c2.restore();
    // walk cycle: a little bounce and a lean into the direction of travel
    const mv = inputVec();
    const moving = Math.hypot(mv.x, mv.y) > 0.1 && state === 'play';
    walkT = run.t;
    const bounce = ctx.settings.reduce ? 0 : moving ? Math.abs(Math.sin(walkT * 11)) * 3 : Math.sin(now * 2) * 0.8;
    c2.save();
    c2.translate(hero.x, hero.y - 3 - bounce);
    c2.rotate(moving ? Math.max(-0.12, Math.min(0.12, mv.x * 0.12)) : 0);
    paint('hero', 44, 0, 0, hero.face < 0, blink ? 0.4 : 1);
    c2.restore();
    // effects
    for (const f of fx) {
      const p = f.t / f.life;
      if (f.burst) {
        c2.globalAlpha = 1 - p;
        for (const q of f.burst) {
          c2.fillStyle = q.c;
          const r = 3.2 * (1 - p * 0.6);
          c2.fillRect(f.x + q.vx * f.t - r / 2, f.y + q.vy * f.t - r / 2, r, r);
        }
        c2.globalAlpha = 1;
        continue;
      }
      if (f.muzzle) {
        c2.globalCompositeOperation = 'lighter';
        c2.fillStyle = paletteFor(theme.id).shot;
        c2.globalAlpha = 1 - p;
        c2.beginPath();
        c2.arc(f.x, f.y, 9 * (1 - p * 0.5), 0, 7);
        c2.fill();
        c2.globalCompositeOperation = 'source-over';
        c2.globalAlpha = 1;
        continue;
      }
      if (f.chain) {
        c2.strokeStyle = f.color;
        c2.globalAlpha = 1 - p;
        c2.lineWidth = 2.5;
        c2.beginPath();
        f.chain.forEach((q, i) => {
          const jx = i ? (Math.random() - 0.5) * 8 : 0;
          if (i === 0) c2.moveTo(q.x, q.y);
          else c2.lineTo(q.x + jx, q.y + jx);
        });
        c2.stroke();
        continue;
      }
      c2.strokeStyle = f.color;
      c2.globalAlpha = (1 - p) * 0.8;
      c2.lineWidth = f.w || 3;
      c2.beginPath();
      c2.arc(f.x, f.y, f.r * (f.grow ? p : 1) + (f.grow ? 0 : p * 14), 0, 7);
      c2.stroke();
    }
    c2.globalAlpha = 1;
    // aim line (manual mode) and sticks
    c2.setTransform(dpr, 0, 0, dpr, 0, 0);
    // vignette keeps the eye on the middle of the arena
    if (!vignette || vignette.w !== cssW || vignette.h !== cssH) {
      const gr = c2.createRadialGradient(cssW / 2, cssH / 2, Math.min(cssW, cssH) * 0.35, cssW / 2, cssH / 2, Math.max(cssW, cssH) * 0.75);
      gr.addColorStop(0, 'rgba(0,0,0,0)');
      gr.addColorStop(1, 'rgba(0,0,0,.55)');
      vignette = { w: cssW, h: cssH, gr };
    }
    c2.fillStyle = vignette.gr;
    c2.fillRect(0, 0, cssW, cssH);
    if (manual && state === 'play' && sticks.aim) {
      const hx = cssW / 2 + sx;
      const hy = cssH / 2 + sy;
      const dir = sticks.lastAim;
      c2.strokeStyle = theme.glow;
      c2.globalAlpha = 0.55;
      c2.lineWidth = 2;
      c2.setLineDash([6, 7]);
      c2.beginPath();
      c2.moveTo(hx + dir.x * 24, hy + dir.y * 24);
      c2.lineTo(hx + dir.x * 170, hy + dir.y * 170);
      c2.stroke();
      c2.setLineDash([]);
      // reticle under the finger
      c2.globalAlpha = 0.85;
      c2.beginPath();
      c2.arc(sticks.aim.px, sticks.aim.py, 16, 0, 7);
      c2.moveTo(sticks.aim.px - 24, sticks.aim.py);
      c2.lineTo(sticks.aim.px - 8, sticks.aim.py);
      c2.moveTo(sticks.aim.px + 8, sticks.aim.py);
      c2.lineTo(sticks.aim.px + 24, sticks.aim.py);
      c2.moveTo(sticks.aim.px, sticks.aim.py - 24);
      c2.lineTo(sticks.aim.px, sticks.aim.py - 8);
      c2.moveTo(sticks.aim.px, sticks.aim.py + 8);
      c2.lineTo(sticks.aim.px, sticks.aim.py + 24);
      c2.stroke();
      c2.globalAlpha = 1;
    }
    const drawStick = (st, color) => {
      if (!st) return;
      c2.fillStyle = 'rgba(255,255,255,.06)';
      c2.beginPath();
      c2.arc(st.ox, st.oy, 46, 0, 7);
      c2.fill();
      c2.strokeStyle = color;
      c2.lineWidth = 1.5;
      c2.stroke();
      const kx = st.ox + st.x * 44;
      const ky = st.oy + st.y * 44;
      const kg = c2.createRadialGradient(kx - 5, ky - 6, 2, kx, ky, 20);
      kg.addColorStop(0, 'rgba(255,255,255,.55)');
      kg.addColorStop(1, 'rgba(255,255,255,.14)');
      c2.fillStyle = kg;
      c2.beginPath();
      c2.arc(kx, ky, 19, 0, 7);
      c2.fill();
    };
    drawStick(sticks.move, 'rgba(255,255,255,.28)');
  }

  function say(text, ms = 2200, kind = '') {
    banner.textContent = text;
    banner.className = 'sv-banner show ' + kind;
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => banner.classList.remove('show'), ms);
  }

  // ----- events from the engine -----
  function handleEvents(now) {
    for (const e of run.events) {
      if(e.type==='hazard')say(`${e.name}: leave the marked circle`,2400);
      if (e.type === 'kill') {
        if (fx.length < 50) {
          const n = e.kind === 'boss' ? 16 : e.elite ? 10 : 6;
          const pal = paletteFor(theme.id)[e.kind] || [theme.glow];
          const parts = [];
          for (let k = 0; k < n; k++) {
            const a = (k / n) * Math.PI * 2 + Math.random() * 0.6;
            const sp = 40 + Math.random() * 70;
            parts.push({ vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, c: pal[k % pal.length] });
          }
          fx.push({ burst: parts, x: e.x, y: e.y, t: 0, life: 0.38 });
        }
        if (now - lastKillSound > 90) {
          lastKillSound = now;
          ctx.audio.beep(520 + Math.random() * 260, 28, 0.035, 'square');
        }
        if (e.kind === 'boss') {
          ctx.audio.good();
          haptic(30);
        }
      } else if (e.type === 'shoot') {
        if (fx.length < 60 && e.a != null) fx.push({ muzzle: true, x: run.hero.x + Math.cos(e.a) * 18, y: run.hero.y + Math.sin(e.a) * 18, t: 0, life: 0.09 });
      } else if (e.type === 'hurt') {
        hurtTimer = 0.18;
        wrap.classList.add('hurt');
        ctx.audio.beep(150, 140, 0.1, 'triangle');
        haptic(22);
      } else if (e.type === 'milestoneReady') {
        say(`Level ${e.level} milestone!`, 1800);
      } else if (e.type === 'block') {
        fx.push({ x: run.hero.x, y: run.hero.y, r: 26, t: 0, life: 0.35, color: '#8fe3ff', w: 4, grow: false });
        ctx.audio.beep(880, 80, 0.06, 'triangle');
      } else if (e.type === 'blast') {
        if (fx.length < 60) fx.push({ x: e.x, y: e.y, r: e.r, t: 0, life: 0.25, color: '#ffb35c', w: 3, grow: true });
      } else if (e.type === 'chain') {
        if (fx.length < 60) fx.push({ chain: e.pts, t: 0, life: 0.18, color: '#bfe8ff' });
      } else if (e.type === 'levelup') {
        ctx.audio.good();
      } else if (e.type === 'nova') {
        fx.push({ x: run.hero.x, y: run.hero.y, r: e.r, t: 0, life: 0.4, color: theme.glow, w: 4, grow: true });
        ctx.audio.beep(240, 160, 0.08, 'sawtooth');
      } else if (e.type === 'wave') {
        say('A swarm is closing in!', 2200, 'warn');
        ctx.audio.beep(300, 200, 0.1, 'sawtooth');
      } else if (e.type === 'boss') {
        say('A boss approaches!', 2600, 'warn');
        ctx.audio.beep(110, 380, 0.14, 'sawtooth');
        haptic([30, 40, 30]);
      }
    }
    run.events.length = 0;
  }

  // ----- game loop -----
  const keys = new Set();
  const sticks = input.createInput();
  const camView = () => ({ w: cssW, h: cssH, scale, heroX: run.hero.x, heroY: run.hero.y });
  function release() {
    input.releaseAll(sticks);
    keys.clear();
  }
  function inputVec() {
    const mv = input.moveVector(sticks);
    if (mv) return mv;
    let x = 0;
    let y = 0;
    if (keys.has('ArrowLeft') || keys.has('a')) x -= 1;
    if (keys.has('ArrowRight') || keys.has('d')) x += 1;
    if (keys.has('ArrowUp') || keys.has('w')) y -= 1;
    if (keys.has('ArrowDown') || keys.has('s')) y += 1;
    return { x, y };
  }
  function keyAim() {
    if (!manual) return null;
    const x = (keys.has('l') ? 1 : 0) - (keys.has('j') ? 1 : 0);
    const y = (keys.has('k') ? 1 : 0) - (keys.has('i') ? 1 : 0);
    return x || y ? { x, y } : null;
  }
  function frame(dt, now) {
    if (state !== 'play') return;
    // fixed small steps: game speed and fire cadence stay the same at 60, 30 or 15 fps
    for (const h of input.substeps(dt)) {
      core.step(run, h, inputVec(), input.aimVector(sticks, camView()) || keyAim());
      if (run.over || run.pending > 0) break;
    }
    handleEvents(now);
    for (let i = fx.length - 1; i >= 0; i--) {
      fx[i].t += dt;
      if (fx[i].t >= fx[i].life) fx.splice(i, 1);
    }
    if (hurtTimer > 0) {
      hurtTimer -= dt;
      if (hurtTimer <= 0) wrap.classList.remove('hurt');
    }
    draw();
    if(run.t-savedAt>=5){savedAt=run.t;save();}
    time.set(mmss((core.RUN_SECONDS - run.t) * 1000));
    level.set(run.level);
    kills.set(run.kills);
    hpFill.style.setProperty('width', Math.max(0, (run.hero.hp / run.hero.maxHp) * 100).toFixed(1) + '%');
    xpFill.style.setProperty('width', ((run.xp / core.xpNeeded(run.level)) * 100).toFixed(1) + '%');
    if (run.over) end();
    else if (run.milestone > 0 || run.pending > 0) nextChoice();
  }
  // full frame rate while a finger is down, so aim and movement track the thumb; battery saver otherwise
  const loop = createLoop(frame, () => (sticks.aim || sticks.move ? 60 : ctx.fps()));

  // milestone rewards come first, then any normal level-up picks, then play resumes
  function nextChoice() {
    if (run.milestone > 0) chooseMilestone();
    else if (run.pending > 0) chooseUpgrade();
    else {
      state = 'play'; ctx.playing(true);
      loop.start();
    }
  }
  function chooseMilestone() {
    state = 'choose'; ctx.playing(false);
    loop.stop();
    release();
    draw();
    ctx.audio.good();
    haptic([20, 30, 20]);
    const ids = core.offerMilestones(run);
    const card = (id) => {
      const d = core.MILESTONES[id];
      const lv = run.ms[id];
      return h(
        'button',
        {
          class: 'up-card ms',
          type: 'button',
          onclick: () => {
            core.applyMilestone(run, id);
            ov.close();
            haptic(14);
            hpFill.style.setProperty('width', ((run.hero.hp / run.hero.maxHp) * 100).toFixed(1) + '%');
            nextChoice();
          },
        },
        h('span', { class: 'up-icon' }, d.icon),
        h('span', { class: 'up-text' }, h('strong', null, d.name), h('small', null, d.text)),
        h('span', { class: 'up-lv' }, id === 'pet' || lv === 0 ? 'New' : `Lv ${lv} → ${lv + 1}`),
      );
    };
    const ov = overlay(el, {
      title: `Milestone: level ${run.milestonesHit[run.milestonesHit.length - run.milestone]}`,
      body: h('div', { class: 'up-list ms-list' }, h('p', null, 'Every five levels you earn a big reward. Pick one.'), ids.length ? ids.map(card) : h('p', null, 'You have every reward at full strength.')),
      buttons: ids.length ? [] : [{ label: 'Continue', kind: 'primary', onclick: () => ((run.milestone = 0), nextChoice()) }],
    });
  }
  function buildLine() {
    const owned = core.UPGRADE_IDS.filter((k) => run.up[k] > 0).map((k) => `${core.UPGRADES[k].icon} ${core.UPGRADES[k].name} ${run.up[k]}`);
    const ms = core.MILESTONE_IDS.filter((k) => run.ms[k] > 0 && k !== 'feast').map((k) => `${core.MILESTONES[k].icon} ${core.MILESTONES[k].name}${k === 'pet' ? '' : ' ' + run.ms[k]}`);
    const all = [...ms, ...owned];
    return h('p', { class: 'up-build' }, all.length ? ['Your build: ', all.join('  ·  ')] : 'No upgrades yet.');
  }
  function chooseUpgrade(choices) {
    state = 'choose'; ctx.playing(false);
    loop.stop();
    release();
    draw();
    const ids = choices || core.offerChoices(run);
    const card = (id) => {
      const heal = id === 'heal';
      const def = heal ? { name: 'Rest up', icon: '🍎', text: 'Heal 30 health.' } : core.UPGRADES[id];
      const lv = heal ? 0 : run.up[id];
      return h(
        'button',
        {
          class: 'up-card',
          type: 'button',
          onclick: () => {
            core.applyUpgrade(run, id);
            ov.close();
            haptic(10);
            nextChoice();
            hpFill.style.setProperty('width', ((run.hero.hp / run.hero.maxHp) * 100).toFixed(1) + '%');
          },
        },
        h('span', { class: 'up-icon' }, def.icon),
        h('span', { class: 'up-text' }, h('strong', null, def.name), h('small', null, def.text), heal ? null : h('em', { class: 'up-path ' + def.path }, core.PATHS[def.path])),
        heal ? null : h('span', { class: 'up-lv' }, lv === 0 ? 'New' : `Lv ${lv} → ${lv + 1}`),
      );
    };
    const ov = overlay(el, {
      title: `Level ${run.level}`,
      body: h('div', { class: 'up-list' }, h('p', null, 'Pick one upgrade. Ones you already have show up more often, so you can build toward a style.'), ids.map(card), buildLine()),
      buttons: run.rerolls > 0 ? [{ label: `Reroll (${run.rerolls} left)`, onclick: () => chooseUpgrade(core.reroll(run)) }] : [],
    });
  }

  function start() {
    theme = activeTheme();
    manual = store.pref('survivor', 'aim', 0) === 1;
    run.manual = old ? run.manual : manual;
    if(!old){
      run.heroClass=classIdx;
      if(classIdx===0){run.up.power=1;run.up.rate=1;}
      if(classIdx===1){run.hero.maxHp=150;run.hero.hp=150;run.ms.shield=1;run.shieldCharges=1;}
      if(classIdx===2){run.up.speed=1;run.up.magnet=1;}
      run.practice=!!ctx.practice;run.season=activeTheme().id;
    }
    manual=run.manual;
    updateView();
    state = 'play'; ctx.playing(true);
    sprites.clear();
    loop.start();
    say(`${theme.tagline} ${core.SEASON_RULES[theme.id].name}: watch for marked circles.`, 3200);
    save();
  }
  function end() {
    if (state === 'over') return;
    state = 'over'; ctx.playing(false);
    loop.stop();
    release();
    draw();
    store.clearGame('survivor');
    const win = run.reason === 'dawn';
    ctx.finish({
      score: core.scoreOf(run),
      level: run.level,
      completed: win || run.t >= 60,
      variant: `class${classIdx}_${manual?'manual':'auto'}_${theme.id}`,
      extra: [win ? 'You survived until dawn' : `You lasted ${mmss(run.t * 1000)}`, `Defeated: ${run.kills}`, `Theme: ${theme.name}`],
    });
  }
  function openPause() {
    if (state !== 'play' || pauseOv) return;
    state = 'paused'; ctx.playing(false);
    save();
    loop.stop();
    release();
    pauseOv = overlay(el, {
      title: 'Paused',
      body: h('div', null, h('p', null, 'The horde is waiting.'), buildLine()),
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

  // ----- input: pointer events feed survivor-input.js; one listener set, so nothing can double the fire rate -----
  const local = (e) => {
    const r = canvas.getBoundingClientRect();
    return { id: e.pointerId, x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, manual };
  };
  canvas.addEventListener('pointerdown', (e) => {
    if (state !== 'play') return;
    e.preventDefault();
    const took = input.pointerDown(sticks, local(e));
    if (took === 'aim') {
      // fire and draw right away instead of waiting for the next frame
      core.step(run, 1 / 240, inputVec(), input.aimVector(sticks, camView()));
      handleEvents(performance.now());
      draw();
    } else if (took) draw();
    if (took) {
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* capture is best effort */
      }
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (state !== 'play') return;
    // use the newest sample the browser has, not a stale one
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    input.pointerMove(sticks, local(evs.length ? evs[evs.length - 1] : e));
  });
  const lift = (e) => input.pointerUp(sticks, e.pointerId);
  canvas.addEventListener('pointerup', lift);
  canvas.addEventListener('pointercancel', lift);
  canvas.addEventListener('lostpointercapture', lift);
  const onHide = () => {
    release();
    if (document.hidden) openPause();
  };
  window.addEventListener('blur', release);
  document.addEventListener('visibilitychange', onHide);
  const onKey = (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'a', 'd', 'w', 's', 'i', 'j', 'k', 'l'].includes(k)) {
      keys.add(k);
      if (state === 'play') e.preventDefault();
    }
  };
  const onKeyUp = (e) => keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key);
  document.addEventListener('keydown', onKey);
  document.addEventListener('keyup', onKeyUp);

  const ro = new ResizeObserver(layout);
  ro.observe(wrap);
  layout();

  // ----- ready screen with the theme picker -----
  function showReady() {
    const chips = h('div', { class: 'theme-chips', role: 'radiogroup', 'aria-label': 'Holiday theme' });
    function paint() {
      fill(
        chips,
        h('button', { class: 'theme-chip' + (themeIdx < 0 ? ' on' : ''), type: 'button', role: 'radio', 'aria-checked': themeIdx < 0 ? 'true' : 'false', onclick: () => pickTheme(-1) }, h('span', null, '📅'), h('small', null, 'Auto')),
        THEMES.map((t, i) => h('button', { class: 'theme-chip' + (themeIdx === i ? ' on' : ''), type: 'button', role: 'radio', 'aria-checked': themeIdx === i ? 'true' : 'false', onclick: () => pickTheme(i) }, h('span', null, t.hero), h('small', null, t.name))),
      );
      desc.textContent = `${activeTheme().name}${themeIdx < 0 ? ' (chosen by today’s date)' : ''}. ${activeTheme().tagline}`;
    }
    function pickTheme(i) {
      themeIdx = i;
      store.setPref('survivor', 'theme', i);
      theme = activeTheme();
      sprites.clear();
      draw();
      paint();
    }
    const desc = h('p', { class: 'theme-desc' });
    const ctl = h('div', { class: 'theme-chips two', role: 'radiogroup', 'aria-label': 'Aiming' });
    const ctlDesc = h('p', { class: 'theme-desc' });
    function paintCtl() {
      const opts = [
        ['Auto-aim', '🎯', 'Drag anywhere to move. Your hero shoots the nearest enemy on its own.'],
        ['Manual aim', '🕹️', 'Left thumb moves. Touch and hold the right side: you fire at your finger for as long as you hold. Shots hit 35% harder.'],
      ];
      fill(
        ctl,
        opts.map(([n, ic], i) =>
          h('button', { class: 'theme-chip' + (manual === (i === 1) ? ' on' : ''), type: 'button', role: 'radio', 'aria-checked': manual === (i === 1) ? 'true' : 'false', onclick: () => ((manual = i === 1), store.setPref('survivor', 'aim', i), paintCtl()) }, h('span', null, ic), h('small', null, n)),
        ),
      );
      ctlDesc.textContent = opts[manual ? 1 : 0][2];
    }
    paintCtl();
    paint();
    overlay(el, {
      title: 'Holiday Horde',
      body: h(
        'div',
        { class: 'howto' },
        h('p', null, 'Survive four minutes. Dodge the horde, collect gems, and build your weapon. Choose how you aim below.'),
        h('ul', null, h('li', null, 'Collect the gems that fall to level up, then pick an upgrade. Build toward a style: shooting, guarding or moving.'), h('li', null, 'Swarms and bosses arrive as time goes on. Keep moving.')),
        h('strong',{class:'es-len-h'},'Choose your starting build'),
        h('div',{class:'class-picker',role:'group','aria-label':'Hero class'},[['Ranger','Powerful, faster starting shots.'],['Warden','150 health and a protective barrier.'],['Wayfinder','Faster movement and wider gem pickup.']].map(([name,desc],i)=>h('button',{class:'class-card'+(classIdx===i?' on':''),type:'button','aria-pressed':String(classIdx===i),onclick:e=>{classIdx=i;store.setPref('survivor','heroClass',i);for(const b of e.currentTarget.parentElement.children){b.classList.toggle('on',b===e.currentTarget);b.setAttribute('aria-pressed',String(b===e.currentTarget));}}},name,h('small',null,desc)))),
        ctl,
        ctlDesc,
        chips,
        desc,
      ),
      buttons: [{ label: 'Start', kind: 'primary', onclick: start }],
    });
  }
  if(old)overlay(el,{title:'Continue your expedition',body:h('p',null,`Level ${run.level}. Your build and enemies are saved.`),buttons:[{label:'Continue run',kind:'primary',onclick:()=>{start();nextChoice();}}]});else showReady();

  return {
    destroy() {
      if(state!=='ready'&&state!=='over')save();
      loop.destroy();
      ro.disconnect();
      clearTimeout(bannerTimer);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', release);
      document.removeEventListener('visibilitychange', onHide);
    },
    pause: openPause,
    onBack() {
      if (state === 'play') {
        openPause();
        return true;
      }
      if ((state === 'paused' && pauseOv) || state === 'choose') return true;
      return false;
    },
  };
}
