// Deep Delve: canvas UI for dungeon-core.js. Study the map, then cross the dark from memory.
import * as core from './dungeon-core.js';
import { h, haptic, icon } from '../ui.js';
import { saveRun, restore } from '../checkpoint.js';
import { createDungeonArt } from './dungeon-art.js';
import { gameTop, hud, overlay } from './common.js';

const { W, H } = core;

export function mount(root, ctx) {
  const saved = ctx.resume ? restore(ctx.store.loadGame('dungeon'), core.validGame) : null;
  const g = saved ? saved.state : core.createGame(ctx.seed ?? ((Date.now() ^ 0x27d4eb2f) & 0x7fffffff));
  const save = () => saveRun(ctx.store, 'dungeon', g, { mode: ctx.mode });
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
  const combat = h('div', { class: 'dd-combat', role: 'status', 'aria-live': 'polite' });
  const control = (label, fn, symbol) => h('button', { class: 'ctl', type: 'button', 'aria-label': label, onclick: fn }, h('span', null, symbol), h('small', null, label));
  const waitBtn = control('Wait', doWait, '·');
  const attackBtn = control('Attack', () => {
    if (state !== 'play' || g.preview) return;
    const e = core.visibleEnemies(g).find(e => Math.abs(e.x-g.pos.x)+Math.abs(e.y-g.pos.y) === 1);
    if (!e) return say('Move beside an enemy to attack.');
    walking++; core.attack(g, e.id); handle(); afterChange();
  }, '⚔');
  const guardBtn = control('Defend', () => { if (state !== 'play' || g.preview) return; walking++; core.defend(g); handle(); afterChange(); }, '◇');
  const scoutBtn = control('Scout', () => { if (state === 'play' && core.scout(g)) { walking++; startPreview(); save(); } }, '◉');
  const pad = h('div', { class: 'dd-pad', role: 'group', 'aria-label': 'Move through dungeon' }, [[0,-1,'↑'],[-1,0,'←'],[0,1,'↓'],[1,0,'→']].map(([dx,dy,label]) => control(label, () => { if (state === 'play' && !g.preview) { walking++; doStep(dx,dy); } }, label)));
  const el = h('div', { class: 'dd' }, top, prev, stage, combat, h('div', { class: 'dd-controls' }, attackBtn, guardBtn, waitBtn, scoutBtn), pad);
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
    // A few persistent visual landmarks aid spatial memory without revealing unknown terrain.
    for(const q of L.landmarks||[])if(previewing||L.seen[q.y*W+q.x]){
      const x=(q.x+.5)*tile,y=(q.y+.5)*tile;
      c2.strokeStyle=['#d7b87c','#7fa7bc','#9fba83'][q.kind];c2.lineWidth=1.5;
      c2.beginPath();c2.arc(x,y,tile*.23,0,Math.PI*2);c2.stroke();
      c2.beginPath();c2.moveTo(x-tile*.14,y);c2.lineTo(x+tile*.14,y);c2.moveTo(x,y-tile*.14);c2.lineTo(x,y+tile*.14);c2.stroke();
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
        const ex=(e.x+.5)*tile, ey=e.y*tile;
        c2.fillStyle='#1c1c29'; c2.fillRect(ex-tile*.3,ey+2,tile*.6,4);
        c2.fillStyle=e.intent ? '#ef876f' : '#b7c99c'; c2.fillRect(ex-tile*.3,ey+2,tile*.6*e.hp/(e.kind==='brute'?3:2),4);
        if(e.intent) {
          c2.strokeStyle='#ffbd8c'; c2.lineWidth=2; c2.strokeRect(e.intent.x*tile+3,e.intent.y*tile+3,tile-6,tile-6);
          c2.fillStyle='#ffe0aa'; c2.font=`bold ${tile*.55}px sans-serif`; c2.textAlign='center'; c2.fillText('!',ex,ey+tile*.75);
        }
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
    hearts.setAttribute('aria-label', `${g.hp} of ${g.maxHp} health`);
    const enemies = core.visibleEnemies(g);
    const danger = enemies.some(e => e.intent);
    combat.textContent = g.preview ? 'Study the landmarks. Your torch will remember explored ground.' : danger ? 'Attack incoming • defend or step out of the marked tile' : g.riposte ? 'Counter ready • your next attack deals 2 damage' : enemies.length ? 'Tap an adjacent enemy to attack • arrows move • G defends' : `Floor ${g.floor} / ${core.MAX_FLOOR} • find the amber stairs`;
    combat.classList.toggle('danger', danger);
    scoutBtn.disabled = g.preview || !g.scouts;
    attackBtn.disabled = g.preview || !enemies.some(e => Math.abs(e.x-g.pos.x)+Math.abs(e.y-g.pos.y)===1);
    guardBtn.disabled = g.preview;
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
      } else if (e.type === 'windup') { say('Enemy preparing to strike. Defend or sidestep.'); stop = true; }
      else if (e.type === 'block') { say('Blocked! Your next attack is a counter.'); ctx.audio.good(); stop = true; }
      else if (e.type === 'dodge') { say('Attack missed. Your opening!'); stop = true; }
      else if (e.type === 'strike') stop = true;
    }
    g.events.length = 0;
    return stop;
  }

  function afterChange() {
    paintHud();
    if (!g.over) save();
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
    state = 'play'; ctx.playing(true);
    previewLeft = core.previewSeconds(g.floor);
    const total = previewLeft;
    prev.classList.remove('hidden');
    bar.style.setProperty('width', '100%');
    let lastPreview = performance.now();
    pulseTimer = 0;
    previewTimer = setInterval(() => {
      const now = performance.now();
      const elapsed = Math.min(.25, (now - lastPreview) / 1000); lastPreview = now;
      if (state !== 'play') return;
      if (!ctx.practice) previewLeft -= elapsed;
      const left = previewLeft;
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
    paintHud(); save();
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
    if (e.repeat) return;
    if (k === 'g') { e.preventDefault(); guardBtn.click(); }
    else if (k === 'f') { e.preventDefault(); attackBtn.click(); }
    else if (k === ' ') {
      e.preventDefault();
      doWait();
    } else if (map[k]) {
      e.preventDefault();
      walking++;
      doStep(...map[k]);
    }
  }
  document.addEventListener('keydown', onKey);

  function openCombatLesson(){
    const t=core.createGame(1);t.preview=false;t.level.tiles=new Uint8Array(W*H).fill(1);t.level.traps=[];t.level.gems=[];t.level.hearts=[];t.pos={x:5,y:7};t.level.enemies=[{id:1,x:6,y:7,kind:'brute',hp:3,cooldown:0,rest:false,intent:null}];
    core.wait(t);
    const picture=h('canvas',{'aria-label':'Combat practice arena',width:240,height:100,class:'combat-practice'}),text=h('p',{class:'fine',role:'status','aria-live':'polite'}),actions=h('div',{class:'combat-practice-actions'});
    function paint(){
      const pen=picture.getContext('2d');pen.fillStyle='#13262f';pen.fillRect(0,0,240,100);
      pen.drawImage(art.get('hero',72),45,18,72,72);if(t.level.enemies.length)pen.drawImage(art.get('brute',80),135,14,80,80);
      const e=t.level.enemies[0];
      text.textContent=!e?'You did it. Defend the marked attack, then counter for 2 damage.':t.over?'Try the lesson again.':t.riposte?'Blocked. Now attack: your counter deals 2 damage.':e.intent?'The brute is winding up. Defend now or sidestep.':`Your health ${t.hp}/${t.maxHp}. Brute health ${e.hp}/3. Attack while it recovers.`;
      actions.replaceChildren(...[['Defend',()=>core.defend(t)],['Attack',()=>core.attack(t,1)],['Sidestep',()=>core.move(t,0,-1)]].map(([label,fn])=>h('button',{class:'btn',type:'button',disabled:t.over||!e?true:null,onclick:()=>{fn();t.events=[];paint();}},label)));
    }
    paint();overlay(el,{title:'Learn the counterattack',body:h('div',{class:'howto'},h('p',null,'A safe practice encounter. These buttons use the same combat rules as your expedition.'),picture,text,actions),buttons:[{label:'Try again',onclick:openCombatLesson},{label:'Back to expedition',kind:'primary'}]});
  }
  // ----- flow -----
  function start() {
    state = 'play'; ctx.playing(true);
    paintHud();
    if (g.preview) startPreview();
    draw(); save();
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
    state = 'over'; ctx.playing(false);
    walking++;
    clearInterval(previewTimer);
    ctx.store.clearGame('dungeon');
    const win = g.reason === 'escaped';
    ctx.finish({
      score: core.scoreOf(g),
      level: g.floor,
      completed: win || g.floor >= 3,
      extra: [win ? 'You escaped the depths' : `You fell on floor ${g.floor}`, `Gems: ${g.gems}`, `Monsters beaten: ${g.kills}`, `Attacks blocked: ${g.blocks}`, `Traps triggered: ${g.trapsHit}`, 'Next run: defend the marked attack, then counter for double damage', `Floors without a scratch: ${g.perfectFloors}`],
    });
  }

  function openPause() {
    if (state !== 'play' || pauseOv) return;
    state = 'paused'; ctx.playing(false);
    save();
    walking++;
    pauseOv = overlay(el, {
      title: 'Paused',
      body: h('div',null,h('p', null, 'The torch is waiting.'),h('button',{class:'btn',type:'button',onclick:openCombatLesson},'Practice combat')),
      buttons: [
        { label: 'Save & leave', onclick: () => { save(); ctx.exit(); } },
        {
          label: 'Resume',
          kind: 'primary',
          onclick: () => {
            pauseOv = null;
            state = 'play'; ctx.playing(true);
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
      h('p', null, 'Find the stairs on every floor. Study the chambers, colored landmarks, and spikes. Your torch remembers explored ground.'),
      h('button',{class:'btn',type:'button',onclick:openCombatLesson},'Learn combat by playing'),
      h('ul', null, h('li', null, 'Tap a spot you have explored to walk there.'), h('li', null, 'Tap an adjacent monster or press Attack. Amber marks show its next attack. Defend to block it and charge a double-damage counter, or step out of the marked tile.'), h('li', null, 'Spikes you forgot cost a heart. Hearts and gems are scattered around.')),
    ),
    buttons: [{ label: saved ? 'Continue expedition' : 'Enter the dungeon', kind: 'primary', onclick: start }],
  });

  return {
    destroy() {
      if (state !== 'ready' && state !== 'over') save();
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
