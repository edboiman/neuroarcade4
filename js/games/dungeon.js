// Deep Delve: canvas UI for dungeon-core.js. Study the map, then cross the dark from memory.
import * as core from './dungeon-core.js';
import { h, haptic } from '../ui.js';
import { createDungeonArt } from './dungeon-art.js';
import { gameTop, hud, overlay } from './common.js';

const { W, H } = core;

export function mount(root, ctx) {
  const g = core.createGame((Date.now() ^ 0x27d4eb2f) & 0x7fffffff);
  let state = 'ready'; // ready | play | paused | over
  let pauseOv = null;
  let dead = false;
  let tile = 30;
  let cssW = 330;
  let cssH = 450;
  let dpr = 1;
  let walking = 0; // token so a new tap cancels the old walk
  let previewTimer = 0;
  let previewLeft = 0;
  let bannerTimer = 0;
  let shakeTimer = 0;
  let flash = 0;
  let pulse = 0;
  let pulseTimer = 0;

  const floorHud = hud('Floor', '1');
  const gemHud = hud('Gems', '0');
  const hearts = h('div', { class: 'dd-hearts', role: 'img', 'aria-label': 'Health' });
  const top = gameTop({ title: 'Deep Delve', onMenu: () => openPause(), right: h('div', { class: 'hud-row' }, floorHud.el, gemHud.el, hearts) });
  const canvas = h('canvas', { class: 'dd-canvas', 'aria-label': 'Dungeon' });
  const c2 = canvas.getContext('2d');
  const banner = h('div', { class: 'dd-banner', role: 'status', 'aria-live': 'polite' });
  const bar = h('i', { class: 'dd-prevfill' });
  const prev = h('div', { class: 'dd-prev hidden' }, h('span', null, 'Study the map. Spikes are shown for a moment, then hidden.'), h('div', { class: 'dd-prevbar' }, bar), h('button', { class: 'btn primary', type: 'button', onclick: () => stopPreview() }, 'I am ready'));
  const stage = h('div', { class: 'dd-stage' }, canvas, banner);
  const waitBtn = h('button', { class: 'ctl dd-wait', type: 'button', onclick: () => doWait() }, h('span', null, '⏳'), h('small', null, 'Wait a turn'));
  const el = h('div', { class: 'dd' }, top, prev, stage, h('div', { class: 'dd-controls' }, waitBtn));
  root.append(el);

  // ----- sprites: drawn once per tile size in dungeon-art.js -----
  const art = createDungeonArt();
  function put(kind, tx, ty, k = 0.9, v = 0, alpha = 1) {
    const size = tile * k;
    c2.globalAlpha = alpha;
    c2.drawImage(art.get(kind, size * dpr, v), tx * tile + (tile - size) / 2, ty * tile + (tile - size) / 2, size, size);
    c2.globalAlpha = 1;
  }


  function layout() {
    const wrap = stage;
    const aw = wrap.clientWidth || 340;
    const ah = wrap.clientHeight || 480;
    tile = Math.max(14, Math.floor(Math.min(aw / W, ah / H)));
    cssW = tile * W;
    cssH = tile * H;
    dpr = ctx.dpr();
    canvas.style.setProperty('width', cssW + 'px');
    canvas.style.setProperty('height', cssH + 'px');
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    art.clear();
    draw();
  }

  // ----- drawing -----
  function draw() {
    const L = g.level;
    c2.setTransform(dpr, 0, 0, dpr, 0, 0);
    c2.fillStyle = '#04060b';
    c2.fillRect(0, 0, cssW, cssH);
    const lit = g.preview ? null : core.litSet(g);
    const previewing = g.preview;
    const hx = (g.pos.x + 0.5) * tile;
    const hy = (g.pos.y + 0.5) * tile;
    const tileVar = (x, y) => ((x * 73 + y * 151 + g.floor * 17) >>> 0) % 12;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const seen = previewing || L.seen[i] === 1;
        if (!seen) continue;
        const open = L.tiles[i] === 1;
        if (open) put('floor', x, y, 1, tileVar(x, y));
        else put('wall', x, y, 1, y + 1 < H && L.tiles[i + W] === 1 ? 1 : 0);
        // light: bright near the lantern, fading out; remembered tiles sit in cold shadow
        let shade;
        if (previewing) shade = 0.12;
        else if (lit.has(i)) shade = Math.min(0.62, (Math.hypot((x + 0.5) * tile - hx, (y + 0.5) * tile - hy) / tile / (core.LIGHT + 1.2)) * 0.7);
        else shade = 0.72;
        c2.fillStyle = previewing || lit.has(i) ? `rgba(4,6,14,${shade})` : `rgba(6,12,30,${shade})`;
        c2.fillRect(x * tile, y * tile, tile, tile);
        // warm lantern light, only on tiles the lantern actually reaches
        if (!previewing && lit.has(i)) {
          const d = Math.hypot((x + 0.5) * tile - hx, (y + 0.5) * tile - hy) / tile;
          const warm = Math.max(0, 0.2 * (1 - d / (core.LIGHT + 1)));
          if (warm > 0) {
            c2.fillStyle = `rgba(255,170,70,${warm.toFixed(3)})`;
            c2.fillRect(x * tile, y * tile, tile, tile);
          }
        }
      }
    }
    // stairs
    const st = L.stairs;
    if (previewing || L.seen[st.y * W + st.x]) put('stairs', st.x, st.y, 0.96);
    // crystals and potions that you have seen
    for (const q of L.gems) if (previewing || L.seen[q.y * W + q.x]) put('gem', q.x, q.y, 0.78);
    for (const q of L.hearts) if (previewing || L.seen[q.y * W + q.x]) put('potion', q.x, q.y, 0.78);
    // traps: shown while studying, then only the ones you have found
    for (const t of L.traps) {
      if (!previewing && !t.revealed) continue;
      const x = t.x * tile;
      const y = t.y * tile;
      c2.fillStyle = previewing ? `rgba(255,88,120,${0.45 + 0.3 * Math.sin(pulse)})` : 'rgba(255,88,120,.4)';
      c2.fillRect(x + 2, y + 2, tile - 4, tile - 4);
      for (let k = 0; k < 3; k++) {
        const bx = x + tile * (0.2 + k * 0.27);
        c2.beginPath();
        c2.moveTo(bx, y + tile * 0.8);
        c2.lineTo(bx + tile * 0.135, y + tile * 0.24);
        c2.lineTo(bx + tile * 0.27, y + tile * 0.8);
        c2.fillStyle = '#d6dde8';
        c2.fill();
        c2.beginPath();
        c2.moveTo(bx + tile * 0.135, y + tile * 0.24);
        c2.lineTo(bx + tile * 0.27, y + tile * 0.8);
        c2.lineTo(bx + tile * 0.16, y + tile * 0.8);
        c2.fillStyle = '#8e99ab';
        c2.fill();
      }
    }
    // monsters you can see right now, with a shadow under each
    if (!previewing) {
      for (const e of L.enemies) {
        if (!lit.has(e.y * W + e.x)) continue;
        c2.fillStyle = 'rgba(0,0,0,.4)';
        c2.beginPath();
        c2.ellipse((e.x + 0.5) * tile, (e.y + 0.88) * tile, tile * 0.3, tile * 0.1, 0, 0, 7);
        c2.fill();
        put(e.kind === 'brute' ? 'brute' : 'skeleton', e.x, e.y, e.kind === 'brute' ? 0.98 : 0.9, 0, e.rest ? 0.75 : 1);
      }
    }
    // the hero
    c2.fillStyle = 'rgba(0,0,0,.4)';
    c2.beginPath();
    c2.ellipse(hx, (g.pos.y + 0.9) * tile, tile * 0.28, tile * 0.09, 0, 0, 7);
    c2.fill();
    put('hero', g.pos.x, g.pos.y, 0.98);
    if (flash > 0) {
      c2.fillStyle = `rgba(255,60,80,${flash * 0.35})`;
      c2.fillRect(0, 0, cssW, cssH);
    }
  }

  function paintHud() {
    floorHud.set(g.floor);
    gemHud.set(g.gems);
    hearts.replaceChildren(...Array.from({ length: g.maxHp }, (_, i) => h('span', null, i < g.hp ? '❤️' : '🖤')));
  }
  function say(text, ms = 1800) {
    banner.textContent = text;
    banner.classList.add('show');
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => banner.classList.remove('show'), ms);
  }

  // ----- events -----
  // returns true if something happened that should stop an automatic walk
  function handle() {
    let stop = false;
    for (const e of g.events) {
      if (e.type === 'hurt') {
        flash = 1;
        fadeFlash();
        stage.classList.add('shake');
        clearTimeout(shakeTimer);
        shakeTimer = setTimeout(() => stage.classList.remove('shake'), 260);
        ctx.audio.beep(160, 160, 0.1, 'triangle');
        haptic(e.why === 'trap' ? 34 : 22);
        if (e.why === 'trap') say('Spikes! You forgot that one.');
        stop = true;
      } else if (e.type === 'gem') {
        ctx.audio.beep(880, 70, 0.07);
        stop = true;
      } else if (e.type === 'heal') {
        ctx.audio.good();
        say('Health restored');
        stop = true;
      } else if (e.type === 'kill') {
        ctx.audio.beep(300, 90, 0.08, 'square');
        stop = true;
      } else if (e.type === 'hit') {
        ctx.audio.beep(420, 50, 0.08, 'square');
        haptic(10);
        stop = true;
      } else if (e.type === 'descend') {
        ctx.audio.good();
        stop = true;
      } else if (e.type === 'maxhp') {
        say('Stronger! +1 heart');
      } else if (e.type === 'strike') stop = true;
    }
    g.events.length = 0;
    return stop;
  }

  function afterChange() {
    paintHud();
    if (g.over) {
      draw();
      end();
      return;
    }
    if (g.preview && !previewTimer) startPreview();
    draw();
  }

  // ----- study phase -----
  function startPreview() {
    state = 'play';
    previewLeft = core.previewSeconds(g.floor);
    const total = previewLeft;
    prev.classList.remove('hidden');
    bar.style.setProperty('width', '100%');
    const t0 = performance.now();
    pulseTimer = 0;
    previewTimer = setInterval(() => {
      if (state === 'paused') return;
      const left = total - (performance.now() - t0) / 1000;
      pulse += 0.5;
      bar.style.setProperty('width', Math.max(0, (left / total) * 100).toFixed(1) + '%');
      draw();
      if (left <= 0) stopPreview();
    }, 120);
  }
  function stopPreview() {
    if (!g.preview) return;
    clearInterval(previewTimer);
    previewTimer = 0;
    core.endPreview(g);
    prev.classList.add('hidden');
    draw();
  }

  // ----- player input -----
  function doStep(dx, dy) {
    const before = core.visibleEnemies(g).length;
    const res = core.move(g, dx, dy);
    const stop = handle();
    afterChange();
    const after = core.visibleEnemies(g).length;
    return { res, stop: stop || after > before || g.over || g.preview };
  }
  function doWait() {
    if (state !== 'play' || g.over || g.preview) return;
    walking++;
    core.wait(g);
    handle();
    afterChange();
  }
  async function walk(path) {
    const token = ++walking;
    for (const p of path) {
      if (dead || token !== walking || g.over || g.preview || state !== 'play') return;
      const dx = p.x - g.pos.x;
      const dy = p.y - g.pos.y;
      const { res, stop } = doStep(dx, dy);
      if (!res.moved && !res.attacked) return;
      if (stop) return;
      if (core.visibleEnemies(g).length) return; // with a monster in sight, go one step at a time
      await new Promise((r) => setTimeout(r, 105));
    }
  }
  function tapAt(e) {
    if (state !== 'play' || g.over || g.preview) return;
    const r = canvas.getBoundingClientRect();
    const tx = Math.floor((e.clientX - r.left) / tile);
    const ty = Math.floor((e.clientY - r.top) / tile);
    if (tx === g.pos.x && ty === g.pos.y) return doWait();
    const dx = tx - g.pos.x;
    const dy = ty - g.pos.y;
    if (Math.abs(dx) + Math.abs(dy) === 1) {
      walking++;
      doStep(dx, dy);
      return;
    }
    const path = core.pathTo(g, tx, ty);
    if (path && path.length) walk(path);
    else {
      ctx.audio.beep(200, 60, 0.05, 'square');
    }
  }
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    tapAt(e);
  });
  function onKey(e) {
    if (state !== 'play' || g.preview) return;
    const map = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1], a: [-1, 0], d: [1, 0], w: [0, -1], s: [0, 1] };
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === ' ') {
      e.preventDefault();
      doWait();
    } else if (map[k]) {
      e.preventDefault();
      walking++;
      doStep(...map[k]);
    }
  }
  document.addEventListener('keydown', onKey);

  // ----- flow -----
  function start() {
    state = 'play';
    paintHud();
    startPreview();
    draw();
  }
  // fade the red damage flash, only while it is visible
  function fadeFlash() {
    clearTimeout(fadeTimer);
    if (dead || flash <= 0) return;
    fadeTimer = setTimeout(() => {
      flash = Math.max(0, flash - 0.25);
      draw();
      fadeFlash();
    }, 80);
  }
  let fadeTimer = 0;

  function end() {
    if (state === 'over') return;
    state = 'over';
    walking++;
    clearInterval(previewTimer);
    const win = g.reason === 'escaped';
    ctx.finish({
      score: core.scoreOf(g),
      level: g.floor,
      completed: win || g.floor >= 3,
      extra: [win ? 'You escaped the depths' : `You fell on floor ${g.floor}`, `Gems: ${g.gems}`, `Monsters beaten: ${g.kills}`, `Floors without a scratch: ${g.perfectFloors}`],
    });
  }

  function openPause() {
    if (state !== 'play' || pauseOv) return;
    state = 'paused';
    walking++;
    pauseOv = overlay(el, {
      title: 'Paused',
      body: h('p', null, 'The torch is waiting.'),
      buttons: [
        { label: 'Quit', kind: 'danger', onclick: () => ctx.exit() },
        {
          label: 'Resume',
          kind: 'primary',
          onclick: () => {
            pauseOv = null;
            state = 'play';
          },
        },
      ],
    });
  }

  const ro = new ResizeObserver(layout);
  ro.observe(stage);
  layout();
  overlay(el, {
    title: 'Deep Delve',
    body: h(
      'div',
      { class: 'howto' },
      h('p', null, 'Find the stairs on every floor. Each floor opens with a short look at the whole map, including the spikes. Then the lights go out.'),
      h('ul', null, h('li', null, 'Tap a spot you have explored to walk there.'), h('li', null, 'Tap next to a monster to attack it. If you step next to one, it strikes first, so let it come to you and use Wait.'), h('li', null, 'Spikes you forgot cost a heart. Hearts and gems are scattered around.')),
    ),
    buttons: [{ label: 'Enter', kind: 'primary', onclick: start }],
  });

  return {
    destroy() {
      dead = true;
      ro.disconnect();
      clearInterval(previewTimer);
      clearTimeout(fadeTimer);
      clearTimeout(bannerTimer);
      clearTimeout(shakeTimer);
      clearInterval(pulseTimer);
      document.removeEventListener('keydown', onKey);
      walking++;
    },
    pause: openPause,
    onBack() {
      if (state === 'play') {
        openPause();
        return true;
      }
      if (state === 'paused' && pauseOv) return true;
      return false;
    },
  };
}
